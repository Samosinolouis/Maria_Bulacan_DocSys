'use client';

import React from 'react';

export default function GovMasthead() {
  return (
    <div className="bg-white border-b border-[#CBD5E1] px-4 py-1.5 text-xs text-[#64748B] flex items-center justify-between font-mono">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full border border-[#94A3B8] bg-[#E2E8F0]" />
        <span>[ GOV.PH &bull; OFFICIAL GOVERNMENT PORTAL ]</span>
      </div>
      <div>
        <span>[ STATUTORY COMPLIANCE: RA 11032 ARTA &bull; GWTS v25.3 ]</span>
      </div>
    </div>
  );
}
