/**
 * End-to-end verification of the shared-platform admin mutations.
 *
 * Proves, against the live stack (Keycloak + backend + Postgres):
 *   1. createRole     - a new role with a validated permission payload
 *   2. createUser     - a plantilla account provisioned in Keycloak and mirrored
 *   3. assignRole     - a grant recorded on the shadow user
 *   4. removeRole     - the grant revoked
 *   5. updateUserProfile (admin -> somebody else)   - allowed
 *   6. updateUserProfile (self, no UserService:Update grant) - allowed
 *   7. updateUserProfile (non-admin -> somebody else)        - FORBIDDEN
 *   8. deactivateUser / reactivateUser (FR-03, soft)
 *   9. deactivateUser on self                                - refused
 *  10. cleanup: the test account, its grants and the test role are removed
 *
 * Run: node scripts/verify-admin-mutations.mjs
 */

const KC = process.env.KEYCLOAK_URL ?? 'http://localhost:8080';
const REALM = 'docsys';
const GQL = process.env.GRAPHQL_URL ?? 'http://localhost:4000/graphql';
const APP_CLIENT = 'docsys-app';
const PASSWORD = 'DocSys2026!';
const ADMIN_USER = 'administrator';
const CLERK_USER = 'clerk';
const KC_ADMIN = process.env.KEYCLOAK_ADMIN ?? 'admin';
const KC_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'admin';

const TEST_EMAIL = 'verify.agent@docsys.local';
const TEST_ROLE = 'AGENT_VERIFY_ROLE';
const TEST_PASSWORD = 'AgentVerify2026!';

const results = [];
let failures = 0;

