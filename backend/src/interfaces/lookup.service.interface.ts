/**
 * Lookup Service Interface
 *
 * Business-logic abstraction for reference data: request_types,
 * document_types, and the holidays calendar (NFR-23).
 */

import type {
  RequestTypeRecord,
  HolidayRecord,
} from "./request.repository.interface.js";
import type { DocumentTypeRecord } from "./document.repository.interface.js";
import type { ListOptions } from "./common.interface.js";

export interface UpsertRequestTypeInput {
  code: string;
  name: string;
  description: string;
  prefix: string;
  isActive?: boolean;
}

export interface UpsertDocumentTypeInput {
  code: string;
  name: string;
  description: string;
  prefix: string;
  isActive?: boolean;
}

export interface UpsertHolidayInput {
  /** YYYY-MM-DD — one row per date. */
  holidayDate: string;
  name: string;
}

export interface ILookupService {
  listRequestTypes(includeInactive?: boolean): Promise<RequestTypeRecord[]>;
  listDocumentTypes(includeInactive?: boolean): Promise<DocumentTypeRecord[]>;

  /** Holidays within [from, to) — used by SLA computation (FR-09). */
  listHolidays(from?: Date | null, to?: Date | null): Promise<HolidayRecord[]>;

  createRequestType(input: UpsertRequestTypeInput): Promise<RequestTypeRecord>;
  createDocumentType(input: UpsertDocumentTypeInput): Promise<DocumentTypeRecord>;
  upsertHoliday(input: UpsertHolidayInput): Promise<HolidayRecord>;

  /** Raw repository-style listing for admin screens. */
  listRequestTypesPaged(options: ListOptions): Promise<RequestTypeRecord[]>;
}
