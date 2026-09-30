'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function ReviewView() {
  const { documents, reviewCount, currentUser, setSelectedDoc, handleUpdateStatus } = useApp();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded border border-[#94A3B8] flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-bold text-[#0F172A]">
            [ MODULE D: EXECUTIVE SIGNATURE & ENDORSEMENT DESK ]
          </h3>
          <p className="text-xs text-[#64748B]">
            [ Authoritative review queue for the Municipal Administrator and Mayor to affix seal, endorse, or return requests. ]
          </p>
        </div>
        <span className="font-mono text-xs font-bold border border-[#0F172A] px-2 py-1 rounded bg-[#F8FAFC]">
          [{reviewCount} Pending Review]
        </span>
      </div>

      <div className="space-y-3">
        {documents
          .filter((d) => d.status === 'REVIEW')
          .map((doc) => (
            <div
              key={doc.id}
              className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold border border-[#0F172A] px-1.5 py-0.5 rounded">
                    [{doc.controlNumber}]
                  </span>
                  <span className="font-mono text-xs text-[#64748B]">
                    [ Origin: {doc.originOffice} ]
                  </span>
                  {doc.priority === 'URGENT' && (
                    <span className="wf-badge">[ URGENT SLA ]</span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    [{doc.title}]
                  </h4>
                  <div className="h-2 w-3/4 bg-[#E2E8F0] rounded" />
                </div>

                <div className="text-xs text-[#64748B] font-mono">
                  [ Requesting Party: {doc.requestingParty} &bull; Drafter: {doc.assignedTo || 'Staff Clerk'} ]
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="wf-btn wf-btn-secondary text-xs"
                >
                  [ Examine Dossier ]
                </button>
                <button
                  onClick={() => handleUpdateStatus(doc.id, 'APPROVED', `Approved by ${currentUser.fullName}`)}
                  className="wf-btn text-xs"
                >
                  [ Approve & Sign ]
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
