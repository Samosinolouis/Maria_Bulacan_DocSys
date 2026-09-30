# Municipal Document Management & Statutory Operations System (DocSys)
### Office of the Municipal Administrator &bull; Bayan ng Santa Maria, Bulacan

Official cloud-based civic document management, executive review, and venue scheduling system built in strict adherence to **Republic Act 11032** (Ease of Doing Business & 72-Hour Turnaround Mandate) and **DICT Government Web Tracking Standards (GWTS v25.3.3)**.

---

## 🌐 Live Production Deployment
- **Azure Static Web Apps URL**: [https://kind-field-0061c5600.4.azurestaticapps.net](https://kind-field-0061c5600.4.azurestaticapps.net)
- **Deployment Status**: Active &bull; Production

---

## 🏛️ System Modules & Routing Architecture

| Division | Module | Path | Description |
| :--- | :--- | :--- | :--- |
| **I. Intake & Registry** | **Executive Command Center** | `/dashboard` | Live operational overview, ARTA 72-hour SLA radar, and docket records. |
| | **Reception & Screening** | `/incoming` | Physical intake completeness check (signatures, attachments, addressing). |
| **II. Executive Review & Archive** | **Document Preparation** | `/prepare` | Standard drafting studio for Travel Orders, EOs, and Indorsements. |
| | **Signature & Endorsement** | `/review` | Mayoral and Municipal Administrator review desk and seal stamping. |
| | **Transmission Desk** | `/transmit` | Central dispatch queue for outgoing certifications and resolutions. |
| | **Municipal Records Archive** | `/archive` | Concluded records repository with dossier retrieval. |
| **III. Logistics & Compliance** | **Venue & Gavel Calendar** | `/schedule` | Real-time scheduling across all 6 municipal venues to prevent double-booking. |
| | **ARTA Compliance Ledger** | `/reports` | RA 11032 statutory compliance metrics and 72-hour SLA analytics. |
| | **Statutory Audit Trail** | `/admin` | Immutable, tamper-evident chronological custody and mutation trail. |

---

## 📐 Wireframe Application & Visual Audits

An isolated, white/blank wireframe suite is housed in [`wireframe/`](./wireframe/) reflecting the complete system architecture without production imagery or narrative data:

- **Directory**: [`wireframe/`](./wireframe/)
- **Screenshots**: High-resolution wireframe audits stored in [`wireframe/screenshots/`](./wireframe/screenshots/):
  - `wireframe-01-dashboard.png`
  - `wireframe-02-incoming.png`
  - `wireframe-03-prepare.png`
  - `wireframe-04-review.png`
  - `wireframe-05-transmit.png`
  - `wireframe-06-archive.png`
  - `wireframe-07-schedule.png`
  - `wireframe-08-reports.png`
  - `wireframe-09-admin.png`
  - `wireframe-10-modal-intake.png`
  - `wireframe-11-modal-dossier.png`
  - `wireframe-12-modal-routingslip.png`
  - `wireframe-13-mobile-lockout.png`

---

## 💻 Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Custom Civic Design Tokens
- **Icons**: Lucide React
- **Cloud Infrastructure**: Azure Static Web Apps (Free SKU)
- **Visual Auditing**: Puppeteer (Headless Browser Visual Regression)

---

## 🚀 Running Locally

### 1. Live Application
```bash
cd app
npm install
npm run dev
# Open http://localhost:3000
```

### 2. Wireframe Suite
```bash
cd wireframe
npm install
npm run build
npx serve -l 3005 ./out
# Open http://localhost:3005
```

---

## 📜 Statutory Standards Compliance
- **Republic Act 11032**: Ease of Doing Business and Efficient Government Service Delivery Act
- **Republic Act 10173**: Data Privacy Act of 2012
- **Republic Act 8491**: Heraldic Code of the Philippines
- **DICT GWTS v25.3.3**: Philippine Government Web Template Standard
