/**
 * Venue Service (SKELETON)
 *
 * Implements IVenueService. Business logic not implemented yet.
 * Reads the venue lookup (retire a venue without breaking history).
 */

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type { IVenueService } from "../../interfaces/event.service.interface.js";
import type { VenueRecord } from "../../interfaces/event.repository.interface.js";
import { NotImplementedError } from "../../errors/index.js";

export class VenueService implements IVenueService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async getById(_id: string): Promise<VenueRecord | null> {
    throw new NotImplementedError("VenueService.getById");
  }

  async list(_includeInactive?: boolean): Promise<VenueRecord[]> {
    throw new NotImplementedError("VenueService.list");
  }
}
