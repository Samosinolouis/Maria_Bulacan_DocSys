# build_sections_part3.py
# Section VIII (Features of the System), Section IX (Communication Letter), 
# and Section X (Functions of the System)

SECTION_VIII = """# VIII. Features of the System

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
* **Layout Structure:** Features the top-level 4-cell operations HUD (Active Registry, Signature Desk Queue, ARTA SLA Integrity %, and Venue Logistics), a prominent amber-bordered ARTA directive alert card, a 2-column layout housing the Category Balance Sheet on the left, and the Primary Docket Ledger Table on the right.
* **Interaction:** Clicking any metric card filters the underlying docket table. Search inputs provide instant filtering across control numbers and requesting parties.

#### 2. Wireframe 02: Reception and Screening Queue (`wireframe-02-incoming.png`)
* **Layout Structure:** High-density 2-column card grid representing incoming dockets in `RECEIVED` or `SCREENING` status. Each card prominently displays the generated control number, requesting party, origin office, elapsed business hours, and screening status.
* **Interaction:** Features action buttons to initiate the 3-step Intake Wizard ("Log New Incoming"), open the completeness screening checklist ("Audit Requirements"), or issue a formal return-for-compliance notice.

#### 3. Wireframe 03: Document Preparation Studio (`wireframe-03-prepare.png`)
* **Layout Structure:** 3-column template selection grid showcasing pre-configured municipal drafting templates (Travel Orders, Executive Orders, SB Indorsements, Overtime Authorities, and Mayor's Permits).
* **Interaction:** Selecting a template expands the drafting canvas, pre-populates standardized statutory clauses, and activates the live municipal letterhead preview.

#### 4. Wireframe 04: Signature and Endorsement Desk (`wireframe-04-review.png`)
* **Layout Structure:** Executive review queue displaying cards categorized by urgency (`NORMAL`, `HIGH`, `URGENT`). Each item displays the assigned drafter, subject matter, draft version, and SLA countdown.
* **Interaction:** Provides direct action controls: "Approve Docket", "Endorse to SB/Bureaus", or "Deny Docket" (which summons a mandatory modal requiring written legal grounds).

#### 5. Wireframe 05: Transmission Desk (`wireframe-05-transmit.png`)
* **Layout Structure:** Tabular dispatch ledger displaying approved and signed documents ready for outward delivery. Columns indicate Docket Control No., Subject, Approving Authority, Target Destination Office, and Status.
* **Interaction:** Clicking "Dispatch Docket" triggers the transmittal modal to select delivery channel (courier, pickup, email, portal), input recipient name, and upload a signed physical delivery receipt scan.

#### 6. Wireframe 06: Municipal Records Archive (`wireframe-06-archive.png`)
* **Layout Structure:** Search-centric archival interface featuring a master search bar, category filter tabs across the 14 document types, and a comprehensive tabular ledger of concluded transactions.
* **Interaction:** Personnel can filter by calendar year, originating department, or status (`CLOSED`). Clicking "Examine Dossier" opens the complete historical case file with inline PDF preview.

#### 7. Wireframe 07: Venue and Gavel Calendar (`wireframe-07-schedule.png`)
* **Layout Structure:** 3-column card grid representing the six (6) municipal facilities (Municipal Conference Room, Command Center, Social Hall, Gymnasium, Mayor's Conference Room, and Administrator's Office), displaying capacity badges and scheduled reservations.
* **Interaction:** Clicking "Schedule Venue" opens the reservation modal with automated real-time conflict detection. Overlapping bookings display a red conflict warning.

#### 8. Wireframe 08: ARTA Compliance Ledger (`wireframe-08-reports.png`)
* **Layout Structure:** 3-pillar metric overview displaying SLA Success Rate (94.8%), Average Turnaround Duration (1.4 days), and Overdue Escalated Dockets. Below, a comprehensive category processing matrix details volume by status.
* **Interaction:** Supports date range filtering and provides buttons to export reports into formatted PDF or Excel spreadsheets.

#### 9. Wireframe 09: Statutory Audit Trail (`wireframe-09-admin.png`)
* **Layout Structure:** Chronological event list detailing system mutations. Each row indicates the exact timestamp (PST), actor name, civil service role, action enum, affected control number, and SHA-256 hash.
* **Interaction:** Master search enables filtering by user name, action type, or docket number. The ledger is strictly read-only.

#### 10. Wireframe 10: New Intake Wizard Modal (`wireframe-10-modal-intake.png`)
* **Layout Structure:** Centered dialog featuring a 3-step progress bar: Step 1 (Classification & Particulars), Step 2 (Attachments & Camera Scanning), and Step 3 (Completeness Checklist & Confirmation).
* **Interaction:** Form validation ensures all required fields and attachments are present before generating the control number and committing the docket.

#### 11. Wireframe 11: Document Detail Dossier Modal (`wireframe-11-modal-dossier.png`)
* **Layout Structure:** Comprehensive modal dialogue featuring a top 6-stage lifecycle progress tracker (Screening, Preparation, Review, Approval, Transmission, Archival), tabbed panels for Particulars, Annexes, and Audit History.
* **Interaction:** Allows authorized officers to view full docket particulars, preview attached files, or print the official routing slip.

#### 12. Wireframe 12: Printable Routing Slip Modal (`wireframe-12-modal-routingslip.png`)
* **Layout Structure:** Faithful reproduction of physical government routing slips, incorporating the Santa Maria Municipal Seal, Bagong Pilipinas crest, barcode docket badge, routing checkboxes, and signature blocks.
* **Interaction:** Formatted with CSS `@media print` rules for direct output to standard A4 municipal paper on office printers.

---
<div style="page-break-after: always;"></div>
"""

