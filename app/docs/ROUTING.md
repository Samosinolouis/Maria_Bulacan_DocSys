# Routing Guide

> **Scope:** Route structure and navigation conventions for the DocSys app (`app/`), built on the Next.js App Router.
> **Audience:** Engineers adding or modifying routes.

## Important: This Is the App Router, Not React Router

DocSys uses the **Next.js App Router** (Next 16, `app/` directory under `app/src/app/`). Routes are files, not a config array. Do NOT use React Router patterns:

| Wrong (React Router)             | Right (App Router, used here)                          |
| -------------------------------- | ------------------------------------------------------ |
| `<Switch>` / `<Routes>`          | File-system routing: one `page.tsx` per route segment  |
| `<Route path component />`       | A folder with `page.tsx`; layouts via `layout.tsx`     |
| `<Redirect>` / `<Navigate>`      | `redirect()` from `next/navigation` (server) or `router.replace()` (client) |
| `useHistory()`                   | `useRouter()` from `next/navigation`                   |
| `useRouteMatch()`                | `useParams()` / the `params` prop                      |
| `<Outlet>`                       | Nested folders with their own `layout.tsx`             |

Two constraints specific to this project:

1. **Static export.** `next.config.ts` sets `output: 'export'`. Every route is prerendered at build time and runs in the browser; there are no server routes for data. All data access happens through the service layer (client-side).
2. **Client components.** Every page is a `'use client'` component. Pages stay thin: they render exactly one view.

## Route Structure

```
app/src/app/
├── layout.tsx           # Root layout: html/body, fonts, providers, global shell
├── page.tsx             # "/" -> DashboardView
├── login/page.tsx       # "/login" -> OIDC entry (public)
├── auth/callback/page.tsx  # "/auth/callback" -> OIDC redirect target (public)
├── dashboard/page.tsx   # "/dashboard" -> DashboardView
├── incoming/page.tsx    # "/incoming" -> IncomingView
├── prepare/page.tsx     # "/prepare" -> PrepareView
├── review/page.tsx      # "/review" -> ReviewView
├── transmit/page.tsx    # "/transmit" -> TransmitView
├── archive/page.tsx     # "/archive" -> ArchiveView
├── schedule/page.tsx    # "/schedule" -> ScheduleView
├── reports/page.tsx     # "/reports" -> ReportsView
└── admin/page.tsx       # "/admin" -> AdminView
```

A page file is a one-liner wrapper:

```tsx
// app/src/app/review/page.tsx
'use client';

import ReviewView from '@/components/views/ReviewView';

export default function ReviewPage() {
  return <ReviewView />;
}
```

## Route Matrix

| Route | View | Purpose | Access |
| ----- | ---- | ------- | ------ |
| `/` | `DashboardView` | Executive dashboard (same as `/dashboard`) | Session required |
| `/login` | Login flow | Starts the Keycloak OIDC redirect | Public |
| `/auth/callback` | Login flow | Completes the OIDC exchange, then redirects to the return path | Public |
| `/dashboard` | `DashboardView` | Workload HUD, SLA state, docket ledger | Session + `ReportService:Read` for metrics |
| `/incoming` | `IncomingView` | Reception and screening queue | Session; actions gate on `RequestService:Encode` / `RequestService:Screen` |
| `/prepare` | `PrepareView` | Drafting studio and template library | Session; actions gate on `DocumentService:Prepare` |
| `/review` | `ReviewView` | Signature and endorsement desk | Session; gated on `DocumentService:Review` |
| `/transmit` | `TransmitView` | Transmission desk and dispatch records | Session; gated on `DocumentService:Transmit` |
| `/archive` | `ArchiveView` | Closed records and retrieval | Session; gated on `RequestService:Read` / `DocumentService:Read` |
| `/schedule` | `ScheduleView` | Venue and event calendar | Session; actions gate on `EventService:*` |
| `/reports` | `ReportsView` | ARTA compliance ledger and exports | Session; gated on `ReportService:Read` / `ReportService:Export` |
| `/admin` | `AdminView` | Users, roles, audit trail | Session; gated on `UserService:*` / `RoleService:*` |

Detail views are modals, not routes. `DocumentDetailModal`, `RoutingSlipModal`, and `OfficialWordDocument` open over the current route from the owning view. This keeps the static export simple and matches the current interaction design. If deep-linkable detail pages become a requirement, add dynamic segments (`/incoming/[requestId]`) with `generateStaticParams`; do not convert the modal flow wholesale.

## Navigation

```tsx
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Declarative navigation (preferred)
<Link href="/review">Review Desk</Link>;

// Active state in the sidebar
const pathname = usePathname();
const isActive = pathname === '/review';

// Programmatic navigation
const router = useRouter();
router.push('/dashboard');
router.replace('/login');
```

## Route Protection

Protection is layered:

1. **Session gate.** A client `SessionGate` inside the root layout checks `ISessionService.isAuthenticated()`. Unauthenticated users are redirected to `/login` (with the current path as the return target). `/login` and `/auth/callback` render outside the gate.
2. **Authorization gate.** Each view gates its controls through `useCan` / `useAuthorization` (see [AUTHORIZATION.md](./AUTHORIZATION.md)). A user without `DocumentService:Review` never sees the decision panel, but the backend would reject the mutation anyway.
3. **Backend enforcement.** The only security boundary. Every operation is re-validated server-side (NFR-07).

The shell (`AppLayout`) already renders the login portal without chrome by checking `pathname === '/login'`; extend that check to `/auth/callback`.

## Root Layout

`app/src/app/layout.tsx` mounts, in order:

1. Fonts and global CSS (`globals.css`).
2. `SessionProvider` (OIDC + `me` bootstrap).
3. `AuthorizationProvider` (engine hydration).
4. `ServiceProvider` (service registry).
5. `AppLayout` (masthead, header, sidebar, footer, global modals).

Route pages render inside `AppLayout` as `children`; only `/login` and `/auth/callback` opt out of the shell.

## URL Parameters and Search State

```tsx
// Search state that should survive navigation lives in the URL.
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const tab = searchParams.get('tab');

// Dynamic segments (only if a route gains one)
// app/src/app/incoming/[requestId]/page.tsx
export default function Page({ params }: { params: { requestId: string } }) {
  return <RequestDossier requestId={params.requestId} />;
}
```

Filter state that does not need to be shareable stays in view state (see the page philosophy in [ARCHITECTURE.md](./ARCHITECTURE.md)).

## Adding a Route

1. Create `app/src/app/<segment>/page.tsx` as a `'use client'` one-liner that renders one view.
2. Add the view under `app/src/components/views/`.
3. Add the sidebar entry in `app/src/components/Sidebar.tsx` (label, sublabel, icon, counts from data hooks).
4. Gate any controls on the actions the backend enforces for that screen.
5. If the route needs a different shell (for example a print-only page), add a nested `layout.tsx` instead of branching inside `AppLayout`.

## Best Practices

1. **Keep pages thin.** One page, one view. Data and behavior live in views, hooks, and services.
2. **No React Router imports.** `next/navigation` and `next/link` only.
3. **No dynamic routes unless deep links are required.** Prefer modals for detail, matching the current design.
4. **URL for shareable state, view state for the rest.**
5. **Never guard a route with client checks alone.** The backend is the boundary; client gates are UX.
