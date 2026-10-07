/**
 * RequestService - Step 1 (reception/encode) and Step 2 (screening).
 * Contract: IRequestService. Enforcement is client-side UX; the backend is
 * the authority (NFR-07).
 */

import { authorizeOrThrow } from '@/authz/authorize';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { Connection, ConnectionArgs } from './contracts/common';
import type { IGraphQLClient } from './contracts/graphql';
import type { Request, RequestType } from './contracts/models';
import type {
  EncodeRequestInput,
  IRequestService,
  RequestFilter,
  ScreenRequestInput,
} from './contracts/request';
import type { RequestSortField } from './contracts/models';
import type { MutationAnswer } from './contracts/mutation';
import {
  executeQueryWithCache,
  generateGetCacheKey,
  generateListCacheKey,
  invalidateChangedEntities,
  TTL,
} from './cache/helpers';
import { REQUEST_OPS } from './graphql/request.ops';
import { mapConnection, normalizeRequest } from './shared/normalize';

export class RequestService implements IRequestService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async getById(id: string): Promise<Request | null> {
    authorizeOrThrow(this.authz, 'RequestService:Read');
    return executeQueryWithCache<Request | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('request', id),
      entities: ['Request'],
      queryType: 'get',
      ttlMs: TTL.OPERATIONAL,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ request: Request | null }>({
            document: REQUEST_OPS.get,
            variables: { id },
            operationName: 'Request',
          })
          .then((d) => (d.request ? normalizeRequest(d.request as unknown as Record<string, unknown>) : null)),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as Request) : null),
    });
  }

  async getByControlNo(controlNo: string): Promise<Request | null> {
    authorizeOrThrow(this.authz, 'RequestService:Read');
    return executeQueryWithCache<Request | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('request', `control:${controlNo}`),
      entities: ['Request'],
      queryType: 'get',
      ttlMs: TTL.OPERATIONAL,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ requestByControlNo: Request | null }>({
            document: REQUEST_OPS.getByControlNo,
            variables: { controlNo },
            operationName: 'RequestByControlNo',
          })
          .then((d) =>
            d.requestByControlNo
              ? normalizeRequest(d.requestByControlNo as unknown as Record<string, unknown>)
              : null,
          ),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as Request) : null),
    });
  }

  async list(args: ConnectionArgs<RequestFilter, RequestSortField>): Promise<Connection<Request>> {
    authorizeOrThrow(this.authz, 'RequestService:Read');
    const filter = args.filter ?? null;
    return executeQueryWithCache<Connection<Request>>({
      cache: this.cache,
      queryKey: generateListCacheKey('request', args as Record<string, unknown>),
      entities: ['Request'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: (entity) => {
        const req = entity as Request;
        if (!filter?.status) return true;
        return req.status === filter.status;
      },
      queryFn: () =>
        this.gql
          .request<{ requests: Connection<Request> }>({
            document: REQUEST_OPS.list,
            variables: { ...args },
            operationName: 'Requests',
          })
          .then((d) => mapConnection(d.requests, (n) => normalizeRequest(n as unknown as Record<string, unknown>))),
      extract: (conn) => ({ items: conn.edges.map((e) => e.node), endCursor: conn.pageInfo.endCursor }),
      rehydrate: (items, endCursor) => ({
        edges: items.map((node) => ({ node: node as Request, cursor: (node as Request).id })),
        pageInfo: {
          hasNextPage: endCursor !== null,
          hasPreviousPage: false,
          startCursor: items.length ? (items[0] as Request).id : null,
          endCursor,
          totalCount: items.length,
        },
      }),
    });
  }

  async listTypes(includeInactive = false): Promise<RequestType[]> {
    authorizeOrThrow(this.authz, 'RequestService:Read');
    return executeQueryWithCache<RequestType[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('requestType', { includeInactive }),
      entities: ['RequestType'],
      queryType: 'list',
      ttlMs: TTL.REFERENCE,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ requestTypes: RequestType[] }>({
            document: REQUEST_OPS.listTypes,
            variables: { includeInactive },
            operationName: 'RequestTypes',
          })
          .then((d) => d.requestTypes),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as RequestType[],
    });
  }

  async encode(input: EncodeRequestInput): Promise<Request> {
    authorizeOrThrow(this.authz, 'RequestService:Encode');
    const payload = await this.gql.request<{
      encodeRequest: MutationAnswer<'request', Request>;
    }>({
      document: REQUEST_OPS.encode,
      variables: { input },
      operationName: 'EncodeRequest',
    });
    invalidateChangedEntities(this.cache, payload.encodeRequest.changedEntities);
    return normalizeRequest(payload.encodeRequest.request as unknown as Record<string, unknown>);
  }

  async screen(input: ScreenRequestInput): Promise<Request> {
    const current = await this.getById(input.requestId);
    authorizeOrThrow(this.authz, 'RequestService:Screen', {
      kind: 'request',
      attributes: { status: current?.status },
    });
    const payload = await this.gql.request<{
      screenRequest: MutationAnswer<'request', Request>;
    }>({
      document: REQUEST_OPS.screen,
      variables: { input },
      operationName: 'ScreenRequest',
    });
    invalidateChangedEntities(this.cache, payload.screenRequest.changedEntities);
    return normalizeRequest(payload.screenRequest.request as unknown as Record<string, unknown>);
  }

  async resubmit(requestId: string): Promise<Request> {
    const current = await this.getById(requestId);
    authorizeOrThrow(this.authz, 'RequestService:Screen', {
      kind: 'request',
      attributes: { status: current?.status },
    });
    const payload = await this.gql.request<{
      resubmitRequest: MutationAnswer<'request', Request>;
    }>({
      document: REQUEST_OPS.resubmit,
      variables: { id: requestId },
      operationName: 'ResubmitRequest',
    });
    invalidateChangedEntities(this.cache, payload.resubmitRequest.changedEntities);
    return normalizeRequest(payload.resubmitRequest.request as unknown as Record<string, unknown>);
  }
}
