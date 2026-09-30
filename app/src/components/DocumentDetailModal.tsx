'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { DocumentRecord, User, AuditEntry, DocumentStatus } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_META } from '@/lib/data';

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
  const [activeTab, setActiveTab] = useState<'details' | 'preview' | 'audit'>('details');
  const [denialModalOpen, setDenialModalOpen] = useState(false);
  const [denialReasonText, setDenialReasonText] = useState('');
  const [transmitModalOpen, setTransmitModalOpen] = useState(false);
  const [transmitRecipient, setTransmitRecipient] = useState('');
  const [transmitOffice, setTransmitOffice] = useState('');

  const typeMeta = DOCUMENT_TYPE_LABELS[doc.type] || { label: doc.type, color: '#15803D' };
  const statusMeta = DOCUMENT_STATUS_META[doc.status];
  const role = currentUser.role;

  const docAuditLogs = auditLogs.filter((log) => log.documentId === doc.id);

  // 6 Workflow Steps
  const STEPS = [
    { num: 1, key: 'RECEIVED', label: '1. Reception' },
    { num: 2, key: 'SCREENING', label: '2. Screening' },
    { num: 3, key: 'PREPARATION', label: '3. Preparation' },
    { num: 4, key: 'REVIEW', label: '4. Review / Approval' },
    { num: 5, key: 'TRANSMITTED', label: '5. Transmission' },
    { num: 6, key: 'CLOSED', label: '6. Archiving' },
  ];

  const currentStepNum = statusMeta.stepNumber;

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
      `Endorsed by ${currentUser.fullName} (${currentUser.title}) to relevant authorities`
    );
  };

  const handleDenySubmit = () => {
    if (!denialReasonText.trim()) return;
    onUpdateStatus(
      doc.id,
      'DENIED',
      `Denied by ${currentUser.fullName}. Reason: ${denialReasonText}`
    );
    setDenialModalOpen(false);
  };

  const handleTransmitSubmit = () => {
    if (!transmitRecipient.trim()) return;
    onUpdateStatus(
      doc.id,
      'TRANSMITTED',
      `Transmitted to ${transmitRecipient} (${transmitOffice || 'Receiving Office'}) by ${currentUser.fullName}`
    );
    setTransmitModalOpen(false);
  };

  const handleScreenPass = () => {
    onUpdateStatus(
      doc.id,
      'PREPARATION',
      `Screening passed. Forwarded to Officer for document preparation by ${currentUser.fullName}`
    );
  };

  const handleCloseAndArchive = () => {
    onUpdateStatus(
      doc.id,
      'CLOSED',
      `Transaction completed, final records digitized and archived by ${currentUser.fullName}`
    );
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
        {/* Formal Institutional Header */}
        <div className="bg-[#081E36] text-white px-6 py-4 flex items-start justify-between border-b-2 border-[#15803D]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#15803D] text-white rounded">
                {doc.controlNumber}
              </span>
              <span className="text-xs font-semibold text-[#CBD5E1]">
                {typeMeta.label}
              </span>
              <span className={`status-badge ${statusMeta.badgeCls}`}>
                {statusMeta.label}
              </span>
              {doc.priority === 'URGENT' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#0B2545] border border-white/20 text-white rounded">
                  URGENT SLA
                </span>
              )}
            </div>
            <h2 className="font-serif-docket text-lg md:text-xl font-bold text-white leading-snug">
              {doc.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-[#CBD5E1] hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* 6-Step Statutory Lifecycle Tracker */}
        <div className="bg-[#F8FAFC] px-6 py-3 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between relative">
            {STEPS.map((step) => {
              const isPast = currentStepNum > step.num || doc.status === 'CLOSED';
              const isCurrent = currentStepNum === step.num && doc.status !== 'CLOSED';
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPast
                        ? 'bg-[#15803D] text-white'
                        : isCurrent
                        ? 'bg-[#081E36] text-[#86EFAC] ring-2 ring-[#15803D]'
                        : 'bg-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {isPast ? <CheckCircle2 size={16} /> : step.num}
                  </div>
                  <span
                    className={`text-[10px] mt-1 text-center font-medium ${
                      isCurrent ? 'font-bold text-[#081E36]' : 'text-[#64748B]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] bg-white px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer ${
              activeTab === 'details'
                ? 'border-[#15803D] text-[#15803D]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Dossier Particulars
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-[#15803D] text-[#15803D]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Official Letterhead Preview
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-[#15803D] text-[#15803D]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Statutory Audit Trail ({docAuditLogs.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white text-xs">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Essential Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Requesting Party
                  </span>
                  <span className="font-semibold text-sm text-[#0F172A]">
                    {doc.requestingParty}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Originating Department / Office
                  </span>
                  <span className="font-semibold text-sm text-[#0F172A]">
                    {doc.originOffice}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Date Received at Reception
                  </span>
                  <span className="font-mono text-xs text-[#0F172A]">
                    {new Date(doc.dateReceived).toLocaleString('en-PH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    RA 11032 Statutory SLA Deadline
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      doc.isOverdue ? 'text-[#081E36]' : 'text-[#15803D]'
                    }`}
                  >
                    {new Date(doc.slaDeadline).toLocaleString('en-PH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    {doc.isOverdue && '(OVERDUE)'}
                  </span>
                </div>
              </div>

              {/* Endorsement Notes or Denial Ground */}
              {doc.denialReason && (
                <div className="p-3 bg-[#F1F5F9] border-l-4 border-[#081E36] rounded text-[#0F172A]">
                  <strong className="block text-[11px] uppercase">
                    Statutory Denial / Return Grounds:
                  </strong>
                  <p className="mt-1">{doc.denialReason}</p>
                </div>
              )}

              {doc.endorsementNotes && (
                <div className="p-3 bg-[#F0FDF4] border-l-4 border-[#15803D] rounded text-[#166534]">
                  <strong className="block text-[11px] uppercase">
                    Executive Endorsement Directives:
                  </strong>
                  <p className="mt-1">{doc.endorsementNotes}</p>
                </div>
              )}

              {/* Attached Scans */}
              <div>
                <h4 className="font-bold uppercase text-[11px] text-[#081E36] mb-2">
                  Digitized Physical Records & Attachments
                </h4>
                {doc.attachments && doc.attachments.length > 0 ? (
                  <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0]">
                    {doc.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 flex items-center justify-between hover:bg-[#F8FAFC]"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-[#081E36]" />
                          <div>
                            <div className="font-semibold text-xs text-[#0F172A]">{att.fileName}</div>
                            <div className="text-[10px] text-[#64748B]">
                              Uploaded by {att.uploadedBy} - {att.fileSize}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#15803D]">
                          VERIFIED DIGITIZED
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#64748B] italic">No digital attachments uploaded.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-6 bg-[#FAFAF9] border border-[#CBD5E1] rounded font-serif-docket shadow-inner">
              <div className="text-center border-b-2 border-black pb-4 mb-4">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#15803D]">
                  Republic of the Philippines - Province of Bulacan
                </div>
                <div className="font-cinzel text-lg font-bold text-[#081E36]">
                  MUNICIPALITY OF SANTA MARIA
                </div>
                <div className="text-xs font-bold text-[#0F172A]">
                  OFFICE OF THE MUNICIPAL ADMINISTRATOR
                </div>
              </div>

              <div className="my-4 font-mono text-[11px] space-y-1">
                <div>CONTROL NO.: {doc.controlNumber}</div>
                <div>DATE: {new Date(doc.dateReceived).toLocaleDateString()}</div>
                <div>SUBJECT: {doc.title}</div>
              </div>

              <div className="p-4 bg-white border border-[#E2E8F0] rounded whitespace-pre-wrap leading-relaxed">
                {doc.draftContent ||
                  'No draft response generated yet. Officer assigned will prepare draft order or endorsement.'}
              </div>

              <div className="mt-8 flex justify-end">
                <div className="text-center w-64 border-t border-black pt-2">
                  <div className="font-bold text-xs">ENGR. ELMER B. CLEMENTE</div>
                  <div className="text-[11px] text-[#64748B]">Municipal Administrator</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="font-bold uppercase text-[11px] text-[#081E36]">
                Immutable Statutory Audit Trail
              </h4>
              <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0]">
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
        <div className="bg-[#F8FAFC] border-t border-[#CBD5E1] px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => onPrintRoutingSlip(doc)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer"
          >
            <Printer size={14} />
            <span>Routing Slip</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Reception Screen Pass */}
            {doc.status === 'SCREENING' && (role === 'CLERK_ENCODER' || role === 'ADMINISTRATOR') && (
              <button
                onClick={handleScreenPass}
                className="px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer"
              >
                Pass Screening and Forward to Drafting
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
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded text-xs font-bold cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Endorse to SB</span>
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Approve Request</span>
                  </button>
                </>
              )}

            {/* Outgoing Transmission */}
            {doc.status === 'APPROVED' && (
              <button
                onClick={() => setTransmitModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-bold cursor-pointer"
              >
                <Send size={14} />
                <span>Transmit Outgoing</span>
              </button>
            )}

            {/* Final Archival */}
            {doc.status === 'TRANSMITTED' && (
              <button
                onClick={handleCloseAndArchive}
                className="px-3 py-1.5 bg-[#475569] hover:bg-[#334155] text-white rounded text-xs font-bold cursor-pointer"
              >
                Close and Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Denial Reason Prompt Sub-modal */}
      {denialModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 animate-fluid-fade">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-[#334155] animate-fluid-modal">
            <h3 className="font-bold text-sm text-[#0F172A] mb-2 uppercase">
              Document Return / Denial Grounds
            </h3>
            <p className="text-xs text-[#64748B] mb-3">
              Section 21 of Republic Act 11032 requires explicit written grounds for any returned or
              disapproved request.
            </p>
            <textarea
              value={denialReasonText}
              onChange={(e) => setDenialReasonText(e.target.value)}
              placeholder="State statutory legal or procedural deficiencies..."
              rows={4}
              className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded mb-3 focus:outline-none focus:border-[#081E36]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDenialModalOpen(false)}
                className="px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDenySubmit}
                className="btn-fluid px-3 py-1.5 bg-[#334155] hover:bg-[#1E293B] text-white rounded text-xs font-bold cursor-pointer"
              >
                Confirm Denial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transmission Recipient Sub-modal */}
      {transmitModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-[#0284C7]">
            <h3 className="font-bold text-sm text-[#0369A1] mb-2 uppercase">
              Outgoing Transmittal Record
            </h3>
            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Recipient Full Name
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
                  Receiving Office / Agency
                </label>
                <input
                  type="text"
                  value={transmitOffice}
                  onChange={(e) => setTransmitOffice(e.target.value)}
                  placeholder="e.g. Municipal Engineering Office"
                  className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTransmitModalOpen(false)}
                className="px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTransmitSubmit}
                className="px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-bold cursor-pointer"
              >
                Log Transmittal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
