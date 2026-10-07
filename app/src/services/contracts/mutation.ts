/**
 * Standard mutation answer (mirrors the backend
 * `src/graphql/core/mutation-payload.graphql`).
 *
 * Every mutation returns the entities it changed, as `EntityName_EntityId`
 * strings (a bare `EntityName` means a bulk write whose rows cannot be named),
 * plus its own result under a domain field. Services pass the list to
 * `invalidateChangedEntities`, so the client cache drops exactly the queries
 * that went stale instead of guessing.
 */
export type MutationAnswer<TField extends string, TEntity> = {
  changedEntities: string[];
} & { [K in TField]: TEntity };
