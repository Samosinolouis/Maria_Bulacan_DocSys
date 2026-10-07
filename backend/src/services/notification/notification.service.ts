/**
 * Notification Service
 *
 * Implements INotificationService - the in-app notification center
 * (FR-47..51) plus idempotent materialization of event reminders (FR-45)
 * and SLA at-risk/overdue alerts (FR-38).
 *
 * - FR-48  inbox listing newest-first with unread count
 * - FR-49  mark read individually or all at once
 * - FR-50  deep-link to source entity (request/document/event)
 * - FR-51  in-app only - no email/SMS
 *
 * [SOLID:SRP] Notification lifecycle only - workflow services decide *when*
 * to notify; this service decides *how* it is stored.
 */

import { and, asc, desc, eq, isNull, lte, ne } from "drizzle-orm";

import { config } from "../../config/index.js";
import { notifications, requests } from "../../db/schema/index.js";
import { NotFoundError } from "../../errors/index.js";
import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  INotificationService,
  NotifyInput,
  NotificationFilter,
  NotificationSortField,
} from "../../interfaces/notification.service.interface.js";
import type {
  Connection,
  ConnectionArgs,
} from "../../interfaces/common.interface.js";
import type { NotificationRecord } from "../../interfaces/notification.repository.interface.js";
import { dedupeIds } from "../shared/workflow.js";
import { resolveWindow, toConnection } from "../shared/query.js";

export class NotificationService implements INotificationService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async listInbox(
    userId: string,
    args: ConnectionArgs<NotificationFilter, NotificationSortField>,
  ): Promise<Connection<NotificationRecord>> {
    const { first, offset } = resolveWindow(args);
    const conditions = [eq(notifications.userId, userId)];
    if (args.filter?.unreadOnly) conditions.push(isNull(notifications.readAt));
    if (args.filter?.type) conditions.push(eq(notifications.type, args.filter.type));
    const where = and(...conditions);

    // Inbox is newest-first by default (FR-48).
    const direction = args.sort?.direction === "ASC" ? asc : desc;

    return this.db.query(async (uow) => {
      const [rows, totalCount] = await Promise.all([
        uow.notifications.findMany({
          limit: first + 1,
          offset,
          where,
          orderBy: [direction(notifications.createdAt)],
        }),
        uow.notifications.count({ where }),
      ]);
      return toConnection({ rows, first, offset, totalCount });
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.db.query((uow) => uow.notifications.countUnread(userId));
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationRecord | null> {
    return this.db.transaction(async (uow) => {
      const notification = await uow.notifications.findById(notificationId);
      if (!notification || notification.userId !== userId) {
        throw new NotFoundError("Notification", notificationId);
      }
      return uow.notifications.markRead(notificationId, new Date());
    });
  }

  async markAllRead(userId: string): Promise<number> {
    return this.db.transaction((uow) =>
      uow.notifications.markAllRead(userId, new Date()),
    );
  }

  /** Create one notification row per recipient (FR-47). */
  async notify(input: NotifyInput): Promise<NotificationRecord[]> {
    const recipients = dedupeIds(input.userIds);
    if (recipients.length === 0) return [];

    const rows = await this.db.transaction(async (uow) => {
      const created: NotificationRecord[] = [];
      for (const userId of recipients) {
        created.push(
          await uow.notifications.create({
            userId,
            type: input.type,
            title: input.title,
            payload: input.payload,
            template: input.template,
            requestId: input.requestId ?? null,
            documentId: input.documentId ?? null,
            eventId: input.eventId ?? null,
          }),
        );
      }
      return created;
    });

    this.telemetry.trackEvent("notification.notified", {
      type: input.type,
      recipients: rows.length,
    });
    return rows;
  }

  /**
   * FR-45: idempotently materialize EVENT_REMINDER rows for events occurring
   * in the next 24-48 hours that the user must attend. Running it twice for
   * the same user/event creates nothing new.
   */
  async generateEventReminders(userId: string): Promise<number> {
    const now = new Date();
    const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return this.db.transaction(async (uow) => {
      const attendeeEventIds = await uow.eventAttendees.findEventsForUser(userId);
      if (attendeeEventIds.length === 0) return 0;

      const windowEvents = await uow.events.findInWindow(from, to);
      const mine = windowEvents.filter((event) => attendeeEventIds.includes(event.id));
      if (mine.length === 0) return 0;

      let created = 0;
      for (const event of mine) {
        const existing = await uow.notifications.findMany({
          limit: 1,
          where: and(
            eq(notifications.userId, userId),
            eq(notifications.type, "EVENT_REMINDER"),
            eq(notifications.eventId, event.id),
          ),
        });
        if (existing.length > 0) continue;

        await uow.notifications.create({
          userId,
          type: "EVENT_REMINDER",
          title: `Reminder: ${event.title} on ${event.eventDate}`,
          payload: {
            event_id: event.id,
            title: event.title,
            event_date: event.eventDate,
            start_time: event.startTime,
            end_time: event.endTime,
          },
          template:
            "Reminder: ${payload.title} on ${payload.event_date} at ${payload.start_time}.",
          eventId: event.id,
        });
        created += 1;
      }
      return created;
    });
  }

  /**
   * FR-38: flag requests whose SLA deadline has passed or falls within the
   * warning window to the responsible staff (encoder + assigned officers).
   * Idempotent per (user, request, alert type).
   */
  async generateSlaAlerts(): Promise<number> {
    const now = new Date();
    const warnUntil = new Date(
      now.getTime() + config.sla.warningHours * 60 * 60 * 1000,
    );

    return this.db.transaction(async (uow) => {
      const openRequests = await uow.requests.findMany({
        limit: 1000,
        where: and(
          ne(requests.status, "CLOSED"),
          lte(requests.slaDeadline, warnUntil),
        ),
        orderBy: [asc(requests.slaDeadline)],
      });

      let created = 0;
      for (const request of openRequests) {
        const type =
          request.slaDeadline.getTime() < now.getTime() ? "SLA_OVERDUE" : "SLA_AT_RISK";

        const requestDocuments = await uow.documents.findByRequest(request.id);
        const recipients = dedupeIds([
          request.createdBy,
          ...requestDocuments.map((document) => document.assignedTo),
        ]);

        for (const userId of recipients) {
          const existing = await uow.notifications.findMany({
            limit: 1,
            where: and(
              eq(notifications.userId, userId),
              eq(notifications.type, type),
              eq(notifications.requestId, request.id),
            ),
          });
          if (existing.length > 0) continue;

          await uow.notifications.create({
            userId,
            type,
            title:
              type === "SLA_OVERDUE"
                ? `Overdue: ${request.controlNo} has passed its SLA deadline`
                : `SLA at risk: ${request.controlNo}`,
            payload: {
              control_no: request.controlNo,
              title: request.title,
              sla_deadline: request.slaDeadline.toISOString(),
            },
            template:
              "Request ${payload.control_no} has an SLA deadline of ${payload.sla_deadline} (RA 11032).",
            requestId: request.id,
          });
          created += 1;
        }
      }
      return created;
    });
  }
}
