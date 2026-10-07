/**
 * Request Service
 *
 * Implements IRequestService - intake steps of the document lifecycle:
 * reception (Step 1) and initial screening (Step 2).
 *
 * - FR-07..11  encode reception, issue a control number atomically, compute
 *              the SLA deadline, write the RECEIVED audit entry in the same
 *              transaction
 * - FR-12..15  screening pass/fail, RETURNED_FOR_COMPLIANCE, resubmission
 * - FR-09      sla_deadline = received_at + 3 business days (RA 11032),
 *              skipping weekends and holidays
 * - FR-39      exactly one immutable audit entry per state change, in-tx
 *
 * [SOLID:SRP] Business rules only - no DB or HTTP concerns.
 * [SOLID:DIP] Depends on IDatabase / IRepositories abstractions.
 */

import { and, asc, desc, eq, gt, gte, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";

import { config } from "../../config/index.js";
import { requests } from "../../db/schema/index.js";
import {
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from "../../errors/index.js";
import type { IDatabase, IRepositories } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type { INotificationService } from "../../interfaces/notification.service.interface.js";
import type {
  IRequestService,
  EncodeRequestInput,
  ScreenRequestInput,
  RequestFilter,
  RequestSortField,
} from "../../interfaces/request.service.interface.js";
import type {
  Connection,
  ConnectionArgs,
  SortDirection,
} from "../../interfaces/common.interface.js";
import type { RequestRecord } from "../../interfaces/request.repository.interface.js";
import { ilikePattern, resolveWindow, toConnection } from "../shared/query.js";
import { assertPermission } from "../shared/authz.js";
import { loadActorSnapshot } from "../shared/workflow.js";

export class RequestService implements IRequestService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
    private readonly notifications: INotificationService,
  ) {}

  async getById(id: string): Promise<RequestRecord | null> {
    return this.db.query((uow) => uow.requests.findById(id));
  }

  async getByControlNo(controlNo: string): Promise<RequestRecord | null> {
    return this.db.query((uow) => uow.requests.findByControlNo(controlNo));
  }

  async list(
    args: ConnectionArgs<RequestFilter, RequestSortField>,
  ): Promise<Connection<RequestRecord>> {
    const { first, offset } = resolveWindow(args);
    const where = and(
      this.buildFilterWhere(args.filter),
      this.buildSearchWhere(args.search),
    );

    return this.db.query(async (uow) => {
      const [rows, totalCount] = await Promise.all([
        uow.requests.findMany({
          limit: first + 1,
          offset,
          where,
          orderBy: this.orderBy(args.sort),
        }),
        uow.requests.count({ where }),
      ]);
      return toConnection({ rows, first, offset, totalCount });
    });
  }

  /**
   * Step 1 - encode an incoming request (FR-07..11).
   * Atomic in one transaction: control number, SLA deadline, request row,
   * RECEIVED audit entry.
   */
  async encode(actorId: string, input: EncodeRequestInput): Promise<RequestRecord> {
    const title = input.title?.trim();
    const requestingParty = input.requestingParty?.trim();
    const originOffice = input.originOffice?.trim();
    if (!title) throw new ValidationError("Title is required.");
    if (!requestingParty) throw new ValidationError("Requesting party is required.");
    if (!originOffice) throw new ValidationError("Origin office is required.");

    const receivedAt = input.receivedAt ?? new Date();
    const year = receivedAt.getFullYear();
    const started = Date.now();

    const created = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "RequestService:Encode");

      const requestType = await uow.requestTypes.findById(input.requestTypeId);
      if (!requestType) throw new NotFoundError("Request type", input.requestTypeId);
      if (!requestType.isActive) {
        throw new InvalidStateError(`Request type '${requestType.name}' is inactive.`);
      }

      const actor = await loadActorSnapshot(uow, actorId);
      const slaDeadline = await this.computeSlaDeadlineWith(uow, receivedAt);
      const controlNo = await uow.controlNumbers.issueNext(
        `REQ:${requestType.code}`,
        year,
        requestType.prefix,
      );

      const request = await uow.requests.create({
        controlNo,
        requestTypeId: requestType.id,
        title,
        requestingParty,
        originOffice,
        channel: input.channel,
        priority: input.priority ?? "NORMAL",
        receivedAt,
        slaDeadline,
        createdBy: actorId,
      });

      await uow.documentLogs.append({
        requestId: request.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "RECEIVED",
        template:
          "Encoded incoming request ${payload.control_no} (${payload.request_type}) received via ${payload.channel}.",
        payload: {
          control_no: controlNo,
          request_type: requestType.name,
          channel: input.channel,
          priority: input.priority ?? "NORMAL",
          sla_deadline: slaDeadline.toISOString(),
        },
      });

      return request;
    });

    this.telemetry.trackPerformance("request.encode", Date.now() - started, {
      controlNo: created.controlNo,
    });
    return created;
  }

  /**
   * Step 2 - record a screening decision (FR-12..15).
   * pass -> PREPARATION (SCREENED_PASS); fail -> RETURNED_FOR_COMPLIANCE
   * (SCREENED_FAIL with the specific deficiencies).
   */
  async screen(actorId: string, input: ScreenRequestInput): Promise<RequestRecord> {
    const deficiencies = (input.deficiencies ?? [])
      .map((entry) => entry?.trim())
      .filter((entry): entry is string => Boolean(entry));
    if (!input.passed && deficiencies.length === 0) {
      throw new ValidationError(
        "Specific deficiencies are required when returning a request for compliance (FR-13).",
      );
    }

    return this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "RequestService:Screen");

      const request = await uow.requests.findById(input.requestId);
      if (!request) throw new NotFoundError("Request", input.requestId);
      if (request.status !== "RECEIVED" && request.status !== "SCREENING") {
        throw new InvalidStateError(
          `Request ${request.controlNo} is not awaiting screening (status: ${request.status}).`,
        );
      }

      const actor = await loadActorSnapshot(uow, actorId);
      const nextStatus = input.passed ? "PREPARATION" : "RETURNED_FOR_COMPLIANCE";
      const updated = await uow.requests.update(request.id, { status: nextStatus });

      await uow.documentLogs.append({
        requestId: request.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: input.passed ? "SCREENED_PASS" : "SCREENED_FAIL",
        template: input.passed
          ? "Screening passed for ${payload.control_no}; advanced to preparation."
          : "Screening failed for ${payload.control_no}: ${payload.deficiencies}.",
        payload: {
          control_no: request.controlNo,
          passed: input.passed,
          deficiencies,
          notes: input.notes ?? null,
        },
      });

      return updated;
    });
  }

  /** Reopen a returned request into screening (FR-14). */
  async resubmit(actorId: string, requestId: string): Promise<RequestRecord> {
    return this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "RequestService:Screen");

      const request = await uow.requests.findById(requestId);
      if (!request) throw new NotFoundError("Request", requestId);
      if (request.status !== "RETURNED_FOR_COMPLIANCE") {
        throw new InvalidStateError(
          `Only requests returned for compliance can be resubmitted (status: ${request.status}).`,
        );
      }

      const actor = await loadActorSnapshot(uow, actorId);
      const updated = await uow.requests.update(requestId, { status: "SCREENING" });

      await uow.documentLogs.append({
        requestId: request.id,
        actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        actionType: "RESUBMITTED",
        template: "Request ${payload.control_no} resubmitted for screening.",
        payload: { control_no: request.controlNo },
      });

      return updated;
    });
  }

  /** Compute sla_deadline = received_at + 3 business days (RA 11032, FR-09). */
  async computeSlaDeadline(receivedAt: Date): Promise<Date> {
    return this.db.query((uow) => this.computeSlaDeadlineWith(uow, receivedAt));
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /**
   * Add 3 business days to `receivedAt`, skipping weekends and every holiday
   * in the calendar (NFR-23). Runs inside the caller's transaction so the
   * holiday read shares the same snapshot.
   */
  private async computeSlaDeadlineWith(
    uow: IRepositories,
    receivedAt: Date,
  ): Promise<Date> {
    const lookaheadEnd = new Date(receivedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const holidayRows = await uow.holidays.findBetween(receivedAt, lookaheadEnd);
    const holidaySet = new Set(holidayRows.map((row) => row.holidayDate));

    const cursor = new Date(receivedAt.getTime());
    let businessDays = 0;
    while (businessDays < 3) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      const dayOfWeek = cursor.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      if (holidaySet.has(cursor.toISOString().slice(0, 10))) continue;
      businessDays += 1;
    }
    return cursor;
  }

  private buildFilterWhere(filter?: RequestFilter | null): SQL | undefined {
    if (!filter) return undefined;
    const conditions: SQL[] = [];
    const now = new Date();

    if (filter.status) conditions.push(eq(requests.status, filter.status));
    if (filter.requestTypeId) {
      conditions.push(eq(requests.requestTypeId, filter.requestTypeId));
    }
    if (filter.originOffice) {
      conditions.push(eq(requests.originOffice, filter.originOffice));
    }
    if (filter.priority) conditions.push(eq(requests.priority, filter.priority));

    if (filter.slaAtRisk) {
      const warnUntil = new Date(
        now.getTime() + config.sla.warningHours * 60 * 60 * 1000,
      );
      conditions.push(
        and(
          ne(requests.status, "CLOSED"),
          gt(requests.slaDeadline, now),
          lte(requests.slaDeadline, warnUntil),
        ) as SQL,
      );
    }
    if (filter.slaOverdue) {
      conditions.push(
        and(
          ne(requests.status, "CLOSED"),
          lt(requests.slaDeadline, now),
        ) as SQL,
      );
    }
    if (filter.receivedFrom) {
      conditions.push(gte(requests.receivedAt, filter.receivedFrom));
    }
    if (filter.receivedTo) {
      conditions.push(lte(requests.receivedAt, filter.receivedTo));
    }

    return conditions.length > 0 ? (and(...conditions) as SQL) : undefined;
  }

  private buildSearchWhere(search?: string | null): SQL | undefined {
    const term = search?.trim();
    if (!term) return undefined;
    const pattern = ilikePattern(term);
    return or(
      sql`${requests.controlNo} ILIKE ${pattern}`,
      sql`${requests.title} ILIKE ${pattern}`,
      sql`${requests.requestingParty} ILIKE ${pattern}`,
      sql`${requests.originOffice} ILIKE ${pattern}`,
    );
  }

  private orderBy(
    sort?: { field: RequestSortField; direction?: SortDirection } | null,
  ): SQL[] {
    const direction = sort?.direction === "ASC" ? asc : desc;
    switch (sort?.field) {
      case "SLA_DEADLINE":
        return [direction(requests.slaDeadline)];
      case "CONTROL_NO":
        return [direction(requests.controlNo)];
      case "TITLE":
        return [direction(requests.title)];
      case "PRIORITY":
        return [direction(requests.priority)];
      case "RECEIVED_AT":
      default:
        return [direction(requests.receivedAt)];
    }
  }
}
