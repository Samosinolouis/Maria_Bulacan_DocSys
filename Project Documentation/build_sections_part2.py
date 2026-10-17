# build_sections_part2.py
# Section V (Functional Requirements), Section VI (Non-Functional Requirements), 
# and Section VII (Database Design)

SECTION_V = """# V. Functional Requirements

### A. Functional Requirements Matrix (FR-01 to FR-60)
The functional requirements for DocSys v2.6 were derived from the official Project Brief issued by the Municipal Administrator's Office, statutory mandates under Republic Act No. 11032, and the technical guidelines for ITS122P. The matrix below defines the 60 core functional specifications of the system:

| Req. ID | Subsystem / Module | Requirement Title | Detailed Functional Specification | Authorized Roles | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Authentication | Keycloak OIDC Authentication | System shall authenticate civil servants via Keycloak OIDC protocol using official LGU credentials. | All Plantilla Roles | Critical |
| **FR-02** | Authentication | Password Security Non-Storage | System database shall never store plaintext or hashed user passwords; all credential verification is delegated to Keycloak. | All Plantilla Roles | Critical |
| **FR-03** | Authentication | Single Sign-On & Token Renewal | System shall manage user sessions using secure JWT tokens and refresh tokens with automated expiration after 8 hours of inactivity. | All Plantilla Roles | High |
| **FR-04** | Authentication | Persona Switcher for Testing | System shall provide an internal persona selector in development and audit modes to verify permissions across plantilla titles. | Admin, Auditor | Medium |
| **FR-05** | Authorization | Role-Based Access Control | System shall restrict route access and mutation capabilities according to assigned Plantilla roles (`ADMIN`, `EA`, `OFFICER`, `CLERK`). | All Plantilla Roles | Critical |
| **FR-06** | Intake & Reception | Intake Docket Wizard | System shall provide a 3-step intake wizard capturing document title, requesting party, origin department, priority, and classification. | Clerk, Officer, Admin | Critical |
| **FR-07** | Intake & Reception | Automated Control Numbering | System shall generate unique, sequential municipal control numbers formatted as `[TYPE]-[YEAR]-[SEQUENCE]` (e.g. `TO-2026-0042`). | Clerk, Officer, Admin | Critical |
| **FR-08** | Intake & Reception | HTML5 Camera Document Scanner | System shall access workstation camera hardware via `getUserMedia` to scan physical pages in real-time with an A4 alignment reticle. | Clerk, Encoder | High |
| **FR-09** | Intake & Reception | Drag-and-Drop File Feeder | System shall support drag-and-drop file ingestion supporting PDF, DOCX, XLSX, PNG, and JPEG files up to 25MB per file. | Clerk, Officer, Admin | Critical |
| **FR-10** | Intake & Reception | Multi-Page Annex Management | System shall allow operators to review thumbnails of scanned pages, re-order pages, delete blurry frames, and compile multi-page dossiers. | Clerk, Encoder | High |
| **FR-11** | Intake & Reception | 72-Hour ARTA Clock Initiation | System shall automatically calculate the 72 business hour SLA deadline upon intake, accounting for official Philippine Standard Time and weekends. | System / All Roles | Critical |
| **FR-12** | Intake & Reception | Duplicate Docket Detection | System shall warn the operator if an incoming request with an identical subject matter and requesting party was logged within the past 14 days. | Clerk, Encoder | Medium |
| **FR-13** | Initial Screening | Completeness Verification Checklist | System shall require screening officers to evaluate mandatory criteria: attachment presence, authorized signature, and proper addressee. | Clerk, Encoder | Critical |
| **FR-14** | Initial Screening | Advance Complete Dockets | System shall advance dockets with verified complete requirements from `SCREENING` to `PREPARATION` or `REVIEW` status. | Clerk, Encoder | Critical |
| **FR-15** | Initial Screening | Return for Compliance Workflow | System shall allow screening officers to formally return incomplete dockets to the client with documented statutory deficiency grounds. | Clerk, Encoder | Critical |
| **FR-16** | Initial Screening | Resubmission Ingestion | System shall record resubmitted corrective documents, link them to the original control number, and resume the statutory workflow. | Clerk, Encoder | High |
| **FR-17** | Initial Screening | Screening Notes Logging | System shall log all screening observations, checklist answers, and operator timestamps into the docket's audit ledger. | Clerk, Encoder | High |
| **FR-18** | Initial Screening | Priority Elevation Flagging | System shall permit screening officers to flag time-critical dockets as `HIGH` or `URGENT` to trigger visual warnings on executive desks. | Clerk, Admin | High |
| **FR-19** | Drafting Studio | Standard Template Library | System shall provide pre-configured drafting templates for Travel Orders, Executive Orders, SB Indorsements, Overtime Authorities, and Memos. | Officer, Admin | Critical |
| **FR-20** | Drafting Studio | Live Letterhead Rendering | System shall dynamically render the official Municipal Seal of Santa Maria and Bagong Pilipinas crest on generated letterhead canvas. | Officer, Admin | High |
| **FR-21** | Drafting Studio | Draft Document Editing | System shall provide a rich-text drafting canvas allowing officers to populate municipal particulars, directives, and appropriation items. | Officer, Admin | Critical |
| **FR-22** | Drafting Studio | Submission to Review Desk | System shall transition saved drafts to `REVIEW` status and place them directly into the Municipal Administrator's review queue. | Officer, Admin | Critical |
| **FR-23** | Executive Review | Multi-Tiered Review Queue | System shall display a filtered queue of dockets awaiting executive action for the Municipal Administrator and Executive Assistant II. | Admin, Exec Assistant | Critical |
| **FR-24** | Executive Review | Actionable Approve Workflow | System shall allow the Administrator or Mayor to approve a docket with a single click, recording the approving official and timestamp. | Admin, Mayor | Critical |
| **FR-25** | Executive Review | Legislative Indorsement Workflow | System shall allow the Administrator to endorse dockets to the Sangguniang Bayan or specific municipal bureaus with binding action notes. | Admin, Exec Assistant | Critical |
| **FR-26** | Executive Review | Formal Denial with Grounds | System shall mandate written legal/administrative grounds whenever a docket is denied, permanently appending the reason to the record. | Admin, Mayor | Critical |
| **FR-27** | Executive Review | Mayoral Signature Gate | System shall flag dockets requiring the personal signature of the Municipal Mayor (e.g. Executive Orders and sisterhood treaties). | Admin, Mayor | High |
| **FR-28** | Executive Review | Executive Batch Actions | System shall support batch approval of routine administrative requests (e.g. standard Travel Orders and Overtime Authorizations). | Admin, Exec Assistant | Medium |
| **FR-29** | Transmission Desk | Outward Transmittal Logging | System shall record dispatch particulars: destination office, designated recipient name, dispatch method, and transmittal timestamp. | Clerk, Encoder | Critical |
| **FR-30** | Transmission Desk | Multi-Channel Dispatch Tracking | System shall classify transmissions into four channels: Physical Courier, In-Person Pickup, Official Government Email, and Web Portal. | Clerk, Encoder | High |
| **FR-31** | Transmission Desk | Signed Receipt Proof Upload | System shall allow dispatch officers to capture and upload a scanned image or PDF of the signed receiving slip as conclusive proof of delivery. | Clerk, Encoder | Critical |
| **FR-32** | Transmission Desk | Multi-Destination Dispatches | System shall support attaching multiple transmittal records to a single docket when copies are served to several external entities. | Clerk, Encoder | High |
| **FR-33** | Records Archive | Concluded Transaction Closing | System shall automatically lock fully transmitted, approved, or denied records as `CLOSED` and transition them to the permanent archive. | System / Clerk / Admin | Critical |
| **FR-34** | Records Archive | Read-Only Archival Enforcement | System shall enforce strict immutability on archived records; metadata, attachments, and decisions cannot be edited or purged. | System / All Roles | Critical |
| **FR-35** | Records Archive | Multi-Criteria Search Engine | System shall allow personnel to search records across control numbers, titles, requesting parties, originating bureaus, and date ranges. | All Plantilla Roles | Critical |
| **FR-36** | Records Archive | Inline PDF Lightbox Preview | System shall render multi-page PDF attachments in a responsive, sandboxed iframe previewer without requiring external viewer software. | All Plantilla Roles | High |
| **FR-37** | Records Archive | Permitted File Download | System shall allow authorized users to download original attachment files and transmittal proofs with cryptographic hash verification. | All Plantilla Roles | High |
| **FR-38** | Records Archive | Category Filtering & Ledger | System shall provide quick-filter tabs across the 14 statutory document categories with live record counts and status distribution badges. | All Plantilla Roles | High |
| **FR-39** | Venue Scheduling | Multi-Venue Calendar Suite | System shall provide a shared monthly, weekly, and daily calendar covering all six (6) municipal facilities and venues. | All Plantilla Roles | Critical |
| **FR-40** | Venue Scheduling | Automated Conflict Prevention | System shall evaluate reservation date, start time, and end time to automatically reject overlapping bookings for identical venues. | All Plantilla Roles | Critical |
| **FR-41** | Venue Scheduling | Tentative Conflict Logging | System shall permit users to record an overlapping reservation as `TENTATIVE` pending executive determination by the Administrator. | Clerk, Admin | High |
| **FR-42** | Venue Scheduling | Mayoral Gavel Flagging | System shall display a prominent Mayoral Gavel indicator for proceedings presided over by the Mayor or requiring Administrator presence. | All Plantilla Roles | High |
| **FR-43** | Venue Scheduling | Plantilla Attendee Tagging | System shall allow booking organizers to tag enrolled civil servants as confirmed attendees and generate synchronized schedule notices. | Clerk, Officer, Admin | High |
| **FR-44** | Venue Scheduling | Reservation Cancellation | System shall allow authorized organizers or administrators to cancel bookings, freeing the venue slot and recording the cancellation reason. | Clerk, Admin | Medium |
| **FR-45** | Compliance & Reports | Live ARTA Operations HUD | System shall display high-density operational status cards tracking Active Influx, Signature Queues, SLA Integrity, and Venue Logistics. | Admin, Exec Assistant | Critical |
| **FR-46** | Compliance & Reports | 72-Hour SLA Escalation Radar | System shall prominently flag any active transaction approaching or exceeding the 72-hour turnaround limit with red escalation badges. | Admin, Exec Assistant | Critical |
| **FR-47** | Compliance & Reports | Turnaround Speed Metrics | System shall calculate and display municipal performance metrics: SLA compliance rate (%), average processing days, and overdue count. | Admin, Exec Assistant | High |
| **FR-48** | Compliance & Reports | Category Balance Sheet | System shall display monthly and annual volume matrices broken down by civic document category, approval status, and originating bureau. | Admin, Exec Assistant | High |
| **FR-49** | Compliance & Reports | Report Export to PDF / Excel | System shall support one-click export of compliance balance sheets and operational summaries into formatted PDF and spreadsheet files. | Admin, Exec Assistant | Medium |
| **FR-50** | Audit & Governance | Immutable Audit Trail Ledger | System shall log every creation, screening, status mutation, approval, endorsement, transmission, and archival event in a permanent ledger. | Admin, Auditor | Critical |
| **FR-51** | Audit & Governance | User Attribution & Context | System shall record actor UUID, civil service name, plantilla role, client IP address, and narrative transaction particulars in each log entry. | Admin, Auditor | Critical |
| **FR-52** | Audit & Governance | SHA-256 Tamper Checksums | System shall compute and store a SHA-256 cryptographic hash of every audit entry to detect and prevent unauthorized database tampering. | System | Critical |
| **FR-53** | Notification Center | Real-Time In-App Alerts | System shall generate in-app alerts for pending review submissions, executive decisions, schedule reminders, and SLA threshold warnings. | All Plantilla Roles | High |
| **FR-54** | Notification Center | Deep-Linking Navigation | System shall allow personnel to click any notification alert to navigate directly to the affected docket dossier or calendar event. | All Plantilla Roles | High |
| **FR-55** | Dossier & Routing | 6-Stage Progress Tracker | System shall display an interactive 6-stage lifecycle progress bar (Intake, Screening, Prep, Review, Transmission, Archive) on every dossier. | All Plantilla Roles | High |
| **FR-56** | Dossier & Routing | Printable Routing Slip Modal | System shall generate a printable official LGU routing slip replicating physical paper slips with dual seals, barcode, and signature boxes. | All Plantilla Roles | High |
| **FR-57** | XML Integration | XML Schema (XSD) Validation | System shall validate municipal document records against a standardized XML Schema (XSD) governing civic metadata and statutory elements. | System | High |
| **FR-58** | XML Integration | Civic XML Docket Export | System shall export complete document records and transmittal histories as well-formed, schema-validated XML documents. | Admin, Officer | High |
| **FR-59** | Responsive Design | Mobile Navigation Drawer | System shall provide a touch-optimized slide-over navigation drawer for personnel accessing the calendar or docket ledgers via smartphones. | All Plantilla Roles | High |
| **FR-60** | Responsive Design | Small-Screen Table Scrolling | System shall wrap all tabular ledgers in horizontal scroll containers to preserve data integrity and prevent column truncation on mobile devices. | All Plantilla Roles | High |

---
<div style="page-break-after: always;"></div>
"""

