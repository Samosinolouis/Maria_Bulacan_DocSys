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
  /** User-safe reason shown when the guard denies. */
  reason?: string;
  /** Extra grants required when a resource attribute condition holds. */
  requiresWhen?: (ctx: AuthzContext) => ActionId[];
}

/** Read a resource attribute (deny when absent). */
function attr(ctx: AuthzContext, key: string): unknown {
  return ctx.resource?.attributes?.[key];
}

const STATUS_IN = (values: string[]) => (ctx: AuthzContext) =>
  values.includes(String(attr(ctx, 'status')));

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
    action: 'DocumentService:Close',
    guard: STATUS_IN(['APPROVED', 'ENDORSED', 'DENIED', 'TRANSMITTED']),
    reason: 'This request is not in a closable state.',
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
    action: 'UserService:Deactivate',
    guard: (ctx) => attr(ctx, 'id') !== ctx.subject.userId,
    reason: 'You cannot deactivate your own account.',
  },
];

export const POLICY_BY_ACTION: ReadonlyMap<ActionId, ActionRule> = new Map(
  POLICY.map((rule) => [rule.action, rule]),
);
