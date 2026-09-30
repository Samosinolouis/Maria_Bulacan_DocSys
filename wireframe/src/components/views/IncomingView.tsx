'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function IncomingView() {
  const { documents, setNewIntakeOpen, setSelectedDoc, handleUpdateStatus } = useApp();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded border border-[#94A3B8] flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-bold text-[#0F172A]">
            [ MODULE B: STATUTORY RECEPTION & SCREENING QUEUE ]
          </h3>
          <p className="text-xs text-[#64748B]">
            [ Audit incoming transactions for completeness of attachments, signatures, and proper addressing. ]
          </p>
        </div>
        <button
          onClick={() => setNewIntakeOpen(true)}
          className="wf-btn px-3 py-1.5"
        >
          [ + Log New Incoming ]
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents
          .filter((d) => d.status === 'SCREENING' || d.status === 'RECEIVED')
          .map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded border border-[#CBD5E1] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold border border-[#0F172A] px-1.5 py-0.5 rounded">
                  [{doc.controlNumber}]
                </span>
                <span className="wf-badge">[ UNDER SCREENING ]</span>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-[#0F172A]">
                  [{doc.title}]
                </div>
                <div className="h-2 w-3/4 bg-[#E2E8F0] rounded" />
              </div>

              <div className="text-xs text-[#64748B] space-y-1 font-mono">
                <div>[ Requesting Party: {doc.requestingParty} ]</div>
                <div>[ Origin Office: {doc.originOffice} ]</div>
                <div>[ Date Received: {new Date(doc.dateReceived).toLocaleDateString()} ]</div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="wf-btn wf-btn-secondary text-xs"
                >
                  [ Examine Dossier ]
                </button>
                <button
                  onClick={() => handleUpdateStatus(doc.id, 'PREPARATION', 'Screening passed by Clerk')}
                  className="wf-btn text-xs"
                >
                  [ Pass Screening ]
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
