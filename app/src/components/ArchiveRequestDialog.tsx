'use client';

/**
 * Step 6 - close & archive a request (FR-29..31).
 *
 * The single close form for the whole application: the archive desk (`/archive`)
 * and the dossier (`DocumentDetailModal`) both open THIS dialog, so the two
 * paths cannot drift apart. It is portalled to `document.body` because it is
 * always rendered inside another animated/transformed container (the archive
 * view root or the dossier panel), which would otherwise become the containing
 * block for `position: fixed` and clip the overlay.
 *
 * Transmission (Step 5) is optional: the request can be closed and filed as
 * soon as a signed final copy exists, with no dispatch record. The signed final
 * copy itself stays mandatory (FR-29).
 */

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  FileCheck2,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import {
  useAsyncAction,
  useAttachmentService,
  useCan,
  useFolders,
  useRequest,
} from '@/hooks';
import { DOCUMENT_STATUS_META, resolveStatusMeta } from '@/lib/constants';
import { useToast } from '@/providers/ToastProvider';
import { useApp } from '@/providers/AppProvider';
import Portal from '@/components/Portal';
import type { Request } from '@/services/contracts/models';

interface ArchiveRequestDialogProps {
  /** The request being concluded. */
  request: Request;
  /**
   * Destination the owner already knows about (the archive desk passes the
   * folder the clerk is standing in). The clerk can still change it; the dialog
   * falls back to the root-level folders when nothing is preselected.
   */
  defaultFolderId?: string | null;
  /** Display label for `defaultFolderId` when it is a nested folder. */
  defaultFolderLabel?: string | null;
  /**
   * Document the signed final copy is attached to. The dossier passes the
   * document the clerk selected; the desk leaves it out (first output document).
   */
  documentId?: string | null;
  onClose: () => void;
  /** Fired after a successful close so the owner can refresh its listings. */
  onClosed?: () => void;
}

