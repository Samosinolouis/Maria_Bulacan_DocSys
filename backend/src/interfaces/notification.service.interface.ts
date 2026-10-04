/**
 * Notification Service Interface
 *
 * Business-logic abstraction for the in-app notification center (FR-47..51)
 * plus idempotent materialization of event reminders and SLA alerts.
 */

import type { NotificationRecord } from "./notification.repository.interface.js";
import type { Connection, ConnectionArgs } from "./common.interface.js";

export interface NotificationFilter {
  unreadOnly?: boolean | null;
  type?: NotificationRecord["type"] | null;
}

export type NotificationSortField = "CREATED_AT";

/** Fan-out request used by other services to notify recipients. */
export interface NotifyInput {
  userIds: string[];
  type: NotificationRecord["type"];
  title: string;
  payload: Record<string, unknown>;
  template: string;
  requestId?: string | null;
  documentId?: string | null;
  eventId?: string | null;
}

export interface INotificationService {
  listInbox(
    userId: string,
    args: ConnectionArgs<NotificationFilter, NotificationSortField>,
  ): Promise<Connection<NotificationRecord>>;

  unreadCount(userId: string): Promise<number>;
  markRead(userId: string, notificationId: string): Promise<NotificationRecord | null>;
  markAllRead(userId: string): Promise<number>;

  /** Create notifications for one or more recipients (FR-47). */
  notify(input: NotifyInput): Promise<NotificationRecord[]>;

  /** Idempotently materialize EVENT_REMINDER rows for the next 24-48h (FR-45). */
  generateEventReminders(userId: string): Promise<number>;

  /** Flag SLA-at-risk / overdue requests to responsible staff (FR-38, FR-47). */
  generateSlaAlerts(): Promise<number>;
}
