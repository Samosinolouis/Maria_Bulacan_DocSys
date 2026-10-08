import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from '../app/node_modules/pg/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KC_HOST = process.env.KC_HOST || 'http://santamaria-docsys-idp.southeastasia.azurecontainer.io:8080';
const KC_ADMIN = process.env.KC_ADMIN || 'admin';
const KC_ADMIN_PW = process.env.KC_ADMIN_PW || 'SantaMariaAdmin2026!';
const REALM = 'docsys';
const DEV_PASSWORD = 'DocSys2026!';

const PG_HOST = process.env.PGHOST || 'santamaria-docsys-db.postgres.database.azure.com';
const PG_PORT = parseInt(process.env.PGPORT || '5432', 10);
const PG_USER = process.env.PGUSER || 'docsysadmin';
const PG_PASSWORD = process.env.PGPASSWORD || 'SantaMariaDocSys2026!';
const PG_DATABASE = process.env.PGDATABASE || 'postgres';

const DEV_USERS = [
  {
    username: 'administrator',
    email: 'administrator@docsys.local',
    firstName: 'Elmer',
    middleName: 'B.',
    lastName: 'Clemente',
    office: 'Office of the Municipal Administrator',
    position: 'Municipal Administrator',
    role: 'ADMINISTRATOR',
  },
  {
    username: 'clerk',
    email: 'clerk@docsys.local',
    firstName: 'Sherelyn',
    middleName: 'O.',
    lastName: 'Libao',
    office: 'Central Receiving Desk',
    position: 'Clerk / Encoder',
    role: 'CLERK_ENCODER',
  },
];

async function getAdminToken() {
  console.log(`[1] Fetching admin token from ${KC_HOST}...`);
  const res = await fetch(`${KC_HOST}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: KC_ADMIN,
      password: KC_ADMIN_PW,
    }),
  });

  if (!res.ok) {
    throw new Error(`Admin token failed (HTTP ${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function ensureRealm(token) {
  console.log(`[2] Checking if realm '${REALM}' exists in Keycloak...`);
  const check = await fetch(`${KC_HOST}/admin/realms/${REALM}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (check.ok) {
    console.log(`Realm '${REALM}' already exists.`);
    return;
  }

  console.log(`Realm '${REALM}' not found. Importing from infra/keycloak/docsys-realm.json...`);
  const realmFilePath = path.join(__dirname, '../infra/keycloak/docsys-realm.json');
  const realmData = JSON.parse(fs.readFileSync(realmFilePath, 'utf8'));

  // Ensure redirect URIs and web origins include Azure Static Web App
  for (const client of realmData.clients) {
    client.redirectUris = [
      'http://localhost:3000/*',
      'http://localhost:4000/*',
      'https://kind-field-0061c5600.4.azurestaticapps.net/*',
      'https://*.azurestaticapps.net/*',
    ];
    client.webOrigins = [
      'http://localhost:3000',
      'http://localhost:4000',
      'https://kind-field-0061c5600.4.azurestaticapps.net',
      'https://*.azurestaticapps.net',
      '+',
    ];
    if (client.attributes?.['post.logout.redirect.uris']) {
      client.attributes['post.logout.redirect.uris'] = 'http://localhost:3000/*##https://kind-field-0061c5600.4.azurestaticapps.net/*##https://*.azurestaticapps.net/*';
    }
  }

  const create = await fetch(`${KC_HOST}/admin/realms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(realmData),
  });

  if (!create.ok) {
    throw new Error(`Failed to create realm '${REALM}' (HTTP ${create.status}): ${await create.text()}`);
  }
  console.log(`Successfully created realm '${REALM}' with Azure redirect URIs.`);
}

async function ensureUser(token, user) {
  console.log(`[3] Checking user '${user.username}' in realm '${REALM}'...`);
  const search = await fetch(
    `${KC_HOST}/admin/realms/${REALM}/users?username=${encodeURIComponent(user.username)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const found = await search.json();
  if (Array.isArray(found) && found.length > 0) {
    console.log(`User '${user.username}' exists (ID: ${found[0].id}).`);
    return found[0].id;
  }

  console.log(`Creating user '${user.username}'...`);
  const create = await fetch(`${KC_HOST}/admin/realms/${REALM}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{ type: 'password', value: DEV_PASSWORD, temporary: false }],
    }),
  });

  if (create.status !== 201) {
    throw new Error(`Creating user '${user.username}' failed: HTTP ${create.status} ${await create.text()}`);
  }

  const location = create.headers.get('location') ?? '';
  const id = location.split('/').pop();
  console.log(`Created user '${user.username}' with ID: ${id}`);
  return id;
}

async function linkShadowAccounts(userMap) {
  console.log(`[4] Linking shadow accounts in Azure PostgreSQL (${PG_HOST})...`);
  const pool = new pg.Pool({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    for (const user of DEV_USERS) {
      const kcId = userMap[user.username];
      if (!kcId) continue;

      // Check if user exists by email or id
      const existing = await client.query('SELECT id FROM app.users WHERE id = $1 OR email = $2', [kcId, user.email]);
      const contactNo = '(044) 815-2882';
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO app.users (id, first_name, middle_name, last_name, contact_no, email, office, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [kcId, user.firstName, user.middleName, user.lastName, contactNo, user.email, user.office, user.position]
        );
        console.log(`Inserted shadow user '${user.username}' into app.users (${kcId}).`);
      } else {
        const oldId = existing.rows[0].id;
        if (oldId !== kcId) {
          await client.query('DELETE FROM app.user_roles WHERE user_id = $1', [oldId]);
          await client.query('DELETE FROM app.users WHERE id = $1', [oldId]);
          await client.query(
            `INSERT INTO app.users (id, first_name, middle_name, last_name, contact_no, email, office, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [kcId, user.firstName, user.middleName, user.lastName, contactNo, user.email, user.office, user.position]
          );
          console.log(`Re-created shadow user '${user.username}' with Keycloak ID (${kcId}).`);
        } else {
          console.log(`Shadow user '${user.username}' ID already matches Keycloak (${kcId}).`);
        }
      }

      // Link role
      const roleRes = await client.query('SELECT id FROM app.roles WHERE name = $1', [user.role]);
      if (roleRes.rows.length > 0) {
        const roleId = roleRes.rows[0].id;
        const link = await client.query('SELECT user_id FROM app.user_roles WHERE user_id = $1 AND role_id = $2', [kcId, roleId]);
        if (link.rows.length === 0) {
          await client.query('INSERT INTO app.user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $1)', [kcId, roleId]);
          console.log(`Linked user '${user.username}' to role '${user.role}'.`);
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function run() {
  try {
    const token = await getAdminToken();
    await ensureRealm(token);

    const userMap = {};
    for (const user of DEV_USERS) {
      const id = await ensureUser(token, user);
      userMap[user.username] = id;
    }

    await linkShadowAccounts(userMap);
    console.log('\n--- Keycloak on Azure setup completed successfully! ---');
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

run();
