# Service Contracts

> **Status:** Draft for review. No service implementation starts until this document is approved.
> **Scope:** The contract between the service layer and every layer above it (hooks, React) and below it (GraphQL transport, cache, authorization engine).
> **Audience:** Engineers implementing the frontend service layer, hooks, and authorization.

This is the first artifact of the frontend restructure. The service layer is **contract-first**: the interfaces and types in this document are written and agreed before any implementation code exists. Implementations (`app/src/services/**`) must conform to these contracts exactly; hooks depend on the contracts, never on concrete classes.

The contract mirrors two backend sources of truth:

1. The GraphQL schema under `backend/src/graphql/**/*.graphql` (operations and data shapes).
2. The backend service interfaces under `backend/src/interfaces/*.service.interface.ts` (domain boundaries).

When the backend schema changes, this contract changes first, then implementations follow.

**Codegen (live):** the entity types the service layer uses are derived from the
schema. `npm run codegen` in `app/` regenerates `app/src/types/graphql.ts` from
the backend SDL, and `app/src/services/contracts.ts` projects those types
(`Pick`/aliases). Regenerate and commit whenever the SDL changes.

---

## Table of Contents

1. [Why Contracts First](#why-contracts-first)
2. [Placement and File Map](#placement-and-file-map)
3. [Contract Rules](#contract-rules)
4. [Shared Contracts](#shared-contracts)
   - [common.ts](#commonts)
   - [models.ts](#modelsts)
   - [errors.ts](#errorsts)
   - [graphql.ts](#graphqlts)
   - [cache.ts](#cachets)
   - [authz.ts](#authzts)
   - [session.ts](#sessionts)
5. [Domain Contracts](#domain-contracts)
6. [Service Registry](#service-registry)
7. [Permission Wildcard Semantics](#permission-wildcard-semantics)
8. [Contract Change Protocol](#contract-change-protocol)
9. [What the Contract Intentionally Does Not Contain](#what-the-contract-intentionally-does-not-contain)

---

## Why Contracts First

The target architecture is a strict four-layer chain:

```
Backend (GraphQL API)  ->  Services  ->  Hooks  ->  React
```

Each layer talks only to the layer directly below it. The contract is what makes that rule enforceable in TypeScript:

- **Hooks depend on interfaces.** A hook receives a service through the `ServiceRegistry` typed by contract; it cannot reach into implementation details, GraphQL documents, or the cache.
- **Implementations are swappable.** Tests and offline demos substitute mock implementations of the same contract. Nothing above the service layer notices.
- **SOLID at the seam.** DIP (upper layers depend on abstractions), ISP (one narrow contract per domain aggregate), LSP (any implementation honors the same behavior), SRP (each contract covers exactly one domain).

---

## Placement and File Map

All contract files live under `app/src/services/contracts/`. They contain **types and interfaces only**. No runtime logic, no GraphQL documents, no React imports, no cache keys, no policy rules.

| File            | Contains                                                             |
| --------------- | -------------------------------------------------------------------- |
| `common.ts`     | Relay-style pagination primitives (`PageInfo`, `Edge`, `Connection`, `ConnectionArgs`) |
| `models.ts`     | Schema-mirrored domain models and enums (Request, Document, Event, ...) |
| `errors.ts`     | `ServiceErrorCode`, `AppErrorShape`, `isAppError`                    |
| `graphql.ts`    | `IGraphQLClient` port and operation types                            |
| `cache.ts`      | `IClientCache` port (implemented by the client cache)                |
| `authz.ts`      | `IAuthorizationEngine`, subject/resource/decision types, `ActionId`  |
| `session.ts`    | `ISessionService`, session snapshot types                            |
| `request.ts`    | `IRequestService` + intake input/filter types                        |
| `document.ts`   | `IDocumentService` + preparation/review/transmission types           |
| `attachment.ts` | `IAttachmentService` + upload/download types                         |
| `event.ts`      | `IEventService` + booking input/filter types                         |
| `venue.ts`      | `IVenueService`                                                      |
| `notification.ts` | `INotificationService` + inbox filter types                        |
| `user.ts`       | `IUserService` + profile/role-assignment types                       |
| `role.ts`       | `IRoleService` + role input types                                    |
| `report.ts`     | `IReportService` + dashboard/report types                            |
| `lookup.ts`     | `ILookupService` + reference-data input types                        |
| `registry.ts`   | `ServiceRegistry`, the composition-root contract                     |
| `index.ts`      | Barrel re-export                                                     |

---

## Contract Rules

1. **Types, interfaces, and pure guards only.** A contract file may declare types, interfaces, `const` type maps, and pure type guards (for example `isAppError`); nothing else with runtime behavior. GraphQL document strings live in `app/src/services/graphql/`, not here.
2. **Mirror the backend, do not invent.** Method names and input fields track the backend GraphQL operations and service interfaces. Where the backend derives data from the authenticated token (actor id, current user), the frontend contract omits the parameter.
3. **One aggregate per contract.** `IRequestService` covers the request aggregate; `IDocumentService` covers output documents. No cross-domain methods.
4. **Explicit inputs and outputs.** Every method declares a concrete parameter type and a concrete return type. No `any` in a contract signature.
5. **All rejections are `AppError`.** Service methods reject with an error carrying a `ServiceErrorCode` and a user-safe message (see `errors.ts`). Hooks translate them; components render them.
6. **No hardcoded grants.** No contract file lists permissions, roles, or role-to-permission mappings. Permissions come from the backend `me` query at runtime (see [AUTHORIZATION.md](./AUTHORIZATION.md)).
7. **Dates are ISO strings.** The backend `DateTime` scalar crosses the wire as an ISO 8601 string; models type it as `ISODateTime`.
8. **Adding a method is additive.** Extending a contract does not modify existing methods. Implementations and hooks pick up new methods explicitly.

---

## Shared Contracts

### common.ts

```ts
// app/src/services/contracts/common.ts

export type SortDirection = 'ASC' | 'DESC';

/** ISO 8601 timestamp string (backend `DateTime` scalar). */
export type ISODateTime = string;

/** Relay-style pagination metadata. Mirrors `PageInfo` in the backend schema. */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  totalCount: number;
}

/** Relay-style edge. Mirrors `*Edge` types in the backend schema. */
export interface Edge<T> {
  node: T;
  cursor: string;
}

/** Relay-style connection. Mirrors `*Connection` types in the backend schema. */
export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

/** Sort argument accepted by every list operation. */
export interface SortArg<TSortField extends string> {
  field: TSortField;
  direction?: SortDirection;
}

/**
 * Common list arguments. Mirrors the shared list signature on every
 * backend list operation (`first`, `after`, `search`, `filter`, `sort`).
 */
export interface ConnectionArgs<TFilter = never, TSortField extends string = string> {
  first?: number;
  after?: string | null;
  search?: string | null;
  filter?: TFilter | null;
  sort?: SortArg<TSortField> | null;
}
```

### models.ts

Domain models mirror the GraphQL schema one-to-one. Object fields that the schema marks nullable are optional or nullable here.

```ts
// app/src/services/contracts/models.ts

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
```

### errors.ts

Every service rejection is an `AppError`. Hooks translate `AppError` into user-facing state; components render `error.message` directly. Raw backend text (stack traces, SQL, internal ids) never reaches the UI.

```ts
// app/src/services/contracts/errors.ts

export type ServiceErrorCode =
  | 'UNAUTHENTICATED' // no session / expired token
  | 'FORBIDDEN'       // authorization denied (see authz.ts)
  | 'NOT_FOUND'       // entity does not exist or is not visible
  | 'CONFLICT'        // state conflict (duplicate, invalid transition, booking clash)
  | 'VALIDATION'      // input rejected before the round trip
  | 'NETWORK'         // transport failure (offline, timeout, 5xx)
  | 'UNKNOWN';        // anything else, message still user-safe

/** Shape every service rejection carries. */
export interface AppErrorShape {
  /** Stable, programmatic discriminator. */
  code: ServiceErrorCode;
  /** User-safe message. Safe to render directly. */
  message: string;
  /** Original cause for logging. Never rendered. */
  cause?: unknown;
}

export function isAppError(value: unknown): value is AppErrorShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}
```

### graphql.ts

The transport port. Services depend on `IGraphQLClient`; the concrete adapter (fetch-based) lives in `app/src/services/graphql/client.ts` and is injected at the composition root. This keeps services testable without a network.

```ts
// app/src/services/contracts/graphql.ts

export interface GraphQLOperation<TVariables = Record<string, unknown>> {
  /** Query or mutation document text. */
  document: string;
  variables?: TVariables;
  operationName?: string;
}

export interface IGraphQLClient {
  /**
   * Execute one operation against POST /graphql.
   * - Attaches the session Bearer token.
   * - Maps transport and GraphQL errors to AppError (see errors.ts).
   * Rejects with AppErrorShape on any failure.
   */
  request<TData, TVariables = Record<string, unknown>>(
    operation: GraphQLOperation<TVariables>,
  ): Promise<TData>;
}
```

Transport facts (fixed by the backend, not by this contract):

- Endpoint: `POST {NEXT_PUBLIC_GRAPHQL_URL}` with JSON body `{ query, variables, operationName }`.
- Auth: `Authorization: Bearer <Keycloak access token>`; the backend verifies it via Keycloak JWKS per request.
- Multipart uploads and file bytes never pass through GraphQL. Uploads go to `POST /uploads/requests/:requestId` and `POST /uploads/documents/:documentId`; downloads use the `*AttachmentDownload` mutations, which return a `DownloadTicket`.

### cache.ts

The client cache port. Services are the only layer that reads or writes the cache; the implementation lives in `app/src/services/cache/`. Full design in [CACHE_MANAGER.md](./CACHE_MANAGER.md).

```ts
// app/src/services/contracts/cache.ts

export type CacheQueryType = 'get' | 'list';

/** Metadata stored for one cached query. */
export interface CacheQueryRecord {
  /** PascalCase entity names involved (e.g. ['Request']). */
  entities: string[];
  /** Normalized entity keys produced by the query (e.g. ['Request_abc']). */
  ids: string[];
  type: CacheQueryType;
  /** Absolute expiry timestamp in ms. */
  ttl: number;
  /**
   * Predicate deciding whether a newly created entity belongs to this query.
   * Conservative default matches everything; see CACHE_MANAGER.md.
   */
  match?: ((entity: unknown) => boolean) | null;
  /** Relay end cursor captured on cache miss, replayed on hit. */
  endCursor: string | null;
}

export interface IClientCache {
  hasValidQuery(queryKey: string): boolean;
  getQuery(queryKey: string): CacheQueryRecord | null;
  setQuery(queryKey: string, record: CacheQueryRecord): void;

  getEntity<T>(entityName: string, entityId: string): T | null;
  setEntity<T>(entityName: string, entityId: string, entity: T): void;

  /** Entity to query-keys mapping (drives update/delete invalidation). */
  registerMembership(entityName: string, entityId: string, queryKey: string): void;
  /** Entity type to query-keys mapping (drives create invalidation). */
  registerEntityType(entityName: string, queryKey: string): void;

  invalidateByEntity(entityName: string, entityId: string): void;
  invalidateByEntityType(entityName: string, entity: unknown): void;

  clear(): void;
}
```

### authz.ts

The authorization engine port. The engine is hydrated from the backend `me` query; it holds no hardcoded grants. Full model in [AUTHORIZATION.md](./AUTHORIZATION.md) and [specs/authz-spec.md](./specs/authz-spec.md).

```ts
// app/src/services/contracts/authz.ts

/**
 * A "Service:Action" permission identifier (NFR-21).
 * These strings are defined once in the backend (`backend/src/types/permissions.ts`)
 * and returned to the client via `me.effectivePermissions` and `permissionCatalog`.
 * The frontend uses them as opaque identifiers. It never maps roles to them locally.
 */
export type ActionId = string;

/** Generated union of the known actions, kept in lockstep with the backend. */
export type KnownActionId =
  | 'UserService:Read' | 'UserService:Create' | 'UserService:Update'
  | 'UserService:Deactivate' | 'UserService:AssignRole' | 'UserService:ViewPermissions'
  | 'RoleService:Read' | 'RoleService:Create' | 'RoleService:Update'
  | 'NotificationService:Read' | 'NotificationService:MarkRead'
  | 'RequestService:Read' | 'RequestService:Encode' | 'RequestService:Screen'
  | 'DocumentService:Read' | 'DocumentService:Prepare' | 'DocumentService:Review'
  | 'DocumentService:Sign' | 'DocumentService:Transmit' | 'DocumentService:Close'
  | 'DocumentService:CreateStandalone'
  | 'AttachmentService:Upload' | 'AttachmentService:Read' | 'AttachmentService:Download'
  | 'ReportService:Read' | 'ReportService:Export'
  | 'EventService:Read' | 'EventService:Create' | 'EventService:Update'
  | 'EventService:Cancel' | 'EventService:BookSpecialVenue'
  | 'VenueService:Read' | 'VenueService:Manage';

/** Subject attributes. Hydrated from the backend `me` query. */
export interface AuthzSubject {
  userId: string;
  /** Role names (display and audit only; grants come from permissions). */
  roles: readonly string[];
  /** Effective permissions: union of role payloads, wildcards included (FR-05). */
  permissions: readonly string[];
  office?: string;
  position?: string;
}

/** Resource attributes. The entity the action targets. */
export interface AuthzResource {
  /** Entity kind: 'request' | 'document' | 'event' | ... */
  kind: string;
  /** Entity attributes evaluated by policy guards. */
  attributes: Readonly<Record<string, unknown>>;
}

export interface AuthzRequest {
  action: ActionId;
  resource?: AuthzResource | null;
}

export type AuthzDenyCode = 'NO_SESSION' | 'NOT_GRANTED' | 'ATTRIBUTE_DENIED';

export interface AuthzDecision {
  allowed: boolean;
  /** User-safe explanation when denied. */
  reason?: string;
  /** Programmatic deny code when denied. */
  code?: AuthzDenyCode;
}

export interface IAuthorizationEngine {
  /** True once a subject is loaded from the backend `me` query. */
  isHydrated(): boolean;
  getSubject(): AuthzSubject | null;
  getPermissions(): readonly string[];
  getRoles(): readonly string[];
  /** Full ABAC decision: grant check plus attribute guards. */
  decide(request: AuthzRequest): AuthzDecision;
  /** Convenience wrapper over decide(). */
  can(action: ActionId, resource?: AuthzResource | null): boolean;
  /** Replace the subject (session bootstrap / refresh / logout). */
  setSubject(subject: AuthzSubject | null): void;
  /** Subscribe to subject changes. Returns an unsubscribe function. */
  subscribe(listener: (subject: AuthzSubject | null) => void): () => void;
}
```

### session.ts

Session service port. Owns the Keycloak OIDC flow, the access token, and the session bootstrap that loads `me` (the permission source). No component talks to Keycloak directly.

```ts
// app/src/services/contracts/session.ts

import type { ISODateTime } from './common';

export interface SessionRole {
  id: string;
  name: string;
  description: string;
  /** Permission strings as stored on the role. */
  permissionPayload: string[];
}

export interface SessionUser {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  email: string;
  contactNo: string;
  office: string;
  position: string;
  roles: SessionRole[];
  /** Union of role payloads (FR-05). The single source of grants. */
  effectivePermissions: string[];
}

export interface SessionSnapshot {
  user: SessionUser;
  /** When the current token was issued. */
  authenticatedAt: ISODateTime;
  /** Access token expiry, when known. */
  expiresAt?: ISODateTime | null;
}

export interface ISessionService {
  getSnapshot(): SessionSnapshot | null;
  isAuthenticated(): boolean;

  /** Current Keycloak access token for the GraphQL client, or null. */
  getAccessToken(): Promise<string | null>;

  /** Start the OIDC Authorization Code + PKCE redirect. */
  login(returnTo?: string): Promise<void>;

  /** Complete the OIDC callback (token exchange), then load `me`. */
  completeLogin(): Promise<SessionSnapshot>;

  /** Clear the session and redirect to Keycloak logout. */
  logout(): Promise<void>;

  /** Re-fetch `me` and rebuild the snapshot (also refreshes the engine subject). */
  loadSession(): Promise<SessionSnapshot>;

  /** Subscribe to session changes. Returns an unsubscribe function. */
  subscribe(listener: (snapshot: SessionSnapshot | null) => void): () => void;
}
```

---

## Domain Contracts

Each domain contract mirrors one backend service domain and the GraphQL operations it owns. Method docs cite the requirement ids from `backend/requirements.txt` where relevant.

### request.ts

```ts
// app/src/services/contracts/request.ts

import type { Connection, ConnectionArgs, ISODateTime } from './common';
import type { Request, RequestType, RequestPriority, RequestChannel, RequestSortField } from './models';

export interface EncodeRequestInput {
  requestTypeId: string;
  title: string;
  requestingParty: string;
  originOffice: string;
  channel: RequestChannel;
  priority?: RequestPriority;
  /** Receipt date; defaults to now when omitted. */
  receivedAt?: ISODateTime | null;
}

export interface ScreenRequestInput {
  requestId: string;
  passed: boolean;
  /** Required when passed = false (FR-13). */
  deficiencies?: string[] | null;
  notes?: string | null;
}

export interface RequestFilter {
  status?: Request['status'] | null;
  requestTypeId?: string | null;
  originOffice?: string | null;
  priority?: RequestPriority | null;
  slaAtRisk?: boolean | null;
  slaOverdue?: boolean | null;
  receivedFrom?: ISODateTime | null;
  receivedTo?: ISODateTime | null;
}

export interface IRequestService {
  /** Reads (FR-32..34). Action: RequestService:Read. */
  getById(id: string): Promise<Request | null>;
  getByControlNo(controlNo: string): Promise<Request | null>;
  list(args: ConnectionArgs<RequestFilter, RequestSortField>): Promise<Connection<Request>>;
  listTypes(includeInactive?: boolean): Promise<RequestType[]>;

  /** Step 1: encode reception; issues a control number (FR-07..11). Action: RequestService:Encode. */
  encode(input: EncodeRequestInput): Promise<Request>;

  /** Step 2: screening decision (FR-12..15). Action: RequestService:Screen. */
  screen(input: ScreenRequestInput): Promise<Request>;

  /** Resubmit a returned request (FR-14). Action: RequestService:Screen. */
  resubmit(requestId: string): Promise<Request>;
}
```

### document.ts

```ts
// app/src/services/contracts/document.ts

import type { Connection, ConnectionArgs, ISODateTime } from './common';
import type {
  Document,
  DocumentType,
  DocumentStatus,
  ReviewDecision,
  TransmissionMethod,
  DocumentSortField,
} from './models';

export interface PrepareDocumentInput {
  /** Omit for a standalone issuance (EO / MO). */
  requestId?: string | null;
  documentTypeId: string;
  title: string;
  assignedTo?: string | null;
  signatoryRequired?: boolean;
}

export interface ReviewDocumentInput {
  documentId: string;
  decision: ReviewDecision;
  /** Mandatory when decision = DENIED (FR-23). */
  denialReason?: string | null;
  decisionNotes?: string | null;
  signatoryRequired?: boolean;
}

export interface SignDocumentInput {
  documentId: string;
  signedBy: string;
  signedAt?: ISODateTime | null;
}

export interface TransmitDocumentInput {
  documentId: string;
  recipientName: string;
  receivingOffice: string;
  receivedBy: string;
  method: TransmissionMethod;
  transmittedAt?: ISODateTime | null;
  notes?: string | null;
  proofAttachmentId?: string | null;
}

export interface CloseRequestInput {
  requestId: string;
  /** SIGNED_FINAL attachment id, required before closing (FR-29). */
  finalAttachmentId?: string | null;
  notes?: string | null;
}

export interface DocumentFilter {
  status?: DocumentStatus | null;
  documentTypeId?: string | null;
  requestId?: string | null;
  assignedTo?: string | null;
}

export interface IDocumentService {
  /** Reads. Action: DocumentService:Read. */
  getById(id: string): Promise<Document | null>;
  getByControlNo(controlNo: string): Promise<Document | null>;
  list(args: ConnectionArgs<DocumentFilter, DocumentSortField>): Promise<Connection<Document>>;
  listByRequest(requestId: string): Promise<Document[]>;
  listTypes(includeInactive?: boolean): Promise<DocumentType[]>;

  /** Step 3: create an output document (FR-16..18). Action: DocumentService:Prepare
   *  (DocumentService:CreateStandalone when requestId is omitted). */
  prepare(input: PrepareDocumentInput): Promise<Document>;

  /** Submit a draft for review (FR-21). Action: DocumentService:Prepare. */
  submitForReview(documentId: string): Promise<Document>;

  /** Step 4: approve / endorse / deny (FR-22..24). Action: DocumentService:Review. */
  review(input: ReviewDocumentInput): Promise<Document>;

  /** Step 4: record the Mayor signature event (FR-25). Action: DocumentService:Sign. */
  sign(input: SignDocumentInput): Promise<Document>;

  /** Step 5: record a transmission (FR-26..28). Action: DocumentService:Transmit. */
  transmit(input: TransmitDocumentInput): Promise<Document>;

  /** Step 6: close the request (FR-29..31). Action: DocumentService:Close. */
  close(input: CloseRequestInput): Promise<Document>;
}
```

### attachment.ts

```ts
// app/src/services/contracts/attachment.ts

import type { DocumentAttachment, RequestAttachment, DocumentAttachmentKind, RequestAttachmentKind, DownloadTicket } from './models';

export interface UploadRequestAttachmentInput {
  requestId: string;
  kind: RequestAttachmentKind;
  /** File selected in the browser. The service streams it as multipart. */
  file: File;
}

export interface UploadDocumentAttachmentInput {
  documentId: string;
  kind: DocumentAttachmentKind;
  file: File;
}

export interface IAttachmentService {
  /** Reads. Action: AttachmentService:Read. */
  listRequestAttachments(requestId: string): Promise<RequestAttachment[]>;
  listDocumentAttachments(documentId: string): Promise<DocumentAttachment[]>;

  /**
   * Upload-only (FR-10). The service POSTs multipart to the REST route
   * `/uploads/requests/:requestId`. Action: AttachmentService:Upload.
   * The server computes the SHA-256 checksum; the client never generates content.
   */
  uploadRequestAttachment(input: UploadRequestAttachmentInput): Promise<RequestAttachment>;

  /** Same contract for document attachments. Action: AttachmentService:Upload. */
  uploadDocumentAttachment(input: UploadDocumentAttachmentInput): Promise<DocumentAttachment>;

  /** Presigned inline/download tickets (FR-34, NFR-06). Action: AttachmentService:Download. */
  getRequestAttachmentDownload(id: string, inline?: boolean): Promise<DownloadTicket>;
  getDocumentAttachmentDownload(id: string, inline?: boolean): Promise<DownloadTicket>;
}
```

### event.ts

```ts
// app/src/services/contracts/event.ts

import type { Connection, ConnectionArgs } from './common';
import type { Event, EventStatus, BookingConflict, EventSortField } from './models';

export interface CreateEventInput {
  venueId: string;
  title: string;
  organizerId?: string | null;
  department: string;
  /** YYYY-MM-DD. */
  eventDate: string;
  /** HH:MM(:SS). */
  startTime: string;
  endTime: string;
  status?: EventStatus;
  involvesMayor?: boolean;
  involvesAdministrator?: boolean;
  notes?: string | null;
  /** Required-attendee user ids (must be system users). */
  attendeeIds?: string[];
}

export interface UpdateEventInput {
  eventId: string;
  venueId?: string;
  title?: string;
  organizerId?: string | null;
  department?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  status?: EventStatus;
  involvesMayor?: boolean;
  involvesAdministrator?: boolean;
  notes?: string | null;
  attendeeIds?: string[];
}

export interface EventFilter {
  venueId?: string | null;
  status?: EventStatus | null;
  department?: string | null;
  involvesMayor?: boolean | null;
  involvesAdministrator?: boolean | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface IEventService {
  /** Reads. Action: EventService:Read. */
  getById(id: string): Promise<Event | null>;
  list(args: ConnectionArgs<EventFilter, EventSortField>): Promise<Connection<Event>>;

  /** The authenticated user's schedule (FR-44). Action: EventService:Read. */
  listMySchedule(date?: string): Promise<Event[]>;

  /** Dry-run conflict detection for a proposed slot (FR-42). Action: EventService:Read. */
  checkConflicts(input: CreateEventInput): Promise<BookingConflict[]>;

  /** Create with conflict enforcement (FR-41..43). Action: EventService:Create
   *  (plus EventService:BookSpecialVenue when the venue is special-use). */
  create(input: CreateEventInput): Promise<Event>;

  /** Edit (FR-41). Action: EventService:Update. */
  update(input: UpdateEventInput): Promise<Event>;

  /** Cancellation is a status change, never a delete (FR-41). Action: EventService:Cancel. */
  cancel(eventId: string, reason?: string | null): Promise<Event>;
}
```

### venue.ts

```ts
// app/src/services/contracts/venue.ts

import type { Venue } from './models';

export interface IVenueService {
  /** Action: VenueService:Read. */
  getById(id: string): Promise<Venue | null>;
  list(includeInactive?: boolean): Promise<Venue[]>;
}
```

### notification.ts

```ts
// app/src/services/contracts/notification.ts

import type { Connection, ConnectionArgs } from './common';
import type { Notification, NotificationType, NotificationSortField } from './models';

export interface NotificationFilter {
  unreadOnly?: boolean | null;
  type?: NotificationType | null;
}

export interface INotificationService {
  /** The authenticated user's inbox, newest-first (FR-48). Action: NotificationService:Read. */
  listInbox(args: ConnectionArgs<NotificationFilter, NotificationSortField>): Promise<Connection<Notification>>;

  /** Unread count for the bell (FR-48). Action: NotificationService:Read. */
  unreadCount(): Promise<number>;

  /** Mark one notification read (FR-49). Action: NotificationService:MarkRead. */
  markRead(id: string): Promise<Notification | null>;

  /** Mark all read (FR-49). Action: NotificationService:MarkRead. */
  markAllRead(): Promise<number>;

  /** Idempotently materialize event reminders (FR-45). Action: NotificationService:Read. */
  generateEventReminders(): Promise<number>;
}
```

### user.ts

```ts
// app/src/services/contracts/user.ts

import type { Connection, ConnectionArgs } from './common';
import type { User, UserSortField } from './models';

export interface UpdateUserProfileInput {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  suffix?: string | null;
  email?: string;
  contactNo?: string;
  office?: string;
  position?: string;
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
}

export interface RemoveRoleInput {
  userId: string;
  roleId: string;
}

export interface UserFilter {
  isActive?: boolean | null;
  office?: string | null;
  roleName?: string | null;
}

export interface IUserService {
  /** The authenticated user's shadow record. Ungated: part of session bootstrap. */
  getCurrent(): Promise<User | null>;

  /** Action: UserService:Read. */
  getById(id: string): Promise<User | null>;
  list(args: ConnectionArgs<UserFilter, UserSortField>): Promise<Connection<User>>;

  /** Action: UserService:Update. */
  updateProfile(id: string, input: UpdateUserProfileInput): Promise<User>;

  /** Soft deactivation, never delete (FR-03). Action: UserService:Deactivate. */
  deactivate(id: string): Promise<User>;
  reactivate(id: string): Promise<User>;

  /** Role assignment records who granted it and when (FR-04). Action: UserService:AssignRole. */
  assignRole(input: AssignRoleInput): Promise<User>;
  removeRole(input: RemoveRoleInput): Promise<User>;
}
```

### role.ts

```ts
// app/src/services/contracts/role.ts

import type { Connection, ConnectionArgs } from './common';
import type { Role, PermissionCatalogEntry, RoleSortField } from './models';

export interface CreateRoleInput {
  name: string;
  description: string;
  /** Validated against ^[\w*]+:[\w*]+$ on write (NFR-21). */
  permissionPayload: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionPayload?: string[];
}

export interface RoleFilter {
  name?: string | null;
}

export interface IRoleService {
  /** Action: RoleService:Read. */
  getById(id: string): Promise<Role | null>;
  list(args: ConnectionArgs<RoleFilter, RoleSortField>): Promise<Connection<Role>>;

  /** The static permission catalog defined in backend code (NFR-21).
   *  Ungated: used by admin screens and contract validation. */
  permissionCatalog(): Promise<PermissionCatalogEntry[]>;

  /** Action: RoleService:Create. */
  create(input: CreateRoleInput): Promise<Role>;

  /** Action: RoleService:Update. */
  update(id: string, input: UpdateRoleInput): Promise<Role>;
}
```

### report.ts

```ts
// app/src/services/contracts/report.ts

import type { DashboardMetrics, CategorySummaryRow, ReportArtifact, ReportFormat, ReportPeriod } from './models';

export interface CategorySummaryInput {
  period: ReportPeriod;
  year: number;
  /** Required when period = MONTHLY (1-12). */
  month?: number | null;
}

export interface ExportReportInput extends CategorySummaryInput {
  format: ReportFormat;
}

export interface IReportService {
  /** Workload and SLA snapshot for the dashboard (FR-35). Action: ReportService:Read. */
  getDashboardMetrics(): Promise<DashboardMetrics>;

  /** Monthly / annual per-category counts (FR-36). Action: ReportService:Read. */
  getCategorySummary(input: CategorySummaryInput): Promise<CategorySummaryRow[]>;

  /** Export a summary to PDF or Excel (FR-37). Action: ReportService:Export. */
  exportSummary(input: ExportReportInput): Promise<ReportArtifact>;
}
```

### lookup.ts

```ts
// app/src/services/contracts/lookup.ts

import type { RequestType, DocumentType, Holiday } from './models';

export interface UpsertRequestTypeInput {
  code: string;
  name: string;
  description: string;
  prefix: string;
  isActive?: boolean;
}

export interface UpsertDocumentTypeInput {
  code: string;
  name: string;
  description: string;
  prefix: string;
  isActive?: boolean;
}

export interface UpsertHolidayInput {
  /** YYYY-MM-DD. */
  holidayDate: string;
  name: string;
}

/**
 * Reference data (request types, document types, holiday calendar).
 * Read actions gate under the consuming domain (see specs/services-spec.md):
 * requestTypes -> RequestService:Read, documentTypes -> DocumentService:Read,
 * holidays -> ReportService:Read.
 */
export interface ILookupService {
  listRequestTypes(includeInactive?: boolean): Promise<RequestType[]>;
  listDocumentTypes(includeInactive?: boolean): Promise<DocumentType[]>;

  /** Holidays within [from, to); feeds SLA computation (FR-09). */
  listHolidays(from?: string | null, to?: string | null): Promise<Holiday[]>;

  /** Action: RequestService:Encode (admin maintenance). */
  createRequestType(input: UpsertRequestTypeInput): Promise<RequestType>;

  /** Action: DocumentService:Prepare (admin maintenance). */
  createDocumentType(input: UpsertDocumentTypeInput): Promise<DocumentType>;

  /** Action: ReportService:Read (admin maintenance). */
  upsertHoliday(input: UpsertHolidayInput): Promise<Holiday>;
}
```

---

## Service Registry

The composition root constructs one object per contract and provides it to the React tree. Hooks read services from this registry only.

```ts
// app/src/services/contracts/registry.ts

import type { IAuthorizationEngine } from './authz';
import type { ISessionService } from './session';
import type { IRequestService } from './request';
import type { IDocumentService } from './document';
import type { IAttachmentService } from './attachment';
import type { IEventService } from './event';
import type { IVenueService } from './venue';
import type { INotificationService } from './notification';
import type { IUserService } from './user';
import type { IRoleService } from './role';
import type { IReportService } from './report';
import type { ILookupService } from './lookup';

export interface ServiceRegistry {
  session: ISessionService;
  authz: IAuthorizationEngine;
  requests: IRequestService;
  documents: IDocumentService;
  attachments: IAttachmentService;
  events: IEventService;
  venues: IVenueService;
  notifications: INotificationService;
  users: IUserService;
  roles: IRoleService;
  reports: IReportService;
  lookups: ILookupService;
}
```

Wiring order at the composition root:

```
IGraphQLClient + IClientCache + IAuthorizationEngine
        |
        v
createServices(...) -> ServiceRegistry -> React context -> hooks
```

`IAuthorizationEngine` is constructed first (empty subject), then hydrated by `ISessionService.loadSession()` after login. `IGraphQLClient` reads the token through `ISessionService.getAccessToken()`.

---

## Permission Wildcard Semantics

Grants fetched from the backend support wildcards. The frontend evaluates them with the same rules as the backend (`permissionSatisfies` in `backend/src/types/permissions.ts`):

| Granted            | Required                   | Satisfied |
| ------------------ | -------------------------- | --------- |
| `*:*`              | anything                   | yes       |
| `DocumentService:*`| `DocumentService:Review`   | yes       |
| `DocumentService:Review` | `DocumentService:Review` | yes     |
| `DocumentService:Read`   | `DocumentService:Review` | no      |
| `*:Review`         | `DocumentService:Review`   | yes (wildcard service) |

These rules live in the engine implementation, not in any contract file.

---

## Contract Change Protocol

1. **Backend changes first.** The backend schema (`backend/src/graphql/*.graphql`) and permission constants (`backend/src/types/permissions.ts`) are the source. The contract mirrors them.
2. **Regenerate `KnownActionId`.** The union in `authz.ts` is generated from the backend permission constants. A CI check can diff the union against the `permissionCatalog` query result to catch drift.
3. **Contract change lands with the implementation change.** No implementation may temporarily violate its contract; TypeScript strict mode is the enforcement.
4. **Version the cache namespace.** When a model's shape changes, bump the cache key namespace (`v1` to `v2`) so stale client caches cannot serve old shapes.

---

## What the Contract Intentionally Does Not Contain

- GraphQL document strings (they live in `app/src/services/graphql/`).
- Cache keys, TTLs, and invalidation logic (they live in the cache implementation and services).
- ABAC policy rules (they live in `app/src/authz/policy.ts`).
- Role-to-permission mappings or permission lists used as grants (grants come only from the backend `me` query).
- React imports of any kind.

---

See also:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - the four-layer chain these contracts serve.
- [AUTHORIZATION.md](./AUTHORIZATION.md) - the ABAC model and the `me` permission source.
- [CACHE_MANAGER.md](./CACHE_MANAGER.md) - the `IClientCache` implementation design.
- [specs/services-spec.md](./specs/services-spec.md) - how services implement these contracts.
- [specs/hooks-spec.md](./specs/hooks-spec.md) - how hooks consume these contracts.
- [specs/authz-spec.md](./specs/authz-spec.md) - engine and policy implementation.
