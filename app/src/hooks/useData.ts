'use client';

/**
 * Data hooks - one screen concern each: `{ data, isLoading, error, refresh }`.
 * They call services through the binding hooks and never touch GraphQL or the
 * cache. Views compose them into their singular page object.
 */

import { useCallback } from 'react';
import type { ConnectionArgs } from '@/services/contracts/common';
import type { DocumentFilter, } from '@/services/contracts/document';
import type { EventFilter } from '@/services/contracts/event';
import type { RequestFilter } from '@/services/contracts/request';
import type { NotificationFilter } from '@/services/contracts/notification';
import type { RoleFilter, UserFilter } from '@/services/contracts/user';
import type {
  CategorySummaryInput,
} from '@/services/contracts/report';
import type {
  Document,
  DocumentSortField,
  Event,
  EventSortField,
  NotificationSortField,
  Request,
  RequestSortField,
  RoleSortField,
  UserSortField,
  Venue,
  RequestType,
  DocumentType,
  Holiday,
  PermissionCatalogEntry,
} from '@/services/contracts/models';
import { useServiceQuery } from './useServiceQuery';
import {
  useDocumentService,
  useEventService,
  useLookupService,
  useNotificationService,
  useReportService,
  useRequestService,
  useRoleService,
  useUserService,
  useVenueService,
} from './useDomainServices';

const key = (value: unknown) => JSON.stringify(value ?? null);

// --- Requests ---

export function useRequests(args: ConnectionArgs<RequestFilter, RequestSortField> = {}) {
  const { list } = useRequestService();
  const k = key(args);
  return useServiceQuery<Awaited<ReturnType<typeof list>>>(
    useCallback(() => list(JSON.parse(k)), [list, k]),
    [k],
  );
}

export function useRequest(id: string | null) {
  const { getById } = useRequestService();
  return useServiceQuery<Request | null>(
    useCallback(() => (id ? getById(id) : Promise.resolve(null)), [getById, id]),
    [id],
  );
}

// --- Documents ---

export function useDocuments(args: ConnectionArgs<DocumentFilter, DocumentSortField> = {}) {
  const { list } = useDocumentService();
  const k = key(args);
  return useServiceQuery<Awaited<ReturnType<typeof list>>>(
    useCallback(() => list(JSON.parse(k)), [list, k]),
    [k],
  );
}

export function useDocument(id: string | null) {
  const { getById } = useDocumentService();
  return useServiceQuery<Document | null>(
    useCallback(() => (id ? getById(id) : Promise.resolve(null)), [getById, id]),
    [id],
  );
}

/** Documents under executive review (the review desk queue). */
export function useReviewQueue(first = 100) {
  const { list } = useDocumentService();
  return useServiceQuery(
    useCallback(
      () =>
        list({
          first,
          filter: { status: 'UNDER_REVIEW' },
          sort: { field: 'CREATED_AT', direction: 'DESC' },
        }),
      [list, first],
    ),
    [first],
  );
}

/**
 * Documents on the transmission desk, carrying their transmission records so
 * the view can keep only the rows that still await dispatch (FR-26..28).
 */
export function useDispatchQueue(args: ConnectionArgs<DocumentFilter, DocumentSortField>) {
  const { listForDispatch } = useDocumentService();
  const k = key(args);
  return useServiceQuery<Awaited<ReturnType<typeof listForDispatch>>>(
    useCallback(() => listForDispatch(JSON.parse(k)), [listForDispatch, k]),
    [k],
  );
}

// --- Reports ---

export function useDashboardMetrics() {
  const { getDashboardMetrics } = useReportService();
  return useServiceQuery(useCallback(() => getDashboardMetrics(), [getDashboardMetrics]), []);
}

export function useCategorySummary(input: CategorySummaryInput) {
  const { getCategorySummary } = useReportService();
  const k = key(input);
  return useServiceQuery(
    useCallback(() => getCategorySummary(JSON.parse(k)), [getCategorySummary, k]),
    [k],
  );
}

// --- Booking ---

export function useEvents(args: ConnectionArgs<EventFilter, EventSortField> = {}) {
  const { list } = useEventService();
  const k = key(args);
  return useServiceQuery<Awaited<ReturnType<typeof list>>>(
    useCallback(() => list(JSON.parse(k)), [list, k]),
    [k],
  );
}

export function useMySchedule(date?: string) {
  const { listMySchedule } = useEventService();
  return useServiceQuery<Event[]>(
    useCallback(() => listMySchedule(date), [listMySchedule, date]),
    [date],
  );
}

export function useVenues(includeInactive = false) {
  const { list } = useVenueService();
  return useServiceQuery<Venue[]>(
    useCallback(() => list(includeInactive), [list, includeInactive]),
    [includeInactive],
  );
}

// --- Lookups ---

export interface Lookups {
  requestTypes: RequestType[];
  documentTypes: DocumentType[];
  holidays: Holiday[];
}

export function useLookups() {
  const { listRequestTypes, listDocumentTypes, listHolidays } = useLookupService();
  return useServiceQuery<Lookups>(
    useCallback(
      () =>
        Promise.all([listRequestTypes(), listDocumentTypes(), listHolidays()]).then(
          ([requestTypes, documentTypes, holidays]) => ({ requestTypes, documentTypes, holidays }),
        ),
      [listRequestTypes, listDocumentTypes, listHolidays],
    ),
    [],
  );
}

export function useDocumentTypes() {
  const { listDocumentTypes } = useLookupService();
  return useServiceQuery<DocumentType[]>(
    useCallback(() => listDocumentTypes(), [listDocumentTypes]),
    [],
  );
}

// --- Notifications ---

export function useNotifications(args: ConnectionArgs<NotificationFilter, NotificationSortField> = {}) {
  const { listInbox } = useNotificationService();
  const k = key(args);
  return useServiceQuery(
    useCallback(() => listInbox(JSON.parse(k)), [listInbox, k]),
    [k],
  );
}

export function useUnreadNotificationCount() {
  const { unreadCount } = useNotificationService();
  return useServiceQuery<number>(useCallback(() => unreadCount(), [unreadCount]), []);
}

// --- Admin ---

export function useUsers(args: ConnectionArgs<UserFilter, UserSortField> = {}) {
  const { list } = useUserService();
  const k = key(args);
  return useServiceQuery<Awaited<ReturnType<typeof list>>>(
    useCallback(() => list(JSON.parse(k)), [list, k]),
    [k],
  );
}

export function useRoles(args: ConnectionArgs<RoleFilter, RoleSortField> = {}) {
  const { list } = useRoleService();
  const k = key(args);
  return useServiceQuery<Awaited<ReturnType<typeof list>>>(
    useCallback(() => list(JSON.parse(k)), [list, k]),
    [k],
  );
}

export function usePermissionCatalog() {
  const { permissionCatalog } = useRoleService();
  return useServiceQuery<PermissionCatalogEntry[]>(
    useCallback(() => permissionCatalog(), [permissionCatalog]),
    [],
  );
}
