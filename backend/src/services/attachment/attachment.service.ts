/**
 * Attachment Service
 *
 * Implements IAttachmentService. Composes the IObjectStoragePort (MinIO) - a
 * NON-transactional side effect: upload to storage FIRST, then persist the
 * row; if persistence fails the orphaned object is deleted (best effort) so
 * storage and the database stay consistent (reconciliation: NFR-15).
 *
 * - FR-10   validate MIME against the whitelist + size limit, compute SHA-256,
 *           upload to MinIO, persist request/document_attachment with uploaded_by
 * - FR-34   inline PDF preview + permitted download via presigned URLs
 * - NFR-06  server-only MinIO credentials; short-lived presigned download URLs
 * - NFR-08  server-computed SHA-256 checksum on every stored object
 *
 * [SOLID:SRP] Upload/download pipeline only - no workflow rules.
 */

import { config } from "../../config/index.js";
import {
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from "../../errors/index.js";
import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type { IObjectStoragePort } from "../../ports/storage.port.interface.js";
import type {
  IAttachmentService,
  UploadRequestAttachmentInput,
  UploadDocumentAttachmentInput,
  DownloadTicket,
} from "../../interfaces/attachment.service.interface.js";
import type {
  RequestAttachmentRecord,
  DocumentAttachmentRecord,
} from "../../interfaces/attachment.repository.interface.js";
import { buildStorageKey, computeSha256 } from "../../utils/index.js";
import { assertPermission } from "../shared/authz.js";

export class AttachmentService implements IAttachmentService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
    private readonly storage: IObjectStoragePort,
  ) {}

  async uploadRequestAttachment(
    actorId: string,
    input: UploadRequestAttachmentInput,
  ): Promise<RequestAttachmentRecord> {
    const started = Date.now();
    this.assertUploadAllowed(input.mimeType, input.body.byteLength);

    const request = await this.db.query(async (uow) => {
      await assertPermission(uow, actorId, "AttachmentService:Upload");
      return uow.requests.findById(input.requestId);
    });
    if (!request) throw new NotFoundError("Request", input.requestId);
    if (request.status === "CLOSED") {
      throw new InvalidStateError(
        `Request ${request.controlNo} is closed (read-only, FR-31).`,
      );
    }

    const checksum = computeSha256(input.body);
    const storageKey = buildStorageKey("requests", input.requestId, input.originalName);
    const stored = await this.storage.uploadObject({
      key: storageKey,
      body: input.body,
      contentType: input.mimeType,
      originalName: input.originalName,
      metadata: { "request-id": input.requestId, kind: input.kind },
    });

    try {
      const record = await this.db.transaction((uow) =>
        uow.requestAttachments.create({
          requestId: input.requestId,
          kind: input.kind,
          storageKey: stored.key,
          bucketName: stored.bucketName,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes: stored.sizeBytes,
          checksum: stored.checksum || checksum,
          uploadedBy: actorId,
        }),
      );
      this.telemetry.trackPerformance("attachment.upload.request", Date.now() - started, {
        requestId: input.requestId,
        sizeBytes: stored.sizeBytes,
      });
      return record;
    } catch (error) {
      await this.rollbackStoredObject(stored.key);
      throw error;
    }
  }

  async uploadDocumentAttachment(
    actorId: string,
    input: UploadDocumentAttachmentInput,
  ): Promise<DocumentAttachmentRecord> {
    const started = Date.now();
    this.assertUploadAllowed(input.mimeType, input.body.byteLength);

    const document = await this.db.query(async (uow) => {
      await assertPermission(uow, actorId, "AttachmentService:Upload");
      return uow.documents.findById(input.documentId);
    });
    if (!document) throw new NotFoundError("Document", input.documentId);
    if (document.requestId) {
      const requestId = document.requestId;
      const request = await this.db.query((uow) => uow.requests.findById(requestId));
      if (request?.status === "CLOSED") {
        throw new InvalidStateError(
          `Request ${request.controlNo} is closed (read-only, FR-31).`,
        );
      }
    }

    const checksum = computeSha256(input.body);
    const storageKey = buildStorageKey("documents", input.documentId, input.originalName);
    const stored = await this.storage.uploadObject({
      key: storageKey,
      body: input.body,
      contentType: input.mimeType,
      originalName: input.originalName,
      metadata: { "document-id": input.documentId, kind: input.kind },
    });

    try {
      const record = await this.db.transaction((uow) =>
        uow.documentAttachments.create({
          documentId: input.documentId,
          kind: input.kind,
          storageKey: stored.key,
          bucketName: stored.bucketName,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes: stored.sizeBytes,
          checksum: stored.checksum || checksum,
          uploadedBy: actorId,
        }),
      );
      this.telemetry.trackPerformance("attachment.upload.document", Date.now() - started, {
        documentId: input.documentId,
        sizeBytes: stored.sizeBytes,
      });
      return record;
    } catch (error) {
      await this.rollbackStoredObject(stored.key);
      throw error;
    }
  }

  async listRequestAttachments(requestId: string): Promise<RequestAttachmentRecord[]> {
    return this.db.query((uow) => uow.requestAttachments.findByRequest(requestId));
  }

  async listDocumentAttachments(documentId: string): Promise<DocumentAttachmentRecord[]> {
    return this.db.query((uow) => uow.documentAttachments.findByDocument(documentId));
  }

  async getRequestAttachmentDownload(
    actorId: string,
    attachmentId: string,
    inline = false,
  ): Promise<DownloadTicket> {
    const attachment = await this.db.query(async (uow) => {
      await assertPermission(uow, actorId, "AttachmentService:Download");
      return uow.requestAttachments.findById(attachmentId);
    });
    if (!attachment) throw new NotFoundError("Request attachment", attachmentId);
    return this.buildTicket(
      attachment.storageKey,
      attachment.originalName,
      attachment.mimeType,
      inline,
    );
  }

  async getDocumentAttachmentDownload(
    actorId: string,
    attachmentId: string,
    inline = false,
  ): Promise<DownloadTicket> {
    const attachment = await this.db.query(async (uow) => {
      await assertPermission(uow, actorId, "AttachmentService:Download");
      return uow.documentAttachments.findById(attachmentId);
    });
    if (!attachment) throw new NotFoundError("Document attachment", attachmentId);
    return this.buildTicket(
      attachment.storageKey,
      attachment.originalName,
      attachment.mimeType,
      inline,
    );
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** FR-10: whitelisted MIME types only, within the configured size limit. */
  private assertUploadAllowed(mimeType: string, sizeBytes: number): void {
    const allowed = config.upload.allowedMime;
    if (!allowed.includes(mimeType)) {
      throw new ValidationError(
        `File type '${mimeType}' is not allowed. Accepted: ${allowed.join(", ")}.`,
      );
    }
    if (sizeBytes <= 0) {
      throw new ValidationError("The uploaded file is empty.");
    }
    if (sizeBytes > config.upload.maxBytes) {
      const maxMb = Math.floor(config.upload.maxBytes / (1024 * 1024));
      throw new ValidationError(`File exceeds the maximum upload size of ${maxMb} MB.`);
    }
  }

  /** Presigned ticket (NFR-06): short-lived, inline or attachment. */
  private async buildTicket(
    storageKey: string,
    fileName: string,
    mimeType: string,
    inline: boolean,
  ): Promise<DownloadTicket> {
    const expiresInSeconds = config.minio.presignExpirySeconds;
    const url = await this.storage.getPresignedDownloadUrl(storageKey, {
      expiresInSeconds,
      fileName,
      inline,
    });
    return { url, expiresInSeconds, fileName, mimeType };
  }

  /** Best-effort cleanup of an object whose database row failed to persist. */
  private async rollbackStoredObject(key: string): Promise<void> {
    try {
      await this.storage.deleteObject(key);
    } catch (error) {
      this.telemetry.trackError(
        error instanceof Error ? error : new Error(String(error)),
        { operation: "attachment.rollback", key },
      );
    }
  }
}
