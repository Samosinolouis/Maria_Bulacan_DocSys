/**
 * Attachment Service Interface
 *
 * Business-logic abstraction for uploads (upload-only) and secure downloads.
 * Composes the IObjectStoragePort (MinIO) as a NON-transactional side effect.
 *
 * [FR-10] Whitelisted MIME, configured size limit, server-computed SHA-256.
 * [FR-34] Inline PDF preview / download via short-lived presigned URLs.
 * [NFR-06] Credentials never leave the server; downloads are presigned.
 */

import type {
  RequestAttachmentRecord,
  DocumentAttachmentRecord,
} from "./attachment.repository.interface.js";

/** A file received from the client (already buffered by the transport layer). */
export interface UploadFileInput {
  /** Raw bytes as received. */
  body: Buffer | Uint8Array;
  originalName: string;
  mimeType: string;
}

export interface UploadRequestAttachmentInput extends UploadFileInput {
  requestId: string;
  kind: RequestAttachmentRecord["kind"];
}

export interface UploadDocumentAttachmentInput extends UploadFileInput {
  documentId: string;
  kind: DocumentAttachmentRecord["kind"];
}

/** Presigned download descriptor returned to clients. */
export interface DownloadTicket {
  url: string;
  expiresInSeconds: number;
  /** Original filename for Content-Disposition. */
  fileName: string;
  mimeType: string;
}

export interface IAttachmentService {
  uploadRequestAttachment(
    actorId: string,
    input: UploadRequestAttachmentInput,
  ): Promise<RequestAttachmentRecord>;

  uploadDocumentAttachment(
    actorId: string,
    input: UploadDocumentAttachmentInput,
  ): Promise<DocumentAttachmentRecord>;

  listRequestAttachments(requestId: string): Promise<RequestAttachmentRecord[]>;
  listDocumentAttachments(documentId: string): Promise<DocumentAttachmentRecord[]>;

  /** Short-lived presigned URL for a request attachment (FR-34, NFR-06). */
  getRequestAttachmentDownload(
    actorId: string,
    attachmentId: string,
    inline?: boolean,
  ): Promise<DownloadTicket>;

  /** Short-lived presigned URL for a document attachment (FR-34, NFR-06). */
  getDocumentAttachmentDownload(
    actorId: string,
    attachmentId: string,
    inline?: boolean,
  ): Promise<DownloadTicket>;
}
