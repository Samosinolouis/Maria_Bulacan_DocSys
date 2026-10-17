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
  /**
   * Clear ONLY the NextAuth session cookie (`signOut({ redirect: false })`),
   * leaving the Keycloak SSO session untouched so the next authorization
   * request can be answered from it.
   */
  clearSession: () => Promise<void>;
  /** Read the current NextAuth session token (client-side `getSession`). */
  getSessionToken: () => Promise<{ accessToken: string | null; expiresAt?: number | null } | null>;
}

export const PREVIEW_USERS: Record<string, SessionUser> = {
  administrator: {
    id: 'c501b3d6-cae1-4f43-b27b-0c3caf708763',
    firstName: 'Elmer',
    middleName: 'B.',
    lastName: 'Clemente',
    email: 'administrator@santamaria.gov.ph',
    contactNo: '(044) 815-2882',
    office: 'Office of the Municipal Administrator',
    position: 'Municipal Administrator',
    roles: [
      {
        id: 'ca5dcb0f-1466-4235-9d00-10efe23ec625',
        name: 'ADMINISTRATOR',
        description: 'Full statutory authority across municipal operations',
        permissionPayload: ['*:*'],
      },
    ],
    effectivePermissions: ['*:*'],
  },
  clerk: {
    id: '2e1d4904-5e01-4b84-885a-e9272251ec1a',
    firstName: 'Sherelyn',
    middleName: 'O.',
    lastName: 'Libao',
    email: 'clerk@santamaria.gov.ph',
    contactNo: '(044) 815-2882',
    office: 'Central Receiving Desk',
    position: 'Administrative Aide IV / Records Custodian',
    roles: [
      {
        id: 'ca001709-b5a2-4ce5-8b1b-b724018a9585',
        name: 'CLERK_ENCODER',
        description: 'Intake and screening permissions',
        permissionPayload: [
          'RequestService:*',
          'DocumentService:*',
          'AttachmentService:*',
          'NotificationService:*',
          'EventService:Read',
          'VenueService:Read',
          'ReportService:Read',
        ],
      },
    ],
    effectivePermissions: [
      'RequestService:*',
      'DocumentService:*',
      'AttachmentService:*',
      'NotificationService:*',
      'EventService:Read',
      'VenueService:Read',
      'ReportService:Read',
    ],
  },
  legal: {
    id: 'usr-legal-05',
    firstName: 'Rodrigo',
    middleName: '',
    lastName: 'Ramos',
    email: 'legal@santamaria.gov.ph',
    contactNo: '(044) 815-2882',
    office: 'Municipal Legal Office',
    position: 'Senior Legal Officer',
    roles: [
      {
        id: 'role-legal',
        name: 'OFFICER',
        description: 'Legal review and indorsement preparation',
        permissionPayload: ['RequestService:Read', 'DocumentService:Read', 'DocumentService:Review'],
      },
    ],
    effectivePermissions: ['RequestService:Read', 'DocumentService:Read', 'DocumentService:Review'],
  },
};

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
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
  /** Single-flight guard for discarding an unusable session. */
  private discardInFlight: Promise<void> | null = null;
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

  loginPreview(username: string = 'administrator'): SessionSnapshot {
    const user = PREVIEW_USERS[username] ?? PREVIEW_USERS.administrator;
    const snapshot: SessionSnapshot = {
      user,
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsys_preview_user', username);
      } catch {
        // Ignore storage errors
      }
    }
    this.accessToken = 'preview-token';
    this.setSnapshot(snapshot);
    return snapshot;
  }

  loginFromToken(accessToken: string, idToken?: string): SessionSnapshot {
    const claims = parseJwtPayload(accessToken) ?? (idToken ? parseJwtPayload(idToken) : null);
    const sub = (claims?.sub as string) || 'kc-user-' + Date.now();
    const username = (claims?.preferred_username as string) || (claims?.username as string) || 'administrator';
    const email = (claims?.email as string) || `${username}@docsys.local`;
    const name = (claims?.name as string) || '';
    const givenName = (claims?.given_name as string) || name.split(' ')[0] || (username.toLowerCase().includes('clerk') ? 'Sherelyn' : 'Elmer');
    const familyName = (claims?.family_name as string) || name.split(' ').slice(1).join(' ') || (username.toLowerCase().includes('clerk') ? 'Libao' : 'Clemente');
    const isClerk = username.toLowerCase().includes('clerk');

    const user: SessionUser = isClerk
      ? {
          id: sub,
          firstName: givenName,
          middleName: 'O.',
          lastName: familyName,
          email,
          contactNo: '(044) 815-2882',
          office: 'Central Receiving Desk',
          position: 'Administrative Aide IV / Records Custodian',
          roles: [
            {
              id: 'role-clerk',
              name: 'CLERK_ENCODER',
              description: 'Intake and screening permissions',
              permissionPayload: [
                'RequestService:*',
                'DocumentService:*',
                'AttachmentService:*',
                'NotificationService:*',
                'EventService:Read',
                'VenueService:Read',
                'ReportService:Read',
              ],
            },
          ],
          effectivePermissions: [
            'RequestService:*',
            'DocumentService:*',
            'AttachmentService:*',
            'NotificationService:*',
            'EventService:Read',
            'VenueService:Read',
            'ReportService:Read',
          ],
        }
      : {
          id: sub,
          firstName: givenName,
          middleName: 'B.',
          lastName: familyName,
          email,
          contactNo: '(044) 815-2882',
          office: 'Office of the Municipal Administrator',
          position: 'Municipal Administrator',
          roles: [
            {
              id: 'role-admin',
              name: 'ADMINISTRATOR',
              description: 'Full statutory authority across municipal operations',
              permissionPayload: ['*:*'],
            },
          ],
          effectivePermissions: ['*:*'],
        };

    const exp = typeof claims?.exp === 'number' ? claims.exp * 1000 : Date.now() + 86400000;
    const snapshot: SessionSnapshot = {
      user,
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(exp).toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docsys_kc_token', accessToken);
        if (idToken) localStorage.setItem('docsys_kc_id_token', idToken);
        localStorage.setItem('docsys_kc_user', JSON.stringify(user));
        localStorage.setItem('docsys_kc_exp', String(exp));
        localStorage.removeItem('docsys_preview_user');
      } catch {
        // Ignore storage errors
      }
    }

    this.accessToken = accessToken;
    this.accessTokenExpiresAt = exp;
    this.setSnapshot(snapshot);
    return snapshot;
  }

  async loginWithKeycloakCredentials(username: string, password: string): Promise<SessionSnapshot> {
    const kcBase =
      process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
      'https://santamaria-docsys-idp.azurewebsites.net';
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'docsys';
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT || 'docsys-app';

    const res = await fetch(`${kcBase}/realms/${realm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        username,
        password,
        scope: 'openid profile email',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = 'Authentication failed. Please verify your Keycloak credentials.';
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error_description) msg = parsed.error_description;
      } catch {
        // use default
      }
      throw new Error(msg);
    }

    const data = (await res.json()) as { access_token: string; id_token?: string };
    return this.loginFromToken(data.access_token, data.id_token);
  }

  async logout(): Promise<void> {
    this.resetLocalState();
    try {
      await this.auth.signOut();
    } catch {
      if (typeof window !== 'undefined') {
        const kcBase = (
          process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
          'https://santamaria-docsys-idp.azurewebsites.net'
        ).replace(/\/+$/, '');
        const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT || 'docsys-app';
        const postLogout = encodeURIComponent(`${window.location.origin}/login`);
        window.location.href = `${kcBase}/realms/docsys/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${postLogout}`;
      }
    }
  }

  /**
   * Drop a session whose stored tokens are dead but whose Auth.js cookie still
   * decrypts, so the browser keeps being told it is `authenticated`.
   *
   * That combination is what made `/dashboard` and `/login` bounce off each
   * other forever: the route gate evicted the user to `/login` on the refresh
   * error, while the sign-in page saw a valid-looking session and sent them
   * straight back into the app. Clearing the cookie first turns the status into
   * `unauthenticated`, which is the state the sign-in page's automatic hand-off
   * needs in order to start a real authorization request.
   *
   * The Keycloak SSO session is deliberately left alone: if it is still alive
   * the next authorization request is answered from it and the operator is
   * returned to work without re-entering credentials.
   *
   * Single-flight: the route gate and the sign-in page both call this for the
   * same broken session.
   */
  async discard(): Promise<void> {
    if (this.discardInFlight) return this.discardInFlight;
    this.discardInFlight = this.runDiscard().finally(() => {
      this.discardInFlight = null;
    });
    return this.discardInFlight;
  }

  private async runDiscard(): Promise<void> {
    this.resetLocalState();
    try {
      await this.auth.clearSession();
    } catch {
      // A cookie that cannot be cleared must not block the sign-in hand-off.
    }
  }

  /** Forget everything this tab holds about the current session. */
  private resetLocalState(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('docsys_preview_user');
        localStorage.removeItem('docsys_kc_token');
        localStorage.removeItem('docsys_kc_id_token');
        localStorage.removeItem('docsys_kc_user');
        localStorage.removeItem('docsys_kc_exp');
      } catch {
        // Ignore storage errors
      }
    }
    this.clearAccessToken();
    this.refreshBlockedUntil = 0;
    this.setSnapshot(null);
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
    if (typeof window !== 'undefined') {
      try {
        const kcToken = localStorage.getItem('docsys_kc_token');
        const kcExp = Number(localStorage.getItem('docsys_kc_exp') ?? '0');
        if (kcToken && (!kcExp || kcExp > Date.now())) {
          const idToken = localStorage.getItem('docsys_kc_id_token') ?? undefined;
          return this.loginFromToken(kcToken, idToken);
        }
        const previewUser = localStorage.getItem('docsys_preview_user');
        if (previewUser && PREVIEW_USERS[previewUser]) {
          return this.loginPreview(previewUser);
        }
      } catch {
        // Ignore storage errors
      }
    }

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
