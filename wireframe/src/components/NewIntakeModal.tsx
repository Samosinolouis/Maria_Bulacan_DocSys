'use client';

import { useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { DocumentRecord, DocumentType, DocumentCategory, User } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS } from '@/lib/data';

interface NewIntakeModalProps {
  currentUser: User;
  onClose: () => void;
  onSubmit: (newDoc: DocumentRecord) => void;
}

export default function NewIntakeModal({ currentUser, onClose, onSubmit }: NewIntakeModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [docType, setDocType] = useState<DocumentType>('INCOMING');
  const [category, setCategory] = useState<DocumentCategory>('OTHER');
  const [title, setTitle] = useState('');
  const [requestingParty, setRequestingParty] = useState('');
  const [originOffice, setOriginOffice] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');

  const [checkAttachments, setCheckAttachments] = useState(true);
  const [checkAddressed, setCheckAddressed] = useState(true);
  const [checkSignatures, setCheckSignatures] = useState(true);

  const prefix = DOCUMENT_TYPE_LABELS[docType]?.prefix || 'IN';
  const controlNo = `${prefix}-2026-0${Math.floor(100 + Math.random() * 900)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      controlNumber: controlNo,
      type: docType,
      category,
      title: title || '[ Untitled Statutory Record ]',
      requestingParty: requestingParty || '[ Requesting Party Placeholder ]',
      originOffice: originOffice || '[ Origin Department Placeholder ]',
      dateReceived: new Date().toISOString(),
      assignedTo: null,
      status: 'SCREENING',
      scannedFileUrl: null,
      priority,
      slaDeadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      isOverdue: false,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: [
        {
          id: 'att-1',
          fileName: 'Official_Transmittal_Letter.pdf',
          fileSize: '1.2 MB',
          fileType: 'application/pdf',
          uploadedBy: currentUser.fullName,
          uploadedAt: new Date().toISOString(),
        },
      ],
    };
    onSubmit(newDoc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white border-2 border-[#0F172A] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-[#94A3B8] bg-[#F1F5F9] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#64748B] uppercase">
              [ OFFICIAL MUNICIPAL INTAKE &bull; WIREFRAME DRAFT ]
            </div>
            <h3 className="font-mono text-sm font-bold text-[#0F172A]">
              [ INTAKE FORM &bull; STEP {step} OF 3 ]
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 border border-[#0F172A] bg-white rounded flex items-center justify-center text-xs hover:bg-[#F1F5F9]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 border border-dashed border-[#94A3B8] bg-[#F8FAFC] rounded">
                <span className="font-mono text-[10px] text-[#64748B] block">[ SYSTEM GENERATED CONTROL NUMBER ]</span>
                <span className="font-mono text-base font-bold text-[#0F172A]">[{controlNo}]</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">[ Document Type ]</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
                  >
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>[{label.label}]</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">[ Statutory Category ]</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
                  >
                    {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>[{label}]</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">[ Subject Matter / Title ]</label>
                <input
                  type="text"
                  placeholder="[ e.g., Request for Barangay Road Rehabilitation Certification ]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">[ Requesting Party ]</label>
                  <input
                    type="text"
                    placeholder="[ e.g., Hon. Juan dela Cruz ]"
                    value={requestingParty}
                    onChange={(e) => setRequestingParty(e.target.value)}
                    className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">[ Origin Office / Barangay ]</label>
                  <input
                    type="text"
                    placeholder="[ e.g., Barangay Bagbaguin Council ]"
                    value={originOffice}
                    onChange={(e) => setOriginOffice(e.target.value)}
                    className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-[#94A3B8] bg-[#F8FAFC] rounded text-center space-y-2">
                <div className="font-mono text-xs font-bold text-[#0F172A]">[ SCANNER & DOCUMENT UPLOADER ]</div>
                <p className="text-[11px] text-[#64748B]">
                  [ Connect TWAIN/WIA Municipal Flatbed Scanner or Drag & Drop PDF Dossier ]
                </p>
                <div className="pt-2">
                  <span className="wf-btn text-xs">[ + Browse Files ]</span>
                </div>
              </div>

              <div className="p-3 border border-[#CBD5E1] rounded space-y-2">
                <div className="font-bold text-[#0F172A]">[ Attached Files (1) ]</div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded font-mono text-[11px]">
                  <span>[ Transmittal_Letter_Official.pdf ]</span>
                  <span className="text-[#64748B]">[ 1.2 MB &bull; READY ]</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#94A3B8] rounded">
                <div className="font-mono text-xs font-bold text-[#0F172A]">[ MANDATORY COMPLETENESS CHECKLIST ]</div>
                <div className="text-[11px] text-[#64748B]">[ Verify RA 11032 statutory reception criteria prior to logging ]</div>
              </div>

              <div className="space-y-2 p-3 border border-[#CBD5E1] rounded">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkAttachments}
                    onChange={(e) => setCheckAttachments(e.target.checked)}
                  />
                  <span>[ All required attachments and resolutions are complete ]</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkAddressed}
                    onChange={(e) => setCheckAddressed(e.target.checked)}
                  />
                  <span>[ Properly addressed to Office of the Municipal Administrator ]</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkSignatures}
                    onChange={(e) => setCheckSignatures(e.target.checked)}
                  />
                  <span>[ Authorized original signatures and official seals affixed ]</span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#CBD5E1] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="wf-btn wf-btn-secondary"
              >
                <ArrowLeft size={12} className="mr-1" /> [ Back ]
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="wf-btn wf-btn-secondary"
              >
                [ Cancel ]
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="wf-btn"
              >
                [ Next ] <ArrowRight size={12} className="ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                className="wf-btn"
              >
                [ Log Into Municipal Docket ]
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
