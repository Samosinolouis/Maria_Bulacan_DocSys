'use client';

/**
 * Service binding hooks - stable method references picked from each contract.
 * Adding a method is a one-line change to the name list.
 */

import { useServices } from './useServices';
import { useServiceMethods } from './useServiceMethods';

export function useSessionServiceMethods() {
  const { session } = useServices();
  return useServiceMethods(session, ['login', 'logout', 'loadSession', 'getSnapshot'] as const);
}

export function useRequestService() {
  const { requests } = useServices();
  return useServiceMethods(requests, [
    'getById',
    'getByControlNo',
    'list',
    'listTypes',
    'encode',
    'screen',
    'resubmit',
  ] as const);
}

export function useDocumentService() {
  const { documents } = useServices();
  return useServiceMethods(documents, [
    'getById',
    'getByControlNo',
    'list',
    'listForDispatch',
    'listByRequest',
    'listTypes',
    'prepare',
    'submitForReview',
    'review',
    'sign',
    'transmit',
    'close',
  ] as const);
}

export function useAttachmentService() {
  const { attachments } = useServices();
  return useServiceMethods(attachments, [
    'listRequestAttachments',
    'listDocumentAttachments',
    'uploadRequestAttachment',
    'uploadDocumentAttachment',
    'getRequestAttachmentDownload',
    'getDocumentAttachmentDownload',
  ] as const);
}

export function useEventService() {
  const { events } = useServices();
  return useServiceMethods(events, [
    'getById',
    'list',
    'listMySchedule',
    'checkConflicts',
    'create',
    'update',
    'cancel',
  ] as const);
}

export function useVenueService() {
  const { venues } = useServices();
  return useServiceMethods(venues, ['getById', 'list', 'create', 'update'] as const);
}

export function useNotificationService() {
  const { notifications } = useServices();
  return useServiceMethods(notifications, [
    'listInbox',
    'unreadCount',
    'markRead',
    'markAllRead',
    'generateEventReminders',
  ] as const);
}

export function useUserService() {
  const { users } = useServices();
  return useServiceMethods(users, [
    'getCurrent',
    'getById',
    'list',
    'create',
    'updateProfile',
    'deactivate',
    'reactivate',
    'assignRole',
    'removeRole',
  ] as const);
}

export function useRoleService() {
  const { roles } = useServices();
  return useServiceMethods(roles, [
    'getById',
    'list',
    'permissionCatalog',
    'create',
    'update',
  ] as const);
}

export function useReportService() {
  const { reports } = useServices();
  return useServiceMethods(reports, [
    'getDashboardMetrics',
    'getCategorySummary',
    'exportSummary',
  ] as const);
}

export function useLookupService() {
  const { lookups } = useServices();
  return useServiceMethods(lookups, [
    'listRequestTypes',
    'listDocumentTypes',
    'listHolidays',
    'createRequestType',
    'createDocumentType',
    'upsertHoliday',
  ] as const);
}

export function useFolderService() {
  const { folders } = useServices();
  return useServiceMethods(folders, ['getById', 'list', 'create'] as const);
}
