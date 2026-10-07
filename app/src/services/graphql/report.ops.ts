/** Report and reference-data (lookup) operations. */

import {
  CATEGORY_SUMMARY_FIELDS,
  DASHBOARD_METRICS_FIELDS,
  DOCUMENT_TYPE_FIELDS,
  HOLIDAY_FIELDS,
  REQUEST_TYPE_FIELDS,
} from './fields';

export const REPORT_OPS = {
  dashboardMetrics: `query DashboardMetrics { dashboardMetrics { ${DASHBOARD_METRICS_FIELDS} } }`,
  categorySummary: `query CategorySummary($input: CategorySummaryInput!) {
    categorySummary(input: $input) { ${CATEGORY_SUMMARY_FIELDS} }
  }`,
  exportSummary: `mutation ExportSummary($input: ExportReportInput!) {
    exportSummary(input: $input) { changedEntities report { fileName mimeType bodyBase64 } }
  }`,
  holidays: `query Holidays($from: String, $to: String) {
    holidays(from: $from, to: $to) { ${HOLIDAY_FIELDS} }
  }`,
};

export const LOOKUP_OPS = {
  requestTypes: `query RequestTypes($includeInactive: Boolean) {
    requestTypes(includeInactive: $includeInactive) { ${REQUEST_TYPE_FIELDS} }
  }`,
  documentTypes: `query DocumentTypes($includeInactive: Boolean) {
    documentTypes(includeInactive: $includeInactive) { ${DOCUMENT_TYPE_FIELDS} }
  }`,
  createRequestType: `mutation CreateRequestType($input: CreateRequestTypeInput!) {
    createRequestType(input: $input) { changedEntities requestType { ${REQUEST_TYPE_FIELDS} } }
  }`,
  createDocumentType: `mutation CreateDocumentType($input: CreateDocumentTypeInput!) {
    createDocumentType(input: $input) { changedEntities documentType { ${DOCUMENT_TYPE_FIELDS} } }
  }`,
  upsertHoliday: `mutation UpsertHoliday($input: UpsertHolidayInput!) {
    upsertHoliday(input: $input) { changedEntities holiday { ${HOLIDAY_FIELDS} } }
  }`,
};
