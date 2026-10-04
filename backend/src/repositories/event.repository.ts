/**
 * [C] Booking Module — Repository Implementations
 *
 * Concrete data-access for venues, events, event_attendees, activity_logs.
 * Conflict-detection queries exclude CANCELLED events (FR-42).
 */

import { eq, inArray, and, ne, sql } from "drizzle-orm";

import type { Database } from "../db/index.js";
import { venues, events, eventAttendees, activityLogs } from "../db/schema/index.js";
import { NotFoundError } from "../errors/index.js";
import type {
  IVenueRepository,
  IEventRepository,
  IEventAttendeeRepository,
  IActivityLogRepository,
  CreateEventData,
  UpdateEventData,
  OverlapWindow,
  CreateActivityLogData,
  VenueRecord,
  EventRecord,
  EventAttendeeRecord,
  ActivityLogRecord,
} from "../interfaces/event.repository.interface.js";
import type { ListOptions } from "../interfaces/common.interface.js";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** SQL predicate: an event overlaps the proposed [start, end) window. */
function overlapsWindow(window: OverlapWindow) {
  return sql`${events.eventDate} = ${window.eventDate}
    AND ${events.startTime} < ${window.endTime}::time
    AND ${events.endTime} > ${window.startTime}::time`;
}

export class VenueRepository implements IVenueRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<VenueRecord | null> {
    const [row] = await this.tx.select().from(venues).where(eq(venues.id, id)).limit(1);
    return row ?? null;
  }

  async findByCode(code: string): Promise<VenueRecord | null> {
    const [row] = await this.tx.select().from(venues).where(eq(venues.code, code)).limit(1);
    return row ?? null;
  }

  async findMany(options: ListOptions): Promise<VenueRecord[]> {
    let query = this.tx.select().from(venues).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }
}

export class EventRepository implements IEventRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<EventRecord | null> {
    const [row] = await this.tx.select().from(events).where(eq(events.id, id)).limit(1);
    return row ?? null;
  }

  async findByIds(ids: string[]): Promise<EventRecord[]> {
    if (ids.length === 0) return [];
    return this.tx.select().from(events).where(inArray(events.id, ids));
  }

  async findMany(options: ListOptions): Promise<EventRecord[]> {
    let query = this.tx.select().from(events).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async findInWindow(from: Date, to: Date): Promise<EventRecord[]> {
    return this.tx
      .select()
      .from(events)
      .where(
        and(
          sql`${events.eventDate} >= ${toDateOnly(from)}`,
          sql`${events.eventDate} <= ${toDateOnly(to)}`,
          ne(events.status, "CANCELLED"),
        ),
      );
  }

  async findVenueConflicts(window: OverlapWindow): Promise<EventRecord[]> {
    const conditions = [eq(events.venueId, window.venueId), overlapsWindow(window), ne(events.status, "CANCELLED")];
    if (window.excludeEventId) conditions.push(ne(events.id, window.excludeEventId));

    return this.tx.select().from(events).where(and(...conditions));
  }

  async create(data: CreateEventData): Promise<EventRecord> {
    const [row] = await this.tx
      .insert(events)
      .values({
        venueId: data.venueId,
        title: data.title,
        organizerId: data.organizerId ?? null,
        department: data.department,
        eventDate: data.eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status ?? "CONFIRMED",
        involvesMayor: data.involvesMayor ?? false,
        involvesAdministrator: data.involvesAdministrator ?? false,
        notes: data.notes ?? null,
        createdBy: data.createdBy,
      })
      .returning();
    return row;
  }

  async update(id: string, data: UpdateEventData): Promise<EventRecord> {
    const [row] = await this.tx
      .update(events)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    if (!row) throw new NotFoundError("Event", id);
    return row;
  }
}

export class EventAttendeeRepository implements IEventAttendeeRepository {
  constructor(private readonly tx: Database) {}

  async findByEvent(eventId: string): Promise<EventAttendeeRecord[]> {
    return this.tx
      .select()
      .from(eventAttendees)
      .where(eq(eventAttendees.eventId, eventId));
  }

  async findConflictingAttendees(
    userIds: string[],
    window: OverlapWindow,
  ): Promise<EventAttendeeRecord[]> {
    if (userIds.length === 0) return [];

    const conditions = [
      inArray(eventAttendees.userId, userIds),
      eq(events.eventDate, window.eventDate),
      ne(events.status, "CANCELLED"),
      sql`${events.startTime} < ${window.endTime}::time`,
      sql`${events.endTime} > ${window.startTime}::time`,
    ];
    if (window.excludeEventId) conditions.push(ne(eventAttendees.eventId, window.excludeEventId));

    return this.tx
      .select({
        id: eventAttendees.id,
        eventId: eventAttendees.eventId,
        userId: eventAttendees.userId,
      })
      .from(eventAttendees)
      .innerJoin(events, eq(eventAttendees.eventId, events.id))
      .where(and(...conditions));
  }

  async add(eventId: string, userId: string): Promise<EventAttendeeRecord> {
    const [row] = await this.tx
      .insert(eventAttendees)
      .values({ eventId, userId })
      .returning();
    return row;
  }

  async remove(eventId: string, userId: string): Promise<EventAttendeeRecord | null> {
    const [row] = await this.tx
      .delete(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)))
      .returning();
    return row ?? null;
  }

  async findEventsForUser(userId: string): Promise<string[]> {
    const rows = await this.tx
      .select({ eventId: eventAttendees.eventId })
      .from(eventAttendees)
      .where(eq(eventAttendees.userId, userId));
    return rows.map((r) => r.eventId);
  }
}

/** APPEND-ONLY audit repository — no update/delete methods by design [NFR-09]. */
export class ActivityLogRepository implements IActivityLogRepository {
  constructor(private readonly tx: Database) {}

  async findByEvent(eventId: string): Promise<ActivityLogRecord[]> {
    return this.tx
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.eventId, eventId));
  }

  async append(data: CreateActivityLogData): Promise<ActivityLogRecord> {
    const [row] = await this.tx
      .insert(activityLogs)
      .values({
        eventId: data.eventId,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        actionType: data.actionType,
        template: data.template,
        payload: data.payload,
      })
      .returning();
    return row;
  }
}
