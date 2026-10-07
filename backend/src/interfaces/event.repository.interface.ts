/**
 * Event Repository Interfaces
 *
 * Data-access abstractions for the booking module:
 * venues, events, event_attendees, activity_logs.
 */

import { venues, events, eventAttendees, activityLogs } from "../db/schema/index.js";
import type { ListOptions } from "./common.interface.js";

export type VenueRecord = typeof venues.$inferSelect;
export type EventRecord = typeof events.$inferSelect;
export type EventAttendeeRecord = typeof eventAttendees.$inferSelect;
export type ActivityLogRecord = typeof activityLogs.$inferSelect;

export type EventStatus = EventRecord["status"];
export type ActivityLogAction = ActivityLogRecord["actionType"];

export interface CreateEventData {
  venueId: string;
  title: string;
  organizerId?: string | null;
  department: string;
  /** Calendar date (YYYY-MM-DD). */
  eventDate: string;
  /** "HH:MM:SS". */
  startTime: string;
  endTime: string;
  status?: EventStatus;
  involvesMayor?: boolean;
  involvesAdministrator?: boolean;
  notes?: string | null;
  createdBy: string;
}

export interface UpdateEventData {
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
}

/** A time window used for overlap detection (FR-42). */
export interface OverlapWindow {
  venueId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  /** Exclude this event id (used on update). */
  excludeEventId?: string | null;
}

/** Party-involvement flag columns used by the Mayor / Administrator checks. */
export type EventPartyFlag = "involvesMayor" | "involvesAdministrator";

export interface CreateVenueData {
  /** Natural key; uppercase short code. */
  code: string;
  name: string;
  specialUse?: boolean;
  isActive?: boolean;
}

export interface UpdateVenueData {
  name?: string;
  specialUse?: boolean;
  isActive?: boolean;
}

export interface IVenueRepository {
  findById(id: string): Promise<VenueRecord | null>;
  findByCode(code: string): Promise<VenueRecord | null>;
  findMany(options: ListOptions): Promise<VenueRecord[]>;
  create(data: CreateVenueData): Promise<VenueRecord>;
  update(id: string, data: UpdateVenueData): Promise<VenueRecord>;
  /**
   * Live availability aggregate for the scheduler: how many CONFIRMED bookings
   * each venue still has that have not ended yet (FR-42, `Venue.activeBookings`).
   * Batched so listing N venues stays ONE query; venues with no active booking
   * are simply absent from the result.
   */
  countActiveBookings(venueIds: string[]): Promise<VenueActiveBookingCount[]>;
}

/** One venue's active-booking tally. */
export interface VenueActiveBookingCount {
  venueId: string;
  count: number;
}

export interface IEventRepository {
  findById(id: string): Promise<EventRecord | null>;
  findByIds(ids: string[]): Promise<EventRecord[]>;
  findMany(options: ListOptions): Promise<EventRecord[]>;
  count(options?: Pick<ListOptions, "where">): Promise<number>;
  /** Events occurring within [from, to) for reminder materialization (FR-45). */
  findInWindow(from: Date, to: Date): Promise<EventRecord[]>;
  /**
   * Detect venue-time overlap excluding CANCELLED events (FR-42).
   * Returns conflicting events, empty when the slot is free.
   */
  findVenueConflicts(window: OverlapWindow): Promise<EventRecord[]>;
  /**
   * Mayor / Administrator double-booking check (FR-42): other non-cancelled
   * events on the same date that carry the party flag and overlap the window.
   */
  findFlagConflicts(flag: EventPartyFlag, window: OverlapWindow): Promise<EventRecord[]>;
  create(data: CreateEventData): Promise<EventRecord>;
  update(id: string, data: UpdateEventData): Promise<EventRecord>;
}

export interface IEventAttendeeRepository {
  findByEvent(eventId: string): Promise<EventAttendeeRecord[]>;
  /** Batch variant for relation resolvers (avoids N+1 on an event list). */
  findByEvents(eventIds: string[]): Promise<EventAttendeeRecord[]>;
  /** Attendee double-booking check (FR-42). */
  findConflictingAttendees(userIds: string[], window: OverlapWindow): Promise<EventAttendeeRecord[]>;
  add(eventId: string, userId: string): Promise<EventAttendeeRecord>;
  remove(eventId: string, userId: string): Promise<EventAttendeeRecord | null>;
  /** "my schedule today" - events a user must attend. */
  findEventsForUser(userId: string): Promise<string[]>;
}

export interface CreateActivityLogData {
  eventId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actionType: ActivityLogAction;
  template: string;
  payload: Record<string, unknown>;
}

/** APPEND-ONLY audit repository - [NFR-09] no update/delete by design. */
export interface IActivityLogRepository {
  findByEvent(eventId: string): Promise<ActivityLogRecord[]>;
  /** Batch variant for relation resolvers (oldest first). */
  findByEvents(eventIds: string[]): Promise<ActivityLogRecord[]>;
  append(data: CreateActivityLogData): Promise<ActivityLogRecord>;
}
