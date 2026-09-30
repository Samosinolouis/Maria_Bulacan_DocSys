'use client';

import { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Upload,
  CheckCircle2,
  FileText,
  Scan,
  AlertCircle,
} from 'lucide-react';
import { DocumentRecord, DocumentType, DocumentCategory, User } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS } from '@/lib/data';

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
  const [scannedFileName, setScannedFileName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [attachmentsList, setAttachmentsList] = useState<{ id: string; name: string; size: string }[]>([
    { id: 'att-1', name: 'Official_Transmittal_Letter.pdf', size: '1.2 MB' },
  ]);

  // Step 3 Screening Checkbox
  const [checkAttachments, setCheckAttachments] = useState(true);
  const [checkAddressed, setCheckAddressed] = useState(true);
  const [checkSignatures, setCheckSignatures] = useState(true);

  const prefix = DOCUMENT_TYPE_LABELS[docType]?.prefix || 'IN';
  const controlNo = `${prefix}-2026-0${Math.floor(100 + Math.random() * 900)}`;

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedFileName(`SCANNED_${controlNo}_OFFICIAL.pdf`);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requestingParty.trim() || !originOffice.trim()) {
      alert('Please fill in all mandatory administrative fields.');
      return;
    }

    const now = new Date();
    // 3 business days SLA
    const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

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
      status: 'SCREENING',
      scannedFileUrl: scannedFileName ? `/assets/${scannedFileName}` : null,
      attachments: attachmentsList.map((a) => ({
        id: a.id,
        fileName: a.name,
        fileSize: a.size,
        fileType: 'application/pdf',
        uploadedBy: currentUser.fullName,
        uploadedAt: now.toISOString(),
      })),
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
        className="bg-white rounded-lg w-full max-w-2xl shadow-2xl border border-[#081E36] overflow-hidden flex flex-col animate-fluid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#081E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#15803D]">
          <div>
            <span className="font-mono text-xs font-bold text-[#FCD116]">
              MODULE A: STATUTORY RECEPTION & INTAKE
            </span>
            <h2 className="font-serif-docket text-lg font-bold text-white">
              Log New Incoming Document or Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-[#CBD5E1] hover:text-white rounded cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Step Progress */}
        <div className="bg-[#F8FAFC] px-6 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? 'bg-[#081E36] text-white' : 'bg-[#15803D] text-white'
              }`}
            >
              1
            </span>
            <span className={step === 1 ? 'font-bold text-[#081E36]' : 'text-[#64748B]'}>
              Classification & Particulars
            </span>
          </div>
          <span className="text-[#CBD5E1]">/</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2
                  ? 'bg-[#081E36] text-white'
                  : step > 2
                  ? 'bg-[#15803D] text-white'
                  : 'bg-[#E2E8F0] text-[#64748B]'
              }`}
            >
              2
            </span>
            <span className={step === 2 ? 'font-bold text-[#081E36]' : 'text-[#64748B]'}>
              Physical Scan & Upload
            </span>
          </div>
          <span className="text-[#CBD5E1]">/</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 3 ? 'bg-[#081E36] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
              }`}
            >
              3
            </span>
            <span className={step === 3 ? 'font-bold text-[#081E36]' : 'text-[#64748B]'}>
              Screening & Commitment
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Document / Request Type *
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
                  Subject Matter / Formal Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Request for Travel Order - DILG Regional Conference"
                  required
                  className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Requesting Person / Signatory *
                  </label>
                  <input
                    type="text"
                    value={requestingParty}
                    onChange={(e) => setRequestingParty(e.target.value)}
                    placeholder="e.g. Engr. Roberto Santos"
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                    Originating Department / Office *
                  </label>
                  <input
                    type="text"
                    value={originOffice}
                    onChange={(e) => setOriginOffice(e.target.value)}
                    placeholder="e.g. Municipal Engineering Office"
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                  Urgency / Priority Level
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
                        className="text-[#15803D]"
                      />
                      <span className="font-semibold text-xs">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-[#CBD5E1] rounded-lg text-center bg-[#F8FAFC]">
                <Scan size={32} className="mx-auto text-[#081E36] mb-2" />
                <h4 className="font-bold text-xs text-[#081E36]">
                  High-Speed Scanner Integration (Physical Logbook Intake)
                </h4>
                <p className="text-[11px] text-[#64748B] mb-3">
                  Place incoming physical documents on feeder. Automatic OCR will extract control metadata.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={isScanning}
                  className="px-4 py-2 bg-[#081E36] hover:bg-[#0B2545] text-white rounded font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {isScanning ? 'Digitizing Feeder Scans...' : 'Execute Physical Scanner Feed'}
                </button>
              </div>

              {scannedFileName && (
                <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded flex items-center justify-between text-xs text-[#166534]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span className="font-mono font-bold">{scannedFileName}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#15803D] text-white px-2 py-0.5 rounded">
                    DIGITIZED & LINKED
                  </span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] border-l-4 border-l-[#081E36] rounded">
                <h4 className="font-bold text-xs text-[#081E36] uppercase mb-2">
                  Module B: Attachment Completeness Screening Checklist
                </h4>
                <div className="space-y-2 text-xs text-[#334155]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAttachments}
                      onChange={(e) => setCheckAttachments(e.target.checked)}
                      className="rounded"
                    />
                    <span>All mandatory annexes and supporting documents are attached.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAddressed}
                      onChange={(e) => setCheckAddressed(e.target.checked)}
                      className="rounded"
                    />
                    <span>Properly addressed to the Municipal Administrator or Mayor.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkSignatures}
                      onChange={(e) => setCheckSignatures(e.target.checked)}
                      className="rounded"
                    />
                    <span>Official signature and office seal of requesting head verified.</span>
                  </label>
                </div>
              </div>

              {/* Summary Docket Block */}
              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs space-y-1">
                <div className="font-bold uppercase text-[11px] text-[#081E36] mb-2">
                  Intake Record Ledger
                </div>
                <div>Control Number: <strong className="font-mono">{controlNo}</strong></div>
                <div>Document Type: <strong>{DOCUMENT_TYPE_LABELS[docType]?.label}</strong></div>
                <div>Subject: <strong>{title || 'None Specified'}</strong></div>
                <div>Requesting Party: <strong>{requestingParty || 'None Specified'}</strong></div>
                <div>Origin Office: <strong>{originOffice || 'None Specified'}</strong></div>
                <div>RA 11032 Target: <strong className="text-[#15803D]">3 Business Days</strong></div>
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!title.trim() || !requestingParty.trim() || !originOffice.trim())) {
                    alert('Please complete all required fields.');
                    return;
                  }
                  setStep((s) => (s + 1) as 1 | 2 | 3);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#081E36] hover:bg-[#0B2545] text-white rounded font-bold text-xs cursor-pointer"
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded font-bold text-xs cursor-pointer shadow"
              >
                Commit & Log to Municipal Registry
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
