'use client';

import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: EventBooking = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      venue,
      title: title || '[ Untitled Venue Booking ]',
      organizer: organizer || '[ Organizer Placeholder ]',
      department: department || '[ Department Placeholder ]',
      date,
      startTime,
      endTime,
      attendees: ['[ Executive Attendees ]'],
      status: 'CONFIRMED',
      involvesMayor: false,
      involvesAdmin: true,
      notes: '[ Official Municipal Activity ]',
    };
    onSubmit(newEvent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white border-2 border-[#0F172A] rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b border-[#94A3B8] bg-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#0F172A]">
            <Calendar size={14} />
            <span>[ CENTRAL VENUE & GAVEL SCHEDULER &bull; WIREFRAME ]</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 border border-[#0F172A] bg-white rounded flex items-center justify-center text-xs hover:bg-[#F1F5F9]"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
          <div>
            <label className="font-bold text-[#0F172A] block mb-1">[ Target Municipal Venue ]</label>
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value as Venue)}
              className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
            >
              {Object.entries(VENUE_LABELS).map(([k, val]) => (
                <option key={k} value={k}>
                  [{val.label}] (Capacity: {val.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-[#0F172A] block mb-1">[ Event / Session Subject ]</label>
            <input
              type="text"
              placeholder="[ e.g., Municipal Disaster Risk Reduction & Management Council Meeting ]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#0F172A] block mb-1">[ Presiding Officer / Organizer ]</label>
              <input
                type="text"
                placeholder="[ e.g., Engr. Santos / MDRRMO ]"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-[#0F172A] block mb-1">[ Host Department / Office ]</label>
              <input
                type="text"
                placeholder="[ e.g., Municipal Planning Office ]"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-[#0F172A] block mb-1">[ Date ]</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-[#0F172A] block mb-1">[ Start Time ]</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-[#0F172A] block mb-1">[ End Time ]</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border border-[#94A3B8] bg-white rounded text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#CBD5E1] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="wf-btn wf-btn-secondary text-xs"
            >
              [ Cancel ]
            </button>
            <button
              type="submit"
              className="wf-btn text-xs"
            >
              [ Confirm Schedule ]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
