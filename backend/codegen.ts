/**
 * GraphQL Codegen Configuration (backend)
 *
 * Generates TypeScript types for the full SDL in `src/graphql/**` so resolvers
 * and helpers can type arguments and payloads straight from the schema.
 *
 * Run: npm run codegen  (re-run after any .graphql change)
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/graphql/**/*.graphql',
  generates: {
    'src/types/graphql.ts': {
      plugins: ['typescript'],
      config: {
        // Union types instead of TS enums: the codebase models statuses as
        // string literal unions, and plain literals are assignable to unions.
        enumsAsTypes: true,
        scalars: {
          // Server-side the graphql-scalars DateTime resolver parses inputs to
          // Date objects and serializes Date outputs to ISO strings. The wire
          // format (what the frontend sees) is the ISO string.
          DateTime: 'Date',
          UUID: 'string',
          JSON: 'unknown',
        },
      },
    },
  },
};

export default config;
