/**
 * ABAC policy table - declarative rules. The engine evaluates; this module
 * declares. Adding a rule never modifies the engine.
 */

import type { ActionId, AuthzResource, AuthzSubject } from '@/services/contracts/authz';

export interface AuthzContext {
  subject: AuthzSubject;
  resource: AuthzResource | null;
  action: ActionId;
}

export interface ActionRule {
  action: ActionId;
  /** Return true to allow, false to deny. Omitted = grant check only. */
  guard?: (ctx: AuthzContext) => boolean;
  /**
   * User-safe reason shown when the guard denies. A function is evaluated with
   * the same context as the guard, for rules whose guard has more than one
   * denial cause (an already-closed request vs. one that has not concluded).
   */
  reason?: string | ((ctx: AuthzContext) => string);
  /** Extra grants required when a resource attribute condition holds. */
  requiresWhen?: (ctx: AuthzContext) => ActionId[];
  /**
   * Self-service action: when the resource carries `attributes.id` equal to the
   * subject's own user id, the action is allowed WITHOUT the grant. Used where
   * the backend lets an account holder act on their own record (FR-03).
   */
  allowSelf?: boolean;
}

/** Read a resource attribute (deny when absent). */
function attr(ctx: AuthzContext, key: string): unknown {
  return ctx.resource?.attributes?.[key];
}

const STATUS_IN = (values: string[]) => (ctx: AuthzContext) =>
  values.includes(String(attr(ctx, 'status')));

/**
 * FR-30: the request statuses a request can be closed and filed from. The
 * archive desk draws its Pending Archival rows from the same set
 * (`PENDING_ARCHIVAL_STATUSES` in `components/views/ArchiveView.tsx`), so
 * every row the desk offers is closable and no closable request is missing
 * from it. Keep the two lists in step.
 */
const CLOSABLE_REQUEST_STATUSES = ['APPROVED', 'ENDORSED', 'DENIED', 'TRANSMITTED'] as const;

const SPECIAL_VENUE_EXTRA = (ctx: AuthzContext): ActionId[] =>
  attr(ctx, 'venueSpecialUse') === true ? ['EventService:BookSpecialVenue'] : [];

export const POLICY: readonly ActionRule[] = [
  {
    // `screen` runs from RECEIVED/SCREENING; `resubmit` runs from
    // RETURNED_FOR_COMPLIANCE. Both are enforced by the backend under
    // RequestService:Screen, so the guard covers the union of states.
    action: 'RequestService:Screen',
    guard: (ctx) =>
      attr(ctx, 'status') === 'RECEIVED' ||
      attr(ctx, 'status') === 'SCREENING' ||
      attr(ctx, 'status') === 'RETURNED_FOR_COMPLIANCE',
    reason: 'This request is not in a screenable state.',
  },
  {
    // Creation (no resource) passes; the submit path requires a draft.
    action: 'DocumentService:Prepare',
    guard: (ctx) => ctx.resource === null || attr(ctx, 'status') === 'DRAFTING',
    reason: 'Only drafts can be submitted for review.',
  },
  {
    action: 'DocumentService:Review',
    guard: (ctx) => attr(ctx, 'status') === 'UNDER_REVIEW',
    reason: 'Only documents under review can be decided.',
  },
  {
    action: 'DocumentService:Sign',
    guard: (ctx) =>
      (attr(ctx, 'status') === 'APPROVED' || attr(ctx, 'status') === 'ENDORSED') &&
      attr(ctx, 'signatoryRequired') === true,
    reason: 'This document is not awaiting a signature.',
  },
  {
    action: 'DocumentService:Transmit',
    guard: STATUS_IN(['APPROVED', 'ENDORSED', 'SIGNED']),
    reason: 'Only approved, endorsed, or signed documents can be transmitted.',
  },
  {
    // FR-30: a request is closable only once it has been DECIDED - approved,
    // endorsed, denied, or transmitted. Transmission (Step 5) is optional, so a
    // concluded request is closed and filed without a dispatch record; the
    // signed final copy stays mandatory (FR-29) and a closed request stays
    // read-only (FR-31). The backend mirrors this guard in
    // `DocumentService.close` (NFR-07).
    action: 'DocumentService:Close',
    guard: STATUS_IN([...CLOSABLE_REQUEST_STATUSES]),
    reason: (ctx) =>
      attr(ctx, 'status') === 'CLOSED'
        ? 'This request is already closed and read-only.'
        : 'Only approved, endorsed, denied, or transmitted requests can be closed and archived.',
  },
  {
    action: 'EventService:Create',
    requiresWhen: SPECIAL_VENUE_EXTRA,
  },
  {
    action: 'EventService:Update',
    guard: (ctx) => attr(ctx, 'status') !== 'CANCELLED',
    reason: 'Cancelled events cannot be edited.',
    requiresWhen: SPECIAL_VENUE_EXTRA,
  },
  {
    action: 'EventService:Cancel',
    guard: (ctx) => attr(ctx, 'status') !== 'CANCELLED',
    reason: 'This event is already cancelled.',
  },
  {
    // A holder may always edit their own profile; editing somebody else's is an
    // administrative act and needs the UserService:Update grant (FR-03). The
    // backend enforces the same split in UserService.updateProfile.
    action: 'UserService:Update',
    allowSelf: true,
  },
  {
    action: 'UserService:Deactivate',
    guard: (ctx) => attr(ctx, 'id') !== ctx.subject.userId,
    reason: 'You cannot deactivate your own account.',
  },
];

export const POLICY_BY_ACTION: ReadonlyMap<ActionId, ActionRule> = new Map(
  POLICY.map((rule) => [rule.action, rule]),
);
