/**
 * Application Configuration
 *
 * Centralizes all environment-based configuration and validates required
 * variables at startup. [SOLID:SRP] [NFR-05] No credentials ever reach the
 * application database — only Keycloak/B2 references live here.
 */

import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  port: Number.parseInt(optionalEnv("PORT", "4000"), 10),
  host: optionalEnv("HOST", "0.0.0.0"),
  app: {
    baseUrl: optionalEnv("APP_BASE_URL", "http://localhost:4000"),
  },

  /** PostgreSQL */
  databaseUrl: requireEnv("DATABASE_URL"),

  /** Keycloak / OIDC — authentication only (FR-01, NFR-05) */
  keycloak: {
    realmUrl: requireEnv("KEYCLOAK_REALM_URL"),
    clientId: requireEnv("KEYCLOAK_CLIENT_ID"),
    clientSecret: requireEnv("KEYCLOAK_CLIENT_SECRET"),
    jwksUri: requireEnv("KEYCLOAK_JWKS_URI"),
  },

  /** Backblaze B2 — object storage for all uploaded files (NFR-06, NFR-15) */
  b2: {
    applicationKeyId: optionalEnv("B2_APPLICATION_KEY_ID", ""),
    applicationKey: optionalEnv("B2_APPLICATION_KEY", ""),
    bucketName: optionalEnv("B2_BUCKET_NAME", "docsys-attachments"),
    bucketId: optionalEnv("B2_BUCKET_ID", ""),
    endpoint: optionalEnv("B2_ENDPOINT", ""),
    region: optionalEnv("B2_REGION", "us-west-004"),
    presignExpirySeconds: Number.parseInt(
      optionalEnv("B2_PRESIGN_EXPIRY_SECONDS", "900"),
      10,
    ),
  },

  /** Upload policy (FR-10) */
  upload: {
    allowedMime: optionalEnv(
      "UPLOAD_ALLOWED_MIME",
      "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
    maxBytes: Number.parseInt(optionalEnv("UPLOAD_MAX_BYTES", "26214400"), 10),
  },

  /** Feature flags (runtime toggles, distinct from config) */
  features: {
    telemetry: optionalEnv("TELEMETRY_ENABLED", "true") === "true",
    cache: optionalEnv("CACHE_ENABLED", "false") === "true",
  },
} as const;

export type AppConfig = typeof config;
