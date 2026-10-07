'use client';

/**
 * AppProvider - the application-level provider.
 *
 * Layering (per app/docs/ARCHITECTURE.md): services -> hooks -> AppProvider ->
 * React. This provider consumes the data/service hooks (which wrap every service
 * call in AppError normalization) and exposes the global shell state the views
 * and chrome share: identity, lookups, ARTA counters, the global modals, and the
 * workflow mutations.
 *
 * Page-specific lists are NOT held here; views call the data hooks directly
 * (`useRequests`, `useReviewQueue`, `useDocuments`, ...).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAsyncAction, type AsyncActionState } from '@/hooks/useAsyncAction';
import { useAuthorization, useSessionService, useSessionUser } from '@/hooks/useAuthorization';
import { useDashboardMetrics, useLookups } from '@/hooks/useData';
import { useDocumentService, useEventService, useRequestService } from '@/hooks/useDomainServices';
import { useToast } from '@/providers/ToastProvider';
import type { AppErrorShape } from '@/services/contracts/errors';
import type {
  CloseRequestInput,
  PrepareDocumentInput,
  ReviewDocumentInput,
  SignDocumentInput,
  TransmitDocumentInput,
} from '@/services/contracts/document';
import type { CreateEventInput } from '@/services/contracts/event';
import type { EncodeRequestInput, ScreenRequestInput } from '@/services/contracts/request';
import type { SessionUser } from '@/services/contracts/session';
import type {
  DashboardMetrics,
  Document,
  DocumentType,
  Event,
  Request,
  RequestType,
} from '@/services/contracts/models';

/** View-facing identity (mirrors the header/signature blocks). */
export interface AppUser {
  id: string;
  fullName: string;
  role: string;
  title: string;
  department: string;
  email: string;
}

interface AppContextValue {
  // Session
  sessionUser: SessionUser | null;
  currentUser: AppUser;
  permissions: readonly string[];
  roles: readonly string[];
  isAuthenticated: boolean;
  isSessionReady: boolean;
  logout: () => void;

  // Reference data
  requestTypes: RequestType[];
  documentTypes: DocumentType[];

  // ARTA counters (dashboard metrics)
  metrics: DashboardMetrics | null;
  incomingCount: number;
  reviewCount: number;
  overdueCount: number;
  pendingCount: number;
  refreshCounts: () => void;

  // Global modals / selection
  selectedRequest: Request | null;
  setSelectedRequest: (request: Request | null) => void;
  routingSlipRequest: Request | null;
  setRoutingSlipRequest: (request: Request | null) => void;
  wordPreviewRequest: Request | null;
  setWordPreviewRequest: (request: Request | null) => void;
  newIntakeOpen: boolean;
  setNewIntakeOpen: (open: boolean) => void;
  newEventOpen: boolean;
  setNewEventOpen: (open: boolean) => void;

  // Workflow mutations (service-backed, AppError-normalized)
  encodeRequest: (input: EncodeRequestInput) => Promise<Request | null>;
  screenRequest: (input: ScreenRequestInput) => Promise<Request | null>;
  prepareDocument: (input: PrepareDocumentInput) => Promise<Document | null>;
  submitForReview: (documentId: string) => Promise<Document | null>;
  reviewDocument: (input: ReviewDocumentInput) => Promise<Document | null>;
  signDocument: (input: SignDocumentInput) => Promise<Document | null>;
  transmitDocument: (input: TransmitDocumentInput) => Promise<Document | null>;
  closeRequest: (input: CloseRequestInput) => Promise<Document | null>;
  createEvent: (input: CreateEventInput) => Promise<Event | null>;
  cancelEvent: (eventId: string, reason?: string | null) => Promise<Event | null>;

