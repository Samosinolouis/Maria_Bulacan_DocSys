# Hooks Layer Specification

> **Scope:** Implementation spec for the hooks layer under `app/src/hooks/`. Hooks are the React binding over the service contracts in [SERVICE_CONTRACTS.md](../SERVICE_CONTRACTS.md).
> **Audience:** Engineers implementing hooks and rewiring views to them.

Hooks own React state and lifecycle. They contain no business logic, no GraphQL, and no cache access. Every hook reads services from the `ServiceRegistry` and exposes either stable method references or screen-scoped data state.

---

## Table of Contents

1. [Layer Position](#layer-position)
2. [Hook Rules](#hook-rules)
3. [Hook Categories](#hook-categories)
4. [Service Access and Stable Binding](#service-access-and-stable-binding)
5. [The Data Hook Primitive](#the-data-hook-primitive)
6. [Data Hook Catalog](#data-hook-catalog)
7. [Authorization Hooks](#authorization-hooks)
8. [Utility Hooks](#utility-hooks)
9. [Worked Example: Review Desk](#worked-example-review-desk)
10. [Anti-Patterns](#anti-patterns)
11. [Testing](#testing)
12. [File Map](#file-map)

---

## Layer Position

```
React (views)  ->  Hooks  ->  Services (contracts)  ->  Backend
```

A view calls hooks. A hook calls services. Nothing above a hook touches a service directly, and a hook never bypasses the service layer.

---

## Hook Rules

1. **No GraphQL, no cache, no fetch.** If a hook needs data, it calls a service method.
2. **No business logic.** Derived flags that require rules (for example "can this document be reviewed") come from the authorization engine or from data hooks, not from ad-hoc logic in the hook.
3. **Stable identities.** Every function a hook returns is stable across renders (created once per consumer). Views can put them in `useEffect` dependency arrays safely.
4. **Explicit dependencies.** Data hooks take their query arguments as parameters and refetch when they change. No hidden context reads beyond the service registry and the authorization engine.
5. **Cleanup.** Any async work checks a liveness flag (or aborts) on unmount; late responses never set state.
6. **Error translation.** Hooks catch `AppError` and expose `error.message` as-is; the message is user-safe by contract.
7. **No conditional hooks.** Hooks are called unconditionally at the top of components, per the rules of hooks.

---

## Hook Categories

| Category | Purpose | Examples |
| -------- | ------- | -------- |
| Service binding | Stable method references for imperative calls and mutations | `useRequestService()`, `useDocumentService()` |
| Data | Screen-scoped read state: `{ data, isLoading, error, refresh }` | `useReviewQueue()`, `useDashboardMetrics()` |
| Authorization | Engine access for UI gating | `useCan()`, `useAuthorization()` |
| Utility | Reusable React helpers with no domain knowledge | `useDebouncedValue()` |

---

## Service Access and Stable Binding

The composition root provides the registry through React context. Two internal hooks bridge it:

```ts
// app/src/hooks/useServices.ts (internal)
export function useServices(): ServiceRegistry {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServiceProvider>');
  return services;
}
```

```ts
// app/src/hooks/useServiceMethods.ts
export function useServiceMethods<T extends object, K extends keyof T>(
  service: T,
  names: readonly K[],
): Pick<T, K> {
  const ref = useRef<Pick<T, K> | null>(null);
  if (ref.current === null) {
    const picked = {} as Pick<T, K>;
    for (const name of names) {
      const method = service[name];
      picked[name] =
        typeof method === 'function'
          ? ((...args: unknown[]) => (service[name] as (...a: unknown[]) => unknown)(...args)) as T[K]
          : method;
    }
    ref.current = picked;
  }
  return ref.current;
}
```

The picked object is created once and never replaced, so both the object and every method identity are stable across renders. A domain binding hook is then a one-liner:

```ts
// app/src/hooks/useRequestService.ts
export function useRequestService() {
  const { requests } = useServices();
  return useServiceMethods(requests, ['getById', 'getByControlNo', 'list', 'listTypes', 'encode', 'screen', 'resubmit'] as const);
}
```

Adding a method to a hook is a one-line change to the name list. The name list also documents exactly which part of the contract the hook exposes (ISP at the hook seam).

---

## The Data Hook Primitive

Every data hook is built on one primitive:

```ts
// app/src/hooks/useServiceQuery.ts
export interface ServiceQueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: AppErrorShape | null;
  refresh: () => void;
}

export function useServiceQuery<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
): ServiceQueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<AppErrorShape | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (live) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: AppErrorShape) => {
        if (live) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { data, isLoading, error, refresh };
}
```

Behavior:

- `refresh()` re-runs the fetcher (used after mutations, per the commit-then-refresh pattern).
- The `live` flag drops responses from unmounted consumers and from superseded runs.
- The fetcher passed in must be a stable `useCallback` at the call site so dependency arrays behave.

Mutations use a sibling helper:

```ts
// app/src/hooks/useAsyncAction.ts
export interface AsyncActionState<A extends unknown[], R> {
  run: (...args: A) => Promise<R | null>;
  isPending: boolean;
  error: AppErrorShape | null;
}
```

`run` returns `null` on failure (after setting `error`), so views can write `const result = await run(...); if (result) refresh();`.

---

## Data Hook Catalog

| Hook | Service call | Returns | Used by |
| ---- | ------------ | ------- | ------- |
| `useRequests(args)` | `requests.list(args)` | `Connection<Request>` | registry tables, archive |
| `useRequest(id)` | `requests.getById(id)` | `Request` | dossier, detail views |
| `useReviewQueue()` | `documents.list({ filter: { status: 'UNDER_REVIEW' } })` | `Connection<Document>` | review desk |
| `useDocuments(args)` | `documents.list(args)` | `Connection<Document>` | preparation, transmit |
| `useDocument(id)` | `documents.getById(id)` | `Document` | dossier, decision panel |
| `useDashboardMetrics()` | `reports.getDashboardMetrics()` | `DashboardMetrics` | dashboard |
| `useCategorySummary(input)` | `reports.getCategorySummary(input)` | `CategorySummaryRow[]` | reports |
| `useEvents(args)` | `events.list(args)` | `Connection<Event>` | schedule |
| `useMySchedule(date)` | `events.listMySchedule(date)` | `Event[]` | dashboard, mobile schedule |
| `useVenues(includeInactive?)` | `venues.list(includeInactive)` | `Venue[]` | schedule, event modal |
| `useLookups()` | `lookups.listRequestTypes()` + `listDocumentTypes()` + `listHolidays()` | `{ requestTypes, documentTypes, holidays }` | intake, drafting |
| `useNotifications(args)` | `notifications.listInbox(args)` | `Connection<Notification>` | notification center |
| `useUnreadNotificationCount()` | `notifications.unreadCount()` | `number` | sidebar bell |
| `useUsers(args)` | `users.list(args)` | `Connection<User>` | admin |
| `useRoles(args)` | `roles.list(args)` | `Connection<Role>` | admin |
| `usePermissionCatalog()` | `roles.permissionCatalog()` | `PermissionCatalogEntry[]` | role editor |

Rules:

- A data hook accepts exactly the arguments its service method needs; it does not read filter state from context.
- Screens compose several data hooks into their singular page object; a hook never composes other hooks' outputs into "page data".
- Composite hooks (for example `useLookups()`) are allowed when one screen concern spans several service calls; they still return plain data state.

---

## Authorization Hooks

Implemented in `app/src/hooks/useAuthorization.ts`, hydrated by `app/src/authz/provider.tsx`:

| Hook | Returns | Notes |
| ---- | ------- | ----- |
| `useAuthorization()` | `{ can, decide, permissions, roles, user, isHydrated }` | Full engine surface. Re-renders on subject change. |
| `useCan(action, resource?)` | `boolean` | Memoized per action and resource attributes. |
| `usePermissions()` | `readonly string[]` | Display only (for example the admin "effective permissions" view). |
| `useSessionUser()` | `SessionUser \| null` | Header identity, signature blocks. |

Rules:

- `useCan` takes a resource whenever the action is resource-scoped (review, sign, transmit, close, cancel). A queue row gates on the document it renders.
- Hooks never string-build permission ids; callers pass `KnownActionId` values.
- Before hydration (`isHydrated() === false`), `useCan` returns false; views render their loading state.

---

## Utility Hooks

| Hook | Purpose |
| ---- | ------- |
| `useDebouncedValue(value, delayMs)` | Search inputs before they become query args. |
| `useMediaQuery(query)` | Responsive behavior shared with the shell (mobile drawer). |

Keep this list short. If a helper needs domain knowledge, it is not a utility hook.

---

## Worked Example: Review Desk

```tsx
// app/src/components/views/ReviewView.tsx (shape)
export default function ReviewView() {
  const { list, review } = useDocumentService();
  const { can } = useAuthorization();
  const { run: decide, isPending } = useAsyncAction(review);

  const queue = useServiceQuery(
    useCallback(() => list({ filter: { status: 'UNDER_REVIEW' }, sort: { field: 'CREATED_AT', direction: 'DESC' } }), [list]),
    [],
  );

  const pageData = useMemo(
    () => (queue.data ? { rows: queue.data.edges.map((edge) => edge.node) } : null),
    [queue.data],
  );

  const onDecide = async (document: Document, decision: ReviewDecision, reason?: string) => {
    const result = await decide({ documentId: document.id, decision, denialReason: reason });
    if (result) queue.refresh();
  };

  if (queue.isLoading) return <LoadingPanel />;
  if (queue.error) return <ErrorPanel message={queue.error.message} onRetry={queue.refresh} />;
  if (!pageData) return null;

  return (
    <ReviewQueue
      rows={pageData.rows}
      isPending={isPending}
      canReview={(document) =>
        can('DocumentService:Review', { kind: 'document', attributes: { status: document.status } })
      }
      onDecide={onDecide}
    />
  );
}
```

Points to keep when rewriting the real view:

- One fetch orchestrator (here: the queue query), one singular page object, mutations that refresh.
- Gating goes through `useAuthorization()` or `useCan`; no role names are checked in the view.
- The presentational queue receives data and callbacks; it never calls services.

---

## Anti-Patterns

1. Calling services directly from a component instead of through a hook.
2. Reading `useApp()`-style context for server data (the old pattern); server data comes from data hooks.
3. Building permission strings or role checks inside a component.
4. Putting `fetch` or GraphQL in a hook "just this once".
5. Forgetting the `live` guard, then setting state after unmount.
6. Creating method references with inline arrow functions in JSX (breaks stable identity and memoization).

---

## Testing

- Data hooks: render with a mocked `ServiceRegistry` (mock implementations from `services/mocks/`), assert loading, success, error, and refresh behavior, including the out-of-order response case.
- Binding hooks: assert the picked methods are stable across re-renders and that missing methods fail loudly.
- Authorization hooks: render under the provider with fixture subjects; assert gating flips when the subject changes.

---

## File Map

| File | Purpose |
| ---- | ------- |
| `app/src/hooks/useServices.ts` | Internal registry accessor |
| `app/src/hooks/useServiceMethods.ts` | Stable method picking helper |
| `app/src/hooks/useServiceQuery.ts` | Read-state primitive |
| `app/src/hooks/useAsyncAction.ts` | Mutation-state primitive |
| `app/src/hooks/useAuthorization.ts` | `useAuthorization`, `useCan`, `usePermissions`, `useSessionUser` |
| `app/src/hooks/use<Domain>Service.ts` | One binding hook per domain |
| `app/src/hooks/use<Screen>.ts` | Data hooks per screen concern |
| `app/src/hooks/index.ts` | Barrel export |

See also:

- [SERVICE_CONTRACTS.md](../SERVICE_CONTRACTS.md) - the contracts hooks consume.
- [specs/services-spec.md](./services-spec.md) - the layer hooks call into.
- [ARCHITECTURE.md](../ARCHITECTURE.md) - the page philosophy hooks support.
