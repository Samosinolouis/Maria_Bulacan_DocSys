/**
 * Document Resolvers - delegate to ctx.services.document (Steps 3-6).
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs } from "../helpers.js";
import type { DocumentFilter, DocumentSortField } from "../../interfaces/document.service.interface.js";
import type {
  MutationCloseRequestArgs,
  MutationPrepareDocumentArgs,
  MutationReviewDocumentArgs,
  MutationSignDocumentArgs,
  MutationSubmitDocumentForReviewArgs,
  MutationTransmitDocumentArgs,
  QueryDocumentArgs,
  QueryDocumentByControlNoArgs,
  QueryDocumentsArgs,
  QueryDocumentTypesArgs,
} from "../../types/graphql.js";

export const documentResolvers = {
  Query: {
    document: (_p: unknown, { id }: QueryDocumentArgs, ctx: GraphQLContext) =>
      ctx.services.document.getById(id),

    documentByControlNo: (
      _p: unknown,
      { controlNo }: QueryDocumentByControlNoArgs,
      ctx: GraphQLContext,
    ) => ctx.services.document.getByControlNo(controlNo),

    documents: (_p: unknown, args: QueryDocumentsArgs, ctx: GraphQLContext) =>
      ctx.services.document.list(toConnectionArgs<DocumentFilter, DocumentSortField>(args)),

    documentTypes: (
      _p: unknown,
      { includeInactive }: QueryDocumentTypesArgs,
      ctx: GraphQLContext,
    ) => ctx.services.lookup.listDocumentTypes(includeInactive ?? false),
  },

  Mutation: {
    prepareDocument: async (_p: unknown, { input }: MutationPrepareDocumentArgs, ctx: GraphQLContext) => {
      const document = await ctx.services.document.prepare(requireUser(ctx).sub, input);
      return {
        changedEntities: ['Document', 'DashboardMetrics', `Document_${document.id}`],
        document,
      };
    },

    submitDocumentForReview: async (
      _p: unknown,
      { id }: MutationSubmitDocumentForReviewArgs,
      ctx: GraphQLContext,
    ) => {
      const document = await ctx.services.document.submitForReview(requireUser(ctx).sub, id);
      return {
        changedEntities: ['Document', 'Request', 'DashboardMetrics', `Document_${document.id}`],
        document,
      };
    },

    reviewDocument: async (_p: unknown, { input }: MutationReviewDocumentArgs, ctx: GraphQLContext) => {
      const document = await ctx.services.document.review(requireUser(ctx).sub, input);
      return {
        changedEntities: ['Document', 'Request', 'DashboardMetrics', `Document_${document.id}`],
        document,
      };
    },

    signDocument: async (_p: unknown, { input }: MutationSignDocumentArgs, ctx: GraphQLContext) => {
      const document = await ctx.services.document.sign(requireUser(ctx).sub, input);
      return {
        changedEntities: ['Document', 'Request', 'DashboardMetrics', `Document_${document.id}`],
        document,
      };
    },

    transmitDocument: async (_p: unknown, { input }: MutationTransmitDocumentArgs, ctx: GraphQLContext) => {
      const document = await ctx.services.document.transmit(requireUser(ctx).sub, input);
      return {
        changedEntities: ['Document', 'Request', 'DashboardMetrics', `Document_${document.id}`],
        document,
      };
    },

    closeRequest: async (_p: unknown, { input }: MutationCloseRequestArgs, ctx: GraphQLContext) => {
      const document = await ctx.services.document.close(requireUser(ctx).sub, input);
      return {
        changedEntities: ['Document', 'Request', 'Folder', 'DashboardMetrics'],
        document,
      };
    },
  },

  Document: {
    documentType: (
      parent: { documentTypeId: string },
      _a: unknown,
      ctx: GraphQLContext,
    ) =>
      ctx.services.lookup.listDocumentTypes(true).then(
        (types) => types.find((t) => t.id === parent.documentTypeId) ?? null,
      ),
    attachments: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.attachment.listDocumentAttachments(parent.id),
    transmissions: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.document.listTransmissions(parent.id),
    logs: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.document.listLogsByDocument(parent.id),
  },
};
