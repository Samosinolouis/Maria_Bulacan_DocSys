/**
 * GraphQL Resolver Aggregator
 *
 * Merges every domain resolver map into a single resolver object, adds the
 * custom scalars (DateTime/JSON/UUID), the Node interface resolveType, and
 * wraps everything so business AppErrors surface as structured GraphQLErrors
 * (Mercurius has no global formatError hook).
 *
 * [SOLID:OCP] New domains are added by adding their map to `domainMaps`.
 */

import { DateTimeResolver, JSONResolver, UUIDResolver } from "graphql-scalars";

import { userResolvers } from "./user/user.resolver.js";
import { roleResolvers } from "./role/role.resolver.js";
import { notificationResolvers } from "./notification/notification.resolver.js";
import { requestResolvers } from "./request/request.resolver.js";
import { documentResolvers } from "./document/document.resolver.js";
import { attachmentResolvers } from "./attachment/attachment.resolver.js";
import { eventResolvers } from "./event/event.resolver.js";
import { venueResolvers } from "./venue/venue.resolver.js";
import { reportResolvers } from "./report/report.resolver.js";
import { wrapResolvers } from "../utils/graphql-error-handler.js";

const domainMaps = [
  userResolvers,
  roleResolvers,
  notificationResolvers,
  requestResolvers,
  documentResolvers,
  attachmentResolvers,
  eventResolvers,
  venueResolvers,
  reportResolvers,
] as const;

/** Merge Query / Mutation / type sub-resolvers from every domain map. */
function mergeDomainResolvers(): Record<string, Record<string, unknown>> {
  const merged: Record<string, Record<string, unknown>> = {};

  for (const map of domainMaps) {
    for (const [typeName, fields] of Object.entries(map)) {
      merged[typeName] = {
        ...(merged[typeName] ?? {}),
        ...(fields as Record<string, unknown>),
      };
    }
  }

  return merged;
}

const merged = mergeDomainResolvers();

const rawResolvers = {
  ...merged,

  // --- Base Query / Mutation ---
  Query: { ...merged.Query, _health: () => "ok" },
  Mutation: { ...merged.Mutation, _noop: () => true },

  // --- Custom scalars ---
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  UUID: UUIDResolver,

  // --- Interfaces ---
  Node: {
    __resolveType(parent: { __typename?: string }) {
      return parent.__typename ?? null;
    },
  },
};

/** Resolvers with error-translation wrapping applied. */
export const resolvers = wrapResolvers(rawResolvers);

export default resolvers;
