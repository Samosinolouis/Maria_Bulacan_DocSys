/**
 * Application Error Classes
 *
 * Structured, typed error hierarchy for business logic. These are NOT GraphQL
 * errors — the error handler converts them into safe GraphQL responses.
 *
 * [SOLID:SRP] Each class is one failure category.
 * [SOLID:OCP] New error types extend AppError without modifying it.
 * [OWASP:A09] Never expose stack traces or implementation details to clients.
 */

// ============================================================
// Error Codes
// ============================================================

export enum CommonErrorCode {
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
}

export enum AuthErrorCode {
  UNAUTHENTICATED = "UNAUTHENTICATED",
  UNAUTHORIZED = "UNAUTHORIZED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",
}

export enum ValidationErrorCode {
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
}

export enum BusinessErrorCode {
  INVALID_STATE = "INVALID_STATE",
  CONFLICT = "CONFLICT",
  SLA_VIOLATION = "SLA_VIOLATION",
}

export type ErrorCode =
  | CommonErrorCode
  | AuthErrorCode
  | ValidationErrorCode
  | BusinessErrorCode;

// ============================================================
// Base Application Error
// ============================================================

export class AppError extends Error {
  public readonly type: string;
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      type?: string;
      status?: number;
      code?: ErrorCode;
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = options.type || "AppError";
    this.status = options.status || 500;
    this.code = options.code || CommonErrorCode.INTERNAL_ERROR;
    this.details = options.details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================
// Specific Error Types
// ============================================================

/** Resource not found (404). */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id '${id}'` : ""} not found`, {
      type: "NotFoundError",
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      details: { resource, ...(id && { id }) },
    });
  }
}

/** Authentication failure — missing or invalid credentials (401). */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, {
      type: "AuthenticationError",
      status: 401,
      code: AuthErrorCode.UNAUTHENTICATED,
    });
  }
}

/** Authorization failure — insufficient permissions (403) [FR-05]. */
export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, {
      type: "ForbiddenError",
      status: 403,
      code: AuthErrorCode.UNAUTHORIZED,
    });
  }
}

/** Input validation failure (400) [OWASP:A03]. */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      type: "ValidationError",
      status: 400,
      code: ValidationErrorCode.INVALID_INPUT,
      details,
    });
  }
}

/** Conflict — resource already exists (409). */
export class ConflictError extends AppError {
  constructor(resource: string, details?: Record<string, unknown>) {
    super(`${resource} already exists`, {
      type: "ConflictError",
      status: 409,
      code: CommonErrorCode.ALREADY_EXISTS,
      details,
    });
  }
}

/**
 * Invalid workflow state transition (409).
 * e.g. attempting to approve a CLOSED request, or a scheduling conflict.
 */
export class InvalidStateError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      type: "InvalidStateError",
      status: 409,
      code: BusinessErrorCode.INVALID_STATE,
      details,
    });
  }
}

/** Scheduling / booking conflict (409) [FR-42]. */
export class BookingConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      type: "BookingConflictError",
      status: 409,
      code: BusinessErrorCode.CONFLICT,
      details,
    });
  }
}

/** RA 11032 SLA violation / at-risk (422) [FR-09, FR-38]. */
export class SlaError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      type: "SlaError",
      status: 422,
      code: BusinessErrorCode.SLA_VIOLATION,
      details,
    });
  }
}

/**
 * Method scaffolded but not yet implemented.
 * Used by service skeletons so an unimplemented operation fails loudly
 * instead of silently returning wrong data.
 */
export class NotImplementedError extends AppError {
  constructor(feature: string) {
    super(`${feature} is not implemented yet`, {
      type: "NotImplementedError",
      status: 501,
      code: CommonErrorCode.INTERNAL_ERROR,
      details: { feature },
    });
  }
}
