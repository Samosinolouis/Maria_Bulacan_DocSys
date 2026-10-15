/**
 * Live end-to-end proof for encodeRequest sanitation.
 *
 * Drives the REAL use case against the running stack (backend on :4000, Keycloak
 * on :8080, Postgres in `docsys-postgres`) with a clerk token, then reads the
 * row back out of Postgres to prove the cleaned text is what got stored - not
 * just what the client believed it sent.
 *
 * Proves:
 *  A. a title / requesting party / origin office carrying markup, zero-width
 *     marks and doubled spaces is stored cleaned, and the mutation's answer
 *     echoes the cleaned value;
 *  B. a title past varchar(500) is rejected with VALIDATION client-side, the
 *     request is NOT created, and the control-number sequence does not advance;
 *  C. the probe row is removed again (the dev slate is left as it was found).
 *
 * Run from `app/` with the stack up:
 *   ../backend/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/verify-encode-sanitize-live.mts
 */

import { execFileSync } from 'node:child_process';

import { createServices } from '@/services';
import type { AuthzSubject } from '@/services/contracts/authz';
import { isAppError } from '@/services/contracts/errors';

const KC = 'http://localhost:8080/realms/docsys';
const PASSWORD = 'DocSys2026!';
const ACTOR = 'clerk';

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
    'select seq_code || \'|\' || year || \'|\' || last_value from app.control_number_sequences order by seq_code, year',
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

/** Which sequences advanced, and by how much. */
function sequenceDelta(before: Map<string, number>, after: Map<string, number>): string {
  const moved: string[] = [];
  for (const [key, value] of after) {
    const previous = before.get(key) ?? 0;
    if (value !== previous) moved.push(`${key}: ${previous} -> ${value}`);
  }
  return moved.length === 0 ? 'none moved' : moved.join(', ');
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

async function main() {
  const currentToken = await token(ACTOR);
  const bundle = createServices({
    signIn: async () => {},
    signOut: async () => {},
    clearSession: async () => {},
    getSessionToken: async () =>
      currentToken ? { accessToken: currentToken, expiresAt: null } : null,
  });

  const snapshot = await bundle.session.loadSession(null);
  const subject: AuthzSubject = {
    userId: snapshot.user.id,
    roles: snapshot.user.roles.map((role) => role.name),
    permissions: snapshot.user.effectivePermissions,
    office: snapshot.user.office,
    position: snapshot.user.position,
  };
  bundle.authz.setSubject(subject);
  console.log(`== actor: ${snapshot.user.firstName} ${snapshot.user.lastName} (${subject.roles.join(', ')}) ==`);

  const requestTypeId = sql(
    "select id from app.request_types where is_active and code = 'LETTER' limit 1",
  );
  check('an active LETTER request type exists', requestTypeId.length === 36, requestTypeId);

  const sequencesBefore = sequences();
  const requestsBefore = Number(sql('select count(*) from app.requests'));

  console.log('== A. encode with a dirty payload ==');

  const dirtyTitle = '  <b>Sanitize</b> probe\u200B:  barangay   road concreting  ';
  const created = await bundle.registry.requests.encode({
    requestTypeId,
    title: dirtyTitle,
    requestingParty: 'Brgy.\u00A0San  Jose',
    originOffice: 'Office of the Punong\u200B Barangay',
    channel: 'WALK_IN',
    priority: 'NORMAL',
  });

  check(
    'the mutation answer echoes the cleaned title',
    created.title === 'Sanitize probe: barangay road concreting',
    JSON.stringify(created.title),
  );
  check(
    'a control number was issued',
    /^[A-Z]+-\d{4}-\d+$/.test(created.controlNo),
    created.controlNo,
  );

  const stored = sql(
    `select title || '|' || requesting_party || '|' || origin_office || '|' || length(title) from app.requests where id = '${created.id}'`,
  );
  const [storedTitle, storedParty, storedOffice, storedTitleLength] = stored.split('|');
  check(
    'Postgres stored the cleaned title, not the raw one',
    storedTitle === 'Sanitize probe: barangay road concreting',
    JSON.stringify(storedTitle),
  );
  check(
    'Postgres stored the cleaned requesting party and origin office',
    storedParty === 'Brgy. San Jose' && storedOffice === 'Office of the Punong Barangay',
    JSON.stringify({ storedParty, storedOffice }),
  );
  check(
    'no markup, zero-width mark or double space survived the round trip',
    !/[<>]|\u200B| {2}/.test(`${storedTitle}${storedParty}${storedOffice}`),
    `${storedTitleLength} characters stored`,
  );
  check(
    'the RECEIVED audit entry was written for the new request',
    Number(sql(`select count(*) from app.document_logs where request_id = '${created.id}'`)) === 1,
    'exactly one log row',
  );

  console.log('== B. a payload past the column limit is refused client-side ==');

  let rejected: unknown = null;
  try {
    await bundle.registry.requests.encode({
      requestTypeId,
      title: 'x'.repeat(501),
      requestingParty: 'Brgy. San Jose',
      originOffice: 'Office of the Punong Barangay',
      channel: 'WALK_IN',
      priority: 'NORMAL',
    });
  } catch (error) {
    rejected = error;
  }
  const appError = isAppError(rejected) ? rejected : null;
  check(
    'the 501-character title fails with VALIDATION and names the limit',
    appError?.code === 'VALIDATION' && appError.message.includes('501 characters, the limit is 500'),
    appError ? `${appError.code}: ${appError.message}` : String(rejected),
  );
  check(
    'the refused encode created no row',
    Number(sql('select count(*) from app.requests')) === requestsBefore + 1,
    `${requestsBefore} before, ${sql('select count(*) from app.requests')} after`,
  );
  const sequencesAfter = sequences();
  const advanced = [...sequencesAfter].filter(([key, value]) => value !== (sequencesBefore.get(key) ?? 0));
  check(
    'the refused encode did not advance a control-number sequence',
    advanced.length === 1 &&
      advanced[0][1] === (sequencesBefore.get(advanced[0][0]) ?? 0) + 1,
    `accepted encode only: ${sequenceDelta(sequencesBefore, sequencesAfter)}`,
  );

  console.log('== C. cleanup ==');

  sql(
    [
      'begin;',
      `delete from app.notifications where request_id = '${created.id}';`,
      `delete from app.document_logs where request_id = '${created.id}';`,
      `delete from app.request_attachments where request_id = '${created.id}';`,
      `delete from app.requests where id = '${created.id}';`,
      'commit;',
    ].join(' '),
  );
  const remaining = Number(sql(`select count(*) from app.requests where id = '${created.id}'`));
  check('the probe row was removed again', remaining === 0, `${remaining} row(s) left`);

  // Put the control-number sequence back where it started, so re-running this
  // probe never burns numbers on the dev slate.
  for (const [key, previous] of sequencesBefore) {
    const [code, year] = key.split('|');
    if ((sequencesAfter.get(key) ?? previous) > previous) {
      sql(
        `update app.control_number_sequences set last_value = ${previous} where seq_code = '${code}' and year = ${year}`,
      );
    }
  }
  check(
    'the control-number sequence is back where it started',
    sequenceDelta(sequencesBefore, sequences()) === 'none moved',
    sequenceDelta(sequencesBefore, sequences()),
  );

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('verify-encode-sanitize-live crashed:', error);
  process.exitCode = 1;
});
