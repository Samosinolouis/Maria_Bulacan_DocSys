// Types and Models for Municipal Administrator's Office Document Management System (DMS)
// Client: Municipality of Santa Maria, Bulacan - Office of the Municipal Administrator
// Compliant with DICT GWTS v25.3.3, RA 11032 (3-day SLA), RA 10173, RA 8491, RA 10535

export type DocumentType =
  | 'INCOMING'               // Incoming General Client Requests / Letters
  | 'TRAVEL_ORDER'           // Official Travel Orders
  | 'VENUE_REQ'              // Venue Reservations
  | 'VEHICLE_REQ'            // Municipal Service Vehicle Requests
  | 'FOOD_REQ'               // Food / Catering Support Requests
  | 'OVERTIME_REQ'           // Overtime Work Authorizations
  | 'EXECUTIVE_ORDER'        // Executive Orders by the Mayor
  | 'CONTRACT_AGREEMENT'     // Contracts, MOAs, Legal Agreements
  | 'SB_ENDORSEMENT'         // Sangguniang Bayan Endorsements
  | 'MEMO_ORDER'             // Memorandum Orders & Directives
  | 'CERTIFICATION_PERMIT'   // Certifications, Clearances & Permits
  | 'LEGAL_ADVICE'           // Legal Opinions & Reviews
  | 'COMMUNICATION_NATIONAL' // Communication for National Agencies
  | 'ENDORSEMENT_LETTER'     // Endorsement Letters & Recommendations
  | 'ENDORSEMENT'            // Legacy/Alias
  | 'PERMIT'                 // Legacy/Alias
  | 'LEGAL_OPINION'          // Legacy/Alias
  | 'OTHER';

export type DocumentCategory =
  | 'EXEC_ORDER'
  | 'SB_ENDORSEMENT'
  | 'CONTRACT'
  | 'CERTIFICATION'
  | 'PERMIT'
  | 'MEMO_ORDER'
  | 'LEGAL_ADVICE'
  | 'WORK_ENDORSEMENT'
  | 'COMM_LETTER'
  | 'OTHER';

export type DocumentStatus =
  | 'RECEIVED'        // Step 1: Newly logged
  | 'SCREENING'       // Step 2: Attachment completeness check
  | 'PREPARATION'     // Step 3: Officer drafting response/order
  | 'REVIEW'          // Step 4: MA / EA II approval queue
  | 'APPROVED'        // Step 4: Approved by MA/Mayor
  | 'ENDORSED'        // Step 4: Endorsed to SB/Legal/other
  | 'DENIED'          // Step 4: Rejected with logged reason
  | 'TRANSMITTED'     // Step 5: Transmitted to recipient
  | 'CLOSED';         // Step 6: Archived and complete

export type UserRole =
  | 'ADMINISTRATOR'        // Engr. Elmer B. Clemente - Full control, approve/deny, reports, users
  | 'EXECUTIVE_ASSISTANT' // Benito C. Fabian - Approve/endorse/deny, review queue, reports
  | 'OFFICER'             // Officer J. Garcia - Prepare drafts, orders, view assigned
  | 'CLERK_ENCODER';      // Sherelyn O. Libao - Intake, scan, screen, transmit, archive, schedule

export type Venue =
  | 'CONFERENCE_ROOM'     // Municipal Conference Room
  | 'COMMAND_CENTER'      // Command Center Room
  | 'SOCIAL_HALL'         // Social Hall
  | 'GYMNASIUM'           // Gymnasium
  | 'MAYOR_OFFICE'        // Mayor's Conference Room
  | 'ADMIN_OFFICE';       // Administrator's Office

export type AuditAction =
  | 'RECEIVED'
  | 'SCREENED_PASS'
  | 'SCREENED_FAIL'
  | 'ASSIGNED'
  | 'DRAFTED'
  | 'SUBMITTED_REVIEW'
  | 'APPROVED'
  | 'ENDORSED'
  | 'DENIED'
  | 'TRANSMITTED'
  | 'ARCHIVED'
  | 'REOPENED'
  | 'SCHEDULED_EVENT'
  | 'CANCELLED_EVENT';

export interface User {
  id: string;
  fullName: string;
  role: UserRole;
  title: string;
  department: string;
  email: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  fileDataUrl?: string; // Real base64 / blob URL for inline viewing and offline download
}

export interface TransmissionRecord {
  transmittedDate: string;
  transmittedToOffice: string;
  recipientName: string;
  receivedBy: string;
  proofDocumentUrl?: string;
  proofDataUrl?: string; // Real base64 proof image / signed transmittal slip
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  controlNumber: string; // e.g. SM-MA-2026-0042
  type: DocumentType;
  category: DocumentCategory;
  title: string;
  requestingParty: string;
  originOffice: string;
  dateReceived: string;
  assignedTo: string | null;
  status: DocumentStatus;
  scannedFileUrl: string | null;
  scannedPages?: string[]; // Real digitized pages from camera or feeder
  attachments: Attachment[];
  draftContent?: string;
  draftDocumentUrl?: string | null;
  denialReason?: string | null;
  endorsementNotes?: string | null;
  transmissionDetails?: TransmissionRecord | null;
  slaDeadline: string; // ISO String, exactly 3 business days from receipt
  isOverdue: boolean;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventBooking {
  id: string;
  venue: Venue;
  title: string;
  organizer: string;
  department: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  attendees: string[];
  involvesMayor: boolean;
  involvesAdmin: boolean;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  notes?: string;
}

export interface AuditEntry {
  id: string;
  documentId?: string;
  eventId?: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  details: string;
}
