/**
 * Dev Seed - Keycloak demo users + application roles
 *
 * Creates the two local plantilla accounts in Keycloak (realm `docsys`) and
 * the matching app roles with permission payloads, then links the shadow
 * users so the wired frontend works end-to-end on a fresh database.
 *
 * Usage:  npm run db:seed
 * Idempotent: existing users/roles/links are left untouched.
 *
 * Accounts (dev only):
 *   administrator / DocSys2026!   -> role ADMINISTRATOR  (*:*)
 *   clerk         / DocSys2026!   -> role CLERK_ENCODER  (workflow grants)
 */

import "dotenv/config";
import postgres from "postgres";

const KC_URL =
  process.env.KEYCLOAK_REALM_URL?.replace(/\/realms\/.*$/, "") ?? "http://localhost:8080";
const KC_ADMIN = process.env.KEYCLOAK_ADMIN ?? "admin";
const KC_ADMIN_PW = process.env.KEYCLOAK_ADMIN_PASSWORD ?? "admin";
const REALM = "docsys";
const DEV_PASSWORD = "DocSys2026!";

interface DevUser {
  username: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  office: string;
  position: string;
  role: string;
}

const DEV_USERS: DevUser[] = [
  {
    username: "administrator",
    email: "administrator@docsys.local",
    firstName: "Elmer",
    middleName: "B.",
    lastName: "Clemente",
    office: "Office of the Municipal Administrator",
    position: "Municipal Administrator",
    role: "ADMINISTRATOR",
  },
  {
    username: "clerk",
    email: "clerk@docsys.local",
    firstName: "Sherelyn",
    middleName: "O.",
    lastName: "Libao",
    office: "Central Receiving Desk",
    position: "Clerk / Encoder",
    role: "CLERK_ENCODER",
  },
];

const ROLES = [
  {
    name: "ADMINISTRATOR",
    description: "Full control: user management, approvals, reports, archive.",
    payload: ["*:*"],
  },
  {
    name: "CLERK_ENCODER",
    description: "Intake, screening, preparation, transmission, archiving.",
    payload: [
      "RequestService:Read",
      "RequestService:Encode",
      "RequestService:Screen",
      "DocumentService:Read",
      "DocumentService:Prepare",
      "DocumentService:CreateStandalone",
      "DocumentService:Transmit",
      "DocumentService:Close",
      "AttachmentService:Upload",
      "AttachmentService:Download",
      "AttachmentService:Read",
      "FolderService:*",
      "NotificationService:*",
      "ReportService:Read",
      "EventService:Read",
      "VenueService:Read",
      "UserService:Read",
      "RoleService:Read",
    ],
  },
];

/**
 * The six municipal venues the booking module schedules into. `specialUse`
 * venues are the ones that additionally require EventService:BookSpecialVenue.
 */
const VENUES = [
  { code: "CONFERENCE_ROOM", name: "Municipal Conference Room", specialUse: false },
  { code: "COMMAND_CENTER", name: "Command Center Room", specialUse: false },
  { code: "SOCIAL_HALL", name: "Municipal Social Hall", specialUse: false },
  { code: "GYMNASIUM", name: "Municipal Gymnasium", specialUse: false },
  { code: "MAYOR_OFFICE", name: "Mayor's Conference Room", specialUse: true },
  { code: "ADMIN_OFFICE", name: "Administrator's Office", specialUse: true },
];

async function kcAdminToken(): Promise<string> {
  const res = await fetch(`${KC_URL}/realms/master/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: "admin-cli",
      username: KC_ADMIN,
      password: KC_ADMIN_PW,
    }),
  });
  if (!res.ok) {
    throw new Error(`Keycloak admin login failed (HTTP ${res.status}). Is Keycloak running?`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function ensureKcUser(token: string, user: DevUser): Promise<string> {
  const search = await fetch(
    `${KC_URL}/admin/realms/${REALM}/users?username=${encodeURIComponent(user.username)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const found = (await search.json()) as Array<{ id: string }>;
  if (Array.isArray(found) && found.length > 0) {
    console.log(`keycloak user '${user.username}' exists (${found[0].id})`);
    return found[0].id;
  }

  const create = await fetch(`${KC_URL}/admin/realms/${REALM}/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{ type: "password", value: DEV_PASSWORD, temporary: false }],
    }),
  });
  if (create.status !== 201) {
    throw new Error(`Creating '${user.username}' failed: HTTP ${create.status} ${await create.text()}`);
  }
  const location = create.headers.get("location") ?? "";
  const id = location.split("/").pop();
  if (!id) throw new Error(`No user id returned for '${user.username}'.`);
  console.log(`keycloak user '${user.username}' created (${id})`);
  return id;
}

async function main(): Promise<void> {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const token = await kcAdminToken();

  try {
    // 1. App roles with their permission payloads.
    for (const role of ROLES) {
      const existing = await sql`select id from app.roles where name = ${role.name}`;
      if (existing.length === 0) {
        await sql`insert into app.roles (name, description, permission_payload)
                  values (${role.name}, ${role.description}, ${sql.json(role.payload)})`;
        console.log(`app role '${role.name}' created`);
      } else {
        console.log(`app role '${role.name}' exists`);
      }
    }

    // 2. Keycloak users + shadow records + role links.
    for (const user of DEV_USERS) {
      const sub = await ensureKcUser(token, user);

      const existingUser = await sql`select id from app.users where id = ${sub}`;
      if (existingUser.length === 0) {
        await sql`insert into app.users
                  (id, first_name, middle_name, last_name, email, contact_no, office, position)
                  values (${sub}, ${user.firstName}, ${user.middleName}, ${user.lastName},
                          ${user.email}, '', ${user.office}, ${user.position})`;
        console.log(`shadow user '${user.username}' created`);
      } else {
        console.log(`shadow user '${user.username}' exists`);
      }

      const [roleRow] = await sql`select id from app.roles where name = ${user.role}`;
      const link = await sql`select id from app.user_roles
                             where user_id = ${sub} and role_id = ${roleRow.id}`;
      if (link.length === 0) {
        await sql`insert into app.user_roles (user_id, role_id, assigned_by)
                  values (${sub}, ${roleRow.id}, ${sub})`;
        console.log(`role '${user.role}' assigned to '${user.username}'`);
      } else {
        console.log(`role '${user.role}' already assigned to '${user.username}'`);
      }
    }

    // 3. Municipal venues (the booking module needs at least one to schedule).
    for (const venue of VENUES) {
      const existing = await sql`select id from app.venues where code = ${venue.code}`;
      if (existing.length === 0) {
        await sql`insert into app.venues (code, name, special_use)
                  values (${venue.code}, ${venue.name}, ${venue.specialUse})`;
        console.log(`venue '${venue.code}' created`);
      } else {
        console.log(`venue '${venue.code}' exists`);
      }
    }

    console.log("\nDev seed complete.");
    console.log(`  administrator / ${DEV_PASSWORD}`);
    console.log(`  clerk         / ${DEV_PASSWORD}`);
  } finally {
    await sql.end({ timeout: 2 });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Dev seed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
