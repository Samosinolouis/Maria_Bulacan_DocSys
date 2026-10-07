/**
 * Service-Layer Authorization [FR-05, NFR-07]
 *
 * The authoritative enforcement point: every mutating service action asserts
 * the actor's `Service:Action` grant before touching state. The grant set is
 * the union of the actor's roles' permission payloads, evaluated with
 * wildcard support via permissionSatisfies (NFR-21).
 *
 * The frontend mirrors these rules for UI shaping, but never enforces them
 * (fail-closed server-side).
 *
 * [SOLID:SRP] Grant evaluation only - no workflow rules.
 */

import { ForbiddenError } from "../../errors/index.js";
import { permissionSatisfies } from "../../types/permissions.js";
import type { IRepositories } from "../../interfaces/uow.interface.js";

/** Effective permission set = union of the actor's roles (FR-05, FR-06). */
export async function getEffectivePermissionSet(
  uow: IRepositories,
  actorId: string,
): Promise<string[]> {
  const roles = await uow.roles.findRolesForUser(actorId);
  const union = new Set<string>();
  for (const role of roles) {
    for (const permission of role.permissionPayload) {
      union.add(permission);
    }
  }
  return [...union];
}

/**
 * Assert the actor holds a grant satisfying `permission`, wildcards included
 * ("Service:*", "*:*"). Throws ForbiddenError otherwise.
 */
export async function assertPermission(
  uow: IRepositories,
  actorId: string,
  permission: string,
): Promise<void> {
  const granted = await getEffectivePermissionSet(uow, actorId);
  if (!permissionSatisfies(granted, permission)) {
    throw new ForbiddenError(`Missing permission '${permission}'.`);
  }
}
