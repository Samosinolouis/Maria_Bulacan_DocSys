'use client';

import React from 'react';

export default function PrepareView() {
  const templates = [
    { title: 'Travel Order Template', code: 'TO-LGU-2026', desc: 'Official travel authorization for municipal personnel and department heads.' },
    { title: 'Executive Order (EO)', code: 'EO-MAYOR-2026', desc: 'Official directive issued by the Municipal Mayor regarding municipal policy.' },
    { title: '1st Indorsement to SB', code: 'IND-SB-2026', desc: 'Formal transmittal to the Sangguniang Bayan for legislative resolution.' },
    { title: 'Venue Clearance Form', code: 'VR-GSO-2026', desc: 'Venue security, logistics, and sound system clearance with GSO.' },
    { title: 'Overtime Authorization', code: 'OT-HRMO-2026', desc: 'Overtime pay authority compliant with CSC and COA regulations.' },
    { title: 'Legal Advice Request', code: 'LO-LEGAL-2026', desc: 'Transmittal to Municipal Legal Officer for contractual review.' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded border border-[#94A3B8]">
        <h3 className="font-mono text-sm font-bold text-[#0F172A]">
          [ MODULE C: OFFICIAL DOCUMENT DRAFTING STUDIO ]
        </h3>
        <p className="text-xs text-[#64748B]">
          [ Standard statutory drafting templates for municipal directives, legal indorsements, and personnel orders. ]
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((tmpl) => (
          <div
            key={tmpl.code}
            className="p-4 bg-white rounded border border-[#CBD5E1] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold border border-[#94A3B8] px-2 py-0.5 rounded">
                [{tmpl.code}]
              </span>
              <span className="wf-badge">[ TEMPLATE ]</span>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-xs text-[#0F172A]">[{tmpl.title}]</h4>
              <div className="h-1.5 w-full bg-[#E2E8F0] rounded" />
              <div className="h-1.5 w-2/3 bg-[#E2E8F0] rounded" />
            </div>

            <p className="text-[11px] text-[#64748B] leading-relaxed">
              [{tmpl.desc}]
            </p>

            <button className="wf-btn w-full text-xs">
              [ Open Template in Editor ]
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
