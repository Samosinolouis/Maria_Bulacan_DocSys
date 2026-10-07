/**
 * Notification Resolvers - delegate to ctx.services.notification (in-app only).
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs } from "../helpers.js";
import type {
  MutationMarkNotificationReadArgs,
  QueryNotificationsArgs,
} from "../../types/graphql.js";
import type {
  NotificationFilter,
  NotificationSortField,
} from "../../interfaces/notification.service.interface.js";

export const notificationResolvers = {
  Query: {
    notifications: (_p: unknown, args: QueryNotificationsArgs, ctx: GraphQLContext) =>
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
    markNotificationRead: (_p: unknown, { id }: MutationMarkNotificationReadArgs, ctx: GraphQLContext) =>
      ctx.services.notification.markRead(requireUser(ctx).sub, id),

    markAllNotificationsRead: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.notification.markAllRead(requireUser(ctx).sub),
  },
};
