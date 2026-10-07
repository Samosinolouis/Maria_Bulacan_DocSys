'use client';

import React, { useMemo, useState } from 'react';
import { Paperclip, Search, X, Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/providers/ToastProvider';
import { useCan, useRequests, useRequestService, useAsyncAction } from '@/hooks';
import { REQUEST_STATUS_META, resolveStatusMeta } from '@/lib/constants';
import HighlightMatch from '@/components/HighlightMatch';
import type { Request } from '@/services/contracts';

/** Shared loading panel for the reception queue. */
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

/** One reception/screening card; owns its per-resource screening grant and fail form. */
function IncomingCard({
  request,
  searchQuery,
  failOpen,
  busy,
  onExamine,
  onPass,
  onFail,
  onToggleFail,
  onResubmit,
}: {
  request: Request;
  searchQuery: string;
  failOpen: boolean;
  busy: boolean;
  onExamine: (request: Request) => void;
  onPass: (request: Request) => void;
  onFail: (request: Request, deficiencies: string[], notes: string | null) => void;
  onToggleFail: (request: Request) => void;
  onResubmit: (request: Request) => void;
}) {
  const meta = resolveStatusMeta(REQUEST_STATUS_META, request.status);
  const canScreen = useCan('RequestService:Screen', {
    kind: 'request',
    attributes: { status: request.status },
  });
  const annexCount = request.attachments?.length ?? 0;
  const screenable = request.status === 'RECEIVED' || request.status === 'SCREENING';
  const resubmittable = request.status === 'RETURNED_FOR_COMPLIANCE';

  const [deficienciesText, setDeficienciesText] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleFailSubmit = () => {
    const parsed = deficienciesText
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (parsed.length === 0) {
      setFormError(
        'At least one deficiency is required before returning a request for compliance (FR-13).',
      );
      return;
    }
    setFormError(null);
    onFail(request, parsed, notes.trim() ? notes.trim() : null);
  };

  return (
    <div className="bg-white p-5 rounded border border-[#CBD5E1] shadow-sm space-y-3 card-fluid">
      <div className="flex items-center justify-between">
        <span className="docket-control-badge font-mono">
          <HighlightMatch text={request.controlNo} query={searchQuery} />
        </span>
        <div className="flex items-center gap-2">
          {annexCount > 0 && (
            <span className="text-[10px] font-mono text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0] inline-flex items-center gap-0.5">
              <Paperclip size={10} />
              <span>
                {annexCount} Annex{annexCount > 1 ? 'es' : ''}
              </span>
            </span>
          )}
          <span className={`status-badge ${meta.badgeCls}`}>{meta.label}</span>
        </div>
      </div>

      <h4 className="font-serif-docket text-base font-bold text-[#0F172A]">
        <HighlightMatch text={request.title} query={searchQuery} />
      </h4>

      <div className="text-xs text-[#475569] space-y-1">
        <div>
          Requesting Party:{' '}
          <strong>
            <HighlightMatch text={request.requestingParty} query={searchQuery} />
          </strong>
        </div>
        <div>
          Origin Office:{' '}
          <strong>
            <HighlightMatch text={request.originOffice} query={searchQuery} />
          </strong>
        </div>
        <div>
          Date Received:{' '}
          <strong className="font-mono">{new Date(request.receivedAt).toLocaleString()}</strong>
        </div>
      </div>

      <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onExamine(request)}
          className="text-xs font-semibold text-[#081E36] hover:text-[#15803D] hover:underline cursor-pointer"
        >
          Examine Dossier
        </button>

        <div className="flex items-center gap-2">
          {screenable && canScreen && (
            <>
              <button
                onClick={() => onToggleFail(request)}
                disabled={busy}
                className="btn-fluid px-3.5 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] rounded font-bold text-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Fail Screening
              </button>
              <button
                onClick={() => onPass(request)}
                disabled={busy}
                className="btn-fluid px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded font-bold text-xs cursor-pointer shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                {busy && <Loader2 size={12} className="animate-spin" />}
                <span>Pass Screening</span>
              </button>
            </>
          )}

          {resubmittable && canScreen && (
            <button
              onClick={() => onResubmit(request)}
              disabled={busy}
              className="btn-fluid px-3.5 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded font-bold text-xs cursor-pointer shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              <span>Resubmit</span>
            </button>
          )}
        </div>
      </div>

      {failOpen && screenable && (
        <div className="mt-1 p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-2">
          <div className="text-[11px] font-bold text-[#081E36] uppercase tracking-wide">
            Return for Compliance
          </div>
          <p className="text-[10px] text-[#64748B]">
            List each deficiency separated by a comma or a new line. At least one is required
            (FR-13).
          </p>
          <textarea
            value={deficienciesText}
            onChange={(e) => setDeficienciesText(e.target.value)}
            rows={3}
            placeholder="e.g. Missing barangay clearance, Unsigned endorsement"
            className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#334155] bg-white"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional screening notes"
            className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#334155] bg-white"
          />
          {formError && (
            <div className="text-[11px] font-semibold text-[#334155] flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onToggleFail(request)}
              className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleFailSubmit}
              disabled={busy}
              className="btn-fluid px-3.5 py-1.5 bg-[#334155] hover:bg-[#1E293B] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A labeled queue section with a count and a per-status empty message. */
function QueueSection({
  title,
  hint,
  count,
  emptyText,
  children,
}: {
  title: string;
  hint: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-cinzel text-sm font-bold text-[#081E36]">{title}</h4>
          <p className="text-[11px] text-[#64748B]">{hint}</p>
        </div>
        <span className="font-mono text-xs font-bold text-[#081E36] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded shrink-0">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="bg-white p-4 rounded border border-[#CBD5E1] text-xs text-[#64748B] text-center">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
      )}
    </section>
  );
}

export default function IncomingView() {
  const { setNewIntakeOpen, setSelectedRequest, screenRequest, lastError, refreshCounts } = useApp();
  const { resubmit } = useRequestService();
  const resubmitAction = useAsyncAction(resubmit);
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [failOpenId, setFailOpenId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const receivedQuery = useRequests({ first: 100, filter: { status: 'RECEIVED' } });
  const screeningQuery = useRequests({ first: 100, filter: { status: 'SCREENING' } });
  const returnedQuery = useRequests({ first: 100, filter: { status: 'RETURNED_FOR_COMPLIANCE' } });

  const isLoading = receivedQuery.isLoading || screeningQuery.isLoading || returnedQuery.isLoading;
  const error = receivedQuery.error ?? screeningQuery.error ?? returnedQuery.error;

  // Merge the three queues, de-duplicating by request id.
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const merged: Request[] = [];
    for (const connection of [receivedQuery.data, screeningQuery.data, returnedQuery.data]) {
      if (!connection) continue;
      for (const edge of connection.edges) {
        if (seen.has(edge.node.id)) continue;
        seen.add(edge.node.id);
        merged.push(edge.node);
      }
    }
    return merged;
  }, [receivedQuery.data, screeningQuery.data, returnedQuery.data]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((request) =>
      [request.controlNo, request.title, request.requestingParty, request.originOffice]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [rows, searchQuery]);

  const receivedRows = filteredRows.filter((request) => request.status === 'RECEIVED');
  const screeningRows = filteredRows.filter((request) => request.status === 'SCREENING');
  const returnedRows = filteredRows.filter(
    (request) => request.status === 'RETURNED_FOR_COMPLIANCE',
  );

  const refreshAll = () => {
    receivedQuery.refresh();
    screeningQuery.refresh();
    returnedQuery.refresh();
  };

  const handlePass = async (request: Request) => {
    setPendingId(request.id);
    const result = await screenRequest({ requestId: request.id, passed: true, notes: null });
    setPendingId(null);
    if (result) {
      setFailOpenId(null);
      refreshAll();
      refreshCounts();
    }
  };

  const handleFail = async (request: Request, deficiencies: string[], notes: string | null) => {
    setPendingId(request.id);
    const result = await screenRequest({
      requestId: request.id,
      passed: false,
      deficiencies,
      notes,
    });
    setPendingId(null);
    if (result) {
      setFailOpenId(null);
      refreshAll();
      refreshCounts();
    }
  };

  const handleResubmit = async (request: Request) => {
    setPendingId(request.id);
    const result = await resubmitAction.run(request.id);
    setPendingId(null);
    if (result) {
      refreshAll();
      refreshCounts();
      toast.success(`Request ${result.controlNo} resubmitted for screening.`);
    } else {
      toast.error(resubmitAction.getError()?.message ?? 'Unable to resubmit the request.');
    }
  };

  const handleToggleFail = (request: Request) => {
    setFailOpenId((prev) => (prev === request.id ? null : request.id));
  };

  const actionError = lastError ?? resubmitAction.error;

  const renderCard = (request: Request) => (
    <IncomingCard
      key={request.id}
      request={request}
      searchQuery={searchQuery}
      failOpen={failOpenId === request.id}
      busy={pendingId === request.id}
      onExamine={setSelectedRequest}
      onPass={handlePass}
      onFail={handleFail}
      onToggleFail={handleToggleFail}
      onResubmit={handleResubmit}
    />
  );

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE B: STATUTORY RECEPTION &amp; SCREENING QUEUE
          </h3>
          <p className="text-xs text-[#64748B]">
            Audit incoming documents for completeness of attachments, signatures, and proper
            addressing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incoming queue..."
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

          <button
            onClick={() => setNewIntakeOpen(true)}
            className="btn-fluid px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow shrink-0"
          >
            Log New Incoming
          </button>
        </div>
      </div>

      {isLoading && <LoadingPanel label="Loading reception and screening queue..." />}

      {error && <ErrorPanel message={error.message} onRetry={refreshAll} />}

      {actionError && (
        <ErrorPanel
          message={actionError.message}
          onRetry={() => {
            resubmitAction.reset();
            refreshAll();
          }}
        />
      )}

      {!isLoading &&
        !error &&
        (rows.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-[#CBD5E1] shadow-sm text-center space-y-3">
            <div className="font-bold text-sm text-[#081E36]">
              No Documents in Reception / Screening Queue
            </div>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              All incoming communications and requests have been screened and processed. Click below
              to intake and scan a new document.
            </p>
            <button
              onClick={() => setNewIntakeOpen(true)}
              className="btn-fluid px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold shadow cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Log Incoming Document</span>
            </button>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="bg-white p-6 rounded border border-[#CBD5E1] text-center text-xs text-[#64748B] space-y-2">
            <div className="font-bold text-[#081E36]">
              No Incoming Documents Matching &quot;{searchQuery}&quot;
            </div>
            <p>Check the control number or clear your search term.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn-fluid px-3 py-1 bg-[#081E36] text-white rounded text-xs font-semibold cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <QueueSection
              title="Received / Awaiting Screening"
              hint="Newly logged documents pending the initial completeness audit."
              count={receivedRows.length}
              emptyText="No received documents are awaiting screening."
            >
              {receivedRows.map(renderCard)}
            </QueueSection>

            <QueueSection
              title="Under Screening"
              hint="Documents currently being audited for attachments, signatures, and addressing."
              count={screeningRows.length}
              emptyText="No documents are under screening."
            >
              {screeningRows.map(renderCard)}
            </QueueSection>

            <QueueSection
              title="Returned for Compliance"
              hint="Returned to the requesting party for deficiencies; resubmit once complete."
              count={returnedRows.length}
              emptyText="No documents are awaiting compliance."
            >
              {returnedRows.map(renderCard)}
            </QueueSection>
          </div>
        ))}
    </div>
  );
}
