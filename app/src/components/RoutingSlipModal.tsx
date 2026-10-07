'use client';

import Image from 'next/image';
import { X, Printer } from 'lucide-react';
import { DOCUMENT_STATUS_META, REQUEST_PRIORITY_LABELS } from '@/lib/constants';
import type { Request } from '@/services/contracts/models';

interface RoutingSlipModalProps {
  request: Request;
  onClose: () => void;
}

export default function RoutingSlipModal({ request, onClose }: RoutingSlipModalProps) {
  const documents = request.documents ?? [];
  const priorityLabel = REQUEST_PRIORITY_LABELS[request.priority] ?? request.priority;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 bg-[#081E36]/80 z-60 flex items-center justify-center p-4 animate-fluid-fade printable-modal-container"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#081E36] overflow-hidden animate-fluid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Header */}
        <div className="no-print bg-[#081E36] text-white px-5 py-3 flex items-center justify-between border-b-2 border-[#15803D]">
          <span className="font-bold text-xs uppercase tracking-wider text-white">
            Official Transmittal & Routing Slip - Printable Dossier
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#FCD116] hover:bg-[#FACC15] text-[#081E36] font-bold text-xs rounded cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Physical Paper Substrate */}
        <div className="printable-routing-slip p-8 overflow-y-auto flex-1 bg-white text-[#0F172A] font-serif-docket text-xs">
          {/* Official Letterhead */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <div className="relative w-14 h-14 shrink-0">
              <Image
                src="/assets/santa-maria-seal.png"
                alt="Santa Maria Seal"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>

            <div className="text-center flex-1 px-4">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#15803D]">
                Republic of the Philippines - Province of Bulacan
              </div>
              <div className="font-cinzel text-base font-bold text-[#081E36]">
                MUNICIPALITY OF SANTA MARIA
              </div>
              <div className="text-xs font-bold text-[#0F172A]">
                OFFICE OF THE MUNICIPAL ADMINISTRATOR
              </div>
              <div className="font-mono text-[10px] font-bold tracking-wider text-[#081E36] mt-0.5">
                DOCUMENT ROUTING & TRANSMITTAL SLIP
              </div>
            </div>

            <div className="relative h-12 w-auto shrink-0">
              <Image
                src="/assets/bagong-pilipinas-logo.webp"
                alt="Bagong Pilipinas Official Seal"
                width={48}
                height={48}
                className="object-contain h-12 w-auto"
              />
            </div>
          </div>

          {/* Reference Meta Table */}
          <table className="w-full border-collapse border border-black mb-4 font-sans text-xs">
            <tbody>
              <tr>
                <td className="border border-black p-2 bg-[#F1F5F9] font-bold w-1/3 text-[11px] uppercase">
                  Control Number:
                </td>
                <td className="border border-black p-2 font-mono font-bold text-[#081E36]">
                  {request.controlNo}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 bg-[#F1F5F9] font-bold text-[11px] uppercase">
                  Subject Matter:
                </td>
                <td className="border border-black p-2 font-semibold">{request.title}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 bg-[#F1F5F9] font-bold text-[11px] uppercase">
                  Originating Office / Party:
                </td>
                <td className="border border-black p-2">
                  {request.originOffice} ({request.requestingParty})
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 bg-[#F1F5F9] font-bold text-[11px] uppercase">
                  Priority:
                </td>
                <td className="border border-black p-2 font-semibold">{priorityLabel}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 bg-[#F1F5F9] font-bold text-[11px] uppercase">
                  Date & Time Received:
                </td>
                <td className="border border-black p-2 font-mono">
                  {new Date(request.receivedAt).toLocaleString('en-PH')}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 bg-[#F1F5F9] font-bold text-[11px] uppercase">
                  RA 11032 SLA Processing Target:
                </td>
                <td className="border border-black p-2 font-bold text-[#15803D]">
                  3 Working Days (Due:{' '}
                  {new Date(request.slaDeadline).toLocaleDateString('en-PH')})
                </td>
              </tr>
            </tbody>
          </table>

          {/* Linked Documents */}
          <div className="border border-black p-3 mb-4 font-sans">
            <div className="font-bold text-[11px] uppercase mb-2 text-[#081E36]">
              Linked Issuances & Documents ({documents.length}):
            </div>
            {documents.length === 0 ? (
              <p className="text-[11px] italic text-[#64748B]">
                No output documents are linked to this request.
              </p>
            ) : (
              <table className="w-full border-collapse border border-black text-[11px]">
                <thead>
                  <tr className="bg-[#F1F5F9]">
                    <th className="border border-black p-1.5 text-left uppercase">Control No.</th>
                    <th className="border border-black p-1.5 text-left uppercase">Title</th>
                    <th className="border border-black p-1.5 text-left uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="border border-black p-1.5 font-mono">{doc.controlNo}</td>
                      <td className="border border-black p-1.5">{doc.title}</td>
                      <td className="border border-black p-1.5">
                        {DOCUMENT_STATUS_META[doc.status]?.label ?? doc.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Directives Checkbox Grid */}
          <div className="border border-black p-3 mb-4 font-sans">
            <div className="font-bold text-[11px] uppercase mb-2 text-[#081E36]">
              Action Directives from the Municipal Administrator:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-black" />
                <span>For Appropriate Action</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-black" />
                <span>For Review & Recommendation</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-black" />
                <span>For Preparation of Executive Order / Indorsement</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-black" />
                <span>For Endorsement to Sangguniang Bayan</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-black" />
                <span>For Coordination / Schedule Venue</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-black" />
                <span>For File & Archive</span>
              </label>
            </div>
          </div>

          {/* Specific Routing Notes */}
          <div className="border border-black p-3 min-h-[90px] mb-6">
            <div className="font-sans font-bold text-[11px] uppercase text-[#64748B] mb-1">
              Remarks / Specific Instructions:
            </div>
            <p className="italic text-xs">
              Please evaluate compliance with municipal ordinances and report status within
              statutory SLA.
            </p>
          </div>

          {/* Signature Authority Box */}
          <div className="flex justify-between items-end pt-4 border-t border-black font-sans">
            <div>
              <div className="text-[10px] text-[#64748B]">Issued By Records Section:</div>
              <div className="font-bold text-xs">Sherelyn O. Libao</div>
              <div className="text-[10px] text-[#64748B]">Administrative Aide VI</div>
            </div>

            <div className="text-center w-60">
              <div className="text-[10px] text-[#64748B] mb-8">Authorized Endorsement:</div>
              <div className="border-t border-black pt-1 font-bold text-xs">
                ENGR. ELMER B. CLEMENTE
              </div>
              <div className="text-[10px] text-[#64748B]">Municipal Administrator</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
