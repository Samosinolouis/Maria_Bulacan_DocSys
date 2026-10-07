'use client';

/**
 * User Management - the administrative desk inside Settings.
 *
 * Covers the whole shared-platform administration surface:
 *  - account provisioning (create a plantilla account with its first roles),
 *  - profile maintenance (an account holder may edit their own record; editing
 *    somebody else's needs UserService:Update),
 *  - role assignment / revocation (UserService:AssignRole),
 *  - soft deactivation and reactivation (UserService:Deactivate, FR-03),
 *  - role definitions with their permission payloads (RoleService:Create /
 *    RoleService:Update, validated against NFR-21 by the backend).
 *
 * Every mutation goes through the service layer, which invalidates the client
 * cache and bumps the refresh bus, so the tables below re-read on their own.
 */

import React, { useMemo, useState } from 'react';
import {
  Check,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import {
  useAsyncAction,
  useCan,
  useDebouncedValue,
  usePermissionCatalog,
  useRoleService,
  useRoles,
  useSessionUser,
  useUserService,
  useUsers,
} from '@/hooks';
import type {
  CreateUserInput,
  PermissionCatalogEntry,
  Role,
  UpdateRoleInput,
  UpdateUserProfileInput,
  User,
} from '@/services/contracts';
import {
  FormNote,
  INPUT,
  LABEL,
  Loading,
  PrimaryButton,
  Restricted,
  RowError,
  SecondaryButton,
  Section,
  StatusBadge,
} from './SettingsPrimitives';

const INPUT_SM =
  'w-full p-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]';

function fullName(user: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
}): string {
  return [user.firstName, user.middleName, user.lastName, user.suffix]
    .filter(Boolean)
    .join(' ');
}

function roleChips(roles: Role[]) {
  if (roles.length === 0) {
    return <span className="text-[10px] text-[#94A3B8]">No roles</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <span
          key={role.id}
          className="font-mono text-[10px] font-bold text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] rounded px-1.5 py-0.5"
        >
          {role.name}
        </span>
      ))}
    </div>
  );
}

/**
 * Permission picker over the backend catalog. Wildcards ("Service:*", "*:*")
 * are not in the catalog (they are the catalog's own shorthand), so they are
 * offered as explicit toggles.
 */
