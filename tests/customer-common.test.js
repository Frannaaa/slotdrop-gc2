import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from '../server/app.js';
import { card, previewPrice, request, positive, available } from '../public/js/customer-common.js';
import { DISCOVERY_HOURS } from '../public/js/business-config.js';

// Session response before #34's additive metadata: Home must also work with #27.
const slot = { id: 1, serviceName: 'Mug <script>bad()</script>',
  providerName: 'Studio & friends', area: 'Katipunan', city: 'Quezon City',
  category: 'creative', durationMinutes: 180, remainingSeats: 4,
  startsAt: '2026-11-01T06:00:00Z', bookingClosesAt: '2026-11-01T04:00:00Z',
  originalPriceCentavos: 200000, offerPriceCentavos: 160000,
  buddyPriceCentavos: 152000, beginnerFriendly: true };

test('Home can fetch its shared browser module independently of the owner stack', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/js/customer-common.js');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /javascript/);
    assert.match(await response.text(), /export async function request/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('a null error response preserves HTTP failure instead of pretending the connection failed', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ok:false,status:500,json:async()=>null}));
  await assert.rejects(request('/api/slots'), error => {
    assert.equal(error.message, 'Request failed.');
    assert.equal(error.status, 500);
    assert.equal(error.uncertain, undefined);
    return true;
  });
});

test('invalid session IDs and quantities have distinct guidance', () => {
  assert.throws(() => positive('wrong'), /valid session link/);
  assert.throws(() => positive('101', 100), /1 to 100/);
  assert.equal(positive('1'), 1);
});

test('availability previews respect the configured discovery boundary', t => {
  const now=Date.parse('2026-11-01T00:00:00Z');
  t.mock.method(Date, 'now', () => now);
  const session={serviceActive:true,status:'open',runsAsScheduled:true,remainingSeats:2,
    bookingClosesAt:new Date(now+1000).toISOString(),startsAt:new Date(now+DISCOVERY_HOURS*3600000).toISOString()};
  assert.equal(available(session), false);
  assert.equal(available({...session,startsAt:new Date(now+DISCOVERY_HOURS*3600000-1).toISOString()},2), true);
  assert.equal(available({...session,startsAt:new Date(now+1000).toISOString()},3), false);
});

test('cards accept the session API before additive attributes and escape studio text', () => {
  const html = card(slot);
  assert.doesNotMatch(html, /<script>|undefined|NaN/);
  assert.match(html, /Mug &lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.match(html, /Studio &amp; friends/);
  assert.match(html, /detail\.html\?slotId=1&quantity=1/);
  assert.match(card(slot, 2), /detail\.html\?slotId=1&quantity=2/);
  assert.deepEqual(previewPrice(slot, 1), {buddy:false, unit:160000, total:160000});
  assert.deepEqual(previewPrice(slot, 2), {buddy:true, unit:152000, total:304000});
  assert.deepEqual(previewPrice({...slot, buddyPriceCentavos:null}, 2), {buddy:false, unit:160000, total:320000});
});
