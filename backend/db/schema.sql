-- =============================================================================
-- MUNICIPALITY OF SANTA MARIA, BULACAN
-- OFFICE OF THE MUNICIPAL ADMINISTRATOR
-- DOCSYS v2.6 - POSTGRESQL RELATIONAL DATABASE SCHEMA
-- Statutory Mandate: RA 11032, RA 10173, RA 8491, DICT GWTS v25.3.3
-- =============================================================================

-- Extension uuid-ossp not required; PostgreSQL provides built-in gen_random_uuid()

-- Table 1: users (Civil Service Personnel & Plantilla Officers)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'pbkdf2$santa_maria_default',
    role VARCHAR(32) NOT NULL CHECK (role IN (
        'MAYOR',
        'MUNICIPAL_ADMIN',
        'ADMIN_OFFICER_V',
        'SENIOR_RECORDS_OFFICER',
        'INTAKE_CLERK'
    )),
    department VARCHAR(64) NOT NULL,
    title VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Table 2: documents (Municipal Docket Registry)
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    control_number VARCHAR(32) NOT NULL UNIQUE,
    type VARCHAR(32) NOT NULL CHECK (type IN (
        'TRAVEL_ORDER',
        'EXECUTIVE_ORDER',
        'INDORSEMENT',
        'VENUE_REQUEST',
        'OVERTIME_AUTHORITY',
        'LEGAL_OPINION',
        'MEMORANDUM',
        'CITIZEN_REQUEST'
    )),
    category VARCHAR(32) NOT NULL CHECK (category IN (
        'ADMINISTRATIVE',
        'LEGISLATIVE',
        'EXECUTIVE',
        'LEGAL',
        'FINANCIAL',
        'PERSONNEL',
        'PUBLIC_AFFAIRS'
    )),
    title VARCHAR(255) NOT NULL,
    requesting_party VARCHAR(128) NOT NULL,
    origin_office VARCHAR(128) NOT NULL,
    date_received TIMESTAMPTZ NOT NULL,
    assigned_to_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN (
        'RECEIVED',
        'SCREENING',
        'PREPARATION',
        'REVIEW',
        'APPROVED',
        'ENDORSED',
        'DENIED',
        'TRANSMITTED',
        'CLOSED'
    )),
    priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN (
        'NORMAL',
        'HIGH',
        'URGENT'
    )),
    sla_deadline TIMESTAMPTZ NOT NULL,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    denial_reason TEXT,
    endorsement_notes TEXT,
    created_by_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_control_num ON documents(control_number);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_sla ON documents(sla_deadline, is_overdue);
CREATE INDEX IF NOT EXISTS idx_documents_date_received ON documents(date_received DESC);

-- Table 3: attachments (Document Scans & Annexes)
CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    uploaded_by_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_doc_id ON attachments(document_id);

-- Table 4: transmissions (Outgoing Dispatch & Delivery Ledger)
CREATE TABLE IF NOT EXISTS transmissions (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    transmitted_date TIMESTAMPTZ NOT NULL,
    transmitted_to_office VARCHAR(128) NOT NULL,
    recipient_name VARCHAR(128) NOT NULL,
    received_by VARCHAR(128),
    proof_document_url VARCHAR(512),
    method VARCHAR(32) NOT NULL CHECK (method IN (
        'PHYSICAL_COURIER',
        'IN_PERSON_PICKUP',
        'OFFICIAL_EMAIL',
        'PORTAL_DISPATCH'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transmissions_doc_id ON transmissions(document_id);

-- Table 5: venues (Municipal Facilities)
CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR(32) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    location VARCHAR(128) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Table 6: event_bookings (Venue & Gavel Calendar)
CREATE TABLE IF NOT EXISTS event_bookings (
    id VARCHAR(36) PRIMARY KEY,
    venue_id VARCHAR(32) NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    organizer VARCHAR(128) NOT NULL,
    department VARCHAR(64) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    involves_mayor BOOLEAN NOT NULL DEFAULT FALSE,
    involves_admin BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN (
        'CONFIRMED',
        'TENTATIVE',
        'CANCELLED'
    )),
    notes TEXT,
    created_by_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_booking_time CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_conflict ON event_bookings(venue_id, booking_date, start_time, end_time, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON event_bookings(booking_date);

-- Table 7: event_attendees (Gavel Attendees & Dignitaries)
CREATE TABLE IF NOT EXISTS event_attendees (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL REFERENCES event_bookings(id) ON DELETE CASCADE,
    full_name VARCHAR(128) NOT NULL,
    role_title VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);

-- Table 8: audit_logs (Immutable Statutory Custody Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) REFERENCES documents(id) ON DELETE SET NULL,
    event_id VARCHAR(36) REFERENCES event_bookings(id) ON DELETE SET NULL,
    action VARCHAR(32) NOT NULL CHECK (action IN (
        'RECEIVED',
        'SCREENED',
        'PREPARED',
        'REVIEWED',
        'APPROVED',
        'ENDORSED',
        'DENIED',
        'TRANSMITTED',
        'ARCHIVED',
        'SCHEDULED_EVENT',
        'UPDATED'
    )),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    user_name VARCHAR(128) NOT NULL,
    user_role VARCHAR(32) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details TEXT NOT NULL,
    hash_checksum VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_audit_doc_id ON audit_logs(document_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- Table 9: document_templates (Standard LGU Drafting Schemas)
CREATE TABLE IF NOT EXISTS document_templates (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    template_body_schema JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
