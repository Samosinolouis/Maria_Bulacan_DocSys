'use client';

/**
 * useDocumentTypes - kept as a stable import path. The hook now lives in the
 * data-hook module and returns the standard `{ data, isLoading, error, refresh }`
 * shape (with `data: DocumentType[] | null`).
 */

export { useDocumentTypes } from './useData';

