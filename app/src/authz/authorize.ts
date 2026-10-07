/**
 * `authorizeOrThrow` - the one authorization gate every service method calls
 * before touching the backend. Throws an `AppError` (FORBIDDEN) carrying the
 * decision's user-safe reason.
 */

import { AppError } from '@/services/contracts/errors';
import type { ActionId, AuthzResource, IAuthorizationEngine } from '@/services/contracts/authz';

export function authorizeOrThrow(
  engine: IAuthorizationEngine,
  action: ActionId,
  resource?: AuthzResource | null,
): void {
  const decision = engine.decide({ action, resource });
  if (!decision.allowed) {
    throw new AppError(
      'FORBIDDEN',
      decision.reason ?? 'You do not have permission to perform this action.',
    );
  }
}
