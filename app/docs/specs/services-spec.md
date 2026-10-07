# Services Layer Specification

> **Scope:** Implementation spec for the service layer under `app/src/services/`. The contracts it implements are defined in [SERVICE_CONTRACTS.md](../SERVICE_CONTRACTS.md).
> **Audience:** Engineers implementing services, the GraphQL client, the session service, and the cache helpers.

The service layer is the only layer that talks to the backend. It implements the contract, owns GraphQL operation documents, orchestrates the client cache, enforces client-side authorization checks, and normalizes every error into `AppError`.

---

## Table of Contents

1. [Layer Position](#layer-position)
2. [Implementation File Layout](#implementation-file-layout)
3. [Service Anatomy](#service-anatomy)
4. [GraphQL Client Adapter](#graphql-client-adapter)
5. [Error Normalization](#error-normalization)
6. [Cache Usage Rules](#cache-usage-rules)
7. [Authorization Enforcement](#authorization-enforcement)
8. [Session Service](#session-service)
9. [Per-Domain Operation Tables](#per-domain-operation-tables)
10. [Mock Implementations](#mock-implementations)
11. [Testing](#testing)
12. [Implementation Order](#implementation-order)
13. [Open Items](#open-items)

---

## Layer Position

```
React (views)  ->  Hooks  ->  Services  ->  IGraphQLClient / IClientCache / IAuthorizationEngine  ->  Backend
```

Services receive their ports through constructor injection. The composition root (`app/src/providers/`) creates one instance of each service and one instance of each port, then exposes the `ServiceRegistry` to the React tree.

Services may call each other only through contracts, and only when the operation composes domains (for example `LookupService` is used by intake forms; `SessionService` is called by the composition root, not by other services).

---

## Implementation File Layout

```
app/src/services/
├── contracts/              # the contract (types only) - see SERVICE_CONTRACTS.md
├── graphql/
│   ├── client.ts           # FetchGraphQLClient implements IGraphQLClient
│   └── <domain>.ts         # operation documents per domain (queries + mutations)
├── cache/
│   ├── client-cache.ts     # ClientCache implements IClientCache (four stores)
│   ├── helpers.ts          # key generation, executeQueryWithCache, invalidation, normalizeError
│   └── index.ts            # single-instance accessor
├── session/
│   └── session.service.ts  # SessionService implements ISessionService (Keycloak OIDC)
├── mocks/
│   ├── fixtures.ts         # dev fixtures (from the old cleanData + data seed)
│   └── mock-services.ts    # fixture-backed implementations of every contract
├── request.service.ts
├── document.service.ts
├── attachment.service.ts
├── event.service.ts
├── venue.service.ts
├── notification.service.ts
├── user.service.ts
├── role.service.ts
├── report.service.ts
├── lookup.service.ts
└── index.ts                # createServices() composition helper
```

---

## Service Anatomy

Every service follows the same shape:

```ts
// app/src/services/request.service.ts
import type { IGraphQLClient } from './contracts/graphql';
import type { IClientCache } from './contracts/cache';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IRequestService, EncodeRequestInput } from './contracts/request';

export class RequestService implements IRequestService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async list(args: ConnectionArgs<RequestFilter, RequestSortField>) {
    authorizeOrThrow(this.authz, 'RequestService:Read');

    const queryKey = generateListCacheKey('v1', 'request', args);
    return executeQueryWithCache({
      cache: this.cache,
      queryKey,
      entities: ['Request'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: buildRequestListMatch(args.filter),
      queryFn: () =>
        this.gql.request<{ requests: Connection<Request> }>({
          document: REQUEST_OPS.requests,
          variables: { ...args },
          operationName: 'Requests',
        }).then((data) => data.requests),
    });
  }

  async encode(input: EncodeRequestInput) {
    authorizeOrThrow(this.authz, 'RequestService:Encode');

    const created = await this.gql.request<{ encodeRequest: Request }>({
      document: REQUEST_OPS.encodeRequest,
      variables: { input },
      operationName: 'EncodeRequest',
    }).then((data) => data.encodeRequest);

    invalidateOnCreate(this.cache, 'Request', created);
    invalidateMetrics(this.cache);
    return created;
  }

  // ...remaining methods follow the same two shapes: cached read, or
  // authorize + mutate + invalidate.
}
```

Rules:

1. **Constructor injection only.** No module-level singletons inside the class; no service importing another service's concrete class.
2. **`authorizeOrThrow` first line** of every method (see [Authorization Enforcement](#authorization-enforcement)).
3. **Reads** use `executeQueryWithCache`. **Mutations** do not use the cache except for invalidation.
4. **Operation documents** live in `app/src/services/graphql/<domain>.ts` as exported constants. Services never inline GraphQL strings.
5. **No React imports.** Services are plain TypeScript.

---

## GraphQL Client Adapter

`FetchGraphQLClient implements IGraphQLClient`:

- Endpoint: `process.env.NEXT_PUBLIC_GRAPHQL_URL` (for example `http://localhost:4000/graphql`).
- Method: `POST` with `Content-Type: application/json`, body `{ query, variables, operationName }`.
- Auth: attaches `Authorization: Bearer <token>` from `ISessionService.getAccessToken()` on every call.
- Response: on `data` returns `data`; on GraphQL errors or transport failure rejects with an `AppErrorShape` (see below).
- 401 handling: the client notifies the session service so the session can refresh or redirect to login, then rejects with `UNAUTHENTICATED`.

### Error mapping

The backend emits structured GraphQL errors with `extensions: { type, status, code, details? }` (see `backend/src/utils/graphql-error-handler.ts`). The client maps them:

| Backend `extensions.code`                        | Client `ServiceErrorCode` |
| ------------------------------------------------ | ------------------------- |
| `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `INVALID_TOKEN` | `UNAUTHENTICATED`      |
| `UNAUTHORIZED`                                   | `FORBIDDEN`               |
| `NOT_FOUND`                                      | `NOT_FOUND`               |
| `ALREADY_EXISTS`, `CONFLICT`, `INVALID_STATE`, `SLA_VIOLATION` | `CONFLICT` |
| `INVALID_INPUT`, `MISSING_FIELD`, `INVALID_FORMAT` | `VALIDATION`            |
| `INTERNAL_ERROR` or absent extensions            | `UNKNOWN`                 |

Transport failures (offline, timeout, non-JSON response) map to `NETWORK`. HTTP status is the fallback when extensions are absent: 401 to `UNAUTHENTICATED`, 403 to `FORBIDDEN`, 404 to `NOT_FOUND`, 400 to `VALIDATION`, 409 and 422 to `CONFLICT`, 5xx to `NETWORK`.

Messages: when the error carries a backend `code` (structured, intentional, user-safe), the message passes through. Unstructured failures get a generic message ("Something went wrong. Please try again."). Stack traces and internal details never pass through.

---

## Error Normalization

One helper (`normalizeError` in `app/src/services/cache/helpers.ts` or a sibling `errors.ts`) converts any thrown value into `AppErrorShape`:

```ts
export function normalizeError(error: unknown): AppErrorShape {
  if (isAppError(error)) return error;                 // already normalized
  if (error instanceof TypeError) return { code: 'NETWORK', message: 'Network unavailable. Check your connection.' };
  return { code: 'UNKNOWN', message: 'Something went wrong. Please try again.', cause: error };
}
```

- Services throw `AppError` with `code: 'FORBIDDEN'` when authorization denies, using the decision reason.
- Validation performed before the round trip (for example a missing denial reason) throws `code: 'VALIDATION'`.
- Hooks catch `AppError` and set error state; views render `error.message` directly. No view scrubs error text.

---

## Cache Usage Rules

Full design in [CACHE_MANAGER.md](../CACHE_MANAGER.md). Implementation rules:

1. Key generation and `executeQueryWithCache` are shared helpers. Services never reimplement them.
2. Every cached read passes `entities` (PascalCase type names), `queryType`, a `matchFn` where creates could affect it, and a TTL from the shared `TTL` constants (`OPERATIONAL = 60_000`, `METRICS = 30_000`, `REFERENCE = 600_000`).
3. Every mutation invalidates per the [Invalidation Matrix](../CACHE_MANAGER.md#invalidation-matrix).
4. Tickets (`DownloadTicket`) are never cached. Dry-run conflict checks are never cached. Report artifacts are never cached.

---

## Authorization Enforcement

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

- Ungated methods: `SessionService.*`, `UserService.getCurrent` (the `me` bootstrap), `RoleService.permissionCatalog`.
- Lookup reads gate under the consuming domain: `listRequestTypes` -> `RequestService:Read`, `listDocumentTypes` -> `DocumentService:Read`, `listHolidays` -> `ReportService:Read`, `venues` -> `VenueService:Read`.
- Lookup maintenance mutations gate under the closest domain action (`createRequestType` -> `RequestService:Encode`, `createDocumentType` -> `DocumentService:Prepare`, `upsertHoliday` -> `ReportService:Read`). These mappings mirror what the backend enforces; confirm and align when the backend lookup service lands (see Open Items).

---

## Session Service

`SessionService implements ISessionService` owns the Keycloak OIDC flow:

1. **Login.** `login(returnTo)` redirects to Keycloak Authorization Code + PKCE (`KEYCLOAK_REALM_URL` + `/protocol/openid-connect/auth`). The return path is carried in `state`.
2. **Callback.** `completeLogin()` reads the code from the URL, exchanges it at the token endpoint, stores the access and refresh tokens in memory (module scope, not localStorage), then calls `loadSession()`.
3. **Bootstrap.** `loadSession()` runs the `SessionBootstrap` query (`me` with roles and `effectivePermissions`), builds `SessionSnapshot`, hands the `AuthzSubject` to `IAuthorizationEngine.setSubject()`, and notifies subscribers.
4. **Token refresh.** Before expiry, refresh silently at the token endpoint. On refresh failure, clear the session and redirect to `/login`.
5. **Logout.** Clear memory tokens, notify subscribers with `null`, redirect to Keycloak end-session.

Configuration (env):

| Variable                       | Example                                              |
| ------------------------------ | ---------------------------------------------------- |
| `NEXT_PUBLIC_GRAPHQL_URL`      | `http://localhost:4000/graphql`                      |
| `NEXT_PUBLIC_KEYCLOAK_URL`     | `http://localhost:8080/realms/docsys`                |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `docsys-backend`                                   |

Notes:

- The app builds as a static export (`next.config.ts` `output: 'export'`), so the OIDC flow is browser-side; no server routes participate.
- Tokens live in memory only. A page refresh re-runs `completeLogin`/`loadSession` via the refresh token if the provider keeps one; otherwise the user re-authenticates.
- A dev fixture mode (`NEXT_PUBLIC_USE_FIXTURES=true`) swaps `SessionService` and all domain services for mock implementations backed by `services/mocks/fixtures.ts`. This replaces the old persona switcher and keeps UI work possible without the backend.

---

## Per-Domain Operation Tables

Columns: **Contract method** -> GraphQL operation -> required action -> cache behavior.

### RequestService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `getById` | `request(id)` | `RequestService:Read` | get, 60 s |
| `getByControlNo` | `requestByControlNo(controlNo)` | `RequestService:Read` | get, 60 s |
| `list` | `requests(first, after, search, filter, sort)` | `RequestService:Read` | list, 60 s, match mirrors filter |
| `listTypes` | `requestTypes(includeInactive)` | `RequestService:Read` | list, 10 min, match always |
| `encode` | `encodeRequest(input)` | `RequestService:Encode` | invalidate create + metrics |
| `screen` | `screenRequest(input)` | `RequestService:Screen` (guard: `RECEIVED`) | invalidate entity + metrics |
| `resubmit` | `resubmitRequest(id)` | `RequestService:Screen` | invalidate entity + metrics |

### DocumentService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `getById` | `document(id)` | `DocumentService:Read` | get, 60 s |
| `getByControlNo` | `documentByControlNo(controlNo)` | `DocumentService:Read` | get, 60 s |
| `list` | `documents(...)` | `DocumentService:Read` | list, 60 s |
| `listByRequest` | `documents(filter: { requestId })` | `DocumentService:Read` | list, 60 s |
| `listTypes` | `documentTypes(includeInactive)` | `DocumentService:Read` | list, 10 min |
| `prepare` | `prepareDocument(input)` | `DocumentService:Prepare` (or `:CreateStandalone` when no `requestId`) | invalidate create + request |
| `submitForReview` | `submitDocumentForReview(id)` | `DocumentService:Prepare` (guard: `DRAFTING`) | invalidate document + request |
| `review` | `reviewDocument(input)` | `DocumentService:Review` (guard: `UNDER_REVIEW`) | invalidate document + request + metrics |
| `sign` | `signDocument(input)` | `DocumentService:Sign` (guard: `APPROVED`/`ENDORSED`, `signatoryRequired`) | invalidate document |
| `transmit` | `transmitDocument(input)` | `DocumentService:Transmit` (guard: `APPROVED`/`ENDORSED`/`SIGNED`) | invalidate document + request |
| `close` | `closeRequest(input)` | `DocumentService:Close` (guard: request `APPROVED`/`ENDORSED`/`DENIED`/`TRANSMITTED`) | invalidate request + linked documents |

### AttachmentService

| Method | Transport | Action | Cache |
| ------ | --------- | ------ | ----- |
| `listRequestAttachments` | `requestAttachments(requestId)` | `AttachmentService:Read` | list, 60 s |
| `listDocumentAttachments` | `documentAttachments(documentId)` | `AttachmentService:Read` | list, 60 s |
| `uploadRequestAttachment` | `POST /uploads/requests/:requestId` (multipart) | `AttachmentService:Upload` | invalidate request |
| `uploadDocumentAttachment` | `POST /uploads/documents/:documentId` (multipart) | `AttachmentService:Upload` | invalidate document |
| `getRequestAttachmentDownload` | `requestAttachmentDownload(id, inline)` | `AttachmentService:Download` | never cached |
| `getDocumentAttachmentDownload` | `documentAttachmentDownload(id, inline)` | `AttachmentService:Download` | never cached |

### EventService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `getById` | `event(id)` | `EventService:Read` | get, 60 s |
| `list` | `events(...)` | `EventService:Read` | list, 60 s |
| `listMySchedule` | `mySchedule(date)` | `EventService:Read` | list, 60 s |
| `checkConflicts` | `checkEventConflicts(input)` | `EventService:Read` | never cached (live check) |
| `create` | `createEvent(input)` | `EventService:Create` (+ `BookSpecialVenue` when venue special-use) | invalidate create + schedule |
| `update` | `updateEvent(input)` | `EventService:Update` (guard: not `CANCELLED`; special-use condition) | invalidate entity + schedule |
| `cancel` | `cancelEvent(id, reason)` | `EventService:Cancel` (guard: not `CANCELLED`) | invalidate entity + schedule |

### VenueService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `getById` | `venue(id)` | `VenueService:Read` | get, 10 min |
| `list` | `venues(includeInactive)` | `VenueService:Read` | list, 10 min |

### NotificationService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `listInbox` | `notifications(...)` | `NotificationService:Read` | list, 60 s |
| `unreadCount` | `unreadNotificationCount` | `NotificationService:Read` | special query, 30 s |
| `markRead` | `markNotificationRead(id)` | `NotificationService:MarkRead` | invalidate notification + count |
| `markAllRead` | `markAllNotificationsRead` | `NotificationService:MarkRead` | invalidate all notification queries + count |
| `generateEventReminders` | `generateEventReminders` | `NotificationService:Read` | invalidate inbox queries |

### UserService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `getCurrent` | `me` | ungated (bootstrap) | not cached (session owns it) |
| `getById` | `user(id)` | `UserService:Read` | get, 60 s |
| `list` | `users(...)` | `UserService:Read` | list, 60 s |
| `updateProfile` | `updateUserProfile(id, input)` | `UserService:Update` | invalidate user |
| `deactivate` | `deactivateUser(id)` | `UserService:Deactivate` (guard: no self) | invalidate user |
| `reactivate` | `reactivateUser(id)` | `UserService:Deactivate` | invalidate user |
| `assignRole` | `assignRole(input)` | `UserService:AssignRole` | invalidate user |
| `removeRole` | `removeRole(input)` | `UserService:AssignRole` | invalidate user |

### RoleService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `getById` | `role(id)` | `RoleService:Read` | get, 60 s |
| `list` | `roles(...)` | `RoleService:Read` | list, 60 s |
| `permissionCatalog` | `permissionCatalog` | ungated | list, 10 min |
| `create` | `createRole(input)` | `RoleService:Create` | invalidate create |
| `update` | `updateRole(id, input)` | `RoleService:Update` | invalidate entity |

### ReportService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `getDashboardMetrics` | `dashboardMetrics` | `ReportService:Read` | special query, 30 s |
| `getCategorySummary` | `categorySummary(input)` | `ReportService:Read` | list, 5 min |
| `exportSummary` | `exportSummary(input)` | `ReportService:Export` | never cached |

### LookupService

| Method | GraphQL operation | Action | Cache |
| ------ | ----------------- | ------ | ----- |
| `listRequestTypes` | `requestTypes(includeInactive)` | `RequestService:Read` | list, 10 min |
| `listDocumentTypes` | `documentTypes(includeInactive)` | `DocumentService:Read` | list, 10 min |
| `listHolidays` | `holidays(from, to)` | `ReportService:Read` | list, 10 min |
| `createRequestType` | `createRequestType(input)` | `RequestService:Encode` | invalidate reference query |
| `createDocumentType` | `createDocumentType(input)` | `DocumentService:Prepare` | invalidate reference query |
| `upsertHoliday` | `upsertHoliday(input)` | `ReportService:Read` | invalidate reference query |

---

## Mock Implementations

`app/src/services/mocks/mock-services.ts` implements every contract over `fixtures.ts` (the seed data currently in `lib/data.ts` and `lib/cleanData.ts`). Purpose:

- UI development without the backend (`NEXT_PUBLIC_USE_FIXTURES=true`).
- Unit tests for hooks and views that need deterministic data.
- Contract behavior demos (create/update flows with in-memory state).

The mocks enforce the same authorization checks against a fixture subject so UI gating can be exercised for multiple roles without Keycloak.

---

## Testing

| Target | Approach |
| ------ | -------- |
| GraphQL client | Unit test against a mocked `fetch`: success, GraphQL error mapping, HTTP fallback, 401 notification. |
| Each service | Unit test with mock `IGraphQLClient`, real `ClientCache`, mock engine: correct operation, variables, cache hit/miss, invalidation calls, authz call order. |
| Cache helpers | Direct unit tests: key determinism (sorted params), TTL expiry, membership invalidation, create invalidation with match functions. |
| Session service | Unit test token exchange and `me` hydration with a mocked OIDC endpoints layer. |

Add a test runner with the implementation (vitest recommended for speed and TS support); the contracts make every dependency mockable without module patching.

---

## Implementation Order

1. `services/contracts/` (already specified; drop in as types).
2. `services/cache/` (client-cache + helpers) with tests.
3. `services/graphql/client.ts` with tests.
4. `services/session/session.service.ts`.
5. `authz/engine.ts` + `authz/policy.ts` (see [authz-spec.md](./authz-spec.md)).
6. Domain services in order: `lookup`, `request`, `document`, `attachment`, `venue`, `event`, `notification`, `user`, `role`, `report`.
7. `mocks/` fixture implementations.
8. `providers/` composition root wiring.

---

## Open Items

1. **Lookup mutation actions.** `createRequestType` / `createDocumentType` / `upsertHoliday` have no dedicated permission domain in the backend catalog. Confirm the backend's enforced action once the lookup service lands and align the table.
2. **Reactivate mapping.** `reactivateUser` currently maps to `UserService:Deactivate`; confirm whether the backend gates it under `UserService:Update`.
3. **Notification refresh cadence.** In-app notifications currently rely on manual refresh plus short TTLs. Confirm whether the backend will expose polling-friendly fields (for example `unreadNotificationCount` on an interval) before adding a polling hook.

See also:

- [SERVICE_CONTRACTS.md](../SERVICE_CONTRACTS.md) - the interfaces these services implement.
- [CACHE_MANAGER.md](../CACHE_MANAGER.md) - the cache the services orchestrate.
- [AUTHORIZATION.md](../AUTHORIZATION.md) - the ABAC model the services enforce.
- [hooks-spec.md](./hooks-spec.md) - the layer that consumes these services.
