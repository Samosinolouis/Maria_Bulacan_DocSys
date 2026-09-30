'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function TransmitView() {
  const { documents, setSelectedDoc } = useApp();

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm">
        <h3 className="font-cinzel text-base font-bold text-[#081E36]">
          MODULE E: TRANSMISSION DESK & DISPATCH
        </h3>
        <p className="text-xs text-[#64748B]">
          Dispatch approved executive orders, certifications, and indorsements to requesting offices or citizens.
        </p>
      </div>

      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="municipal-docket-table">
            <thead>
              <tr>
                <th>Control No.</th>
                <th>Document Title</th>
                <th>Dispatch Recipient</th>
                <th>Receiving Department</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents
                .filter((d) => d.status === 'APPROVED' || d.status === 'TRANSMITTED')
                .map((doc) => (
                  <tr key={doc.id}>
                    <td><span className="docket-control-badge">{doc.controlNumber}</span></td>
                    <td><div className="font-semibold text-xs text-[#0F172A]">{doc.title}</div></td>
                    <td>{doc.transmissionDetails?.recipientName || doc.requestingParty}</td>
                    <td>{doc.transmissionDetails?.transmittedToOffice || doc.originOffice}</td>
                    <td>
                      {doc.status === 'APPROVED' ? (
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="btn-fluid px-2.5 py-1 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
                        >
                          Transmit Outgoing
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] font-bold text-[#15803D]">
                          TRANSMITTED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
