# Civic Executive Design Doctrine & Anti-Slop Architectural Standard
**System:** Cloud-Based Municipal Document Management System (DMS)  
**Client:** Municipality of Santa Maria, Bulacan - Office of the Municipal Administrator  
**Statutory Governance:** RA 11032 (Ease of Doing Business / 3-Day SLA), RA 8491 (Heraldic Code of the Philippines), DICT GWTS v25.3.3, RA 10173 (Data Privacy Act), RA 10535 (Philippine Standard Time)  
**Core Reference Frameworks:**  
- `hardikpandya/stop-slop`: Removal of AI tells, directness, active human voice, cutting filler and adverbs.  
- `petergyang/no-ai-slop`: Elimination of banned AI buzzwords, no throat-clearing, no colon reveals, no summary endings, no superficial `-ing` analysis.  
- `Leonxlnx/taste-skill`: Dial inference, anti-default discipline, anti-center bias, shape and color consistency locks, zero em-dash ban, WCAG AA button/form contrast.  
- `ryanthedev/design-for-ai`: Typography scale, information hierarchy, authentic heraldic palette, visual anchors, responsive integrity.  

---

## 1. Design Read & Dials (Brief Inference)

```
Reading this as: Municipal Government Operational Document Registry & Executive Gavel Docket for Santa Maria, Bulacan civil service officers and leadership, with a trust-first heraldic administrative language, leaning toward bespoke GovTech ledger systems (DICT GWTS + ARTA RA 11032 compliance) with tactile paper-ballot surfaces and high-density tabular ledgers.
```

### The Three Dials:
- **`DESIGN_VARIANCE: 4`**: Dignified civic symmetry balanced with tactical balance-sheet tension. Rejects both chaotic novelty and sterile uniformity.
- **`MOTION_INTENSITY: 3`**: Fluid, silky-smooth administrative motion. Employs spring-like fluid deceleration (`cubic-bezier(0.16, 1, 0.3, 1)` / `--ease-fluid`) for tab transitions, card hover lifts (`translateY(-1px)`), modal scale-and-slide entrances, and tactile button depressions. Zero gratuitous parallax or kinetic canvas distractions.
- **`VISUAL_DENSITY: 8`**: High administrative density. Full docket control numbers, statutory deadlines, endorsements, official signatories, barcode stamps, and venue schedules.

---

## 2. Hard Anti-Pattern Elimination (The Zero-Tolerance Blacklist)

### 2.1 Complete Emoji Prohibition
- **Absolute 0 Emojis**: Government platforms maintain institutional gravity. No emojis in buttons, badges, tables, modals, or toasts. All iconography uses crisp, standardized 1.5px stroke Lucide SVGs or text tags.

### 2.2 Complete Em-Dash Ban (`—` and `–`)
- **Zero Em-Dashes**: The em-dash is the signature stylistic crutch of LLM writing. Standard hyphens `-` or line breaks are used exclusively.

### 2.3 Banned AI Buzzwords & Marketing Slop
- **Banned Words**: *delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge, paradigm shift, game changer, tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge, harness, ever-evolving, seamless, unleash, next-gen*.
- **Banned Adverbs**: *importantly, crucially, fundamentally, inherently, inevitably, literally, honestly, simply, deeply*.
- **No Throat-Clearing**: Prohibit "Here's the thing", "Let me be clear", "At its core", "It is worth noting". State direct administrative facts.
- **No Superficial `-ing` Analysis**: Replace trailing clauses ("highlighting the commitment") with direct concrete outcomes.
- **Active Human Voice**: Name the specific civil service officer ("Admin Officer R. Del Rosario logged the transmittal"). Inanimate objects never perform human actions.

