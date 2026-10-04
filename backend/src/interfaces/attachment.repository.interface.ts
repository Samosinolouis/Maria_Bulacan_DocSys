/**
 * Attachment Repository Interfaces
 *
 * Data-access abstractions for uploaded files (upload-only):
 * request_attachments, document_attachments.
 * The checksum + storage_key are computed/derived BEFORE the row is created.
 */

import { requestAttachments, documentAttachments } from "../db/schema/index.js";

export type RequestAttachmentRecord = typeof requestAttachments.$inferSelect;
export type DocumentAttachmentRecord = typeof documentAttachments.$inferSelect;

export interface CreateRequestAttachmentData {
  requestId: string;
  kind: RequestAttachmentRecord["kind"];
  storageKey: string;
  bucketName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  /** Server-computed SHA-256 (hex). */
  checksum: string;
  uploadedBy: string;
}

export interface CreateDocumentAttachmentData {
  documentId: string;
  kind: DocumentAttachmentRecord["kind"];
  storageKey: string;
  bucketName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  /** Server-computed SHA-256 (hex). */
  checksum: string;
  uploadedBy: string;
}

export interface IRequestAttachmentRepository {
  findById(id: string): Promise<RequestAttachmentRecord | null>;
  findByRequest(requestId: string): Promise<RequestAttachmentRecord[]>;
  create(data: CreateRequestAttachmentData): Promise<RequestAttachmentRecord>;
}

export interface IDocumentAttachmentRepository {
  findById(id: string): Promise<DocumentAttachmentRecord | null>;
  findByDocument(documentId: string): Promise<DocumentAttachmentRecord[]>;
  create(data: CreateDocumentAttachmentData): Promise<DocumentAttachmentRecord>;
}
