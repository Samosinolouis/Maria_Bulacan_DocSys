/**
 * GraphQL Codegen Configuration (frontend)
 *
 * Generates TypeScript types for the backend SDL (single source of truth)
 * so the service layer and hooks are schema-aware.
 *
 * Run: npm run codegen  (re-run after any backend .graphql change)
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // The backend owns the schema; generate from its SDL files.
  schema: '../backend/src/graphql/**/*.graphql',
  generates: {
    'src/types/graphql.ts': {
      plugins: ['typescript'],
      config: {
        // Union types instead of TS enums: the codebase models statuses as
        // string literal unions, and plain literals are assignable to unions.
        enumsAsTypes: true,
        scalars: {
          DateTime: 'string',
          UUID: 'string',
          JSON: 'unknown',
        },
      },
    },
  },
};

export default config;
