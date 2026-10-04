'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  CheckCircle2,
  Printer,
  Calendar,
  AlertTriangle,
  Building,
  UserCheck,
  Send,
  Check,
  Ban,
  FileText,
  Eye,
  Download,
  Upload,
  Camera,
  Maximize2,
  FileCheck,
  Plus,
  Trash2,
  Paperclip,
  Link as LinkIcon,
} from 'lucide-react';
import { DocumentRecord, User, AuditEntry, DocumentStatus, Attachment } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_META } from '@/lib/data';
import { useApp } from '@/context/AppContext';
import DocumentScanner from '@/components/DocumentScanner';
import OfficialWordDocument from '@/components/OfficialWordDocument';

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface DocumentDetailModalProps {
  document: DocumentRecord;
  currentUser: User;
  auditLogs: AuditEntry[];
  onClose: () => void;
  onUpdateStatus: (docId: string, newStatus: DocumentStatus, note?: string) => void;
  onPrintRoutingSlip: (doc: DocumentRecord) => void;
}

export default function DocumentDetailModal({
  document: doc,
  currentUser,
  auditLogs,
  onClose,
  onUpdateStatus,
  onPrintRoutingSlip,
}: DocumentDetailModalProps) {
  const router = useRouter();
  const {
    handleAttachDocument,
    handleUpdateDocument,
    setWordPreviewDoc,
    setPrepareTargetDocId,
    documents,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'details' | 'scans' | 'preview' | 'audit'>('details');
  const [activeScanPageIndex, setActiveScanPageIndex] = useState(0);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);

  // Attachment Drawer & Scanner Sub-modal State
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachMode, setAttachMode] = useState<'upload' | 'scanner' | 'link'>('upload');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileLabel, setUploadFileLabel] = useState('');
  const [uploadFileDataUrl, setUploadFileDataUrl] = useState<string | null>(null);
  const [uploadFileSize, setUploadFileSize] = useState('');
  const [uploadFileType, setUploadFileType] = useState('');
  const [linkDocId, setLinkDocId] = useState('');
  const [attachSuccessMsg, setAttachSuccessMsg] = useState<string | null>(null);

  // Modals
  const [denialModalOpen, setDenialModalOpen] = useState(false);
  const [denialReasonText, setDenialReasonText] = useState('');
  const [transmitModalOpen, setTransmitModalOpen] = useState(false);
  const [transmitRecipient, setTransmitRecipient] = useState('');
  const [transmitOffice, setTransmitOffice] = useState('');
  const [transmitProofUrl, setTransmitProofUrl] = useState<string | null>(null);

  const typeMeta = DOCUMENT_TYPE_LABELS[doc.type] || { label: doc.type, color: '#15803D' };
  const statusMeta = DOCUMENT_STATUS_META[doc.status] || {
    label: doc.status,
    stepNumber: 1,
    badgeCls: 'badge-received',
    description: '',
  };
  const role = currentUser.role;

  const docAuditLogs = auditLogs.filter((log) => log.documentId === doc.id);

  // All available scanned pages (either from scannedPages array or scannedFileUrl)
  const scannedPagesList =
    doc.scannedPages && doc.scannedPages.length > 0
      ? doc.scannedPages
      : doc.scannedFileUrl
      ? [doc.scannedFileUrl]
      : [];

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadFileName(file.name);
    setUploadFileSize(formatBytes(file.size));
    setUploadFileType(file.type || 'application/octet-stream');
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadFileDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUploadAttachment = () => {
    if (!uploadFileDataUrl) return;
    const displayName = uploadFileLabel.trim()
      ? `${uploadFileLabel.trim()} (${uploadFileName})`
      : uploadFileName;
    const newAttachment: Attachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fileName: displayName,
      fileSize: uploadFileSize || 'Verified',
      fileType: uploadFileType,
      uploadedBy: currentUser.fullName,
      uploadedAt: new Date().toISOString(),
      fileDataUrl: uploadFileDataUrl,
    };
    handleAttachDocument(doc.id, newAttachment);
    setAttachSuccessMsg(`Attached "${displayName}" to docket.`);
    setTimeout(() => setAttachSuccessMsg(null), 3000);
    setUploadFile(null);
    setUploadFileName('');
    setUploadFileLabel('');
    setUploadFileDataUrl(null);
    setAttachModalOpen(false);
  };

  const handleScannerAnnexesComplete = (pages: string[], scannerAttachments: Attachment[]) => {
    if (pages.length > 0) {
      pages.forEach((pageDataUrl, idx) => {
        const newAttachment: Attachment = {
          id: `att-scan-${Date.now()}-${idx}`,
          fileName: `Scanned_Annex_Sheet_${(doc.attachments?.length || 0) + idx + 1}.jpg`,
          fileSize: 'High Resolution Scan',
          fileType: 'image/jpeg',
          uploadedBy: currentUser.fullName,
          uploadedAt: new Date().toISOString(),
          fileDataUrl: pageDataUrl,
        };
        handleAttachDocument(doc.id, newAttachment);
      });

      const updatedScanned = [...(doc.scannedPages || []), ...pages];
      handleUpdateDocument({
        ...doc,
        scannedPages: updatedScanned,
      });

      setAttachSuccessMsg(`Added ${pages.length} scanned page(s) as verified annexes.`);
      setTimeout(() => setAttachSuccessMsg(null), 3000);
      setAttachModalOpen(false);
    }
  };

  const handleLinkExistingDocket = () => {
    if (!linkDocId) return;
    const target = documents.find((d) => d.id === linkDocId || d.controlNumber === linkDocId);
    if (!target) return;
    const linkAttachment: Attachment = {
      id: `att-link-${Date.now()}`,
      fileName: `Referenced Docket: ${target.controlNumber} - ${target.title}`,
      fileSize: 'Registry Cross-Reference',
      fileType: 'application/docket-reference',
      uploadedBy: currentUser.fullName,
      uploadedAt: new Date().toISOString(),
      fileDataUrl: target.scannedFileUrl || undefined,
    };
    handleAttachDocument(doc.id, linkAttachment);
    setAttachSuccessMsg(`Linked reference docket ${target.controlNumber}.`);
    setTimeout(() => setAttachSuccessMsg(null), 3000);
    setLinkDocId('');
    setAttachModalOpen(false);
  };

  const handleDeleteAttachment = (attId: string) => {
    if (!confirm('Are you sure you want to remove this attached record from the official docket?')) return;
    const remaining = (doc.attachments || []).filter((a) => a.id !== attId);
    handleUpdateDocument({
      ...doc,
      attachments: remaining,
    });
  };

  const handleDraftInStudio = () => {
    setPrepareTargetDocId(doc.id);
    onClose();
    router.push('/prepare');
  };

  const handleApprove = () => {
    onUpdateStatus(
      doc.id,
      'APPROVED',
      `Approved by ${currentUser.fullName} (${currentUser.title})`
    );
  };

  const handleEndorse = () => {
    onUpdateStatus(
      doc.id,
      'ENDORSED',
      `Endorsed to Sangguniang Bayan / Concerned Office by ${currentUser.fullName} (${currentUser.title})`
    );
  };

  const handleDenySubmit = () => {
    if (!denialReasonText.trim()) return;
    onUpdateStatus(
      doc.id,
      'DENIED',
      `Formally returned / denied by ${currentUser.fullName}. Grounds: ${denialReasonText}`
    );
    setDenialModalOpen(false);
  };

  const handleTransmitSubmit = () => {
    if (!transmitRecipient.trim()) return;
    onUpdateStatus(
      doc.id,
      'TRANSMITTED',
      `Dispatched to ${transmitRecipient} (${transmitOffice || 'Receiving Department'}) by ${currentUser.fullName}`
    );
    setTransmitModalOpen(false);
  };

  const handleScreenPass = () => {
    onUpdateStatus(
      doc.id,
      'PREPARATION',
      `Screening checklist passed. Docket forwarded for drafting by ${currentUser.fullName}`
    );
  };

  const handleCloseAndArchive = () => {
    onUpdateStatus(
      doc.id,
      'CLOSED',
      `Transaction officially fulfilled and archived into permanent records by ${currentUser.fullName}`
    );
  };

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTransmitProofUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 bg-[#081E36]/75 z-50 flex items-center justify-center p-4 animate-fluid-fade"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-[#081E36] overflow-hidden animate-fluid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#081E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#15803D]">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: typeMeta.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#FCD116]">
                  {doc.controlNumber}
                </span>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">
                  {typeMeta.label}
                </span>
              </div>
              <h2 className="font-cinzel text-base font-bold text-white line-clamp-1">
                {doc.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Workflow Progress Stepper (6 Official Steps per project_brief.md) */}
        <div className="bg-[#F8FAFC] border-b border-[#CBD5E1] px-6 py-3 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[560px] text-[11px] font-bold text-[#64748B]">
            {[
              { num: 1, key: 'RECEIVED', label: '1. Reception' },
              { num: 2, key: 'SCREENING', label: '2. Screening' },
              { num: 3, key: 'PREPARATION', label: '3. Preparation' },
              { num: 4, key: 'REVIEW', label: '4. Review / Approval' },
              { num: 5, key: 'TRANSMITTED', label: '5. Transmission' },
              { num: 6, key: 'CLOSED', label: '6. Archiving' },
            ].map((step, idx) => {
              const isCurrent = statusMeta.stepNumber === step.num;
              const isDone = statusMeta.stepNumber > step.num || doc.status === 'CLOSED';
              return (
                <React.Fragment key={step.num}>
                  <div
                    className={`flex items-center gap-1.5 ${
                      isCurrent
                        ? 'text-[#15803D]'
                        : isDone
                        ? 'text-[#081E36]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        isCurrent
                          ? 'bg-[#15803D] text-white font-bold'
                          : isDone
                          ? 'bg-[#081E36] text-white'
                          : 'border border-[#CBD5E1]'
                      }`}
                    >
                      {step.num}
                    </span>
                    <span>{step.label}</span>
                  </div>
                  {idx < 5 && <span className="text-[#CBD5E1]">&gt;</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#CBD5E1] bg-[#F1F5F9] px-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-4 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'details'
                ? 'border-[#15803D] text-[#15803D] bg-white'
                : 'border-transparent text-[#64748B] hover:text-[#081E36]'
            }`}
          >
            Docket Overview & Annexes ({doc.attachments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`py-2.5 px-4 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'scans'
                ? 'border-[#15803D] text-[#15803D] bg-white'
                : 'border-transparent text-[#64748B] hover:text-[#081E36]'
            }`}
          >
            Scanned Dossier ({scannedPagesList.length})
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2.5 px-4 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'preview'
                ? 'border-[#15803D] text-[#15803D] bg-white'
                : 'border-transparent text-[#64748B] hover:text-[#081E36]'
            }`}
          >
            Word Document Preview & Print
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 px-4 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'audit'
                ? 'border-[#15803D] text-[#15803D] bg-white'
                : 'border-transparent text-[#64748B] hover:text-[#081E36]'
            }`}
          >
            Audit Trail ({docAuditLogs.length})
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Details & Annexes */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Core Metadata Table Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Requesting Signatory
                  </span>
                  <span className="font-semibold text-[#0F172A]">{doc.requestingParty}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Originating Office
                  </span>
                  <span className="font-semibold text-[#0F172A]">{doc.originOffice}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Current Status
                  </span>
                  <span className="font-bold text-[#081E36]">{statusMeta.label}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Date Received (Logbook)
                  </span>
                  <span className="font-mono text-[#0F172A]">
                    {new Date(doc.dateReceived).toLocaleString('en-PH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Mandated 3-Day SLA Deadline
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      doc.isOverdue ? 'text-[#991B1B]' : 'text-[#15803D]'
                    }`}
                  >
                    {new Date(doc.slaDeadline).toLocaleString('en-PH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    {doc.isOverdue && '(OVERDUE)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Assigned Officer
                  </span>
                  <span className="font-semibold text-[#0F172A]">
                    {doc.assignedTo || 'Unassigned (General Queue)'}
                  </span>
                </div>
              </div>

              {/* Endorsement Notes or Formal Denial Grounds */}
              {doc.denialReason && (
                <div className="p-3 bg-[#F8FAFC] border-l-4 border-[#334155] rounded text-[#0F172A] text-xs">
                  <strong className="block text-[11px] uppercase text-[#081E36]">
                    Statutory Denial / Return Grounds:
                  </strong>
                  <p className="mt-1 text-[#334155]">{doc.denialReason}</p>
                </div>
              )}

              {doc.endorsementNotes && (
                <div className="p-3 bg-[#F0FDF4] border-l-4 border-[#15803D] rounded text-[#166534] text-xs">
                  <strong className="block text-[11px] uppercase">
                    Executive Endorsement Directives:
                  </strong>
                  <p className="mt-1">{doc.endorsementNotes}</p>
                </div>
              )}

              {/* Physical Transmittal Details (If Dispatched) */}
              {doc.transmissionDetails && (
                <div className="p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-[#0369A1] uppercase text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Send size={14} />
                      Outgoing Dispatch & Transmittal Record
                    </span>
                    <span className="font-mono text-[#0284C7]">
                      {new Date(doc.transmissionDetails.transmittedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#0F172A]">
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Recipient Signatory:</span>
                      <strong>{doc.transmissionDetails.recipientName}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Receiving Department:</span>
                      <strong>{doc.transmissionDetails.transmittedToOffice}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Physical Receiving Officer:</span>
                      <span>{doc.transmissionDetails.receivedBy}</span>
                    </div>
                    {doc.transmissionDetails.proofDataUrl && (
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Signed Receipt Proof:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setViewingAttachment({
                              id: 'trans-proof',
                              fileName: 'Signed_Transmittal_Receipt.jpg',
                              fileSize: 'Verified',
                              fileType: 'image/jpeg',
                              uploadedBy: 'Dispatch Officer',
                              uploadedAt: doc.transmissionDetails!.transmittedDate,
                              fileDataUrl: doc.transmissionDetails!.proofDataUrl,
                            })
                          }
                          className="text-[#0284C7] hover:underline font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View Signed Delivery Receipt</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Real Attached Records & Scans */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold uppercase text-[11px] text-[#081E36] tracking-wide">
                      Verified Digital Annexes & Uploaded Records ({doc.attachments?.length || 0})
                    </h4>
                    <span className="text-[10px] text-[#64748B]">
                      Official supporting documents, citizen letters, and evidentiary annexes.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachMode('upload');
                      setAttachModalOpen(true);
                    }}
                    className="btn-fluid px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Attach Document / Scan</span>
                  </button>
                </div>

                {attachSuccessMsg && (
                  <div className="p-2.5 bg-[#F0FDF4] border border-[#86EFAC] rounded text-xs text-[#166534] font-bold flex items-center gap-2 animate-fluid-fade">
                    <CheckCircle2 size={15} />
                    <span>{attachSuccessMsg}</span>
                  </div>
                )}

                {doc.attachments && doc.attachments.length > 0 ? (
                  <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0] bg-white text-xs">
                    {doc.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={18} className="text-[#081E36] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-[#0F172A] truncate">
                              {att.fileName}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              Uploaded by {att.uploadedBy} - {att.fileSize} -{' '}
                              {new Date(att.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {att.fileDataUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingAttachment(att)}
                              className="btn-fluid px-2.5 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1 shadow-sm"
                            >
                              <Eye size={13} />
                              <span>View File</span>
                            </button>
                          )}
                          {att.fileDataUrl && (
                            <a
                              href={att.fileDataUrl}
                              download={att.fileName}
                              className="btn-fluid p-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#081E36] rounded cursor-pointer"
                              title="Download to Local Workstation"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="btn-fluid p-1.5 border border-[#CBD5E1] hover:bg-[#FEE2E2] hover:text-[#991B1B] text-[#64748B] rounded cursor-pointer"
                            title="Remove attached document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center space-y-2">
                    <Paperclip size={28} className="mx-auto text-[#94A3B8]" />
                    <div className="font-bold text-xs text-[#081E36]">No Supporting Documents Attached Yet</div>
                    <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                      Attach citizen petitions, Sangguniang resolutions, endorsement letters, or capture physical documents via camera scan.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachMode('upload');
                        setAttachModalOpen(true);
                      }}
                      className="btn-fluid px-3.5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm mt-1"
                    >
                      <Plus size={14} />
                      <span>Attach Document or Camera Scan</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Real Scanned Dossier (Multi-Page Camera/Feeder Scans) */}
          {activeTab === 'scans' && (
            <div className="space-y-4">
              {scannedPagesList.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#081E36] uppercase tracking-wide flex items-center gap-2">
                      <FileCheck size={16} className="text-[#15803D]" />
                      <span>
                        Digitized Physical Document (Page {activeScanPageIndex + 1} of{' '}
                        {scannedPagesList.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {scannedPagesList.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveScanPageIndex(idx)}
                          className={`w-6 h-6 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                            activeScanPageIndex === idx
                              ? 'bg-[#15803D] text-white'
                              : 'bg-[#E2E8F0] text-[#334155] hover:bg-[#CBD5E1]'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scanned Page Viewport */}
                  <div className="border border-[#CBD5E1] rounded-lg p-2 bg-[#F1F5F9] flex items-center justify-center min-h-[420px] max-h-[580px] overflow-hidden">
                    {scannedPagesList[activeScanPageIndex].startsWith('data:application/pdf') ? (
                      <iframe
                        src={scannedPagesList[activeScanPageIndex]}
                        title="Scanned PDF Page"
                        className="w-full h-[520px] border-0 rounded bg-white"
                      />
                    ) : (
                      <img
                        src={scannedPagesList[activeScanPageIndex]}
                        alt={`Scanned Page ${activeScanPageIndex + 1}`}
                        className="max-h-[520px] w-auto object-contain rounded shadow"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Control Number: {doc.controlNumber}</span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#081E36] rounded font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Print Scanned Page</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-3">
                  <Camera size={36} className="mx-auto text-[#94A3B8]" />
                  <div className="font-bold text-sm text-[#081E36]">No Physical Scans Found</div>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    This document was intaked electronically without physical page scans attached. You can scan and attach physical paper pages using your camera or feeder.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachMode('scanner');
                      setAttachModalOpen(true);
                    }}
                    className="btn-fluid px-3.5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Camera size={14} />
                    <span>Scan Physical Pages via Camera</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Microsoft Word Executive Document Preview & Print */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between no-print bg-[#F1F5F9] p-3 rounded-lg border border-[#CBD5E1] gap-2">
                <div>
                  <h4 className="font-bold text-xs text-[#081E36] uppercase tracking-wide">
                    Microsoft Word Executive Issuance Layout
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Formatted according to National Government Standards with dual heraldic seals, double header rule, justified provisions, and official signatory block.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDraftInStudio}
                    className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] hover:bg-white text-[#081E36] rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileText size={13} />
                    <span>Edit in Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordPreviewDoc(doc)}
                    className="btn-fluid px-3.5 py-1.5 bg-[#FCD116] hover:bg-[#FACC15] text-[#081E36] rounded text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer size={13} />
                    <span>Print Word Document</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto p-2 sm:p-4 bg-[#E2E8F0] rounded-lg">
                <OfficialWordDocument document={doc} showToolbar={false} />
              </div>
            </div>
          )}

          {/* TAB 4: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="font-bold uppercase text-[11px] text-[#081E36]">
                Immutable Statutory Audit Trail (RA 10175 Compliance)
              </h4>
              <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0] bg-white">
                {docAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs">
                    <div className="flex items-center justify-between text-[#64748B] text-[10px] mb-1">
                      <span className="font-bold text-[#081E36]">{log.action}</span>
                      <span className="font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="font-semibold text-[#0F172A]">
                      {log.userName} ({log.userRole})
                    </div>
                    <p className="text-[#334155] mt-0.5">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operational Footer Bar with Direct Actions */}
        <div className="bg-[#F8FAFC] border-t border-[#CBD5E1] px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPrintRoutingSlip(doc)}
              className="btn-fluid flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#081E36] rounded text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              title="Print 1-Page Official Transmittal & ARTA Routing Slip"
            >
              <Printer size={13} className="text-[#64748B]" />
              <span>Routing Slip</span>
            </button>
            <button
              onClick={() => setWordPreviewDoc(doc)}
              className="btn-fluid flex items-center gap-1.5 px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              title="Print Document formatted in authentic Microsoft Word layout"
            >
              <Printer size={13} className="text-[#FCD116]" />
              <span>Word Print</span>
            </button>
            <button
              onClick={handleDraftInStudio}
              className="btn-fluid flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] hover:text-[#081E36] rounded text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              title="Draft or edit official Executive Order or Indorsement for this docket"
            >
              <FileText size={13} className="text-[#64748B]" />
              <span>Draft in Studio</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Step 2 Screening Pass */}
            {doc.status === 'SCREENING' && (role === 'CLERK_ENCODER' || role === 'ADMINISTRATOR') && (
              <button
                onClick={handleScreenPass}
                className="btn-fluid px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow-sm"
              >
                Pass Screening & Forward to Drafting
              </button>
            )}

            {/* Administrator / EA II Review Decisions */}
            {(role === 'ADMINISTRATOR' || role === 'EXECUTIVE_ASSISTANT') &&
              (doc.status === 'REVIEW' || doc.status === 'SCREENING') && (
                <>
                  <button
                    onClick={() => setDenialModalOpen(true)}
                    className="btn-fluid flex items-center gap-1 px-3 py-1.5 bg-[#334155] hover:bg-[#1E293B] text-white rounded text-xs font-bold cursor-pointer"
                  >
                    <Ban size={14} />
                    <span>Return / Deny</span>
                  </button>
                  <button
                    onClick={handleEndorse}
                    className="btn-fluid flex items-center gap-1 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded text-xs font-bold cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Endorse to SB</span>
                  </button>
                  <button
                    onClick={handleApprove}
                    className="btn-fluid flex items-center gap-1 px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow-sm"
                  >
                    <Check size={14} />
                    <span>Approve Request</span>
                  </button>
                </>
              )}

            {/* Step 5: Outgoing Transmission */}
            {doc.status === 'APPROVED' && (
              <button
                onClick={() => setTransmitModalOpen(true)}
                className="btn-fluid flex items-center gap-1 px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-bold cursor-pointer shadow-sm"
              >
                <Send size={14} />
                <span>Transmit Outgoing Record</span>
              </button>
            )}

            {/* Step 6: Final Archival */}
            {doc.status === 'TRANSMITTED' && (
              <button
                onClick={handleCloseAndArchive}
                className="btn-fluid px-3 py-1.5 bg-[#475569] hover:bg-[#334155] text-white rounded text-xs font-bold cursor-pointer shadow-sm"
              >
                Close & Archive Docket
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real Full Attachment Viewer Modal */}
      {viewingAttachment && (
        <div
          className="fixed inset-0 bg-black/85 z-70 flex items-center justify-center p-4 animate-fluid-fade"
          onClick={() => setViewingAttachment(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#081E36] text-white px-5 py-3 flex items-center justify-between text-xs font-bold border-b border-[#15803D]">
              <div className="flex items-center gap-2 truncate">
                <FileText size={16} />
                <span className="truncate">{viewingAttachment.fileName}</span>
                <span className="text-[10px] text-[#CBD5E1]">({viewingAttachment.fileSize})</span>
              </div>
              <div className="flex items-center gap-2">
                {viewingAttachment.fileDataUrl && (
                  <a
                    href={viewingAttachment.fileDataUrl}
                    download={viewingAttachment.fileName}
                    className="p-1 text-white/80 hover:text-white"
                    title="Download File"
                  >
                    <Download size={16} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingAttachment(null)}
                  className="text-white/80 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-[#F1F5F9] min-h-[400px]">
              {viewingAttachment.fileDataUrl?.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewingAttachment.fileDataUrl}
                  title={viewingAttachment.fileName}
                  className="w-full h-[650px] border-0 rounded bg-white shadow"
                />
              ) : viewingAttachment.fileDataUrl?.startsWith('data:image/') ? (
                <img
                  src={viewingAttachment.fileDataUrl}
                  alt={viewingAttachment.fileName}
                  className="max-h-[80vh] w-auto object-contain rounded shadow"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText size={48} className="mx-auto text-[#081E36]" />
                  <div className="text-sm font-bold text-[#0F172A]">{viewingAttachment.fileName}</div>
                  <p className="text-xs text-[#64748B]">
                    File type ({viewingAttachment.fileType}) can be downloaded for local inspection.
                  </p>
                  {viewingAttachment.fileDataUrl && (
                    <a
                      href={viewingAttachment.fileDataUrl}
                      download={viewingAttachment.fileName}
                      className="btn-fluid px-4 py-2 bg-[#081E36] text-white rounded text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      <span>Download File</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formal Return / Denial Grounds Sub-modal */}
      {denialModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-[#334155]">
            <h3 className="font-bold text-sm text-[#0F172A] mb-2 uppercase">
              Formal Administrative Return or Denial
            </h3>
            <p className="text-xs text-[#64748B] mb-3">
              Per RA 11032 statutory rules, specify the clear legal or procedural reason for returning or rejecting this document.
            </p>
            <textarea
              value={denialReasonText}
              onChange={(e) => setDenialReasonText(e.target.value)}
              placeholder="e.g. Returned for lack of signed endorsement from the Municipal Budget Officer."
              rows={4}
              className="w-full p-2.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#334155] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDenialModalOpen(false)}
                className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDenySubmit}
                className="btn-fluid px-3.5 py-1.5 bg-[#334155] hover:bg-[#1E293B] text-white rounded text-xs font-bold cursor-pointer"
              >
                Submit Formal Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Transmission Recipient Sub-modal with Real Proof Upload */}
      {transmitModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-[#0284C7]">
            <h3 className="font-bold text-sm text-[#0369A1] mb-2 uppercase">
              Outgoing Transmittal Record (Step 5)
            </h3>
            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  value={transmitRecipient}
                  onChange={(e) => setTransmitRecipient(e.target.value)}
                  placeholder="e.g. Engr. Roberto Santos"
                  className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0284C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Receiving Office / Agency *
                </label>
                <input
                  type="text"
                  value={transmitOffice}
                  onChange={(e) => setTransmitOffice(e.target.value)}
                  placeholder="e.g. Municipal Engineering Office"
                  className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Upload Signed Delivery Receipt / Proof Photo
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleProofFileUpload}
                  className="w-full text-xs text-[#64748B] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#0284C7] file:text-white hover:file:bg-[#0369A1] cursor-pointer"
                />
                {transmitProofUrl && (
                  <div className="mt-1 text-[10px] text-[#15803D] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Proof of delivery document attached successfully</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTransmitModalOpen(false)}
                className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTransmitSubmit}
                className="btn-fluid px-3.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-bold cursor-pointer"
              >
                Log Physical Transmittal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Attachment & Scanner Drawer Sub-Modal */}
      {attachModalOpen && (
        <div
          className="fixed inset-0 bg-[#081E36]/80 z-60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fluid-fade"
          onClick={() => setAttachModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#081E36] overflow-hidden animate-fluid-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sub-modal Header */}
            <div className="bg-[#081E36] text-white px-5 py-3 flex items-center justify-between border-b-2 border-[#15803D]">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-[#FCD116] block">
                  Official Record Annexation
                </span>
                <h3 className="font-cinzel text-sm font-bold text-white">
                  Attach Documents, Scans, or Annexes to {doc.controlNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAttachModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-[#CBD5E1] bg-[#F1F5F9] px-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAttachMode('upload')}
                className={`py-2 px-3 border-b-2 cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                  attachMode === 'upload'
                    ? 'border-[#15803D] text-[#15803D] bg-white'
                    : 'border-transparent text-[#64748B] hover:text-[#081E36]'
                }`}
              >
                <Upload size={13} />
                <span>Upload File (Computer / Feeder)</span>
              </button>
              <button
                type="button"
                onClick={() => setAttachMode('scanner')}
                className={`py-2 px-3 border-b-2 cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                  attachMode === 'scanner'
                    ? 'border-[#15803D] text-[#15803D] bg-white'
                    : 'border-transparent text-[#64748B] hover:text-[#081E36]'
                }`}
              >
                <Camera size={13} />
                <span>Camera / Hardware Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => setAttachMode('link')}
                className={`py-2 px-3 border-b-2 cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                  attachMode === 'link'
                    ? 'border-[#15803D] text-[#15803D] bg-white'
                    : 'border-transparent text-[#64748B] hover:text-[#081E36]'
                }`}
              >
                <LinkIcon size={13} />
                <span>Cross-Reference Docket</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* MODE 1: FILE UPLOAD */}
              {attachMode === 'upload' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                      Select File to Attach (PDF, Word DOCX/DOC, Images) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileSelected}
                      className="w-full text-xs text-[#081E36] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#081E36] file:text-white hover:file:bg-[#0B2545] cursor-pointer border border-[#CBD5E1] rounded p-1.5 bg-[#F8FAFC]"
                    />
                  </div>

                  {uploadFileName && (
                    <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded flex items-center justify-between text-xs animate-fluid-fade">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#15803D]" />
                        <div>
                          <strong className="text-[#166534] block">{uploadFileName}</strong>
                          <span className="text-[10px] text-[#15803D]">
                            Size: {uploadFileSize} | Ready for official docket annexation
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded border border-[#86EFAC]">
                        Selected
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                      Official Annex Description / Document Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={uploadFileLabel}
                      onChange={(e) => setUploadFileLabel(e.target.value)}
                      placeholder="e.g. Annex A - Certified Barangay Council Resolution"
                      className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D]"
                    />
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">
                      Helps executive reviewers immediately identify the attached record in the docket.
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAttachModalOpen(false)}
                      className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveUploadAttachment}
                      disabled={!uploadFileDataUrl}
                      className={`btn-fluid px-4 py-1.5 rounded text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 ${
                        uploadFileDataUrl
                          ? 'bg-[#15803D] hover:bg-[#166534] cursor-pointer'
                          : 'bg-[#94A3B8] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Plus size={14} />
                      <span>Save and Attach to Docket</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: CAMERA / HARDWARE SCANNER */}
              {attachMode === 'scanner' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-[#64748B]">
                    Use your workstation camera or hardware scanner to digitize paper receipts, wet signatures, or citizen petitions directly into this docket.
                  </p>
                  <DocumentScanner
                    currentUserFullName={currentUser.fullName}
                    onScanComplete={handleScannerAnnexesComplete}
                  />
                </div>
              )}

              {/* MODE 3: CROSS-REFERENCE DOCKET */}
              {attachMode === 'link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                      Select Existing Docket to Cross-Reference *
                    </label>
                    <select
                      value={linkDocId}
                      onChange={(e) => setLinkDocId(e.target.value)}
                      className="w-full p-2.5 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D] text-xs bg-white"
                    >
                      <option value="">-- Choose an official docket from registry --</option>
                      {documents
                        .filter((d) => d.id !== doc.id)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.controlNumber} - {d.title} ({d.requestingParty})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#64748B] text-[11px] leading-relaxed">
                    Cross-referencing attaches a formal reference link between this document and an existing docket in the municipal archives without duplicating physical storage.
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAttachModalOpen(false)}
                      className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleLinkExistingDocket}
                      disabled={!linkDocId}
                      className={`btn-fluid px-4 py-1.5 rounded text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 ${
                        linkDocId
                          ? 'bg-[#081E36] hover:bg-[#0B2545] cursor-pointer'
                          : 'bg-[#94A3B8] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <LinkIcon size={14} />
                      <span>Link as Reference Annex</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
