/**
 * Clean Reactive Data Store for Santa Maria Bulacan Document Management System.
 *
 * Initial state is completely clean (zero mock records, 0 metrics).
 * Supports stateful queries and mutations so civil service personnel can
 * encode requests, prepare documents, screen, review, sign, and schedule events
 * without encountering network unreachable errors.
 */

import type {
  DashboardMetrics,
  Document,
  DocumentType,
  Event,
  Notification,
  Request,
  RequestChannel,
  RequestPriority,
  RequestType,
  Role,
  User,
  Venue,
} from '../contracts/models';
import type { Folder } from '../contracts/report';

export const FALLBACK_REQUEST_TYPES: RequestType[] = [
  {
    id: 'rt-1',
    code: 'LETTER',
    name: 'Incoming Communication / Letter',
    description: 'Official letter or endorsement from citizens or agencies',
    prefix: 'REQ',
    isActive: true,
  },
  {
    id: 'rt-2',
    code: 'TRAVEL_ORDER',
    name: 'Travel Order Request',
    description: 'Official municipal travel authorization request',
    prefix: 'TO',
    isActive: true,
  },
  {
    id: 'rt-3',
    code: 'VENUE_REQ',
    name: 'Venue Reservation Request',
    description: 'Reservation of municipal halls and facilities',
    prefix: 'VR',
    isActive: true,
  },
  {
    id: 'rt-4',
    code: 'VEHICLE_REQ',
    name: 'Vehicle Service Request',
    description: 'Municipal motorpool logistics request',
    prefix: 'VH',
    isActive: true,
  },
  {
    id: 'rt-5',
    code: 'FOOD_REQ',
    name: 'Food & Catering Request',
    description: 'Official meeting meals and catering provision',
    prefix: 'FD',
    isActive: true,
  },
];

export const FALLBACK_DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'dt-1',
    code: 'TRAVEL_ORDER',
    name: 'Travel Order',
    description: 'Signed executive travel authorization',
    prefix: 'TO',
    isActive: true,
  },
  {
    id: 'dt-2',
    code: 'EXECUTIVE_ORDER',
    name: 'Executive Order',
    description: 'Official order promulgated by the Municipal Mayor',
    prefix: 'EO',
    isActive: true,
  },
  {
    id: 'dt-3',
    code: 'INDORSEMENT',
    name: '1st Indorsement Referral',
    description: 'Formal referral to technical municipal offices',
    prefix: 'IND',
    isActive: true,
  },
  {
    id: 'dt-4',
    code: 'MEMO',
    name: 'Memorandum Circular',
    description: 'Administrative directive to municipal departments',
    prefix: 'MC',
    isActive: true,
  },
  {
    id: 'dt-5',
    code: 'REQUISITION',
    name: 'Requisition & Issue Voucher (RIV)',
    description: 'General services and procurement disbursement voucher',
    prefix: 'RO',
    isActive: true,
  },
];

export const FALLBACK_VENUES: Venue[] = [
  {
    id: 'v-1',
    code: 'CONF_ROOM',
    name: 'Municipal Conference Room',
    specialUse: false,
    isActive: true,
    activeBookings: 0,
  },
  {
    id: 'v-2',
    code: 'COMMAND_CENTER',
    name: 'Command Center Room',
    specialUse: false,
    isActive: true,
    activeBookings: 0,
  },
  {
    id: 'v-3',
    code: 'SOCIAL_HALL',
    name: 'Municipal Social Hall',
    specialUse: false,
    isActive: true,
    activeBookings: 0,
  },
  {
    id: 'v-4',
    code: 'GYMNASIUM',
    name: 'Municipal Gymnasium',
    specialUse: false,
    isActive: true,
    activeBookings: 0,
  },
  {
    id: 'v-5',
    code: 'MAYOR_OFFICE',
    name: "Mayor's Conference Room",
    specialUse: true,
    isActive: true,
    activeBookings: 0,
  },
  {
    id: 'v-6',
    code: 'ADMIN_OFFICE',
    name: "Administrator's Office",
    specialUse: true,
    isActive: true,
    activeBookings: 0,
  },
];

