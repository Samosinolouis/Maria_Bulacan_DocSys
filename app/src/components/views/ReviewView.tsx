'use client';

import React, { useMemo, useState } from 'react';
import { Ban, Check, Loader2, RotateCcw, Search, Send, X } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useCan, useRequestService, useReviewQueue } from '@/hooks';
import { DOCUMENT_STATUS_META, resolveStatusMeta } from '@/lib/constants';
import HighlightMatch from '@/components/HighlightMatch';
import type { Document, ReviewDecision } from '@/services/contracts';

/** Shared loading panel for the executive review desk. */
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

/**
 * One review docket row (Step 4): Approve, Endorse or Deny. Denial demands
 * written grounds (FR-23) and every decision records the decider + timestamp
 * server-side (FR-24).
 */
function ReviewRow({
  document,
  searchQuery,
  onExamine,
  onDecision,
}: {
  document: Document;
  searchQuery: string;
  onExamine: (document: Document) => void;
  onDecision: (
    document: Document,
    decision: ReviewDecision,
    denialReason?: string | null,
  ) => Promise<void>;
}) {
  const meta = resolveStatusMeta(DOCUMENT_STATUS_META, document.status);
  const canReview = useCan('DocumentService:Review', {
    kind: 'document',
    attributes: { status: document.status },
  });

  const [groundsOpen, setGroundsOpen] = useState(false);
  const [grounds, setGrounds] = useState('');
  const [busy, setBusy] = useState<ReviewDecision | null>(null);

  const decide = async (decision: ReviewDecision, denialReason?: string | null) => {
    setBusy(decision);
    await onDecision(document, decision, denialReason ?? null);
    setBusy(null);
  };

  return (
    <div className="p-5 bg-white rounded border border-[#CBD5E1] shadow-sm flex flex-col gap-4 card-fluid">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="docket-control-badge font-mono">
              <HighlightMatch text={document.controlNo} query={searchQuery} />
            </span>
            <span className={`status-badge ${meta.badgeCls}`}>{meta.label}</span>
            {document.signatoryRequired && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-[#CBD5E1] bg-[#F1F5F9] text-[#334155]">
                MAYOR SIGNATURE REQUIRED
              </span>
            )}
          </div>
          <h4 className="font-serif-docket text-base font-bold text-[#0F172A]">
            <HighlightMatch text={document.title} query={searchQuery} />
          </h4>
          <div className="text-xs text-[#475569]">
            Assigned Drafter: <strong>{document.assignedTo || 'Unassigned'}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onExamine(document)}
            className="btn-fluid px-3 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#081E36] rounded text-xs font-bold cursor-pointer shadow-2xs"
          >
            Examine Dossier
          </button>

          {canReview && (
            <>
              <button
                onClick={() => decide('APPROVED')}
                disabled={busy !== null}
                className="btn-fluid px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy === 'APPROVED' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                <span>Approve</span>
              </button>
              <button
                onClick={() => decide('ENDORSED')}
                disabled={busy !== null}
                title="Endorse to the Sangguniang Bayan / concerned office"
                className="btn-fluid px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy === 'ENDORSED' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                <span>Endorse</span>
              </button>
              <button
                onClick={() => setGroundsOpen((open) => !open)}
                disabled={busy !== null}
                className="btn-fluid px-3 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#334155] text-[#334155] rounded text-xs font-bold cursor-pointer shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Ban size={12} />
                <span>Deny</span>
              </button>
            </>
          )}
        </div>
      </div>

      {groundsOpen && canReview && (
        <div className="border border-[#CBD5E1] rounded p-3 bg-[#F8FAFC] space-y-2">
          <label className="block text-[11px] font-bold text-[#081E36]">
            Written grounds for denial (required, FR-23)
          </label>
          <textarea
            value={grounds}
            onChange={(e) => setGrounds(e.target.value)}
            rows={3}
            placeholder="State the specific deficiency or legal basis for returning this issuance."
            className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] bg-white"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => decide('DENIED', grounds)}
              disabled={busy !== null || !grounds.trim()}
              className="btn-fluid px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy === 'DENIED' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Ban size={12} />
              )}
              <span>Confirm Denial</span>
            </button>
            <button
              onClick={() => {
                setGroundsOpen(false);
                setGrounds('');
              }}
              className="btn-fluid px-3 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewView() {
  const { reviewCount, setSelectedRequest, reviewDocument } = useApp();
  const queue = useReviewQueue();
  const { getById } = useRequestService();

  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo(() => queue.data?.edges.map((edge) => edge.node) ?? [], [queue.data]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((document) =>
      [document.controlNo, document.title]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [rows, searchQuery]);

  const handleDecision = async (
    document: Document,
    decision: ReviewDecision,
    denialReason?: string | null,
  ) => {
    await reviewDocument({
      documentId: document.id,
      decision,
      denialReason: decision === 'DENIED' ? denialReason ?? null : null,
      decisionNotes: null,
    });
    queue.refresh();
  };

  const handleExamine = async (document: Document) => {
    if (!document.requestId) return;
    const request = await getById(document.requestId);
    if (request) setSelectedRequest(request);
  };

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="font-mono text-[10px] font-bold text-[#15803D] uppercase tracking-wider">
            STEP 4 - REVIEW &amp; APPROVAL
          </span>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE D: EXECUTIVE SIGNATURE &amp; ENDORSEMENT DESK
          </h3>
          <p className="text-xs text-[#64748B]">
            Authoritative queue for the Municipal Administrator and Executive Assistant II to
            approve, endorse, or deny the drafts submitted by the preparation desk. A denial must
            state written grounds (FR-23); every decision records the decider and timestamp (FR-24).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search review desk..."
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

          <span className="font-mono text-xs font-bold px-2 py-1.5 bg-[#FCD116] text-[#081E36] rounded shrink-0">
            {reviewCount} Pending
          </span>
        </div>
      </div>

      {queue.isLoading && <LoadingPanel label="Loading the executive review queue..." />}

      {queue.error && <ErrorPanel message={queue.error.message} onRetry={queue.refresh} />}

      {!queue.isLoading &&
        !queue.error &&
        (rows.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-[#CBD5E1] shadow-sm text-center space-y-2">
            <div className="font-bold text-sm text-[#081E36]">Executive Review Desk is Up-to-Date</div>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              No dockets or executive issuances currently require approval or endorsement from the Municipal
              Administrator.
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="bg-white p-6 rounded border border-[#CBD5E1] text-center text-xs text-[#64748B] space-y-2">
            <div className="font-bold text-[#081E36]">
              No Review Dockets Matching &quot;{searchQuery}&quot;
            </div>
            <p>Check the control number or document title.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn-fluid px-3 py-1 bg-[#081E36] text-white rounded text-xs font-semibold cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((document) => (
              <ReviewRow
                key={document.id}
                document={document}
                searchQuery={searchQuery}
                onExamine={handleExamine}
                onDecision={handleDecision}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
