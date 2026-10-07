/**
 * Verifies the stale-token recovery path of the GraphQL client.
 *
 * The transport must replay a request once when the backend answers
 * UNAUTHENTICATED, after asking the session service to re-run the OIDC
 * refresh-token grant. This drives the real client against the live backend:
 * the first attempt deliberately sends a bogus Bearer token, and the injected
 * "refresh" swaps in a real one.
 *
 * Run from `app/` with the backend's tsx:
 *   ../backend/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/verify-session-refresh.mts
 */

import { FetchGraphQLClient } from '@/services/graphql/client';
import { NOTIFICATION_OPS } from '@/services/graphql/notification.ops';

const KEYCLOAK_TOKEN_URL =
  'http://localhost:8080/realms/docsys/protocol/openid-connect/token';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

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

async function main() {
  const realToken = await fetchRealToken();
  let currentToken = 'stale-token-that-the-backend-rejects';
  let refreshes = 0;

  const client = new FetchGraphQLClient(
    async () => currentToken,
    GRAPHQL_URL,
    async () => {
      refreshes += 1;
      currentToken = realToken;
      return true;
    },
  );

  // A guarded operation: with a bogus Bearer token the backend answers
  // UNAUTHENTICATED ("Authentication required"), which is exactly the failure
  // the retry must absorb. This mutation is idempotent (the inbox is read).
  const data = await client.request<{
    markAllNotificationsRead: { changedEntities: string[]; count: number };
  }>({
    document: NOTIFICATION_OPS.markAllRead,
    operationName: 'MarkAllNotificationsRead',
  });

  console.log(`refreshes: ${refreshes}`);
  console.log(`changedEntities: ${JSON.stringify(data.markAllNotificationsRead.changedEntities)}`);
  if (refreshes !== 1) {
    console.log('FAIL: the client did not recover from the stale token');
    process.exit(1);
  }
  console.log('PASS: stale token replayed once after the refresh');
}

void main();
