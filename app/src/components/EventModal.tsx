'use client';

import React, { useMemo, useState } from 'react';
import { X, AlertCircle, Users, UserPlus } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useVenues, useEventService, useUsers } from '@/hooks';
import { venueLabel } from '@/lib/constants';
import AttendeePickerModal from '@/components/AttendeePickerModal';
import type { BookingConflict, User } from '@/services/contracts/models';
import type { CreateEventInput } from '@/services/contracts/event';

interface EventModalProps {
  onClose: () => void;
  onSubmitted: () => void;
}

export default function EventModal({ onClose, onSubmitted }: EventModalProps) {
  const { createEvent, lastError } = useApp();
  const { data: venues, isLoading: venuesLoading, error: venuesError } = useVenues();
  const { checkConflicts } = useEventService();
  // Required attendees (FR-43): the reminder channel is in-app, so they must be
  // real users. Attendee clashes are part of the conflict dry-run.
  const { data: usersConnection } = useUsers({ first: 100, sort: { field: 'LAST_NAME', direction: 'ASC' } });

  const venueList = venues ?? [];
  const users: User[] = useMemo(
    () => usersConnection?.edges.map((edge) => edge.node) ?? [],
    [usersConnection],
  );

  const [venueId, setVenueId] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [involvesMayor, setInvolvesMayor] = useState(false);
  const [involvesAdministrator, setInvolvesAdministrator] = useState(true);
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [attendeeModalOpen, setAttendeeModalOpen] = useState(false);
  const [notes, setNotes] = useState('');

  /** The tagged attendees, resolved to directory records for the chip row. */
  const selectedAttendees = useMemo(
    () =>
      attendeeIds
        .map((id) => users.find((user) => user.id === id))
        .filter((user): user is User => Boolean(user)),
    [attendeeIds, users],
  );

  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const effectiveVenueId = venueId || venueList[0]?.id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSubmitFailed(false);

    if (!effectiveVenueId) {
      setValidationError('Select a municipal venue before booking.');
      return;
    }
    if (!title.trim() || !department.trim() || !eventDate || !startTime || !endTime) {
      setValidationError('Please fill in all mandatory fields.');
      return;
    }
    if (startTime >= endTime) {
      setValidationError('The end time must be later than the start time.');
      return;
    }

    const input: CreateEventInput = {
      venueId: effectiveVenueId,
      title: title.trim(),
      department: department.trim(),
      eventDate,
      startTime,
      endTime,
      involvesMayor,
      involvesAdministrator,
      attendeeIds,
      notes: notes.trim() ? notes.trim() : null,
    };

    setIsWorking(true);

    // Dry-run conflict detection on the first attempt.
    if (!conflictAcknowledged) {
      let detected: BookingConflict[] = [];
      try {
        detected = (await checkConflicts(input)) ?? [];
      } catch {
        setIsWorking(false);
        setSubmitFailed(true);
        return;
      }
      setConflicts(detected);
      if (detected.length > 0) {
        // Surface the conflict and wait for the officer to confirm.
        setConflictAcknowledged(true);
        setIsWorking(false);
        return;
      }
    }

    const result = await createEvent({
      ...input,
      status: conflicts.length > 0 ? 'TENTATIVE' : 'CONFIRMED',
    });
    setIsWorking(false);

    if (result) {
      onSubmitted();
      return;
    }
    setSubmitFailed(true);
  };

  const errorMessage =
    validationError ??
    venuesError?.message ??
    (submitFailed
      ? lastError?.message ?? 'Unable to confirm the venue booking. Please try again.'
      : null);

  return (
    <div
      className="fixed inset-0 bg-[#081E36]/75 z-50 flex items-center justify-center p-4 animate-fluid-fade"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg shadow-2xl border border-[#081E36] overflow-hidden animate-fluid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#081E36] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#15803D]">
          <h3 className="font-serif-docket text-base font-bold text-white">
            Schedule Municipal Venue or Executive Gavel
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#CBD5E1] hover:text-white rounded cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]"
        >
          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Select Municipal Venue *
            </label>
            <select
              value={effectiveVenueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-xs font-semibold focus:outline-none focus:border-[#15803D]"
            >
              {venuesLoading && venueList.length === 0 && (
                <option value="">Loading venues...</option>
              )}
              {!venuesLoading && venueList.length === 0 && (
                <option value="">No venues available</option>
              )}
              {venueList.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name || venueLabel(venue.code)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Meeting / Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Municipal Peace and Order Council Quarterly Deliberation"
              required
              className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Department / Office *
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. MDRRMO"
              required
              className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">Date *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D]"
              />
            </div>
          </div>

          {/* Conflict Alert Box - Dignified Civic Alert */}
          {conflicts.length > 0 && (
            <div className="p-3 bg-[#F1F5F9] border-l-4 border-[#081E36] rounded text-[#0F172A] flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#081E36]" />
              <div>
                <strong className="block text-[11px] uppercase font-bold">
                  Scheduling Conflict Detected:
                </strong>
                <ul className="text-[#475569] list-disc list-inside">
                  {conflicts.map((conflict, index) => (
                    <li key={`${conflict.kind}-${index}`}>{conflict.message}</li>
                  ))}
                </ul>
                <span className="text-[#475569]">
                  Confirm again to log this booking as TENTATIVE pending resolution.
                </span>
              </div>
            </div>
          )}

          {/* Principal Dignitary Attendance */}
          <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded">
            <span className="block text-[11px] font-bold uppercase text-[#081E36] mb-2">
              Principal Official Attendance
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs">
                <input
                  type="checkbox"
                  checked={involvesMayor}
                  onChange={(e) => setInvolvesMayor(e.target.checked)}
                  className="rounded text-[#15803D]"
                />
                <span>Involves Municipal Mayor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs">
                <input
                  type="checkbox"
                  checked={involvesAdministrator}
                  onChange={(e) => setInvolvesAdministrator(e.target.checked)}
                  className="rounded text-[#15803D]"
                />
                <span>Involves Municipal Administrator</span>
              </label>
            </div>
          </div>

          {/* Required attendees (FR-43) - the directory opens in its own modal */}
          <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#081E36]">
                <Users size={13} className="text-[#64748B]" />
                Required Attendees
                {attendeeIds.length > 0 && (
                  <span className="font-mono text-[10px] font-bold text-[#334155] bg-white border border-[#CBD5E1] px-1.5 py-0.5 rounded">
                    {attendeeIds.length}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setAttendeeModalOpen(true)}
                className="btn-fluid inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-[11px] font-semibold cursor-pointer shadow-xs"
                title="Open the personnel directory and tag the required attendees"
              >
                <UserPlus size={12} />
                <span>{attendeeIds.length > 0 ? 'Change attendees' : 'Select attendees'}</span>
              </button>
            </div>

            {selectedAttendees.length === 0 ? (
              <p className="text-[11px] text-[#64748B]">
                No attendees tagged yet. Open the directory to tag the personnel required at this
                event - they receive the in-app reminder.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedAttendees.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-white border border-[#CBD5E1] rounded text-[11px] font-semibold text-[#0F172A]"
                  >
                    <span className="truncate max-w-[12rem]">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttendeeIds((prev) => prev.filter((id) => id !== user.id))
                      }
                      title={`Remove ${user.firstName} ${user.lastName}`}
                      className="text-[#94A3B8] hover:text-[#081E36] cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Logistics &amp; Setup Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sound system, projector, tables for 30 attendees..."
              rows={2}
              className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D]"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#F1F5F9] border-l-4 border-[#081E36] rounded text-[#0F172A] flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#081E36]" />
              <span className="text-[#475569]">{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isWorking}
              className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded font-bold text-xs cursor-pointer shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {conflictAcknowledged ? 'Log as Tentative Booking' : 'Confirm Venue Booking'}
            </button>
          </div>
        </form>
      </div>

      {/* The personnel directory opens above this dialog, portalled to body. */}
      {attendeeModalOpen && (
        <AttendeePickerModal
          users={users}
          selectedIds={attendeeIds}
          onChange={setAttendeeIds}
          onClose={() => setAttendeeModalOpen(false)}
        />
      )}
    </div>
  );
}
