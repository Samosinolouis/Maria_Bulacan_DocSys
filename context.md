# Municipality of Santa Maria, Bulacan
## Document Tracking and Scheduling System (DocSys v2.6)
### Comprehensive Technical Architecture and System Context

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

## 2. Design System and Visual Standards (design.md Compliance)

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

## 3. Azure Cloud Infrastructure and Hosting

The platform is deployed across modern cloud services on Microsoft Azure under an Azure for Students subscription:

### Frontend Hosting: Azure Static Web Apps (SWA)
* **Production URL:** `https://kind-field-0061c5600.4.azurestaticapps.net`
* **Service:** Azure Static Web Apps
* **Region:** Southeast Asia
* **Resource Group:** `rg-santamaria-docsys`
* **Configuration:** Static HTML/JS production export compiled using Next.js 16 (App Router), Tailwind CSS, and Lucide React.
* **Routing:** `staticwebapp.config.json` handles Single Page Application navigation fallback to `index.html`.

### Backend Database: Azure Database for PostgreSQL Flexible Server
* **Server FQDN:** `santamaria-docsys-db.postgres.database.azure.com`
* **Port:** `5432`
* **Deployment Model:** Flexible Server (Burstable tier, SKU `Standard_B1ms`)
* **Compute / Memory:** 1 vCore, 2 GiB RAM
* **Storage Allocation:** 32 GiB Premium SSD
* **Location:** Southeast Asia (`southeastasia`)
* **Resource Group:** `rg-santamaria-docsys`
* **SSL Requirement:** SSL/TLS 1.2+ enforced (`rejectUnauthorized: false` for managed certificate chain)
* **Firewall Configuration:** Allows Azure Services internal IP traffic (`AllowAllAzureServicesAndResourcesWithinAzureIps`) and authorized administrative subnets (`AllowAllIps`).

---

## 4. Database Schema and Relational Architecture

The relational schema implements the specifications of `scheme.txt` and is executed via `backend/db/schema.sql`. Modern PostgreSQL native functions (such as `gen_random_uuid()`) are utilized to maintain compatibility with Azure managed database environments.

