/** Single client-cache instance for the composition root. */

import { ClientCache } from './client-cache';
import type { IClientCache } from '../contracts/cache';

let instance: ClientCache | null = null;

export function getClientCache(): IClientCache {
  if (!instance) instance = new ClientCache();
  return instance;
}

export { ClientCache };
