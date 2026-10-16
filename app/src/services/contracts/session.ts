/**
 * Session contract. Owns the OIDC session (via NextAuth), the access token,
 * and the session bootstrap that loads `me` (the permission source).
 */

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

  /** Current OIDC access token for the GraphQL client, or null. */
  getAccessToken(): Promise<string | null>;

  /** Start the OIDC Authorization Code + PKCE redirect (NextAuth signIn). */
  login(returnTo?: string): Promise<void>;

  /** Sign in directly using a static civil service plantilla profile for offline/preview mode. */
  loginPreview(username?: string): SessionSnapshot;

  /** Adopt a verified Keycloak JWT access token from an OIDC redirect or token exchange. */
  loginFromToken(accessToken: string, idToken?: string): SessionSnapshot;

  /** Authenticate directly with Keycloak username and password. */
  loginWithKeycloakCredentials(username: string, password: string): Promise<SessionSnapshot>;

  /** Complete the OIDC callback (token exchange), then load `me`. */
  completeLogin(): Promise<SessionSnapshot>;

  /**
   * Drop a session that can no longer be used (its stored tokens are dead)
   * WITHOUT ending the Keycloak SSO session: clears the local Auth.js cookie
   * and the in-memory snapshot, leaving the sign-in page free to start a fresh
   * authorization request. Used when Auth.js still reports `authenticated` for
   * a session whose refresh-token grant failed.
   */
  discard(): Promise<void>;

  /** Clear the session and redirect to Keycloak logout. */
  logout(): Promise<void>;

  /** Re-fetch `me` and rebuild the snapshot (also refreshes the engine subject). */
  loadSession(): Promise<SessionSnapshot>;

  /**
   * Re-read the NextAuth session so the Auth.js jwt callback can run the
   * Keycloak refresh-token grant, then adopt the new access token. Returns
   * false when the session is gone and the user must sign in again.
   */
  refresh(): Promise<boolean>;

  /** Subscribe to session changes. Returns an unsubscribe function. */
  subscribe(listener: (snapshot: SessionSnapshot | null) => void): () => void;
}
