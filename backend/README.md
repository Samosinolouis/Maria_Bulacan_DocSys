# Santa Maria Bulacan DMS — Backend

GraphQL API for the Municipal Administrator's Office Document Management System
(DMS), built on the **Apollo starter's Clean Architecture** but running on
**Mercurius** — Fastify's native GraphQL plugin — instead of Apollo Server.

---

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js + TypeScript (tsx) |
| HTTP | Fastify |
| GraphQL | **Mercurius** (Fastify-native) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Keycloak (OIDC) — no passwords in the app DB |
| Object storage | Backblaze B2 (S3-compatible) |
| Observability | Telemetry port (Console / NoOp) |
| Caching | Cache port (In-Memory / NoOp) |

---

## Quickstart

```bash
npm install
cp .env.example .env      # fill in real values
npm run db:generate       # generate migrations from the Drizzle schema
npm run db:migrate        # apply them (or `db:push` for a scratch DB)
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

---

## Architecture (Clean Architecture + DI)

```
Resolvers (Mercurius)  ->  Services (business logic)  ->  Repositories  ->  Drizzle/Postgres
                                   |
                          Ports: IObjectStoragePort (B2), IIdentityProviderPort (Keycloak)
```

- **Unit of Work** (`src/uow.ts`): the service layer owns transactions; repositories
  receive a transaction-scoped executor and never leak `tx` upward.
- **Ports / Adapters**: external systems (B2, Keycloak) are non-transactional side
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
│   └── schema/                 # 18 tables: platform / document / booking (+enums)
├── errors/                     # AppError hierarchy
├── ports/                      # IObjectStoragePort, IIdentityProviderPort (+ DTOs)
├── adapters/                   # B2 storage + Keycloak IdP implementations
├── interfaces/                 # repository + service CONTRACTS (+ UoW, pagination)
├── repositories/               # Drizzle implementations (transaction-scoped)
├── services/                   # business-logic SKELETONS
├── infrastructure/             # telemetry + cache ports/adapters
├── graphql/                    # schema (.graphql) + resolvers + context + dataloaders
├── routes/                     # non-GraphQL HTTP (health, multipart uploads)
├── plugins/                    # (reserved)
├── types/                      # permission constants
└── utils/                      # checksum, storage keys, error handler
```

---

## Data model (18 tables)

- **[A] Shared platform** — `users`, `roles`, `user_roles`, `notifications`
- **[B] Document module** — `request_types`, `document_types`,
  `control_number_sequences`, `holidays`, `requests`, `request_attachments`,
  `documents`, `document_attachments`, `transmissions`, `document_logs`
- **[C] Booking module** — `venues`, `events`, `event_attendees`, `activity_logs`

Key conventions enforced in the schema:
- `users.id` = Keycloak OIDC `sub` (UUID); users are deactivated, never deleted.
- `document_logs` / `activity_logs` are append-only (no UPDATE/DELETE).
- Control numbers issued atomically per `(seq_code, year)`.
- No foreign key crosses the Document/Booking module boundary (NFR-24).

---

## Status

**Initialised (working):**
- Drizzle models for all 18 tables — migrations generate cleanly.
- Repository contracts + Drizzle implementations.
- GraphQL schema (SDL) + resolver wiring + per-request DataLoaders.
- Mercurius server, DI composition root, GraphiQL, health route.
- **B2** object-storage port + adapter (S3-compatible: upload, presigned download,
  head, delete) with server-computed SHA-256.
- **Keycloak** identity port + adapter (JWKS RS256 token verification + Admin API
  user/role management).
- `permissionCatalog` query and `_health` are live.

**Skeleton (throws `NotImplementedError`, wired end-to-end):**
- All business services — `UserService`, `RoleService`, `NotificationService`,
  `RequestService`, `DocumentService`, `AttachmentService`, `ReportService`,
  `LookupService`, `EventService`, `VenueService`.
- Multipart upload routes (`POST /uploads/...`).

Each skeleton method carries a `TODO(FR-xx)` pointing at the requirement it must
satisfy, so implementation can proceed requirement-by-requirement.
