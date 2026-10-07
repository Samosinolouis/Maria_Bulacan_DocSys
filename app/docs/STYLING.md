# Styling Guide

> **Scope:** Styling system for the DocSys app: Tailwind CSS v4, the civic design tokens, typography, motion, and the print stylesheet.
> **Audience:** Engineers building or restyling UI.

## Important: Tailwind CSS v4

DocSys uses **Tailwind CSS v4** through `@tailwindcss/postcss` (`postcss.config.mjs`). There is no `tailwind.config.js`. Design tokens are CSS custom properties defined in `app/src/app/globals.css`, and utility classes are generated from the `@import "tailwindcss"` entry.

| v3 habit                        | v4 (used here)                                  |
| ------------------------------- | ----------------------------------------------- |
| `tailwind.config.js` theme      | CSS custom properties in `globals.css`          |
| `hsl()` color definitions       | Hex tokens (this project) and modern CSS values |
| JS-configured content paths     | Automatic content detection                     |

## The Design Doctrine

The rules in `design.md` are part of the styling contract:

1. **Zero emojis.** Institutional gravity; iconography is Lucide SVG only.
2. **Zero em-dashes.** Standard hyphens or line breaks; in UI copy and documentation.
3. **No alarming red or orange alerts.** "Make it look normal": Bulacan Navy, Institutional Slate, and crisp borders on clean white. Denied and overdue states use slate treatments, not screaming colors.
4. **No pure black.** Deep tinted navies (`#081E36`, `#0B2545`) and slate neutrals.
5. **No centered-everything, no floating card quadrants.** Left-aligned, scan-friendly ledgers and command bars (`executive-operations-hud` replaces four detached metric cards).
6. **No gratuitous glassmorphism.** Crisp opaque surfaces with high-contrast borders.
7. **One-word action standard.** "Intake" for reception and docketing.
8. **WCAG AA contrast** for buttons, inputs, and text.

## Color Tokens

Defined in `globals.css` under `:root`.

### Layer 1 - National identity (RA 8491 flag colors)

| Token        | Hex       | Use                                  |
| ------------ | --------- | ------------------------------------ |
| `--ph-blue`  | `#0038A8` | Flag-derived elements only           |
| `--ph-red`   | `#CE1126` | Flag-derived elements only           |
| `--ph-gold`  | `#FCD116` | Accents: masthead text, selection    |
| `--ph-white` | `#FFFFFF` | Paper surfaces                       |

### Layer 2 - Santa Maria civic emblem palette

| Token                    | Hex       | Use                                            |
| ------------------------ | --------- | ---------------------------------------------- |
| `--civic-primary`        | `#15803D` | Primary actions, active nav markers, approvals |
| `--civic-primary-dark`   | `#166534` | Letterhead authority, borders                  |
| `--civic-primary-darker` | `#081E36` | Command header, sidebar background             |
| `--civic-navy-deep`      | `#0B2545` | Heraldic midnight navy, nav states             |
| `--civic-accent`         | `#081E36` | Formal slate accent (no orange)                |
| `--civic-danger`         | `#334155` | Dignified charcoal for flagged states          |

### Layer 3 - Slate neutrals and status colors

| Token                | Hex       | Use                          |
| -------------------- | --------- | ---------------------------- |
| `--neutral-50`       | `#F8FAFC` | App canvas                   |
| `--neutral-100`      | `#F1F5F9` | Subtle fills                 |
| `--neutral-200`      | `#E2E8F0` | Dividers                     |
| `--neutral-300`      | `#CBD5E1` | Borders                      |
| `--neutral-600/700`  | `#475569` / `#334155` | Secondary text   |
| `--neutral-800/900`  | `#1E293B` / `#0F172A` | Primary text     |
| `--status-received`  | `#0B2545` | Status: received             |
| `--status-screening` | `#0284C7` | Status: screening            |
| `--status-prep`      | `#2563EB` | Status: preparation          |
| `--status-review`    | `#334155` | Status: review               |
| `--status-approved`  | `#15803D` | Status: approved             |
| `--status-endorsed`  | `#0D9488` | Status: endorsed             |
| `--status-denied`    | `#475569` | Status: denied               |
| `--status-transmitted` | `#0284C7` | Status: transmitted        |
| `--status-closed`    | `#64748B` | Status: closed               |

### Motion tokens

| Token          | Value                              | Use                            |
| -------------- | ---------------------------------- | ------------------------------ |
| `--ease-fluid` | `cubic-bezier(0.16, 1, 0.3, 1)`    | All administrative transitions |
| `--ease-spring`| `cubic-bezier(0.34, 1.56, 0.64, 1)`| Micro-springs (use sparingly)  |

