'use client';

import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import HighlightMatch from '@/components/HighlightMatch';
import { filterAndSearchDocuments } from '@/lib/searchEngine';

export default function ReviewView() {
  const { documents, reviewCount, currentUser, setSelectedDoc, handleUpdateStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const reviewDocs = useMemo(() => {
    return documents.filter((d) => d.status === 'REVIEW');
  }, [documents]);

  const filteredReviewDocs = useMemo(() => {
    if (!searchQuery.trim()) return reviewDocs;
    const scored = filterAndSearchDocuments(reviewDocs, { query: searchQuery });
    return scored.map((s) => s.item);
  }, [reviewDocs, searchQuery]);

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE D: EXECUTIVE SIGNATURE & ENDORSEMENT DESK
          </h3>
          <p className="text-xs text-[#64748B]">
            Authoritative queue for the Municipal Administrator and Mayor to approve, endorse, or return requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search review desk..."
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

          <span className="font-mono text-xs font-bold px-2 py-1.5 bg-[#FCD116] text-[#081E36] rounded shrink-0">
            {reviewCount} Pending
          </span>
        </div>
      </div>

      {reviewCount === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-[#CBD5E1] shadow-sm text-center space-y-2">
          <div className="font-bold text-sm text-[#081E36]">Executive Review Desk is Up-to-Date</div>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            No dockets or executive issuances currently require approval or endorsement from the Municipal Administrator.
          </p>
        </div>
      ) : filteredReviewDocs.length === 0 ? (
        <div className="bg-white p-6 rounded border border-[#CBD5E1] text-center text-xs text-[#64748B] space-y-2">
          <div className="font-bold text-[#081E36]">No Review Dockets Matching &quot;{searchQuery}&quot;</div>
          <p>Check the control number or signatory name.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn-fluid px-3 py-1 bg-[#081E36] text-white rounded text-xs font-semibold cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviewDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 bg-white rounded border border-[#CBD5E1] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 card-fluid"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="docket-control-badge font-mono">
                    <HighlightMatch text={doc.controlNumber} query={searchQuery} />
                  </span>
                  <span className="font-mono text-xs text-[#64748B]">
                    Origin: <HighlightMatch text={doc.originOffice} query={searchQuery} />
                  </span>
                  {doc.priority === 'URGENT' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
                      URGENT SLA
                    </span>
                  )}
                </div>
                <h4 className="font-serif-docket text-base font-bold text-[#0F172A]">
                  <HighlightMatch text={doc.title} query={searchQuery} />
                </h4>
                <div className="text-xs text-[#475569]">
                  Requesting Signatory: <strong><HighlightMatch text={doc.requestingParty} query={searchQuery} /></strong> | Assigned Drafter: <strong>{doc.assignedTo || 'Unassigned'}</strong>
                </div>
              </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="btn-fluid px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer shadow-sm"
                  >
                    Examine Dossier
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(doc.id, 'APPROVED', `Approved by ${currentUser.fullName}`)}
                    className="btn-fluid px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow-sm"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
