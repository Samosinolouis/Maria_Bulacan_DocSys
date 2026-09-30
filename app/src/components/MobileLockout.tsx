'use client';

import Image from 'next/image';
import { Monitor, ShieldCheck } from 'lucide-react';

export default function MobileLockout() {
  return (
    <div className="min-h-screen bg-[#081E36] text-white flex flex-col justify-between p-6 sm:p-8 animate-fluid-fade">
      {/* Top GOVPH Trust Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 text-[11px] text-[#CBD5E1]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#FCD116]">GOVPH</span>
          <span>|</span>
          <span>Santa Maria, Bulacan</span>
        </div>
        <span className="font-mono text-[10px] text-[#94A3B8]">RA 10535 PST (GMT+8)</span>
      </div>

      {/* Main Lockout Notice */}
      <div className="max-w-md mx-auto my-auto w-full py-8 text-center space-y-6">
        {/* Heraldic Seals */}
        <div className="flex items-center justify-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <Image
              src="/assets/santa-maria-seal.png"
              alt="Official Seal of the Municipality of Santa Maria, Bulacan"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div className="relative w-16 h-16 shrink-0">
            <Image
              src="/assets/bagong-pilipinas.svg"
              alt="Bagong Pilipinas Official Seal"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Institution Titles */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#86EFAC] block">
            Republic of the Philippines - Province of Bulacan
          </span>
          <h1 className="font-cinzel text-xl font-bold tracking-wide text-white">
            MUNICIPALITY OF SANTA MARIA
          </h1>
          <p className="font-serif-docket text-xs text-[#CBD5E1]">
            Office of the Municipal Administrator
          </p>
        </div>

        {/* Lockout Notice Card */}
        <div className="bg-[#0B2545] border border-[#CBD5E1]/20 rounded-lg p-6 text-left space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 text-[#CBD5E1] border-b border-white/10 pb-3">
            <Monitor size={18} className="text-[#86EFAC] shrink-0" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Workstation Access Restriction
            </span>
          </div>

          <div className="space-y-2.5 text-xs leading-relaxed text-[#CBD5E1]">
            <p className="font-bold text-white text-sm">
              This system is used for government operations and is locked for mobiles.
            </p>
            <p className="text-[#94A3B8]">
              The Santa Maria Municipal Document Management System (DOCSYS v2.6) contains official
              dockets, executive orders, and statutory compliance registries mandated under Republic
              Act 11032.
            </p>
            <p className="text-[#94A3B8]">
              To maintain statutory records integrity and data custody standards, administrative
              workflows are restricted to authorized desktop and laptop workstations.
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono text-[#86EFAC]">
            <ShieldCheck size={16} className="shrink-0" />
            <span>Authorized Desktop / Laptop Workstation Required</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-[#94A3B8] border-t border-white/10 pt-4 space-y-1 font-mono">
        <div>DOCSYS v2.6 [ARTA RA 11032] - Municipal Administrator Security Protocol</div>
        <div>Pamahalaang Bayan ng Santa Maria, Lalawigan ng Bulacan</div>
      </div>
    </div>
  );
}
