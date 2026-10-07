'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSessionServiceMethods } from '@/hooks/useDomainServices';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import GovMasthead from '@/components/GovMasthead';
import GovFooter from '@/components/GovFooter';

/**
 * Sign-in desk. Authentication is delegated to Keycloak through NextAuth
 * (authorization-code + PKCE, server-side). No credentials are handled by this
 * page: `login()` starts the OIDC redirect and Keycloak collects the password.
 */
function LoginDesk() {
  const { login } = useSessionServiceMethods();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Read the return target at click time so the page stays fully
      // prerenderable (useSearchParams would force a Suspense fallback).
      const returnTo =
        new URLSearchParams(window.location.search).get('returnTo') ?? '/dashboard';
      await login(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the sign-in flow.');
      setLoading(false);
    }
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
                  Sign in with your assigned municipal account. Credentials are handled by the
                  municipality&apos;s Keycloak identity provider and never touch this application.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-[#F1F5F9] border border-[#334155] rounded text-xs text-[#0F172A] font-semibold flex items-start gap-2">
                  <Lock size={15} className="text-[#334155] shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-1.5">
                  <div className="font-bold text-[#081E36] text-[11px] uppercase tracking-wider">
                    Single Sign-On
                  </div>
                  <p className="text-[#475569] leading-relaxed">
                    You will be redirected to the Keycloak realm <strong>docsys</strong> to
                    authenticate. Multi-factor and password policy are enforced there.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="btn-fluid w-full flex items-center justify-center gap-2 py-2.5 bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white rounded text-xs font-bold shadow cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Redirecting to Keycloak...</span>
                  ) : (
                    <>
                      <span>Sign in with Keycloak</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
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
