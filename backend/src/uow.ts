/**
 * Unit of Work Implementation (Drizzle)
 *
 * Owns the transaction boundary and produces transaction-scoped repositories.
 *
 *   Service -> DrizzleDatabase.transaction(uow => ...) -> Repositories -> DB
 *
 * [SOLID:SRP] Transaction + repository-scope orchestration only.
 * [SOLID:DIP] Implements IDatabase / IRepositories abstractions.
 */

import db, { type Database } from "./db/index.js";
import type { IRepositories, IDatabase } from "./interfaces/uow.interface.js";
import { AsyncLocalStorage } from "node:async_hooks";

import {
  UserRepository,
  RoleRepository,
  NotificationRepository,
} from "./repositories/platform.repository.js";
import {
  RequestRepository,
  RequestTypeRepository,
  HolidayRepository,
  ControlNumberRepository,
} from "./repositories/request.repository.js";
import {
  DocumentRepository,
  DocumentTypeRepository,
  TransmissionRepository,
  DocumentLogRepository,
} from "./repositories/document.repository.js";
import { FolderRepository } from "./repositories/folder.repository.js";
import {
  RequestAttachmentRepository,
  DocumentAttachmentRepository,
} from "./repositories/attachment.repository.js";
import {
  VenueRepository,
  EventRepository,
  EventAttendeeRepository,
  ActivityLogRepository,
} from "./repositories/event.repository.js";

// ---------------------------------------------------------------------------
// Change tracking
// ---------------------------------------------------------------------------

/**
 * Per-mutation change tracker.
 *
 * Every repository write records `<EntityName>_<id>` into the collector the
 * mutation resolver opened; the resolver returns that list as
 * `changedEntities` so the client can invalidate exactly the queries that went
 * stale. Tracking lives here, in one place, instead of in every service.
 */
const changeStore = new AsyncLocalStorage<Set<string>>();

/** Run `fn` with a fresh collector (mutation resolvers call this). */
export function runWithChangeTracking<T>(fn: () => Promise<T>): Promise<T> {
  return changeStore.run(new Set<string>(), fn);
}

/** Entities recorded by the mutation currently in flight. */
export function getChangedEntities(): string[] {
  return [...(changeStore.getStore() ?? [])];
}

/**
 * Record one changed entity. Without a resolvable id the whole type is marked
 * (a bulk update cannot name rows), which invalidates every query of that type.
 */
export function recordChange(entityName: string, id: unknown): void {
  const store = changeStore.getStore();
  if (!store) return;
  store.add(typeof id === "string" && id.length > 0 ? `${entityName}_${id}` : entityName);
}

/** Where a write's primary id comes from, and which parents it implies. */
interface ChangeRule {
  entity: string;
  /** `result` (default) reads `result.id`; `arg0` reads the first argument. */
  idFrom?: "result" | "arg0";
  /** Nested rows also dirty their parent aggregate. */
  parents?: (result: Record<string, unknown>) => Array<[string, unknown]>;
}

/** Repository property -> write method -> the entities it changes. */
const CHANGE_RULES: Record<string, Record<string, ChangeRule>> = {
  users: {
    create: { entity: "User" },
    update: { entity: "User" },
    deactivate: { entity: "User" },
  },
  roles: {
    create: { entity: "Role" },
    update: { entity: "Role" },
    assign: { entity: "User", idFrom: "arg0" },
    unassign: { entity: "User", idFrom: "arg0" },
  },
  notifications: {
    create: { entity: "Notification" },
    markRead: { entity: "Notification" },
    // Bulk update: no row ids, so the whole Notification type is marked.
    markAllRead: { entity: "Notification" },
  },
  requests: { create: { entity: "Request" }, update: { entity: "Request" } },
  requestTypes: { create: { entity: "RequestType" } },
  holidays: { upsert: { entity: "Holiday" } },
  documents: {
    create: { entity: "Document" },
    update: { entity: "Document" },
    // Files a request's documents into a folder: the rows are updated by
    // request id, so the whole Document type is marked as changed.
    assignFolderByRequest: {
      entity: "Request",
      idFrom: "arg0",
      parents: () => [["Document", undefined]],
    },
  },
  documentTypes: { create: { entity: "DocumentType" } },
  transmissions: {
    create: {
      entity: "Transmission",
      parents: (row) => [["Document", row.documentId]],
    },
  },
  documentLogs: {
    append: {
      entity: "DocumentLog",
      parents: (row) => [
        ["Request", row.requestId],
        ["Document", row.documentId],
      ],
    },
  },
  requestAttachments: {
    create: {
      entity: "RequestAttachment",
      parents: (row) => [["Request", row.requestId]],
    },
  },
  documentAttachments: {
    create: {
      entity: "DocumentAttachment",
      parents: (row) => [["Document", row.documentId]],
    },
  },
  folders: { create: { entity: "Folder" } },
  venues: { create: { entity: "Venue" }, update: { entity: "Venue" } },
  events: { create: { entity: "Event" }, update: { entity: "Event" } },
  eventAttendees: {
    add: { entity: "Event", idFrom: "arg0" },
    remove: { entity: "Event", idFrom: "arg0" },
  },
  activityLogs: {
    append: {
      entity: "ActivityLog",
      parents: (row) => [["Event", row.eventId]],
    },
  },
};

