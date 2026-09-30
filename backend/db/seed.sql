-- =============================================================================
-- MUNICIPALITY OF SANTA MARIA, BULACAN
-- OFFICIAL PRODUCTION SEED DATA (CLEAN CIVIC RECORDS)
-- =============================================================================

-- Clean existing data in reverse dependency order
TRUNCATE TABLE audit_logs, event_attendees, event_bookings, venues, transmissions, attachments, documents, users, document_templates CASCADE;

-- 1. Insert Official Civil Service Plantilla Users
INSERT INTO users (id, full_name, email, password_hash, role, department, title, is_active) VALUES
('usr-admin-01', 'Engr. Elmer B. Clemente', 'admin@santamaria.gov.ph', 'pbkdf2$admin2026', 'MUNICIPAL_ADMIN', 'Office of the Municipal Administrator', 'Municipal Administrator', true),
('usr-mayor-02', 'Hon. Bartolome', 'mayor@santamaria.gov.ph', 'pbkdf2$mayor2026', 'MAYOR', 'Office of the Municipal Mayor', 'Municipal Mayor', true),
('usr-records-03', 'Ma. Cristina Perez', 'records.officer@santamaria.gov.ph', 'pbkdf2$records2026', 'ADMIN_OFFICER_V', 'Records & Archives Division', 'Administrative Officer V', true),
('usr-legal-04', 'Atty. Rodrigo Ramos', 'legal@santamaria.gov.ph', 'pbkdf2$legal2026', 'SENIOR_RECORDS_OFFICER', 'Municipal Legal Office', 'Senior Legal Officer', true),
('usr-clerk-05', 'Juan Dela Cruz', 'clerk@santamaria.gov.ph', 'pbkdf2$clerk2026', 'INTAKE_CLERK', 'Central Receiving Desk', 'Administrative Aide IV', true);

-- 2. Insert Official Municipal Venues
INSERT INTO venues (id, code, name, location, capacity, is_active) VALUES
('CONFERENCE_ROOM', 'CONF_RM_A', 'Municipal Conference Room', '2nd Floor, Municipal Hall', 30, true),
('SESSION_HALL', 'SB_SESSION', 'Sangguniang Bayan Session Hall', 'Legislative Wing, 2nd Floor', 80, true),
('GYMNASIUM', 'MUN_GYM', 'Municipal Gymnasium', 'Santa Maria Sports Complex', 1500, true),
('COMMAND_CENTER', 'MDRRMO_CC', 'MDRRMO Command Center', 'Ground Floor, Disaster Bldg', 25, true),
('SOCIAL_HALL', 'SOC_HALL', 'Municipal Social Hall', '3rd Floor, Executive Wing', 200, true),
('PLAZA_STAGE', 'PLAZA_STG', 'Santa Maria Town Plaza Stage', 'Municipal Grounds, Exterior', 500, true);

