/**
 * GraphQL Schema Loader
 *
 * Loads every .graphql file under src/graphql recursively and merges them into
 * a single SDL document consumed by Mercurius. [SOLID:SRP] Loading only.
 */

import { mergeTypeDefs } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";
import { print } from "graphql";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const typesArray = loadFilesSync(__dirname, {
  extensions: ["graphql"],
  recursive: true,
});

console.log(`[schema-loader] Loaded ${typesArray.length} GraphQL schema files`);

/** Merged GraphQL SDL string (Relay-style). */
export const typeDefs: string = print(mergeTypeDefs(typesArray));

export default typeDefs;
