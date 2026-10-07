/**
 * [B] DOCUMENT MODULE - Six-step lifecycle
 *
 * Tables: request_types, document_types, control_number_sequences, holidays,
 *         requests, request_attachments, folders, documents,
 *         document_attachments, transmissions, document_logs.
 *
 * Conventions (schema.txt):
 *  - Attachments are UPLOAD-ONLY; every upload records uploaded_by + sha256.
 *  - document_logs is APPEND-ONLY, with actor_name/actor_role snapshots.
 *  - Cancellation/closure is a STATUS change, never a row delete.
 *  - [NFR-24] No FK crosses the Document / Booking module boundary.
 */

import {
  uuid,
  varchar,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  index,
  unique,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./schema.ts";
import { users } from "./platform.ts";
import {
  requestChannelEnum,
  requestPriorityEnum,
  requestStatusEnum,
  requestAttachmentKindEnum,
  documentStatusEnum,
  documentAttachmentKindEnum,
  transmissionMethodEnum,
  documentLogActionEnum,
} from "./enums.ts";

// ============================================================
// LOOKUPS
// ============================================================

/** Lookup: what came IN (TRAVEL_ORDER, VENUE_REQ, ...). */
export const requestTypes = appSchema.table("request_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  /** Control-number prefix, e.g. IN, TO, VR, VH, FD, OT. */
  prefix: varchar("prefix", { length: 10 }).notNull(),
  /** Retire a type without breaking history. */
  isActive: boolean("is_active").notNull().default(true),
});

/** Lookup: what goes OUT (EXEC_ORDER, SB_ENDORSEMENT, ...). */
export const documentTypes = appSchema.table("document_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  /** Control-number prefix, e.g. EO, SB, MO, LO. */
  prefix: varchar("prefix", { length: 10 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

/**
 * One row per (series, year). Numbers are issued with an atomic
 * UPDATE ... RETURNING (row lock) so concurrent clerks never collide or skip.
 * control_no = <prefix>-<year>-<zero-padded last_value>, e.g. TO-2026-0045.
 */
export const controlNumberSequences = appSchema.table(
  "control_number_sequences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Series discriminator, e.g. REQ:TRAVEL_ORDER, DOC:EXEC_ORDER. */
    seqCode: varchar("seq_code", { length: 100 }).notNull(),
    year: integer("year").notNull(),
    /** Last issued number in the series. */
    lastValue: integer("last_value").notNull().default(0),
  },
  (table) => [
    unique("control_number_sequences_seq_code_year_unique").on(
      table.seqCode,
      table.year,
    ),
  ],
);

/** Lookup; feeds business-day SLA computation (FR-09, NFR-23). */
export const holidays = appSchema.table("holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** One row per date; admin encodes each year's official proclamation list. */
  holidayDate: date("holiday_date").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
});

// ============================================================
// TRANSACTION
// ============================================================

/** THE TRANSACTION. Owns the 6-step lifecycle. */
export const requests = appSchema.table(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** From control_number_sequences, e.g. TO-2026-0045. */
    controlNo: varchar("control_no", { length: 50 }).notNull().unique(),
    requestTypeId: uuid("request_type_id")
      .notNull()
      .references(() => requestTypes.id),
    title: varchar("title", { length: 500 }).notNull(),
    /** Person / signatory. */
    requestingParty: varchar("requesting_party", { length: 255 }).notNull(),
    /** Department. */
    originOffice: varchar("origin_office", { length: 255 }).notNull(),
    channel: requestChannelEnum("channel").notNull(),
    priority: requestPriorityEnum("priority").notNull().default("NORMAL"),
    /** IRL receipt date. */
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    /** received_at + 3 business days (RA 11032), computed against holidays. */
    slaDeadline: timestamp("sla_deadline", { withTimezone: true }).notNull(),
    status: requestStatusEnum("status").notNull().default("RECEIVED"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("requests_status_index").on(table.status),
    index("requests_sla_deadline_index").on(table.slaDeadline),
  ],
);

/** Uploaded files against a request (upload-only). */
export const requestAttachments = appSchema.table(
  "request_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id),
    kind: requestAttachmentKindEnum("kind").notNull(),
    /** MinIO object key. */
    storageKey: varchar("storage_key", { length: 1024 }).notNull(),
    bucketName: varchar("bucket_name", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 1024 }).notNull(),
    /** Whitelist: application/pdf, docx, xlsx (FR-10). */
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** sha256, tamper-evidence (FR-10, NFR-08). */
    checksum: varchar("checksum", { length: 64 }).notNull(),
    /** System NEVER generates; upload-only. */
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("request_attachments_request_id_index").on(table.requestId)],
);

