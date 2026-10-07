/**
 * SessionService - owns the OIDC session (delegated to NextAuth through the
 * injected `SessionAuthPort`), the access token used by the GraphQL client, and
 * the `me` bootstrap that yields the DocSys shadow user + effective permissions.
 *
 * Ungated: session bootstrap is the only set of calls that run without an
 * authorization decision.
 */

import { AppError } from '../contracts/errors';
import type { IGraphQLClient } from '../contracts/graphql';
import type { ISessionService, SessionSnapshot, SessionUser } from '../contracts/session';
import { SESSION_OPS } from '../graphql/session.ops';

/** Wait this long before re-asking NextAuth after a failed refresh. */
const REFRESH_COOLDOWN_MS = 30_000;
/**
 * A token with more than this much life left is good enough: the keep-alive
 * tick and the visibility handler then skip the session read entirely. Keep the
 * keep-alive interval shorter than (token lifespan - this skew) so a token is
 * always renewed before it expires; with the realm's 5-minute access token and
 * the default 2-minute interval the read happens around the 4-minute mark.
 */
const TOKEN_FRESH_SKEW_MS = 90_000;

/** Adapter over `next-auth/react` supplied by the composition root. */
export interface SessionAuthPort {
  /** Start the Keycloak authorization-code + PKCE redirect. */
  signIn: (returnTo?: string) => Promise<void>;
  /** Clear the NextAuth session and redirect to Keycloak logout. */
  signOut: () => Promise<void>;
  /** Read the current NextAuth session token (client-side `getSession`). */
  getSessionToken: () => Promise<{ accessToken: string | null; expiresAt?: number | null } | null>;
}

export class SessionService implements ISessionService {
  private snapshot: SessionSnapshot | null = null;
  private accessToken: string | null = null;
  /** Epoch ms when `accessToken` stops being usable (null = unknown). */
  private accessTokenExpiresAt: number | null = null;
  /** Single-flight guard: one refresh at a time, shared by every caller. */
  private refreshInFlight: Promise<boolean> | null = null;
  /** Single-flight guard for the provider's hydrate calls. */
  private hydrateInFlight: Promise<SessionSnapshot | null> | null = null;
  /** Back-off window after a failed refresh (no session / transport error). */
  private refreshBlockedUntil = 0;
  private readonly listeners = new Set<(snapshot: SessionSnapshot | null) => void>();

  constructor(
    private readonly gql: IGraphQLClient,
    private readonly auth: SessionAuthPort,
  ) {}

  getSnapshot(): SessionSnapshot | null {
    return this.snapshot;
  }

  isAuthenticated(): boolean {
    return this.snapshot !== null;
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessToken) return this.accessToken;
    const session = await this.auth.getSessionToken();
    this.adoptToken(session);
    return this.accessToken;
  }

  /** Drop the token (session expired / refresh failed). */
  clearAccessToken(): void {
    this.accessToken = null;
    this.accessTokenExpiresAt = null;
  }

  async login(returnTo?: string): Promise<void> {
    await this.auth.signIn(returnTo);
  }

  async logout(): Promise<void> {
    this.clearAccessToken();
    this.refreshBlockedUntil = 0;
    this.setSnapshot(null);
    await this.auth.signOut();
  }

  async completeLogin(): Promise<SessionSnapshot> {
    return this.loadSession();
  }

  /**
   * Hydrate from the NextAuth session (used by the provider on mount and when
   * the NextAuth session changes). Returns null when there is no session.
   */
  async hydrate(): Promise<SessionSnapshot | null> {
    // Single-flight: the provider re-runs this on every NextAuth status/token
    // transition, and each run costs a session read plus a `me` bootstrap.
    if (this.hydrateInFlight) return this.hydrateInFlight;
    this.hydrateInFlight = this.runHydrate().finally(() => {
      this.hydrateInFlight = null;
    });
    return this.hydrateInFlight;
  }

  private async runHydrate(): Promise<SessionSnapshot | null> {
    const session = await this.auth.getSessionToken();
    this.adoptToken(session);
    if (!this.accessToken) {
      this.setSnapshot(null);
      return null;
    }
    this.refreshBlockedUntil = 0;
    try {
      return await this.loadSession(session?.expiresAt ?? null);
    } catch {
      this.setSnapshot(null);
      return null;
    }
  }

  async loadSession(expiresAt?: number | null): Promise<SessionSnapshot> {
    const me = await this.fetchMe();
    if (!me) {
      this.setSnapshot(null);
      throw new AppError('UNAUTHENTICATED', 'Your session could not be established. Please sign in again.');
    }
    const snapshot: SessionSnapshot = {
      user: me,
      authenticatedAt: new Date().toISOString(),
      expiresAt: typeof expiresAt === 'number' ? new Date(expiresAt * 1000).toISOString() : null,
    };
    this.setSnapshot(snapshot);
    return snapshot;
  }

  subscribe(listener: (snapshot: SessionSnapshot | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Keep the OIDC session alive: re-read the NextAuth session (this is what
   * makes the Auth.js jwt callback run the Keycloak refresh-token grant) and
   * adopt whatever access token it hands back. Without this the in-memory
   * token is only ever read once, so a long-lived tab keeps sending an expired
   * Bearer token and the backend answers "authenticate first".
   *
   * Guarded three ways so it can never become a request storm: a token that is
   * still fresh skips the read entirely, concurrent callers share one
   * in-flight refresh, and a failed refresh backs off instead of being retried
   * by every caller that follows.
   */
  async refresh(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const now = Date.now();
    if (now < this.refreshBlockedUntil) return false;
    if (this.accessToken && this.accessTokenExpiresAt !== null) {
      if (this.accessTokenExpiresAt - now > TOKEN_FRESH_SKEW_MS) return true;
    }

    this.refreshInFlight = this.runRefresh().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async runRefresh(): Promise<boolean> {
    let session: Awaited<ReturnType<SessionAuthPort['getSessionToken']>> = null;
    try {
      session = await this.auth.getSessionToken();
    } catch {
      this.refreshBlockedUntil = Date.now() + REFRESH_COOLDOWN_MS;
      return false;
    }

    const rotated = (session?.accessToken ?? null) !== null && session?.accessToken !== this.accessToken;
    this.adoptToken(session);

    if (!this.accessToken) {
      // No NextAuth session at all: stop asking for a while, the sign-in page
      // takes over from here.
      this.setSnapshot(null);
      this.refreshBlockedUntil = Date.now() + REFRESH_COOLDOWN_MS;
      return false;
    }

    // A rotated token may carry new claims/roles; refresh the snapshot too.
    if (rotated) {
      try {
        await this.loadSession(session?.expiresAt ?? null);
      } catch {
        // Keep the previous snapshot; the token itself is still usable.
      }
    }
    this.refreshBlockedUntil = 0;
    return true;
  }

  /** Adopt a NextAuth session's access token + expiry. */
  private adoptToken(
    session: { accessToken: string | null; expiresAt?: number | null } | null,
  ): void {
    this.accessToken = session?.accessToken ?? null;
    this.accessTokenExpiresAt =
      typeof session?.expiresAt === 'number' ? session.expiresAt * 1000 : null;
  }

  private setSnapshot(snapshot: SessionSnapshot | null): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }

  private async fetchMe(): Promise<SessionUser | null> {
    const data = await this.gql.request<{ me: SessionUser | null }>({
      document: SESSION_OPS.me,
      operationName: 'Me',
      // Never retry the bootstrap through the refresh path: refresh() calls
      // this method, so a retry would re-enter refresh() without end.
      skipAuthRetry: true,
    });
    return data.me;
  }
}
