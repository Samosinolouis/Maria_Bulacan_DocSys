/**
 * Event & Venue Service Interfaces
 *
 * Business-logic abstraction for the booking module (FR-41..46):
 * create / edit / cancel with venue, attendee, and Mayor/Administrator
 * conflict detection; special-use venue permission enforcement.
 */

import type { EventRecord, VenueRecord } from "./event.repository.interface.js";
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
  status?: EventStatus;
  involvesMayor?: boolean;
  involvesAdministrator?: boolean;
  notes?: string | null;
  /** Required-attendee user ids (must be system users). */
  attendeeIds?: string[];
}

export interface UpdateEventInput {
  eventId: string;
  venueId?: string;
  title?: string;
  organizerId?: string | null;
  department?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  status?: EventStatus;
  involvesMayor?: boolean;
  involvesAdministrator?: boolean;
  notes?: string | null;
  attendeeIds?: string[];
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

export interface IEventService {
  getById(id: string): Promise<EventRecord | null>;
  getByIds(ids: string[]): Promise<EventRecord[]>;
  list(args: ConnectionArgs<EventFilter, EventSortField>): Promise<Connection<EventRecord>>;

  /** "my schedule" — events the user must attend (FR-44). */
  listForUser(userId: string, date?: string | null): Promise<EventRecord[]>;

  create(actorId: string, input: CreateEventInput): Promise<EventRecord>;
  update(actorId: string, input: UpdateEventInput): Promise<EventRecord>;
  cancel(actorId: string, eventId: string, reason?: string | null): Promise<EventRecord>;

  /** Dry-run conflict detection for a proposed slot (FR-42). */
  checkConflicts(input: CreateEventInput): Promise<BookingConflict[]>;
}

export interface IVenueService {
  getById(id: string): Promise<VenueRecord | null>;
  list(includeInactive?: boolean): Promise<VenueRecord[]>;
}
