import pg from '../app/node_modules/pg/lib/index.js';

const { Pool } = pg;

async function clearData() {
  const host = process.env.PGHOST || 'santamaria-docsys-db.postgres.database.azure.com';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const user = process.env.PGUSER || 'docsysadmin';
  const password = process.env.PGPASSWORD || 'SantaMariaDocSys2026!';
  const database = process.env.PGDATABASE || 'postgres';

  console.log(`Connecting to Azure PostgreSQL at ${host}:${port}/${database}...`);

  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('Connected to Azure PostgreSQL successfully.');

    console.log('Truncating transactional tables (documents, attachments, transmissions, event_bookings, audit_logs)...');
    await client.query(`
      TRUNCATE TABLE audit_logs CASCADE;
      TRUNCATE TABLE transmissions CASCADE;
      TRUNCATE TABLE attachments CASCADE;
      TRUNCATE TABLE documents CASCADE;
      TRUNCATE TABLE event_attendees CASCADE;
      TRUNCATE TABLE event_bookings CASCADE;
    `);

    const usersRes = await client.query('SELECT COUNT(*) FROM users');
    const venuesRes = await client.query('SELECT COUNT(*) FROM venues');
    const docsRes = await client.query('SELECT COUNT(*) FROM documents');
    const eventsRes = await client.query('SELECT COUNT(*) FROM event_bookings');
    const auditRes = await client.query('SELECT COUNT(*) FROM audit_logs');

    console.log('--- Azure PostgreSQL Clean Slate Verification ---');
    console.log(`Plantilla Users (Preserved): ${usersRes.rows[0].count}`);
    console.log(`Municipal Venues (Preserved): ${venuesRes.rows[0].count}`);
    console.log(`Documents: ${docsRes.rows[0].count} (Clean Slate)`);
    console.log(`Event Bookings: ${eventsRes.rows[0].count} (Clean Slate)`);
    console.log(`Audit Logs: ${auditRes.rows[0].count} (Clean Slate)`);

    client.release();
    await pool.end();
    console.log('Azure PostgreSQL data cleared successfully.');
  } catch (err) {
    console.error('Failed to clear database data:', err);
    process.exit(1);
  }
}

clearData();
