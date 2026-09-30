'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function AdminView() {
  const { auditLogs } = useApp();

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm">
        <h3 className="font-cinzel text-base font-bold text-[#081E36]">
          IMMUTABLE STATUTORY AUDIT TRAIL & CUSTODY CHAIN
        </h3>
        <p className="text-xs text-[#64748B]">
          Tamper-evident chronological log of all document actions, status mutations, approvals, and transmissions.
        </p>
      </div>

      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm">
        <div className="divide-y divide-[#E2E8F0]">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
                    {log.action}
                  </span>
                  <span className="font-mono text-[11px] text-[#64748B]">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="font-bold text-[#0F172A]">
                  {log.userName} ({log.userRole})
                </div>
                <p className="text-[#334155]">{log.details}</p>
              </div>

              {log.documentId && (
                <span className="font-mono text-[10px] text-[#64748B] shrink-0">
                  {log.documentId}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
