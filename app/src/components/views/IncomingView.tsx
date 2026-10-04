'use client';

import React, { useState, useMemo } from 'react';
import { Paperclip, Search, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import HighlightMatch from '@/components/HighlightMatch';
import { filterAndSearchDocuments } from '@/lib/searchEngine';

export default function IncomingView() {
  const {
    documents,
    setNewIntakeOpen,
    setSelectedDoc,
    handleUpdateStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const incomingDocs = useMemo(() => {
    return documents.filter((d) => d.status === 'SCREENING' || d.status === 'RECEIVED');
  }, [documents]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return incomingDocs;
    const scored = filterAndSearchDocuments(incomingDocs, { query: searchQuery });
    return scored.map((s) => s.item);
  }, [incomingDocs, searchQuery]);


  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE B: STATUTORY RECEPTION & SCREENING QUEUE
          </h3>
          <p className="text-xs text-[#64748B]">
            Audit incoming documents for completeness of attachments, signatures, and proper addressing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incoming queue..."
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

          <button
            onClick={() => setNewIntakeOpen(true)}
            className="btn-fluid px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow shrink-0"
          >
            Log New Incoming
          </button>
        </div>
      </div>

      {incomingDocs.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-[#CBD5E1] shadow-sm text-center space-y-3">
          <div className="font-bold text-sm text-[#081E36]">No Documents in Reception / Screening Queue</div>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            All incoming communications and requests have been screened and processed. Click below to intake and scan a new document.
          </p>
          <button
            onClick={() => setNewIntakeOpen(true)}
            className="btn-fluid px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold shadow cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Log Incoming Document</span>
          </button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white p-6 rounded border border-[#CBD5E1] text-center text-xs text-[#64748B] space-y-2">
          <div className="font-bold text-[#081E36]">No Incoming Documents Matching &quot;{searchQuery}&quot;</div>
          <p>Check the control number or clear your search term.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn-fluid px-3 py-1 bg-[#081E36] text-white rounded text-xs font-semibold cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded border border-[#CBD5E1] shadow-sm space-y-3 card-fluid"
            >
              <div className="flex items-center justify-between">
                <span className="docket-control-badge font-mono">
                  <HighlightMatch text={doc.controlNumber} query={searchQuery} />
                </span>
                <div className="flex items-center gap-2">
                  {doc.attachments && doc.attachments.length > 0 && (
                    <span className="text-[10px] font-mono text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0] inline-flex items-center gap-0.5">
                      <Paperclip size={10} />
                      <span>{doc.attachments.length} Annex{doc.attachments.length > 1 ? 'es' : ''}</span>
                    </span>
                  )}
                  <span className="status-badge badge-screening">UNDER SCREENING</span>
                </div>
              </div>

              <h4 className="font-serif-docket text-base font-bold text-[#0F172A]">
                <HighlightMatch text={doc.title} query={searchQuery} />
              </h4>

              <div className="text-xs text-[#475569] space-y-1">
                <div>Requesting Party: <strong><HighlightMatch text={doc.requestingParty} query={searchQuery} /></strong></div>
                <div>Origin Office: <strong><HighlightMatch text={doc.originOffice} query={searchQuery} /></strong></div>
                <div>Date Received: <strong className="font-mono">{new Date(doc.dateReceived).toLocaleString()}</strong></div>
              </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="text-xs font-semibold text-[#081E36] hover:text-[#15803D] hover:underline cursor-pointer"
                  >
                    Examine Dossier
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(doc.id, 'PREPARATION', 'Screening passed by Clerk')}
                    className="btn-fluid px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded font-bold text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    Pass Screening
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
