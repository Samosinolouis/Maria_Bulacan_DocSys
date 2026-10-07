'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Paperclip, Loader2, RotateCcw } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useLookups, useAttachmentService } from '@/hooks';
import { REQUEST_CHANNEL_LABELS, REQUEST_PRIORITY_LABELS } from '@/lib/constants';
import { isAppError } from '@/services/contracts/errors';
import type {
  RequestAttachmentKind,
  RequestChannel,
  RequestPriority,
} from '@/services/contracts/models';

interface NewIntakeModalProps {
  onClose: () => void;
  onSubmitted: () => void;
}

const CHANNELS: RequestChannel[] = ['WALK_IN', 'MAIL', 'COURIER', 'EMAIL'];
const PRIORITIES: RequestPriority[] = ['NORMAL', 'HIGH', 'URGENT'];
const ACCEPTED_UPLOADS = 'application/pdf,image/*';

/** One selected file queued for upload after the request is created. */
interface UploadItem {
  kind: RequestAttachmentKind;
  file: File;
}

/** A queued file whose upload failed, kept so it can be retried. */
interface FailedUpload extends UploadItem {
  name: string;
  message: string;
}

export default function NewIntakeModal({ onClose, onSubmitted }: NewIntakeModalProps) {
  const { encodeRequest, lastError, currentUser } = useApp();
  const { uploadRequestAttachment } = useAttachmentService();
  const { data: lookups, isLoading: lookupsLoading, error: lookupsError } = useLookups();

  const requestTypes = lookups?.requestTypes ?? [];

  // Form state (Step 1 reception).
  const [requestTypeId, setRequestTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [requestingParty, setRequestingParty] = useState('');
  const [originOffice, setOriginOffice] = useState('');
  const [channel, setChannel] = useState<RequestChannel>('WALK_IN');
  const [priority, setPriority] = useState<RequestPriority>('NORMAL');

  // Attachment state (Step 1 intake scans).
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [annexFiles, setAnnexFiles] = useState<File[]>([]);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload progress / result. Kept after the request is created so a partial
  // failure never loses the issued control number.
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [createdControlNo, setCreatedControlNo] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);

  const effectiveRequestTypeId = requestTypeId || requestTypes[0]?.id || '';

  /** Upload one file; returns a user-safe message on failure, null on success. */
  const uploadOne = async (
    requestId: string,
    kind: RequestAttachmentKind,
    file: File,
  ): Promise<string | null> => {
    try {
      await uploadRequestAttachment({ requestId, kind, file });
      return null;
    } catch (err) {
      return isAppError(err) ? err.message : 'The file could not be uploaded.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createdRequestId) return;
    setValidationError(null);
    setSubmitFailed(false);

    if (!effectiveRequestTypeId) {
      setValidationError('Select a document or request type before logging.');
      return;
    }
    if (!title.trim() || !requestingParty.trim() || !originOffice.trim()) {
      setValidationError('Please fill in all mandatory administrative fields.');
      return;
    }

    setIsSubmitting(true);
    const created = await encodeRequest({
      requestTypeId: effectiveRequestTypeId,
      title: title.trim(),
      requestingParty: requestingParty.trim(),
      originOffice: originOffice.trim(),
      channel,
      priority,
    });

    if (!created) {
      setIsSubmitting(false);
      setSubmitFailed(true);
      return;
    }

    // The request exists now; upload the scanned letter, then each annex.
    const queue: UploadItem[] = [];
    if (letterFile) queue.push({ kind: 'INCOMING_LETTER', file: letterFile });
    for (const file of annexFiles) queue.push({ kind: 'ANNEX', file });

    if (queue.length === 0) {
      setIsSubmitting(false);
      onSubmitted();
      return;
    }

    setProgress({ done: 0, total: queue.length });
    const failures: FailedUpload[] = [];
    let uploaded = 0;
    for (const item of queue) {
      const message = await uploadOne(created.id, item.kind, item.file);
      if (message) {
        failures.push({ ...item, name: item.file.name, message });
      } else {
        uploaded += 1;
      }
      setProgress((prev) => (prev ? { done: prev.done + 1, total: prev.total } : prev));
    }
    setProgress(null);
    setIsSubmitting(false);

    if (failures.length === 0) {
      onSubmitted();
      return;
    }

    // Keep the created request and report exactly which files failed.
    setCreatedRequestId(created.id);
    setCreatedControlNo(created.controlNo);
    setUploadedCount(uploaded);
    setFailedUploads(failures);
  };

  const handleRetryUploads = async () => {
    if (!createdRequestId || failedUploads.length === 0) return;
    setIsSubmitting(true);
    setProgress({ done: 0, total: failedUploads.length });
    const stillFailed: FailedUpload[] = [];
    let uploaded = uploadedCount;
    for (const item of failedUploads) {
      const message = await uploadOne(createdRequestId, item.kind, item.file);
      if (message) {
        stillFailed.push({ ...item, message });
      } else {
        uploaded += 1;
      }
      setProgress((prev) => (prev ? { done: prev.done + 1, total: prev.total } : prev));
    }
    setProgress(null);
    setIsSubmitting(false);
    setUploadedCount(uploaded);
    setFailedUploads(stillFailed);
    if (stillFailed.length === 0) onSubmitted();
  };

  const errorMessage =
    validationError ??
    lookupsError?.message ??
    (submitFailed
      ? lastError?.message ?? 'Unable to log the request. Please review the fields and try again.'
      : null);

  const totalUploads = uploadedCount + failedUploads.length;

  return (
    <div
      className="fixed inset-0 bg-[#081E36]/75 z-50 flex items-center justify-center p-4 animate-fluid-fade"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[92vh] shadow-2xl border border-[#081E36] overflow-hidden flex flex-col animate-fluid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#081E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#15803D]">
          <div>
            <span className="font-mono text-xs font-bold text-[#FCD116]">
              MODULE A: RECEPTION &amp; INTAKE
            </span>
            <h2 className="font-cinzel text-lg font-bold text-white">
              Log Incoming Document or Request
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-3 bg-[#F0FDF4] border-l-4 border-[#15803D] rounded flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#166534] block">
                Statutory Automated Control Number
              </span>
              <span className="font-mono text-sm font-bold text-[#0F172A]">
                Issued by the registry upon logging
              </span>
            </div>
            <span className="text-[10px] font-mono bg-[#15803D] text-white px-2 py-0.5 rounded font-bold">
              RA 11032 MANDATE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Document or Request Type *
              </label>
              <select
                value={effectiveRequestTypeId}
                onChange={(e) => setRequestTypeId(e.target.value)}
                className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-xs font-semibold focus:outline-none focus:border-[#15803D]"
              >
                {lookupsLoading && requestTypes.length === 0 && (
                  <option value="">Loading request types...</option>
                )}
                {!lookupsLoading && requestTypes.length === 0 && (
                  <option value="">No request types available</option>
                )}
                {requestTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Receiving Channel *
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as RequestChannel)}
                className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-xs font-semibold focus:outline-none focus:border-[#15803D]"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {REQUEST_CHANNEL_LABELS[c] ?? c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Subject Matter or Formal Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Request for Travel Order: Provincial DRRM Quarterly Council Meeting"
              required
              className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Requesting Person or Signatory *
              </label>
              <input
                type="text"
                value={requestingParty}
                onChange={(e) => setRequestingParty(e.target.value)}
                placeholder="e.g. Florian De Leon, LDRRMO IV"
                required
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Originating Department or Office *
              </label>
              <input
                type="text"
                value={originOffice}
                onChange={(e) => setOriginOffice(e.target.value)}
                placeholder="e.g. Municipal Disaster Risk Reduction & Management Office"
                required
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Urgency or Priority Level
            </label>
            <div className="flex gap-4">
              {PRIORITIES.map((p) => (
                <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                    className="accent-[#15803D]"
                  />
                  <span className="font-semibold text-xs text-[#0F172A]">
                    {REQUEST_PRIORITY_LABELS[p] ?? p}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 1 attachments: scanned letter + annexes, uploaded after encode. */}
          <div className="space-y-3 p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded">
            <div className="flex items-center gap-2">
              <Paperclip size={14} className="text-[#15803D]" />
              <h3 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wide">
                Scanned Attachments (Step 1)
              </h3>
            </div>
            <p className="text-[10px] text-[#64748B]">
              Attach the scanned incoming letter and any annexes (PDF or image). They are uploaded
              immediately after the control number is issued.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Incoming Letter (Scan)
              </label>
              <input
                type="file"
                accept={ACCEPTED_UPLOADS}
                disabled={Boolean(createdRequestId)}
                onChange={(e) => setLetterFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-[#0F172A] border border-[#CBD5E1] rounded p-1.5 bg-white file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-[#081E36] file:text-white file:text-xs file:font-semibold file:cursor-pointer disabled:opacity-60"
              />
              {letterFile && (
                <span className="mt-1 block text-[10px] font-mono text-[#15803D]">
                  Selected: {letterFile.name}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">Annexes</label>
              <input
                type="file"
                accept={ACCEPTED_UPLOADS}
                multiple
                disabled={Boolean(createdRequestId)}
                onChange={(e) => setAnnexFiles(Array.from(e.target.files ?? []))}
                className="w-full text-xs text-[#0F172A] border border-[#CBD5E1] rounded p-1.5 bg-white file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-[#081E36] file:text-white file:text-xs file:font-semibold file:cursor-pointer disabled:opacity-60"
              />
              {annexFiles.length > 0 && (
                <span className="mt-1 block text-[10px] font-mono text-[#15803D]">
                  {annexFiles.length} annex file{annexFiles.length > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
          </div>

          {progress && (
            <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#475569] flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#15803D]" />
              <span>
                Uploading attachments {progress.done} of {progress.total}...
              </span>
            </div>
          )}

          {createdRequestId && (
            <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#15803D] mt-0.5 shrink-0" />
                <div className="text-xs text-[#0F172A]">
                  <div className="font-bold">Request logged as {createdControlNo}.</div>
                  <div className="text-[#475569]">
                    {uploadedCount} of {totalUploads} attachment{totalUploads === 1 ? '' : 's'}{' '}
                    uploaded.
                  </div>
                </div>
              </div>

              {failedUploads.length > 0 && (
                <div className="border-t border-[#E2E8F0] pt-2 space-y-1">
                  <div className="text-[11px] font-bold text-[#334155]">
                    Files that failed to upload:
                  </div>
                  <ul className="text-[11px] text-[#475569] space-y-1">
                    {failedUploads.map((item, index) => (
                      <li key={`${item.name}-${index}`} className="flex items-start gap-1.5">
                        <AlertCircle size={12} className="text-[#334155] mt-0.5 shrink-0" />
                        <span>
                          <strong>{item.name}</strong> (
                          {item.kind === 'INCOMING_LETTER' ? 'Incoming letter' : 'Annex'}):{' '}
                          {item.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-[#64748B]">
                    The request already exists. Retry the failed uploads now, or finish and add them
                    later from the dossier.
                  </p>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-[#F1F5F9] border-l-4 border-[#081E36] rounded text-[#0F172A] flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#081E36]" />
              <span className="text-[#475569] text-xs">{errorMessage}</span>
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="pt-4 border-t border-[#CBD5E1] flex items-center justify-between gap-3">
            <div className="text-[10px] text-[#64748B] font-mono">
              Logging officer: {currentUser.fullName}
              {currentUser.title ? ` (${currentUser.title})` : ''}
            </div>

            <div className="flex items-center gap-2">
              {createdRequestId ? (
                <>
                  {failedUploads.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRetryUploads}
                      disabled={isSubmitting}
                      className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1"
                    >
                      {isSubmitting ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RotateCcw size={13} />
                      )}
                      <span>{isSubmitting ? 'Retrying...' : 'Retry Failed Uploads'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onSubmitted}
                    disabled={isSubmitting}
                    className="btn-fluid px-5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 size={16} />
                    <span>Finish and Close</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-fluid px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-fluid px-5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {isSubmitting
                        ? progress
                          ? `Uploading ${progress.done}/${progress.total}...`
                          : 'Logging...'
                        : 'Officially Log and Intake Document'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
