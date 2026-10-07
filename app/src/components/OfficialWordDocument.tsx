'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import {
  DOCUMENT_STATUS_META,
  REQUEST_CHANNEL_LABELS,
  REQUEST_PRIORITY_LABELS,
  REQUEST_STATUS_META,
  resolveStatusMeta,
} from '@/lib/constants';
import type { Request } from '@/services/contracts/models';

interface OfficialWordDocumentProps {
  request: Request;
  onClose: () => void;
  showToolbar?: boolean;
}

/**
 * Official-letterhead preview. The backend stores no draft body, so the request
 * summary (and its first document, when present) is rendered as the provisions.
 */
export default function OfficialWordDocument({
  request,
  onClose,
  showToolbar = true,
}: OfficialWordDocumentProps) {
  const handlePrint = () => {
    window.print();
  };

  const documents = request.documents ?? [];
  const primary = documents[0] ?? null;
  const controlNo = primary?.controlNo ?? request.controlNo;
  const title = primary?.title ?? request.title;

  const typeCode = (
    primary?.documentType?.code ??
    request.requestType?.code ??
    ''
  ).toUpperCase();
  const isExecutiveOrder = typeCode.includes('EXEC');
  const isMemorandum = typeCode.includes('MEMO') || typeCode.includes('INCOMING');

  const formattedDate = new Date(request.receivedAt).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const requestMeta = resolveStatusMeta(REQUEST_STATUS_META, request.status);
  const priorityLabel = REQUEST_PRIORITY_LABELS[request.priority] ?? request.priority;
  const channelLabel = REQUEST_CHANNEL_LABELS[request.channel] ?? request.channel;

  return (
    <div className="word-document-wrapper w-full">
      {/* Screen-Only Toolbar Controls (Strictly Hidden on Print) */}
      {showToolbar && (
        <div className="no-print mb-4 p-3 bg-[#081E36] text-white rounded-lg shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Official Executive Issuance - Microsoft Word Print Layout
            </span>
            <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded text-white/90">
              {controlNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-fluid px-4 py-1.5 bg-[#FCD116] hover:bg-[#FACC15] text-[#081E36] font-bold text-xs rounded shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              title="Print Word Document (A4/Letter Margins)"
            >
              <Printer size={15} />
              <span>Print Word Document</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-fluid p-1.5 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer"
              title="Close Word Preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* The Printable Word Document Paper Substrate */}
      <div className="printable-word-document bg-white text-black mx-auto p-12 sm:p-16 max-w-[840px] min-h-[1100px] shadow-2xl border border-[#CBD5E1] rounded relative font-serif-word">
        {/* REPUBLIC OF THE PHILIPPINES OFFICIAL DUAL-SEAL LETTERHEAD */}
        <header className="letterhead-header border-b-2 border-black pb-2 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              <img
                src="/assets/bagong-pilipinas-logo.webp"
                alt="Bagong Pilipinas Official Seal"
                className="w-18 h-18 object-contain"
              />
            </div>

            <div className="text-center flex-1 px-2 space-y-0.5">
              <div className="text-[11pt] tracking-wide text-neutral-800 uppercase font-normal font-serif">
                Republic of the Philippines
              </div>
              <div className="text-[11pt] tracking-wide text-neutral-800 uppercase font-normal font-serif">
                Province of Bulacan
              </div>
              <div className="text-[13pt] tracking-wider font-bold uppercase text-[#081E36] font-serif">
                MUNICIPALITY OF SANTA MARIA
              </div>
              <div className="text-[11.5pt] font-bold tracking-wide text-black uppercase font-serif">
                {isExecutiveOrder
                  ? 'OFFICE OF THE MUNICIPAL MAYOR'
                  : 'OFFICE OF THE MUNICIPAL ADMINISTRATOR'}
              </div>
              <div className="text-[9pt] text-neutral-600 font-sans tracking-tight">
                Municipal Hall Compound, Poblacion, Santa Maria, Bulacan 3022
              </div>
              <div className="text-[8.5pt] text-neutral-600 font-sans tracking-tight">
                Tel. No.: (044) 815-2000 | Email: smb.maoffice@gmail.com
              </div>
            </div>

            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              <img
                src="/assets/santa-maria-seal.png"
                alt="Official Seal of the Municipality of Santa Maria, Bulacan"
                className="w-18 h-18 object-contain"
              />
            </div>
          </div>

          <div className="mt-3 border-t-2 border-black pt-[1.5px] border-b-[0.5px] border-black" />
        </header>

        {/* DOCUMENT METADATA / FORMAL HEADER */}
        <section className="mb-6">
          {isExecutiveOrder ? (
            <div className="text-center space-y-1 mb-8">
              <h2 className="text-[14pt] font-bold tracking-wider uppercase font-serif">
                EXECUTIVE ORDER NO. {controlNo.replace(/[^0-9-]/g, '') || '2026-001'}
              </h2>
              <p className="text-[11pt] italic font-serif">Series of 2026</p>
              <div className="pt-4 max-w-xl mx-auto">
                <h3 className="text-[12pt] font-bold uppercase tracking-wide leading-snug font-serif underline decoration-1 underline-offset-4">
                  {title}
                </h3>
              </div>
            </div>
          ) : isMemorandum ? (
            <div className="border-b border-black pb-4 mb-6 text-[11pt] space-y-2 font-serif">
              <div className="text-center font-bold text-[13pt] uppercase tracking-wider mb-4">
                MEMORANDUM CIRCULAR
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2 font-bold uppercase tracking-wider">TO</div>
                <div className="col-span-1 font-bold">:</div>
                <div className="col-span-9 font-bold uppercase">
                  {request.requestingParty || 'ALL CONCERNED OFFICES AND PERSONNEL'}
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2 font-bold uppercase tracking-wider">FROM</div>
                <div className="col-span-1 font-bold">:</div>
                <div className="col-span-9 font-bold uppercase">
                  ENGR. ELMER B. CLEMENTE, Municipal Administrator
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2 font-bold uppercase tracking-wider">DATE</div>
                <div className="col-span-1 font-bold">:</div>
                <div className="col-span-9">{formattedDate}</div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2 font-bold uppercase tracking-wider">SUBJECT</div>
                <div className="col-span-1 font-bold">:</div>
                <div className="col-span-9 font-bold uppercase leading-snug">{title}</div>
              </div>
              <div className="grid grid-cols-12 gap-2 text-[10pt] font-mono text-neutral-600">
                <div className="col-span-2 font-bold uppercase tracking-wider font-serif">
                  DOCKET NO.
                </div>
                <div className="col-span-1 font-bold">:</div>
                <div className="col-span-9">{controlNo}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3 mb-6 text-[10pt] font-mono">
              <div>
                <span className="font-bold">CONTROL NO.:</span> {controlNo}
              </div>
              <div>
                <span className="font-bold">DATE:</span> {formattedDate}
              </div>
            </div>
          )}
        </section>

        {/* FORMAL DOCUMENT BODY - REQUEST SUMMARY */}
        <main className="document-provisions-body text-[11pt] leading-[1.65] text-justify font-serif text-black space-y-4">
          <p className="indent-8 text-justify">
            Pursuant to Section 444 of Republic Act No. 7160 (The Local Government Code of 1991) and
            the statutory mandates of the Municipality of Santa Maria, Bulacan, notice is hereby
            officially served regarding the herein captioned matter: <strong>{title}</strong>.
          </p>

          <div className="my-6 border border-black p-4 text-[10.5pt] space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-[10pt] mb-1">
              Request Summary
            </div>
            <div>
              <span className="font-bold">Requesting Party:</span> {request.requestingParty}
            </div>
            <div>
              <span className="font-bold">Originating Office:</span> {request.originOffice}
            </div>
            <div>
              <span className="font-bold">Channel / Priority:</span> {channelLabel} / {priorityLabel}
            </div>
            <div>
              <span className="font-bold">Date Received:</span> {formattedDate}
            </div>
            <div>
              <span className="font-bold">SLA Deadline:</span>{' '}
              {new Date(request.slaDeadline).toLocaleDateString('en-PH')}
            </div>
            <div>
              <span className="font-bold">Request Status:</span> {requestMeta.label}
            </div>
          </div>

          {documents.length > 0 && (
            <table className="w-full border-collapse border border-black text-[10pt]">
              <thead>
                <tr className="bg-neutral-100">
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

          <p className="indent-8 text-justify">
            All concerned municipal departments, division heads, and operating units are strictly
            directed to coordinate their operations in conformity with standard civil service
            guidelines and Republic Act No. 11032 (Ease of Doing Business and Efficient Government
            Service Delivery Act of 2018).
          </p>
          <p className="indent-8 text-justify">
            This document shall take effect immediately upon counter-signature and transmittal to the
            receiving repository.
          </p>
        </main>

        {/* OFFICIAL SIGNATORY BLOCKS */}
        <footer className="signatory-block mt-16 pt-6 font-serif">
          {isExecutiveOrder ? (
            <div className="space-y-12">
              <div className="text-right">
                <div className="text-[11pt] mb-14">
                  Done in the Municipality of Santa Maria, Bulacan, this {new Date().getDate()}th day
                  of {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}.
                </div>
                <div className="inline-block text-center w-72">
                  <div className="font-bold text-[12pt] uppercase tracking-wider border-b border-black pb-1">
                    HON. BARTOLOME
                  </div>
                  <div className="text-[10pt] font-sans text-neutral-700 mt-1">Municipal Mayor</div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-300 flex items-end justify-between text-[10pt]">
                <div>
                  <div className="text-[9pt] uppercase tracking-wider text-neutral-500 font-sans">
                    Attested and Counter-signed:
                  </div>
                  <div className="font-bold uppercase tracking-wider mt-6 border-b border-black pb-0.5 inline-block">
                    ENGR. ELMER B. CLEMENTE
                  </div>
                  <div className="text-[9pt] text-neutral-700 font-sans">
                    Municipal Administrator
                  </div>
                </div>

                <div className="text-right font-mono text-[8pt] text-neutral-500">
                  Seal of Office / Dry Seal Here
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-end pt-8">
              <div className="text-center w-72">
                <div className="text-[10.5pt] text-neutral-700 mb-14 text-left pl-6">
                  Respectfully submitted / ordered,
                </div>
                <div className="font-bold text-[11.5pt] uppercase tracking-wider border-b border-black pb-1">
                  ENGR. ELMER B. CLEMENTE
                </div>
                <div className="text-[9.5pt] text-neutral-800 font-sans mt-1">
                  Municipal Administrator
                </div>
                <div className="text-[8.5pt] text-neutral-500 font-sans">
                  Office of the Municipal Administrator
                </div>
              </div>
            </div>
          )}

          {/* STATUTORY ARTA RA 11032 TRACKING FOOTER */}
          <div className="mt-16 pt-3 border-t border-neutral-400 flex items-center justify-between text-[8pt] text-neutral-600 font-mono tracking-tight">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-black" />
              <span>DOCKET CONTROL: {controlNo}</span>
              <span>|</span>
              <span>RA 11032 COMPLIANT (3-DAY SLA)</span>
            </div>
            <div>
              <span>MUNICIPALITY OF SANTA MARIA, BULACAN</span>
              <span> | </span>
              <span>PAGE 1 OF 1</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
