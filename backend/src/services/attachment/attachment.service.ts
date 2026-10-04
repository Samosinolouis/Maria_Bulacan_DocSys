/**
 * Attachment Service (SKELETON)
 *
 * Implements IAttachmentService. Business logic not implemented yet.
 * Composes the IObjectStoragePort (B2) — a NON-transactional side effect:
 * upload to storage FIRST, then persist the row (rollback-safe ordering is
 * decided in the implementation; the app NEVER generates file content).
 *
 * Intended responsibilities (when implemented):
 *  - FR-10  validate MIME against the whitelist + size limit, compute SHA-256,
 *           upload to B2, persist request/document_attachment with uploaded_by
 *  - FR-34  inline PDF preview + permitted download via presigned URLs
 *  - NFR-06 server-only B2 credentials; short-lived presigned download URLs
 */

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
import { NotImplementedError } from "../../errors/index.js";

export class AttachmentService implements IAttachmentService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
    private readonly storage: IObjectStoragePort,
  ) {}

  async uploadRequestAttachment(
    _actorId: string,
    _input: UploadRequestAttachmentInput,
  ): Promise<RequestAttachmentRecord> {
    // TODO(FR-10): whitelist+size check -> computeSha256 -> storage.uploadObject
    //   -> requestAttachments.create({ checksum, storageKey, ... }).
    throw new NotImplementedError("AttachmentService.uploadRequestAttachment");
  }

  async uploadDocumentAttachment(
    _actorId: string,
    _input: UploadDocumentAttachmentInput,
  ): Promise<DocumentAttachmentRecord> {
    // TODO(FR-10, FR-19, FR-27, FR-29): same pipeline for DRAFT/SIGNED_FINAL/
    //   TRANSMISSION_PROOF.
    throw new NotImplementedError("AttachmentService.uploadDocumentAttachment");
  }

  async listRequestAttachments(_requestId: string): Promise<RequestAttachmentRecord[]> {
    throw new NotImplementedError("AttachmentService.listRequestAttachments");
  }

  async listDocumentAttachments(_documentId: string): Promise<DocumentAttachmentRecord[]> {
    throw new NotImplementedError("AttachmentService.listDocumentAttachments");
  }

  async getRequestAttachmentDownload(
    _attachmentId: string,
    _inline?: boolean,
  ): Promise<DownloadTicket> {
    // TODO(FR-34, NFR-06): storage.getPresignedDownloadUrl(storageKey).
    throw new NotImplementedError("AttachmentService.getRequestAttachmentDownload");
  }

  async getDocumentAttachmentDownload(
    _attachmentId: string,
    _inline?: boolean,
  ): Promise<DownloadTicket> {
    // TODO(FR-34, NFR-06): storage.getPresignedDownloadUrl(storageKey).
    throw new NotImplementedError("AttachmentService.getDocumentAttachmentDownload");
  }
}
