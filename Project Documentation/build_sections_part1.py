# build_sections_part1.py
# Cover Page, Table of Contents, Section I (Introduction), Section II (Problem Statement & Objectives), 
# Section III (UN SDGs Addressed), and Section IV (Scope of the Project)

SECTION_COVER = """# Republic of the Philippines
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
"""

SECTION_TOC = """# TABLE OF CONTENTS

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

"""


SECTION_I = """# I. Introduction

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
"""

SECTION_II = """# II. Problem Statement & Objectives

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
"""

SECTION_III = """# III. UN SDGs Addressed

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
"""

SECTION_IV = """# IV. Scope of the Project

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
"""

print("Part 1 text ready.")
