'use client';

/**
 * Authorization bindings. The engine is read through `useSyncExternalStore`, so
 * any consumer re-renders exactly when the subject changes (login, refresh,
 * logout).
 */

import { useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { AuthzContext, SessionContext } from '@/providers/contexts';
import type { ActionId, AuthzResource, IAuthorizationEngine } from '@/services/contracts/authz';
import type { ISessionService, SessionSnapshot, SessionUser } from '@/services/contracts/session';

export function useAuthzEngine(): IAuthorizationEngine {
  const engine = useContext(AuthzContext);
  if (!engine) throw new Error('useAuthorization must be used inside <AuthorizationProvider>');
  return engine;
}

export function useSessionService(): ISessionService {
  const service = useContext(SessionContext);
  if (!service) throw new Error('useSession must be used inside <SessionProvider>');
  return service;
}

function useSubject() {
  const engine = useAuthzEngine();
  return useSyncExternalStore(
    useCallback((listener: () => void) => engine.subscribe(listener), [engine]),
    useCallback(() => engine.getSubject(), [engine]),
    useCallback(() => engine.getSubject(), [engine]),
  );
}

export function useAuthorization() {
  const engine = useAuthzEngine();
  const subject = useSubject();

  const can = useCallback(
    (action: ActionId, resource?: AuthzResource | null) => engine.can(action, resource),
    [engine],
  );
  const decide = useCallback(
    (action: ActionId, resource?: AuthzResource | null) => engine.decide({ action, resource }),
    [engine],
  );

  return {
    can,
    decide,
    permissions: subject?.permissions ?? [],
    roles: subject?.roles ?? [],
    user: subject,
    isHydrated: subject !== null,
  };
}

/** Stable key for the resource attributes the policy rules actually read. */
function resourceKey(resource?: AuthzResource | null): string {
  if (!resource) return '';
  const a = resource.attributes ?? {};
  return `${resource.kind}:${String(a.status ?? '')}:${String(a.signatoryRequired ?? '')}:${String(
    a.id ?? '',
  )}:${String(a.venueSpecialUse ?? '')}`;
}

export function useCan(action: ActionId, resource?: AuthzResource | null): boolean {
  const engine = useAuthzEngine();
  const subject = useSubject();
  const key = resourceKey(resource);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => engine.can(action, resource), [engine, subject, action, key]);
}

export function usePermissions(): readonly string[] {
  return useAuthorization().permissions;
}

function useSessionSnapshot(): SessionSnapshot | null {
  const service = useSessionService();
  return useSyncExternalStore(
    useCallback((listener: () => void) => service.subscribe(listener), [service]),
    useCallback(() => service.getSnapshot(), [service]),
    useCallback(() => service.getSnapshot(), [service]),
  );
}

export function useSessionUser(): SessionUser | null {
  return useSessionSnapshot()?.user ?? null;
}
