/**
 * Static label maps and design constants.
 *
 * These are DISPLAY helpers only (labels, badge classes, step numbers). They
 * carry no fixtures and no grants. Reference data that lives in the backend
 * (request types, document types, venues, holidays) is fetched through the
 * service layer - never hardcoded here.
 */

import type { DocumentStatus, RequestStatus } from '@/services/contracts/models';

export interface StatusMeta {
  label: string;
  stepNumber: number;
  badgeCls: string;
  description: string;
}

export const REQUEST_STATUS_META: Record<RequestStatus, StatusMeta> = {
  RECEIVED: {
    label: 'Received / Logged',
    stepNumber: 1,
    badgeCls: 'badge-received',
    description: 'Logged at the reception desk; a barcode control number is assigned.',
  },
  SCREENING: {
    label: 'Under Screening',
    stepNumber: 2,
    badgeCls: 'badge-screening',
    description: 'Verifying completeness of attachments and the proper signatory.',
  },
  RETURNED_FOR_COMPLIANCE: {
    label: 'Returned for Compliance',
    stepNumber: 2,
    badgeCls: 'badge-denied',
    description: 'Returned to the requesting party for deficiencies.',
  },
  PREPARATION: {
    label: 'Preparation / Drafting',
    stepNumber: 3,
    badgeCls: 'badge-preparation',
    description: 'Assigned officer drafting the response, order, or routing paper.',
  },
  REVIEW: {
    label: 'Pending Executive Review',
    stepNumber: 4,
    badgeCls: 'badge-review',
    description: 'Submitted to the Municipal Administrator for evaluation.',
  },
  APPROVED: {
    label: 'Approved',
    stepNumber: 4,
    badgeCls: 'badge-approved',
    description: 'Formally approved by the Municipal Administrator.',
  },
  ENDORSED: {
    label: 'Endorsed',
    stepNumber: 4,
    badgeCls: 'badge-endorsed',
    description: 'Formally endorsed to the Sangguniang Bayan or another agency.',
  },
  DENIED: {
    label: 'Returned / Denied',
    stepNumber: 4,
    badgeCls: 'badge-denied',
    description: 'Disapproved with documented grounds.',
  },
  TRANSMITTED: {
    label: 'Transmitted / Outgoing',
    stepNumber: 5,
    badgeCls: 'badge-transmitted',
    description: 'Dispatched to the recipient with a signed receiving copy.',
  },
  CLOSED: {
    label: 'Closed / Archived',
    stepNumber: 7,
    badgeCls: 'badge-closed',
    description: 'Transaction concluded and stored in the digital archive.',
  },
};

export const DOCUMENT_STATUS_META: Record<DocumentStatus, StatusMeta> = {
  DRAFTING: {
    label: 'Drafting',
    stepNumber: 3,
    badgeCls: 'badge-preparation',
    description: 'Draft under preparation.',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    stepNumber: 4,
    badgeCls: 'badge-review',
    description: 'Awaiting the executive decision.',
  },
  APPROVED: {
    label: 'Approved',
    stepNumber: 4,
    badgeCls: 'badge-approved',
    description: 'Approved; awaiting signature or transmission.',
  },
  ENDORSED: {
    label: 'Endorsed',
    stepNumber: 4,
    badgeCls: 'badge-endorsed',
    description: 'Endorsed to an external office.',
  },
  DENIED: {
    label: 'Denied',
    stepNumber: 4,
    badgeCls: 'badge-denied',
    description: 'Denied with written grounds.',
  },
  SIGNED: {
    label: 'Signed',
    stepNumber: 4,
    badgeCls: 'badge-transmitted',
    description: 'Signed by the designated signatory.',
  },
};

/**
 * Display meta for a status value, tolerant of anything the label map does not
 * know (a status the backend added, or a document passed where a request was
 * expected). Rendering must never blank a whole page because one badge has no
 * label - the unmapped value is logged and shown in plain form instead.
 *
 * Generic over the meta shape so the two-field maps declared inside views
 * (`{ label, badgeCls }`) work as well as the full `StatusMeta` tables.
 */
export function resolveStatusMeta<T extends { label: string; badgeCls: string }>(
  map: Record<string, T>,
  status: string | null | undefined,
): T {
  const meta = status ? map[status] : undefined;
  if (meta) return meta;

  const label = status ? status.replace(/_/g, ' ') : 'Status unavailable';
  console.warn(`[constants] no display meta for status "${String(status)}" - using fallback`);
  return {
    label,
    stepNumber: 0,
    badgeCls: 'badge-received',
    description: 'This status has no client-side display entry yet.',
  } as unknown as T;
}

export const REQUEST_CHANNEL_LABELS: Record<string, string> = {
  WALK_IN: 'Walk-in',
  MAIL: 'Mail',
  COURIER: 'Courier',
  EMAIL: 'Email',
};

export const REQUEST_PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const DOCUMENT_LOG_ACTION_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  SCREENED_PASS: 'Screening passed',
  SCREENED_FAIL: 'Screening failed',
  RETURNED_FOR_COMPLIANCE: 'Returned for compliance',
  RESUBMITTED: 'Resubmitted',
  ASSIGNED: 'Assigned',
  DRAFTED: 'Drafted',
  SUBMITTED_REVIEW: 'Submitted for review',
  APPROVED: 'Approved',
  ENDORSED: 'Endorsed',
  DENIED: 'Denied',
  SIGNED: 'Signed',
  TRANSMITTED: 'Transmitted',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
};

/** Fallback display names for known venue codes (the API returns `name`). */
export const VENUE_CODE_LABELS: Record<string, string> = {
  CONFERENCE_ROOM: 'Municipal Conference Room',
  COMMAND_CENTER: 'Command Center Room',
  SOCIAL_HALL: 'Municipal Social Hall',
  GYMNASIUM: 'Municipal Gymnasium',
  MAYOR_OFFICE: "Mayor's Conference Room",
  ADMIN_OFFICE: "Administrator's Office",
};

/** Display label for a venue code, falling back to the raw code. */
export function venueLabel(code: string): string {
  return VENUE_CODE_LABELS[code] ?? code;
}
