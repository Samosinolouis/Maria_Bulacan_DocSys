/**
 * DataLoader Factory (N+1 prevention)
 *
 * Created per-request and stored in the GraphQL context. Batches lookups so a
 * list of N parents resolves its relation in ONE query instead of N.
 */

import DataLoader from "dataloader";

import type { IUserService } from "../interfaces/user.service.interface.js";
import type { IRequestService } from "../interfaces/request.service.interface.js";
import type { IDocumentService } from "../interfaces/document.service.interface.js";
import type { IEventService } from "../interfaces/event.service.interface.js";
import type { UserRecord } from "../interfaces/user.repository.interface.js";
import type { RequestRecord } from "../interfaces/request.repository.interface.js";
import type { DocumentRecord } from "../interfaces/document.repository.interface.js";
import type { EventRecord } from "../interfaces/event.repository.interface.js";

export interface DataLoaders {
  userById: DataLoader<string, UserRecord | null>;
  requestById: DataLoader<string, RequestRecord | null>;
  documentById: DataLoader<string, DocumentRecord | null>;
  eventById: DataLoader<string, EventRecord | null>;
}

export interface DataLoaderServices {
  user: IUserService;
  request: IRequestService;
  document: IDocumentService;
  event: IEventService;
}

export function createDataLoaders(services: DataLoaderServices): DataLoaders {
  return {
    userById: new DataLoader(async (ids: readonly string[]) => {
      const rows = await services.user.getByIds([...ids]);
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),

    requestById: new DataLoader(async (ids: readonly string[]) => {
      const rows = await Promise.all(ids.map((id) => services.request.getById(id)));
      return rows;
    }),

    documentById: new DataLoader(async (ids: readonly string[]) => {
      const rows = await Promise.all(ids.map((id) => services.document.getById(id)));
      return rows;
    }),

    eventById: new DataLoader(async (ids: readonly string[]) => {
      const rows = await services.event.getByIds([...ids]);
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
  };
}
