# Municipality of Santa Maria, Bulacan
## Document Tracking and Scheduling System (DocSys v2.6)
### Comprehensive Technical Architecture, Project Brief Synthesis, and Production Implementation Context

---

## 1. Executive Summary and Statutory Mandate

The Santa Maria Document Tracking and Scheduling System (DocSys) is an enterprise civil service management platform engineered for the Office of the Municipal Administrator, Local Government Unit (LGU) of Santa Maria, Province of Bulacan, Republic of the Philippines.

DocSys automates the end-to-end lifecycle of municipal dockets, administrative communications, executive issuances, and municipal facility scheduling across all executive departments. The platform enforces strict regulatory compliance under Philippine national statutory frameworks:

1. **Republic Act No. 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018):**
   Mandates strict compliance with Citizen's Charter standards. All incoming simple administrative transactions are locked to a seventy-two (72) business hour Service Level Agreement (SLA) processing window from the exact timestamp of intake. Automated SLA countdown monitors flag impending expirations and log overdue status to prevent bureaucratic delay.

2. **Republic Act No. 10173 (Data Privacy Act of 2012):**
   Governs confidential handling of constituent identities, real property records, personal contact data, and executive endorsements. Role-Based Access Control (RBAC) restricts sensitive document viewing strictly to authorized Plantilla personnel.

3. **Republic Act No. 10175 (Cybercrime Prevention Act of 2012):**
   Mandates comprehensive non-repudiation and immutable transaction logging. Every action (intake, screening, endorsement, status change, physical transmittal, and facility reservation) creates an unalterable audit log entry containing the user ID, timestamp, IP context, and docket metadata.

4. **Republic Act No. 8491 (Flag and Heraldic Code of the Philippines):**
   Governs proper display, color fidelity, and placement of the Santa Maria Municipal Official Seal and the Bagong Pilipinas National Crest.

5. **DICT Philippine Government Web Template Standards (GWTS v25.3.3):**
   Mandates the official Republic of the Philippines Top Bar (GOVPH Masthead), Philippine Standard Time (PST) synchronization, high-contrast accessible color contrast ratios, and standardized municipal headers.

---

## 2. Synthesis of Project Brief Specifications (Sentinail Alignment)

The platform incorporates and implements all requirements specified in the official Project Brief prepared by the Municipal Administrator's Office:

### Official Institutional Signatories and Personas
* **Approved By:** **ENGR. ELMER B. CLEMENTE** - Municipal Administrator (`admin@santamaria.gov.ph` / `USR-001`). Role: `ADMINISTRATOR` (Approver). Full administrative authority; reviews, approves, endorses, or denies dockets; manages users, settings, and executive reports.
* **Noted By:** **BENITO C. FABIAN** - Executive Assistant II (`ea.fabian@santamaria.gov.ph` / `USR-002`). Role: `EXECUTIVE_ASSISTANT` (Approver). Secondary executive review; endorsements; approvals and denials; dashboard access.
* **Prepared By:** **SHERELYN O. LIBAO** - Administrative Officer IV / Records Custodian (`records.slibao@santamaria.gov.ph` / `USR-004`). Role: `CLERK_ENCODER`. Central Receiving Desk intake officer; logs incoming documents, operates the high-speed scanner and document feeder, tags records, handles physical transmissions, and coordinates venue reservations.
* **Executive Authority:** **HON. BARTOLOME** - Municipal Mayor (`mayor@santamaria.gov.ph` / `USR-003`). Role: `ADMINISTRATOR` (Approver). Executive approvals on Executive Orders, sisterhood pacts, and town-wide policies.
* **Drafting Officer:** **OFFICER J. GARCIA** - Administrative Officer IV (`jgarcia@santamaria.gov.ph`). Role: `OFFICER` (Preparer). Prepares drafts for Executive Orders, Travel Orders, SB Endorsements, and Certifications.
* **Legal Counsel:** **ATTY. RODRIGO RAMOS** - Senior Legal Officer (`legal@santamaria.gov.ph`). Role: `OFFICER`. Reviews municipal contracts, MOAs, and prepares formal Legal Opinions.

### Institutional Contact and Headquarters
* **Physical Address:** Poblacion, Santa Maria, Bulacan, 3022
* **Official Institutional Email:** `smb.maoffice@gmail.com`

---

## 3. Real Document Scanning and Digital Dossier Engine

All placeholder simulations, fake timeout delays, and static dummy attachments have been completely eliminated. The intake and viewing modules operate on authentic browser and hardware APIs:

