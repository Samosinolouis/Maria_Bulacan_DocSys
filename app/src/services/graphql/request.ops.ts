/** Request aggregate operations (Steps 1-2). */

import { PAGE_INFO_FIELDS, REQUEST_BASE_FIELDS, REQUEST_FULL_FIELDS, REQUEST_TYPE_FIELDS } from './fields';

export const REQUEST_OPS = {
  get: `query Request($id: ID!) { request(id: $id) { ${REQUEST_FULL_FIELDS} } }`,
  getByControlNo: `query RequestByControlNo($controlNo: String!) {
    requestByControlNo(controlNo: $controlNo) { ${REQUEST_FULL_FIELDS} }
  }`,
  list: `query Requests($first: Int, $after: String, $search: String, $filter: RequestFilterInput, $sort: RequestSortInput) {
    requests(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges { node { ${REQUEST_BASE_FIELDS} } cursor }
      pageInfo { ${PAGE_INFO_FIELDS} }
    }
  }`,
  listTypes: `query RequestTypes($includeInactive: Boolean) {
    requestTypes(includeInactive: $includeInactive) { ${REQUEST_TYPE_FIELDS} }
  }`,
  encode: `mutation EncodeRequest($input: EncodeRequestInput!) {
    encodeRequest(input: $input) { changedEntities request { ${REQUEST_FULL_FIELDS} } }
  }`,
  screen: `mutation ScreenRequest($input: ScreenRequestInput!) {
    screenRequest(input: $input) { changedEntities request { ${REQUEST_FULL_FIELDS} } }
  }`,
  resubmit: `mutation ResubmitRequest($id: ID!) {
    resubmitRequest(id: $id) { changedEntities request { ${REQUEST_FULL_FIELDS} } }
  }`,
};
