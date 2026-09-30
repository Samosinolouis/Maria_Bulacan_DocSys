'use client';

import React from 'react';

export default function PrepareView() {
  const templates = [
    {
      title: 'Travel Order Template',
      code: 'TO-LGU-2026',
      desc: 'Official travel authorization for municipal personnel and department heads.',
    },
    {
      title: 'Executive Order (EO)',
      code: 'EO-MAYOR-2026',
      desc: 'Official directive issued by the Municipal Mayor regarding municipal policy.',
    },
    {
      title: '1st Indorsement to SB',
      code: 'IND-SB-2026',
      desc: 'Formal transmittal to the Sangguniang Bayan for legislative resolution.',
    },
    {
      title: 'Venue Clearance Form',
      code: 'VR-GSO-2026',
      desc: 'Venue security, logistics, and sound system clearance with GSO.',
    },
    {
      title: 'Overtime Authorization',
      code: 'OT-HRMO-2026',
      desc: 'Overtime pay authority compliant with CSC and COA regulations.',
    },
    {
      title: 'Legal Advice Request',
      code: 'LO-LEGAL-2026',
      desc: 'Transmittal to Municipal Legal Officer for contractual review.',
    },
  ];

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm">
        <h3 className="font-cinzel text-base font-bold text-[#081E36]">
          MODULE C: OFFICIAL DOCUMENT DRAFTING STUDIO
        </h3>
        <p className="text-xs text-[#64748B]">
          Prepare official executive orders, endorsements, and memorandum orders based on statutory templates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((tmpl) => (
          <div
            key={tmpl.code}
            className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm space-y-2 hover:border-[#15803D] card-fluid"
          >
            <span className="font-mono text-[10px] font-bold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded">
              {tmpl.code}
            </span>
            <h4 className="font-bold text-sm text-[#0F172A]">{tmpl.title}</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">{tmpl.desc}</p>
            <button
              onClick={() => alert(`Activated template ${tmpl.title}. Loaded into drafting studio.`)}
              className="btn-fluid w-full mt-2 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded font-bold text-xs cursor-pointer shadow-sm"
            >
              Open Template in Editor
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
