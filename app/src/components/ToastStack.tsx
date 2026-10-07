'use client';

/**
 * Toast stack - the visual layer for use-case feedback.
 *
 * Doctrine: no red/orange alarm colors. Success reads civic green, errors read
 * Bulacan Navy with an alert glyph, informational notes read slate.
 */

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  message: string;
}

/** Auto-dismiss windows: errors linger, confirmations do not. */
export const AUTO_DISMISS_MS: Record<ToastKind, number> = {
  success: 5000,
  info: 6000,
  error: 9000,
};

const STYLES: Record<ToastKind, { frame: string; glyph: string; title: string }> = {
  success: {
    frame: 'bg-white border-[#86EFAC] shadow-md',
    glyph: 'text-[#15803D]',
    title: 'text-[#166534]',
  },
  info: {
    frame: 'bg-white border-[#CBD5E1] shadow-sm',
    glyph: 'text-[#64748B]',
    title: 'text-[#334155]',
  },
  error: {
    frame: 'bg-white border-[#081E36] shadow-md',
    glyph: 'text-[#081E36]',
    title: 'text-[#081E36]',
  },
};

const LABELS: Record<ToastKind, string> = {
  success: 'Completed',
  info: 'Notice',
  error: 'Not completed',
};

function Glyph({ kind }: { kind: ToastKind }) {
  const className = STYLES[kind].glyph;
  if (kind === 'success') return <CheckCircle2 size={15} className={className} />;
  if (kind === 'error') return <AlertCircle size={15} className={className} />;
  return <Info size={15} className={className} />;
}

function ToastCard({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const { id, kind, message } = toast;
  const style = STYLES[kind];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS[kind]);
    return () => clearTimeout(timer);
  }, [id, kind, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full max-w-sm border rounded-lg px-3.5 py-3 flex items-start gap-2.5 animate-fluid-fade ${style.frame}`}
    >
      <span className="mt-0.5 shrink-0">
        <Glyph kind={kind} />
      </span>
      <div className="min-w-0 flex-1">
        <div className={`font-mono text-[10px] font-bold uppercase tracking-wider ${style.glyph}`}>
          {LABELS[kind]}
        </div>
        <p className={`text-xs font-semibold leading-relaxed break-words ${style.title}`}>{message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-0.5 rounded text-[#94A3B8] hover:text-[#081E36] hover:bg-[#F1F5F9] cursor-pointer"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-3 sm:right-5 z-70 flex flex-col items-end gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastCard toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
