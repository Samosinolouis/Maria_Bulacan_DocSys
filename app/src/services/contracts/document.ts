/**
 * Document aggregate contract (Steps 3-6).
 */

import type { Connection, ConnectionArgs, ISODateTime } from './common';
import type {
  Document,
  DocumentType,
  DocumentStatus,
  ReviewDecision,
  TransmissionMethod,
  DocumentSortField,
} from './models';

export interface PrepareDocumentInput {
  /** Omit for a standalone issuance (EO / MO). */
  requestId?: string | null;
  documentTypeId: string;
  title: string;
  assignedTo?: string | null;
  signatoryRequired?: boolean;
}

export interface ReviewDocumentInput {
  documentId: string;
  decision: ReviewDecision;
  /** Mandatory when decision = DENIED (FR-23). */
  denialReason?: string | null;
  decisionNotes?: string | null;
  signatoryRequired?: boolean;
}

export interface SignDocumentInput {
  documentId: string;
  signedBy: string;
  signedAt?: ISODateTime | null;
}

export interface TransmitDocumentInput {
  documentId: string;
  recipientName: string;
  receivingOffice: string;
  receivedBy: string;
  method: TransmissionMethod;
  transmittedAt?: ISODateTime | null;
  notes?: string | null;
  proofAttachmentId?: string | null;
}

export interface CloseRequestInput {
  requestId: string;
  /** SIGNED_FINAL attachment id, required before closing (FR-29). */
  finalAttachmentId?: string | null;
  /** Optional archive folder; every document of the request is filed into it. */
  folderId?: string | null;
  notes?: string | null;
}

export interface DocumentFilter {
  status?: DocumentStatus | null;
  documentTypeId?: string | null;
  requestId?: string | null;
  assignedTo?: string | null;
  /** Documents filed into an archive folder. */
  folderId?: string | null;
}

export interface IDocumentService {
  /** Reads. Action: DocumentService:Read. */
  getById(id: string): Promise<Document | null>;
  getByControlNo(controlNo: string): Promise<Document | null>;
  list(args: ConnectionArgs<DocumentFilter, DocumentSortField>): Promise<Connection<Document>>;
  /**
   * Dispatch desk read: the same connection as `list`, with each row carrying
   * its transmission records, so the desk can show only what still awaits
   * dispatch (FR-26..28). Action: DocumentService:Read.
   */
  listForDispatch(
    args: ConnectionArgs<DocumentFilter, DocumentSortField>,
  ): Promise<Connection<Document>>;
  listByRequest(requestId: string): Promise<Document[]>;
  listTypes(includeInactive?: boolean): Promise<DocumentType[]>;

  /** Step 3: create an output document (FR-16..18). Action: DocumentService:Prepare
   *  (DocumentService:CreateStandalone when requestId is omitted). */
  prepare(input: PrepareDocumentInput): Promise<Document>;

  /** Submit a draft for review (FR-21). Action: DocumentService:Prepare. */
  submitForReview(documentId: string): Promise<Document>;

  /** Step 4: approve / endorse / deny (FR-22..24). Action: DocumentService:Review. */
  review(input: ReviewDocumentInput): Promise<Document>;

  /** Step 4: record the Mayor signature event (FR-25). Action: DocumentService:Sign. */
  sign(input: SignDocumentInput): Promise<Document>;

  /** Step 5: record a transmission (FR-26..28). Action: DocumentService:Transmit. */
  transmit(input: TransmitDocumentInput): Promise<Document>;

  /** Step 6: close the request (FR-29..31). Action: DocumentService:Close. */
  close(input: CloseRequestInput): Promise<Document>;
}
