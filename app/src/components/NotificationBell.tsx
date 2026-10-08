'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bell, BellOff, CheckCheck, Loader2, X } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import {
  useAsyncAction,
  useCan,
  useNotificationService,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks';
import type { Notification } from '@/services/contracts/models';
import { renderTemplate } from '@/lib/template';
import { useToast } from '@/providers/ToastProvider';

/** Display timestamp for an inbox row (localized, minute precision). */
function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Header notification bell (FR-47..49): unread badge, a compact inbox dropdown,
 * and per-row / bulk mark-read. Deep-links into a request only when the Request
 * object is already in hand - it never fetches here.
 */
export default function NotificationBell() {
  const { selectedRequest, setSelectedRequest } = useApp();
  const canRead = useCan('NotificationService:Read');
  const canMarkRead = useCan('NotificationService:MarkRead');

  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadQuery = useUnreadNotificationCount();
  const listQuery = useNotifications({ first: 20 });

  const { markRead, markAllRead } = useNotificationService();
  const markReadAction = useAsyncAction(markRead);
  const markAllAction = useAsyncAction(markAllRead);
  const toast = useToast();

  const refreshList = listQuery.refresh;
  const refreshUnread = unreadQuery.refresh;

  const notifications = useMemo(
    () => listQuery.data?.edges.map((edge) => edge.node) ?? [],
    [listQuery.data],
  );
  const unreadCount = unreadQuery.data ?? 0;

  // Dynamically compute whether dropdown should open towards left or right
  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const panelWidth = 384; // sm:w-96

      // On mobile / narrow screens (< 640px), align left to fit screen bounds
      if (viewportWidth < 640) {
        setPlacement('left');
        return;
      }

      const spaceRight = viewportWidth - rect.left;
      const spaceLeft = rect.right;

      // When the bell is in the right half of the screen and there's enough space to the left:
      if (rect.left > viewportWidth / 2 && spaceLeft >= panelWidth) {
        setPlacement('right');
      } else if (spaceRight >= panelWidth) {
        setPlacement('left');
      } else {
        setPlacement(spaceRight >= spaceLeft ? 'left' : 'right');
      }
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    return () => window.removeEventListener('resize', updatePlacement);
  }, [open]);

  // Close the panel on outside click/tap or Escape key.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleOpenNotification = async (notification: Notification) => {
    const result = canMarkRead ? await markReadAction.run(notification.id) : null;
    if (result) {
      refreshList();
      refreshUnread();
    }
    // Deep-link only when the Request object is already available in app state;
    // a notification about a request we do not hold is simply marked read.
    if (
      notification.requestId &&
      selectedRequest &&
      selectedRequest.id === notification.requestId
    ) {
      setSelectedRequest(selectedRequest);
    }
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!canMarkRead) return;
    const result = await markAllAction.run();
    if (result !== null) {
      refreshList();
      refreshUnread();
      toast.success('Inbox marked as read.');
    } else {
      toast.error(markAllAction.getError()?.message ?? 'Unable to mark the inbox as read.');
    }
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open notification inbox"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative p-2 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#081E36] cursor-pointer transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#15803D] text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute mt-2 z-50 bg-white border border-[#CBD5E1] rounded shadow-xl overflow-hidden transition-all duration-150 animate-fluid-fade ${
            placement === 'right'
              ? 'right-0 sm:w-96 max-w-[calc(100vw-1.5rem)]'
              : 'left-0 w-[calc(100vw-1.5rem)] sm:w-96 max-w-[calc(100vw-1.5rem)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#081E36] text-white">
            <div className="flex items-center gap-1.5 min-w-0">
              <Bell size={13} className="text-[#86EFAC] shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">Notification Inbox</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#15803D] text-white text-[9px] font-mono font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {canMarkRead && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markAllAction.isPending || unreadCount === 0}
                  className="btn-fluid inline-flex items-center gap-1 px-2 py-1 rounded border border-white/25 text-[10px] font-bold text-white hover:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markAllAction.isPending ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <CheckCheck size={11} />
                  )}
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notification inbox"
                className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!canRead && (
              <div className="px-3 py-6 text-center text-xs text-[#64748B]">
                The notification inbox requires the NotificationService:Read grant.
              </div>
            )}

            {canRead && listQuery.isLoading && (
              <div className="px-3 py-6 flex items-center justify-center gap-2 text-xs text-[#64748B]">
                <Loader2 size={15} className="animate-spin text-[#94A3B8]" />
                <span>Loading notifications...</span>
              </div>
            )}

            {canRead && listQuery.error && (
              <div className="px-3 py-4 flex items-start gap-2 text-xs text-[#0F172A]">
                <AlertCircle size={14} className="text-[#334155] shrink-0 mt-0.5" />
                <span>{listQuery.error.message}</span>
              </div>
            )}

            {canRead && !listQuery.isLoading && !listQuery.error && notifications.length === 0 && (
              <div className="px-3 py-6 flex flex-col items-center gap-1.5 text-xs text-[#64748B]">
                <BellOff size={18} className="text-[#94A3B8]" />
                <span>No notifications.</span>
              </div>
            )}

            {canRead &&
              !listQuery.error &&
              notifications.map((notification) => {
                const isUnread = notification.readAt == null;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className="w-full text-left px-3 py-2.5 border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] cursor-pointer transition-colors flex items-start gap-2"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        isUnread ? 'bg-[#15803D]' : 'bg-transparent'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-xs truncate ${
                          isUnread ? 'font-bold text-[#081E36]' : 'font-semibold text-[#334155]'
                        }`}
                      >
                        {notification.title}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#64748B] font-mono">
                        <span className="uppercase tracking-wide break-words">
                          {renderTemplate(notification.template, notification.payload)}
                        </span>
                        <span className="text-[#CBD5E1]">|</span>
                        <span>{formatTimestamp(notification.createdAt)}</span>
                      </span>
                    </span>
                  </button>
                );
              })}

            {canRead && (markReadAction.error || markAllAction.error) && (
              <div className="px-3 py-2 flex items-start gap-2 text-[11px] text-[#0F172A] bg-[#F1F5F9] border-t border-[#E2E8F0]">
                <AlertCircle size={13} className="text-[#334155] shrink-0 mt-0.5" />
                <span>{(markReadAction.error ?? markAllAction.error)?.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
