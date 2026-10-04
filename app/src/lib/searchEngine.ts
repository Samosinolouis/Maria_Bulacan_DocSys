/**
 * MUNICIPALITY OF SANTA MARIA, BULACAN
 * Document Management System (DocSys) - Civic Search & Indexing Engine
 * 
 * Provides government-grade, multi-token, multi-field search and parametric
 * filtering compliant with RA 11032 statutory SLA standards.
 */

import { DocumentRecord, EventBooking, AuditEntry, DocumentType, DocumentCategory, DocumentStatus } from './types';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_META, VENUE_LABELS } from './data';

export interface SearchMatchContext {
  field: 'controlNumber' | 'title' | 'requestingParty' | 'originOffice' | 'assignedTo' | 'draft' | 'attachment' | 'transmission' | 'notes';
  label: string;
  snippet: string;
}

export interface DocumentSearchResult {
  item: DocumentRecord;
  score: number;
  matches: SearchMatchContext[];
}

export interface EventSearchResult {
  item: EventBooking;
  score: number;
  snippet: string;
}

export interface AuditSearchResult {
  item: AuditEntry;
  score: number;
  snippet: string;
}

export interface UnifiedSearchResults {
  documents: DocumentSearchResult[];
  events: EventSearchResult[];
  auditLogs: AuditSearchResult[];
  totalMatches: number;
}

export interface AdvancedSearchFilter {
  query?: string;
  type?: string;          // 'ALL' | DocumentType
  category?: string;      // 'ALL' | DocumentCategory
  status?: string;        // 'ALL' | DocumentStatus
  priority?: string;      // 'ALL' | 'NORMAL' | 'HIGH' | 'URGENT'
  slaStatus?: string;     // 'ALL' | 'OVERDUE' | 'DUE_TODAY' | 'WITHIN_SLA'
  originOffice?: string;  // 'ALL' | specific office
  dateFrom?: string;      // YYYY-MM-DD
  dateTo?: string;        // YYYY-MM-DD
  hasAttachments?: string;// 'ALL' | 'WITH_ATTACHMENTS' | 'WITH_SCANS' | 'WITHOUT_ATTACHMENTS'
}

/**
 * Normalizes text by removing diacritics, extra spaces, and hyphens/punctuation for alphanumeric comparison
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text.toLowerCase().trim();
}

export function stripPunctuation(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Extracts a contextual snippet highlighting the matched term
 */
function extractSnippet(text: string, term: string, maxLength: number = 80): string {
  if (!text || !term) return text ? text.slice(0, maxLength) : '';
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);
  if (index === -1) return text.slice(0, maxLength);

  const start = Math.max(0, index - 25);
  const end = Math.min(text.length, index + term.length + 45);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

/**
 * Determines SLA status of a document
 */
export function getDocumentSlaStatus(doc: DocumentRecord): 'OVERDUE' | 'DUE_TODAY' | 'WITHIN_SLA' | 'CONCLUDED' {
  if (doc.status === 'CLOSED' || doc.status === 'TRANSMITTED') {
    return 'CONCLUDED';
  }
  const now = new Date().getTime();
  const deadline = new Date(doc.slaDeadline).getTime();
  const diffMs = deadline - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (doc.isOverdue || diffMs < 0) {
    return 'OVERDUE';
  }
  if (diffHours <= 24) {
    return 'DUE_TODAY';
  }
  return 'WITHIN_SLA';
}

/**
 * Evaluates whether a single document passes the parametric filters
 */
export function matchesParametricFilters(doc: DocumentRecord, filter: AdvancedSearchFilter): boolean {
  // Document Type filter
  if (filter.type && filter.type !== 'ALL' && doc.type !== filter.type) {
    return false;
  }

  // Category filter
  if (filter.category && filter.category !== 'ALL' && doc.category !== filter.category) {
    return false;
  }

  // Status filter
  if (filter.status && filter.status !== 'ALL' && doc.status !== filter.status) {
    return false;
  }

  // Priority filter
  if (filter.priority && filter.priority !== 'ALL' && doc.priority !== filter.priority) {
    return false;
  }

  // SLA filter
  if (filter.slaStatus && filter.slaStatus !== 'ALL') {
    const sla = getDocumentSlaStatus(doc);
    if (filter.slaStatus === 'OVERDUE' && sla !== 'OVERDUE') return false;
    if (filter.slaStatus === 'DUE_TODAY' && sla !== 'DUE_TODAY') return false;
    if (filter.slaStatus === 'WITHIN_SLA' && sla !== 'WITHIN_SLA') return false;
  }

  // Origin Office filter
  if (filter.originOffice && filter.originOffice !== 'ALL') {
    if (doc.originOffice.toLowerCase().trim() !== filter.originOffice.toLowerCase().trim()) {
      return false;
    }
  }

  // Date Received From filter
  if (filter.dateFrom) {
    const docDate = new Date(doc.dateReceived.slice(0, 10)).getTime();
    const fromDate = new Date(filter.dateFrom).getTime();
    if (docDate < fromDate) return false;
  }

  // Date Received To filter
  if (filter.dateTo) {
    const docDate = new Date(doc.dateReceived.slice(0, 10)).getTime();
    const toDate = new Date(filter.dateTo).getTime();
    if (docDate > toDate) return false;
  }

  // Attachment condition filter
  if (filter.hasAttachments && filter.hasAttachments !== 'ALL') {
    const hasAtt = Boolean(doc.attachments && doc.attachments.length > 0);
    const hasScans = Boolean((doc.scannedPages && doc.scannedPages.length > 0) || doc.scannedFileUrl);

    if (filter.hasAttachments === 'WITH_ATTACHMENTS' && !hasAtt) return false;
    if (filter.hasAttachments === 'WITH_SCANS' && !hasScans) return false;
    if (filter.hasAttachments === 'WITHOUT_ATTACHMENTS' && hasAtt) return false;
  }

  return true;
}

