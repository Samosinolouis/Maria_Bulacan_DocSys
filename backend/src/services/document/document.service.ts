/**
 * Document Service (SKELETON)
 *
 * Implements IDocumentService — output steps of the document lifecycle.
 * Business logic not implemented yet.
 *
 * Intended responsibilities (when implemented):
 *  - FR-16..21  prepare (linked/standalone) with own control number; assign
 *               officer; submit for review sets UNDER_REVIEW + request REVIEW
 *  - FR-22..25  approve / endorse / deny (denial requires written grounds);
 *               record the Mayor signature event
 *  - FR-26..28  transmission records + request -> TRANSMITTED
 *  - FR-29..31  close from APPROVED/ENDORSED/DENIED/TRANSMITTED; read-only
 *  - FR-39      exactly one immutable audit entry per state change, in-tx
 */

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type { INotificationService } from "../../interfaces/notification.service.interface.js";
import type {
  IDocumentService,
  PrepareDocumentInput,
  ReviewDocumentInput,
  SignDocumentInput,
  TransmitDocumentInput,
  CloseRequestInput,
  DocumentFilter,
  DocumentSortField,
} from "../../interfaces/document.service.interface.js";
import type { Connection, ConnectionArgs } from "../../interfaces/common.interface.js";
import type { DocumentRecord } from "../../interfaces/document.repository.interface.js";
import { NotImplementedError } from "../../errors/index.js";

export class DocumentService implements IDocumentService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
    private readonly notifications: INotificationService,
  ) {}

  async getById(_id: string): Promise<DocumentRecord | null> {
    throw new NotImplementedError("DocumentService.getById");
  }

  async getByControlNo(_controlNo: string): Promise<DocumentRecord | null> {
    throw new NotImplementedError("DocumentService.getByControlNo");
  }

  async listByRequest(_requestId: string): Promise<DocumentRecord[]> {
    throw new NotImplementedError("DocumentService.listByRequest");
  }

  async list(
    _args: ConnectionArgs<DocumentFilter, DocumentSortField>,
  ): Promise<Connection<DocumentRecord>> {
    throw new NotImplementedError("DocumentService.list");
  }

  async prepare(_actorId: string, _input: PrepareDocumentInput): Promise<DocumentRecord> {
    // TODO(FR-16..18): controlNumbers.issueNext("DOC:<code>") -> documents.create
    //   -> documentLogs.append(ASSIGNED/DRAFTED).
    throw new NotImplementedError("DocumentService.prepare");
  }

  async submitForReview(_actorId: string, _documentId: string): Promise<DocumentRecord> {
    // TODO(FR-21): document -> UNDER_REVIEW, request -> REVIEW, notify approvers.
    throw new NotImplementedError("DocumentService.submitForReview");
  }

  async review(_actorId: string, _input: ReviewDocumentInput): Promise<DocumentRecord> {
    // TODO(FR-22..25): enforce review permission; DENIED requires denialReason;
    //   notify requesting-side staff (FR-47).
    throw new NotImplementedError("DocumentService.review");
  }

  async sign(_input: SignDocumentInput): Promise<DocumentRecord> {
    // TODO(FR-25): record signatory + signed_at -> SIGNED.
    throw new NotImplementedError("DocumentService.sign");
  }

  async transmit(_actorId: string, _input: TransmitDocumentInput): Promise<DocumentRecord> {
    // TODO(FR-26..28): transmissions.create -> request TRANSMITTED + audit.
    throw new NotImplementedError("DocumentService.transmit");
  }

  async close(_actorId: string, _input: CloseRequestInput): Promise<DocumentRecord> {
    // TODO(FR-29..31): require SIGNED_FINAL attachment; request -> CLOSED (read-only).
    throw new NotImplementedError("DocumentService.close");
  }
}
