/**
 * Health Check Route (non-GraphQL HTTP)
 *
 * GET /health -> 200 { status: "ok", ... }
 */

import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    service: "maria-bulacan-docsys",
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  }));
}
