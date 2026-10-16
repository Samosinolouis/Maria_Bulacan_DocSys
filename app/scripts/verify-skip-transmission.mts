/**
 * Live proof that Step 5 (transmission) is OPTIONAL and that the archive desk
 * sees a request that skipped it.
 *
 * Drives the REAL frontend service layer (same composition root, authz engine,
 * GraphQL client, cache and multipart uploads the UI uses) against the running
 * stack, then reads the rows back out of Postgres.
 *
 * Proves:
 *  A. a request can reach APPROVED with NO transmission record at all;
 *  B. the archive desk query (`requests(filter: { statusIn: [...] })`) returns
 *     it while the old single-status filter (`status: TRANSMITTED`) does not -
 *     the desk used to hide exactly this request;
 *  C. `documents.close` succeeds on it with no transmission and no signature
 *     event (only the mandatory signed final copy, FR-29), moving the request to
 *     CLOSED and filing its document into the picked folder;
 *  D. a second close is refused (already closed, FR-31);
 *  E. the probe rows are removed again and the control-number sequence is put
 *     back (the dev slate is left as it was found). The two uploaded probe
 *     objects stay in MinIO - the same trade-off the e2e-workflow probe makes.
 *
 * Run from `app/` with the stack up:
 *   ../backend/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/verify-skip-transmission.mts
 */

import { execFileSync } from 'node:child_process';

import { createServices } from '@/services';
import type { AuthzSubject } from '@/services/contracts/authz';
import { isAppError } from '@/services/contracts/errors';

const KC = 'http://localhost:8080/realms/docsys';
const PASSWORD = 'DocSys2026!';
/** The desk's pending-archival set: concluded (or dispatched) and not filed. */
const DESK_STATUSES = ['APPROVED', 'ENDORSED', 'DENIED', 'TRANSMITTED'] as const;

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail: string) {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${label} (${detail})`);
    return;
  }
  failures += 1;
  console.log(`  FAIL ${label} (${detail})`);
}

/** One SQL statement against the dev database; returns trimmed stdout. */
function sql(statement: string): string {
  return execFileSync(
    'docker',
    ['exec', 'docsys-postgres', 'psql', '-U', 'docsys', '-d', 'docsys', '-t', '-A', '-c', statement],
    { encoding: 'utf8' },
  ).trim();
}

/** Control-number sequences as `<seq_code>|<year>` -> last_value. */
function sequences(): Map<string, number> {
  const rows = sql(
    "select seq_code || '|' || year || '|' || last_value from app.control_number_sequences order by seq_code, year",
  )
    .split('\n')
    .filter((row) => row.length > 0);
  return new Map(
    rows.map((row) => {
      const [code, year, value] = row.split('|');
      return [`${code}|${year}`, Number(value)];
    }),
  );
}

async function token(username: string): Promise<string> {
  const res = await fetch(`${KC}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'docsys-app',
      username,
      password: PASSWORD,
      scope: 'openid profile email',
    }),
  });
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error(`no token for ${username}`);
  return json.access_token;
}

let currentToken: string | null = null;

const bundle = createServices({
  signIn: async () => {},
  signOut: async () => {},
  clearSession: async () => {},
  getSessionToken: async () =>
    currentToken ? { accessToken: currentToken, expiresAt: null } : null,
});

/** Switch the active actor: new token -> reload `me` -> rehydrate the engine. */
async function asActor(username: string) {
  currentToken = await token(username);
  bundle.session.clearAccessToken();
  const snapshot = await bundle.session.loadSession(null);
  const subject: AuthzSubject = {
    userId: snapshot.user.id,
    roles: snapshot.user.roles.map((role) => role.name),
    permissions: snapshot.user.effectivePermissions,
    office: snapshot.user.office,
    position: snapshot.user.position,
  };
  bundle.authz.setSubject(subject);
  return snapshot.user;
}

