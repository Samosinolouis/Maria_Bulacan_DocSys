'use client';

import { useState } from 'react';
import { X, Printer, Calendar } from 'lucide-react';
import { DocumentRecord, User, AuditEntry, DocumentStatus } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS } from '@/lib/data';

interface DocumentDetailModalProps {
  document: DocumentRecord;
  currentUser: User;
  auditLogs: AuditEntry[];
  onClose: () => void;
  onUpdateStatus: (docId: string, newStatus: DocumentStatus, note?: string) => void;
  onPrintRoutingSlip: (doc: DocumentRecord) => void;
}

export default function DocumentDetailModal({
  document: doc,
  currentUser,
  auditLogs,
  onClose,
  onUpdateStatus,
  onPrintRoutingSlip,
}: DocumentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'letterhead'>('overview');
  const [denialNote, setDenialNote] = useState('');
  const [endorsementNote, setEndorsementNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white border-2 border-[#0F172A] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#94A3B8] bg-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold border border-[#0F172A] px-2 py-0.5 rounded bg-white">
              [{doc.controlNumber}]
            </span>
            <span className="wf-badge">[{doc.status}]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintRoutingSlip(doc)}
              className="wf-btn text-xs px-2.5 py-1"
            >
              <Printer size={12} className="mr-1" /> [ Print Routing Slip ]
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 border border-[#0F172A] bg-white rounded flex items-center justify-center text-xs hover:bg-[#F1F5F9]"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="border-b border-[#CBD5E1] bg-white px-6 flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 font-bold cursor-pointer ${
              activeTab === 'overview' ? 'border-[#0F172A] text-[#0F172A]' : 'border-transparent text-[#64748B]'
            }`}
          >
            [ I. DOSSIER OVERVIEW ]
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 font-bold cursor-pointer ${
              activeTab === 'timeline' ? 'border-[#0F172A] text-[#0F172A]' : 'border-transparent text-[#64748B]'
            }`}
          >
            [ II. CUSTODY TIMELINE ]
          </button>
          <button
            onClick={() => setActiveTab('letterhead')}
            className={`py-3 border-b-2 font-bold cursor-pointer ${
              activeTab === 'letterhead' ? 'border-[#0F172A] text-[#0F172A]' : 'border-transparent text-[#64748B]'
            }`}
          >
            [ III. OFFICIAL LETTERHEAD PREVIEW ]
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 text-xs space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 border border-[#94A3B8] rounded bg-[#F8FAFC] space-y-2">
                <div className="text-[10px] font-mono text-[#64748B] uppercase">[ SUBJECT MATTER ]</div>
                <h3 className="text-base font-bold text-[#0F172A]">[{doc.title}]</h3>
                <div className="h-1.5 w-1/2 bg-[#E2E8F0] rounded" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border border-[#CBD5E1] rounded">
                  <div className="text-[10px] font-mono text-[#64748B]">[ DOCUMENT TYPE ]</div>
                  <div className="font-bold text-[#0F172A] mt-1">[{DOCUMENT_TYPE_LABELS[doc.type]?.label}]</div>
                </div>

                <div className="p-3 border border-[#CBD5E1] rounded">
                  <div className="text-[10px] font-mono text-[#64748B]">[ CATEGORY ]</div>
                  <div className="font-bold text-[#0F172A] mt-1">[{DOCUMENT_CATEGORY_LABELS[doc.category]}]</div>
                </div>

                <div className="p-3 border border-[#CBD5E1] rounded">
                  <div className="text-[10px] font-mono text-[#64748B]">[ REQUESTING PARTY ]</div>
                  <div className="font-bold text-[#0F172A] mt-1">[{doc.requestingParty}]</div>
                </div>

                <div className="p-3 border border-[#CBD5E1] rounded">
                  <div className="text-[10px] font-mono text-[#64748B]">[ ORIGIN OFFICE ]</div>
                  <div className="font-bold text-[#0F172A] mt-1">[{doc.originOffice}]</div>
                </div>
              </div>

              {/* Action Buttons for Workflow */}
              <div className="p-4 border-2 border-dashed border-[#94A3B8] rounded space-y-3">
                <div className="font-mono text-xs font-bold text-[#0F172A]">
                  [ STATUTORY ACTION & ENDORSEMENT CONTROLS ]
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onUpdateStatus(doc.id, 'APPROVED', `Approved by ${currentUser.fullName}`)}
                    className="wf-btn text-xs"
                  >
                    [ Approve Transaction ]
                  </button>
                  <button
                    onClick={() => onUpdateStatus(doc.id, 'ENDORSED', endorsementNote || 'Endorsed for action')}
                    className="wf-btn text-xs"
                  >
                    [ Endorse to Department ]
                  </button>
                  <button
                    onClick={() => onUpdateStatus(doc.id, 'TRANSMITTED', 'Dispatched to recipient')}
                    className="wf-btn text-xs"
                  >
                    [ Mark as Transmitted ]
                  </button>
                  <button
                    onClick={() => onUpdateStatus(doc.id, 'CLOSED', 'Concluded and archived')}
                    className="wf-btn wf-btn-secondary text-xs"
                  >
                    [ Archive Record ]
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="font-mono text-xs font-bold text-[#0F172A]">
                [ IMMUTABLE CUSTODY LOG FOR {doc.controlNumber} ]
              </div>
              <div className="border border-[#94A3B8] rounded divide-y divide-[#CBD5E1]">
                {auditLogs
                  .filter((a) => a.documentId === doc.id)
                  .map((log) => (
                    <div key={log.id} className="p-3 flex items-start justify-between font-mono text-xs">
                      <div>
                        <div className="font-bold text-[#0F172A]">[{log.action}]</div>
                        <div className="text-[#64748B] text-[11px]">
                          [ By: {log.userName} ({log.userRole}) &bull; Note: {log.details} ]
                        </div>
                      </div>
                      <span className="text-[10px] text-[#94A3B8]">
                        [{new Date(log.timestamp).toLocaleString()}]
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'letterhead' && (
            <div className="p-6 border-2 border-dashed border-[#94A3B8] bg-white rounded space-y-6">
              <div className="text-center space-y-1 pb-4 border-b border-[#CBD5E1]">
                <div className="w-12 h-12 border border-dashed border-[#94A3B8] mx-auto flex items-center justify-center font-mono text-[9px] text-[#64748B]">
                  [ SEAL ]
                </div>
                <div className="font-mono text-[10px] text-[#64748B] uppercase">
                  [ REPUBLIC OF THE PHILIPPINES &bull; PROVINCE OF BULACAN ]
                </div>
                <div className="font-mono text-xs font-bold text-[#0F172A]">
                  [ MUNICIPALITY OF SANTA MARIA ]
                </div>
                <div className="font-mono text-[10px] text-[#64748B]">
                  [ OFFICE OF THE MUNICIPAL ADMINISTRATOR ]
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span>[ CONTROL NUMBER: {doc.controlNumber} ]</span>
                  <span>[ DATE: {new Date().toLocaleDateString()} ]</span>
                </div>
                <div>[ MEMORANDUM FOR: {doc.requestingParty} ]</div>
                <div>[ SUBJECT: {doc.title} ]</div>
                <div className="pt-4 border-t border-[#E2E8F0] space-y-2 text-[#475569]">
                  <p>[ 1. Pursuant to statutory regulations and RA 11032, this transaction has been examined and processed. ]</p>
                  <p>[ 2. Official municipal action is hereby registered and authorized in the permanent ledger. ]</p>
                </div>
                <div className="pt-8 flex justify-end">
                  <div className="text-center space-y-1">
                    <div className="w-32 border-b border-[#0F172A] mx-auto" />
                    <div className="font-bold">[ HON. MUNICIPAL MAYOR ]</div>
                    <div className="text-[10px] text-[#64748B]">[ Santa Maria, Bulacan ]</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