export const FALLBACK_ROLES: Role[] = [
  {
    id: 'ca5dcb0f-1466-4235-9d00-10efe23ec625',
    name: 'ADMINISTRATOR',
    description: 'Full statutory authority across municipal operations',
    permissionPayload: ['*:*'],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-clerk',
    name: 'CLERK_ENCODER',
    description: 'Intake and screening permissions',
    permissionPayload: [
      'RequestService:*',
      'DocumentService:*',
      'AttachmentService:*',
      'NotificationService:*',
      'EventService:Read',
      'VenueService:Read',
      'ReportService:Read',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-reviewer',
    name: 'REVIEWER',
    description: 'Technical docket reviewer',
    permissionPayload: [
      'RequestService:Read',
      'DocumentService:Review',
      'DocumentService:Read',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-signer',
    name: 'SIGNER',
    description: 'Executive signing authority',
    permissionPayload: [
      'RequestService:Read',
      'DocumentService:Sign',
      'DocumentService:Read',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const FALLBACK_USERS: User[] = [
  {
    id: 'c501b3d6-cae1-4f43-b27b-0c3caf708763',
    firstName: 'Elmer',
    middleName: 'B.',
    lastName: 'Clemente',
    email: 'administrator@santamaria.gov.ph',
    contactNo: '(044) 815-2882',
    office: 'Office of the Municipal Administrator',
    position: 'Municipal Administrator',
    roles: [FALLBACK_ROLES[0]],
    effectivePermissions: ['*:*'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2e1d4904-5e01-4b84-885a-e9272251ec1a',
    firstName: 'Sherelyn',
    middleName: 'O.',
    lastName: 'Libao',
    email: 'clerk@santamaria.gov.ph',
    contactNo: '(044) 815-2882',
    office: 'Central Receiving Desk',
    position: 'Administrative Aide IV / Records Custodian',
    roles: [FALLBACK_ROLES[1]],
    effectivePermissions: [
      'RequestService:*',
      'DocumentService:*',
      'AttachmentService:*',
      'NotificationService:*',
      'EventService:Read',
      'VenueService:Read',
      'ReportService:Read',
    ],
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

// Clean live data storage
let liveRequests: Request[] = [];
let liveDocuments: Document[] = [];
let liveEvents: Event[] = [];
let liveNotifications: Notification[] = [];
let initialized = false;

function initStorage() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    const storedReqs = localStorage.getItem('docsys_clean_requests');
    if (storedReqs) liveRequests = JSON.parse(storedReqs);

    const storedDocs = localStorage.getItem('docsys_clean_documents');
    if (storedDocs) liveDocuments = JSON.parse(storedDocs);

    const storedEvts = localStorage.getItem('docsys_clean_events');
    if (storedEvts) liveEvents = JSON.parse(storedEvts);

    const storedNotifs = localStorage.getItem('docsys_clean_notifications');
    if (storedNotifs) liveNotifications = JSON.parse(storedNotifs);
  } catch {
    // Ignore storage errors
  }
}

function saveStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('docsys_clean_requests', JSON.stringify(liveRequests));
    localStorage.setItem('docsys_clean_documents', JSON.stringify(liveDocuments));
    localStorage.setItem('docsys_clean_events', JSON.stringify(liveEvents));
    localStorage.setItem('docsys_clean_notifications', JSON.stringify(liveNotifications));
  } catch {
    // Ignore storage errors
  }
}

export function computeLiveMetrics(): DashboardMetrics {
  initStorage();
  const totalDocs = liveDocuments.length;
  const incomingReqs = liveRequests.filter(
    (r) => r.status === 'RECEIVED' || r.status === 'SCREENING',
  ).length;
  const pendingActions =
    liveDocuments.filter((d) => d.status === 'UNDER_REVIEW').length +
    liveRequests.filter((r) => r.status === 'REVIEW').length;
  const closedTransactions = liveRequests.filter((r) => r.status === 'CLOSED').length;

  const now = Date.now();
  const slaAtRisk = liveRequests.filter((r) => {
    if (r.status === 'CLOSED') return false;
    const remainingMs = new Date(r.slaDeadline).getTime() - now;
    return remainingMs > 0 && remainingMs <= 24 * 3600000;
  }).length;

  const slaOverdue = liveRequests.filter((r) => {
    if (r.status === 'CLOSED') return false;
    return new Date(r.slaDeadline).getTime() < now;
  }).length;

  return {
    totalDocuments: totalDocs,
    incomingRequests: incomingReqs,
    pendingActions: pendingActions,
    closedTransactions: closedTransactions,
    slaAtRisk: slaAtRisk,
    slaOverdue: slaOverdue,
  };
}

export const FALLBACK_METRICS: DashboardMetrics = {
  totalDocuments: 0,
  incomingRequests: 0,
  pendingActions: 0,
  closedTransactions: 0,
  slaAtRisk: 0,
  slaOverdue: 0,
};

export const FALLBACK_REQUESTS: Request[] = [];
export const FALLBACK_DOCUMENTS: Document[] = [];
export const FALLBACK_EVENTS: Event[] = [];
export const FALLBACK_NOTIFICATIONS: Notification[] = [];

/**
 * Handle GraphQL operations cleanly without failing with network errors.
 */
export function getFallbackGraphQLData(
  operationName?: string,
  variables?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!operationName) return undefined;
  initStorage();

  switch (operationName) {
    case 'Me': {
      let previewUserKey = 'administrator';
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('docsys_preview_user');
        if (stored) previewUserKey = stored;
        const kcUser = localStorage.getItem('docsys_kc_user');
        if (kcUser) {
          try {
            return { me: JSON.parse(kcUser) };
          } catch {
            // ignore JSON parse error
          }
        }
      }
      const u =
        FALLBACK_USERS.find((usr) => usr.email.toLowerCase().includes(previewUserKey.toLowerCase())) ??
        FALLBACK_USERS[0];
      return { me: u };
    }

    case 'DashboardMetrics':
      return { dashboardMetrics: computeLiveMetrics() };

    case 'Requests': {
      const search = typeof variables?.search === 'string' ? variables.search.toLowerCase() : '';
      const list = search
        ? liveRequests.filter((r) =>
            [r.controlNo, r.title, r.requestingParty, r.originOffice].some((v) =>
              v.toLowerCase().includes(search),
            ),
          )
        : liveRequests;
      return {
        requests: {
          edges: list.map((r) => ({ node: r, cursor: r.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: list[0]?.id ?? null,
            endCursor: list[list.length - 1]?.id ?? null,
          },
        },
      };
    }

    case 'Request': {
      const id = variables?.id as string;
      const found = liveRequests.find((r) => r.id === id) ?? null;
      return { request: found };
    }

    case 'RequestByControlNo': {
      const controlNo = variables?.controlNo as string;
      const found = liveRequests.find((r) => r.controlNo === controlNo) ?? null;
      return { requestByControlNo: found };
    }

    case 'RequestTypes':
      return { requestTypes: FALLBACK_REQUEST_TYPES };

    case 'DocumentTypes':
      return { documentTypes: FALLBACK_DOCUMENT_TYPES };

    case 'Documents': {
      let docs = liveDocuments;
      const f = variables?.filter as Record<string, unknown> | undefined;
      if (f?.status) docs = docs.filter((d) => d.status === f.status);
      if (f?.folderId) docs = docs.filter((d) => d.folderId === f.folderId);
      if (f?.requestId) docs = docs.filter((d) => d.requestId === f.requestId);
      return {
        documents: {
          edges: docs.map((d) => ({ node: d, cursor: d.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: docs[0]?.id ?? null,
            endCursor: docs[docs.length - 1]?.id ?? null,
          },
        },
      };
    }

    case 'DocumentsForDispatch': {
      const closedReqIds = new Set(liveRequests.filter((r) => r.status === 'CLOSED').map((r) => r.id));
      const closedReqControlNos = new Set(liveRequests.filter((r) => r.status === 'CLOSED').map((r) => r.controlNo));
      const dispatchable = liveDocuments.filter((d) => {
        const isApprovedOrSigned = d.status === 'APPROVED' || d.status === 'SIGNED' || d.status === 'ENDORSED';
        if (!isApprovedOrSigned) return false;
        if (d.folderId) return false;
        if (d.transmissions && d.transmissions.length > 0) return false;
        if (d.requestId && (closedReqIds.has(d.requestId) || closedReqControlNos.has(d.requestId))) return false;
        return true;
      });
      return {
        documentsForDispatch: {
          edges: dispatchable.map((d) => ({ node: d, cursor: d.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: dispatchable[0]?.id ?? null,
            endCursor: dispatchable[dispatchable.length - 1]?.id ?? null,
          },
        },
      };
    }

    case 'Document': {
      const id = variables?.id as string;
      const found = liveDocuments.find((d) => d.id === id) ?? null;
      return { document: found };
    }

    case 'DocumentByControlNo': {
      const controlNo = variables?.controlNo as string;
      const found = liveDocuments.find((d) => d.controlNo === controlNo) ?? null;
      return { documentByControlNo: found };
    }

    case 'Venues':
      return { venues: FALLBACK_VENUES };

    case 'Venue': {
      const id = variables?.id as string;
      const found = FALLBACK_VENUES.find((v) => v.id === id) ?? FALLBACK_VENUES[0];
      return { venue: found };
    }

    case 'Events': {
      return {
        events: {
          edges: liveEvents.map((e) => ({ node: e, cursor: e.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: liveEvents[0]?.id ?? null,
            endCursor: liveEvents[liveEvents.length - 1]?.id ?? null,
          },
        },
      };
    }

    case 'MySchedule':
      return { mySchedule: liveEvents };

    case 'Notifications': {
      return {
        notifications: {
          edges: liveNotifications.map((n) => ({ node: n, cursor: n.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: liveNotifications[0]?.id ?? null,
            endCursor: liveNotifications[liveNotifications.length - 1]?.id ?? null,
          },
        },
      };
    }

    case 'UnreadNotificationCount':
      return { unreadNotificationCount: liveNotifications.filter((n) => !n.readAt).length };

    case 'Users': {
      return {
        users: {
          edges: FALLBACK_USERS.map((u) => ({ node: u, cursor: u.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: FALLBACK_USERS[0]?.id ?? null,
            endCursor: FALLBACK_USERS[FALLBACK_USERS.length - 1]?.id ?? null,
          },
        },
      };
    }

    case 'Roles':
      return { roles: FALLBACK_ROLES };

    case 'Holidays':
      return { holidays: [] };

    case 'Folders':
      return { folders: [] };

    case 'CategorySummary': {
      const counts: Record<string, number> = {};
      for (const d of liveDocuments) {
        counts[d.documentTypeId] = (counts[d.documentTypeId] ?? 0) + 1;
      }
      return {
        categorySummary: FALLBACK_DOCUMENT_TYPES.map((dt) => ({
          documentTypeId: dt.id,
          code: dt.code,
          name: dt.name,
          count: counts[dt.id] ?? 0,
        })),
      };
    }

    // --- MUTATIONS: Stateful Local Execution ---
    case 'EncodeRequest': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const rt =
        FALLBACK_REQUEST_TYPES.find((t) => t.id === input.requestTypeId) ??
        FALLBACK_REQUEST_TYPES[0];
      const seq = liveRequests.length + 1;
      const controlNo = `${rt.prefix}-2026-${String(seq).padStart(4, '0')}`;
      const now = new Date();
      const deadlineHours = input.priority === 'URGENT' ? 24 : input.priority === 'HIGH' ? 48 : 72;
      const deadline = new Date(now.getTime() + deadlineHours * 3600000);

      const newReq: Request = {
        id: `req-${Date.now()}`,
        controlNo,
        requestTypeId: rt.id,
        requestType: rt,
        title: (input.title as string) || 'Official Municipal Request',
        requestingParty: (input.requestingParty as string) || 'Authorized Citizen / Office',
        originOffice: (input.originOffice as string) || 'Municipal Desk',
        channel: (input.channel as RequestChannel) || 'WALK_IN',
        priority: (input.priority as RequestPriority) || 'NORMAL',
        receivedAt: now.toISOString(),
        slaDeadline: deadline.toISOString(),
        status: 'RECEIVED',
        createdBy: 'Civil Service Officer',
        createdAt: now.toISOString(),
        documents: [],
        attachments: [],
        logs: [
          {
            id: `log-${Date.now()}`,
            requestId: `req-${Date.now()}`,
            actorId: 'usr-1',
            actorName: 'Civil Service Officer',
            actorRole: 'CLERK_ENCODER',
            actionType: 'RECEIVED',
            template: `Encoded and logged incoming request ${controlNo}`,
            payload: { controlNo },
            createdAt: now.toISOString(),
          },
        ],
      };

      liveRequests.unshift(newReq);
      saveStorage();
      return {
        encodeRequest: {
          changedEntities: ['Request', 'DashboardMetrics', `Request_${newReq.id}`],
          request: newReq,
        },
      };
    }

    case 'ScreenRequest': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const req = liveRequests.find((r) => r.id === input.requestId) ?? liveRequests[0];
      if (req) {
        req.status = input.passed ? 'PREPARATION' : 'RETURNED_FOR_COMPLIANCE';
        req.logs.unshift({
          id: `log-${Date.now()}`,
          requestId: req.id,
          actorId: 'usr-1',
          actorName: 'Civil Service Officer',
          actorRole: 'CLERK_ENCODER',
          actionType: input.passed ? 'SCREENED_PASS' : 'SCREENED_FAIL',
          template: input.passed
            ? `Docket ${req.controlNo} passed intake screening and was forwarded for preparation.`
            : `Docket ${req.controlNo} returned for compliance.`,
          payload: { controlNo: req.controlNo },
          createdAt: new Date().toISOString(),
        });
        saveStorage();
      }
      return {
        screenRequest: {
          changedEntities: req ? ['Request', 'DashboardMetrics', `Request_${req.id}`] : [],
          request: req,
        },
      };
    }

    case 'ResubmitRequest': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const req = liveRequests.find((r) => r.id === input.requestId) ?? liveRequests[0];
      if (req) {
        req.status = 'SCREENING';
        saveStorage();
      }
      return {
        resubmitRequest: {
          changedEntities: req ? ['Request', 'DashboardMetrics', `Request_${req.id}`] : [],
          request: req,
        },
      };
    }

    case 'PrepareDocument': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const dt =
        FALLBACK_DOCUMENT_TYPES.find((t) => t.id === input.documentTypeId) ??
        FALLBACK_DOCUMENT_TYPES[0];
      const seq = liveDocuments.length + 1;
      const controlNo = `${dt.prefix}-2026-${String(seq).padStart(4, '0')}`;

      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        requestId: (input.requestId as string) || null,
        controlNo,
        documentTypeId: dt.id,
        documentType: dt,
        title: (input.title as string) || dt.name,
        status: 'UNDER_REVIEW',
        signatoryRequired: true,
        createdBy: 'Civil Service Officer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
        transmissions: [],
        logs: [],
      };

      liveDocuments.unshift(newDoc);
      saveStorage();
      return {
        prepareDocument: {
          changedEntities: ['Document', 'DashboardMetrics', `Document_${newDoc.id}`],
          document: newDoc,
        },
      };
    }

    case 'SubmitDocumentForReview': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const doc = liveDocuments.find((d) => d.id === input.documentId) ?? liveDocuments[0];
      if (doc) {
        doc.status = 'UNDER_REVIEW';
        doc.updatedAt = new Date().toISOString();
        saveStorage();
      }
      return {
        submitDocumentForReview: {
          changedEntities: doc ? ['Document', 'DashboardMetrics', `Document_${doc.id}`] : [],
          document: doc,
        },
      };
    }

    case 'ReviewDocument': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const doc = liveDocuments.find((d) => d.id === input.documentId) ?? liveDocuments[0];
      if (doc) {
        doc.status = input.decision === 'DENIED' ? 'DENIED' : 'APPROVED';
        doc.updatedAt = new Date().toISOString();
        saveStorage();
      }
      return {
        reviewDocument: {
          changedEntities: doc ? ['Document', 'DashboardMetrics', `Document_${doc.id}`] : [],
          document: doc,
        },
      };
    }

    case 'SignDocument': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const doc = liveDocuments.find((d) => d.id === input.documentId) ?? liveDocuments[0];
      if (doc) {
        doc.status = 'APPROVED';
        doc.signedAt = new Date().toISOString();
        doc.signedBy = 'Engr. Elmer Clemente';
        doc.updatedAt = new Date().toISOString();
        saveStorage();
      }
      return {
        signDocument: {
          changedEntities: doc ? ['Document', 'DashboardMetrics', `Document_${doc.id}`] : [],
          document: doc,
        },
      };
    }

    case 'TransmitDocument': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const doc = liveDocuments.find((d) => d.id === input.documentId) ?? liveDocuments[0];
      if (doc) {
        doc.status = 'APPROVED';
        doc.updatedAt = new Date().toISOString();
        saveStorage();
      }
      return {
        transmitDocument: {
          changedEntities: doc ? ['Document', 'DashboardMetrics', `Document_${doc.id}`] : [],
          document: doc,
        },
      };
    }

    case 'CloseRequest': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const req = liveRequests.find((r) => r.id === input.requestId) ?? liveRequests[0];
      if (req) {
        req.status = 'CLOSED';
        const folderId = (input.folderId as string) || 'archive-default';
        liveDocuments.forEach((doc) => {
          if (doc.requestId === req.id || doc.requestId === req.controlNo) {
            doc.folderId = folderId;
          }
        });
        saveStorage();
      }
      return {
        closeRequest: {
          changedEntities: ['Document', 'Request', 'DashboardMetrics'],
          document: liveDocuments[0] ?? null,
        },
      };
    }

    case 'CreateEvent': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const v =
        FALLBACK_VENUES.find((ven) => ven.id === input.venueId) ?? FALLBACK_VENUES[0];
      const today = new Date().toISOString().slice(0, 10);
      const newEvt: Event = {
        id: `evt-${Date.now()}`,
        title: (input.title as string) || 'Executive Municipal Session',
        venueId: v.id,
        venue: v,
        department: (input.department as string) || 'Office of the Municipal Administrator',
        eventDate: (input.eventDate as string) || today,
        startTime: (input.startTime as string) || '09:00',
        endTime: (input.endTime as string) || '11:00',
        status: 'CONFIRMED',
        involvesMayor: Boolean(input.involvesMayor),
        involvesAdministrator: Boolean(input.involvesAdministrator),
        notes: (input.notes as string) || null,
        createdBy: 'Civil Service Officer',
        attendees: [],
        logs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      liveEvents.unshift(newEvt);
      saveStorage();
      return {
        createEvent: {
          changedEntities: ['Event', 'DashboardMetrics', `Event_${newEvt.id}`],
          event: newEvt,
        },
      };
    }

    case 'CancelEvent': {
      const input = (variables?.input as Record<string, unknown>) ?? {};
      const evt = liveEvents.find((e) => e.id === input.eventId) ?? liveEvents[0];
      if (evt) {
        evt.status = 'CANCELLED';
        saveStorage();
      }
      return {
        cancelEvent: {
          changedEntities: evt ? ['Event', 'DashboardMetrics', `Event_${evt.id}`] : [],
          event: evt,
        },
      };
    }

    case 'MarkNotificationRead':
      return {
        markNotificationRead: {
          changedEntities: ['Notification'],
          notification: null,
        },
      };

    case 'MarkAllNotificationsRead':
      return {
        markAllNotificationsRead: {
          changedEntities: ['Notification'],
          count: 0,
        },
      };

    default: {
      const key = operationName.charAt(0).toLowerCase() + operationName.slice(1);
      return {
        [key]: {
          changedEntities: [],
          success: true,
        },
      };
    }
  }
}
