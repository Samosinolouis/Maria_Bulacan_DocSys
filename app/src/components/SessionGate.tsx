'use client';

/**
 * SessionGate - the route protection layer.
 *
 * Unauthenticated users are redirected to `/login` (with the current path as the
 * return target); a failed token refresh sends them back to sign in. The backend
 * remains the security boundary; this is UX.
 */

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '@/providers/AppProvider';

const PUBLIC_ROUTES = ['/login', '/auth/callback', '/api/auth'];

export default function SessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const { isAuthenticated, isSessionReady } = useApp();

  const isPublic = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    if (isPublic) return;
    if (!isAuthenticated && status === 'unauthenticated') {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname ?? '/dashboard')}`);
      return;
    }
    if (session?.error === 'RefreshAccessTokenError') {
      router.replace('/login');
    }
  }, [isPublic, status, session?.error, router, pathname, isAuthenticated]);

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