function check(name, ok, detail) {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ->  ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function token({ username, password, clientId = APP_CLIENT }) {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username,
    password,
  });
  const res = await fetch(`${KC}/realms/${REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`token for ${username} failed: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function masterToken() {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: KC_ADMIN,
    password: KC_ADMIN_PASSWORD,
  });
  const res = await fetch(`${KC}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`master token failed: HTTP ${res.status}`);
  return (await res.json()).access_token;
}

async function kcAdmin(path, init = {}) {
  const master = await masterToken();
  return fetch(`${KC}/admin/realms/${REALM}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${master}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function gql(accessToken, query, variables) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

const USER_FIELDS = `id firstName lastName email contactNo office position isActive roles { id name permissionPayload }`;
const ROLE_FIELDS = `id name description permissionPayload`;

async function main() {
  // ---- 0. tokens -----------------------------------------------------------
  const adminToken = await token({ username: ADMIN_USER, password: PASSWORD });
  check('administrator direct grant', true);

  let clerkToken = null;
  try {
    clerkToken = await token({ username: CLERK_USER, password: PASSWORD });
    check('clerk direct grant', true);
  } catch (error) {
    check('clerk direct grant', false, String(error.message).slice(0, 120));
  }

  // ---- 1. createRole ------------------------------------------------------
  const roleName = TEST_ROLE;
  let roleId = null;
  {
    const body = await gql(
      adminToken,
      `mutation CreateRole($input: CreateRoleInput!) { createRole(input: $input) { changedEntities role { ${ROLE_FIELDS} } } }`,
      {
        input: {
          name: roleName,
          description: 'Temporary role created by the admin-mutation verification script.',
          permissionPayload: ['RequestService:Read', 'DocumentService:Read'],
        },
      },
    );
    const role = body?.data?.createRole?.role;
    roleId = role?.id ?? null;
    check(
      'createRole returns the role with its grants',
      Boolean(roleId) && role.permissionPayload.length === 2,
      role ? `${role.name} (${role.permissionPayload.join(', ')})` : JSON.stringify(body.errors ?? body).slice(0, 200),
    );
    check(
      'createRole reports changedEntities',
      Array.isArray(body?.data?.createRole?.changedEntities) &&
        body.data.createRole.changedEntities.some((e) => e.startsWith('Role_')),
      JSON.stringify(body?.data?.createRole?.changedEntities),
    );
  }

  // invalid permission payload must be rejected (NFR-21)
  {
    const body = await gql(
      adminToken,
      `mutation CreateRole($input: CreateRoleInput!) { createRole(input: $input) { role { id } } }`,
      { input: { name: 'AGENT_BAD_ROLE', description: 'x', permissionPayload: ['not-a-permission'] } },
    );
    const message = body?.errors?.[0]?.message ?? '';
    check('createRole rejects an invalid permission string', /Invalid permission/i.test(message), message.slice(0, 140));
  }

  // ---- 2. createUser ------------------------------------------------------
  let createdUserId = null;
  {
    const body = await gql(
      adminToken,
      `mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { changedEntities user { ${USER_FIELDS} } } }`,
      {
        input: {
          firstName: 'Verification',
          middleName: 'Agent',
          lastName: 'Account',
          email: TEST_EMAIL,
          contactNo: '0917 000 0000',
          office: 'Office of the Municipal Administrator',
          position: 'Verification Officer',
          roleIds: roleId ? [roleId] : [],
          temporaryPassword: TEST_PASSWORD,
        },
      },
    );
    const user = body?.data?.createUser?.user;
    createdUserId = user?.id ?? null;
    check(
      'createUser mirrors the account with its initial role',
      Boolean(createdUserId) && user.roles.some((r) => r.name === roleName),
      user ? `${user.email} id=${user.id} roles=[${user.roles.map((r) => r.name).join(',')}]` : JSON.stringify(body.errors ?? body).slice(0, 300),
    );
  }

  // duplicate email must conflict
  {
    const body = await gql(
      adminToken,
      `mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { user { id } } }`,
      {
        input: {
          firstName: 'Duplicate',
          lastName: 'Account',
          email: TEST_EMAIL,
          contactNo: 'x',
          office: 'x',
          position: 'x',
        },
      },
    );
    const message = body?.errors?.[0]?.message ?? '';
    check('createUser refuses a duplicate email', /already exists/i.test(message), message.slice(0, 140));
  }

  // the Keycloak account really exists (not just the shadow row)
  {
    let rows = [];
    let byId = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await kcAdmin(`/users?email=${encodeURIComponent(TEST_EMAIL)}&exact=true`);
      rows = res.ok ? await res.json() : [];
      if (rows.length > 0) break;
      await new Promise((r) => setTimeout(r, 700));
    }
    const idRes = await kcAdmin(`/users/${createdUserId}`);
    byId = idRes.ok ? await idRes.json() : null;
    check(
      'the account exists in Keycloak (identity provider)',
      Boolean(byId) && byId.id === createdUserId,
      `lookup by id: email=${byId?.email ?? '-'} enabled=${byId?.enabled ?? '-'} (email search matched ${rows.length})`,
    );
  }

  // ---- 3/4. assignRole / removeRole ---------------------------------------
  let secondRoleId = null;
  {
    const body = await gql(
      adminToken,
      `query Roles { roles(first: 50) { edges { node { ${ROLE_FIELDS} } } } }`,
      {},
    );
    const nodes = body?.data?.roles?.edges?.map((e) => e.node) ?? [];
    secondRoleId = nodes.find((r) => r.name === 'CLERK_ENCODER')?.id ?? null;
    check('roles query lists the seeded definitions', nodes.length >= 2, nodes.map((r) => r.name).join(', '));
  }

  if (createdUserId && secondRoleId) {
    const assigned = await gql(
      adminToken,
      `mutation AssignRole($input: AssignRoleInput!) { assignRole(input: $input) { changedEntities user { ${USER_FIELDS} } } }`,
      { input: { userId: createdUserId, roleId: secondRoleId } },
    );
    const user = assigned?.data?.assignRole?.user;
    check(
      'assignRole grants the role to the account',
      user?.roles?.some((r) => r.name === 'CLERK_ENCODER') ?? false,
      user ? user.roles.map((r) => r.name).join(',') : JSON.stringify(assigned.errors ?? assigned).slice(0, 200),
    );

    const removed = await gql(
      adminToken,
      `mutation RemoveRole($input: RemoveRoleInput!) { removeRole(input: $input) { changedEntities user { ${USER_FIELDS} } } }`,
      { input: { userId: createdUserId, roleId: secondRoleId } },
    );
    const after = removed?.data?.removeRole?.user;
    check(
      'removeRole revokes the role',
      after ? !after.roles.some((r) => r.name === 'CLERK_ENCODER') : false,
      after ? after.roles.map((r) => r.name).join(',') : JSON.stringify(removed.errors ?? removed).slice(0, 200),
    );
  }

  // ---- 5. admin updates somebody else's profile ---------------------------
  if (createdUserId) {
    const body = await gql(
      adminToken,
      `mutation UpdateUserProfile($id: ID!, $input: UpdateUserProfileInput!) { updateUserProfile(id: $id, input: $input) { changedEntities user { ${USER_FIELDS} } } }`,
      { id: createdUserId, input: { position: 'Senior Verification Officer' } },
    );
    const user = body?.data?.updateUserProfile?.user;
    check(
      'admin updates another account (UserService:Update)',
      user?.position === 'Senior Verification Officer',
      user ? user.position : JSON.stringify(body.errors ?? body).slice(0, 200),
    );
  }

  // ---- 6/7. self-service vs non-admin -------------------------------------
  let clerkOriginalContactNo = null;
  let clerkIdForRestore = null;
  if (clerkToken) {
    const me = await gql(clerkToken, `query Me { me { id email office contactNo } }`, {});
    const clerkId = me?.data?.me?.id ?? null;
    clerkIdForRestore = clerkId;
    clerkOriginalContactNo = me?.data?.me?.contactNo ?? null;
    const adminMe = await gql(adminToken, `query Me { me { id } }`, {});
    const adminId = adminMe?.data?.me?.id ?? null;

    const selfValue = '0917 555 0000';
    const self = await gql(
      clerkToken,
      `mutation UpdateUserProfile($id: ID!, $input: UpdateUserProfileInput!) { updateUserProfile(id: $id, input: $input) { user { ${USER_FIELDS} } } }`,
      { id: clerkId, input: { contactNo: selfValue } },
    );
    const selfContactNo = self?.data?.updateUserProfile?.user?.contactNo ?? null;
    check(
      'a holder updates its OWN account without UserService:Update',
      selfContactNo === selfValue && clerkOriginalContactNo !== selfValue,
      `contactNo='${selfContactNo}' (was '${clerkOriginalContactNo}')`,
    );

    const other = await gql(
      clerkToken,
      `mutation UpdateUserProfile($id: ID!, $input: UpdateUserProfileInput!) { updateUserProfile(id: $id, input: $input) { user { id } } }`,
      { id: adminId, input: { position: 'Tampered' } },
    );
    const message = other?.errors?.[0]?.message ?? '';
    check(
      'a non-admin CANNOT update somebody else',
      /permission/i.test(message),
      message.slice(0, 160),
    );

    const selfDisable = await gql(
      clerkToken,
      `mutation DeactivateUser($id: ID!) { deactivateUser(id: $id) { user { id isActive } } }`,
      { id: clerkId },
    );
    const disableMessage = selfDisable?.errors?.[0]?.message ?? '';
    check(
      'a holder cannot disable its own account',
      /cannot deactivate your own account/i.test(disableMessage),
      disableMessage.slice(0, 160),
    );
  } else {
    check('self-service checks (needs a clerk token)', false, 'skipped: no clerk token');
  }

  // ---- 8. deactivate / reactivate -----------------------------------------
  if (createdUserId) {
    const off = await gql(
      adminToken,
      `mutation DeactivateUser($id: ID!) { deactivateUser(id: $id) { changedEntities user { ${USER_FIELDS} } } }`,
      { id: createdUserId },
    );
    const disabled = off?.data?.deactivateUser?.user;
    check('deactivateUser soft-disables the account (FR-03)', disabled?.isActive === false, String(disabled?.isActive));

    const kcUser = await kcAdmin(`/users/${createdUserId}`);
    const kcBody = kcUser.ok ? await kcUser.json() : null;
    check('the Keycloak account is disabled too', kcBody?.enabled === false, `enabled=${kcBody?.enabled}`);

    const on = await gql(
      adminToken,
      `mutation ReactivateUser($id: ID!) { reactivateUser(id: $id) { user { ${USER_FIELDS} } } }`,
      { id: createdUserId },
    );
    check('reactivateUser restores the account', on?.data?.reactivateUser?.user?.isActive === true, String(on?.data?.reactivateUser?.user?.isActive));
  }

  // ---- 10. cleanup --------------------------------------------------------
  if (createdUserId) {
    const del = await kcAdmin(`/users/${createdUserId}`, { method: 'DELETE' });
    check('cleanup: Keycloak test account removed', del.ok || del.status === 404, `HTTP ${del.status}`);
  }
  // Accounts are never deleted through the API (FR-03), so the dev-only rows
  // this script created are dropped straight from Postgres.
  {
    const sql = [
      createdUserId ? `delete from app.user_roles where user_id = '${createdUserId}';` : '',
      createdUserId ? `delete from app.users where id = '${createdUserId}';` : '',
      roleId ? `delete from app.user_roles where role_id = '${roleId}';` : '',
      roleId ? `delete from app.roles where id = '${roleId}';` : '',
    ]
      .filter(Boolean)
      .join(' ');
    try {
      const { execSync } = await import('node:child_process');
      execSync(
        `docker exec docsys-postgres psql -U docsys -d docsys -c "${sql.replace(/\s+/g, ' ').trim()}"`,
        { stdio: 'pipe' },
      );
      check('cleanup: shadow row, grants and test role dropped from Postgres', true);
    } catch (error) {
      check('cleanup: shadow row, grants and test role dropped from Postgres', false, String(error.message).slice(0, 160));
    }
  }

  // Restore the clerk's own record (the self-service check writes a real field).
  if (clerkToken && clerkIdForRestore && clerkOriginalContactNo !== null) {
    const restored = await gql(
      clerkToken,
      `mutation UpdateUserProfile($id: ID!, $input: UpdateUserProfileInput!) { updateUserProfile(id: $id, input: $input) { user { id contactNo } } }`,
      { id: clerkIdForRestore, input: { contactNo: clerkOriginalContactNo } },
    );
    check(
      'cleanup: the clerk record is restored',
      restored?.data?.updateUserProfile?.user?.contactNo === clerkOriginalContactNo,
      `contactNo='${restored?.data?.updateUserProfile?.user?.contactNo}'`,
    );
  }

  console.log('\n' + results.join('\n'));
  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('verification aborted:', error);
  process.exit(2);
});
