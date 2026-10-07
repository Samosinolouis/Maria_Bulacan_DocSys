# Client Cache (Cache Manager)

> **Scope:** The client-side data cache for the DocSys service layer. Implemented in `app/src/services/cache/`, exposed to services through the `IClientCache` contract.
> **Audience:** Engineers implementing or modifying services that read and invalidate cached data.

The cache is a normalized entity store with a query registry. It deduplicates entities across queries, serves repeated reads without network round trips, and enables **precise invalidation**: after a mutation, only the queries that actually touch the changed data are pruned. No broad resets.

The cache is **owned by the service layer**. Hooks and views never touch it. They call services; services call the cache.

For the port definition, see [SERVICE_CONTRACTS.md](./SERVICE_CONTRACTS.md#cachets). For where the cache sits in the layer chain, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Table of Contents

1. [Why Four Stores](#why-four-stores)
2. [The Four Stores](#the-four-stores)
3. [Cache Key Generation](#cache-key-generation)
4. [TTL Policy](#ttl-policy)
5. [CRUD Flows in Detail](#crud-flows-in-detail)
6. [Invalidation Matrix](#invalidation-matrix)
7. [Match Functions](#match-functions)
8. [Who Owns the Cache](#who-owns-the-cache)
9. [Error Handling](#error-handling)
10. [Debugging and Statistics](#debugging-and-statistics)
11. [Edge Cases and Gotchas](#edge-cases-and-gotchas)
12. [Quick Reference: Adding a Cached Read](#quick-reference-adding-a-cached-read)
13. [Files Reference](#files-reference)

---

## Why Four Stores

A single key-value store breaks down when you need to:

1. Deduplicate entities across queries (the same `Request` fetched by a list and by a detail read must be one object).
2. Invalidate only the queries affected by a specific update or delete.
3. Invalidate only the list queries a newly created entity should appear in, without re-running every query.
4. Know which queries are complete and fresh versus stale.

Each store solves one of these. Together they keep cached data consistent with the server.

---

## The Four Stores

### 1. EntityStore - Normalized Entity Storage

**Type:** `Map<string, object>`
**Key format:** `EntityName_entityId` (for example `Request_3f6c...`, `Document_9a01...`)
**Purpose:** Single source of truth for all entity data.

Every entity returned by any query, whether a detail read or a list, is stored here. Two queries that reference the same entity share the same object in memory, so updating an entity updates it everywhere.

**Key constraint:** The entity name is PascalCase and matches the GraphQL type (`Request`, `Document`, `Event`, `Venue`, `Notification`, `User`, `Role`, `RequestType`, `DocumentType`, `Holiday`, `DashboardMetrics`, `RequestAttachment`, `DocumentAttachment`). It must match the `entities` array passed to `executeQueryWithCache`.

### 2. QueryStore - Query Metadata and TTL

**Type:** `Map<string, CacheQueryRecord>`
**Key format:** `v1:<entity_snake_case>:<get|list>:<idOrHash>` (for example `v1:request:list:7f2a1c`)
**Purpose:** Tracks which queries exist, what they produced, and whether they are still valid.

Each record matches the `CacheQueryRecord` contract:

| Field       | Type                        | Description                                                       |
| ----------- | --------------------------- | ----------------------------------------------------------------- |
| `entities`  | `string[]`                  | PascalCase entity names involved (`['Request', 'Document']`).      |
| `ids`       | `string[]`                  | Normalized entity keys the query produced (`['Request_abc']`).     |
| `type`      | `'get' \| 'list'`           | Affects how results resolve on a hit.                              |
| `ttl`       | `number`                    | Absolute expiry timestamp in ms (`Date.now() + ttlMs`).            |
| `match`     | `(entity) => boolean`       | Predicate used for create invalidation (see [Match Functions](#match-functions)). |
| `endCursor` | `string \| null`            | Relay end cursor captured on miss, replayed on hit.                |

### 3. QueryMembership - Entity to Query Mapping

**Type:** `Map<string, Set<string>>`
**Key format:** `EntityName_entityId` (same as EntityStore)
**Value:** Set of query keys that contain this entity.
**Purpose:** Drives update/delete invalidation.

When a document changes, QueryMembership answers: "which cached queries have this document in their results?" Those queries get invalidated. Queries that do not reference it stay.

### 4. EntityTypeIndex - Entity Type to Query Mapping

**Type:** `Map<string, Set<string>>`
**Key format:** Entity type name only (`Document`, `Request`, ...)
**Value:** Set of query keys for that entity type.
**Purpose:** Drives create invalidation.

A newly created entity has no membership entries. EntityTypeIndex answers: "which queries deal with this entity type?" Each query's `match` function then decides whether the new entity makes that query stale.

---

## Cache Key Generation

Keys are deterministic: the same inputs always produce the same key. Two formats exist.

### Get queries

```
v1:request:get:3f6c8b1a-...
```

Format: `{namespace}:{entity_snake_case}:get:{id}`

### List queries

```
v1:request:list:7f2a1c
```

Format: `{namespace}:{entity_snake_case}:list:{parameter_hash}`

The parameter hash is critical. Parameters are alphabetically sorted before hashing, so `{ first: 20, filter: null }` and `{ filter: null, first: 20 }` produce the same key. `null` and `undefined` values are stripped before hashing. The `after` cursor is included when present, so each page has its own entry and paging does not pollute the cache.

The hash is a 32-bit djb2 variant returning a base-36 string. It is not cryptographic and does not need to be.

**Namespace versioning:** when a model shape changes, bump the namespace (`v1` to `v2`). Stale client caches cannot then serve old shapes.

---

## TTL Policy

| Data class                                                      | Default TTL | Notes                                    |
| --------------------------------------------------------------- | ----------- | ---------------------------------------- |
| Operational reads (requests, documents, events, notifications)  | 60 s        | Queues change often; short TTL backstop. |
| Detail reads (`getById`, `getByControlNo`)                      | 60 s        | Same backstop; invalidation does the real work. |
| Dashboard metrics                                               | 30 s        | Derived from many entities; refreshed often. |
| Reference data (request types, document types, venues, holidays, permission catalog) | 10 min | Changes rarely; long TTL. |

Rules:

- TTL is an **absolute timestamp** check (`record.ttl > Date.now()`), evaluated by `hasValidQuery`.
- TTL is a backstop, not the mechanism. **Mutations invalidate target entries immediately**; TTL only bounds how long another user's change can stay invisible.
- Expired queries are not swept on a timer. They fail `hasValidQuery`, get overwritten on the next miss, and are cleaned by `clear()`.
- Entities in EntityStore are not TTL'd. An entity stays until an invalidation removes it. Unreferenced entities are unreachable through the normal read path, so this is safe.

---

## CRUD Flows in Detail

### Read flow (cache-aside)

```
Service calls executeQueryWithCache({ queryKey, queryFn, entities, ids, queryType, matchFn, ttlMs })

executeQueryWithCache:
  1. cache.hasValidQuery(queryKey)
     -> checks QueryStore for the key AND verifies ttl > Date.now()
  2. If HIT:
     -> reads the query's ids from QueryStore
     -> resolves each id from EntityStore via cache.getEntity(entityName, entityId)
     -> for 'list': returns { edges, pageInfo } reconstructed from the stored ids and endCursor
     -> for 'get': returns the single entity (or null if not in EntityStore)
  3. If MISS:
     -> executes queryFn() (the GraphQL call)
     -> normalizes the result into a list of items
     -> stores each item: cache.setEntity(entityName, item.id, item)
     -> captures endCursor from the response pageInfo
     -> stores query metadata: cache.setQuery(queryKey, { entities, ids, type, ttl, match, endCursor })
     -> registers membership: cache.registerMembership(entityName, item.id, queryKey)
     -> registers entity type: cache.registerEntityType(entityName, queryKey)
     -> returns the raw result
```

The `endCursor` captured on miss is replayed on hit so paginated lists can continue correctly from cache.

### Update/delete invalidation

```
Service updates an entity, then calls invalidateByEntity('Document', documentId)

invalidateByEntity:
  1. reads all query keys from QueryMembership['Document_<id>']
  2. deletes each query from QueryStore (refetched on next read)
  3. removes the QueryMembership entry
  4. removes the entity from EntityStore
```

### Create invalidation

A new entity has no membership entries, so the system uses EntityTypeIndex plus match functions:

```
Service creates an entity, then calls invalidateByEntityType('Request', newRequest)

invalidateByEntityType:
  1. reads all query keys from EntityTypeIndex['Request']
  2. for each query key:
     a. reads the CacheQueryRecord from QueryStore
     b. if record.match exists AND match(newRequest) returns true:
        -> deletes the query from QueryStore
        -> for each entity name in record.entities:
           -> removes this query from EntityTypeIndex[entityName]
     c. otherwise the query is skipped
```

Removing the query from EntityTypeIndex keeps the index free of references to deleted QueryStore entries.

---

## Invalidation Matrix

Every mutation invalidates its own entities plus the derived queries listed here. The table is the contract between a mutation and the cache; keep it updated when a mutation is added.

| Mutation | Invalidates |
| -------- | ----------- |
| `encodeRequest` | `invalidateByEntityType('Request', created)`, dashboard metrics |
| `screenRequest`, `resubmitRequest` | `invalidateByEntity('Request', id)`, dashboard metrics |
| `prepareDocument` | `invalidateByEntityType('Document', created)`, `invalidateByEntity('Request', requestId)` |
| `submitForReview` | `invalidateByEntity('Document', id)`, `invalidateByEntity('Request', requestId)` |
| `review` | `invalidateByEntity('Document', id)`, `invalidateByEntity('Request', requestId)`, dashboard metrics |
| `sign` | `invalidateByEntity('Document', id)` |
| `transmit` | `invalidateByEntity('Document', id)`, `invalidateByEntity('Request', requestId)` |
| `close` | `invalidateByEntity('Request', id)`, `invalidateByEntity('Document', ...)` for linked documents |
| `uploadRequestAttachment` | `invalidateByEntity('Request', requestId)` (attachment lists for that request) |
| `uploadDocumentAttachment` | `invalidateByEntity('Document', documentId)` |
| `createEvent` | `invalidateByEntityType('Event', created)`, my-schedule queries |
| `updateEvent` | `invalidateByEntity('Event', id)`, my-schedule queries |
| `cancelEvent` | `invalidateByEntity('Event', id)`, my-schedule queries |
| `markRead`, `markAllRead` | `invalidateByEntity('Notification', id)` / unread-count query |
| `assignRole`, `removeRole`, `updateProfile`, `deactivateUser`, `reactivateUser` | `invalidateByEntity('User', id)` |
| `createRole`, `updateRole` | `invalidateByEntityType('Role', ...)`, `invalidateByEntity('Role', id)` |
| `createRequestType`, `createDocumentType`, `upsertHoliday` | the corresponding reference-data query |

Dashboard metrics are cached under a single query (`v1:metrics:dashboard`) whose match function returns true, so any create that affects it can prune it. Treat metrics as always-invalidatable on request/document/event mutations.

---

## Match Functions

`match` decides whether a newly created entity makes a cached list stale. Conservative matching is correct: a false positive costs one refetch, a false negative serves stale data.

```ts
// A queue filtered by status mirrors the filter in its match.
matchFn: (request) => request.status === 'REVIEW'

// Documents belonging to one request.
matchFn: (document) => document.requestId === requestId

// The user's unread inbox.
matchFn: (notification) => notification.readAt === null

// Reference data always matches (small, rarely created).
matchFn: () => true
```

Defaults:

- Omitting `matchFn` defaults to `() => true`: any create of that entity type invalidates the query. Correctness over a rare wasted refetch.
- Passing `matchFn: null` **explicitly** opts the query out of create invalidation. That is deliberate, not the default.
- Never write `matchFn: (e) => !filter` style inversions. They return false whenever a filter is present and silently serve stale data.

---

## Who Owns the Cache

- **Services** read and write through `IClientCache`. All key generation and invalidation lives in service code plus the shared helpers (`app/src/services/cache/helpers.ts`).
- **Hooks and views** never import the cache. If a view needs fresh data, it calls `refresh()` on a data hook, which calls a service, which re-runs the cache-aside flow.
- **The composition root** creates one cache instance and injects it into every service. One cache, many services, cross-service invalidation works because the entity store is shared.

---

## Error Handling

- Failed queries are not cached. There is no negative caching.
- The cache layer does not catch `queryFn` errors. They propagate to the service, which normalizes them into `AppError`.
- A cache read never throws. Corrupt entries are treated as misses.

---

## Debugging and Statistics

Services log hits and misses via `console.debug`:

```
[RequestService] Cache HIT  v1:request:list:7f2a1c
[RequestService] Cache MISS v1:document:get:9a01...
```

`cache.stats()` returns counts for EntityStore, QueryStore, membership entries, and distinct entity types. Use it in the browser console when chasing a stale-data report.

---

## Edge Cases and Gotchas

### Underscores in entity ids

Entity keys join with `_` and split on the FIRST underscore. Entity names must not contain underscores; ids may.

### PascalCase versus snake_case

EntityStore and QueryMembership use PascalCase (`Request`, `Document`). QueryStore keys use snake_case (`request`, `document`). They are different namespaces; do not mix them.

### No size limit

There is no eviction policy beyond TTL and explicit invalidation. For this application's volumes that is fine. If the archive view ever loads thousands of rows in one query, cap `first` and rely on pagination.

### Page refresh clears everything

The cache is in-memory only. A refresh starts fresh. This is intentional: correctness across deploys is guaranteed by the namespace bump, not by persistence.

### Clock checks

TTL compares client-side timestamps only; there is no server clock involved.

---

## Quick Reference: Adding a Cached Read

1. Add the operation document to `app/src/services/graphql/<domain>.ts`.
2. In the service method, generate the key (`generateGetCacheKey`, `generateListCacheKey`).
3. Call `executeQueryWithCache` with the key, the query function, the entity names, the query type, a `matchFn`, and a TTL.
4. For mutations, after success, call `invalidateByEntity` or `invalidateByEntityType` per the [Invalidation Matrix](#invalidation-matrix).
5. Never generate keys or call the cache from hooks or views.

---

## Files Reference

| File                                        | Role                                                         |
| ------------------------------------------- | ------------------------------------------------------------ |
| `app/src/services/contracts/cache.ts`       | `IClientCache` port and `CacheQueryRecord`                   |
| `app/src/services/cache/client-cache.ts`    | Cache implementation (four stores)                           |
| `app/src/services/cache/helpers.ts`         | Key generation, `executeQueryWithCache`, invalidation helpers, `normalizeError` |
| `app/src/services/cache/index.ts`           | Composition accessor (single instance)                       |

See also:

- [SERVICE_CONTRACTS.md](./SERVICE_CONTRACTS.md) - the `IClientCache` contract.
- [specs/services-spec.md](./specs/services-spec.md) - per-service cache usage and invalidation.
- [ARCHITECTURE.md](./ARCHITECTURE.md) - the layer chain and the mutation pattern.