### 1. Live Camera Document Scanner (`DocumentScanner.tsx`)
* **Hardware Integration:** Employs HTML5 `navigator.mediaDevices.getUserMedia` targeting high-resolution rear or document-stand cameras (`facingMode: 'environment'`).
* **Viewfinder Overlay:** Features an authentic A4 scanner alignment box with corner target brackets and aspect ratio guidelines.
* **Direct Frame Capture:** Snaps video frames to an off-screen HTML5 `<canvas>`, encodes them as high-quality JPEG Data URLs, and compiles multi-page records.
* **Multi-Page Dossier Support:** Supports capturing Page 1, Page 2, Page 3, and subsequent annexes in real time. Scanned page thumbnails allow instant full-size lightbox inspection, page re-ordering, and removal.
* **Graceful Hardware Fallback:** If camera access is denied or unavailable on the workstation, the component presents a clear diagnostic message and directs the officer to the direct file upload feeder.

### 2. Direct File Upload Feeder & Drag-and-Drop
* **Multi-Format Processing:** Supports direct drag-and-drop or file browsing for PDF, JPG, PNG, WEBP, and DOCX files.
* **Real File Reading:** Uses the JavaScript `FileReader` API (`readAsDataURL`) to parse actual files from the local workstation into memory and local persistence.
* **Exact Metadata Calculation:** Real-time extraction of file names, MIME types, and exact byte sizes formatted as KB or MB.
* **Instant Inline Lightbox Preview:** Dedicated viewer supporting both multi-page PDF rendering via sandboxed iframes and image rendering with zoom and print controls.
* **Local Workstation Download:** Every uploaded attachment and captured scan features a direct download action allowing personnel to export the exact original file.

### 3. Outgoing Transmission Proof of Delivery Upload
* During Step 5 (Transmission & Dispatch), the dispatch officer can upload an actual photo or scanned copy of the signed physical transmittal receipt. The receipt image is attached to the docket's transmission record and viewable in the audit trail.

---

## 4. Complete 14 Document Types Coverage

Per Section 5 of the Project Brief, DocSys manages 14 distinct official document types, each configured with specific control number prefixes, color metadata, and statutory workflows:

| No. | Document Type | Control Prefix | Category | Primary Workflow Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Incoming Requests** | `IN-2026-XXXX` | `OTHER` | General letters, constituent petitions, and administrative requests. |
| 2 | **Travel Orders** | `TO-2026-XXXX` | `OTHER` | Official travel authorizations under EO 77 with per diem appropriation. |
| 3 | **Venue Requests** | `VR-2026-XXXX` | `OTHER` | Applications for use of municipal facilities, sound systems, and halls. |
| 4 | **Vehicle Requests** | `VH-2026-XXXX` | `OTHER` | Dispatch authorizations for municipal service vehicles and ambulances. |
| 5 | **Food Requests** | `FD-2026-XXXX` | `OTHER` | Catering and food support requests for official municipal functions. |
| 6 | **Overtime Requests** | `OT-2026-XXXX` | `OTHER` | Overtime work authorities compliant with CSC and COA regulations. |
| 7 | **Executive Orders** | `EO-2026-XXXX` | `EXEC_ORDER` | Official directives and municipal policies promulgated by the Mayor. |
| 8 | **Contracts & Agreements** | `CA-2026-XXXX` | `CONTRACT` | Municipal contracts, Memoranda of Agreement (MOA), and civil deeds. |
| 9 | **SB Endorsements** | `SB-2026-XXXX` | `SB_ENDORSEMENT` | Executive referrals transmitted to the Sangguniang Bayan for ordinance. |
| 10 | **Memorandum Orders** | `MO-2026-XXXX` | `MEMO_ORDER` | Internal directives from the Administrator or Mayor to offices. |
| 11 | **Certifications & Permits**| `CP-2026-XXXX` | `CERTIFICATION` | Mayor's clearances, special event permits, and parade authorizations. |
| 12 | **Legal Advice & Opinions** | `LA-2026-XXXX` | `LEGAL_ADVICE` | Legal opinions and contractual reviews endorsed to Legal Counsel. |
| 13 | **National Agency Comm.** | `NAT-2026-XXXX` | `COMM_LETTER` | Requests for national project funding and agency coordination. |
| 14 | **Endorsement Letters** | `EL-2026-XXXX` | `WORK_ENDORSEMENT`| Official recommendations for employment, financial, or medical relief. |

