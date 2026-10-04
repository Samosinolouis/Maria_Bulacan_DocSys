/**
 * Document Service Interface
 *
 * Business-logic abstraction for the output steps of the document lifecycle:
 * preparation (Step 3), review & approval (Step 4), transmission (Step 5),
 * and completion & archiving (Step 6).
 */

import type { DocumentRecord } from "./document.repository.interface.js";
import type { Connection, ConnectionArgs } from "./common.interface.js";

export type DocumentStatus = DocumentRecord["status"];

/** Step 3 — create an output document, linked or standalone (FR-16..18). */
export interface PrepareDocumentInput {
  /** NULL = issued without request (sua sponte EO / MO). */
  requestId?: string | null;
  documentTypeId: string;
  title: string;
  /** Drafting officer. */
  assignedTo?: string | null;
  signatoryRequired?: boolean;
}

/** Step 4 — approve / endorse / deny (FR-22..25). */
export type ReviewDecision = "APPROVED" | "ENDORSED" | "DENIED";

export interface ReviewDocumentInput {
  documentId: string;
  decision: ReviewDecision;
  /** Mandatory written grounds when DENIED (FR-23). */
  denialReason?: string | null;
  decisionNotes?: string | null;
  /** Whether the Mayor's signature is required before transmission. */
  signatoryRequired?: boolean;
}

/** Step 4 — record the Mayor signature event (FR-25). */
export interface SignDocumentInput {
  documentId: string;
  signedBy: string;
  signedAt?: Date | null;
}

/** Step 5 — record a transmission (FR-26..28). */
export interface TransmitDocumentInput {
  documentId: string;
  recipientName: string;
  receivingOffice: string;
  receivedBy: string;
  method: "PICKUP" | "COURIER" | "EMAIL";
  transmittedAt?: Date | null;
  notes?: string | null;
  /** Scanned signed receipt (document_attachment id). */
  proofAttachmentId?: string | null;
}

/** Step 6 — close the request as read-only (FR-29..31). */
export interface CloseRequestInput {
  requestId: string;
  /** Final signed copy must be uploaded before closing (FR-29). */
  finalAttachmentId?: string | null;
  notes?: string | null;
}

export interface DocumentFilter {
  status?: DocumentStatus | null;
  documentTypeId?: string | null;
  requestId?: string | null;
  assignedTo?: string | null;
}

export type DocumentSortField = "CREATED_AT" | "CONTROL_NO" | "TITLE" | "STATUS";

export interface IDocumentService {
  getById(id: string): Promise<DocumentRecord | null>;
  getByControlNo(controlNo: string): Promise<DocumentRecord | null>;
  listByRequest(requestId: string): Promise<DocumentRecord[]>;
  list(args: ConnectionArgs<DocumentFilter, DocumentSortField>): Promise<Connection<DocumentRecord>>;

  prepare(actorId: string, input: PrepareDocumentInput): Promise<DocumentRecord>;
  /** Submit a draft for review: document UNDER_REVIEW + request REVIEW (FR-21). */
  submitForReview(actorId: string, documentId: string): Promise<DocumentRecord>;
  review(actorId: string, input: ReviewDocumentInput): Promise<DocumentRecord>;
  sign(input: SignDocumentInput): Promise<DocumentRecord>;
  transmit(actorId: string, input: TransmitDocumentInput): Promise<DocumentRecord>;
  close(actorId: string, input: CloseRequestInput): Promise<DocumentRecord>;
}
