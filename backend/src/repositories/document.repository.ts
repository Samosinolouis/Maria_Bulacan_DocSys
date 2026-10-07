/**
 * [B] Document Module - Output Repository Implementations
 *
 * Concrete data-access for document_types, documents, transmissions,
 * and document_logs (append-only).
 */

import { eq, inArray, sql } from "drizzle-orm";

import type { Database } from "../db/index.js";
import {
  documents,
  documentTypes,
  transmissions,
  documentLogs,
} from "../db/schema/index.js";
import { NotFoundError } from "../errors/index.js";
import type {
  IDocumentRepository,
  IDocumentTypeRepository,
  ITransmissionRepository,
  IDocumentLogRepository,
  CreateDocumentData,
  UpdateDocumentData,
  CreateTransmissionData,
  CreateDocumentLogData,
  DocumentRecord,
  DocumentTypeRecord,
  TransmissionRecord,
  DocumentLogRecord,
} from "../interfaces/document.repository.interface.js";
import type { ListOptions } from "../interfaces/common.interface.js";

export class DocumentRepository implements IDocumentRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<DocumentRecord | null> {
    const [row] = await this.tx.select().from(documents).where(eq(documents.id, id)).limit(1);
    return row ?? null;
  }

  async findByIds(ids: string[]): Promise<DocumentRecord[]> {
    if (ids.length === 0) return [];
    return this.tx.select().from(documents).where(inArray(documents.id, ids));
  }

  async findByControlNo(controlNo: string): Promise<DocumentRecord | null> {
    const [row] = await this.tx
      .select()
      .from(documents)
      .where(eq(documents.controlNo, controlNo))
      .limit(1);
    return row ?? null;
  }

  async findByRequest(requestId: string): Promise<DocumentRecord[]> {
    return this.tx.select().from(documents).where(eq(documents.requestId, requestId));
  }

  async findMany(options: ListOptions): Promise<DocumentRecord[]> {
    let query = this.tx.select().from(documents).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async count(options?: Pick<ListOptions, "where">): Promise<number> {
    let query = this.tx
      .select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .$dynamic();
    if (options?.where) query = query.where(options.where);
    const [row] = await query;
    return row?.count ?? 0;
  }

  async countByType(
    where?: ListOptions["where"],
  ): Promise<Array<{ documentTypeId: string; count: number }>> {
    let query = this.tx
      .select({
        documentTypeId: documents.documentTypeId,
        count: sql<number>`count(*)::int`,
      })
      .from(documents)
      .$dynamic();
    if (where) query = query.where(where);
    return query.groupBy(documents.documentTypeId);
  }

  async countByFolder(
    folderIds: string[],
  ): Promise<Array<{ folderId: string; count: number }>> {
    if (folderIds.length === 0) return [];
    const rows = await this.tx
      .select({
        folderId: documents.folderId,
        count: sql<number>`count(*)::int`,
      })
      .from(documents)
      .where(inArray(documents.folderId, folderIds))
      .groupBy(documents.folderId);
    return rows.map((row) => ({ folderId: row.folderId as string, count: row.count }));
  }

  async assignFolderByRequest(requestId: string, folderId: string): Promise<number> {
    const rows = await this.tx
      .update(documents)
      .set({ folderId, updatedAt: new Date() })
      .where(eq(documents.requestId, requestId))
      .returning({ id: documents.id });
    return rows.length;
  }

  async create(data: CreateDocumentData): Promise<DocumentRecord> {
    const [row] = await this.tx
      .insert(documents)
      .values({
        requestId: data.requestId ?? null,
        controlNo: data.controlNo,
        documentTypeId: data.documentTypeId,
        title: data.title,
        assignedTo: data.assignedTo ?? null,
        signatoryRequired: data.signatoryRequired ?? false,
        createdBy: data.createdBy,
      })
      .returning();
    return row;
  }

  async update(id: string, data: UpdateDocumentData): Promise<DocumentRecord> {
    const [row] = await this.tx
      .update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    if (!row) throw new NotFoundError("Document", id);
    return row;
  }
}

export class DocumentTypeRepository implements IDocumentTypeRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<DocumentTypeRecord | null> {
    const [row] = await this.tx
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByCode(code: string): Promise<DocumentTypeRecord | null> {
    const [row] = await this.tx
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.code, code))
      .limit(1);
    return row ?? null;
  }

  async findMany(options: ListOptions): Promise<DocumentTypeRecord[]> {
    let query = this.tx.select().from(documentTypes).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async create(data: {
    code: string;
    name: string;
    description: string;
    prefix: string;
    isActive?: boolean;
  }): Promise<DocumentTypeRecord> {
    const [row] = await this.tx
      .insert(documentTypes)
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        prefix: data.prefix,
        isActive: data.isActive ?? true,
      })
      .returning();
    return row;
  }
}

export class TransmissionRepository implements ITransmissionRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<TransmissionRecord | null> {
    const [row] = await this.tx
      .select()
      .from(transmissions)
      .where(eq(transmissions.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByDocument(documentId: string): Promise<TransmissionRecord[]> {
    return this.tx
      .select()
      .from(transmissions)
      .where(eq(transmissions.documentId, documentId));
  }

  async create(data: CreateTransmissionData): Promise<TransmissionRecord> {
    const [row] = await this.tx
      .insert(transmissions)
      .values({
        documentId: data.documentId,
        recipientName: data.recipientName,
        receivingOffice: data.receivingOffice,
        receivedBy: data.receivedBy,
        method: data.method,
        transmittedAt: data.transmittedAt,
        notes: data.notes ?? null,
        proofAttachmentId: data.proofAttachmentId ?? null,
        createdBy: data.createdBy,
      })
      .returning();
    return row;
  }
}

/**
 * APPEND-ONLY audit repository. No update/delete methods exist by design
 * [NFR-09]; writes must share the transaction of the change they record.
 */
export class DocumentLogRepository implements IDocumentLogRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<DocumentLogRecord | null> {
    const [row] = await this.tx
      .select()
      .from(documentLogs)
      .where(eq(documentLogs.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByRequest(requestId: string): Promise<DocumentLogRecord[]> {
    return this.tx.select().from(documentLogs).where(eq(documentLogs.requestId, requestId));
  }

  async findByDocument(documentId: string): Promise<DocumentLogRecord[]> {
    return this.tx.select().from(documentLogs).where(eq(documentLogs.documentId, documentId));
  }

  async append(data: CreateDocumentLogData): Promise<DocumentLogRecord> {
    const [row] = await this.tx
      .insert(documentLogs)
      .values({
        requestId: data.requestId ?? null,
        documentId: data.documentId ?? null,
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        actionType: data.actionType,
        template: data.template,
        payload: data.payload,
      })
      .returning();
    return row;
  }
}
