/**
 * Regression test for input sanitation in the encodeRequest use case.
 *
 * Three things are proven here:
 *
 *  A. `sanitizeText` cleans one free-text field: NFC-normalizes, drops markup,
 *     stray brackets, control characters and zero-width marks, collapses
 *     whitespace, trims, and enforces the column length that the backend
 *     schema declares (requests.title varchar(500), requesting_party and
 *     origin_office varchar(255)).
 *
 *  B. `sanitizeEncodeRequestInput` rejects a malformed Step 1 payload before it
 *     reaches the wire: a non-uuid request type, an unknown channel or
 *     priority, and a forward-dated receipt (sla_deadline is computed from it,
 *     FR-09).
 *
 *  C. `RequestService.encode` runs the real use case against a capturing
 *     transport: authorization first, then sanitation, then the mutation, then
 *     `changedEntities` invalidation. A rejected field never reaches the
 *     transport, and what does reach it is the cleaned input.
 *
 * No backend, database or Keycloak is needed: the transport is a fake, while
 * the authorization engine and the client cache are the real implementations.
 *
 * Run from `app/`:
 *   ../backend/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/verify-encode-sanitize.mts
 */

import { AuthorizationEngine } from '@/authz/engine';
import { ClientCache } from '@/services/cache/client-cache';
import { isAppError, type ServiceErrorCode } from '@/services/contracts/errors';
import type { GraphQLOperation, IGraphQLClient } from '@/services/contracts/graphql';
import type { AuthzSubject } from '@/services/contracts/authz';
import type { Request } from '@/services/contracts/models';
import type { EncodeRequestInput } from '@/services/contracts/request';
import { RequestService } from '@/services/request.service';
import {
  ENCODE_LIMITS,
  sanitizeEncodeRequestInput,
  sanitizeReceiptDate,
  sanitizeText,
} from '@/services/shared/sanitize';

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail: string) {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${label} (${detail})`);
    return;
  }
  failures += 1;
  console.log(`  FAIL ${label} (${detail})`);
}

/** Assert the call rejects with the expected AppError code and message. */
async function expectRejection(
  label: string,
  run: () => Promise<unknown> | unknown,
  code: ServiceErrorCode,
  messagePart: string,
): Promise<void> {
  try {
    await run();
    check(label, false, 'resolved instead of rejecting');
  } catch (error) {
    const appError = isAppError(error) ? error : null;
    check(
      label,
      appError !== null && appError.code === code && appError.message.includes(messagePart),
      appError ? `${appError.code}: ${appError.message}` : `non-AppError: ${String(error)}`,
    );
  }
}

/** Transport double: records every operation and answers with a canned payload. */
class CapturingClient implements IGraphQLClient {
  readonly calls: GraphQLOperation<Record<string, unknown>>[] = [];
  reply: unknown = null;

  async request<TData, TVariables = Record<string, unknown>>(
    operation: GraphQLOperation<TVariables>,
  ): Promise<TData> {
    this.calls.push(operation as unknown as GraphQLOperation<Record<string, unknown>>);
    return this.reply as TData;
  }
}

const SUBJECT: AuthzSubject = {
  userId: 'usr-clerk-06',
  roles: ['CLERK_ENCODER'],
  permissions: ['RequestService:Read', 'RequestService:Encode'],
  office: 'Central Receiving Desk',
  position: 'Records Custodian',
};

const REQUEST_TYPE_ID = '3f1c9a52-6b1e-4c7d-9f0a-2d5e8b4c1a77';
const ENCODED_REQUEST = {
  id: 'req-0001',
  controlNo: 'IN-2026-0001',
  requestTypeId: REQUEST_TYPE_ID,
  title: 'Request for Travel Order: Provincial DRRM Quarterly Council Meeting',
  requestingParty: 'Florian De Leon, LDRRMO IV',
  originOffice: 'Municipal Disaster Risk Reduction and Management Office',
  channel: 'WALK_IN',
  priority: 'NORMAL',
  status: 'RECEIVED',
  receivedAt: '2026-10-15T01:00:00.000Z',
  slaDeadline: '2026-10-20T01:00:00.000Z',
  createdBy: SUBJECT.userId,
};

function buildService(options: { permissions?: string[] } = {}) {
  const client = new CapturingClient();
  const cache = new ClientCache();
  const authz = new AuthorizationEngine();
  authz.setSubject({ ...SUBJECT, permissions: options.permissions ?? SUBJECT.permissions });
  const service = new RequestService(client, cache, authz);
  return { client, cache, authz, service };
}

function baseInput(overrides: Partial<EncodeRequestInput> = {}): EncodeRequestInput {
  return {
    requestTypeId: REQUEST_TYPE_ID,
    title: 'Request for Travel Order',
    requestingParty: 'Florian De Leon, LDRRMO IV',
    originOffice: 'Municipal Disaster Risk Reduction and Management Office',
    channel: 'WALK_IN',
    priority: 'NORMAL',
    ...overrides,
  };
}

const LABEL_RULE = { label: 'subject matter or formal title', maxLength: 500 };

async function main() {
  console.log('== A. sanitizeText: one free-text field ==');

  check(
    'strips markup but keeps the surrounding text',
    sanitizeText("  <script>alert('x')</script>Travel Order  ", LABEL_RULE) ===
      "alert('x') Travel Order",
    sanitizeText("  <script>alert('x')</script>Travel Order  ", LABEL_RULE),
  );

  check(
    'removes an unterminated tag and its stray bracket',
    sanitizeText('Delivery of <10 units', LABEL_RULE) === 'Delivery of 10 units',
    sanitizeText('Delivery of <10 units', LABEL_RULE),
  );

  check(
    'drops C0 control characters',
    sanitizeText('Doc\u0007ument\u0000 Title', LABEL_RULE) === 'Document Title',
    JSON.stringify(sanitizeText('Doc\u0007ument\u0000 Title', LABEL_RULE)),
  );

  check(
    'drops zero-width and BOM characters',
    sanitizeText('Re\u200Bquest\uFEFF of\u00ADficial', LABEL_RULE) === 'Request official',
    JSON.stringify(sanitizeText('Re\u200Bquest\uFEFF of\u00ADficial', LABEL_RULE)),
  );

  check(
    'collapses tabs, newlines and non-breaking spaces',
    sanitizeText('A\u00A0 B\n\nC\t D', LABEL_RULE) === 'A B C D',
    JSON.stringify(sanitizeText('A\u00A0 B\n\nC\t D', LABEL_RULE)),
  );

  check(
    'normalizes to NFC (combining accent folded)',
    sanitizeText('Cafe\u0301 Hours', LABEL_RULE) === 'Caf\u00E9 Hours',
    JSON.stringify(sanitizeText('Cafe\u0301 Hours', LABEL_RULE)),
  );

  const messy = '  <b>Barangay</b>   Road\u200B  Concreting  ';
  const once = sanitizeText(messy, LABEL_RULE);
  check(
    'is idempotent',
    sanitizeText(once, LABEL_RULE) === once,
    `${JSON.stringify(once)} -> ${JSON.stringify(sanitizeText(once, LABEL_RULE))}`,
  );

  check(
    'keeps ampersands and quotes intact',
    sanitizeText('Risk Reduction & Management "Council"', LABEL_RULE) ===
      'Risk Reduction & Management "Council"',
    sanitizeText('Risk Reduction & Management "Council"', LABEL_RULE),
  );

  await expectRejection(
    'rejects a whitespace-only required field',
    () => sanitizeText('  \u00A0 \n ', LABEL_RULE),
    'VALIDATION',
    'The subject matter or formal title is required.',
  );

  check(
    'allows an optional field to stay empty',
    sanitizeText('   ', { ...LABEL_RULE, required: false }) === '',
    JSON.stringify(sanitizeText('   ', { ...LABEL_RULE, required: false })),
  );

  check(
    'accepts a value exactly at the limit',
    sanitizeText('x'.repeat(500), LABEL_RULE).length === 500,
    '500 of 500 characters',
  );

  await expectRejection(
    'rejects a value past the column limit and names the count',
    () => sanitizeText('x'.repeat(501), LABEL_RULE),
    'VALIDATION',
    '501 characters, the limit is 500',
  );

  check(
    'counts characters, not UTF-16 code units (astral pair)',
    sanitizeText('\u{1F600}'.repeat(250), { ...LABEL_RULE, maxLength: 250 }).length > 250,
    '250 astral characters accepted by a 250-character limit',
  );

  check(
    'multiline mode keeps paragraph breaks and normalizes CRLF',
    sanitizeText('Para one\r\n\r\n\r\n\r\nPara   two  ', {
      ...LABEL_RULE,
      multiline: true,
    }) === 'Para one\n\nPara two',
    JSON.stringify(
      sanitizeText('Para one\r\n\r\n\r\n\r\nPara   two  ', { ...LABEL_RULE, multiline: true }),
    ),
  );

  console.log('== B. sanitizeEncodeRequestInput: the Step 1 payload ==');

  const cleaned = sanitizeEncodeRequestInput(
    baseInput({
      requestTypeId: `  ${REQUEST_TYPE_ID}  `,
      title: '  <i>Request</i>  for   Travel   Order ',
      requestingParty: 'Florian\u00A0De  Leon',
      originOffice: 'MDRRMO\u200B',
      receivedAt: '2026-10-14T09:30:00+08:00',
    }),
  );
  check(
    'cleans every text field and trims the request type id',
    cleaned.title === 'Request for Travel Order' &&
      cleaned.requestingParty === 'Florian De Leon' &&
      cleaned.originOffice === 'MDRRMO' &&
      cleaned.requestTypeId === REQUEST_TYPE_ID,
    JSON.stringify({
      title: cleaned.title,
      requestingParty: cleaned.requestingParty,
      originOffice: cleaned.originOffice,
      requestTypeId: cleaned.requestTypeId,
    }),
  );
  check(
    'normalizes a back-dated receipt to ISO and keeps the offset instant',
    cleaned.receivedAt === new Date('2026-10-14T09:30:00+08:00').toISOString(),
    String(cleaned.receivedAt),
  );

  const messyInput = baseInput({ title: '  <b>Untouched</b>  caller  ' });
  sanitizeEncodeRequestInput(messyInput);
  check(
    'never mutates the caller input',
    messyInput.title === '  <b>Untouched</b>  caller  ',
    JSON.stringify(messyInput.title),
  );

  const withoutReceipt = sanitizeEncodeRequestInput(baseInput());
  check(
    'an omitted receipt stays null so the backend defaults it to now',
    withoutReceipt.receivedAt === null,
    String(withoutReceipt.receivedAt),
  );
  check(
    'an omitted priority defaults to NORMAL',
    sanitizeEncodeRequestInput(baseInput({ priority: undefined })).priority === 'NORMAL',
    String(sanitizeEncodeRequestInput(baseInput({ priority: undefined })).priority),
  );

  await expectRejection(
    'rejects a request type id that is not a uuid',
    () => sanitizeEncodeRequestInput(baseInput({ requestTypeId: 'not-an-id' })),
    'VALIDATION',
    'Select a document or request type before logging.',
  );

  await expectRejection(
    'rejects an unknown receiving channel',
    () => sanitizeEncodeRequestInput(baseInput({ channel: 'CARRIER_PIGEON' as never })),
    'VALIDATION',
    'Select a valid receiving channel.',
  );

  await expectRejection(
    'rejects an unknown priority',
    () => sanitizeEncodeRequestInput(baseInput({ priority: 'CRITICAL' as never })),
    'VALIDATION',
    'Select a valid urgency or priority level.',
  );

  await expectRejection(
    'rejects an unparseable receipt date',
    () => sanitizeEncodeRequestInput(baseInput({ receivedAt: 'yesterday-ish' })),
    'VALIDATION',
    'The receipt date is not a valid date.',
  );

  await expectRejection(
    'rejects a forward-dated receipt (the SLA clock runs from it)',
    () => sanitizeReceiptDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
    'VALIDATION',
    'The receipt date cannot be in the future.',
  );

  console.log('== C. RequestService.encode: the real use case ==');

  const { client, cache, service } = buildService();
  client.reply = { encodeRequest: { changedEntities: ['Request_req-0001'], request: ENCODED_REQUEST } };

  // Seed the cache exactly as a cached read would: the entity's own query, a
  // list query of the same type, the dashboard metrics, and an unrelated type.
  const now = Date.now() + 60_000;
  const record = { entities: ['Request'], ids: ['Request_req-0001'], type: 'get' as const, ttl: now, endCursor: null };
  cache.setQuery('v1:request:get:req-0001', record);
  cache.registerMembership('Request', 'req-0001', 'v1:request:get:req-0001');
  cache.setQuery('v1:request:list:{}', { ...record, type: 'list' });
  cache.registerEntityType('Request', 'v1:request:list:{}');
  cache.setQuery('v1:dashboardMetrics:get:metrics', { ...record, entities: ['DashboardMetrics'] });
  cache.registerEntityType('DashboardMetrics', 'v1:dashboardMetrics:get:metrics');
  cache.setQuery('v1:venue:list:{}', { ...record, entities: ['Venue'] });
  cache.registerEntityType('Venue', 'v1:venue:list:{}');

  const encoded: Request = await service.encode(
    baseInput({
      title: '  <b>Request</b>  for   Travel   Order ',
      requestingParty: 'Florian\u00A0De  Leon',
      originOffice: 'MDRRMO',
    }),
  );

  check(
    'sends exactly one encodeRequest operation',
    client.calls.length === 1 && client.calls[0].operationName === 'EncodeRequest',
    `${client.calls.length} call(s), operation ${client.calls[0]?.operationName ?? 'none'}`,
  );
  check(
    'the operation document is the encodeRequest mutation',
    (client.calls[0]?.document ?? '').includes('encodeRequest(input: $input)'),
    (client.calls[0]?.document ?? '').split('\n')[0] ?? 'no document',
  );

  const sent = (client.calls[0]?.variables as { input: EncodeRequestInput } | undefined)?.input;
  check(
    'the transport receives the SANITIZED input, not the raw one',
    sent?.title === 'Request for Travel Order' &&
      sent?.requestingParty === 'Florian De Leon' &&
      sent?.originOffice === 'MDRRMO',
    JSON.stringify({ title: sent?.title, requestingParty: sent?.requestingParty, originOffice: sent?.originOffice }),
  );
  check(
    'the sanitized payload carries the enum fields and an explicit null receipt',
    sent?.channel === 'WALK_IN' &&
      sent?.priority === 'NORMAL' &&
      sent?.requestTypeId === REQUEST_TYPE_ID &&
      sent?.receivedAt === null,
    JSON.stringify({ channel: sent?.channel, priority: sent?.priority, receivedAt: sent?.receivedAt }),
  );
  check(
    'the returned request is normalized for the contract',
    encoded.id === 'req-0001' &&
      encoded.controlNo === 'IN-2026-0001' &&
      Array.isArray(encoded.documents) &&
      Array.isArray(encoded.attachments) &&
      Array.isArray(encoded.logs),
    JSON.stringify({ id: encoded.id, documents: encoded.documents.length, logs: encoded.logs.length }),
  );
  check(
    'changedEntities invalidates the request reads, the metrics, and nothing else',
    !cache.hasValidQuery('v1:request:get:req-0001') &&
      !cache.hasValidQuery('v1:request:list:{}') &&
      !cache.hasValidQuery('v1:dashboardMetrics:get:metrics') &&
      cache.hasValidQuery('v1:venue:list:{}'),
    `request get/list ${cache.hasValidQuery('v1:request:get:req-0001')}/${cache.hasValidQuery('v1:request:list:{}')}, metrics ${cache.hasValidQuery('v1:dashboardMetrics:get:metrics')}, venue ${cache.hasValidQuery('v1:venue:list:{}')}`,
  );

  const longTitle = buildService();
  longTitle.client.reply = { encodeRequest: { changedEntities: [], request: ENCODED_REQUEST } };
  await expectRejection(
    'a title past varchar(500) is rejected before the round trip',
    () => longTitle.service.encode(baseInput({ title: 'x'.repeat(ENCODE_LIMITS.title + 1) })),
    'VALIDATION',
    `the limit is ${ENCODE_LIMITS.title}`,
  );
  check(
    'the rejected encode never reached the transport',
    longTitle.client.calls.length === 0,
    `${longTitle.client.calls.length} call(s)`,
  );

  const unauthorized = buildService({ permissions: ['RequestService:Read'] });
  unauthorized.client.reply = { encodeRequest: { changedEntities: [], request: ENCODED_REQUEST } };
  await expectRejection(
    'a missing Encode grant fails before sanitation and the round trip',
    () => unauthorized.service.encode(baseInput()),
    'FORBIDDEN',
    'do not have permission',
  );
  check(
    'the forbidden encode never reached the transport',
    unauthorized.client.calls.length === 0,
    `${unauthorized.client.calls.length} call(s)`,
  );

  const noSession = buildService();
  noSession.authz.setSubject(null);
  await expectRejection(
    'an unhydrated session cannot encode',
    () => noSession.service.encode(baseInput()),
    'FORBIDDEN',
    'session is still loading',
  );

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('verify-encode-sanitize crashed:', error);
  process.exitCode = 1;
});
