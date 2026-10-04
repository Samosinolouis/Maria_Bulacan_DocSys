/**
 * Document Repository Interfaces
 *
 * Data-access abstractions for the output side of the document module:
 * document_types, documents, transmissions, document_logs.
 */

import { documents, documentTypes, transmissions, documentLogs } from "../db/schema/index.js";
import type { ListOptions } from "./common.interface.js";

export type DocumentRecord = typeof documents.$inferSelect;
export type DocumentTypeRecord = typeof documentTypes.$inferSelect;
export type TransmissionRecord = typeof transmissions.$inferSelect;
export type DocumentLogRecord = typeof documentLogs.$inferSelect;

export type DocumentStatus = DocumentRecord["status"];
export type TransmissionMethod = TransmissionRecord["method"];
export type DocumentLogAction = DocumentLogRecord["actionType"];

export interface CreateDocumentData {
  requestId?: string | null;
  controlNo: string;
  documentTypeId: string;
  title: string;
  assignedTo?: string | null;
  signatoryRequired?: boolean;
  createdBy: string;
}

export interface UpdateDocumentData {
  title?: string;
  status?: DocumentStatus;
  assignedTo?: string | null;
  signatoryRequired?: boolean;
  signedBy?: string | null;
  signedAt?: Date | null;
  denialReason?: string | null;
  decisionNotes?: string | null;
  decidedBy?: string | null;
  decidedAt?: Date | null;
}

export interface IDocumentRepository {
  findById(id: string): Promise<DocumentRecord | null>;
  findByIds(ids: string[]): Promise<DocumentRecord[]>;
  findByControlNo(controlNo: string): Promise<DocumentRecord | null>;
  findByRequest(requestId: string): Promise<DocumentRecord[]>;
  findMany(options: ListOptions): Promise<DocumentRecord[]>;
  count(options?: Pick<ListOptions, "where">): Promise<number>;
  /** Group counts by document category for monthly/annual reports (FR-36). */
  countByType(where?: ListOptions["where"]): Promise<Array<{ documentTypeId: string; count: number }>>;
  create(data: CreateDocumentData): Promise<DocumentRecord>;
  update(id: string, data: UpdateDocumentData): Promise<DocumentRecord>;
}

export interface IDocumentTypeRepository {
  findById(id: string): Promise<DocumentTypeRecord | null>;
  findByCode(code: string): Promise<DocumentTypeRecord | null>;
  findMany(options: ListOptions): Promise<DocumentTypeRecord[]>;
}

export interface CreateTransmissionData {
  documentId: string;
  recipientName: string;
  receivingOffice: string;
  receivedBy: string;
  method: TransmissionMethod;
  transmittedAt: Date;
  notes?: string | null;
  proofAttachmentId?: string | null;
  createdBy: string;
}

export interface ITransmissionRepository {
  findById(id: string): Promise<TransmissionRecord | null>;
  findByDocument(documentId: string): Promise<TransmissionRecord[]>;
  create(data: CreateTransmissionData): Promise<TransmissionRecord>;
}

export interface CreateDocumentLogData {
  requestId?: string | null;
  documentId?: string | null;
  actorId: string;
  /** SNAPSHOT of actor name at the time of the event. */
  actorName: string;
  /** SNAPSHOT of actor role at the time of the event. */
  actorRole: string;
  actionType: DocumentLogAction;
  template: string;
  payload: Record<string, unknown>;
}

/**
 * APPEND-ONLY audit repository — [NFR-09] no update/delete methods exist by
 * design. Writes MUST share the same transaction as the change they log (FR-39).
 */
export interface IDocumentLogRepository {
  findById(id: string): Promise<DocumentLogRecord | null>;
  findByRequest(requestId: string): Promise<DocumentLogRecord[]>;
  findByDocument(documentId: string): Promise<DocumentLogRecord[]>;
  append(data: CreateDocumentLogData): Promise<DocumentLogRecord>;
}
