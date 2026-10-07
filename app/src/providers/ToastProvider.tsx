'use client';

/**
 * ToastProvider - app-wide feedback for completed use-cases.
 *
 * Every mutation routed through `AppProvider` (and every view-level action that
 * calls a service directly) reports its outcome here, so the operator always
 * knows whether a use-case actually landed. Errors are pushed by the same code
 * path that produced them, which keeps the message identical to the inline one.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import ToastStack, { type ToastKind, type ToastMessage } from '@/components/ToastStack';

export interface ToastApi {
  success: (message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

/** Keep a burst of use-cases from covering the page. */
const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    if (!message) return;
    counter.current += 1;
    const id = `toast-${counter.current}`;
    setToasts((current) => [{ id, kind, message }, ...current].slice(0, MAX_VISIBLE));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      info: (message) => push('info', message),
      error: (message) => push('error', message),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a <ToastProvider>');
  return context;
}
