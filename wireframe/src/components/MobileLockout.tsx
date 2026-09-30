'use client';

import React from 'react';
import { Monitor, ShieldAlert } from 'lucide-react';

export default function MobileLockout() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center border-4 border-dashed border-[#94A3B8]">
      <div className="w-16 h-16 border-2 border-dashed border-[#94A3B8] bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={28} className="text-[#475569]" />
      </div>

      <div className="font-mono text-xs uppercase tracking-widest text-[#64748B] mb-2">
        [ MUNICIPALITY OF SANTA MARIA &bull; BULACAN ]
      </div>

      <h1 className="text-xl font-bold text-[#0F172A] max-w-sm mb-3">
        [ CIVIL SERVICE WORKSTATION RESTRICTED ]
      </h1>

      <p className="text-xs text-[#475569] max-w-md mb-6 leading-relaxed">
        [ This official municipal document management and ARTA compliance terminal is architected exclusively for authorized desktop and laptop workstations. Mobile handheld devices are locked to prevent tampering. ]
      </p>

      <div className="p-4 border border-[#CBD5E1] bg-[#F8FAFC] rounded max-w-md w-full text-left space-y-2 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
          <Monitor size={14} />
          <span>[ AUTHORIZED WORKSTATION SPECS ]</span>
        </div>
        <div className="text-[11px] text-[#64748B] font-mono space-y-1">
          <div>&bull; Minimum Display Width: 1024px</div>
          <div>&bull; Operating Security: DICT Level 3 Workstation</div>
          <div>&bull; Hardware Token / Dual-Auth Session Required</div>
        </div>
      </div>

      <div className="font-mono text-[10px] text-[#94A3B8]">
        [ STATUTORY COMPLIANCE: REPUBLIC ACT 11032 &bull; DATA PRIVACY ACT RA 10173 ]
      </div>
    </div>
  );
}