SECTION_VI = """# VI. Non-Functional Requirements

### A. Performance and Scalability Standards
1. **API Response Latency:** All read and query operations executed against the GraphQL API server shall return within 500 milliseconds under normal operating loads.
2. **Page Load Speed:** High-density dashboard views, queue pages, and tabular ledgers shall achieve a Full Contentful Paint (FCP) of under 2.0 seconds and a Time to Interactive (TTI) of under 3.0 seconds at the 95th percentile over standard broadband connections.
3. **Search Indexing Throughput:** Full-text keyword searches across the 14 document categories shall return matched dockets in less than 1.5 seconds across database corpuses exceeding 100,000 records.
4. **Concurrent User Scalability:** The cloud infrastructure shall support at least fifty (50) active, authenticated concurrent municipal staff members performing intensive file uploads, PDF rendering, and queue filtering without system degradation.

### B. Security, Identity, and Confidentiality Standards
1. **Delegated Identity Management:** Authentication is strictly isolated from application code; all authentication requests, multi-factor policies, and session token issuances are governed by Keycloak IAM via OpenID Connect (OIDC).
2. **Data-in-Transit Encryption:** All communication channels between client browsers, Azure Static Web Apps, Azure App Service, and PostgreSQL Flexible Server must enforce TLS 1.3 encryption with strict HTTP Strict Transport Security (HSTS) headers.
3. **Data-at-Rest Protection:** Database storage volumes and cloud object storage buckets are encrypted at rest using AES-256 standard encryption.
4. **Data Privacy Compliance (RA 10173):** In compliance with Republic Act No. 10173 (Data Privacy Act of 2012), constituent personal data (contact numbers, personal residential addresses, and private petitions) are accessible strictly to authorized plantilla officers on a need-to-know basis.
5. **Cryptographic Integrity (SHA-256):** Every uploaded attachment and every state-changing audit log entry is assigned an immutable SHA-256 cryptographic fingerprint to guarantee tamper-evidence and legal non-repudiation (RA 10175).

### C. Reliability, Availability, and Disaster Recovery
1. **Operational Uptime Target:** The system shall maintain an uptime of at least 99.5% during official municipal business hours (Monday through Friday, 8:00 AM to 5:00 PM PST).
2. **Automated Database Backups:** The Azure PostgreSQL Flexible Server executes automated daily database snapshots retained for thirty (30) days with Geo-Redundant storage options.
3. **Recovery Objectives:** The system enforces a Recovery Point Objective (RPO) of less than twenty-four (24) hours and a Recovery Time Objective (RTO) of less than four (4) hours in the event of an unplanned cloud infrastructure failure.

### D. Usability, Accessibility, and Design Doctrine Standards
1. **DICT Government Web Template Standards (GWTS v25.3.3):** The user interface implements the official Republic of the Philippines top bar (GOVPH Masthead), synchronized Philippine Standard Time (PST), standardized institutional headers, and official heraldic insignia.
2. **Strict Zero-Emoji Policy:** In accordance with civil service design doctrines, emojis are strictly prohibited across all application interfaces, buttons, notifications, and generated documents. Standardized Lucide SVG iconography is utilized exclusively.
3. **Strict Zero-Em-Dash Policy:** Em-dashes and en-dashes are excluded from system labels, titles, and generated documents to maintain clean, unambiguous civil service typographical formatting.
4. **Heraldic Color Palette:** The interface employs a restrained, professional municipal palette:
   - Municipal Forest Green (`#15803D`, `#166534`): Primary civic branding and approval indicators.
   - Government Deep Navy (`#081E36`, `#0B2545`): Masthead, navigation structure, and executive headers.
   - Clean Parchment Slate (`#F8FAFC`, `#F1F5F9`): Soft background surfaces designed for long workstation shifts.
   - Understated Crimson (`#DC2626`, `#B91C1C`): Reserved strictly for statutory SLA escalation alerts.
5. **Accessibility Standards:** Text elements maintain a minimum WCAG 2.1 AA contrast ratio of 4.5:1 against their background substrates.

### E. System Compatibility and Interoperability
1. **Cross-Browser Verification:** The web system operates seamlessly across current and preceding major releases of Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari.
2. **Supported File Formats:** The ingestion engine supports PDF (standard and PDF/A), Microsoft Word (`.docx`), Microsoft Excel (`.xlsx`), PNG, and JPEG formats.
3. **Hardware Interoperability:** The camera scanning subsystem interfaces with any standard USB document camera, webcam, or mobile device camera supporting HTML5 `MediaDevices.getUserMedia`.

### F. Maintainability, Modularity, and Code Quality
1. **Type-Safe Full-Stack Architecture:** 100% of frontend and backend code is written in TypeScript, ensuring compile-time type safety across GraphQL resolvers, database models, and UI state hooks.
2. **Versioned Database Migrations:** Relational schema alterations are strictly governed through versioned Drizzle ORM migrations committed to source control.
3. **Statutory Calendar Separation:** Philippine national holidays, local Bulacan foundation days, and municipal special non-working days are stored as dynamic database records rather than hard-coded application logic.

---
<div style="page-break-after: always;"></div>
"""