  /** Most recent mutation error (user-safe message), if any. */
  lastError: AppErrorShape | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

/** "UNDER_REVIEW" -> "under review" (for confirmation copy). */
function humanize(value: string): string {
  return value.toLowerCase().replace(/_/g, ' ');
}

function mapUser(me: SessionUser | null): AppUser {
  if (!me) {
    return {
      id: '',
      fullName: 'Unauthenticated',
      role: '',
      title: '',
      department: '',
      email: '',
    };
  }
  return {
    id: me.id,
    fullName: [me.firstName, me.middleName, me.lastName, me.suffix].filter(Boolean).join(' '),
    role: me.roles[0]?.name ?? '',
    title: me.position,
    department: me.office,
    email: me.email,
  };
}

export function AppProvider({
  children,
  sessionReady = true,
}: {
  children: ReactNode;
  sessionReady?: boolean;
}) {
  const sessionService = useSessionService();
  const sessionUser = useSessionUser();
  const { permissions, roles } = useAuthorization();

  const lookups = useLookups();
  const metricsQuery = useDashboardMetrics();

  const { encode, screen } = useRequestService();
  const {
    prepare,
    submitForReview,
    review,
    sign,
    transmit,
    close,
  } = useDocumentService();
  const { create, cancel } = useEventService();

  const encodeAction = useAsyncAction(encode);
  const screenAction = useAsyncAction(screen);
  const prepareAction = useAsyncAction(prepare);
  const submitAction = useAsyncAction(submitForReview);
  const reviewAction = useAsyncAction(review);
  const signAction = useAsyncAction(sign);
  const transmitAction = useAsyncAction(transmit);
  const closeAction = useAsyncAction(close);
  const createEventAction = useAsyncAction(create);
  const cancelEventAction = useAsyncAction(cancel);

  const metrics = metricsQuery.data;
  const refreshCounts = metricsQuery.refresh;
  const toast = useToast();

  /**
   * Run one use-case and report its outcome. On success the ARTA counters are
   * refreshed and a toast confirms what landed; the service has already
   * invalidated the client cache, which is what makes the affected page re-read
   * its data. On failure the toast carries the same message the inline panel
   * shows, so nothing fails silently.
   */
  const runMutation = useCallback(
    async <A extends unknown[], T,>(
      action: AsyncActionState<A, T>,
      args: A,
      describe: (value: T) => string,
      fallback: string,
    ): Promise<T | null> => {
      const result = await action.run(...args);
      if (result) {
        refreshCounts();
        toast.success(describe(result));
        return result;
      }
      toast.error(action.getError()?.message ?? fallback);
      return null;
    },
    [refreshCounts, toast],
  );

  const logout = useCallback(() => {
    void sessionService.logout();
  }, [sessionService]);

  // Global modal / selection state (local UI state; not server-derived).
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [routingSlipRequest, setRoutingSlipRequest] = useState<Request | null>(null);
  const [wordPreviewRequest, setWordPreviewRequest] = useState<Request | null>(null);
  const [newIntakeOpen, setNewIntakeOpen] = useState(false);
  const [newEventOpen, setNewEventOpen] = useState(false);

  const lastError =
    encodeAction.error ??
    screenAction.error ??
    prepareAction.error ??
    submitAction.error ??
    reviewAction.error ??
    signAction.error ??
    transmitAction.error ??
    closeAction.error ??
    createEventAction.error ??
    cancelEventAction.error;

  const value = useMemo<AppContextValue>(
    () => ({
      sessionUser,
      currentUser: mapUser(sessionUser),
      permissions,
      roles,
      isAuthenticated: sessionUser !== null,
      isSessionReady: sessionReady,
      logout,

      requestTypes: lookups.data?.requestTypes ?? [],
      documentTypes: lookups.data?.documentTypes ?? [],

      metrics,
      incomingCount: metrics?.incomingRequests ?? 0,
      reviewCount: metrics?.pendingActions ?? 0,
      overdueCount: metrics?.slaOverdue ?? 0,
      pendingCount: metrics?.pendingActions ?? 0,
      refreshCounts,

      selectedRequest,
      setSelectedRequest,
      routingSlipRequest,
      setRoutingSlipRequest,
      wordPreviewRequest,
      setWordPreviewRequest,
      newIntakeOpen,
      setNewIntakeOpen,
      newEventOpen,
      setNewEventOpen,

      encodeRequest: (input) =>
        runMutation(
          encodeAction,
          [input],
          (request) => `Request ${request.controlNo} encoded and filed for screening.`,
          'Unable to encode the request.',
        ),
      screenRequest: (input) =>
        runMutation(
          screenAction,
          [input],
          (request) =>
            request.status === 'PREPARATION'
              ? `Screening passed for ${request.controlNo}; advanced to document preparation.`
              : `Screening failed for ${request.controlNo}; returned for compliance.`,
          'Unable to record the screening decision.',
        ),
      prepareDocument: (input) =>
        runMutation(
          prepareAction,
          [input],
          (document) => `Draft ${document.controlNo} created and filed to the drafting queue.`,
          'Unable to create the draft.',
        ),
      submitForReview: (id) =>
        runMutation(
          submitAction,
          [id],
          (document) => `Draft ${document.controlNo} submitted to the executive review desk.`,
          'Unable to submit the draft for review.',
        ),
      reviewDocument: (input) =>
        runMutation(
          reviewAction,
          [input],
          (document) => `Document ${document.controlNo} ${humanize(document.status)}.`,
          'Unable to record the review decision.',
        ),
      signDocument: (input) =>
        runMutation(
          signAction,
          [input],
          (document) => `Document ${document.controlNo} signed and ready for transmission.`,
          'Unable to sign the document.',
        ),
      transmitDocument: (input) =>
        runMutation(
          transmitAction,
          [input],
          (document) => {
            const last = document.transmissions?.[document.transmissions.length - 1];
            return `Document ${document.controlNo} transmitted${
              last ? ` to ${last.recipientName}` : ''
            }.`;
          },
          'Unable to record the transmittal.',
        ),
      closeRequest: (input) =>
        runMutation(
          closeAction,
          [input],
          (document) =>
            `Request closed; ${document.controlNo} is archived in the municipal records and read-only.`,
          'Unable to close the request.',
        ),
      createEvent: (input) =>
        runMutation(
          createEventAction,
          [input],
          (event) => `Event "${event.title}" scheduled.`,
          'Unable to schedule the event.',
        ),
      cancelEvent: (id, reason) =>
        runMutation(
          cancelEventAction,
          [id, reason],
          (event) => `Event "${event.title}" cancelled.`,
          'Unable to cancel the event.',
        ),

      lastError,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sessionUser,
      permissions,
      roles,
      sessionReady,
      logout,
      lookups.data,
      metrics,
      refreshCounts,
      lastError,
      selectedRequest,
      routingSlipRequest,
      wordPreviewRequest,
      newIntakeOpen,
      newEventOpen,
      encodeAction.run,
      screenAction.run,
      prepareAction.run,
      submitAction.run,
      reviewAction.run,
      signAction.run,
      transmitAction.run,
      closeAction.run,
      createEventAction.run,
      cancelEventAction.run,
      runMutation,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an <AppProvider>');
  return context;
}
