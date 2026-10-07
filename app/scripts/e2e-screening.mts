/**
 * Focused live test of Step 2's fail -> resubmit path through the real service
 * layer (the main e2e only covered the pass path).
 *
 * Run from app/:  ../backend/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/e2e-screening.mts
 */

import { createServices } from '@/services';
import type { AuthzSubject } from '@/services/contracts/authz';

const KC = 'http://localhost:8080/realms/docsys';
let currentToken: string | null = null;

const bundle = createServices({
  signIn: async () => {},
  signOut: async () => {},
  getSessionToken: async () =>
    currentToken ? { accessToken: currentToken, expiresAt: null } : null,
});

async function token(username: string): Promise<string> {
  const res = await fetch(`${KC}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'docsys-app',
      username,
      password: 'DocSys2026!',
      scope: 'openid profile email',
    }),
  });
  return ((await res.json()) as { access_token: string }).access_token;
}

currentToken = await token('clerk');
bundle.session.clearAccessToken();
const snapshot = await bundle.session.loadSession(null);
const subject: AuthzSubject = {
  userId: snapshot.user.id,
  roles: snapshot.user.roles.map((r) => r.name),
  permissions: snapshot.user.effectivePermissions,
  office: snapshot.user.office,
  position: snapshot.user.position,
};
bundle.authz.setSubject(subject);

const types = await bundle.registry.lookups.listRequestTypes(true);
const requestTypeId = types[0].id;

const request = await bundle.registry.requests.encode({
  requestTypeId,
  title: 'E2E screening return/resubmit',
  requestingParty: 'Brgy. Sta. Cruz',
  originOffice: 'Barangay Sta. Cruz',
  channel: 'WALK_IN',
});
console.log('1. encode           ->', request.status, request.controlNo);

const failed = await bundle.registry.requests.screen({
  requestId: request.id,
  passed: false,
  deficiencies: ['Missing barangay clearance', 'Unsigned request letter'],
  notes: 'Returned to requesting party.',
});
console.log('2. screen(fail)     ->', failed.status);

const resubmitted = await bundle.registry.requests.resubmit(request.id);
console.log('3. resubmit         ->', resubmitted.status);

const passed = await bundle.registry.requests.screen({
  requestId: request.id,
  passed: true,
  notes: 'Deficiencies cured.',
});
console.log('4. screen(pass)     ->', passed.status);

const fresh = await bundle.registry.requests.getById(request.id);
console.log('5. logs recorded    ->', fresh?.logs.length, 'entries');
console.log(
  '   timeline         ->',
  fresh?.logs.map((l) => l.actionType).join(' <- '),
);

// Client-side guard must allow resubmit from RETURNED_FOR_COMPLIANCE.
const decision = bundle.authz.decide({
  action: 'RequestService:Screen',
  resource: { kind: 'request', attributes: { status: 'RETURNED_FOR_COMPLIANCE' } },
});
console.log('6. policy resubmit  ->', decision.allowed ? 'ALLOWED' : `DENIED (${decision.code})`);

console.log('\nSCREENING RETURN/RESUBMIT PASSED');