---

## 5. End-to-End Six-Step Document Workflow

DocSys faithfully operationalizes the six sequential steps mandated by the Municipal Administrator's Office:

```
[ Step 1: Reception & Intake ]
   - Physical logbook synchronization
   - Automated control number stamping
   - Real-time document scanning (camera/feeder) & digital annex upload
                |
                v
[ Step 2: Initial Screening ]
   - Completeness audit of annexes, proper addressee, and authorized signatures
   - Incomplete: Formally returned to client with specified grounds
   - Complete: Advanced to drafting queue
                |
                v
[ Step 3: Document Preparation ]
   - Officer drafts necessary orders, endorsements, or permits in the Drafting Studio
   - Live Santa Maria letterhead preview and DICT GWTS formatting
                |
                v
[ Step 4: Executive Review & Approval ]
   - Municipal Administrator / Executive Assistant II / Mayor review queue
   - Three actionable outcomes: Approve, Endorse to SB/Offices, or Deny with mandatory grounds
                |
                v
[ Step 5: Transmission & Notification ]
   - Dispatch to requesting party or receiving office
   - Recording of recipient name, office, and signed physical receipt proof
                |
                v
[ Step 6: Completion & Archiving ]
   - Transaction marked as Closed
   - Final signed records permanently stored in searchable registry
```

---

## 6. Centralized Meeting and Venue Scheduling Suite

To prevent scheduling conflicts across municipal operations, DocSys provides an automated venue reservation engine covering six key municipal facilities:

1. **Municipal Conference Room:** Main Building 2nd Floor (Capacity: 35)
2. **Command Center Room:** Disaster Risk Reduction Building Ground Floor (Capacity: 20)
3. **Municipal Social Hall:** Legislative and Civic Center 3rd Floor (Capacity: 250)
4. **Municipal Gymnasium:** Santa Maria Sports Complex, Poblacion (Capacity: 1,200)
5. **Mayor's Conference Room:** Executive Wing, 2nd Floor (Capacity: 15)
6. **Administrator's Office:** Ground Floor, East Wing (Capacity: 12)

### Automated Conflict Detection
The scheduler validates booking dates, start times, and end times against existing confirmed reservations. Overlapping requests prompt an immediate conflict advisory, allowing the applicant to record the reservation as `TENTATIVE` pending executive coordination. Executive attendance flags (`involvesMayor`, `involvesAdmin`) tag high-priority municipal proceedings.

---

## 7. Interactive Document Drafting Studio (`PrepareView.tsx`)

The document drafting module provides an interactive canvas:
* **Statutory Template Library:** Pre-configured with official templates for Travel Orders, Executive Orders, SB 1st Indorsements, Administrative Memos, Mayor's Permits, and Endorsement Letters.
* **Live Stamped Letterhead Preview:** Real-time formatting incorporating the official Santa Maria municipal header, institutional address, DICT GWTS validation badge, and the Municipal Administrator's signature block.
* **Direct Docket Submission:** Saving a draft creates an authentic `DocumentRecord` in `status: 'REVIEW'` placed directly into the Municipal Administrator's approval queue.
* **Print Letterhead Action:** Browser print styling formats the draft as clean civil service parchment ready for executive physical signing.

---

## 8. Database Architecture: Azure PostgreSQL Flexible Server

A dedicated PostgreSQL database has been provisioned and seeded in Microsoft Azure under an Azure for Students subscription:

* **Server FQDN:** `santamaria-docsys-db.postgres.database.azure.com`
* **Port:** `5432`
* **Compute SKU:** Burstable Tier (`Standard_B1ms` - 1 vCore, 2 GiB RAM, 32 GiB Premium SSD)
* **Location:** Southeast Asia (`southeastasia`)
* **Resource Group:** `rg-santamaria-docsys`
* **Database Name:** `postgres`
* **Admin User:** `docsysadmin`
* **SSL Requirement:** SSL/TLS 1.2+ enforced (`rejectUnauthorized: false`)

### Relational Schema (9 Relational Tables)
1. **`users`:** Plantilla officers and personnel with role-based access control.
2. **`documents`:** Core municipal docket registry with SLA tracking and status transitions.
3. **`attachments`:** Scanned letters, annexes, and supporting affidavits with binary Data URLs.
4. **`transmissions`:** Physical release chain of custody and signed delivery receipts.
5. **`venues`:** Municipal facility capacity, location, and equipment records.
6. **`event_bookings`:** Calendar reservations with Mayor/Admin attendance indicators.
7. **`event_attendees`:** Participating offices and civic attendees.
8. **`audit_logs`:** Permanent ledger recording all user interactions (RA 10175).
9. **`document_templates`:** Standard municipal form structures.

