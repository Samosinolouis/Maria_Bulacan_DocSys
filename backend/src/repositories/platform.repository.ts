/**
 * [A] Shared Platform - Repository Implementations
 *
 * Concrete data-access for users, roles, user_roles, notifications.
 * Each repository receives a DB executor (connection OR transaction) at
 * construction time, so the Unit of Work controls atomicity.
 *
 * [SOLID:SRP] Persistence only - no business rules.
 * [SOLID:DIP] Implements the interfaces; callers depend on the abstractions.
 */

import { eq, inArray, and, isNull, sql } from "drizzle-orm";

import type { Database } from "../db/index.js";
import { users, roles, userRoles, notifications } from "../db/schema/index.js";
import { NotFoundError } from "../errors/index.js";
import type {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  UserRecord,
} from "../interfaces/user.repository.interface.js";
import type {
  IRoleRepository,
  CreateRoleData,
  UpdateRoleData,
  AssignRoleData,
  RoleRecord,
  UserRoleRecord,
} from "../interfaces/role.repository.interface.js";
import type {
  INotificationRepository,
  CreateNotificationData,
  NotificationRecord,
} from "../interfaces/notification.repository.interface.js";
import type { ListOptions } from "../interfaces/common.interface.js";

export class UserRepository implements IUserRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<UserRecord | null> {
    const [row] = await this.tx.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  async findByIds(ids: string[]): Promise<UserRecord[]> {
    if (ids.length === 0) return [];
    return this.tx.select().from(users).where(inArray(users.id, ids));
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const [row] = await this.tx.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  }

  async findMany(options: ListOptions): Promise<UserRecord[]> {
    let query = this.tx.select().from(users).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async count(options?: Pick<ListOptions, "where">): Promise<number> {
    let query = this.tx
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .$dynamic();
    if (options?.where) query = query.where(options.where);
    const [row] = await query;
    return row?.count ?? 0;
  }

  async create(data: CreateUserData): Promise<UserRecord> {
    const [row] = await this.tx
      .insert(users)
      .values({
        id: data.id,
        firstName: data.firstName,
        middleName: data.middleName ?? null,
        lastName: data.lastName,
        suffix: data.suffix ?? null,
        email: data.email,
        contactNo: data.contactNo,
        office: data.office,
        position: data.position,
      })
      .returning();
    return row;
  }

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    const [row] = await this.tx
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!row) throw new NotFoundError("User", id);
    return row;
  }

  async deactivate(id: string): Promise<UserRecord> {
    return this.update(id, { isActive: false });
  }
}

export class RoleRepository implements IRoleRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<RoleRecord | null> {
    const [row] = await this.tx.select().from(roles).where(eq(roles.id, id)).limit(1);
    return row ?? null;
  }

  async findByName(name: string): Promise<RoleRecord | null> {
    const [row] = await this.tx.select().from(roles).where(eq(roles.name, name)).limit(1);
    return row ?? null;
  }

  async findMany(options: ListOptions): Promise<RoleRecord[]> {
    let query = this.tx.select().from(roles).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async count(options?: Pick<ListOptions, "where">): Promise<number> {
    let query = this.tx
      .select({ count: sql<number>`count(*)::int` })
      .from(roles)
      .$dynamic();
    if (options?.where) query = query.where(options.where);
    const [row] = await query;
    return row?.count ?? 0;
  }

  async create(data: CreateRoleData): Promise<RoleRecord> {
    const [row] = await this.tx
      .insert(roles)
      .values({
        name: data.name,
        description: data.description,
        permissionPayload: data.permissionPayload,
      })
      .returning();
    return row;
  }

  async update(id: string, data: UpdateRoleData): Promise<RoleRecord> {
    const [row] = await this.tx
      .update(roles)
      .set(data)
      .where(eq(roles.id, id))
      .returning();
    if (!row) throw new NotFoundError("Role", id);
    return row;
  }

  async assign(data: AssignRoleData): Promise<UserRoleRecord> {
    const [row] = await this.tx
      .insert(userRoles)
      .values({
        userId: data.userId,
        roleId: data.roleId,
        assignedBy: data.assignedBy,
      })
      .returning();
    return row;
  }

  async unassign(userId: string, roleId: string): Promise<UserRoleRecord | null> {
    const [row] = await this.tx
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .returning();
    return row ?? null;
  }

  async findByUser(userId: string): Promise<UserRoleRecord[]> {
    return this.tx.select().from(userRoles).where(eq(userRoles.userId, userId));
  }

  async findByRole(roleId: string): Promise<UserRoleRecord[]> {
    return this.tx.select().from(userRoles).where(eq(userRoles.roleId, roleId));
  }

  async findRolesForUser(userId: string): Promise<RoleRecord[]> {
    return this.tx
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        permissionPayload: roles.permissionPayload,
        createdAt: roles.createdAt,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
  }
}

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<NotificationRecord | null> {
    const [row] = await this.tx
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    return row ?? null;
  }

  async findMany(options: ListOptions): Promise<NotificationRecord[]> {
    let query = this.tx.select().from(notifications).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async count(options?: Pick<ListOptions, "where">): Promise<number> {
    let query = this.tx
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .$dynamic();
    if (options?.where) query = query.where(options.where);
    const [row] = await query;
    return row?.count ?? 0;
  }

  async countUnread(userId: string): Promise<number> {
    const [row] = await this.tx
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return row?.count ?? 0;
  }

  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    const [row] = await this.tx
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        payload: data.payload,
        template: data.template,
        requestId: data.requestId ?? null,
        documentId: data.documentId ?? null,
        eventId: data.eventId ?? null,
      })
      .returning();
    return row;
  }

  async markRead(id: string, readAt: Date): Promise<NotificationRecord | null> {
    const [row] = await this.tx
      .update(notifications)
      .set({ readAt })
      .where(eq(notifications.id, id))
      .returning();
    return row ?? null;
  }

  async markAllRead(userId: string, readAt: Date): Promise<number> {
    const rows = await this.tx
      .update(notifications)
      .set({ readAt })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .returning({ id: notifications.id });
    return rows.length;
  }
}
