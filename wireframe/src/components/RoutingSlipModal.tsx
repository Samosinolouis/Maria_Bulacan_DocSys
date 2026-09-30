'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { DocumentRecord } from '@/lib/types';
import { DOCUMENT_CATEGORY_LABELS } from '@/lib/data';

interface RoutingSlipModalProps {
  document: DocumentRecord;
  onClose: () => void;
}

export default function RoutingSlipModal({ document: doc, onClose }: RoutingSlipModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white border-2 border-[#0F172A] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#94A3B8] bg-[#F1F5F9] flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#0F172A]">
            [ STATUTORY ROUTING SLIP &bull; WIREFRAME PRINT PREVIEW ]
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="wf-btn text-xs px-2.5 py-1"
            >
              <Printer size={12} className="mr-1" /> [ Print ]
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 border border-[#0F172A] bg-white rounded flex items-center justify-center text-xs hover:bg-[#F1F5F9]"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Printable Slip Sheet */}
        <div className="p-8 space-y-6 text-xs font-mono">
          <div className="text-center space-y-1 pb-4 border-b-2 border-[#0F172A]">
            <div className="w-10 h-10 border border-dashed border-[#94A3B8] mx-auto flex items-center justify-center text-[9px]">
              [ SEAL ]
            </div>
            <div className="text-[10px] text-[#64748B]">[ REPUBLIC OF THE PHILIPPINES &bull; PROVINCE OF BULACAN ]</div>
            <div className="font-bold text-sm text-[#0F172A]">[ MUNICIPALITY OF SANTA MARIA ]</div>
            <div className="text-[11px] font-bold">[ OFFICIAL EXECUTIVE ROUTING SLIP ]</div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 border border-[#94A3B8] rounded bg-[#F8FAFC]">
            <div>
              <span className="text-[10px] text-[#64748B] block">[ CONTROL NUMBER ]</span>
              <span className="font-bold text-sm text-[#0F172A]">[{doc.controlNumber}]</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block">[ INTAKE TIMESTAMP ]</span>
              <span className="font-bold text-xs">{new Date(doc.dateReceived).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2 border-b border-[#CBD5E1] pb-4">
            <div>[ SUBJECT: {doc.title} ]</div>
            <div>[ ORIGIN: {doc.originOffice} ]</div>
            <div>[ REQUESTING PARTY: {doc.requestingParty} ]</div>
            <div>[ CATEGORY: {DOCUMENT_CATEGORY_LABELS[doc.category]} ]</div>
          </div>

          {/* Action Checkboxes */}
          <div className="space-y-2">
            <div className="font-bold text-[#0F172A]">[ ACTION REQUESTED / INSTRUCTION: ]</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>[ ] For Appropriate Action</div>
              <div>[ ] For Executive Signature</div>
              <div>[ ] For Comment / Recommendation</div>
              <div>[ ] For Legal Opinion</div>
              <div>[ ] For Filing & Records Retention</div>
              <div>[ ] For Immediate Dispatch</div>
            </div>
          </div>

          {/* Routing Trail Signatures */}
          <div className="pt-6 border-t border-[#0F172A] grid grid-cols-3 gap-4 text-center text-[10px]">
            <div>
              <div className="h-10 border-b border-dashed border-[#94A3B8]" />
              <div className="mt-1 font-bold">[ INTAKE CLERK ]</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-[#94A3B8]" />
              <div className="mt-1 font-bold">[ MUNICIPAL ADMINISTRATOR ]</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-[#94A3B8]" />
              <div className="mt-1 font-bold">[ MUNICIPAL MAYOR ]</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
