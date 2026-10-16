/**
 * Input sanitation for the write use cases.
 *
 * The backend stays the authority (NFR-07): it re-trims, re-validates and owns
 * the transaction. This layer exists for two reasons: the clerk gets an
 * immediate, field-specific message instead of a failed round trip, and markup,
 * invisible control characters and over-long values never reach PostgreSQL
 * (an over-long varchar would otherwise surface as an opaque 500).
 *
 * Every limit here mirrors a column constraint in
 * `backend/src/db/schema/document.ts`; change them together.
 */

import { AppError } from '../contracts/errors';
import type { RequestChannel, RequestPriority } from '../contracts/models';
import type { EncodeRequestInput } from '../contracts/request';

/**
 * Soft hyphen, zero-width and bidirectional-override marks: invisible in every
 * renderer, never legitimate in a docket field.
 */
const INVISIBLE_CHARS = /[\u00AD\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\uFEFF]/g;
/** C0/C1 control characters. Tab, newline and carriage return are handled below. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
/** A tag or angle-bracket pair, e.g. `<script>` or `</b >`. */
const MARKUP = /<\/?[^<>]*>/g;
/** Stray brackets left behind by an unterminated tag. */
const STRAY_BRACKETS = /[<>]/g;
/** Any run of whitespace, non-breaking and other Unicode spaces included. */
const WHITESPACE_RUN = /\s+/g;
/** Horizontal whitespace only; used where line breaks carry meaning. */
const HORIZONTAL_WHITESPACE_RUN = /[^\S\n]+/g;
/** Padding around a line break in a multiline value. */
const NEWLINE_PADDING = / *\n */g;
/** Three or more line breaks collapse to one blank line. */
const BLANK_LINE_RUN = /\n{3,}/g;

/** One free-text field: how to clean it and what the column allows. */
export interface TextRule {
  /** Field label as it reads in a sentence, e.g. `subject matter or formal title`. */
  label: string;
  /** Column length in the backend schema (varchar(n)); longer values are rejected. */
  maxLength: number;
  /** Reject a value that is empty once cleaned. Default true. */
  required?: boolean;
  /** Keep paragraph breaks instead of collapsing the value to a single line. */
  multiline?: boolean;
}

/** varchar(n) counts characters, not UTF-16 code units. */
function countCharacters(value: string): number {
  return Array.from(value).length;
}

/**
 * Clean one free-text field: Unicode-normalize, drop markup and invisible
 * control characters, collapse whitespace, trim, then enforce the column
 * length. Angle brackets are removed rather than entity-escaped because these
 * values are stored raw and rendered into printable dockets, where an escaped
 * entity would show up verbatim.
 *
 * Rejects with `AppError('VALIDATION', ...)` so the caller's inline panel and
 * toast can render the message as-is.
 */
export function sanitizeText(value: unknown, rule: TextRule): string {
  let cleaned = (typeof value === 'string' ? value : '')
    .normalize('NFC')
    .replace(MARKUP, ' ')
    .replace(STRAY_BRACKETS, '')
    .replace(INVISIBLE_CHARS, '')
    .replace(CONTROL_CHARS, '');

  cleaned = rule.multiline
    ? cleaned
        .replace(/\r\n?/g, '\n')
        .replace(HORIZONTAL_WHITESPACE_RUN, ' ')
        .replace(NEWLINE_PADDING, '\n')
        .replace(BLANK_LINE_RUN, '\n\n')
        .trim()
    : cleaned.replace(WHITESPACE_RUN, ' ').trim();

  if (!cleaned) {
    if (rule.required === false) return '';
    throw new AppError('VALIDATION', `The ${rule.label} is required.`);
  }

  const length = countCharacters(cleaned);
  if (length > rule.maxLength) {
    throw new AppError(
      'VALIDATION',
      `The ${rule.label} is too long: ${length} characters, the limit is ${rule.maxLength}.`,
    );
  }
  return cleaned;
}

/** Column limits on `requests` (backend/src/db/schema/document.ts). */
export const ENCODE_LIMITS = {
  title: 500,
  requestingParty: 255,
  originOffice: 255,
} as const;

const REQUEST_CHANNELS: readonly RequestChannel[] = ['WALK_IN', 'MAIL', 'COURIER', 'EMAIL'];
const REQUEST_PRIORITIES: readonly RequestPriority[] = ['NORMAL', 'HIGH', 'URGENT'];

/** Postgres `uuid`, hyphenated or bare. */
const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Clock skew tolerated on a receipt date entered as "now" by a client ahead of the server. */
const RECEIPT_FUTURE_SKEW_MS = 5 * 60 * 1000;
/** Sanity floor for a back-dated receipt; a mistyped year must not move the SLA clock. */
const EARLIEST_RECEIPT_MS = Date.UTC(1900, 0, 1);

/**
 * Receipt date, when supplied. The backend defaults it to now, so an absent
 * value stays null. A future date is rejected: `sla_deadline` is computed from
 * this instant (FR-09), so a forward-dated receipt would buy unearned SLA time.
 */
export function sanitizeReceiptDate(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'string' ? new Date(value) : new Date(Number.NaN);
  const time = parsed.getTime();
  if (Number.isNaN(time) || time < EARLIEST_RECEIPT_MS) {
    throw new AppError('VALIDATION', 'The receipt date is not a valid date.');
  }
  if (time > Date.now() + RECEIPT_FUTURE_SKEW_MS) {
    throw new AppError('VALIDATION', 'The receipt date cannot be in the future.');
  }
  return parsed.toISOString();
}

/**
 * Sanitize the Step 1 reception input (FR-07..11) before it reaches the wire.
 * Returns a fresh object; the caller's input is never mutated.
 */
export function sanitizeEncodeRequestInput(input: EncodeRequestInput): EncodeRequestInput {
  if (!input || typeof input !== 'object') {
    throw new AppError('VALIDATION', 'The request details are missing.');
  }

  const requestTypeId = typeof input.requestTypeId === 'string' ? input.requestTypeId.trim() : '';
  if (!UUID.test(requestTypeId)) {
    throw new AppError('VALIDATION', 'Select a document or request type before logging.');
  }

  const channel = input.channel;
  if (!REQUEST_CHANNELS.includes(channel)) {
    throw new AppError('VALIDATION', 'Select a valid receiving channel.');
  }

  const priority = input.priority ?? 'NORMAL';
  if (!REQUEST_PRIORITIES.includes(priority)) {
    throw new AppError('VALIDATION', 'Select a valid urgency or priority level.');
  }

  return {
    requestTypeId,
    title: sanitizeText(input.title, {
      label: 'subject matter or formal title',
      maxLength: ENCODE_LIMITS.title,
    }),
    requestingParty: sanitizeText(input.requestingParty, {
      label: 'requesting person or signatory',
      maxLength: ENCODE_LIMITS.requestingParty,
    }),
    originOffice: sanitizeText(input.originOffice, {
      label: 'originating department or office',
      maxLength: ENCODE_LIMITS.originOffice,
    }),
    channel,
    priority,
    receivedAt: sanitizeReceiptDate(input.receivedAt),
  };
}
