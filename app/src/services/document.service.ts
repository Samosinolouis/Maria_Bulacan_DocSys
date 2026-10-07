/**
 * DocumentService - Steps 3-6 (preparation, review/sign, transmission, close).
 * Contract: IDocumentService.
 */

import { AppError } from './contracts/errors';
import { authorizeOrThrow } from '@/authz/authorize';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { Connection, ConnectionArgs } from './contracts/common';
import type {
  CloseRequestInput,
  DocumentFilter,
  IDocumentService,
  PrepareDocumentInput,
  ReviewDocumentInput,
  SignDocumentInput,
  TransmitDocumentInput,
} from './contracts/document';
import type { IGraphQLClient } from './contracts/graphql';
import type { Document, DocumentSortField, DocumentType } from './contracts/models';
import type { MutationAnswer } from './contracts/mutation';
import {
  executeQueryWithCache,
  generateGetCacheKey,
  generateListCacheKey,
  invalidateChangedEntities,
  TTL,
} from './cache/helpers';
import { DOCUMENT_OPS } from './graphql/document.ops';
import { mapConnection, normalizeDocument } from './shared/normalize';

export class DocumentService implements IDocumentService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async getById(id: string): Promise<Document | null> {
    authorizeOrThrow(this.authz, 'DocumentService:Read');
    return executeQueryWithCache<Document | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('document', id),
      entities: ['Document'],
      queryType: 'get',
      ttlMs: TTL.OPERATIONAL,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ document: Document | null }>({
            document: DOCUMENT_OPS.get,
            variables: { id },
            operationName: 'Document',
          })
          .then((d) => (d.document ? normalizeDocument(d.document as unknown as Record<string, unknown>) : null)),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as Document) : null),
    });
  }

  async getByControlNo(controlNo: string): Promise<Document | null> {
    authorizeOrThrow(this.authz, 'DocumentService:Read');
    return executeQueryWithCache<Document | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('document', `control:${controlNo}`),
      entities: ['Document'],
      queryType: 'get',
      ttlMs: TTL.OPERATIONAL,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ documentByControlNo: Document | null }>({
            document: DOCUMENT_OPS.getByControlNo,
            variables: { controlNo },
            operationName: 'DocumentByControlNo',
          })
          .then((d) =>
            d.documentByControlNo
              ? normalizeDocument(d.documentByControlNo as unknown as Record<string, unknown>)
              : null,
          ),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as Document) : null),
    });
  }

  async list(args: ConnectionArgs<DocumentFilter, DocumentSortField>): Promise<Connection<Document>> {
    authorizeOrThrow(this.authz, 'DocumentService:Read');
    const filter = args.filter ?? null;
    return executeQueryWithCache<Connection<Document>>({
      cache: this.cache,
      queryKey: generateListCacheKey('document', args as Record<string, unknown>),
      entities: ['Document'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: (entity) => {
        const doc = entity as Document;
        if (filter?.status && doc.status !== filter.status) return false;
        if (filter?.requestId && doc.requestId !== filter.requestId) return false;
        if (filter?.folderId && doc.folderId !== filter.folderId) return false;
        return true;
      },
      queryFn: () =>
        this.gql
          .request<{ documents: Connection<Document> }>({
            document: DOCUMENT_OPS.list,
            variables: { ...args },
            operationName: 'Documents',
          })
          .then((d) => mapConnection(d.documents, (n) => normalizeDocument(n as unknown as Record<string, unknown>))),
      extract: (conn) => ({ items: conn.edges.map((e) => e.node), endCursor: conn.pageInfo.endCursor }),
      rehydrate: (items, endCursor) => ({
        edges: items.map((node) => ({ node: node as Document, cursor: (node as Document).id })),
        pageInfo: {
          hasNextPage: endCursor !== null,
          hasPreviousPage: false,
          startCursor: items.length ? (items[0] as Document).id : null,
          endCursor,
          totalCount: items.length,
        },
      }),
    });
  }

  async listByRequest(requestId: string): Promise<Document[]> {
    const conn = await this.list({ first: 100, filter: { requestId } });
    return conn.edges.map((e) => e.node);
  }

  /**
   * Dispatch desk read (FR-26..28). Identical to `list`, except each row also
   * carries its transmission records so the desk can drop a document once a
   * transmission is recorded. Cached under its own key.
   */
  async listForDispatch(
    args: ConnectionArgs<DocumentFilter, DocumentSortField>,
  ): Promise<Connection<Document>> {
    authorizeOrThrow(this.authz, 'DocumentService:Read');
    const filter = args.filter ?? null;
    return executeQueryWithCache<Connection<Document>>({
      cache: this.cache,
      queryKey: generateListCacheKey('documentDispatch', args as Record<string, unknown>),
      entities: ['Document'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: (entity) => {
        const doc = entity as Document;
        if (filter?.status && doc.status !== filter.status) return false;
        if (filter?.requestId && doc.requestId !== filter.requestId) return false;
        return true;
      },
      queryFn: () =>
        this.gql
          .request<{ documents: Connection<Document> }>({
            document: DOCUMENT_OPS.listForDispatch,
            variables: { ...args },
            operationName: 'DocumentsForDispatch',
          })
          .then((d) => mapConnection(d.documents, (n) => normalizeDocument(n as unknown as Record<string, unknown>))),
      extract: (conn) => ({ items: conn.edges.map((e) => e.node), endCursor: conn.pageInfo.endCursor }),
      rehydrate: (items, endCursor) => {
        // The entity store is shared with the plain `list`, which selects no
        // transmissions: a row cached by that read must not be reported as
        // awaiting dispatch, so force a miss instead.
        const complete = items.every((item) => Array.isArray((item as Document).transmissions));
        if (!complete) return undefined;
        return {
          edges: items.map((node) => ({ node: node as Document, cursor: (node as Document).id })),
          pageInfo: {
            hasNextPage: endCursor !== null,
            hasPreviousPage: false,
            startCursor: items.length ? (items[0] as Document).id : null,
            endCursor,
            totalCount: items.length,
          },
        };
      },
    });
  }

  async listTypes(includeInactive = false): Promise<DocumentType[]> {
    authorizeOrThrow(this.authz, 'DocumentService:Read');
    return executeQueryWithCache<DocumentType[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('documentType', { includeInactive }),
      entities: ['DocumentType'],
      queryType: 'list',
      ttlMs: TTL.REFERENCE,
      matchFn: () => true,
      queryFn: () =>
        this.gql
          .request<{ documentTypes: DocumentType[] }>({
            document: DOCUMENT_OPS.listTypes,
            variables: { includeInactive },
            operationName: 'DocumentTypes',
          })
          .then((d) => d.documentTypes),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as DocumentType[],
    });
  }

  async prepare(input: PrepareDocumentInput): Promise<Document> {
    authorizeOrThrow(
      this.authz,
      input.requestId ? 'DocumentService:Prepare' : 'DocumentService:CreateStandalone',
    );
    const payload = await this.gql.request<{
      prepareDocument: MutationAnswer<'document', Document>;
    }>({
      document: DOCUMENT_OPS.prepare,
      variables: { input },
      operationName: 'PrepareDocument',
    });
    invalidateChangedEntities(this.cache, payload.prepareDocument.changedEntities);
    return normalizeDocument(payload.prepareDocument.document as unknown as Record<string, unknown>);
  }

  async submitForReview(documentId: string): Promise<Document> {
    const current = await this.getById(documentId);
    authorizeOrThrow(this.authz, 'DocumentService:Prepare', {
      kind: 'document',
      attributes: { status: current?.status },
    });
    const payload = await this.gql.request<{
      submitDocumentForReview: MutationAnswer<'document', Document>;
    }>({
      document: DOCUMENT_OPS.submitForReview,
      variables: { id: documentId },
      operationName: 'SubmitDocumentForReview',
    });
    invalidateChangedEntities(this.cache, payload.submitDocumentForReview.changedEntities);
    return normalizeDocument(
      payload.submitDocumentForReview.document as unknown as Record<string, unknown>,
    );
  }

  async review(input: ReviewDocumentInput): Promise<Document> {
    if (input.decision === 'DENIED' && !input.denialReason?.trim()) {
      throw new AppError('VALIDATION', 'A denial must state written grounds.');
    }
    const current = await this.getById(input.documentId);
    authorizeOrThrow(this.authz, 'DocumentService:Review', {
      kind: 'document',
      attributes: { status: current?.status },
    });
    const payload = await this.gql.request<{
      reviewDocument: MutationAnswer<'document', Document>;
    }>({
      document: DOCUMENT_OPS.review,
      variables: { input },
      operationName: 'ReviewDocument',
    });
    invalidateChangedEntities(this.cache, payload.reviewDocument.changedEntities);
    return normalizeDocument(payload.reviewDocument.document as unknown as Record<string, unknown>);
  }

  async sign(input: SignDocumentInput): Promise<Document> {
    const current = await this.getById(input.documentId);
    authorizeOrThrow(this.authz, 'DocumentService:Sign', {
      kind: 'document',
      attributes: { status: current?.status, signatoryRequired: current?.signatoryRequired },
    });
    const payload = await this.gql.request<{
      signDocument: MutationAnswer<'document', Document>;
    }>({
      document: DOCUMENT_OPS.sign,
      variables: { input },
      operationName: 'SignDocument',
    });
    invalidateChangedEntities(this.cache, payload.signDocument.changedEntities);
    return normalizeDocument(payload.signDocument.document as unknown as Record<string, unknown>);
  }

  async transmit(input: TransmitDocumentInput): Promise<Document> {
    const current = await this.getById(input.documentId);
    authorizeOrThrow(this.authz, 'DocumentService:Transmit', {
      kind: 'document',
      attributes: { status: current?.status },
    });
    const payload = await this.gql.request<{
      transmitDocument: MutationAnswer<'document', Document>;
    }>({
      document: DOCUMENT_OPS.transmit,
      variables: { input },
      operationName: 'TransmitDocument',
    });
    invalidateChangedEntities(this.cache, payload.transmitDocument.changedEntities);
    return normalizeDocument(payload.transmitDocument.document as unknown as Record<string, unknown>);
  }

  async close(input: CloseRequestInput): Promise<Document> {
    // Load the request to evaluate the close guard (the mutation itself reports
    // everything it changed in `changedEntities`).
    const request = await this.gql
      .request<{ request: { id: string; status: string } | null }>({
        document: `query RequestForClose($id: ID!) { request(id: $id) { id status } }`,
        variables: { id: input.requestId },
        operationName: 'RequestForClose',
      })
      .then((d) => d.request);

    authorizeOrThrow(this.authz, 'DocumentService:Close', {
      kind: 'request',
      attributes: { status: request?.status },
    });

    const payload = await this.gql.request<{
      closeRequest: MutationAnswer<'document', Document>;
    }>({
      document: DOCUMENT_OPS.close,
      variables: { input },
      operationName: 'CloseRequest',
    });

    invalidateChangedEntities(this.cache, payload.closeRequest.changedEntities);
    return normalizeDocument(payload.closeRequest.document as unknown as Record<string, unknown>);
  }
}