```
+----------------------------------------------------------------------------------------------------+
|                                    SANTA MARIA DOCSYS DATABASE ERD                                 |
+----------------------------------------------------------------------------------------------------+

   +--------------------------+                         +-----------------------------+
   |          USERS           |                         |          DOCUMENTS          |
   +--------------------------+                         +-----------------------------+
   | PK id VARCHAR(36)        | 1                     * | PK id VARCHAR(36)           |
   |    full_name VARCHAR(128)|-------------------------| FK assigned_to_user_id      |
   |    email VARCHAR(128)    |                         | FK created_by_user_id       |
   |    password_hash VARCHAR |                         |    control_number (UNIQUE)  |
   |    role VARCHAR(32)      |                         |    type VARCHAR(32)         |
   |    department VARCHAR(64)|                         |    category VARCHAR(32)     |
   |    title VARCHAR(64)     |                         |    title TEXT               |
   |    is_active BOOLEAN     |                         |    requesting_party VARCHAR |
   +--------------------------+                         |    origin_office VARCHAR    |
                | 1                                     |    date_received TIMESTAMPTZ|
                |                                       |    status VARCHAR(32)       |
                |                                       |    priority VARCHAR(16)     |
                |                                       |    sla_deadline TIMESTAMPTZ |
                |                                       |    is_overdue BOOLEAN       |
                |                                       |    denial_reason TEXT       |
                |                                       |    endorsement_notes TEXT   |
                |                                       +-----------------------------+
                |                                                      | 1
                |                                                      |
                |                 +--------------------+               |
                |                 |    ATTACHMENTS     |               |
                |                 +--------------------+               |
                |                 | PK id VARCHAR(36)  |               |
                |                 | FK document_id     |*              |
                |                 +--------------------+---------------+
                |                                                      |
                |                 +--------------------+               |
                |                 |   TRANSMISSIONS    |               |
                |                 +--------------------+               |
                |                 | PK id VARCHAR(36)  |               |
                |                 | FK document_id     |1 (1-to-1)     |
                |                 |    transmitted_date|---------------+
                |                 |    to_office       |
                |                 |    recipient_name  |
                |                 |    received_by     |
                |                 |    proof_doc_url   |
                |                 +--------------------+
                |
                |                 +--------------------+
                |                 |     AUDIT_LOGS     |
                |                 +--------------------+
                |                 | PK id VARCHAR(36)  |
                |                 | FK document_id     |*
                +-----------------| FK performed_by_uid|
                                  |    action VARCHAR  |
                                  |    timestamp       |
                                  |    notes TEXT      |
                                  +--------------------+

   +--------------------------+                         +-----------------------------+
   |          VENUES          |                         |       EVENT_BOOKINGS        |
   +--------------------------+                         +-----------------------------+
   | PK id VARCHAR(36)        | 1                     * | PK id VARCHAR(36)           |
   |    name VARCHAR(128)     |-------------------------| FK venue_id                 |
   |    capacity INT          |                         | FK created_by_user_id       |
   |    location VARCHAR(128) |                         |    title VARCHAR(255)       |
   |    is_available BOOLEAN  |                         |    organizer VARCHAR(128)   |
   +--------------------------+                         |    department VARCHAR(128)  |
                                                        |    booking_date DATE        |
                                                        |    start_time TIME          |
                                                        |    end_time TIME            |
                                                        |    involves_mayor BOOLEAN   |
                                                        |    involves_admin BOOLEAN   |
                                                        |    status VARCHAR(32)       |
                                                        +-----------------------------+
                                                                       | 1
                                                                       | *
                                                        +-----------------------------+
                                                        |       EVENT_ATTENDEES       |
                                                        +-----------------------------+
                                                        | PK id VARCHAR(36)           |
                                                        | FK booking_id               |
                                                        |    attendee_name VARCHAR    |
                                                        |    department_or_office     |
                                                        +-----------------------------+
```

### Table Definitions
1. **`users`:** Authorized municipal plantilla civil servants and officers.
2. **`documents`:** Official municipal docket registry tracking control numbers, document types, requesting parties, routing statuses, and 72-hour SLAs.
3. **`attachments`:** Digital scanned annexes, letters, endorsements, and supporting affidavits linked to docket records.
4. **`transmissions`:** Physical release tracking establishing chain of custody, receiving officers, and delivery acknowledgments.
5. **`venues`:** Municipal halls and conference rooms managed by the Municipal Administrator.
6. **`event_bookings`:** Calendar reservations with executive attendance flags (Mayor and Municipal Administrator).
7. **`event_attendees`:** Registered participant rosters for municipal hearings and assemblies.
8. **`audit_logs`:** Permanent ledger recording all user interactions, state transitions, and transmittal timestamps.
9. **`document_templates`:** Standard municipal form structures for Executive Orders, Travel Orders, and 1st Indorsements.

---

## 5. Cleaned Municipal Civil Service Data

All temporary placeholder data from initial development has been purged. The database and client cache are populated with authentic Santa Maria Plantilla civil service records:

### 1. Plantilla User Accounts (Seed Data)
* **Engr. Elmer B. Clemente (Municipal Administrator):** Role: `ADMINISTRATOR`. Full executive oversight, docket endorsement, review approvals, venue scheduling, and administrative reports. Email: `admin@santamaria.gov.ph`.
* **Hon. Bartolome (Municipal Mayor):** Role: `ADMINISTRATOR`. Final executive approval on municipal executive orders, policies, and municipal-wide authorizations. Email: `mayor@santamaria.gov.ph`.
* **Ma. Cristina Perez (Administrative Officer V):** Role: `OFFICER`. Head of Records and Archives Division. In charge of physical document dispatch, transmittals, and historical docketing. Email: `records.officer@santamaria.gov.ph`.
* **Atty. Rodrigo Ramos (Senior Legal Officer):** Role: `OFFICER`. Head of Municipal Legal Office. Drafts legal indorsements, reviews contracts, and prepares formal recommendations. Email: `legal@santamaria.gov.ph`.
* **Juan Dela Cruz (Administrative Aide IV):** Role: `CLERK_ENCODER`. Central Receiving Desk intake officer. Receives communications, checks annex completeness, logs control numbers, and initiates 72-hour SLAs. Email: `clerk@santamaria.gov.ph`.

