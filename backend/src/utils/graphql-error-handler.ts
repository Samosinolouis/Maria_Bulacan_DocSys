/**
 * GraphQL Error Handling Utilities
 *
 * Mercurius (unlike Apollo) does not provide a global formatError hook that
 * preserves GraphQL error shapes, so we convert business AppErrors into
 * GraphQLErrors with safe extensions at the resolver boundary.
 *
 * [SOLID:SRP] Error translation only.
 * [OWASP:A09] Unexpected errors are logged server-side and masked client-side.
 */

import { GraphQLError, GraphQLScalarType } from "graphql";

import { AppError } from "../errors/index.js";

/** Convert any thrown value into a safe, structured GraphQLError. */
export function toGraphQLError(error: unknown): GraphQLError {
  if (error instanceof AppError) {
    return new GraphQLError(error.message, {
      extensions: {
        type: error.type,
        status: error.status,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
    });
  }

  if (error instanceof GraphQLError) {
    return error;
  }

  if (error instanceof Error) {
    console.error("[UnexpectedError]", error.message, error.stack);
  }

  return new GraphQLError("An unexpected error occurred", {
    extensions: { type: "InternalServerError", status: 500, code: "INTERNAL_ERROR" },
  });
}

type AnyFn = (...args: unknown[]) => unknown;
type ResolverMap = Record<string, unknown>;

/**
 * Recursively wrap every resolver function so that thrown errors become
 * structured GraphQLErrors. Scalar types and non-plain objects are passed
 * through untouched.
 */
export function wrapResolvers<T extends ResolverMap>(resolvers: T): T {
  const wrapped: ResolverMap = {};

  for (const [key, value] of Object.entries(resolvers)) {
    if (typeof value === "function") {
      wrapped[key] = wrapFn(value as AnyFn);
    } else if (value instanceof GraphQLScalarType) {
      wrapped[key] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      wrapped[key] = wrapResolvers(value as ResolverMap);
    } else {
      wrapped[key] = value;
    }
  }

  return wrapped as T;
}

function wrapFn(fn: AnyFn): AnyFn {
  return async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw toGraphQLError(error);
    }
  };
}
