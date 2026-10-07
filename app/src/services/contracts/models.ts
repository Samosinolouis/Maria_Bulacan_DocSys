/**
 * Domain models - mirror the GraphQL schema one-to-one.
 * Field sets match the backend SDL under `backend/src/graphql/**`.
 */

import type { ISODateTime } from './common';

// --- Enums (mirror the backend SDL) ---

export type RequestStatus =
  | 'RECEIVED'
  | 'SCREENING'
  | 'RETURNED_FOR_COMPLIANCE'
  | 'PREPARATION'
  | 'REVIEW'
  | 'APPROVED'
  | 'ENDORSED'
  | 'DENIED'
  | 'TRANSMITTED'
  | 'CLOSED';
export type RequestPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type RequestChannel = 'WALK_IN' | 'MAIL' | 'COURIER' | 'EMAIL';
export type DocumentStatus =
  | 'DRAFTING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ENDORSED'
  | 'DENIED'
  | 'SIGNED';
export type ReviewDecision = 'APPROVED' | 'ENDORSED' | 'DENIED';
export type TransmissionMethod = 'PICKUP' | 'COURIER' | 'EMAIL';
export type DocumentLogAction =
  | 'RECEIVED'
  | 'SCREENED_PASS'
  | 'SCREENED_FAIL'
  | 'RETURNED_FOR_COMPLIANCE'
  | 'RESUBMITTED'
  | 'ASSIGNED'
  | 'DRAFTED'
  | 'SUBMITTED_REVIEW'
  | 'APPROVED'
  | 'ENDORSED'
  | 'DENIED'
  | 'SIGNED'
  | 'TRANSMITTED'
  | 'CLOSED'
  | 'REOPENED';
export type RequestAttachmentKind = 'INCOMING_LETTER' | 'ANNEX';
export type DocumentAttachmentKind = 'DRAFT' | 'SIGNED_FINAL' | 'TRANSMISSION_PROOF';
export type EventStatus = 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
export type BookingConflictKind = 'VENUE' | 'ATTENDEE' | 'MAYOR' | 'ADMINISTRATOR';
export type ActivityLogAction = 'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_CANCELLED';
export type NotificationType =
  | 'EVENT_REMINDER'
  | 'EVENT_UPDATED'
  | 'EVENT_CANCELLED'
  | 'SUBMITTED_FOR_REVIEW'
  | 'DECISION_RECORDED'
  | 'SLA_AT_RISK'
  | 'SLA_OVERDUE';
export type ReportPeriod = 'MONTHLY' | 'ANNUAL';
export type ReportFormat = 'PDF' | 'EXCEL';

// --- Sort field unions (mirror the backend sort enums) ---

export type RequestSortField = 'RECEIVED_AT' | 'SLA_DEADLINE' | 'CONTROL_NO' | 'TITLE' | 'PRIORITY';
export type DocumentSortField = 'CREATED_AT' | 'CONTROL_NO' | 'TITLE' | 'STATUS';
export type EventSortField = 'EVENT_DATE' | 'START_TIME' | 'TITLE' | 'CREATED_AT';
export type NotificationSortField = 'CREATED_AT';
export type UserSortField = 'CREATED_AT' | 'FIRST_NAME' | 'LAST_NAME' | 'EMAIL';
export type RoleSortField = 'NAME' | 'CREATED_AT';

// --- Document module models ---

export interface RequestType {
  id: string;
  code: string;
  name: string;
  description: string;
  prefix: string;
  isActive: boolean;
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description: string;
  prefix: string;
  isActive: boolean;
}

export interface Request {
  id: string;
  controlNo: string;
  requestTypeId: string;
  requestType?: RequestType | null;
  title: string;
  requestingParty: string;
  originOffice: string;
  channel: RequestChannel;
  priority: RequestPriority;
  receivedAt: ISODateTime;
  /** received_at + 3 business days (RA 11032). */
  slaDeadline: ISODateTime;
  status: RequestStatus;
  createdBy: string;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
  documents: Document[];
  attachments: RequestAttachment[];
  /** Append-only audit trail, newest-first. */
  logs: DocumentLog[];
}

