/**
 * NextAuth (Auth.js v5) configuration - Keycloak provider.
 *
 * The realm/client this is wired against is defined in
 * `infra/keycloak/docsys-realm.json`:
 *   - realm:  docsys
 *   - client: docsys-app (public SPA, authorization-code + PKCE S256,
 *             redirect URIs `http://localhost:3000/*`)
 *
 * NextAuth runs the OIDC flow server-side (route handlers under
 * `/api/auth/*`), which is why the app no longer builds as a static export.
 * The access token is exposed on the session and used as the Bearer token by
 * the GraphQL client; the DocSys shadow record itself comes from the backend
 * `me` query (the frontend session service).
 */

import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

const KC_BASE = (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
const KC_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'docsys';

const ISSUER = process.env.AUTH_KEYCLOAK_ISSUER ?? `${KC_BASE}/realms/${KC_REALM}`;
const CLIENT_ID = process.env.AUTH_KEYCLOAK_ID ?? process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT ?? 'docsys-app';
const CLIENT_SECRET = process.env.AUTH_KEYCLOAK_SECRET;

/**
 * Refresh an expiring Keycloak access token at the token endpoint. Public
 * clients (no secret) authenticate the request with the client id only.
 */
interface DocSysToken {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: 'RefreshAccessTokenError';
}

async function refreshAccessToken(token: DocSysToken) {
  if (!token.refreshToken) throw new Error('Missing refresh token');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: token.refreshToken,
  });
  if (CLIENT_SECRET) body.set('client_secret', CLIENT_SECRET);

  const res = await fetch(`${ISSUER}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const refreshed = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!res.ok || !refreshed.access_token) {
    throw new Error(refreshed.error ?? `Token refresh failed (HTTP ${res.status})`);
  }

  return {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 300),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [
    Keycloak({
      clientId: CLIENT_ID,
      ...(CLIENT_SECRET ? { clientSecret: CLIENT_SECRET } : {}),
      issuer: ISSUER,
      // The `docsys-app` client is public; it authenticates with PKCE and no
      // client secret at the token endpoint.
      ...(CLIENT_SECRET ? {} : { client: { token_endpoint_auth_method: 'none' } }),
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Auth.js types the JWT as an open record; narrow it to our shape and
      // mutate in place so the returned value stays a `JWT`.
      const t = token as unknown as DocSysToken;

      // First sign-in: persist the tokens handed back by Keycloak.
      if (account) {
        const acc = account as unknown as {
          access_token?: string;
          refresh_token?: string;
          expires_at?: number;
        };
        t.accessToken = acc.access_token;
        t.refreshToken = acc.refresh_token;
        t.expiresAt = acc.expires_at;
        return token;
      }

      // Still valid (with a 30s skew): reuse it.
      if (typeof t.expiresAt === 'number' && Date.now() < (t.expiresAt - 30) * 1000) {
        return token;
      }

      // Expired: refresh, or flag the session so the UI can re-authenticate.
      try {
        const refreshed = await refreshAccessToken(t);
        t.accessToken = refreshed.accessToken;
        t.refreshToken = refreshed.refreshToken;
        t.expiresAt = refreshed.expiresAt;
        delete t.error;
        return token;
      } catch {
        t.error = 'RefreshAccessTokenError';
        return token;
      }
    },
    async session({ session, token }) {
      const t = token as unknown as DocSysToken;
      session.accessToken = t.accessToken;
      session.expiresAt = t.expiresAt;
      session.error = t.error;
      return session;
    },
  },
});
