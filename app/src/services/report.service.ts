/**
 * ReportService and LookupService.
 */

import { authorizeOrThrow } from '@/authz/authorize';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { IGraphQLClient } from './contracts/graphql';
import type {
  CategorySummaryRow,
  DashboardMetrics,
  DocumentType,
  Holiday,
  ReportArtifact,
  RequestType,
} from './contracts/models';
import type {
  CategorySummaryInput,
  ExportReportInput,
  ILookupService,
  IReportService,
  UpsertDocumentTypeInput,
  UpsertHolidayInput,
  UpsertRequestTypeInput,
} from './contracts/report';
import type { MutationAnswer } from './contracts/mutation';
import {
  executeQueryWithCache,
  generateListCacheKey,
  invalidateChangedEntities,
  invalidateMetrics,
  METRICS_QUERY_KEY,
  TTL,
} from './cache/helpers';
import { LOOKUP_OPS, REPORT_OPS } from './graphql/report.ops';

interface MetricsEntity extends DashboardMetrics {
  id: string;
}

export class ReportService implements IReportService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    authorizeOrThrow(this.authz, 'ReportService:Read');
    const entity = await executeQueryWithCache<MetricsEntity>({
      cache: this.cache,
      queryKey: METRICS_QUERY_KEY,
      entities: ['DashboardMetrics'],
      queryType: 'get',
      ttlMs: TTL.METRICS,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ dashboardMetrics: DashboardMetrics }>({
            document: REPORT_OPS.dashboardMetrics,
            operationName: 'DashboardMetrics',
          })
          .then((d) => ({ id: 'dashboard', ...d.dashboardMetrics })),
      extract: (r) => ({ items: [{ id: r.id }], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as MetricsEntity) : undefined),
    });
    // Strip the synthetic cache id; the UI sees only the metrics fields.
    return {
      totalDocuments: entity.totalDocuments,
      incomingRequests: entity.incomingRequests,
      pendingActions: entity.pendingActions,
      closedTransactions: entity.closedTransactions,
      slaAtRisk: entity.slaAtRisk,
      slaOverdue: entity.slaOverdue,
    };
  }

  async getCategorySummary(input: CategorySummaryInput): Promise<CategorySummaryRow[]> {
    authorizeOrThrow(this.authz, 'ReportService:Read');
    return executeQueryWithCache<CategorySummaryRow[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('categorySummary', input as unknown as Record<string, unknown>),
      entities: ['CategorySummaryRow'],
      queryType: 'list',
      ttlMs: TTL.METRICS,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ categorySummary: CategorySummaryRow[] }>({
            document: REPORT_OPS.categorySummary,
            variables: { input },
            operationName: 'CategorySummary',
          })
          .then((d) => d.categorySummary),
      extract: (rows) => ({ items: rows.map((r) => ({ ...r, id: r.documentTypeId })), endCursor: null }),
      rehydrate: (items) => items as CategorySummaryRow[],
    });
  }

  async exportSummary(input: ExportReportInput): Promise<ReportArtifact> {
    authorizeOrThrow(this.authz, 'ReportService:Export');
    const payload = await this.gql.request<{
      exportSummary: MutationAnswer<'report', ReportArtifact>;
    }>({
      document: REPORT_OPS.exportSummary,
      variables: { input },
      operationName: 'ExportSummary',
    });
    invalidateChangedEntities(this.cache, payload.exportSummary.changedEntities);
    return payload.exportSummary.report;
  }

  /** Invalidate the dashboard metrics query (used after workflow mutations). */
  invalidateDashboard(): void {
    invalidateMetrics(this.cache);
  }
}

export class LookupService implements ILookupService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async listRequestTypes(includeInactive = false): Promise<RequestType[]> {
    authorizeOrThrow(this.authz, 'RequestService:Read');
    return executeQueryWithCache<RequestType[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('requestType', { includeInactive }),
      entities: ['RequestType'],
      queryType: 'list',
      ttlMs: TTL.REFERENCE,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ requestTypes: RequestType[] }>({
            document: LOOKUP_OPS.requestTypes,
            variables: { includeInactive },
            operationName: 'RequestTypes',
          })
          .then((d) => d.requestTypes),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as RequestType[],
    });
  }

  async listDocumentTypes(includeInactive = false): Promise<DocumentType[]> {
    authorizeOrThrow(this.authz, 'DocumentService:Read');
    return executeQueryWithCache<DocumentType[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('documentType', { includeInactive }),
      entities: ['DocumentType'],
      queryType: 'list',
      ttlMs: TTL.REFERENCE,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ documentTypes: DocumentType[] }>({
            document: LOOKUP_OPS.documentTypes,
            variables: { includeInactive },
            operationName: 'DocumentTypes',
          })
          .then((d) => d.documentTypes),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as DocumentType[],
    });
  }

  async listHolidays(from?: string | null, to?: string | null): Promise<Holiday[]> {
    authorizeOrThrow(this.authz, 'ReportService:Read');
    return executeQueryWithCache<Holiday[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('holiday', { from: from ?? null, to: to ?? null }),
      entities: ['Holiday'],
      queryType: 'list',
      ttlMs: TTL.REFERENCE,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ holidays: Holiday[] }>({
            document: REPORT_OPS.holidays,
            variables: { from: from ?? null, to: to ?? null },
            operationName: 'Holidays',
          })
          .then((d) => d.holidays),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as Holiday[],
    });
  }

  async createRequestType(input: UpsertRequestTypeInput): Promise<RequestType> {
    authorizeOrThrow(this.authz, 'RequestService:Encode');
    const payload = await this.gql.request<{
      createRequestType: MutationAnswer<'requestType', RequestType>;
    }>({
      document: LOOKUP_OPS.createRequestType,
      variables: { input },
      operationName: 'CreateRequestType',
    });
    invalidateChangedEntities(this.cache, payload.createRequestType.changedEntities);
    return payload.createRequestType.requestType;
  }

  async createDocumentType(input: UpsertDocumentTypeInput): Promise<DocumentType> {
    authorizeOrThrow(this.authz, 'DocumentService:Prepare');
    const payload = await this.gql.request<{
      createDocumentType: MutationAnswer<'documentType', DocumentType>;
    }>({
      document: LOOKUP_OPS.createDocumentType,
      variables: { input },
      operationName: 'CreateDocumentType',
    });
    invalidateChangedEntities(this.cache, payload.createDocumentType.changedEntities);
    return payload.createDocumentType.documentType;
  }

  async upsertHoliday(input: UpsertHolidayInput): Promise<Holiday> {
    authorizeOrThrow(this.authz, 'ReportService:Read');
    const payload = await this.gql.request<{
      upsertHoliday: MutationAnswer<'holiday', Holiday>;
    }>({
      document: LOOKUP_OPS.upsertHoliday,
      variables: { input },
      operationName: 'UpsertHoliday',
    });
    invalidateChangedEntities(this.cache, payload.upsertHoliday.changedEntities);
    return payload.upsertHoliday.holiday;
  }
}
