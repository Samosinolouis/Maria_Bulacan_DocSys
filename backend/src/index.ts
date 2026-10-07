/**
 * Application Entry Point
 *
 * Boots the Fastify + Mercurius GraphQL server.
 */

import { config } from "./config/index.js";
import { buildServer, startSlaAlertScheduler } from "./server.js";

async function main() {
  const app = await buildServer();

  try {
    const address = await app.listen({ port: config.port, host: config.host });
    console.log(`Santa Maria Bulacan DMS API running at ${address}/graphql`);
    startSlaAlertScheduler();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
