# Components Guide

> **Scope:** Component inventory and usage conventions for the DocSys app (`app/src/components/`).
> **Audience:** Engineers building or restyling UI.

## Import Pattern

All imports use the `@/` alias (mapped to `./src/*` in `tsconfig.json`):

```tsx
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import DocumentDetailModal from '@/components/DocumentDetailModal';
import HighlightMatch from '@/components/HighlightMatch';
import { X, ShieldCheck, FileText } from 'lucide-react';
```

Icons come from `lucide-react` only. There is no shadcn/ui layer in this project; components are plain React with Tailwind utilities plus the component classes defined in `globals.css` (`status-badge`, `docket-control-badge`, `municipal-docket-table`, and so on; see [STYLING.md](./STYLING.md)).

## Conventions

1. **Presentational first.** Components receive data via props and emit events via callbacks. They never call services, hooks that fetch, or the cache.
2. **Views own state.** `components/views/*` are the containers: they call hooks, assemble the singular page object, and pass slices down (see [ARCHITECTURE.md](./ARCHITECTURE.md)).
3. **Modals are controlled.** The owning view keeps the open flag and the submit handler; the modal renders from props and calls `onClose` / `onSubmit`.
4. **`'use client'` on interactive components.** Anything with hooks, event handlers, or browser APIs carries the directive.
5. **No emojis, no em-dashes in UI copy.** Per the design doctrine (`design.md`). Icons and standard hyphens only.
6. **Keep government chrome in the shell.** Masthead, header, footer, and sidebar live in `AppLayout`; pages render content only.

## Shell Components

### AppLayout

The global shell: masthead, header, sidebar, footer, and the global modal hosts. Mounted once in `app/src/app/layout.tsx`. It renders the bare login canvas when `pathname` is `/login` (and `/auth/callback`).

```tsx
<AppLayout>
  {children} {/* the route's view */}
</AppLayout>
```

### GovMasthead

The GWTS trust bar: `GOVPH`, the jurisdiction line ("Republika ng Pilipinas - Pamahalaang Bayan ng Santa Maria, Lalawigan ng Bulacan"), and the PST indicator (RA 10535). Static, no props.

### GovHeader

The official letterhead header: dual seals (Santa Maria municipal seal and Bagong Pilipinas crest), system title, the current user block, the mobile menu toggle, and logout. Props: `currentUser`, `onUserChange`, `mobileMenuOpen`, `onToggleMobileMenu`, `onLogout`.

### Sidebar

The registry navigation with three roman-numbered divisions (Intake & Registry; Executive Review & Archive; Logistics & Compliance). Features: active-route highlighting via `usePathname`, collapsed icon rail on desktop (persisted to `localStorage` under `docsys_desktop_sidebar_collapsed`), and a mobile drawer. Counts (incoming, review, overdue) come from data hooks once the restructure lands.

```tsx
<Sidebar mobileOpen={open} onCloseMobile={close} />
```

### GovFooter

The GWTS compliance footer: municipal address, contact, standard links (GOV.PH, FOI, Transparency Seal, Privacy Notice), compliance seals, and copyright. Static.

### MobileLockout

Full-screen notice shown on unsupported viewports. Communicates the workstation access restriction (administrative workflows are restricted to desktop and laptop workstations; schedule viewing is the only mobile use case, per NFR-16). Static.

## Views

One view per route, under `app/src/components/views/`:

| View | Route | Primary concern |
| ---- | ----- | --------------- |
| `DashboardView` | `/`, `/dashboard` | HUD metrics, SLA state, docket ledger, today's schedule |
| `IncomingView` | `/incoming` | Reception queue, screening actions, intake entry point |
| `PrepareView` | `/prepare` | Drafting studio, template library, submission for review |
| `ReviewView` | `/review` | Decision queue: approve, endorse, deny with grounds |
| `TransmitView` | `/transmit` | Dispatch records, proof of transmission upload |
| `ArchiveView` | `/archive` | Closed records, search, dossier retrieval |
| `ScheduleView` | `/schedule` | Venue calendar, conflict detection, event CRUD |
| `ReportsView` | `/reports` | ARTA metrics, category summaries, exports |
| `SettingsView` | `/settings` | Reference data, venues, holidays, user and role administration |

During the restructure, views are rewired from `useApp()` to data hooks. Their props and layout stay as they are; only the data source changes.

## Modals

### NewIntakeModal

Three-step intake wizard (classification, attachments, screening checklist). Controlled by the header's "Intake" action. Submits through `requests.encode(...)` and optionally the screening flow.

### DocumentDetailModal

The dossier inspector: particulars, six-stage lifecycle tracker, attachments, transmissions, audit trail, and the decision actions. The largest component in the app; it receives the document plus the current user and emits `onUpdateStatus`, `onPrintRoutingSlip`.

### RoutingSlipModal

Printable routing slip matching the physical LGU paper form. Rendered from a `DocumentRecord` and printed via the print stylesheet (`printable-routing-slip`).

### EventModal

Venue reservation form: venue, title, organizer, department, date, time range, attendee tagging, Mayor/Administrator flags. Runs conflict checks through `events.checkConflicts(...)` before submitting.

## Document Components

### DocumentScanner

Camera-based scanner using `navigator.mediaDevices.getUserMedia` (`facingMode: 'environment'`), an A4 alignment overlay, canvas frame capture, and multi-page assembly. Falls back to direct file upload when the camera is unavailable. Used inside the intake wizard.

### OfficialWordDocument

The MS Word fidelity letterhead renderer: official header, title block, body, signatory block, and print action. Rendered in the word preview modal (`printable-word-document`).

## Utility Components

### HighlightMatch

Highlights search terms inside text without layout shift. Used by registry tables and the archive search.

```tsx
<HighlightMatch text={record.title} query={searchQuery} />
```

## Status Badges

Status chips use the `status-badge` classes from `globals.css` (`badge-received`, `badge-screening`, `badge-preparation`, `badge-review`, `badge-approved`, `badge-endorsed`, `badge-denied`, `badge-transmitted`, `badge-closed`). Map a `RequestStatus` or `DocumentStatus` to its class through a single helper (`lib/constants.ts` after the restructure) so chips stay consistent across views.

## Adding a Component

1. Place it in `app/src/components/` (shell), `views/` (containers), or next to the feature that owns it.
2. Presentational only: props in, callbacks out. If it needs server data, it belongs in a view.
3. Use the existing utility classes and tokens; do not introduce new colors outside the palette in [STYLING.md](./STYLING.md).
4. Add `'use client'` when the component uses hooks or browser APIs.
5. No emojis or em-dashes in any copy.

See also:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - views, hooks, and the singular page object.
- [STYLING.md](./STYLING.md) - tokens, utility classes, and print styles.
- [ROUTING.md](./ROUTING.md) - which view belongs to which route.