function PermissionPicker({
  catalog,
  selected,
  onToggle,
  disabled,
}: {
  catalog: PermissionCatalogEntry[];
  selected: string[];
  onToggle: (permission: string) => void;
  disabled?: boolean;
}) {
  const [extra, setExtra] = useState('');
  const isSelected = (permission: string) => selected.includes(permission);

  const addExtra = () => {
    const value = extra.trim();
    if (!value) return;
    if (!isSelected(value)) onToggle(value);
    setExtra('');
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {catalog.map((entry) => (
          <div key={entry.service} className="border border-[#E2E8F0] rounded p-2 bg-white space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold text-[#081E36]">{entry.service}</span>
              <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-[#334155]">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={isSelected(`${entry.service}:*`)}
                  onChange={() => onToggle(`${entry.service}:*`)}
                  className="rounded text-[#15803D]"
                />
                <span>all</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-1">
              {entry.actions.map((permission) => (
                <label
                  key={permission}
                  className={`flex items-center gap-1 cursor-pointer rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                    isSelected(permission)
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534] font-bold'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={isSelected(permission)}
                    onChange={() => onToggle(permission)}
                    className="sr-only"
                  />
                  <span>{permission.split(':')[1]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <label className="block flex-1">
          <span className={LABEL}>Wildcard or custom grant</span>
          <input
            type="text"
            value={extra}
            disabled={disabled}
            onChange={(event) => setExtra(event.target.value)}
            placeholder="e.g. *:* or DocumentService:*"
            className={INPUT_SM}
          />
        </label>
        <SecondaryButton onClick={addExtra} disabled={disabled}>
          Add
        </SecondaryButton>
      </div>

      <div className="flex flex-wrap gap-1">
        {selected.length === 0 ? (
          <span className="text-[10px] text-[#94A3B8]">No grants selected.</span>
        ) : (
          selected.map((permission) => (
            <span
              key={permission}
              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#334155] bg-[#F1F5F9] border border-[#E2E8F0] rounded px-1.5 py-0.5"
            >
              {permission}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(permission)}
                title={`Remove ${permission}`}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer disabled:opacity-50"
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/** Inline profile editor for one account row. */
function AccountEditor({
  user,
  isSelf,
  isPending,
  errorMessage,
  onSave,
  onCancel,
}: {
  user: User;
  isSelf: boolean;
  isPending: boolean;
  errorMessage: string | null;
  onSave: (input: UpdateUserProfileInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [middleName, setMiddleName] = useState(user.middleName ?? '');
  const [lastName, setLastName] = useState(user.lastName);
  const [suffix, setSuffix] = useState(user.suffix ?? '');
  const [email, setEmail] = useState(user.email);
  const [contactNo, setContactNo] = useState(user.contactNo);
  const [office, setOffice] = useState(user.office);
  const [position, setPosition] = useState(user.position);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setValidationError('First name, last name and email are required.');
      return;
    }
    const saved = await onSave({
      firstName: firstName.trim(),
      middleName: middleName.trim() ? middleName.trim() : null,
      lastName: lastName.trim(),
      suffix: suffix.trim() ? suffix.trim() : null,
      email: email.trim(),
      contactNo: contactNo.trim(),
      office: office.trim(),
      position: position.trim(),
    });
    if (saved) onCancel();
  };

  const message = validationError ?? errorMessage;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
      <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
        {isSelf ? 'Update my account' : `Update account - ${fullName(user)}`}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <label className="block">
          <span className={LABEL}>First name</span>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Middle name</span>
          <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Last name</span>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Suffix</span>
          <input type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} className={INPUT_SM} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Contact no.</span>
          <input type="text" value={contactNo} onChange={(e) => setContactNo(e.target.value)} className={INPUT_SM} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>Office</span>
          <input type="text" value={office} onChange={(e) => setOffice(e.target.value)} className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Position</span>
          <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} className={INPUT_SM} />
        </label>
      </div>

      {message && <FormNote message={message} />}

      <div className="flex items-center gap-2">
        <PrimaryButton isPending={isPending}>
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          <span>{isPending ? 'Saving...' : 'Save account'}</span>
        </PrimaryButton>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
      </div>
    </form>
  );
}

/** Inline role assignment for one account row. */
function RoleAssignment({
  user,
  roles,
  canAssign,
  isPending,
  onAssign,
  onRemove,
}: {
  user: User;
  roles: Role[];
  canAssign: boolean;
  isPending: boolean;
  onAssign: (roleId: string) => void;
  onRemove: (roleId: string) => void;
}) {
  const assignedIds = useMemo(() => new Set(user.roles.map((role) => role.id)), [user.roles]);
  const available = roles.filter((role) => !assignedIds.has(role.id));
  const [selected, setSelected] = useState('');

  if (!canAssign) {
    return <Restricted grant="UserService:AssignRole" />;
  }

  return (
    <div className="space-y-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
      <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
        Role grants - {fullName(user)}
      </div>

      <div className="flex flex-wrap gap-1">
        {user.roles.length === 0 ? (
          <span className="text-[11px] text-[#64748B]">This account carries no roles yet.</span>
        ) : (
          user.roles.map((role) => (
            <span
              key={role.id}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] rounded px-1.5 py-0.5"
            >
              {role.name}
              <span className="text-[#334155] font-normal">
                {role.permissionPayload.length} grant{role.permissionPayload.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onRemove(role.id)}
                title={`Remove ${role.name}`}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer disabled:opacity-50"
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex items-end gap-2">
        <label className="block flex-1">
          <span className={LABEL}>Assign a role</span>
          <select
            value={selected}
            disabled={isPending || available.length === 0}
            onChange={(event) => setSelected(event.target.value)}
            className={INPUT_SM}
          >
            <option value="">
              {available.length === 0 ? 'Every role is already assigned' : 'Select a role...'}
            </option>
            {available.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        <PrimaryButton
          type="button"
          isPending={isPending}
          disabled={!selected}
          onClick={() => {
            if (selected) onAssign(selected);
            setSelected('');
          }}
        >
          <Plus size={12} />
          <span>Assign</span>
        </PrimaryButton>
      </div>
    </div>
  );
}

/** One account row plus its inline editors. */
function AccountRow({
  user,
  roles,
  isSelf,
  canAssignRole,
  isBusy,
  updateAction,
  onUpdate,
  onAssignRole,
  onRemoveRole,
  onToggleActive,
}: {
  user: User;
  roles: Role[];
  isSelf: boolean;
  canAssignRole: boolean;
  isBusy: boolean;
  updateAction: { isPending: boolean; error: { message: string } | null };
  onUpdate: (input: UpdateUserProfileInput) => Promise<boolean>;
  onAssignRole: (userId: string, roleId: string) => void;
  onRemoveRole: (userId: string, roleId: string) => void;
  onToggleActive: (user: User) => void;
}) {
  // The engine lets an account holder edit their own record without the grant,
  // and refuses self-deactivation (see the ABAC policy table).
  const canEdit = useCan('UserService:Update', { kind: 'user', attributes: { id: user.id } });
  const canDeactivate = useCan('UserService:Deactivate', {
    kind: 'user',
    attributes: { id: user.id },
  });

  const [editing, setEditing] = useState(false);
  const [assigning, setAssigning] = useState(false);

  return (
    <li className="p-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
            {fullName(user)}
            {isSelf && (
              <span className="font-mono text-[10px] font-bold text-[#334155] bg-[#F1F5F9] border border-[#CBD5E1] px-1.5 py-0.5 rounded">
                YOU
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#64748B]">
            {user.email} | {user.position} | {user.office}
          </div>
          <div className="mt-1.5">{roleChips(user.roles)}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <StatusBadge isActive={user.isActive} />

          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing((open) => !open)}
              title={`Edit ${fullName(user)}`}
              className="btn-fluid p-1 border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#081E36] rounded cursor-pointer"
            >
              <Pencil size={12} />
            </button>
          )}

          {canAssignRole && (
            <button
              type="button"
              onClick={() => setAssigning((open) => !open)}
              title={`Manage roles for ${fullName(user)}`}
              className="btn-fluid p-1 border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#081E36] rounded cursor-pointer"
            >
              <ShieldCheck size={12} />
            </button>
          )}

          {canDeactivate && (
            <button
              type="button"
              onClick={() => onToggleActive(user)}
              disabled={isBusy}
              title={user.isActive ? `Disable ${fullName(user)}` : `Reactivate ${fullName(user)}`}
              className="btn-fluid px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
            >
              {isBusy ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
              <span>{user.isActive ? 'Disable' : 'Reactivate'}</span>
            </button>
          )}
        </div>
      </div>

      {editing && (
        <AccountEditor
          user={user}
          isSelf={isSelf}
          isPending={updateAction.isPending}
          errorMessage={updateAction.error?.message ?? null}
          onSave={onUpdate}
          onCancel={() => setEditing(false)}
        />
      )}

      {assigning && (
        <RoleAssignment
          user={user}
          roles={roles}
          canAssign={canAssignRole}
          isPending={isBusy}
          onAssign={(roleId) => onAssignRole(user.id, roleId)}
          onRemove={(roleId) => onRemoveRole(user.id, roleId)}
        />
      )}
    </li>
  );
}

/** Account provisioning form. */
function CreateAccountForm({
  roles,
  isPending,
  errorMessage,
  onSubmit,
}: {
  roles: Role[];
  isPending: boolean;
  errorMessage: string | null;
  onSubmit: (input: CreateUserInput) => Promise<boolean>;
}) {
  const [values, setValues] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    contactNo: '',
    office: '',
    position: '',
    temporaryPassword: '',
    roleId: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const set = (field: keyof typeof values) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    if (
      !values.firstName.trim() ||
      !values.lastName.trim() ||
      !values.email.trim() ||
      !values.contactNo.trim() ||
      !values.office.trim() ||
      !values.position.trim()
    ) {
      setValidationError('First name, last name, email, contact no., office and position are required.');
      return;
    }

    const created = await onSubmit({
      firstName: values.firstName.trim(),
      middleName: values.middleName.trim() || null,
      lastName: values.lastName.trim(),
      suffix: values.suffix.trim() || null,
      email: values.email.trim(),
      contactNo: values.contactNo.trim(),
      office: values.office.trim(),
      position: values.position.trim(),
      roleIds: values.roleId ? [values.roleId] : [],
      temporaryPassword: values.temporaryPassword || null,
    });

    if (created) {
      setValues({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        email: '',
        contactNo: '',
        office: '',
        position: '',
        temporaryPassword: '',
        roleId: '',
      });
    }
  };

  const message = validationError ?? errorMessage;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border border-[#E2E8F0] rounded p-3 bg-[#F8FAFC]">
      <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
        New Plantilla Account
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <label className="block">
          <span className={LABEL}>First name</span>
          <input type="text" value={values.firstName} onChange={(e) => set('firstName')(e.target.value)} placeholder="e.g. Juan" className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Middle name</span>
          <input type="text" value={values.middleName} onChange={(e) => set('middleName')(e.target.value)} placeholder="e.g. Santos" className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Last name</span>
          <input type="text" value={values.lastName} onChange={(e) => set('lastName')(e.target.value)} placeholder="e.g. Dela Cruz" className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Suffix</span>
          <input type="text" value={values.suffix} onChange={(e) => set('suffix')(e.target.value)} placeholder="e.g. Jr." className={INPUT_SM} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>Email (becomes the username)</span>
          <input type="email" value={values.email} onChange={(e) => set('email')(e.target.value)} placeholder="name@docsys.local" className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Contact no.</span>
          <input type="text" value={values.contactNo} onChange={(e) => set('contactNo')(e.target.value)} placeholder="e.g. 0917 000 0000" className={INPUT_SM} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>Office</span>
          <input type="text" value={values.office} onChange={(e) => set('office')(e.target.value)} placeholder="e.g. Office of the Municipal Administrator" className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Position</span>
          <input type="text" value={values.position} onChange={(e) => set('position')(e.target.value)} placeholder="e.g. Administrative Officer II" className={INPUT_SM} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>One-time password (optional)</span>
          <input
            type="password"
            autoComplete="new-password"
            value={values.temporaryPassword}
            onChange={(e) => set('temporaryPassword')(e.target.value)}
            placeholder="Handed to the account holder"
            className={INPUT_SM}
          />
          <span className="block text-[10px] text-[#64748B] mt-0.5">
            Keycloak stores it as temporary, so the holder must replace it at first sign-in. It is
            never saved in the application database.
          </span>
        </label>
        <label className="block">
          <span className={LABEL}>Initial role (optional)</span>
          <select value={values.roleId} onChange={(e) => set('roleId')(e.target.value)} className={INPUT_SM}>
            <option value="">No role yet</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message && <FormNote message={message} />}

      <PrimaryButton isPending={isPending}>
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
        <span>{isPending ? 'Provisioning...' : 'Create Account'}</span>
      </PrimaryButton>
    </form>
  );
}

/** Role definitions: create and edit the permission payloads. */
function RoleMaintenanceSection({
  roles,
  catalog,
  isLoading,
  error,
  onRefresh,
  isRefreshing,
  canCreate,
  canUpdate,
  createAction,
  updateAction,
  onCreate,
  onUpdate,
}: {
  roles: Role[];
  catalog: PermissionCatalogEntry[];
  isLoading: boolean;
  error: { message: string } | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  createAction: { isPending: boolean; error: { message: string } | null };
  updateAction: { isPending: boolean; error: { message: string } | null };
  onCreate: (input: { name: string; description: string; permissionPayload: string[] }) => Promise<boolean>;
  onUpdate: (roleId: string, input: UpdateRoleInput) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggle = (permission: string) =>
    setSelected((current) =>
      current.includes(permission)
        ? current.filter((entry) => entry !== permission)
        : [...current, permission],
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    if (!name.trim() || !description.trim()) {
      setValidationError('A role name and a description are required.');
      return;
    }
    if (selected.length === 0) {
      setValidationError('Select at least one permission grant.');
      return;
    }
    const created = await onCreate({
      name: name.trim(),
      description: description.trim(),
      permissionPayload: selected,
    });
    if (created) {
      setName('');
      setDescription('');
      setSelected([]);
    }
  };

  const message = validationError ?? createAction.error?.message ?? null;

  return (
    <Section
      icon={<KeyRound size={15} className="text-[#15803D]" />}
      title="USER ROLES"
      description="Role definitions and the permission grants they carry. Grants are validated as Service:Action on write (NFR-21)."
      count={isLoading ? null : roles.length}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
    >
      {!canCreate && <Restricted grant="RoleService:Create" />}

      {canCreate && (
        <form onSubmit={handleSubmit} className="space-y-3 border border-[#E2E8F0] rounded p-3 bg-[#F8FAFC]">
          <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
            New Role
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block">
              <span className={LABEL}>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. RECORDS_OFFICER"
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Description</span>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Encodes and tracks requests"
                className={INPUT}
              />
            </label>
          </div>

          <PermissionPicker
            catalog={catalog}
            selected={selected}
            onToggle={toggle}
            disabled={createAction.isPending}
          />

          {message && <FormNote message={message} />}

          <PrimaryButton isPending={createAction.isPending}>
            {createAction.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            <span>{createAction.isPending ? 'Saving...' : 'Create Role'}</span>
          </PrimaryButton>
        </form>
      )}

      {isLoading && <Loading label="Loading role definitions..." />}
      {error && <RowError message={error.message} onRetry={onRefresh} />}

      {roles.length > 0 && (
        <ul className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded">
          {roles.map((role) => (
            <li key={role.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#0F172A]">{role.name}</div>
                  <div className="text-[11px] text-[#64748B]">{role.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] font-bold text-[#15803D]">
                    {role.permissionPayload.length} grant
                    {role.permissionPayload.length === 1 ? '' : 's'}
                  </span>
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => setEditingId((open) => (open === role.id ? null : role.id))}
                      title={`Edit ${role.name}`}
                      className="btn-fluid p-1 border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#081E36] rounded cursor-pointer"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {role.permissionPayload.map((permission) => (
                  <span
                    key={permission}
                    className="font-mono text-[10px] text-[#334155] bg-[#F1F5F9] border border-[#E2E8F0] rounded px-1.5 py-0.5"
                  >
                    {permission}
                  </span>
                ))}
              </div>

              {editingId === role.id && canUpdate && (
                <RoleEditor
                  role={role}
                  catalog={catalog}
                  isPending={updateAction.isPending}
                  errorMessage={updateAction.error?.message ?? null}
                  onSave={(input) => onUpdate(role.id, input)}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Inline role editor: name, description and the permission payload. */
function RoleEditor({
  role,
  catalog,
  isPending,
  errorMessage,
  onSave,
  onCancel,
}: {
  role: Role;
  catalog: PermissionCatalogEntry[];
  isPending: boolean;
  errorMessage: string | null;
  onSave: (input: UpdateRoleInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [selected, setSelected] = useState<string[]>(role.permissionPayload);
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggle = (permission: string) =>
    setSelected((current) =>
      current.includes(permission)
        ? current.filter((entry) => entry !== permission)
        : [...current, permission],
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    if (!name.trim() || !description.trim()) {
      setValidationError('A role name and a description are required.');
      return;
    }
    if (selected.length === 0) {
      setValidationError('A role must carry at least one permission grant.');
      return;
    }
    const saved = await onSave({
      name: name.trim(),
      description: description.trim(),
      permissionPayload: selected,
    });
    if (saved) onCancel();
  };

  const message = validationError ?? errorMessage;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className={LABEL}>Name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_SM} />
        </label>
        <label className="block">
          <span className={LABEL}>Description</span>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT_SM} />
        </label>
      </div>

      <PermissionPicker catalog={catalog} selected={selected} onToggle={toggle} disabled={isPending} />

      {message && <FormNote message={message} />}

      <div className="flex items-center gap-2">
        <PrimaryButton isPending={isPending}>
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          <span>{isPending ? 'Saving...' : 'Save role'}</span>
        </PrimaryButton>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
      </div>
    </form>
  );
}

export default function UserManagementPanel() {
  const toast = useToast();
  const me = useSessionUser();

  const canCreateUser = useCan('UserService:Create');
  const canReadUsers = useCan('UserService:Read');
  const canAssignRole = useCan('UserService:AssignRole');
  const canCreateRole = useCan('RoleService:Create');
  const canUpdateRole = useCan('RoleService:Update');

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const debouncedSearch = useDebouncedValue(search, 300);

  const usersQuery = useUsers({
    first: 100,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(activeFilter === 'all' ? {} : { filter: { isActive: activeFilter === 'active' } }),
    sort: { field: 'LAST_NAME', direction: 'ASC' },
  });
  const rolesQuery = useRoles({ first: 100, sort: { field: 'NAME', direction: 'ASC' } });
  const catalogQuery = usePermissionCatalog();

  const {
    create: createUser,
    updateProfile,
    deactivate,
    reactivate,
    assignRole,
    removeRole,
  } = useUserService();
  const { create: createRole, update: updateRole } = useRoleService();

  const createUserAction = useAsyncAction(createUser);
  const updateProfileAction = useAsyncAction(updateProfile);
  const deactivateAction = useAsyncAction(deactivate);
  const reactivateAction = useAsyncAction(reactivate);
  const assignRoleAction = useAsyncAction(assignRole);
  const removeRoleAction = useAsyncAction(removeRole);
  const createRoleAction = useAsyncAction(createRole);
  const updateRoleAction = useAsyncAction(updateRole);

  const users = useMemo(
    () => usersQuery.data?.edges.map((edge) => edge.node) ?? [],
    [usersQuery.data],
  );
  const roles = useMemo(
    () => rolesQuery.data?.edges.map((edge) => edge.node) ?? [],
    [rolesQuery.data],
  );
  const catalog = catalogQuery.data ?? [];

  const busy =
    updateProfileAction.isPending ||
    deactivateAction.isPending ||
    reactivateAction.isPending ||
    assignRoleAction.isPending ||
    removeRoleAction.isPending;

  const handleCreateUser = async (input: CreateUserInput): Promise<boolean> => {
    const created = await createUserAction.run(input);
    if (created) {
      toast.success(`Account ${created.email} provisioned.`);
      return true;
    }
    toast.error(createUserAction.getError()?.message ?? 'Unable to provision the account.');
    return false;
  };

  const handleUpdateProfile = async (id: string, input: UpdateUserProfileInput): Promise<boolean> => {
    const saved = await updateProfileAction.run(id, input);
    if (saved) {
      toast.success(`Account ${saved.email} updated.`);
      return true;
    }
    toast.error(updateProfileAction.getError()?.message ?? 'Unable to update the account.');
    return false;
  };

  const handleToggleActive = async (user: User): Promise<void> => {
    const action = user.isActive ? deactivateAction : reactivateAction;
    const updated = await action.run(user.id);
    if (updated) {
      toast.success(
        user.isActive
          ? `Account ${updated.email} disabled.`
          : `Account ${updated.email} reactivated.`,
      );
      return;
    }
    toast.error(
      action.getError()?.message ??
        `Unable to ${user.isActive ? 'disable' : 'reactivate'} the account.`,
    );
  };

  const handleAssignRole = async (userId: string, roleId: string): Promise<void> => {
    const updated = await assignRoleAction.run({ userId, roleId });
    if (updated) {
      toast.success(`Role granted to ${updated.email}.`);
      return;
    }
    toast.error(assignRoleAction.getError()?.message ?? 'Unable to grant the role.');
  };

  const handleRemoveRole = async (userId: string, roleId: string): Promise<void> => {
    const updated = await removeRoleAction.run({ userId, roleId });
    if (updated) {
      toast.success(`Role revoked from ${updated.email}.`);
      return;
    }
    toast.error(removeRoleAction.getError()?.message ?? 'Unable to revoke the role.');
  };

  const handleCreateRole = async (input: {
    name: string;
    description: string;
    permissionPayload: string[];
  }): Promise<boolean> => {
    const created = await createRoleAction.run(input);
    if (created) {
      toast.success(`Role ${created.name} created.`);
      return true;
    }
    toast.error(createRoleAction.getError()?.message ?? 'Unable to create the role.');
    return false;
  };

  const handleUpdateRole = async (roleId: string, input: UpdateRoleInput): Promise<boolean> => {
    const saved = await updateRoleAction.run(roleId, input);
    if (saved) {
      toast.success(`Role ${saved.name} updated.`);
      return true;
    }
    toast.error(updateRoleAction.getError()?.message ?? 'Unable to update the role.');
    return false;
  };

  return (
    <div className="space-y-4">
      <Section
        icon={<Users size={15} className="text-[#15803D]" />}
        title="USER MANAGEMENT"
        description="Plantilla accounts, their role grants, and the soft deactivation that retires an account without deleting its audit history (FR-03)."
        count={usersQuery.isLoading ? null : users.length}
        refreshing={usersQuery.isRefreshing}
        onRefresh={usersQuery.refresh}
      >
        {!canReadUsers && <Restricted grant="UserService:Read" />}

        {canReadUsers && (
          <>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block flex-1 min-w-56">
                <span className={LABEL}>Search</span>
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Name, email or office"
                    className={`${INPUT} pl-7`}
                  />
                </div>
              </label>
              <label className="block">
                <span className={LABEL}>Status</span>
                <select
                  value={activeFilter}
                  onChange={(event) =>
                    setActiveFilter(event.target.value as 'all' | 'active' | 'inactive')
                  }
                  className={INPUT}
                >
                  <option value="all">All accounts</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Disabled only</option>
                </select>
              </label>
            </div>

            {canCreateUser ? (
              <CreateAccountForm
                roles={roles}
                isPending={createUserAction.isPending}
                errorMessage={createUserAction.error?.message ?? null}
                onSubmit={handleCreateUser}
              />
            ) : (
              <Restricted grant="UserService:Create" />
            )}

            {usersQuery.isLoading && <Loading label="Loading user accounts..." />}
            {usersQuery.error && (
              <RowError message={usersQuery.error.message} onRetry={usersQuery.refresh} />
            )}

            {!usersQuery.isLoading && !usersQuery.error && (
              <>
                {users.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-[#64748B] border border-[#E2E8F0] rounded">
                    No accounts match the current search.
                  </div>
                ) : (
                  <ul className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded">
                    {users.map((user) => (
                      <AccountRow
                        key={user.id}
                        user={user}
                        roles={roles}
                        isSelf={user.id === me?.id}
                        canAssignRole={canAssignRole}
                        isBusy={busy}
                        updateAction={updateProfileAction}
                        onUpdate={(input) => handleUpdateProfile(user.id, input)}
                        onAssignRole={(userId, roleId) => void handleAssignRole(userId, roleId)}
                        onRemoveRole={(userId, roleId) => void handleRemoveRole(userId, roleId)}
                        onToggleActive={(target) => void handleToggleActive(target)}
                      />
                    ))}
                  </ul>
                )}

                <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg text-[11px] text-[#166534] font-semibold flex items-center gap-2">
                  <UserCog size={14} />
                  <span>
                    An account holder may edit their own profile and cannot disable their own
                    account; every other change on this desk needs an administrative grant.
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </Section>

      <RoleMaintenanceSection
        roles={roles}
        catalog={catalog}
        isLoading={rolesQuery.isLoading || catalogQuery.isLoading}
        error={rolesQuery.error ?? catalogQuery.error}
        onRefresh={() => {
          rolesQuery.refresh();
          catalogQuery.refresh();
        }}
        isRefreshing={rolesQuery.isRefreshing || catalogQuery.isRefreshing}
        canCreate={canCreateRole}
        canUpdate={canUpdateRole}
        createAction={createRoleAction}
        updateAction={updateRoleAction}
        onCreate={handleCreateRole}
        onUpdate={handleUpdateRole}
      />
    </div>
  );
}
