/**
 * Notification Resolvers — delegate to ctx.services.notification (in-app only).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs, type ListArgs } from "../helpers.js";
import type {
  NotificationFilter,
  NotificationSortField,
} from "../../interfaces/notification.service.interface.js";

export const notificationResolvers = {
  Query: {
    notifications: (_p: unknown, args: ListArgs, ctx: GraphQLContext) =>
      ctx.services.notification.listInbox(
        requireUser(ctx).sub,
        toConnectionArgs<NotificationFilter, NotificationSortField>(args),
      ),

    unreadNotificationCount: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.notification.unreadCount(requireUser(ctx).sub),

    generateEventReminders: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.notification.generateEventReminders(requireUser(ctx).sub),
  },

  Mutation: {
    markNotificationRead: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.notification.markRead(requireUser(ctx).sub, id),

    markAllNotificationsRead: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.notification.markAllRead(requireUser(ctx).sub),
  },
};
