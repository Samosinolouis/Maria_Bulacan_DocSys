/**
 * Attachment Resolvers — uploads are multipart REST routes; GraphQL exposes
 * listing + presigned download tickets (FR-34, NFR-06).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";

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
    requestAttachments: (_p: unknown, { requestId }: { requestId: string }, ctx: GraphQLContext) =>
      ctx.services.attachment.listRequestAttachments(requestId),

    documentAttachments: (
      _p: unknown,
      { documentId }: { documentId: string },
      ctx: GraphQLContext,
    ) => ctx.services.attachment.listDocumentAttachments(documentId),
  },

  Mutation: {
    requestAttachmentDownload: async (
      _p: unknown,
      { id, inline }: { id: string; inline?: boolean },
      ctx: GraphQLContext,
    ) => {
      requireUser(ctx);
      return toTicket(ctx.services.attachment.getRequestAttachmentDownload(id, inline ?? false));
    },

    documentAttachmentDownload: async (
      _p: unknown,
      { id, inline }: { id: string; inline?: boolean },
      ctx: GraphQLContext,
    ) => {
      requireUser(ctx);
      return toTicket(ctx.services.attachment.getDocumentAttachmentDownload(id, inline ?? false));
    },
  },
};
