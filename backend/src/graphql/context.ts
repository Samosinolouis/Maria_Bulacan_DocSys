/**
 * GraphQL Context Type
 *
 * Shape of the context available in every resolver. Provides interfaces -
 * never concrete implementations. [SOLID:DIP]
 */

import type { AuthUser, IIdentityProviderPort } from "../ports/idp.port.interface.js";
import { AuthenticationError } from "../errors/index.js";
import type { ITelemetryPort } from "../infrastructure/telemetry/telemetry.interface.js";
import type { ICachePort } from "../infrastructure/cache/cache.interface.js";
import type { IUserService } from "../interfaces/user.service.interface.js";
import type { IRoleService } from "../interfaces/role.service.interface.js";
import type { INotificationService } from "../interfaces/notification.service.interface.js";
import type { IRequestService } from "../interfaces/request.service.interface.js";
import type { IDocumentService } from "../interfaces/document.service.interface.js";
import type { IAttachmentService } from "../interfaces/attachment.service.interface.js";
import type { IFolderService } from "../interfaces/folder.service.interface.js";
import type { IReportService } from "../interfaces/report.service.interface.js";
import type { ILookupService } from "../interfaces/lookup.service.interface.js";
import type { IEventService, IVenueService } from "../interfaces/event.service.interface.js";
import type { DataLoaders } from "./dataloaders.js";

export interface GraphQLContext {
  /** Authenticated user (null if unauthenticated). */
  user: AuthUser | null;

  /** Business services - resolvers depend on these interfaces only. */
  services: {
    user: IUserService;
    role: IRoleService;
    notification: INotificationService;
    request: IRequestService;
    document: IDocumentService;
    attachment: IAttachmentService;
    folder: IFolderService;
    report: IReportService;
    lookup: ILookupService;
    event: IEventService;
    venue: IVenueService;
    auth: IIdentityProviderPort;
  };

  /** Observability. */
  telemetry: ITelemetryPort;
  /** Caching. */
  cache: ICachePort;
  /** Per-request DataLoaders (N+1 prevention). */
  dataloaders: DataLoaders;
}

/** Extract the authenticated user id or throw AuthenticationError. */
export function requireUser(ctx: GraphQLContext): AuthUser {
  if (!ctx.user) {
    throw new AuthenticationError();
  }
  return ctx.user;
}
