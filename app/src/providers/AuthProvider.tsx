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
 * How often an open tab re-runs the OIDC refresh-token grant (minutes). Keep it
 * comfortably below the Keycloak access-token lifespan (5 minutes in the
 * `docsys` realm), otherwise the token can expire between ticks.
 */
const SESSION_REFRESH_MINUTES = Number(process.env.NEXT_PUBLIC_SESSION_REFRESH_MINUTES ?? 2);
const SESSION_REFRESH_INTERVAL_MS =
  Math.max(1, Number.isFinite(SESSION_REFRESH_MINUTES) ? SESSION_REFRESH_MINUTES : 2) * 60_000;

const authPort = {
  signIn: async (returnTo?: string) => {
    await signIn('keycloak', { redirectTo: returnTo ?? '/dashboard' });
  },
  signOut: async () => {
    await signOut({ redirectTo: '/login' });
  },
  getSessionToken: async () => {
    const session = await getSession();
    return session
      ? { accessToken: session.accessToken ?? null, expiresAt: session.expiresAt ?? null }
      : null;
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
