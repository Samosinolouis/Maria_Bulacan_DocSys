/**
 * Report contract (FR-35..38) and reference-data lookup contract.
 */

import type {
  DashboardMetrics,
  CategorySummaryRow,
  ReportArtifact,
  ReportFormat,
  ReportPeriod,
  RequestType,
  DocumentType,
  Holiday,
} from './models';

export interface CategorySummaryInput {
  period: ReportPeriod;
  year: number;
  /** Required when period = MONTHLY (1-12). */
  month?: number | null;
}

export interface ExportReportInput extends CategorySummaryInput {
  format: ReportFormat;
}

export interface IReportService {
  /** Workload and SLA snapshot for the dashboard (FR-35). Action: ReportService:Read. */
  getDashboardMetrics(): Promise<DashboardMetrics>;

  /** Monthly / annual per-category counts (FR-36). Action: ReportService:Read. */
  getCategorySummary(input: CategorySummaryInput): Promise<CategorySummaryRow[]>;

  /** Export a summary to PDF or Excel (FR-37). Action: ReportService:Export. */
  exportSummary(input: ExportReportInput): Promise<ReportArtifact>;
}

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
  /** YYYY-MM-DD. */
  holidayDate: string;
  name: string;
}

/**
 * Reference data. Reads gate under the consuming domain:
 * requestTypes -> RequestService:Read, documentTypes -> DocumentService:Read,
 * holidays -> ReportService:Read.
 */
export interface ILookupService {
  listRequestTypes(includeInactive?: boolean): Promise<RequestType[]>;
  listDocumentTypes(includeInactive?: boolean): Promise<DocumentType[]>;

  /** Holidays within [from, to); feeds SLA computation (FR-09). */
  listHolidays(from?: string | null, to?: string | null): Promise<Holiday[]>;

  /** Action: RequestService:Encode (admin maintenance). */
  createRequestType(input: UpsertRequestTypeInput): Promise<RequestType>;

  /** Action: DocumentService:Prepare (admin maintenance). */
  createDocumentType(input: UpsertDocumentTypeInput): Promise<DocumentType>;

  /** Action: ReportService:Read (admin maintenance). */
  upsertHoliday(input: UpsertHolidayInput): Promise<Holiday>;
}

/** Archive folder contract (folders 1 --- N documents). */
export interface Folder {
  id: string;
  parentId?: string | null;
  path: string;
  name: string;
  itemCount: number;
  createdBy: string;
  createdAt: string;
}

export interface CreateFolderInput {
  name: string;
  /** Omit for a root-level folder. */
  parentId?: string | null;
}

export interface IFolderService {
  /** Action: FolderService:Read (authenticated). */
  getById(id: string): Promise<Folder | null>;
  /** Direct subfolders of a folder; null lists root-level folders. */
  list(parentId?: string | null): Promise<Folder[]>;

  /** Action: FolderService:Create. */
  create(input: CreateFolderInput): Promise<Folder>;
}
