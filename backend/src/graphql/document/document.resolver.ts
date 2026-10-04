/**
 * Document Resolvers — delegate to ctx.services.document (Steps 3-6).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs, type ListArgs } from "../helpers.js";
import type { DocumentFilter, DocumentSortField } from "../../interfaces/document.service.interface.js";

export const documentResolvers = {
  Query: {
    document: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.document.getById(id),

    documentByControlNo: (
      _p: unknown,
      { controlNo }: { controlNo: string },
      ctx: GraphQLContext,
    ) => ctx.services.document.getByControlNo(controlNo),

    documents: (_p: unknown, args: ListArgs, ctx: GraphQLContext) =>
      ctx.services.document.list(toConnectionArgs<DocumentFilter, DocumentSortField>(args)),

    documentTypes: (
      _p: unknown,
      { includeInactive }: { includeInactive?: boolean },
      ctx: GraphQLContext,
    ) => ctx.services.lookup.listDocumentTypes(includeInactive ?? false),
  },

  Mutation: {
    prepareDocument: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.document.prepare(requireUser(ctx).sub, input),

    submitDocumentForReview: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.document.submitForReview(requireUser(ctx).sub, id),

    reviewDocument: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.document.review(requireUser(ctx).sub, input),

    signDocument: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.document.sign(input),

    transmitDocument: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.document.transmit(requireUser(ctx).sub, input),

    closeRequest: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.document.close(requireUser(ctx).sub, input),
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
    // TODO: expose transmissions/logs via dedicated (paginated) queries.
    transmissions: () => [],
    logs: () => [],
  },
};