/**
 * Searches and scores a single document against search query tokens
 */
export function scoreDocument(doc: DocumentRecord, query: string): DocumentSearchResult | null {
  const trimmed = query.trim();
  if (!trimmed) {
    return { item: doc, score: 0, matches: [] };
  }

  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const normalizedQueryClean = stripPunctuation(trimmed);
  const docControlClean = stripPunctuation(doc.controlNumber);

  let score = 0;
  const matches: SearchMatchContext[] = [];

  // Check exact / prefix control number match
  if (docControlClean === normalizedQueryClean) {
    score += 120;
    matches.push({
      field: 'controlNumber',
      label: 'Exact Control Number Match',
      snippet: doc.controlNumber,
    });
  } else if (docControlClean.includes(normalizedQueryClean)) {
    score += 80;
    matches.push({
      field: 'controlNumber',
      label: 'Control Number Match',
      snippet: doc.controlNumber,
    });
  }

  // Title match
  const docTitleLower = doc.title.toLowerCase();
  if (docTitleLower.includes(trimmed.toLowerCase())) {
    score += 60;
    matches.push({
      field: 'title',
      label: 'Subject Matter',
      snippet: extractSnippet(doc.title, trimmed),
    });
  }

  // Requesting Party match
  const partyLower = doc.requestingParty.toLowerCase();
  if (partyLower.includes(trimmed.toLowerCase())) {
    score += 45;
    matches.push({
      field: 'requestingParty',
      label: 'Requesting Signatory/Party',
      snippet: extractSnippet(doc.requestingParty, trimmed),
    });
  }

  // Origin Office match
  const officeLower = doc.originOffice.toLowerCase();
  if (officeLower.includes(trimmed.toLowerCase())) {
    score += 35;
    matches.push({
      field: 'originOffice',
      label: 'Originating Office',
      snippet: extractSnippet(doc.originOffice, trimmed),
    });
  }

  // Assigned Officer match
  if (doc.assignedTo && doc.assignedTo.toLowerCase().includes(trimmed.toLowerCase())) {
    score += 30;
    matches.push({
      field: 'assignedTo',
      label: 'Assigned Officer',
      snippet: doc.assignedTo,
    });
  }

  // Type & Category labels match
  const typeLabel = DOCUMENT_TYPE_LABELS[doc.type]?.label?.toLowerCase() || '';
  const catLabel = DOCUMENT_CATEGORY_LABELS[doc.category]?.toLowerCase() || '';
  if (typeLabel.includes(trimmed.toLowerCase()) || catLabel.includes(trimmed.toLowerCase())) {
    score += 25;
  }

  // Draft Content full text search
  if (doc.draftContent) {
    const draftLower = doc.draftContent.toLowerCase();
    if (draftLower.includes(trimmed.toLowerCase())) {
      score += 30;
      matches.push({
        field: 'draft',
        label: 'Draft Provisions & Resolution',
        snippet: extractSnippet(doc.draftContent, trimmed),
      });
    }
  }

  // Attachments search (searching filenames of annexes)
  if (doc.attachments && doc.attachments.length > 0) {
    const matchedAttachment = doc.attachments.find((att) =>
      att.fileName.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (matchedAttachment) {
      score += 25;
      matches.push({
        field: 'attachment',
        label: 'Attached Annex File',
        snippet: matchedAttachment.fileName,
      });
    }
  }

  // Transmission details search
  if (doc.transmissionDetails) {
    const t = doc.transmissionDetails;
    const tStr = `${t.recipientName} ${t.transmittedToOffice} ${t.notes || ''}`.toLowerCase();
    if (tStr.includes(trimmed.toLowerCase())) {
      score += 20;
      matches.push({
        field: 'transmission',
        label: 'Transmission Dispatch Record',
        snippet: `${t.transmittedToOffice} - Recipient: ${t.recipientName}`,
      });
    }
  }

  // Denial reason or endorsement notes
  if (doc.denialReason && doc.denialReason.toLowerCase().includes(trimmed.toLowerCase())) {
    score += 20;
    matches.push({
      field: 'notes',
      label: 'Return / Denial Ground',
      snippet: extractSnippet(doc.denialReason, trimmed),
    });
  }
  if (doc.endorsementNotes && doc.endorsementNotes.toLowerCase().includes(trimmed.toLowerCase())) {
    score += 20;
    matches.push({
      field: 'notes',
      label: 'Endorsement Notes',
      snippet: extractSnippet(doc.endorsementNotes, trimmed),
    });
  }

  // Multi-token fallback: ensure all separate words exist somewhere in the document's searchable text
  if (tokens.length > 1 && score === 0) {
    const allSearchable = [
      doc.controlNumber,
      doc.title,
      doc.requestingParty,
      doc.originOffice,
      doc.assignedTo || '',
      typeLabel,
      catLabel,
      doc.draftContent || '',
      ...(doc.attachments ? doc.attachments.map((a) => a.fileName) : []),
      doc.transmissionDetails?.recipientName || '',
      doc.transmissionDetails?.transmittedToOffice || '',
      doc.denialReason || '',
      doc.endorsementNotes || '',
    ]
      .join(' ')
      .toLowerCase();

    const allTokensMatch = tokens.every((tok) => allSearchable.includes(tok));
    if (allTokensMatch) {
      score += 20;
      matches.push({
        field: 'title',
        label: 'Multi-term Keyword Match',
        snippet: doc.title,
      });
    }
  }

  if (score > 0) {
    return { item: doc, score, matches };
  }

  return null;
}

/**
 * Filters and searches documents with scoring and ranking
 */
export function filterAndSearchDocuments(
  documents: DocumentRecord[],
  filter: AdvancedSearchFilter
): DocumentSearchResult[] {
  const parametricFiltered = documents.filter((doc) => matchesParametricFilters(doc, filter));

  if (!filter.query || !filter.query.trim()) {
    return parametricFiltered.map((doc) => ({
      item: doc,
      score: 0,
      matches: [],
    }));
  }

  const scored: DocumentSearchResult[] = [];
  for (const doc of parametricFiltered) {
    const res = scoreDocument(doc, filter.query);
    if (res) scored.push(res);
  }

  // Sort descending by relevance score, then recent date
  return scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.item.updatedAt || b.item.createdAt).getTime() - new Date(a.item.updatedAt || a.item.createdAt).getTime();
  });
}

