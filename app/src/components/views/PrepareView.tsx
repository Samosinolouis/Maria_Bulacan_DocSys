'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  FileText,
  Printer,
  Save,
  CheckCircle2,
  Building,
  ArrowRight,
  Eye,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { DocumentRecord, DocumentType, DocumentCategory } from '@/lib/types';

interface TemplateDef {
  code: string;
  title: string;
  type: DocumentType;
  category: DocumentCategory;
  desc: string;
  defaultTitle: string;
  defaultBody: string;
}

const TEMPLATES: TemplateDef[] = [
  {
    code: 'TO-LGU-2026',
    title: 'Travel Order Authorization',
    type: 'TRAVEL_ORDER',
    category: 'OTHER',
    desc: 'Official travel authorization for municipal officers and department personnel.',
    defaultTitle: 'Travel Order: Attendance in Regional Anti-Red Tape and Integrity Seminar',
    defaultBody: `Pursuant to the provisions of Executive Order No. 77 and existing civil service rules, you are hereby authorized to undertake official travel as indicated below:

1. NAME / DESIGNATION: Mr. Florian De Leon, Administrative Officer IV
2. PURPOSE OF TRAVEL: Attendance in Regional Anti-Red Tape and Integrity Coordination Conference
3. DESTINATION: City of San Fernando, Pampanga (Regional Government Center)
4. INCLUSIVE DATES: October 12-14, 2026
5. APPROPRIATION: Local Funds, Office of the Municipal Administrator

Transportation expenses and allowable per diem shall be provided subject to standard COA auditing rules and availability of funds.`,
  },
  {
    code: 'EO-MAYOR-2026',
    title: 'Executive Order (Office of the Mayor)',
    type: 'EXECUTIVE_ORDER',
    category: 'EXEC_ORDER',
    desc: 'Official directive issued by the Municipal Mayor regarding municipal executive policy.',
    defaultTitle: 'Executive Order No. 2026-024: Reorganizing the Municipal Peace and Order Council',
    defaultBody: `WHEREAS, Section 116 of Republic Act No. 7160 mandates every local government unit to establish a Municipal Peace and Order Council;

WHEREAS, there is an imperative necessity to reorganize and revitalize the membership of the Municipal Peace and Order Council of Santa Maria, Bulacan to address emerging peace and security concerns;

NOW, THEREFORE, I, HON. BARTOLOME, Municipal Mayor of Santa Maria, Bulacan, by virtue of the powers vested in me by law, do hereby order:

SECTION 1. COMPOSITION. The Municipal Peace and Order Council is hereby reconstituted with the Municipal Mayor as Chairman and the Municipal Administrator as Vice-Chairman.

SECTION 2. DUTIES AND FUNCTIONS. The Council shall formulate and implement the Local Peace and Order and Public Safety Plan.`,
  },
  {
    code: 'IND-SB-2026',
    title: '1st Indorsement Referral to Sanggunian',
    type: 'SB_ENDORSEMENT',
    category: 'SB_ENDORSEMENT',
    desc: 'Formal transmittal to the Sangguniang Bayan for legislative ordinance or resolution.',
    defaultTitle: '1st Indorsement: Proposed Sisterhood and Economic Partnership Agreement',
    defaultBody: `Respectfully referred to the Honorable Members of the Sangguniang Bayan, through the Municipal Vice Mayor, the herein letter and proposed Memorandum of Understanding regarding the Sisterhood and Economic Partnership between the Municipality of Santa Maria, Bulacan and the City Government of Malolos.

Favorably recommending favorable legislative authorization granting authority to the Municipal Mayor to sign and execute the aforementioned agreement for the mutual benefit of both localities.`,
  },
  {
    code: 'MO-MA-2026',
    title: 'Administrative Memorandum Order',
    type: 'MEMO_ORDER',
    category: 'MEMO_ORDER',
    desc: 'Directives from the Municipal Administrator on office protocols, working hours, and operations.',
    defaultTitle: 'Memorandum Order No. 2026-015: Strict Compliance with RA 11032 3-Day SLA Guidelines',
    defaultBody: `TO: ALL DEPARTMENT HEADS, CHIEFS OF OFFICES, AND CENTRAL DESK ENCODERS

SUBJECT: STRICT ADHERENCE TO CITIZEN'S CHARTER PROCESSING TIMELINES

Notice is hereby given to all municipal personnel to ensure that all incoming client requests and administrative transactions are processed within the seventy-two (72) hour processing window mandated under Republic Act No. 11032.

Failure to resolve simple dockets within the statutory time frame shall be subject to administrative inquiry pursuant to CSC rules.

FOR STRICT COMPLIANCE.`,
  },
  {
    code: 'CP-LGU-2026',
    title: 'Mayor\'s Clearance and Special Permit',
    type: 'CERTIFICATION_PERMIT',
    category: 'CERTIFICATION',
    desc: 'Official clearance and municipal permit for events, civil activities, and facilities.',
    defaultTitle: 'Mayor\'s Permit No. 2026-088: Public Assembly and Civic Parade Clearance',
    defaultBody: `TO WHOM IT MAY CONCERN:

THIS IS TO CERTIFY that clearance and permission is hereby granted to the Santa Maria Parish Pastoral Council to hold a Holy Week Procession along municipal roads on the dates specified in their application.

This permit is granted subject to coordination with the Santa Maria Municipal Police Station and the Municipal Traffic Management Group for traffic rerouting and public safety.`,
  },
  {
    code: 'EL-LGU-2026',
    title: 'Endorsement Letter & Recommendation',
    type: 'ENDORSEMENT_LETTER',
    category: 'WORK_ENDORSEMENT',
    desc: 'Endorsement for civil service employment, scholarship, medical, or national agency assistance.',
    defaultTitle: 'Endorsement Letter: DSWD Sustainable Livelihood Program Beneficiaries',
    defaultBody: `THE REGIONAL DIRECTOR
Department of Social Welfare and Development - Field Office III
City of San Fernando, Pampanga

Dear Director:

Warm greetings from the Municipality of Santa Maria, Bulacan!

I have the honor to respectfully endorse the attached list of eligible micro-entrepreneurs from Barangay Guyong and Barangay Pulong Buhangin for priority inclusion in the DSWD Sustainable Livelihood Program (SLP).

Your favorable assistance and prompt consideration of this endorsement will greatly benefit our constituents.`,
  },
];

