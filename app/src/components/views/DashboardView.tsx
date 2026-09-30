'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_META,
  VENUE_LABELS,
} from '@/lib/data';

export default function DashboardView() {
  const {
    documents,
    events,
    incomingCount,
    reviewCount,
    overdueDocs,
    overdueCount,
    approvedCount,
    filteredDocuments,
    searchQuery,
    setSearchQuery,
    setSelectedDoc,
    setRoutingSlipDoc,
    setNewEventOpen,
  } = useApp();

  return (
    <div className="space-y-6 animate-fluid-tab">
      {/* Executive Operations HUD */}
      <section className="executive-operations-hud card-fluid">
        <div className="hud-cell">
          <span className="hud-section-label">SEC. I - REGISTRY INFLUX</span>
          <div className="hud-number-row">
            <span className="hud-number">{documents.length}</span>
            <span className="text-xs font-semibold text-[#86EFAC]">Total Logged</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            {incomingCount} in screening queue
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. II - SIGNATURE DESK</span>
          <div className="hud-number-row">
            <span className="hud-number text-[#FCD116]">{reviewCount}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">For Review</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            {approvedCount} cleared this week
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. III - ARTA SLA INTEGRITY</span>
          <div className="hud-number-row">
            <span className="hud-number text-[#FFFFFF]">{overdueCount}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">Escalated</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            RA 11032 3-Day Mandate
          </span>
        </div>

        <div className="hud-cell">
          <span className="hud-section-label">SEC. IV - VENUES & LOGISTICS</span>
          <div className="hud-number-row">
            <span className="hud-number">{events.length}</span>
            <span className="text-xs font-semibold text-[#CBD5E1]">Gavel Events</span>
          </div>
          <span className="hud-status-text font-mono text-[11px]">
            6 Municipal Venues active
          </span>
        </div>
      </section>

      {/* Administrative Action Memorandum */}
      {overdueDocs.length > 0 && (
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
                Memorandum of Overdue Transaction: {overdueDocs[0].title}
              </h3>
              <p className="text-xs text-[#475569] mt-1 max-w-3xl leading-relaxed">
                The 72-hour turnaround threshold mandated by the Ease of Doing Business Act has
                expired for control docket <strong>[{overdueDocs[0].controlNumber}]</strong>.
                Transmitted to the Office of the Municipal Administrator for immediate statutory resolution.
              </p>
            </div>

            <button
              onClick={() => setSelectedDoc(overdueDocs[0])}
              className="btn-fluid px-4 py-2 bg-[#081E36] hover:bg-[#0B2545] text-white rounded font-bold text-xs cursor-pointer shadow shrink-0"
            >
              Examine Docket
            </button>
          </div>
        </section>
      )}

      {/* Asymmetric Civic Ledger Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Balance Sheet */}
        <div className="bg-white p-5 rounded border border-[#CBD5E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#081E36]">
              Statutory Document Classification
            </h3>
            <span className="font-mono text-[11px] text-[#64748B]">Active Ledger</span>
          </div>

          <div className="space-y-2 text-xs">
            {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([catKey, label]) => {
              const count = documents.filter((d) => d.category === catKey).length;
              return (
                <div
                  key={catKey}
                  className="flex items-center justify-between p-2 hover:bg-[#F8FAFC] rounded border border-transparent hover:border-[#E2E8F0]"
                >
                  <span className="font-medium text-[#334155]">{label}</span>
                  <span className="font-mono font-bold text-[#081E36] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    {count}
                  </span>
                </div>
              );
            })}
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
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
                      {VENUE_LABELS[evt.venue]?.label}
                    </span>
                    <span className="font-mono text-[11px] text-[#64748B]">
                      {evt.date} | {evt.startTime} - {evt.endTime}
                    </span>
                    {evt.involvesMayor && (
                      <span className="text-[10px] font-bold text-[#081E36] bg-[#E2E8F0] border border-[#CBD5E1] px-1.5 py-0.5 rounded">
                        MAYOR PRESIDING
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-sm text-[#0F172A]">{evt.title}</div>
                  <div className="text-[#64748B] text-[11px]">
                    Organizer: {evt.organizer} ({evt.department})
                  </div>
                </div>

                <span className="font-mono text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-1 rounded border border-[#86EFAC]">
                  CONFIRMED
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Municipal Docket Ledger Table */}
      <div className="bg-white rounded border border-[#CBD5E1] shadow-sm overflow-hidden space-y-3">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="font-cinzel text-sm font-bold text-[#081E36]">
              MUNICIPAL DOCKET LEDGER TABLE
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Official chronological registry of incoming communications and municipal orders.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docket by number, party, office..."
                className="w-full pl-8 pr-3 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
              />
            </div>
          </div>
        </div>

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
              {filteredDocuments.map((doc) => {
                const statusMeta = DOCUMENT_STATUS_META[doc.status];
                return (
                  <tr key={doc.id}>
                    <td>
                      <span className="docket-control-badge">{doc.controlNumber}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-xs text-[#334155]">
                        {DOCUMENT_TYPE_LABELS[doc.type]?.label}
                      </span>
                    </td>
                    <td>
                      <div className="docket-title-cell max-w-md">{doc.title}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-xs text-[#0F172A]">
                        {doc.requestingParty}
                      </div>
                      <div className="text-[10px] text-[#64748B]">{doc.originOffice}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${statusMeta.badgeCls}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`font-mono text-xs font-bold ${
                          doc.isOverdue ? 'text-[#081E36]' : 'text-[#15803D]'
                        }`}
                      >
                        {doc.isOverdue ? 'OVERDUE' : '3 Days Valid'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-2.5 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Examine
                        </button>
                        <button
                          onClick={() => setRoutingSlipDoc(doc)}
                          className="px-2 py-1 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-semibold cursor-pointer"
                          title="Print Routing Slip"
                        >
                          Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
