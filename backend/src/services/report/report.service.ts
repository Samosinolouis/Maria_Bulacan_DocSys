/**
 * Report Service
 *
 * Implements IReportService - dashboards and monthly/annual summaries
 * (FR-35..38). Read-only aggregation over requests/documents.
 *
 * - FR-35  workload + SLA snapshot for the dashboard
 * - FR-36  monthly / annual per-category counts
 * - FR-38  SLA-at-risk/overdue windows share the configured warning period
 *
 * [SOLID:SRP] Aggregation only - no state changes.
 */

import { and, eq, gt, gte, inArray, lt, lte, ne } from "drizzle-orm";

import { config } from "../../config/index.js";
import { documents, requests } from "../../db/schema/index.js";
import { NotImplementedError, ValidationError } from "../../errors/index.js";
import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  IReportService,
  DashboardMetrics,
  CategorySummaryRow,
  CategorySummaryInput,
  ExportReportInput,
} from "../../interfaces/report.service.interface.js";
import type { ReportArtifact } from "../../interfaces/report.service.interface.js";

/** Statuses that count as "awaiting action" on the dashboard (FR-35). */
const PENDING_STATUSES = ["RECEIVED", "SCREENING", "PREPARATION", "REVIEW"] as const;

export class ReportService implements IReportService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  /** Workload + SLA snapshot for the dashboard (FR-35). */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const warnUntil = new Date(
      now.getTime() + config.sla.warningHours * 60 * 60 * 1000,
    );

    return this.db.query(async (uow) => {
      const [
        totalDocuments,
        incomingRequests,
        pendingActions,
        closedTransactions,
        slaAtRisk,
        slaOverdue,
      ] = await Promise.all([
        uow.documents.count(),
        uow.requests.count(),
        uow.requests.count({ where: inArray(requests.status, [...PENDING_STATUSES]) }),
        uow.requests.count({ where: eq(requests.status, "CLOSED") }),
        uow.requests.count({
          where: and(
            ne(requests.status, "CLOSED"),
            gt(requests.slaDeadline, now),
            lte(requests.slaDeadline, warnUntil),
          ),
        }),
        uow.requests.count({
          where: and(ne(requests.status, "CLOSED"), lt(requests.slaDeadline, now)),
        }),
      ]);

      return {
        totalDocuments,
        incomingRequests,
        pendingActions,
        closedTransactions,
        slaAtRisk,
        slaOverdue,
      };
    });
  }

  /** Monthly / annual per-category counts (FR-36). */
  async getCategorySummary(input: CategorySummaryInput): Promise<CategorySummaryRow[]> {
    const { start, end } = this.resolvePeriodRange(input);

    return this.db.query(async (uow) => {
      const counts = await uow.documents.countByType(
        and(gte(documents.createdAt, start), lt(documents.createdAt, end)),
      );
      const types = await uow.documentTypes.findMany({ limit: 500 });
      const byId = new Map(types.map((type) => [type.id, type]));

      return counts
        .map((row) => {
          const type = byId.get(row.documentTypeId);
          return {
            documentTypeId: row.documentTypeId,
            code: type?.code ?? "",
            name: type?.name ?? "Unknown",
            count: row.count,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  /** Export a summary to PDF or Excel (FR-37). */
  async exportSummary(_input: ExportReportInput): Promise<ReportArtifact> {
    // TODO(FR-37): PDF/XLSX rendering lands with the reports module; outside
    // the document-workflow scope. The aggregation layer above is ready.
    throw new NotImplementedError("ReportService.exportSummary");
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private resolvePeriodRange(input: CategorySummaryInput): { start: Date; end: Date } {
    const year = input.year;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new ValidationError("A valid report year is required.");
    }

    if (input.period === "MONTHLY") {
      const month = input.month;
      if (month === undefined || month === null || !Number.isInteger(month) || month < 1 || month > 12) {
        throw new ValidationError("Month (1-12) is required for monthly reports.");
      }
      return {
        start: new Date(Date.UTC(year, month - 1, 1)),
        end: new Date(Date.UTC(year, month, 1)),
      };
    }

    return {
      start: new Date(Date.UTC(year, 0, 1)),
      end: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }
}
