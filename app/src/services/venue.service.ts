/**
 * VenueService - booking-module venue lookup (FR-41).
 */

import { authorizeOrThrow } from '@/authz/authorize';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { IGraphQLClient } from './contracts/graphql';
import type { Venue } from './contracts/models';
import type { IVenueService, CreateVenueInput, UpdateVenueInput } from './contracts/event';
import type { MutationAnswer } from './contracts/mutation';
import {
  executeQueryWithCache,
  generateGetCacheKey,
  generateListCacheKey,
  invalidateChangedEntities,
  TTL,
} from './cache/helpers';
import { VENUE_OPS } from './graphql/event.ops';

export class VenueService implements IVenueService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async getById(id: string): Promise<Venue | null> {
    authorizeOrThrow(this.authz, 'VenueService:Read');
    return executeQueryWithCache<Venue | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('venue', id),
      entities: ['Venue'],
      queryType: 'get',
      ttlMs: TTL.LIVE,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ venue: Venue | null }>({
            document: VENUE_OPS.get,
            variables: { id },
            operationName: 'Venue',
          })
          .then((d) => d.venue),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as Venue) : null),
    });
  }

  async list(includeInactive = false): Promise<Venue[]> {
    authorizeOrThrow(this.authz, 'VenueService:Read');
    return executeQueryWithCache<Venue[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('venue', { includeInactive }),
      entities: ['Venue'],
      queryType: 'list',
      ttlMs: TTL.LIVE,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ venues: Venue[] }>({
            document: VENUE_OPS.list,
            variables: { includeInactive },
            operationName: 'Venues',
          })
          .then((d) => d.venues),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as Venue[],
    });
  }

  async create(input: CreateVenueInput): Promise<Venue> {
    authorizeOrThrow(this.authz, 'VenueService:Manage');
    const payload = await this.gql.request<{ createVenue: MutationAnswer<'venue', Venue> }>({
      document: VENUE_OPS.create,
      variables: { input },
      operationName: 'CreateVenue',
    });
    invalidateChangedEntities(this.cache, payload.createVenue.changedEntities);
    return payload.createVenue.venue;
  }

  async update(input: UpdateVenueInput): Promise<Venue> {
    authorizeOrThrow(this.authz, 'VenueService:Manage');
    const payload = await this.gql.request<{ updateVenue: MutationAnswer<'venue', Venue> }>({
      document: VENUE_OPS.update,
      variables: { input },
      operationName: 'UpdateVenue',
    });
    invalidateChangedEntities(this.cache, payload.updateVenue.changedEntities);
    return payload.updateVenue.venue;
  }
}
