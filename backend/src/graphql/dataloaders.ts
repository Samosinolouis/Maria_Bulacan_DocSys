/**
 * DataLoader Factory (N+1 prevention)
 *
 * Created per-request and stored in the GraphQL context. Batches lookups so a
 * list of N parents resolves its relation in ONE query instead of N.
 */

import DataLoader from "dataloader";

import type { IUserService } from "../interfaces/user.service.interface.js";
import type { IRequestService } from "../interfaces/request.service.interface.js";
import type { IDocumentService } from "../interfaces/document.service.interface.js";
import type {
  IEventService,
  IVenueService,
  EventAttendeeView,
} from "../interfaces/event.service.interface.js";
import type { UserRecord } from "../interfaces/user.repository.interface.js";
import type { RequestRecord } from "../interfaces/request.repository.interface.js";
import type { DocumentRecord } from "../interfaces/document.repository.interface.js";
import type { EventRecord, ActivityLogRecord } from "../interfaces/event.repository.interface.js";

export interface DataLoaders {
  userById: DataLoader<string, UserRecord | null>;
  requestById: DataLoader<string, RequestRecord | null>;
  documentById: DataLoader<string, DocumentRecord | null>;
  eventById: DataLoader<string, EventRecord | null>;
  eventAttendeesByEvent: DataLoader<string, EventAttendeeView[]>;
  eventActivityLogsByEvent: DataLoader<string, ActivityLogRecord[]>;
  /** Live CONFIRMED-and-not-ended booking count per venue (FR-42). */
  venueActiveBookings: DataLoader<string, number>;
}

export interface DataLoaderServices {
  user: IUserService;
  request: IRequestService;
  document: IDocumentService;
  event: IEventService;
  venue: IVenueService;
}

/** Group rows by their event id, preserving input order per key. */
function groupByEventId<T extends { eventId: string }>(
  ids: readonly string[],
  rows: T[],
): T[][] {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.eventId);
    if (bucket) bucket.push(row);
    else grouped.set(row.eventId, [row]);
  }
  return ids.map((id) => grouped.get(id) ?? []);
}

export function createDataLoaders(services: DataLoaderServices): DataLoaders {
  return {
    userById: new DataLoader(async (ids: readonly string[]) => {
      const rows = await services.user.getByIds([...ids]);
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),

    requestById: new DataLoader(async (ids: readonly string[]) => {
      const rows = await Promise.all(ids.map((id) => services.request.getById(id)));
      return rows;
    }),

    documentById: new DataLoader(async (ids: readonly string[]) => {
      const rows = await Promise.all(ids.map((id) => services.document.getById(id)));
      return rows;
    }),

    eventById: new DataLoader(async (ids: readonly string[]) => {
      const rows = await services.event.getByIds([...ids]);
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),

    eventAttendeesByEvent: new DataLoader(async (ids: readonly string[]) =>
      groupByEventId(ids, await services.event.listAttendees([...ids])),
    ),

    eventActivityLogsByEvent: new DataLoader(async (ids: readonly string[]) =>
      groupByEventId(ids, await services.event.listActivityLogs([...ids])),
    ),

    venueActiveBookings: new DataLoader(async (ids: readonly string[]) => {
      const rows = await services.venue.countActiveBookings([...ids]);
      const byId = new Map(rows.map((row) => [row.venueId, row.count]));
      return ids.map((id) => byId.get(id) ?? 0);
    }),
  };
}
