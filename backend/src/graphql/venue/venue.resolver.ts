/**
 * Venue Resolvers - delegate to ctx.services.venue.
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import type {
  MutationCreateVenueArgs,
  MutationUpdateVenueArgs,
  QueryVenueArgs,
  QueryVenuesArgs,
} from "../../types/graphql.js";

export const venueResolvers = {
  Query: {
    venue: (_p: unknown, { id }: QueryVenueArgs, ctx: GraphQLContext) =>
      ctx.services.venue.getById(id),

    venues: (
      _p: unknown,
      { includeInactive }: QueryVenuesArgs,
      ctx: GraphQLContext,
    ) => ctx.services.venue.list(includeInactive ?? false),
  },

  Mutation: {
    createVenue: (_p: unknown, { input }: MutationCreateVenueArgs, ctx: GraphQLContext) =>
      ctx.services.venue.create(requireUser(ctx).sub, input),

    updateVenue: (_p: unknown, { input }: MutationUpdateVenueArgs, ctx: GraphQLContext) =>
      ctx.services.venue.update(requireUser(ctx).sub, input),
  },

  Venue: {
    // Live aggregate, batched through the per-request loader so listing every
    // venue still costs ONE grouped count query.
    activeBookings: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.dataloaders.venueActiveBookings.load(parent.id),
  },
};
