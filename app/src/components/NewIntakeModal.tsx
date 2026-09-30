'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Building,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { DocumentRecord, DocumentType, DocumentCategory, User, Attachment } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS } from '@/lib/data';
import DocumentScanner from './DocumentScanner';

interface NewIntakeModalProps {
  currentUser: User;
  onClose: () => void;
  onSubmit: (newDoc: DocumentRecord) => void;
}

export default function NewIntakeModal({ currentUser, onClose, onSubmit }: NewIntakeModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [docType, setDocType] = useState<DocumentType>('INCOMING');
  const [category, setCategory] = useState<DocumentCategory>('OTHER');
  const [title, setTitle] = useState('');
  const [requestingParty, setRequestingParty] = useState('');
  const [originOffice, setOriginOffice] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');

  // Real Scanner & Attachment State
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [realAttachments, setRealAttachments] = useState<Attachment[]>([]);

  // Step 3 Screening Checkboxes
  const [checkAttachments, setCheckAttachments] = useState(true);
  const [checkAddressed, setCheckAddressed] = useState(true);
  const [checkSignatures, setCheckSignatures] = useState(true);

  const prefix = DOCUMENT_TYPE_LABELS[docType]?.prefix || 'IN';
  const controlNo = `${prefix}-2026-0${Math.floor(100 + Math.random() * 900)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requestingParty.trim() || !originOffice.trim()) {
      alert('Please fill in all mandatory administrative fields.');
      return;
    }

    const now = new Date();
    // 3 business days SLA under RA 11032
    const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const isScreeningComplete = checkAttachments && checkAddressed && checkSignatures;

    const newDoc: DocumentRecord = {
      id: `DOC-2026-${Date.now().toString().slice(-4)}`,
      controlNumber: controlNo,
      type: docType,
      category,
      title,
      requestingParty,
      originOffice,
      dateReceived: now.toISOString(),
      assignedTo: null,
      status: isScreeningComplete ? 'PREPARATION' : 'SCREENING',
      scannedFileUrl: scannedPages.length > 0 ? scannedPages[0] : (realAttachments[0]?.fileDataUrl || null),
      scannedPages: scannedPages,
      attachments: realAttachments,
      draftContent: '',
      draftDocumentUrl: null,
      denialReason: null,
      endorsementNotes: null,
      transmissionDetails: null,
      slaDeadline: deadline.toISOString(),
      isOverdue: false,
      priority,
      createdBy: currentUser.fullName,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    onSubmit(newDoc);
  };

  return (
    <div
      className="fixed inset-0 bg-[#081E36]/75 z-50 flex items-center justify-center p-4 animate-fluid-fade"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[92vh] shadow-2xl border border-[#081E36] overflow-hidden flex flex-col animate-fluid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#081E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#15803D]">
          <div>
            <span className="font-mono text-xs font-bold text-[#FCD116]">
              MODULE A: RECEPTION, INTAKE & SCANNING
            </span>
            <h2 className="font-cinzel text-lg font-bold text-white">
              Log Incoming Document or Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Multi-Step Civil Service Stepper Bar */}
        <div className="bg-[#F8FAFC] border-b border-[#CBD5E1] px-6 py-3 flex items-center justify-between text-xs font-bold">
          <div
            className={`flex items-center gap-2 cursor-pointer ${
              step === 1 ? 'text-[#15803D]' : 'text-[#64748B]'
            }`}
            onClick={() => setStep(1)}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Metadata & Docket</span>
          </div>
          <span className="text-[#CBD5E1]">&gt;</span>
          <div
            className={`flex items-center gap-2 cursor-pointer ${
              step === 2 ? 'text-[#15803D]' : 'text-[#64748B]'
            }`}
            onClick={() => setStep(2)}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Document Scanner & Upload</span>
          </div>
          <span className="text-[#CBD5E1]">&gt;</span>
          <div
            className={`flex items-center gap-2 cursor-pointer ${
              step === 3 ? 'text-[#15803D]' : 'text-[#64748B]'
            }`}
            onClick={() => setStep(3)}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Initial Screening</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Metadata */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F0FDF4] border-l-4 border-[#15803D] rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#166534] block">
                    Statutory Automated Control Number
                  </span>
                  <span className="font-mono text-sm font-bold text-[#0F172A]">{controlNo}</span>
                </div>
                <span className="text-[10px] font-mono bg-[#15803D] text-white px-2 py-0.5 rounded font-bold">
                  RA 11032 MANDATE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Document or Request Type *
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-xs font-semibold focus:outline-none focus:border-[#15803D]"
                  >
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Official Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-xs font-semibold focus:outline-none focus:border-[#15803D]"
                  >
                    {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                  Subject Matter or Formal Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Request for Travel Order: Provincial DRRM Quarterly Council Meeting"
                  required
                  className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Requesting Person or Signatory *
                  </label>
                  <input
                    type="text"
                    value={requestingParty}
                    onChange={(e) => setRequestingParty(e.target.value)}
                    placeholder="e.g. Florian De Leon, LDRRMO IV"
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Originating Department or Office *
                  </label>
                  <input
                    type="text"
                    value={originOffice}
                    onChange={(e) => setOriginOffice(e.target.value)}
                    placeholder="e.g. Municipal Disaster Risk Reduction & Management Office"
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                  Urgency or Priority Level
                </label>
                <div className="flex gap-4">
                  {(['NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
                    <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={priority === p}
                        onChange={() => setPriority(p)}
                        className="accent-[#15803D]"
                      />
                      <span className="font-semibold text-xs text-[#0F172A]">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Real Document Scanner & File Upload */}
          {step === 2 && (
            <DocumentScanner
              onScanComplete={(pages, atts) => {
                setScannedPages(pages);
                setRealAttachments(atts);
              }}
              initialPages={scannedPages}
              initialAttachments={realAttachments}
              currentUserFullName={currentUser.fullName}
            />
          )}

          {/* STEP 3: Screening Checklist */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] border-l-4 border-l-[#081E36] rounded">
                <h4 className="font-bold text-xs text-[#081E36] uppercase mb-2">
                  Module B: Attachment Completeness Screening Checklist (Step 2)
                </h4>
                <div className="space-y-2 text-xs text-[#334155]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAttachments}
                      onChange={(e) => setCheckAttachments(e.target.checked)}
                      className="accent-[#15803D] rounded cursor-pointer"
                    />
                    <span>All mandatory annexes and supporting documents are attached and verified.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAddressed}
                      onChange={(e) => setCheckAddressed(e.target.checked)}
                      className="accent-[#15803D] rounded cursor-pointer"
                    />
                    <span>Properly addressed to the Municipal Administrator or Municipal Mayor.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkSignatures}
                      onChange={(e) => setCheckSignatures(e.target.checked)}
                      className="accent-[#15803D] rounded cursor-pointer"
                    />
                    <span>Official signature and office seal of requesting department head verified.</span>
                  </label>
                </div>
              </div>

              {/* Summary Docket Block */}
              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs space-y-1.5">
                <div className="font-bold uppercase text-[11px] text-[#081E36] mb-2 flex items-center justify-between">
                  <span>Intake Record Verification Summary</span>
                  <span className="font-mono text-[#15803D]">
                    {scannedPages.length} Scanned Pages, {realAttachments.length} Digital Annexes
                  </span>
                </div>
                <div>Control Number: <strong className="font-mono text-[#081E36]">{controlNo}</strong></div>
                <div>Document Type: <strong>{DOCUMENT_TYPE_LABELS[docType]?.label}</strong></div>
                <div>Subject: <strong>{title || 'None Specified'}</strong></div>
                <div>Requesting Signatory: <strong>{requestingParty || 'None Specified'}</strong></div>
                <div>Originating Office: <strong>{originOffice || 'None Specified'}</strong></div>
                <div>Receiving Plantilla Officer: <strong>{currentUser.fullName} ({currentUser.title})</strong></div>
              </div>
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="pt-4 border-t border-[#CBD5E1] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="btn-fluid px-4 py-2 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="btn-fluid px-5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md"
              >
                <CheckCircle2 size={16} />
                <span>Officially Log and Intake Document</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
