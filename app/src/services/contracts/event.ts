/**
 * Booking module contracts: venues and events (FR-41..46).
 */

import type { Connection, ConnectionArgs } from './common';
import type { Event, EventStatus, BookingConflict, EventSortField, Venue } from './models';

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

export interface IEventService {
  /** Reads. Action: EventService:Read. */
  getById(id: string): Promise<Event | null>;
  list(args: ConnectionArgs<EventFilter, EventSortField>): Promise<Connection<Event>>;

  /** The authenticated user's schedule (FR-44). Action: EventService:Read. */
  listMySchedule(date?: string): Promise<Event[]>;

  /** Dry-run conflict detection for a proposed slot (FR-42). Action: EventService:Read. */
  checkConflicts(input: CreateEventInput): Promise<BookingConflict[]>;

  /** Create with conflict enforcement (FR-41..43). Action: EventService:Create
   *  (plus EventService:BookSpecialVenue when the venue is special-use). */
  create(input: CreateEventInput): Promise<Event>;

  /** Edit (FR-41). Action: EventService:Update. */
  update(input: UpdateEventInput): Promise<Event>;

  /** Cancellation is a status change, never a delete (FR-41). Action: EventService:Cancel. */
  cancel(eventId: string, reason?: string | null): Promise<Event>;
}

export interface IVenueService {
  /** Action: VenueService:Read. */
  getById(id: string): Promise<Venue | null>;
  list(includeInactive?: boolean): Promise<Venue[]>;

  /** Add a municipal venue. Action: VenueService:Manage. */
  create(input: CreateVenueInput): Promise<Venue>;

  /** Rename / reclassify / retire a venue. Action: VenueService:Manage. */
  update(input: UpdateVenueInput): Promise<Venue>;
}

export interface CreateVenueInput {
  /** Short uppercase code, unique. Not editable afterwards. */
  code: string;
  name: string;
  specialUse?: boolean;
  isActive?: boolean;
}

export interface UpdateVenueInput {
  venueId: string;
  name?: string;
  specialUse?: boolean;
  isActive?: boolean;
}
