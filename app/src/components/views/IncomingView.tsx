'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function IncomingView() {
  const { documents, setNewIntakeOpen, setSelectedDoc, handleUpdateStatus } = useApp();

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE B: STATUTORY RECEPTION & SCREENING QUEUE
          </h3>
          <p className="text-xs text-[#64748B]">
            Audit incoming documents for completeness of attachments, signatures, and proper addressing.
          </p>
        </div>
        <button
          onClick={() => setNewIntakeOpen(true)}
          className="btn-fluid px-3.5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow shrink-0"
        >
          Log New Incoming
        </button>
      </div>

      {documents.filter((d) => d.status === 'SCREENING' || d.status === 'RECEIVED').length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents
            .filter((d) => d.status === 'SCREENING' || d.status === 'RECEIVED')
            .map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-5 rounded border border-[#CBD5E1] shadow-sm space-y-3 card-fluid"
              >
                <div className="flex items-center justify-between">
                  <span className="docket-control-badge">{doc.controlNumber}</span>
                  <span className="status-badge badge-screening">UNDER SCREENING</span>
                </div>

                <h4 className="font-serif-docket text-base font-bold text-[#0F172A]">
                  {doc.title}
                </h4>

                <div className="text-xs text-[#475569] space-y-1">
                  <div>Requesting Party: <strong>{doc.requestingParty}</strong></div>
                  <div>Origin Office: <strong>{doc.originOffice}</strong></div>
                  <div>Date Received: <strong className="font-mono">{new Date(doc.dateReceived).toLocaleString()}</strong></div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="text-xs font-bold text-[#081E36] hover:underline cursor-pointer"
                  >
                    Examine Dossier
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(doc.id, 'PREPARATION', 'Screening passed by Clerk')}
                    className="btn-fluid px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded font-bold text-xs cursor-pointer shadow-sm"
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
