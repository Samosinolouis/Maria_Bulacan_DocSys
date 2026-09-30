'use client';

import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import HighlightMatch from '@/components/HighlightMatch';
import { filterAndSearchDocuments } from '@/lib/searchEngine';

export default function TransmitView() {
  const { documents, setSelectedDoc } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const transmittableDocs = useMemo(() => {
    return documents.filter((d) => d.status === 'APPROVED' || d.status === 'TRANSMITTED');
  }, [documents]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return transmittableDocs;
    const scored = filterAndSearchDocuments(transmittableDocs, { query: searchQuery });
    return scored.map((s) => s.item);
  }, [transmittableDocs, searchQuery]);

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE E: TRANSMISSION DESK & DISPATCH
          </h3>
          <p className="text-xs text-[#64748B]">
            Dispatch approved executive orders, certifications, and indorsements to requesting offices or citizens.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatch records..."
            className="w-full pl-8 pr-7 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] bg-white text-[#0F172A]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#081E36] cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
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
              {transmittableDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#64748B] text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-[#081E36]">No Records Awaiting Physical Transmittal</div>
                      <p className="text-[11px]">Approved issuances and executive orders ready for physical dispatch will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#64748B] text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-[#081E36]">No Transmission Records Matching &quot;{searchQuery}&quot;</div>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 btn-fluid px-3 py-1 bg-[#081E36] text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="docket-control-badge font-mono">
                        <HighlightMatch text={doc.controlNumber} query={searchQuery} />
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-xs text-[#0F172A]">
                        <HighlightMatch text={doc.title} query={searchQuery} />
                      </div>
                    </td>
                    <td>
                      <HighlightMatch
                        text={doc.transmissionDetails?.recipientName || doc.requestingParty}
                        query={searchQuery}
                      />
                    </td>
                    <td>
                      <HighlightMatch
                        text={doc.transmissionDetails?.transmittedToOffice || doc.originOffice}
                        query={searchQuery}
                      />
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

