/**
 * Authorization engine port (ABAC). Hydrated from the backend `me` query;
 * holds no hardcoded grants.
 */

/**
 * A "Service:Action" permission identifier (NFR-21).
 * Defined once in the backend (`backend/src/types/permissions.ts`) and
 * returned via `me.effectivePermissions` / `permissionCatalog`. The frontend
 * treats them as opaque identifiers and never maps roles to them locally.
 */
export type ActionId = string;

/** Known actions, kept in lockstep with the backend permission constants. */
export type KnownActionId =
  | 'UserService:Read'
  | 'UserService:Create'
  | 'UserService:Update'
  | 'UserService:Deactivate'
  | 'UserService:AssignRole'
  | 'UserService:ViewPermissions'
  | 'RoleService:Read'
  | 'RoleService:Create'
  | 'RoleService:Update'
  | 'NotificationService:Read'
  | 'NotificationService:MarkRead'
  | 'RequestService:Read'
  | 'RequestService:Encode'
  | 'RequestService:Screen'
  | 'DocumentService:Read'
  | 'DocumentService:Prepare'
  | 'DocumentService:Review'
  | 'DocumentService:Sign'
  | 'DocumentService:Transmit'
  | 'DocumentService:Close'
  | 'DocumentService:CreateStandalone'
  | 'AttachmentService:Upload'
  | 'AttachmentService:Read'
  | 'AttachmentService:Download'
  | 'ReportService:Read'
  | 'ReportService:Export'
  | 'EventService:Read'
  | 'EventService:Create'
  | 'EventService:Update'
  | 'EventService:Cancel'
  | 'EventService:BookSpecialVenue'
  | 'VenueService:Read'
  | 'VenueService:Manage'
  | 'FolderService:Create';

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
