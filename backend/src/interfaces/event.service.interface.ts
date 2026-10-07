/**
 * Event & Venue Service Interfaces
 *
 * Business-logic abstraction for the booking module (FR-41..46):
 * create / edit / cancel with venue, attendee, and Mayor/Administrator
 * conflict detection; special-use venue permission enforcement.
 */

import type { EventRecord, VenueRecord, ActivityLogRecord, VenueActiveBookingCount } from "./event.repository.interface.js";
import type { Connection, ConnectionArgs } from "./common.interface.js";

export type EventStatus = EventRecord["status"];

export interface CreateEventInput {
  venueId: string;
  title: string;
  organizerId?: string | null;
  department: string;
  /** YYYY-MM-DD. */
  eventDate: string;
  /** HH:MM(:SS). */
  startTime: string;
  endTime: string;
  status?: EventStatus | null;
  involvesMayor?: boolean | null;
  involvesAdministrator?: boolean | null;
  notes?: string | null;
  /** Required-attendee user ids (must be system users). */
  attendeeIds?: string[] | null;
}

export interface UpdateEventInput {
  eventId: string;
  venueId?: string | null;
  title?: string | null;
  organizerId?: string | null;
  department?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: EventStatus | null;
  involvesMayor?: boolean | null;
  involvesAdministrator?: boolean | null;
  notes?: string | null;
  attendeeIds?: string[] | null;
}

export interface EventFilter {
  venueId?: string | null;
  status?: EventStatus | null;
  department?: string | null;
  involvesMayor?: boolean | null;
  involvesAdministrator?: boolean | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export type EventSortField = "EVENT_DATE" | "START_TIME" | "TITLE" | "CREATED_AT";

/** A detected scheduling conflict (FR-42). */
export interface BookingConflict {
  kind: "VENUE" | "ATTENDEE" | "MAYOR" | "ADMINISTRATOR";
  message: string;
  conflictingEventIds: string[];
}

/** A required attendee with their display name (FR-43). */
export interface EventAttendeeView {
  eventId: string;
  userId: string;
  name: string;
}

export interface IEventService {
  getById(id: string): Promise<EventRecord | null>;
  getByIds(ids: string[]): Promise<EventRecord[]>;
  list(args: ConnectionArgs<EventFilter, EventSortField>): Promise<Connection<EventRecord>>;

  /** "my schedule" - events the user must attend (FR-44). */
  listForUser(userId: string, date?: string | null): Promise<EventRecord[]>;

  /** Attendee rows (with display names) for a batch of events (FR-43). */
  listAttendees(eventIds: string[]): Promise<EventAttendeeView[]>;

  /** Immutable activity trail for a batch of events, oldest first (FR-46). */
  listActivityLogs(eventIds: string[]): Promise<ActivityLogRecord[]>;

  create(actorId: string, input: CreateEventInput): Promise<EventRecord>;
  update(actorId: string, input: UpdateEventInput): Promise<EventRecord>;
  cancel(actorId: string, eventId: string, reason?: string | null): Promise<EventRecord>;

  /** Dry-run conflict detection for a proposed slot (FR-42). */
  checkConflicts(input: CreateEventInput): Promise<BookingConflict[]>;
}

export interface IVenueService {
  getById(id: string): Promise<VenueRecord | null>;
  list(includeInactive?: boolean): Promise<VenueRecord[]>;

  /**
   * Live availability for the scheduler: CONFIRMED bookings that have not ended
   * yet, per venue id. Batched (one query for the whole venue list) because the
   * `Venue.activeBookings` field resolves once per row.
   */
  countActiveBookings(venueIds: string[]): Promise<VenueActiveBookingCount[]>;

  /** Add a municipal venue. Action: VenueService:Manage. */
  create(actorId: string, input: CreateVenueInput): Promise<VenueRecord>;

  /** Rename / reclassify / retire a venue. Action: VenueService:Manage. */
  update(actorId: string, input: UpdateVenueInput): Promise<VenueRecord>;
}

export interface CreateVenueInput {
  code: string;
  name: string;
  specialUse?: boolean | null;
  isActive?: boolean | null;
}

/** `code` is the natural key and is not editable once a venue exists. */
export interface UpdateVenueInput {
  venueId: string;
  name?: string | null;
  specialUse?: boolean | null;
  isActive?: boolean | null;
}
