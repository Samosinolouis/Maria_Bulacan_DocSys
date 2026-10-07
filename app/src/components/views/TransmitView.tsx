'use client';

import React, { useMemo, useState } from 'react';
import { Search, X, Loader2, RotateCcw, Send, Upload, Paperclip } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/providers/ToastProvider';
import { useAttachmentService, useAsyncAction, useCan, useDispatchQueue } from '@/hooks';
import { DOCUMENT_STATUS_META, resolveStatusMeta } from '@/lib/constants';
import HighlightMatch from '@/components/HighlightMatch';
import Portal from '@/components/Portal';
import type { Document, TransmissionMethod } from '@/services/contracts';

/** Shared loading panel for the transmission desk. */
function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="bg-white p-8 rounded border border-[#CBD5E1] shadow-sm flex items-center justify-center gap-2 text-xs text-[#64748B]">
      <Loader2 size={16} className="animate-spin text-[#94A3B8]" />
      <span>{label}</span>
    </div>
  );
}

/** Shared error panel with a retry affordance. */
function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-3 bg-white border border-[#334155] rounded text-xs text-[#0F172A] font-semibold flex items-center justify-between gap-2">
      <span className="flex items-start gap-2">
        <X size={14} className="text-[#334155] shrink-0 mt-0.5" />
        <span>{message}</span>
      </span>
      <button
        onClick={onRetry}
        className="btn-fluid px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1 shrink-0"
      >
        <RotateCcw size={12} />
        <span>Retry</span>
      </button>
    </div>
  );
}

/** One dispatch row; owns its per-resource transmit grant. */
function TransmitRow({
  document,
  searchQuery,
  onOpen,
}: {
  document: Document;
  searchQuery: string;
  onOpen: (document: Document) => void;
}) {
  const meta = resolveStatusMeta(DOCUMENT_STATUS_META, document.status);
  const canTransmit = useCan('DocumentService:Transmit', {
    kind: 'document',
    attributes: { status: document.status },
  });

  return (
    <tr>
      <td>
        <span className="docket-control-badge font-mono">
          <HighlightMatch text={document.controlNo} query={searchQuery} />
        </span>
      </td>
      <td>
        <div className="font-semibold text-xs text-[#0F172A]">
          <HighlightMatch text={document.title} query={searchQuery} />
        </div>
      </td>
      <td>
        <span className="font-mono text-[11px] text-[#334155]">
          <HighlightMatch text={document.requestId ?? 'Standalone'} query={searchQuery} />
        </span>
      </td>
      <td>
        <span className={`status-badge ${meta.badgeCls}`}>{meta.label}</span>
      </td>
      <td>
        <span className="font-mono text-[10px] text-[#94A3B8]">Awaiting dispatch</span>
      </td>
      <td>
        {canTransmit ? (
          <button
            onClick={() => onOpen(document)}
            className="btn-fluid px-2.5 py-1 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
          >
            Transmit Outgoing
          </button>
        ) : (
          <span className="font-mono text-[10px] font-bold text-[#64748B]">NOT PERMITTED</span>
        )}
      </td>
    </tr>
  );
}

