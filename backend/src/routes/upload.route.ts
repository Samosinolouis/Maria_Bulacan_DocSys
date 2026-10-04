/**
 * Attachment Upload Routes (non-GraphQL HTTP)
 *
 * Uploads are multipart and therefore live OUTSIDE GraphQL. These routes are
 * the transport layer: they hand bytes to IAttachmentService, which validates
 * the MIME whitelist, computes SHA-256, uploads to B2, and persists the row.
 *
 * [FR-10] whitelisted MIME + size limit + server-computed checksum
 * [NFR-06] B2 credentials stay server-side
 *
 * NOTE: multipart parsing is intentionally NOT wired yet — the handlers throw
 * NotImplementedError until the attachment business logic lands. The contract
 * below is the interface the frontend will call.
 */

import type { FastifyInstance } from "fastify";
import { NotImplementedError } from "../errors/index.js";

export async function registerUploadRoutes(app: FastifyInstance): Promise<void> {
  // POST /uploads/requests/:requestId (multipart: file, kind=INCOMING_LETTER|ANNEX)
  app.post("/uploads/requests/:requestId", async () => {
    throw new NotImplementedError("POST /uploads/requests/:requestId");
  });

  // POST /uploads/documents/:documentId (multipart: file, kind=DRAFT|SIGNED_FINAL|TRANSMISSION_PROOF)
  app.post("/uploads/documents/:documentId", async () => {
    throw new NotImplementedError("POST /uploads/documents/:documentId");
  });
}
