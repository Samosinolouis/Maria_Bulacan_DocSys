/**
 * EventService - booking module (FR-41..46).
 */

import { authorizeOrThrow } from '@/authz/authorize';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { Connection, ConnectionArgs } from './contracts/common';
import type { CreateEventInput, EventFilter, IEventService, UpdateEventInput } from './contracts/event';
import type { IGraphQLClient } from './contracts/graphql';
import type { BookingConflict, Event, EventSortField, Venue } from './contracts/models';
import type { MutationAnswer } from './contracts/mutation';
import {
  executeQueryWithCache,
  generateGetCacheKey,
  generateListCacheKey,
  invalidateChangedEntities,
  TTL,
} from './cache/helpers';
import { EVENT_OPS, VENUE_OPS } from './graphql/event.ops';

export class EventService implements IEventService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async getById(id: string): Promise<Event | null> {
    authorizeOrThrow(this.authz, 'EventService:Read');
    return executeQueryWithCache<Event | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('event', id),
      entities: ['Event'],
      queryType: 'get',
      ttlMs: TTL.OPERATIONAL,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ event: Event | null }>({ document: EVENT_OPS.get, variables: { id }, operationName: 'Event' })
          .then((d) => d.event),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as Event) : null),
    });
  }

  async list(args: ConnectionArgs<EventFilter, EventSortField>): Promise<Connection<Event>> {
    authorizeOrThrow(this.authz, 'EventService:Read');
    return executeQueryWithCache<Connection<Event>>({
      cache: this.cache,
      queryKey: generateListCacheKey('event', args as Record<string, unknown>),
      entities: ['Event'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: () => true,
      queryFn: () =>
        this.gql.request<{ events: Connection<Event> }>({
          document: EVENT_OPS.list,
          variables: { ...args },
          operationName: 'Events',
        }).then((d) => d.events),
      extract: (conn) => ({ items: conn.edges.map((e) => e.node), endCursor: conn.pageInfo.endCursor }),
      rehydrate: (items, endCursor) => ({
        edges: items.map((node) => ({ node: node as Event, cursor: (node as Event).id })),
        pageInfo: {
          hasNextPage: endCursor !== null,
          hasPreviousPage: false,
          startCursor: items.length ? (items[0] as Event).id : null,
          endCursor,
          totalCount: items.length,
        },
      }),
    });
  }

  async listMySchedule(date?: string): Promise<Event[]> {
    authorizeOrThrow(this.authz, 'EventService:Read');
    return executeQueryWithCache<Event[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('event', { schedule: date ?? null }),
      entities: ['Event'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ mySchedule: Event[] }>({
            document: EVENT_OPS.mySchedule,
            variables: { date: date ?? null },
            operationName: 'MySchedule',
          })
          .then((d) => d.mySchedule),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as Event[],
    });
  }

  async checkConflicts(input: CreateEventInput): Promise<BookingConflict[]> {
    authorizeOrThrow(this.authz, 'EventService:Read');
    const data = await this.gql.request<{ checkEventConflicts: BookingConflict[] }>({
      document: EVENT_OPS.checkConflicts,
      variables: { input },
      operationName: 'CheckEventConflicts',
    });
    return data.checkEventConflicts;
  }

  async create(input: CreateEventInput): Promise<Event> {
    const venue = await this.fetchVenue(input.venueId);
    authorizeOrThrow(this.authz, 'EventService:Create', {
      kind: 'event',
      attributes: { venueSpecialUse: venue?.specialUse === true },
    });
    const payload = await this.gql.request<{ createEvent: MutationAnswer<'event', Event> }>({
      document: EVENT_OPS.create,
      variables: { input },
      operationName: 'CreateEvent',
    });
    invalidateChangedEntities(this.cache, payload.createEvent.changedEntities);
    return payload.createEvent.event;
  }

  async update(input: UpdateEventInput): Promise<Event> {
    const current = await this.getById(input.eventId);
    const venue = input.venueId ? await this.fetchVenue(input.venueId) : current?.venue ?? null;
    authorizeOrThrow(this.authz, 'EventService:Update', {
      kind: 'event',
      attributes: { status: current?.status, venueSpecialUse: venue?.specialUse === true },
    });
    const payload = await this.gql.request<{ updateEvent: MutationAnswer<'event', Event> }>({
      document: EVENT_OPS.update,
      variables: { input },
      operationName: 'UpdateEvent',
    });
    invalidateChangedEntities(this.cache, payload.updateEvent.changedEntities);
    return payload.updateEvent.event;
  }

  async cancel(eventId: string, reason?: string | null): Promise<Event> {
    const current = await this.getById(eventId);
    authorizeOrThrow(this.authz, 'EventService:Cancel', {
      kind: 'event',
      attributes: { status: current?.status },
    });
    const payload = await this.gql.request<{ cancelEvent: MutationAnswer<'event', Event> }>({
      document: EVENT_OPS.cancel,
      variables: { id: eventId, reason: reason ?? null },
      operationName: 'CancelEvent',
    });
    invalidateChangedEntities(this.cache, payload.cancelEvent.changedEntities);
    return payload.cancelEvent.event;
  }

  private async fetchVenue(id: string): Promise<Venue | null> {
    const data = await this.gql.request<{ venue: Venue | null }>({
      document: VENUE_OPS.get,
      variables: { id },
      operationName: 'Venue',
    });
    return data.venue;
  }
}
