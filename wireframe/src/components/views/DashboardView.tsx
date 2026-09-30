'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_META } from '@/lib/data';
import { Search, Filter, ShieldAlert } from 'lucide-react';

export default function DashboardView() {
  const {
    documents,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    setSelectedDoc,
    setRoutingSlipDoc,
    incomingCount,
    reviewCount,
    overdueCount,
    closedCount,
    filteredDocuments,
  } = useApp();

  return (
    <div className="space-y-6">
      {/* 1. Wireframe ARTA Statutory Directive Alert */}
      <div className="bg-white border-2 border-[#0F172A] rounded p-4 flex items-start gap-4">
        <div className="w-10 h-10 border border-dashed border-[#0F172A] bg-[#F8FAFC] rounded flex items-center justify-center shrink-0">
          <ShieldAlert size={20} className="text-[#0F172A]" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#0F172A]">
              [ ARTA STATUTORY SLA DIRECTIVE &bull; REPUBLIC ACT 11032 ]
            </span>
            <span className="font-mono text-xs border border-[#0F172A] px-2 py-0.5 rounded bg-[#F8FAFC]">
              [ MANDATORY 72-HOUR PROTOCOL ]
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            [ Executive reminder: All incoming municipal documents must be screened, drafted, and submitted for Mayoral endorsement within statutory deadlines. ]
          </p>
        </div>
      </div>

      {/* 2. Wireframe Executive Operations HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#94A3B8] rounded space-y-2">
          <div className="font-mono text-[10px] font-bold text-[#64748B] uppercase">
            [ I. TOTAL DOCKET ]
          </div>
          <div className="font-mono text-3xl font-bold text-[#0F172A]">
            [{documents.length}]
          </div>
          <div className="h-2 w-3/4 bg-[#E2E8F0] rounded" />
          <div className="text-[11px] text-[#64748B]">[ Active Registered Transactions ]</div>
        </div>

        <div className="p-4 bg-white border border-[#94A3B8] rounded space-y-2">
          <div className="font-mono text-[10px] font-bold text-[#64748B] uppercase">
            [ II. INTAKE & SCREENING ]
          </div>
          <div className="font-mono text-3xl font-bold text-[#0F172A]">
            [{incomingCount}]
          </div>
          <div className="h-2 w-2/3 bg-[#E2E8F0] rounded" />
          <div className="text-[11px] text-[#64748B]">[ Reception Desk Completeness Audit ]</div>
        </div>

        <div className="p-4 bg-white border border-[#94A3B8] rounded space-y-2">
          <div className="font-mono text-[10px] font-bold text-[#64748B] uppercase">
            [ III. MAYORAL REVIEW ]
          </div>
          <div className="font-mono text-3xl font-bold text-[#0F172A]">
            [{reviewCount}]
          </div>
          <div className="h-2 w-1/2 bg-[#E2E8F0] rounded" />
          <div className="text-[11px] text-[#64748B]">[ Signature & Endorsement Queue ]</div>
        </div>

        <div className="p-4 bg-white border border-[#94A3B8] rounded space-y-2">
          <div className="font-mono text-[10px] font-bold text-[#64748B] uppercase">
            [ IV. CLOSED ARCHIVE ]
          </div>
          <div className="font-mono text-3xl font-bold text-[#0F172A]">
            [{closedCount}]
          </div>
          <div className="h-2 w-4/5 bg-[#E2E8F0] rounded" />
          <div className="text-[11px] text-[#64748B]">[ Concluded Records in Vault ]</div>
        </div>
      </div>

      {/* 3. Wireframe Filter & Search Controls */}
      <div className="p-4 bg-white border border-[#CBD5E1] rounded flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="[ Filter docket by control no. or party... ]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#94A3B8] rounded text-xs bg-[#F8FAFC] text-[#0F172A] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 border border-[#94A3B8] rounded px-2 py-1 bg-white text-xs text-[#475569]">
            <Filter size={12} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">[ All Document Types ]</option>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  [{label.label}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-[#94A3B8] rounded px-2 py-1 bg-white text-xs text-[#475569]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">[ All Statuses ]</option>
              {Object.entries(DOCUMENT_STATUS_META).map(([k, meta]) => (
                <option key={k} value={k}>
                  [{meta.label}]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Wireframe Municipal Docket Table */}
      <div className="bg-white border border-[#94A3B8] rounded overflow-hidden">
        <div className="bg-[#F1F5F9] border-b border-[#CBD5E1] p-3 flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold text-[#0F172A]">
            [ MUNICIPAL DOCKET RECORD LEDGER ]
          </h2>
          <span className="font-mono text-[10px] text-[#64748B]">
            [ Showing {filteredDocuments.length} Records ]
          </span>
        </div>

        <table className="wf-table">
          <thead>
            <tr>
              <th>[ Control No. ]</th>
              <th>[ Subject Matter / Title ]</th>
              <th>[ Requesting Party ]</th>
              <th>[ Origin Office ]</th>
              <th>[ Status ]</th>
              <th>[ Action ]</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <span className="font-mono text-xs font-bold border border-[#0F172A] bg-white px-1.5 py-0.5 rounded">
                    [{doc.controlNumber}]
                  </span>
                </td>
                <td>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#0F172A]">
                      [{doc.title}]
                    </div>
                    <div className="h-1.5 w-1/2 bg-[#E2E8F0] rounded" />
                  </div>
                </td>
                <td>
                  <div className="text-xs text-[#475569]">[{doc.requestingParty}]</div>
                </td>
                <td>
                  <div className="text-xs text-[#475569]">[{doc.originOffice}]</div>
                </td>
                <td>
                  <span className="wf-badge">
                    [{doc.status}]
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="wf-btn text-[11px] px-2 py-0.5"
                    >
                      [ View ]
                    </button>
                    <button
                      onClick={() => setRoutingSlipDoc(doc)}
                      className="wf-btn wf-btn-secondary text-[11px] px-2 py-0.5"
                    >
                      [ Slip ]
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
