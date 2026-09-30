'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function ReviewView() {
  const { documents, reviewCount, currentUser, setSelectedDoc, handleUpdateStatus } = useApp();

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE D: EXECUTIVE SIGNATURE & ENDORSEMENT DESK
          </h3>
          <p className="text-xs text-[#64748B]">
            Authoritative queue for the Municipal Administrator and Mayor to approve, endorse, or return requests.
          </p>
        </div>
        <span className="font-mono text-xs font-bold px-2 py-1 bg-[#FCD116] text-[#081E36] rounded shrink-0">
          {reviewCount} Pending Review
        </span>
      </div>

      {reviewCount === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-[#CBD5E1] shadow-sm text-center space-y-2">
          <div className="font-bold text-sm text-[#081E36]">Executive Review Desk is Up-to-Date</div>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            No dockets or executive issuances currently require approval or endorsement from the Municipal Administrator.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents
            .filter((d) => d.status === 'REVIEW')
            .map((doc) => (
              <div
                key={doc.id}
                className="p-5 bg-white rounded border border-[#CBD5E1] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 card-fluid"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="docket-control-badge">{doc.controlNumber}</span>
                    <span className="font-mono text-xs text-[#64748B]">
                      Origin: {doc.originOffice}
                    </span>
                    {doc.priority === 'URGENT' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
                        URGENT SLA
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif-docket text-base font-bold text-[#0F172A]">
                    {doc.title}
                  </h4>
                  <div className="text-xs text-[#475569]">
                    Requesting Signatory: <strong>{doc.requestingParty}</strong> | Assigned Drafter: <strong>{doc.assignedTo || 'Unassigned'}</strong>
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
