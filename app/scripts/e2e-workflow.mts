/**
 * End-to-end workflow run through the REAL frontend service layer against the
 * live backend + Keycloak. Exercises the same composition root, authorization
 * engine, GraphQL client, cache, and multipart uploads the UI uses.
 *
 * Run from app/:  ../backend/node_modules/.bin/tsx scripts/e2e-workflow.mts
 */

import { createServices } from '@/services';
import type { AuthzSubject } from '@/services/contracts/authz';

const KC = 'http://localhost:8080/realms/docsys';
const PASSWORD = 'DocSys2026!';

let currentToken: string | null = null;

const bundle = createServices({
  signIn: async () => {},
  signOut: async () => {},
  getSessionToken: async () =>
    currentToken ? { accessToken: currentToken, expiresAt: null } : null,
});

async function token(username: string): Promise<string> {
  const res = await fetch(`${KC}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'docsys-app',
      username,
      password: PASSWORD,
      scope: 'openid profile email',
    }),
  });
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error(`no token for ${username}`);
  return json.access_token;
}

/** Switch the active actor: new token -> reload `me` -> rehydrate the engine. */
async function asActor(username: string) {
  currentToken = await token(username);
  bundle.session.clearAccessToken();
  const snapshot = await bundle.session.loadSession(null);
  const subject: AuthzSubject = {
    userId: snapshot.user.id,
    roles: snapshot.user.roles.map((role) => role.name),
    permissions: snapshot.user.effectivePermissions,
    office: snapshot.user.office,
    position: snapshot.user.position,
  };
  bundle.authz.setSubject(subject);
  return snapshot.user;
}

let step = 0;
function ok(label: string, value: unknown) {
  step += 1;
  console.log(`  ${String(step).padStart(2, '0')}. OK   ${label} -> ${JSON.stringify(value)}`);
}

async function main() {
  console.log('== session bootstrap ==');
  const admin = await asActor('administrator');
  ok('me (administrator)', { id: admin.id, roles: admin.roles.map((r) => r.name) });

  // --- reference data (required before intake/preparation) ---
  console.log('== reference data ==');
  const existingReqTypes = await bundle.registry.lookups.listRequestTypes(true);
  const reqType =
    existingReqTypes.find((t) => t.code === 'LETTER') ??
    (await bundle.registry.lookups.createRequestType({
      code: 'LETTER',
      name: 'Incoming Letter',
      description: 'Incoming communication / request letter',
      prefix: 'IN',
    }));
  ok('request type', { code: reqType.code, id: reqType.id });

  const existingDocTypes = await bundle.registry.lookups.listDocumentTypes(true);
  const docType =
    existingDocTypes.find((t) => t.code === 'EO') ??
    (await bundle.registry.lookups.createDocumentType({
      code: 'EO',
      name: 'Executive Order',
      description: 'Executive Order issued by the Mayor',
      prefix: 'EO',
    }));
  ok('document type', { code: docType.code, id: docType.id });

  // --- Step 1: reception (clerk) ---
  console.log('== step 1: reception ==');
  const clerk = await asActor('clerk');
  ok('me (clerk)', { id: clerk.id, roles: clerk.roles.map((r) => r.name) });

  const request = await bundle.registry.requests.encode({
    requestTypeId: reqType.id,
    title: 'E2E test letter - barangay road concreting request',
    requestingParty: 'Brgy. San Jose',
    originOffice: 'Barangay San Jose',
    channel: 'WALK_IN',
    priority: 'HIGH',
  });
  ok('requests.encode', { id: request.id, controlNo: request.controlNo, status: request.status });

  const letter = new File([Buffer.from('%PDF-1.4 scanned incoming letter')], 'letter.pdf', {
    type: 'application/pdf',
  });
  const reqAttachment = await bundle.registry.attachments.uploadRequestAttachment({
    requestId: request.id,
    kind: 'INCOMING_LETTER',
    file: letter,
  });
  ok('attachments.uploadRequestAttachment', {
    id: reqAttachment.id,
    kind: reqAttachment.kind,
    checksum: reqAttachment.checksum.slice(0, 12),
  });

  // --- Step 2: screening (clerk) ---
  console.log('== step 2: screening ==');
  const screened = await bundle.registry.requests.screen({
    requestId: request.id,
    passed: true,
    notes: 'Complete attachments; properly addressed.',
  });
  ok('requests.screen(passed)', { status: screened.status });

  // --- Step 3: preparation (clerk) ---
  console.log('== step 3: preparation ==');
  const document = await bundle.registry.documents.prepare({
    requestId: request.id,
    documentTypeId: docType.id,
    title: 'Executive Order - Barangay road concreting',
  });
  ok('documents.prepare', {
    id: document.id,
    controlNo: document.controlNo,
    status: document.status,
  });

  const draft = new File([Buffer.from('%PDF-1.4 draft executive order')], 'draft.pdf', {
    type: 'application/pdf',
  });
  const draftAttachment = await bundle.registry.attachments.uploadDocumentAttachment({
    documentId: document.id,
    kind: 'DRAFT',
    file: draft,
  });
  ok('attachments.uploadDocumentAttachment(DRAFT)', { id: draftAttachment.id });

  const submitted = await bundle.registry.documents.submitForReview(document.id);
  ok('documents.submitForReview', { status: submitted.status });

  // --- Step 4: review + signature (administrator) ---
  console.log('== step 4: review and signature ==');
  await asActor('administrator');
  const reviewed = await bundle.registry.documents.review({
    documentId: document.id,
    decision: 'APPROVED',
    decisionNotes: 'Approved for signature.',
    signatoryRequired: true,
  });
  ok('documents.review(APPROVED)', { status: reviewed.status, decidedBy: reviewed.decidedBy });

  const signed = await bundle.registry.documents.sign({
    documentId: document.id,
    signedBy: admin.id,
  });
  ok('documents.sign', { status: signed.status, signedBy: signed.signedBy });

  // --- Step 5: transmission (clerk) ---
  console.log('== step 5: transmission ==');
  await asActor('clerk');
  const proof = new File([Buffer.from('%PDF-1.4 receiving copy')], 'proof.pdf', {
    type: 'application/pdf',
  });
  const proofAttachment = await bundle.registry.attachments.uploadDocumentAttachment({
    documentId: document.id,
    kind: 'TRANSMISSION_PROOF',
    file: proof,
  });
  ok('attachments.uploadDocumentAttachment(TRANSMISSION_PROOF)', { id: proofAttachment.id });

  const transmitted = await bundle.registry.documents.transmit({
    documentId: document.id,
    recipientName: 'Brgy. Capt. San Jose',
    receivingOffice: 'Barangay San Jose',
    receivedBy: 'Barangay Secretary',
    method: 'PICKUP',
    proofAttachmentId: proofAttachment.id,
  });
  ok('documents.transmit', { status: transmitted.status });

  // --- Step 6: completion and archiving (clerk) ---
  console.log('== step 6: completion and archiving ==');
  const folder = await bundle.registry.folders.create({ name: `E2E ${Date.now()}` });
  ok('folders.create', { id: folder.id, path: folder.path });

  const finalCopy = new File([Buffer.from('%PDF-1.4 signed final')], 'signed-final.pdf', {
    type: 'application/pdf',
  });
  const finalAttachment = await bundle.registry.attachments.uploadDocumentAttachment({
    documentId: document.id,
    kind: 'SIGNED_FINAL',
    file: finalCopy,
  });
  ok('attachments.uploadDocumentAttachment(SIGNED_FINAL)', { id: finalAttachment.id });

  const closed = await bundle.registry.documents.close({
    requestId: request.id,
    finalAttachmentId: finalAttachment.id,
    folderId: folder.id,
    notes: 'Filed after transmission.',
  });
  ok('documents.close', { id: closed.id, status: closed.status, folderId: closed.folderId });

  // --- reads back ---
  console.log('== verification reads ==');
  const fresh = await bundle.registry.requests.getById(request.id);
  ok('requests.getById', { status: fresh?.status, logs: fresh?.logs.length });

  const archived = await bundle.registry.documents.list({ first: 10, filter: { folderId: folder.id } });
  ok('documents.list(folderId)', {
    count: archived.edges.length,
    controlNo: archived.edges[0]?.node.controlNo,
  });

  const ticket = await bundle.registry.attachments.getDocumentAttachmentDownload(
    finalAttachment.id,
    true,
  );
  ok('attachments.getDocumentAttachmentDownload', {
    fileName: ticket.fileName,
    expiresInSeconds: ticket.expiresInSeconds,
    urlHost: new URL(ticket.url).host,
  });

  const metrics = await bundle.registry.reports.getDashboardMetrics();
  ok('reports.getDashboardMetrics', metrics);

  console.log('\nEND-TO-END WORKFLOW PASSED');
}

main().catch((err) => {
  console.error('\nE2E FAILED at step', step + 1, '\n', err);
  process.exit(1);
});
