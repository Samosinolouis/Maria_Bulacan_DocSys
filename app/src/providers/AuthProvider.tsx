'use client';

/**
 * AuthProvider - the auth provider for the app.
 *
 * Composes NextAuth's `SessionProvider` (Keycloak OIDC, server-side flow) with
 * the DocSys composition root: it builds the ServiceRegistry once, hydrates the
 * session service from the NextAuth session, and wires the authorization engine.
 *
 * Provider order: SessionProvider -> ServiceProvider -> AuthorizationProvider
 * -> AppProvider.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { SessionProvider, getSession, signIn, signOut, useSession } from 'next-auth/react';
import { createServices, type ServicesBundle } from '@/services';
import { ServiceProvider } from './ServiceProvider';
import { AuthorizationProvider } from './AuthorizationProvider';
import { AppProvider } from './AppProvider';
import { ToastProvider } from './ToastProvider';
import { SessionContext } from './contexts';

/**
 * Keycloak coordinates for RP-initiated logout. The browser performs that
 * redirect, so it must come from the public (client-visible) variables - the
 * server-only AUTH_KEYCLOAK_ISSUER / AUTH_KEYCLOAK_ID are not available here.
 * Both point at the same realm as `src/auth.ts` by default.
 */
const KC_BASE = (
  process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'https://santamaria-docsys-idp.azurewebsites.net'
).replace(/\/+$/, '');
const KC_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'docsys';
const KC_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT ?? 'docsys-app';
const KC_ISSUER = `${KC_BASE}/realms/${KC_REALM}`;

/**
 * How often an open tab re-runs the OIDC refresh-token grant (minutes). Keep it
 * comfortably below the Keycloak access-token lifespan (5 minutes in the
 * `docsys` realm), otherwise the token can expire between ticks.
 */
const SESSION_REFRESH_MINUTES = Number(process.env.NEXT_PUBLIC_SESSION_REFRESH_MINUTES ?? 2);
const SESSION_REFRESH_INTERVAL_MS =
  Math.max(1, Number.isFinite(SESSION_REFRESH_MINUTES) ? SESSION_REFRESH_MINUTES : 2) * 60_000;

const authPort = {
  signIn: async (returnTo?: string) => {
    if (typeof window !== 'undefined') {
      const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
      const target = encodeURIComponent(returnTo ?? '/dashboard');
      window.location.href = `${KC_ISSUER}/protocol/openid-connect/auth?client_id=${KC_CLIENT_ID}&response_type=token%20id_token&scope=openid%20profile%20email&redirect_uri=${redirectUri}&nonce=${Date.now()}&state=${target}`;
      return;
    }
    await signIn('keycloak', { redirectTo: returnTo ?? '/dashboard' });
  },
  /**
   * Sign out of BOTH the application and the Keycloak identity provider.
   */
  signOut: async () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('docsys_preview_user');
        localStorage.removeItem('docsys_kc_token');
        localStorage.removeItem('docsys_kc_id_token');
        localStorage.removeItem('docsys_kc_user');
        localStorage.removeItem('docsys_kc_exp');
      } catch {}
      const endSessionUrl = new URL(`${KC_ISSUER}/protocol/openid-connect/logout`);
      endSessionUrl.searchParams.set('client_id', KC_CLIENT_ID);
      endSessionUrl.searchParams.set(
        'post_logout_redirect_uri',
        `${window.location.origin}/login`,
      );
      try {
        await signOut({ redirect: false });
      } catch {}
      window.location.href = endSessionUrl.toString();
      return;
    }
    await signOut({ redirectTo: '/login' });
  },
  /**
   * Clear ONLY the Auth.js session cookie. Used when the stored tokens are
   * dead but the cookie still decrypts: without clearing it Auth.js keeps
   * answering `authenticated`, so the sign-in page would bounce the user back
   * into the app instead of starting a fresh authorization request.
   */
  clearSession: async () => {
    await signOut({ redirect: false });
  },
  getSessionToken: async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('docsys_kc_token');
      const expStr = localStorage.getItem('docsys_kc_exp');
      const expiresAt = expStr ? Number(expStr) / 1000 : null;
      if (token) return { accessToken: token, expiresAt };
    }
    try {
      const session = await getSession();
      return session
        ? { accessToken: session.accessToken ?? null, expiresAt: session.expiresAt ?? null }
        : null;
    } catch {
      return null;
    }
  },
};

function AuthBridge({ children }: { children: ReactNode }) {
  const { status, data: session } = useSession();
  const [bundle] = useState<ServicesBundle>(() => createServices(authPort));
  const [ready, setReady] = useState(false);

  // Hydrate the DocSys session (`me`) whenever the NextAuth session changes.
  useEffect(() => {
    if (status === 'loading') return;
    let live = true;
    bundle.session
      .hydrate()
      .catch(() => null)
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [status, session?.accessToken, bundle]);

  /**
   * Keep the OIDC session alive. The Auth.js jwt callback only runs the
   * Keycloak refresh-token grant when the session is read, so a long-lived tab
   * must read it periodically or the Bearer token it sends goes stale (the
   * backend then answers "authenticate first"). Interval is configurable with
   * NEXT_PUBLIC_SESSION_REFRESH_MINUTES (default 2, i.e. well inside the realm's
   * 5-minute access-token lifespan).
   */
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    const keepAlive = () => {
      if (cancelled) return;
      void bundle.session.refresh();
    };
    const timer = setInterval(keepAlive, SESSION_REFRESH_INTERVAL_MS);
    // A backgrounded tab comes back with a stale token: refresh on the way in
    // rather than waiting for the next tick.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') keepAlive();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [status, bundle]);

  return (
    <ServiceProvider registry={bundle.registry}>
      <SessionContext.Provider value={bundle.session}>
        <AuthorizationProvider engine={bundle.authz} session={bundle.session}>
          <AppProvider sessionReady={ready}>{children}</AppProvider>
        </AuthorizationProvider>
      </SessionContext.Provider>
    </ServiceProvider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider refetchOnWindowFocus={false}>
        <AuthBridge>{children}</AuthBridge>
      </SessionProvider>
    </ToastProvider>
  );
}
