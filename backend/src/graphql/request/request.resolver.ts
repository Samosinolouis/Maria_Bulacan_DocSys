/**
 * Request Resolvers — delegate to ctx.services.request (Steps 1-2).
 * Relation fields (documents/attachments/logs) are resolved lazily.
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs, type ListArgs } from "../helpers.js";
import type { RequestFilter, RequestSortField } from "../../interfaces/request.service.interface.js";

export const requestResolvers = {
  Query: {
    request: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.request.getById(id),

    requestByControlNo: (
      _p: unknown,
      { controlNo }: { controlNo: string },
      ctx: GraphQLContext,
    ) => ctx.services.request.getByControlNo(controlNo),

    requests: (_p: unknown, args: ListArgs, ctx: GraphQLContext) =>
      ctx.services.request.list(toConnectionArgs<RequestFilter, RequestSortField>(args)),

    requestTypes: (_p: unknown, { includeInactive }: { includeInactive?: boolean }, ctx: GraphQLContext) =>
      ctx.services.lookup.listRequestTypes(includeInactive ?? false),
  },

  Mutation: {
    encodeRequest: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.request.encode(requireUser(ctx).sub, input),

    screenRequest: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.request.screen(requireUser(ctx).sub, input),

    resubmitRequest: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.request.resubmit(requireUser(ctx).sub, id),
  },

  Request: {
    requestType: (parent: { requestTypeId: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.lookup.listRequestTypes(true).then(
        (types) => types.find((t) => t.id === parent.requestTypeId) ?? null,
      ),
    documents: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.document.listByRequest(parent.id),
    attachments: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.attachment.listRequestAttachments(parent.id),
    logs: (parent: { id: string }, _a: unknown, _ctx: GraphQLContext) => parent && [],
  },
};
