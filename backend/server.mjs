/**
 * MUNICIPALITY OF SANTA MARIA, BULACAN
 * Office of the Municipal Administrator - Document Tracking System (DocSys)
 * Backend REST API Service with Azure PostgreSQL Flexible Server Connection
 * 
 * Compliant with RA 11032, RA 10173, DICT GWTS v25.3.3
 */

import http from 'http';
import pg from '../app/node_modules/pg/lib/index.js';

const { Pool } = pg;

const PORT = process.env.PORT || 4000;
const host = process.env.PGHOST || 'santamaria-docsys-db.postgres.database.azure.com';
const port = parseInt(process.env.PGPORT || '5432', 10);
const user = process.env.PGUSER || 'docsysadmin';
const password = process.env.PGPASSWORD || 'SantaMariaDocSys2026!';
const database = process.env.PGDATABASE || 'postgres';

const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

// Helper for JSON responses with standard CORS headers
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  });
  res.end(JSON.stringify(data));
}

// Request body parser
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    });
    return res.end();
  }

  try {
    // Health Check
    if (pathname === '/api/health' && method === 'GET') {
      const dbCheck = await pool.query('SELECT NOW() as current_time, COUNT(*) as doc_count FROM documents');
      return sendJson(res, 200, {
        status: 'UP',
        service: 'Santa Maria DocSys API',
        environment: 'Azure for Students (Burstable B1ms)',
        database: {
          connected: true,
          server: host,
          timestamp: dbCheck.rows[0].current_time,
          total_documents: parseInt(dbCheck.rows[0].doc_count, 10),
        },
      });
    }

    // GET /api/users
    if (pathname === '/api/users' && method === 'GET') {
      const result = await pool.query(`
        SELECT id, full_name as "fullName", role, title, department, email
        FROM users
        WHERE is_active = true
        ORDER BY id ASC
      `);
      return sendJson(res, 200, result.rows);
    }

    // GET /api/documents
    if (pathname === '/api/documents' && method === 'GET') {
      const result = await pool.query(`
        SELECT 
          d.id,
          d.control_number as "controlNumber",
          d.type,
          d.category,
          d.title,
          d.requesting_party as "requestingParty",
          d.origin_office as "originOffice",
          d.date_received as "dateReceived",
          u.full_name as "assignedTo",
          d.status,
          d.priority,
          d.sla_deadline as "slaDeadline",
          d.is_overdue as "isOverdue",
          d.denial_reason as "denialReason",
          d.endorsement_notes as "endorsementNotes",
          d.created_at as "createdAt",
          d.updated_at as "updatedAt",
          t.transmitted_date as "transmittedDate",
          t.transmitted_to_office as "transmittedToOffice",
          t.recipient_name as "recipientName",
          t.received_by as "receivedBy",
          t.proof_document_url as "proofDocumentUrl",
          t.notes as "transmissionNotes"
        FROM documents d
        LEFT JOIN users u ON d.assigned_to_user_id = u.id
        LEFT JOIN transmissions t ON d.id = t.document_id
        ORDER BY d.date_received DESC
      `);
      return sendJson(res, 200, result.rows);
    }

    // POST /api/documents
    if (pathname === '/api/documents' && method === 'POST') {
      const body = await parseBody(req);
      const queryText = `
        INSERT INTO documents (
          id, control_number, type, category, title, requesting_party, origin_office,
          date_received, status, priority, sla_deadline, is_overdue, created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, control_number as "controlNumber"
      `;
      const values = [
        body.id || `doc-${Date.now()}`,
        body.controlNumber,
        body.type || 'TRAVEL_ORDER',
        body.category || 'ADMINISTRATIVE',
        body.title,
        body.requestingParty,
        body.originOffice,
        body.dateReceived || new Date(),
        body.status || 'FOR_REVIEW',
        body.priority || 'REGULAR',
        body.slaDeadline || new Date(Date.now() + 3 * 86400000),
        body.isOverdue || false,
        body.userId || 'usr-clerk-05',
      ];
      const inserted = await pool.query(queryText, values);

      // Audit Log
      await pool.query(`
        INSERT INTO audit_logs (id, document_id, action, performed_by_user_id, notes)
        VALUES ($1, $2, 'INTAKE', $3, $4)
      `, [`aud-${Date.now()}`, inserted.rows[0].id, values[12], `Document intaked with Control No. ${body.controlNumber}`]);

      return sendJson(res, 201, inserted.rows[0]);
    }

    // PATCH /api/documents/:id/status
    if (pathname.startsWith('/api/documents/') && pathname.endsWith('/status') && method === 'PATCH') {
      const parts = pathname.split('/');
      const docId = parts[3];
      const body = await parseBody(req);
      const { status, note, userId } = body;

      const result = await pool.query(`
        UPDATE documents
        SET status = $1,
            updated_at = NOW(),
            denial_reason = CASE WHEN $1 = 'DENIED' THEN $2 ELSE denial_reason END,
            endorsement_notes = CASE WHEN $1 = 'ENDORSED' THEN $2 ELSE endorsement_notes END
        WHERE id = $3
        RETURNING id, status
      `, [status, note || null, docId]);

      if (result.rows.length === 0) {
        return sendJson(res, 404, { error: 'Document not found' });
      }

      // Record audit
      await pool.query(`
        INSERT INTO audit_logs (id, document_id, action, performed_by_user_id, notes)
        VALUES ($1, $2, $3, $4, $5)
      `, [`aud-${Date.now()}`, docId, status, userId || 'usr-admin-01', note || `Status updated to ${status}`]);

      return sendJson(res, 200, result.rows[0]);
    }

    // POST /api/transmissions
    if (pathname === '/api/transmissions' && method === 'POST') {
      const body = await parseBody(req);
      const {
        documentId,
        transmittedToOffice,
        recipientName,
        receivedBy,
        proofDocumentUrl,
        notes,
        userId,
      } = body;

      const result = await pool.query(`
        INSERT INTO transmissions (
          id, document_id, transmitted_date, transmitted_to_office,
          recipient_name, received_by, proof_document_url, notes
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        `trans-${Date.now()}`,
        documentId,
        transmittedToOffice,
        recipientName,
        receivedBy,
        proofDocumentUrl || null,
        notes || null,
      ]);

      await pool.query(`
        UPDATE documents SET status = 'RELEASED', updated_at = NOW() WHERE id = $1
      `, [documentId]);

      await pool.query(`
        INSERT INTO audit_logs (id, document_id, action, performed_by_user_id, notes)
        VALUES ($1, $2, 'TRANSMIT', $3, $4)
      `, [`aud-${Date.now()}`, documentId, userId || 'usr-sro-04', `Physical document transmitted to ${transmittedToOffice}`]);

      return sendJson(res, 201, result.rows[0]);
    }

    // GET /api/events
    if (pathname === '/api/events' && method === 'GET') {
      const result = await pool.query(`
        SELECT 
          id, venue_id as venue, title, organizer, department,
          booking_date as date, start_time as "startTime", end_time as "endTime",
          involves_mayor as "involvesMayor", involves_admin as "involvesAdmin",
          status, notes
        FROM event_bookings
        ORDER BY booking_date ASC, start_time ASC
      `);
      return sendJson(res, 200, result.rows);
    }

    // POST /api/events
    if (pathname === '/api/events' && method === 'POST') {
      const body = await parseBody(req);
      const result = await pool.query(`
        INSERT INTO event_bookings (
          id, venue_id, title, organizer, department, booking_date, start_time, end_time,
          involves_mayor, involves_admin, status, notes, created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        body.id || `evt-${Date.now()}`,
        body.venue,
        body.title,
        body.organizer,
        body.department,
        body.date,
        body.startTime,
        body.endTime,
        Boolean(body.involvesMayor),
        Boolean(body.involvesAdmin),
        body.status || 'CONFIRMED',
        body.notes || null,
        body.userId || 'usr-admin-01',
      ]);
      return sendJson(res, 201, result.rows[0]);
    }

    // GET /api/venues
    if (pathname === '/api/venues' && method === 'GET') {
      const result = await pool.query(`
        SELECT id, name, capacity, location, is_available as "isAvailable"
        FROM venues
        ORDER BY name ASC
      `);
      return sendJson(res, 200, result.rows);
    }

    // GET /api/audit-logs
    if (pathname === '/api/audit-logs' && method === 'GET') {
      const result = await pool.query(`
        SELECT 
          a.id, a.action, a.timestamp, a.notes,
          u.full_name as "performedBy",
          d.control_number as "documentControlNumber"
        FROM audit_logs a
        LEFT JOIN users u ON a.performed_by_user_id = u.id
        LEFT JOIN documents d ON a.document_id = d.id
        ORDER BY a.timestamp DESC
        LIMIT 50
      `);
      return sendJson(res, 200, result.rows);
    }

    // Default 404
    sendJson(res, 404, { error: 'Route not found' });
  } catch (error) {
    console.error('[API Error]:', error);
    sendJson(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`Santa Maria DocSys Backend API running on port ${PORT}`);
  console.log(`Connected to Azure PostgreSQL Flexible Server: ${host}`);
});
