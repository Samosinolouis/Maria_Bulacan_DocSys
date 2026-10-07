/**
 * Request Resolvers - delegate to ctx.services.request (Steps 1-2).
 * Relation fields (documents/attachments/logs) are resolved lazily.
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs } from "../helpers.js";
import type { RequestFilter, RequestSortField } from "../../interfaces/request.service.interface.js";
import type {
  MutationEncodeRequestArgs,
  MutationResubmitRequestArgs,
  MutationScreenRequestArgs,
  QueryRequestArgs,
  QueryRequestByControlNoArgs,
  QueryRequestsArgs,
  QueryRequestTypesArgs,
} from "../../types/graphql.js";

export const requestResolvers = {
  Query: {
    request: (_p: unknown, { id }: QueryRequestArgs, ctx: GraphQLContext) =>
      ctx.services.request.getById(id),

    requestByControlNo: (
      _p: unknown,
      { controlNo }: QueryRequestByControlNoArgs,
      ctx: GraphQLContext,
    ) => ctx.services.request.getByControlNo(controlNo),

    requests: (_p: unknown, args: QueryRequestsArgs, ctx: GraphQLContext) =>
      ctx.services.request.list(toConnectionArgs<RequestFilter, RequestSortField>(args)),

    requestTypes: (_p: unknown, { includeInactive }: QueryRequestTypesArgs, ctx: GraphQLContext) =>
      ctx.services.lookup.listRequestTypes(includeInactive ?? false),
  },

  Mutation: {
    encodeRequest: (_p: unknown, { input }: MutationEncodeRequestArgs, ctx: GraphQLContext) =>
      ctx.services.request.encode(requireUser(ctx).sub, input),

    screenRequest: (_p: unknown, { input }: MutationScreenRequestArgs, ctx: GraphQLContext) =>
      ctx.services.request.screen(requireUser(ctx).sub, input),

    resubmitRequest: (_p: unknown, { id }: MutationResubmitRequestArgs, ctx: GraphQLContext) =>
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
    logs: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.document.listLogsByRequest(parent.id),
  },
};