/** Wrap a repository so its write methods record the entities they touch. */
function withChangeTracking<T extends object>(
  repository: T,
  rules: Record<string, ChangeRule>,
): T {
  return new Proxy(repository, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;
      const rule = typeof property === "string" ? rules[property] : undefined;
      if (!rule || typeof value !== "function") return value;

      return async (...args: unknown[]): Promise<unknown> => {
        const result = (await (value as (...a: unknown[]) => Promise<unknown>).apply(
          target,
          args,
        )) as Record<string, unknown> | null;

        recordChange(rule.entity, rule.idFrom === "arg0" ? args[0] : result?.id);
        for (const [entity, parentId] of rule.parents?.(result ?? {}) ?? []) {
          recordChange(entity, parentId);
        }
        return result;
      };
    },
  });
}

/** Apply the change rules for `name` to a freshly built repository. */
function trackRepository<T extends object>(name: string, repository: T): T {
  const rules = CHANGE_RULES[name];
  return rules ? withChangeTracking(repository, rules) : repository;
}

/** A repository container bound to a single DB executor (conn or tx). */
class DrizzleRepositories implements IRepositories {
  readonly users: UserRepository;
  readonly roles: RoleRepository;
  readonly notifications: NotificationRepository;
  readonly requests: RequestRepository;
  readonly requestTypes: RequestTypeRepository;
  readonly holidays: HolidayRepository;
  readonly controlNumbers: ControlNumberRepository;
  readonly documents: DocumentRepository;
  readonly documentTypes: DocumentTypeRepository;
  readonly transmissions: TransmissionRepository;
  readonly documentLogs: DocumentLogRepository;
  readonly requestAttachments: RequestAttachmentRepository;
  readonly documentAttachments: DocumentAttachmentRepository;
  readonly folders: FolderRepository;
  readonly venues: VenueRepository;
  readonly events: EventRepository;
  readonly eventAttendees: EventAttendeeRepository;
  readonly activityLogs: ActivityLogRepository;

  constructor(tx: unknown) {
    const executor = tx as Database;
    // Writes on the tracked repositories record `<EntityName>_<id>` for the
    // mutation's `changedEntities` payload (see CHANGE_RULES).
    this.users = trackRepository("users", new UserRepository(executor));
    this.roles = trackRepository("roles", new RoleRepository(executor));
    this.notifications = trackRepository("notifications", new NotificationRepository(executor));
    this.requests = trackRepository("requests", new RequestRepository(executor));
    this.requestTypes = trackRepository("requestTypes", new RequestTypeRepository(executor));
    this.holidays = trackRepository("holidays", new HolidayRepository(executor));
    this.controlNumbers = new ControlNumberRepository(executor);
    this.documents = trackRepository("documents", new DocumentRepository(executor));
    this.documentTypes = trackRepository("documentTypes", new DocumentTypeRepository(executor));
    this.transmissions = trackRepository("transmissions", new TransmissionRepository(executor));
    this.documentLogs = trackRepository("documentLogs", new DocumentLogRepository(executor));
    this.requestAttachments = trackRepository(
      "requestAttachments",
      new RequestAttachmentRepository(executor),
    );
    this.documentAttachments = trackRepository(
      "documentAttachments",
      new DocumentAttachmentRepository(executor),
    );
    this.folders = trackRepository("folders", new FolderRepository(executor));
    this.venues = trackRepository("venues", new VenueRepository(executor));
    this.events = trackRepository("events", new EventRepository(executor));
    this.eventAttendees = trackRepository("eventAttendees", new EventAttendeeRepository(executor));
    this.activityLogs = trackRepository("activityLogs", new ActivityLogRepository(executor));
  }
}

export class DrizzleDatabase implements IDatabase {
  async transaction<T>(fn: (uow: IRepositories) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => fn(new DrizzleRepositories(tx)));
  }

  async query<T>(fn: (uow: IRepositories) => Promise<T>): Promise<T> {
    return fn(new DrizzleRepositories(db));
  }
}

/** Singleton instance for the composition root. */
export const database = new DrizzleDatabase();

export type { Database };
