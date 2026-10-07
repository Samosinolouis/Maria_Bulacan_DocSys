'use client';

import React from 'react';
import { Loader2, X, RotateCcw } from 'lucide-react';
import { useCategorySummary, useDashboardMetrics } from '@/hooks';

/** Shared loading panel for the compliance ledger. */
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

/** One ARTA metric card. */
function MetricCard({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: number;
  hint: string;
  valueClass: string;
}) {
  return (
    <div className="p-5 bg-white rounded border border-[#CBD5E1] shadow-sm card-fluid">
      <span className="text-[10px] uppercase font-bold text-[#64748B] block">{label}</span>
      <div className={`text-3xl font-extrabold font-mono my-1 ${valueClass}`}>{value}</div>
      <p className="text-[11px] text-[#64748B]">{hint}</p>
    </div>
  );
}

export default function ReportsView() {
  const year = new Date().getFullYear();

  const metricsQuery = useDashboardMetrics();
  const summaryQuery = useCategorySummary({ period: 'ANNUAL', year });

  const isLoading = metricsQuery.isLoading || summaryQuery.isLoading;
  const error = metricsQuery.error ?? summaryQuery.error;

  const metrics = metricsQuery.data;
  const categoryRows = summaryQuery.data ?? [];

  const refreshAll = () => {
    metricsQuery.refresh();
    summaryQuery.refresh();
  };

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm">
        <h3 className="font-cinzel text-base font-bold text-[#081E36]">
          REPUBLIC ACT 11032 STATUTORY COMPLIANCE LEDGER
        </h3>
        <p className="text-xs text-[#64748B]">
          Official Anti-Red Tape Authority (ARTA) metrics, 72-hour turnaround enforcement, and annual summary
          balance.
        </p>
      </div>

      {isLoading && <LoadingPanel label="Loading ARTA compliance metrics..." />}

      {error && <ErrorPanel message={error.message} onRetry={refreshAll} />}

      {!isLoading && !error && (
        <>
          {/* Metric pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Total Documents Processed"
              value={metrics?.totalDocuments ?? 0}
              hint="Output documents drafted, reviewed, signed, or transmitted."
              valueClass="text-[#081E36]"
            />
            <MetricCard
              label="Incoming Requests Received"
              value={metrics?.incomingRequests ?? 0}
              hint="Communications and requests logged at the reception desk."
              valueClass="text-[#081E36]"
            />
            <MetricCard
              label="Pending Actions"
              value={metrics?.pendingActions ?? 0}
              hint="Transactions awaiting screening, drafting, review, or dispatch."
              valueClass="text-[#081E36]"
            />
            <MetricCard
              label="Closed Transactions"
              value={metrics?.closedTransactions ?? 0}
              hint="Requests concluded and filed into the municipal archive."
              valueClass="text-[#15803D]"
            />
            <MetricCard
              label="SLA At Risk"
              value={metrics?.slaAtRisk ?? 0}
              hint="Requests approaching the 72-hour ARTA processing limit."
              valueClass="text-[#081E36]"
            />
            <MetricCard
              label="SLA Overdue"
              value={metrics?.slaOverdue ?? 0}
              hint="Overdue transactions escalated to the Municipal Administrator."
              valueClass="text-[#081E36]"
            />
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#081E36] mb-3">
              Annual Document Processing Summary by Category ({year})
            </h4>
            <div className="overflow-x-auto">
              <table className="municipal-docket-table">
                <thead>
                  <tr>
                    <th>Statutory Category</th>
                    <th>Code</th>
                    <th>Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-[#64748B] text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-[#081E36]">No Category Activity Recorded</div>
                          <p className="text-[11px]">
                            Per-category counts for {year} will appear once documents are processed.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    categoryRows.map((row) => (
                      <tr key={row.documentTypeId}>
                        <td className="font-bold text-[#081E36]">{row.name}</td>
                        <td className="font-mono text-[#334155]">{row.code}</td>
                        <td className="font-mono text-[#15803D]">{row.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
