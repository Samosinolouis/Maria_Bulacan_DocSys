/**
 * User Repository Interface
 *
 * Data-access abstraction for the `users` shadow table.
 * [SOLID:DIP] Service -> interface <- Repository (concrete).
 * NOTE: users.id = Keycloak "sub"; the app never assigns a random id.
 */

import { users } from "../db/schema/index.js";
import type { ListOptions } from "./common.interface.js";

export type UserRecord = typeof users.$inferSelect;

export interface CreateUserData {
  /** Keycloak OIDC "sub". */
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  email: string;
  contactNo: string;
  office: string;
  position: string;
}

export interface UpdateUserData {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  suffix?: string | null;
  email?: string;
  contactNo?: string;
  office?: string;
  position?: string;
  isActive?: boolean;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByIds(ids: string[]): Promise<UserRecord[]>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findMany(options: ListOptions): Promise<UserRecord[]>;
  count(options?: Pick<ListOptions, "where">): Promise<number>;
  create(data: CreateUserData): Promise<UserRecord>;
  /** Partial update; refreshes updated_at. */
  update(id: string, data: UpdateUserData): Promise<UserRecord>;
  /** Soft deactivate - users are never deleted (FR-03). */
  deactivate(id: string): Promise<UserRecord>;
}
