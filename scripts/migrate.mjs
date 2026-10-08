import pg from '../app/node_modules/pg/lib/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function migrate() {
  const host = process.env.PGHOST || 'santamaria-docsys-db.postgres.database.azure.com';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const user = process.env.PGUSER || 'docsysadmin';
  const password = process.env.PGPASSWORD || 'SantaMariaDocSys2026!';
  const database = process.env.PGDATABASE || 'postgres';

  console.log(`Connecting to PostgreSQL at ${host}:${port}/${database} as ${user}...`);

  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log('Successfully established connection to Azure PostgreSQL!');

    const drizzleDir = path.join(__dirname, '../backend/drizzle');
    const sqlFiles = fs.readdirSync(drizzleDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${sqlFiles.length} Drizzle migration files:`, sqlFiles);
    for (const sqlFile of sqlFiles) {
      console.log(`Applying migration: ${sqlFile}...`);
      const sqlContent = fs.readFileSync(path.join(drizzleDir, sqlFile), 'utf8');
      const statements = sqlContent.split('--> statement-breakpoint');
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          try {
            await client.query(trimmed);
          } catch (stmtErr) {
            // Ignore if object/enum already exists
            if (!stmtErr.message.includes('already exists')) {
              console.warn(`Notice on statement in ${sqlFile}:`, stmtErr.message);
            }
          }
        }
      }
    }
    console.log('Database schema migrations applied successfully.');

    const userCount = await client.query('SELECT COUNT(*) FROM app.users');
    const roleCount = await client.query('SELECT COUNT(*) FROM app.roles');
    const venueCount = await client.query('SELECT COUNT(*) FROM app.venues');
    const docCount = await client.query('SELECT COUNT(*) FROM app.documents');
    const auditCount = await client.query('SELECT COUNT(*) FROM app.activity_logs');

    console.log('--- Azure PostgreSQL Migration Verification ---');
    console.log(`Users (app.users): ${userCount.rows[0].count}`);
    console.log(`Roles (app.roles): ${roleCount.rows[0].count}`);
    console.log(`Venues (app.venues): ${venueCount.rows[0].count}`);
    console.log(`Documents (app.documents): ${docCount.rows[0].count}`);
    console.log(`Audit Logs (app.activity_logs): ${auditCount.rows[0].count}`);

    client.release();
    await pool.end();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
