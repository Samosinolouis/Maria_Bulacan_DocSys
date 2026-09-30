'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DOCUMENT_CATEGORY_LABELS } from '@/lib/data';

export default function ArchiveView() {
  const { documents, closedCount, setSelectedDoc } = useApp();

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex items-center justify-between shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE F: MUNICIPAL RECORDS ARCHIVE & RETRIEVAL
          </h3>
          <p className="text-xs text-[#64748B]">
            Digitized permanent repository of concluded municipal transactions, resolutions, and orders.
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-[#15803D]">
          {closedCount} Archived Records
        </span>
      </div>

      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm">
        <table className="municipal-docket-table">
          <thead>
            <tr>
              <th>Control No.</th>
              <th>Subject Matter</th>
              <th>Category</th>
              <th>Concluding Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {documents
              .filter((d) => d.status === 'CLOSED')
              .map((doc) => (
                <tr key={doc.id}>
                  <td><span className="docket-control-badge">{doc.controlNumber}</span></td>
                  <td><div className="font-semibold text-xs text-[#0F172A]">{doc.title}</div></td>
                  <td>{DOCUMENT_CATEGORY_LABELS[doc.category]}</td>
                  <td className="font-mono text-xs">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="px-2.5 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer shadow-sm btn-fluid"
                    >
                      Retrieve Dossier
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
