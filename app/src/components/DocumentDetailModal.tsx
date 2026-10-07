'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Send,
  Check,
  Ban,
  FileText,
  Download,
  Paperclip,
  Loader2,
  PenLine,
  Archive,
  Eye,
  Upload,
  FolderOpen,
} from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/providers/ToastProvider';
import {
  useAsyncAction,
  useAttachmentService,
  useCan,
  useFolderService,
  useRequest,
} from '@/hooks';
import {
  REQUEST_STATUS_META,
  REQUEST_CHANNEL_LABELS,
  REQUEST_PRIORITY_LABELS,
  DOCUMENT_STATUS_META,
  DOCUMENT_LOG_ACTION_LABELS,
  resolveStatusMeta,
} from '@/lib/constants';
import { renderTemplate } from '@/lib/template';
import type {
  Document,
  Request,
  ReviewDecision,
  TransmissionMethod,
} from '@/services/contracts/models';
import type { Folder } from '@/services/contracts/report';

interface DocumentDetailModalProps {
  request: Request;
  onClose: () => void;
}

/**
 * Workflow progress steps. Step 6 is the filing act (close & archive); step 7 is
 * the concluded state a request reaches once it is filed, so a closed dossier
 * reads as Closed rather than still Archiving.
 */
const WORKFLOW_STEPS = [
  { num: 1, label: '1. Reception' },
  { num: 2, label: '2. Screening' },
  { num: 3, label: '3. Preparation' },
  { num: 4, label: '4. Review / Approval' },
  { num: 5, label: '5. Transmission' },
  { num: 6, label: '6. Archiving' },
  { num: 7, label: '7. Closed' },
] as const;

/**
 * Request stages at or past the transmission desk. The Step 4 decision actions
 * (return, endorse, approve, sign) belong to the review desk only, so they must
 * not be offered on a transmitted or closed dossier.
 */
const PAST_REVIEW_STATUSES: ReadonlySet<string> = new Set(['TRANSMITTED', 'CLOSED']);