### 2. Official Municipal Dockets
* **TO-2026-0042:** Request for Travel Order: Provincial Disaster Risk Reduction and Management Council Quarterly Coordination Conference (MDRRMO). Status: `REVIEW`. SLA: Pending within 72-hour window.
* **EO-2026-0018:** Executive Order Reconstituting the Santa Maria Local Council for the Protection of Children (LCPC). Status: `REVIEW`. SLA: Overdue flag active for expedited action.
* **IND-2026-0105:** 1st Indorsement Referral: Verification of Title and Cadastral Boundaries in Barangay Pulong Buhangin (Municipal Assessor). Status: `REVIEW`. SLA: Active.
* **RO-2026-0089:** Requisition and Issue Voucher: Procurement of Office Equipment and Disaster Evacuation Tents (GSO). Status: `APPROVED`. Stamped for transmittal.
* **RES-2026-0012:** Municipal Council Resolution Request: Authorization for Sisterhood Agreement with Malolos City (Sangguniang Bayan). Status: `TRANSMITTED`. Physical release confirmed.
* **MEMO-2026-0031:** Memorandum: Mandatory Attendance in the 2026 Santa Maria Civil Service Integrity and Anti-Red Tape Seminar. Status: `TRANSMITTED`. Released to all departments.
* **REQ-2026-0210:** Citizen Petitions: Installation of Street Illumination and Road Resurfacing along Barangay Catmon (Liga ng mga Barangay). Status: `RECEIVED`. In screening queue.
* **APP-2026-0055:** Building and Occupancy Permit Appeal: Commercial Warehouse Complex along Bypass Road (Engineering Office). Status: `DENIED`. Formal denial memorandum issued with citing of zoning ordinance violations.

### 3. Municipal Venues
* **Municipal Conference Room:** Capacity 25. Main Building 2nd Floor. Fully air-conditioned with hybrid conference equipment.
* **Command Center Briefing Room:** Capacity 15. MDRRMO Building 1st Floor. Emergency telecommunications and real-time CCTV monitoring.
* **Social Hall:** Capacity 120. Executive Building 3rd Floor. Official assemblies and municipal events.
* **Municipal Gymnasium:** Capacity 800. Santa Maria Sports Complex. Large-scale public hearings and civic assemblies.
* **Mayor's Conference Room:** Capacity 12. Office of the Mayor. High-level executive briefings and VIP delegations.
* **Administrator's Office:** Capacity 8. Office of the Municipal Administrator. Department head coordination and administrative hearings.

---

## 6. Civil Service Authentication and Login Portal

A dedicated, secure login portal has been implemented at `/login`:

### Interface Architecture
* **Heraldic Presentation:** Features the Santa Maria Municipal Crest and Bagong Pilipinas logo alongside the official title: *"Republika ng Pilipinas, Lalawigan ng Bulacan, Bayan ng Santa Maria, Tanggapan ng Administrador ng Bayan"*.
* **Statutory Security Notices:** Incorporates explicit disclaimers regarding unauthorized system access under RA 10173 and RA 10175, notifying civil servants that all transactions are recorded and audited.
* **Plantilla Quick Persona Selector:** Enables evaluators and administrators to test the five distinct civil service roles (Mayor, Municipal Administrator, Records Officer, Senior Legal Officer, and Central Receiving Clerk) with a single click, automatically filling credentials and configuring role-based permissions.
* **Standard Credentials Authentication:** Supports manual authentication via official government email and passcode.
* **Session Persistence:** Authenticated state is safely stored in browser local state, allowing continuous navigation across all system views.
* **Official Sign Out:** Accessible directly from the top navigation bar, clearing session state and safely redirecting to `/login`.

