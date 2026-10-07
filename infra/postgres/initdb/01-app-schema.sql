-- ============================================================
-- Local PostgreSQL bootstrap (runs once, on first init)
--
-- The API owns the `app` schema; Keycloak keeps its own tables in the
-- default `public` schema of the SAME database.
--
-- `IF NOT EXISTS` makes this safe to run even when the Drizzle
-- migration (which also issues CREATE SCHEMA "app") already applied.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION CURRENT_USER;

-- Ensure the owning role can create objects in it.
GRANT ALL ON SCHEMA app TO CURRENT_USER;
