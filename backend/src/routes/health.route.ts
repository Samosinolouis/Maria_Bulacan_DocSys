/**
 * Health Check Route (non-GraphQL HTTP)
 *
 * GET /health -> 200 { status: "ok", ... }
 * GET / -> 200 (Azure App Service warmup ping)
 * GET /robots933456.txt -> 200 (Azure App Service health probe)
 */

import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  const handler = async () => ({
    status: "ok",
    service: "maria-bulacan-docsys",
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });

  app.get("/", handler);
  app.get("/health", handler);
  app.get("/robots933456.txt", async () => "");
}