export default function TransmitView() {
  const { transmitDocument } = useApp();
  const { uploadDocumentAttachment } = useAttachmentService();
  const uploadProofAction = useAsyncAction(uploadDocumentAttachment);
  const canUpload = useCan('AttachmentService:Upload');
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');

  const approvedQuery = useDispatchQueue({ first: 100, filter: { status: 'APPROVED' } });
  const endorsedQuery = useDispatchQueue({ first: 100, filter: { status: 'ENDORSED' } });
  const signedQuery = useDispatchQueue({ first: 100, filter: { status: 'SIGNED' } });

  const isLoading = approvedQuery.isLoading || endorsedQuery.isLoading || signedQuery.isLoading;
  const error = approvedQuery.error ?? endorsedQuery.error ?? signedQuery.error;

  const rows = useMemo(() => {
    const seen = new Set<string>();
    const merged: Document[] = [];
    for (const connection of [approvedQuery.data, endorsedQuery.data, signedQuery.data]) {
      if (!connection) continue;
      for (const edge of connection.edges) {
        // The desk is a work queue: a document leaves it as soon as a
        // transmission is recorded, and the request then waits for archival
        // under Archive > Pending Archival (Step 6).
        if ((edge.node.transmissions ?? []).length > 0) continue;
        if (seen.has(edge.node.id)) continue;
        seen.add(edge.node.id);
        merged.push(edge.node);
      }
    }
    return merged;
  }, [approvedQuery.data, endorsedQuery.data, signedQuery.data]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((document) =>
      [document.controlNo, document.title, document.requestId ?? '']
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [rows, searchQuery]);

  const refreshAll = () => {
    approvedQuery.refresh();
    endorsedQuery.refresh();
    signedQuery.refresh();
  };

  // Inline transmission panel state.
  const [target, setTarget] = useState<Document | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [receivingOffice, setReceivingOffice] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [method, setMethod] = useState<TransmissionMethod>('PICKUP');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openPanel = (document: Document) => {
    setTarget(document);
    setRecipientName('');
    setReceivingOffice('');
    setReceivedBy('');
    setMethod('PICKUP');
    setProofFile(null);
    setFormError(null);
  };

  const closePanel = () => {
    setTarget(null);
    setProofFile(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setFormError(null);

    // Optional proof of transmission: upload first, then pass its id.
    let proofAttachmentId: string | null = null;
    if (proofFile) {
      const uploaded = await uploadProofAction.run({
        documentId: target.id,
        kind: 'TRANSMISSION_PROOF',
        file: proofFile,
      });
      if (!uploaded) {
        setSubmitting(false);
        const message =
          uploadProofAction.getError()?.message ?? 'Unable to upload the proof of transmission.';
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success('Proof of transmission attached.');
      proofAttachmentId = uploaded.id;
    }

    const result = await transmitDocument({
      documentId: target.id,
      recipientName,
      receivingOffice,
      receivedBy,
      method,
      proofAttachmentId,
    });
    setSubmitting(false);
    if (!result) {
      setFormError('Transmission could not be recorded. Please review the details and try again.');
      return;
    }
    closePanel();
    refreshAll();
  };

  const formReady =
    recipientName.trim().length > 0 &&
    receivingOffice.trim().length > 0 &&
    receivedBy.trim().length > 0;

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE E: TRANSMISSION DESK & DISPATCH
          </h3>
          <p className="text-xs text-[#64748B]">
            Dispatch approved executive orders, certifications, and indorsements to requesting offices or citizens.
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Recording a transmission removes the document from this desk. The request then waits for
            its signed final copy and filing under Archive &gt; Pending Archival (Step 6).
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatch records..."
            className="w-full pl-8 pr-7 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] bg-white text-[#0F172A]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#081E36] cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {isLoading && <LoadingPanel label="Loading transmission records..." />}

      {error && <ErrorPanel message={error.message} onRetry={refreshAll} />}

      {!isLoading && !error && (
        <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="municipal-docket-table">
              <thead>
                <tr>
                  <th>Control No.</th>
                  <th>Document Title</th>
                  <th>Request Reference</th>
                  <th>Status</th>
                  <th>Dispatch</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#64748B] text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-[#081E36]">
                          No Records Awaiting Physical Transmittal
                        </div>
                        <p className="text-[11px]">
                          Approved issuances and executive orders ready for physical dispatch will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#64748B] text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-[#081E36]">
                          No Transmission Records Matching &quot;{searchQuery}&quot;
                        </div>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 btn-fluid px-3 py-1 bg-[#081E36] text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((document) => (
                    <TransmitRow
                      key={document.id}
                      document={document}
                      searchQuery={searchQuery}
                      onOpen={openPanel}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {target && (
        <Portal>
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#081E36]/40 p-4 overflow-y-auto">
            <div className="w-full max-w-md my-auto bg-white rounded-lg border border-[#CBD5E1] shadow-xl overflow-hidden animate-fluid-modal">
            <div className="px-4 py-3 bg-[#081E36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={15} className="text-[#86EFAC]" />
                <span className="font-cinzel text-sm font-bold">RECORD TRANSMISSION</span>
              </div>
              <button
                onClick={closePanel}
                className="text-[#CBD5E1] hover:text-white cursor-pointer"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#475569]">
                Dispatching <strong className="text-[#081E36] font-mono">{target.controlNo}</strong> -{' '}
                {target.title}
              </div>

              {formError && (
                <div className="p-3 bg-[#F1F5F9] border border-[#334155] rounded text-xs text-[#0F172A] font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">Recipient Name *</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">Receiving Office *</label>
                <input
                  type="text"
                  value={receivingOffice}
                  onChange={(e) => setReceivingOffice(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">Received By *</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">Method *</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as TransmissionMethod)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A] bg-white"
                >
                  <option value="PICKUP">Pickup</option>
                  <option value="COURIER">Courier</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                  Proof of transmission (receiving copy) - optional
                </label>
                {canUpload ? (
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    className="w-full text-[11px] text-[#334155] file:mr-2 file:px-2.5 file:py-1 file:rounded file:border-0 file:bg-[#081E36] file:text-white file:text-[11px] file:font-semibold file:cursor-pointer"
                  />
                ) : (
                  <span className="text-[10px] font-semibold text-[#64748B]">
                    Upload not permitted for your account.
                  </span>
                )}
                {proofFile && (
                  <div className="mt-1 text-[10px] text-[#15803D] font-semibold inline-flex items-center gap-1">
                    <Paperclip size={11} />
                    <span className="truncate max-w-[16rem]">{proofFile.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closePanel}
                  className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formReady}
                  className="px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      {proofFile ? <Upload size={12} /> : <Send size={12} />}
                      <span>Record Transmission</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
