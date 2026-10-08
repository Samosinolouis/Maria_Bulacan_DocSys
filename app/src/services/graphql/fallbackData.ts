/**
 * Fallback static data for Azure Static Web Apps / offline preview mode.
 * Provides rich, realistic Santa Maria Bulacan municipal dockets, venues,
 * metrics, and notifications so the system can be fully demonstrated even when
 * the local Keycloak container and GraphQL backend are not running.
 */

import type {
  DashboardMetrics,
  Document,
  DocumentType,
  Event,
  Notification,
  Request,
  RequestType,
  Role,
  User,
  Venue,
} from '../contracts/models';

export const FALLBACK_METRICS: DashboardMetrics = {
  totalDocuments: 8,
  incomingRequests: 4,
  pendingActions: 3,
  closedTransactions: 5,
  slaAtRisk: 1,
  slaOverdue: 1,
};

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
    name: 'Memorandum Order',
    description: 'Internal administrative directive',
    prefix: 'MEMO',
    isActive: true,
  },
  {
    id: 'dt-5',
    code: 'REQUISITION',
    name: 'Requisition & Issue Voucher',
    description: 'Procurement and materials release voucher',
    prefix: 'RO',
    isActive: true,
  },
];

export const FALLBACK_VENUES: Venue[] = [
  {
    id: 'v-1',
    code: 'CONFERENCE_ROOM',
    name: 'Municipal Conference Room',
    specialUse: false,
    isActive: true,
    activeBookings: 1,
  },
  {
    id: 'v-2',
    code: 'COMMAND_CENTER',
    name: 'Command Center Room',
    specialUse: false,
    isActive: true,
    activeBookings: 1,
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

const now = new Date();
const isoNow = now.toISOString();
const hourAgo = new Date(now.getTime() - 3600000).toISOString();
const twoHoursAgo = new Date(now.getTime() - 7200000).toISOString();
const tomorrow = new Date(now.getTime() + 86400000).toISOString();
const yesterday = new Date(now.getTime() - 86400000).toISOString();

export const FALLBACK_REQUESTS: Request[] = [
  {
    id: 'req-1',
    controlNo: 'TO-2026-0042',
    requestTypeId: 'rt-2',
    requestType: FALLBACK_REQUEST_TYPES[1],
    title: 'Travel Order: Provincial Disaster Risk Reduction Coordination Conference',
    requestingParty: 'Engr. J. Santos (MDRRMO)',
    originOffice: 'Municipal Disaster Risk Reduction & Management Office',
    channel: 'WALK_IN',
    priority: 'HIGH',
    receivedAt: twoHoursAgo,
    slaDeadline: tomorrow,
    status: 'REVIEW',
    createdBy: 'Sherelyn Libao',
    createdAt: twoHoursAgo,
    documents: [],
    attachments: [],
    logs: [
      {
        id: 'log-1',
        requestId: 'req-1',
        actorId: '2e1d4904-5e01-4b84-885a-e9272251ec1a',
        actorName: 'Sherelyn Libao',
        actorRole: 'CLERK_ENCODER',
        actionType: 'RECEIVED',
        template: 'Encoded and logged incoming request ${payload.controlNo}',
        payload: { controlNo: 'TO-2026-0042' },
        createdAt: twoHoursAgo,
      },
    ],
  },
  {
    id: 'req-2',
    controlNo: 'EO-2026-0018',
    requestTypeId: 'rt-1',
    requestType: FALLBACK_REQUEST_TYPES[0],
    title: 'Executive Order Reconstituting the Local Council for the Protection of Children (LCPC)',
    requestingParty: 'Maria Teresa Cruz (MSWDO)',
    originOffice: 'Municipal Social Welfare and Development Office',
    channel: 'WALK_IN',
    priority: 'URGENT',
    receivedAt: yesterday,
    slaDeadline: yesterday,
    status: 'REVIEW',
    createdBy: 'Sherelyn Libao',
    createdAt: yesterday,
    documents: [],
    attachments: [],
    logs: [
      {
        id: 'log-2',
        requestId: 'req-2',
        actorId: '2e1d4904-5e01-4b84-885a-e9272251ec1a',
        actorName: 'Sherelyn Libao',
        actorRole: 'CLERK_ENCODER',
        actionType: 'SUBMITTED_REVIEW',
        template: 'Docket ${payload.controlNo} forwarded to Municipal Administrator for statutory review.',
        payload: { controlNo: 'EO-2026-0018' },
        createdAt: yesterday,
      },
    ],
  },
  {
    id: 'req-3',
    controlNo: 'IND-2026-0105',
    requestTypeId: 'rt-1',
    requestType: FALLBACK_REQUEST_TYPES[0],
    title: '1st Indorsement Referral: Cadastral Boundary Verification in Barangay Pulong Buhangin',
    requestingParty: 'Atty. Rodrigo Ramos (Legal Office)',
    originOffice: 'Municipal Assessor Office',
    channel: 'WALK_IN',
    priority: 'NORMAL',
    receivedAt: hourAgo,
    slaDeadline: tomorrow,
    status: 'APPROVED',
    createdBy: 'Sherelyn Libao',
    createdAt: hourAgo,
    documents: [],
    attachments: [],
    logs: [],
  },
  {
    id: 'req-4',
    controlNo: 'REQ-2026-0210',
    requestTypeId: 'rt-1',
    requestType: FALLBACK_REQUEST_TYPES[0],
    title: 'Citizen Petition: Installation of LED Street Illumination along Barangay Catmon',
    requestingParty: 'Kap. Juanito Perez',
    originOffice: 'Liga ng mga Barangay',
    channel: 'WALK_IN',
    priority: 'NORMAL',
    receivedAt: isoNow,
    slaDeadline: tomorrow,
    status: 'RECEIVED',
    createdBy: 'Sherelyn Libao',
    createdAt: isoNow,
    documents: [],
    attachments: [],
    logs: [],
  },
  {
    id: 'req-5',
    controlNo: 'RO-2026-0089',
    requestTypeId: 'rt-1',
    requestType: FALLBACK_REQUEST_TYPES[0],
    title: 'Requisition & Issue Voucher: Procurement of Evacuation Tents and Emergency Radios',
    requestingParty: 'General Services Office',
    originOffice: 'General Services Office',
    channel: 'WALK_IN',
    priority: 'HIGH',
    receivedAt: yesterday,
    slaDeadline: tomorrow,
    status: 'TRANSMITTED',
    createdBy: 'Sherelyn Libao',
    createdAt: yesterday,
    documents: [],
    attachments: [],
    logs: [],
  },
];

export const FALLBACK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    requestId: 'req-1',
    controlNo: 'TO-2026-0042',
    documentTypeId: 'dt-1',
    documentType: FALLBACK_DOCUMENT_TYPES[0],
    title: 'Travel Order: Provincial Disaster Risk Reduction Coordination Conference',
    status: 'UNDER_REVIEW',
    signatoryRequired: true,
    createdBy: 'Sherelyn Libao',
    createdAt: twoHoursAgo,
    updatedAt: twoHoursAgo,
    attachments: [],
    transmissions: [],
    logs: [],
  },
  {
    id: 'doc-2',
    requestId: 'req-2',
    controlNo: 'EO-2026-0018',
    documentTypeId: 'dt-2',
    documentType: FALLBACK_DOCUMENT_TYPES[1],
    title: 'Executive Order Reconstituting the Local Council for the Protection of Children (LCPC)',
    status: 'UNDER_REVIEW',
    signatoryRequired: true,
    createdBy: 'Sherelyn Libao',
    createdAt: yesterday,
    updatedAt: yesterday,
    attachments: [],
    transmissions: [],
    logs: [],
  },
  {
    id: 'doc-3',
    requestId: 'req-3',
    controlNo: 'IND-2026-0105',
    documentTypeId: 'dt-3',
    documentType: FALLBACK_DOCUMENT_TYPES[2],
    title: '1st Indorsement Referral: Cadastral Boundary Verification in Barangay Pulong Buhangin',
    status: 'APPROVED',
    signatoryRequired: true,
    signedBy: 'Elmer B. Clemente',
    signedAt: hourAgo,
    createdBy: 'Sherelyn Libao',
    createdAt: hourAgo,
    updatedAt: hourAgo,
    attachments: [],
    transmissions: [],
    logs: [],
  },
];