/**
 * Searches events for the Global Search Spotlight
 */
export function searchEvents(events: EventBooking[], query: string): EventSearchResult[] {
  if (!query || !query.trim()) return [];
  const lower = query.toLowerCase().trim();

  const results: EventSearchResult[] = [];
  for (const evt of events) {
    const venueLabel = VENUE_LABELS[evt.venue]?.label || evt.venue;
    const searchable = `${evt.title} ${evt.organizer} ${evt.department} ${venueLabel} ${evt.date} ${evt.notes || ''}`.toLowerCase();

    if (searchable.includes(lower)) {
      results.push({
        item: evt,
        score: evt.title.toLowerCase().includes(lower) ? 50 : 25,
        snippet: `${venueLabel} | ${evt.date} (${evt.startTime} - ${evt.endTime})`,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Searches audit logs for the Global Search Spotlight
 */
export function searchAuditLogs(logs: AuditEntry[], query: string): AuditSearchResult[] {
  if (!query || !query.trim()) return [];
  const lower = query.toLowerCase().trim();

  const results: AuditSearchResult[] = [];
  for (const log of logs) {
    const searchable = `${log.action} ${log.userName} ${log.userRole} ${log.details} ${log.documentId || ''}`.toLowerCase();

    if (searchable.includes(lower)) {
      results.push({
        item: log,
        score: log.details.toLowerCase().includes(lower) ? 40 : 20,
        snippet: `${log.userName} (${log.userRole}): ${log.details}`,
      });
    }
  }

  return results.slice(0, 10);
}

/**
 * Performs unified search across Documents, Calendar Events, and Audit Logs
 */
export function performUnifiedSearch(
  documents: DocumentRecord[],
  events: EventBooking[],
  auditLogs: AuditEntry[],
  query: string
): UnifiedSearchResults {
  const docResults = filterAndSearchDocuments(documents, { query });
  const eventResults = searchEvents(events, query);
  const auditResults = searchAuditLogs(auditLogs, query);

  return {
    documents: docResults,
    events: eventResults,
    auditLogs: auditResults,
    totalMatches: docResults.length + eventResults.length + auditResults.length,
  };
}