SECTION_VII = """# VII. Database Design

### A. Conceptual and Master Entity-Relationship Diagrams
The persistence tier of DocSys v2.6 is architected around nine (9) core relational entities in PostgreSQL. The schema is cleanly organized in the `app` database namespace, coexisting securely with the Keycloak authentication tables housed in the `public` namespace.

```mermaid
erDiagram
    USERS ||--o{ DOCUMENTS : "created_by (1:N)"
    USERS |o--o{ DOCUMENTS : "assigned_to (0..1:N)"
    USERS ||--o{ ATTACHMENTS : "uploaded_by (1:N)"
    USERS ||--o{ EVENT_BOOKINGS : "booked_by (1:N)"
    USERS ||--o{ AUDIT_LOGS : "performed_by (1:N)"

    DOCUMENTS ||--o{ ATTACHMENTS : "contains (1:N)"
    DOCUMENTS ||--o| TRANSMISSIONS : "dispatches (1:0..1)"
    DOCUMENTS ||--o{ AUDIT_LOGS : "records_history (0..1:N)"

    VENUES ||--o{ EVENT_BOOKINGS : "hosts (1:N)"
    EVENT_BOOKINGS ||--o{ EVENT_ATTENDEES : "includes (1:N)"
    EVENT_BOOKINGS ||--o{ AUDIT_LOGS : "records_event (0..1:N)"

    USERS {
        string id PK "UUID / Plantilla ID"
        string full_name "Full civil service name"
        string email UK "Official LGU email"
        string role "Plantilla Role Enum"
        string department "Department / Bureau"
        string title "Plantilla Position"
        boolean is_active "Employment status"
        timestamptz created_at "Creation timestamp"
    }

    DOCUMENTS {
        string id PK "UUID"
        string control_number UK "Control Number"
        string type "Classification Enum"
        string category "Broad Category Enum"
        string title "Subject Matter"
        string requesting_party "Citizen / Agency"
        string origin_office "Originating Office"
        string status "Workflow State Enum"
        string priority "Priority Enum"
        timestamptz sla_deadline "RA 11032 SLA Limit"
        boolean is_overdue "Overdue SLA Flag"
        text denial_reason "Mandatory if Denied"
        text endorsement_notes "Endorsement Notes"
    }

    ATTACHMENTS {
        string id PK "UUID"
        string document_id FK "Document UUID"
        string file_name "Original Filename"
        string file_url "Storage Path / URI"
        bigint file_size "Size in Bytes"
        string file_type "MIME Type"
        timestamptz uploaded_at "Upload Time"
    }

    TRANSMISSIONS {
        string id PK "UUID"
        string document_id FK "Document UUID (1:1)"
        timestamptz transmitted_date "Dispatch Date"
        string transmitted_to_office "Target Office"
        string recipient_name "Recipient Officer"
        string received_by "Receiving Clerk"
        string method "Channel Enum"
        string proof_document_url "Signed Receipt URL"
    }

    VENUES {
        string id PK "Alphanumeric ID"
        string code UK "Facility Code"
        string name "Venue Display Name"
        string location "Physical Location"
        int capacity "Seating Capacity"
        boolean is_active "Operational Status"
    }

    EVENT_BOOKINGS {
        string id PK "UUID"
        string venue_id FK "Booked Venue ID"
        string title "Event Purpose"
        string organizer "Organizing Agency"
        date booking_date "Reservation Date"
        time start_time "Start Time Slot"
        time end_time "End Time Slot"
        boolean involves_mayor "Mayor Required Flag"
        boolean involves_admin "Admin Required Flag"
        string status "Booking Status Enum"
    }

    EVENT_ATTENDEES {
        string id PK "UUID"
        string event_id FK "Event Booking UUID"
        string full_name "Attendee Full Name"
        string role_title "Designation Title"
    }

    AUDIT_LOGS {
        string id PK "UUID"
        string document_id FK "Document UUID"
        string event_id FK "Event Booking UUID"
        string action "Action Enum"
        string user_id FK "Actor User UUID"
        string user_name "Actor Snapshot Name"
        string user_role "Actor Snapshot Role"
        timestamptz timestamp "Event Timestamp"
        text details "Action Particulars"
        string hash_checksum "SHA-256 Fingerprint"
    }

    DOCUMENT_TEMPLATES {
        string id PK "UUID"
        string code UK "Template Code"
        string title "Template Title"
        string category "Document Category"
        jsonb template_body_schema "Structured Schema"
        boolean is_active "Active Status"
    }
```

*Figure 2. Master Entity-Relationship Diagram of the Santa Maria DocSys Relational Database.*

### B. Modular Subsystem Entity-Relationship Diagrams
The master database architecture is logically decomposed into four distinct statutory operational subsystems:

1. **Subsystem 1: Civil Service Identity & Access Management (`USERS`, `AUDIT_LOGS`):**
   Manages civil service personnel accounts, assigned Plantilla roles (`MAYOR`, `MUNICIPAL_ADMIN`, `ADMIN_OFFICER_V`, `SENIOR_RECORDS_OFFICER`, `INTAKE_CLERK`), departmental affiliations, and links every state-changing mutation back to an authenticated civil servant.

2. **Subsystem 2: Statutory Docket Lifecycle & Central Transmittal Desk (`DOCUMENTS`, `ATTACHMENTS`, `TRANSMISSIONS`, `DOCUMENT_TEMPLATES`):**
   Encapsulates the core document tracking engine, managing sequential municipal control numbers, multi-file attachments (camera scans and uploaded PDFs), drafting templates, and outgoing dispatch records with physical delivery receipt proofs.

3. **Subsystem 3: Centralized Venue & Logistics Scheduling (`VENUES`, `EVENT_BOOKINGS`, `EVENT_ATTENDEES`):**
   Maintains the fixed inventory of the six (6) municipal facilities, reservation dates, start and end time slots, automated double-booking validation, and Mayoral/Administrator attendance flags.

4. **Subsystem 4: Non-Repudiation Custody Chain & RA 11032 Compliance (`AUDIT_LOGS`, `DOCUMENTS`):**
   Maintains the immutable, append-only transaction ledger, computing SHA-256 cryptographic checksums for every document state transition, approval, endorsement, and transmission.

### C. Comprehensive Relational Data Dictionary (9 Tables)

#### 1. Entity: `users`
Stores plantilla civil service personnel profiles linked to Keycloak authentication identities.
* Primary Key: `id`
* Unique Keys: `email`

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | Generated UUID | Primary Key. Unique identifier corresponding to Keycloak identity subject or Plantilla ID. |
| `full_name` | `VARCHAR(150)` | No | None | Complete civil service name and academic/professional titles (e.g. `Engr. Elmer B. Clemente`). |
| `email` | `VARCHAR(100)` | No | None | Unique official LGU institutional email address (`@santamaria.gov.ph`). |
| `password_hash`| `VARCHAR(255)` | Yes | NULL | Security hash placeholder (delegated to Keycloak IAM; never stored locally). |
| `role` | `VARCHAR(50)` | No | None | Plantilla Role Enum: `MAYOR`, `MUNICIPAL_ADMIN`, `ADMIN_OFFICER_V`, `SENIOR_RECORDS_OFFICER`, `INTAKE_CLERK`. |
| `department` | `VARCHAR(100)` | No | None | Assigned municipal department or bureau (e.g. `Office of the Municipal Administrator`). |
| `title` | `VARCHAR(100)` | No | None | Official Plantilla position title (e.g. `Municipal Administrator`). |
| `is_active` | `BOOLEAN` | No | `true` | Active civil service employment flag. Deactivation disables system login. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Account creation timestamp in Philippine Standard Time (PST). |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Profile record modification timestamp in Philippine Standard Time (PST). |

#### 2. Entity: `documents`
The central docket ledger tracking municipal correspondence, applications, and executive issuances.
* Primary Key: `id`
* Unique Keys: `control_number`
* Foreign Keys: `assigned_to_user_id` -> `users(id)`, `created_by_user_id` -> `users(id)`

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | Generated UUID | Primary Key. Global unique identifier for the document docket. |
| `control_number`| `VARCHAR(50)`| No | None | Unique municipal control number conforming to formula `[TYPE]-[YEAR]-[SEQ]` (e.g. `TO-2026-0042`). |
| `type` | `VARCHAR(50)` | No | None | Document Type Enum (14 types): `TRAVEL_ORDER`, `EXECUTIVE_ORDER`, `INDORSEMENT`, `VENUE_REQUEST`, etc. |
| `category` | `VARCHAR(50)` | No | None | Category Enum: `ADMINISTRATIVE`, `LEGISLATIVE`, `EXECUTIVE`, `LEGAL`, `FINANCIAL`, `PERSONNEL`, `PUBLIC_AFFAIRS`. |
| `title` | `VARCHAR(255)` | No | None | Concise narrative subject matter or official docket title. |
| `requesting_party`| `VARCHAR(150)`| No | None | Constituent, corporate entity, or internal employee initiating the request. |
| `origin_office`| `VARCHAR(100)`| No | None | Originating municipal department, barangay council, or national bureau. |
| `date_received`| `TIMESTAMPTZ` | No | `NOW()` | Formal timestamp of intake at the Central Receiving Desk (PST). |
| `assigned_to_user_id`| `VARCHAR(36)`| Yes | NULL | FK to `users(id)`. Assigned action officer or legal counsel. |
| `status` | `VARCHAR(30)` | No | `'RECEIVED'` | Status Enum: `RECEIVED`, `SCREENING`, `PREPARATION`, `REVIEW`, `APPROVED`, `ENDORSED`, `DENIED`, `TRANSMITTED`, `CLOSED`. |
| `priority` | `VARCHAR(20)` | No | `'NORMAL'` | Priority Enum: `NORMAL`, `HIGH`, `URGENT`. |
| `sla_deadline` | `TIMESTAMPTZ` | No | None | Statutory deadline under RA 11032 (calculated as 72 business hours from intake). |
| `is_overdue` | `BOOLEAN` | No | `false` | SLA escalation flag; set to `true` when current time exceeds `sla_deadline`. |
| `denial_reason`| `TEXT` | Yes | NULL | Mandatory written administrative/legal justification if status is `DENIED`. |
| `endorsement_notes`| `TEXT` | Yes | NULL | Executive instructions or routing directives if status is `ENDORSED`. |
| `created_by_user_id`| `VARCHAR(36)`| No | None | FK to `users(id)`. Identification of the receiving clerk who logged the docket. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Docket registration timestamp in Philippine Standard Time. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Record modification timestamp in Philippine Standard Time. |

#### 3. Entity: `attachments`
Stores uploaded scans, camera captures, supporting affidavits, and digital annexes.
* Primary Key: `id`
* Foreign Keys: `document_id` -> `documents(id)` ON DELETE CASCADE, `uploaded_by_user_id` -> `users(id)`

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | Generated UUID | Primary Key. Unique identifier for the attachment record. |
| `document_id` | `VARCHAR(36)` | No | None | Foreign Key referencing parent docket `documents(id)`. |
| `file_name` | `VARCHAR(255)` | No | None | Original filename of the uploaded attachment (e.g. `scanned_travel_order.pdf`). |
| `file_url` | `TEXT` | No | None | Object storage URL, MinIO path, or persistent base64 data URI. |
| `file_size` | `BIGINT` | No | None | Exact file payload size in bytes. |
| `file_type` | `VARCHAR(100)` | No | None | Verified MIME type (`application/pdf`, `image/png`, `image/jpeg`, etc.). |
| `uploaded_by_user_id`| `VARCHAR(36)`| No | None | Foreign Key referencing uploader `users(id)`. |
| `uploaded_at` | `TIMESTAMPTZ` | No | `NOW()` | Upload timestamp in Philippine Standard Time. |

#### 4. Entity: `transmissions`
Tracks outward dispatches, external recipients, delivery channels, and proof of receipt.
* Primary Key: `id`
* Unique Keys: `document_id` (1:1 relationship with parent document)
* Foreign Keys: `document_id` -> `documents(id)` ON DELETE CASCADE

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | Generated UUID | Primary Key. Unique transmittal record identifier. |
| `document_id` | `VARCHAR(36)` | No | None | Foreign Key referencing parent docket `documents(id)`. Unique (1:1 constraint). |
| `transmitted_date`| `TIMESTAMPTZ` | No | `NOW()` | Formal timestamp of physical or digital dispatch release. |
| `transmitted_to_office`| `VARCHAR(150)`| No | None | Target receiving bureau, municipal office, or external agency. |
| `recipient_name`| `VARCHAR(150)` | No | None | Designated recipient officer or constituent name. |
| `received_by` | `VARCHAR(150)` | Yes | NULL | Name of the receiving clerk or recipient who acknowledged delivery. |
| `method` | `VARCHAR(50)` | No | None | Dispatch Channel Enum: `PHYSICAL_COURIER`, `IN_PERSON_PICKUP`, `OFFICIAL_EMAIL`, `PORTAL_DISPATCH`. |
| `proof_document_url`| `TEXT` | Yes | NULL | Storage URL or data URI of the scanned signed delivery receipt slip. |
| `notes` | `TEXT` | Yes | NULL | Routing directives, courier tracking numbers, or dispatch observations. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Record registration timestamp in Philippine Standard Time. |

#### 5. Entity: `venues`
Maintains the inventory of the six (6) official municipal facilities managed by the Administrator.
* Primary Key: `id`
* Unique Keys: `code`

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(20)` | No | None | Primary Key. Alphanumeric facility identifier (e.g. `CONF_ROOM_MAIN`). |
| `code` | `VARCHAR(30)` | No | None | Unique facility code (`CR-01`, `CC-01`, `SH-01`, `GYM-01`, `MCR-01`, `MAO-01`). |
| `name` | `VARCHAR(100)` | No | None | Official display title of the municipal venue. |
| `location` | `VARCHAR(150)` | No | None | Physical location description (building name, floor, or wing). |
| `capacity` | `INTEGER` | No | None | Maximum legal seating capacity for fire and safety compliance. |
| `is_active` | `BOOLEAN` | No | `true` | Facility operational status. |

#### 6. Entity: `event_bookings`
Manages calendar reservations, start and end times, and conflict validation across venues.
* Primary Key: `id`
* Foreign Keys: `venue_id` -> `venues(id)`, `created_by_user_id` -> `users(id)`

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | Generated UUID | Primary Key. Unique booking identifier. |
| `venue_id` | `VARCHAR(20)` | No | None | Foreign Key referencing booked facility `venues(id)`. |
| `title` | `VARCHAR(200)` | No | None | Official title, purpose, or agenda of the meeting or civic function. |
| `organizer` | `VARCHAR(150)` | No | None | Organizing committee, department head, or external requesting party. |
| `department` | `VARCHAR(100)` | No | None | Responsible municipal department coordinating logistics. |
| `booking_date` | `DATE` | No | None | Calendar date of the scheduled event. |
| `start_time` | `TIME` | No | None | Scheduled start time block. |
| `end_time` | `TIME` | No | None | Scheduled conclusion time block. |
| `involves_mayor`| `BOOLEAN` | No | `false` | Mayoral Gavel Flag: indicates personal attendance/presidency by the Mayor. |
| `involves_admin`| `BOOLEAN` | No | `false` | Indicates mandatory presence of the Municipal Administrator. |
| `status` | `VARCHAR(20)` | No | `'CONFIRMED'` | Booking Status Enum: `CONFIRMED`, `TENTATIVE`, `CANCELLED`. |
| `notes` | `TEXT` | Yes | NULL | Audio-visual equipment requirements, catering arrangements, or security notes. |
| `created_by_user_id`| `VARCHAR(36)`| No | None | Foreign Key referencing booking officer `users(id)`. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Booking registration timestamp. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Modification timestamp. |

#### 7. Entity: `event_attendees`
Tracks participating plantilla officers, department heads, and dignitaries for booked events.
* Primary Key: `id`
* Foreign Keys: `event_id` -> `event_bookings(id)` ON DELETE CASCADE

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | Generated UUID | Primary Key. Attendee entry identifier. |
| `event_id` | `VARCHAR(36)` | No | None | Foreign Key referencing parent booking `event_bookings(id)`. |
| `full_name` | `VARCHAR(150)` | No | None | Full civil service name of the participant or presiding dignitary. |
| `role_title` | `VARCHAR(100)` | No | None | Position title or civic representation designation. |

#### 8. Entity: `audit_logs`
The immutable, append-only custody ledger recording all system mutations (RA 10175).
* Primary Key: `id`
* Foreign Keys: `document_id` -> `documents(id)` (optional), `event_id` -> `event_bookings(id)` (optional), `user_id` -> `users(id)`

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | Generated UUID | Primary Key. Unique audit log entry identifier. |
| `document_id` | `VARCHAR(36)` | Yes | NULL | Optional FK referencing affected docket `documents(id)`. |
| `event_id` | `VARCHAR(36)` | Yes | NULL | Optional FK referencing affected calendar reservation `event_bookings(id)`. |
| `action` | `VARCHAR(50)` | No | None | Action Enum: `RECEIVED`, `SCREENED`, `PREPARED`, `REVIEWED`, `APPROVED`, `ENDORSED`, `DENIED`, `TRANSMITTED`, `ARCHIVED`, `SCHEDULED_EVENT`, `UPDATED`. |
| `user_id` | `VARCHAR(36)` | No | None | Foreign Key referencing acting civil servant `users(id)`. |
| `user_name` | `VARCHAR(150)` | No | None | Immutable snapshot of the actor's full name at the time of execution. |
| `user_role` | `VARCHAR(50)` | No | None | Immutable snapshot of the actor's plantilla role at execution time. |
| `timestamp` | `TIMESTAMPTZ` | No | `NOW()` | Precise cryptographic timestamp in Philippine Standard Time. |
| `details` | `TEXT` | No | None | Narrative description of the transaction particulars and status mutation. |
| `hash_checksum`| `VARCHAR(64)` | No | None | SHA-256 cryptographic fingerprint verifying data non-repudiation. |

#### 9. Entity: `document_templates`
Houses structured drafting templates and standardized schemas for official municipal issuances.
* Primary Key: `id`
* Unique Keys: `code`

| Column Name | Data Type | Nullable | Default | Constraints & Statutory Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | Generated UUID | Primary Key. Template identifier. |
| `code` | `VARCHAR(50)` | No | None | Unique template code (e.g. `TO-LGU-2026`, `EO-MAYOR-2026`, `IND-SB-2026`). |
| `title` | `VARCHAR(150)` | No | None | Official municipal title of the drafting template. |
| `category` | `VARCHAR(50)` | No | None | Target document category classification. |
| `description` | `TEXT` | Yes | NULL | Statutory purpose, legal references, and drafting instructions. |
| `template_body_schema`| `JSONB` | No | None | Structured JSON/XSD schema defining dynamic input fields and letterhead sections. |
| `is_active` | `BOOLEAN` | No | `true` | Availability status for drafting officers. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Registration timestamp. |

### D. Cardinality and Referential Integrity Rules
1. **`users` to `documents` (1:N):** One civil service user can log many intake dockets (`created_by_user_id`) and act as the assigned action officer for many dockets (`assigned_to_user_id`).
2. **`documents` to `attachments` (1:N):** A single municipal docket contains one or more uploaded attachments and camera scans. Deleting a parent document cascades to remove associated attachment records.
3. **`documents` to `transmissions` (1:0..1):** A concluded document has at most one primary outward transmission record, ensuring tight 1:1 transmittal tracking with signed proof.
4. **`venues` to `event_bookings` (1:N):** One municipal venue hosts multiple scheduled reservations over calendar time, but each booking reserves exactly one venue.
5. **`event_bookings` to `event_attendees` (1:N):** A scheduled booking tags multiple confirmed plantilla attendees.
6. **`users` and `documents` to `audit_logs` (1:N):** All system mutations generate append-only audit entries linked to acting users and affected records. Referential integrity prevents hard-deletion of referenced users to maintain permanent historical accountability.

---
<div style="page-break-after: always;"></div>
"""

print("Part 2 text ready.")
