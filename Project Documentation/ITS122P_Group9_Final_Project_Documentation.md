# Republic of the Philippines
## Mapúa University
### School of Information Technology
**Course:** ITS122P — Web Systems and Technologies 2 (Laboratory)  
**Course & Section Code:** ITS122P_FOPM01_1Q2627  
**Academic Term:** First Quarter, Academic Year 2026–2027  

---

# FINAL PROJECT DOCUMENTATION

## Cloud-Based Document Management System (DocSys v2.6)
### Office of the Municipal Administrator
### Local Government Unit of the Municipality of Santa Maria, Province of Bulacan

**Submitted by:**  
### GROUP 9
* **BERNARDINO, MARIA ANGELIQUE D.** (Student No. 2023104521)
* **GAMUNDOY, EDEN GRACE F.** (Student No. 2023103984)
* **PONSECA, WILSON G.** (Student No. 2023101289)
* **SAMOSINO, LOUIS JEFFERSON V.** (Student No. 2023107842)

**Submitted to:**  
### Prof. GELDOF RESUELLO
Instructor, School of Information Technology  
Mapúa University  

**Date of Submission:**  
October 16, 2026  

---
<div style="page-break-after: always;"></div>


# TABLE OF CONTENTS

* **I. Introduction**
  * A. Institutional Background of the Local Government Unit
  * B. Profile and Mandate of the Municipal Administrator's Office
  * C. Baseline Manual Operations and Administrative Inefficiencies
  * D. Purpose and Transformation through DocSys v2.6
* **II. Problem Statement & Objectives**
  * A. Problem Statement
  * B. Research and System Questions
  * C. General Objective
  * D. Specific Objectives
* **III. UN SDGs Addressed**
  * A. Primary Alignment: SDG 9 — Industry, Innovation, and Infrastructure
  * B. Supporting Alignment: SDG 16 — Peace, Justice, and Strong Institutions
* **IV. Scope of the Project**
  * A. In-Scope Functional Boundaries
  * B. Out-of-Scope System Boundaries and Limitations
  * C. User Roles and Plantilla Personas
  * D. Technology Stack and Cloud Infrastructure
  * E. CRUD Operations and Session Architecture
  * F. Academic Milestones and Deliverables Summary
* **V. Functional Requirements**
  * A. Functional Requirements Matrix (FR-01 to FR-60)
* **VI. Non-Functional Requirements**
  * A. Performance and Scalability Standards
  * B. Security, Identity, and Confidentiality Standards
  * C. Reliability, Availability, and Disaster Recovery
  * D. Usability, Accessibility, and Design Doctrine Standards
  * E. System Compatibility and Interoperability
  * F. Maintainability, Modularity, and Code Quality
* **VII. Database Design**
  * A. Conceptual and Master Entity-Relationship Diagrams
  * B. Modular Subsystem Entity-Relationship Diagrams
  * C. Comprehensive Relational Data Dictionary (9 Tables)
  * D. Cardinality and Referential Integrity Rules
* **VIII. Features of the System**
  * A. System Information Architecture and Sitemap Tree
  * B. Sitemap Module Description Table
  * C. Wireframe Design System Catalog (12 Screens)
* **IX. Communication Letter**
  * A. Formal Communication Letter of Intent
  * B. Client Acceptance and Agreement Document
* **X. Functions of the System**
  * A. Operational Walkthrough of Live Deployed System
  * B. Subsystem Feature Demonstrations with Annotated Screenshots (14 Live Screens)
* **XI. Test Results**
  * A. Requirements Traceability Matrix (RTM)
  * B. Comprehensive Test Cases Execution Logs (TC-01 to TC-37)
  * C. Quality Metrics, Turnaround Benchmarks, and Verification Summary
* **XII. Working Web Site Link**
  * A. Production Deployment Endpoints and Source Code Repository
  * B. Enrolled Civil Service Plantilla Accounts and Verification Credentials
* **XIII. Sign-Off Document**
  * A. Formal Client Acceptance and Project Sign-Off Certificate



# I. Introduction

### A. Institutional Background of the Local Government Unit
The Municipality of Santa Maria is a first-class, highly urbanized municipality located in the eastern portion of the Province of Bulacan, Central Luzon (Region III), Republic of the Philippines. Geographically situated approximately 32 kilometers north of the City of Manila, Santa Maria serves as a premier industrial, commercial, and agricultural hub in Bulacan, encompassing twenty-four (24) administrative barangays with a resident population exceeding 289,000 citizens. 

As a dynamic and rapidly growing local government unit (LGU), the municipal administration handles thousands of citizen transactions, corporate permits, barangay endorsements, infrastructure project proposals, inter-agency communications, and executive directives each month. Under the leadership of the Municipal Mayor, the executive machinery is tasked with delivering swift, transparent, and legally accountable governance to both private constituents and public agencies.

### B. Profile and Mandate of the Municipal Administrator's Office
The Office of the Municipal Administrator, situated within the Municipal Hall in Poblacion, Santa Maria, Bulacan, functions as the central executive clearinghouse and operational nerve center of the entire local government unit. Pursuant to Title V, Article 10, Section 480 of Republic Act No. 7160 (The Local Government Code of 1991), the Municipal Administrator is responsible for developing plans and strategies relative to management and administrative programs, enforcing executive directives, coordinating the daily operations of all executive departments, and establishing management control systems that promote efficiency, transparency, and fiscal integrity.

The office is headed by **Engr. Elmer B. Clemente**, Municipal Administrator, assisted by **Mr. Benito C. Fabian**, Executive Assistant II, and **Ms. Sherelyn O. Libao**, Administrative Officer IV and Records Custodian. In addition to daily administrative coordination, the office directly supervises and processes fourteen (14) distinct categories of official municipal dockets:
1. **Incoming Constituent & Agency Requests (`IN`)**: General administrative petitions and communications.
2. **Travel Orders (`TO`)**: Official personnel travel authorities under Executive Order No. 77.
3. **Venue Reservation Requests (`VR`)**: Formal applications for public municipal facility usage.
4. **Vehicle Dispatch Requests (`VH`)**: Requisitions for municipal service vehicles and ambulances.
5. **Food & Catering Requests (`FD`)**: Requisitions for official executive meetings and civic functions.
6. **Overtime Authorities (`OT`)**: Personnel overtime authorizations compliant with CSC/COA rules.
7. **Executive Orders (`EO`)**: Administrative policies and town-wide directives promulgated by the Mayor.
8. **Contracts, MOAs, and Agreements (`CA`)**: Civil deeds, memoranda of agreement, and procurement contracts.
9. **Sangguniang Bayan 1st Indorsements (`SB`)**: Formal referrals to the municipal legislative council.
10. **Memorandum Orders (`MO`)**: Internal administrative instructions to department heads.
11. **Certifications & Mayor's Permits (`CP`)**: Special civic clearances, parades, and event authorities.
12. **Legal Advice & Formal Opinions (`LA`)**: Legal endorsements evaluated by the Municipal Legal Counsel.
13. **National Agency Communications (`NAT`)**: Transmittals coordinating with DILG, DOH, DPWH, and DBM.
14. **Civic & Employment Endorsement Letters (`EL`)**: Official executive recommendations.

Furthermore, the Municipal Administrator's Office exercises sole administrative jurisdiction over the reservation and scheduling of the municipality's six (6) premier public facilities:
1. **Municipal Conference Room** (Capacity: 35 persons, Main Municipal Building)
2. **Command Center Room** (Capacity: 20 persons, MDRRMO Building)
3. **Municipal Social Hall** (Capacity: 250 persons, Legislative & Civic Center)
4. **Municipal Gymnasium** (Capacity: 1,200 persons, Santa Maria Sports Complex)
5. **Mayor's Conference Room** (Capacity: 15 persons, Executive Wing)
6. **Administrator's Office** (Capacity: 12 persons, East Wing)

### C. Baseline Manual Operations and Administrative Inefficiencies
Prior to the conception and deployment of the Document Management System (DocSys), the Municipal Administrator's Office relied almost exclusively on conventional, paper-based administrative workflows, handwritten ledger logbooks, physical routing slips, and decentralized filing cabinets. A comprehensive operational analysis conducted during the project inception revealed four critical vulnerabilities in the baseline workflow:

1. **Vulnerability to Statutory Turnaround Breaches (Republic Act No. 11032):**
   Section 21 of Republic Act No. 11032 (The Ease of Doing Business and Efficient Government Service Delivery Act of 2018) legally mandates that simple government transactions must be acted upon, completed, and released within seventy-two (72) working hours (three working days) from initial intake. In the baseline manual environment, tracking this 72-hour window was reliant upon manual date stamps on physical paper sheets. When documents were transferred between different desks or offices, calculating elapsed business hours versus Philippine public holidays was practically impossible, exposing the office to bureaucratic delays and compliance violations.

2. **Tracking Blind Spots and Chain of Custody Failures:**
   When physical documents departed the Receiving Desk for drafting or executive signature, records personnel lost real-time visibility over document custody. If an inquiry arrived from a constituent or the Sangguniang Bayan, staff were forced to physically traverse different floors and departments to locate the paper file, frequently resulting in delayed responses and lost papers.

3. **Facility Scheduling Conflicts and Double-Bookings:**
   The municipal venues were historically managed through separate desktop calendar blotters and phone confirmations across different departments (General Services Office, Mayor's Office, and Administrator's Office). Overlapping bookings, last-minute room conflicts, and uncoordinated requests requiring the attendance of the Municipal Mayor or Municipal Administrator occurred regularly, disrupting civic proceedings and official government events.

4. **Physical Degradation, Security Risks, and Lack of Non-Repudiation:**
   Physical paper files are inherently susceptible to moisture, vermin, accidental misfiling, and catastrophic loss. Furthermore, physical routing slips could be altered or misplaced without leaving a verifiable audit trail, failing to meet the rigorous non-repudiation and transaction logging mandates of Republic Act No. 10175 (Cybercrime Prevention Act of 2012) and Republic Act No. 10173 (Data Privacy Act of 2012).

### D. Purpose and Transformation through DocSys v2.6
To decisively resolve these operational crises, the team developed and deployed the **Municipal Document Management and Statutory Operations System (DocSys v2.6)**. DocSys is an enterprise-grade, cloud-native web application designed specifically for the Local Government Unit of Santa Maria, Bulacan. 

DocSys transforms the municipal workflow from a fragmented, paper-reliant process into a synchronized, transparent, and legally accountable digital command center. By implementing automated control number generation, multi-page camera and digital file intake, standardized drafting templates, one-click executive approvals, centralized venue scheduling with real-time conflict prevention, immutable audit trails, and live ARTA SLA monitoring, DocSys empowers the Municipal Administrator's Office to exceed statutory governance standards while serving the public with unprecedented efficiency.

---
<div style="page-break-after: always;"></div>


# II. Problem Statement & Objectives

### A. Problem Statement
The administrative operations of the Office of the Municipal Administrator of Santa Maria, Bulacan involve the daily intake, processing, endorsement, and dispatch of hundreds of statutory records that move across multiple administrative tiers, executive officers, and municipal departments. The historical reliance on physical paper substrates, manual logbooks, decentralized file folders, and uncoordinated telephone communications resulted in severe administrative friction:

1. **Processing Delays and Inability to Enforce the 72-Hour ARTA Turnaround:**
   Under Section 21 of Republic Act No. 11032, municipal offices face statutory administrative sanctions if simple government transactions exceed three (3) working days (72 hours). Without automated timekeeping and early-warning alert mechanisms, administrators cannot proactively identify dockets that are approaching or exceeding this statutory threshold.

2. **Opacity and Informational Silos Across Departmental Handoffs:**
   The absence of a centralized digital repository makes it impossible to determine the real-time status of a pending docket (e.g., whether a Travel Order has been approved by the Administrator, returned for missing requirements by the screening officer, or received by the Sangguniang Bayan).

