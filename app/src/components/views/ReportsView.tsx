'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DOCUMENT_CATEGORY_LABELS } from '@/lib/data';

export default function ReportsView() {
  const { documents, overdueCount } = useApp();

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm">
        <h3 className="font-cinzel text-base font-bold text-[#081E36]">
          REPUBLIC ACT 11032 STATUTORY COMPLIANCE LEDGER
        </h3>
        <p className="text-xs text-[#64748B]">
          Official Anti-Red Tape Authority (ARTA) metrics, 72-hour turnaround enforcement, and monthly summary balance.
        </p>
      </div>

      {/* 3 Pillar Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded border border-[#CBD5E1] shadow-sm card-fluid">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">
            Statutory SLA Success Rate
          </span>
          <div className="text-3xl font-extrabold font-mono text-[#15803D] my-1">
            94.8%
          </div>
          <p className="text-[11px] text-[#64748B]">
            Requests resolved within 72-hour ARTA processing limit.
          </p>
        </div>

        <div className="p-5 bg-white rounded border border-[#CBD5E1] shadow-sm card-fluid">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">
            Average Processing Turnaround
          </span>
          <div className="text-3xl font-extrabold font-mono text-[#081E36] my-1">
            1.4 Days
          </div>
          <p className="text-[11px] text-[#64748B]">
            Average time from Reception screening to Executive approval.
          </p>
        </div>

        <div className="p-5 bg-white rounded border border-[#CBD5E1] shadow-sm card-fluid">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">
            Statutory Escalations Logged
          </span>
          <div className="text-3xl font-extrabold font-mono text-[#081E36] my-1">
            {overdueCount}
          </div>
          <p className="text-[11px] text-[#64748B]">
            Overdue transactions escalated directly to Municipal Administrator.
          </p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#081E36] mb-3">
          Monthly Document Processing Summary by Category
        </h4>
        <table className="municipal-docket-table">
          <thead>
            <tr>
              <th>Statutory Category</th>
              <th>Received</th>
              <th>Approved</th>
              <th>Denied</th>
              <th>Archived</th>
              <th>Compliance</th>
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
                  <td className="font-bold text-[#081E36]">{label}</td>
                  <td className="font-mono">{total}</td>
                  <td className="font-mono text-[#15803D]">{app}</td>
                  <td className="font-mono text-[#475569]">{den}</td>
                  <td className="font-mono text-[#475569]">{cl}</td>
                  <td>
                    <span className="font-mono text-xs font-bold text-[#15803D]">
                      100% Compliant
                    </span>
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
