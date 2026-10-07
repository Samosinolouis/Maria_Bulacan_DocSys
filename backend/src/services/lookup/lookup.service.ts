/**
 * Lookup Service
 *
 * Implements ILookupService: reference data for the workflow - request_types,
 * document_types, and the holiday calendar (NFR-23). These reads feed the
 * intake form, the drafting studio, and the business-day SLA math (FR-09).
 *
 * [SOLID:SRP] Reference-data management only.
 */

import { asc, eq } from "drizzle-orm";

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  ILookupService,
  UpsertRequestTypeInput,
  UpsertDocumentTypeInput,
  UpsertHolidayInput,
} from "../../interfaces/lookup.service.interface.js";
import type {
  RequestTypeRecord,
  HolidayRecord,
} from "../../interfaces/request.repository.interface.js";
import type { DocumentTypeRecord } from "../../interfaces/document.repository.interface.js";
import type { ListOptions } from "../../interfaces/common.interface.js";
import { documentTypes, holidays, requestTypes } from "../../db/schema/index.js";
import { ConflictError, ValidationError } from "../../errors/index.js";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class LookupService implements ILookupService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async listRequestTypes(includeInactive = false): Promise<RequestTypeRecord[]> {
    return this.db.query((uow) =>
      uow.requestTypes.findMany({
        limit: 500,
        where: includeInactive ? undefined : eq(requestTypes.isActive, true),
        orderBy: [asc(requestTypes.name)],
      }),
    );
  }

  async listDocumentTypes(includeInactive = false): Promise<DocumentTypeRecord[]> {
    return this.db.query((uow) =>
      uow.documentTypes.findMany({
        limit: 500,
        where: includeInactive ? undefined : eq(documentTypes.isActive, true),
        orderBy: [asc(documentTypes.name)],
      }),
    );
  }

  async listHolidays(from?: Date | null, to?: Date | null): Promise<HolidayRecord[]> {
    return this.db.query(async (uow) => {
      if (from && to) {
        return uow.holidays.findBetween(from, to);
      }
      return uow.holidays.findMany({
        limit: 1000,
        orderBy: [asc(holidays.holidayDate)],
      });
    });
  }

  async createRequestType(input: UpsertRequestTypeInput): Promise<RequestTypeRecord> {
    const data = this.normalizeTypeInput(input);
    const created = await this.db.transaction(async (uow) => {
      const existing = await uow.requestTypes.findByCode(data.code);
      if (existing) throw new ConflictError(`Request type '${data.code}'`);
      return uow.requestTypes.create(data);
    });
    this.telemetry.trackEvent("lookup.request_type.created", { code: created.code });
    return created;
  }

  async createDocumentType(input: UpsertDocumentTypeInput): Promise<DocumentTypeRecord> {
    const data = this.normalizeTypeInput(input);
    const created = await this.db.transaction(async (uow) => {
      const existing = await uow.documentTypes.findByCode(data.code);
      if (existing) throw new ConflictError(`Document type '${data.code}'`);
      return uow.documentTypes.create(data);
    });
    this.telemetry.trackEvent("lookup.document_type.created", { code: created.code });
    return created;
  }

  async upsertHoliday(input: UpsertHolidayInput): Promise<HolidayRecord> {
    const holidayDate = input.holidayDate?.trim();
    const name = input.name?.trim();
    if (!holidayDate || !DATE_ONLY.test(holidayDate)) {
      throw new ValidationError("holidayDate must be a YYYY-MM-DD date.");
    }
    if (!name) {
      throw new ValidationError("Holiday name is required.");
    }
    const record = await this.db.transaction((uow) =>
      uow.holidays.upsert({ holidayDate, name }),
    );
    this.telemetry.trackEvent("lookup.holiday.upserted", { holidayDate });
    return record;
  }

  async listRequestTypesPaged(options: ListOptions): Promise<RequestTypeRecord[]> {
    return this.db.query((uow) => uow.requestTypes.findMany(options));
  }

  private normalizeTypeInput(input: {
    code: string;
    name: string;
    description: string;
    prefix: string;
    isActive?: boolean | null;
  }): { code: string; name: string; description: string; prefix: string; isActive?: boolean } {
    const code = input.code?.trim().toUpperCase();
    const name = input.name?.trim();
    const description = input.description?.trim();
    const prefix = input.prefix?.trim().toUpperCase();
    if (!code || !name || !description || !prefix) {
      throw new ValidationError("code, name, description, and prefix are required.");
    }
    return { code, name, description, prefix, isActive: input.isActive ?? undefined };
  }
}
