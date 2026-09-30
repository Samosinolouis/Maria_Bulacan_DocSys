'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { CLEAN_USERS } from '@/lib/cleanData';
import { ShieldCheck, Lock, UserCheck, KeyRound, ArrowRight } from 'lucide-react';
import GovMasthead from '@/components/GovMasthead';
import GovFooter from '@/components/GovFooter';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, setIsAuthenticated } = useApp();

  const [selectedUserId, setSelectedUserId] = useState<string>(CLEAN_USERS[0].id);
  const [email, setEmail] = useState<string>(CLEAN_USERS[0].email);
  const [password, setPassword] = useState<string>('SantaMaria2026!');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSelectPreset = (userId: string) => {
    setSelectedUserId(userId);
    const user = CLEAN_USERS.find((u) => u.id === userId);
    if (user) {
      setEmail(user.email);
      setPassword('SantaMaria2026!');
      setAuthError(null);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    // Authentic credentials check
    const matchedUser = CLEAN_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!matchedUser) {
      setAuthError('Access Denied. Email address not found in Santa Maria plantilla records.');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('Authentication Error. Invalid security credential provided.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setCurrentUser(matchedUser);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined' && rememberMe) {
        localStorage.setItem('docsys_session_user', JSON.stringify(matchedUser));
      }
      setLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* 1. National Trust Masthead */}
      <GovMasthead />

      {/* 2. Main Login Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fluid-fade">
        <div className="w-full max-w-4xl bg-white rounded-lg border border-[#CBD5E1] shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Institutional Heraldry and Statutory Notice */}
          <div className="w-full md:w-5/12 bg-[#081E36] text-white p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#0B2545]">
            <div className="space-y-6">
              {/* Dual Heraldic Insignia */}
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
                    src="/assets/bagong-pilipinas.svg"
                    alt="Bagong Pilipinas Official Insignia"
                    width={56}
                    height={56}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Title & Jurisdiction */}
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

              {/* Statutory Governance Mandate Notice */}
              <div className="p-3.5 bg-white/5 border border-white/10 rounded space-y-2 text-xs text-[#CBD5E1]">
                <div className="flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-[#86EFAC]" />
                  <span>Statutory Security Mandate</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Pursuant to Republic Act 10173 (Data Privacy Act of 2012) and Republic Act 10175
                  (Cybercrime Prevention Act), access to this executive docket and records
                  repository is restricted strictly to authorized Civil Service personnel.
                </p>
                <p className="leading-relaxed text-[11px] text-[#94A3B8]">
                  All session logins, status updates, and document transmissions are recorded
                  in the immutable statutory audit custody chain.
                </p>
              </div>
            </div>

            {/* Session Verification Footer */}
            <div className="pt-6 border-t border-white/10 text-[10px] text-[#94A3B8] font-mono">
              <div>HOST: AZURE CLOUD SWA [EASTASIA]</div>
              <div>SECURITY: TLS 1.3 / ENCRYPTED SESSION</div>
            </div>
          </div>

          {/* Right Column: Civil Service Access Portal Form */}
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
                  Select your assigned municipal plantilla account or provide official credentials.
                </p>
              </div>

              {/* Plantilla Persona Quick Selector */}
              <div className="mb-6 space-y-2">
                <label className="block text-[11px] font-bold text-[#081E36] uppercase tracking-wider">
                  Verified Civil Service Plantilla Accounts
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {CLEAN_USERS.map((user) => {
                    const isSelected = selectedUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectPreset(user.id)}
                        className={`p-2.5 rounded border text-left cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'border-[#15803D] bg-[#F0FDF4] shadow-xs'
                            : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#94A3B8] hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-[#0F172A] text-xs truncate">
                          {user.fullName}
                        </div>
                        <div className="text-[10px] text-[#166534] font-semibold truncate">
                          {user.title}
                        </div>
                        <div className="text-[9px] text-[#64748B] truncate font-mono">
                          {user.department}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                {authError && (
                  <div className="p-3 bg-[#F1F5F9] border border-[#334155] rounded text-xs text-[#0F172A] font-semibold flex items-start gap-2">
                    <Lock size={15} className="text-[#334155] shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Official Email Address or Plantilla ID *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="e.g. admin@santamaria.gov.ph"
                      className="w-full pl-8 pr-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] font-mono text-[#0F172A]"
                    />
                    <UserCheck size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Security Passcode or Access PIN *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter civil service passcode"
                      className="w-full pl-8 pr-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] font-mono text-[#0F172A]"
                    />
                    <KeyRound size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#475569]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#15803D] rounded cursor-pointer"
                    />
                    <span>Remember session on this government workstation</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-fluid w-full flex items-center justify-center gap-2 py-2.5 bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white rounded text-xs font-bold shadow cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Verifying Plantilla Records...</span>
                    ) : (
                      <>
                        <span>Authenticate</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-[11px] text-[#64748B] text-center">
              Civil Service Commission (CSC) and ARTA RA 11032 statutory compliance mandated.
            </div>
          </div>
        </div>
      </main>

      {/* 3. Official GWTS Compliance Footer */}
      <GovFooter />
    </div>
  );
}
