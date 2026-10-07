/**
 * Notification Repository Interface
 *
 * Data-access abstraction for the `notifications` table (in-app only).
 */

import { notifications } from "../db/schema/index.js";
import type { ListOptions } from "./common.interface.js";

export type NotificationRecord = typeof notifications.$inferSelect;

export type NotificationType = NotificationRecord["type"];

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  payload: Record<string, unknown>;
  template: string;
  requestId?: string | null;
  documentId?: string | null;
  eventId?: string | null;
}

export interface INotificationRepository {
  findById(id: string): Promise<NotificationRecord | null>;
  findMany(options: ListOptions): Promise<NotificationRecord[]>;
  count(options?: Pick<ListOptions, "where">): Promise<number>;
  /** Unread count for the notification bell (FR-48). */
  countUnread(userId: string): Promise<number>;
  create(data: CreateNotificationData): Promise<NotificationRecord>;
  /** Mark a single notification read (FR-49). */
  markRead(id: string, readAt: Date): Promise<NotificationRecord | null>;
  /** Mark all of a user's notifications read (FR-49). */
  markAllRead(userId: string, readAt: Date): Promise<number>;
}
