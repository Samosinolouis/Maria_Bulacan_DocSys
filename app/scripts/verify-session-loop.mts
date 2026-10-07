/**
 * Regression test for the session-refresh loop ("infinite /api/auth/session").
 *
 * Two things are proven here:
 *
 *  A. The transport bounds its UNAUTHENTICATED recovery. It replays at most
 *     once, only with a token that actually changed, and never for a bootstrap
 *     operation - so a refresh that keeps minting tokens the backend rejects
 *     can no longer spin (the failure mode was refresh -> loadSession -> me ->
 *     401 -> refresh -> ...).
 *
 *  B. SessionService.refresh() cannot be turned into a request storm: a fresh
 *     token skips the read, concurrent callers share one refresh, and a failed
 *     refresh backs off instead of being retried by every caller.
 *
 * Part A drives the real FetchGraphQLClient against the live backend with a
 * deliberately bogus Bearer token; part B drives SessionService with fakes.
 *
 * Run from `app/`:
 *   ../backend/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/verify-session-loop.mts
 */

import { FetchGraphQLClient } from '@/services/graphql/client';
import { NOTIFICATION_OPS } from '@/services/graphql/notification.ops';
import { SessionService, type SessionAuthPort } from '@/services/session/session.service';
import type { GraphQLOperation, IGraphQLClient } from '@/services/contracts/graphql';
import type { SessionSnapshot, SessionUser } from '@/services/contracts/session';

const KEYCLOAK_TOKEN_URL = 'http://localhost:8080/realms/docsys/protocol/openid-connect/token';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

let failures = 0;

function check(label: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`  ok   ${label} (${detail})`);
    return;
  }
  failures += 1;
  console.log(`  FAIL ${label} (${detail})`);
}

async function fetchRealToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'docsys-app',
    username: 'administrator',
    password: 'DocSys2026!',
    scope: 'openid',
  });
  const res = await fetch(KEYCLOAK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('Keycloak did not issue a token');
  return json.access_token;
}

/** One guarded mutation, sent with whatever token the client currently holds. */
async function guardedCall(client: FetchGraphQLClient): Promise<'ok' | 'rejected'> {
  try {
    await client.request<{ markAllNotificationsRead: { count: number } }>({
      document: NOTIFICATION_OPS.markAllRead,
      operationName: 'MarkAllNotificationsRead',
    });
    return 'ok';
  } catch {
    return 'rejected';
  }
}

// --- A. Transport: bounded recovery ---------------------------------------

async function verifyTransport(realToken: string) {
  console.log('A. transport retry bounds');

  // 1. Refresh claims success but hands back the same token: no replay.
  let refreshes = 0;
  let token = 'stale-token-that-the-backend-rejects';
  let client = new FetchGraphQLClient(
    async () => token,
    GRAPHQL_URL,
    async () => {
      refreshes += 1;
      return true;
    },
  );
  let outcome = await guardedCall(client);
  check(
    'same token after refresh -> no replay',
    outcome === 'rejected' && refreshes === 1,
    `outcome=${outcome} refreshes=${refreshes}`,
  );

  // 2. Refresh keeps minting tokens the backend rejects: exactly one replay.
  refreshes = 0;
  client = new FetchGraphQLClient(
    async () => token,
    GRAPHQL_URL,
    async () => {
      refreshes += 1;
      token = `still-rejected-${refreshes}`;
      return true;
    },
  );
  outcome = await guardedCall(client);
  check(
    'rotating-but-rejected token -> single replay, no loop',
    outcome === 'rejected' && refreshes === 1,
    `outcome=${outcome} refreshes=${refreshes}`,
  );

  // 3. Bootstrap operations opt out of the retry entirely.
  refreshes = 0;
  client = new FetchGraphQLClient(
    async () => 'stale-token-that-the-backend-rejects',
    GRAPHQL_URL,
    async () => {
      refreshes += 1;
      return true;
    },
  );
  try {
    await client.request({
      document: 'query Me { me { id } }',
      operationName: 'Me',
      skipAuthRetry: true,
    });
  } catch {
    // expected: the backend rejects the bogus token
  }
  check('skipAuthRetry never refreshes', refreshes === 0, `refreshes=${refreshes}`);

  // 4. The happy path still recovers.
  refreshes = 0;
  token = 'stale-token-that-the-backend-rejects';
  client = new FetchGraphQLClient(
    async () => token,
    GRAPHQL_URL,
    async () => {
      refreshes += 1;
      token = realToken;
      return true;
    },
  );
  outcome = await guardedCall(client);
  check(
    'stale token -> one refresh -> success',
    outcome === 'ok' && refreshes === 1,
    `outcome=${outcome} refreshes=${refreshes}`,
  );
}

