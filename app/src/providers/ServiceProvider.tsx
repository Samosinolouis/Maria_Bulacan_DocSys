'use client';

/** Provides the ServiceRegistry to the React tree. */

import type { ReactNode } from 'react';
import type { ServiceRegistry } from '@/services/contracts';
import { ServicesContext } from './contexts';

export function ServiceProvider({
  registry,
  children,
}: {
  registry: ServiceRegistry;
  children: ReactNode;
}) {
  return <ServicesContext.Provider value={registry}>{children}</ServicesContext.Provider>;
}
