'use client';

/**
 * SessionGate - the route protection layer.
 *
 * Unauthenticated users are redirected to `/login` (with the current path as the
 * return target); a failed token refresh sends them back to sign in. The backend
 * remains the security boundary; this is UX.
 *
 * The redirect alone is NOT enough for an expired session, and getting that
 * wrong produced an endless `/dashboard` <-> `/login` loop: Auth.js keeps
 * reporting `authenticated` for a cookie whose refresh-token grant failed (the
 * jwt callback flags it as `session.error`), so the sign-in page saw a valid
 * session and bounced the user straight back here. The dead cookie has to be
 * cleared first, which is what `discard()` does; the status then turns into
 * `unauthenticated` and the sign-in page starts a real authorization request.
 */

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '@/providers/AppProvider';
import { useSessionServiceMethods } from '@/hooks/useDomainServices';

const PUBLIC_ROUTES = ['/login', '/auth/callback', '/api/auth'];

export default function SessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const { isAuthenticated, isSessionReady } = useApp();
  const { discard } = useSessionServiceMethods();

  const isPublic = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
  /** Cookie present but its tokens are dead: the session cannot be used. */
  const sessionExpired = Boolean(session?.error);

  useEffect(() => {
    if (isPublic) return;
    if (!isAuthenticated && status === 'unauthenticated') {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname ?? '/dashboard')}`);
      return;
    }
    if (sessionExpired) {
      // Clear the unusable cookie, then hand over to the sign-in page. Without
      // the clear the sign-in page would send the user right back here.
      void discard().finally(() => router.replace('/login'));
    }
  }, [isPublic, status, sessionExpired, router, pathname, isAuthenticated, discard]);

  if (isPublic) return <>{children}</>;

  const loading = !isAuthenticated && (status === 'loading' || (status === 'authenticated' && !isSessionReady));
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-2">
          <div className="font-cinzel text-sm font-bold text-[#081E36]">
            Verifying Civil Service Session
          </div>
          <p className="text-xs text-[#64748B]">Establishing your statutory access record.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