### 2.4 Structural Anti-Patterns
- **No 4-Card Quadrant Syndrome**: No detached floating white boxes with colored icons in the top-right corner. Replace with continuous, integrated command bars or data ledgers.
- **No 3-Equal Feature Row Syndrome**: Replaced by asymmetric civic ledgers and balance sheets.
- **No Centered-Everything Syndrome**: Use left-aligned, scan-friendly typography that respects natural reading patterns.
- **No Gratuitous Glassmorphism**: No meaningless `backdrop-blur`. Use crisp, opaque civic surfaces with high-contrast borders.
- **No Pure Black (`#000000`)**: Use deep, tinted Bulacan Navy (`#081E36`, `#0B2545`) and slate neutrals.

### 2.5 Zero Red or Orange Alarms ("Make It Look Normal")
- **No Alarming Orange / Red Warning Boxes**: Eliminate caution-tape amber/orange cards (`#FFFBEB`, `#D97706`) and screaming red badges (`#DC2626`). Government documents, ARTA directives, and statutory notices must look normal, authoritative, and dignified. Use Bulacan Navy (`#081E36`), Institutional Slate (`#334155`), and crisp borders on clean white substrates.

### 2.6 Zero Boxed Side Borders / Central Cages
- **No Left/Right Artificial Gutter Borders**: The application canvas must not be trapped in an arbitrary centered box with vertical border lines (`border-x`) on the left and right. Layouts span full-width (`w-full`) with balanced responsive padding (`px-4 sm:px-6 lg:px-8`).

### 2.7 Concise Action Standard: Single English Word ("Intake")
- **1-Word English Button**: Replace multi-word or non-standard action labels with concise, standard civic nomenclature: **"Intake"** for incoming document reception and docketing.

---

## 3. Civic Color Architecture (Normal, Dignified Institutional Palette)

Extracted from the official municipal seal (`BULACAN LOGO.png`) and RA 8491 national standards, calibrated for calm governance:

```
┌────────────────────────────────────────────────────────────────────────┐
│               SANTA MARIA MUNICIPAL PALETTE                            │
├──────────────────────────┬──────────────┬──────────────────────────────┤
│ Name                     │ Hex Token    │ Heraldic Purpose             │
├──────────────────────────┼──────────────┼──────────────────────────────┤
│ Bamboo Green             │ #15803D      │ Primary action & approval    │
│ Deep Civic Evergreen     │ #166534      │ Formal letterhead authority  │
│ Bulacan Provincial Navy  │ #081E36      │ Outer ring, command header   │
│ Heraldic Midnight Navy   │ #0B2545      │ Nav sidebar, table headers   │
│ Institutional Slate      │ #334155      │ Scribe text, secondary action│
│ Neutral Slate Gray       │ #64748B      │ Metadata & timestamps        │
│ Government Canvas        │ #F8FAFC      │ Tinted background substrate  │
│ Docket Border Gray       │ #CBD5E1      │ Crisp institutional rules    │
│ Deep Slate Text          │ #0F172A      │ High-contrast primary type   │
└──────────────────────────┴──────────────┴──────────────────────────────┘
```

---

## 4. Institutional Typography System

- **Formal Letterhead & Municipal Seals**: `Cinzel`, serif (statutory weight for "MUNICIPALITY OF SANTA MARIA").
- **Official Administrative Documents & Titles**: `Newsreader`, serif (formal executive dossiers, resolutions, and memoranda).
- **Interface & Administrative Body**: `Inter`, sans-serif (data density, operational buttons, forms).
- **Docket Control Numbers & Barcodes**: `JetBrains Mono`, monospace (docket tags `[SM-MA-2026-0042]`, timestamps, control codes).

---

## 5. Visual Auditing Framework (Zero-Key MCP Standard)

- **Engine**: Puppeteer MCP running local Google Chrome.
- **Dual Viewports**:
  - Desktop Workstation: 1440px x 900px
  - Mobile Operations: 375px x 812px
- **Automated Assertions**:
  1. `hasHorizontalOverflow === false` across all viewports.
  2. `emojisFoundCount === 0` across all rendered DOM nodes.
  3. All interactive buttons and inputs meet WCAG AA contrast (minimum 4.5:1).
  4. Both official seals (`BULACAN LOGO.png` and `Bagong_Pilipinas_Logo.svg`) render with correct aspect ratio.
