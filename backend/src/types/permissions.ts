/**
 * Permission Constants [NFR-21]
 *
 * Permission strings are defined ONCE as code constants and validated on
 * write. Format: ^[\\w*]+:[\\w*]+$ - "Service:Action" with "*" wildcards
 * ("Service:*" and "*:*"). Computed as the union of the actor's roles'
 * permission_payload (FR-05).
 */

/** Permission string format: `<Service>:<Action>`, wildcards allowed. */
export const PERMISSION_PATTERN = /^[A-Za-z0-9_*]+:[A-Za-z0-9_*]+$/;

export const Permissions = {
  // --- Shared platform (identity & authorization) ---
  UserService: {
    Read: "UserService:Read",
    Create: "UserService:Create",
    Update: "UserService:Update",
    Deactivate: "UserService:Deactivate",
    AssignRole: "UserService:AssignRole",
    ViewPermissions: "UserService:ViewPermissions",
    All: "UserService:*",
  },
  RoleService: {
    Read: "RoleService:Read",
    Create: "RoleService:Create",
    Update: "RoleService:Update",
    All: "RoleService:*",
  },
  NotificationService: {
    Read: "NotificationService:Read",
    MarkRead: "NotificationService:MarkRead",
    All: "NotificationService:*",
  },

  // --- Document module ---
  RequestService: {
    Read: "RequestService:Read",
    Encode: "RequestService:Encode",
    Screen: "RequestService:Screen",
    All: "RequestService:*",
  },
  DocumentService: {
    Read: "DocumentService:Read",
    Prepare: "DocumentService:Prepare",
    Review: "DocumentService:Review",
    Sign: "DocumentService:Sign",
    Transmit: "DocumentService:Transmit",
    Close: "DocumentService:Close",
    CreateStandalone: "DocumentService:CreateStandalone",
    All: "DocumentService:*",
  },
  AttachmentService: {
    Upload: "AttachmentService:Upload",
    Read: "AttachmentService:Read",
    Download: "AttachmentService:Download",
    All: "AttachmentService:*",
  },
  FolderService: {
    Read: "FolderService:Read",
    Create: "FolderService:Create",
    All: "FolderService:*",
  },
  ReportService: {
    Read: "ReportService:Read",
    Export: "ReportService:Export",
    All: "ReportService:*",
  },

  // --- Booking module ---
  EventService: {
    Read: "EventService:Read",
    Create: "EventService:Create",
    Update: "EventService:Update",
    Cancel: "EventService:Cancel",
    BookSpecialVenue: "EventService:BookSpecialVenue",
    All: "EventService:*",
  },
  VenueService: {
    Read: "VenueService:Read",
    Manage: "VenueService:Manage",
    All: "VenueService:*",
  },

  // --- Super-admin ---
  All: "*:*",
} as const;

/**
 * Validates a permission string against the required format.
 * Used when persisting role permission payloads [NFR-21].
 */
export function isValidPermission(permission: string): boolean {
  return PERMISSION_PATTERN.test(permission);
}

/**
 * Returns true if the granted permission set satisfies the required
 * permission, honoring "Service:*" and "*:*" wildcards.
 */
export function permissionSatisfies(
  granted: readonly string[],
  required: string,
): boolean {
  const [reqService, reqAction] = required.split(":");
  return granted.some((grant) => {
    if (grant === "*:*") return true;
    const [gService, gAction] = grant.split(":");
    if (gService !== reqService && gService !== "*") return false;
    return gAction === "*" || gAction === reqAction;
  });
}
