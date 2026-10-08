'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSessionServiceMethods } from '@/hooks/useDomainServices';
import { ShieldCheck, Loader2, Lock, RotateCcw, UserCheck, AlertCircle, ExternalLink } from 'lucide-react';
import GovMasthead from '@/components/GovMasthead';
import GovFooter from '@/components/GovFooter';

/**
 * Read the return target at call time rather than through `useSearchParams`,
 * which would force a Suspense fallback and empty the prerendered HTML.
 */
function returnTarget(): string {
  return new URLSearchParams(window.location.search).get('returnTo') ?? '/dashboard';
}

function LoginDesk() {
  const router = useRouter();
  const { login, loginPreview } = useSessionServiceMethods();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<'administrator' | 'clerk' | 'legal'>('administrator');
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

            <div className="pt-6 border-t border-white/10 text-[10px] text-[#94A3B8] font-mono space-y-1">
              <div>IDENTITY: KEYCLOAK REALM [DOCSYS]</div>
              <div>SECURITY: OIDC AUTHORIZATION CODE + PKCE</div>
              <div className="text-[#86EFAC] flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse inline-block" />
                <span>AZURE KEYCLOAK INSTANCE: ONLINE</span>
              </div>
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
                  <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded text-xs text-[#0F172A] flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-[#15803D] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[#15803D]">Azure Keycloak Identity Provider (OIDC Online)</div>
                      <p className="text-[#334155] text-[11px] mt-0.5 leading-relaxed">
                        Keycloak container is actively running on Azure at <span className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-[#CBD5E1] text-[#0F172A]">santamaria-docsys-idp.southeastasia.azurecontainer.io:8080</span> connected to Azure PostgreSQL. Authenticate below via your municipal plantilla account or explore the Keycloak administration console.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#081E36] uppercase tracking-wider mb-2">
                      Select Municipal Plantilla Account
                    </label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPersona('administrator')}
                        className={`w-full p-2.5 rounded border text-left cursor-pointer transition-all ${
                          selectedPersona === 'administrator'
                            ? 'border-[#15803D] bg-[#F0FDF4] ring-1 ring-[#15803D]'
                            : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#0F172A]">Engr. Elmer B. Clemente</div>
                        <div className="text-[10px] text-[#166534] font-semibold">Municipal Administrator (Full Access - *:*)</div>
                        <div className="text-[9px] text-[#64748B]">Office of the Municipal Administrator</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPersona('clerk')}
                        className={`w-full p-2.5 rounded border text-left cursor-pointer transition-all ${
                          selectedPersona === 'clerk'
                            ? 'border-[#15803D] bg-[#F0FDF4] ring-1 ring-[#15803D]'
                            : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#0F172A]">Sherelyn O. Libao</div>
                        <div className="text-[10px] text-[#166534] font-semibold">Administrative Aide IV (Records Custodian)</div>
                        <div className="text-[9px] text-[#64748B]">Central Receiving Desk - Docket Intake & Screening</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPersona('legal')}
                        className={`w-full p-2.5 rounded border text-left cursor-pointer transition-all ${
                          selectedPersona === 'legal'
                            ? 'border-[#15803D] bg-[#F0FDF4] ring-1 ring-[#15803D]'
                            : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#0F172A]">Atty. Rodrigo Ramos</div>
                        <div className="text-[10px] text-[#166534] font-semibold">Senior Legal Officer</div>
                        <div className="text-[9px] text-[#64748B]">Municipal Legal Office - Indorsements & Legal Review</div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      loginPreview(selectedPersona);
                      router.replace(returnTarget());
                    }}
                    className="btn-fluid w-full flex items-center justify-center gap-2 py-2.5 bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white rounded text-xs font-bold shadow cursor-pointer"
                  >
                    <UserCheck size={14} />
                    <span>Authenticate & Enter Civil Service Desk</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="http://santamaria-docsys-idp.southeastasia.azurecontainer.io:8080/admin/master/console/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#081E36] rounded text-[11px] font-semibold cursor-pointer transition-colors"
                    >
                      <ExternalLink size={13} className="text-[#15803D]" />
                      <span>Keycloak Console</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleRetry}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] rounded text-[11px] font-semibold cursor-pointer transition-colors"
                    >
                      <RotateCcw size={13} />
                      <span>Retry Keycloak SSO</span>
                    </button>
                  </div>
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