export interface Document {
  id: string;
  /** NULL when issued without a request (sua sponte EO / MO). */
  requestId?: string | null;
  controlNo: string;
  documentTypeId: string;
  documentType?: DocumentType | null;
  title: string;
  status: DocumentStatus;
  assignedTo?: string | null;
  signatoryRequired: boolean;
  signedBy?: string | null;
  signedAt?: ISODateTime | null;
  denialReason?: string | null;
  decisionNotes?: string | null;
  decidedBy?: string | null;
  decidedAt?: ISODateTime | null;
  folderId?: string | null;
  createdBy: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  attachments: DocumentAttachment[];
  transmissions: Transmission[];
  logs: DocumentLog[];
}

export interface Transmission {
  id: string;
  documentId: string;
  recipientName: string;
  receivingOffice: string;
  receivedBy: string;
  method: TransmissionMethod;
  transmittedAt: ISODateTime;
  notes?: string | null;
  proofAttachmentId?: string | null;
  createdBy: string;
  createdAt?: ISODateTime;
}

export interface DocumentLog {
  id: string;
  requestId?: string | null;
  documentId?: string | null;
  actorId: string;
  /** Snapshot: survives renames. */
  actorName: string;
  /** Snapshot. */
  actorRole: string;
  actionType: DocumentLogAction;
  template: string;
  payload: Record<string, unknown>;
  createdAt?: ISODateTime;
}

export interface RequestAttachment {
  id: string;
  requestId: string;
  kind: RequestAttachmentKind;
  bucketName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  /** Server-computed SHA-256. */
  checksum: string;
  uploadedBy: string;
  createdAt?: ISODateTime;
}

export interface DocumentAttachment {
  id: string;
  documentId: string;
  kind: DocumentAttachmentKind;
  bucketName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  uploadedBy: string;
  createdAt?: ISODateTime;
}

/** Short-lived presigned download descriptor (NFR-06). */
export interface DownloadTicket {
  url: string;
  expiresInSeconds: number;
  fileName: string;
  mimeType: string;
}

// --- Booking module models ---

export interface Venue {
  id: string;
  code: string;
  name: string;
  /** true for Mayor's Conference Room and Administrator's Office (FR-41). */
  specialUse: boolean;
  isActive: boolean;
  /**
   * Live availability: CONFIRMED bookings whose slot has not ended yet.
   * Computed per read server-side, so the venue list is served with a short TTL.
   */
  activeBookings: number;
}

export interface EventAttendee {
  userId: string;
  name: string;
}

export interface Event {
  id: string;
  venueId: string;
  venue?: Venue | null;
  title: string;
  organizerId?: string | null;
  department: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  involvesMayor: boolean;
  involvesAdministrator: boolean;
  notes?: string | null;
  createdBy: string;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
  attendees: EventAttendee[];
  logs: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  eventId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actionType: ActivityLogAction;
  template: string;
  payload: Record<string, unknown>;
  createdAt?: ISODateTime;
}

/** A detected scheduling conflict (FR-42). */
export interface BookingConflict {
  kind: BookingConflictKind;
  message: string;
  conflictingEventIds: string[];
}

// --- Shared platform models ---

export interface User {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  email: string;
  contactNo: string;
  office: string;
  position: string;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  roles: Role[];
  /** Effective permission set = union of role payloads (with wildcards). */
  effectivePermissions: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  /** "Service:Action" strings; "*" wildcards allowed. */
  permissionPayload: string[];
  createdAt: ISODateTime;
}

export interface PermissionCatalogEntry {
  service: string;
  actions: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  payload: Record<string, unknown>;
  template: string;
  /** Deep-link source entity (nullable trio). */
  requestId?: string | null;
  documentId?: string | null;
  eventId?: string | null;
  /** NULL = unread. */
  readAt?: ISODateTime | null;
  createdAt: ISODateTime;
}

// --- Reports & lookups ---

export interface DashboardMetrics {
  totalDocuments: number;
  incomingRequests: number;
  pendingActions: number;
  closedTransactions: number;
  slaAtRisk: number;
  slaOverdue: number;
}

export interface CategorySummaryRow {
  documentTypeId: string;
  code: string;
  name: string;
  count: number;
}

export interface ReportArtifact {
  fileName: string;
  mimeType: string;
  /** Base64-encoded artifact bytes. */
  bodyBase64: string;
}

export interface Holiday {
  id: string;
  /** YYYY-MM-DD. */
  holidayDate: string;
  name: string;
}

// Re-export pagination primitives for convenience.
export type { Connection, Edge, PageInfo } from './common';
