/**
 * Event Service
 *
 * Implements IEventService - the centralized scheduling module (FR-41..46):
 *
 * - FR-41  create / edit / cancel across the municipal venues; a special-use
 *          venue (Mayor's Conference Room, Administrator's Office) additionally
 *          requires the EventService:BookSpecialVenue grant
 * - FR-42  venue, attendee, Mayor and Administrator double-booking prevention.
 *          CANCELLED events never block a slot. A CONFIRMED booking that
 *          overlaps is rejected; the officer can re-log it as TENTATIVE, which
 *          keeps the slot but records the conflict in the activity trail.
 * - FR-43  attendee tagging plus the Mayor / Administrator involvement flags
 * - FR-44  schedule reads (desk list + "my schedule")
 * - FR-46  exactly one immutable activity_logs entry per create / update /
 *          cancel, written inside the same transaction as the state change
 *
 * [SOLID:SRP] Business rules only - no DB driver or HTTP concerns.
 * [SOLID:DIP] Depends on IDatabase / IRepositories abstractions.
 */

import { and, asc, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";

import { events } from "../../db/schema/index.js";
import {
  BookingConflictError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from "../../errors/index.js";
import type { IDatabase, IRepositories } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type { INotificationService } from "../../interfaces/notification.service.interface.js";
import type {
  IEventService,
  CreateEventInput,
  UpdateEventInput,
  EventFilter,
  EventSortField,
  BookingConflict,
  EventAttendeeView,
} from "../../interfaces/event.service.interface.js";
import type {
  Connection,
  ConnectionArgs,
  SortDirection,
} from "../../interfaces/common.interface.js";
import type {
  EventRecord,
  OverlapWindow,
  ActivityLogRecord,
} from "../../interfaces/event.repository.interface.js";
import { ilikePattern, resolveWindow, toConnection } from "../shared/query.js";
import { assertPermission } from "../shared/authz.js";
import { dedupeIds, loadActorSnapshot, notifySafely } from "../shared/workflow.js";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
/** HH:MM or HH:MM:SS, 24-hour. */
const TIME_ONLY = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** Pad `HH:MM` to the `HH:MM:SS` the `time` column stores. */
function normalizeTime(value: string): string {
  const trimmed = value.trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

/** A validated, normalized booking slot. */
interface NormalizedSlot {
  venueId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
}

/** The slot plus the party flags a conflict pass needs. */
interface ConflictProbe extends NormalizedSlot {
  involvesMayor: boolean;
  involvesAdministrator: boolean;
}

export class EventService implements IEventService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
    private readonly notifications: INotificationService,
  ) {}

  // ------------------------------------------------------------------
  // Reads (FR-44)
  // ------------------------------------------------------------------

  async getById(id: string): Promise<EventRecord | null> {
    return this.db.query((uow) => uow.events.findById(id));
  }

  async getByIds(ids: string[]): Promise<EventRecord[]> {
    if (ids.length === 0) return [];
    return this.db.query((uow) => uow.events.findByIds(ids));
  }

  async list(
    args: ConnectionArgs<EventFilter, EventSortField>,
  ): Promise<Connection<EventRecord>> {
    const { first, offset } = resolveWindow(args);
    const where = and(this.buildFilterWhere(args.filter), this.buildSearchWhere(args.search));

    return this.db.query(async (uow) => {
      const [rows, totalCount] = await Promise.all([
        uow.events.findMany({
          limit: first + 1,
          offset,
          where,
          orderBy: this.orderBy(args.sort),
        }),
        uow.events.count({ where }),
      ]);
      return toConnection({ rows, first, offset, totalCount });
    });
  }

  /** Events the user must attend, optionally narrowed to one calendar day. */
  async listForUser(userId: string, date?: string | null): Promise<EventRecord[]> {
    return this.db.query(async (uow) => {
      const eventIds = await uow.eventAttendees.findEventsForUser(userId);
      if (eventIds.length === 0) return [];

      const rows = await uow.events.findByIds(eventIds);
      return rows
        .filter((row) => row.status !== "CANCELLED")
        .filter((row) => (date ? row.eventDate === date : true))
        .sort((a, b) =>
          `${a.eventDate}${a.startTime}`.localeCompare(`${b.eventDate}${b.startTime}`),
        );
    });
  }

  // ------------------------------------------------------------------
  // Relation reads (FR-43, FR-46) - batched so a list resolves in two queries
  // ------------------------------------------------------------------

  /** Required attendees with display names, for one or more events. */
  async listAttendees(eventIds: string[]): Promise<EventAttendeeView[]> {
    if (eventIds.length === 0) return [];

    return this.db.query(async (uow) => {
      const rows = await uow.eventAttendees.findByEvents(eventIds);
      if (rows.length === 0) return [];

      const users = await uow.users.findByIds([...new Set(rows.map((row) => row.userId))]);
      const names = new Map(
        users.map((user) => [
          user.id,
          [user.firstName, user.lastName].filter(Boolean).join(" "),
        ]),
      );

      return rows.map((row) => ({
        eventId: row.eventId,
        userId: row.userId,
        name: names.get(row.userId) ?? "Unknown user",
      }));
    });
  }

  /** Immutable activity trail for one or more events, oldest first. */
  async listActivityLogs(eventIds: string[]): Promise<ActivityLogRecord[]> {
    if (eventIds.length === 0) return [];
    return this.db.query((uow) => uow.activityLogs.findByEvents(eventIds));
  }

  // ------------------------------------------------------------------
  // Conflict detection (FR-42)
  // ------------------------------------------------------------------

  async checkConflicts(input: CreateEventInput): Promise<BookingConflict[]> {
    const slot = this.normalizeSlot(input);
    const attendeeIds = dedupeIds(input.attendeeIds ?? []);

    return this.db.query((uow) =>
      this.detectConflicts(
        uow,
        {
          ...slot,
          involvesMayor: input.involvesMayor === true,
          involvesAdministrator: input.involvesAdministrator === true,
        },
        attendeeIds,
        null,
      ),
    );
  }

  // ------------------------------------------------------------------
  // Writes (FR-41..43, 46)
  // ------------------------------------------------------------------

  async create(actorId: string, input: CreateEventInput): Promise<EventRecord> {
    const title = input.title?.trim();
    const department = input.department?.trim();
    if (!title) throw new ValidationError("A meeting or event title is required.");
    if (!department) throw new ValidationError("The organizing department is required.");

    const slot = this.normalizeSlot(input);
    const attendeeIds = dedupeIds(input.attendeeIds ?? []);
    const involvesMayor = input.involvesMayor === true;
    const involvesAdministrator = input.involvesAdministrator === true;
    const status = input.status ?? "CONFIRMED";
    const started = Date.now();

    const { event, conflictCount } = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "EventService:Create");

      const venue = await uow.venues.findById(slot.venueId);
      if (!venue) throw new NotFoundError("Venue", slot.venueId);
      if (!venue.isActive) {
        throw new InvalidStateError(`Venue '${venue.name}' is retired and cannot be booked.`);
      }
      if (venue.specialUse) {
        await assertPermission(uow, actorId, "EventService:BookSpecialVenue");
      }

      await this.assertAttendeesExist(uow, attendeeIds);

      const conflicts = await this.detectConflicts(
        uow,
        { ...slot, involvesMayor, involvesAdministrator },
        attendeeIds,
        null,
      );
      this.assertSlotFree(conflicts, status);

      const actor = await loadActorSnapshot(uow, actorId);
      const created = await uow.events.create({
        ...slot,
        title,
        organizerId: input.organizerId ?? null,
        department,
        status,
        involvesMayor,
        involvesAdministrator,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        createdBy: actorId,
      });

      for (const userId of attendeeIds) {
        await uow.eventAttendees.add(created.id, userId);
      }

      await uow.activityLogs.append({
        eventId: created.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "EVENT_CREATED",
        template:
          "Scheduled ${payload.title} at ${payload.venue} on ${payload.event_date}, ${payload.start_time}-${payload.end_time}.",
        payload: {
          title: created.title,
          venue: venue.name,
          event_date: created.eventDate,
          start_time: created.startTime,
          end_time: created.endTime,
          status: created.status,
          attendee_count: attendeeIds.length,
          conflicts: conflicts.map((conflict) => conflict.kind),
        },
      });

      return { event: created, conflictCount: conflicts.length };
    });

    this.telemetry.trackEvent("booking.event.created", {
      eventId: event.id,
      venueId: event.venueId,
      status: event.status,
      attendees: attendeeIds.length,
      conflicts: conflictCount,
      durationMs: Date.now() - started,
    });

    await this.notifyAttendees(attendeeIds, {
      type: "EVENT_UPDATED",
      title: `Scheduled: ${event.title} on ${event.eventDate}`,
      template:
        "You are required at ${payload.title} on ${payload.event_date}, ${payload.start_time}-${payload.end_time} (${payload.venue}).",
      event,
    });

    return event;
  }

  async update(actorId: string, input: UpdateEventInput): Promise<EventRecord> {
    const started = Date.now();

    const { event, attendeeIds, statusChanged } = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "EventService:Update");

      const current = await uow.events.findById(input.eventId);
      if (!current) throw new NotFoundError("Event", input.eventId);
      if (current.status === "CANCELLED") {
        throw new InvalidStateError("Cancelled events cannot be edited.");
      }

      const slot = this.normalizeSlot({
        venueId: input.venueId ?? current.venueId,
        eventDate: input.eventDate ?? current.eventDate,
        startTime: input.startTime ?? current.startTime,
        endTime: input.endTime ?? current.endTime,
      });
      const involvesMayor = input.involvesMayor ?? current.involvesMayor;
      const involvesAdministrator = input.involvesAdministrator ?? current.involvesAdministrator;
      const status = input.status ?? current.status;

      const title = input.title === undefined ? current.title : input.title?.trim();
      if (!title) throw new ValidationError("A meeting or event title is required.");
      const department =
        input.department === undefined ? current.department : input.department?.trim();
      if (!department) throw new ValidationError("The organizing department is required.");

      const venue = await uow.venues.findById(slot.venueId);
      if (!venue) throw new NotFoundError("Venue", slot.venueId);
      if (!venue.isActive) {
        throw new InvalidStateError(`Venue '${venue.name}' is retired and cannot be booked.`);
      }
      if (venue.specialUse) {
        await assertPermission(uow, actorId, "EventService:BookSpecialVenue");
      }

      const nextAttendees = input.attendeeIds == null ? null : dedupeIds(input.attendeeIds);
      if (nextAttendees) await this.assertAttendeesExist(uow, nextAttendees);

      const effectiveAttendees =
        nextAttendees ??
        (await uow.eventAttendees.findByEvent(current.id)).map((row) => row.userId);

      const conflicts = await this.detectConflicts(
        uow,
        { ...slot, involvesMayor, involvesAdministrator },
        effectiveAttendees,
        current.id,
      );
      this.assertSlotFree(conflicts, status);

      const actor = await loadActorSnapshot(uow, actorId);
      const updated = await uow.events.update(current.id, {
        ...slot,
        title,
        organizerId: input.organizerId === undefined ? undefined : input.organizerId,
        department,
        status,
        involvesMayor,
        involvesAdministrator,
        notes:
          input.notes === undefined
            ? undefined
            : input.notes?.trim()
              ? input.notes.trim()
              : null,
      });

      if (nextAttendees) {
        for (const row of await uow.eventAttendees.findByEvent(current.id)) {
          await uow.eventAttendees.remove(current.id, row.userId);
        }
        for (const userId of nextAttendees) {
          await uow.eventAttendees.add(current.id, userId);
        }
      }

      await uow.activityLogs.append({
        eventId: updated.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "EVENT_UPDATED",
        template: "Updated ${payload.title} at ${payload.venue} on ${payload.event_date}.",
        payload: {
          title: updated.title,
          venue: venue.name,
          event_date: updated.eventDate,
          start_time: updated.startTime,
          end_time: updated.endTime,
          status: updated.status,
          conflicts: conflicts.map((conflict) => conflict.kind),
        },
      });

      return {
        event: updated,
        attendeeIds: effectiveAttendees,
        statusChanged: current.status !== updated.status,
      };
    });

    this.telemetry.trackEvent("booking.event.updated", {
      eventId: event.id,
      statusChanged,
      durationMs: Date.now() - started,
    });

    await this.notifyAttendees(attendeeIds, {
      type: "EVENT_UPDATED",
      title: `Updated: ${event.title} on ${event.eventDate}`,
      template:
        "${payload.title} has been rescheduled to ${payload.event_date}, ${payload.start_time}-${payload.end_time} (${payload.venue}).",
      event,
    });

    return event;
  }

  async cancel(actorId: string, eventId: string, reason?: string | null): Promise<EventRecord> {
    const { event, attendeeIds } = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "EventService:Cancel");

      const current = await uow.events.findById(eventId);
      if (!current) throw new NotFoundError("Event", eventId);
      if (current.status === "CANCELLED") {
        throw new InvalidStateError("This event is already cancelled.");
      }

      const venue = await uow.venues.findById(current.venueId);
      const actor = await loadActorSnapshot(uow, actorId);
      const cancelled = await uow.events.update(eventId, { status: "CANCELLED" });

      await uow.activityLogs.append({
        eventId: cancelled.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "EVENT_CANCELLED",
        template: "Cancelled ${payload.title} at ${payload.venue} on ${payload.event_date}.",
        payload: {
          title: cancelled.title,
          venue: venue?.name ?? null,
          event_date: cancelled.eventDate,
          start_time: cancelled.startTime,
          end_time: cancelled.endTime,
          reason: reason?.trim() ? reason.trim() : null,
        },
      });

      const attendees = await uow.eventAttendees.findByEvent(cancelled.id);
      return { event: cancelled, attendeeIds: attendees.map((row) => row.userId) };
    });

    this.telemetry.trackEvent("booking.event.cancelled", { eventId: event.id });

    await this.notifyAttendees(attendeeIds, {
      type: "EVENT_CANCELLED",
      title: `Cancelled: ${event.title} on ${event.eventDate}`,
      template: "${payload.title} on ${payload.event_date} has been cancelled.",
      event,
    });

    return event;
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Validate + normalize a proposed slot. */
  private normalizeSlot(input: {
    venueId: string;
    eventDate: string;
    startTime: string;
    endTime: string;
  }): NormalizedSlot {
    const venueId = input.venueId?.trim();
    const eventDate = input.eventDate?.trim();
    const startTime = normalizeTime(input.startTime ?? "");
    const endTime = normalizeTime(input.endTime ?? "");

    if (!venueId) throw new ValidationError("A municipal venue is required.");
    if (!eventDate || !DATE_ONLY.test(eventDate)) {
      throw new ValidationError("eventDate must be a YYYY-MM-DD date.");
    }
    if (!TIME_ONLY.test(startTime) || !TIME_ONLY.test(endTime)) {
      throw new ValidationError("startTime and endTime must be HH:MM (24-hour).");
    }
    if (startTime >= endTime) {
      throw new ValidationError("The end time must be later than the start time.");
    }

    return { venueId, eventDate, startTime, endTime };
  }

  /** Every non-cancelled event a proposed booking would collide with. */
  private async detectConflicts(
    uow: IRepositories,
    probe: ConflictProbe,
    attendeeIds: string[],
    excludeEventId: string | null,
  ): Promise<BookingConflict[]> {
    const window: OverlapWindow = {
      venueId: probe.venueId,
      eventDate: probe.eventDate,
      startTime: probe.startTime,
      endTime: probe.endTime,
      excludeEventId,
    };
    const conflicts: BookingConflict[] = [];

    const venueClashes = await uow.events.findVenueConflicts(window);
    if (venueClashes.length > 0) {
      conflicts.push({
        kind: "VENUE",
        message: `The venue is already booked at that time: ${venueClashes
          .map((row) => `${row.title} (${row.startTime}-${row.endTime})`)
          .join("; ")}.`,
        conflictingEventIds: venueClashes.map((row) => row.id),
      });
    }

    if (attendeeIds.length > 0) {
      const attendeeClashes = await uow.eventAttendees.findConflictingAttendees(
        attendeeIds,
        window,
      );
      if (attendeeClashes.length > 0) {
        const userIds = [...new Set(attendeeClashes.map((row) => row.userId))];
        const users = await uow.users.findByIds(userIds);
        const names = users.map((user) =>
          [user.firstName, user.lastName].filter(Boolean).join(" "),
        );
        conflicts.push({
          kind: "ATTENDEE",
          message: `${names.join(", ")} already ${
            names.length === 1 ? "has" : "have"
          } a booking at that time.`,
          conflictingEventIds: [...new Set(attendeeClashes.map((row) => row.eventId))],
        });
      }
    }

    if (probe.involvesMayor) {
      const mayorClashes = await uow.events.findFlagConflicts("involvesMayor", window);
      if (mayorClashes.length > 0) {
        conflicts.push({
          kind: "MAYOR",
          message: `The Municipal Mayor is already committed to ${mayorClashes
            .map((row) => `${row.title} (${row.startTime}-${row.endTime})`)
            .join("; ")}.`,
          conflictingEventIds: mayorClashes.map((row) => row.id),
        });
      }
    }

    if (probe.involvesAdministrator) {
      const adminClashes = await uow.events.findFlagConflicts("involvesAdministrator", window);
      if (adminClashes.length > 0) {
        conflicts.push({
          kind: "ADMINISTRATOR",
          message: `The Municipal Administrator is already committed to ${adminClashes
            .map((row) => `${row.title} (${row.startTime}-${row.endTime})`)
            .join("; ")}.`,
          conflictingEventIds: adminClashes.map((row) => row.id),
        });
      }
    }

    return conflicts;
  }

  /**
   * A CONFIRMED booking must be free. TENTATIVE is the deliberate escape hatch:
   * the officer acknowledged the clash and the conflict is recorded on the
   * activity entry (FR-42).
   */
  private assertSlotFree(conflicts: BookingConflict[], status: string): void {
    if (conflicts.length === 0 || status === "TENTATIVE") return;
    throw new BookingConflictError(
      `Scheduling conflict: ${conflicts.map((conflict) => conflict.message).join(" ")} ` +
        "Log the booking as TENTATIVE to keep it pending resolution.",
      { conflicts: conflicts.map((conflict) => conflict.kind) },
    );
  }

  /** Required attendees must be real users - in-app reminders are the only channel. */
  private async assertAttendeesExist(uow: IRepositories, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const found = await uow.users.findByIds(ids);
    const known = new Set(found.map((user) => user.id));
    const missing = ids.filter((id) => !known.has(id));
    if (missing.length > 0) {
      throw new NotFoundError("User", missing[0]);
    }
  }

  /** Fan out a schedule notification; a delivery failure never fails the write. */
  private async notifyAttendees(
    userIds: string[],
    input: {
      type: "EVENT_UPDATED" | "EVENT_CANCELLED";
      title: string;
      template: string;
      event: EventRecord;
    },
  ): Promise<void> {
    if (userIds.length === 0) return;
    await notifySafely(this.telemetry, this.notifications, {
      userIds,
      type: input.type,
      title: input.title,
      template: input.template,
      payload: {
        event_id: input.event.id,
        title: input.event.title,
        event_date: input.event.eventDate,
        start_time: input.event.startTime,
        end_time: input.event.endTime,
        venue: input.event.venueId,
      },
      eventId: input.event.id,
    });
  }

  private buildFilterWhere(filter?: EventFilter | null): SQL | undefined {
    if (!filter) return undefined;
    const conditions: SQL[] = [];
    if (filter.venueId) conditions.push(eq(events.venueId, filter.venueId));
    if (filter.status) conditions.push(eq(events.status, filter.status));
    if (filter.department) conditions.push(eq(events.department, filter.department));
    if (filter.involvesMayor != null) {
      conditions.push(eq(events.involvesMayor, filter.involvesMayor));
    }
    if (filter.involvesAdministrator != null) {
      conditions.push(eq(events.involvesAdministrator, filter.involvesAdministrator));
    }
    if (filter.dateFrom) conditions.push(gte(events.eventDate, filter.dateFrom));
    if (filter.dateTo) conditions.push(lte(events.eventDate, filter.dateTo));
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private buildSearchWhere(search?: string | null): SQL | undefined {
    const term = search?.trim();
    if (!term) return undefined;
    const pattern = ilikePattern(term);
    return or(ilike(events.title, pattern), ilike(events.department, pattern));
  }

  private orderBy(sort?: { field: EventSortField; direction?: SortDirection } | null): SQL[] {
    const field = sort?.field ?? "EVENT_DATE";
    const direction = sort?.direction === "DESC" ? desc : asc;
    const column = {
      EVENT_DATE: events.eventDate,
      START_TIME: events.startTime,
      TITLE: events.title,
      CREATED_AT: events.createdAt,
    }[field];
    // Secondary key keeps same-day listings stable.
    return field === "START_TIME"
      ? [direction(column)]
      : [direction(column), asc(events.startTime)];
  }
}
