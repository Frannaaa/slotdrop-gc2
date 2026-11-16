import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from '../server/app.js';
import { card, previewPrice, request, positive, available, closedSessionLabel, safeHttpsUrl, studioEvidence, practiceChoiceLabel } from '../public/js/customer-common.js';
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

test('a changed-price response preserves the fresh quote for Checkout in both API envelopes', async t => {
  const quote={slotId:1,quantity:2,unitPriceCentavos:150000,totalPriceCentavos:300000,pricingType:'buddy'};
  let data;
  t.mock.method(globalThis,'fetch',async()=>({ok:false,status:409,json:async()=>data}));
  for (const body of [{error:{code:'PRICE_CHANGED',message:'Review the new total.',quote}},{error:{code:'PRICE_CHANGED',message:'Review the new total.'},quote}]) {
    data=body;
    await assert.rejects(request('/api/bookings',{method:'POST'}),error=>{
      assert.equal(error.code,'PRICE_CHANGED');assert.equal(error.status,409);assert.deepEqual(error.quote,quote);return true;
    });
  }
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
  assert.match(html, /Book by Nov 1, 12:00\s+PM/);
  assert.match(html, /<strong>₱1,600\.00<\/strong>\s*<span>per person<\/span>/);
  assert.match(html, /₱1,520\.00 each for 2\+ people/);
  assert.doesNotMatch(html, /card-art|card-compare|session-traits/);
  assert.match(card({ ...slot, remainingSeats: 1 }), /1 seat left/);
  const forTwo = card(slot, 2);
  assert.match(forTwo, /detail\.html\?slotId=1&quantity=2/);
  assert.match(forTwo, /<strong>₱3,040\.00<\/strong>\s*<span>total for 2 people<\/span>/);
  assert.match(forTwo, /Buddy price applied/);
  assert.deepEqual(previewPrice(slot, 1), {buddy:false, unit:160000, total:160000});
  assert.deepEqual(previewPrice(slot, 2), {buddy:true, unit:152000, total:304000});
  assert.deepEqual(previewPrice({...slot, buddyPriceCentavos:null}, 2), {buddy:false, unit:160000, total:320000});
});

test('archive entries label the cutoff and event end separately and omit photos and prices', t => {
  const when = time => Date.parse('2026-11-01T' + time + ':00Z');
  assert.equal(closedSessionLabel(slot, when('03:59')), '');
  assert.equal(closedSessionLabel(slot, when('04:00')), 'Booking closed');
  assert.equal(closedSessionLabel(slot, when('08:59')), 'Booking closed');
  assert.equal(closedSessionLabel(slot, when('09:00')), 'Event ended');
  assert.equal(closedSessionLabel({ ...slot, startsAt: null, bookingClosesAt: null }, when('09:00')), '');
  let now = when('08:59');
  t.mock.method(Date, 'now', () => now);
  assert.match(card(slot, 1, { closed: true }), /<span class="session-label">Booking closed<\/span>/);
  now = when('09:00');
  const archived = { ...slot, studioReference: {
    key: 'laro-mug', photo: { alt: 'Workshop photo', credit: 'Example Studio', page: 'https://example.com/workshop' },
  } };
  const html = card(archived, 1, { closed: true });
  assert.match(html, /activity-card card closed-card/);
  assert.match(html, /<span class="session-label">Event ended<\/span>/);
  assert.match(html, /detail\.html\?slotId=1&quantity=1/);
  assert.match(html, /View details/);
  assert.match(html, /Nov 1, 2026/);
  assert.doesNotMatch(html, /Book by|seat(s)? left|party-price|<img|card-photo/);
});

test('studio reference cards and profiles share safe HTTPS source-link validation', () => {
  assert.equal(safeHttpsUrl('https://example.com/workshops?q=clay'), 'https://example.com/workshops?q=clay');
  for (const unsafe of [
    'http://example.com/workshops',
    'javascript:alert(1)',
    'https://user:secret@example.com/workshops',
    '/relative/workshops',
    null,
  ]) {
    assert.equal(safeHttpsUrl(unsafe), null, String(unsafe));
    assert.equal(studioEvidence({
      studioReference: { sourceUrl: unsafe, checkedAt: '2026-11-04' },
    }), '');
  }
  const html = studioEvidence({
    studioReference: {
      sourceUrl: 'https://example.com/workshops?q=a&category=clay',
      priceSourceUrl: 'https://user:secret@example.com/prices',
      checkedAt: '2026-11-04',
    },
  });
  assert.match(html, /href="https:\/\/example\.com\/workshops\?q=a&amp;category=clay"/);
  assert.doesNotMatch(html, /user:secret|Price source/);
});

