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

-- 3. Insert Standard Document Templates
INSERT INTO document_templates (id, code, title, category, description, template_body_schema) VALUES
('tmpl-01', 'TO-LGU-2026', 'Travel Order Template', 'ADMINISTRATIVE', 'Official travel authorization for municipal personnel and department heads.', '{"fields": ["personnel_name", "destination", "purpose", "departure_date", "return_date", "allowance_authorized"]}'::jsonb),
('tmpl-02', 'EO-MAYOR-2026', 'Executive Order (EO)', 'EXECUTIVE', 'Official directive issued by the Municipal Mayor regarding municipal policy.', '{"fields": ["eo_number", "series_year", "preamble_whereases", "sections", "effectivity_clause"]}'::jsonb),
('tmpl-03', 'IND-SB-2026', '1st Indorsement to SB', 'LEGISLATIVE', 'Formal transmittal to the Sangguniang Bayan for legislative resolution.', '{"fields": ["origin_office", "indorsement_target", "subject_matter", "recommendations"]}'::jsonb),
('tmpl-04', 'VR-GSO-2026', 'Venue Clearance Form', 'ADMINISTRATIVE', 'Venue security, logistics, and sound system clearance with GSO.', '{"fields": ["venue_name", "organizer", "event_date", "time_slot", "logistical_needs"]}'::jsonb),
('tmpl-05', 'OT-HRMO-2026', 'Overtime Authorization', 'PERSONNEL', 'Overtime pay authority compliant with CSC and COA regulations.', '{"fields": ["employee_names", "justification", "target_dates", "authorized_hours", "source_of_funds"]}'::jsonb),
('tmpl-06', 'LO-LEGAL-2026', 'Legal Advice Request', 'LEGAL', 'Transmittal to Municipal Legal Officer for contractual review.', '{"fields": ["requesting_office", "legal_issue", "attached_contracts", "urgency_notes"]}'::jsonb);

-- Clean production baseline established:
-- 0 document dockets, 0 event bookings, 0 transmissions, 0 audit logs.
-- Ready for official municipal intake and docket logging.

