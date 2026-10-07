/**
 * Venue Service
 *
 * Implements IVenueService - the municipal venue lookup the booking module
 * books into. Venues are never deleted: a venue that stops being used is
 * retired with `isActive = false`, so historical events keep their venue.
 *
 * - FR-41  read the six municipal venues; special-use venues (Mayor's
 *          Conference Room, Administrator's Office) are flagged
 * - writes require VenueService:Manage
 *
 * [SOLID:SRP] Reference-data management for venues only.
 */

import { asc, eq } from "drizzle-orm";

import { venues } from "../../db/schema/index.js";
import { ConflictError, ValidationError } from "../../errors/index.js";
import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  IVenueService,
  CreateVenueInput,
  UpdateVenueInput,
} from "../../interfaces/event.service.interface.js";
import type { VenueRecord, VenueActiveBookingCount } from "../../interfaces/event.repository.interface.js";
import { assertPermission } from "../shared/authz.js";

const CODE_PATTERN = /^[A-Z0-9_]{2,50}$/;

export class VenueService implements IVenueService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async getById(id: string): Promise<VenueRecord | null> {
    return this.db.query((uow) => uow.venues.findById(id));
  }

  async list(includeInactive = false): Promise<VenueRecord[]> {
    return this.db.query((uow) =>
      uow.venues.findMany({
        limit: 200,
        where: includeInactive ? undefined : eq(venues.isActive, true),
        orderBy: [asc(venues.name)],
      }),
    );
  }

  /** Live availability per venue - ONE grouped query for the whole list. */
  async countActiveBookings(venueIds: string[]): Promise<VenueActiveBookingCount[]> {
    if (venueIds.length === 0) return [];
    return this.db.query((uow) => uow.venues.countActiveBookings(venueIds));
  }

  async create(actorId: string, input: CreateVenueInput): Promise<VenueRecord> {
    const code = input.code?.trim().toUpperCase();
    const name = input.name?.trim();
    if (!code || !CODE_PATTERN.test(code)) {
      throw new ValidationError("code must be 2-50 characters of A-Z, 0-9 or underscore.");
    }
    if (!name) throw new ValidationError("Venue name is required.");

    const created = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "VenueService:Manage");
      const existing = await uow.venues.findByCode(code);
      if (existing) throw new ConflictError(`Venue code '${code}'`);
      return uow.venues.create({
        code,
        name,
        specialUse: input.specialUse ?? false,
        isActive: input.isActive ?? true,
      });
    });

    this.telemetry.trackEvent("booking.venue.created", { code: created.code });
    return created;
  }

  async update(actorId: string, input: UpdateVenueInput): Promise<VenueRecord> {
    const name = input.name === undefined ? undefined : input.name?.trim();
    if (name !== undefined && !name) {
      throw new ValidationError("Venue name cannot be blank.");
    }

    const updated = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "VenueService:Manage");
      const current = await uow.venues.findById(input.venueId);
      if (!current) throw new ValidationError("Venue not found.");

      return uow.venues.update(input.venueId, {
        name,
        specialUse: input.specialUse ?? undefined,
        isActive: input.isActive ?? undefined,
      });
    });

    this.telemetry.trackEvent("booking.venue.updated", { code: updated.code });
    return updated;
  }
}
