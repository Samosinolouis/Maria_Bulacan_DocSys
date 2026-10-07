'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  X,
  Paperclip,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useDashboardMetrics, useMySchedule, useRequests } from '@/hooks';
import { REQUEST_STATUS_META, resolveStatusMeta, venueLabel } from '@/lib/constants';
import type {
  Connection,
  DashboardMetrics,
  Event,
  EventStatus,
  Request,
} from '@/services/contracts/models';
import HighlightMatch from '@/components/HighlightMatch';

const EMPTY_METRICS: DashboardMetrics = {
  totalDocuments: 0,
  incomingRequests: 0,
  pendingActions: 0,
  closedTransactions: 0,
  slaAtRisk: 0,
  slaOverdue: 0,
};

const EVENT_STATUS_META: Record<EventStatus, { label: string; badgeCls: string }> = {
  CONFIRMED: { label: 'Confirmed', badgeCls: 'text-[#166534] bg-[#DCFCE7] border border-[#86EFAC]' },
  TENTATIVE: { label: 'Tentative', badgeCls: 'text-[#854D0E] bg-[#FEF9C3] border border-[#FDE68A]' },
  CANCELLED: { label: 'Cancelled', badgeCls: 'text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1]' },
};

export default function DashboardView() {
  const { setSelectedRequest, setNewEventOpen } = useApp();

  const metricsQuery = useDashboardMetrics();
  const requestsQuery = useRequests({
    first: 10,
    sort: { field: 'RECEIVED_AT', direction: 'DESC' },
  });
  const scheduleQuery = useMySchedule();

  const [searchQuery, setSearchQuery] = useState('');

  const metrics = (metricsQuery.data as DashboardMetrics | null) ?? EMPTY_METRICS;
  const recentRequests = useMemo(
    () =>
      ((requestsQuery.data as Connection<Request> | null)?.edges.map((edge) => edge.node) ?? []),
    [requestsQuery.data],
  );
  const events = scheduleQuery.data ?? [];

  const isLoading = metricsQuery.isLoading || requestsQuery.isLoading || scheduleQuery.isLoading;
  const error = metricsQuery.error ?? requestsQuery.error ?? scheduleQuery.error;

  const refreshAll = () => {
    metricsQuery.refresh();
    requestsQuery.refresh();
    scheduleQuery.refresh();
  };

  // "Now" is captured asynchronously so the render stays pure (no Date.now in
  // the render body); it drives the overdue highlight.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);
  const isOverdue = (request: Request) =>
    now !== null && new Date(request.slaDeadline).getTime() < now;
  const overdueRequest = recentRequests.find(isOverdue) ?? null;

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return recentRequests;
    return recentRequests.filter((request) =>
      [request.controlNo, request.title, request.requestingParty, request.originOffice, request.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [recentRequests, searchQuery]);

  const venueName = (event: Event) => event.venue?.name ?? venueLabel(event.venue?.code ?? event.venueId);

  if (isLoading) {
    return <LoadingPanel label="Loading executive command center..." />;
  }

  if (error) {
    return <ErrorPanel message={error.message} onRetry={refreshAll} />;
  }

  return (
    <div className="space-y-6 animate-fluid-tab">
      {/* Executive Operations HUD */}
      <section className="executive-operations-hud card-fluid">
        <div className="hud-cell">
          <span className="hud-section-label">SEC. I - REGISTRY INFLUX</span>
          <div className="hud-number-row">
            <span className="hud-number">{metrics.totalDocuments}</span>
            <span className="text-xs font-semibold text-[#86EFAC]">Total Logged</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            {metrics.incomingRequests} in screening queue
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. II - SIGNATURE DESK</span>
          <div className="hud-number-row">
            <span className="hud-number text-[#FCD116]">{metrics.pendingActions}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">For Review</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            {metrics.closedTransactions} cleared transactions
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. III - ARTA SLA INTEGRITY</span>
          <div className="hud-number-row">
            <span className="hud-number text-[#FFFFFF]">{metrics.slaOverdue}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">Escalated</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            {metrics.slaAtRisk} at risk | RA 11032 3-Day Mandate
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. IV - VENUES & LOGISTICS</span>
          <div className="hud-number-row">
            <span className="hud-number">{events.length}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">Gavel Events</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            Municipal venues synchronized
          </span>
        </div>
      </section>

      {/* Administrative Action Memorandum */}
      {metrics.slaOverdue > 0 && (
        <section className="arta-memo-docket card-fluid">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#081E36] text-white rounded">
                  STATUTORY ARTA DIRECTIVE
                </span>
                <span className="text-xs font-bold text-[#475569]">
                  Republic Act No. 11032 - Section 21
                </span>
              </div>
              <h3 className="font-serif-docket text-base font-bold text-[#0F172A]">
                {overdueRequest
                  ? `Memorandum of Overdue Transaction: ${overdueRequest.title}`
                  : `Memorandum of Overdue Transactions: ${metrics.slaOverdue} dockets`}
              </h3>
              <p className="text-xs text-[#475569] mt-1 max-w-3xl leading-relaxed">
                The 72-hour turnaround threshold mandated by the Ease of Doing Business Act has
                expired for{' '}
                {overdueRequest ? (
                  <>
                    control docket <strong>[{overdueRequest.controlNo}]</strong>
                  </>
                ) : (
                  <strong>{metrics.slaOverdue} registered dockets</strong>
                )}
                . Transmitted to the Office of the Municipal Administrator for immediate statutory
                resolution.
              </p>
            </div>

            {overdueRequest && (
              <button
                onClick={() => setSelectedRequest(overdueRequest)}
                className="btn-fluid px-4 py-2 bg-[#081E36] hover:bg-[#0B2545] text-white rounded font-bold text-xs cursor-pointer shadow shrink-0"
              >
                Examine Docket
              </button>
            )}
          </div>
        </section>
      )}

      {/* Asymmetric Civic Ledger Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registry Balance Sheet */}
        <div className="bg-white p-5 rounded border border-[#CBD5E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#081E36]">
              Statutory Registry Balance
            </h3>
            <span className="font-mono text-[11px] text-[#64748B]">Active Ledger</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { label: 'Total Documents Logged', value: metrics.totalDocuments },
              { label: 'Incoming Requests', value: metrics.incomingRequests },
              { label: 'Pending Executive Actions', value: metrics.pendingActions },
              { label: 'Closed Transactions', value: metrics.closedTransactions },
              { label: 'SLA At Risk', value: metrics.slaAtRisk },
              { label: 'SLA Overdue', value: metrics.slaOverdue },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between p-2 hover:bg-[#F8FAFC] rounded border border-transparent hover:border-[#E2E8F0] transition-colors"
              >
                <span className="font-medium text-[#334155]">{row.label}</span>
                <span className="font-mono font-bold text-[#081E36] bg-[#F1F5F9] px-2 py-0.5 rounded">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Executive Venue & Gavel Dispatch */}
        <div className="lg:col-span-2 bg-white p-5 rounded border border-[#CBD5E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#081E36]">
              Municipal Venue & Executive Gavel Dispatch
            </h3>
            <button
              onClick={() => setNewEventOpen(true)}
              className="text-xs font-bold text-[#15803D] hover:underline cursor-pointer"
            >
              Schedule Gavel
            </button>
          </div>

          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="p-6 text-center text-[#64748B] text-xs space-y-1">
                <div className="font-bold text-[#081E36]">No Municipal Venues Currently Reserved</div>
                <p>Schedule executive proceedings or conference room bookings above.</p>
              </div>
            ) : (
              events.map((event) => {
                const statusMeta = resolveStatusMeta(EVENT_STATUS_META, event.status);
                return (
                  <div
                    key={event.id}
                    className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
                          {venueName(event)}
                        </span>
                        <span className="font-mono text-[11px] text-[#64748B]">
                          {event.eventDate} | {event.startTime} - {event.endTime}
                        </span>
                        {event.involvesMayor && (
                          <span className="text-[10px] font-bold text-[#081E36] bg-[#E2E8F0] border border-[#CBD5E1] px-1.5 py-0.5 rounded">
                            MAYOR PRESIDING
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-sm text-[#0F172A]">{event.title}</div>
                      <div className="text-[#64748B] text-[11px]">
                        Department: {event.department}
                      </div>
                    </div>

                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-1 rounded shrink-0 ${statusMeta.badgeCls}`}
                    >
                      {statusMeta.label.toUpperCase()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Municipal Docket Ledger Table */}
      <div className="bg-white rounded border border-[#CBD5E1] shadow-sm overflow-hidden space-y-0">
        {/* Search Command Toolbar */}
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-cinzel text-sm font-bold text-[#081E36]">
                MUNICIPAL DOCKET LEDGER TABLE
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Official chronological registry of incoming communications, executive orders, and
                municipal transactions.
              </p>
            </div>

            {/* Quick Search Input with Clear Button */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search docket, party, office..."
                  className="w-full pl-8 pr-7 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] bg-white text-[#0F172A]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#081E36] cursor-pointer"
                    title="Clear search query"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Results Summary Header */}
        <div className="px-4 py-2 bg-white border-b border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <div>
            Showing <strong>{filteredRequests.length}</strong> of{' '}
            <strong>{recentRequests.length}</strong> recent registered dockets
            {searchQuery && (
              <span>
                {' '}
                matching &quot;<strong>{searchQuery}</strong>&quot;
              </span>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="municipal-docket-table">
            <thead>
              <tr>
                <th>Docket No.</th>
                <th>Classification</th>
                <th>Document Subject / Particulars</th>
                <th>Requesting Party & Office</th>
                <th>Status</th>
                <th>Statutory SLA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#64748B] text-xs">
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <div className="font-bold text-sm text-[#081E36]">No Matching Dockets Found</div>
                      <p className="text-[11px] leading-relaxed">
                        No recent municipal records match the active search terms. Try clearing the
                        search query.
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 btn-fluid px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const statusMeta = resolveStatusMeta(REQUEST_STATUS_META, request.status);
                  const overdue = isOverdue(request);
                  return (
                    <tr
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className="cursor-pointer"
                    >
                      <td>
                        <span className="docket-control-badge font-mono">
                          <HighlightMatch text={request.controlNo} query={searchQuery} />
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-xs text-[#334155]">
                          {request.requestType?.name ?? request.requestTypeId}
                        </span>
                      </td>
                      <td>
                        <div className="docket-title-cell max-w-md">
                          <div className="font-bold text-[#0F172A]">
                            <HighlightMatch text={request.title} query={searchQuery} />
                          </div>
                          {request.attachments && request.attachments.length > 0 && (
                            <div className="text-[10px] text-[#15803D] flex items-center gap-1 mt-0.5">
                              <Paperclip size={10} />
                              <span>
                                {request.attachments.length} attached annex
                                {request.attachments.length > 1 ? 'es' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-xs text-[#0F172A]">
                          <HighlightMatch text={request.requestingParty} query={searchQuery} />
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          <HighlightMatch text={request.originOffice} query={searchQuery} />
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${statusMeta?.badgeCls || 'badge-received'}`}>
                          {statusMeta?.label || request.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`font-mono text-xs font-bold ${
                            overdue ? 'text-[#081E36]' : 'text-[#15803D]'
                          }`}
                        >
                          {overdue ? 'OVERDUE' : '3 Days Valid'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                          }}
                          className="btn-fluid px-3 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                          title="Examine complete docket dossier"
                        >
                          Examine
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="space-y-6 animate-fluid-tab">
      <div className="bg-white p-10 rounded border border-[#CBD5E1] shadow-sm flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#081E36]" />
        <span className="text-xs font-bold text-[#081E36]">{label}</span>
      </div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="space-y-6 animate-fluid-tab">
      <div className="bg-white p-6 rounded border border-[#CBD5E1] shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[#081E36]">
          <AlertCircle size={18} />
          <span className="font-bold text-sm">Unable to Load Municipal Registry</span>
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
