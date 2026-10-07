/**
 * Document Service
 *
 * Implements IDocumentService - output steps of the document lifecycle:
 * preparation (Step 3), review & approval (Step 4), transmission (Step 5),
 * and completion & archiving (Step 6).
 *
 * - FR-16..21  prepare (linked/standalone) with its own control number;
 *              assign the drafting officer; submit for review sets
 *              UNDER_REVIEW + request REVIEW
 * - FR-22..25  approve / endorse / deny (denial requires written grounds);
 *              record the Mayor signature event
 * - FR-26..28  transmission records + request -> TRANSMITTED
 * - FR-29..31  close from APPROVED/ENDORSED/DENIED/TRANSMITTED; read-only
 * - FR-39      exactly one immutable audit entry per state change, in-tx
 * - FR-47      workflow notifications (submitted-for-review, decisions)
 *
 * [SOLID:SRP] Business rules only - no DB or HTTP concerns.
 * [SOLID:DIP] Depends on IDatabase / IRepositories abstractions.
 */

import { and, asc, desc, eq, or, sql, type SQL } from "drizzle-orm";

import { documents, requests } from "../../db/schema/index.js";
import {
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from "../../errors/index.js";
import type { IDatabase, IRepositories } from "../../interfaces/uow.interface.js";
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
import type {
  Connection,
  ConnectionArgs,
  SortDirection,
} from "../../interfaces/common.interface.js";
import type {
  DocumentRecord,
  DocumentLogRecord,
  TransmissionRecord,
} from "../../interfaces/document.repository.interface.js";
import type { DocumentAttachmentRecord } from "../../interfaces/attachment.repository.interface.js";
import type { FolderRecord } from "../../interfaces/folder.repository.interface.js";
import type { RequestRecord } from "../../interfaces/request.repository.interface.js";
import { ilikePattern, resolveWindow, toConnection } from "../shared/query.js";
import { assertPermission } from "../shared/authz.js";
import {
  dedupeIds,
  findUserIdsWithPermission,
  loadActorSnapshot,
  notifySafely,
} from "../shared/workflow.js";

/** Documents can be transmitted only from these statuses (FR-26..28). */
const TRANSMITTABLE_STATUSES = ["APPROVED", "ENDORSED", "SIGNED"] as const;

/** A request is closable from these statuses (FR-30). */
const CLOSABLE_REQUEST_STATUSES = ["APPROVED", "ENDORSED", "DENIED", "TRANSMITTED"] as const;

export class DocumentService implements IDocumentService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
    private readonly notifications: INotificationService,
  ) {}

  // ------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------

  async getById(id: string): Promise<DocumentRecord | null> {
    return this.db.query((uow) => uow.documents.findById(id));
  }

  async getByControlNo(controlNo: string): Promise<DocumentRecord | null> {
    return this.db.query((uow) => uow.documents.findByControlNo(controlNo));
  }

  async listByRequest(requestId: string): Promise<DocumentRecord[]> {
    return this.db.query((uow) => uow.documents.findByRequest(requestId));
  }

  async list(
    args: ConnectionArgs<DocumentFilter, DocumentSortField>,
  ): Promise<Connection<DocumentRecord>> {
    const { first, offset } = resolveWindow(args);
    const where = and(
      this.buildFilterWhere(args.filter),
      this.buildSearchWhere(args.search),
    );

    return this.db.query(async (uow) => {
      const [rows, totalCount] = await Promise.all([
        uow.documents.findMany({
          limit: first + 1,
          offset,
          where,
          orderBy: this.orderBy(args.sort),
        }),
        uow.documents.count({ where }),
      ]);
      return toConnection({ rows, first, offset, totalCount });
    });
  }

  /** Append-only audit trail for a request, newest-first (FR-39, FR-40). */
  async listLogsByRequest(requestId: string): Promise<DocumentLogRecord[]> {
    return this.db.query(async (uow) => {
      const rows = await uow.documentLogs.findByRequest(requestId);
      return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  /** Append-only audit trail for a document, newest-first (FR-39, FR-40). */
  async listLogsByDocument(documentId: string): Promise<DocumentLogRecord[]> {
    return this.db.query(async (uow) => {
      const rows = await uow.documentLogs.findByDocument(documentId);
      return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  /** Dispatch records for a document (FR-26; multiple allowed). */
  async listTransmissions(documentId: string): Promise<TransmissionRecord[]> {
    return this.db.query(async (uow) => {
      const rows = await uow.transmissions.findByDocument(documentId);
      return rows.sort((a, b) => b.transmittedAt.getTime() - a.transmittedAt.getTime());
    });
  }

  // ------------------------------------------------------------------
  // Step 3 - Preparation (FR-16..21)
  // ------------------------------------------------------------------

  async prepare(actorId: string, input: PrepareDocumentInput): Promise<DocumentRecord> {
    const title = input.title?.trim();
    if (!title) throw new ValidationError("Title is required.");

    const year = new Date().getFullYear();
    const started = Date.now();

    const created = await this.db.transaction(async (uow) => {
      await assertPermission(
        uow,
        actorId,
        input.requestId ? "DocumentService:Prepare" : "DocumentService:CreateStandalone",
      );

      const documentType = await uow.documentTypes.findById(input.documentTypeId);
      if (!documentType) throw new NotFoundError("Document type", input.documentTypeId);
      if (!documentType.isActive) {
        throw new InvalidStateError(`Document type '${documentType.name}' is inactive.`);
      }

      let request: RequestRecord | null = null;
      if (input.requestId) {
        request = await uow.requests.findById(input.requestId);
        if (!request) throw new NotFoundError("Request", input.requestId);
        if (request.status === "CLOSED") {
          throw new InvalidStateError(
            `Request ${request.controlNo} is closed (read-only, FR-31).`,
          );
        }
      }

      const actor = await loadActorSnapshot(uow, actorId);
      const controlNo = await uow.controlNumbers.issueNext(
        `DOC:${documentType.code}`,
        year,
        documentType.prefix,
      );

      const document = await uow.documents.create({
        requestId: input.requestId ?? null,
        controlNo,
        documentTypeId: documentType.id,
        title,
        assignedTo: input.assignedTo ?? actorId,
        signatoryRequired: input.signatoryRequired ?? false,
        createdBy: actorId,
      });

      await uow.documentLogs.append({
        requestId: request?.id ?? null,
        documentId: document.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "ASSIGNED",
        template: request
          ? "Output document ${payload.control_no} (${payload.document_type}) created for request ${payload.request_control_no}; assigned to the drafting officer."
          : "Standalone issuance ${payload.control_no} (${payload.document_type}) created.",
        payload: {
          control_no: controlNo,
          document_type: documentType.name,
          request_control_no: request?.controlNo ?? null,
          assigned_to: input.assignedTo ?? actorId,
          signatory_required: input.signatoryRequired ?? false,
        },
      });

      return document;
    });

    this.telemetry.trackPerformance("document.prepare", Date.now() - started, {
      controlNo: created.controlNo,
    });
    return created;
  }

  async submitForReview(actorId: string, documentId: string): Promise<DocumentRecord> {
    const result = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "DocumentService:Prepare");

      const document = await uow.documents.findById(documentId);
      if (!document) throw new NotFoundError("Document", documentId);
      if (document.status !== "DRAFTING") {
        throw new InvalidStateError(
          `Only drafts can be submitted for review (status: ${document.status}).`,
        );
      }

      const request = document.requestId
        ? await uow.requests.findById(document.requestId)
        : null;
      if (request?.status === "CLOSED") {
        throw new InvalidStateError(
          `Request ${request.controlNo} is closed (read-only, FR-31).`,
        );
      }

      const actor = await loadActorSnapshot(uow, actorId);
      const updated = await uow.documents.update(document.id, { status: "UNDER_REVIEW" });
      if (request) {
        await uow.requests.update(request.id, { status: "REVIEW" });
      }

      await uow.documentLogs.append({
        requestId: request?.id ?? null,
        documentId: document.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "SUBMITTED_REVIEW",
        template: "Draft ${payload.control_no} submitted for review.",
        payload: {
          control_no: document.controlNo,
          request_control_no: request?.controlNo ?? null,
        },
      });

      const approverIds = await findUserIdsWithPermission(uow, "DocumentService:Review");
      return { updated, document, request, approverIds };
    });

    // FR-47: notify approvers after the state change is committed.
    await notifySafely(this.telemetry, this.notifications, {
      userIds: dedupeIds(result.approverIds).filter((id) => id !== actorId),
      type: "SUBMITTED_FOR_REVIEW",
      title: `Draft ${result.document.controlNo} is awaiting review`,
      payload: {
        control_no: result.document.controlNo,
        title: result.document.title,
        request_control_no: result.request?.controlNo ?? null,
      },
      template: "Draft ${payload.control_no} (${payload.title}) is awaiting your review.",
      documentId: result.document.id,
      requestId: result.request?.id ?? null,
    });

    return result.updated;
  }

  // ------------------------------------------------------------------
  // Step 4 - Review & approval (FR-22..25)
  // ------------------------------------------------------------------

  async review(actorId: string, input: ReviewDocumentInput): Promise<DocumentRecord> {
    const denialReason = input.denialReason?.trim() ?? "";
    if (input.decision === "DENIED" && !denialReason) {
      throw new ValidationError("A denial must state written grounds (FR-23).");
    }

    const result = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "DocumentService:Review");

      const document = await uow.documents.findById(input.documentId);
      if (!document) throw new NotFoundError("Document", input.documentId);
      if (document.status !== "UNDER_REVIEW") {
        throw new InvalidStateError(
          `Only documents under review can be decided (status: ${document.status}).`,
        );
      }

      const request = document.requestId
        ? await uow.requests.findById(document.requestId)
        : null;
      if (request?.status === "CLOSED") {
        throw new InvalidStateError(
          `Request ${request.controlNo} is closed (read-only, FR-31).`,
        );
      }

      const actor = await loadActorSnapshot(uow, actorId);
      const decidedAt = new Date();
      const updated = await uow.documents.update(document.id, {
        status: input.decision,
        decidedBy: actorId,
        decidedAt,
        denialReason: input.decision === "DENIED" ? denialReason : document.denialReason,
        decisionNotes: input.decisionNotes ?? document.decisionNotes,
        signatoryRequired: input.signatoryRequired ?? document.signatoryRequired,
      });
      if (request) {
        await uow.requests.update(request.id, { status: input.decision });
      }

      await uow.documentLogs.append({
        requestId: request?.id ?? null,
        documentId: document.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: input.decision,
        template:
          input.decision === "DENIED"
            ? "Document ${payload.control_no} denied: ${payload.denial_reason}"
            : "Document ${payload.control_no} ${payload.decision}.",
        payload: {
          control_no: document.controlNo,
          decision: input.decision,
          denial_reason: input.decision === "DENIED" ? denialReason : null,
          request_control_no: request?.controlNo ?? null,
          decided_at: decidedAt.toISOString(),
        },
      });

      const recipients = dedupeIds([
        request?.createdBy,
        document.assignedTo,
        document.createdBy,
      ]);
      return { updated, document, request, recipients };
    });

    // FR-47: decisions recorded -> requesting-side staff.
    await notifySafely(this.telemetry, this.notifications, {
      userIds: result.recipients.filter((id) => id !== actorId),
      type: "DECISION_RECORDED",
      title: `Decision recorded: ${input.decision} for ${result.document.controlNo}`,
      payload: {
        control_no: result.document.controlNo,
        decision: input.decision,
        denial_reason: input.decision === "DENIED" ? denialReason : null,
        request_control_no: result.request?.controlNo ?? null,
      },
      template: "Document ${payload.control_no} was ${payload.decision}.",
      documentId: result.document.id,
      requestId: result.request?.id ?? null,
    });

    return result.updated;
  }

  /**
   * Step 4 - record the Mayor's signature event (FR-25). The signature is the
   * authenticated user's own act: the caller must hold DocumentService:Sign
   * and the recorded signatory must be the caller (fail-closed).
   */
  async sign(actorId: string, input: SignDocumentInput): Promise<DocumentRecord> {
    return this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "DocumentService:Sign");
      if (input.signedBy && input.signedBy !== actorId) {
        throw new ForbiddenError(
          "A signature must be recorded by the signing user themselves.",
        );
      }

      const document = await uow.documents.findById(input.documentId);
      if (!document) throw new NotFoundError("Document", input.documentId);
      if (!document.signatoryRequired) {
        throw new InvalidStateError(
          `Document ${document.controlNo} does not require a signature.`,
        );
      }
      if (document.status !== "APPROVED" && document.status !== "ENDORSED") {
        throw new InvalidStateError(
          `Only approved or endorsed documents can be signed (status: ${document.status}).`,
        );
      }

      const request = document.requestId
        ? await uow.requests.findById(document.requestId)
        : null;
      if (request?.status === "CLOSED") {
        throw new InvalidStateError(
          `Request ${request.controlNo} is closed (read-only, FR-31).`,
        );
      }

      const signatory = await loadActorSnapshot(uow, actorId);
      const signedAt = input.signedAt ?? new Date();
      const updated = await uow.documents.update(document.id, {
        signedBy: actorId,
        signedAt,
        status: "SIGNED",
      });

      await uow.documentLogs.append({
        requestId: document.requestId ?? null,
        documentId: document.id,
        actorId,
        actorName: signatory.actorName,
        actorRole: signatory.actorRole,
        actionType: "SIGNED",
        template: "Document ${payload.control_no} signed by ${payload.signed_by}.",
        payload: {
          control_no: document.controlNo,
          signed_by: signatory.actorName,
          signed_at: signedAt.toISOString(),
        },
      });

      return updated;
    });
  }

  // ------------------------------------------------------------------
  // Step 5 - Transmission (FR-26..28)
  // ------------------------------------------------------------------

  async transmit(actorId: string, input: TransmitDocumentInput): Promise<DocumentRecord> {
    const result = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "DocumentService:Transmit");

      const document = await uow.documents.findById(input.documentId);
      if (!document) throw new NotFoundError("Document", input.documentId);

      const transmittable = (TRANSMITTABLE_STATUSES as readonly string[]).includes(
        document.status,
      );
      if (!transmittable) {
        throw new InvalidStateError(
          `Only approved, endorsed, or signed documents can be transmitted (status: ${document.status}).`,
        );
      }
      if (document.signatoryRequired && document.status !== "SIGNED") {
        throw new InvalidStateError(
          `Document ${document.controlNo} requires the Mayor's signature before transmission.`,
        );
      }

      if (input.proofAttachmentId) {
        const proof = await uow.documentAttachments.findById(input.proofAttachmentId);
        if (!proof || proof.documentId !== document.id) {
          throw new ValidationError(
            "The proof of transmission attachment does not belong to this document.",
          );
        }
      }

      const request = document.requestId
        ? await uow.requests.findById(document.requestId)
        : null;
      if (request?.status === "CLOSED") {
        throw new InvalidStateError(
          `Request ${request.controlNo} is closed (read-only, FR-31).`,
        );
      }

      const actor = await loadActorSnapshot(uow, actorId);
      const transmission = await uow.transmissions.create({
        documentId: document.id,
        recipientName: input.recipientName,
        receivingOffice: input.receivingOffice,
        receivedBy: input.receivedBy,
        method: input.method,
        transmittedAt: input.transmittedAt ?? new Date(),
        notes: input.notes ?? null,
        proofAttachmentId: input.proofAttachmentId ?? null,
        createdBy: actorId,
      });

      if (request) {
        await uow.requests.update(request.id, { status: "TRANSMITTED" });
      }

      await uow.documentLogs.append({
        requestId: request?.id ?? null,
        documentId: document.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "TRANSMITTED",
        template:
          "Transmitted to ${payload.recipient_name} (${payload.receiving_office}) via ${payload.method}.",
        payload: {
          control_no: document.controlNo,
          recipient_name: input.recipientName,
          receiving_office: input.receivingOffice,
          received_by: input.receivedBy,
          method: input.method,
          transmission_id: transmission.id,
        },
      });

      return document;
    });

    this.telemetry.trackEvent("document.transmitted", { documentId: result.id });
    return result;
  }

  // ------------------------------------------------------------------
  // Step 6 - Completion & archiving (FR-29..31)
  // ------------------------------------------------------------------

  async close(actorId: string, input: CloseRequestInput): Promise<DocumentRecord> {
    return this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "DocumentService:Close");

      const request = await uow.requests.findById(input.requestId);
      if (!request) throw new NotFoundError("Request", input.requestId);
      if (!(CLOSABLE_REQUEST_STATUSES as readonly string[]).includes(request.status)) {
        throw new InvalidStateError(
          `Request ${request.controlNo} is not in a closable state (status: ${request.status}).`,
        );
      }

      const requestDocuments = await uow.documents.findByRequest(request.id);
      const finalAttachment = await this.resolveFinalAttachment(
        uow,
        requestDocuments,
        input.finalAttachmentId ?? null,
      );

      // Optional archive filing (FR-29..31): when the clerk picks a folder at
      // close, every output document of the request lands in it.
      let folder: FolderRecord | null = null;
      if (input.folderId) {
        folder = await uow.folders.findById(input.folderId);
        if (!folder) throw new NotFoundError("Folder", input.folderId);
        await uow.documents.assignFolderByRequest(request.id, folder.id);
      }

      const actor = await loadActorSnapshot(uow, actorId);
      await uow.requests.update(request.id, { status: "CLOSED" });

      await uow.documentLogs.append({
        requestId: request.id,
        documentId: finalAttachment.documentId,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "CLOSED",
        template: folder
          ? "Request ${payload.control_no} closed; final signed copy archived in folder ${payload.folder_path} and read-only."
          : "Request ${payload.control_no} closed; final signed copy archived and read-only.",
        payload: {
          control_no: request.controlNo,
          final_attachment_id: finalAttachment.id,
          folder_id: folder?.id ?? null,
          folder_path: folder?.path ?? null,
          notes: input.notes ?? null,
        },
      });

      const targetDocument =
        requestDocuments.find((doc) => doc.id === finalAttachment.documentId) ??
        requestDocuments[0];
      if (!targetDocument) {
        // Unreachable: resolveFinalAttachment guarantees a document exists.
        throw new InvalidStateError("Request has no output document to close.");
      }

      this.telemetry.trackEvent("request.closed", {
        controlNo: request.controlNo,
        folderPath: folder?.path ?? null,
      });
      // Re-read so the returned row carries the archive folder filing.
      return (await uow.documents.findById(targetDocument.id)) ?? targetDocument;
    });
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /**
   * FR-29: closing requires the final signed copy. Either the caller passes a
   * SIGNED_FINAL attachment id belonging to one of the request's documents, or
   * the newest existing SIGNED_FINAL is used.
   */
  private async resolveFinalAttachment(
    uow: IRepositories,
    requestDocuments: DocumentRecord[],
    finalAttachmentId: string | null,
  ): Promise<DocumentAttachmentRecord> {
    const documentIds = new Set(requestDocuments.map((doc) => doc.id));

    if (finalAttachmentId) {
      const attachment = await uow.documentAttachments.findById(finalAttachmentId);
      if (
        !attachment ||
        attachment.kind !== "SIGNED_FINAL" ||
        !documentIds.has(attachment.documentId)
      ) {
        throw new ValidationError(
          "The final attachment must be a SIGNED_FINAL file belonging to this request.",
        );
      }
      return attachment;
    }

    // Fallback: the newest SIGNED_FINAL across the request's documents.
    const candidates: DocumentAttachmentRecord[] = [];
    for (const document of requestDocuments) {
      const attachments = await uow.documentAttachments.findByDocument(document.id);
      for (const entry of attachments) {
        if (entry.kind === "SIGNED_FINAL") candidates.push(entry);
      }
    }
    const newest = candidates.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
    if (newest) return newest;

    throw new ValidationError(
      "Upload the final signed copy (SIGNED_FINAL) before closing the request (FR-29).",
    );
  }

  private buildFilterWhere(filter?: DocumentFilter | null): SQL | undefined {
    if (!filter) return undefined;
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(documents.status, filter.status));
    if (filter.documentTypeId) {
      conditions.push(eq(documents.documentTypeId, filter.documentTypeId));
    }
    if (filter.requestId) conditions.push(eq(documents.requestId, filter.requestId));
    if (filter.assignedTo) conditions.push(eq(documents.assignedTo, filter.assignedTo));
    if (filter.folderId) conditions.push(eq(documents.folderId, filter.folderId));
    return conditions.length > 0 ? (and(...conditions) as SQL) : undefined;
  }

  private buildSearchWhere(search?: string | null): SQL | undefined {
    const term = search?.trim();
    if (!term) return undefined;
    const pattern = ilikePattern(term);
    return or(
      sql`${documents.controlNo} ILIKE ${pattern}`,
      sql`${documents.title} ILIKE ${pattern}`,
    );
  }

  private orderBy(
    sort?: { field: DocumentSortField; direction?: SortDirection } | null,
  ): SQL[] {
    const direction = sort?.direction === "ASC" ? asc : desc;
    switch (sort?.field) {
      case "CONTROL_NO":
        return [direction(documents.controlNo)];
      case "TITLE":
        return [direction(documents.title)];
      case "STATUS":
        return [direction(documents.status)];
      case "CREATED_AT":
      default:
        return [direction(documents.createdAt)];
    }
  }
}