export const FALLBACK_EVENTS: Event[] = [
  {
    id: 'evt-1',
    venueId: 'v-2',
    venue: FALLBACK_VENUES[1],
    title: 'MDRRMO Quarterly Disaster Preparedness Briefing',
    department: 'MDRRMO',
    eventDate: now.toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '12:00',
    status: 'CONFIRMED',
    involvesMayor: false,
    involvesAdministrator: true,
    createdBy: 'Sherelyn Libao',
    createdAt: yesterday,
    updatedAt: yesterday,
    attendees: [],
    logs: [],
  },
  {
    id: 'evt-2',
    venueId: 'v-1',
    venue: FALLBACK_VENUES[0],
    title: 'Local Finance Committee Budget Hearing',
    department: 'Office of the Municipal Administrator',
    eventDate: now.toISOString().slice(0, 10),
    startTime: '14:00',
    endTime: '16:30',
    status: 'CONFIRMED',
    involvesMayor: true,
    involvesAdministrator: true,
    createdBy: 'Sherelyn Libao',
    createdAt: yesterday,
    updatedAt: yesterday,
    attendees: [],
    logs: [],
  },
];

export const FALLBACK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'c501b3d6-cae1-4f43-b27b-0c3caf708763',
    type: 'SLA_OVERDUE',
    title: 'SLA Alert: EO-2026-0018 Overdue',
    template: 'Executive Order docket ${payload.controlNo} has exceeded the 72-hour ARTA turnaround window.',
    payload: { controlNo: 'EO-2026-0018' },
    requestId: 'req-2',
    readAt: null,
    createdAt: hourAgo,
  },
  {
    id: 'notif-2',
    userId: 'c501b3d6-cae1-4f43-b27b-0c3caf708763',
    type: 'SUBMITTED_FOR_REVIEW',
    title: 'New Docket Submitted for Review: TO-2026-0042',
    template: 'Travel order request from MDRRMO was submitted for executive endorsement.',
    payload: { controlNo: 'TO-2026-0042' },
    requestId: 'req-1',
    readAt: null,
    createdAt: twoHoursAgo,
  },
  {
    id: 'notif-3',
    userId: 'c501b3d6-cae1-4f43-b27b-0c3caf708763',
    type: 'EVENT_REMINDER',
    title: 'Venue Booking Reminder: Local Finance Committee',
    template: 'Scheduled today at 2:00 PM in the Municipal Conference Room.',
    payload: { venue: 'Municipal Conference Room' },
    eventId: 'evt-2',
    readAt: null,
    createdAt: hourAgo,
  },
  {
    id: 'notif-4',
    userId: 'c501b3d6-cae1-4f43-b27b-0c3caf708763',
    type: 'DECISION_RECORDED',
    title: 'Transmittal Stamped: RO-2026-0089',
    template: 'Requisition voucher successfully transmitted to General Services Office.',
    payload: { controlNo: 'RO-2026-0089' },
    requestId: 'req-5',
    readAt: null,
    createdAt: yesterday,
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
    isActive: true,
    createdAt: yesterday,
    updatedAt: yesterday,
    roles: [
      {
        id: 'ca5dcb0f-1466-4235-9d00-10efe23ec625',
        name: 'ADMINISTRATOR',
        description: 'Full statutory authority across municipal operations',
        permissionPayload: ['*:*'],
        createdAt: yesterday,
      },
    ],
    effectivePermissions: ['*:*'],
  },
  {
    id: '2e1d4904-5e01-4b84-885a-e9272251ec1a',
    firstName: 'Sherelyn',
    middleName: 'O.',
    lastName: 'Libao',
    email: 'clerk@santamaria.gov.ph',
    contactNo: '(044) 815-2882',
    office: 'Central Receiving Desk',
    position: 'Administrative Aide IV (Records Custodian)',
    isActive: true,
    createdAt: yesterday,
    updatedAt: yesterday,
    roles: [
      {
        id: 'ca001709-b5a2-4ce5-8b1b-b724018a9585',
        name: 'CLERK_ENCODER',
        description: 'Intake and screening permissions',
        permissionPayload: ['RequestService:*', 'DocumentService:*'],
        createdAt: yesterday,
      },
    ],
    effectivePermissions: ['RequestService:*', 'DocumentService:*'],
  },
];

