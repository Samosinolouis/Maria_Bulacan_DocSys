'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { VENUE_LABELS } from '@/lib/data';

export default function ScheduleView() {
  const { events, setNewEventOpen } = useApp();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded border border-[#94A3B8] flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-bold text-[#0F172A]">
            [ CENTRAL MUNICIPAL GAVEL & VENUE SCHEDULER ]
          </h3>
          <p className="text-xs text-[#64748B]">
            [ Prevent double-bookings across all 6 municipal venues and synchronize executive gavels. ]
          </p>
        </div>
        <button
          onClick={() => setNewEventOpen(true)}
          className="wf-btn text-xs px-3 py-1.5"
        >
          [ + Schedule Venue ]
        </button>
      </div>

      {/* 6 Municipal Venues Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(VENUE_LABELS).map(([venueKey, val]) => {
          const venueBookings = events.filter((e) => e.venue === venueKey);
          return (
            <div
              key={venueKey}
              className="p-4 bg-white rounded border border-[#CBD5E1] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold border border-[#94A3B8] px-2 py-0.5 rounded bg-[#F8FAFC]">
                  [ Capacity: {val.capacity} ]
                </span>
                <span className="wf-badge">
                  [{venueBookings.length > 0 ? 'OCCUPIED' : 'AVAILABLE'}]
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#0F172A]">[{val.label}]</h4>
                <p className="text-[11px] text-[#64748B]">[{val.location}]</p>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] text-xs space-y-1">
                <span className="font-mono text-[10px] font-bold text-[#0F172A] block">
                  [ UPCOMING GAVELS: ]
                </span>
                {venueBookings.length > 0 ? (
                  venueBookings.map((b) => (
                    <div key={b.id} className="text-[11px] text-[#475569] font-mono truncate">
                      &bull; [{b.title}] ({b.startTime} - {b.endTime})
                    </div>
                  ))
                ) : (
                  <span className="text-[#94A3B8] italic text-[11px] font-mono">
                    [ No active bookings logged ]
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
