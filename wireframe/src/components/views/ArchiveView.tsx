'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DOCUMENT_CATEGORY_LABELS } from '@/lib/data';

export default function ArchiveView() {
  const { documents, closedCount, setSelectedDoc } = useApp();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded border border-[#94A3B8] flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-bold text-[#0F172A]">
            [ MODULE F: MUNICIPAL RECORDS ARCHIVE & RETRIEVAL ]
          </h3>
          <p className="text-xs text-[#64748B]">
            [ Digitized permanent repository of concluded municipal transactions, resolutions, and orders. ]
          </p>
        </div>
        <span className="font-mono text-xs font-bold border border-[#0F172A] px-2 py-1 rounded bg-[#F8FAFC]">
          [{closedCount} Archived Records]
        </span>
      </div>

      <div className="bg-white rounded border border-[#94A3B8] overflow-hidden">
        <table className="wf-table">
          <thead>
            <tr>
              <th>[ Control No. ]</th>
              <th>[ Subject Matter ]</th>
              <th>[ Category ]</th>
              <th>[ Concluding Date ]</th>
              <th>[ Action ]</th>
            </tr>
          </thead>
          <tbody>
            {documents
              .filter((d) => d.status === 'CLOSED')
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
                      [{DOCUMENT_CATEGORY_LABELS[doc.category]}]
                    </div>
                  </td>
                  <td className="font-mono text-xs">
                    [{new Date(doc.updatedAt).toLocaleDateString()}]
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="wf-btn text-[11px] px-2 py-0.5"
                    >
                      [ Retrieve Dossier ]
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
