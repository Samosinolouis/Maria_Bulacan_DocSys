/**
 * Validates every frontend GraphQL operation document against the LIVE backend
 * schema (introspected from the running API). Catches unknown fields, unknown
 * arguments, and unknown types - i.e. drift between the service layer's
 * operation documents and the backend SDL.
 *
 * Run from app/:  ../backend/node_modules/.bin/tsx scripts/validate-operations.mts
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  buildClientSchema,
  getIntrospectionQuery,
  parse,
  validate,
  type GraphQLSchema,
} from 'graphql';

const ENDPOINT = process.env.GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql';

async function introspect(): Promise<GraphQLSchema> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
  });
  const json = (await res.json()) as { data?: unknown; errors?: unknown };
  if (!json.data) throw new Error(`introspection failed: ${JSON.stringify(json.errors)}`);
  return buildClientSchema(json.data as never);
}

/** The one operation the services inline (closeRequest pre-check). */
const INLINE: Record<string, string> = {
  RequestForClose: `query RequestForClose($id: ID!) { request(id: $id) { id status documents { id } } }`,
};

const schema = await introspect();

const opsDir = fileURLToPath(new URL('../src/services/graphql/', import.meta.url));
const files = readdirSync(opsDir).filter((f) => f.endsWith('.ops.ts'));

let total = 0;
let failures = 0;
const problems: string[] = [];

for (const file of files) {
  const mod = (await import(pathToFileURL(join(opsDir, file)).href)) as Record<string, unknown>;
  for (const [groupName, group] of Object.entries(mod)) {
    if (typeof group !== 'object' || group === null) continue;
    for (const [opName, doc] of Object.entries(group as Record<string, unknown>)) {
      if (typeof doc !== 'string') continue;
      total += 1;
      const label = `${groupName}.${opName}`;
      try {
        const errors = validate(schema, parse(doc));
        if (errors.length) {
          failures += 1;
          problems.push(`${label}: ${errors.map((e) => e.message).join(' | ')}`);
        }
      } catch (err) {
        failures += 1;
        problems.push(`${label}: PARSE ERROR ${(err as Error).message}`);
      }
    }
  }
}

for (const [label, doc] of Object.entries(INLINE)) {
  total += 1;
  const errors = validate(schema, parse(doc));
  if (errors.length) {
    failures += 1;
    problems.push(`inline.${label}: ${errors.map((e) => e.message).join(' | ')}`);
  }
}

console.log(`validated ${total} operation documents against ${ENDPOINT}`);
if (problems.length) {
  console.log(`\n${failures} INVALID:\n`);
  for (const p of problems) console.log(` - ${p}`);
  process.exit(1);
}
console.log('all operations are valid against the live backend schema');
