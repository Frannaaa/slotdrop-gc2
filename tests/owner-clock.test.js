import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import * as policy from '../public/js/owner-policy.js';

test('the owner clock updates existing cards across deadlines without disturbing a draft', async () => {
  const elements = new Map(), listeners = new Map(), timers = [];
  class Element {
    constructor() {
      this.children = []; this.dataset = {}; this.value = '';
      this.classList = { toggle() {} };
    }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    addEventListener() {}
  }
  const document = {
    hidden: false,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element());
      return elements.get(id);
    },
    createElement() { return new Element(); },
    addEventListener(name, callback) { listeners.set(name, callback); },
  };
  let now = Date.parse('2026-11-01T00:00:00Z');
  const start = now;
  const slot = {id:1, serviceId:1, serviceName:'Pottery', providerName:'Studio', area:'Katipunan',
    status:'open', startsAt:new Date(now+10000).toISOString(), bookingClosesAt:new Date(now+2000).toISOString(),
    remainingSeats:4, capacity:4, originalPriceCentavos:200000, offerPriceCentavos:160000,
    buddyPriceCentavos:null, runsAsScheduled:true};
  const catalog = {services:[{id:1,active:true}], discoveryHours:72, slots:[slot,
    {...slot,id:2,status:'paused'},
    {...slot,id:3,startsAt:new Date(now+72*3600000+1000).toISOString(),bookingClosesAt:new Date(now+71*3600000).toISOString()}]};
  const source = (await readFile(new URL('../public/js/owner.js', import.meta.url), 'utf8'))
    .replace(/^import[\s\S]*?from "\.\/owner-policy\.js";\n/, '')
    .replace(/^import \{ api \} from "\.\/api\.js";\n/m, '')
    .replace(/reset\(\);\nload\(\);\s*$/, '');
  const context = {document, ...policy, Intl,
    Date:class extends Date { static now() { return now; } },
    setInterval(callback, milliseconds) { timers.push({callback,milliseconds}); },
    fetch() { throw new Error('A clock update must not fetch or reload the form.'); },
    initialCatalog:catalog};
  runInNewContext(source + '\ncatalog = initialCatalog; loaded = true; renderSessions();', context);
  const cards = elements.get('sessions').children;
  const tag = card => card.children[0].children[0];
  const resume = cards[1].children.at(-1).children[1];
  const draft = document.getElementById('cutoff');
  draft.value = '2026-11-03T19:42';
  document.activeElement = resume;
  assert.equal(tag(cards[0]).textContent, 'Bookable');
  assert.equal(tag(cards[2]).textContent, 'Not listed yet');
  assert.notEqual(resume.disabled, true);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].milliseconds, 1000);
  now = start + 2000;
  timers[0].callback();
  assert.equal(tag(cards[0]).textContent, 'Bookings closed');
  assert.equal(tag(cards[2]).textContent, 'Bookable');
  assert.equal(resume.disabled, true);
  assert.equal(elements.get('sessions').children[0], cards[0]);
  assert.equal(draft.value, '2026-11-03T19:42');
  assert.equal(document.activeElement, resume);
  document.hidden = true;
  now = start + 10000;
  timers[0].callback();
  assert.equal(tag(cards[0]).textContent, 'Bookings closed');
  document.hidden = false;
  listeners.get('visibilitychange')();
  assert.equal(tag(cards[0]).textContent, 'Session started');
  context.api = async () => { throw new Error('The request timed out.'); };
  await runInNewContext('load()', context);
  assert.equal(elements.get('refresh').disabled, false);
  assert.equal(elements.get('offer-fields').disabled, false);
  assert.equal(elements.get('save').disabled, true);
  assert.equal(draft.value, '2026-11-03T19:42');
  context.api = async path => path === '/api/owner/catalog' ? catalog
    : path === '/api/bookings' ? []
      : {bookingCount:0,platformRevenueCentavos:0,averageOrderValueCentavos:0,nearlyFullSessionCount:0};
  await runInNewContext('load()', context);
  assert.equal(elements.get('refresh').disabled, false);
  assert.equal(elements.get('save').disabled, false);
  assert.equal(draft.value, '2026-11-03T19:42');
});
