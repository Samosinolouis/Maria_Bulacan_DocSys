'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  Folder,
  FolderOpen,
  FolderPlus,
  FileText,
  ChevronRight,
  Home,
  Loader2,
  Plus,
  RotateCcw,
  Archive,
  Eye,
} from 'lucide-react';
import {
  useFolders,
  useFolderDocuments,
  useDocumentTypes,
  useFolderService,
  useAsyncAction,
  useCan,
  useRequests,
  useRequestService,
} from '@/hooks';
import { DOCUMENT_STATUS_META, REQUEST_STATUS_META, resolveStatusMeta } from '@/lib/constants';
import { useToast } from '@/providers/ToastProvider';
import { useApp } from '@/providers/AppProvider';
import Portal from '@/components/Portal';
import ArchiveRequestDialog from '@/components/ArchiveRequestDialog';
import type { Document, Request } from '@/services/contracts/models';
import type { Folder as FolderNode } from '@/services/contracts/report';
import HighlightMatch from '@/components/HighlightMatch';

/**
 * Requests that belong on the pending-archival desk (FR-30): concluded
 * (approved, endorsed, denied) or already dispatched. Transmission (Step 5) is
 * optional, so a fulfilled request is filed without a dispatch record - the desk
 * must not wait for one. This is the same set the `DocumentService:Close` guard
 * admits (`authz/policy.ts`), so every row offered here is closable.
 */
const PENDING_ARCHIVAL_STATUSES = ['APPROVED', 'ENDORSED', 'DENIED', 'TRANSMITTED'] as const;

interface Crumb {
  id: string | null;
  name: string;
}

/** Small status chip for archived documents (label + tint from the status meta). */
function StatusChip({ status }: { status: Document['status'] }) {
  const meta = resolveStatusMeta(DOCUMENT_STATUS_META, status);
  const tint =
    status === 'SIGNED' || status === 'APPROVED' || status === 'ENDORSED'
      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
      : status === 'DENIED'
        ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#334155]'
        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]';
  return (
    <span className={`inline-block px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${tint}`}>
      {meta?.label ?? status}
    </span>
  );
}

