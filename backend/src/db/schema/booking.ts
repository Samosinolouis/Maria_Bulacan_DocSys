/**
 * [C] BOOKING MODULE - Centralized scheduling
 *
 * Tables: venues, events, event_attendees, activity_logs.
 *
 * Conventions (schema.txt):
 *  - Conflict detection excludes CANCELLED events (FR-42).
 *  - activity_logs is APPEND-ONLY with actor snapshots.
 *  - [NFR-24] No FK crosses the Booking / Document module boundary.
 */

import {
  uuid,
  varchar,
  text,
  boolean,
  date,
  time,
  timestamp,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./schema.ts";
import { users } from "./platform.ts";
import { eventStatusEnum, activityLogActionEnum } from "./enums.ts";

/** Lookup: municipal venues. */
export const venues = appSchema.table("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  /** Display label. */
  name: varchar("name", { length: 255 }).notNull(),
  /**
   * true for Mayor's Conf. Room / Admin's Office ("special meetings");
   * pair with EventService:BookSpecialVenue permission (FR-41).
   */
  specialUse: boolean("special_use").notNull().default(false),
  /** Retire a venue without breaking history. */
  isActive: boolean("is_active").notNull().default(true),
});

/** Meeting / event bookings. */
export const events = appSchema.table(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id),
    title: varchar("title", { length: 500 }).notNull(),
    /** Person responsible for the event. */
    organizerId: uuid("organizer_id").references(() => users.id),
    /** Organizing office (free text). */
    department: varchar("department", { length: 255 }).notNull(),
    eventDate: date("event_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    status: eventStatusEnum("status").notNull().default("CONFIRMED"),
    /**
     * Mayor double-booking check without requiring a Mayor user account.
     */
    involvesMayor: boolean("involves_mayor").notNull().default(false),
    involvesAdministrator: boolean("involves_administrator")
      .notNull()
      .default(false),
    notes: text("notes"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Conflict-check hot path (NFR-04).
    index("events_venue_id_event_date_index").on(table.venueId, table.eventDate),
    // Calendar / day views.
    index("events_event_date_index").on(table.eventDate),
    /**
     * Active-booking lookups: "does this venue still have a confirmed booking
     * that has not ended?" (`Venue.activeBookings`, and the FR-42 overlap
     * check). Partial on CONFIRMED so the index stays small - a CANCELLED or
     * TENTATIVE row can never be an active booking.
     */
    index("events_active_bookings_index")
      .on(table.venueId, table.eventDate, table.endTime)
      .where(sql`${table.status} = 'CONFIRMED'`),
  ],
);

/** Join: required attendees (events N --- M users). */
export const eventAttendees = appSchema.table(
  "event_attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    /** Must be a user: in-app reminders are the only channel. */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    unique("event_attendees_event_id_user_id_unique").on(
      table.eventId,
      table.userId,
    ),
    // "my schedule today" + attendee conflicts.
    index("event_attendees_user_id_index").on(table.userId),
  ],
);

/** APPEND-ONLY audit trail (booking module) - [NFR-09] no UPDATE/DELETE. */
export const activityLogs = appSchema.table(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    /** Snapshots, same pattern as document_logs. */
    actorName: varchar("actor_name", { length: 255 }).notNull(),
    actorRole: varchar("actor_role", { length: 100 }).notNull(),
    actionType: activityLogActionEnum("action_type").notNull(),
    /** "Cancelled ${payload.title} at ${payload.venue}" */
    template: text("template").notNull(),
    /** diff/details */
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("activity_logs_event_id_index").on(table.eventId)],
);
