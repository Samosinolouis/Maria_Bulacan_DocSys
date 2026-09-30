'use client';

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, AlertCircle } from 'lucide-react';
import { EventBooking, Venue } from '@/lib/types';
import { VENUE_LABELS } from '@/lib/data';

interface EventModalProps {
  existingEvents: EventBooking[];
  onClose: () => void;
  onSubmit: (newEvent: EventBooking) => void;
}

export default function EventModal({ existingEvents, onClose, onSubmit }: EventModalProps) {
  const [venue, setVenue] = useState<Venue>('CONFERENCE_ROOM');
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [involvesMayor, setInvolvesMayor] = useState(false);
  const [involvesAdmin, setInvolvesAdmin] = useState(true);
  const [notes, setNotes] = useState('');

  // Conflict Detection
  const hasConflict = existingEvents.some(
    (e) =>
      e.venue === venue &&
      e.date === date &&
      e.status === 'CONFIRMED' &&
      ((startTime >= e.startTime && startTime < e.endTime) ||
        (endTime > e.startTime && endTime <= e.endTime) ||
        (startTime <= e.startTime && endTime >= e.endTime))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organizer.trim() || !department.trim()) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    if (hasConflict) {
      if (!confirm('A booking conflict exists for this venue and time slot. Do you wish to log this as TENTATIVE pending resolution?')) {
        return;
      }
    }

    const newEvent: EventBooking = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      venue,
      title,
      organizer,
      department,
      date,
      startTime,
      endTime,
      attendees: [
        involvesMayor ? 'Mayor Bartolome' : '',
        involvesAdmin ? 'Engr. Clemente (MA)' : '',
        organizer,
      ].filter(Boolean),
      involvesMayor,
      involvesAdmin,
      status: hasConflict ? 'TENTATIVE' : 'CONFIRMED',
      notes,
    };

    onSubmit(newEvent);
  };

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
            onClick={onClose}
            className="p-1 text-[#CBD5E1] hover:text-white rounded cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Select Municipal Venue *
            </label>
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value as Venue)}
              className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-xs font-semibold focus:outline-none focus:border-[#15803D]"
            >
              {Object.entries(VENUE_LABELS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label} (Cap: {val.capacity})
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">
                Organizer Name *
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="e.g. Officer R. Santos"
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#081E36] mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
          {hasConflict && (
            <div className="p-3 bg-[#F1F5F9] border-l-4 border-[#081E36] rounded text-[#0F172A] flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#081E36]" />
              <div>
                <strong className="block text-[11px] uppercase font-bold">
                  Scheduling Conflict Detected:
                </strong>
                <span className="text-[#475569]">
                  Another municipal meeting is already confirmed for this venue during the selected
                  time interval.
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
                  checked={involvesAdmin}
                  onChange={(e) => setInvolvesAdmin(e.target.checked)}
                  className="rounded text-[#15803D]"
                />
                <span>Involves Municipal Administrator</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#081E36] mb-1">
              Logistics & Setup Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sound system, projector, tables for 30 attendees..."
              rows={2}
              className="w-full p-2 border border-[#CBD5E1] rounded focus:outline-none focus:border-[#15803D]"
            />
          </div>

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
              className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded font-bold text-xs cursor-pointer shadow"
            >
              Confirm Venue Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