-- 3. Insert Clean Municipal Document Dockets
INSERT INTO documents (
    id, control_number, type, category, title, requesting_party, origin_office,
    date_received, assigned_to_user_id, status, priority, sla_deadline, is_overdue,
    denial_reason, endorsement_notes, created_by_user_id
) VALUES
(
    'doc-001',
    'TO-2026-0042',
    'TRAVEL_ORDER',
    'ADMINISTRATIVE',
    'Request for Travel Order - Provincial Disaster Risk Reduction and Management Council Quarterly Coordination Conference',
    'Mr. Florian De Leon',
    'Municipal Disaster Risk Reduction and Management Office (MDRRMO)',
    '2026-09-28 09:30:00+08',
    'usr-admin-01',
    'REVIEW',
    'NORMAL',
    '2026-10-01 09:30:00+08',
    false,
    null,
    'Endorsed to Municipal Administrator for final counter-signature and per diem release.',
    'usr-clerk-05'
),
(
    'doc-002',
    'EO-2026-0018',
    'EXECUTIVE_ORDER',
    'EXECUTIVE',
    'Executive Order - Reconstitution and Strengthening of the Municipal Anti-Drug Abuse Council (MADAC)',
    'P/Lt. Col. Arthur Gomez',
    'Philippine National Police - Santa Maria Municipal Police Station',
    '2026-09-25 14:15:00+08',
    'usr-mayor-02',
    'REVIEW',
    'URGENT',
    '2026-09-28 14:15:00+08',
    true,
    null,
    'SLA escalation memorandum generated pursuant to RA 11032 Section 21.',
    'usr-clerk-05'
),
(
    'doc-003',
    'IN-2026-0944',
    'INDORSEMENT',
    'LEGISLATIVE',
    '1st Indorsement - Proposed Barangay Poblacion Ordinance No. 04 S-2026 Regulating Tricycle Terminal Zones',
    'Punong Barangay Reynaldo Ramos',
    'Barangay Council of Poblacion',
    '2026-09-30 10:00:00+08',
    null,
    'SCREENING',
    'NORMAL',
    '2026-10-03 10:00:00+08',
    false,
    null,
    null,
    'usr-clerk-05'
),
(
    'doc-004',
    'VR-2026-0089',
    'VENUE_REQUEST',
    'PUBLIC_AFFAIRS',
    'Application for Venue Clearance - 2026 Municipal Inter-Barangay Athletic League and Sports Festival',
    'Hon. Kenneth Bautista (SK President)',
    'Sangguniang Kabataan Federation of Santa Maria',
    '2026-09-27 11:20:00+08',
    'usr-admin-01',
    'APPROVED',
    'HIGH',
    '2026-09-30 11:20:00+08',
    false,
    null,
    'Approved with General Services Office coordination for sound and security.',
    'usr-clerk-05'
),
(
    'doc-005',
    'OT-2026-0155',
    'OVERTIME_AUTHORITY',
    'PERSONNEL',
    'Authority to Render Overtime Services - Revenue Assessment and Real Property Tax Collection Operations',
    'Ms. Carmelita Cruz',
    'Municipal Assessor''s Office',
    '2026-09-26 08:45:00+08',
    'usr-admin-01',
    'TRANSMITTED',
    'NORMAL',
    '2026-09-29 08:45:00+08',
    false,
    null,
    'Authorized subject to Civil Service Commission and COA auditing rules.',
    'usr-clerk-05'
),
(
    'doc-006',
    'LO-2026-0012',
    'LEGAL_OPINION',
    'LEGAL',
    'Request for Legal Opinion - Terms of Memorandum of Agreement for Santa Maria Riverbank Protection Project',
    'Engr. Roberto Santos',
    'Municipal Engineering Office',
    '2026-09-29 13:00:00+08',
    'usr-legal-04',
    'PREPARATION',
    'HIGH',
    '2026-10-02 13:00:00+08',
    false,
    null,
    null,
    'usr-clerk-05'
),
(
    'doc-007',
    'CR-2026-0311',
    'CITIZEN_REQUEST',
    'ADMINISTRATIVE',
    'Public Hearing Resolution - Application for Special Permit for Farm-to-Market Road Construction in Barangay Catmon',
    'Mr. Danilo Castro',
    'Catmon Farmers Cooperative',
    '2026-09-22 10:30:00+08',
    'usr-records-03',
    'CLOSED',
    'NORMAL',
    '2026-09-25 10:30:00+08',
    false,
    null,
    'Concluded and archived in digital repository shelf R-04-B.',
    'usr-clerk-05'
),
(
    'doc-008',
    'MO-2026-0005',
    'MEMORANDUM',
    'ADMINISTRATIVE',
    'Office Memorandum - Observance of Regular Working Hours and Biometric Attendance Logging',
    'Atty. Rodrigo Ramos',
    'Human Resource Management Office (HRMO)',
    '2026-09-20 08:00:00+08',
    'usr-admin-01',
    'CLOSED',
    'NORMAL',
    '2026-09-23 08:00:00+08',
    false,
    null,
    'Transmitted to all departments and logged into municipal permanent archives.',
    'usr-clerk-05'
);

-- 4. Insert Transmissions for Concluded Dockets
INSERT INTO transmissions (id, document_id, transmitted_date, transmitted_to_office, recipient_name, received_by, method, notes) VALUES
('tx-001', 'doc-005', '2026-09-28 15:30:00+08', 'Accounting and Budget Division', 'Carmelita Cruz', 'Analyn Mendoza (Clerk)', 'IN_PERSON_PICKUP', 'Physical copy signed and acknowledged in dispatch logbook folio 88.'),
('tx-002', 'doc-008', '2026-09-22 14:00:00+08', 'All Municipal Departments', 'General Circulation', 'Administrative Records Clerk', 'OFFICIAL_EMAIL', 'Broadcast transmittal to all department head inboxes.');

-- 5. Insert Clean Gavel & Venue Calendar Bookings
INSERT INTO event_bookings (id, venue_id, title, organizer, department, booking_date, start_time, end_time, involves_mayor, involves_admin, status, notes, created_by_user_id) VALUES
('evt-001', 'CONFERENCE_ROOM', 'Municipal Local Finance Committee (LFC) Budget Hearing', 'Lourdes Fernandez', 'Municipal Accounting Office', '2026-10-01', '09:00:00', '12:00:00', true, true, 'CONFIRMED', 'Sound system and projector clearance logged.', 'usr-admin-01'),
('evt-002', 'COMMAND_CENTER', 'MDRRMO Pre-Disaster Risk Assessment (Typhoon Preparedness)', 'Florian De Leon', 'MDRRMO', '2026-10-01', '13:30:00', '16:00:00', false, true, 'CONFIRMED', 'Emergency broadcast equipment standby.', 'usr-admin-01'),
('evt-003', 'SOCIAL_HALL', 'Santa Maria Barangay Captains Quarterly General Assembly', 'Liga ng mga Barangay Secretariat', 'Liga ng mga Barangay', '2026-10-02', '09:00:00', '15:00:00', true, true, 'CONFIRMED', 'Catering and peace and order personnel deployed.', 'usr-admin-01'),
('evt-004', 'GYMNASIUM', 'Municipal Megajob Fair 2026 (Day 1 Recruitment Drive)', 'Maria Elena Reyes', 'Public Employment Service Office (PESO)', '2026-10-15', '08:00:00', '17:00:00', true, false, 'CONFIRMED', 'Security deployment by PNP Santa Maria.', 'usr-admin-01'),
('evt-005', 'SESSION_HALL', 'Sangguniang Bayan 42nd Regular Legislative Session', 'Vice Mayor and Presiding Officer', 'Sangguniang Bayan', '2026-10-06', '09:00:00', '14:00:00', false, false, 'CONFIRMED', 'Legislative audio recording system activated.', 'usr-admin-01'),
('evt-006', 'PLAZA_STAGE', 'Araw ng Santa Maria Cultural Presentation & Civic Awards', 'Municipal Tourism and Cultural Affairs', 'Tourism Office', '2026-10-20', '17:00:00', '22:00:00', true, true, 'CONFIRMED', 'Traffic rerouting advisory issued for Poblacion.', 'usr-admin-01');

