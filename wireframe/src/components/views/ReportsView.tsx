'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DOCUMENT_CATEGORY_LABELS } from '@/lib/data';

export default function ReportsView() {
  const { documents, overdueCount } = useApp();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded border border-[#94A3B8]">
        <h3 className="font-mono text-sm font-bold text-[#0F172A]">
          [ REPUBLIC ACT 11032 STATUTORY COMPLIANCE LEDGER ]
        </h3>
        <p className="text-xs text-[#64748B]">
          [ Official Anti-Red Tape Authority (ARTA) metrics, 72-hour turnaround enforcement, and monthly compliance summary. ]
        </p>
      </div>

      {/* 3 Pillar Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded border border-[#94A3B8] space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">
            [ STATUTORY SLA SUCCESS RATE ]
          </span>
          <div className="text-3xl font-bold font-mono text-[#0F172A]">
            [94.8%]
          </div>
          <div className="h-2 w-3/4 bg-[#E2E8F0] rounded" />
          <p className="text-[11px] text-[#64748B]">
            [ Requests resolved within 72-hour ARTA statutory limit ]
          </p>
        </div>

        <div className="p-5 bg-white rounded border border-[#94A3B8] space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">
            [ AVERAGE PROCESSING TURNAROUND ]
          </span>
          <div className="text-3xl font-bold font-mono text-[#0F172A]">
            [1.4 Days]
          </div>
          <div className="h-2 w-2/3 bg-[#E2E8F0] rounded" />
          <p className="text-[11px] text-[#64748B]">
            [ Average duration from Reception screening to Executive signature ]
          </p>
        </div>

        <div className="p-5 bg-white rounded border border-[#94A3B8] space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">
            [ STATUTORY ESCALATIONS LOGGED ]
          </span>
          <div className="text-3xl font-bold font-mono text-[#0F172A]">
            [{overdueCount}]
          </div>
          <div className="h-2 w-1/2 bg-[#E2E8F0] rounded" />
          <p className="text-[11px] text-[#64748B]">
            [ Overdue transactions escalated directly to Municipal Administrator ]
          </p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded border border-[#94A3B8] overflow-hidden">
        <div className="bg-[#F1F5F9] border-b border-[#CBD5E1] p-3">
          <h4 className="font-mono text-xs font-bold text-[#0F172A]">
            [ MONTHLY DOCUMENT PROCESSING SUMMARY BY STATUTORY CATEGORY ]
          </h4>
        </div>

        <table className="wf-table">
          <thead>
            <tr>
              <th>[ Statutory Category ]</th>
              <th>[ Received ]</th>
              <th>[ Approved ]</th>
              <th>[ Denied ]</th>
              <th>[ Archived ]</th>
              <th>[ Compliance ]</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([catKey, label]) => {
              const total = documents.filter((d) => d.category === catKey).length;
              const app = documents.filter(
                (d) => d.category === catKey && (d.status === 'APPROVED' || d.status === 'ENDORSED')
              ).length;
              const den = documents.filter((d) => d.category === catKey && d.status === 'DENIED').length;
              const cl = documents.filter((d) => d.category === catKey && d.status === 'CLOSED').length;
              return (
                <tr key={catKey}>
                  <td className="font-bold text-[#0F172A]">[{label}]</td>
                  <td className="font-mono">[{total}]</td>
                  <td className="font-mono">[{app}]</td>
                  <td className="font-mono">[{den}]</td>
                  <td className="font-mono">[{cl}]</td>
                  <td>
                    <span className="wf-badge">[ 100% COMPLIANT ]</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
