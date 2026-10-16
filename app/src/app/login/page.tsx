'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useServices } from '@/hooks/useServices';
import {
  ShieldCheck,
  Loader2,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import GovMasthead from '@/components/GovMasthead';
import GovFooter from '@/components/GovFooter';

const KEYCLOAK_BASE_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
  'https://santamaria-docsys-idp.azurewebsites.net';

/**
 * Read the return target at call time rather than through `useSearchParams`,
 * which would force a Suspense fallback and empty the prerendered HTML.
 *
 * Anything that is not an in-app path is dropped (an absolute URL would be an
 * open redirect) and `/login` is never accepted: returning to this page is a
 * redirect loop.
 */
function returnTarget(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const target = new URLSearchParams(window.location.search).get('returnTo');
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/login')) {
    return '/dashboard';
  }
  return target;
}

function LoginDesk() {
  const router = useRouter();
  const { session: sessionService } = useServices();
  const { status, data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Process OIDC redirect from Keycloak (tokens returned in URL hash fragment)
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      if (accessToken) {
        queueMicrotask(() => {
          setVerifyingToken(true);
          setIsAuthenticating(true);
          try {
            const snapshot = sessionService.loginFromToken(accessToken, idToken ?? undefined);
            setVerifiedName(`${snapshot.user.firstName} ${snapshot.user.lastName}`);
            window.history.replaceState(null, '', window.location.pathname);
            const target = returnTarget();
            setTimeout(() => {
              router.replace(target);
            }, 600);
          } catch (err) {
            setError(
              'Failed to adopt Keycloak session: ' +
                (err instanceof Error ? err.message : String(err)),
            );
            setVerifyingToken(false);
            setIsAuthenticating(false);
          }
        });
        return;
      }
    }

    // 2. A session whose stored tokens are dead still reads as `authenticated`.
    // Drop the unusable cookie so the visitor isn't trapped in an endless redirect loop.
    if (status === 'authenticated') {
      if (session?.error) {
        void sessionService.discard().catch(() => null);
        return;
      }
      router.replace(returnTarget());
      return;
    }

    // 3. If already authenticated via local token / snapshot, redirect to target
    if (sessionService.isAuthenticated()) {
      router.replace(returnTarget());
    }
  }, [status, session?.error, router, sessionService]);

  const handleRedirectToKeycloak = () => {
    setIsAuthenticating(true);
    setError(null);
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
    const target = encodeURIComponent(returnTarget());
    const authUrl = `${KEYCLOAK_BASE_URL}/realms/docsys/protocol/openid-connect/auth?client_id=docsys-app&response_type=token%20id_token&scope=openid%20profile%20email&redirect_uri=${redirectUri}&nonce=${Date.now()}&state=${target}`;
    window.location.href = authUrl;
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

            <div className="pt-6 border-t border-white/10 text-[10px] text-[#94A3B8] font-mono space-y-1">
              <div>IDENTITY: KEYCLOAK REALM [DOCSYS]</div>
              <div>SECURITY: OIDC AUTHORIZATION CODE + PKCE / IMPLICIT</div>
              <div className="text-[#86EFAC] flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse inline-block" />
                <span>AZURE KEYCLOAK OIDC: ONLINE (HTTPS)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Keycloak Authentication Desk */}
          <div className="w-full md:w-7/12 p-6 sm:p-8 bg-white flex flex-col justify-between">
            {verifyingToken ? (
              /* State when returning from Keycloak */
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border-2 border-[#15803D] flex items-center justify-center text-[#15803D] animate-bounce">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#081E36]">
                    Keycloak Identity Verified
                  </h3>
                  <p className="text-xs text-[#166534] font-medium mt-1">
                    Admitting {verifiedName || 'Civil Service Personnel'} to municipal desk...
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <Loader2 size={16} className="animate-spin text-[#15803D]" />
                  <span>Loading statutory docket and records repository...</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center py-6">
                <div className="border-b border-[#E2E8F0] pb-4 mb-6">
                  <span className="font-mono text-[10px] font-bold text-[#15803D] uppercase tracking-wider block">
                    Official Keycloak Identity Provider (SSO)
                  </span>
                  <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#081E36] mt-1">
                    CIVIL SERVICE AUTHENTICATION
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                    Access to the Santa Maria Municipal Document System is secured through official
                    single sign-on. Authenticate directly via Keycloak to enter your authorized docket desk.
                  </p>
                </div>

                {/* Status or Error Banner */}
                {error && (
                  <div className="mb-5 p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-xs text-[#991B1B] flex items-start gap-2.5 animate-shake">
                    <AlertCircle size={16} className="text-[#DC2626] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Authentication Error</div>
                      <p className="text-[11px] mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* PRIMARY ACTION: Sign In on Keycloak */}
                <div className="my-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleRedirectToKeycloak}
                    disabled={isAuthenticating}
                    className="w-full group relative flex items-center justify-between p-4 sm:p-5 bg-[#081E36] hover:bg-[#0B2545] active:bg-[#040F1D] text-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 border border-[#081E36]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-md bg-white/10 flex items-center justify-center text-[#86EFAC] group-hover:scale-105 transition-transform">
                        {isAuthenticating ? (
                          <Loader2 size={22} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={24} />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-sm sm:text-base font-bold flex items-center gap-2 text-white">
                          <span>Authenticate on Keycloak</span>
                          <span className="px-1.5 py-0.5 bg-[#15803D] text-[9px] font-mono uppercase tracking-wider text-white rounded">
                            Official OIDC
                          </span>
                        </div>
                        <div className="text-xs text-[#94A3B8] mt-0.5">
                          Single Sign-On (SSO) on Azure Identity Provider
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-[#86EFAC] group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-xs text-[#64748B] text-center pt-1">
                    You will be redirected to the secure Keycloak authentication portal.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                  <a
                    href="https://santamaria-docsys-idp.azurewebsites.net/admin/master/console/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[#081E36] transition-colors"
                  >
                    <ExternalLink size={12} className="text-[#15803D]" />
                    <span>Keycloak Admin Console</span>
                  </a>

                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    Realm: docsys · Azure Cloud
                  </span>
                </div>
              </div>
            )}

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
