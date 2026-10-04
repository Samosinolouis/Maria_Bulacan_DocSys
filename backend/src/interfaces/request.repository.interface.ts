/**
 * Request Repository Interfaces
 *
 * Data-access abstractions for the intake side of the document module:
 * request_types, control_number_sequences, holidays, requests.
 */

import {
  requests,
  requestTypes,
  controlNumberSequences,
  holidays,
} from "../db/schema/index.js";
import type { ListOptions } from "./common.interface.js";

export type RequestRecord = typeof requests.$inferSelect;
export type RequestTypeRecord = typeof requestTypes.$inferSelect;
export type ControlNumberSequenceRecord =
  typeof controlNumberSequences.$inferSelect;
export type HolidayRecord = typeof holidays.$inferSelect;

export type RequestChannel = RequestRecord["channel"];
export type RequestPriority = RequestRecord["priority"];
export type RequestStatus = RequestRecord["status"];

export interface CreateRequestData {
  controlNo: string;
  requestTypeId: string;
  title: string;
  requestingParty: string;
  originOffice: string;
  channel: RequestChannel;
  priority?: RequestPriority;
  receivedAt: Date;
  slaDeadline: Date;
  createdBy: string;
}

export interface UpdateRequestData {
  title?: string;
  requestingParty?: string;
  originOffice?: string;
  channel?: RequestChannel;
  priority?: RequestPriority;
  slaDeadline?: Date;
  status?: RequestStatus;
}

export interface IRequestRepository {
  findById(id: string): Promise<RequestRecord | null>;
  findByIds(ids: string[]): Promise<RequestRecord[]>;
  findByControlNo(controlNo: string): Promise<RequestRecord | null>;
  findMany(options: ListOptions): Promise<RequestRecord[]>;
  count(options?: Pick<ListOptions, "where">): Promise<number>;
  create(data: CreateRequestData): Promise<RequestRecord>;
  update(id: string, data: UpdateRequestData): Promise<RequestRecord>;
}

export interface IRequestTypeRepository {
  findById(id: string): Promise<RequestTypeRecord | null>;
  findByCode(code: string): Promise<RequestTypeRecord | null>;
  findMany(options: ListOptions): Promise<RequestTypeRecord[]>;
}

export interface IHolidayRepository {
  findById(id: string): Promise<HolidayRecord | null>;
  /** All holidays within a date window — feeds business-day SLA math (FR-09). */
  findBetween(from: Date, to: Date): Promise<HolidayRecord[]>;
  findMany(options: ListOptions): Promise<HolidayRecord[]>;
}

/**
 * Control-number issuance. Implementations MUST lock the (seq_code, year) row
 * and increment atomically so concurrent clerks never collide or skip (FR-08).
 */
export interface IControlNumberRepository {
  /**
   * Atomically issue the next control number for a series.
   * Creates the (seq_code, year) row on first use.
   * Returns the formatted control number, e.g. TO-2026-0045.
   */
  issueNext(seqCode: string, year: number, prefix: string): Promise<string>;
  peek(seqCode: string, year: number): Promise<ControlNumberSequenceRecord | null>;
}
