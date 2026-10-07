# Santa Maria Bulacan DMS - Backend

GraphQL API for the Municipal Administrator's Office Document Management System
(DMS), built on the **Apollo starter's Clean Architecture** but running on
**Mercurius** - Fastify's native GraphQL plugin - instead of Apollo Server.

---

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js + TypeScript (tsx) |
| HTTP | Fastify |
| GraphQL | **Mercurius** (Fastify-native) |
| Database | PostgreSQL + Drizzle ORM - all app tables live in the **`app` schema** |
| Auth | Keycloak (OIDC) - no passwords in the app DB |
| Object storage | MinIO (S3-compatible) |
| Observability | Telemetry port (Console / NoOp) |
| Caching | Cache port (In-Memory / NoOp) |

---

## Local infrastructure (Docker)

The three external resources run from `docker-compose.yml` at the **repo root**:

```bash
cd ..                      # repo root
docker compose up -d       # postgres + keycloak + minio
```

| Service | URL | Notes |
| --- | --- | --- |
| PostgreSQL | `localhost:5432` | db `docsys`; API tables in `app`, Keycloak tables in `public` |
| Keycloak | http://localhost:8080 | realm `docsys` auto-imported; admin `admin` / `admin` |
| MinIO (S3 API) | http://localhost:9000 | bucket `docsys-attachments` created on first boot |
| MinIO console | http://localhost:9001 | console login `minioadmin` / `minioadmin` |

**Schema split:** the API and Keycloak share one database. Drizzle owns the
`app` schema (migrations emit `CREATE SCHEMA IF NOT EXISTS "app"` and qualify
every table as `"app"."<table>"`); Keycloak owns its default `public` schema via
`KC_DB_SCHEMA=public`. The bootstrap script `infra/postgres/initdb/01-app-schema.sql`
creates `app` on first init.

Override defaults by copying `.env.docker.example` → `.env.docker` and running
`docker compose --env-file .env.docker up -d`. Tear down with
`docker compose down` (add `-v` to also drop the data volumes).

---

## Quickstart

```bash
npm install
cp .env.example .env      # defaults already match the docker-compose stack
npm run db:migrate        # creates the `app` schema + all 19 tables
npm run db:seed           # dev accounts + roles (administrator / clerk)
npm run dev               # http://localhost:4000/graphql (GraphiQL in dev)
```

Health probe: `GET /health`.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Create the local dev accounts (Keycloak) + app roles |
| `npm run codegen` | Regenerate `src/types/graphql.ts` from the SDL |

---

## Architecture (Clean Architecture + DI)

```
Resolvers (Mercurius)  ->  Services (business logic)  ->  Repositories  ->  Drizzle/Postgres
                                   |
                          Ports: IObjectStoragePort (MinIO), IIdentityProviderPort (Keycloak)
```

- **Unit of Work** (`src/uow.ts`): the service layer owns transactions; repositories
  receive a transaction-scoped executor and never leak `tx` upward.
- **Ports / Adapters**: external systems (MinIO, Keycloak) are non-transactional side
  effects behind interfaces; concrete adapters live in `src/adapters/`.
- **Permissions**: `Service:Action` strings with `*` wildcards, defined once in
  `src/types/permissions.ts` (NFR-21).
- **Errors**: business `AppError`s are wrapped into structured GraphQLErrors by
  `src/utils/graphql-error-handler.ts` (Mercurius has no global `formatError`).

### Folder map

```
src/
├── index.ts / server.ts        # entry point + composition root
├── config/                     # env loading & validation
├── db/
│   ├── index.ts                # Drizzle client
│   └── schema/                 # 19 tables: platform / document / booking (+enums)
├── errors/                     # AppError hierarchy
├── ports/                      # IObjectStoragePort, IIdentityProviderPort (+ DTOs)
├── adapters/                   # MinIO storage + Keycloak IdP implementations
├── interfaces/                 # repository + service CONTRACTS (+ UoW, pagination)
├── repositories/               # Drizzle implementations (transaction-scoped)
├── services/                   # business-logic services (document workflow implemented; booking module skeletons)
├── infrastructure/             # telemetry + cache ports/adapters
├── graphql/                    # schema (.graphql) + resolvers + context + dataloaders
├── routes/                     # non-GraphQL HTTP (health, multipart uploads)
├── plugins/                    # (reserved)
├── types/                      # permission constants
└── utils/                      # checksum, storage keys, error handler
```

---

## Data model (19 tables)

- **[A] Shared platform** - `users`, `roles`, `user_roles`, `notifications`
- **[B] Document module** - `request_types`, `document_types`,
  `control_number_sequences`, `holidays`, `requests`, `request_attachments`,
  `folders`, `documents`, `document_attachments`, `transmissions`, `document_logs`
- **[C] Booking module** - `venues`, `events`, `event_attendees`, `activity_logs`

Key conventions enforced in the schema:
- `users.id` = Keycloak OIDC `sub` (UUID); users are deactivated, never deleted.
- `document_logs` / `activity_logs` are append-only (no UPDATE/DELETE).
- Control numbers issued atomically per `(seq_code, year)`.
- No foreign key crosses the Document/Booking module boundary (NFR-24).

---

## Status

**Implemented (working):**
- Drizzle models for all 18 tables - migrations generate cleanly.
- Repository contracts + Drizzle implementations.
- GraphQL schema (SDL) + resolver wiring + per-request DataLoaders.
- Mercurius server, DI composition root, GraphiQL, health route, CORS (`CORS_ORIGINS`).
- **MinIO** object-storage port + adapter (S3-compatible: upload, presigned download,
  head, delete) with server-computed SHA-256.
- **Keycloak** identity port + adapter (JWKS RS256 token verification + Admin API
  user/role management).
- `permissionCatalog` query and `_health` are live.
- **Document workflow services** - `RequestService`, `DocumentService`,
  `AttachmentService`, `NotificationService`, `UserService`, `RoleService`,
  `LookupService`, `ReportService`: reception, screening, preparation, review and
  approval, transmission, completion and archiving, with service-layer permission
  enforcement (NFR-07), in-transaction audit entries (FR-39), post-commit
  notifications (FR-47), and the hourly SLA alert scheduler (FR-38).
- Multipart upload routes (`POST /uploads/requests/:id`, `POST /uploads/documents/:id`)
  with MIME whitelist, size limit, and orphan cleanup.
- **Archive folders** - hierarchical `folders` table (folders 1 --- N documents),
  sibling-unique names, derived paths, one-level item counts; documents are filed
  into a folder when the request is closed (`closeRequest(folderId)`).
- **Generated schema types** (`npm run codegen` -> `src/types/graphql.ts`, committed):
  resolver arguments and inputs are typed straight from the SDL; `DateTime` maps
  to `Date` server-side (graphql-scalars parses inputs to Date, serializes to ISO).
- **Dev seed** (`npm run db:seed`) - local Keycloak accounts + app roles so the
  wired frontend works end-to-end on a fresh database.
- See [docs/DOCUMENT_WORKFLOW.md](docs/DOCUMENT_WORKFLOW.md) for how the six steps
  are solved, step by step.

**Skeleton (throws `NotImplementedError`):**
- `EventService` and `VenueService` (booking module - separate workstream; does not
  block the document workflow).
- `ReportService.exportSummary` (FR-37; PDF/XLSX rendering).

Each remaining skeleton method carries a `TODO(FR-xx)` pointing at the requirement
it must satisfy, so implementation can proceed requirement-by-requirement.
