/**
 * Report Service Interface
 *
 * Business-logic abstraction for dashboards and monthly/annual summaries
 * (FR-35..38). Read-only aggregation over requests/documents.
 */

import type { ConnectionArgs } from "./common.interface.js";

/** Dashboard metric snapshot (FR-35). */
export interface DashboardMetrics {
  totalDocuments: number;
  incomingRequests: number;
  pendingActions: number;
  closedTransactions: number;
  slaAtRisk: number;
  slaOverdue: number;
}

/** One row of a per-category summary report (FR-36). */
export interface CategorySummaryRow {
  documentTypeId: string;
  code: string;
  name: string;
  count: number;
}

export type ReportPeriod = "MONTHLY" | "ANNUAL";

export interface CategorySummaryInput {
  period: ReportPeriod;
  year: number;
  /** Required when period = MONTHLY (1-12). */
  month?: number | null;
}

export type ReportFormat = "PDF" | "EXCEL";

export interface ExportReportInput extends CategorySummaryInput {
  format: ReportFormat;
}

/** A generated report artifact (bytes produced for download). */
export interface ReportArtifact {
  fileName: string;
  mimeType: string;
  /** Raw bytes; may be empty in the skeleton. */
  body: Uint8Array;
}

export interface IReportService {
  /** Workload + SLA snapshot for the dashboard (FR-35). */
  getDashboardMetrics(args?: ConnectionArgs): Promise<DashboardMetrics>;

  /** Monthly / annual per-category counts (FR-36). */
  getCategorySummary(input: CategorySummaryInput): Promise<CategorySummaryRow[]>;

  /** Export a summary to PDF or Excel (FR-37). */
  exportSummary(input: ExportReportInput): Promise<ReportArtifact>;
}
