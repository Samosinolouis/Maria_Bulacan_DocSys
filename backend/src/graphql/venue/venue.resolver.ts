/**
 * Venue Resolvers — delegate to ctx.services.venue.
 */

import type { GraphQLContext } from "../context.js";

export const venueResolvers = {
  Query: {
    venue: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.venue.getById(id),

    venues: (
      _p: unknown,
      { includeInactive }: { includeInactive?: boolean },
      ctx: GraphQLContext,
    ) => ctx.services.venue.list(includeInactive ?? false),
  },
};
