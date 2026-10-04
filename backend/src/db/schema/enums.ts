/**
 * Shared PostgreSQL Enum Types (schema.txt conventions)
 *
 * Enum values are listed in schema.txt comments; [NFR-21] we enforce them via
 * real PostgreSQL enum types — never free strings.
 */

import { pgEnum } from "drizzle-orm/pg-core";

// ============================================================
// [A] SHARED PLATFORM
// ============================================================

/** Notification types — starter set, extend as features land. */
export const notificationTypeEnum = pgEnum("notification_type", [
  "EVENT_REMINDER",
  "EVENT_UPDATED",
  "EVENT_CANCELLED",
  "SUBMITTED_FOR_REVIEW",
  "DECISION_RECORDED",
  "SLA_AT_RISK",
  "SLA_OVERDUE",
]);

// ============================================================
// [B] DOCUMENT MODULE
// ============================================================

/** How a request arrived at the office. */
export const requestChannelEnum = pgEnum("request_channel", [
  "WALK_IN",
  "MAIL",
  "COURIER",
  "EMAIL",
]);

/** Request priority. */
export const requestPriorityEnum = pgEnum("request_priority", [
  "NORMAL",
  "HIGH",
  "URGENT",
]);

/**
 * Six-step lifecycle status (FR-07..FR-31).
 * RECEIVED -> SCREENING -> [RETURNED_FOR_COMPLIANCE -> SCREENING]
 *   -> PREPARATION -> REVIEW -> APPROVED | ENDORSED | DENIED
 *   -> TRANSMITTED -> CLOSED
 */
export const requestStatusEnum = pgEnum("request_status", [
  "RECEIVED",
  "SCREENING",
  "RETURNED_FOR_COMPLIANCE",
  "PREPARATION",
  "REVIEW",
  "APPROVED",
  "ENDORSED",
  "DENIED",
  "TRANSMITTED",
  "CLOSED",
]);

/** Kind of file uploaded against a request. */
export const requestAttachmentKindEnum = pgEnum("request_attachment_kind", [
  "INCOMING_LETTER",
  "ANNEX",
]);

/** Output-document lifecycle status. */
export const documentStatusEnum = pgEnum("document_status", [
  "DRAFTING",
  "UNDER_REVIEW",
  "APPROVED",
  "ENDORSED",
  "DENIED",
  "SIGNED",
]);

/** Kind of file uploaded against an output document. */
export const documentAttachmentKindEnum = pgEnum("document_attachment_kind", [
  "DRAFT",
  "SIGNED_FINAL",
  "TRANSMISSION_PROOF",
]);

/** Transmission dispatch method. */
export const transmissionMethodEnum = pgEnum("transmission_method", [
  "PICKUP",
  "COURIER",
  "EMAIL",
]);

/** Append-only document audit-trail action types. */
export const documentLogActionEnum = pgEnum("document_log_action", [
  "RECEIVED",
  "SCREENED_PASS",
  "SCREENED_FAIL",
  "RETURNED_FOR_COMPLIANCE",
  "RESUBMITTED",
  "ASSIGNED",
  "DRAFTED",
  "SUBMITTED_REVIEW",
  "APPROVED",
  "ENDORSED",
  "DENIED",
  "SIGNED",
  "TRANSMITTED",
  "CLOSED",
  "REOPENED",
]);

// ============================================================
// [C] BOOKING MODULE
// ============================================================

/** Event booking status. CANCELLED events never block a slot (FR-42). */
export const eventStatusEnum = pgEnum("event_status", [
  "CONFIRMED",
  "TENTATIVE",
  "CANCELLED",
]);

/** Append-only booking audit-trail action types. */
export const activityLogActionEnum = pgEnum("activity_log_action", [
  "EVENT_CREATED",
  "EVENT_UPDATED",
  "EVENT_CANCELLED",
]);
