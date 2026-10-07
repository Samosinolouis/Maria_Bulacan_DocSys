/**
 * Notification contract: in-app inbox (FR-47..51).
 */

import type { Connection, ConnectionArgs } from './common';
import type { Notification, NotificationType, NotificationSortField } from './models';

export interface NotificationFilter {
  unreadOnly?: boolean | null;
  type?: NotificationType | null;
}

export interface INotificationService {
  /** The authenticated user's inbox, newest-first (FR-48). Action: NotificationService:Read. */
  listInbox(
    args: ConnectionArgs<NotificationFilter, NotificationSortField>,
  ): Promise<Connection<Notification>>;

  /** Unread count for the bell (FR-48). Action: NotificationService:Read. */
  unreadCount(): Promise<number>;

  /** Mark one notification read (FR-49). Action: NotificationService:MarkRead. */
  markRead(id: string): Promise<Notification | null>;

  /** Mark all read (FR-49). Action: NotificationService:MarkRead. */
  markAllRead(): Promise<number>;

  /** Idempotently materialize event reminders (FR-45). Action: NotificationService:Read. */
  generateEventReminders(): Promise<number>;
}
