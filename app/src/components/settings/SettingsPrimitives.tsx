'use client';

/**
 * Shared presentational primitives for the Settings configuration desk.
 *
 * The desk is a set of tabbed sections that all speak the same visual language:
 * a titled shell with a count badge, a green civic action, a status pill and a
 * user-safe error row. Extracted so every tab (including User Management) reuses
 * one definition instead of copying the markup.
 */

import React from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';

export const INPUT =
  'w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D]';
export const LABEL = 'block text-[11px] font-bold text-[#081E36] mb-1';

/** Section shell: header, count and the maintenance body. */
export function Section({
  icon,
  title,
  description,
  count,
  refreshing,
  onRefresh,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded border border-[#CBD5E1] shadow-sm overflow-hidden">
      <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-start justify-between gap-3">
        <div>
          <h3 className="font-cinzel text-sm font-bold text-[#081E36] flex items-center gap-2">
            {icon}
            {title}
            {count !== null && (
              <span className="font-mono text-[10px] font-bold text-[#334155] bg-white border border-[#CBD5E1] px-1.5 py-0.5 rounded">
                {count}
              </span>
            )}
          </h3>
          <p className="text-[11px] text-[#64748B] mt-0.5">{description}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs font-bold text-[#15803D] hover:underline cursor-pointer inline-flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        )}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

/** Placeholder shown when the actor lacks the grant a tab needs. */
export function Restricted({ grant }: { grant: string }) {
  return (
    <p className="text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
      Maintaining this reference data requires the {grant} grant.
    </p>
  );
}

/** ACTIVE / INACTIVE pill. */
export function StatusBadge({ isActive }: { isActive: boolean }) {
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

/** Inline failure row with a retry affordance. */
export function RowError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-3 bg-white border border-[#334155] rounded text-xs text-[#0F172A] font-semibold flex items-center justify-between gap-2">
      <span className="flex items-start gap-2">
        <X size={14} className="text-[#334155] shrink-0 mt-0.5" />
        <span>{message}</span>
      </span>
      <button
        onClick={onRetry}
        className="btn-fluid px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold cursor-pointer shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

/** Loading line. */
export function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#64748B]">
      <Loader2 size={14} className="animate-spin text-[#94A3B8]" />
      <span>{label}</span>
    </div>
  );
}

/** Green civic submit button, shared by every maintenance form. */
export function PrimaryButton({
  children,
  isPending,
  disabled,
  type = 'submit',
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  isPending?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isPending || disabled}
      className={`btn-fluid inline-flex items-center gap-1 px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

/** Neutral secondary button. */
export function SecondaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-fluid px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#334155] rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/** Inline validation / failure note. */
export function FormNote({ message }: { message: string }) {
  return (
    <p className="text-[11px] text-[#0F172A] font-semibold bg-white border border-[#E2E8F0] rounded px-2 py-1">
      {message}
    </p>
  );
}
