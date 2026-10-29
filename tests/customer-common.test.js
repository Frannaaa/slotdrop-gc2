import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from '../server/app.js';
import { card, previewPrice } from '../public/js/customer-common.js';

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
