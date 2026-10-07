/**
 * Authorization engine (ABAC). One instance at the composition root, shared by
 * services (enforcement) and hooks (UI gating). Holds no state beyond the
 * current subject; grants come only from the backend `me` query.
 */

import type {
  ActionId,
  AuthzDecision,
  AuthzRequest,
  AuthzResource,
  AuthzSubject,
  IAuthorizationEngine,
} from '@/services/contracts/authz';
import { POLICY_BY_ACTION } from './policy';

/**
 * Wildcard-aware grant check, ported from the backend
 * (`permissionSatisfies` in `backend/src/types/permissions.ts`).
 */
export function permissionSatisfies(granted: readonly string[], required: string): boolean {
  const [reqService, reqAction] = required.split(':');
  return granted.some((grant) => {
    if (grant === '*:*') return true;
    const [gService, gAction] = grant.split(':');
    if (gService !== reqService && gService !== '*') return false;
    return gAction === '*' || gAction === reqAction;
  });
}

export class AuthorizationEngine implements IAuthorizationEngine {
  private subject: AuthzSubject | null = null;
  private readonly listeners = new Set<(subject: AuthzSubject | null) => void>();

  isHydrated(): boolean {
    return this.subject !== null;
  }

  getSubject(): AuthzSubject | null {
    return this.subject;
  }

  getPermissions(): readonly string[] {
    return this.subject?.permissions ?? [];
  }

  getRoles(): readonly string[] {
    return this.subject?.roles ?? [];
  }

  decide(request: AuthzRequest): AuthzDecision {
    if (!this.subject) {
      return { allowed: false, code: 'NO_SESSION', reason: 'Your session is still loading.' };
    }

    if (!permissionSatisfies(this.subject.permissions, request.action)) {
      return {
        allowed: false,
        code: 'NOT_GRANTED',
        reason: 'You do not have permission to perform this action.',
      };
    }

    const rule = POLICY_BY_ACTION.get(request.action);
    if (!rule) return { allowed: true };

    const ctx = { subject: this.subject, resource: request.resource ?? null, action: request.action };

    // Attribute-driven elevated grants (e.g. special-use venues).
    const extra = rule.requiresWhen?.(ctx) ?? [];
    for (const action of extra) {
      if (!permissionSatisfies(this.subject.permissions, action)) {
        return {
          allowed: false,
          code: 'NOT_GRANTED',
          reason: 'You do not have permission to perform this action.',
        };
      }
    }

    if (rule.guard) {
      if (ctx.resource === null && rule.action !== 'DocumentService:Prepare') {
        return {
          allowed: false,
          code: 'ATTRIBUTE_DENIED',
          reason: rule.reason ?? 'This action is not available for the selected record.',
        };
      }
      if (!rule.guard(ctx)) {
        return {
          allowed: false,
          code: 'ATTRIBUTE_DENIED',
          reason: rule.reason ?? 'This action is not available for the selected record.',
        };
      }
    }

    return { allowed: true };
  }

  can(action: ActionId, resource?: AuthzResource | null): boolean {
    return this.decide({ action, resource }).allowed;
  }

  setSubject(subject: AuthzSubject | null): void {
    this.subject = subject;
    for (const listener of this.listeners) listener(subject);
  }

  subscribe(listener: (subject: AuthzSubject | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