// ============================================================
// ARCHIVE FOLDERS
// ============================================================

/**
 * Hierarchical archive folders (folders 1 --- N documents). `path` is
 * denormalized: computed as `<parent.path>/<name>` at creation (root folders
 * use `<name>` alone), so an entire subtree is addressable by path prefix.
 * Names are unique among siblings; "/" is illegal inside a name.
 */
export const folders = appSchema.table(
  "folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** NULL = root-level folder. */
    parentId: uuid("parent_id").references((): AnyPgColumn => folders.id),
    /** Denormalized "/"-separated path, e.g. "2026/Executive Orders". */
    path: varchar("path", { length: 1024 }).notNull(),
    /** Unique among siblings; must not contain "/". */
    name: varchar("name", { length: 255 }).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("folders_parent_id_index").on(table.parentId),
    unique("folders_path_unique").on(table.path),
    unique("folders_parent_name_unique").on(table.parentId, table.name),
    // Postgres treats NULLs as distinct, so root-level sibling names need
    // their own partial unique index.
    uniqueIndex("folders_root_name_unique")
      .on(table.name)
      .where(sql`${table.parentId} is null`),
  ],
);

/** ONE OUTPUT ARTIFACT (0..N per request). */
export const documents = appSchema.table(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** NULL = issued without request (sua sponte EO / MO). */
    requestId: uuid("request_id").references(() => requests.id),
    controlNo: varchar("control_no", { length: 50 }).notNull().unique(),
    /** The "category" reports group by (FR-36). */
    documentTypeId: uuid("document_type_id")
      .notNull()
      .references(() => documentTypes.id),
    title: varchar("title", { length: 500 }).notNull(),
    status: documentStatusEnum("status").notNull().default("DRAFTING"),
    /** Drafting officer. */
    assignedTo: uuid("assigned_to").references(() => users.id),
    /** Mayor signature needed? */
    signatoryRequired: boolean("signatory_required").notNull().default(false),
    signedBy: uuid("signed_by").references(() => users.id),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    /** Mandatory when DENIED (RA 11032 written grounds, FR-23). */
    denialReason: text("denial_reason"),
    decisionNotes: text("decision_notes"),
    decidedBy: uuid("decided_by").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    /** Archive folder - set when the request is closed and filed (FR-29..31). */
    folderId: uuid("folder_id").references(() => folders.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("documents_request_id_index").on(table.requestId),
    index("documents_status_index").on(table.status),
    index("documents_document_type_id_index").on(table.documentTypeId),
    index("documents_folder_id_index").on(table.folderId),
  ],
);

/** Uploaded files against an output document. */
export const documentAttachments = appSchema.table(
  "document_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    kind: documentAttachmentKindEnum("kind").notNull(),
    storageKey: varchar("storage_key", { length: 1024 }).notNull(),
    bucketName: varchar("bucket_name", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 1024 }).notNull(),
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("document_attachments_document_id_index").on(table.documentId),
  ],
);

/** Dispatch records (FR-26..28). */
export const transmissions = appSchema.table(
  "transmissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    /** Person who received. */
    recipientName: varchar("recipient_name", { length: 255 }).notNull(),
    /** Office / agency. */
    receivingOffice: varchar("receiving_office", { length: 255 }).notNull(),
    /** Signature of receiver. */
    receivedBy: varchar("received_by", { length: 255 }).notNull(),
    method: transmissionMethodEnum("method").notNull(),
    /** Business time (may precede row creation if logged after the fact). */
    transmittedAt: timestamp("transmitted_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    /** Scanned signed receipt. */
    proofAttachmentId: uuid("proof_attachment_id").references(
      () => documentAttachments.id,
    ),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    /** System time; divergence from transmitted_at is intentional. */
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("transmissions_document_id_index").on(table.documentId),
  ],
);

/** APPEND-ONLY audit trail (document module) - [NFR-09] no UPDATE/DELETE. */
export const documentLogs = appSchema.table(
  "document_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").references(() => requests.id),
    documentId: uuid("document_id").references(() => documents.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    /** SNAPSHOT: log stays true after renames. */
    actorName: varchar("actor_name", { length: 255 }).notNull(),
    /** SNAPSHOT. */
    actorRole: varchar("actor_role", { length: 100 }).notNull(),
    actionType: documentLogActionEnum("action_type").notNull(),
    /** "Transmitted to ${payload.recipient_name}..." */
    template: text("template").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("document_logs_request_id_index").on(table.requestId),
    index("document_logs_document_id_index").on(table.documentId),
    index("document_logs_actor_id_index").on(table.actorId),
  ],
);
