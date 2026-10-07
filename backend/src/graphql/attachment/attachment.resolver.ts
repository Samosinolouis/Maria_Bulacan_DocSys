/**
 * Attachment Resolvers - uploads are multipart REST routes; GraphQL exposes
 * listing + presigned download tickets (FR-34, NFR-06).
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import type {
  MutationDocumentAttachmentDownloadArgs,
  MutationRequestAttachmentDownloadArgs,
  QueryDocumentAttachmentsArgs,
  QueryRequestAttachmentsArgs,
} from "../../types/graphql.js";

async function toTicket(
  promise: ReturnType<GraphQLContext["services"]["attachment"]["getRequestAttachmentDownload"]>,
) {
  const ticket = await promise;
  return {
    url: ticket.url,
    expiresInSeconds: ticket.expiresInSeconds,
    fileName: ticket.fileName,
    mimeType: ticket.mimeType,
  };
}

export const attachmentResolvers = {
  Query: {
    requestAttachments: (
      _p: unknown,
      { requestId }: QueryRequestAttachmentsArgs,
      ctx: GraphQLContext,
    ) => ctx.services.attachment.listRequestAttachments(requestId),

    documentAttachments: (
      _p: unknown,
      { documentId }: QueryDocumentAttachmentsArgs,
      ctx: GraphQLContext,
    ) => ctx.services.attachment.listDocumentAttachments(documentId),
  },

  Mutation: {
    requestAttachmentDownload: async (
      _p: unknown,
      { id, inline }: MutationRequestAttachmentDownloadArgs,
      ctx: GraphQLContext,
    ) => {
      const actor = requireUser(ctx);
      return toTicket(
        ctx.services.attachment.getRequestAttachmentDownload(actor.sub, id, inline ?? false),
      );
    },

    documentAttachmentDownload: async (
      _p: unknown,
      { id, inline }: MutationDocumentAttachmentDownloadArgs,
      ctx: GraphQLContext,
    ) => {
      const actor = requireUser(ctx);
      return toTicket(
        ctx.services.attachment.getDocumentAttachmentDownload(actor.sub, id, inline ?? false),
      );
    },
  },
};