-- 6. Insert Statutory Audit Logs
INSERT INTO audit_logs (id, document_id, event_id, action, user_id, user_name, user_role, timestamp, details, hash_checksum) VALUES
('aud-001', 'doc-001', null, 'RECEIVED', 'usr-clerk-05', 'Juan Dela Cruz', 'INTAKE_CLERK', '2026-09-28 09:30:00+08', 'Document received at Central Receiving Desk. Control number TO-2026-0042 assigned.', 'a8b3f17c29e102847d01'),
('aud-002', 'doc-001', null, 'SCREENED', 'usr-clerk-05', 'Juan Dela Cruz', 'INTAKE_CLERK', '2026-09-28 10:15:00+08', 'Screening checklist verified. Annexes complete with official invitations attached.', 'b9c4e28d30f213958e12'),
('aud-003', 'doc-002', null, 'REVIEWED', 'usr-admin-01', 'Engr. Elmer B. Clemente', 'MUNICIPAL_ADMIN', '2026-09-26 11:00:00+08', 'Transmitted to Mayor''s desk. SLA alert triggered due to expiration of 72-hour window.', 'c0d5f39e41a324069f23'),
('aud-004', 'doc-004', null, 'APPROVED', 'usr-admin-01', 'Engr. Elmer B. Clemente', 'MUNICIPAL_ADMIN', '2026-09-27 16:45:00+08', 'Executive approval stamped. Routing slip signed for GSO logistics coordination.', 'd1e6a40f52b435170a34'),
('aud-005', 'doc-005', null, 'TRANSMITTED', 'usr-clerk-05', 'Juan Dela Cruz', 'INTAKE_CLERK', '2026-09-28 15:30:00+08', 'Dispatched to Municipal Assessor''s Office with physical transmittal receipt.', 'e2f7b51a63c546281b45'),
('aud-006', null, 'evt-001', 'SCHEDULED_EVENT', 'usr-admin-01', 'Engr. Elmer B. Clemente', 'MUNICIPAL_ADMIN', '2026-09-29 14:00:00+08', 'Scheduled Municipal Local Finance Committee Budget Hearing at Conference Room.', 'f3a8c62b74d657392c56');

-- 7. Insert Standard Document Templates
INSERT INTO document_templates (id, code, title, category, description, template_body_schema) VALUES
('tmpl-01', 'TO-LGU-2026', 'Travel Order Template', 'ADMINISTRATIVE', 'Official travel authorization for municipal personnel and department heads.', '{"fields": ["personnel_name", "destination", "purpose", "departure_date", "return_date", "allowance_authorized"]}'::jsonb),
('tmpl-02', 'EO-MAYOR-2026', 'Executive Order (EO)', 'EXECUTIVE', 'Official directive issued by the Municipal Mayor regarding municipal policy.', '{"fields": ["eo_number", "series_year", "preamble_whereases", "sections", "effectivity_clause"]}'::jsonb),
('tmpl-03', 'IND-SB-2026', '1st Indorsement to SB', 'LEGISLATIVE', 'Formal transmittal to the Sangguniang Bayan for legislative resolution.', '{"fields": ["origin_office", "indorsement_target", "subject_matter", "recommendations"]}'::jsonb),
('tmpl-04', 'VR-GSO-2026', 'Venue Clearance Form', 'ADMINISTRATIVE', 'Venue security, logistics, and sound system clearance with GSO.', '{"fields": ["venue_name", "organizer", "event_date", "time_slot", "logistical_needs"]}'::jsonb),
('tmpl-05', 'OT-HRMO-2026', 'Overtime Authorization', 'PERSONNEL', 'Overtime pay authority compliant with CSC and COA regulations.', '{"fields": ["employee_names", "justification", "target_dates", "authorized_hours", "source_of_funds"]}'::jsonb),
('tmpl-06', 'LO-LEGAL-2026', 'Legal Advice Request', 'LEGAL', 'Transmittal to Municipal Legal Officer for contractual review.', '{"fields": ["requesting_office", "legal_issue", "attached_contracts", "urgency_notes"]}'::jsonb);
