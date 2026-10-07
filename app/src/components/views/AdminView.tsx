'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Loader2,
  X,
  RotateCcw,
  Users,
  ShieldCheck,
  KeyRound,
  Database,
  ClipboardList,
  FileText,
  Plus,
} from 'lucide-react';
import {
  useAsyncAction,
  useCan,
  useLookupService,
  usePermissionCatalog,
  useRoles,
  useServiceQuery,
  useUsers,
} from '@/hooks';
import type {
  DocumentType,
  PermissionCatalogEntry,
  RequestType,
  UpsertDocumentTypeInput,
  UpsertRequestTypeInput,
} from '@/services/contracts';
import { useToast } from '@/providers/ToastProvider';

/** Shared loading panel for the administration tables. */
function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="bg-white p-8 rounded border border-[#CBD5E1] shadow-sm flex items-center justify-center gap-2 text-xs text-[#64748B]">
      <Loader2 size={16} className="animate-spin text-[#94A3B8]" />
      <span>{label}</span>
    </div>
  );
}

/** Shared error panel with a retry affordance. */
function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-3 bg-white border border-[#334155] rounded text-xs text-[#0F172A] font-semibold flex items-center justify-between gap-2">
      <span className="flex items-start gap-2">
        <X size={14} className="text-[#334155] shrink-0 mt-0.5" />
        <span>{message}</span>
      </span>
      <button
        onClick={onRetry}
        className="btn-fluid px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1 shrink-0"
      >
        <RotateCcw size={12} />
        <span>Retry</span>
      </button>
    </div>
  );
}