SECTION_IX = """# IX. Communication Letter

### A. Formal Communication Letter of Intent
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
"""

SECTION_X = """# X. Functions of the System

### A. Operational Walkthrough of Live Deployed System
The Santa Maria Document Management System (DocSys v2.6) is fully deployed, operational, and publicly accessible at `https://kind-field-0061c5600.4.azurestaticapps.net`. The application runs on Microsoft Azure Static Web Apps, connecting to an Azure App Service GraphQL API and an Azure Database for PostgreSQL Flexible Server.

The operational walkthrough below demonstrates the end-to-end execution of the fourteen (14) primary subsystems and interface modules, captured directly from the verified live cloud production environment.

### B. Subsystem Feature Demonstrations with Annotated Screenshots (14 Live Screens)

#### 1. Civil Service Authentication Portal (`live_01_login_portal.png`)
* **Interface Architecture:** The entry point enforces the DICT Philippine Government Web Template Standard (GWTS v25.3.3) with the official Republic of the Philippines top bar, synchronized Philippine Standard Time (PST), and dual heraldic insignias (Official Seal of Santa Maria and Bagong Pilipinas).
* **Operational Flow:** Civil servants are presented with statutory legal disclosures under Republic Act No. 10173 and Republic Act No. 10175. Clicking "Authenticate on Keycloak" initiates the secure OIDC authorization code flow. For academic auditing and role evaluation, the portal features a Plantilla Persona selector enabling instant verification across Administrator, Mayor, Administrative Officer, and Intake Clerk tiers.

#### 2. Keycloak OpenID Connect Identity Provider (`live_02_keycloak_idp.png`)
* **Interface Architecture:** Hosted on Azure App Service (`https://santamaria-docsys-idp.azurewebsites.net`), the Keycloak IAM server renders a customized Santa Maria civic login theme built with Keycloakify.
* **Operational Flow:** Enforces enterprise password policies, TLS encryption, and secure session cookie issuance. Upon entering valid plantilla credentials (`administrator` / `DocSys2026!` or `clerk` / `DocSys2026!`), Keycloak returns an authorized JWT identity token and redirects the browser securely back to the application dashboard.

#### 3. Executive Operations Command Center & ARTA SLA Radar (`live_03_dashboard.png`)
* **Interface Architecture:** The operational cockpit of the Municipal Administrator. Features a 4-cell operations HUD:
  1. *Active Docket Influx:* Total dockets currently moving through the municipal pipeline (18 active).
  2. *Executive Signature Desk:* Documents awaiting immediate Administrator or Mayoral signature (4 pending).
  3. *ARTA SLA Integrity:* Percentage of dockets processed within the statutory 72-hour window (94.8% compliance).
  4. *Venue Logistics:* Confirmed municipal facility reservations for the current calendar week (12 events).
* **Operational Flow:** Directly beneath the HUD, a prominent crimson-bordered ARTA Directive Alert card flags any transaction approaching or exceeding 72 business hours. The right panel houses the searchable Docket Ledger Table with instant text filtering, priority badging (`NORMAL`, `HIGH`, `URGENT`), and direct access to examine full dossiers.

#### 4. Reception and Screening Queue Subsystem (`live_04_incoming_screening.png`)
* **Interface Architecture:** Designed for the Central Receiving Desk and Records Custodian. Presents incoming submissions organized in a high-density 2-column card layout.
* **Operational Flow:** Each card displays the control number, date of intake, requesting citizen or agency, originating office, and current screening status. Frontline clerks utilize action triggers to audit completeness ("Audit Checklist"), open the live document scanner, or formally return deficient dockets ("Return for Compliance").

#### 5. 3-Step Intake Docket Wizard & Camera Scanner (`live_12_modal_intake.png`)
* **Interface Architecture:** Centered modal dialogue guiding the receiving clerk through three rigorous intake phases:
  - *Step 1 (Docket Metadata):* Document Classification dropdown (14 types), Subject Title, Requesting Party, Originating Bureau, and Priority Level.
  - *Step 2 (Multi-Format Attachment Feeder):* Integrates both a drag-and-drop file upload zone (supporting PDF, DOCX, XLSX, images) and the Live HTML5 Camera Document Scanner targeting workstation document cameras with an A4 alignment reticle.
  - *Step 3 (Statutory Screening Checklist):* Enforces mandatory verification checkboxes for Attachment Completeness, Authorized Signatures, and Valid Department Addressee.
* **Operational Flow:** Submitting the form automatically generates the official municipal control number (e.g. `TO-2026-0042`), logs the timestamp, initiates the 72-hour SLA countdown, and commits the transaction to PostgreSQL.

#### 6. Official Document Preparation & Drafting Studio (`live_05_prepare_studio.png`)
* **Interface Architecture:** A dedicated drafting studio providing a 3-column template selection grid featuring standardized municipal templates: Travel Orders (`TO-LGU-2026`), Executive Orders (`EO-MAYOR-2026`), Sangguniang Bayan 1st Indorsements (`IND-SB-2026`), Venue Clearance Requests (`VR-GSO-2026`), and Overtime Authorizations (`OT-HRMO-2026`).
* **Operational Flow:** Action officers select a template to populate pre-approved civil service language, edit particulars, and preview the document dynamically formatted with the official Santa Maria municipal letterhead. Clicking "Submit for Executive Review" locks the draft and places it directly into the Administrator's queue.

#### 7. Executive Signature & Endorsement Desk (`live_06_review_endorsement.png`)
* **Interface Architecture:** Dedicated executive queue reserved for the Municipal Administrator and Municipal Mayor. 
* **Operational Flow:** Features actionable controls for every pending docket:
  - *Approve Docket:* One-click executive approval; appends an immutable signature event and transitions status to `APPROVED`.
  - *Endorse Docket:* Forwards the record to the Sangguniang Bayan or municipal departments with attached administrative directives.
  - *Deny Docket:* Opens a mandatory dialogue requiring the executive to specify written statutory grounds for rejection, permanently binding the denial justification to the public record.

#### 8. Central Transmission Desk & Outgoing Dispatch Queue (`live_07_transmission_desk.png`)
* **Interface Architecture:** Outgoing transmittal registry managing approved resolutions, permits, and executive orders ready for external release.
* **Operational Flow:** Dispatch officers record the transmittal channel (Physical Courier, In-Person Pickup, Official Government Email, or Portal Dispatch), target receiving bureau, and designated recipient name. Crucially, the officer can upload a scanned photo or PDF of the signed receiving copy as conclusive proof of delivery, establishing an unbroken chain of custody.

#### 9. Municipal Records Archive & Search Engine (`live_08_records_archive.png`)
* **Interface Architecture:** Comprehensive search and retrieval repository housing all concluded (`CLOSED`) municipal transactions.
* **Operational Flow:** Personnel can execute full-text queries across docket titles, requesting parties, and control numbers, or filter by the 14 document categories. Clicking "Examine Dossier" opens the multi-page case file with an integrated sandboxed PDF lightbox viewer allowing inline reading and authorized file downloads.

#### 10. Central Venue & Gavel Scheduler (`live_09_venue_scheduler.png`)
* **Interface Architecture:** Centralized facility reservation suite covering all six (6) municipal venues (Municipal Conference Room, Command Center Room, Social Hall, Gymnasium, Mayor's Conference Room, and Administrator's Office).
* **Operational Flow:** Operators select a venue, reservation date, and time blocks. The system's algorithmic conflict engine checks the database in real-time; overlapping reservations trigger an immediate conflict advisory, preventing embarrassing double-bookings. Bookings involving the Mayor are flagged with a distinctive Mayoral Gavel badge.

#### 11. Statutory ARTA Compliance & Performance Analytics (`live_10_reports_compliance.png`)
* **Interface Architecture:** Executive performance dashboard tracking adherence to Republic Act No. 11032.
* **Operational Flow:** Displays high-level compliance pillars: SLA Success Rate (94.8%), Average Municipal Turnaround Duration (1.4 working days), and Overdue Escalated Dockets. A detailed category matrix provides monthly volume breakdowns by document type and approval status, with one-click export to PDF or Excel.

#### 12. Immutable Statutory Audit Trail & Administration (`live_11_audit_admin.png`)
* **Interface Architecture:** Permanent chronological ledger recording all state-changing operations across the municipal system.
* **Operational Flow:** Each record displays the exact timestamp (PST), actor name, civil service role, IP context, action enum (`INTAKE`, `APPROVED`, `TRANSMITTED`, etc.), affected control number, and a SHA-256 cryptographic hash guaranteeing tamper-evidence under Republic Act No. 10175.

#### 13. Interactive Docket Dossier & 6-Stage Progress Tracker (`live_13_modal_dossier.png`)
* **Interface Architecture:** Consolidated case file modal presenting an interactive 6-stage lifecycle progress bar (Screening, Preparation, Review, Approval, Transmission, Archival) showing the exact current state of any municipal docket.
* **Operational Flow:** Features tabbed panels for Particulars, Annexes (with thumbnails and file download triggers), and complete Chronological History. Personnel can inspect attached scans or summon the Printable Routing Slip.

#### 14. Printable Official LGU Routing Slip Modal (`live_14_modal_routingslip.png`)
* **Interface Architecture:** Faithful digital reproduction of physical government routing paper slips, formatted with the Santa Maria Municipal Seal, Bagong Pilipinas crest, unique barcode badge, statutory SLA countdown, routing checkboxes, and signature blocks.
* **Operational Flow:** Styled with CSS `@media print` rules, enabling officers to produce clean, standardized physical routing sheets on municipal printers with a single click.

---
<div style="page-break-after: always;"></div>
"""

print("Part 3 text ready.")
