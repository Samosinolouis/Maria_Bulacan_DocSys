'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSessionServiceMethods } from '@/hooks/useDomainServices';
import { ShieldCheck, Loader2, Lock, RotateCcw } from 'lucide-react';
import GovMasthead from '@/components/GovMasthead';
import GovFooter from '@/components/GovFooter';

/**
 * Read the return target at call time rather than through `useSearchParams`,
 * which would force a Suspense fallback and empty the prerendered HTML.
 */
function returnTarget(): string {
  return new URLSearchParams(window.location.search).get('returnTo') ?? '/dashboard';
}

/**
 * Sign-in desk.
 *
 * Authentication is mandatory, so this route presents no form and no button: it
 * hands the browser straight to Keycloak (authorization-code + PKCE) as soon as
 * the local session is known to be absent, and only renders a status screen
 * during the hand-off. Keycloak collects the password; no credential ever
 * passes through this application.
 *
 * Why the hand-off is client-side: Auth.js v5 only STARTS the flow on
 * `POST /api/auth/signin/:provider` with a verified CSRF token. A `GET` on that
 * endpoint merely renders the built-in sign-in page (`AuthInternal` dispatches
 * `render.signin` for GET and `actions.signIn` for POST), so a server-side
 * `redirect('/api/auth/signin/keycloak')` cannot work. `login()` performs the
 * CSRF exchange and then navigates the browser.
 */
function LoginDesk() {
  const router = useRouter();
  const { login } = useSessionServiceMethods();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Wait for the session read: an already-authenticated visitor (for example
    // one who followed a bookmarked /login link) must be returned to the app
    // rather than sent through the identity provider again.
    if (status === 'loading') return;

    if (status === 'authenticated') {
      router.replace(returnTarget());
      return;
    }

    // React strict mode runs effects twice in development; only the first pass
    // may open an authorization request.
    if (started.current) return;
    started.current = true;

    login(returnTarget()).catch((err: unknown) => {
      started.current = false;
      setError(err instanceof Error ? err.message : 'Unable to reach the identity provider.');
    });
  }, [status, login, router]);

  const handleRetry = () => {
    setError(null);
    started.current = false;
    void login(returnTarget()).catch((err: unknown) => {
      started.current = false;
      setError(err instanceof Error ? err.message : 'Unable to reach the identity provider.');
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <GovMasthead />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fluid-fade">
        <div className="w-full max-w-4xl bg-white rounded-lg border border-[#CBD5E1] shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Institutional Heraldry and Statutory Notice */}
          <div className="w-full md:w-5/12 bg-[#081E36] text-white p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#0B2545]">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <Image
                    src="/assets/santa-maria-seal.png"
                    alt="Official Seal of Santa Maria, Bulacan"
                    width={64}
                    height={64}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="h-12 w-px bg-white/20" />
                <div className="relative w-14 h-14 shrink-0">
                  <Image
                    src="/assets/bagong-pilipinas-logo.webp"
                    alt="Bagong Pilipinas Official Insignia"
                    width={56}
                    height={56}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#86EFAC] block">
                  Republic of the Philippines - Province of Bulacan
                </span>
                <h1 className="font-cinzel text-xl sm:text-2xl font-bold tracking-wide text-white leading-tight mt-1">
                  MUNICIPALITY OF SANTA MARIA
                </h1>
                <p className="font-serif-docket text-xs text-[#CBD5E1] mt-1">
                  Office of the Municipal Administrator
                </p>
                <div className="inline-block mt-2 px-2 py-0.5 bg-[#0B2545] border border-white/20 rounded font-mono text-[10px] text-[#FCD116]">
                  DOCSYS v2.6 [ARTA RA 11032]
                </div>
              </div>

              <div className="p-3.5 bg-white/5 border border-white/10 rounded space-y-2 text-xs text-[#CBD5E1]">
                <div className="flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-[#86EFAC]" />
                  <span>Statutory Security Mandate</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Pursuant to Republic Act 10173 (Data Privacy Act of 2012) and Republic Act 10175
                  (Cybercrime Prevention Act), access to this executive docket and records repository
                  is restricted strictly to authorized Civil Service personnel.
                </p>
                <p className="leading-relaxed text-[11px] text-[#94A3B8]">
                  All session logins, status updates, and document transmissions are recorded in the
                  immutable statutory audit custody chain.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-[10px] text-[#94A3B8] font-mono">
              <div>IDENTITY: KEYCLOAK REALM [DOCSYS]</div>
              <div>SECURITY: TLS 1.3 / OIDC AUTHORIZATION CODE + PKCE</div>
            </div>
          </div>

          {/* Right Column: Civil Service Access Portal */}
          <div className="w-full md:w-7/12 p-6 sm:p-8 bg-white flex flex-col justify-between">
            <div>
              <div className="border-b border-[#E2E8F0] pb-3 mb-6">
                <span className="font-mono text-[10px] font-bold text-[#15803D] uppercase tracking-wider block">
                  Official Civil Service Access
                </span>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#081E36]">
                  PERSONNEL AUTHENTICATION DESK
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Authentication is mandatory. You are being handed to the municipality&apos;s
                  Keycloak identity provider, which collects your credentials and enforces the
                  password and multi-factor policy. Nothing is entered on this screen.
                </p>
              </div>

              {error ? (
                <div className="space-y-4">
                  <div className="p-3 bg-[#F1F5F9] border border-[#334155] rounded text-xs text-[#0F172A] font-semibold flex items-start gap-2">
                    <Lock size={15} className="text-[#334155] shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="btn-fluid w-full flex items-center justify-center gap-2 py-2.5 bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white rounded text-xs font-bold shadow cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Retry sign-in</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-1.5">
                    <div className="font-bold text-[#081E36] text-[11px] uppercase tracking-wider">
                      Single Sign-On
                    </div>
                    <p className="text-[#475569] leading-relaxed">
                      The Keycloak realm <strong>docsys</strong> issues this session. An existing
                      municipal session is reused; otherwise you will be asked to sign in.
                    </p>
                  </div>

                  <div
                    role="status"
                    aria-live="polite"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] rounded text-xs font-bold"
                  >
                    <Loader2 size={14} className="animate-spin" />
                    <span>Redirecting to the municipal identity provider...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-[11px] text-[#64748B] text-center">
              Civil Service Commission (CSC) and ARTA RA 11032 statutory compliance mandated.
            </div>
          </div>
        </div>
      </main>

      <GovFooter />
    </div>
  );
}

export default function LoginPage() {
  return <LoginDesk />;
}
