'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Calendar, MapPin, Users, PlusCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { VENUE_LABELS } from '@/lib/data';
import HighlightMatch from '@/components/HighlightMatch';
import { Venue } from '@/lib/types';

export default function ScheduleView() {
  const { events, setNewEventOpen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<string>('ALL');

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesVenue = selectedVenue === 'ALL' || evt.venue === selectedVenue;
      const venueLabel = VENUE_LABELS[evt.venue]?.label || evt.venue;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        evt.organizer.toLowerCase().includes(q) ||
        evt.department.toLowerCase().includes(q) ||
        venueLabel.toLowerCase().includes(q) ||
        evt.date.includes(q);
      return matchesVenue && matchesSearch;
    });
  }, [events, searchQuery, selectedVenue]);

  return (
    <div className="space-y-5 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            CENTRAL MUNICIPAL GAVEL & VENUE SCHEDULER
          </h3>
          <p className="text-xs text-[#64748B]">
            Prevent double-bookings across all 6 municipal venues and synchronize executive gavels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gavels..."
              className="w-full pl-8 pr-7 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#15803D] bg-white text-[#0F172A]"
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

          <button
            onClick={() => setNewEventOpen(true)}
            className="btn-fluid px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow shrink-0 flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            <span>Schedule Gavel</span>
          </button>
        </div>
      </div>

      {/* 6 Municipal Venues Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(VENUE_LABELS).map(([venueKey, val]) => {
          const venueBookings = events.filter((e) => e.venue === venueKey);
          const isSelected = selectedVenue === venueKey;

          return (
            <div
              key={venueKey}
              onClick={() => setSelectedVenue((prev) => (prev === venueKey ? 'ALL' : venueKey))}
              className={`p-4 bg-white rounded border shadow-sm space-y-2 card-fluid cursor-pointer transition-all ${
                isSelected ? 'border-[#081E36] ring-1 ring-[#081E36]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-[#081E36] bg-[#F1F5F9] px-2 py-0.5 rounded">
                  Capacity: {val.capacity}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    venueBookings.length > 0
                      ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1]'
                      : 'bg-[#DCFCE7] text-[#166534]'
                  }`}
                >
                  {venueBookings.length > 0 ? `${venueBookings.length} BOOKED` : 'AVAILABLE'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">{val.label}</h4>
              <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                <MapPin size={11} className="shrink-0 text-[#94A3B8]" />
                <span className="truncate">{val.location}</span>
              </p>

              <div className="pt-2 border-t border-[#E2E8F0] text-xs">
                <span className="font-bold text-[#081E36] block mb-1">Booked Proceedings:</span>
                {venueBookings.length > 0 ? (
                  venueBookings.slice(0, 2).map((b) => (
                    <div key={b.id} className="text-[11px] text-[#334155] truncate">
                      • {b.title} ({b.startTime} - {b.endTime})
                    </div>
                  ))
                ) : (
                  <span className="text-[#64748B] italic text-[11px]">No bookings scheduled.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtered Events Schedule Ledger */}
      <div className="bg-white rounded border border-[#CBD5E1] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-cinzel text-xs font-bold text-[#081E36] uppercase tracking-wider">
              Scheduled Municipal Hearings & Proceedings
            </h4>
            {selectedVenue !== 'ALL' && (
              <span className="font-mono text-[10px] font-bold bg-[#081E36] text-white px-2 py-0.5 rounded">
                Filtered: {VENUE_LABELS[selectedVenue as Venue]?.label || selectedVenue}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {selectedVenue !== 'ALL' && (
              <button
                onClick={() => setSelectedVenue('ALL')}
                className="text-[#15803D] hover:underline font-semibold cursor-pointer"
              >
                Show All Venues
              </button>
            )}
            <span className="font-mono text-[#64748B] text-[11px]">
              {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-[#64748B] text-xs space-y-1">
            <div className="font-bold text-[#081E36]">No Scheduled Proceedings Found</div>
            <p>No hearings match your search parameters or venue filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {filteredEvents.map((evt) => {
              const venue = VENUE_LABELS[evt.venue]?.label || evt.venue;
              return (
                <div key={evt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
                        {venue}
                      </span>
                      <span className="font-mono text-[11px] text-[#64748B]">
                        {evt.date} | {evt.startTime} - {evt.endTime}
                      </span>
                      {evt.involvesMayor && (
                        <span className="text-[10px] font-bold text-[#081E36] bg-[#E2E8F0] border border-[#CBD5E1] px-1.5 py-0.5 rounded">
                          MAYOR PRESIDING
                        </span>
                      )}
                    </div>
                    <h5 className="font-bold text-sm text-[#0F172A]">
                      <HighlightMatch text={evt.title} query={searchQuery} />
                    </h5>
                    <div className="text-[#64748B] text-[11px]">
                      Organizer: <HighlightMatch text={evt.organizer} query={searchQuery} /> (<HighlightMatch text={evt.department} query={searchQuery} />)
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded border border-[#86EFAC] shrink-0 self-start sm:self-center">
                    CONFIRMED
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