test('card title falls back from serviceName to title to Untitled Session', () => {
  assert.match(card({ ...slot, serviceName: 'Wheel Pottery' }), /<h2>Wheel Pottery<\/h2>/);
  assert.match(card({ ...slot, serviceName: undefined, title: 'Legacy Title' }), /<h2>Legacy Title<\/h2>/);
  assert.match(card({ ...slot, serviceName: '', title: '' }), /<h2>Untitled Session<\/h2>/);
});

test('practice cards show the cutoff exception and render a credited local workshop photo', () => {
  const practice = { ...slot, startsAt: null, bookingClosesAt: null,
    studioReference: { key: 'laro-mug', sourceUrl: 'https://example.com/source', checkedAt: '2026-11-04',
      photo: { alt: 'Pottery & painting', credit: 'Example Studio', page: 'https://example.com/workshop' } } };
  const html = card(practice);
  assert.match(html, /<span class="session-label practice">Practice booking<\/span>/);
  assert.match(html, /Sample booking with no expiry for grading\./);
  assert.match(html, /Try practice booking/);
  const scheduled = card({ ...practice, startsAt: slot.startsAt, bookingClosesAt: slot.bookingClosesAt });
  assert.match(scheduled, /View workshop/);
  assert.match(scheduled, /Book by Nov 1/);
  assert.doesNotMatch(scheduled, /Practice booking|Try practice booking/);
  assert.match(html, /src="\/images\/workshops\/laro-mug\.webp" alt="Pottery &amp; painting"/);
  assert.match(html, /aria-label="Photo source: Example Studio"/);
  assert.doesNotMatch(html, /Real studio reference|1970|Book by/);
  const compact = card(practice, 1, { compact: true });
  assert.match(compact, /Sample booking with no expiry for grading/);
  assert.match(compact, /Try practice booking/);
  assert.match(compact, /src="\/images\/workshops\/laro-mug\.webp"/);
  assert.match(compact, /aria-label="Photo source: Example Studio"/);
  assert.doesNotMatch(compact, /session-label/);
  const unsafe = { ...practice, studioReference: { ...practice.studioReference, key: '../../elsewhere' } };
  assert.doesNotMatch(card(unsafe), /<img/);
});

test('fictional Month X/Y practice options link to distinct valid slot IDs', () => {
  const first = { ...slot, startsAt: null, bookingClosesAt: null, demoVariant: 1 };
  const second = { ...first, id: 42, demoVariant: 2 };
  assert.equal(practiceChoiceLabel(first), 'Month X, 20XX');
  assert.equal(practiceChoiceLabel(second), 'Month Y, 20XX');
  const html = card(first, 1, { compact: true, sessions: [first, second] });
  assert.match(html, /aria-label="Choose a fictional demo date"/);
  assert.match(html, /Month X, 20XX/);
  assert.match(html, /Month Y, 20XX/);
  assert.match(html, /detail\.html\?slotId=1&quantity=1/);
  assert.match(html, /detail\.html\?slotId=42&quantity=1/);
  assert.equal((html.match(/No expiry · fictional demo date/g) || []).length, 2);
  assert.doesNotMatch(html, /1970|Invalid Date|Book by/);
});

test('a repeated workshop shows each date, seat count, and its own price and detail link', () => {
  const later = {
    ...slot, id: 2, startsAt: '2026-11-02T06:00:00Z',
    bookingClosesAt: '2026-11-02T04:00:00Z', remainingSeats: 3,
    offerPriceCentavos: 130000, buddyPriceCentavos: null,
  };
  const html = card(slot, 2, { sessions: [slot, later] });
  assert.equal((html.match(/<article/g) || []).length, 1);
  assert.match(html, /aria-label="Available dates"/);
  assert.match(html, /detail\.html\?slotId=1&quantity=2/);
  assert.match(html, /detail\.html\?slotId=2&quantity=2/);
  assert.match(html, /₱2,600\.00 for 2 people · 3 seats left/);
  assert.match(html, /Book by Nov 2/);
});
