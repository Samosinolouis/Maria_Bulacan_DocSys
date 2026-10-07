/**
 * Attachment contract: upload (multipart REST) and presigned downloads.
 */

import type {
  DocumentAttachment,
  RequestAttachment,
  DocumentAttachmentKind,
  RequestAttachmentKind,
  DownloadTicket,
} from './models';

export interface UploadRequestAttachmentInput {
  requestId: string;
  kind: RequestAttachmentKind;
  /** File selected in the browser. The service streams it as multipart. */
  file: File;
}

export interface UploadDocumentAttachmentInput {
  documentId: string;
  kind: DocumentAttachmentKind;
  file: File;
}

export interface IAttachmentService {
  /** Reads. Action: AttachmentService:Read. */
  listRequestAttachments(requestId: string): Promise<RequestAttachment[]>;
  listDocumentAttachments(documentId: string): Promise<DocumentAttachment[]>;

  /** Upload-only (FR-10). POSTs multipart to `/uploads/requests/:requestId`.
   *  Action: AttachmentService:Upload. */
  uploadRequestAttachment(input: UploadRequestAttachmentInput): Promise<RequestAttachment>;

  /** Same contract for document attachments. Action: AttachmentService:Upload. */
  uploadDocumentAttachment(input: UploadDocumentAttachmentInput): Promise<DocumentAttachment>;

  /** Presigned inline/download tickets (FR-34, NFR-06). Action: AttachmentService:Download. */
  getRequestAttachmentDownload(id: string, inline?: boolean): Promise<DownloadTicket>;
  getDocumentAttachmentDownload(id: string, inline?: boolean): Promise<DownloadTicket>;
}