/** Full request dossier with its linked documents, annexes and audit trail. */
export default function DocumentDetailModal({ request, onClose }: DocumentDetailModalProps) {
  const {
    currentUser,
    reviewDocument,
    signDocument,
    transmitDocument,
    closeRequest,
    refreshCounts,
    setRoutingSlipRequest,
    setWordPreviewRequest,
    lastError,
  } = useApp();
  const toast = useToast();

  // The modal fetches its own fresh detail so mutations can refresh in place.
  const { data: detail, refresh } = useRequest(request.id);
  const dossier = detail ?? request;
  const documents = dossier.documents ?? [];
  const attachments = dossier.attachments ?? [];
  const logs = dossier.logs ?? [];

  const [activeTab, setActiveTab] = useState<'dossier' | 'attachments' | 'audit'>('dossier');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id ?? null);
  const [busy, setBusy] = useState(false);

  const [denialOpen, setDenialOpen] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  const [transmitOpen, setTransmitOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [receivingOffice, setReceivingOffice] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [method, setMethod] = useState<TransmissionMethod>('PICKUP');

  const {
    getRequestAttachmentDownload,
    getDocumentAttachmentDownload,
    uploadDocumentAttachment,
  } = useAttachmentService();
  const { list: listFolders } = useFolderService();
  const loadFoldersAction = useAsyncAction(listFolders);
  const uploadFinalAction = useAsyncAction(uploadDocumentAttachment);
  const canUpload = useCan('AttachmentService:Upload');

  // Step 6 close flow state.
  const [closeOpen, setCloseOpen] = useState(false);
  const [finalAttachmentId, setFinalAttachmentId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closeError, setCloseError] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);

  const selectedDoc: Document | null =
    documents.find((d) => d.id === selectedDocId) ?? documents[0] ?? null;

  const documentAttachmentRows = documents.flatMap((doc) =>
    (doc.attachments ?? []).map((att) => ({ att, doc })),
  );
  const existingSignedFinal =
    documentAttachmentRows.find((row) => row.att.kind === 'SIGNED_FINAL') ?? null;

  const requestMeta = resolveStatusMeta(REQUEST_STATUS_META, dossier.status);
  const priorityLabel = REQUEST_PRIORITY_LABELS[dossier.priority] ?? dossier.priority;
  const channelLabel = REQUEST_CHANNEL_LABELS[dossier.channel] ?? dossier.channel;
  // Capture "now" asynchronously (keeps the render pure); drives the SLA flag.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);
  const overdue =
    dossier.status !== 'CLOSED' &&
    now !== null &&
    new Date(dossier.slaDeadline).getTime() < now;

  const canReview = useCan(
    'DocumentService:Review',
    selectedDoc ? { kind: 'document', attributes: { status: selectedDoc.status } } : null,
  );
  const canSign = useCan(
    'DocumentService:Sign',
    selectedDoc
      ? {
          kind: 'document',
          attributes: {
            status: selectedDoc.status,
            signatoryRequired: selectedDoc.signatoryRequired,
          },
        }
      : null,
  );
  const canTransmit = useCan(
    'DocumentService:Transmit',
    selectedDoc ? { kind: 'document', attributes: { status: selectedDoc.status } } : null,
  );
  const canClose = useCan('DocumentService:Close', {
    kind: 'request',
    attributes: { status: dossier.status },
  });

  // Step 4 decision actions belong to the review desk. A transmitted or closed
  // request is past it, so return / endorse / approve / sign must not be offered
  // (a closed request is read-only, FR-31). Transmission is offered per document
  // and only until that document has a transmission recorded.
  const pastReview = PAST_REVIEW_STATUSES.has(dossier.status);
  const documentTransmitted = (selectedDoc?.transmissions?.length ?? 0) > 0;

  const runReview = async (decision: ReviewDecision, reason?: string) => {
    if (!selectedDoc) return;
    setBusy(true);
    const result = await reviewDocument({
      documentId: selectedDoc.id,
      decision,
      denialReason: decision === 'DENIED' ? reason ?? null : null,
      decisionNotes: null,
    });
    setBusy(false);
    if (result) {
      setDenialOpen(false);
      setDenialReason('');
      refresh();
    }
  };

  const runSign = async () => {
    if (!selectedDoc) return;
    setBusy(true);
    const result = await signDocument({
      documentId: selectedDoc.id,
      signedBy: currentUser.fullName,
    });
    setBusy(false);
    if (result) refresh();
  };

  const runTransmit = async () => {
    if (!selectedDoc) return;
    if (!recipientName.trim() || !receivingOffice.trim() || !receivedBy.trim()) return;
    setBusy(true);
    const result = await transmitDocument({
      documentId: selectedDoc.id,
      recipientName: recipientName.trim(),
      receivingOffice: receivingOffice.trim(),
      receivedBy: receivedBy.trim(),
      method,
    });
    setBusy(false);
    if (result) {
      setTransmitOpen(false);
      setRecipientName('');
      setReceivingOffice('');
      setReceivedBy('');
      refresh();
    }
  };

  const openClosePanel = () => {
    setCloseError(null);
    setFinalAttachmentId(null);
    setFolderId('');
    setCloseNotes('');
    setCloseOpen(true);
    void loadFoldersAction.run(null).then((loaded) => setFolders(loaded ?? []));
  };

  const handleSignedFinalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (!selectedDoc) {
      setCloseError('No linked document is available to attach the signed final copy.');
      return;
    }
    setCloseError(null);
    const uploaded = await uploadFinalAction.run({
      documentId: selectedDoc.id,
      kind: 'SIGNED_FINAL',
      file,
    });
    if (uploaded) {
      setFinalAttachmentId(uploaded.id);
      toast.success(`Signed final copy of ${selectedDoc.controlNo} attached.`);
    } else {
      const message = uploadFinalAction.getError()?.message ?? 'Unable to upload the signed final copy.';
      setCloseError(message);
      toast.error(message);
    }
  };

  const runClose = async () => {
    const effectiveFinalId = finalAttachmentId ?? existingSignedFinal?.att.id ?? null;
    if (!effectiveFinalId) {
      setCloseError(
        'A signed final copy is required before closing this request. Upload it above, then close.',
      );
      return;
    }
    setBusy(true);
    setCloseError(null);
    const result = await closeRequest({
      requestId: dossier.id,
      finalAttachmentId: effectiveFinalId,
      folderId: folderId ? folderId : null,
      notes: closeNotes.trim() ? closeNotes.trim() : null,
    });
    setBusy(false);
    if (result) {
      setCloseOpen(false);
      refresh();
      refreshCounts();
    } else {
      setCloseError(lastError?.message ?? 'The request could not be closed. Please try again.');
    }
  };

  const openRequestAttachment = async (id: string, inline: boolean) => {
    try {
      const ticket = await getRequestAttachmentDownload(id, inline);
      window.open(ticket.url, '_blank', 'noopener,noreferrer');
    } catch {
      // The service normalizes failures; nothing more to do here.
    }
  };

  const openDocumentAttachment = async (id: string, inline: boolean) => {
    try {
      const ticket = await getDocumentAttachmentDownload(id, inline);
      window.open(ticket.url, '_blank', 'noopener,noreferrer');
    } catch {
      // The service normalizes failures; nothing more to do here.
    }
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

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
            <span className="w-3 h-3 rounded-full shrink-0 bg-[#15803D]" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#FCD116]">
                  {dossier.controlNo}
                </span>
                <span className={`status-badge ${requestMeta.badgeCls}`}>{requestMeta.label}</span>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">
                  {priorityLabel} Priority
                </span>
              </div>
              <h2 className="font-cinzel text-base font-bold text-white line-clamp-1">
                {dossier.title}
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

        {/* Workflow Progress Stepper */}
        <div className="bg-[#F8FAFC] border-b border-[#CBD5E1] px-6 py-3 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[660px] text-[11px] font-bold text-[#64748B]">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isCurrent = requestMeta.stepNumber === step.num;
              const isDone = requestMeta.stepNumber > step.num || dossier.status === 'CLOSED';
              return (
                <React.Fragment key={step.num}>
                  <div
                    className={`flex items-center gap-1.5 ${
                      isCurrent ? 'text-[#15803D]' : isDone ? 'text-[#081E36]' : 'text-[#94A3B8]'
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
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <span className="text-[#CBD5E1]">&gt;</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#CBD5E1] bg-[#F1F5F9] px-6 text-xs font-bold overflow-x-auto">
          {(
            [
              { id: 'dossier', label: `Request Dossier (${documents.length})` },
              { id: 'attachments', label: `Annexes (${attachments.length + documentAttachmentRows.length})` },
              { id: 'audit', label: `Audit Trail (${logs.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#15803D] text-[#15803D] bg-white'
                  : 'border-transparent text-[#64748B] hover:text-[#081E36]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {lastError && (
            <div className="p-3 bg-[#F1F5F9] border border-[#334155] rounded text-xs text-[#0F172A] font-semibold">
              {lastError.message}
            </div>
          )}

          {activeTab === 'dossier' && (
            <div className="space-y-6">
              {/* Request Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Requesting Party
                  </span>
                  <span className="font-semibold text-[#0F172A]">{dossier.requestingParty}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Originating Office
                  </span>
                  <span className="font-semibold text-[#0F172A]">{dossier.originOffice}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Channel
                  </span>
                  <span className="font-semibold text-[#0F172A]">{channelLabel}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Date Received (Logbook)
                  </span>
                  <span className="font-mono text-[#0F172A]">
                    {formatDateTime(dossier.receivedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Mandated 3-Day SLA Deadline
                  </span>
                  <span className={`font-mono font-bold ${overdue ? 'text-[#334155]' : 'text-[#15803D]'}`}>
                    {formatDateTime(dossier.slaDeadline)} {overdue && '(OVERDUE)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Current Status
                  </span>
                  <span className="font-bold text-[#081E36]">{requestMeta.label}</span>
                </div>
              </div>

              {/* Linked Documents */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase text-[11px] text-[#081E36] tracking-wide">
                  Linked Issuances & Documents ({documents.length})
                </h4>

                {documents.length === 0 ? (
                  <div className="p-6 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center space-y-2">
                    <FileText size={28} className="mx-auto text-[#94A3B8]" />
                    <div className="font-bold text-xs text-[#081E36]">No Documents Linked Yet</div>
                    <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                      This request has no output documents on record. Draft one in the preparation
                      studio and submit it for executive review.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0] bg-white text-xs">
                    {documents.map((doc) => {
                      const isSelected = selectedDoc?.id === doc.id;
                      const docMeta = resolveStatusMeta(DOCUMENT_STATUS_META, doc.status);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`w-full text-left p-3 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#F0FDF4]' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText size={18} className="text-[#081E36] shrink-0" />
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-[#0F172A] truncate">
                                {doc.title}
                              </div>
                              <div className="text-[10px] text-[#64748B] font-mono">
                                {doc.controlNo}
                                {doc.assignedTo ? ` - Drafter: ${doc.assignedTo}` : ''}
                                {doc.signatoryRequired ? ' - Signature required' : ''}
                              </div>
                            </div>
                          </div>
                          <span className={`status-badge ${docMeta.badgeCls} shrink-0`}>
                            {docMeta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedDoc && (selectedDoc.denialReason || selectedDoc.decisionNotes || selectedDoc.signedBy) && (
                  <div className="p-3 bg-[#F8FAFC] border-l-4 border-[#334155] rounded text-[#0F172A] text-xs space-y-1">
                    {selectedDoc.denialReason && (
                      <div>
                        <strong className="block text-[11px] uppercase text-[#081E36]">
                          Denial / Return Grounds:
                        </strong>
                        <p className="mt-0.5 text-[#334155]">{selectedDoc.denialReason}</p>
                      </div>
                    )}
                    {selectedDoc.decisionNotes && (
                      <div>
                        <strong className="block text-[11px] uppercase text-[#081E36]">
                          Decision Notes:
                        </strong>
                        <p className="mt-0.5 text-[#334155]">{selectedDoc.decisionNotes}</p>
                      </div>
                    )}
                    {selectedDoc.signedBy && (
                      <div className="text-[11px] text-[#475569]">
                        Signed by <strong>{selectedDoc.signedBy}</strong>
                        {selectedDoc.signedAt ? ` on ${formatDateTime(selectedDoc.signedAt)}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              {/* Request annexes */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase text-[11px] text-[#081E36] tracking-wide">
                  Verified Digital Annexes & Uploaded Records ({attachments.length})
                </h4>

                {attachments.length === 0 ? (
                  <div className="p-6 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center space-y-2">
                    <Paperclip size={28} className="mx-auto text-[#94A3B8]" />
                    <div className="font-bold text-xs text-[#081E36]">No Supporting Documents Attached</div>
                    <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                      Annexes are uploaded at intake from the reception desk.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0] bg-white text-xs">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Paperclip size={16} className="text-[#081E36] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-[#0F172A] truncate">
                              {att.originalName}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              {att.kind} - {att.mimeType} - {att.uploadedBy}
                              {att.createdAt ? ` - ${new Date(att.createdAt).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openRequestAttachment(att.id, true)}
                            className="btn-fluid px-2.5 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1 shadow-sm"
                          >
                            <Eye size={13} />
                            <span>View File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openRequestAttachment(att.id, false)}
                            className="btn-fluid p-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#081E36] rounded cursor-pointer"
                            title="Download to Local Workstation"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document attachments (drafts, signed finals, transmission proofs) */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase text-[11px] text-[#081E36] tracking-wide">
                  Document Attachments ({documentAttachmentRows.length})
                </h4>

                {documentAttachmentRows.length === 0 ? (
                  <div className="p-6 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center space-y-2">
                    <Paperclip size={28} className="mx-auto text-[#94A3B8]" />
                    <div className="font-bold text-xs text-[#081E36]">No Document Attachments</div>
                    <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                      Drafts, signed final copies, and transmission proofs appear here once uploaded.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0] bg-white text-xs">
                    {documentAttachmentRows.map(({ att, doc }) => (
                      <div
                        key={att.id}
                        className="p-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={16} className="text-[#081E36] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-[#0F172A] truncate">
                              {att.originalName}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              {att.kind} - {doc.controlNo} - {att.mimeType}
                              {att.createdAt ? ` - ${new Date(att.createdAt).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openDocumentAttachment(att.id, true)}
                            className="btn-fluid px-2.5 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1 shadow-sm"
                          >
                            <Eye size={13} />
                            <span>View File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocumentAttachment(att.id, false)}
                            className="btn-fluid p-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#081E36] rounded cursor-pointer"
                            title="Download to Local Workstation"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="font-bold uppercase text-[11px] text-[#081E36]">
                Immutable Statutory Audit Trail (RA 10175 Compliance)
              </h4>
              {logs.length === 0 ? (
                <div className="p-6 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-center text-xs text-[#64748B]">
                  No audit entries recorded yet.
                </div>
              ) : (
                <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0] bg-white">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 text-xs">
                      <div className="flex items-center justify-between text-[#64748B] text-[10px] mb-1">
                        <span className="font-bold text-[#081E36]">
                          {DOCUMENT_LOG_ACTION_LABELS[log.actionType] ?? log.actionType}
                        </span>
                        <span className="font-mono">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                      <div className="font-semibold text-[#0F172A]">
                        {log.actorName} ({log.actorRole})
                      </div>
                      <p className="text-[#334155] mt-0.5">
                        {renderTemplate(log.template, log.payload)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Operational Footer Bar */}
        <div className="bg-[#F8FAFC] border-t border-[#CBD5E1] px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRoutingSlipRequest(dossier)}
              className="btn-fluid flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#081E36] rounded text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              title="Print 1-Page Official Transmittal & ARTA Routing Slip"
            >
              <Printer size={13} className="text-[#64748B]" />
              <span>Routing Slip</span>
            </button>
            <button
              onClick={() => setWordPreviewRequest(dossier)}
              className="btn-fluid flex items-center gap-1.5 px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              title="Print Document formatted in authentic Microsoft Word layout"
            >
              <Printer size={13} className="text-[#FCD116]" />
              <span>Word Print</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedDoc && canReview && !pastReview && (
              <>
                <button
                  onClick={() => setDenialOpen(true)}
                  disabled={busy}
                  className="btn-fluid flex items-center gap-1 px-3 py-1.5 bg-[#334155] hover:bg-[#1E293B] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  <Ban size={14} />
                  <span>Return / Deny</span>
                </button>
                <button
                  onClick={() => runReview('ENDORSED')}
                  disabled={busy}
                  className="btn-fluid flex items-center gap-1 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>Endorse to SB</span>
                </button>
                <button
                  onClick={() => runReview('APPROVED')}
                  disabled={busy}
                  className="btn-fluid flex items-center gap-1 px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>Approve</span>
                </button>
              </>
            )}

            {selectedDoc && canSign && !pastReview && (
              <button
                onClick={runSign}
                disabled={busy}
                className="btn-fluid flex items-center gap-1 px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow-sm disabled:opacity-50"
              >
                <PenLine size={14} />
                <span>Record Signature</span>
              </button>
            )}

            {selectedDoc && canTransmit && !documentTransmitted && dossier.status !== 'CLOSED' && (
              <button
                onClick={() => setTransmitOpen(true)}
                disabled={busy}
                className="btn-fluid flex items-center gap-1 px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-bold cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Send size={14} />
                <span>Transmit Outgoing Record</span>
              </button>
            )}

            {canClose && dossier.status !== 'CLOSED' && (
              <button
                onClick={openClosePanel}
                disabled={busy}
                className="btn-fluid flex items-center gap-1 px-3 py-1.5 bg-[#475569] hover:bg-[#334155] text-white rounded text-xs font-bold cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Archive size={14} />
                <span>Close & Archive Request</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formal Return / Denial Grounds */}
      {denialOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-[#334155]">
            <h3 className="font-bold text-sm text-[#0F172A] mb-2 uppercase">
              Formal Administrative Return or Denial
            </h3>
            <p className="text-xs text-[#64748B] mb-3">
              Per RA 11032 statutory rules, specify the clear legal or procedural reason for
              returning or rejecting this document.
            </p>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="e.g. Returned for lack of signed endorsement from the Municipal Budget Officer."
              rows={4}
              className="w-full p-2.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#334155] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDenialOpen(false)}
                className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => runReview('DENIED', denialReason)}
                disabled={busy || !denialReason.trim()}
                className="btn-fluid px-3.5 py-1.5 bg-[#334155] hover:bg-[#1E293B] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Submit Formal Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Transmission */}
      {transmitOpen && (
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
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
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
                  value={receivingOffice}
                  onChange={(e) => setReceivingOffice(e.target.value)}
                  placeholder="e.g. Municipal Engineering Office"
                  className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0284C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Receiving Officer (Physical) *
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="e.g. Ms. Ana Reyes"
                  className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0284C7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Transmission Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as TransmissionMethod)}
                  className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0284C7] bg-white"
                >
                  <option value="PICKUP">Pick-up</option>
                  <option value="COURIER">Courier</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTransmitOpen(false)}
                className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={runTransmit}
                disabled={busy || !recipientName.trim() || !receivingOffice.trim() || !receivedBy.trim()}
                className="btn-fluid px-3.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Log Physical Transmittal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Close & Archive */}
      {closeOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-[#475569]">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen size={16} className="text-[#081E36]" />
              <h3 className="font-bold text-sm text-[#0F172A] uppercase">
                Close & Archive Request (Step 6)
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mb-4">
              Upload the signed final copy and file the request into the archive. Closing marks the
              dossier read-only.
            </p>

            {closeError && (
              <div className="p-3 mb-4 bg-[#F1F5F9] border border-[#334155] rounded text-xs text-[#0F172A] font-semibold">
                {closeError}
              </div>
            )}

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Signed final copy (SIGNED_FINAL) *
                </label>
                {existingSignedFinal && (
                  <div className="mb-1.5 text-[10px] text-[#15803D] font-semibold inline-flex items-center gap-1">
                    <Paperclip size={11} />
                    <span className="truncate max-w-[16rem]">
                      On file: {existingSignedFinal.att.originalName} ({existingSignedFinal.doc.controlNo})
                    </span>
                  </div>
                )}
                {finalAttachmentId && (
                  <div className="mb-1.5 text-[10px] text-[#15803D] font-semibold inline-flex items-center gap-1">
                    <Paperclip size={11} />
                    <span>New signed final copy uploaded and ready to file.</span>
                  </div>
                )}
                {canUpload ? (
                  <label
                    className="btn-fluid inline-flex items-center gap-1 px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-[11px] font-semibold cursor-pointer shadow-xs transition-colors"
                    title="Upload the signed final copy (PDF or image)"
                  >
                    {uploadFinalAction.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    <span>Upload signed final copy</span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      disabled={uploadFinalAction.isPending}
                      onChange={handleSignedFinalFile}
                    />
                  </label>
                ) : (
                  <span className="text-[10px] font-semibold text-[#64748B]">
                    Upload not permitted for your account.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Archive folder
                </label>
                {loadFoldersAction.isPending ? (
                  <div className="text-[10px] text-[#64748B] inline-flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" />
                    <span>Loading archive folders...</span>
                  </div>
                ) : (
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#475569] bg-white text-[#0F172A]"
                  >
                    <option value="">Unfiled (archive root)</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.path}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Closing notes (optional)
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Concluded; signed final copy filed for permanent retention."
                  className="w-full p-2.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#475569]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCloseOpen(false)}
                className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={runClose}
                disabled={busy}
                className="btn-fluid px-3.5 py-1.5 bg-[#475569] hover:bg-[#334155] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                <span>Close & Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
