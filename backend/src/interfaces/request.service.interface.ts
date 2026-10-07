/**
 * Request Service Interface
 *
 * Business-logic abstraction for the intake steps of the document lifecycle:
 * reception (Step 1) and initial screening (Step 2).
 */

import type { RequestRecord } from "./request.repository.interface.js";
import type { Connection, ConnectionArgs } from "./common.interface.js";

export type RequestChannel = RequestRecord["channel"];
export type RequestPriority = RequestRecord["priority"];
export type RequestStatus = RequestRecord["status"];

/** Step 1 - encode an incoming request and issue a control number (FR-07..11). */
export interface EncodeRequestInput {
  requestTypeId: string;
  title: string;
  requestingParty: string;
  originOffice: string;
  channel: RequestChannel;
  priority?: RequestPriority | null;
  /** IRL receipt date; defaults to now when omitted. */
  receivedAt?: Date | null;
}

/** Step 2 - screening decision (FR-12..15). */
export interface ScreenRequestInput {
  requestId: string;
  passed: boolean;
  /** Specific deficiencies when failing - required for RETURNED_FOR_COMPLIANCE. */
  deficiencies?: string[] | null;
  notes?: string | null;
}

export interface RequestFilter {
  status?: RequestStatus | null;
  requestTypeId?: string | null;
  originOffice?: string | null;
  priority?: RequestPriority | null;
  slaAtRisk?: boolean | null;
  slaOverdue?: boolean | null;
  receivedFrom?: Date | null;
  receivedTo?: Date | null;
}

export type RequestSortField =
  | "RECEIVED_AT"
  | "SLA_DEADLINE"
  | "CONTROL_NO"
  | "TITLE"
  | "PRIORITY";

export interface IRequestService {
  getById(id: string): Promise<RequestRecord | null>;
  getByControlNo(controlNo: string): Promise<RequestRecord | null>;
  list(args: ConnectionArgs<RequestFilter, RequestSortField>): Promise<Connection<RequestRecord>>;

  /** Encode reception; issues control number + RECEIVED log (FR-07..11). */
  encode(actorId: string, input: EncodeRequestInput): Promise<RequestRecord>;

  /** Record a screening pass/fail and transition status (FR-12..15). */
  screen(actorId: string, input: ScreenRequestInput): Promise<RequestRecord>;

  /** Reopen / resubmit a returned request (FR-14). */
  resubmit(actorId: string, requestId: string): Promise<RequestRecord>;

  /** Compute sla_deadline = received_at + 3 business days (RA 11032, FR-09). */
  computeSlaDeadline(receivedAt: Date): Promise<Date>;
}
