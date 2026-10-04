/**
 * Identity Provider Port Interface (Keycloak / OIDC)
 *
 * Abstracts authentication (token verification) and user-account management.
 * The business layer depends on this interface, NOT on Keycloak.
 *
 * [SOLID:DIP]  High-level modules depend on abstractions.
 * [SOLID:ISP]  Focused identity & access operations only.
 * [NFR-05]     No passwords are ever stored in the application database.
 */

/** Decoded Keycloak JWT / user identity payload. */
export interface AuthUser {
  /** Subject (Keycloak "sub" = users.id). */
  sub: string;
  email?: string;
  preferredUsername?: string;
  name?: string;
  /** Realm roles. */
  roles: string[];
}

/** User account information as held by the IDP. */
export interface IdpUser {
  id: string;
  email: string;
  emailVerified: boolean;
  username?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phoneNumberVerified: boolean;
  enabled: boolean;
  notBefore?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateIdpUserInput {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  /** Initial temporary credential handled by Keycloak. */
  password?: string;
  sendVerificationEmail?: boolean;
}

export interface UpdateIdpUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  /** Set to null to remove. */
  phoneNumber?: string | null;
  /** Set to null to remove. */
  username?: string | null;
}

export interface IdpOperationResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/** Identity Provider Port Contract. */
export interface IIdentityProviderPort {
  // --- Authentication (FR-01) ---
  /**
   * Verify a Bearer token against Keycloak JWKS and return the decoded user.
   * Throws AuthenticationError on invalid / expired tokens.
   */
  verifyToken(token: string): Promise<AuthUser>;

  // --- User account management (FR-02..FR-06) ---
  createUser(
    input: CreateIdpUserInput,
  ): Promise<IdpOperationResult & { userId?: string }>;
  updateUser(userId: string, input: UpdateIdpUserInput): Promise<IdpOperationResult>;
  getUser(userId: string): Promise<IdpUser | null>;
  getUserByEmail(email: string): Promise<IdpUser | null>;

  /** Soft lifecycle: deactivate rather than delete (FR-03, NFR-12). */
  enableUser(userId: string): Promise<IdpOperationResult>;
  disableUser(userId: string): Promise<IdpOperationResult>;

  /** Role management (FR-04). */
  addRole(userId: string, role: string): Promise<IdpOperationResult>;
  removeRole(userId: string, role: string): Promise<IdpOperationResult>;
  getUserRoles(userId: string): Promise<string[]>;

  /** Credential flows (handled entirely inside Keycloak). */
  sendPasswordResetEmail(
    email: string,
    redirectUrl?: string,
  ): Promise<IdpOperationResult>;
}