export default function ArchiveView() {
  const canCreateFolder = useCan('FolderService:Create');
  const { create } = useFolderService();
  const createAction = useAsyncAction(create);
  const toast = useToast();

  // Step 6 (FR-29..31): the clerk files a concluded request here - the action
  // lives on the request row, the destination is the folder they opened.
  const { refreshCounts, setSelectedRequest } = useApp();
  const { getById } = useRequestService();
  // Desk-level gate. The engine denies a guarded action probed WITHOUT a
  // resource, so the check needs a representative one; the backend re-checks
  // the real row on submit (NFR-07).
  const canClose = useCan('DocumentService:Close', {
    kind: 'request',
    attributes: { status: PENDING_ARCHIVAL_STATUSES[0] },
  });
  const canReadRequests = useCan('RequestService:Read');

  // Navigation trail: root (null) -> current folder.
  const [crumbs, setCrumbs] = useState<Crumb[]>([
    { id: null, name: 'Municipal Records Archive' },
  ]);
  const current = crumbs[crumbs.length - 1];

  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: foldersData,
    isLoading: foldersLoading,
    error: foldersError,
    refresh: refreshFolders,
  } = useFolders(current.id);
  const {
    data: docsData,
    isLoading: docsLoading,
    error: docsError,
    refresh: refreshDocs,
  } = useFolderDocuments(current.id, searchQuery);
  const { data: documentTypes } = useDocumentTypes();

  // Concluded requests whose file is not closed yet (FR-29..31). Transmission
  // is optional, so this is a status UNION rather than TRANSMITTED alone.
  const {
    data: pendingData,
    isLoading: pendingLoading,
    refresh: refreshPending,
  } = useRequests({ first: 100, filter: { statusIn: [...PENDING_ARCHIVAL_STATUSES] } });

  const folders = foldersData ?? [];
  const documents = docsData ?? [];
  const pending = pendingData?.edges.map((edge) => edge.node) ?? [];

  const typeName = useMemo(() => {
    const map = new Map((documentTypes ?? []).map((t) => [t.id, t.name]));
    return (id: string) => map.get(id) ?? 'Uncategorized';
  }, [documentTypes]);

  // --- Create-folder dialog -------------------------------------------------
  const [dialog, setDialog] = useState<{ parentId: string | null; parentName: string } | null>(
    null,
  );
  const [folderName, setFolderName] = useState('');

  const openDialog = (parentId: string | null, parentName: string) => {
    createAction.reset();
    setDialog({ parentId, parentName });
    setFolderName('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    const created = await createAction.run({ name: folderName, parentId: dialog.parentId });
    if (created) {
      setDialog(null);
      refreshFolders();
      toast.success(`Folder "${created.name}" created.`);
    } else {
      toast.error(createAction.getError()?.message ?? 'Unable to create the folder.');
    }
  };

  // --- Step 6: archive a concluded request (close + file) -------------------
  // The dialog owns the whole close flow; the desk only decides which request
  // it is open for and refreshes its listings afterwards.
  const [archiveTarget, setArchiveTarget] = useState<Request | null>(null);

  const openArchive = (request: Request) => {
    setArchiveTarget(request);
  };

  const handleArchived = () => {
    refreshDocs();
    refreshFolders();
    refreshPending();
    refreshCounts();
  };

  // --- View dossier: open the full request dossier for an archived record -----
  // Archived rows are Documents; the dossier modal is request-scoped, so resolve
  // the linked request first (a sua sponte EO/MO has none).
  const [dossierBusyId, setDossierBusyId] = useState<string | null>(null);

  const openDocumentDossier = async (doc: Document) => {
    if (!doc.requestId) {
      toast.info('This record was issued without a request, so it has no dossier.');
      return;
    }
    setDossierBusyId(doc.id);
    try {
      const request = await getById(doc.requestId);
      if (request) {
        setSelectedRequest(request);
      } else {
        toast.error('Unable to open the dossier for this record.');
      }
    } catch {
      toast.error('Unable to open the dossier for this record.');
    } finally {
      setDossierBusyId(null);
    }
  };

  // --- Navigation -----------------------------------------------------------
  const openFolder = (folder: FolderNode) => {
    setCrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearchQuery('');
  };

  const goToCrumb = (index: number) => {
    setCrumbs((prev) => prev.slice(0, index + 1));
    setSearchQuery('');
  };

  const isLoading = foldersLoading || docsLoading;
  const listError = foldersError?.message ?? docsError?.message ?? null;
  const atRoot = current.id === null;

  const refreshAll = () => {
    refreshFolders();
    refreshDocs();
    refreshPending();
  };

  return (
    <div className="space-y-4 animate-fluid-tab">
      {/* Module Header */}
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            MODULE F: MUNICIPAL RECORDS ARCHIVE & RETRIEVAL
          </h3>
          <p className="text-xs text-[#64748B]">
            Digitized permanent repository of concluded municipal transactions, resolutions, and orders.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs font-bold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded border border-[#BBF7D0]">
            {folders.length} folder{folders.length === 1 ? '' : 's'}
            {!atRoot && ` \u00B7 ${documents.length} document${documents.length === 1 ? '' : 's'}`}
          </span>
          {canCreateFolder && (
            <button
              onClick={() => openDialog(current.id, current.name)}
              className="btn-fluid px-3 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
              title={atRoot ? 'Create a folder in the archive root' : `Create a folder inside "${current.name}"`}
            >
              <FolderPlus size={13} />
              <span>Add Folder</span>
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb + Refresh */}
      <div className="bg-white rounded border border-[#CBD5E1] px-4 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.id ?? 'root'}-${index}`}>
                {index > 0 && <ChevronRight size={12} className="text-[#94A3B8]" />}
                <button
                  onClick={() => goToCrumb(index)}
                  disabled={isLast}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    isLast
                      ? 'font-bold text-[#081E36] cursor-default'
                      : 'text-[#475569] hover:text-[#081E36] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {index === 0 && <Home size={12} className="shrink-0" />}
                  <span className="truncate max-w-[16rem]">{crumb.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <button
          onClick={refreshAll}
          className="btn-fluid px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
          title="Refresh the archive listing"
        >
          <RotateCcw size={12} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search (inside folders only) */}
      {!atRoot && (
        <div className="bg-white rounded border border-[#CBD5E1] p-3 shadow-sm">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archived documents in this folder by control number or subject..."
              className="w-full pl-8 pr-7 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#081E36] cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {listError && (
        <div className="p-3 bg-white border border-[#334155] rounded text-xs text-[#0F172A] font-semibold flex items-start gap-2">
          <X size={14} className="text-[#334155] shrink-0 mt-0.5" />
          <span>{listError}</span>
        </div>
      )}

      {/* Subfolders */}
      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider flex items-center gap-1.5">
            <Folder size={13} className="text-[#15803D]" />
            <span>{atRoot ? 'Archive Folders' : 'Subfolders'}</span>
          </h4>
          {isLoading && <Loader2 size={13} className="animate-spin text-[#94A3B8]" />}
        </div>

        {folders.length === 0 && !foldersLoading ? (
          <div className="text-center py-8 text-[#64748B] text-xs">
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="font-bold text-sm text-[#081E36]">
                {atRoot ? 'The municipal archive is clear' : 'No subfolders here'}
              </div>
              <p className="text-[11px]">
                {atRoot
                  ? canCreateFolder
                    ? 'Use "Add Folder" to build the records structure. Documents are filed into folders when a request is closed.'
                    : 'Folders are created by personnel holding the FolderService:Create grant.'
                  : 'Create one with the "Add Folder" button above, or file documents here when closing requests.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="municipal-docket-table">
              <thead>
                <tr>
                  <th>Folder</th>
                  <th>Items (one level)</th>
                  <th>Path</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {folders.map((folder) => (
                  <tr key={folder.id}>
                    <td>
                      <button
                        onClick={() => openFolder(folder)}
                        className="flex items-center gap-2 text-left cursor-pointer group"
                        title={`Open folder "${folder.name}"`}
                      >
                        <FolderOpen size={15} className="text-[#081E36] shrink-0" />
                        <span className="font-bold text-xs text-[#0F172A] group-hover:text-[#15803D]">
                          <HighlightMatch text={folder.name} query={searchQuery} />
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] text-[#334155]">
                        {folder.itemCount} item{folder.itemCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[10px] text-[#64748B]">{folder.path}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openFolder(folder)}
                          className="px-2.5 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-[11px] font-semibold cursor-pointer btn-fluid transition-colors"
                        >
                          Open
                        </button>
                        {canCreateFolder && (
                          <button
                            onClick={() => openDialog(folder.id, folder.name)}
                            className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-[11px] font-semibold cursor-pointer btn-fluid transition-colors flex items-center gap-1"
                            title={`Create a folder inside "${folder.name}"`}
                          >
                            <Plus size={11} />
                            <span>New subfolder</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documents in the current folder */}
      {!atRoot && (
        <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={13} className="text-[#15803D]" />
              <span>Archived Documents</span>
            </h4>
            <span className="text-xs text-[#64748B]">
              Retrieved <strong>{documents.length}</strong> archived document
              {documents.length === 1 ? '' : 's'}
              {searchQuery && (
                <span>
                  {' '}
                  matching &quot;<strong>{searchQuery}</strong>&quot;
                </span>
              )}
            </span>
          </div>

          {documents.length === 0 && !docsLoading ? (
            <div className="text-center py-8 text-[#64748B] text-xs">
              <div className="space-y-1.5 max-w-md mx-auto">
                <div className="font-bold text-sm text-[#081E36]">No documents filed here</div>
                <p className="text-[11px]">
                  {searchQuery
                    ? 'No archived documents match your query in this folder.'
                    : 'Documents land here when a request is closed and this folder is picked.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="municipal-docket-table">
                <thead>
                  <tr>
                    <th>Control No.</th>
                    <th>Subject Matter</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Filed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="docket-control-badge font-mono">
                          <HighlightMatch text={doc.controlNo} query={searchQuery} />
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-xs text-[#0F172A] max-w-md">
                          <HighlightMatch text={doc.title} query={searchQuery} />
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-[#334155]">
                          {typeName(doc.documentTypeId)}
                        </span>
                      </td>
                      <td>
                        <StatusChip status={doc.status} />
                      </td>
                      <td className="font-mono text-xs text-[#334155]">
                        {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        {canReadRequests ? (
                          <button
                            type="button"
                            onClick={() => void openDocumentDossier(doc)}
                            disabled={!doc.requestId || dossierBusyId === doc.id}
                            className="btn-fluid px-2.5 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              doc.requestId
                                ? `Open the request dossier for ${doc.controlNo}`
                                : 'This record was issued without a request, so it has no dossier'
                            }
                          >
                            {dossierBusyId === doc.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Eye size={11} />
                            )}
                            <span>View dossier</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step 6: concluded requests waiting to be filed into this folder */}
      {!atRoot && canClose && canReadRequests && (
        <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider flex items-center gap-1.5">
              <Archive size={13} className="text-[#15803D]" />
              <span>Pending Archival</span>
            </h4>
            <span className="text-xs text-[#64748B]">
              Concluded requests are closed and filed into <strong>{current.name}</strong> here
              (FR-29..31)
            </span>
          </div>

          {pendingLoading ? (
            <div className="text-center py-6">
              <Loader2 size={16} className="animate-spin inline-block text-[#081E36]" />
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-6 text-[#64748B] text-xs">
              <div className="space-y-1.5 max-w-md mx-auto">
                <div className="font-bold text-sm text-[#081E36]">Nothing awaiting archival</div>
                <p className="text-[11px]">
                  A request appears here once it is approved, endorsed, denied, or transmitted -
                  transmission is optional - and leaves once it is closed and filed.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="municipal-docket-table">
                <thead>
                  <tr>
                    <th>Control No.</th>
                    <th>Subject Matter</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((request) => {
                    const meta = resolveStatusMeta(REQUEST_STATUS_META, request.status);
                    return (
                      <tr key={request.id}>
                        <td>
                          <span className="docket-control-badge font-mono">{request.controlNo}</span>
                        </td>
                        <td>
                          <div className="font-bold text-xs text-[#0F172A] max-w-md">
                            {request.title}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${meta.badgeCls}`}>{meta.label}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedRequest(request)}
                              className="btn-fluid px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                              title={`Open the request dossier for ${request.controlNo}`}
                            >
                              <Eye size={11} />
                              <span>View dossier</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openArchive(request)}
                              className="btn-fluid px-3 py-1 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                              title={`Close ${request.controlNo} and file it into "${current.name}"`}
                            >
                              <Archive size={12} />
                              <span>Archive &amp; close</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create-folder dialog */}
      {dialog && (
        <Portal>
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#081E36]/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-[#CBD5E1] shadow-xl overflow-hidden animate-fluid-modal">
            <div className="px-4 py-3 bg-[#081E36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus size={15} className="text-[#86EFAC]" />
                <span className="font-cinzel text-sm font-bold">CREATE ARCHIVE FOLDER</span>
              </div>
              <button
                onClick={() => setDialog(null)}
                className="text-[#CBD5E1] hover:text-white cursor-pointer"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4 text-xs">
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#475569]">
                Location:{' '}
                <strong className="text-[#081E36]">
                  {dialog.parentId ? `inside "${dialog.parentName}"` : 'archive root'}
                </strong>
              </div>

              {createAction.error && (
                <div className="p-3 bg-[#F1F5F9] border border-[#334155] rounded text-xs text-[#0F172A] font-semibold">
                  {createAction.error.message}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  required
                  autoFocus
                  placeholder='e.g. "2026" or "Executive Orders"'
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A]"
                />
                <p className="mt-1 text-[10px] text-[#64748B]">
                  Unique among sibling folders; the character &quot;/&quot; is not allowed. The
                  folder path is derived automatically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAction.isPending || !folderName.trim()}
                  className="px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createAction.isPending ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus size={12} />
                      <span>Create Folder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Step 6: the ONE close form, shared with the dossier (FR-29..31) */}
      {archiveTarget && (
        <ArchiveRequestDialog
          request={archiveTarget}
          defaultFolderId={current.id}
          defaultFolderLabel={current.name}
          onClose={() => setArchiveTarget(null)}
          onClosed={handleArchived}
        />
      )}
    </div>
  );
}
