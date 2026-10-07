/**
 * AttachmentService - reads + presigned downloads over GraphQL; multipart
 * uploads to the REST routes `/uploads/requests/:id` and `/uploads/documents/:id`.
 */

import { authorizeOrThrow } from '@/authz/authorize';
import { AppError } from './contracts/errors';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { IGraphQLClient } from './contracts/graphql';
import type {
  DocumentAttachment,
  DownloadTicket,
  RequestAttachment,
} from './contracts/models';
import type {
  IAttachmentService,
  UploadDocumentAttachmentInput,
  UploadRequestAttachmentInput,
} from './contracts/attachment';
import type { MutationAnswer } from './contracts/mutation';
import {
  executeQueryWithCache,
  generateListCacheKey,
  invalidateChangedEntities,
  TTL,
} from './cache/helpers';
import { ATTACHMENT_OPS } from './graphql/attachment.ops';

const UPLOADS_BASE = (process.env.NEXT_PUBLIC_UPLOADS_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  '',
);

export class AttachmentService implements IAttachmentService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
    private readonly getToken: () => Promise<string | null>,
  ) {}

  async listRequestAttachments(requestId: string): Promise<RequestAttachment[]> {
    authorizeOrThrow(this.authz, 'AttachmentService:Read');
    return executeQueryWithCache<RequestAttachment[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('requestAttachment', { requestId }),
      entities: ['RequestAttachment'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ requestAttachments: RequestAttachment[] }>({
            document: ATTACHMENT_OPS.listRequestAttachments,
            variables: { requestId },
            operationName: 'RequestAttachments',
          })
          .then((d) => d.requestAttachments),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as RequestAttachment[],
    });
  }

  async listDocumentAttachments(documentId: string): Promise<DocumentAttachment[]> {
    authorizeOrThrow(this.authz, 'AttachmentService:Read');
    return executeQueryWithCache<DocumentAttachment[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('documentAttachment', { documentId }),
      entities: ['DocumentAttachment'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ documentAttachments: DocumentAttachment[] }>({
            document: ATTACHMENT_OPS.listDocumentAttachments,
            variables: { documentId },
            operationName: 'DocumentAttachments',
          })
          .then((d) => d.documentAttachments),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as DocumentAttachment[],
    });
  }

  async uploadRequestAttachment(
    input: UploadRequestAttachmentInput,
  ): Promise<RequestAttachment> {
    authorizeOrThrow(this.authz, 'AttachmentService:Upload');
    const created = await this.postMultipart<RequestAttachment>(
      `${UPLOADS_BASE}/uploads/requests/${input.requestId}`,
      input.file,
      input.kind,
    );
    // Multipart uploads go over REST, so the changed entities are derived here
    // rather than reported by the GraphQL mutation.
    invalidateChangedEntities(this.cache, [
      `Request_${input.requestId}`,
      'RequestAttachment',
    ]);
    return created;
  }

  async uploadDocumentAttachment(
    input: UploadDocumentAttachmentInput,
  ): Promise<DocumentAttachment> {
    authorizeOrThrow(this.authz, 'AttachmentService:Upload');
    const created = await this.postMultipart<DocumentAttachment>(
      `${UPLOADS_BASE}/uploads/documents/${input.documentId}`,
      input.file,
      input.kind,
    );
    invalidateChangedEntities(this.cache, [
      `Document_${input.documentId}`,
      'DocumentAttachment',
    ]);
    return created;
  }

  async getRequestAttachmentDownload(id: string, inline = false): Promise<DownloadTicket> {
    authorizeOrThrow(this.authz, 'AttachmentService:Download');
    const payload = await this.gql.request<{
      requestAttachmentDownload: MutationAnswer<'ticket', DownloadTicket>;
    }>({
      document: ATTACHMENT_OPS.requestDownload,
      variables: { id, inline },
      operationName: 'RequestAttachmentDownload',
    });
    invalidateChangedEntities(this.cache, payload.requestAttachmentDownload.changedEntities);
    return payload.requestAttachmentDownload.ticket;
  }

  async getDocumentAttachmentDownload(id: string, inline = false): Promise<DownloadTicket> {
    authorizeOrThrow(this.authz, 'AttachmentService:Download');
    const payload = await this.gql.request<{
      documentAttachmentDownload: MutationAnswer<'ticket', DownloadTicket>;
    }>({
      document: ATTACHMENT_OPS.documentDownload,
      variables: { id, inline },
      operationName: 'DocumentAttachmentDownload',
    });
    invalidateChangedEntities(this.cache, payload.documentAttachmentDownload.changedEntities);
    return payload.documentAttachmentDownload.ticket;
  }

  private async postMultipart<T>(url: string, file: File, kind: string): Promise<T> {
    const token = await this.getToken();
    const body = new FormData();
    body.append('file', file);
    body.append('kind', kind);

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
    } catch (cause) {
      throw new AppError('NETWORK', 'The upload service is unreachable.', cause);
    }
    if (!res.ok) {
      const detail = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new AppError(
        res.status === 401 || res.status === 403 ? 'FORBIDDEN' : 'VALIDATION',
        detail?.message ?? `Upload failed (HTTP ${res.status}).`,
      );
    }
    return (await res.json()) as T;
  }
}
