/**
 * Shared workflow helpers.
 *
 * Cross-cutting mechanics used by the workflow services (RequestService,
 * DocumentService, NotificationService):
 *  - actor snapshots for the append-only audit trail (actor_name/actor_role);
 *  - permission-based recipient resolution (who gets notified);
 *  - safe notification fan-out (a failed notification never fails the
 *    already-committed state change it reports).
 *
 * [SOLID:SRP] These helpers know nothing about specific state machines.
 */

import { eq } from "drizzle-orm";

import { users } from "../../db/schema/index.js";
import { NotFoundError } from "../../errors/index.js";
import type { IRepositories } from "../../interfaces/uow.interface.js";
import type { INotificationService, NotifyInput } from "../../interfaces/notification.service.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import { permissionSatisfies } from "../../types/permissions.js";

/** Snapshot of the acting user at the time of an event (FR-39). */
export interface ActorSnapshot {
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Load the actor's name + role snapshot for an audit entry.
 * The actor must exist as a shadow user (FR-02 syncs it on login); the
 * document_logs FK enforces this at the database level as well.
 */
export async function loadActorSnapshot(
  uow: IRepositories,
  actorId: string,
): Promise<ActorSnapshot> {
  const user = await uow.users.findById(actorId);
  if (!user) {
    throw new NotFoundError("User", actorId);
  }

  const roles = await uow.roles.findRolesForUser(actorId);
  const actorName = [user.firstName, user.middleName, user.lastName, user.suffix]
    .filter(Boolean)
    .join(" ");
  const actorRole = roles.map((role) => role.name).join(", ") || "UNASSIGNED";

  return { actorId, actorName, actorRole };
}

/**
 * Resolve the ids of every active user whose effective permissions satisfy
 * the required permission (wildcards included, same semantics as the
 * service layer - FR-05).
 */
export async function findUserIdsWithPermission(
  uow: IRepositories,
  permission: string,
): Promise<string[]> {
  const activeUsers = await uow.users.findMany({
    limit: 1000,
    where: eq(users.isActive, true),
  });

  const matches: string[] = [];
  for (const user of activeUsers) {
    const roles = await uow.roles.findRolesForUser(user.id);
    const granted = roles.flatMap((role) => role.permissionPayload);
    if (permissionSatisfies(granted, permission)) {
      matches.push(user.id);
    }
  }
  return matches;
}

/** Deduplicate a list of (possibly null) ids, preserving order. */
export function dedupeIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/**
 * Fan out a notification without failing the caller's committed transaction.
 * Notification delivery is secondary to the state change it reports; failures
 * are tracked and reconciled later (FR-47).
 */
export async function notifySafely(
  telemetry: ITelemetryPort,
  notifications: INotificationService,
  input: NotifyInput,
): Promise<void> {
  if (input.userIds.length === 0) return;
  try {
    await notifications.notify(input);
  } catch (error) {
    telemetry.trackError(
      error instanceof Error ? error : new Error(String(error)),
      { operation: "notification.notify", type: input.type },
    );
  }
}