3. **Facility Scheduling Bottlenecks and Concurrent Double-Bookings:**
   The lack of an integrated logistics engine across the six (6) municipal venues led to recurring double-bookings for identical facilities and time slots, conflicting executive itineraries for the Mayor and Administrator, and logistical embarrassment during official municipal functions.

4. **Archival Vulnerability, Search Latency, and Absence of Immutable Audit Trails:**
   Retrieving concluded records from previous calendar quarters required labor-intensive manual searches through physical filing cabinets, often taking hours or days. Furthermore, physical logbooks fail to provide tamper-evident proof of who altered, approved, or released a specific municipal docket, creating non-repudiation liabilities.

### B. Research and System Questions
To address these challenges, the system answers the following core architectural questions:
1. *How can an enterprise web system automatically enforce the 72-hour statutory turnaround mandate of Republic Act 11032 using calendar-aware business logic?*
2. *What data model and workflow state machine best captures the six-step municipal lifecycle across fourteen distinct document categories?*
3. *How can real-time hardware scanning (HTML5 camera) and direct file upload pipelines be integrated securely into a modern web architecture without compromising constituent privacy under Republic Act 10173?*
4. *How can a centralized facility scheduling engine dynamically detect and prevent overlapping time-slot reservations while managing executive attendance flags?*
5. *How can immutable transaction logging and cryptographic checksums ensure tamper-evident audit trails compliant with national cybercrime and public governance laws?*

### C. General Objective
The primary objective of the group is to architect, develop, deploy, and evaluate a secure, cloud-based Document Management System (DocSys v2.6) with centralized venue scheduling and statutory compliance tracking for the Office of the Municipal Administrator of Santa Maria, Bulacan, in partial fulfillment of the requirements for ITS122P (Web Systems and Technologies 2).

### D. Specific Objectives
Specifically, the system accomplishes the following technical and functional goals:
1. **Intake & Docket Registry Subsystem:** Develop an automated intake wizard capable of generating standardized municipal control numbers (`[TYPE]-[YEAR]-[SEQUENCE]`) and capturing constituent and originating office metadata.
2. **Multi-Format Scanning & Annex Feeder:** Implement a live HTML5 camera document scanner with multi-page preview alongside a drag-and-drop file upload engine supporting PDF, DOCX, XLSX, PNG, and JPEG formats.
3. **Frontline Completeness Screening Gate:** Build a statutory screening module that enforces mandatory requirements verification and supports formal return-for-compliance workflows.
4. **Official Drafting & Template Studio:** Construct an interactive drafting studio pre-configured with standardized civic templates (Travel Orders, Executive Orders, SB Indorsements, Overtime Authorities) formatted with official municipal letterheads.
5. **Executive Review & Endorsement Desk:** Provide dedicated review queues for the Municipal Administrator and Municipal Mayor featuring one-click approval, administrative indorsement, and formal denial with mandatory written legal justifications.
6. **Transmission & Central Dispatch Desk:** Engineer an outgoing transmittal tracker that records recipient offices, delivery methods (courier, pickup, email, portal), and archives signed physical delivery receipts.
7. **Municipal Records Archive & Retrieval Engine:** Implement an archival repository featuring multi-criteria search, category filtering, instant inline PDF lightbox preview, and secure document downloading.
8. **Centralized Venue & Gavel Scheduler:** Build an interactive facility booking calendar covering the six (6) municipal venues with automated time-slot conflict detection and Mayoral gavel indicators.
9. **Statutory ARTA Compliance Analytics:** Deliver live dashboards and compliance ledgers tracking 72-hour turnaround compliance rates, average processing days, and monthly volume distributions.
10. **Immutable Audit Trail Subsystem:** Embed an append-only event ledger capturing every state-changing operation with user identity attribution, precise timestamps, and SHA-256 cryptographic verification checksums.
11. **Academic Course Compliance:** Satisfy all academic requirements for ITS122P, including HTML5, CSS3, JavaScript, TypeScript, Next.js, GraphQL API, PostgreSQL relational database, Keycloak session management, and XML Schema (XSD) document validation.

---
<div style="page-break-after: always;"></div>


# III. UN SDGs Addressed

### A. Primary Alignment: SDG 9 — Industry, Innovation, and Infrastructure
The United Nations Sustainable Development Goal 9 explicitly calls upon member states to *"build resilient infrastructure, promote inclusive and sustainable industrialization, and foster innovation."* In the context of public sector administration, modernizing information communications technology (ICT) infrastructure within local government units is essential for sustainable development.

DocSys v2.6 directly targets **UN SDG Target 9.c**:
> *"Significantly increase access to information and communications technology and strive to provide universal and affordable access to the Internet in least developed countries."*

While Santa Maria is a highly urbanized municipality, its administrative infrastructure historically suffered from technological deficits and manual paper bottlenecks. DocSys introduces enterprise cloud infrastructure into the heart of municipal governance by:
1. **Upgrading Public Civic Infrastructure:** Replacing brittle, physical paper archives with scalable, secure cloud-hosted PostgreSQL databases and object storage on Microsoft Azure.
2. **Digital Workflow Modernization:** Providing local civil servants with state-of-the-art web tools, automated workflow state transitions, and digital scanning capabilities that reduce paper waste, printing supplies, and physical courier transit.
3. **Resilient Public Administration:** Ensuring that municipal records, contracts, executive orders, and legislative indorsements are protected against natural calamities, fires, and physical degradation through cloud redundancy and daily automated backups.

### B. Supporting Alignment: SDG 16 — Peace, Justice, and Strong Institutions
Furthermore, DocSys strongly supports **United Nations Sustainable Development Goal 16**, which seeks to *"promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and transparent institutions at all levels."*

Specifically, the system implements:
1. **Target 16.6: Develop effective, accountable, and transparent institutions at all levels:**
   - **Enforcement of Republic Act No. 11032:** The system's live ARTA SLA radar and automated 72-hour turnaround clock eliminate bureaucratic foot-dragging, ensuring that citizen petitions, employee travel orders, and administrative permits are processed expeditiously.
   - **Immutable Audit Logging (RA 10175):** Every state-changing action—from document registration to executive approval and dispatch—is recorded in a permanent, read-only audit ledger with user identity snapshots and SHA-256 hashes. This eliminates corruption, unauthorized alteration, and backdating of official municipal dockets.
2. **Target 16.10: Ensure public access to information and protect fundamental freedoms:**
   - By structuring municipal documents into standardized categories and providing instant search and retrieval, the system facilitates institutional transparency and compliance with Freedom of Information (FOI) directives, while strictly safeguarding personal constituent identities pursuant to Republic Act No. 10173 (Data Privacy Act of 2012).

---
<div style="page-break-after: always;"></div>


# IV. Scope of the Project

### A. In-Scope Functional Boundaries
DocSys v2.6 encompasses the end-to-end statutory and administrative operations of the Office of the Municipal Administrator of Santa Maria, Bulacan. The system delivers complete functional coverage across the following modules:

1. **Authentication and Session Security:**
   - Integration with Keycloak Identity Provider via OpenID Connect (OIDC) and OAuth 2.0.
   - Single Sign-On (SSO) session lifecycle management with token renewal and secure logout.
   - Role-Based Access Control (RBAC) supporting four distinct plantilla user roles.
   - Active Civil Service persona switching for verification and role auditing.

2. **Six-Step Municipal Document Lifecycle:**
   - **Step 1: Reception & Intake:** Automated control numbering (`[TYPE]-[YEAR]-[SEQ]`), metadata logging, constituent attribution, real-time HTML5 camera scanning, drag-and-drop file upload, and automated 72-hour SLA deadline calculation.
   - **Step 2: Initial Screening:** Completeness verification checklist, attachment validation, addressee inspection, and return-for-compliance workflow with logged deficiency grounds.
   - **Step 3: Document Preparation:** Drafting Studio with pre-configured civic templates, live Santa Maria letterhead formatting, dual seal rendering, and direct submission to the review queue.
   - **Step 4: Executive Review & Approval:** Multi-tiered queues for the Municipal Administrator and Mayor, supporting one-click Approve, Endorse to Sangguniang Bayan/Department, or Deny with mandatory written justification.
   - **Step 5: Transmission & Central Dispatch:** Outgoing transmittal logging, dispatch channel attribution (courier, pickup, email, portal), recipient recording, and signed physical delivery receipt upload.
   - **Step 6: Completion & Archiving:** Permanent status locking (`CLOSED`), read-only retrieval, inline PDF lightbox viewer, and file export.

3. **Coverage of 14 Official Document Classifications:**
   Full lifecycle support for Incoming Requests (`IN`), Travel Orders (`TO`), Venue Requests (`VR`), Vehicle Requests (`VH`), Food Requests (`FD`), Overtime Authorizations (`OT`), Executive Orders (`EO`), Contracts & Agreements (`CA`), SB Endorsements (`SB`), Memorandum Orders (`MO`), Certifications & Permits (`CP`), Legal Opinions (`LA`), National Communications (`NAT`), and Endorsement Letters (`EL`).

4. **Centralized Venue & Gavel Scheduling Engine:**
   - Interactive reservation calendar across the six (6) municipal facilities: Municipal Conference Room, Command Center Room, Municipal Social Hall, Municipal Gymnasium, Mayor's Conference Room, and Administrator's Office.
   - Real-time algorithmic double-booking conflict detection for overlapping dates and hours.
   - Executive attendance tracking flags (`involvesMayor` and `involvesAdmin`).

5. **Statutory Compliance Analytics & Reporting:**
   - Real-time operations HUD and ARTA 72-hour SLA escalation radar.
   - Compliance balance sheets and monthly volume distributions across document classifications.
   - Export capabilities for compliance summaries.

6. **Immutable Statutory Audit Trail:**
   - Tamper-evident, append-only chronological log of all system actions.
   - Attribution capturing user UUID, full civil service name, role, IP address, and transaction particulars.
   - SHA-256 cryptographic verification checksums for data integrity verification.

7. **Interactive Dossier & Printable Routing Slip:**
   - Consolidated 6-stage lifecycle progress bar and document particulars modal.
   - Print-ready official LGU routing slip replicating physical government paper substrates with dual heraldic seals, barcode, routing blocks, and signature boxes.

8. **XML Validation & Export Subsystem:**
   - Course-required XML component implemented via XML Schema (XSD) validation for official document records.
   - XML data export engine generating validated, well-formed municipal XML dockets.

9. **Multi-Device Responsive Web Architecture:**
   - Full responsiveness across desktop workstations (1280px-1440px+), tablets (768px), and mobile smartphones (375px+).
   - Touch-friendly mobile slide-over navigation drawer.

### B. Out-of-Scope System Boundaries and Limitations
To maintain a realistic academic timeline and adhere to local municipal data governance protocols, the following features are explicitly out of scope for DocSys v2.6:
1. **Public/Citizen Self-Registration Portal:** DocSys is strictly an internal, intranet-capable enterprise application for Plantilla civil service personnel. Members of the public do not hold user accounts; constituent identities are recorded as transactional data.
2. **Direct SMS/Email Gateway Integration:** In the current release, all notifications and deadline alerts are delivered through the in-app notification center and real-time dashboard radar. External cellular SMS and SMTP mail server relays are reserved for future phases.
3. **Legal Replacement of the Physical Logbook:** DocSys operates in parallel with the office's physical logbooks during the transition period to satisfy the Commission on Audit (COA) parallel-run rules.
4. **Cryptographic PKI Hardware Signatures:** The system captures administrative approval events, timestamps, and scanned wet signatures, but does not interface with Philippine National PKI (PNPKI) hardware smart cards.
5. **Direct TWAIN/SANE Scanner Driver Integration:** Documents are captured using standard HTML5 camera APIs and browser file pickers; proprietary desktop scanner drivers are not required.
6. **Integration with External National Agency Portals:** External systems (such as the DILG LGU portal or PhilGEPS) are not connected via live APIs; external transmittals are logged as transmission records.
7. **Retroactive Digitization of Historical Paper Archives:** Only newly received dockets and active calendar year transactions are ingested; legacy paper files pre-dating implementation remain in physical storage.

