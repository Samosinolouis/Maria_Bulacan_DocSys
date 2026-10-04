/**
 * [B] Document Module — Attachment Repository Implementations
 *
 * Concrete data-access for request_attachments and document_attachments.
 * All writes are upload-only rows (checksum + storage_key pre-computed).
 */

import { eq } from "drizzle-orm";

import type { Database } from "../db/index.js";
import { requestAttachments, documentAttachments } from "../db/schema/index.js";
import type {
  IRequestAttachmentRepository,
  IDocumentAttachmentRepository,
  CreateRequestAttachmentData,
  CreateDocumentAttachmentData,
  RequestAttachmentRecord,
  DocumentAttachmentRecord,
} from "../interfaces/attachment.repository.interface.js";

export class RequestAttachmentRepository implements IRequestAttachmentRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<RequestAttachmentRecord | null> {
    const [row] = await this.tx
      .select()
      .from(requestAttachments)
      .where(eq(requestAttachments.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByRequest(requestId: string): Promise<RequestAttachmentRecord[]> {
    return this.tx
      .select()
      .from(requestAttachments)
      .where(eq(requestAttachments.requestId, requestId));
  }

  async create(data: CreateRequestAttachmentData): Promise<RequestAttachmentRecord> {
    const [row] = await this.tx
      .insert(requestAttachments)
      .values({
        requestId: data.requestId,
        kind: data.kind,
        storageKey: data.storageKey,
        bucketName: data.bucketName,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        checksum: data.checksum,
        uploadedBy: data.uploadedBy,
      })
      .returning();
    return row;
  }
}

export class DocumentAttachmentRepository implements IDocumentAttachmentRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<DocumentAttachmentRecord | null> {
    const [row] = await this.tx
      .select()
      .from(documentAttachments)
      .where(eq(documentAttachments.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByDocument(documentId: string): Promise<DocumentAttachmentRecord[]> {
    return this.tx
      .select()
      .from(documentAttachments)
      .where(eq(documentAttachments.documentId, documentId));
  }

  async create(data: CreateDocumentAttachmentData): Promise<DocumentAttachmentRecord> {
    const [row] = await this.tx
      .insert(documentAttachments)
      .values({
        documentId: data.documentId,
        kind: data.kind,
        storageKey: data.storageKey,
        bucketName: data.bucketName,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        checksum: data.checksum,
        uploadedBy: data.uploadedBy,
      })
      .returning();
    return row;
  }
}