export default function ArchiveRequestDialog({
  request,
  defaultFolderId = null,
  defaultFolderLabel = null,
  documentId = null,
  onClose,
  onClosed,
}: ArchiveRequestDialogProps) {
  const { closeRequest, refreshCounts, lastError } = useApp();
  const toast = useToast();

  // Fresh detail: the desk hands over a list row (no documents), the dossier a
  // full request. Both land on the same cache entry.
  const { data: detail, isLoading } = useRequest(request.id);
  const dossier = detail ?? request;
  const documents = dossier.documents ?? [];

  const { data: rootFolders } = useFolders(null);
  const { uploadDocumentAttachment } = useAttachmentService();
  const uploadFinalAction = useAsyncAction(uploadDocumentAttachment);
  const canUpload = useCan('AttachmentService:Upload');

  const [folderId, setFolderId] = useState(defaultFolderId ?? '');
  const [notes, setNotes] = useState('');
  const [uploadedFinalId, setUploadedFinalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const attachmentRows = documents.flatMap((doc) =>
    (doc.attachments ?? []).map((att) => ({ att, doc })),
  );
  const existingSignedFinal =
    attachmentRows.find((row) => row.att.kind === 'SIGNED_FINAL') ?? null;
  const finalAttachmentId = uploadedFinalId ?? existingSignedFinal?.att.id ?? null;
  const finalName =
    attachmentRows.find((row) => row.att.id === finalAttachmentId)?.att.originalName ?? null;

  const uploadTargetId = documentId ?? documents[0]?.id ?? null;

  const folderOptions = useMemo(() => {
    const rows = (rootFolders ?? []).map((folder) => ({ id: folder.id, label: folder.path }));
    if (defaultFolderId && !rows.some((row) => row.id === defaultFolderId)) {
      rows.unshift({ id: defaultFolderId, label: defaultFolderLabel ?? defaultFolderId });
    }
    return rows;
  }, [rootFolders, defaultFolderId, defaultFolderLabel]);

  const handleFinalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (!uploadTargetId) {
      setError('No linked document is available to attach the signed final copy.');
      return;
    }
    setError(null);
    const uploaded = await uploadFinalAction.run({
      documentId: uploadTargetId,
      kind: 'SIGNED_FINAL',
      file,
    });
    if (uploaded) {
      setUploadedFinalId(uploaded.id);
      toast.success('Signed final copy attached.');
    } else {
      const message =
        uploadFinalAction.getError()?.message ?? 'Unable to upload the signed final copy.';
      setError(message);
      toast.error(message);
    }
  };

  const runClose = async () => {
    if (!finalAttachmentId) {
      setError(
        'A signed final copy is required before closing this request. Attach it above, then close.',
      );
      return;
    }
    setBusy(true);
    setError(null);
    const result = await closeRequest({
      requestId: dossier.id,
      finalAttachmentId,
      folderId: folderId ? folderId : null,
      notes: notes.trim() ? notes.trim() : null,
    });
    setBusy(false);
    if (result) {
      refreshCounts();
      onClosed?.();
      onClose();
    } else {
      setError(lastError?.message ?? 'The request could not be archived. Please try again.');
    }
  };

  const destinationLabel =
    folderOptions.find((row) => row.id === folderId)?.label ?? 'Unfiled (archive root)';

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-[#081E36]/40 p-4 overflow-y-auto"
        onClick={(e) => {
          // Portalled children still bubble through the React tree: without
          // this the click would also close the dossier underneath.
          e.stopPropagation();
          onClose();
        }}
      >
        <div
          className="w-full max-w-lg my-auto bg-white rounded-lg border border-[#CBD5E1] shadow-xl overflow-hidden animate-fluid-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 bg-[#081E36] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive size={15} className="text-[#86EFAC]" />
              <span className="font-cinzel text-sm font-bold">ARCHIVE &amp; CLOSE REQUEST</span>
            </div>
            <button
              onClick={onClose}
              className="text-[#CBD5E1] hover:text-white cursor-pointer"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-4 space-y-4 text-xs">
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1 text-[11px] text-[#475569]">
              <div>
                Request:{' '}
                <strong className="font-mono text-[#081E36]">{dossier.controlNo}</strong> -{' '}
                {dossier.title}
              </div>
              <div>
                Destination folder: <strong className="text-[#081E36]">{destinationLabel}</strong>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-4">
                <Loader2 size={16} className="animate-spin inline-block text-[#081E36]" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider">
                  Output documents
                </div>
                <div className="border border-[#CBD5E1] rounded divide-y divide-[#E2E8F0]">
                  {documents.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-[#64748B]">
                      This request has no linked document.
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="px-3 py-2 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#081E36]">
                          {doc.controlNo}
                        </span>
                        <span className="text-[11px] text-[#475569]">
                          {resolveStatusMeta(DOCUMENT_STATUS_META, doc.status).label}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider">
                  Final signed copy (FR-29)
                </div>
                {finalAttachmentId ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#166534]">
                    <FileCheck2 size={13} className="shrink-0" />
                    <span className="truncate">
                      {finalName ?? 'Signed final copy attached'}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#475569] flex items-start gap-1.5">
                    <FileText size={13} className="shrink-0 mt-0.5" />
                    <span>
                      No signed final copy is attached to this request. Upload it to close the
                      file.
                    </span>
                  </div>
                )}
                {canUpload && (
                  <label className="btn-fluid inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer">
                    {uploadFinalAction.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    <span>
                      {finalAttachmentId ? 'Replace signed final copy' : 'Attach signed final copy'}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      disabled={uploadFinalAction.isPending || !uploadTargetId}
                      onChange={handleFinalFile}
                    />
                  </label>
                )}

                <div className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider">
                  Archive folder
                </div>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] bg-white text-[#0F172A]"
                >
                  <option value="">Unfiled (archive root)</option>
                  {folderOptions.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Archival notes (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='e.g. "filed with the 2026 executive orders"'
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A]"
              />
            </div>

            {error && (
              <div className="p-3 bg-[#F1F5F9] border border-[#334155] rounded text-xs font-semibold text-[#0F172A] flex items-start gap-1.5">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="px-4 pb-4 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] text-[#64748B] max-w-[16rem]">
              Closing marks the request CLOSED and every output document read-only. Transmission is
              optional.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runClose()}
                disabled={busy || isLoading || !finalAttachmentId}
                title={
                  finalAttachmentId
                    ? `Close ${dossier.controlNo} and file it into "${destinationLabel}"`
                    : 'A signed final copy is required before closing (FR-29)'
                }
                className="px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {busy ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Archive size={12} />
                )}
                <span>{busy ? 'Archiving...' : 'Archive & close'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