---

## 9. Design System and Visual Standards (design.md Compliance)

The user interface adheres strictly to the governance rules set forth in `design.md`:

### Core Aesthetic Principles
* **Zero Emojis Policy:** No emojis are permitted anywhere within the application interface, code comments, notifications, or documentation. All visual indications use standard Lucide SVG icons styled with municipal heraldic tones.
* **Zero Em-Dashes Policy:** Em-dashes and en-dashes are excluded across all system labels, titles, and generated letterheads. Punctuation relies on commas, parentheses, colons, or standard hyphens.
* **Neutral, Professional Tonal Range:** The design avoids bright, aggressive red or orange alert colors to prevent visual panic and maintain an official civil service aesthetic ("make it look normal"). Critical alerts and overdue indicators use understated crimson borders (`#DC2626` or `#B91C1C`) paired with neutral backgrounds (`#FEF2F2`) and muted slate typography.
* **Fluid Animation Easing:** All transitions, side drawer toggles, and modal dialogues employ high-performance CSS fluid easing curves (`cubic-bezier(0.16, 1, 0.3, 1)`) for a polished desktop and mobile experience.
* **Dual Seal Branding:** The header prominently displays the Official Seal of the Municipality of Santa Maria alongside the Bagong Pilipinas national crest.

### Heraldic Palette Tokens
* **Municipal Forest Green (`#15803D`, `#166534`, `#14532D`):** Primary branding color symbolizing agricultural heritage, public service, and official approvals.
* **Government Deep Navy (`#081E36`, `#0B2545`):** Structural masthead and high-level navigation background representing state authority and statutory solemnity.
* **Neutral Slate Surfaces (`#F8FAFC`, `#F1F5F9`, `#E2E8F0`):** Crisp, readable canvas backgrounds mimicking clean civil service parchment.
* **Border Definition (`#CBD5E1`, `#94A3B8`):** Restrained dividers maintaining clear tabular structure without visual clutter.
* **Civil Service Typography:** Inter and System UI sans-serif fonts set to high legibility weights (400, 500, 600, 700).

---

## 10. Application Route Matrix

The application features 16 fully generated static routes ensuring zero dead clicks:

| Route Path | View / Module Name | Primary Functions |
| :--- | :--- | :--- |
| `/login` | Civil Service Authentication Portal | Official role-based login, legal disclosures, and persona test switcher. |
| `/` | System Landing / Root Redirect | Directs authenticated civil servants to the executive dashboard. |
| `/dashboard` | Executive Dashboard | 72-hour SLA overview, pending approvals, status statistics, and daily calendar. |
| `/incoming` | Central Intake and Reception | New docket logging, real camera scanner, file upload feeder, and screening checklist. |
| `/review` | Administrator Approval Queue | Executive review, endorsement generation, formal denial with logged reasons. |
| `/prepare` | Drafting and Action Studio | Travel Order preparation, Executive Order drafting, and template population. |
| `/transmit` | Physical Document Transmittal | Recording recipient office, delivery confirmation, and release routing. |
| `/schedule` | Municipal Calendar and Venue Booking | Conflict-free room booking, attendance flags, and calendar agenda view. |
| `/archive` | Docket Registry and Archive | Searchable historical records, filter by document type, requester, and date range. |
| `/reports` | Civil Service Compliance Analytics | SLA delivery performance, volume metrics, and RA 11032 compliance rates. |
| `/admin` | System Administration and Audit Trail | User roster management, permission tiers, and immutable audit logs. |

---

## 11. Production Hosting and Deployment

* **Live Production Application:** `https://kind-field-0061c5600.4.azurestaticapps.net`
* **Live Authentication Portal:** `https://kind-field-0061c5600.4.azurestaticapps.net/login`
* **Cloud Platform:** Azure Static Web Apps (Southeast Asia)
* **Backend Database:** Azure Database for PostgreSQL Flexible Server (`santamaria-docsys-db.postgres.database.azure.com`)
* **Source Code Repository:** `https://github.com/Samosinolouis/Maria_Bulacan_DocSys`

*Maintained under the authority of the Office of the Municipal Administrator, Municipality of Santa Maria, Bulacan.*
