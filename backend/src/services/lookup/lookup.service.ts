/**
 * Lookup Service (SKELETON)
 *
 * Implements ILookupService. Business logic not implemented yet.
 * Reference data: request_types, document_types, holidays (NFR-23).
 */

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
import { NotImplementedError } from "../../errors/index.js";

export class LookupService implements ILookupService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async listRequestTypes(_includeInactive?: boolean): Promise<RequestTypeRecord[]> {
    throw new NotImplementedError("LookupService.listRequestTypes");
  }

  async listDocumentTypes(_includeInactive?: boolean): Promise<DocumentTypeRecord[]> {
    throw new NotImplementedError("LookupService.listDocumentTypes");
  }

  async listHolidays(_from?: Date | null, _to?: Date | null): Promise<HolidayRecord[]> {
    throw new NotImplementedError("LookupService.listHolidays");
  }

  async createRequestType(_input: UpsertRequestTypeInput): Promise<RequestTypeRecord> {
    throw new NotImplementedError("LookupService.createRequestType");
  }

  async createDocumentType(_input: UpsertDocumentTypeInput): Promise<DocumentTypeRecord> {
    throw new NotImplementedError("LookupService.createDocumentType");
  }

  async upsertHoliday(_input: UpsertHolidayInput): Promise<HolidayRecord> {
    throw new NotImplementedError("LookupService.upsertHoliday");
  }

  async listRequestTypesPaged(_options: ListOptions): Promise<RequestTypeRecord[]> {
    throw new NotImplementedError("LookupService.listRequestTypesPaged");
  }
}