/** Active/inactive pill shared by the reference-data and user tables. */
function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${
        isActive
          ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
          : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#334155]'
      }`}
    >
      {isActive ? 'ACTIVE' : 'INACTIVE'}
    </span>
  );
}

interface ReferenceTypeValues {
  code: string;
  name: string;
  description: string;
  prefix: string;
}

/**
 * Compact creation form for a reference classification. It owns its fields and
 * clears them when the parent reports a successful create.
 */
function ReferenceTypeForm({
  legend,
  codePlaceholder,
  onSubmit,
  isPending,
  errorMessage,
}: {
  legend: string;
  codePlaceholder: string;
  onSubmit: (values: ReferenceTypeValues) => Promise<boolean>;
  isPending: boolean;
  errorMessage: string | null;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prefix, setPrefix] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    if (!code.trim() || !name.trim() || !description.trim() || !prefix.trim()) {
      setValidationError('All fields are required.');
      return;
    }

    const created = await onSubmit({
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      prefix: prefix.trim(),
    });

    if (created) {
      setCode('');
      setName('');
      setDescription('');
      setPrefix('');
    }
  };

  const message = validationError ?? errorMessage;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 border border-[#E2E8F0] rounded p-3 bg-[#F8FAFC]"
    >
      <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">{legend}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-[11px] font-bold text-[#081E36] mb-1">Code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={codePlaceholder}
            className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-bold text-[#081E36] mb-1">Prefix</span>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. TO"
            className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-[11px] font-bold text-[#081E36] mb-1">Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Travel Order"
          className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
        />
      </label>

      <label className="block">
        <span className="block text-[11px] font-bold text-[#081E36] mb-1">Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short administrative description"
          className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]"
        />
      </label>

      {message && (
        <p className="text-[11px] text-[#0F172A] font-semibold bg-white border border-[#E2E8F0] rounded px-2 py-1">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-fluid inline-flex items-center gap-1 px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Plus size={13} />
        <span>{isPending ? 'Saving...' : 'Create'}</span>
      </button>
    </form>
  );
}

export default function AdminView() {
  const canReadUsers = useCan('UserService:Read');
  const canReadRoles = useCan('RoleService:Read');
  const canEncodeRequestType = useCan('RequestService:Encode');
  const canPrepareDocumentType = useCan('DocumentService:Prepare');

  const usersQuery = useUsers({ first: 50 });
  const rolesQuery = useRoles({ first: 50 });
  const catalogQuery = usePermissionCatalog();

  const { listRequestTypes, listDocumentTypes, createRequestType, createDocumentType } =
    useLookupService();

  const requestTypesQuery = useServiceQuery<RequestType[]>(
    useCallback(() => listRequestTypes(true), [listRequestTypes]),
    [],
  );
  const documentTypesQuery = useServiceQuery<DocumentType[]>(
    useCallback(() => listDocumentTypes(true), [listDocumentTypes]),
    [],
  );

  const createRequestTypeAction = useAsyncAction(createRequestType);
  const createDocumentTypeAction = useAsyncAction(createDocumentType);
  const toast = useToast();

  const requestTypes = requestTypesQuery.data ?? [];
  const documentTypes = documentTypesQuery.data ?? [];

  const users = useMemo(() => usersQuery.data?.edges.map((edge) => edge.node) ?? [], [usersQuery.data]);
  const roles = useMemo(() => rolesQuery.data?.edges.map((edge) => edge.node) ?? [], [rolesQuery.data]);
  const catalog: PermissionCatalogEntry[] = catalogQuery.data ?? [];

  const refreshAll = () => {
    usersQuery.refresh();
    rolesQuery.refresh();
    catalogQuery.refresh();
  };

  const handleCreateRequestType = async (values: UpsertRequestTypeInput): Promise<boolean> => {
    const created = await createRequestTypeAction.run(values);
    if (created) {
      requestTypesQuery.refresh();
      toast.success(`Request type ${created.name} (${created.prefix}) added.`);
      return true;
    }
    toast.error(createRequestTypeAction.getError()?.message ?? 'Unable to add the request type.');
    return false;
  };

  const handleCreateDocumentType = async (values: UpsertDocumentTypeInput): Promise<boolean> => {
    const created = await createDocumentTypeAction.run(values);
    if (created) {
      documentTypesQuery.refresh();
      toast.success(`Document type ${created.name} (${created.prefix}) added.`);
      return true;
    }
    toast.error(createDocumentTypeAction.getError()?.message ?? 'Unable to add the document type.');
    return false;
  };

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm">
        <h3 className="font-cinzel text-base font-bold text-[#081E36]">
          USER & ROLE ADMINISTRATION
        </h3>
        <p className="text-xs text-[#64748B]">
          Accounts, role definitions, and the read-only permission catalog that drives every authorization
          decision.
        </p>
      </div>

      {!canReadUsers && !canReadRoles && (
        <div className="bg-white p-8 rounded border border-[#CBD5E1] shadow-sm text-center space-y-2">
          <div className="font-bold text-sm text-[#081E36]">Administration Access Restricted</div>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Viewing users and roles requires the UserService:Read or RoleService:Read grant.
          </p>
        </div>
      )}

      {/* Reference Data (request types / document types) */}
      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="font-cinzel text-base font-bold text-[#081E36] flex items-center gap-2">
            <Database size={16} className="text-[#15803D]" />
            <span>REFERENCE DATA</span>
          </h3>
          <p className="text-xs text-[#64748B]">
            Maintain the request and document classifications that drive intake and preparation. These
            reference entries must exist before transactions can be logged or drafted.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Request types */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={13} className="text-[#15803D]" />
              <span>Request Types ({requestTypes.length})</span>
            </h4>

            {canEncodeRequestType ? (
              <ReferenceTypeForm
                legend="New Request Type"
                codePlaceholder="e.g. TRAVEL_ORDER"
                onSubmit={handleCreateRequestType}
                isPending={createRequestTypeAction.isPending}
                errorMessage={createRequestTypeAction.error?.message ?? null}
              />
            ) : (
              <p className="text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
                Creating request types requires the RequestService:Encode grant.
              </p>
            )}

            {requestTypesQuery.isLoading && <LoadingPanel label="Loading request types..." />}
            {requestTypesQuery.error && (
              <ErrorPanel message={requestTypesQuery.error.message} onRetry={requestTypesQuery.refresh} />
            )}

            {!requestTypesQuery.isLoading && !requestTypesQuery.error && (
              <div className="overflow-x-auto">
                <table className="municipal-docket-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Prefix</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestTypes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-[#64748B] text-xs">
                          No request types defined. Create one above so intake can proceed.
                        </td>
                      </tr>
                    ) : (
                      requestTypes.map((type) => (
                        <tr key={type.id}>
                          <td className="font-mono text-[#0F172A]">{type.code}</td>
                          <td className="text-[#334155]">
                            <span className="block font-bold text-[#0F172A]">{type.name}</span>
                            <span className="block text-[11px] text-[#64748B]">{type.description}</span>
                          </td>
                          <td className="font-mono text-[#334155]">{type.prefix}</td>
                          <td>
                            <ActiveBadge isActive={type.isActive} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Document types */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={13} className="text-[#15803D]" />
              <span>Document Types ({documentTypes.length})</span>
            </h4>

            {canPrepareDocumentType ? (
              <ReferenceTypeForm
                legend="New Document Type"
                codePlaceholder="e.g. MEMORANDUM"
                onSubmit={handleCreateDocumentType}
                isPending={createDocumentTypeAction.isPending}
                errorMessage={createDocumentTypeAction.error?.message ?? null}
              />
            ) : (
              <p className="text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
                Creating document types requires the DocumentService:Prepare grant.
              </p>
            )}

            {documentTypesQuery.isLoading && <LoadingPanel label="Loading document types..." />}
            {documentTypesQuery.error && (
              <ErrorPanel message={documentTypesQuery.error.message} onRetry={documentTypesQuery.refresh} />
            )}

            {!documentTypesQuery.isLoading && !documentTypesQuery.error && (
              <div className="overflow-x-auto">
                <table className="municipal-docket-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Prefix</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentTypes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-[#64748B] text-xs">
                          No document types defined. Create one above so preparation can proceed.
                        </td>
                      </tr>
                    ) : (
                      documentTypes.map((type) => (
                        <tr key={type.id}>
                          <td className="font-mono text-[#0F172A]">{type.code}</td>
                          <td className="text-[#334155]">
                            <span className="block font-bold text-[#0F172A]">{type.name}</span>
                            <span className="block text-[11px] text-[#64748B]">{type.description}</span>
                          </td>
                          <td className="font-mono text-[#334155]">{type.prefix}</td>
                          <td>
                            <ActiveBadge isActive={type.isActive} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users */}
      {canReadUsers && (
        <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-3">
          <h4 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider flex items-center gap-1.5">
            <Users size={13} className="text-[#15803D]" />
            <span>User Accounts ({users.length})</span>
          </h4>

          {usersQuery.isLoading && <LoadingPanel label="Loading user accounts..." />}
          {usersQuery.error && (
            <ErrorPanel message={usersQuery.error.message} onRetry={refreshAll} />
          )}

          {!usersQuery.isLoading && !usersQuery.error && (
            <div className="overflow-x-auto">
              <table className="municipal-docket-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Office</th>
                    <th>Position</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[#64748B] text-xs">
                        No user accounts found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const fullName = [user.firstName, user.middleName, user.lastName, user.suffix]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <tr key={user.id}>
                          <td className="font-bold text-[#0F172A]">{fullName}</td>
                          <td className="text-[#334155]">{user.email}</td>
                          <td className="text-[#334155]">{user.office}</td>
                          <td className="text-[#334155]">{user.position}</td>
                          <td>
                            <span
                              className={`inline-block px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${
                                user.isActive
                                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                                  : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#334155]'
                              }`}
                            >
                              {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Roles */}
      {canReadRoles && (
        <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-3">
          <h4 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#15803D]" />
            <span>Roles ({roles.length})</span>
          </h4>

          {rolesQuery.isLoading && <LoadingPanel label="Loading role definitions..." />}
          {rolesQuery.error && (
            <ErrorPanel message={rolesQuery.error.message} onRetry={refreshAll} />
          )}

          {!rolesQuery.isLoading && !rolesQuery.error && (
            <div className="overflow-x-auto">
              <table className="municipal-docket-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Description</th>
                    <th>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-[#64748B] text-xs">
                        No roles defined.
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.id}>
                        <td className="font-bold text-[#081E36]">{role.name}</td>
                        <td className="text-[#334155]">{role.description}</td>
                        <td>
                          <div className="space-y-1">
                            <span className="font-mono text-[11px] font-bold text-[#15803D]">
                              {role.permissionPayload.length} grant
                              {role.permissionPayload.length === 1 ? '' : 's'}
                            </span>
                            <div className="flex flex-wrap gap-1 max-w-lg">
                              {role.permissionPayload.map((permission) => (
                                <span
                                  key={permission}
                                  className="font-mono text-[10px] text-[#334155] bg-[#F1F5F9] border border-[#E2E8F0] rounded px-1.5 py-0.5"
                                >
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Permission catalog (read-only reference) */}
      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-3">
        <h4 className="text-[11px] font-bold text-[#081E36] uppercase tracking-wider flex items-center gap-1.5">
          <KeyRound size={13} className="text-[#15803D]" />
          <span>Permission Catalog (Read-Only Reference)</span>
        </h4>

        {catalogQuery.isLoading && <LoadingPanel label="Loading permission catalog..." />}
        {catalogQuery.error && (
          <ErrorPanel message={catalogQuery.error.message} onRetry={refreshAll} />
        )}

        {!catalogQuery.isLoading && !catalogQuery.error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {catalog.length === 0 ? (
              <div className="text-center py-6 text-[#64748B] text-xs md:col-span-2">
                The permission catalog is empty.
              </div>
            ) : (
              catalog.map((entry) => (
                <div
                  key={entry.service}
                  className="border border-[#E2E8F0] rounded p-3 bg-[#F8FAFC] space-y-1.5"
                >
                  <div className="font-mono text-xs font-bold text-[#081E36]">{entry.service}</div>
                  <div className="flex flex-wrap gap-1">
                    {entry.actions.map((action) => (
                      <span
                        key={action}
                        className="font-mono text-[10px] text-[#334155] bg-white border border-[#CBD5E1] rounded px-1.5 py-0.5"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