### C. User Roles and Plantilla Personas
The system implements a granular Role-Based Access Control (RBAC) model aligned with the Civil Service Plantilla of the Municipality of Santa Maria:

| Role Identifier | Plantilla Title & Representative Persona | Primary Responsibilities & Access Permissions |
| :--- | :--- | :--- |
| **`ADMINISTRATOR`** | **Engr. Elmer B. Clemente**<br>Municipal Administrator (`admin@santamaria.gov.ph`) | Full executive authority. Reviews, approves, endorses, or denies all dockets; manages user accounts and permissions; configures templates; accesses compliance analytics and the master audit log. |
| **`ADMINISTRATOR`** | **Hon. Bartolome**<br>Municipal Mayor (`mayor@santamaria.gov.ph`) | Executive signing authority. Approves Executive Orders, town-wide policies, and high-impact municipal contracts; presides over Mayoral gavel proceedings. |
| **`EXECUTIVE_ASSISTANT`** | **Mr. Benito C. Fabian**<br>Executive Assistant II (`ea.fabian@santamaria.gov.ph`) | Secondary executive review authority. Evaluates incoming dockets, prepares endorsements, reviews drafts, monitors ARTA SLA compliance, and acts on delegated administrative requests. |
| **`OFFICER`** | **Officer J. Garcia / Atty. Rodrigo Ramos**<br>Admin Officer IV / Legal Officer (`legal@santamaria.gov.ph`) | Document preparer and legal counsel. Accesses the Drafting Studio, prepares Travel Orders and Executive Orders, formulates formal Legal Opinions, and submits drafts for approval. |
| **`CLERK_ENCODER`** | **Ms. Sherelyn O. Libao**<br>Records Custodian / Intake Clerk (`records.slibao@santamaria.gov.ph`) | Frontline records officer. Operates the intake wizard, conducts initial completeness screening, operates the camera scanner, manages physical transmissions, and books municipal venues. |

### D. Technology Stack and Cloud Infrastructure
DocSys is engineered using modern, production-grade cloud-native technologies:

* **Presentation Layer (Frontend):**
  - **Framework:** Next.js 16 (App Router architecture with React 19 and TypeScript).
  - **Styling Architecture:** Vanilla Tailwind CSS v4 configured with Santa Maria Civic Design Tokens (Heraldic Forest Green `#15803D`, Government Navy `#0B2545`, Slate `#1E293B`).
  - **Iconography:** Lucide React SVG iconography (strict zero-emoji policy).
  - **Hosting:** Microsoft Azure Static Web Apps (Southeast Asia region), providing global edge distribution, automated SSL/TLS termination, and zero-downtime CI/CD deployment.

* **Application Layer (API & Logic):**
  - **Runtime & Architecture:** Node.js 22 LTS with an Express-based GraphQL API server (Apollo Server).
  - **Data Access:** Drizzle ORM providing type-safe relational SQL queries and schema migrations.
  - **XML Engine:** `libxml2` / `fast-xml-parser` for XML Schema (XSD) validation and civic XML data export.
  - **Hosting:** Azure App Service (`https://santamaria-docsys-api.azurewebsites.net`).

* **Identity & Access Management (IAM):**
  - **Platform:** Keycloak 24 (OpenID Connect / OAuth 2.0).
  - **Realm:** `docsys` realm with custom Santa Maria civic login theme built with Keycloakify.
  - **Session Management:** Secure HTTP-only session cookies and JWT bearer tokens.

* **Persistence & Storage Layer:**
  - **Database:** Microsoft Azure Database for PostgreSQL Flexible Server (`Standard_B1ms` burstable tier, 1 vCore, 2 GiB RAM, 32 GiB Premium SSD, SSL/TLS 1.2+ enforced).
  - **Object Storage:** MinIO / S3-compatible cloud storage for document attachments, camera captures, and delivery receipt proofs.

```mermaid
graph TD
    Client[Client Workstation / Mobile Browser] -->|HTTPS / TLS 1.3| SWA[Azure Static Web Apps / Next.js 16 Frontend]
    SWA -->|OIDC / OAuth 2.0| KC[Keycloak Identity Provider]
    SWA -->|GraphQL Queries & Mutations| API[Azure App Service / Node.js GraphQL API]
    API -->|TCP 5432 / SSL| DB[(Azure PostgreSQL Flexible Server)]
    API -->|S3 API| S3[(MinIO / Cloud Object Storage)]
    API -->|XSD Validation| XSD[XML Schema Validation Engine]
```

![Figure 1: Cloud Infrastructure Architecture](figures/fig1_technical_architecture.png)

*Figure 1. High-level multi-tier cloud infrastructure diagram of Santa Maria DocSys v2.6.*

### E. CRUD Operations and Session Architecture
To satisfy course requirements while honoring statutory public records governance, Create, Read, Update, and Delete operations are implemented as follows:
* **Create (C):** Personnel create intake dockets, upload scanned attachments, draft official documents from templates, record transmission dispatches, and schedule venue reservations.
* **Read (R):** Authorized users read dockets, view tabular ledgers, filter historical records, inspect dossiers, preview PDFs inline, and inspect immutable audit logs.
* **Update (U):** Screening officers update completeness checklists, preparers edit document drafts, approvers record approval/endorsement/denial decisions, and clerks record delivery confirmations.
* **Delete (D) — Statutory Soft-Deletion Protocol:** In strict accordance with public records laws and COA guidelines, completed municipal dockets and audit logs cannot be purged from the database. Deletions are restricted to canceling unconfirmed venue reservations and deactivating plantilla accounts (`is_active: false`).

### F. Academic Milestones and Deliverables Summary
* **Milestone 1 (Week 9):** Project Proposal, Technical Architecture Specification, Conceptual ERD, High-Fidelity Wireframes, and Formal Client Approval Session with Prof. Geldof Resuello (Completed October 3, 2026).
* **Milestone 2 (Week 11):** Fully Deployed Web System on Microsoft Azure, PostgreSQL Cloud Database, Keycloak SSO Integration, XML Schema Validation Engine, Comprehensive Final Project Documentation, Live Screenshots, and Signed Client Acceptance Certificate (Completed October 16, 2026).

---
<div style="page-break-after: always;"></div>


# V. Functional Requirements

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


# VI. Non-Functional Requirements

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


# VII. Database Design

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

![Figure 2: Master Entity-Relationship Diagram](figures/fig3_master_erd.png)

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


# VIII. Features of the System

### A. System Information Architecture and Sitemap Tree
DocSys v2.6 is organized into a clean, hierarchical information architecture designed to eliminate deep navigation nesting and minimize operator clicks. Authenticated civil servants are greeted by the Executive Operations Command Center (`/dashboard`), from which all primary administrative divisions are directly accessible.

```mermaid
graph TD
    Root["/ (Root Gateway)"] --> Auth["/login (Keycloak OIDC Portal)"]
    Auth --> Dashboard["/dashboard (Executive Operations Command Center)"]
    
    Dashboard --> Div1["Division I: Intake & Registry"]
    Div1 --> Incoming["/incoming (Reception & Screening Queue)"]
    Div1 --> ModalIntake["Modal: 3-Step Intake Wizard & Camera Feeder"]
    
    Dashboard --> Div2["Division II: Executive Review"]
    Div2 --> Prepare["/prepare (Document Drafting Studio)"]
    Div2 --> Review["/review (Executive Signature & Endorsement Desk)"]
    Div2 --> Transmit["/transmit (Transmission Desk & Dispatch Queue)"]
    Div2 --> Archive["/archive (Municipal Records Archive & Search)"]
    
    Dashboard --> Div3["Division III: Logistics & Compliance"]
    Div3 --> Schedule["/schedule (Venue & Gavel Scheduler)"]
    Div3 --> Reports["/reports (ARTA SLA Compliance Ledger)"]
    
    Dashboard --> Div4["Division IV: Administration"]
    Div4 --> Admin["/admin & /settings (Audit Trail & Plantilla Roles)"]
    
    Dashboard --> Dossier["Modal: Docket Dossier (6-Stage Tracker)"]
    Dossier --> RoutingSlip["Modal: Printable LGU Routing Slip"]
```

![Figure 3: System Sitemap and Information Architecture](figures/fig4_system_sitemap.png)

*Figure 3. Hierarchical Information Architecture and Sitemap Tree of Santa Maria DocSys v2.6.*

### B. Sitemap Module Description Table
The following matrix delineates the primary routes, access scopes, and functional responsibilities across the application:

| Route Path | Module Title | Primary Access Scope | Functional Responsibility & Operations |
| :--- | :--- | :--- | :--- |
| `/login` | Authentication Portal | Public / Unauthenticated | Official Keycloak OIDC authentication portal, security notices, and development persona test selector. |
| `/` | System Entry Gateway | Public / All Civil Servants | Gateway route automatically redirecting authenticated personnel directly to `/dashboard`. |
| `/dashboard` | Executive Command Center | All Plantilla Roles | Operational overview featuring the 4-cell HUD, 72-hour ARTA escalation radar, category balance sheet, and live docket ledger. |
| `/incoming` | Reception & Screening Queue | Records Custodian / Intake Clerk | Central receiving desk queue for logging dockets, operating the HTML5 camera scanner, verifying attachments, and returning incomplete submissions. |
| `/prepare` | Document Drafting Studio | Action Officers / Legal Counsel | Template selection library, rich drafting canvas, live municipal letterhead preview, and direct submission to executive review. |
| `/review` | Signature & Endorsement Desk | Municipal Administrator / Mayor | Multi-tiered executive queue enabling one-click Approval, Sangguniang Bayan Indorsement, or formal Denial with mandatory written legal grounds. |
| `/transmit` | Transmission Desk | Records Custodian / Dispatch Clerk | Central transmittal tracker logging recipient bureaus, delivery channels (courier, pickup, email, portal), and uploading signed delivery receipts. |
| `/archive` | Municipal Records Archive | All Plantilla Roles | Permanent repository of closed dockets featuring multi-criteria metadata search, category filters, and responsive inline PDF lightbox viewing. |
| `/schedule` | Venue & Gavel Scheduler | All Plantilla Roles | Central facility reservation calendar across 6 municipal venues with automated double-booking prevention and Mayoral Gavel indicators. |
| `/reports` | ARTA Compliance Ledger | Executive Assistant II / Admin | Statutory compliance analytics under RA 11032, turnaround speed tracking, and monthly category breakdown matrices. |
| `/admin` | Statutory Audit & Settings | Municipal Administrator / Auditor | Immutable append-only audit trail (RA 10175), SHA-256 integrity verification, plantilla user roster, and role permission matrices. |

### C. Wireframe Design System Catalog (12 Screens)
Prior to implementation, the team constructed a comprehensive, blank-state wireframe application located in the `wireframe/` directory. The wireframe suite established the layout hierarchy, typography tokens, table structures, and interaction patterns of the system without production colors or branding assets.

#### 1. Wireframe 01: Executive Command Center (`wireframe-01-dashboard.png`)

![Figure 4. Wireframe 01: Executive Command Center.](../wireframe/screenshots/wireframe-01-dashboard.png)
*Figure 4. Wireframe 01: Executive Command Center.*

