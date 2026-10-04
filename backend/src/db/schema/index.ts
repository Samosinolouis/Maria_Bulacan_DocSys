/**
 * Database Schema Barrel Export
 *
 * Re-exports all table definitions and enums. Used by drizzle-kit for
 * migrations and by the Drizzle client for typed queries.
 */

// Shared enums
export * from "./enums.ts";

// [A] Shared platform
export { users, roles, userRoles } from "./platform.ts";
export { notifications } from "./notifications.ts";

// [B] Document module
export {
  requestTypes,
  documentTypes,
  controlNumberSequences,
  holidays,
  requests,
  requestAttachments,
  documents,
  documentAttachments,
  transmissions,
  documentLogs,
} from "./document.ts";

// [C] Booking module
export { venues, events, eventAttendees, activityLogs } from "./booking.ts";
