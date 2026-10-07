/**
 * Service registry - the composition-root contract. Hooks read services from
 * this registry only.
 */

import type { IAuthorizationEngine } from './authz';
import type { ISessionService } from './session';
import type { IRequestService } from './request';
import type { IDocumentService } from './document';
import type { IAttachmentService } from './attachment';
import type { IEventService, IVenueService } from './event';
import type { INotificationService } from './notification';
import type { IUserService, IRoleService } from './user';
import type { IReportService, ILookupService, IFolderService } from './report';

export interface ServiceRegistry {
  session: ISessionService;
  authz: IAuthorizationEngine;
  requests: IRequestService;
  documents: IDocumentService;
  attachments: IAttachmentService;
  events: IEventService;
  venues: IVenueService;
  notifications: INotificationService;
  users: IUserService;
  roles: IRoleService;
  reports: IReportService;
  lookups: ILookupService;
  folders: IFolderService;
}
