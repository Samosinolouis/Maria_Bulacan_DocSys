/**
 * Unit of Work Interfaces
 *
 * The UoW owns the transaction boundary and exposes repositories bound to a
 * single atomic operation. Services depend on IDatabase, never on a raw
 * Drizzle client or transaction object.
 *
 * Architecture:  Service -> IDatabase.transaction(uow => ...) -> Repositories -> DB
 *
 * [SOLID:DIP]  Abstractions over concrete implementations.
 * [SOLID:SRP]  Each interface has one responsibility.
 * NOTE: External systems (B2, Keycloak) are NOT transactional and never
 * participate in a UoW — they are side effects handled by services after commit.
 */

import type { IUserRepository } from "./user.repository.interface.js";
import type { IRoleRepository } from "./role.repository.interface.js";
import type { INotificationRepository } from "./notification.repository.interface.js";
import type {
  IRequestRepository,
  IRequestTypeRepository,
  IHolidayRepository,
  IControlNumberRepository,
} from "./request.repository.interface.js";
import type {
  IDocumentRepository,
  IDocumentTypeRepository,
  ITransmissionRepository,
  IDocumentLogRepository,
} from "./document.repository.interface.js";
import type {
  IRequestAttachmentRepository,
  IDocumentAttachmentRepository,
} from "./attachment.repository.interface.js";
import type {
  IVenueRepository,
  IEventRepository,
  IEventAttendeeRepository,
  IActivityLogRepository,
} from "./event.repository.interface.js";

/** Transaction-scoped repository container. */
export interface IRepositories {
  // [A] Shared platform
  users: IUserRepository;
  roles: IRoleRepository;
  notifications: INotificationRepository;

  // [B] Document module
  requests: IRequestRepository;
  requestTypes: IRequestTypeRepository;
  holidays: IHolidayRepository;
  controlNumbers: IControlNumberRepository;
  documents: IDocumentRepository;
  documentTypes: IDocumentTypeRepository;
  transmissions: ITransmissionRepository;
  documentLogs: IDocumentLogRepository;
  requestAttachments: IRequestAttachmentRepository;
  documentAttachments: IDocumentAttachmentRepository;

  // [C] Booking module
  venues: IVenueRepository;
  events: IEventRepository;
  eventAttendees: IEventAttendeeRepository;
  activityLogs: IActivityLogRepository;
}

/** Unit of Work — a repository container bound to one transaction. */
export type IUnitOfWork = IRepositories;

/** Database abstraction providing transaction capability. */
export interface IDatabase {
  /**
   * Execute operations within a transaction. All repository calls in `fn`
   * share the same transaction; a throw rolls everything back.
   */
  transaction<T>(fn: (uow: IRepositories) => Promise<T>): Promise<T>;

  /** Execute without a transaction (auto-commit) — simple reads. */
  query<T>(fn: (uow: IRepositories) => Promise<T>): Promise<T>;
}
