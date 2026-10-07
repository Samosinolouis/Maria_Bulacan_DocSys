'use client';

/**
 * AuthorizationProvider - hydrates the ABAC engine from the session snapshot
 * and re-renders consumers when the subject changes.
 */

import { useEffect, type ReactNode } from 'react';
import type { AuthzSubject, IAuthorizationEngine } from '@/services/contracts/authz';
import type { ISessionService, SessionSnapshot } from '@/services/contracts/session';
import { AuthzContext } from './contexts';

export function buildSubject(snapshot: SessionSnapshot | null): AuthzSubject | null {
  if (!snapshot) return null;
  return {
    userId: snapshot.user.id,
    roles: snapshot.user.roles.map((role) => role.name),
    permissions: snapshot.user.effectivePermissions,
    office: snapshot.user.office,
    position: snapshot.user.position,
  };
}

export function AuthorizationProvider({
  engine,
  session,
  children,
}: {
  engine: IAuthorizationEngine;
  session: ISessionService;
  children: ReactNode;
}) {
  useEffect(() => {
    // Seed from the current snapshot, then track changes (login / refresh / logout).
    engine.setSubject(buildSubject(session.getSnapshot()));
    const unsubscribe = session.subscribe((snapshot) => {
      engine.setSubject(buildSubject(snapshot));
    });
    return unsubscribe;
  }, [engine, session]);

  return <AuthzContext.Provider value={engine}>{children}</AuthzContext.Provider>;
}