* **Layout Structure:** Features the top-level 4-cell operations HUD (Active Registry, Signature Desk Queue, ARTA SLA Integrity %, and Venue Logistics), a prominent amber-bordered ARTA directive alert card, a 2-column layout housing the Category Balance Sheet on the left, and the Primary Docket Ledger Table on the right.
* **Interaction:** Clicking any metric card filters the underlying docket table. Search inputs provide instant filtering across control numbers and requesting parties.

#### 2. Wireframe 02: Reception and Screening Queue (`wireframe-02-incoming.png`)

![Figure 5. Wireframe 02: Reception and Screening Queue.](../wireframe/screenshots/wireframe-02-incoming.png)
*Figure 5. Wireframe 02: Reception and Screening Queue.*

* **Layout Structure:** High-density 2-column card grid representing incoming dockets in `RECEIVED` or `SCREENING` status. Each card prominently displays the generated control number, requesting party, origin office, elapsed business hours, and screening status.
* **Interaction:** Features action buttons to initiate the 3-step Intake Wizard ("Log New Incoming"), open the completeness screening checklist ("Audit Requirements"), or issue a formal return-for-compliance notice.

#### 3. Wireframe 03: Document Preparation Studio (`wireframe-03-prepare.png`)

![Figure 6. Wireframe 03: Document Preparation Studio.](../wireframe/screenshots/wireframe-03-prepare.png)
*Figure 6. Wireframe 03: Document Preparation Studio.*

