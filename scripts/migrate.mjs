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

    const schemaPath = path.join(__dirname, '../backend/db/schema.sql');
    const seedPath = path.join(__dirname, '../backend/db/seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing database schema DDL...');
    await client.query(schemaSql);
    console.log('Database schema created successfully.');

    console.log('Populating clean municipal seed data...');
    await client.query(seedSql);
    console.log('Seed data inserted successfully.');

    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const docCount = await client.query('SELECT COUNT(*) FROM documents');
    const venueCount = await client.query('SELECT COUNT(*) FROM venues');
    const eventCount = await client.query('SELECT COUNT(*) FROM event_bookings');
    const auditCount = await client.query('SELECT COUNT(*) FROM audit_logs');

    console.log('--- Migration Verification ---');
    console.log(`Users: ${userCount.rows[0].count}`);
    console.log(`Documents: ${docCount.rows[0].count}`);
    console.log(`Venues: ${venueCount.rows[0].count}`);
    console.log(`Event Bookings: ${eventCount.rows[0].count}`);
    console.log(`Audit Logs: ${auditCount.rows[0].count}`);

    client.release();
    await pool.end();
    console.log('Migration and seeding completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
