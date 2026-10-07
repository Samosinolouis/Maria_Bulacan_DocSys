/** Document aggregate operations (Steps 3-6). */

import {
  DOCUMENT_DISPATCH_FIELDS,
  DOCUMENT_FULL_FIELDS,
  DOCUMENT_LIST_FIELDS,
  DOCUMENT_TYPE_FIELDS,
  PAGE_INFO_FIELDS,
} from './fields';

export const DOCUMENT_OPS = {
  get: `query Document($id: ID!) { document(id: $id) { ${DOCUMENT_FULL_FIELDS} } }`,
  getByControlNo: `query DocumentByControlNo($controlNo: String!) {
    documentByControlNo(controlNo: $controlNo) { ${DOCUMENT_FULL_FIELDS} }
  }`,
  list: `query Documents($first: Int, $after: String, $search: String, $filter: DocumentFilterInput, $sort: DocumentSortInput) {
    documents(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges { node { ${DOCUMENT_LIST_FIELDS} } cursor }
      pageInfo { ${PAGE_INFO_FIELDS} }
    }
  }`,
  /**
   * Dispatch desk read: same connection as `list`, plus the transmission
   * records the desk filters on.
   */
  listForDispatch: `query DocumentsForDispatch($first: Int, $after: String, $search: String, $filter: DocumentFilterInput, $sort: DocumentSortInput) {
    documents(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges { node { ${DOCUMENT_DISPATCH_FIELDS} } cursor }
      pageInfo { ${PAGE_INFO_FIELDS} }
    }
  }`,
  listTypes: `query DocumentTypes($includeInactive: Boolean) {
    documentTypes(includeInactive: $includeInactive) { ${DOCUMENT_TYPE_FIELDS} }
  }`,
  prepare: `mutation PrepareDocument($input: PrepareDocumentInput!) {
    prepareDocument(input: $input) { changedEntities document { ${DOCUMENT_FULL_FIELDS} } }
  }`,
  submitForReview: `mutation SubmitDocumentForReview($id: ID!) {
    submitDocumentForReview(id: $id) { changedEntities document { ${DOCUMENT_FULL_FIELDS} } }
  }`,
  review: `mutation ReviewDocument($input: ReviewDocumentInput!) {
    reviewDocument(input: $input) { changedEntities document { ${DOCUMENT_FULL_FIELDS} } }
  }`,
  sign: `mutation SignDocument($input: SignDocumentInput!) {
    signDocument(input: $input) { changedEntities document { ${DOCUMENT_FULL_FIELDS} } }
  }`,
  transmit: `mutation TransmitDocument($input: TransmitDocumentInput!) {
    transmitDocument(input: $input) { changedEntities document { ${DOCUMENT_FULL_FIELDS} } }
  }`,
  close: `mutation CloseRequest($input: CloseRequestInput!) {
    closeRequest(input: $input) { changedEntities document { ${DOCUMENT_FULL_FIELDS} } }
  }`,
};
