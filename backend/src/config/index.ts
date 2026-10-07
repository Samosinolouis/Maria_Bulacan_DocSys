/**
 * Application Configuration
 *
 * Centralizes all environment-based configuration and validates required
 * variables at startup. [SOLID:SRP] [NFR-05] No credentials ever reach the
 * application database - only Keycloak/MinIO references live here.
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

  /** Keycloak / OIDC - authentication only (FR-01, NFR-05) */
  keycloak: {
    realmUrl: requireEnv("KEYCLOAK_REALM_URL"),
    clientId: requireEnv("KEYCLOAK_CLIENT_ID"),
    clientSecret: requireEnv("KEYCLOAK_CLIENT_SECRET"),
    jwksUri: requireEnv("KEYCLOAK_JWKS_URI"),
  },

  /** MinIO - S3-compatible object storage for all uploaded files (NFR-06, NFR-15) */
  minio: {
    /** Base URL or host[:port] of the MinIO S3 API. */
    endpoint: optionalEnv("MINIO_ENDPOINT", "http://localhost:9000"),
    accessKey: optionalEnv("MINIO_ACCESS_KEY", "minioadmin"),
    secretKey: optionalEnv("MINIO_SECRET_KEY", "minioadmin"),
    bucketName: optionalEnv("MINIO_BUCKET_NAME", "docsys-attachments"),
    region: optionalEnv("MINIO_REGION", "us-east-1"),
    useSsl: optionalEnv("MINIO_USE_SSL", "false") === "true",
    presignExpirySeconds: Number.parseInt(
      optionalEnv("MINIO_PRESIGN_EXPIRY_SECONDS", "900"),
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

  /** RA 11032 SLA policy (FR-38) */
  sla: {
    /** Requests within this many hours of their deadline are "at risk". */
    warningHours: Number.parseInt(optionalEnv("SLA_WARNING_HOURS", "24"), 10),
  },

  /** Browser access - the frontend origins allowed to call this API. */
  cors: {
    origins: optionalEnv("CORS_ORIGINS", "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  },

  /** Feature flags (runtime toggles, distinct from config) */
  features: {
    telemetry: optionalEnv("TELEMETRY_ENABLED", "true") === "true",
    cache: optionalEnv("CACHE_ENABLED", "false") === "true",
  },
} as const;

export type AppConfig = typeof config;
