'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function AdminView() {
  const { auditLogs } = useApp();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded border border-[#94A3B8]">
        <h3 className="font-mono text-sm font-bold text-[#0F172A]">
          [ MODULE G: IMMUTABLE STATUTORY AUDIT TRAIL & CUSTODY CHAIN ]
        </h3>
        <p className="text-xs text-[#64748B]">
          [ Tamper-evident chronological custody ledger recording all mutations, endorsements, and dispatches. ]
        </p>
      </div>

      <div className="bg-white rounded border border-[#94A3B8] p-4">
        <div className="divide-y divide-[#CBD5E1]">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold border border-[#0F172A] px-1.5 py-0.5 rounded bg-[#F8FAFC]">
                    [{log.action}]
                  </span>
                  <span className="font-mono text-[11px] text-[#64748B]">
                    [{new Date(log.timestamp).toLocaleString()}]
                  </span>
                </div>
                <div className="font-bold text-[#0F172A]">
                  [{log.userName}] &bull; <span className="font-mono text-[11px] text-[#64748B]">[{log.userRole}]</span>
                </div>
                <p className="text-[#475569] font-mono text-[11px]">
                  [{log.details}]
                </p>
                <div className="h-1.5 w-1/3 bg-[#E2E8F0] rounded" />
              </div>

              {log.documentId && (
                <span className="font-mono text-[10px] border border-[#94A3B8] px-1.5 py-0.5 rounded text-[#64748B] shrink-0">
                  [{log.documentId}]
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
