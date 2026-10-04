/**
 * Adapters Index
 *
 * Concrete implementations of the ports (external system integrations).
 * Only the composition root (server.ts) should import these.
 */

export * from "./storage/b2-storage.adapter.js";
export * from "./identity/keycloak-idp.adapter.js";
