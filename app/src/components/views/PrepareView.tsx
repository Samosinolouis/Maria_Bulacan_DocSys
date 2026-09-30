'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { DocumentRecord, DocumentType, DocumentCategory } from '@/lib/types';
import OfficialWordDocument from '@/components/OfficialWordDocument';

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
  const {
    handleAddNewDocument,
    handleUpdateDocument,
    currentUser,
    documents,
    prepareTargetDocId,
    setPrepareTargetDocId,
  } = useApp();

  // Workflow Mode: Draft for an existing incoming docket vs. Author new issuance
  const [draftingMode, setDraftingMode] = useState<'existing' | 'new'>('new');
  const [selectedExistingDocId, setSelectedExistingDocId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDef | null>(TEMPLATES[0]);

  // Editor Form State
  const [docTitle, setDocTitle] = useState(TEMPLATES[0].defaultTitle);
  const [docBody, setDocBody] = useState(TEMPLATES[0].defaultBody);
  const [requestingParty, setRequestingParty] = useState(currentUser.fullName);
  const [originOffice, setOriginOffice] = useState(currentUser.department);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // If redirected from DocumentDetailModal with a target docket ID, automatically load it
  useEffect(() => {
    if (prepareTargetDocId) {
      const targetDoc = documents.find((d) => d.id === prepareTargetDocId);
      if (targetDoc) {
        setDraftingMode('existing');
        setSelectedExistingDocId(targetDoc.id);
        setDocTitle(`Resolution / Issuance: ${targetDoc.title}`);
        setRequestingParty(targetDoc.requestingParty);
        setOriginOffice(targetDoc.originOffice);
        if (targetDoc.draftContent) {
          setDocBody(targetDoc.draftContent);
        }
      }
    }
  }, [prepareTargetDocId, documents]);

  const handleSelectExistingDoc = (docId: string) => {
    setSelectedExistingDocId(docId);
    const target = documents.find((d) => d.id === docId);
    if (target) {
      setDocTitle(`Official Resolution: ${target.title}`);
      setRequestingParty(target.requestingParty);
      setOriginOffice(target.originOffice);
      if (target.draftContent) {
        setDocBody(target.draftContent);
      } else if (selectedTemplate) {
        setDocBody(selectedTemplate.defaultBody);
      }
    }
  };

  const handleSelectTemplate = (tmpl: TemplateDef) => {
    setSelectedTemplate(tmpl);
    setDocTitle(tmpl.defaultTitle);
    setDocBody(tmpl.defaultBody);
    if (draftingMode === 'new') {
      setRequestingParty(currentUser.fullName);
      setOriginOffice(currentUser.department);
    }
  };

  // Currently selected existing document record (if any)
  const selectedExistingDoc = useMemo(() => {
    if (draftingMode === 'existing' && selectedExistingDocId) {
      return documents.find((d) => d.id === selectedExistingDocId) || null;
    }
    return null;
  }, [draftingMode, selectedExistingDocId, documents]);

  // Derived Document Record for the live Word Document Preview and Print
  const previewDocRecord: DocumentRecord = useMemo(() => {
    const now = new Date();
    return {
      id: selectedExistingDoc?.id || 'PREVIEW-DRAFT',
      controlNumber:
        selectedExistingDoc?.controlNumber ||
        (selectedTemplate
          ? `${selectedTemplate.code.split('-')[0]}-2026-0${Math.floor(100 + Math.random() * 900)}`
          : 'SM-MA-2026-DRAFT'),
      type: selectedTemplate?.type || selectedExistingDoc?.type || 'MEMO_ORDER',
      category: selectedTemplate?.category || selectedExistingDoc?.category || 'MEMO_ORDER',
      title: docTitle || 'Official Executive Issuance',
      requestingParty: requestingParty || currentUser.fullName,
      originOffice: originOffice || currentUser.department,
      dateReceived: selectedExistingDoc?.dateReceived || now.toISOString(),
      assignedTo: currentUser.fullName,
      status: 'REVIEW',
      scannedFileUrl: null,
      attachments: selectedExistingDoc?.attachments || [],
      draftContent: docBody,
      slaDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      isOverdue: false,
      priority: 'NORMAL',
      createdBy: currentUser.fullName,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }, [selectedExistingDoc, selectedTemplate, docTitle, requestingParty, originOffice, docBody, currentUser]);

  const handleSaveToDocket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docBody.trim()) return;

    if (draftingMode === 'existing' && selectedExistingDoc) {
      // Flow 1: Updating an existing incoming docket with the newly drafted executive text
      const updatedDoc: DocumentRecord = {
        ...selectedExistingDoc,
        draftContent: docBody,
        status: 'REVIEW', // Ready for Municipal Administrator / Mayor counter-signature
        updatedAt: new Date().toISOString(),
      };
      handleUpdateDocument(updatedDoc);
      setSaveSuccessMsg(
        `Drafted issuance successfully attached to docket ${selectedExistingDoc.controlNumber} and submitted to Review Queue!`
      );
      setPrepareTargetDocId(null);
    } else {
      // Flow 2: Creating a brand new standalone executive issuance
      const now = new Date();
      const codePrefix = selectedTemplate ? selectedTemplate.code.split('-')[0] : 'SM';
      const controlNo = `${codePrefix}-2026-0${Math.floor(100 + Math.random() * 900)}`;

      const newDoc: DocumentRecord = {
        id: `DOC-2026-${Date.now().toString().slice(-4)}`,
        controlNumber: controlNo,
        type: selectedTemplate?.type || 'MEMO_ORDER',
        category: selectedTemplate?.category || 'MEMO_ORDER',
        title: docTitle,
        requestingParty: requestingParty || currentUser.fullName,
        originOffice: originOffice || currentUser.department,
        dateReceived: now.toISOString(),
        assignedTo: currentUser.fullName,
        status: 'REVIEW',
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
      setSaveSuccessMsg(
        `New executive issuance ${controlNo} authored and submitted to Review Queue!`
      );
    }

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  return (
    <div className="space-y-4 animate-fluid-tab">
      {/* Studio Header Bar */}
      <div className="no-print p-4 bg-white rounded border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] font-bold text-[#15803D] uppercase tracking-wider">
            CIVIL SERVICE DOCUMENT GENERATOR
          </span>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            OFFICIAL DOCUMENT DRAFTING STUDIO
          </h3>
          <p className="text-xs text-[#64748B]">
            Author executive resolutions, draft responses for incoming citizen requests, or create authenticated Santa Maria heraldic issuances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-fluid px-3.5 py-1.5 bg-[#FCD116] hover:bg-[#FACC15] text-[#081E36] font-bold text-xs rounded shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            title="Print Microsoft Word format executive document"
          >
            <Printer size={14} />
            <span>Print Word Document</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="no-print p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg text-xs text-[#166534] font-bold flex items-center gap-2 animate-fluid-fade">
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Workflow Mode Selector: Draft for Existing Docket vs. Author New Issuance */}
      <div className="no-print bg-white p-4 rounded-lg border border-[#CBD5E1] shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-[#15803D]">
              Select Workflow Mode
            </span>
            <h4 className="font-cinzel text-sm font-bold text-[#081E36]">
              {draftingMode === 'existing'
                ? 'Draft Resolution or Endorsement for an Existing Docket'
                : 'Author New Standalone Executive Issuance'}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-lg border border-[#CBD5E1] text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setDraftingMode('existing');
              }}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                draftingMode === 'existing'
                  ? 'bg-[#081E36] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#081E36]'
              }`}
            >
              <LinkIcon size={13} />
              <span>Draft for Existing Docket</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftingMode('new');
                setSelectedExistingDocId('');
              }}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                draftingMode === 'new'
                  ? 'bg-[#081E36] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#081E36]'
              }`}
            >
              <Plus size={13} />
              <span>Author New Issuance</span>
            </button>
          </div>
        </div>

        {/* Existing Docket Dropdown Picker */}
        {draftingMode === 'existing' && (
          <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs space-y-2">
            <label className="block text-[11px] font-bold text-[#081E36]">
              Target Docket from Registry *
            </label>
            {documents.length > 0 ? (
              <select
                value={selectedExistingDocId}
                onChange={(e) => handleSelectExistingDoc(e.target.value)}
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs bg-white font-semibold focus:outline-none focus:border-[#15803D]"
              >
                <option value="">-- Choose an incoming docket to draft a response for --</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.controlNumber} | {d.title} ({d.requestingParty} - {d.status})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[#64748B] italic">
                No dockets currently in registry. You can author a new issuance or log incoming documents at the intake desk.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Dual-Column Canvas: Editor on Left, Authentic Microsoft Word Layout on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Drafting Form (Hidden on Print) */}
        <div className="no-print lg:col-span-5 bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm space-y-4">
          <div className="border-b border-[#CBD5E1] pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#15803D] uppercase">
                TEMPLATE: {selectedTemplate?.code || 'CUSTOM'}
              </span>
              <h4 className="font-bold text-sm text-[#081E36]">
                {selectedTemplate?.title || 'Document Drafting'}
              </h4>
            </div>
            {selectedTemplate && (
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
            )}
          </div>

          {/* Quick Template Picker */}
          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Apply Civil Service Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.code}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`p-2 rounded text-left border text-[11px] transition-all cursor-pointer ${
                    selectedTemplate?.code === tmpl.code
                      ? 'border-[#15803D] bg-[#F0FDF4] text-[#166534] font-bold shadow-xs'
                      : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="font-mono text-[9px] block text-[#64748B]">{tmpl.code}</span>
                  <span className="line-clamp-1">{tmpl.title}</span>
                </button>
              ))}
            </div>
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
                Formal Document Provisions & Body *
              </label>
              <textarea
                value={docBody}
                onChange={(e) => setDocBody(e.target.value)}
                required
                rows={12}
                className="w-full p-3 border border-[#CBD5E1] rounded text-xs font-mono focus:outline-none focus:border-[#15803D] leading-relaxed"
                placeholder="Type or customize official statutory provisions..."
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#CBD5E1]">
              <button
                type="submit"
                className="btn-fluid px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md w-full justify-center"
              >
                <Save size={14} />
                <span>
                  {draftingMode === 'existing'
                    ? 'Save to Docket and Forward to Review'
                    : 'Save New Issuance to Review Queue'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Microsoft Word Format Paper Preview & Print Target */}
        <div className="lg:col-span-7 space-y-3">
          <div className="no-print bg-[#F1F5F9] p-3 rounded-lg border border-[#CBD5E1] flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-[#081E36] block">
                Microsoft Word Executive Layout Preview
              </span>
              <span className="text-[10px] text-[#64748B]">
                Times New Roman font, 1-inch margins, dual coats of arms, ready for physical printing or PDF export.
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-fluid px-3.5 py-1.5 bg-[#FCD116] hover:bg-[#FACC15] text-[#081E36] rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Print Microsoft Word format executive document"
            >
              <Printer size={14} />
              <span>Print Word Document</span>
            </button>
          </div>

          <div className="overflow-x-auto p-2 sm:p-4 bg-[#E2E8F0] rounded-lg">
            <OfficialWordDocument document={previewDocRecord} showToolbar={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