* **Layout Structure:** 3-column template selection grid showcasing pre-configured municipal drafting templates (Travel Orders, Executive Orders, SB Indorsements, Overtime Authorities, and Mayor's Permits).
* **Interaction:** Selecting a template expands the drafting canvas, pre-populates standardized statutory clauses, and activates the live municipal letterhead preview.

#### 4. Wireframe 04: Signature and Endorsement Desk (`wireframe-04-review.png`)

![Figure 7. Wireframe 04: Signature and Endorsement Desk.](../wireframe/screenshots/wireframe-04-review.png)
*Figure 7. Wireframe 04: Signature and Endorsement Desk.*

* **Layout Structure:** Executive review queue displaying cards categorized by urgency (`NORMAL`, `HIGH`, `URGENT`). Each item displays the assigned drafter, subject matter, draft version, and SLA countdown.
* **Interaction:** Provides direct action controls: "Approve Docket", "Endorse to SB/Bureaus", or "Deny Docket" (which summons a mandatory modal requiring written legal grounds).

#### 5. Wireframe 05: Transmission Desk (`wireframe-05-transmit.png`)

![Figure 8. Wireframe 05: Transmission Desk.](../wireframe/screenshots/wireframe-05-transmit.png)
*Figure 8. Wireframe 05: Transmission Desk.*

* **Layout Structure:** Tabular dispatch ledger displaying approved and signed documents ready for outward delivery. Columns indicate Docket Control No., Subject, Approving Authority, Target Destination Office, and Status.
* **Interaction:** Clicking "Dispatch Docket" triggers the transmittal modal to select delivery channel (courier, pickup, email, portal), input recipient name, and upload a signed physical delivery receipt scan.

#### 6. Wireframe 06: Municipal Records Archive (`wireframe-06-archive.png`)

![Figure 9. Wireframe 06: Municipal Records Archive.](../wireframe/screenshots/wireframe-06-archive.png)
*Figure 9. Wireframe 06: Municipal Records Archive.*

* **Layout Structure:** Search-centric archival interface featuring a master search bar, category filter tabs across the 14 document types, and a comprehensive tabular ledger of concluded transactions.
* **Interaction:** Personnel can filter by calendar year, originating department, or status (`CLOSED`). Clicking "Examine Dossier" opens the complete historical case file with inline PDF preview.

#### 7. Wireframe 07: Venue and Gavel Calendar (`wireframe-07-schedule.png`)

![Figure 10. Wireframe 07: Venue and Gavel Calendar.](../wireframe/screenshots/wireframe-07-schedule.png)
*Figure 10. Wireframe 07: Venue and Gavel Calendar.*

* **Layout Structure:** 3-column card grid representing the six (6) municipal facilities (Municipal Conference Room, Command Center, Social Hall, Gymnasium, Mayor's Conference Room, and Administrator's Office), displaying capacity badges and scheduled reservations.
* **Interaction:** Clicking "Schedule Venue" opens the reservation modal with automated real-time conflict detection. Overlapping bookings display a red conflict warning.

#### 8. Wireframe 08: ARTA Compliance Ledger (`wireframe-08-reports.png`)

![Figure 11. Wireframe 08: ARTA Compliance Ledger.](../wireframe/screenshots/wireframe-08-reports.png)
*Figure 11. Wireframe 08: ARTA Compliance Ledger.*

* **Layout Structure:** 3-pillar metric overview displaying SLA Success Rate (94.8%), Average Turnaround Duration (1.4 days), and Overdue Escalated Dockets. Below, a comprehensive category processing matrix details volume by status.
* **Interaction:** Supports date range filtering and provides buttons to export reports into formatted PDF or Excel spreadsheets.

#### 9. Wireframe 09: Statutory Audit Trail (`wireframe-09-admin.png`)

![Figure 12. Wireframe 09: Statutory Audit Trail.](../wireframe/screenshots/wireframe-09-admin.png)
*Figure 12. Wireframe 09: Statutory Audit Trail.*

* **Layout Structure:** Chronological event list detailing system mutations. Each row indicates the exact timestamp (PST), actor name, civil service role, action enum, affected control number, and SHA-256 hash.
* **Interaction:** Master search enables filtering by user name, action type, or docket number. The ledger is strictly read-only.

#### 10. Wireframe 10: New Intake Wizard Modal (`wireframe-10-modal-intake.png`)

![Figure 13. Wireframe 10: New Intake Wizard Modal.](../wireframe/screenshots/wireframe-10-modal-intake.png)
*Figure 13. Wireframe 10: New Intake Wizard Modal.*

* **Layout Structure:** Centered dialog featuring a 3-step progress bar: Step 1 (Classification & Particulars), Step 2 (Attachments & Camera Scanning), and Step 3 (Completeness Checklist & Confirmation).
* **Interaction:** Form validation ensures all required fields and attachments are present before generating the control number and committing the docket.

#### 11. Wireframe 11: Document Detail Dossier Modal (`wireframe-11-modal-dossier.png`)

![Figure 14. Wireframe 11: Document Detail Dossier Modal.](../wireframe/screenshots/wireframe-11-modal-dossier.png)
*Figure 14. Wireframe 11: Document Detail Dossier Modal.*

* **Layout Structure:** Comprehensive modal dialogue featuring a top 6-stage lifecycle progress tracker (Screening, Preparation, Review, Approval, Transmission, Archival), tabbed panels for Particulars, Annexes, and Audit History.
* **Interaction:** Allows authorized officers to view full docket particulars, preview attached files, or print the official routing slip.

#### 12. Wireframe 12: Printable Routing Slip Modal (`wireframe-12-modal-routingslip.png`)

![Figure 15. Wireframe 12: Printable Routing Slip Modal.](../wireframe/screenshots/wireframe-12-modal-routingslip.png)
*Figure 15. Wireframe 12: Printable Routing Slip Modal.*

* **Layout Structure:** Faithful reproduction of physical government routing slips, incorporating the Santa Maria Municipal Seal, Bagong Pilipinas crest, barcode docket badge, routing checkboxes, and signature blocks.
* **Interaction:** Formatted with CSS `@media print` rules for direct output to standard A4 municipal paper on office printers.

---
<div style="page-break-after: always;"></div>


# IX. Communication Letter

### A. Formal Communication Letter of Intent

![Proof of Letter of Intent](extracted_page_29_img_0.jpeg)
*Figure 16. Scanned Copy of Formal Letter of Intent submitted to Engr. Elmer B. Clemente.*
In strict compliance with academic and institutional research ethics, Group 9 formally transmitted an official Communication Letter of Intent to the Local Government Unit of Santa Maria, Bulacan prior to system analysis and development:

```
REPUBLIC OF THE PHILIPPINES
PROVINCE OF BULACAN
MUNICIPALITY OF SANTA MARIA
OFFICE OF THE MUNICIPAL ADMINISTRATOR

October 1, 2026

ENGR. ELMER B. CLEMENTE
Municipal Administrator
Municipality of Santa Maria
Poblacion, Santa Maria, Bulacan 3022

SUBJECT: LETTER OF INTENT — PROPOSED CLOUD-BASED DOCUMENT MANAGEMENT SYSTEM (DOCSYS)

Dear Engr. Clemente:

Warm civic greetings!

We, the undersigned Fourth-Year Bachelor of Science in Information Technology students of 
Mapúa University, enrolled in Web Systems and Technologies 2 (ITS122P), respectfully submit 
this Letter of Intent to propose the collaborative development and academic deployment of an 
internal, cloud-based Document Management and Scheduling System (DocSys v2.6) for the Office 
of the Municipal Administrator.

The proposed capstone web system aims to digitize and automate the six-step document lifecycle 
of the office, enforce compliance with the 72-hour turnaround mandate of Republic Act No. 11032 
(Ease of Doing Business Act), centralize municipal venue scheduling to eliminate double-bookings, 
and establish an immutable, tamper-evident audit trail under Republic Act No. 10175.

All project development, cloud hosting on Microsoft Azure, and system configuration will be 
conducted at zero financial cost to the Municipal Government. Furthermore, the handling of all 
constituent and personnel records will strictly adhere to the confidentiality mandates of 
Republic Act No. 10173 (Data Privacy Act of 2012).

We look forward to your favorable endorsement and guidance throughout this civic undertaking.

Respectfully yours,

GROUP 9 RESEARCHERS:
[SGD] MARIA ANGELIQUE D. BERNARDINO
[SGD] EDEN GRACE F. GAMUNDOY
[SGD] WILSON G. PONSECA
[SGD] LOUIS JEFFERSON V. SAMOSINO

NOTED BY:
[SGD] Prof. GELDOF RESUELLO
Instructor, School of Information Technology
Mapúa University
```

### B. Client Acceptance and Agreement Document

![Proof of Agreement of Client](extracted_page_30_img_0.jpeg)
*Figure 17. Scanned Copy of Client Agreement signed by Municipal Administrator Engr. Elmer B. Clemente.*
Following an exhaustive technical presentation, live demonstration of the deployed Azure environment, and review of the system's compliance with municipal workflows on October 3, 2026, the Municipal Administrator formally executed the Client Agreement:

```
CLIENT AGREEMENT AND ACCEPTANCE OF CAPSTONE PROJECT
OFFICE OF THE MUNICIPAL ADMINISTRATOR | MUNICIPALITY OF SANTA MARIA, BULACAN

I, ENGR. ELMER B. CLEMENTE, in my official capacity as Municipal Administrator of the 
Municipality of Santa Maria, Province of Bulacan, hereby formally confirm and attest that:

1. The Office of the Municipal Administrator has reviewed the Project Proposal and Technical 
   Architecture for the Cloud-Based Document Management System (DocSys v2.6) presented by 
   Group 9 students of Mapúa University;
2. The functional specifications, including the 6-step document lifecycle, coverage of the 14 
   municipal document classifications, the centralized venue scheduling calendar for our six (6) 
   municipal facilities, and the ARTA 72-hour turnaround radar, accurately reflect the operational 
   needs and statutory requirements of this office;
3. The Office consents to the deployment and evaluation of DocSys v2.6 within our administrative 
   workflow and agrees to execute a parallel run alongside our physical records during the academic 
   evaluation period;
4. The system has been successfully verified on the live Microsoft Azure cloud infrastructure 
   (https://kind-field-0061c5600.4.azurestaticapps.net) and meets the institutional standards of 
   this Local Government Unit.

Executed this 3rd day of October, 2026 at the Municipal Hall, Poblacion, Santa Maria, Bulacan.

CONFORME AND APPROVED:

[SGD]
ENGR. ELMER B. CLEMENTE
Municipal Administrator
Municipality of Santa Maria, Bulacan
```

---
<div style="page-break-after: always;"></div>


# X. Functions of the System

### A. Operational Walkthrough of Live Deployed System

![Figure 18: Statutory Document Lifecycle Workflow](figures/fig2_document_lifecycle_flow.png)
*Figure 18. End-to-End 6-Step Statutory Document Lifecycle Workflow.*
The Santa Maria Document Management System (DocSys v2.6) is fully deployed, operational, and publicly accessible at `https://kind-field-0061c5600.4.azurestaticapps.net`. The application runs on Microsoft Azure Static Web Apps, connecting to an Azure App Service GraphQL API and an Azure Database for PostgreSQL Flexible Server.

The operational walkthrough below demonstrates the end-to-end execution of the fourteen (14) primary subsystems and interface modules, captured directly from the verified live cloud production environment.

### B. Subsystem Feature Demonstrations with Annotated Screenshots (14 Live Screens)

#### 1. Civil Service Authentication Portal (`live_01_login_portal.png`)

![Figure 19. Civil Service Authentication Portal & Keycloak Login Flow.](screenshots/live_01_login_portal.png)
*Figure 19. Civil Service Authentication Portal & Keycloak Login Flow.*

* **Interface Architecture:** The entry point enforces the DICT Philippine Government Web Template Standard (GWTS v25.3.3) with the official Republic of the Philippines top bar, synchronized Philippine Standard Time (PST), and dual heraldic insignias (Official Seal of Santa Maria and Bagong Pilipinas).
* **Operational Flow:** Civil servants are presented with statutory legal disclosures under Republic Act No. 10173 and Republic Act No. 10175. Clicking "Authenticate on Keycloak" initiates the secure OIDC authorization code flow. For academic auditing and role evaluation, the portal features a Plantilla Persona selector enabling instant verification across Administrator, Mayor, Administrative Officer, and Intake Clerk tiers.

#### 2. Keycloak OpenID Connect Identity Provider (`live_02_keycloak_idp.png`)

![Figure 20. Keycloak OpenID Connect (OIDC) Identity Provider.](screenshots/live_02_keycloak_idp.png)
*Figure 20. Keycloak OpenID Connect (OIDC) Identity Provider.*

* **Interface Architecture:** Hosted on Azure App Service (`https://santamaria-docsys-idp.azurewebsites.net`), the Keycloak IAM server renders a customized Santa Maria civic login theme built with Keycloakify.
* **Operational Flow:** Enforces enterprise password policies, TLS encryption, and secure session cookie issuance. Upon entering valid plantilla credentials (`administrator` / `DocSys2026!` or `clerk` / `DocSys2026!`), Keycloak returns an authorized JWT identity token and redirects the browser securely back to the application dashboard.

#### 3. Executive Operations Command Center & ARTA SLA Radar (`live_03_dashboard.png`)

![Figure 21. Executive Operations Command Center & ARTA 72-Hour SLA Radar.](screenshots/live_03_dashboard.png)
*Figure 21. Executive Operations Command Center & ARTA 72-Hour SLA Radar.*

* **Interface Architecture:** The operational cockpit of the Municipal Administrator. Features a 4-cell operations HUD:
  1. *Active Docket Influx:* Total dockets currently moving through the municipal pipeline (18 active).
  2. *Executive Signature Desk:* Documents awaiting immediate Administrator or Mayoral signature (4 pending).
  3. *ARTA SLA Integrity:* Percentage of dockets processed within the statutory 72-hour window (94.8% compliance).
  4. *Venue Logistics:* Confirmed municipal facility reservations for the current calendar week (12 events).
* **Operational Flow:** Directly beneath the HUD, a prominent crimson-bordered ARTA Directive Alert card flags any transaction approaching or exceeding 72 business hours. The right panel houses the searchable Docket Ledger Table with instant text filtering, priority badging (`NORMAL`, `HIGH`, `URGENT`), and direct access to examine full dossiers.

#### 4. Reception and Screening Queue Subsystem (`live_04_incoming_screening.png`)

![Figure 22. Reception and Screening Queue Subsystem.](screenshots/live_04_incoming_screening.png)
*Figure 22. Reception and Screening Queue Subsystem.*

* **Interface Architecture:** Designed for the Central Receiving Desk and Records Custodian. Presents incoming submissions organized in a high-density 2-column card layout.
* **Operational Flow:** Each card displays the control number, date of intake, requesting citizen or agency, originating office, and current screening status. Frontline clerks utilize action triggers to audit completeness ("Audit Checklist"), open the live document scanner, or formally return deficient dockets ("Return for Compliance").

#### 5. 3-Step Intake Docket Wizard & Camera Scanner (`live_12_modal_intake.png`)

![Figure 23. 3-Step Intake Docket Wizard & Live HTML5 Camera Scanner.](screenshots/live_12_modal_intake.png)
*Figure 23. 3-Step Intake Docket Wizard & Live HTML5 Camera Scanner.*

* **Interface Architecture:** Centered modal dialogue guiding the receiving clerk through three rigorous intake phases:
  - *Step 1 (Docket Metadata):* Document Classification dropdown (14 types), Subject Title, Requesting Party, Originating Bureau, and Priority Level.
  - *Step 2 (Multi-Format Attachment Feeder):* Integrates both a drag-and-drop file upload zone (supporting PDF, DOCX, XLSX, images) and the Live HTML5 Camera Document Scanner targeting workstation document cameras with an A4 alignment reticle.
  - *Step 3 (Statutory Screening Checklist):* Enforces mandatory verification checkboxes for Attachment Completeness, Authorized Signatures, and Valid Department Addressee.
* **Operational Flow:** Submitting the form automatically generates the official municipal control number (e.g. `TO-2026-0042`), logs the timestamp, initiates the 72-hour SLA countdown, and commits the transaction to PostgreSQL.

#### 6. Official Document Preparation & Drafting Studio (`live_05_prepare_studio.png`)

![Figure 24. Official Document Preparation & Drafting Studio.](screenshots/live_05_prepare_studio.png)
*Figure 24. Official Document Preparation & Drafting Studio.*

* **Interface Architecture:** A dedicated drafting studio providing a 3-column template selection grid featuring standardized municipal templates: Travel Orders (`TO-LGU-2026`), Executive Orders (`EO-MAYOR-2026`), Sangguniang Bayan 1st Indorsements (`IND-SB-2026`), Venue Clearance Requests (`VR-GSO-2026`), and Overtime Authorizations (`OT-HRMO-2026`).
* **Operational Flow:** Action officers select a template to populate pre-approved civil service language, edit particulars, and preview the document dynamically formatted with the official Santa Maria municipal letterhead. Clicking "Submit for Executive Review" locks the draft and places it directly into the Administrator's queue.

#### 7. Executive Signature & Endorsement Desk (`live_06_review_endorsement.png`)

![Figure 25. Executive Signature & Endorsement Desk.](screenshots/live_06_review_endorsement.png)
*Figure 25. Executive Signature & Endorsement Desk.*

* **Interface Architecture:** Dedicated executive queue reserved for the Municipal Administrator and Municipal Mayor. 
* **Operational Flow:** Features actionable controls for every pending docket:
  - *Approve Docket:* One-click executive approval; appends an immutable signature event and transitions status to `APPROVED`.
  - *Endorse Docket:* Forwards the record to the Sangguniang Bayan or municipal departments with attached administrative directives.
  - *Deny Docket:* Opens a mandatory dialogue requiring the executive to specify written statutory grounds for rejection, permanently binding the denial justification to the public record.

#### 8. Central Transmission Desk & Outgoing Dispatch Queue (`live_07_transmission_desk.png`)

![Figure 26. Central Transmission Desk & Central Dispatch Queue.](screenshots/live_07_transmission_desk.png)
*Figure 26. Central Transmission Desk & Central Dispatch Queue.*

* **Interface Architecture:** Outgoing transmittal registry managing approved resolutions, permits, and executive orders ready for external release.
* **Operational Flow:** Dispatch officers record the transmittal channel (Physical Courier, In-Person Pickup, Official Government Email, or Portal Dispatch), target receiving bureau, and designated recipient name. Crucially, the officer can upload a scanned photo or PDF of the signed receiving copy as conclusive proof of delivery, establishing an unbroken chain of custody.

#### 9. Municipal Records Archive & Search Engine (`live_08_records_archive.png`)

![Figure 27. Municipal Records Archive & Search Engine.](screenshots/live_08_records_archive.png)
*Figure 27. Municipal Records Archive & Search Engine.*

* **Interface Architecture:** Comprehensive search and retrieval repository housing all concluded (`CLOSED`) municipal transactions.
* **Operational Flow:** Personnel can execute full-text queries across docket titles, requesting parties, and control numbers, or filter by the 14 document categories. Clicking "Examine Dossier" opens the multi-page case file with an integrated sandboxed PDF lightbox viewer allowing inline reading and authorized file downloads.

#### 10. Central Venue & Gavel Scheduler (`live_09_venue_scheduler.png`)

![Figure 28. Central Municipal Venue & Gavel Scheduler with Conflict Detection.](screenshots/live_09_venue_scheduler.png)
*Figure 28. Central Municipal Venue & Gavel Scheduler with Conflict Detection.*

* **Interface Architecture:** Centralized facility reservation suite covering all six (6) municipal venues (Municipal Conference Room, Command Center Room, Social Hall, Gymnasium, Mayor's Conference Room, and Administrator's Office).
* **Operational Flow:** Operators select a venue, reservation date, and time blocks. The system's algorithmic conflict engine checks the database in real-time; overlapping reservations trigger an immediate conflict advisory, preventing embarrassing double-bookings. Bookings involving the Mayor are flagged with a distinctive Mayoral Gavel badge.

#### 11. Statutory ARTA Compliance & Performance Analytics (`live_10_reports_compliance.png`)

![Figure 29. Statutory ARTA Compliance & Performance Analytics Ledger.](screenshots/live_10_reports_compliance.png)
*Figure 29. Statutory ARTA Compliance & Performance Analytics Ledger.*

* **Interface Architecture:** Executive performance dashboard tracking adherence to Republic Act No. 11032.
* **Operational Flow:** Displays high-level compliance pillars: SLA Success Rate (94.8%), Average Municipal Turnaround Duration (1.4 working days), and Overdue Escalated Dockets. A detailed category matrix provides monthly volume breakdowns by document type and approval status, with one-click export to PDF or Excel.

#### 12. Immutable Statutory Audit Trail & Administration (`live_11_audit_admin.png`)

![Figure 30. Immutable Statutory Audit Trail & Plantilla Administration.](screenshots/live_11_audit_admin.png)
*Figure 30. Immutable Statutory Audit Trail & Plantilla Administration.*

* **Interface Architecture:** Permanent chronological ledger recording all state-changing operations across the municipal system.
* **Operational Flow:** Each record displays the exact timestamp (PST), actor name, civil service role, IP context, action enum (`INTAKE`, `APPROVED`, `TRANSMITTED`, etc.), affected control number, and a SHA-256 cryptographic hash guaranteeing tamper-evidence under Republic Act No. 10175.

#### 13. Interactive Docket Dossier & 6-Stage Progress Tracker (`live_13_modal_dossier.png`)

![Figure 31. Interactive Docket Dossier & 6-Stage Progress Tracker.](screenshots/live_13_modal_dossier.png)
*Figure 31. Interactive Docket Dossier & 6-Stage Progress Tracker.*

* **Interface Architecture:** Consolidated case file modal presenting an interactive 6-stage lifecycle progress bar (Screening, Preparation, Review, Approval, Transmission, Archival) showing the exact current state of any municipal docket.
* **Operational Flow:** Features tabbed panels for Particulars, Annexes (with thumbnails and file download triggers), and complete Chronological History. Personnel can inspect attached scans or summon the Printable Routing Slip.

#### 14. Printable Official LGU Routing Slip Modal (`live_14_modal_routingslip.png`)

![Figure 32. Printable Official LGU Routing Slip Modal.](screenshots/live_14_modal_routingslip.png)
*Figure 32. Printable Official LGU Routing Slip Modal.*

* **Interface Architecture:** Faithful digital reproduction of physical government routing paper slips, formatted with the Santa Maria Municipal Seal, Bagong Pilipinas crest, unique barcode badge, statutory SLA countdown, routing checkboxes, and signature blocks.
* **Operational Flow:** Styled with CSS `@media print` rules, enabling officers to produce clean, standardized physical routing sheets on municipal printers with a single click.

---
<div style="page-break-after: always;"></div>


# XI. Test Results

### A. Requirements Traceability Matrix (RTM)
The Requirements Traceability Matrix (RTM) establishes bidirectional traceability between each Functional Requirement (FR-01 through FR-60) and its corresponding verification Test Case (TC-01 through TC-37). All test cases were executed against the live Microsoft Azure production environment (`https://kind-field-0061c5600.4.azurestaticapps.net`) and achieved a 100% pass rate.

| Req. ID | Subsystem / Functional Requirement Title | Test Case ID | Test Case Title | Execution Status |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01, FR-02** | Keycloak OIDC Authentication & Non-Storage of Passwords | **TC-01** | Verify Keycloak OIDC Login & Password Non-Storage | **PASS** |
| **FR-03, FR-04** | Session Management, JWT Token Renewal & Persona Switcher | **TC-02** | Verify Session Expiration & Plantilla Persona Selector | **PASS** |
| **FR-05** | Role-Based Access Control (RBAC) Route Enforcement | **TC-03** | Verify Granular Role-Based Route & Mutation Protection | **PASS** |
| **FR-06, FR-07** | 3-Step Intake Wizard & Automated Control Numbering | **TC-04** | Verify Intake Wizard & Control Number Formula Generation | **PASS** |
| **FR-08, FR-10** | HTML5 Camera Document Scanner & Multi-Page Dossier | **TC-05** | Verify HTML5 Camera Scanner & Multi-Page Frame Capture | **PASS** |
| **FR-09** | Drag-and-Drop File Feeder (PDF, DOCX, XLSX, Images) | **TC-06** | Verify Drag-and-Drop Multi-Format File Ingestion | **PASS** |
| **FR-11, FR-12** | 72-Hour ARTA Clock Initiation & Duplicate Detection | **TC-07** | Verify 72-Hour SLA Calculation & Duplicate Docket Warning | **PASS** |
| **FR-13, FR-14** | Completeness Verification Checklist & Workflow Advance | **TC-08** | Verify Screening Checklist & Advancement to Drafting | **PASS** |
| **FR-15, FR-16** | Return for Compliance Workflow & Deficient Resubmission | **TC-09** | Verify Formal Return for Compliance with Ground Logging | **PASS** |
| **FR-17, FR-18** | Screening Notes Audit & Priority Elevation Flagging | **TC-10** | Verify Screening Observation Logging & Priority Badging | **PASS** |
| **FR-19, FR-20** | Standard Template Library & Live Letterhead Rendering | **TC-11** | Verify Template Population & Stamped Letterhead Canvas | **PASS** |
| **FR-21, FR-22** | Draft Document Editing & Submission to Review Desk | **TC-12** | Verify Document Drafting Canvas & Review Desk Queueing | **PASS** |
| **FR-23, FR-24** | Multi-Tiered Review Queue & One-Click Executive Approval | **TC-13** | Verify Executive Queue & One-Click Approval Mutation | **PASS** |
| **FR-25** | Legislative Indorsement to Sangguniang Bayan | **TC-14** | Verify Administrative Indorsement with Action Directives | **PASS** |
| **FR-26** | Formal Denial with Mandatory Written Legal Grounds | **TC-15** | Verify Denial Dialogue Enforcing Written Grounds | **PASS** |
| **FR-27, FR-28** | Mayoral Signature Gate & Executive Batch Processing | **TC-16** | Verify Mayoral Signature Flagging & Batch Authorizations | **PASS** |
| **FR-29, FR-30** | Outward Transmittal Logging & Multi-Channel Dispatch | **TC-17** | Verify Transmission Desk & Dispatch Channel Classification | **PASS** |
| **FR-31, FR-32** | Signed Delivery Receipt Upload & Multi-Destination Transmit | **TC-18** | Verify Delivery Receipt Scan Upload & Custody Tracking | **PASS** |
| **FR-33, FR-34** | Concluded Transaction Closing & Read-Only Archival Lock | **TC-19** | Verify Concluded Docket Locking & Immutability Enforcement | **PASS** |
| **FR-35, FR-38** | Multi-Criteria Search Engine & Category Filter Tabs | **TC-20** | Verify Multi-Criteria Archival Search & Category Filtering | **PASS** |
| **FR-36, FR-37** | Inline PDF Lightbox Preview & Permitted File Download | **TC-21** | Verify Responsive PDF Lightbox Viewer & Hash Download | **PASS** |
| **FR-39, FR-40** | Multi-Venue Calendar Suite & Double-Booking Prevention | **TC-22** | Verify 6-Venue Calendar & Automated Conflict Detection | **PASS** |
| **FR-41, FR-42** | Tentative Conflict Logging & Mayoral Gavel Indicator | **TC-23** | Verify Tentative Conflict Handling & Mayoral Gavel Flag | **PASS** |
| **FR-43, FR-44** | Plantilla Attendee Tagging & Reservation Cancellation | **TC-24** | Verify Attendee Notification Tagging & Slot Cancellation | **PASS** |
| **FR-45, FR-46** | Live ARTA Operations HUD & 72-Hour Escalation Radar | **TC-25** | Verify Real-Time Operations HUD & Crimson SLA Escalation | **PASS** |
| **FR-47, FR-48** | Turnaround Speed Metrics & Category Balance Sheet | **TC-26** | Verify Turnaround Calculations & Monthly Volume Balance | **PASS** |
| **FR-49** | Report Export Engine to PDF and Excel Spreadsheets | **TC-27** | Verify Compliance Report Export to PDF & Spreadsheet | **PASS** |
| **FR-50, FR-51** | Immutable Audit Trail Ledger & User Attribution Context | **TC-28** | Verify Append-Only Audit Logging with Actor Attribution | **PASS** |
| **FR-52** | Cryptographic SHA-256 Tamper Checksum Verification | **TC-29** | Verify SHA-256 Checksum Fingerprinting on Audit Entries | **PASS** |
| **FR-53, FR-54** | Real-Time In-App Alerts & Deep-Linking Navigation | **TC-30** | Verify In-App Notification Center & Record Deep-Linking | **PASS** |
| **FR-55** | Interactive Docket Dossier & 6-Stage Progress Tracker | **TC-31** | Verify 6-Stage Lifecycle Progress Bar on Dossier Modal | **PASS** |
| **FR-56** | Printable Official LGU Routing Slip Modal | **TC-32** | Verify Physical Routing Slip Reproduction & Print Styling | **PASS** |
| **FR-57, FR-58** | XML Schema (XSD) Validation & Civic XML Export Subsystem | **TC-33** | Verify XML Schema (XSD) Validation & Validated Export | **PASS** |
| **FR-59, FR-60** | Multi-Device Responsive Layout & Horizontal Table Scroll | **TC-34** | Verify Viewport Responsiveness (375px to 1440px+) | **PASS** |
| Non-Functional | API Response Latency Benchmarking (<500ms SLA) | **TC-35** | Benchmark GraphQL Mutation & Query Response Latency | **PASS** |
| Non-Functional | Page Load Speed & Core Web Vitals (<3.0s SLA) | **TC-36** | Measure Dashboard Full Contentful Paint & Load Speed | **PASS** |
| Non-Functional | Security & Automated Vulnerability Scan Verification | **TC-37** | Conduct OWASP Top 10 Security & Input Sanitization Audit | **PASS** |

### B. Comprehensive Test Cases Execution Logs (TC-01 to TC-37)
Below are the detailed execution records for the 37 verification test cases, documenting tester identity, execution dates, pre-conditions, procedural steps, expected results, actual observed behavior, and conclusive pass/fail status.

```
========================================================================================
TEST CASE ID: TC-01
Test Case Title: Verify Keycloak OIDC Login & Password Non-Storage
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: 
  1) Active internet connection to https://kind-field-0061c5600.4.azurestaticapps.net/login
  2) Keycloak Identity Provider active on https://santamaria-docsys-idp.azurewebsites.net
Test Scenario: Verify that users are redirected to Keycloak OIDC, authenticated securely,
               and passwords are never stored in the application database.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Open /login page in Google Chrome.            | Displays official portal with crests.    | As Expected    | PASS
  2    | Click "Authenticate on Keycloak" button.      | Redirects to Keycloak realm login page.  | As Expected    | PASS
  3    | Enter username 'administrator' & password.    | Validates credentials via OIDC token.    | As Expected    | PASS
  4    | Click Sign In.                                | Redirects to /dashboard with JWT cookie. | As Expected    | PASS
  5    | Query app.users table in PostgreSQL.          | password_hash column is NULL or omitted. | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-02
Test Case Title: Verify Session Expiration & Plantilla Persona Selector
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: User on /login page; development mode active.
Test Scenario: Verify that test accounts can switch personas and sessions expire on timeout.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Select 'Engr. Elmer B. Clemente' in switcher. | Fills credentials for Administrator.     | As Expected    | PASS
  2    | Select 'Sherelyn O. Libao' in switcher.       | Fills credentials for Intake Clerk.      | As Expected    | PASS
  3    | Log in and simulate 8-hour token expiration.  | Interceptor prompts session re-auth.     | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-03
Test Case Title: Verify Granular Role-Based Route & Mutation Protection
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Authenticated as 'Sherelyn O. Libao' (Role: CLERK_ENCODER).
Test Scenario: Verify that clerks cannot execute executive approval mutations or access /admin.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Navigate to /incoming.                        | Access granted; displays intake queue.   | As Expected    | PASS
  2    | Attempt to navigate directly to /admin.       | Access denied; redirects or hides desk.  | As Expected    | PASS
  3    | Execute approveDocument mutation via GraphQL. | Returns 403 Forbidden: Insufficient role.| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-04
Test Case Title: Verify Intake Wizard & Control Number Formula Generation
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Authenticated as Clerk on /incoming.
Test Scenario: Verify that completing the intake wizard generates a valid sequential control number.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Log New Incoming" button.              | Opens 3-step Intake Docket Modal.        | As Expected    | PASS
  2    | Select Type: 'Travel Orders', Priority: HIGH. | Sets classification metadata.            | As Expected    | PASS
  3    | Enter Title: 'Provincial Planning Conference'.| Populates subject particulars.           | As Expected    | PASS
  4    | Enter Requester: 'HRMO Department'.           | Populates requesting party.              | As Expected    | PASS
  5    | Attach sample PDF document & click Submit.    | Generates TO-2026-XXXX and commits to DB. | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-05
Test Case Title: Verify HTML5 Camera Scanner & Multi-Page Frame Capture
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Workstation equipped with active USB camera; Intake modal open at Step 2.
Test Scenario: Verify that the live camera scanner captures document frames and compiles annexes.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Activate Camera Scanner" button.       | Prompts browser permission; starts video.| As Expected    | PASS
  2    | Align document within A4 reticle.             | Real-time video preview renders cleanly. | As Expected    | PASS
  3    | Click "Capture Frame" button.                 | Snaps high-res JPEG & adds thumbnail.    | As Expected    | PASS
  4    | Capture a second page.                        | Displays 2-page thumbnail strip.         | As Expected    | PASS
  5    | Click thumbnail to inspect in lightbox.       | Displays full-size captured scan.        | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-06
Test Case Title: Verify Drag-and-Drop Multi-Format File Ingestion
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: Intake modal open at Step 2.
Test Scenario: Verify ingestion of PDF, DOCX, XLSX, and PNG file formats.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Drag and drop a 4.2 MB PDF file into zone.    | Parses file; shows name, size, and icon. | As Expected    | PASS
  2    | Add a supporting .docx affidavit.             | Adds secondary attachment card.          | As Expected    | PASS
  3    | Attempt to drop an unsupported .exe file.     | Rejects file with validation error alert.| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-07
Test Case Title: Verify 72-Hour SLA Calculation & Duplicate Docket Warning
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Authenticated as Clerk.
Test Scenario: Verify that intake stamps a 72-business-hour deadline and warns on duplicates.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Ingest a document on Thursday at 2:00 PM PST. | Calculates SLA excluding weekend (72h).  | As Expected    | PASS
  2    | Ingest a second document with identical title.| Displays duplicate docket warning card.  | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-08
Test Case Title: Verify Screening Checklist & Advancement to Drafting
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Docket in SCREENING status on /incoming.
Test Scenario: Verify completeness checklist verification moves docket to PREPARATION.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Audit Checklist" on docket card.       | Opens Screening Verification dialogue.   | As Expected    | PASS
  2    | Check: Attachments Present, Signatures Valid. | Toggles validation flags to complete.    | As Expected    | PASS
  3    | Click "Advance to Drafting Studio".           | Mutates status to PREPARATION; logs audit.| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-09
Test Case Title: Verify Formal Return for Compliance with Ground Logging
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Incomplete docket in SCREENING status.
Test Scenario: Verify returning a docket records written statutory grounds.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Return for Compliance" button.         | Opens Return Notice modal.               | As Expected    | PASS
  2    | Enter: 'Missing barangay council resolution'. | Captures required deficiency notes.       | As Expected    | PASS
  3    | Click Confirm Return.                         | Sets status to RETURNED; appends log.    | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-10
Test Case Title: Verify Screening Observation Logging & Priority Badging
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: Screening officer on /incoming.
Test Scenario: Verify screening observations are saved and priority badges render properly.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Flag docket priority as URGENT.               | Displays distinctive red URGENT badge.   | As Expected    | PASS
  2    | Input screening remarks & save.               | Remarks persist in docket audit trail.   | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-11
Test Case Title: Verify Template Population & Stamped Letterhead Canvas
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Authenticated on /prepare.
Test Scenario: Verify template selection loads civil service clauses and renders letterhead.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click 'Executive Order Template (EO-MAYOR)'.  | Loads pre-configured preamble & body.    | As Expected    | PASS
  2    | Inspect letterhead canvas.                    | Renders Santa Maria Seal & Bagong Crest. | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-12
Test Case Title: Verify Document Drafting Canvas & Review Desk Queueing
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Drafting canvas open on /prepare.
Test Scenario: Verify draft editing and transition to REVIEW status.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Edit executive order directives in canvas.    | Updates rich-text draft in memory.       | As Expected    | PASS
  2    | Click "Submit for Executive Review".          | Mutates status to REVIEW; appears in /rev| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-13
Test Case Title: Verify Executive Queue & One-Click Approval Mutation
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Authenticated as Municipal Administrator on /review.
Test Scenario: Verify executive approval updates document status and logs approval signature.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Inspect pending review card.                  | Displays docket particulars and draft.   | As Expected    | PASS
  2    | Click "Approve Docket" button.                | Mutates status to APPROVED; signs log.   | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-14
Test Case Title: Verify Administrative Indorsement with Action Directives
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: Docket in REVIEW status on /review.
Test Scenario: Verify endorsing a docket to Sangguniang Bayan records directives.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Endorse to Sangguniang Bayan".         | Opens Indorsement directive dialog.      | As Expected    | PASS
  2    | Input directive: 'For ordinance enactment'.   | Captures administrative instructions.    | As Expected    | PASS
  3    | Click Confirm Indorsement.                    | Sets status to ENDORSED; routes docket.  | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-15
Test Case Title: Verify Denial Dialogue Enforcing Written Grounds
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Docket in REVIEW status on /review.
Test Scenario: Verify denial requires written grounds and updates status to DENIED.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Deny Docket" button.                   | Opens Denial Grounds Modal.              | As Expected    | PASS
  2    | Attempt to submit with empty grounds.         | Form validation prevents submission.     | As Expected    | PASS
  3    | Enter: 'Non-compliance with municipal zoning'.| Submits denial; sets status to DENIED.   | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-16
Test Case Title: Verify Mayoral Signature Flagging & Batch Authorizations
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Review desk loaded with routine travel orders.
Test Scenario: Verify Mayoral signature flags and batch approval execution.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Inspect Executive Order docket.               | Displays 'Mayor Signature Required' flag.| As Expected    | PASS
  2    | Select multiple standard Travel Orders.       | Activates batch action toolbar.          | As Expected    | PASS
  3    | Click "Batch Approve".                        | Approves all selected items atomically.  | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-17
Test Case Title: Verify Transmission Desk & Dispatch Channel Classification
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Authenticated as Clerk on /transmit.
Test Scenario: Verify logging an outward dispatch across delivery channels.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Locate approved docket in transmittal queue.  | Displays "Ready for Transmission".       | As Expected    | PASS
  2    | Click "Dispatch Docket".                      | Opens Transmittal particulars dialogue.  | As Expected    | PASS
  3    | Select Channel: 'Physical Courier'.          | Sets channel enum to PHYSICAL_COURIER.   | As Expected    | PASS
  4    | Enter Recipient: 'Barangay Poblacion Council'.| Populates receiving party data.          | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-18
Test Case Title: Verify Delivery Receipt Scan Upload & Custody Tracking
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: Dispatch dialog open on /transmit.
Test Scenario: Verify uploading signed delivery receipt scan completes transmittal.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Upload scanned receipt image.                 | Attaches proof_document_url to trans.    | As Expected    | PASS
  2    | Enter Received By: 'Kagawad M. Santos'.       | Logs physical receiving clerk.           | As Expected    | PASS
  3    | Click Complete Dispatch.                      | Sets status to TRANSMITTED; logs proof.  | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-19
Test Case Title: Verify Concluded Docket Locking & Immutability Enforcement
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Transmitted docket on /archive.
Test Scenario: Verify closing a docket locks all fields to read-only status.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Conclude Transaction".                 | Transitions status to CLOSED.            | As Expected    | PASS
  2    | Attempt to edit metadata or remove annexes.   | UI edit buttons disabled; API rejects.   | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-20
Test Case Title: Verify Multi-Criteria Archival Search & Category Filtering
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Authenticated on /archive.
Test Scenario: Verify searching across keywords, requesting parties, and category tabs.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Enter 'Poblacion' in search bar.              | Filters table to matching dockets in <1s.| As Expected    | PASS
  2    | Click 'Executive Orders' category tab.        | Filters records strictly to EO category. | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-21
Test Case Title: Verify Responsive PDF Lightbox Viewer & Hash Download
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Archived docket selected with PDF attachment.
Test Scenario: Verify inline sandboxed PDF rendering and file export.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "View PDF Attachment".                  | Opens sandboxed responsive lightbox view.| As Expected    | PASS
  2    | Verify multi-page document pagination.        | Scrolls cleanly through all pages.       | As Expected    | PASS
  3    | Click "Download Original Copy".               | Downloads file; SHA-256 matches DB hash. | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-22
Test Case Title: Verify 6-Venue Calendar & Automated Conflict Detection
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: Authenticated on /schedule.
Test Scenario: Verify calendar displays all 6 venues and rejects overlapping reservations.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Inspect venue calendar grid.                  | Displays all 6 facilities with capacities| As Expected    | PASS
  2    | Book Social Hall: Oct 20, 9:00 AM - 12:00 PM. | Reservation confirmed; slot occupied.   | As Expected    | PASS
  3    | Attempt second booking: Oct 20, 10:00 - 1:00. | Rejects with Red Conflict Advisory alert.| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-23
Test Case Title: Verify Tentative Conflict Handling & Mayoral Gavel Flag
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Overlapping booking attempted on /schedule.
Test Scenario: Verify recording tentative status and Mayoral Gavel badging.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Check 'Record as Tentative' on conflict alert.| Commits booking with status TENTATIVE.   | As Expected    | PASS
  2    | Check 'Involves Municipal Mayor' flag.        | Displays prominent Mayoral Gavel badge.  | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-24
Test Case Title: Verify Attendee Notification Tagging & Slot Cancellation
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Confirmed booking on /schedule.
Test Scenario: Verify tagging plantilla attendees and canceling reservations.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Tag 'Engr. Elmer B. Clemente' as attendee.    | Adds user to event attendee roster.      | As Expected    | PASS
  2    | Click "Cancel Reservation" & confirm.         | Frees time slot; marks status CANCELLED. | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-25
Test Case Title: Verify Real-Time Operations HUD & Crimson SLA Escalation
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Authenticated on /dashboard.
Test Scenario: Verify 4-cell HUD metrics and SLA countdown escalation triggers.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Verify 4-cell operations HUD counts.          | Displays Influx, Queues, SLA%, Logistics.| As Expected    | PASS
  2    | Simulate a docket exceeding 72 business hours.| Triggers Crimson SLA Escalation banner.  | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-26
Test Case Title: Verify Turnaround Calculations & Monthly Volume Balance
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: Authenticated on /reports.
Test Scenario: Verify turnaround speed calculations and monthly category distributions.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Inspect SLA Success Rate metric.              | Renders 94.8% on-time compliance.        | As Expected    | PASS
  2    | Inspect Category Balance Sheet table.         | Displays monthly volume breakdown by type| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-27
Test Case Title: Verify Compliance Report Export to PDF & Spreadsheet
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Compliance reports view loaded on /reports.
Test Scenario: Verify exporting compliance summaries into PDF and Excel formats.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Export Compliance Ledger (PDF)".       | Downloads formatted civil service report.| As Expected    | PASS
  2    | Click "Export Category Matrix (Excel)".       | Downloads .xlsx spreadsheet ledger.      | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-28
Test Case Title: Verify Append-Only Audit Logging with Actor Attribution
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Authenticated as Municipal Administrator on /admin.
Test Scenario: Verify that mutations generate permanent audit log entries with user context.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Execute an intake, screening, and approval.   | Generates sequential entries in audit_log| As Expected    | PASS
  2    | Inspect audit record particulars.             | Contains actor name, role, IP, and time. | As Expected    | PASS
  3    | Attempt DELETE on app.audit_logs via SQL.     | RDBMS trigger blocks deletion.           | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-29
Test Case Title: Verify SHA-256 Checksum Fingerprinting on Audit Entries
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Access to audit log viewer on /admin.
Test Scenario: Verify SHA-256 cryptographic fingerprints ensure data integrity.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Inspect hash_checksum column of audit record. | Displays 64-character SHA-256 hex string.| As Expected    | PASS
  2    | Recompute hash over payload fields.           | Computed hash exactly matches stored val.| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-30
Test Case Title: Verify In-App Notification Center & Record Deep-Linking
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: Authenticated user with pending actions.
Test Scenario: Verify notification badges and deep-linking into affected dossiers.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Inspect notification bell in header.          | Displays unread badge counter.           | As Expected    | PASS
  2    | Click notification: 'Docket Review Pending'.  | Directly navigates and opens dossier.    | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-31
Test Case Title: Verify 6-Stage Lifecycle Progress Bar on Dossier Modal
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Dossier modal open for any document record.
Test Scenario: Verify visual progress tracker reflects current lifecycle state.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Open dossier for docket in REVIEW status.     | Steps 1-3 highlighted green; Step 4 blue.| As Expected    | PASS
  2    | Approve docket and refresh dossier.           | Step 4 advances to completed green state.| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-32
Test Case Title: Verify Physical Routing Slip Reproduction & Print Styling
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Dossier modal open; click "Print Routing Slip".
Test Scenario: Verify generated routing slip matches physical LGU paper sheets.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Inspect routing slip modal preview.           | Displays Santa Maria seal, barcode, slip.| As Expected    | PASS
  2    | Execute window.print() action.                | Formats cleanly as A4 paper layout.      | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-33
Test Case Title: Verify XML Schema (XSD) Validation & Validated Export
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Concluded docket on /archive.
Test Scenario: Verify XML validation against XSD schema and civic XML file export.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Click "Validate Document XML (XSD)".          | Evaluates against docsys-record.xsd: PASS| As Expected    | PASS
  2    | Click "Export XML Record".                    | Downloads well-formed municipal XML file.| As Expected    | PASS
========================================================================================
TEST CASE ID: TC-34
Test Case Title: Verify Viewport Responsiveness (375px to 1440px+)
Created By: Maria Angelique D. Bernardino
Date Tested: October 14, 2026
Pre-conditions: Google Chrome DevTools Device Mode.
Test Scenario: Verify layout integrity on mobile (375px), tablet (768px), and desktop (1440px).
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Emulate iPhone SE (375px viewport).           | Shows hamburger drawer; zero overflow.   | As Expected    | PASS
  2    | Emulate iPad (768px viewport).                | 2-column cards adapt gracefully.         | As Expected    | PASS
  3    | Emulate 1440px Desktop display.               | Full multi-column HUD renders cleanly.   | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-35
Test Case Title: Benchmark GraphQL Mutation & Query Response Latency
Created By: Wilson G. Ponseca
Date Tested: October 14, 2026
Pre-conditions: Network monitoring active on Chrome DevTools.
Test Scenario: Measure response times of primary GraphQL endpoints.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Execute GetDashboardLedger query.             | Completes in < 250ms (Observed: 184ms).   | As Expected    | PASS
  2    | Execute CreateDocumentIntake mutation.        | Completes in < 400ms (Observed: 295ms).   | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-36
Test Case Title: Measure Dashboard Full Contentful Paint & Load Speed
Created By: Eden Grace F. Gamundoy
Date Tested: October 14, 2026
Pre-conditions: Lighthouse Audit on production deployment.
Test Scenario: Verify Core Web Vitals compliance on production Azure Static Web Apps.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Run Google Lighthouse on /dashboard.          | Performance Score >= 90; FCP < 1.5s.     | As Expected    | PASS
  2    | Verify Time to Interactive (TTI).             | Reaches TTI in 1.8 seconds (<3.0s SLA).  | As Expected    | PASS
========================================================================================
TEST CASE ID: TC-37
Test Case Title: Conduct OWASP Top 10 Security & Input Sanitization Audit
Created By: Louis Jefferson V. Samosino
Date Tested: October 14, 2026
Pre-conditions: Security testing tools active against GraphQL endpoint.
Test Scenario: Verify protection against SQL injection, XSS, and unauthorized mutations.
Step # | Step Details                                  | Expected Results                         | Actual Results | Status
  1    | Inject SQL payload into search query.         | Parameterized ORM escapes input safely.  | As Expected    | PASS
  2    | Inject <script> alert into docket title.      | React escapes HTML tags; zero execution. | As Expected    | PASS
  3    | Mutate docket without Bearer JWT token.       | Rejects with 401 Unauthorized status.    | As Expected    | PASS
========================================================================================
```

![Figure 33: Statutory Performance Analytics](figures/fig6_performance_analytics_chart.png)
*Figure 33. RA 11032 Statutory Operational Performance & Turnaround Analytics.*

![Figure 34: Test Results & Quality Assurance Metrics](figures/fig7_test_results_chart.png)
*Figure 34. Quality Assurance, Test Execution Results & Verification Metrics.*

### C. Quality Metrics, Turnaround Benchmarks, and Verification Summary
Across all thirty-seven (37) rigorous test executions, DocSys v2.6 demonstrated flawless adherence to functional, statutory, and non-functional engineering standards:
* **Test Case Pass Rate:** 100.0% (37 passed out of 37 executed).
* **Defect Density:** 0 critical, 0 major, and 0 unresolved minor defects in production.
* **RA 11032 SLA Compliance Rate:** 94.8% of test dockets processed within 72 business hours.
* **Average Turnaround Duration:** 1.4 working days (substantially outperforming the 3.0-day statutory mandate).
* **Average API Response Time:** 184 milliseconds (well under the 500ms ceiling).
* **Cross-Browser Verification:** Verified with 100% visual and interactive parity across Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari.

---
<div style="page-break-after: always;"></div>


# XII. Working Web Site Link

### A. Production Deployment Endpoints and Source Code Repository
DocSys v2.6 is fully deployed in high-availability cloud environments under active Microsoft Azure enterprise subscriptions. The operational endpoints and repository links are provided below:

* **Production Application Web URL:**  
  [https://kind-field-0061c5600.4.azurestaticapps.net](https://kind-field-0061c5600.4.azurestaticapps.net)  
  *(Hosted on Microsoft Azure Static Web Apps, Southeast Asia Region)*

* **Civil Service Authentication Portal URL:**  
  [https://kind-field-0061c5600.4.azurestaticapps.net/login](https://kind-field-0061c5600.4.azurestaticapps.net/login)

* **Keycloak OpenID Connect Identity Provider Endpoint:**  
  [https://santamaria-docsys-idp.azurewebsites.net](https://santamaria-docsys-idp.azurewebsites.net)

* **Backend GraphQL API Server Endpoint:**  
  [https://santamaria-docsys-api.azurewebsites.net/graphql](https://santamaria-docsys-api.azurewebsites.net/graphql)  
  *Health Probe Check:* [https://santamaria-docsys-api.azurewebsites.net/health](https://santamaria-docsys-api.azurewebsites.net/health)

* **Azure PostgreSQL Flexible Database Server:**  
  `santamaria-docsys-db.postgres.database.azure.com` (Port: 5432, SSL/TLS 1.2+ Enforced)

* **Official GitHub Source Code Repository:**  
  [https://github.com/Samosinolouis/Maria_Bulacan_DocSys](https://github.com/Samosinolouis/Maria_Bulacan_DocSys)

### B. Enrolled Civil Service Plantilla Accounts and Verification Credentials
For academic grading, role permission evaluation, and faculty inspection, the following verified plantilla user credentials are enrolled in the production Keycloak realm:

| Plantilla Position Title | Representative Official Name | Official LGU Email / Username | Verification Password | Authorized Plantilla Role | Scope of Access Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Municipal Administrator** | **Engr. Elmer B. Clemente** | `administrator` / `admin@santamaria.gov.ph` | `DocSys2026!` | `ADMINISTRATOR` | Full administrative authority; reviews, approves, endorses, or denies all dockets; user management; master audit log. |
| **Municipal Mayor** | **Hon. Bartolome** | `mayor@santamaria.gov.ph` | `DocSys2026!` | `ADMINISTRATOR` | Executive approvals on Executive Orders, town-wide policies; Mayoral Gavel calendar sessions. |
| **Executive Assistant II** | **Mr. Benito C. Fabian** | `ea.fabian@santamaria.gov.ph` | `DocSys2026!` | `EXECUTIVE_ASSISTANT` | Secondary executive review; endorsements; approvals and denials; compliance dashboard access. |
| **Administrative Officer IV** | **Officer J. Garcia** | `jgarcia@santamaria.gov.ph` | `DocSys2026!` | `OFFICER` | Document drafting studio; template preparation for Travel Orders, EOs, and Indorsements. |
| **Senior Legal Officer** | **Atty. Rodrigo Ramos** | `legal@santamaria.gov.ph` | `DocSys2026!` | `OFFICER` | Reviews municipal contracts, MOAs, and formulates formal Legal Opinions. |
| **Records Custodian / Intake** | **Ms. Sherelyn O. Libao** | `clerk` / `records.slibao@santamaria.gov.ph` | `DocSys2026!` | `CLERK_ENCODER` | Central receiving desk; intake wizard; HTML5 camera scanner; completeness screening; transmittals; venue reservations. |

*Security Notice: In production municipal operation, default passwords are replaced upon first login with mandatory multi-factor authentication (MFA) pursuant to Republic Act No. 10173.*

---
<div style="page-break-after: always;"></div>


# XIII. Sign-Off Document

### A. Formal Client Acceptance and Project Sign-Off Certificate

```
========================================================================================
                          REPUBLIC OF THE PHILIPPINES
                              PROVINCE OF BULACAN
                         MUNICIPALITY OF SANTA MARIA
                     OFFICE OF THE MUNICIPAL ADMINISTRATOR

              FINAL PROJECT ACCEPTANCE AND STATUTORY SIGN-OFF CERTIFICATE
========================================================================================

PROJECT TITLE:
Cloud-Based Document Management and Statutory Operations System (DocSys v2.6)

INSTITUTIONAL CLIENT:
Office of the Municipal Administrator
Local Government Unit of the Municipality of Santa Maria, Province of Bulacan

DEVELOPER GROUP:
Group 9 — School of Information Technology, Mapúa University
  * BERNARDINO, MARIA ANGELIQUE D. (Student No. 2023104521)
  * GAMUNDOY, EDEN GRACE F. (Student No. 2023103984)
  * PONSECA, WILSON G. (Student No. 2023101289)
  * SAMOSINO, LOUIS JEFFERSON V. (Student No. 2023107842)

COURSE & TERM:
ITS122P — Web Systems and Technologies 2 (FOPM01_1Q2627), First Quarter AY 2026-2027

----------------------------------------------------------------------------------------
CLIENT ATTESTATION AND FINAL ACCEPTANCE:

This is to certify that the Office of the Municipal Administrator of the Municipality of 
Santa Maria, Bulacan has thoroughly inspected, tested, and evaluated the Cloud-Based Document 
Management System (DocSys v2.6) developed by Group 9 of Mapúa University.

The undersigned Municipal Administrator hereby confirms that:
1. The web application successfully fulfills all functional, statutory, and architectural 
   requirements stipulated in the Project Brief and Technical Proposal;
2. The six-step document lifecycle (Intake, Screening, Drafting, Review, Transmission, Archival) 
   faithfully reflects our standard operating procedures;
3. The centralized venue scheduling calendar successfully eliminates double-bookings across 
   our six (6) municipal facilities;
4. The live ARTA SLA Radar effectively tracks and enforces the 72-hour turnaround mandate 
   under Section 21 of Republic Act No. 11032;
5. The immutable audit trail and Keycloak role-based access control comply with the security 
   and confidentiality standards of Republic Act No. 10173 and Republic Act No. 10175;
6. The deployed application on Microsoft Azure (https://kind-field-0061c5600.4.azurestaticapps.net) 
   is hereby officially ACCEPTED and APPROVED for academic submission and operational parallel 
   implementation.

Signed and certified this 16th day of October, 2026 at the Municipal Hall, Poblacion, 
Santa Maria, Bulacan, Republic of the Philippines.


CONFORME AND OFFICIALLY ACCEPTED:

[SGD]
ENGR. ELMER B. CLEMENTE
Municipal Administrator
Municipality of Santa Maria, Bulacan
Head of Client Office


NOTED AND ENDORSED:

[SGD]
BENITO C. FABIAN
Executive Assistant II
Office of the Municipal Administrator


[SGD]
SHERELYN O. LIBAO
Administrative Officer IV / Records Custodian
Office of the Municipal Administrator


ACADEMIC ENDORSEMENT:

[SGD]
Prof. GELDOF RESUELLO
Instructor, School of Information Technology
Mapúa University
========================================================================================
```
