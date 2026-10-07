# Authorization Implementation Spec (ABAC)

> **Scope:** Implementation of the client-side ABAC engine under `app/src/authz/`, its hydration from the backend session, and its React bindings.
> **Audience:** Engineers implementing the engine, the policy table, and the provider.
> **Model:** See [AUTHORIZATION.md](../AUTHORIZATION.md) for the concepts, the `me` permission source, and the wildcard rules.

Reminder of the boundary: the backend enforces authorization at the service layer (NFR-07). This engine exists to shape the UI and fail fast. It never replaces server-side enforcement, and it never holds hardcoded grants.

---

## Table of Contents

1. [File Layout](#file-layout)
2. [Engine Implementation](#engine-implementation)
3. [Grant Check](#grant-check)
4. [Policy Table](#policy-table)
5. [Guard Semantics](#guard-semantics)
6. [authorizeOrThrow](#authorizeorThrow)
7. [Provider and Hydration](#provider-and-hydration)
8. [React Bindings](#react-bindings)
9. [Error Contract](#error-contract)
10. [Test Matrix](#test-matrix)
11. [Drift Check](#drift-check)
12. [Security Notes](#security-notes)

---

## File Layout

```
app/src/authz/
├── engine.ts       # AuthorizationEngine implements IAuthorizationEngine
├── policy.ts       # declarative rule table + guard helpers
├── authorize.ts    # authorizeOrThrow used by services
└── provider.tsx    # AuthorizationProvider (hydrates from the session)
```

Contract types (`IAuthorizationEngine`, `AuthzSubject`, `AuthzResource`, `AuthzDecision`, `KnownActionId`) live in `app/src/services/contracts/authz.ts`. Hooks (`useAuthorization`, `useCan`) live in `app/src/hooks/` per the hooks spec.

---

## Engine Implementation

```ts
// app/src/authz/engine.ts (shape)
export class AuthorizationEngine implements IAuthorizationEngine {
  private subject: AuthzSubject | null = null;
  private listeners = new Set<(subject: AuthzSubject | null) => void>();

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

    return evaluatePolicy({ subject: this.subject, resource: request.resource ?? null, action: request.action });
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
    return () => this.listeners.delete(listener);
  }
}
```

Decision order, fixed:

1. `NO_SESSION` when no subject is loaded. Fail closed.
2. `NOT_GRANTED` when the fetched permission set does not satisfy the action (wildcard-aware).
3. Policy evaluation for attribute guards, possibly `ATTRIBUTE_DENIED`.
4. Otherwise `{ allowed: true }`.

The engine holds no other state. It is created once at the composition root and shared by services (enforcement) and hooks (UI gating).

---

## Grant Check

One function, used everywhere, ported from the backend (`permissionSatisfies` in `backend/src/types/permissions.ts`):

```ts
// app/src/authz/engine.ts (internal)
export function permissionSatisfies(granted: readonly string[], required: string): boolean {
  const [reqService, reqAction] = required.split(':');
  return granted.some((grant) => {
    if (grant === '*:*') return true;
    const [gService, gAction] = grant.split(':');
    if (gService !== reqService && gService !== '*') return false;
    return gAction === '*' || gAction === reqAction;
  });
}
```

The same semantics apply in the backend; the port must not drift. Add table-driven tests for every wildcard combination.

---

## Policy Table

`app/src/authz/policy.ts` holds the declarative rules. The engine evaluates; the table declares. Adding a rule never modifies the engine.

```ts
export interface AuthzContext {
  subject: AuthzSubject;
  resource: AuthzResource | null;
  action: ActionId;
}

export interface ActionRule {
  action: ActionId;
  guard?: (ctx: AuthzContext) => boolean;
  reason?: string;
  requiresWhen?: (ctx: AuthzContext) => ActionId[];
}

export const POLICY: readonly ActionRule[] = [ /* rows below */ ];
```

The full DocSys rule set:

| Action | Guard | Reason on deny | Notes |
| ------ | ----- | -------------- | ----- |
| `RequestService:Screen` | `attr('status') === 'RECEIVED'` | "Only requests awaiting screening can be screened." | FR-12 |
| `DocumentService:Prepare` | when a resource is supplied (submit path): `attr('status') === 'DRAFTING'`; creation passes | "Only drafts can be submitted for review." | FR-16, FR-21 |
| `DocumentService:Review` | `attr('status') === 'UNDER_REVIEW'` | "Only documents under review can be decided." | FR-21, FR-22 |
| `DocumentService:Sign` | `attr('status')` in `APPROVED`, `ENDORSED` AND `attr('signatoryRequired') === true` | "This document is not awaiting a signature." | FR-25 |
| `DocumentService:Transmit` | `attr('status')` in `APPROVED`, `ENDORSED`, `SIGNED` | "Only approved, endorsed, or signed documents can be transmitted." | FR-26..28 |
| `DocumentService:Close` | `attr('status')` in `APPROVED`, `ENDORSED`, `DENIED`, `TRANSMITTED` | "This request is not in a closable state." | FR-30 |
| `EventService:Update` | `attr('status') !== 'CANCELLED'` | "Cancelled events cannot be edited." | FR-41 |
| `EventService:Cancel` | `attr('status') !== 'CANCELLED'` | "This event is already cancelled." | FR-41 |
| `EventService:Create` | none; `requiresWhen: (ctx) => ctx.resource?.attributes.venueSpecialUse === true ? ['EventService:BookSpecialVenue'] : []` | (extra grant checked with the standard reason) | FR-41 |
| `EventService:Update` | as above plus the same `requiresWhen` | | FR-41 |
| `UserService:Deactivate` | `attr('id') !== ctx.subject.userId` | "You cannot deactivate your own account." | FR-03 |

All other actions have no attribute guard; the grant check alone decides.

Resource attribute convention: views and services pass the loaded entity's fields under `resource.attributes` (`status`, `signatoryRequired`, `id`, `venueSpecialUse`, and so on). The convention for a missing attribute is deny, never allow.

---

## Guard Semantics

- A guard receives `AuthzContext` and returns a boolean.
- `requiresWhen` returns extra actions that must also satisfy the grant check (wildcards apply). It exists for attribute-driven elevated permissions, such as special-use venues requiring `EventService:BookSpecialVenue`.
- If an action has a rule with a `guard` but no `resource` was supplied, the decision denies with `ATTRIBUTE_DENIED` and the rule reason. Actions whose guard is optional (the `Prepare` submit path) express that by checking `ctx.resource !== null` inside the guard.
- Guards are pure. No fetches, no clocks, no randomness.
- One rule per action. If an action needs compound logic, the guard composes it; the table stays flat and greppable.

---

## authorizeOrThrow

`app/src/authz/authorize.ts`:

```ts
export function authorizeOrThrow(
  engine: IAuthorizationEngine,
  action: ActionId,
  resource?: AuthzResource | null,
): void {
  const decision = engine.decide({ action, resource });
  if (!decision.allowed) {
    throw {
      code: 'FORBIDDEN',
      message: decision.reason ?? 'You do not have permission to perform this action.',
    } satisfies AppErrorShape;
  }
}
```

Used by every service method except the ungated set (`SessionService.*`, `UserService.getCurrent`, `RoleService.permissionCatalog`). See [services-spec.md](./services-spec.md) for per-method mappings.

---

## Provider and Hydration

`app/src/authz/provider.tsx`:

1. Reads the session snapshot from the session provider.
2. Calls `engine.setSubject(buildSubject(snapshot))` whenever the snapshot changes (login, refresh, logout to null).
3. Exposes the engine through context for the hooks.

```ts
export function buildSubject(snapshot: SessionSnapshot | null): AuthzSubject | null {
  if (!snapshot) return null;
  return {
    userId: snapshot.user.id,
    roles: snapshot.user.roles.map((role) => role.name),
    permissions: snapshot.user.effectivePermissions,
    office: snapshot.user.office,
    position: snapshot.user.position,
  };
}
```

Provider order in the tree: `SessionProvider` then `AuthorizationProvider` then `ServiceProvider` (services need the engine; hooks need all three).

---

## React Bindings

Implemented in `app/src/hooks/useAuthorization.ts`. The subject subscription uses `useSyncExternalStore` so any component that reads the engine re-renders exactly when the subject changes:

```ts
const subject = useSyncExternalStore(
  (listener) => engine.subscribe(listener),
  () => engine.getSubject(),
);
```

`useCan(action, resource?)` memoizes on `[subject, action, stableResourceKey]`. The stable resource key is derived from the resource kind and the attributes the rules actually read (status, signatoryRequired, id, venueSpecialUse). Pass a plain object; the hook normalizes it.

Rules of use (from [hooks-spec.md](./hooks-spec.md)):

- Gate on the most specific resource available.
- Before hydration, return false and let the view render its loading state.
- Never build permission strings by concatenation at a call site; pass `KnownActionId` values.

---

## Error Contract

| Code | Cause | User-facing message |
| ---- | ----- | ------------------- |
| `NO_SESSION` | Subject not loaded yet | "Your session is still loading." |
| `NOT_GRANTED` | Grant check failed | "You do not have permission to perform this action." |
| `ATTRIBUTE_DENIED` | Guard failed | The rule's `reason`. |

When surfaced through a service rejection, all three become `AppError` with `code: 'FORBIDDEN'` and the message above. Views render the message directly.

---

## Test Matrix

Table-driven tests, one file per concern:

1. **Wildcards.** Every row from the wildcard table in [AUTHORIZATION.md](../AUTHORIZATION.md), plus: no grants, empty subject, malformed grant strings.
2. **Decisions.** `NO_SESSION` before hydration; `NOT_GRANTED` with grants but no match; `ATTRIBUTE_DENIED` per guard with a failing resource; allow when grant and guard pass.
3. **`requiresWhen`.** Special venue without `BookSpecialVenue` denies; with it, allows; non-special venue ignores the extra grant.
4. **Guards.** Each row of the policy table gets an allow case and a deny case, including missing attributes (deny).
5. **Subscriptions.** `setSubject` notifies once per listener; unsubscribe stops notifications; logout (`null`) flips `useCan` to false.
6. **`authorizeOrThrow`.** Throws `FORBIDDEN` with the decision reason; returns void on allow.

No network, no React, no cache in these tests.

---

## Drift Check

`KnownActionId` in `app/src/services/contracts/authz.ts` mirrors the backend constants. A small script (`scripts/check-permission-drift.ts`) parses `backend/src/types/permissions.ts` (or queries `permissionCatalog`) and fails when:

- an action exists in the backend but not in the union, or
- the union contains an action the backend no longer defines.

Run it in CI alongside lint. This keeps typo safety without ever turning the union into a grant source.

---

## Security Notes

- The frontend engine is a UX mechanism. The backend re-validates every operation; a client that bypasses the engine gains nothing.
- No secrets, tokens, or role payloads are logged by the engine. `getPermissions()` exists for admin display; do not print it in production consoles.
- Fail closed everywhere: missing subject, missing grant, missing attribute all deny.
- Role names are display data. No code branches on a role name; branch on actions and attributes only.

See also:

- [AUTHORIZATION.md](../AUTHORIZATION.md) - the model and the `me` permission source.
- [SERVICE_CONTRACTS.md](../SERVICE_CONTRACTS.md) - contract types.
- [specs/services-spec.md](./services-spec.md) - where enforcement is wired into services.
- [specs/hooks-spec.md](./hooks-spec.md) - the React bindings.
