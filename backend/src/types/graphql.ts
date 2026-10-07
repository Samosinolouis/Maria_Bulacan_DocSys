export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** An ISO-8601 date-time string (stored/rendered in Philippine Standard Time, UTC+8). */
  DateTime: { input: Date; output: Date; }
  /** An arbitrary JSON value (object or array). */
  JSON: { input: unknown; output: unknown; }
  /** A UUID string. */
  UUID: { input: string; output: string; }
};

export type ActivityLog = Node & {
  __typename?: 'ActivityLog';
  actionType: ActivityLogAction;
  actorId: Scalars['ID']['output'];
  actorName: Scalars['String']['output'];
  actorRole: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  eventId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  template: Scalars['String']['output'];
};

export type ActivityLogAction =
  | 'EVENT_CANCELLED'
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED';

export type AssignRoleInput = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** A detected scheduling conflict (FR-42). */
export type BookingConflict = {
  __typename?: 'BookingConflict';
  conflictingEventIds: Array<Scalars['ID']['output']>;
  kind: BookingConflictKind;
  message: Scalars['String']['output'];
};

export type BookingConflictKind =
  | 'ADMINISTRATOR'
  | 'ATTENDEE'
  | 'MAYOR'
  | 'VENUE';

export type CategorySummaryInput = {
  /** Required when period = MONTHLY (1-12). */
  month?: InputMaybe<Scalars['Int']['input']>;
  period: ReportPeriod;
  year: Scalars['Int']['input'];
};

