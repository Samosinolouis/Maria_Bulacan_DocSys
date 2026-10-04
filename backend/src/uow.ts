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
  readonly venues: VenueRepository;
  readonly events: EventRepository;
  readonly eventAttendees: EventAttendeeRepository;
  readonly activityLogs: ActivityLogRepository;

  constructor(tx: unknown) {
    const executor = tx as Database;
    this.users = new UserRepository(executor);
    this.roles = new RoleRepository(executor);
    this.notifications = new NotificationRepository(executor);
    this.requests = new RequestRepository(executor);
    this.requestTypes = new RequestTypeRepository(executor);
    this.holidays = new HolidayRepository(executor);
    this.controlNumbers = new ControlNumberRepository(executor);
    this.documents = new DocumentRepository(executor);
    this.documentTypes = new DocumentTypeRepository(executor);
    this.transmissions = new TransmissionRepository(executor);
    this.documentLogs = new DocumentLogRepository(executor);
    this.requestAttachments = new RequestAttachmentRepository(executor);
    this.documentAttachments = new DocumentAttachmentRepository(executor);
    this.venues = new VenueRepository(executor);
    this.events = new EventRepository(executor);
    this.eventAttendees = new EventAttendeeRepository(executor);
    this.activityLogs = new ActivityLogRepository(executor);
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
