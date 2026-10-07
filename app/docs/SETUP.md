# Setup Guide

> **Scope:** Running the DocSys app (`app/`) with its backend (`backend/`) and local infrastructure.
> **Audience:** Engineers setting up a workstation.

DocSys is two applications plus local infrastructure:

```
Maria_Bulacan_DocSys/
├── app/               # Next.js 16 frontend (this app; Next server runtime - NextAuth needs /api/auth/*)
├── backend/           # Fastify + Mercurius GraphQL API (TypeScript, Drizzle, Keycloak, MinIO)
├── infra/             # Postgres init scripts, Keycloak realm import
└── docker-compose.yml # postgres + keycloak + minio
```

## Tech Stack

| Concern | Choice |
| ------- | ------ |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Icons | Lucide React |
| API client | `fetch` to the GraphQL endpoint through the service layer |
| Backend | Fastify 4 + Mercurius 14, Drizzle ORM, PostgreSQL |
| Identity | Keycloak (OIDC); no passwords in the app database |
| Object storage | MinIO (S3-compatible) |

## Prerequisites

- Node.js 22 or later (the backend declares `engines.node >= 22`).
- npm.
- Docker Desktop (for the local Postgres, Keycloak, and MinIO stack).

## 1. Start Local Infrastructure

From the repo root:

```bash
docker compose up -d          # postgres + keycloak + minio
```

| Service | URL | Notes |
| ------- | --- | ----- |
| PostgreSQL | `localhost:5432` | Database `docsys`; API tables in schema `app`, Keycloak tables in `public` |
| Keycloak | http://localhost:8080 | Realm `docsys` auto-imported; admin `admin` / `admin` |
| MinIO (S3 API) | http://localhost:9000 | Bucket `docsys-attachments` created on first boot |
| MinIO console | http://localhost:9001 | `minioadmin` / `minioadmin` |

Tear down with `docker compose down`; add `-v` to drop data volumes.

## 2. Run the Backend

```bash
cd backend
npm install
cp .env.example .env          # defaults match the docker-compose stack
npm run db:migrate            # creates the `app` schema and all tables
npm run dev                   # http://localhost:4000/graphql (GraphiQL in dev)
```

Health probe: `GET http://localhost:4000/health`.

Useful scripts:

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Hot reload (tsx watch) |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:studio` | Drizzle Studio |

## 3. Run the App

```bash
cd app
npm install
npm run dev                   # http://localhost:3000
```

Environment (create `app/.env.local`):

| Variable | Example | Purpose |
| -------- | ------- | ------- |
| `NEXT_PUBLIC_GRAPHQL_URL` | `http://localhost:4000/graphql` | GraphQL endpoint |
| `NEXT_PUBLIC_UPLOADS_URL` | `http://localhost:4000` | Base for the multipart upload routes |
| `NEXT_PUBLIC_KEYCLOAK_URL` | `http://localhost:8080` | Keycloak base URL |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | `docsys` | Realm name |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT` | `docsys-app` | OIDC public SPA client |
| `AUTH_SECRET` | (random) | NextAuth signing secret (`npx auth secret`) |
| `AUTH_URL` | `http://localhost:3000` | NextAuth base URL |
| `AUTH_KEYCLOAK_ISSUER` | `http://localhost:8080/realms/docsys` | OIDC issuer (server-side) |
| `AUTH_KEYCLOAK_ID` | `docsys-app` | NextAuth Keycloak client id |
| `AUTH_KEYCLOAK_SECRET` | (unset) | Only for a confidential client |

App scripts:

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server (Turbopack) at http://localhost:3000 |
| `npm run build` | Production build; static export to `app/out/` |
| `npm run start` | Serve the built output |
| `npm run lint` | ESLint |

## 4. Sign In

1. Open http://localhost:3000; unauthenticated users land on `/login`.
2. The login page calls `signIn('keycloak')`; NextAuth redirects the browser to the realm's authorization endpoint (authorization-code + PKCE, handled server-side by the route handlers under `/api/auth/*`).
3. After the callback, the session service loads `me` (the shadow record, roles, and effective permissions) and the app renders the dashboard.

If no realm users exist yet, create one in the Keycloak admin console (http://localhost:8080, `admin` / `admin`), then assign the application roles the backend expects.

## Providers and Auth

The root layout mounts one provider chain (`app/src/providers/`):

1. `AuthProvider` - NextAuth `SessionProvider` plus the composition root. It builds the `ServiceRegistry` once, hydrates the session service from the NextAuth session, and wires the authorization engine.
2. `ServiceProvider` - exposes the `ServiceRegistry` to the hooks.
3. `AuthorizationProvider` - hydrates the ABAC engine from the session snapshot.
4. `AppProvider` - consumes the data/service hooks (which normalize every `AppError`) and exposes the global shell state (identity, lookups, ARTA counters, global modals, workflow mutations). Page-specific lists come from the data hooks the views call directly.

`SessionGate` (inside the layout) redirects unauthenticated users to `/login`.

## Build and Deploy

- The app builds as a standard Next application (`next build`): the NextAuth route handlers under `/api/auth/*` require a server runtime, so `output: 'export'` is no longer set.
- The frontend deploys as a Node/serverless Next deployment bound to the app origin (localhost in development). It can bind to localhost only if it must not be reachable from the network.
- The backend deploys to the application VM with PostgreSQL and MinIO (see `backend/README.md`).

## Local Integration Notes

1. **CORS.** The browser calls the GraphQL API cross-origin (`:3000` to `:4000`). The API allows the app origin (`CORS_ORIGINS`, default `http://localhost:3000`).
2. **Uploads.** Multipart uploads go to `POST /uploads/requests/:requestId` and `POST /uploads/documents/:documentId` through `AttachmentService`.
3. **Data.** The frontend talks only to the backend (GraphQL + the two upload routes); there are no client fixtures. The client cache (`app/src/services/cache/`) is in-memory and refills from the API.

## Documentation Map

| Document | Content |
| -------- | ------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layers, data flow, page philosophy, migration map |
| [DOCUMENT_WORKFLOW.md](./DOCUMENT_WORKFLOW.md) | The six-step workflow and the frontend calls per step |
| [SERVICE_CONTRACTS.md](./SERVICE_CONTRACTS.md) | The contract every service implements |
| [AUTHORIZATION.md](./AUTHORIZATION.md) | ABAC model and the `me` permission source |
| [CACHE_MANAGER.md](./CACHE_MANAGER.md) | Client cache design |
| [ROUTING.md](./ROUTING.md) | Routes and navigation |
| [COMPONENTS.md](./COMPONENTS.md) | Component inventory and conventions |
| [STYLING.md](./STYLING.md) | Tokens, typography, motion, print |
| [specs/services-spec.md](./specs/services-spec.md) | Service implementation spec |
| [specs/hooks-spec.md](./specs/hooks-spec.md) | Hooks implementation spec |
| [specs/authz-spec.md](./specs/authz-spec.md) | Authorization implementation spec |
