'use client';

/**
 * React contexts for the composition root. Kept in a standalone module so the
 * providers and the hooks can import them without a cycle.
 */

import { createContext } from 'react';
import type { ServiceRegistry } from '@/services/contracts';
import type { IAuthorizationEngine } from '@/services/contracts/authz';
import type { ISessionService } from '@/services/contracts/session';

export const ServicesContext = createContext<ServiceRegistry | null>(null);
export const AuthzContext = createContext<IAuthorizationEngine | null>(null);
export const SessionContext = createContext<ISessionService | null>(null);
