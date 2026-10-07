/**
 * Fastify + Mercurius Bootstrap (Composition Root)
 *
 * Wires: Fastify (HTTP) -> Mercurius (GraphQL) -> Context (DI) -> Services -> DB,
 * plus the external ports (Keycloak IdP, MinIO object storage) and the
 * non-GraphQL HTTP routes (health, multipart uploads).
 *
 * [SOLID:SRP] Bootstrap only - no business logic.
 * [SOLID:DIP] The context injects interfaces, not concrete classes.
 * [OWASP:A07] Bearer token verified per-request via IIdentityProviderPort.
 */

import Fastify from "fastify";
import mercurius from "mercurius";
import cors from "@fastify/cors";

import { config } from "./config/index.js";
import { typeDefs } from "./graphql/schema-loader.js";
import { resolvers } from "./graphql/resolvers.js";
import { type GraphQLContext } from "./graphql/context.js";
import { createDataLoaders } from "./graphql/dataloaders.js";

// Infrastructure
import {
  ConsoleTelemetryService,
  NoOpTelemetryService,
  type ITelemetryPort,
} from "./infrastructure/telemetry/index.js";
import {
  InMemoryCacheService,
  NoOpCacheService,
  type ICachePort,
} from "./infrastructure/cache/index.js";

// Ports (external system abstractions)
import type { IIdentityProviderPort } from "./ports/idp.port.interface.js";
import type { IObjectStoragePort } from "./ports/storage.port.interface.js";

// Adapters (port implementations)
import { KeycloakIdpAdapter } from "./adapters/identity/keycloak-idp.adapter.js";
import { MinioObjectStorageAdapter } from "./adapters/storage/minio-storage.adapter.js";

// Unit of Work / database
import { database } from "./uow.js";
import type { IDatabase } from "./interfaces/uow.interface.js";

// Services
import { UserService } from "./services/user/user.service.js";
import { RoleService } from "./services/role/role.service.js";
import { NotificationService } from "./services/notification/notification.service.js";
import { RequestService } from "./services/request/request.service.js";
import { DocumentService } from "./services/document/document.service.js";
import { FolderService } from "./services/folder/folder.service.js";
import { AttachmentService } from "./services/attachment/attachment.service.js";
import { ReportService } from "./services/report/report.service.js";
import { LookupService } from "./services/lookup/lookup.service.js";
import { EventService } from "./services/event/event.service.js";
import { VenueService } from "./services/venue/venue.service.js";

// Routes
import { healthRoutes } from "./routes/health.route.js";
import { registerUploadRoutes } from "./routes/upload.route.js";

// ============================================
// Infrastructure factories
// ============================================

function createTelemetryPort(): ITelemetryPort {
  if (config.nodeEnv === "test" || !config.features.telemetry) {
    return new NoOpTelemetryService();
  }
  return new ConsoleTelemetryService("docsys-api");
}

function createCachePort(): ICachePort {
  if (config.nodeEnv === "test" || !config.features.cache) {
    return new NoOpCacheService();
  }
  return new InMemoryCacheService();
}

// ============================================
// Composition Root
// ============================================

/** External ports (single instances shared across requests). */
const idpPort: IIdentityProviderPort = new KeycloakIdpAdapter();
const storagePort: IObjectStoragePort = new MinioObjectStorageAdapter();

/** Infrastructure. */
const telemetryPort = createTelemetryPort();
const cachePort = createCachePort();

/** Database with Unit of Work support. */
const db: IDatabase = database;

/** Services (constructor injection; depend on abstractions). */
const notificationService = new NotificationService(db, telemetryPort);
const userService = new UserService(db, idpPort, telemetryPort, cachePort);
const roleService = new RoleService(db, telemetryPort);
const lookupService = new LookupService(db, telemetryPort);
const requestService = new RequestService(db, telemetryPort, notificationService);
const documentService = new DocumentService(db, telemetryPort, notificationService);
const folderService = new FolderService(db, telemetryPort);
const attachmentService = new AttachmentService(db, telemetryPort, storagePort);
const reportService = new ReportService(db, telemetryPort);
const eventService = new EventService(db, telemetryPort, notificationService);
const venueService = new VenueService(db, telemetryPort);

// ============================================
// Server bootstrap
// ============================================

export async function buildServer() {
  const app = Fastify({ logger: true });

  // Browser access from the frontend origins (dev: http://localhost:3000).
  await app.register(cors, {
    origin: config.cors.origins,
    methods: ["GET", "POST", "OPTIONS"],
  });

  await app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    // Interactive explorer (dev only).
    graphiql: config.nodeEnv !== "production",
    context: async (request, _reply): Promise<GraphQLContext> => {
      let user: GraphQLContext["user"] = null;

      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        try {
          user = await idpPort.verifyToken(token);
        } catch {
          // Invalid token - continue unauthenticated; guarded resolvers throw.
        }
      }

      return {
        user,
        services: {
          user: userService,
          role: roleService,
          notification: notificationService,
          request: requestService,
          document: documentService,
          folder: folderService,
          attachment: attachmentService,
          report: reportService,
          lookup: lookupService,
          event: eventService,
          venue: venueService,
          auth: idpPort,
        },
        telemetry: telemetryPort,
        cache: cachePort,
        dataloaders: createDataLoaders({
          user: userService,
          request: requestService,
          document: documentService,
          event: eventService,
          venue: venueService,
        }),
      };
    },
  });

  // Non-GraphQL HTTP routes
  await app.register(healthRoutes);
  await registerUploadRoutes(app, { attachmentService, idp: idpPort });

  return app;
}

/**
 * In-process SLA alert scheduler (FR-38). Runs hourly; generateSlaAlerts is
 * idempotent per (user, request, alert type), so restarts never duplicate
 * rows. Returns a stop function.
 */
export function startSlaAlertScheduler(): () => void {
  const intervalMs = 60 * 60 * 1000;
  const timer = setInterval(() => {
    void notificationService.generateSlaAlerts().catch((error) => {
      telemetryPort.trackError(
        error instanceof Error ? error : new Error(String(error)),
        { operation: "scheduler.slaAlerts" },
      );
    });
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
