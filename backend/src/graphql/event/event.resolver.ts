/**
 * Event Resolvers — delegate to ctx.services.event (booking module).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs, type ListArgs } from "../helpers.js";
import type {
  EventFilter,
  EventSortField,
  CreateEventInput,
} from "../../interfaces/event.service.interface.js";

export const eventResolvers = {
  Query: {
    event: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.event.getById(id),

    events: (_p: unknown, args: ListArgs, ctx: GraphQLContext) =>
      ctx.services.event.list(toConnectionArgs<EventFilter, EventSortField>(args)),

    mySchedule: (_p: unknown, { date }: { date?: string | null }, ctx: GraphQLContext) =>
      ctx.services.event.listForUser(requireUser(ctx).sub, date ?? null),

    checkEventConflicts: (_p: unknown, { input }: { input: CreateEventInput }, ctx: GraphQLContext) =>
      ctx.services.event.checkConflicts(input),
  },

  Mutation: {
    createEvent: (_p: unknown, { input }: { input: CreateEventInput }, ctx: GraphQLContext) =>
      ctx.services.event.create(requireUser(ctx).sub, input),

    updateEvent: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.event.update(requireUser(ctx).sub, input),

    cancelEvent: (
      _p: unknown,
      { id, reason }: { id: string; reason?: string | null },
      ctx: GraphQLContext,
    ) => ctx.services.event.cancel(requireUser(ctx).sub, id, reason ?? null),
  },

  Event: {
    venue: (parent: { venueId: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.venue.getById(parent.venueId),
    // TODO: resolve attendees + logs from repositories once services land.
    attendees: () => [],
    logs: () => [],
  },
};