export type CategorySummaryRow = {
  __typename?: 'CategorySummaryRow';
  code: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  documentTypeId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type CloseRequestInput = {
  /** SIGNED_FINAL attachment id - required before closing (FR-29). */
  finalAttachmentId?: InputMaybe<Scalars['ID']['input']>;
  /** Optional archive folder; every document of the request is filed into it. */
  folderId?: InputMaybe<Scalars['ID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  requestId: Scalars['ID']['input'];
};

export type CreateDocumentTypeInput = {
  code: Scalars['String']['input'];
  description: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  prefix: Scalars['String']['input'];
};

export type CreateEventInput = {
  attendeeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  department: Scalars['String']['input'];
  endTime: Scalars['String']['input'];
  /** YYYY-MM-DD. */
  eventDate: Scalars['String']['input'];
  involvesAdministrator?: InputMaybe<Scalars['Boolean']['input']>;
  involvesMayor?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  organizerId?: InputMaybe<Scalars['ID']['input']>;
  /** HH:MM(:SS). */
  startTime: Scalars['String']['input'];
  status?: InputMaybe<EventStatus>;
  title: Scalars['String']['input'];
  venueId: Scalars['ID']['input'];
};

export type CreateFolderInput = {
  name: Scalars['String']['input'];
  /** Omit for a root-level folder. */
  parentId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateRequestTypeInput = {
  code: Scalars['String']['input'];
  description: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  prefix: Scalars['String']['input'];
};

export type CreateRoleInput = {
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  /** Permission strings; validated against ^[\\w*]+:[\\w*]+$ (NFR-21). */
  permissionPayload: Array<Scalars['String']['input']>;
};

export type CreateUserInput = {
  contactNo: Scalars['String']['input'];
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  office: Scalars['String']['input'];
  position: Scalars['String']['input'];
  /** Realm roles granted at provisioning time; each id must already exist. */
  roleIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  suffix?: InputMaybe<Scalars['String']['input']>;
  /**
   * Optional one-time credential. Keycloak stores it as a temporary password, so
   * the holder is forced to replace it at first sign-in; it is never persisted by
   * this application (NFR-05).
   */
  temporaryPassword?: InputMaybe<Scalars['String']['input']>;
};

export type CreateVenueInput = {
  /** Short uppercase code, unique. Not editable afterwards. */
  code: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  specialUse?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DashboardMetrics = {
  __typename?: 'DashboardMetrics';
  closedTransactions: Scalars['Int']['output'];
  incomingRequests: Scalars['Int']['output'];
  pendingActions: Scalars['Int']['output'];
  slaAtRisk: Scalars['Int']['output'];
  slaOverdue: Scalars['Int']['output'];
  totalDocuments: Scalars['Int']['output'];
};

export type Document = Node & {
  __typename?: 'Document';
  assignedTo?: Maybe<Scalars['ID']['output']>;
  attachments: Array<DocumentAttachment>;
  controlNo: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['ID']['output'];
  decidedAt?: Maybe<Scalars['DateTime']['output']>;
  decidedBy?: Maybe<Scalars['ID']['output']>;
  decisionNotes?: Maybe<Scalars['String']['output']>;
  /** Mandatory written grounds when DENIED. */
  denialReason?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<DocumentType>;
  documentTypeId: Scalars['ID']['output'];
  /** Archive folder - set when the request is closed and filed. */
  folderId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  logs: Array<DocumentLog>;
  /** NULL = issued without a request (sua sponte EO / MO). */
  requestId?: Maybe<Scalars['ID']['output']>;
  signatoryRequired: Scalars['Boolean']['output'];
  signedAt?: Maybe<Scalars['DateTime']['output']>;
  signedBy?: Maybe<Scalars['ID']['output']>;
  status: DocumentStatus;
  title: Scalars['String']['output'];
  transmissions: Array<Transmission>;
  updatedAt: Scalars['DateTime']['output'];
};

export type DocumentAttachment = Node & {
  __typename?: 'DocumentAttachment';
  bucketName: Scalars['String']['output'];
  checksum: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  documentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  kind: DocumentAttachmentKind;
  mimeType: Scalars['String']['output'];
  originalName: Scalars['String']['output'];
  sizeBytes: Scalars['Int']['output'];
  uploadedBy: Scalars['ID']['output'];
};

export type DocumentAttachmentKind =
  | 'DRAFT'
  | 'SIGNED_FINAL'
  | 'TRANSMISSION_PROOF';

export type DocumentConnection = {
  __typename?: 'DocumentConnection';
  edges: Array<DocumentEdge>;
  pageInfo: PageInfo;
};

export type DocumentEdge = {
  __typename?: 'DocumentEdge';
  cursor: Scalars['String']['output'];
  node: Document;
};

export type DocumentFilterInput = {
  assignedTo?: InputMaybe<Scalars['ID']['input']>;
  documentTypeId?: InputMaybe<Scalars['ID']['input']>;
  /** Documents filed into an archive folder. */
  folderId?: InputMaybe<Scalars['ID']['input']>;
  requestId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<DocumentStatus>;
};

export type DocumentLog = Node & {
  __typename?: 'DocumentLog';
  actionType: DocumentLogAction;
  actorId: Scalars['ID']['output'];
  /** SNAPSHOT - survives renames. */
  actorName: Scalars['String']['output'];
  /** SNAPSHOT. */
  actorRole: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  documentId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  requestId?: Maybe<Scalars['ID']['output']>;
  template: Scalars['String']['output'];
};

export type DocumentLogAction =
  | 'APPROVED'
  | 'ASSIGNED'
  | 'CLOSED'
  | 'DENIED'
  | 'DRAFTED'
  | 'ENDORSED'
  | 'RECEIVED'
  | 'REOPENED'
  | 'RESUBMITTED'
  | 'RETURNED_FOR_COMPLIANCE'
  | 'SCREENED_FAIL'
  | 'SCREENED_PASS'
  | 'SIGNED'
  | 'SUBMITTED_REVIEW'
  | 'TRANSMITTED';

export type DocumentMutationPayload = {
  __typename?: 'DocumentMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  document: Document;
};

export type DocumentSortField =
  | 'CONTROL_NO'
  | 'CREATED_AT'
  | 'STATUS'
  | 'TITLE';

export type DocumentSortInput = {
  direction?: InputMaybe<SortDirection>;
  field: DocumentSortField;
};

export type DocumentStatus =
  | 'APPROVED'
  | 'DENIED'
  | 'DRAFTING'
  | 'ENDORSED'
  | 'SIGNED'
  | 'UNDER_REVIEW';

export type DocumentType = Node & {
  __typename?: 'DocumentType';
  code: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  prefix: Scalars['String']['output'];
};

export type DocumentTypeMutationPayload = {
  __typename?: 'DocumentTypeMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  documentType: DocumentType;
};

/** A short-lived presigned download descriptor (NFR-06). */
export type DownloadTicket = {
  __typename?: 'DownloadTicket';
  expiresInSeconds: Scalars['Int']['output'];
  fileName: Scalars['String']['output'];
  mimeType: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

/** Presigned downloads change nothing; the list is always empty. */
export type DownloadTicketMutationPayload = {
  __typename?: 'DownloadTicketMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  ticket: DownloadTicket;
};

export type EncodeRequestInput = {
  channel: RequestChannel;
  originOffice: Scalars['String']['input'];
  priority?: InputMaybe<RequestPriority>;
  receivedAt?: InputMaybe<Scalars['DateTime']['input']>;
  requestTypeId: Scalars['ID']['input'];
  requestingParty: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type Event = Node & {
  __typename?: 'Event';
  /** Required attendees (users) and their display names. */
  attendees: Array<EventAttendee>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['ID']['output'];
  department: Scalars['String']['output'];
  endTime: Scalars['String']['output'];
  eventDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  involvesAdministrator: Scalars['Boolean']['output'];
  /** Mayor double-booking check without a Mayor user account. */
  involvesMayor: Scalars['Boolean']['output'];
  logs: Array<ActivityLog>;
  notes?: Maybe<Scalars['String']['output']>;
  organizerId?: Maybe<Scalars['ID']['output']>;
  startTime: Scalars['String']['output'];
  status: EventStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  venue?: Maybe<Venue>;
  venueId: Scalars['ID']['output'];
};

export type EventAttendee = {
  __typename?: 'EventAttendee';
  name: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type EventConnection = {
  __typename?: 'EventConnection';
  edges: Array<EventEdge>;
  pageInfo: PageInfo;
};

export type EventEdge = {
  __typename?: 'EventEdge';
  cursor: Scalars['String']['output'];
  node: Event;
};

export type EventFilterInput = {
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  department?: InputMaybe<Scalars['String']['input']>;
  involvesAdministrator?: InputMaybe<Scalars['Boolean']['input']>;
  involvesMayor?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<EventStatus>;
  venueId?: InputMaybe<Scalars['ID']['input']>;
};

export type EventMutationPayload = {
  __typename?: 'EventMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  event: Event;
};

export type EventSortField =
  | 'CREATED_AT'
  | 'EVENT_DATE'
  | 'START_TIME'
  | 'TITLE';

export type EventSortInput = {
  direction?: InputMaybe<SortDirection>;
  field: EventSortField;
};

export type EventStatus =
  | 'CANCELLED'
  | 'CONFIRMED'
  | 'TENTATIVE';

export type ExportReportInput = {
  format: ReportFormat;
  month?: InputMaybe<Scalars['Int']['input']>;
  period: ReportPeriod;
  year: Scalars['Int']['input'];
};

export type Folder = Node & {
  __typename?: 'Folder';
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  /** Direct children at one level: subfolders + documents. */
  itemCount: Scalars['Int']['output'];
  /** Unique among siblings; never contains "/". */
  name: Scalars['String']['output'];
  /** NULL = root-level folder. */
  parentId?: Maybe<Scalars['ID']['output']>;
  /** Denormalized "/"-separated path, e.g. "2026/Executive Orders". */
  path: Scalars['String']['output'];
};

export type FolderMutationPayload = {
  __typename?: 'FolderMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  folder: Folder;
};

export type Holiday = Node & {
  __typename?: 'Holiday';
  /** YYYY-MM-DD. */
  holidayDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type HolidayMutationPayload = {
  __typename?: 'HolidayMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  holiday: Holiday;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Placeholder to keep the Mutation type valid before domains extend it. */
  _noop?: Maybe<Scalars['Boolean']['output']>;
  /** Role assignment records who granted the role and when (FR-04). */
  assignRole: UserMutationPayload;
  /** Cancellation is a status change, never a delete. */
  cancelEvent: EventMutationPayload;
  closeRequest: DocumentMutationPayload;
  createDocumentType: DocumentTypeMutationPayload;
  createEvent: EventMutationPayload;
  /** Create a folder; the path is derived from the parent's path + name. */
  createFolder: FolderMutationPayload;
  createRequestType: RequestTypeMutationPayload;
  createRole: RoleMutationPayload;
  /**
   * Provision a new plantilla account in the identity provider and mirror it as a
   * shadow user. Action: UserService:Create (FR-01, FR-02).
   */
  createUser: UserMutationPayload;
  createVenue: VenueMutationPayload;
  /** Soft deactivation - users are never deleted (FR-03). */
  deactivateUser: UserMutationPayload;
  /** Get a short-lived presigned URL for a document attachment (FR-34). */
  documentAttachmentDownload: DownloadTicketMutationPayload;
  /** Encode an incoming request; issues a control number + RECEIVED log. */
  encodeRequest: RequestMutationPayload;
  /** Export a summary to PDF or Excel (FR-37). */
  exportSummary: ReportArtifactMutationPayload;
  markAllNotificationsRead: NotificationBulkPayload;
  markNotificationRead: NotificationMutationPayload;
  prepareDocument: DocumentMutationPayload;
  reactivateUser: UserMutationPayload;
  removeRole: UserMutationPayload;
  /**
   * Get a short-lived presigned URL for a request attachment (FR-34).
   * NOTE: the actual upload is multipart and handled by the REST routes
   * (POST /uploads/requests/:id, POST /uploads/documents/:id), not GraphQL.
   */
  requestAttachmentDownload: DownloadTicketMutationPayload;
  /** Resubmit a returned request back into screening (FR-14). */
  resubmitRequest: RequestMutationPayload;
  reviewDocument: DocumentMutationPayload;
  /** Record a screening decision (pass -> PREPARATION; fail -> RETURNED_FOR_COMPLIANCE). */
  screenRequest: RequestMutationPayload;
  signDocument: DocumentMutationPayload;
  submitDocumentForReview: DocumentMutationPayload;
  transmitDocument: DocumentMutationPayload;
  updateEvent: EventMutationPayload;
  updateRole: RoleMutationPayload;
  /**
   * Update a profile. The account holder may always edit their own record;
   * editing somebody else's requires UserService:Update (FR-03).
   */
  updateUserProfile: UserMutationPayload;
  updateVenue: VenueMutationPayload;
  upsertHoliday: HolidayMutationPayload;
};


export type MutationAssignRoleArgs = {
  input: AssignRoleInput;
};


export type MutationCancelEventArgs = {
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCloseRequestArgs = {
  input: CloseRequestInput;
};


export type MutationCreateDocumentTypeArgs = {
  input: CreateDocumentTypeInput;
};


export type MutationCreateEventArgs = {
  input: CreateEventInput;
};


export type MutationCreateFolderArgs = {
  input: CreateFolderInput;
};


export type MutationCreateRequestTypeArgs = {
  input: CreateRequestTypeInput;
};


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationCreateVenueArgs = {
  input: CreateVenueInput;
};


export type MutationDeactivateUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDocumentAttachmentDownloadArgs = {
  id: Scalars['ID']['input'];
  inline?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationEncodeRequestArgs = {
  input: EncodeRequestInput;
};


export type MutationExportSummaryArgs = {
  input: ExportReportInput;
};


export type MutationMarkNotificationReadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationPrepareDocumentArgs = {
  input: PrepareDocumentInput;
};


export type MutationReactivateUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveRoleArgs = {
  input: RemoveRoleInput;
};


export type MutationRequestAttachmentDownloadArgs = {
  id: Scalars['ID']['input'];
  inline?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationResubmitRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationReviewDocumentArgs = {
  input: ReviewDocumentInput;
};


export type MutationScreenRequestArgs = {
  input: ScreenRequestInput;
};


export type MutationSignDocumentArgs = {
  input: SignDocumentInput;
};


export type MutationSubmitDocumentForReviewArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTransmitDocumentArgs = {
  input: TransmitDocumentInput;
};


export type MutationUpdateEventArgs = {
  input: UpdateEventInput;
};


export type MutationUpdateRoleArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRoleInput;
};


export type MutationUpdateUserProfileArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserProfileInput;
};


export type MutationUpdateVenueArgs = {
  input: UpdateVenueInput;
};


export type MutationUpsertHolidayArgs = {
  input: UpsertHolidayInput;
};

/** An object with a globally unique ID. */
export type Node = {
  id: Scalars['ID']['output'];
};

export type Notification = Node & {
  __typename?: 'Notification';
  createdAt: Scalars['DateTime']['output'];
  documentId?: Maybe<Scalars['ID']['output']>;
  eventId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  /** NULL = unread. */
  readAt?: Maybe<Scalars['DateTime']['output']>;
  /** Deep-link source entity (nullable-trio). */
  requestId?: Maybe<Scalars['ID']['output']>;
  template: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: NotificationType;
  userId: Scalars['ID']['output'];
};

/** markAllNotificationsRead: `count` is how many rows were marked read. */
export type NotificationBulkPayload = {
  __typename?: 'NotificationBulkPayload';
  changedEntities: Array<Scalars['String']['output']>;
  count: Scalars['Int']['output'];
};

export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  edges: Array<NotificationEdge>;
  pageInfo: PageInfo;
};

export type NotificationEdge = {
  __typename?: 'NotificationEdge';
  cursor: Scalars['String']['output'];
  node: Notification;
};

export type NotificationFilterInput = {
  type?: InputMaybe<NotificationType>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

/** markNotificationRead: null when the notification does not exist. */
export type NotificationMutationPayload = {
  __typename?: 'NotificationMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  notification?: Maybe<Notification>;
};

export type NotificationSortField =
  | 'CREATED_AT';

export type NotificationSortInput = {
  direction?: InputMaybe<SortDirection>;
  field: NotificationSortField;
};

export type NotificationType =
  | 'DECISION_RECORDED'
  | 'EVENT_CANCELLED'
  | 'EVENT_REMINDER'
  | 'EVENT_UPDATED'
  | 'SLA_AT_RISK'
  | 'SLA_OVERDUE'
  | 'SUBMITTED_FOR_REVIEW';

/** Cursor-based pagination metadata (Relay-style). */
export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
  totalCount: Scalars['Int']['output'];
};

export type PermissionCatalogEntry = {
  __typename?: 'PermissionCatalogEntry';
  actions: Array<Scalars['String']['output']>;
  service: Scalars['String']['output'];
};

export type PrepareDocumentInput = {
  assignedTo?: InputMaybe<Scalars['ID']['input']>;
  documentTypeId: Scalars['ID']['input'];
  /** Omit for a standalone issuance (EO / MO). */
  requestId?: InputMaybe<Scalars['ID']['input']>;
  signatoryRequired?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Liveness probe - always returns "ok". */
  _health: Scalars['String']['output'];
  /** Monthly / annual per-category counts (FR-36). */
  categorySummary: Array<CategorySummaryRow>;
  /** Dry-run conflict detection for a proposed slot (FR-42). */
  checkEventConflicts: Array<BookingConflict>;
  /** Workload + SLA snapshot for the dashboard (FR-35). */
  dashboardMetrics: DashboardMetrics;
  document?: Maybe<Document>;
  documentAttachments: Array<DocumentAttachment>;
  documentByControlNo?: Maybe<Document>;
  documentTypes: Array<DocumentType>;
  documents: DocumentConnection;
  event?: Maybe<Event>;
  events: EventConnection;
  folder?: Maybe<Folder>;
  /** Direct subfolders of a folder; omit parentId to list root folders. */
  folders: Array<Folder>;
  /** Idempotently materialize EVENT_REMINDER rows for the next 24-48h (FR-45). */
  generateEventReminders: Scalars['Int']['output'];
  /** Holidays within a window - feeds SLA computation (FR-09). */
  holidays: Array<Holiday>;
  /** The authenticated user's shadow record. */
  me?: Maybe<User>;
  /** The authenticated user's schedule (FR-44). */
  mySchedule: Array<Event>;
  /** The authenticated user's inbox, newest-first (FR-48). */
  notifications: NotificationConnection;
  /** The static permission catalog defined in code (NFR-21). */
  permissionCatalog: Array<PermissionCatalogEntry>;
  request?: Maybe<Request>;
  requestAttachments: Array<RequestAttachment>;
  requestByControlNo?: Maybe<Request>;
  requestTypes: Array<RequestType>;
  requests: RequestConnection;
  role?: Maybe<Role>;
  roles: RoleConnection;
  /** Unread count for the notification bell (FR-48). */
  unreadNotificationCount: Scalars['Int']['output'];
  user?: Maybe<User>;
  users: UserConnection;
  venue?: Maybe<Venue>;
  venues: Array<Venue>;
};


export type QueryCategorySummaryArgs = {
  input: CategorySummaryInput;
};


export type QueryCheckEventConflictsArgs = {
  input: CreateEventInput;
};


export type QueryDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDocumentAttachmentsArgs = {
  documentId: Scalars['ID']['input'];
};


export type QueryDocumentByControlNoArgs = {
  controlNo: Scalars['String']['input'];
};


export type QueryDocumentTypesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryDocumentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<DocumentFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<DocumentSortInput>;
};


export type QueryEventArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<EventFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<EventSortInput>;
};


export type QueryFolderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFoldersArgs = {
  parentId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryHolidaysArgs = {
  from?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyScheduleArgs = {
  date?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NotificationFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<NotificationSortInput>;
};


export type QueryRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRequestAttachmentsArgs = {
  requestId: Scalars['ID']['input'];
};


export type QueryRequestByControlNoArgs = {
  controlNo: Scalars['String']['input'];
};


export type QueryRequestTypesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryRequestsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<RequestFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<RequestSortInput>;
};


export type QueryRoleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRolesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<RoleFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<RoleSortInput>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UserFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<UserSortInput>;
};


export type QueryVenueArgs = {
  id: Scalars['ID']['input'];
};


export type QueryVenuesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RemoveRoleInput = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type ReportArtifact = {
  __typename?: 'ReportArtifact';
  /** Base64-encoded artifact bytes. */
  bodyBase64: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  mimeType: Scalars['String']['output'];
};

export type ReportArtifactMutationPayload = {
  __typename?: 'ReportArtifactMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  report: ReportArtifact;
};

export type ReportFormat =
  | 'EXCEL'
  | 'PDF';

export type ReportPeriod =
  | 'ANNUAL'
  | 'MONTHLY';

export type Request = Node & {
  __typename?: 'Request';
  /** Uploaded incoming letters and annexes. */
  attachments: Array<RequestAttachment>;
  channel: RequestChannel;
  controlNo: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['ID']['output'];
  /** Output documents produced from this request (0..N). */
  documents: Array<Document>;
  id: Scalars['ID']['output'];
  /** Append-only audit trail, newest-first. */
  logs: Array<DocumentLog>;
  originOffice: Scalars['String']['output'];
  priority: RequestPriority;
  receivedAt: Scalars['DateTime']['output'];
  requestType?: Maybe<RequestType>;
  requestTypeId: Scalars['ID']['output'];
  requestingParty: Scalars['String']['output'];
  /** received_at + 3 business days (RA 11032). */
  slaDeadline: Scalars['DateTime']['output'];
  status: RequestStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type RequestAttachment = Node & {
  __typename?: 'RequestAttachment';
  bucketName: Scalars['String']['output'];
  /** Server-computed SHA-256 (tamper-evidence). */
  checksum: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  kind: RequestAttachmentKind;
  mimeType: Scalars['String']['output'];
  originalName: Scalars['String']['output'];
  requestId: Scalars['ID']['output'];
  sizeBytes: Scalars['Int']['output'];
  uploadedBy: Scalars['ID']['output'];
};

export type RequestAttachmentKind =
  | 'ANNEX'
  | 'INCOMING_LETTER';

export type RequestChannel =
  | 'COURIER'
  | 'EMAIL'
  | 'MAIL'
  | 'WALK_IN';

export type RequestConnection = {
  __typename?: 'RequestConnection';
  edges: Array<RequestEdge>;
  pageInfo: PageInfo;
};

export type RequestEdge = {
  __typename?: 'RequestEdge';
  cursor: Scalars['String']['output'];
  node: Request;
};

export type RequestFilterInput = {
  originOffice?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<RequestPriority>;
  receivedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  receivedTo?: InputMaybe<Scalars['DateTime']['input']>;
  requestTypeId?: InputMaybe<Scalars['ID']['input']>;
  slaAtRisk?: InputMaybe<Scalars['Boolean']['input']>;
  slaOverdue?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<RequestStatus>;
};

export type RequestMutationPayload = {
  __typename?: 'RequestMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  request: Request;
};

export type RequestPriority =
  | 'HIGH'
  | 'NORMAL'
  | 'URGENT';

export type RequestSortField =
  | 'CONTROL_NO'
  | 'PRIORITY'
  | 'RECEIVED_AT'
  | 'SLA_DEADLINE'
  | 'TITLE';

export type RequestSortInput = {
  direction?: InputMaybe<SortDirection>;
  field: RequestSortField;
};

export type RequestStatus =
  | 'APPROVED'
  | 'CLOSED'
  | 'DENIED'
  | 'ENDORSED'
  | 'PREPARATION'
  | 'RECEIVED'
  | 'RETURNED_FOR_COMPLIANCE'
  | 'REVIEW'
  | 'SCREENING'
  | 'TRANSMITTED';

export type RequestType = Node & {
  __typename?: 'RequestType';
  code: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  prefix: Scalars['String']['output'];
};

export type RequestTypeMutationPayload = {
  __typename?: 'RequestTypeMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  requestType: RequestType;
};

export type ReviewDecision =
  | 'APPROVED'
  | 'DENIED'
  | 'ENDORSED';

export type ReviewDocumentInput = {
  decision: ReviewDecision;
  decisionNotes?: InputMaybe<Scalars['String']['input']>;
  /** Mandatory when decision = DENIED (FR-23). */
  denialReason?: InputMaybe<Scalars['String']['input']>;
  documentId: Scalars['ID']['input'];
  signatoryRequired?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Role = Node & {
  __typename?: 'Role';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  /** Permission strings in "Service:Action" form; "*" wildcards allowed. */
  permissionPayload: Array<Scalars['String']['output']>;
};

export type RoleConnection = {
  __typename?: 'RoleConnection';
  edges: Array<RoleEdge>;
  pageInfo: PageInfo;
};

export type RoleEdge = {
  __typename?: 'RoleEdge';
  cursor: Scalars['String']['output'];
  node: Role;
};

export type RoleFilterInput = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type RoleMutationPayload = {
  __typename?: 'RoleMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  role: Role;
};

export type RoleSortField =
  | 'CREATED_AT'
  | 'NAME';

export type RoleSortInput = {
  direction?: InputMaybe<SortDirection>;
  field: RoleSortField;
};

export type ScreenRequestInput = {
  /** Specific deficiencies - required when passed = false (FR-13). */
  deficiencies?: InputMaybe<Array<Scalars['String']['input']>>;
  notes?: InputMaybe<Scalars['String']['input']>;
  passed: Scalars['Boolean']['input'];
  requestId: Scalars['ID']['input'];
};

export type SignDocumentInput = {
  documentId: Scalars['ID']['input'];
  signedAt?: InputMaybe<Scalars['DateTime']['input']>;
  signedBy: Scalars['ID']['input'];
};

export type SortDirection =
  | 'ASC'
  | 'DESC';

export type Transmission = Node & {
  __typename?: 'Transmission';
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['ID']['output'];
  documentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  method: TransmissionMethod;
  notes?: Maybe<Scalars['String']['output']>;
  proofAttachmentId?: Maybe<Scalars['ID']['output']>;
  receivedBy: Scalars['String']['output'];
  receivingOffice: Scalars['String']['output'];
  recipientName: Scalars['String']['output'];
  transmittedAt: Scalars['DateTime']['output'];
};

export type TransmissionMethod =
  | 'COURIER'
  | 'EMAIL'
  | 'PICKUP';

export type TransmitDocumentInput = {
  documentId: Scalars['ID']['input'];
  method: TransmissionMethod;
  notes?: InputMaybe<Scalars['String']['input']>;
  proofAttachmentId?: InputMaybe<Scalars['ID']['input']>;
  receivedBy: Scalars['String']['input'];
  receivingOffice: Scalars['String']['input'];
  recipientName: Scalars['String']['input'];
  transmittedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UpdateEventInput = {
  attendeeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  department?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  eventDate?: InputMaybe<Scalars['String']['input']>;
  eventId: Scalars['ID']['input'];
  involvesAdministrator?: InputMaybe<Scalars['Boolean']['input']>;
  involvesMayor?: InputMaybe<Scalars['Boolean']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  organizerId?: InputMaybe<Scalars['ID']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EventStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
  venueId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  permissionPayload?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateUserProfileInput = {
  contactNo?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  office?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  suffix?: InputMaybe<Scalars['String']['input']>;
};

/** `code` is the natural key and is not editable once a venue exists. */
export type UpdateVenueInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  specialUse?: InputMaybe<Scalars['Boolean']['input']>;
  venueId: Scalars['ID']['input'];
};

export type UpsertHolidayInput = {
  /** YYYY-MM-DD. */
  holidayDate: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type User = Node & {
  __typename?: 'User';
  contactNo: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Effective permission set = union of role payloads (with wildcards). */
  effectivePermissions: Array<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  middleName?: Maybe<Scalars['String']['output']>;
  office: Scalars['String']['output'];
  position: Scalars['String']['output'];
  /** Roles assigned to this user. */
  roles: Array<Role>;
  suffix?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type UserConnection = {
  __typename?: 'UserConnection';
  edges: Array<UserEdge>;
  pageInfo: PageInfo;
};

export type UserEdge = {
  __typename?: 'UserEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserFilterInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  office?: InputMaybe<Scalars['String']['input']>;
  roleName?: InputMaybe<Scalars['String']['input']>;
};

export type UserMutationPayload = {
  __typename?: 'UserMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  user: User;
};

export type UserSortField =
  | 'CREATED_AT'
  | 'EMAIL'
  | 'FIRST_NAME'
  | 'LAST_NAME';

export type UserSortInput = {
  direction?: InputMaybe<SortDirection>;
  field: UserSortField;
};

export type Venue = Node & {
  __typename?: 'Venue';
  /**
   * Live availability: how many CONFIRMED bookings this venue still has whose
   * slot has not ended yet (`end_time` later than now on the event date).
   * Computed per read - never cached server-side - so the scheduler shows the
   * venue as it is right now. Served by the partial index
   * `events_active_bookings_index`.
   */
  activeBookings: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** true for Mayor's Conf. Room / Admin's Office (special meetings). */
  specialUse: Scalars['Boolean']['output'];
};

export type VenueMutationPayload = {
  __typename?: 'VenueMutationPayload';
  changedEntities: Array<Scalars['String']['output']>;
  venue: Venue;
};
