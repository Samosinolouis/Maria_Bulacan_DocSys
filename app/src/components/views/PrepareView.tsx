'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowRight,
  Upload,
  Eye,
  Paperclip,
  ClipboardList,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/providers/ToastProvider';
import {
  useAnchoredMenu,
  useAttachmentService,
  useAsyncAction,
  useCan,
  useDocuments,
  useRequests,
} from '@/hooks';
import { DOCUMENT_STATUS_META, REQUEST_STATUS_META, resolveStatusMeta } from '@/lib/constants';
import Portal from '@/components/Portal';
import type { Connection, Document, Request } from '@/services/contracts/models';

/**
 * Document Preparation (Step 3).
 *
 * The page holds the two lists this desk works from: the requests the screening
 * step advanced to PREPARATION, and the drafts already authored. Both are data
 * hooks, so a completed use-case (screening, drafting, submitting, attaching)
 * re-reads them through the client cache and the page updates itself.
 */
export default function PrepareView() {
  const { documentTypes, prepareDocument, submitForReview, lastError } = useApp();
  const toast = useToast();

  const draftsQuery = useDocuments({
    first: 100,
    filter: { status: 'DRAFTING' },
    sort: { field: 'CREATED_AT', direction: 'DESC' },
  });

  const awaitingQuery = useRequests({
    first: 100,
    filter: { status: 'PREPARATION' },
    sort: { field: 'RECEIVED_AT', direction: 'ASC' },
  });

  const drafts = useMemo(
    () => (draftsQuery.data as Connection<Document> | null)?.edges.map((edge) => edge.node) ?? [],
    [draftsQuery.data],
  );

  const awaiting = useMemo(
    () => (awaitingQuery.data as Connection<Request> | null)?.edges.map((edge) => edge.node) ?? [],
    [awaitingQuery.data],
  );

  /** Requests that already have a draft in this queue (read off the drafts list). */
  const draftedRequestIds = useMemo(
    () => new Set(drafts.map((document) => document.requestId).filter(Boolean) as string[]),
    [drafts],
  );

  const [documentTypeId, setDocumentTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [requestId, setRequestId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const effectiveTypeId = documentTypeId || documentTypes[0]?.id || '';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveTypeId || !title.trim()) {
      setFormError('Select a document type and enter a document title.');
      return;
    }
    setIsCreating(true);
    setFormError(null);
    const created = await prepareDocument({
      documentTypeId: effectiveTypeId,
      title: title.trim(),
      requestId: requestId.trim() ? requestId.trim() : null,
    });
    setIsCreating(false);
    if (created) {
      setTitle('');
      setRequestId('');
      setSuccessMsg(`Draft ${created.controlNo} created and filed to the drafting queue.`);
      draftsQuery.refresh();
      awaitingQuery.refresh();
    } else {
      const message = lastError?.message ?? 'Unable to create the draft. Please try again.';
      setFormError(message);
      toast.error(message);
    }
  };

  const handleSubmitForReview = async (documentId: string) => {
    setSubmittingId(documentId);
    const result = await submitForReview(documentId);
    setSubmittingId(null);
    if (result) {
      setSuccessMsg(`Draft ${result.controlNo} submitted to the executive review queue.`);
      draftsQuery.refresh();
    }
  };

  /** Load a request that is awaiting preparation into the drafting form. */
  const draftForRequest = (request: Request) => {
    setRequestId(request.id);
    setTitle(request.title);
    if (!documentTypeId && documentTypes[0]) setDocumentTypeId(documentTypes[0].id);
    setFormError(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (draftsQuery.isLoading || awaitingQuery.isLoading) {
    return <LoadingPanel label="Loading drafting studio..." />;
  }

  const loadError = draftsQuery.error ?? awaitingQuery.error;
  if (loadError) {
    return (
      <ErrorPanel
        message={loadError.message}
        onRetry={() => {
          draftsQuery.refresh();
          awaitingQuery.refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fluid-tab">
      {/* Studio Header Bar */}
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] font-bold text-[#15803D] uppercase tracking-wider">
            CIVIL SERVICE DOCUMENT GENERATOR
          </span>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            OFFICIAL DOCUMENT DRAFTING STUDIO
          </h3>
          <p className="text-xs text-[#64748B]">
            Author executive resolutions, draft responses for incoming citizen requests, or create
            authenticated Santa Maria heraldic issuances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-[#081E36] bg-[#F1F5F9] border border-[#CBD5E1] px-3 py-1.5 rounded">
            {awaiting.length} AWAITING PREPARATION
          </span>
          <span className="font-mono text-[11px] font-bold text-[#081E36] bg-[#F1F5F9] border border-[#CBD5E1] px-3 py-1.5 rounded">
            {drafts.length} DRAFT{drafts.length === 1 ? '' : 'S'} IN QUEUE
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg text-xs text-[#166534] font-bold flex items-center gap-2 animate-fluid-fade">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {formError && (
        <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#334155] font-bold flex items-center gap-2 animate-fluid-fade">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      {/* Requests the screening step advanced to preparation (FR-15). */}
      <div className="bg-white rounded border border-[#CBD5E1] shadow-sm overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-3">
          <div>
            <h3 className="font-cinzel text-sm font-bold text-[#081E36] flex items-center gap-2">
              <ClipboardList size={15} className="text-[#15803D]" />
              REQUESTS AWAITING PREPARATION
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Screening passed for these requests. Prepare the responsive issuance, then submit it
              for executive review.
            </p>
          </div>
          <button
            onClick={() => awaitingQuery.refresh()}
            className="text-xs font-bold text-[#15803D] hover:underline cursor-pointer inline-flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw size={13} className={awaitingQuery.isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {awaiting.length === 0 ? (
          <div className="p-10 text-center text-[#64748B] text-xs space-y-1">
            <div className="font-bold text-sm text-[#081E36]">Nothing Awaiting Preparation</div>
            <p>Requests appear here once screening passes for them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="municipal-docket-table">
              <thead>
                <tr>
                  <th>Control No.</th>
                  <th>Request Type</th>
                  <th>Subject / Particulars</th>
                  <th>Requesting Party</th>
                  <th>SLA Deadline</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {awaiting.map((request) => {
                  const meta = resolveStatusMeta(REQUEST_STATUS_META, request.status);
                  const hasDraft = draftedRequestIds.has(request.id);
                  return (
                    <tr key={request.id}>
                      <td>
                        <span className="docket-control-badge font-mono">{request.controlNo}</span>
                      </td>
                      <td>
                        <span className="font-semibold text-xs text-[#334155]">
                          {request.requestType?.name ?? request.requestTypeId}
                        </span>
                      </td>
                      <td>
                        <div className="docket-title-cell max-w-md font-bold text-[#0F172A]">
                          {request.title}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-[#334155]">{request.requestingParty}</span>
                      </td>
                      <td>
                        <span className="font-mono text-[11px] text-[#334155] inline-flex items-center gap-1">
                          <Clock size={11} className="text-[#64748B]" />
                          {new Date(request.slaDeadline).toLocaleDateString('en-PH', {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${meta?.badgeCls || 'badge-preparation'}`}>
                          {meta?.label || request.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => draftForRequest(request)}
                          className="btn-fluid px-3 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1.5"
                          title={
                            hasDraft
                              ? 'A draft for this request is already in the drafting queue'
                              : 'Load this request into the drafting form'
                          }
                        >
                          <FileText size={12} />
                          <span>{hasDraft ? 'Draft Again' : 'Draft'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Document Form */}
      <div
        ref={formRef}
        className="bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm space-y-4"
      >
        <div className="border-b border-[#CBD5E1] pb-3">
          <span className="font-bold text-xs uppercase tracking-wider text-[#15803D]">
            New Document
          </span>
          <h4 className="font-cinzel text-sm font-bold text-[#081E36]">
            Prepare a New Executive Issuance
          </h4>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Document Type *
              </label>
              <select
                value={effectiveTypeId}
                onChange={(e) => setDocumentTypeId(e.target.value)}
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs bg-white font-semibold focus:outline-none focus:border-[#15803D]"
              >
                {documentTypes.length === 0 ? (
                  <option value="">No document types available</option>
                ) : (
                  documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.prefix})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Document Title / Subject Line *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Executive Order No. 2026-024: Reorganizing the Municipal Peace and Order Council"
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs font-semibold focus:outline-none focus:border-[#15803D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Linked Request
              </label>
              <select
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs bg-white focus:outline-none focus:border-[#15803D]"
              >
                <option value="">Standalone issuance (no linked request)</option>
                {awaiting.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.controlNo} - {request.title}
                  </option>
                ))}
                {requestId && !awaiting.some((request) => request.id === requestId) && (
                  <option value={requestId}>Selected request ({requestId})</option>
                )}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isCreating || documentTypes.length === 0}
                className="btn-fluid w-full px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>New Document</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Drafts Queue */}
      <div className="bg-white rounded border border-[#CBD5E1] shadow-sm overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-cinzel text-sm font-bold text-[#081E36]">
              DRAFTING QUEUE
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Documents under preparation, pending submission to the executive review desk.
            </p>
          </div>
          <button
            onClick={() => draftsQuery.refresh()}
            className="text-xs font-bold text-[#15803D] hover:underline cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={draftsQuery.isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {drafts.length === 0 ? (
          <div className="p-10 text-center text-[#64748B] text-xs space-y-1">
            <div className="font-bold text-sm text-[#081E36]">No Drafts in Preparation</div>
            <p>Create a new document above to start the drafting workflow.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="municipal-docket-table">
              <thead>
                <tr>
                  <th>Docket No.</th>
                  <th>Document Type</th>
                  <th>Subject / Particulars</th>
                  <th>Linked Request</th>
                  <th>Status</th>
                  <th>Draft File</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((document) => (
                  <DraftRow
                    key={document.id}
                    document={document}
                    isSubmitting={submittingId === document.id}
                    onSubmit={handleSubmitForReview}
                    onRefresh={draftsQuery.refresh}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DraftRow({
  document,
  isSubmitting,
  onSubmit,
  onRefresh,
}: {
  document: Document;
  isSubmitting: boolean;
  onSubmit: (documentId: string) => void;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const canSubmit = useCan('DocumentService:Prepare', {
    kind: 'document',
    attributes: { status: document.status },
  });
  const canUpload = useCan('AttachmentService:Upload');
  const { uploadDocumentAttachment, getDocumentAttachmentDownload } = useAttachmentService();
  const uploadAction = useAsyncAction(uploadDocumentAttachment);
  const [localError, setLocalError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  // Row action menu: portalled + anchored, so the docket table's overflow can
  // neither clip it nor grow to accommodate it (see useAnchoredMenu).
  const menuTriggerRef = useRef<HTMLDivElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const menu = useAnchoredMenu(menuTriggerRef, menuPanelRef);
  const statusMeta = resolveStatusMeta(DOCUMENT_STATUS_META, document.status);

  const draftAttachments = (document.attachments ?? []).filter(
    (attachment) => attachment.kind === 'DRAFT',
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    menu.close();
    if (!file) return;
    setLocalError(null);
    const uploaded = await uploadAction.run({ documentId: document.id, kind: 'DRAFT', file });
    if (uploaded) {
      toast.success(`Draft file attached to ${document.controlNo}.`);
      onRefresh();
    } else {
      const message = uploadAction.getError()?.message ?? 'Unable to upload the draft file.';
      setLocalError(message);
      toast.error(message);
    }
  };

  const handleView = async (attachmentId: string) => {
    setOpeningId(attachmentId);
    setLocalError(null);
    try {
      const ticket = await getDocumentAttachmentDownload(attachmentId, true);
      window.open(ticket.url, '_blank', 'noopener,noreferrer');
    } catch {
      const message = 'Unable to open the draft file.';
      setLocalError(message);
      toast.error(message);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <tr>
      <td>
        <span className="docket-control-badge font-mono">{document.controlNo}</span>
      </td>
      <td>
        <span className="font-semibold text-xs text-[#334155] inline-flex items-center gap-1.5">
          <FileText size={12} className="text-[#64748B]" />
          {document.documentType?.name ?? document.documentTypeId}
        </span>
      </td>
      <td>
        <div className="docket-title-cell max-w-md font-bold text-[#0F172A]">{document.title}</div>
      </td>
      <td>
        <span className="font-mono text-[11px] text-[#64748B]">
          {document.requestId ?? 'Standalone'}
        </span>
      </td>
      <td>
        <span className={`status-badge ${statusMeta?.badgeCls || 'badge-preparation'}`}>
          {statusMeta?.label || document.status}
        </span>
      </td>
      <td>
        <div className="space-y-1.5">
          <span className="font-mono text-[10px] font-bold text-[#64748B] inline-flex items-center gap-1">
            <Paperclip size={11} />
            {draftAttachments.length} DRAFT{draftAttachments.length === 1 ? '' : 'S'}
          </span>

          {draftAttachments.map((attachment) => (
            <button
              key={attachment.id}
              type="button"
              onClick={() => handleView(attachment.id)}
              disabled={openingId === attachment.id}
              className="btn-fluid flex items-center gap-1 text-[10px] font-semibold text-[#15803D] hover:underline cursor-pointer disabled:opacity-50"
              title={attachment.originalName}
            >
              {openingId === attachment.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Eye size={11} />
              )}
              <span className="truncate max-w-[10rem]">View {attachment.originalName}</span>
            </button>
          ))}

          {localError && (
            <div className="text-[10px] font-semibold text-[#334155]">{localError}</div>
          )}
        </div>
      </td>
      <td>
        <div className="relative inline-block" ref={menuTriggerRef}>
          <button
            type="button"
            onClick={menu.toggle}
            aria-label="Draft actions"
            aria-haspopup="menu"
            aria-expanded={menu.open}
            className="btn-fluid p-1.5 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#081E36] rounded cursor-pointer shadow-2xs"
          >
            {uploadAction.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MoreHorizontal size={16} />
            )}
          </button>
        </div>

        {menu.open && (
          <Portal>
            <div
              ref={menuPanelRef}
              role="menu"
              style={menu.style}
              className="w-56 bg-white border border-[#CBD5E1] rounded shadow-lg z-[90] py-1 text-left"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  menu.close();
                  onSubmit(document.id);
                }}
                disabled={!canSubmit || isSubmitting}
                title={
                  canSubmit
                    ? 'Submit this draft for executive review'
                    : 'Not permitted for this document'
                }
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ArrowRight size={13} className="text-[#15803D]" />
                )}
                <span>Submit for Review</span>
              </button>

              {canUpload && (
                <label
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                  title="Attach the authored draft file (PDF or image)"
                >
                  <Upload size={13} className="text-[#15803D]" />
                  <span>Attach draft file</span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    disabled={uploadAction.isPending}
                    onChange={handleUpload}
                  />
                </label>
              )}

              {draftAttachments.length > 0 && <div className="my-1 border-t border-[#E2E8F0]" />}

              {draftAttachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    menu.close();
                    void handleView(attachment.id);
                  }}
                  disabled={openingId === attachment.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F1F5F9] cursor-pointer disabled:opacity-50"
                  title={attachment.originalName}
                >
                  <Eye size={13} className="text-[#64748B]" />
                  <span className="truncate">View {attachment.originalName}</span>
                </button>
              ))}
            </div>
          </Portal>
        )}
      </td>
    </tr>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="bg-white p-10 rounded border border-[#CBD5E1] shadow-sm flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#081E36]" />
        <span className="text-xs font-bold text-[#081E36]">{label}</span>
      </div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="bg-white p-6 rounded border border-[#CBD5E1] shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[#081E36]">
          <AlertCircle size={18} />
          <span className="font-bold text-sm">Unable to Load the Drafting Studio</span>
        </div>
        <p className="text-xs text-[#475569] leading-relaxed">{message}</p>
        <button
          onClick={onRetry}
          className="btn-fluid px-3.5 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}
