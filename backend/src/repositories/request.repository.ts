/**
 * [B] Document Module - Intake Repository Implementations
 *
 * Concrete data-access for request_types, control_number_sequences, holidays,
 * and requests.
 */

import { eq, inArray, gte, lt, sql } from "drizzle-orm";

import type { Database } from "../db/index.js";
import {
  requests,
  requestTypes,
  controlNumberSequences,
  holidays,
} from "../db/schema/index.js";
import { NotFoundError } from "../errors/index.js";
import { formatControlNo } from "../utils/index.js";
import type {
  IRequestRepository,
  IRequestTypeRepository,
  IHolidayRepository,
  IControlNumberRepository,
  CreateRequestData,
  UpdateRequestData,
  RequestRecord,
  RequestTypeRecord,
  HolidayRecord,
} from "../interfaces/request.repository.interface.js";
import type { ListOptions } from "../interfaces/common.interface.js";

/** Convert a Date to a YYYY-MM-DD string for `date` columns. */
function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class RequestRepository implements IRequestRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<RequestRecord | null> {
    const [row] = await this.tx.select().from(requests).where(eq(requests.id, id)).limit(1);
    return row ?? null;
  }

  async findByIds(ids: string[]): Promise<RequestRecord[]> {
    if (ids.length === 0) return [];
    return this.tx.select().from(requests).where(inArray(requests.id, ids));
  }

  async findByControlNo(controlNo: string): Promise<RequestRecord | null> {
    const [row] = await this.tx
      .select()
      .from(requests)
      .where(eq(requests.controlNo, controlNo))
      .limit(1);
    return row ?? null;
  }

  async findMany(options: ListOptions): Promise<RequestRecord[]> {
    let query = this.tx.select().from(requests).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async count(options?: Pick<ListOptions, "where">): Promise<number> {
    let query = this.tx
      .select({ count: sql<number>`count(*)::int` })
      .from(requests)
      .$dynamic();
    if (options?.where) query = query.where(options.where);
    const [row] = await query;
    return row?.count ?? 0;
  }

  async create(data: CreateRequestData): Promise<RequestRecord> {
    const [row] = await this.tx
      .insert(requests)
      .values({
        controlNo: data.controlNo,
        requestTypeId: data.requestTypeId,
        title: data.title,
        requestingParty: data.requestingParty,
        originOffice: data.originOffice,
        channel: data.channel,
        priority: data.priority ?? "NORMAL",
        receivedAt: data.receivedAt,
        slaDeadline: data.slaDeadline,
        createdBy: data.createdBy,
      })
      .returning();
    return row;
  }

  async update(id: string, data: UpdateRequestData): Promise<RequestRecord> {
    const [row] = await this.tx
      .update(requests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    if (!row) throw new NotFoundError("Request", id);
    return row;
  }
}

export class RequestTypeRepository implements IRequestTypeRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<RequestTypeRecord | null> {
    const [row] = await this.tx
      .select()
      .from(requestTypes)
      .where(eq(requestTypes.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByCode(code: string): Promise<RequestTypeRecord | null> {
    const [row] = await this.tx
      .select()
      .from(requestTypes)
      .where(eq(requestTypes.code, code))
      .limit(1);
    return row ?? null;
  }

  async findMany(options: ListOptions): Promise<RequestTypeRecord[]> {
    let query = this.tx.select().from(requestTypes).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async create(data: {
    code: string;
    name: string;
    description: string;
    prefix: string;
    isActive?: boolean;
  }): Promise<RequestTypeRecord> {
    const [row] = await this.tx
      .insert(requestTypes)
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        prefix: data.prefix,
        isActive: data.isActive ?? true,
      })
      .returning();
    return row;
  }
}

export class HolidayRepository implements IHolidayRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<HolidayRecord | null> {
    const [row] = await this.tx.select().from(holidays).where(eq(holidays.id, id)).limit(1);
    return row ?? null;
  }

  async findBetween(from: Date, to: Date): Promise<HolidayRecord[]> {
    return this.tx
      .select()
      .from(holidays)
      .where(
        sql`${holidays.holidayDate} >= ${toDateOnly(from)} AND ${holidays.holidayDate} <= ${toDateOnly(to)}`,
      );
  }

  async findMany(options: ListOptions): Promise<HolidayRecord[]> {
    let query = this.tx.select().from(holidays).$dynamic();
    if (options.where) query = query.where(options.where);
    if (options.orderBy?.length) query = query.orderBy(...options.orderBy);
    query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);
    return query;
  }

  async upsert(data: { holidayDate: string; name: string }): Promise<HolidayRecord> {
    const [row] = await this.tx
      .insert(holidays)
      .values({ holidayDate: data.holidayDate, name: data.name })
      .onConflictDoUpdate({
        target: holidays.holidayDate,
        set: { name: data.name },
      })
      .returning();
    return row;
  }
}

/**
 * Atomic control-number issuance. Uses INSERT ... ON CONFLICT DO UPDATE with
 * a row-level lock, so concurrent intake clerks never collide or skip (FR-08).
 */
export class ControlNumberRepository implements IControlNumberRepository {
  constructor(private readonly tx: Database) {}

  async issueNext(seqCode: string, year: number, prefix: string): Promise<string> {
    const result = (await this.tx.execute(sql`
      INSERT INTO app.control_number_sequences (seq_code, year, last_value)
      VALUES (${seqCode}, ${year}, 1)
      ON CONFLICT (seq_code, year)
      DO UPDATE SET last_value = app.control_number_sequences.last_value + 1
      RETURNING last_value
    `)) as unknown as Array<{ last_value: number | string }>;

    const lastValue = Number(result[0]?.last_value ?? 1);
    return formatControlNo(prefix, year, lastValue);
  }

  async peek(seqCode: string, year: number): Promise<typeof controlNumberSequences.$inferSelect | null> {
    const [row] = await this.tx
      .select()
      .from(controlNumberSequences)
      .where(
        sql`${controlNumberSequences.seqCode} = ${seqCode} AND ${controlNumberSequences.year} = ${year}`,
      )
      .limit(1);
    return row ?? null;
  }
}

// Referenced to keep `gte`/`lt` available for future filter builders.
void gte;
void lt;
