'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  X,
  MapPin,
  PlusCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Ban,
} from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useCan, useEvents, useVenues } from '@/hooks';
import { resolveStatusMeta, venueLabel } from '@/lib/constants';
import type { Connection, Event, EventStatus } from '@/services/contracts/models';
import HighlightMatch from '@/components/HighlightMatch';

const EVENT_STATUS_META: Record<EventStatus, { label: string; badgeCls: string }> = {
  CONFIRMED: { label: 'Confirmed', badgeCls: 'text-[#166534] bg-[#DCFCE7] border border-[#86EFAC]' },
  TENTATIVE: { label: 'Tentative', badgeCls: 'text-[#854D0E] bg-[#FEF9C3] border border-[#FDE68A]' },
  CANCELLED: { label: 'Cancelled', badgeCls: 'text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1]' },
};

export default function ScheduleView() {
  const { setNewEventOpen, cancelEvent } = useApp();

  const eventsQuery = useEvents({
    first: 100,
    sort: { field: 'EVENT_DATE', direction: 'ASC' },
  });
  const venuesQuery = useVenues();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<string>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const events = useMemo(
    () => (eventsQuery.data as Connection<Event> | null)?.edges.map((edge) => edge.node) ?? [],
    [eventsQuery.data],
  );
  const venues = venuesQuery.data ?? [];

  const isLoading = eventsQuery.isLoading || venuesQuery.isLoading;
  const error = eventsQuery.error ?? venuesQuery.error;

  const refreshAll = () => {
    eventsQuery.refresh();
    venuesQuery.refresh();
  };

  const venueName = (event: Event): string => {
    if (event.venue?.name) return event.venue.name;
    const venue = venues.find((item) => item.id === event.venueId);
    if (venue) return venue.name || venueLabel(venue.code);
    return venueLabel(event.venue?.code ?? event.venueId);
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return events.filter((event) => {
      const matchesVenue = selectedVenue === 'ALL' || event.venueId === selectedVenue;
      if (!matchesVenue) return false;
      if (!q) return true;
      return [event.title, event.department, venueName(event), event.eventDate]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, venues, searchQuery, selectedVenue]);

  const handleCancel = async (eventId: string, reason: string) => {
    setCancellingId(eventId);
    const result = await cancelEvent(eventId, reason.trim() ? reason.trim() : null);
    setCancellingId(null);
    if (result) eventsQuery.refresh();
  };

  if (isLoading) {
    return <LoadingPanel label="Loading venue and event calendar..." />;
  }

  if (error) {
    return <ErrorPanel message={error.message} onRetry={refreshAll} />;
  }

  return (
    <div className="space-y-5 animate-fluid-tab">
      <div className="p-4 bg-white rounded border border-[#CBD5E1] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-cinzel text-base font-bold text-[#081E36]">
            CENTRAL MUNICIPAL GAVEL & VENUE SCHEDULER
          </h3>
          <p className="text-xs text-[#64748B]">
            Prevent double-bookings across every municipal venue and synchronize executive gavels.
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
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Municipal Venues Status Grid - driven entirely by the venue lookup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((venue) => {
          // `activeBookings` is computed per query on the server (CONFIRMED and
          // not yet ended), so the availability badge is live rather than a
          // count of whatever events this page happened to load. The list below
          // is just the preview drawn from the loaded calendar page.
          const activeCount = venue.activeBookings;
          const venueBookings = events.filter(
            (event) => event.venueId === venue.id && event.status !== 'CANCELLED',
          );
          const isSelected = selectedVenue === venue.id;

          return (
            <div
              key={venue.id}
              onClick={() => setSelectedVenue((prev) => (prev === venue.id ? 'ALL' : venue.id))}
              className={`p-4 bg-white rounded border shadow-sm space-y-2 card-fluid cursor-pointer transition-all ${
                isSelected ? 'border-[#081E36] ring-1 ring-[#081E36]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-[#081E36] bg-[#F1F5F9] px-2 py-0.5 rounded">
                  {venue.specialUse ? 'SPECIAL USE' : 'GENERAL USE'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    activeCount > 0
                      ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1]'
                      : 'bg-[#DCFCE7] text-[#166534]'
                  }`}
                  title={`${activeCount} confirmed booking${activeCount === 1 ? '' : 's'} not yet ended`}
                >
                  {activeCount > 0 ? `${activeCount} ACTIVE` : 'AVAILABLE'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">{venue.name || venueLabel(venue.code)}</h4>
              <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                <MapPin size={11} className="shrink-0 text-[#94A3B8]" />
                <span className="truncate font-mono">{venue.code}</span>
              </p>

              <div className="pt-2 border-t border-[#E2E8F0] text-xs">
                <span className="font-bold text-[#081E36] block mb-1">Scheduled Proceedings:</span>
                {venueBookings.length > 0 ? (
                  venueBookings.slice(0, 2).map((booking) => (
                    <div key={booking.id} className="text-[11px] text-[#334155] truncate">
                      - {booking.title} ({booking.startTime} - {booking.endTime})
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
                Filtered: {venueLabel(venues.find((v) => v.id === selectedVenue)?.code ?? selectedVenue)}
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
            {filteredEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                venueName={venueName(event)}
                searchQuery={searchQuery}
                isCancelling={cancellingId === event.id}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({
  event,
  venueName,
  searchQuery,
  isCancelling,
  onCancel,
}: {
  event: Event;
  venueName: string;
  searchQuery: string;
  isCancelling: boolean;
  onCancel: (eventId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const canCancel = useCan('EventService:Cancel', {
    kind: 'event',
    attributes: { status: event.status },
  });
  const statusMeta = resolveStatusMeta(EVENT_STATUS_META, event.status);

  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#081E36] text-white rounded">
            {venueName}
          </span>
          <span className="font-mono text-[11px] text-[#64748B]">
            {event.eventDate} | {event.startTime} - {event.endTime}
          </span>
          {event.involvesMayor && (
            <span className="text-[10px] font-bold text-[#081E36] bg-[#E2E8F0] border border-[#CBD5E1] px-1.5 py-0.5 rounded">
              MAYOR PRESIDING
            </span>
          )}
        </div>
        <h5 className="font-bold text-sm text-[#0F172A]">
          <HighlightMatch text={event.title} query={searchQuery} />
        </h5>
        <div className="text-[#64748B] text-[11px]">
          Department: <HighlightMatch text={event.department} query={searchQuery} />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
        <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded ${statusMeta.badgeCls}`}>
          {statusMeta.label.toUpperCase()}
        </span>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          disabled={!canCancel || event.status === 'CANCELLED'}
          className="w-36 p-1.5 border border-[#CBD5E1] rounded text-[11px] focus:outline-none focus:border-[#15803D] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]"
        />
        <button
          onClick={() => onCancel(event.id, reason)}
          disabled={!canCancel || isCancelling || event.status === 'CANCELLED'}
          className="btn-fluid px-3 py-1 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          title={canCancel ? 'Cancel this event' : 'Not permitted for this event'}
        >
          {isCancelling ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="space-y-5 animate-fluid-tab">
      <div className="bg-white p-10 rounded border border-[#CBD5E1] shadow-sm flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#081E36]" />
        <span className="text-xs font-bold text-[#081E36]">{label}</span>
      </div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="space-y-5 animate-fluid-tab">
      <div className="bg-white p-6 rounded border border-[#CBD5E1] shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[#081E36]">
          <AlertCircle size={18} />
          <span className="font-bold text-sm">Unable to Load the Venue Scheduler</span>
        </div>
        <p className="text-xs text-[#475569] leading-relaxed">{message}</p>
        <button
          onClick={onRetry}
          className="btn-fluid px-3.5 py-1.5 bg-[#081E36] hover:bg-[#0B2545] text-white rounded text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}