// --- B. SessionService: no refresh storm ----------------------------------

class FakeGql implements IGraphQLClient {
  calls: GraphQLOperation[] = [];
  async request<TData, TVariables = Record<string, unknown>>(
    operation: GraphQLOperation<TVariables>,
  ): Promise<TData> {
    this.calls.push(operation as GraphQLOperation);
    return { me: { id: 'u1', firstName: 'Elmer' } as unknown as SessionUser } as TData;
  }
}

async function verifySessionService() {
  console.log('B. SessionService refresh guards');

  const gql = new FakeGql();
  let reads = 0;
  let session: { accessToken: string | null; expiresAt?: number | null } | null = null;
  const auth: SessionAuthPort = {
    signIn: async () => {},
    signOut: async () => {},
    getSessionToken: async () => {
      reads += 1;
      return session;
    },
  };
  const svc = new SessionService(gql, auth);
  const inSeconds = (seconds: number) => Math.floor(Date.now() / 1000) + seconds;

  // 0. The provider re-runs hydrate on every NextAuth transition: overlapping
  //    calls must not each cost a session read.
  const gql2 = new FakeGql();
  let reads2 = 0;
  const auth2: SessionAuthPort = {
    signIn: async () => {},
    signOut: async () => {},
    getSessionToken: async () => {
      reads2 += 1;
      return { accessToken: 'token-z', expiresAt: inSeconds(600) };
    },
  };
  const svc2 = new SessionService(gql2, auth2);
  await Promise.all([svc2.hydrate(), svc2.hydrate(), svc2.hydrate()]);
  check('concurrent hydrates share one read', reads2 === 1, `reads=${reads2}`);

  // 1. A long-lived token: hydrate reads it once, the next refresh skips the
  //    read entirely (the cached expiry says it is still good).
  session = { accessToken: 'token-a', expiresAt: inSeconds(600) };
  const snapshot: SessionSnapshot | null = await svc.hydrate();
  check('hydrate establishes the session', snapshot !== null, `reads=${reads}`);
  const afterHydrate = reads;
  const skipped = await svc.refresh();
  check(
    'fresh token skips the session read',
    skipped && reads === afterHydrate,
    `reads=${reads} (was ${afterHydrate})`,
  );

  // 2. A token inside the freshness skew is renewed (adopted by hydrate, so the
  //    service knows it is nearly spent).
  session = { accessToken: 'token-b', expiresAt: inSeconds(30) };
  await svc.hydrate();
  const afterNear = reads;
  await svc.refresh();
  check('near-expiry token is renewed', reads === afterNear + 1, `reads=${reads}`);

  // 3. Three callers at once share a single read.
  session = { accessToken: 'token-c', expiresAt: inSeconds(30) };
  await svc.hydrate();
  const beforeConcurrent = reads;
  await Promise.all([svc.refresh(), svc.refresh(), svc.refresh()]);
  check(
    'concurrent refreshes share one read',
    reads === beforeConcurrent + 1,
    `reads=${reads} (was ${beforeConcurrent})`,
  );

  // 4. A dead session is reported once, then backed off (no per-caller retries).
  session = null;
  await svc.hydrate();
  const beforeFailure = reads;
  const dead = await svc.refresh();
  const blocked = await svc.refresh();
  check(
    'no session -> false, then backed off',
    !dead && !blocked && reads === beforeFailure + 1,
    `reads=${reads} (was ${beforeFailure})`,
  );

  check(
    'bootstrap `me` opts out of the auth retry',
    gql.calls.every((call) => call.skipAuthRetry === true),
    `me calls=${gql.calls.length}`,
  );
}

async function main() {
  const realToken = await fetchRealToken();
  await verifyTransport(realToken);
  await verifySessionService();

  if (failures > 0) {
    console.log(`\nFAIL: ${failures} check(s) failed`);
    process.exit(1);
  }
  console.log('\nPASS: session refresh is bounded and single-flight');
}

void main();
