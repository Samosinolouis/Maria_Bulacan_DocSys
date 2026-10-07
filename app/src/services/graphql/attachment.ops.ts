/** Attachment reads and presigned downloads (uploads are REST). */

import { DOCUMENT_ATTACHMENT_FIELDS, REQUEST_ATTACHMENT_FIELDS } from './fields';

export const ATTACHMENT_OPS = {
  listRequestAttachments: `query RequestAttachments($requestId: ID!) {
    requestAttachments(requestId: $requestId) { ${REQUEST_ATTACHMENT_FIELDS} }
  }`,
  listDocumentAttachments: `query DocumentAttachments($documentId: ID!) {
    documentAttachments(documentId: $documentId) { ${DOCUMENT_ATTACHMENT_FIELDS} }
  }`,
  requestDownload: `mutation RequestAttachmentDownload($id: ID!, $inline: Boolean) {
    requestAttachmentDownload(id: $id, inline: $inline) { changedEntities ticket { url expiresInSeconds fileName mimeType } }
  }`,
  documentDownload: `mutation DocumentAttachmentDownload($id: ID!, $inline: Boolean) {
    documentAttachmentDownload(id: $id, inline: $inline) { changedEntities ticket { url expiresInSeconds fileName mimeType } }
  }`,
};
