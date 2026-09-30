'use client';

import React from 'react';

export default function GovFooter() {
  return (
    <footer className="bg-white border-t-2 border-[#CBD5E1] text-[#64748B] py-6 px-6 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-dashed border-[#94A3B8] bg-[#F8FAFC] flex items-center justify-center text-[9px] rounded">
            [ SEAL ]
          </div>
          <div>
            <div className="font-bold text-[#0F172A]">[ REPUBLIC OF THE PHILIPPINES ]</div>
            <div className="text-[10px] text-[#94A3B8]">[ MUNICIPAL GOVERNMENT OF SANTA MARIA, BULACAN ]</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[10px]">
          <span>[ PRIVACY POLICY ]</span>
          <span>&bull;</span>
          <span>[ TERMS OF SERVICE ]</span>
          <span>&bull;</span>
          <span>[ CITIZEN CHARTER ]</span>
          <span>&bull;</span>
          <span>[ ARTA HOTLINE 8888 ]</span>
        </div>

        <div className="text-right text-[10px] text-[#94A3B8]">
          <div>[ OFFICIAL WIREFRAME DRAFT ]</div>
          <div>[ DICT GWTS v25.3 COMPLIANT LAYOUT ]</div>
        </div>
      </div>
    </footer>
  );
}
