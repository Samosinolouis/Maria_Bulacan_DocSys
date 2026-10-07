/**
 * Error contract. Every service rejection carries an `AppErrorShape`
 * (stable code + user-safe message). Hooks translate it into state; views
 * render `message` directly.
 */

export type ServiceErrorCode =
  | 'UNAUTHENTICATED' // no session / expired token
  | 'FORBIDDEN' // authorization denied (see authz.ts)
  | 'NOT_FOUND' // entity does not exist or is not visible
  | 'CONFLICT' // state conflict (duplicate, invalid transition, booking clash)
  | 'VALIDATION' // input rejected before the round trip
  | 'NETWORK' // transport failure (offline, timeout, 5xx)
  | 'UNKNOWN'; // anything else, message still user-safe

/** Shape every service rejection carries. */
export interface AppErrorShape {
  /** Stable, programmatic discriminator. */
  code: ServiceErrorCode;
  /** User-safe message. Safe to render directly. */
  message: string;
  /** Original cause for logging. Never rendered. */
  cause?: unknown;
}

export function isAppError(value: unknown): value is AppErrorShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

/**
 * `AppError` is the throwable form of `AppErrorShape`. Services throw it;
 * `normalizeError` recognizes it so it survives the boundary unchanged.
 */
export class AppError extends Error implements AppErrorShape {
  readonly code: ServiceErrorCode;
  readonly cause?: unknown;

  constructor(code: ServiceErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}
