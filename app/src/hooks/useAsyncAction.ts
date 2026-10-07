'use client';

/**
 * Mutation-state primitive. `run` returns null on failure (after setting
 * `error`), so views can write:
 *   const result = await run(...); if (result) refresh();
 */

import { useCallback, useRef, useState } from 'react';
import { normalizeError } from '@/services/cache/helpers';
import type { AppErrorShape } from '@/services/contracts/errors';

export interface AsyncActionState<A extends unknown[], R> {
  run: (...args: A) => Promise<R | null>;
  isPending: boolean;
  error: AppErrorShape | null;
  /**
   * The error thrown by the most recent `run`, readable synchronously (the
   * `error` state is not yet committed when `run` resolves). Used by callers
   * that must surface the failure themselves, e.g. a toast.
   */
  getError: () => AppErrorShape | null;
  reset: () => void;
}

export function useAsyncAction<A extends unknown[], R>(
  action: (...args: A) => Promise<R>,
): AsyncActionState<A, R> {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<AppErrorShape | null>(null);
  const errorRef = useRef<AppErrorShape | null>(null);

  const run = useCallback(
    async (...args: A): Promise<R | null> => {
      setPending(true);
      setError(null);
      errorRef.current = null;
      try {
        return await action(...args);
      } catch (err) {
        const normalized = normalizeError(err);
        errorRef.current = normalized;
        setError(normalized);
        return null;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  const getError = useCallback(() => errorRef.current, []);
  const reset = useCallback(() => {
    errorRef.current = null;
    setError(null);
  }, []);
  return { run, isPending, error, getError, reset };
}
