'use client';

import React from 'react';
import Image from 'next/image';
import { Printer, Download, Eye, X } from 'lucide-react';
import { DocumentRecord, DocumentType } from '@/lib/types';

interface OfficialWordDocumentProps {
  document: DocumentRecord;
  onClose?: () => void;
  showToolbar?: boolean;
}

export default function OfficialWordDocument({
  document: doc,
  onClose,
  showToolbar = true,
}: OfficialWordDocumentProps) {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(doc.dateReceived || Date.now()).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Determine official title and layout style based on document type
  const isExecutiveOrder = doc.type === 'EXECUTIVE_ORDER';
  const isTravelOrder = doc.type === 'TRAVEL_ORDER';
  const isMemorandum = doc.type === 'MEMO_ORDER' || doc.type === 'INCOMING';
  const isEndorsement = doc.type === 'SB_ENDORSEMENT' || doc.type === 'ENDORSEMENT' || doc.type === 'ENDORSEMENT_LETTER';
  const isPermit = doc.type === 'CERTIFICATION_PERMIT' || doc.type === 'PERMIT';

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
              {doc.controlNumber}
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

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-fluid p-1.5 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer"
                title="Close Word Preview"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* The Printable Word Document Paper Substrate */}
      <div className="printable-word-document bg-white text-black mx-auto p-12 sm:p-16 max-w-[840px] min-h-[1100px] shadow-2xl border border-[#CBD5E1] rounded relative font-serif-word">
        
        {/* ========================================================================= */}
        {/* REPUBLIC OF THE PHILIPPINES OFFICIAL DUAL-SEAL LETTERHEAD */}
        {/* ========================================================================= */}
        <header className="letterhead-header border-b-2 border-black pb-2 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left Seal: Bagong Pilipinas Official Seal (per user specification) */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              <img
                src="/assets/bagong-pilipinas-logo.webp"
                alt="Bagong Pilipinas Official Seal"
                className="w-18 h-18 object-contain"
              />
            </div>

            {/* Central Masthead (Standard National/Municipal Letterhead Formula) */}
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

            {/* Right Seal: Bayan ng Santa Maria */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              <img
                src="/assets/santa-maria-seal.png"
                alt="Official Seal of the Municipality of Santa Maria, Bulacan"
                className="w-18 h-18 object-contain"
              />
            </div>
          </div>

          {/* Authentic Word Government Double-Rule Divider */}
          <div className="mt-3 border-t-2 border-black pt-[1.5px] border-b-[0.5px] border-black" />
        </header>

        {/* ========================================================================= */}
        {/* DOCUMENT METADATA / FORMAL MEMO OR ORDER HEADER */}
        {/* ========================================================================= */}
        <section className="mb-6">
          {isExecutiveOrder ? (
            /* EXECUTIVE ORDER HEADER */
            <div className="text-center space-y-1 mb-8">
              <h2 className="text-[14pt] font-bold tracking-wider uppercase font-serif">
                EXECUTIVE ORDER NO. {doc.controlNumber.replace(/[^0-9-]/g, '') || '2026-024'}
              </h2>
              <p className="text-[11pt] italic font-serif">Series of 2026</p>
              <div className="pt-4 max-w-xl mx-auto">
                <h3 className="text-[12pt] font-bold uppercase tracking-wide leading-snug font-serif underline decoration-1 underline-offset-4">
                  {doc.title}
                </h3>
              </div>
            </div>
          ) : isMemorandum ? (
            /* FORMAL MEMORANDUM FORMAT (TO / FROM / DATE / SUBJECT) */
            <div className="border-b border-black pb-4 mb-6 text-[11pt] space-y-2 font-serif">
              <div className="text-center font-bold text-[13pt] uppercase tracking-wider mb-4">
                MEMORANDUM CIRCULAR
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2 font-bold uppercase tracking-wider">TO</div>
                <div className="col-span-1 font-bold">:</div>
                <div className="col-span-9 font-bold uppercase">
                  {doc.requestingParty || 'ALL CONCERNED OFFICES AND PERSONNEL'}
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
                <div className="col-span-9 font-bold uppercase leading-snug">
                  {doc.title}
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2 text-[10pt] font-mono text-neutral-600">
                <div className="col-span-2 font-bold uppercase tracking-wider font-serif">DOCKET NO.</div>
                <div className="col-span-1 font-bold">:</div>
                <div className="col-span-9">{doc.controlNumber}</div>
              </div>
            </div>
          ) : isTravelOrder ? (
            /* TRAVEL ORDER HEADER */
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-[14pt] font-bold tracking-widest uppercase font-serif">
                OFFICIAL TRAVEL ORDER
              </h2>
              <div className="font-mono text-[11pt] font-bold text-neutral-800">
                NO. {doc.controlNumber}
              </div>
              <div className="text-[10pt] text-neutral-700 italic pt-1">
                Date: {formattedDate}
              </div>
            </div>
          ) : isEndorsement ? (
            /* 1st INDORSEMENT HEADER */
            <div className="mb-6 text-[11pt] font-serif space-y-1">
              <div className="font-bold text-[13pt] uppercase tracking-wider">
                1st INDORSEMENT
              </div>
              <div className="text-neutral-700 italic">{formattedDate}</div>
              <div className="font-mono text-[10pt] text-neutral-600">
                Control Reference: {doc.controlNumber}
              </div>
            </div>
          ) : (
            /* GENERAL CIVIL SERVICE ISSUANCE */
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3 mb-6 text-[10pt] font-mono">
              <div>
                <span className="font-bold">CONTROL NO.:</span> {doc.controlNumber}
              </div>
              <div>
                <span className="font-bold">DATE:</span> {formattedDate}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* FORMAL DOCUMENT BODY (JUSTIFIED, 1.5 LINE SPACING, TIMES NEW ROMAN) */}
        {/* ========================================================================= */}
        <main className="document-provisions-body text-[11pt] leading-[1.65] text-justify font-serif text-black space-y-4">
          {doc.draftContent ? (
            doc.draftContent.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="indent-8 text-justify">
                {paragraph}
              </p>
            ))
          ) : (
            <>
              <p className="indent-8 text-justify">
                Pursuant to Section 444 of Republic Act No. 7160 (The Local Government Code of 1991) and the statutory mandates of the Municipality of Santa Maria, Bulacan, notice is hereby officially served regarding the herein captioned matter: <strong>{doc.title}</strong>.
              </p>
              <p className="indent-8 text-justify">
                All concerned municipal departments, division heads, and operating units are strictly directed to coordinate their operations in conformity with standard civil service guidelines and Republic Act No. 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018).
              </p>
              <p className="indent-8 text-justify">
                This document shall take effect immediately upon counter-signature and transmittal to the receiving repository.
              </p>
            </>
          )}

          {/* Endorsement Directive Note (if endorsed) */}
          {doc.endorsementNotes && (
            <div className="my-6 p-4 border border-black bg-neutral-50 text-[10.5pt] rounded-none">
              <div className="font-bold uppercase tracking-wider mb-1 text-[10pt]">
                Official Executive Directive / Endorsement Instructions:
              </div>
              <p className="italic text-neutral-800">{doc.endorsementNotes}</p>
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* OFFICIAL SIGNATORY BLOCKS (WITH GENUINE PHILIPPINE GOVERNMENT POSITIONS) */}
        {/* ========================================================================= */}
        <footer className="signatory-block mt-16 pt-6 font-serif">
          {isExecutiveOrder ? (
            /* Executive Order Signatory (Mayor + Administrator Concurrence) */
            <div className="space-y-12">
              <div className="text-right">
                <div className="text-[11pt] mb-14">
                  Done in the Municipality of Santa Maria, Bulacan, this {new Date().getDate()}th day of{' '}
                  {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}.
                </div>
                <div className="inline-block text-center w-72">
                  <div className="font-bold text-[12pt] uppercase tracking-wider border-b border-black pb-1">
                    HON. BARTOLOME
                  </div>
                  <div className="text-[10pt] font-sans text-neutral-700 mt-1">
                    Municipal Mayor
                  </div>
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
          ) : isTravelOrder ? (
            /* Travel Order Signatory Block */
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div>
                <div className="text-[10pt] text-neutral-600 uppercase font-sans mb-12">
                  Recommending Approval:
                </div>
                <div className="font-bold text-[11pt] uppercase tracking-wider border-b border-black pb-1 inline-block min-w-[220px]">
                  {doc.requestingParty || 'MR. FLORIAN DE LEON'}
                </div>
                <div className="text-[9pt] text-neutral-700 font-sans mt-0.5">
                  Administrative Officer IV
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10pt] text-neutral-600 uppercase font-sans mb-12">
                  Approved by Authority of the Mayor:
                </div>
                <div className="font-bold text-[11pt] uppercase tracking-wider border-b border-black pb-1 inline-block min-w-[240px] text-center">
                  ENGR. ELMER B. CLEMENTE
                </div>
                <div className="text-[9pt] text-neutral-700 font-sans mt-0.5 text-center">
                  Municipal Administrator
                </div>
              </div>
            </div>
          ) : (
            /* General Office Issuance Signatory */
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

          {/* ========================================================================= */}
          {/* STATUTORY ARTA RA 11032 TRACKING FOOTER */}
          {/* ========================================================================= */}
          <div className="mt-16 pt-3 border-t border-neutral-400 flex items-center justify-between text-[8pt] text-neutral-600 font-mono tracking-tight">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-black" />
              <span>DOCKET CONTROL: {doc.controlNumber}</span>
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
