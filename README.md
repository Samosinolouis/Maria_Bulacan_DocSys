# Municipal Document Management and Statutory Operations System (DocSys v2.6)
### Office of the Municipal Administrator | Bayan ng Santa Maria, Bulacan

Official cloud-based civic document management, executive review, and venue scheduling system built in strict adherence to **Republic Act 11032** (Ease of Doing Business and 72-Hour Turnaround Mandate), **Republic Act 10173** (Data Privacy Act of 2012), and **DICT Government Web Tracking Standards (GWTS v25.3.3)**.

---

## Live Deployments and Repository

- **Azure Static Web Apps Production URL**: [https://kind-field-0061c5600.4.azurestaticapps.net](https://kind-field-0061c5600.4.azurestaticapps.net)
- **Official GitHub Repository**: [https://github.com/Samosinolouis/Maria_Bulacan_DocSys](https://github.com/Samosinolouis/Maria_Bulacan_DocSys)
- **Deployment Status**: Active and Verified
- **Entity Relationship Diagram (ERD)**: Defined in [`scheme.txt`](./scheme.txt)

---

## Features of the System

The Santa Maria Civic Document Management System (DocSys v2.6) automates the end-to-end statutory lifecycle of municipal records, correspondence, and venue logistics:

### 1. Executive Operations Command Center and Live ARTA SLA Radar
- **Live Civic Operations HUD**: High-density operational status cards tracking Registry Influx, Signature Desk queues, ARTA SLA compliance integrity, and active Venue Logistics.
- **Statutory ARTA Directive Alert**: Real-time escalation memorandum for any transaction approaching or exceeding the 72-hour turnaround threshold mandated by Section 21 of Republic Act 11032.
- **Municipal Docket Ledger Table**: Chronological registry of incoming and active municipal documents with real-time text filtering across control numbers, requesting parties, and originating departments.
- **Classification Balance Sheet**: Category distribution overview tracking Administrative, Legislative, Executive, Legal, Financial, Personnel, and Public Affairs dockets.

### 2. Statutory Reception and Screening Queue Subsystem
- **3-Step Intake Wizard**: Guided intake form validating document classification, metadata, attachments, and screening checklist commitments.
- **Automated Control Number Generator**: Produces standard municipal docket numbers conforming to the statutory formula `[TYPE]-[YEAR]-[SEQUENCE]` (e.g. `TO-2026-0042`, `EO-2026-0018`).
- **Completeness Screening Audit**: Frontline screening gate enforcing attachment presence, authorized signatures, and valid department addressing prior to executive review.

### 3. Official Document Preparation and Templating Studio
- **Standardized Civic Templates**: Pre-configured municipal templates including Travel Orders (`TO-LGU-2026`), Executive Orders (`EO-MAYOR-2026`), 1st Indorsements to Sangguniang Bayan (`IND-SB-2026`), Venue Clearance Forms (`VR-GSO-2026`), Overtime Authorizations (`OT-HRMO-2026`), and Legal Opinions (`LO-LEGAL-2026`).
- **Municipal Letterhead Framework**: Uniform institutional letterhead formatting with dual heraldic insignia (Official Seal of Santa Maria and Bagong Pilipinas).

### 4. Executive Signature and Endorsement Desk
- **Multi-Tiered Executive Queue**: Dedicated review desk for the Municipal Administrator and Municipal Mayor.
- **Actionable Decision Engine**: One-click workflows to Approve, Endorse with binding administrative directives, or Deny with mandatory written statutory justifications.
- **Priority Escalation Badging**: Visual indication of high-priority and urgent SLA dockets requiring immediate review.

### 5. Transmission Desk and Central Dispatch Queue
- **Outgoing Transmittal Management**: Tracking desk for approved executive orders, resolutions, and certifications ready for external delivery.
- **Dispatch Channel Attribution**: Logs delivery method (Physical Courier, In-Person Pickup, Official Email, or Government Portal) with recipient name and timestamp.
- **Proof of Receipt Archiving**: Verification tracking ensuring documented chain of custody upon dispatch.

### 6. Municipal Records Digital and Physical Archive
- **Concluded Transaction Repository**: Permanent storage of resolved, transmitted, and closed municipal dockets.
- **Dossier Retrieval Engine**: Instant search and retrieval of historical case files, transmittal notes, and complete document histories.

### 7. Central Municipal Gavel and Venue Scheduler
- **6 Municipal Venues Coverage**: Centralized booking calendar across:
  1. Municipal Conference Room (Capacity: 30)
  2. Sangguniang Bayan Session Hall (Capacity: 80)
  3. Municipal Gymnasium (Capacity: 1500)
  4. MDRRMO Command Center (Capacity: 25)
  5. Municipal Social Hall (Capacity: 200)
  6. Santa Maria Town Plaza Stage (Capacity: 500)
- **Double-Booking Prevention Engine**: Real-time conflict detection preventing overlapping reservations for identical venues and time slots.
- **Executive Gavel Indicators**: Identifies sessions presided over by the Municipal Mayor or requiring Municipal Administrator presence.

### 8. Statutory ARTA Compliance Ledger and Performance Analytics
- **RA 11032 Performance Metrics**: Continuous tracking of the statutory 72-hour turnaround mandate.
- **Key Performance Indicators**: Displays SLA success rates (94.8%), average municipal turnaround duration (1.4 days), and escalated overdue counts.
- **Category Processing Matrix**: Monthly breakdown of received, approved, denied, and archived records per civic classification.

### 9. Immutable Statutory Audit Trail and Custody Chain
- **Tamper-Evident Chronological Ledger**: Complete event ledger recording every document creation, screening, status mutation, endorsement, transmission, and archival event.
- **Accountability Attribution**: Records precise timestamps, operating user names, Civil Service roles, and narrative transaction particulars.
- **Cryptographic Checksum Standard**: Prepared for SHA-256 fingerprint verification of recorded transactions.

### 10. Official Docket Dossier and Printable Routing Slip
- **Interactive Dossier Modal**: Comprehensive tabbed view showing particulars, 6-stage lifecycle progress tracker (Screening, Preparation, Review, Approval, Transmission, Archival), attached documents, and related audit events.
- **Printable Physical Routing Slip**: Formatted to match physical LGU routing paper slips with official letterhead, control badges, action checklist, and signature blocks.

### 11. Role-Based Access Control and Persona Testing
- **Active Civil Service Personas**: Instant account switcher to evaluate permissions and workflows across:
  - **Engr. Elmer B. Clemente** (Municipal Administrator)
  - **Hon. Bartolome** (Municipal Mayor)
  - **Ma. Cristina Perez** (Administrative Officer V)
  - **Atty. Rodrigo Ramos** (Senior Records Officer)
  - **Juan Dela Cruz** (Intake Clerk)

### 12. Full Viewport Responsiveness
- **Multi-Device Compatibility**: Seamless layout across mobile smartphones (375px+), tablets (768px), and desktop workstations (1440px+).
- **Mobile Navigation Drawer**: Collapsible slide-out navigation drawer with backdrop overlay and quick route switching.
- **Overflow-Protected Tables**: Horizontal scroll wrappers on all data tables to preserve complete tabular data on small screens.

---

## System Sitemap and Route Descriptions

The table below outlines the primary routes, HTTP methods, access scopes, and functional descriptions of every module in the application:

| Route Path | View / Module Name | Primary Scope | Functional Description |
| :--- | :--- | :--- | :--- |
| `/` | Default Route | Public / Civil Service | Redirects directly to `/dashboard` to load the Executive Command Center. |
| `/dashboard` | Executive Command Center | Division I: Intake and Registry | Live operational overview, 4-cell operations HUD, overdue ARTA directive alert, category balance sheet, gavel dispatch preview, and searchable municipal docket ledger. |
| `/incoming` | Reception and Screening Queue | Division I: Intake and Registry | Frontline intake screening queue. Allows clerks to audit attachments, verify addressing, inspect physical substrates, and log new incoming dockets. |
| `/prepare` | Document Drafting Studio | Division II: Executive Review | Official template library for generating Travel Orders, Executive Orders, SB Indorsements, Venue Requests, and Overtime Authorizations. |
| `/review` | Signature and Endorsement Desk | Division II: Executive Review | Executive queue for the Municipal Administrator and Mayor. Enables approval, administrative indorsement, or denial with mandatory justifications. |
| `/transmit` | Transmission Desk | Division II: Executive Review | Outgoing transmittal queue for approved resolutions, certifications, and executive orders dispatched to requesting parties and exterior agencies. |
| `/archive` | Municipal Records Archive | Division II: Executive Review | Permanent digital repository for closed and concluded municipal transactions with instant dossier retrieval. |
| `/schedule` | Central Venue and Gavel Calendar | Division III: Logistics and Compliance | Comprehensive facility reservation system across all 6 municipal venues with conflict detection and gavel indicator tracking. |
| `/reports` | ARTA Compliance Ledger | Division III: Logistics and Compliance | Statutory compliance reporting under RA 11032, turnaround speed analytics, and monthly processing summary tables by statutory category. |
| `/settings` | Municipal Configuration Desk | Division IV: Configuration | Tabbed desk for document types, request types, venues, holidays, and shared-platform user and role administration against the permission catalog. |

### Modal Windows and Sub-Views

| Modal Identifier | Parent View | Invocation Trigger | Functional Description |
| :--- | :--- | :--- | :--- |
| **New Intake Modal** | Global / Header | "Intake" or "Log New Incoming" | 3-step wizard to classify, upload annexes, verify screening items, and assign control numbers. |
| **Document Detail Modal** | Global / Tables | "Examine" or "Examine Dossier" | Comprehensive dossier inspector with 6-stage lifecycle progress tracker, action buttons, and audit history. |
| **Printable Routing Slip Modal** | Global / Dossier | "Slip" or "Print Routing Slip" | Formatted printable official routing slip matching physical government paper substrates with dual seals. |
| **Event Scheduling Modal** | `/schedule` / `/dashboard` | "Schedule Venue" / "Schedule Gavel" | Reservation form with live venue capacity checks and conflict detection for overlapping intervals. |
| **Mobile Navigation Drawer** | Mobile Layout | Hamburger button (`lg:hidden`) | Full-screen slide-over drawer enabling navigation across all 9 operational routes on smartphones and tablets. |

---

## Wireframe Suite Architecture

An isolated, white and blank wireframe application is housed in the [`wireframe/`](./wireframe/) directory. It models the layout hierarchy, typography tokens, table structures, and interaction patterns of the system without production colors or branding assets.

### Wireframe Screenshots Catalog

High-resolution visual audits are captured in [`wireframe/screenshots/`](./wireframe/screenshots/):

| File Name | Screen / Module Represented | Visual Architecture Details |
| :--- | :--- | :--- |
| [`wireframe-01-dashboard.png`](./wireframe/screenshots/wireframe-01-dashboard.png) | Executive Command Center | Layout of the 4-cell HUD, directive card, category balance table, and primary docket table. |
| [`wireframe-02-incoming.png`](./wireframe/screenshots/wireframe-02-incoming.png) | Reception and Screening Queue | 2-column card grid representing screening cards with status badges and action buttons. |
| [`wireframe-03-prepare.png`](./wireframe/screenshots/wireframe-03-prepare.png) | Document Drafting Studio | 3-column template selection grid showing template codes, descriptions, and activation triggers. |
| [`wireframe-04-review.png`](./wireframe/screenshots/wireframe-04-review.png) | Signature and Endorsement Desk | Executive queue cards with priority flags, assigned drafters, and approval controls. |
| [`wireframe-05-transmit.png`](./wireframe/screenshots/wireframe-05-transmit.png) | Transmission Desk | Tabular dispatch ledger displaying recipient names, destination offices, and transmission buttons. |
| [`wireframe-06-archive.png`](./wireframe/screenshots/wireframe-06-archive.png) | Municipal Records Archive | Concluded docket table displaying categorization, conclusion dates, and dossier retrieval buttons. |
| [`wireframe-07-schedule.png`](./wireframe/screenshots/wireframe-07-schedule.png) | Venue and Gavel Calendar | 3-column venue card grid representing the 6 municipal facilities, capacities, and active schedules. |
| [`wireframe-08-reports.png`](./wireframe/screenshots/wireframe-08-reports.png) | ARTA Compliance Ledger | 3-pillar metric cards for SLA percentage, turnaround time, and escalations, with category breakdown. |
| [`wireframe-09-admin.png`](./wireframe/screenshots/wireframe-09-admin.png) | Statutory Audit Trail | Chronological divider list representing immutable events, actors, roles, and details. |
| [`wireframe-10-modal-intake.png`](./wireframe/screenshots/wireframe-10-modal-intake.png) | New Intake Wizard Modal | Centered dialog showing the 3-step progress bar, form inputs, dropdowns, and submission controls. |
| [`wireframe-11-modal-dossier.png`](./wireframe/screenshots/wireframe-11-modal-dossier.png) | Document Detail Dossier Modal | Modal overlay displaying the 6-stage lifecycle progress tracker, particulars, and tabbed panels. |
| [`wireframe-12-modal-routingslip.png`](./wireframe/screenshots/wireframe-12-modal-routingslip.png) | Printable Routing Slip Modal | Formal paper slip layout with header letterhead, barcode badge, routing checkboxes, and signature box. |

---

## Relational Database Architecture (ERD)

The complete Entity Relationship Diagram and PostgreSQL/SQL relational database specification is maintained in [`scheme.txt`](./scheme.txt).

### Entity Summary
1. `users`: System personnel, Civil Service titles, offices, and role-based permissions.
2. `documents`: Core municipal docket records with ARTA SLA deadlines and finite state statuses.
3. `attachments`: Uploaded documentary annexes, scans, and physical receipts.
4. `transmissions`: Outward transmittal dispatches, recipient acknowledgments, and delivery methods.
5. `venues`: Fixed inventory of the 6 municipal venues with seating capacities.
6. `event_bookings`: Calendar bookings with automated conflict detection logic.
7. `event_attendees`: Roster of confirmed attendees and presiding dignitaries.
8. `audit_logs`: Immutable chronological custody log with user attribution and checksums.
9. `document_templates`: Reusable municipal drafting templates and schemas.

---

## Technical Stack and Infrastructure

- **Framework**: Next.js 16 (App Router with Turbopack) + React 19 + TypeScript
- **Styling Architecture**: Tailwind CSS v4 + Custom Civic Design Tokens
- **Icons**: Lucide React
- **Cloud Infrastructure**: Azure Static Web Apps (Free SKU)
- **Deployment Automation**: Azure SWA CLI (`@azure/static-web-apps-cli`)
- **Visual Auditing**: Puppeteer (Headless Browser Visual Regression)
- **Version Control**: Git + GitHub CLI (`gh`)

---

## Local Setup

DocSys splits cleanly between **containerised backing services** and **natively run applications**. Docker is required only to initialise the three external dependencies the API depends on. The API and the frontend both run directly on the local machine, so they can be edited, hot-reloaded, and debugged as normal Node processes.

| Component | Runs in | Address | Started by |
| :--- | :--- | :--- | :--- |
| PostgreSQL (database) | **Docker** | `localhost:5432` | `docker compose up -d` |
| Keycloak (identity provider) | **Docker** | http://localhost:8080 | `docker compose up -d` |
| MinIO (object storage) | **Docker** | http://localhost:9000 (S3 API), http://localhost:9001 (console) | `docker compose up -d` |
| GraphQL API (`backend/`) | **Local machine** | http://localhost:4000/graphql | `npm run dev` |
| Frontend (`app/`) | **Local machine** | http://localhost:3000 | `npm run dev` |

Nothing about the API or the frontend is containerised: `docker compose up -d` starts the database, the identity provider, and the storage service only.

### Prerequisites

- Node.js 22 or later (the backend declares `engines.node >= 22`) and npm.
- Docker Desktop, running.
- Java 21 and Apache Maven, only for building the Keycloak login theme (step 5).

> If `NODE_ENV=production` is exported in your shell, npm prunes devDependencies and `tsx` / `typescript` / `drizzle-kit` disappear. Install with `npm install --include=dev` in both `backend/` and `app/`.

### 1. Start the backing services (Docker)

From the repo root:

```bash
docker compose up -d
```

On first boot this creates the `docsys` database, imports the `docsys` Keycloak realm from `infra/keycloak/docsys-realm.json`, and runs a one-shot job that creates the `docsys-attachments` bucket.

| Service | URL | Credentials |
| :--- | :--- | :--- |
| PostgreSQL | `localhost:5432` | `docsys` / `docsys_dev_pw`, database `docsys` (API tables in schema `app`, Keycloak tables in `public`) |
| Keycloak | http://localhost:8080 | admin console `admin` / `admin` |
| MinIO console | http://localhost:9001 | `minioadmin` / `minioadmin` |

Tear down with `docker compose down`; add `-v` to drop the data volumes as well.

### 2. Run the API on the local machine

```bash
cd backend
npm install --include=dev
cp .env.example .env
npm run db:migrate            # creates the `app` schema and every table
npm run db:seed               # dev accounts, app roles and the six venues (idempotent)
npm run dev                   # http://localhost:4000/graphql
```

`db:seed` is what gives you something to sign in with, and it needs Keycloak to be up. It creates two Keycloak accounts plus the roles and shadow users the API authorizes against:

| Username | Password | App role |
| :--- | :--- | :--- |
| `administrator` | `DocSys2026!` | `ADMINISTRATOR` (`*:*`) |
| `clerk` | `DocSys2026!` | `CLERK_ENCODER` (workflow grants) |

**Fix `DATABASE_URL` before migrating.** `backend/.env.example` masks the password (`postgres://docsys:***@localhost:5432/docsys`), which fails with `28P01`. Set it to the compose default:

```bash
DATABASE_URL=postgres://docsys:docsys_dev_pw@localhost:5432/docsys
```

Health probe: `GET http://localhost:4000/health`.

### 3. Run the frontend on the local machine

```bash
cd app
npm install --include=dev
cp .env.example .env.local
npx auth secret               # generates AUTH_SECRET into app/.env.local
npm run dev                   # http://localhost:3000
```

`app/.env.example` already points at the local stack, so `AUTH_SECRET` is the only variable with no default. It is mandatory: without it every `/api/auth/*` request answers `500` (`MissingSecret`) and the login page cannot start the OIDC flow. Next.js reads `.env.local` at boot, so restart `npm run dev` after changing it.

### 4. Sign in

Open http://localhost:3000. Authentication is required, so the browser is handed straight to the Keycloak login page - there is no sign-in form in the app itself. Use `administrator` / `DocSys2026!` (or `clerk` for the non-administrative persona).

### 5. Optional: build the Keycloak login theme

The Keycloak pages are rendered by the keycloakify project in `keycloack-idp-docsys/`, which `docker-compose.yml` mounts into the Keycloak container. A fresh clone has no built artifact, so Keycloak falls back to its stock theme until the theme is built once:

```bash
docker compose stop keycloak          # a running container holds the mounted jar open
cd keycloack-idp-docsys
npm install --include=dev
npm run build-keycloak-theme:docsys   # needs Java 21 + Maven on PATH
cd ..
docker compose up -d keycloak
```

Rebuild with Keycloak stopped, always: while the container runs it locks the jar and the build fails with `EPERM`.

### 6. Verify the instance

```bash
curl -s localhost:4000/health                 # API health
curl -s localhost:3000/api/auth/providers     # keycloak provider + its callback URL
bash scripts/login-flow.sh                    # browserless end-to-end login through Keycloak
```

`scripts/login-flow.sh` drives the whole flow with curl (csrf, signin, Keycloak form, callback, session) and prints the resulting session; it is the fastest way to prove the frontend, the API, and the IdP are wired together.

### Other local targets

```bash
# Production build of the frontend (NextAuth needs the secret at build time)
cd app && AUTH_SECRET=<any-value> npm run build && npm run start

# Isolated blank wireframe application (layout audit, no production colors)
cd wireframe && npm install && npm run build && npx serve -l 3005 ./out
```

---

## Statutory Governance Standards

- **Republic Act 11032**: Ease of Doing Business and Efficient Government Service Delivery Act of 2018 (3-day simple transaction SLA rule).
- **Republic Act 10173**: Data Privacy Act of 2012 (strict confidentiality and role-based access).
- **Republic Act 8491**: Heraldic Code of the Philippines (official seals and protocol).
- **Republic Act 10535**: Philippine Standard Time Act.
- **DICT GWTS v25.3.3**: Philippine Government Web Template Standard.
