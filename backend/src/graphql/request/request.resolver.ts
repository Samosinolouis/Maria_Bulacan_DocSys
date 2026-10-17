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
    encodeRequest: async (_p: unknown, { input }: MutationEncodeRequestArgs, ctx: GraphQLContext) => {
      const request = await ctx.services.request.encode(requireUser(ctx).sub, input);
      return {
        changedEntities: ['Request', 'DashboardMetrics', `Request_${request.id}`],
        request,
      };
    },

    screenRequest: async (_p: unknown, { input }: MutationScreenRequestArgs, ctx: GraphQLContext) => {
      const request = await ctx.services.request.screen(requireUser(ctx).sub, input);
      return {
        changedEntities: ['Request', 'DashboardMetrics', `Request_${request.id}`],
        request,
      };
    },

    resubmitRequest: async (_p: unknown, { id }: MutationResubmitRequestArgs, ctx: GraphQLContext) => {
      const request = await ctx.services.request.resubmit(requireUser(ctx).sub, id);
      return {
        changedEntities: ['Request', 'DashboardMetrics', `Request_${request.id}`],
        request,
      };
    },
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
