'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { VENUE_LABELS } from '@/lib/data';

export default function ScheduleView() {
  const { events, setNewEventOpen } = useApp();

  return (
    <div className="space-y-4 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex items-center justify-between shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            CENTRAL MUNICIPAL GAVEL & VENUE SCHEDULER
          </h3>
          <p className="text-xs text-[#64748B]">
            Prevent double-bookings across all 6 municipal venues and synchronize executive gavels.
          </p>
        </div>
        <button
          onClick={() => setNewEventOpen(true)}
          className="btn-fluid px-3.5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-bold cursor-pointer shadow"
        >
          Schedule Venue
        </button>
      </div>

      {/* 6 Municipal Venues Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(VENUE_LABELS).map(([venueKey, val]) => {
          const venueBookings = events.filter((e) => e.venue === venueKey);
          return (
            <div
              key={venueKey}
              className="p-4 bg-white rounded border border-[#CBD5E1] shadow-sm space-y-2 card-fluid"
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
                  {venueBookings.length > 0 ? 'OCCUPIED' : 'AVAILABLE'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">{val.label}</h4>
              <p className="text-[11px] text-[#64748B]">{val.location}</p>

              <div className="pt-2 border-t border-[#E2E8F0] text-xs">
                <span className="font-bold text-[#081E36] block mb-1">Upcoming Gavels:</span>
                {venueBookings.length > 0 ? (
                  venueBookings.map((b) => (
                    <div key={b.id} className="text-[11px] text-[#334155] truncate">
                      - {b.title} ({b.startTime} - {b.endTime})
                    </div>
                  ))
                ) : (
                  <span className="text-[#64748B] italic text-[11px]">No active bookings logged.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