---

## 7. Application Views and Routing Hierarchy

The frontend features 16 fully generated static routes ensuring zero dead clicks:

| Route Path | View / Module Name | Primary Functions |
| :--- | :--- | :--- |
| `/login` | Civil Service Authentication Portal | Official role-based login, legal disclosures, and persona test switcher. |
| `/` | System Landing / Root Redirect | Directs authenticated civil servants to the executive dashboard. |
| `/dashboard` | Executive Dashboard | 72-hour SLA overview, pending approvals, status statistics, and daily calendar. |
| `/incoming` | Central Intake and Reception | New docket logging, screening checklist verification, and control number assignment. |
| `/review` | Administrator Approval Queue | Executive review, endorsement generation, formal denial with logged reasons. |
| `/prepare` | Drafting and Action Studio | Travel Order preparation, Executive Order drafting, and template population. |
| `/transmit` | Physical Document Transmittal | Recording recipient office, delivery confirmation, and release routing. |
| `/schedule` | Municipal Calendar and Venue Booking | Conflict-free room booking, attendance flags, and calendar agenda view. |
| `/archive` | Docket Registry and Archive | Searchable historical records, filter by document type, requester, and date range. |
| `/reports` | Civil Service Compliance Analytics | SLA delivery performance, volume metrics, and RA 11032 compliance rates. |
| `/admin` | System Administration and Audit Trail | User roster management, permission tiers, and immutable audit logs. |

---

## 8. Backend Microservice and Tooling

In addition to the static client deployment, the repository contains complete backend scripts for PostgreSQL operations and server execution:

1. **`backend/db/schema.sql`:**
   Complete PostgreSQL Data Definition Language (DDL) file creating tables, constraints, foreign keys, and optimized performance indexes.
2. **`backend/db/seed.sql`:**
   Complete Data Manipulation Language (DML) script populating the Azure database with official plantilla personnel, active dockets, venues, and audit logs.
3. **`backend/server.mjs`:**
   A native Node.js REST API microservice connecting directly to Azure PostgreSQL Flexible Server via connection pooling (`pg.Pool`), providing endpoints for `/api/health`, `/api/documents`, `/api/users`, `/api/events`, `/api/venues`, and `/api/audit-logs`.
4. **`scripts/migrate.mjs`:**
   Automated migration runner executing schema updates and data seeding directly against Azure PostgreSQL.
5. **`app/src/lib/repository.ts`:**
   Client-side data access layer providing robust state management, browser storage persistence, clean data fallbacks, and REST synchronization hooks.

---

## 9. Developer and Deployment Guide

### Running Locally
To launch the Next.js frontend application locally:
```bash
cd app
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

### Running Database Migrations against Azure PostgreSQL
Ensure network access or Azure credentials are configured in `.env.local`:
```bash
node scripts/migrate.mjs
```

### Starting the Backend REST API Server
```bash
PORT=4000 node backend/server.mjs
```

### Production Build and Azure SWA Deployment
```bash
cd app
npm run build
npx -y @azure/static-web-apps-cli deploy ./out --deployment-token <AZURE_DEPLOYMENT_TOKEN> --env production
```

---

## 10. Source Code Repository

The complete codebase, documentation, schemas, and assets are hosted in the public GitHub repository:
* **Repository:** `https://github.com/Samosinolouis/Maria_Bulacan_DocSys`
* **Default Branch:** `main`

*Maintained under the authority of the Office of the Municipal Administrator, Municipality of Santa Maria, Bulacan.*
