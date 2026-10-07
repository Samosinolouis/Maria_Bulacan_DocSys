/**
 * GraphQL transport port. Services depend on `IGraphQLClient`; the concrete
 * fetch-based adapter lives in `app/src/services/graphql/client.ts` and is
 * injected at the composition root.
 */

export interface GraphQLOperation<TVariables = Record<string, unknown>> {
  /** Query or mutation document text. */
  document: string;
  variables?: TVariables;
  operationName?: string;
  /**
   * Opt out of the transport's UNAUTHENTICATED retry (which refreshes the
   * session and replays once). Set by session bootstrap operations: the refresh
   * itself runs `me`, so a retry there would recurse into another refresh.
   */
  skipAuthRetry?: boolean;
}

export interface IGraphQLClient {
  /**
   * Execute one operation against POST /graphql.
   * - Attaches the session Bearer token.
   * - Maps transport and GraphQL errors to AppErrorShape (see errors.ts).
   * Rejects with AppErrorShape on any failure.
   */
  request<TData, TVariables = Record<string, unknown>>(
    operation: GraphQLOperation<TVariables>,
  ): Promise<TData>;
}
