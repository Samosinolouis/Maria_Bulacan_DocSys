'use client';

/**
 * Settings - configuration desk, organized as tabs.
 *
 * Reference data the whole workflow depends on: document types, request types,
 * venues and holidays, plus the (still read-only) role panel. Each tab reads
 * through a data hook and writes through its service, so a saved entry
 * invalidates the client cache and every screen that consumes it (intake,
 * preparation, scheduling) picks it up without a reload.
 */

import React, { useCallback, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import {
  useAsyncAction,
  useCan,
  useLookupService,
  useServiceQuery,
  useVenueService,
  useVenues,
} from '@/hooks';
import type { DocumentType, Holiday, RequestType, Venue } from '@/services/contracts/models';
import type {
  UpsertDocumentTypeInput,
  UpsertRequestTypeInput,
} from '@/services/contracts';
import {
  INPUT,
  LABEL,
  Loading,
  Restricted,
  RowError,
  Section,
  StatusBadge,
} from '@/components/settings/SettingsPrimitives';
import UserManagementPanel from '@/components/settings/UserManagementPanel';

type SettingsTab = 'document-types' | 'request-types' | 'venues' | 'holidays' | 'users';

interface ClassificationValues {
  code: string;
  name: string;
  description: string;
  prefix: string;
}

/** Creation form for a request type / document type classification. */
function ClassificationForm({
  legend,
  codePlaceholder,
  onSubmit,
  isPending,
  errorMessage,
}: {
  legend: string;
  codePlaceholder: string;
  onSubmit: (values: ClassificationValues) => Promise<boolean>;
  isPending: boolean;
  errorMessage: string | null;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    if (!code.trim() || !name.trim() || !prefix.trim() || !description.trim()) {
      setValidationError('All fields are required.');
      return;
    }
    const created = await onSubmit({
      code: code.trim(),
      name: name.trim(),
      prefix: prefix.trim(),
      description: description.trim(),
    });
    if (created) {
      setCode('');
      setName('');
      setPrefix('');
      setDescription('');
    }
  };

  const message = validationError ?? errorMessage;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border border-[#E2E8F0] rounded p-3 bg-[#F8FAFC]">
      <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">{legend}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>Code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={codePlaceholder}
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className={LABEL}>Prefix</span>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. EO"
            className={INPUT}
          />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Executive Order"
          className={INPUT}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short administrative description"
          className={INPUT}
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

/** Classification list shared by the document-type and request-type tabs. */
function ClassificationList({ rows }: { rows: Array<DocumentType | RequestType> }) {
  return (
    <ul className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded">
      {rows.map((type) => (
        <li key={type.id} className="p-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#0F172A]">
              {type.name}{' '}
              <span className="font-mono text-[10px] text-[#64748B]">({type.prefix})</span>
            </div>
            <div className="text-[11px] text-[#64748B]">{type.description}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[10px] text-[#64748B]">{type.code}</span>
            <StatusBadge isActive={type.isActive} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Holiday maintenance form (the SLA calendar reads these). */
function HolidayForm({
  onSubmit,
  isPending,
  errorMessage,
}: {
  onSubmit: (values: { holidayDate: string; name: string }) => Promise<boolean>;
  isPending: boolean;
  errorMessage: string | null;
}) {
  const [holidayDate, setHolidayDate] = useState('');
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    if (!holidayDate || !name.trim()) {
      setValidationError('A date and a name are required.');
      return;
    }
    const saved = await onSubmit({ holidayDate, name: name.trim() });
    if (saved) {
      setHolidayDate('');
      setName('');
    }
  };

  const message = validationError ?? errorMessage;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border border-[#E2E8F0] rounded p-3 bg-[#F8FAFC]">
      <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
        New / Updated Holiday
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>Date</span>
          <input
            type="date"
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className={LABEL}>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Araw ng Santa Maria"
            className={INPUT}
          />
        </label>
      </div>
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
        <span>{isPending ? 'Saving...' : 'Save Holiday'}</span>
      </button>
    </form>
  );
}

/** Creation form for a municipal venue. */
function VenueForm({
  onSubmit,
  isPending,
  errorMessage,
}: {
  onSubmit: (values: { code: string; name: string; specialUse: boolean }) => Promise<boolean>;
  isPending: boolean;
  errorMessage: string | null;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [specialUse, setSpecialUse] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    if (!code.trim() || !name.trim()) {
      setValidationError('A venue code and a name are required.');
      return;
    }
    const created = await onSubmit({
      code: code.trim(),
      name: name.trim(),
      specialUse,
    });
    if (created) {
      setCode('');
      setName('');
      setSpecialUse(false);
    }
  };

  const message = validationError ?? errorMessage;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border border-[#E2E8F0] rounded p-3 bg-[#F8FAFC]">
      <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
        New Municipal Venue
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>Code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. SESSION_HALL"
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className={LABEL}>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sangguniang Bayan Session Hall"
            className={INPUT}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0F172A]">
        <input
          type="checkbox"
          checked={specialUse}
          onChange={(e) => setSpecialUse(e.target.checked)}
          className="rounded text-[#15803D]"
        />
        <span>Special-use venue (booking needs EventService:BookSpecialVenue)</span>
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
        <span>{isPending ? 'Saving...' : 'Add Venue'}</span>
      </button>
    </form>
  );
}

/** One venue row with inline rename and a retire / reactivate toggle. */
function VenueRow({
  venue,
  canManage,
  isBusy,
  onSave,
  onToggleActive,
}: {
  venue: Venue;
  canManage: boolean;
  isBusy: boolean;
  onSave: (input: { venueId: string; name: string; specialUse: boolean }) => Promise<boolean>;
  onToggleActive: (venue: Venue) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(venue.name);
  const [specialUse, setSpecialUse] = useState(venue.specialUse);

  const startEdit = () => {
    setName(venue.name);
    setSpecialUse(venue.specialUse);
    setEditing(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    const saved = await onSave({ venueId: venue.id, name: name.trim(), specialUse });
    if (saved) setEditing(false);
  };

  return (
    <li className="p-2.5 flex items-start justify-between gap-2">
      {editing ? (
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block">
              <span className={LABEL}>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT}
              />
            </label>
            <label className="flex items-end gap-2 pb-2 cursor-pointer text-xs font-semibold text-[#0F172A]">
              <input
                type="checkbox"
                checked={specialUse}
                onChange={(e) => setSpecialUse(e.target.checked)}
                className="rounded text-[#15803D]"
              />
              <span>Special-use</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={isBusy || !name.trim()}
              className="btn-fluid px-2.5 py-1 bg-[#15803D] hover:bg-[#166534] text-white rounded text-[11px] font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
            >
              {isBusy ? <Loader2 size={11} className="animate-spin" /> : null}
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-[11px] font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#0F172A]">{venue.name}</div>
            <div className="text-[11px] text-[#64748B]">
              {venue.specialUse ? 'Special-use venue' : 'Standard municipal venue'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[10px] text-[#64748B]">{venue.code}</span>
            <StatusBadge isActive={venue.isActive} />
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  disabled={isBusy}
                  title={`Edit ${venue.name}`}
                  className="btn-fluid p-1 border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#081E36] rounded cursor-pointer disabled:opacity-50"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleActive(venue)}
                  disabled={isBusy}
                  title={
                    venue.isActive
                      ? `Retire ${venue.name} (keeps its historical bookings)`
                      : `Reactivate ${venue.name}`
                  }
                  className="btn-fluid px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {isBusy ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <RotateCcw size={11} />
                  )}
                  <span>{venue.isActive ? 'Retire' : 'Reactivate'}</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </li>
  );
}

export default function SettingsView() {
  const toast = useToast();
  const canDocumentTypes = useCan('DocumentService:Prepare');
  const canRequestTypes = useCan('RequestService:Encode');
  const canHolidays = useCan('ReportService:Read');
  const canVenues = useCan('VenueService:Read');
  const canManageVenues = useCan('VenueService:Manage');
  const canManageUsers = useCan('UserService:Read');

  const [tab, setTab] = useState<SettingsTab>('document-types');

  const {
    listDocumentTypes,
    listRequestTypes,
    listHolidays,
    createDocumentType,
    createRequestType,
    upsertHoliday,
  } = useLookupService();
  const { create: createVenue, update: updateVenue } = useVenueService();

  const documentTypesQuery = useServiceQuery<DocumentType[]>(
    useCallback(() => listDocumentTypes(true), [listDocumentTypes]),
    [],
  );
  const requestTypesQuery = useServiceQuery<RequestType[]>(
    useCallback(() => listRequestTypes(true), [listRequestTypes]),
    [],
  );
  const holidaysQuery = useServiceQuery<Holiday[]>(
    useCallback(() => listHolidays(), [listHolidays]),
    [],
  );
  const venuesQuery = useVenues(true);

  const createDocumentTypeAction = useAsyncAction(createDocumentType);
  const createRequestTypeAction = useAsyncAction(createRequestType);
  const upsertHolidayAction = useAsyncAction(upsertHoliday);
  const createVenueAction = useAsyncAction(createVenue);
  const updateVenueAction = useAsyncAction(updateVenue);

  const documentTypes = documentTypesQuery.data ?? [];
  const requestTypes = requestTypesQuery.data ?? [];
  const holidays = holidaysQuery.data ?? [];
  const venues = venuesQuery.data ?? [];

  const handleCreateDocumentType = async (values: UpsertDocumentTypeInput): Promise<boolean> => {
    const created = await createDocumentTypeAction.run(values);
    if (created) {
      toast.success(`Document type ${created.name} (${created.prefix}) added.`);
      documentTypesQuery.refresh();
      return true;
    }
    toast.error(createDocumentTypeAction.getError()?.message ?? 'Unable to add the document type.');
    return false;
  };

  const handleCreateRequestType = async (values: UpsertRequestTypeInput): Promise<boolean> => {
    const created = await createRequestTypeAction.run(values);
    if (created) {
      toast.success(`Request type ${created.name} (${created.prefix}) added.`);
      requestTypesQuery.refresh();
      return true;
    }
    toast.error(createRequestTypeAction.getError()?.message ?? 'Unable to add the request type.');
    return false;
  };

  const handleUpsertHoliday = async (values: {
    holidayDate: string;
    name: string;
  }): Promise<boolean> => {
    const saved = await upsertHolidayAction.run(values);
    if (saved) {
      toast.success(`Holiday ${saved.name} recorded on ${saved.holidayDate}.`);
      holidaysQuery.refresh();
      return true;
    }
    toast.error(upsertHolidayAction.getError()?.message ?? 'Unable to record the holiday.');
    return false;
  };

  const handleCreateVenue = async (values: {
    code: string;
    name: string;
    specialUse: boolean;
  }): Promise<boolean> => {
    const created = await createVenueAction.run(values);
    if (created) {
      toast.success(`Venue ${created.name} (${created.code}) added.`);
      venuesQuery.refresh();
      return true;
    }
    toast.error(createVenueAction.getError()?.message ?? 'Unable to add the venue.');
    return false;
  };

  const handleUpdateVenue = async (values: {
    venueId: string;
    name?: string;
    specialUse?: boolean;
    isActive?: boolean;
  }): Promise<boolean> => {
    const saved = await updateVenueAction.run(values);
    if (saved) {
      toast.success(`Venue ${saved.name} updated.`);
      venuesQuery.refresh();
      return true;
    }
    toast.error(updateVenueAction.getError()?.message ?? 'Unable to update the venue.');
    return false;
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode; count: number | null }> = [
    {
      id: 'document-types',
      label: 'Document Types',
      icon: <FileText size={14} />,
      count: documentTypesQuery.isLoading ? null : documentTypes.length,
    },
    {
      id: 'request-types',
      label: 'Request Types',
      icon: <FileText size={14} />,
      count: requestTypesQuery.isLoading ? null : requestTypes.length,
    },
    {
      id: 'venues',
      label: 'Venues',
      icon: <Building2 size={14} />,
      count: venuesQuery.isLoading ? null : venues.length,
    },
    {
      id: 'holidays',
      label: 'Holidays',
      icon: <CalendarDays size={14} />,
      count: holidaysQuery.isLoading ? null : holidays.length,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users size={14} />,
      count: null,
    },
  ];

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm">
        <span className="font-mono text-[10px] font-bold text-[#15803D] uppercase tracking-wider">
          MUNICIPAL CONFIGURATION
        </span>
        <h3 className="font-cinzel text-base font-bold text-[#081E36] flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[#15803D]" />
          SETTINGS
        </h3>
        <p className="text-xs text-[#64748B]">
          Maintain the reference data every transaction depends on. Entries saved here are available
          immediately to intake, preparation and scheduling.
        </p>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Configuration sections"
        className="bg-white rounded border border-[#CBD5E1] shadow-sm px-2 pt-2 flex flex-wrap items-center gap-1"
      >
        {tabs.map((entry) => {
          const isActive = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(entry.id)}
              className={`btn-fluid inline-flex items-center gap-1.5 px-3 py-2 rounded-t border-b-2 text-xs font-bold cursor-pointer transition-colors ${
                isActive
                  ? 'border-[#15803D] text-[#15803D] bg-[#F0FDF4]'
                  : 'border-transparent text-[#64748B] hover:text-[#081E36] hover:bg-[#F8FAFC]'
              }`}
            >
              {entry.icon}
              <span>{entry.label}</span>
              {entry.count !== null && (
                <span className="font-mono text-[10px] font-bold text-[#334155] bg-white border border-[#CBD5E1] px-1.5 py-0.5 rounded">
                  {entry.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Document types */}
      {tab === 'document-types' && (
        <Section
          icon={<FileText size={15} className="text-[#15803D]" />}
          title="DOCUMENT TYPES"
          description="Classifications issued by the Office of the Municipal Administrator."
          count={documentTypesQuery.isLoading ? null : documentTypes.length}
          refreshing={documentTypesQuery.isRefreshing}
          onRefresh={documentTypesQuery.refresh}
        >
          {canDocumentTypes ? (
            <ClassificationForm
              legend="New Document Type"
              codePlaceholder="e.g. EXECUTIVE_ORDER"
              onSubmit={handleCreateDocumentType}
              isPending={createDocumentTypeAction.isPending}
              errorMessage={createDocumentTypeAction.error?.message ?? null}
            />
          ) : (
            <Restricted grant="DocumentService:Prepare" />
          )}

          {documentTypesQuery.isLoading && <Loading label="Loading document types..." />}
          {documentTypesQuery.error && (
            <RowError message={documentTypesQuery.error.message} onRetry={documentTypesQuery.refresh} />
          )}

          {documentTypes.length > 0 && <ClassificationList rows={documentTypes} />}
        </Section>
      )}

      {/* Request types */}
      {tab === 'request-types' && (
        <Section
          icon={<FileText size={15} className="text-[#15803D]" />}
          title="REQUEST TYPES"
          description="Incoming classifications used when encoding a request at the reception desk."
          count={requestTypesQuery.isLoading ? null : requestTypes.length}
          refreshing={requestTypesQuery.isRefreshing}
          onRefresh={requestTypesQuery.refresh}
        >
          {canRequestTypes ? (
            <ClassificationForm
              legend="New Request Type"
              codePlaceholder="e.g. TRAVEL_ORDER"
              onSubmit={handleCreateRequestType}
              isPending={createRequestTypeAction.isPending}
              errorMessage={createRequestTypeAction.error?.message ?? null}
            />
          ) : (
            <Restricted grant="RequestService:Encode" />
          )}

          {requestTypesQuery.isLoading && <Loading label="Loading request types..." />}
          {requestTypesQuery.error && (
            <RowError message={requestTypesQuery.error.message} onRetry={requestTypesQuery.refresh} />
          )}

          {requestTypes.length > 0 && <ClassificationList rows={requestTypes} />}
        </Section>
      )}

      {/* Venues */}
      {tab === 'venues' && (
        <Section
          icon={<Building2 size={15} className="text-[#15803D]" />}
          title="VENUES"
          description="Municipal venues available to the scheduling desk. Retiring a venue keeps its historical bookings."
          count={venuesQuery.isLoading ? null : venues.length}
          refreshing={venuesQuery.isRefreshing}
          onRefresh={venuesQuery.refresh}
        >
          {!canVenues && <Restricted grant="VenueService:Read" />}

          {canManageVenues ? (
            <VenueForm
              onSubmit={handleCreateVenue}
              isPending={createVenueAction.isPending}
              errorMessage={createVenueAction.error?.message ?? null}
            />
          ) : (
            <Restricted grant="VenueService:Manage" />
          )}

          {venuesQuery.isLoading && <Loading label="Loading venues..." />}
          {venuesQuery.error && (
            <RowError message={venuesQuery.error.message} onRetry={venuesQuery.refresh} />
          )}

          {venues.length > 0 ? (
            <ul className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded">
              {venues.map((venue) => (
                <VenueRow
                  key={venue.id}
                  venue={venue}
                  canManage={canManageVenues}
                  isBusy={updateVenueAction.isPending}
                  onSave={handleUpdateVenue}
                  onToggleActive={(target) =>
                    void handleUpdateVenue({
                      venueId: target.id,
                      isActive: !target.isActive,
                    })
                  }
                />
              ))}
            </ul>
          ) : (
            !venuesQuery.isLoading && (
              <div className="p-4 text-center text-[11px] text-[#64748B] border border-[#E2E8F0] rounded">
                No venues recorded yet. Run the dev seed or add one above.
              </div>
            )
          )}
        </Section>
      )}

      {/* Holidays */}
      {tab === 'holidays' && (
        <Section
          icon={<CalendarDays size={15} className="text-[#15803D]" />}
          title="HOLIDAYS"
          description="Non-working days excluded from the RA 11032 SLA computation."
          count={holidaysQuery.isLoading ? null : holidays.length}
          refreshing={holidaysQuery.isRefreshing}
          onRefresh={holidaysQuery.refresh}
        >
          {canHolidays ? (
            <HolidayForm
              onSubmit={handleUpsertHoliday}
              isPending={upsertHolidayAction.isPending}
              errorMessage={upsertHolidayAction.error?.message ?? null}
            />
          ) : (
            <Restricted grant="ReportService:Read" />
          )}

          {holidaysQuery.isLoading && <Loading label="Loading holidays..." />}
          {holidaysQuery.error && (
            <RowError message={holidaysQuery.error.message} onRetry={holidaysQuery.refresh} />
          )}

          {holidays.length > 0 ? (
            <ul className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded">
              {holidays.map((holiday) => (
                <li key={holiday.id} className="p-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#0F172A]">{holiday.name}</span>
                  <span className="font-mono text-[10px] text-[#64748B]">{holiday.holidayDate}</span>
                </li>
              ))}
            </ul>
          ) : (
            !holidaysQuery.isLoading && (
              <div className="p-4 text-center text-[11px] text-[#64748B] border border-[#E2E8F0] rounded">
                No holidays recorded yet.
              </div>
            )
          )}
        </Section>
      )}

      {/* User management - accounts, role grants and role definitions */}
      {tab === 'users' &&
        (canManageUsers ? (
          <UserManagementPanel />
        ) : (
          <Section
            icon={<Users size={15} className="text-[#15803D]" />}
            title="USER MANAGEMENT"
            description="Plantilla accounts, their role grants, and the soft deactivation that retires an account without deleting its audit history (FR-03)."
            count={null}
          >
            <Restricted grant="UserService:Read" />
          </Section>
        ))}

      <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg text-[11px] text-[#166534] font-semibold flex items-center gap-2">
        <CheckCircle2 size={14} />
        <span>
          Saved entries invalidate the client cache, so intake, preparation and scheduling show them
          immediately.
        </span>
      </div>
    </div>
  );
}
