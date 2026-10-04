/**
 * Report Service (SKELETON)
 *
 * Implements IReportService. Business logic not implemented yet.
 *
 * Intended responsibilities (when implemented):
 *  - FR-35  dashboard metrics (totals, pending, closed, SLA at-risk/overdue)
 *  - FR-36  monthly/annual per-category summaries (documents GROUP BY type)
 *  - FR-37  export to PDF and Excel
 */

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  IReportService,
  DashboardMetrics,
  CategorySummaryInput,
  CategorySummaryRow,
  ExportReportInput,
  ReportArtifact,
} from "../../interfaces/report.service.interface.js";
import type { ConnectionArgs } from "../../interfaces/common.interface.js";
import { NotImplementedError } from "../../errors/index.js";

export class ReportService implements IReportService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async getDashboardMetrics(_args?: ConnectionArgs): Promise<DashboardMetrics> {
    // TODO(FR-35): counts from documents/requests + SLA-at-risk/overdue.
    throw new NotImplementedError("ReportService.getDashboardMetrics");
  }

  async getCategorySummary(_input: CategorySummaryInput): Promise<CategorySummaryRow[]> {
    // TODO(FR-36): documents.countByType within the period, joined to document_types.
    throw new NotImplementedError("ReportService.getCategorySummary");
  }

  async exportSummary(_input: ExportReportInput): Promise<ReportArtifact> {
    // TODO(FR-37): render the summary to PDF/Excel bytes.
    throw new NotImplementedError("ReportService.exportSummary");
  }
}
