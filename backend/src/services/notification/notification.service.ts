/**
 * Notification Service (SKELETON)
 *
 * Implements INotificationService. Business logic not implemented yet.
 *
 * Intended responsibilities (when implemented):
 *  - FR-47  generate in-app notifications for review submissions, decisions,
 *           event changes, and SLA at-risk/overdue
 *  - FR-48  inbox listing newest-first with unread count
 *  - FR-49  mark read individually or all at once
 *  - FR-50  deep-link to source entity (request/document/event)
 *  - FR-45  idempotently materialize EVENT_REMINDER rows for the next 24-48h
 *  - FR-38  flag SLA-at-risk / overdue requests
 *  - FR-51  in-app only — no email/SMS
 */

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  INotificationService,
  NotifyInput,
  NotificationFilter,
  NotificationSortField,
} from "../../interfaces/notification.service.interface.js";
import type { Connection, ConnectionArgs } from "../../interfaces/common.interface.js";
import type { NotificationRecord } from "../../interfaces/notification.repository.interface.js";
import { NotImplementedError } from "../../errors/index.js";

export class NotificationService implements INotificationService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async listInbox(
    _userId: string,
    _args: ConnectionArgs<NotificationFilter, NotificationSortField>,
  ): Promise<Connection<NotificationRecord>> {
    throw new NotImplementedError("NotificationService.listInbox");
  }

  async unreadCount(_userId: string): Promise<number> {
    throw new NotImplementedError("NotificationService.unreadCount");
  }

  async markRead(
    _userId: string,
    _notificationId: string,
  ): Promise<NotificationRecord | null> {
    throw new NotImplementedError("NotificationService.markRead");
  }

  async markAllRead(_userId: string): Promise<number> {
    throw new NotImplementedError("NotificationService.markAllRead");
  }

  async notify(_input: NotifyInput): Promise<NotificationRecord[]> {
    // TODO(FR-47): insert one notifications row per recipient.
    throw new NotImplementedError("NotificationService.notify");
  }

  async generateEventReminders(_userId: string): Promise<number> {
    // TODO(FR-45): idempotent EVENT_REMINDER materialization in the 24-48h window.
    throw new NotImplementedError("NotificationService.generateEventReminders");
  }

  async generateSlaAlerts(): Promise<number> {
    // TODO(FR-38): flag SLA-at-risk / overdue requests to responsible staff.
    throw new NotImplementedError("NotificationService.generateSlaAlerts");
  }
}
