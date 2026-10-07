/**
 * Attachment Upload Routes (non-GraphQL HTTP)
 *
 * Uploads are multipart and therefore live OUTSIDE GraphQL. These routes are
 * the transport layer: they authenticate the caller, parse the multipart
 * body, and hand bytes to IAttachmentService, which validates the MIME
 * whitelist, computes SHA-256, uploads to MinIO, and persists the row.
 *
 * - [FR-10]  whitelisted MIME + size limit + server-computed checksum
 * - [NFR-06] MinIO credentials stay server-side
 *
 * Routes:
 *   POST /uploads/requests/:requestId   (file, kind=INCOMING_LETTER|ANNEX)
 *   POST /uploads/documents/:documentId (file, kind=DRAFT|SIGNED_FINAL|TRANSMISSION_PROOF)
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";

import { config } from "../config/index.js";
import { AuthenticationError, ValidationError } from "../errors/index.js";
import type { IAttachmentService } from "../interfaces/attachment.service.interface.js";
import type { IIdentityProviderPort } from "../ports/idp.port.interface.js";

const REQUEST_ATTACHMENT_KINDS = ["INCOMING_LETTER", "ANNEX"] as const;
const DOCUMENT_ATTACHMENT_KINDS = ["DRAFT", "SIGNED_FINAL", "TRANSMISSION_PROOF"] as const;

interface UploadRouteDeps {
  attachmentService: IAttachmentService;
  idp: IIdentityProviderPort;
}

interface ParsedUpload {
  kind: string;
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
}

/** Verify the Bearer token via the identity port and return the actor id. */
async function requireActor(
  request: FastifyRequest,
  idp: IIdentityProviderPort,
): Promise<string> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthenticationError();
  }
  const user = await idp.verifyToken(authHeader.slice(7));
  return user.sub;
}

/** Parse one file + one `kind` field from a multipart request. */
async function readSingleUpload(
  request: FastifyRequest,
  allowedKinds: readonly string[],
): Promise<ParsedUpload> {
  if (!request.isMultipart()) {
    throw new ValidationError("Content-Type must be multipart/form-data.");
  }

  let kind: string | null = null;
  let file: ParsedUpload["file"] | null = null;

  for await (const part of request.parts()) {
    if (part.type === "field") {
      if (part.fieldname === "kind") {
        kind = String(part.value);
      }
      continue;
    }

    if (part.type === "file") {
      if (file) {
        // Only the first file is accepted; drain the rest so the request ends.
        await part.toBuffer();
        continue;
      }
      file = {
        buffer: await part.toBuffer(),
        filename: part.filename,
        mimetype: part.mimetype,
      };
    }
  }

  if (!file) {
    throw new ValidationError("A file is required (multipart field 'file').");
  }
  if (!kind) {
    throw new ValidationError(
      `A 'kind' field is required (one of: ${allowedKinds.join(", ")}).`,
    );
  }
  if (!allowedKinds.includes(kind)) {
    throw new ValidationError(
      `Invalid kind '${kind}'. Allowed values: ${allowedKinds.join(", ")}.`,
    );
  }

  return { kind, file };
}

export async function registerUploadRoutes(
  app: FastifyInstance,
  deps: UploadRouteDeps,
): Promise<void> {
  await app.register(multipart, {
    limits: {
      fileSize: config.upload.maxBytes,
      files: 1,
      fields: 4,
    },
  });

  // POST /uploads/requests/:requestId (multipart: file, kind=INCOMING_LETTER|ANNEX)
  app.post("/uploads/requests/:requestId", async (request, reply) => {
    const actorId = await requireActor(request, deps.idp);
    const { requestId } = request.params as { requestId: string };
    const { kind, file } = await readSingleUpload(request, REQUEST_ATTACHMENT_KINDS);

    const attachment = await deps.attachmentService.uploadRequestAttachment(actorId, {
      requestId,
      kind: kind as (typeof REQUEST_ATTACHMENT_KINDS)[number],
      body: file.buffer,
      originalName: file.filename,
      mimeType: file.mimetype,
    });

    return reply.status(201).send(attachment);
  });

  // POST /uploads/documents/:documentId (multipart: file, kind=DRAFT|SIGNED_FINAL|TRANSMISSION_PROOF)
  app.post("/uploads/documents/:documentId", async (request, reply) => {
    const actorId = await requireActor(request, deps.idp);
    const { documentId } = request.params as { documentId: string };
    const { kind, file } = await readSingleUpload(request, DOCUMENT_ATTACHMENT_KINDS);

    const attachment = await deps.attachmentService.uploadDocumentAttachment(actorId, {
      documentId,
      kind: kind as (typeof DOCUMENT_ATTACHMENT_KINDS)[number],
      body: file.buffer,
      originalName: file.filename,
      mimeType: file.mimetype,
    });

    return reply.status(201).send(attachment);
  });
}
