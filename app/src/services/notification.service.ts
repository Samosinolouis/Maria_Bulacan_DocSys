/**
 * NotificationService - in-app inbox (FR-47..51).
 */

import { authorizeOrThrow } from '@/authz/authorize';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { Connection, ConnectionArgs } from './contracts/common';
import type { IGraphQLClient } from './contracts/graphql';
import type { Notification, NotificationSortField } from './contracts/models';
import type { MutationAnswer } from './contracts/mutation';
import type { INotificationService, NotificationFilter } from './contracts/notification';
import {
  executeQueryWithCache,
  generateListCacheKey,
  invalidateChangedEntities,
  invalidateUnreadCount,
  TTL,
  UNREAD_COUNT_QUERY_KEY,
} from './cache/helpers';
import { NOTIFICATION_OPS } from './graphql/notification.ops';

interface CountEntity {
  id: string;
  count: number;
}

export class NotificationService implements INotificationService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async listInbox(
    args: ConnectionArgs<NotificationFilter, NotificationSortField>,
  ): Promise<Connection<Notification>> {
    authorizeOrThrow(this.authz, 'NotificationService:Read');
    const filter = args.filter ?? null;
    return executeQueryWithCache<Connection<Notification>>({
      cache: this.cache,
      queryKey: generateListCacheKey('notification', args as Record<string, unknown>),
      entities: ['Notification'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: (entity) => {
        const n = entity as Notification;
        if (filter?.unreadOnly) return n.readAt == null;
        if (filter?.type) return n.type === filter.type;
        return true;
      },
      queryFn: () =>
        this.gql
          .request<{ notifications: Connection<Notification> }>({
            document: NOTIFICATION_OPS.listInbox,
            variables: { ...args },
            operationName: 'Notifications',
          })
          .then((d) => d.notifications),
      extract: (conn) => ({ items: conn.edges.map((e) => e.node), endCursor: conn.pageInfo.endCursor }),
      rehydrate: (items, endCursor) => ({
        edges: items.map((node) => ({ node: node as Notification, cursor: (node as Notification).id })),
        pageInfo: {
          hasNextPage: endCursor !== null,
          hasPreviousPage: false,
          startCursor: items.length ? (items[0] as Notification).id : null,
          endCursor,
          totalCount: items.length,
        },
      }),
    });
  }

  async unreadCount(): Promise<number> {
    authorizeOrThrow(this.authz, 'NotificationService:Read');
    const entity = await executeQueryWithCache<CountEntity>({
      cache: this.cache,
      queryKey: UNREAD_COUNT_QUERY_KEY,
      entities: ['Notification'],
      queryType: 'get',
      ttlMs: TTL.METRICS,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ unreadNotificationCount: number }>({
            document: NOTIFICATION_OPS.unreadCount,
            operationName: 'UnreadNotificationCount',
          })
          .then((d) => ({ id: 'unread-count', count: d.unreadNotificationCount })),
      extract: (r) => ({ items: [{ id: r.id }], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as CountEntity) : undefined),
    });
    return entity.count;
  }

  async markRead(id: string): Promise<Notification | null> {
    authorizeOrThrow(this.authz, 'NotificationService:MarkRead');
    const payload = await this.gql.request<{
      markNotificationRead: MutationAnswer<'notification', Notification | null>;
    }>({
      document: NOTIFICATION_OPS.markRead,
      variables: { id },
      operationName: 'MarkNotificationRead',
    });
    invalidateChangedEntities(this.cache, payload.markNotificationRead.changedEntities);
    return payload.markNotificationRead.notification;
  }

  async markAllRead(): Promise<number> {
    authorizeOrThrow(this.authz, 'NotificationService:MarkRead');
    const payload = await this.gql.request<{
      markAllNotificationsRead: MutationAnswer<'count', number>;
    }>({
      document: NOTIFICATION_OPS.markAllRead,
      operationName: 'MarkAllNotificationsRead',
    });
    invalidateChangedEntities(this.cache, payload.markAllNotificationsRead.changedEntities);
    return payload.markAllNotificationsRead.count;
  }

  async generateEventReminders(): Promise<number> {
    authorizeOrThrow(this.authz, 'NotificationService:Read');
    const data = await this.gql.request<{ generateEventReminders: number }>({
      document: NOTIFICATION_OPS.generateEventReminders,
      operationName: 'GenerateEventReminders',
    });
    invalidateUnreadCount(this.cache);
    return data.generateEventReminders;
  }
}
