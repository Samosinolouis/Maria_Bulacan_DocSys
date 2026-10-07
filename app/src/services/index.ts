/**
 * Composition root - constructs the ports and one instance of every service,
 * and returns the `ServiceRegistry` the React tree provides to the hooks.
 *
 *   IGraphQLClient + IClientCache + IAuthorizationEngine
 *          |
 *          v
 *   createServices(...) -> ServiceRegistry -> React context -> hooks
 */

import { AuthorizationEngine } from '@/authz/engine';
import type { IAuthorizationEngine } from './contracts/authz';
import type { ServiceRegistry } from './contracts/registry';
import { getClientCache } from './cache';
import { FetchGraphQLClient } from './graphql/client';
import { SessionService, type SessionAuthPort } from './session/session.service';
import { RequestService } from './request.service';
import { DocumentService } from './document.service';
import { AttachmentService } from './attachment.service';
import { EventService } from './event.service';
import { VenueService } from './venue.service';
import { NotificationService } from './notification.service';
import { RoleService, UserService } from './user.service';
import { LookupService, ReportService } from './report.service';
import { FolderService } from './folder.service';

export interface ServicesBundle {
  registry: ServiceRegistry;
  authz: AuthorizationEngine;
  session: SessionService;
}

/**
 * Build the registry. `auth` is the NextAuth adapter supplied by the provider;
 * the session service owns the token the GraphQL client attaches.
 */
export function createServices(auth: SessionAuthPort): ServicesBundle {
  const cache = getClientCache();
  const authz: IAuthorizationEngine = new AuthorizationEngine();
  const engine = authz as AuthorizationEngine;

  // One transport instance, reading the token through the session service, and
  // able to re-run the OIDC refresh-token grant when a request comes back
  // UNAUTHENTICATED (the token expired while the tab stayed open).
  const gql: FetchGraphQLClient = new FetchGraphQLClient(
    () => session.getAccessToken(),
    undefined,
    () => session.refresh(),
  );
  const session: SessionService = new SessionService(gql, auth);

  const registry: ServiceRegistry = {
    session,
    authz,
    requests: new RequestService(gql, cache, authz),
    documents: new DocumentService(gql, cache, authz),
    attachments: new AttachmentService(gql, cache, authz, () => session.getAccessToken()),
    events: new EventService(gql, cache, authz),
    venues: new VenueService(gql, cache, authz),
    notifications: new NotificationService(gql, cache, authz),
    users: new UserService(gql, cache, authz),
    roles: new RoleService(gql, cache, authz),
    reports: new ReportService(gql, cache, authz),
    lookups: new LookupService(gql, cache, authz),
    folders: new FolderService(gql, cache, authz),
  };

  return { registry, authz: engine, session };
}

export { FetchGraphQLClient };
