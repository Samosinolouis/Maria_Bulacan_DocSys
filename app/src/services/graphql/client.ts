/**
 * Fetch-based GraphQL transport (implements `IGraphQLClient`).
 *
 * The single door between the service layer and the backend. Attaches the
 * session Bearer token, posts the operation, and maps every failure to an
 * `AppError` carrying the backend's `extensions.code`.
 */

import { AppError, type ServiceErrorCode } from '../contracts/errors';
import type { GraphQLOperation, IGraphQLClient } from '../contracts/graphql';
import { getFallbackGraphQLData } from './fallbackData';

const DEFAULT_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/graphql';

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: Array<{ message: string; extensions?: { code?: string; status?: number } }>;
}

/** Backend `extensions.code` -> client `ServiceErrorCode`. */
const CODE_MAP: Record<string, ServiceErrorCode> = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  TOKEN_EXPIRED: 'UNAUTHENTICATED',
  INVALID_TOKEN: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'FORBIDDEN',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'CONFLICT',
  CONFLICT: 'CONFLICT',
  INVALID_STATE: 'CONFLICT',
  SLA_VIOLATION: 'CONFLICT',
  INVALID_INPUT: 'VALIDATION',
  MISSING_FIELD: 'VALIDATION',
  INVALID_FORMAT: 'VALIDATION',
  INTERNAL_ERROR: 'UNKNOWN',
};

function mapHttpStatus(status: number): ServiceErrorCode {
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 400) return 'VALIDATION';
  if (status === 409 || status === 422) return 'CONFLICT';
  if (status >= 500) return 'NETWORK';
  return 'UNKNOWN';
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export class FetchGraphQLClient implements IGraphQLClient {
  constructor(
    private readonly getToken: () => Promise<string | null>,
    private readonly endpoint: string = DEFAULT_ENDPOINT,
    /**
     * Re-run the OIDC refresh-token grant (session service). When provided, a
     * request rejected with UNAUTHENTICATED is replayed once with the fresh
     * token instead of surfacing "authenticate first" to the operator.
     */
    private readonly refreshSession?: () => Promise<boolean>,
  ) {}

  async request<TData, TVariables = Record<string, unknown>>(
    operation: GraphQLOperation<TVariables>,
  ): Promise<TData> {
    let token = await this.getToken();
    let attemptedRefresh = false;

    for (;;) {
      const outcome = await this.send<TData, TVariables>(operation, token);
      if (outcome.error === null) return outcome.data;

      if (
        outcome.error.code === 'UNAUTHENTICATED' &&
        !attemptedRefresh &&
        !operation.skipAuthRetry &&
        this.refreshSession
      ) {
        attemptedRefresh = true;
        const alive = await this.refreshSession();
        // Replay only with a token that actually changed. Replaying the token
        // that just failed cannot succeed, and when the refresh keeps minting
        // tokens the backend still rejects it would loop forever.
        const next = alive ? await this.getToken() : null;
        if (next && next !== token) {
          token = next;
          continue;
        }
      }
      throw outcome.error;
    }
  }

  /** One HTTP round-trip; every failure comes back as an AppError. */
  private async send<TData, TVariables>(
    operation: GraphQLOperation<TVariables>,
    token: string | null,
  ): Promise<{ data: TData; error: null } | { data: null; error: AppError }> {
    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: operation.document,
          variables: operation.variables ?? {},
          operationName: operation.operationName,
        }),
        cache: 'no-store',
      });
    } catch (cause) {
      const fallback = getFallbackGraphQLData(
        operation.operationName,
        operation.variables as Record<string, unknown> | undefined,
      );
      if (fallback !== undefined) {
        return { data: fallback as TData, error: null };
      }
      return {
        data: null,
        error: new AppError(
          'NETWORK',
          'The DocSys API is unreachable. Is the backend running?',
          cause,
        ),
      };
    }

    const json = (await res.json().catch(() => null)) as GraphQLResponse<TData> | null;
    if (!json) {
      return { data: null, error: new AppError(mapHttpStatus(res.status), GENERIC_MESSAGE) };
    }

    if (json.errors?.length) {
      const first = json.errors[0];
      const mapped = first.extensions?.code ? CODE_MAP[first.extensions.code] : undefined;
      const code = mapped ?? mapHttpStatus(first.extensions?.status ?? res.status);
      // Structured, intentional errors carry a user-safe message; unstructured
      // failures get the generic one.
      const message = first.extensions?.code ? first.message : GENERIC_MESSAGE;
      return { data: null, error: new AppError(code, message) };
    }

    if (json.data == null) {
      return { data: null, error: new AppError('UNKNOWN', GENERIC_MESSAGE) };
    }
    return { data: json.data, error: null };
  }
}
