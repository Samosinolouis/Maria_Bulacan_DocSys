'use client';

/**
 * Required-attendee picker (FR-43).
 *
 * The full personnel directory, opened from the scheduling form so the list of
 * users does not crowd the booking dialog itself. Rendered through `Portal`:
 * the EventModal panel animates with `animate-fluid-modal`, which keeps a
 * `transform` and therefore becomes the containing block for `position: fixed`
 * descendants (and clips them with its `overflow-hidden`), so a nested overlay
 * must live in `document.body` to cover the viewport.
 */

import { useMemo, useState } from 'react';
import { Check, Search, Users, X } from 'lucide-react';
import Portal from '@/components/Portal';
import type { User } from '@/services/contracts/models';

interface AttendeePickerModalProps {
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

export default function AttendeePickerModal({
  users,
  selectedIds,
  onChange,
  onClose,
}: AttendeePickerModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.firstName, user.middleName, user.lastName, user.office, user.position]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [users, query]);

  const toggle = (userId: string) => {
    onChange(
      selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId],
    );
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-[#081E36]/50 p-4 animate-fluid-fade"
        onClick={(e) => {
          // React portal events bubble up the REACT tree, so without this the
          // click would also reach the EventModal overlay's own onClose and
          // dismiss the booking dialog underneath.
          e.stopPropagation();
          onClose();
        }}
      >
        <div
          className="w-full max-w-lg bg-white rounded-lg border border-[#081E36] shadow-2xl overflow-hidden animate-fluid-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#081E36] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[#86EFAC]" />
              <span className="font-cinzel text-sm font-bold">REQUIRED ATTENDEES</span>
              <span className="font-mono text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                {selectedIds.length} selected
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="text-[#CBD5E1] hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Directory search */}
          <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search personnel by name, office or position..."
                className="w-full pl-8 pr-7 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] text-[#0F172A]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#081E36] cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Directory list */}
          <div className="max-h-[55vh] overflow-y-auto divide-y divide-[#F1F5F9]">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                {users.length === 0
                  ? 'No personnel directory available for your account.'
                  : 'No personnel match your search.'}
              </div>
            ) : (
              filtered.map((user) => {
                const fullName = [user.firstName, user.middleName, user.lastName, user.suffix]
                  .filter(Boolean)
                  .join(' ');
                const checked = selectedIds.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(user.id)}
                      className="rounded text-[#15803D] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#0F172A] truncate">{fullName}</div>
                      <div className="text-[10px] text-[#64748B] truncate">
                        {[user.position, user.office].filter(Boolean).join(' - ') || user.email}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selectedIds.length === 0}
              className="px-2.5 py-1 border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#334155] rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear all
            </button>
            <span className="text-[10px] text-[#64748B]">
              {filtered.length} of {users.length} personnel shown
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn-fluid px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Check size={12} />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
