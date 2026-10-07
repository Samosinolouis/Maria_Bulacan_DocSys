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
import { folderResolvers } from "./folder/folder.resolver.js";
import { attachmentResolvers } from "./attachment/attachment.resolver.js";
import { eventResolvers } from "./event/event.resolver.js";
import { venueResolvers } from "./venue/venue.resolver.js";
import { reportResolvers } from "./report/report.resolver.js";
import { wrapResolvers } from "../utils/graphql-error-handler.js";
import { getChangedEntities, runWithChangeTracking } from "../uow.js";

/**
 * Mutation field -> the payload field its return value belongs in. Every
 * mutation answers `{ changedEntities, <entityField> }`; the tracker in
 * `uow.ts` collects the entity list while the resolver runs.
 */
const MUTATION_ENTITY_FIELD: Record<string, string> = {
  // Requests
  encodeRequest: "request",
  screenRequest: "request",
  resubmitRequest: "request",
  // Documents
  prepareDocument: "document",
  submitDocumentForReview: "document",
  reviewDocument: "document",
  signDocument: "document",
  transmitDocument: "document",
  closeRequest: "document",
  // Booking
  createEvent: "event",
  updateEvent: "event",
  cancelEvent: "event",
  createVenue: "venue",
  updateVenue: "venue",
  // Archive
  createFolder: "folder",
  // Notifications
  markNotificationRead: "notification",
  markAllNotificationsRead: "count",
  // Reports / reference data
  exportSummary: "report",
  createRequestType: "requestType",
  createDocumentType: "documentType",
  upsertHoliday: "holiday",
  // Users & roles
  createRole: "role",
  updateRole: "role",
  updateUserProfile: "user",
  deactivateUser: "user",
  reactivateUser: "user",
  assignRole: "user",
  removeRole: "user",
  // Presigned downloads (change nothing, but keep the contract uniform)
  requestAttachmentDownload: "ticket",
  documentAttachmentDownload: "ticket",
};

/**
 * Wrap every mutation resolver so it runs inside the change tracker and returns
 * the standard payload: the entities it changed plus its own result.
 */
function withMutationPayload(
  mutations: Record<string, unknown>,
): Record<string, unknown> {
  const wrapped: Record<string, unknown> = {};

  for (const [field, resolver] of Object.entries(mutations)) {
    const entityField = MUTATION_ENTITY_FIELD[field];
    if (!entityField || typeof resolver !== "function") {
      wrapped[field] = resolver;
      continue;
    }

    wrapped[field] = async (...args: unknown[]) => {
      // The collector only exists inside the tracked scope, so read it there.
      const { result, changedEntities } = await runWithChangeTracking(async () => {
        const value = await (resolver as (...a: unknown[]) => Promise<unknown>)(...args);
        return { result: value, changedEntities: getChangedEntities() };
      });
      return entityField === "count"
        ? { changedEntities, count: result ?? 0 }
        : { changedEntities, [entityField]: result };
    };
  }

  return wrapped;
}

const domainMaps = [
  userResolvers,
  roleResolvers,
  notificationResolvers,
  requestResolvers,
  documentResolvers,
  folderResolvers,
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
  Mutation: withMutationPayload({ ...merged.Mutation, _noop: () => true }),

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
