// Disposable local HTTP evidence only. Never resets or writes to the deployed database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fixture } from '../tests/helpers.js';

let now;
const f = await fixture({ clock: () => now });
now = f.now;
const requests = [];
async function countBookings() {
  return Number((await f.db.query('SELECT COUNT(*) AS n FROM bookings')).rows[0].n);
}
async function capture(label, method, path, body, expectedStatus) {
  const bookingsBefore = await countBookings();
  const response = await fetch(f.base + path, {
    method, signal: AbortSignal.timeout(15000),
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const result = { label, request: { method, path, ...(body === undefined ? {} : { body }) },
    status: response.status, response: await response.json(), bookingsBefore, bookingsAfter: await countBookings() };
  assert.equal(result.status, expectedStatus, label);
  if (expectedStatus >= 400) assert.equal(result.bookingsAfter, bookingsBefore, label + ': nothing saved');
  requests.push(result);
  return result.response;
}
try {
  const body = { requestId: randomUUID(), slotId: 1, quantity: 1, customerName: 'Final API fixture',
    customerEmail: 'final.fixture@example.com', paymentMethod: 'mock_card', expectedTotalCentavos: 160000 };
  await capture('1 Invalid quantity', 'POST', '/api/bookings', { ...body, quantity: 0 }, 400);
  const { customerName, ...missingName } = body;
  await capture('2 Missing customerName', 'POST', '/api/bookings', missingName, 400);
  await capture('3 More seats than allocated', 'POST', '/api/bookings', { ...body, quantity: 5, expectedTotalCentavos: 760000 }, 409);
  const changed = await capture('4 Wrong accepted total', 'POST', '/api/bookings', { ...body, expectedTotalCentavos: 1 }, 409);
  assert.equal(changed.error.code, 'PRICE_CHANGED');
  await capture('5 Unknown product/session', 'GET', '/api/slots/999999', undefined, 404);
  const empty = await capture('6 Search with no matches', 'GET', '/api/slots?q=no-such-final-fixture-workshop', undefined, 200);
  assert.deepEqual(empty, []);
  const saved = await capture('Accepted fresh server quote', 'POST', '/api/bookings',
    { ...body, expectedTotalCentavos: changed.error.quote.totalPriceCentavos }, 201);
  const readback = await capture('Read saved receipt by ID', 'GET', '/api/bookings/' + saved.id, undefined, 200);
  assert.deepEqual(readback, saved);
  const owner = await capture('Matching Owner booking', 'GET', '/api/bookings', undefined, 200);
  assert.equal(owner.filter(row => row.id === saved.id).length, 1);
  assert.equal(owner.find(row => row.id === saved.id).totalPriceCentavos, saved.totalPriceCentavos);
  const holdRequest = { requestId: randomUUID(), slotId: 1, quantity: 2 };
  const held = await capture('Create hold', 'POST', '/api/holds', holdRequest, 201);
  assert.equal(held.remainingSeats, 1);
  await capture('Identical hold retry', 'POST', '/api/holds', holdRequest, 200);
  await capture('Read hold', 'GET', '/api/holds/' + held.id, undefined, 200);
  await capture('Release hold', 'DELETE', '/api/holds/' + held.id, undefined, 200);
  const expiring = await capture('New hold for expiry proof', 'POST', '/api/holds', { ...holdRequest, requestId: randomUUID() }, 201);
  now = new Date(now.getTime() + 600000);
  const expired = await capture('Read after advancing fixture server clock ten minutes', 'GET', '/api/holds/' + expiring.id, undefined, 200);
  assert.equal(expired.status, 'expired');
  assert.equal(expired.remainingSeats, 3);
  const evidence = { capturedAt: new Date().toISOString(), sourceBaseCommit: '905b4c7dbaece6c121f48cf4d4d860ff8a215dd2',
    build: 'Fran hold backend working tree; final integrated release evidence must be refreshed',
    environment: 'Disposable local PGlite PostgreSQL engine over actual Express HTTP routes', node: process.version,
    expiryMethod: 'Injected server clock advanced by 600000 ms; no browser timer used', requests };
  const evidenceUrl = new URL('../docs/evidence/final-api.json', import.meta.url);
  await mkdir(new URL('../docs/evidence/', import.meta.url), { recursive: true });
  await writeFile(evidenceUrl, JSON.stringify(evidence, null, 2) + '\n');
  const section = r => `### ${r.label}\n\n${r.request.method} ${r.request.path}\n\n` +
    (r.request.body ? 'Request:\n\n```json\n' + JSON.stringify(r.request.body, null, 2) + '\n```\n\n' : '') +
    `Actual HTTP ${r.status}:\n\n\`\`\`json\n${JSON.stringify(r.response, null, 2)}\n\`\`\`\n\n` +
    `Saved bookings before/after: ${r.bookingsBefore}/${r.bookingsAfter}.\n`;
  const markdown = `# Final API refusals and server-total evidence\n\nCaptured ${evidence.capturedAt}.\n\n` +
    'These are actual local HTTP responses from Fran\'s backend build, using a disposable PGlite database. They are not live Render captures or final release sign-off. Refresh them on the integrated build before submission.\n\n' +
    'Regenerate with `node tools/capture-final-api-evidence.mjs`. [Raw requests and responses](evidence/final-api.json).\n\n' +
    '## Accepted-total contract and the brief\n\nThe general Final brief gives HTTP 201 for an ignored, incorrect browser total. SlotDrop uses `expectedTotalCentavos` as the amount the customer agreed to pay. Changing it returns HTTP 409 `PRICE_CHANGED` and a fresh server quote, with nothing saved. The supplied GC2 feedback explicitly praises refusing a stale price rather than charging a different amount. We retain that behavior and show it here as a documented difference from the generic 201 example, not a claimed 201 pass. After explicit acceptance of the fresh quote, the follow-up request below returns 201 and its stored receipt is read by ID and matched in Owner. Unsupported price fields remain refused.\n\n' +
    requests.slice(0, 6).map(section).join('\n') + '\n## Explicit acceptance and saved readback\n\n' +
    requests.slice(6, 9).map(section).join('\n') + '\n## Hold API evidence\n\nCreate, read, release and expiry request bodies are in the raw evidence. Expiry uses an injected server clock advanced by ten minutes, rather than waiting on a browser timer. Booking conversion and the countdown UI are separate teammate handoffs and are not demonstrated by these captures.\n';
  await writeFile(new URL('../docs/refusals.md', import.meta.url), markdown);
  console.log(JSON.stringify({ output: fileURLToPath(evidenceUrl), requests: requests.length, statuses: requests.slice(0, 6).map(r => r.status), savedReceiptId: saved.id }));
} finally { await f.close(); }
