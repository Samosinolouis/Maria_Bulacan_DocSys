'use client';

/**
 * Stable method picking. The picked object is created once and never replaced,
 * so the object and every method identity are stable across renders and safe in
 * `useEffect` dependency arrays. The name list also documents exactly which part
 * of the contract a hook exposes (ISP at the hook seam).
 */

import { useState } from 'react';

export function useServiceMethods<T extends object, K extends keyof T>(
  service: T,
  names: readonly K[],
): Pick<T, K> {
  const [picked] = useState<Pick<T, K>>(() => {
    const result = {} as Pick<T, K>;
    for (const name of names) {
      const method = service[name];
      result[name] =
        typeof method === 'function'
          ? ((...args: unknown[]) =>
              (service[name] as unknown as (...a: unknown[]) => unknown)(...args)) as T[K]
          : method;
    }
    return result;
  });
  return picked;
}