async function main() {
  const sequencesBefore = sequences();

  console.log('== actor: clerk ==');
  const clerk = await asActor('clerk');
  check(
    'the clerk holds the archive grants',
    clerk.effectivePermissions.includes('DocumentService:Close') &&
      clerk.effectivePermissions.includes('DocumentService:Transmit'),
    'DocumentService:Close + DocumentService:Transmit',
  );

  const requestTypeId = sql(
    "select id from app.request_types where is_active and code = 'LETTER' limit 1",
  );
  const documentTypeId = sql(
    "select id from app.document_types where is_active and code = 'EO' limit 1",
  );
  check(
    'reference data is seeded (LETTER request type, EO document type)',
    requestTypeId.length === 36 && documentTypeId.length === 36,
    `${requestTypeId || 'missing'} / ${documentTypeId || 'missing'}`,
  );

  console.log('== A. reach APPROVED without transmitting ==');
  const request = await bundle.registry.requests.encode({
    requestTypeId,
    title: 'Skip-transmission probe - barangay drainage request',
    requestingParty: 'Brgy. San Jose',
    originOffice: 'Barangay San Jose',
    channel: 'WALK_IN',
    priority: 'NORMAL',
  });
  check(
    'requests.encode issued a control number',
    /^[A-Z]+-\d{4}-\d+$/.test(request.controlNo),
    request.controlNo,
  );

  const screened = await bundle.registry.requests.screen({
    requestId: request.id,
    passed: true,
    notes: 'Complete attachments.',
  });
  check('requests.screen(passed) -> PREPARATION', screened.status === 'PREPARATION', screened.status);

  const document = await bundle.registry.documents.prepare({
    requestId: request.id,
    documentTypeId,
    title: 'Executive Order - barangay drainage',
  });
  const submitted = await bundle.registry.documents.submitForReview(document.id);
  check('documents.submitForReview -> UNDER_REVIEW', submitted.status === 'UNDER_REVIEW', submitted.status);

  await asActor('administrator');
  const reviewed = await bundle.registry.documents.review({
    documentId: document.id,
    decision: 'APPROVED',
    decisionNotes: 'Approved; released without a dispatch record.',
  });
  check(
    'documents.review(APPROVED) sets document + request to APPROVED',
    reviewed.status === 'APPROVED' &&
      (await bundle.registry.requests.getById(request.id))?.status === 'APPROVED',
    `document ${reviewed.status}`,
  );
  check(
    'NO transmission was recorded (Step 5 skipped)',
    (reviewed.transmissions ?? []).length === 0 &&
      Number(sql(`select count(*) from app.transmissions where document_id = '${document.id}'`)) === 0,
    '0 transmissions in the answer and 0 rows in Postgres',
  );

  console.log('== B. the archive desk sees the un-transmitted request ==');
  await asActor('clerk');
  const desk = await bundle.registry.requests.list({
    first: 100,
    filter: { statusIn: [...DESK_STATUSES] },
  });
  check(
    'requests(filter: { statusIn: [...] }) returns it (new desk query)',
    desk.edges.some((edge) => edge.node.id === request.id),
    `${desk.edges.length} row(s) on the desk`,
  );
  const transmittedOnly = await bundle.registry.requests.list({
    first: 100,
    filter: { status: 'TRANSMITTED' },
  });
  check(
    'requests(filter: { status: TRANSMITTED }) does NOT (old desk query)',
    !transmittedOnly.edges.some((edge) => edge.node.id === request.id),
    `${transmittedOnly.edges.length} row(s) under the old filter`,
  );

  console.log('== C. close + file it right away (no transmission, no signature) ==');
  const finalCopy = new File([Buffer.from('%PDF-1.4 signed final')], 'signed-final.pdf', {
    type: 'application/pdf',
  });
  const finalAttachment = await bundle.registry.attachments.uploadDocumentAttachment({
    documentId: document.id,
    kind: 'SIGNED_FINAL',
    file: finalCopy,
  });
  check('the signed final copy is attached (FR-29)', finalAttachment.id.length === 36, finalAttachment.kind);

  const folder = await bundle.registry.folders.create({ name: `SkipTransmission ${Date.now()}` });
  const closed = await bundle.registry.documents.close({
    requestId: request.id,
    finalAttachmentId: finalAttachment.id,
    folderId: folder.id,
    notes: 'Closed without a dispatch record.',
  });
  check(
    'documents.close succeeds on an APPROVED, never-transmitted request',
    closed.folderId === folder.id,
    `document filed into ${closed.folderId ?? 'nowhere'}`,
  );
  check(
    'the request is CLOSED (read back from the backend)',
    (await bundle.registry.requests.getById(request.id))?.status === 'CLOSED',
    sql(`select status from app.requests where id = '${request.id}'`),
  );
  const filed = await bundle.registry.documents.list({ first: 10, filter: { folderId: folder.id } });
  check(
    'the output document is filed in the folder',
    filed.edges.some((edge) => edge.node.id === document.id),
    `${filed.edges.length} document(s) in ${folder.path}`,
  );
  check(
    'the CLOSED audit entry was written',
    Number(
      sql(
        `select count(*) from app.document_logs where request_id = '${request.id}' and action_type = 'CLOSED'`,
      ),
    ) === 1,
    'exactly one CLOSED log row',
  );
  const deskAfter = await bundle.registry.requests.list({
    first: 100,
    filter: { statusIn: [...DESK_STATUSES] },
  });
  check(
    'it leaves the desk once closed',
    !deskAfter.edges.some((edge) => edge.node.id === request.id),
    `${deskAfter.edges.length} row(s) left`,
  );

  console.log('== D. a closed request refuses a second close ==');
  // D1. The client-side ABAC mirror refuses before the round trip (the policy
  // guard is "status !== CLOSED").
  let refused: unknown = null;
  try {
    await bundle.registry.documents.close({
      requestId: request.id,
      finalAttachmentId: finalAttachment.id,
      folderId: folder.id,
    });
  } catch (error) {
    refused = error;
  }
  const refusal = isAppError(refused) ? refused : null;
  check(
    'the client guard refuses with the read-only message (FR-31)',
    refusal?.code === 'FORBIDDEN' && refusal.message.includes('already closed'),
    refusal ? `${refusal.code}: ${refusal.message}` : String(refused),
  );

  // D2. The backend is the authority (NFR-07): the same mutation straight over
  // the wire, past the client guard, must be rejected too.
  const raw = (await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
    body: JSON.stringify({
      query:
        'mutation RawClose($input: CloseRequestInput!) { closeRequest(input: $input) { changedEntities } }',
      variables: {
        input: {
          requestId: request.id,
          finalAttachmentId: finalAttachment.id,
          folderId: folder.id,
        },
      },
    }),
  }).then((res) => res.json())) as {
    errors?: Array<{ message: string; extensions?: { code?: string } }>;
  };
  check(
    'the backend answers INVALID_STATE for the same call',
    raw.errors?.[0]?.extensions?.code === 'INVALID_STATE' &&
      (raw.errors[0]?.message ?? '').includes('already closed'),
    raw.errors?.[0]
      ? `${raw.errors[0].extensions?.code}: ${raw.errors[0].message}`
      : JSON.stringify(raw),
  );

  console.log('== E. cleanup ==');
  sql(
    [
      'begin;',
      `delete from app.notifications where request_id = '${request.id}' or document_id = '${document.id}';`,
      `delete from app.document_logs where request_id = '${request.id}' or document_id = '${document.id}';`,
      `delete from app.transmissions where document_id = '${document.id}';`,
      `delete from app.document_attachments where document_id = '${document.id}';`,
      `delete from app.documents where id = '${document.id}';`,
      `delete from app.request_attachments where request_id = '${request.id}';`,
      `delete from app.requests where id = '${request.id}';`,
      `delete from app.folders where id = '${folder.id}';`,
      'commit;',
    ].join(' '),
  );
  check(
    'the probe request, document and folder were removed again',
    Number(sql(`select count(*) from app.requests where id = '${request.id}'`)) === 0 &&
      Number(sql(`select count(*) from app.documents where id = '${document.id}'`)) === 0 &&
      Number(sql(`select count(*) from app.folders where id = '${folder.id}'`)) === 0,
    '0 rows left',
  );
  for (const [key, previous] of sequencesBefore) {
    const [code, year] = key.split('|');
    if ((sequences().get(key) ?? previous) > previous) {
      sql(
        `update app.control_number_sequences set last_value = ${previous} where seq_code = '${code}' and year = ${year}`,
      );
    }
  }
  check(
    'the control-number sequences are back where they started',
    [...sequences()].every(([key, value]) => value === (sequencesBefore.get(key) ?? value)),
    'no sequence advanced',
  );

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('verify-skip-transmission crashed:', error);
  process.exitCode = 1;
});
