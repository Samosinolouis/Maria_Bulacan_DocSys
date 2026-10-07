/**
 * Request aggregate contract (Step 1 reception, Step 2 screening).
 */

import type { Connection, ConnectionArgs, ISODateTime } from './common';
import type {
  Request,
  RequestType,
  RequestPriority,
  RequestChannel,
  RequestSortField,
} from './models';

export interface EncodeRequestInput {
  requestTypeId: string;
  title: string;
  requestingParty: string;
  originOffice: string;
  channel: RequestChannel;
  priority?: RequestPriority;
  /** Receipt date; defaults to now when omitted. */
  receivedAt?: ISODateTime | null;
}

export interface ScreenRequestInput {
  requestId: string;
  passed: boolean;
  /** Required when passed = false (FR-13). */
  deficiencies?: string[] | null;
  notes?: string | null;
}

export interface RequestFilter {
  status?: Request['status'] | null;
  requestTypeId?: string | null;
  originOffice?: string | null;
  priority?: RequestPriority | null;
  slaAtRisk?: boolean | null;
  slaOverdue?: boolean | null;
  receivedFrom?: ISODateTime | null;
  receivedTo?: ISODateTime | null;
}

export interface IRequestService {
  /** Reads (FR-32..34). Action: RequestService:Read. */
  getById(id: string): Promise<Request | null>;
  getByControlNo(controlNo: string): Promise<Request | null>;
  list(args: ConnectionArgs<RequestFilter, RequestSortField>): Promise<Connection<Request>>;
  listTypes(includeInactive?: boolean): Promise<RequestType[]>;

  /** Step 1: encode reception; issues a control number (FR-07..11). Action: RequestService:Encode. */
  encode(input: EncodeRequestInput): Promise<Request>;

  /** Step 2: screening decision (FR-12..15). Action: RequestService:Screen. */
  screen(input: ScreenRequestInput): Promise<Request>;

  /** Resubmit a returned request (FR-14). Action: RequestService:Screen. */
  resubmit(requestId: string): Promise<Request>;
}
