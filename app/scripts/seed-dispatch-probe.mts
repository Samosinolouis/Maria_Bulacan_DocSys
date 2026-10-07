/**
 * Creates one request + document and drives it up to APPROVED, so the
 * transmission desk has a genuine "awaiting dispatch" row to verify against.
 *
 * Run: ../backend/node_modules/.bin/tsx scripts/seed-dispatch-probe.mts
 * Writes real rows to the dev DB (request, document, log rows).
 */

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';
const TOKEN_URL = 'http://localhost:8080/realms/docsys/protocol/openid-connect/token';

async function token(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'docsys-app',
      username: 'administrator',
      password: 'DocSys2026!',
      scope: 'openid',
    }),
  });
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('Keycloak did not issue a token');
  return json.access_token;
}

async function gql<T>(bearer: string, query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

async function main() {
  const bearer = await token();

  const types = await gql<{ requestTypes: Array<{ id: string; code: string }> }>(
    bearer,
    `{ requestTypes(includeInactive: true) { id code } }`,
  );
  const docTypes = await gql<{ documentTypes: Array<{ id: string; code: string }> }>(
    bearer,
    `{ documentTypes(includeInactive: true) { id code } }`,
  );
  const requestTypeId = types.requestTypes[0]?.id;
  const documentTypeId = docTypes.documentTypes[0]?.id;
  if (!requestTypeId || !documentTypeId) throw new Error('No request/document type seeded');

  const encoded = await gql<{ encodeRequest: { changedEntities: string[]; request: { id: string; controlNo: string } } }>(
    bearer,
    `mutation Encode($input: EncodeRequestInput!) {
      encodeRequest(input: $input) { changedEntities request { id controlNo status } }
    }`,
    {
      input: {
        requestTypeId,
        title: 'Dispatch desk probe',
        requestingParty: 'Barangay Poblacion',
        originOffice: 'Office of the Barangay Captain',
        channel: 'WALK_IN',
        priority: 'NORMAL',
      },
    },
  );
  const requestId = encoded.encodeRequest.request.id;
  console.log('encoded', encoded.encodeRequest.request.controlNo);

  const screened = await gql<{ screenRequest: { changedEntities: string[]; request: { status: string } } }>(
    bearer,
    `mutation Screen($input: ScreenRequestInput!) {
      screenRequest(input: $input) { changedEntities request { id controlNo status } }
    }`,
    { input: { requestId, passed: true, notes: 'Probe: complete on its face.' } },
  );
  console.log('screened ->', screened.screenRequest.request.status);

  const prepared = await gql<{ prepareDocument: { changedEntities: string[]; document: { id: string; controlNo: string; status: string } } }>(
    bearer,
    `mutation Prepare($input: PrepareDocumentInput!) {
      prepareDocument(input: $input) { changedEntities document { id controlNo status } }
    }`,
    { input: { requestId, documentTypeId, title: 'Dispatch desk probe order' } },
  );
  const documentId = prepared.prepareDocument.document.id;
  console.log('prepared', prepared.prepareDocument.document.controlNo);

  const submitted = await gql<{ submitDocumentForReview: { changedEntities: string[]; document: { status: string } } }>(
    bearer,
    `mutation Submit($id: ID!) {
      submitDocumentForReview(id: $id) { changedEntities document { id controlNo status } }
    }`,
    { id: documentId },
  );
  console.log('submitted ->', submitted.submitDocumentForReview.document.status);

  const reviewed = await gql<{ reviewDocument: { changedEntities: string[]; document: { status: string } } }>(
    bearer,
    `mutation Review($input: ReviewDocumentInput!) {
      reviewDocument(input: $input) { changedEntities document { id controlNo status } }
    }`,
    { input: { documentId, decision: 'APPROVED', denialReason: null, decisionNotes: null } },
  );
  console.log('reviewed ->', reviewed.reviewDocument.document.status);

  console.log(
    `\nREADY: request ${requestId} / document ${documentId} is APPROVED with no transmission - it must appear on /transmit.`,
  );
}

void main();
