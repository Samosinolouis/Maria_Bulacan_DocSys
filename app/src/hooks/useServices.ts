'use client';

/** Internal registry accessor. Every hook reads services from here. */

import { useContext } from 'react';
import { ServicesContext } from '@/providers/contexts';
import type { ServiceRegistry } from '@/services/contracts';

export function useServices(): ServiceRegistry {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServiceProvider>');
  return services;
}
