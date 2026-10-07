/**
 * Event Resolvers - delegate to ctx.services.event (booking module).
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs } from "../helpers.js";
import type { EventFilter, EventSortField } from "../../interfaces/event.service.interface.js";
import type {
  MutationCancelEventArgs,
  MutationCreateEventArgs,
  MutationUpdateEventArgs,
  QueryCheckEventConflictsArgs,
  QueryEventArgs,
  QueryEventsArgs,
  QueryMyScheduleArgs,
} from "../../types/graphql.js";

export const eventResolvers = {
  Query: {
    event: (_p: unknown, { id }: QueryEventArgs, ctx: GraphQLContext) =>
      ctx.services.event.getById(id),

    events: (_p: unknown, args: QueryEventsArgs, ctx: GraphQLContext) =>
      ctx.services.event.list(toConnectionArgs<EventFilter, EventSortField>(args)),

    mySchedule: (_p: unknown, { date }: QueryMyScheduleArgs, ctx: GraphQLContext) =>
      ctx.services.event.listForUser(requireUser(ctx).sub, date ?? null),

    checkEventConflicts: (_p: unknown, { input }: QueryCheckEventConflictsArgs, ctx: GraphQLContext) =>
      ctx.services.event.checkConflicts(input),
  },

  Mutation: {
    createEvent: (_p: unknown, { input }: MutationCreateEventArgs, ctx: GraphQLContext) =>
      ctx.services.event.create(requireUser(ctx).sub, input),

    updateEvent: (_p: unknown, { input }: MutationUpdateEventArgs, ctx: GraphQLContext) =>
      ctx.services.event.update(requireUser(ctx).sub, input),

    cancelEvent: (
      _p: unknown,
      { id, reason }: MutationCancelEventArgs,
      ctx: GraphQLContext,
    ) => ctx.services.event.cancel(requireUser(ctx).sub, id, reason ?? null),
  },

  Event: {
    venue: (parent: { venueId: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.venue.getById(parent.venueId),
    // Batched through the per-request loaders so an event list resolves its
    // attendees and activity trail in one query each, not one per row.
    attendees: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.dataloaders.eventAttendeesByEvent.load(parent.id),
    logs: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.dataloaders.eventActivityLogsByEvent.load(parent.id),
  },
};
