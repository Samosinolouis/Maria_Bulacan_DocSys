/**
 * Request Service (SKELETON)
 *
 * Implements IRequestService — intake steps of the document lifecycle.
 * Business logic not implemented yet.
 *
 * Intended responsibilities (when implemented):
 *  - FR-07..11  encode reception, issue control number atomically, compute SLA,
 *               write the RECEIVED audit entry in the same transaction
 *  - FR-12..15  screening pass/fail, RETURNED_FOR_COMPLIANCE, resubmission
 *  - FR-09      sla_deadline = received_at + 3 business days (RA 11032),
 *               excluding weekends and holidays
 */

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type { INotificationService } from "../../interfaces/notification.service.interface.js";
import type {
  IRequestService,
  EncodeRequestInput,
  ScreenRequestInput,
  RequestFilter,
  RequestSortField,
} from "../../interfaces/request.service.interface.js";
import type { Connection, ConnectionArgs } from "../../interfaces/common.interface.js";
import type { RequestRecord } from "../../interfaces/request.repository.interface.js";
import { NotImplementedError } from "../../errors/index.js";

export class RequestService implements IRequestService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
    private readonly notifications: INotificationService,
  ) {}

  async getById(_id: string): Promise<RequestRecord | null> {
    throw new NotImplementedError("RequestService.getById");
  }

  async getByControlNo(_controlNo: string): Promise<RequestRecord | null> {
    throw new NotImplementedError("RequestService.getByControlNo");
  }

  async list(
    _args: ConnectionArgs<RequestFilter, RequestSortField>,
  ): Promise<Connection<RequestRecord>> {
    throw new NotImplementedError("RequestService.list");
  }

  async encode(_actorId: string, _input: EncodeRequestInput): Promise<RequestRecord> {
    // TODO(FR-07..11): UoW transaction ->
    //   controlNumbers.issueNext -> requests.create -> documentLogs.append(RECEIVED).
    throw new NotImplementedError("RequestService.encode");
  }

  async screen(_actorId: string, _input: ScreenRequestInput): Promise<RequestRecord> {
    // TODO(FR-12..15): pass -> PREPARATION (SCREENED_PASS log);
    //   fail -> RETURNED_FOR_COMPLIANCE (SCREENED_FAIL + deficiencies).
    throw new NotImplementedError("RequestService.screen");
  }

  async resubmit(_actorId: string, _requestId: string): Promise<RequestRecord> {
    // TODO(FR-14): returned request re-enters SCREENING (RESUBMITTED log).
    throw new NotImplementedError("RequestService.resubmit");
  }

  async computeSlaDeadline(_receivedAt: Date): Promise<Date> {
    // TODO(FR-09): add 3 business days skipping weekends + holidays table.
    throw new NotImplementedError("RequestService.computeSlaDeadline");
  }
}
