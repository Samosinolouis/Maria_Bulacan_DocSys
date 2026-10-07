/** Notification inbox operations. */

import { NOTIFICATION_FIELDS, PAGE_INFO_FIELDS } from './fields';

export const NOTIFICATION_OPS = {
  listInbox: `query Notifications($first: Int, $after: String, $filter: NotificationFilterInput, $sort: NotificationSortInput) {
    notifications(first: $first, after: $after, filter: $filter, sort: $sort) {
      edges { node { ${NOTIFICATION_FIELDS} } cursor }
      pageInfo { ${PAGE_INFO_FIELDS} }
    }
  }`,
  unreadCount: `query UnreadNotificationCount { unreadNotificationCount }`,
  markRead: `mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) { changedEntities notification { ${NOTIFICATION_FIELDS} } }
  }`,
  markAllRead: `mutation MarkAllNotificationsRead { markAllNotificationsRead { changedEntities count } }`,
  generateEventReminders: `query GenerateEventReminders { generateEventReminders }`,
};
