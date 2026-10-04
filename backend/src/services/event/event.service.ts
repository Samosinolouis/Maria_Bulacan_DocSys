/**
 * Event Service (SKELETON)
 *
 * Implements IEventService — the booking module. Business logic not yet
 * implemented.
 *
 * Intended responsibilities (when implemented):
 *  - FR-41  create/edit/cancel across the six venues; special-use venues
 *           require EventService:BookSpecialVenue
 *  - FR-42  prevent venue, attendee, and Mayor/Administrator double-booking;
 *           CANCELLED events never block a slot
 *  - FR-43  attendee tagging + Mayor/Administrator involvement flags
 *  - FR-44  mobile-browser schedule viewing (listForUser)
 *  - FR-46  record create/update/cancel in activity_logs
 */

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type { INotificationService } from "../../interfaces/notification.service.interface.js";
import type {
  IEventService,
  CreateEventInput,
  UpdateEventInput,
  EventFilter,
  EventSortField,
  BookingConflict,
} from "../../interfaces/event.service.interface.js";
import type { Connection, ConnectionArgs } from "../../interfaces/common.interface.js";
import type { EventRecord } from "../../interfaces/event.repository.interface.js";
import { NotImplementedError } from "../../errors/index.js";

export class EventService implements IEventService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
    private readonly notifications: INotificationService,
  ) {}

  async getById(_id: string): Promise<EventRecord | null> {
    throw new NotImplementedError("EventService.getById");
  }

  async getByIds(_ids: string[]): Promise<EventRecord[]> {
    throw new NotImplementedError("EventService.getByIds");
  }

  async list(
    _args: ConnectionArgs<EventFilter, EventSortField>,
  ): Promise<Connection<EventRecord>> {
    throw new NotImplementedError("EventService.list");
  }

  async listForUser(_userId: string, _date?: string | null): Promise<EventRecord[]> {
    // TODO(FR-44): events joined via event_attendees for the calendar day.
    throw new NotImplementedError("EventService.listForUser");
  }

  async create(_actorId: string, _input: CreateEventInput): Promise<EventRecord> {
    // TODO(FR-41..43, 46): special-use check -> conflicts -> events.create +
    //   attendees + activityLogs.append(EVENT_CREATED) -> notify attendees.
    throw new NotImplementedError("EventService.create");
  }

  async update(_actorId: string, _input: UpdateEventInput): Promise<EventRecord> {
    // TODO(FR-41..42, 46): re-check conflicts excluding this event -> update +
    //   activityLogs.append(EVENT_UPDATED).
    throw new NotImplementedError("EventService.update");
  }

  async cancel(_actorId: string, _eventId: string, _reason?: string | null): Promise<EventRecord> {
    // TODO(FR-42, 46): status -> CANCELLED (never a delete) + activity log +
    //   notify attendees (EVENT_CANCELLED).
    throw new NotImplementedError("EventService.cancel");
  }

  async checkConflicts(_input: CreateEventInput): Promise<BookingConflict[]> {
    // TODO(FR-42): venue overlap + attendee overlap + Mayor/Admin overlap.
    throw new NotImplementedError("EventService.checkConflicts");
  }
}
