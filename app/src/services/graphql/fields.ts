/**
 * Shared GraphQL field selections. Services compose these into operation
 * documents; no service inlines field lists.
 */

export const PAGE_INFO_FIELDS = `
  hasNextPage
  hasPreviousPage
  startCursor
  endCursor
  totalCount
`;

export const REQUEST_TYPE_FIELDS = `id code name description prefix isActive`;
export const DOCUMENT_TYPE_FIELDS = `id code name description prefix isActive`;

export const ROLE_FIELDS = `id name description permissionPayload createdAt`;
export const USER_FIELDS = `
  id firstName middleName lastName suffix email contactNo office position
  isActive createdAt updatedAt
`;

export const REQUEST_ATTACHMENT_FIELDS = `
  id requestId kind bucketName originalName mimeType sizeBytes checksum uploadedBy createdAt
`;
export const DOCUMENT_ATTACHMENT_FIELDS = `
  id documentId kind bucketName originalName mimeType sizeBytes checksum uploadedBy createdAt
`;
export const TRANSMISSION_FIELDS = `
  id documentId recipientName receivingOffice receivedBy method transmittedAt
  notes proofAttachmentId createdBy createdAt
`;
export const DOCUMENT_LOG_FIELDS = `
  id requestId documentId actorId actorName actorRole actionType template payload createdAt
`;

export const DOCUMENT_BASE_FIELDS = `
  id requestId controlNo documentTypeId title status assignedTo signatoryRequired
  signedBy signedAt denialReason decisionNotes decidedBy decidedAt folderId
  createdBy createdAt updatedAt
`;

/**
 * List rows: the base fields plus the resolved document type and its
 * attachments, so a docket row can show the classification name (instead of the
 * raw `documentTypeId`) and count/open its draft files without a second read.
 */
export const DOCUMENT_LIST_FIELDS = `
  ${DOCUMENT_BASE_FIELDS}
  documentType { ${DOCUMENT_TYPE_FIELDS} }
  attachments { ${DOCUMENT_ATTACHMENT_FIELDS} }
`;

export const DOCUMENT_FULL_FIELDS = `
  ${DOCUMENT_BASE_FIELDS}
  documentType { ${DOCUMENT_TYPE_FIELDS} }
  attachments { ${DOCUMENT_ATTACHMENT_FIELDS} }
  transmissions { ${TRANSMISSION_FIELDS} }
  logs { ${DOCUMENT_LOG_FIELDS} }
`;

/**
 * Dispatch desk rows: the list fields plus each document's transmission
 * records. The desk needs them to tell a document that still awaits dispatch
 * from one already sent (FR-26..28) - a plain `list` row carries no
 * transmissions, so every row would read "Awaiting dispatch".
 */
export const DOCUMENT_DISPATCH_FIELDS = `
  ${DOCUMENT_BASE_FIELDS}
  documentType { ${DOCUMENT_TYPE_FIELDS} }
  transmissions { ${TRANSMISSION_FIELDS} }
`;

export const REQUEST_BASE_FIELDS = `
  id controlNo requestTypeId title requestingParty originOffice channel priority
  receivedAt slaDeadline status createdBy createdAt updatedAt
  requestType { ${REQUEST_TYPE_FIELDS} }
`;

export const REQUEST_FULL_FIELDS = `
  ${REQUEST_BASE_FIELDS}
  documents { ${DOCUMENT_FULL_FIELDS} }
  attachments { ${REQUEST_ATTACHMENT_FIELDS} }
  logs { ${DOCUMENT_LOG_FIELDS} }
`;

export const VENUE_FIELDS = `id code name specialUse isActive activeBookings`;

export const EVENT_FIELDS = `
  id venueId title organizerId department eventDate startTime endTime status
  involvesMayor involvesAdministrator notes createdBy createdAt updatedAt
  venue { ${VENUE_FIELDS} }
  attendees { userId name }
  logs { id eventId actorId actorName actorRole actionType template payload createdAt }
`;

export const NOTIFICATION_FIELDS = `
  id userId type title payload template requestId documentId eventId readAt createdAt
`;

export const FOLDER_FIELDS = `id parentId path name itemCount createdBy createdAt`;

export const DASHBOARD_METRICS_FIELDS = `
  totalDocuments incomingRequests pendingActions closedTransactions slaAtRisk slaOverdue
`;

export const CATEGORY_SUMMARY_FIELDS = `documentTypeId code name count`;
export const HOLIDAY_FIELDS = `id holidayDate name`;
