/**
 * Role Service (SKELETON)
 *
 * Implements IRoleService. Business logic not implemented yet.
 * When implemented, [NFR-21] every permission string is validated against
 * ^[\w*]+:[\w*]+$ on write.
 */

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  IRoleService,
  CreateRoleInput,
  UpdateRoleInput,
  RoleFilter,
  RoleSortField,
} from "../../interfaces/role.service.interface.js";
import type { Connection, ConnectionArgs } from "../../interfaces/common.interface.js";
import type { RoleRecord } from "../../interfaces/role.repository.interface.js";
import { NotImplementedError } from "../../errors/index.js";

export class RoleService implements IRoleService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async getById(_id: string): Promise<RoleRecord | null> {
    throw new NotImplementedError("RoleService.getById");
  }

  async getByName(_name: string): Promise<RoleRecord | null> {
    throw new NotImplementedError("RoleService.getByName");
  }

  async list(
    _args: ConnectionArgs<RoleFilter, RoleSortField>,
  ): Promise<Connection<RoleRecord>> {
    throw new NotImplementedError("RoleService.list");
  }

  async create(_input: CreateRoleInput): Promise<RoleRecord> {
    // TODO(NFR-21): validate permission payload with isValidPermission().
    throw new NotImplementedError("RoleService.create");
  }

  async update(_id: string, _input: UpdateRoleInput): Promise<RoleRecord> {
    // TODO(NFR-21): validate permission payload before persisting.
    throw new NotImplementedError("RoleService.update");
  }
}
