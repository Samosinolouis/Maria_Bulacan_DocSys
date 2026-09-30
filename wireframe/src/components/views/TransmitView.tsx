'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function TransmitView() {
  const { documents, setSelectedDoc } = useApp();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded border border-[#94A3B8]">
        <h3 className="font-mono text-sm font-bold text-[#0F172A]">
          [ MODULE E: TRANSMISSION DESK & DISPATCH ]
        </h3>
        <p className="text-xs text-[#64748B]">
          [ Dispatch approved executive orders, clearances, and endorsements to external entities or requesting departments. ]
        </p>
      </div>

      <div className="bg-white rounded border border-[#94A3B8] overflow-hidden">
        <table className="wf-table">
          <thead>
            <tr>
              <th>[ Control No. ]</th>
              <th>[ Document Title ]</th>
              <th>[ Dispatch Recipient ]</th>
              <th>[ Receiving Department ]</th>
              <th>[ Action ]</th>
            </tr>
          </thead>
          <tbody>
            {documents
              .filter((d) => d.status === 'APPROVED' || d.status === 'TRANSMITTED')
              .map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <span className="font-mono text-xs font-bold border border-[#0F172A] px-1.5 py-0.5 rounded">
                      [{doc.controlNumber}]
                    </span>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div className="font-semibold text-xs text-[#0F172A]">[{doc.title}]</div>
                      <div className="h-1.5 w-1/2 bg-[#E2E8F0] rounded" />
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-[#475569]">
                      [{doc.transmissionDetails?.recipientName || doc.requestingParty}]
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-[#475569]">
                      [{doc.transmissionDetails?.transmittedToOffice || doc.originOffice}]
                    </div>
                  </td>
                  <td>
                    {doc.status === 'APPROVED' ? (
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="wf-btn text-[11px] px-2 py-0.5"
                      >
                        [ Transmit Outgoing ]
                      </button>
                    ) : (
                      <span className="wf-badge">[ TRANSMITTED ]</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