export const FALLBACK_ROLES: Role[] = [
  {
    id: 'ca5dcb0f-1466-4235-9d00-10efe23ec625',
    name: 'ADMINISTRATOR',
    description: 'Full statutory authority across municipal docket lifecycle and personnel records.',
    permissionPayload: ['*:*'],
    createdAt: yesterday,
  },
  {
    id: 'ca001709-b5a2-4ce5-8b1b-b724018a9585',
    name: 'CLERK_ENCODER',
    description: 'Docket intake, document scanning, annex verification, and transmittal.',
    permissionPayload: ['RequestService:*', 'DocumentService:*', 'AttachmentService:*'],
    createdAt: yesterday,
  },
];

/**
 * Returns mock GraphQL response data when the backend network request fails.
 */
export function getFallbackGraphQLData(
  operationName?: string,
  variables?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!operationName) return undefined;

  switch (operationName) {
    case 'DashboardMetrics':
      return { dashboardMetrics: FALLBACK_METRICS };

    case 'Requests': {
      const search = typeof variables?.search === 'string' ? variables.search.toLowerCase() : '';
      const list = search
        ? FALLBACK_REQUESTS.filter((r) =>
            [r.controlNo, r.title, r.requestingParty, r.originOffice].some((v) =>
              v.toLowerCase().includes(search),
            ),
          )
        : FALLBACK_REQUESTS;
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
      const found = FALLBACK_REQUESTS.find((r) => r.id === id) ?? FALLBACK_REQUESTS[0];
      return { request: found };
    }

    case 'RequestByControlNo': {
      const controlNo = variables?.controlNo as string;
      const found = FALLBACK_REQUESTS.find((r) => r.controlNo === controlNo) ?? FALLBACK_REQUESTS[0];
      return { requestByControlNo: found };
    }

    case 'RequestTypes':
      return { requestTypes: FALLBACK_REQUEST_TYPES };

    case 'DocumentTypes':
      return { documentTypes: FALLBACK_DOCUMENT_TYPES };

    case 'Documents': {
      return {
        documents: {
          edges: FALLBACK_DOCUMENTS.map((d) => ({ node: d, cursor: d.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: FALLBACK_DOCUMENTS[0]?.id ?? null,
            endCursor: FALLBACK_DOCUMENTS[FALLBACK_DOCUMENTS.length - 1]?.id ?? null,
          },
        },
      };
    }

    case 'Document': {
      const id = variables?.id as string;
      const found = FALLBACK_DOCUMENTS.find((d) => d.id === id) ?? FALLBACK_DOCUMENTS[0];
      return { document: found };
    }

    case 'DocumentByControlNo': {
      const controlNo = variables?.controlNo as string;
      const found = FALLBACK_DOCUMENTS.find((d) => d.controlNo === controlNo) ?? FALLBACK_DOCUMENTS[0];
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
          edges: FALLBACK_EVENTS.map((e) => ({ node: e, cursor: e.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: FALLBACK_EVENTS[0]?.id ?? null,
            endCursor: FALLBACK_EVENTS[FALLBACK_EVENTS.length - 1]?.id ?? null,
          },
        },
      };
    }

    case 'MySchedule':
      return { mySchedule: FALLBACK_EVENTS };

    case 'Notifications': {
      return {
        notifications: {
          edges: FALLBACK_NOTIFICATIONS.map((n) => ({ node: n, cursor: n.id })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: FALLBACK_NOTIFICATIONS[0]?.id ?? null,
            endCursor: FALLBACK_NOTIFICATIONS[FALLBACK_NOTIFICATIONS.length - 1]?.id ?? null,
          },
        },
      };
    }

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

    case 'UnreadNotificationCount':
      return { unreadNotificationCount: 4 };

    case 'Roles':
      return { roles: FALLBACK_ROLES };

    case 'Holidays':
      return { holidays: [] };

    case 'Folders':
      return { folders: [] };

    case 'CategorySummary':
      return {
        categorySummary: [
          { documentTypeId: 'dt-1', code: 'TO', name: 'Travel Orders', count: 3 },
          { documentTypeId: 'dt-2', code: 'EO', name: 'Executive Orders', count: 2 },
          { documentTypeId: 'dt-3', code: 'IND', name: '1st Indorsements', count: 2 },
          { documentTypeId: 'dt-5', code: 'RO', name: 'Requisitions', count: 1 },
        ],
      };

    default:
      return undefined;
  }
}