export default function PrepareView() {
  const { handleAddNewDocument, currentUser } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDef | null>(null);

  // Editor Form State
  const [docTitle, setDocTitle] = useState('');
  const [docBody, setDocBody] = useState('');
  const [requestingParty, setRequestingParty] = useState('');
  const [originOffice, setOriginOffice] = useState('Office of the Municipal Administrator');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectTemplate = (tmpl: TemplateDef) => {
    setSelectedTemplate(tmpl);
    setDocTitle(tmpl.defaultTitle);
    setDocBody(tmpl.defaultBody);
    setRequestingParty(currentUser.fullName);
    setOriginOffice(currentUser.department);
    setSaveSuccess(false);
  };

  const handleSaveToDocket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !docTitle.trim() || !docBody.trim()) return;

    const now = new Date();
    const controlNo = `${selectedTemplate.code.split('-')[0]}-2026-0${Math.floor(
      100 + Math.random() * 900
    )}`;

    const newDoc: DocumentRecord = {
      id: `DOC-2026-${Date.now().toString().slice(-4)}`,
      controlNumber: controlNo,
      type: selectedTemplate.type,
      category: selectedTemplate.category,
      title: docTitle,
      requestingParty: requestingParty || currentUser.fullName,
      originOffice: originOffice || currentUser.department,
      dateReceived: now.toISOString(),
      assignedTo: currentUser.fullName,
      status: 'REVIEW', // Ready for Municipal Administrator approval
      scannedFileUrl: null,
      attachments: [],
      draftContent: docBody,
      draftDocumentUrl: null,
      denialReason: null,
      endorsementNotes: null,
      transmissionDetails: null,
      slaDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      isOverdue: false,
      priority: 'NORMAL',
      createdBy: currentUser.fullName,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    handleAddNewDocument(newDoc);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSelectedTemplate(null);
    }, 1800);
  };

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE C: OFFICIAL DOCUMENT DRAFTING STUDIO
          </h3>
          <p className="text-xs text-[#64748B]">
            Author and generate official Executive Orders, Travel Orders, SB Indorsements, and Clearances with authenticated Santa Maria heraldic letterhead.
          </p>
        </div>

        {selectedTemplate && (
          <button
            onClick={() => setSelectedTemplate(null)}
            className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-bold text-[#081E36] cursor-pointer"
          >
            Switch Template
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg text-xs text-[#166534] font-bold flex items-center gap-2 animate-fluid-fade">
          <CheckCircle2 size={16} />
          <span>Document successfully saved and submitted to Administrator Review Queue!</span>
        </div>
      )}

      {!selectedTemplate ? (
        /* Template Gallery */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.code}
              className="p-5 bg-white rounded-lg border border-[#CBD5E1] shadow-sm space-y-3 hover:border-[#15803D] hover:shadow-md transition-all card-fluid flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                    {tmpl.code}
                  </span>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold">
                    Official Template
                  </span>
                </div>
                <h4 className="font-cinzel text-sm font-bold text-[#0F172A]">{tmpl.title}</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">{tmpl.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectTemplate(tmpl)}
                className="btn-fluid w-full py-2 bg-[#081E36] hover:bg-[#0B2545] text-white rounded font-bold text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5 mt-2"
              >
                <span>Draft New Document</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Live Drafting Canvas & Letterhead Preview */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Drafting Form */}
          <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm space-y-4">
            <div className="border-b border-[#CBD5E1] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#15803D] uppercase">
                  TEMPLATE: {selectedTemplate.code}
                </span>
                <h4 className="font-bold text-sm text-[#081E36]">{selectedTemplate.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDocTitle(selectedTemplate.defaultTitle);
                  setDocBody(selectedTemplate.defaultBody);
                }}
                className="text-[11px] text-[#64748B] hover:text-[#081E36] inline-flex items-center gap-1 cursor-pointer"
                title="Reset to template defaults"
              >
                <RefreshCw size={12} />
                <span>Reset Text</span>
              </button>
            </div>

            <form onSubmit={handleSaveToDocket} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                  Document Title / Subject Line *
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  required
                  className="w-full p-2.5 border border-[#CBD5E1] rounded text-xs font-semibold focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Author / Signatory *
                  </label>
                  <input
                    type="text"
                    value={requestingParty}
                    onChange={(e) => setRequestingParty(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Originating Department *
                  </label>
                  <input
                    type="text"
                    value={originOffice}
                    onChange={(e) => setOriginOffice(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                  Formal Document Body / Provisions *
                </label>
                <textarea
                  value={docBody}
                  onChange={(e) => setDocBody(e.target.value)}
                  required
                  rows={14}
                  className="w-full p-3 border border-[#CBD5E1] rounded text-xs font-mono focus:outline-none focus:border-[#15803D] leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#CBD5E1]">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="btn-fluid px-3.5 py-2 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-fluid px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save size={14} />
                  <span>Save and Submit to Review Queue</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Letterhead Stamped Preview */}
          <div className="lg:col-span-6 bg-[#FAFAF9] p-6 rounded-lg border border-[#CBD5E1] shadow-sm font-serif-docket space-y-4">
            <div className="text-center border-b-2 border-black pb-3">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#15803D]">
                Republika ng Pilipinas - Lalawigan ng Bulacan
              </div>
              <div className="font-cinzel text-lg font-bold text-[#081E36]">
                BAYAN NG SANTA MARIA
              </div>
              <div className="text-xs font-bold text-[#0F172A]">
                TANGGAPAN NG ADMINISTRADOR NG BAYAN
              </div>
              <div className="text-[10px] text-[#64748B] italic">
                Poblacion, Santa Maria, Bulacan, 3022 | smb.maoffice@gmail.com
              </div>
            </div>

            <div className="font-mono text-[11px] space-y-1 text-[#334155]">
              <div>DOCKET: <strong className="text-[#081E36]">PREVIEW-{selectedTemplate.code}</strong></div>
              <div>DATE: {new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}</div>
              <div>SUBJECT: <strong className="text-[#0F172A]">{docTitle || 'Untitled Draft'}</strong></div>
              <div>ORIGIN: {originOffice}</div>
            </div>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded shadow-inner min-h-[300px] whitespace-pre-wrap text-xs text-[#0F172A] leading-relaxed">
              {docBody || 'Type provisions or directives in the editor to preview official formatted output.'}
            </div>

            <div className="pt-4 flex justify-between items-end border-t border-[#E2E8F0]">
              <div className="text-[10px] font-mono text-[#64748B]">
                DICT GWTS v25.3.3 Validated
              </div>
              <div className="text-center w-60 border-t border-black pt-1.5">
                <div className="font-bold text-xs text-[#0F172A]">ENGR. ELMER B. CLEMENTE</div>
                <div className="text-[11px] text-[#64748B]">Municipal Administrator</div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] hover:bg-white text-[#081E36] rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer size={13} />
                <span>Print Official Letterhead</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