## Typography

Fonts are loaded in `app/src/app/layout.tsx` (Google Fonts) and exposed as tokens.

| Role | Font | Utility class | Use |
| ---- | ---- | ------------- | --- |
| Statutory headings | Cinzel | `font-cinzel` | "MUNICIPALITY OF SANTA MARIA", seals |
| Docket titles and letterhead body | Newsreader | `font-serif-docket` | Document titles, formal dossiers |
| Interface and body | Inter | default (`font-sans`) | Everything operational |
| Control numbers, timestamps | JetBrains Mono | `font-mono-control` | `SM-MA-2026-0042`, PST stamps |

## Using Tokens

Two patterns appear in the codebase. Both are valid; stay consistent within a file:

```tsx
// 1. Arbitrary values from the palette (most common in components)
<div className="bg-[#081E36] text-[#E2E8F0] border-b border-[#0B2545]" />

// 2. CSS custom properties for themed surfaces
<div className="bg-[var(--neutral-50)] text-[var(--neutral-900)]" />
```

Prefer the existing classes over new hex values. If a new shade is needed, add a token in `globals.css` first.

## Component Classes

`globals.css` defines the shared civic component classes:

| Class | Purpose |
| ----- | ------- |
| `gov-masthead` | GWTS trust bar (`GOVPH` strip) |
| `gov-header` | Official letterhead header |
| `executive-operations-hud` + `hud-cell`, `hud-section-label`, `hud-number`, `hud-status-text` | The dashboard command bar (replaces four detached cards) |
| `arta-memo-docket` | Authoritative directive notice on the dashboard |
| `municipal-docket-table` | Registry ledger table styling |
| `docket-control-badge` | Monospace control-number chip |
| `docket-title-cell` | Serif docket title cell |
| `status-badge` + `badge-<status>` | Status chips (`badge-received`, `badge-review`, `badge-approved`, ...) |

## Motion

| Class | Effect |
| ----- | ------ |
| `animate-fluid-tab` | Content slide-up on tab and page transitions |
| `animate-fluid-modal` | Modal scale-and-slide entrance |
| `animate-fluid-fade` | Simple fade (overlays, backdrops) |
| `btn-fluid` | Button hover lift and press depression |
| `card-fluid` | Card hover lift and shadow |

Focus visibility is global: `button:focus-visible, a:focus-visible, input:focus-visible` receive a 2px civic green outline with offset (WCAG 2.1 AA).

## Print Stylesheet

The print block in `globals.css` produces MS Word fidelity output for official documents:

- `@page` is A4 portrait with 15/20 mm margins; the document body prints in Times New Roman 11pt.
- Web chrome is hidden (`header` except `.letterhead-header`, `nav`, `aside`, `footer` except `.signatory-block`, buttons, inputs, `.no-print`).
- Only `.printable-word-document` and `.printable-routing-slip` remain visible; their containers (`.printable-modal-container`) are flattened.
- `letterhead-header` avoids page breaks; `signatory-block` avoids internal breaks; `document-provisions-body p` justifies text.
- Seals print with `print-color-adjust: exact`.

Anything that must not print carries `.no-print`.

## Responsive Design

- Breakpoints follow Tailwind defaults (`sm: 640`, `md: 768`, `lg: 1024`).
- The primary target is desktop workstations (1280px and up, NFR-16).
- The sidebar collapses to an icon rail on desktop and to a drawer on tablet/mobile.
- Mobile browsers are restricted by design: `MobileLockout` communicates the workstation policy. Do not build full mobile workflows beyond schedule viewing (NFR-16, FR-44).

## Best Practices

1. Use tokens and shared classes; do not invent colors.
2. Keep motion on `--ease-fluid`; avoid new keyframes unless a pattern repeats.
3. Left-align content; ledgers and tables over floating cards.
4. Respect the doctrine: no emojis, no em-dashes, no alarm colors, no pure black.
5. Verify contrast for any new text/background pairing (4.5:1 minimum).
6. Check print output for anything reachable from a print button.

## File Structure

```
app/src/app/globals.css      # tokens, component classes, motion, print stylesheet
app/src/app/layout.tsx       # font loading, body classes
app/postcss.config.mjs       # @tailwindcss/postcss
```

See also:

- [COMPONENTS.md](./COMPONENTS.md) - which classes the components use.
- `design.md` (repo root) - the full design doctrine.
