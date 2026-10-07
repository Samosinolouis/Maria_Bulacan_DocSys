/**
 * [A] SHARED PLATFORM - Notifications (in-app only)
 *
 * Notifications are IN-APP ONLY (FR-51). Email/SMS is out of scope; if ever
 * added, a notification_deliveries table fans out from here without altering
 * this table. The nullable-trio source FKs give deep links (FR-50).
 */

import {
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

import { appSchema } from "./schema.ts";
import { users } from "./platform.ts";
import { requests, documents } from "./document.ts";
import { events } from "./booking.ts";
import { notificationTypeEnum } from "./enums.ts";

export const notifications = appSchema.table(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Recipient. */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: notificationTypeEnum("type").notNull(),
    /** Headline shown in the notification bell / inbox. */
    title: varchar("title", { length: 500 }).notNull(),
    /** Context data for rendering. */
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    /** Body renderer over payload, same pattern as document_logs. */
    template: text("template").notNull(),
    /** Source entity for click-through deep links (nullable-trio pattern). */
    requestId: uuid("request_id").references(() => requests.id),
    documentId: uuid("document_id").references(() => documents.id),
    eventId: uuid("event_id").references(() => events.id),
    /** NULL = unread. */
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Inbox listing + unread count (FR-48).
    index("notifications_user_id_created_at_index").on(
      table.userId,
      table.createdAt,
    ),
  ],
);
