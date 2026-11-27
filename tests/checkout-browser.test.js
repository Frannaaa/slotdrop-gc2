import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import * as common from '../public/js/customer-common.js';

const receiptId = 'a1000000-0000-4000-8000-000000000001';
const sampleQuote = {
  slotId: 1, quantity: 1, pricingType: 'standard',
  unitPriceCentavos: 1000, totalPriceCentavos: 1000,
};
const sampleReceipt = {
  ...sampleQuote, id: receiptId, status: 'confirmed', paymentMethod: 'mock_card',
  serviceName: 'Demo session', providerName: 'Demo studio', sessionStartsAt: null,
};

test('429 checkout shows the wait message, retries the same booking, and opens its confirmation', async () => {
  const elements = new Map();
  const handlers = new Map();
  const sent = [];
  let destination;

  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element(id));
    return elements.get(id);
  };

  class Element {
    constructor(id) {
      this.id = id;
      this.value = '';
      this.checked = false;
      this.disabled = false;
      this.textContent = '';
      this.elements = { namedItem: name => get(name) };
    }

    addEventListener(type, callback) {
      handlers.set(this.id === 'checkout' ? type : `${this.id}:${type}`, callback);
    }

    reportValidity() {
      return true;
    }
  }

  const form = get('checkout');
  const button = get('submit');
  const ack = get('acceptPrice');
  for (const id of ['retry', 'summary', 'status', 'chosenSession', 'priceLabel']) get(id);
  get('customerName').value = 'Demo Guest';
  get('customerEmail').value = 'demo@example.com';
  get('paymentMethod').value = 'mock_card';

  const source = (await readFile(
    new URL('../public/js/checkout.js', import.meta.url),
    'utf8'
  ))
    .replace(/^import\s*\{[^}]*\}\s*from "\.\/customer-common\.js";\r?\n/m, '')
    .replace(/\ntry\s*\{\s*const params = pageParameters[\s\S]*$/, '');

  const context = {
    ...common,
    document: { querySelector: selector => get(selector.replace('#', '')) },
    FormData: class {
      get(name) { return get(name).value; }
    },
    sessionStorage: {
      stored: null,
      setItem(key, value) { this.stored = value; },
      getItem() { return this.stored; },
      removeItem() { this.stored = null; },
    },
    crypto: { randomUUID: () => '12345678-1234-1234-1234-123456789abc' },
    URLSearchParams,
    location: {
      search: '?slotId=1&quantity=1',
      replace(url) { destination = url; },
    },
    retryLimitedBooking: async (path, options, {maxRetries, onWait}) => {
      assert.equal(maxRetries, 1);
      const firstAttempt = context.request(path, options);
      try {
        return await firstAttempt;
      } catch (error) {
        assert.equal(error.status, 429);
        onWait(error.retryAfterSeconds);
        return context.request(path, options);
      }
    },
    request: async (path, options) => {
      assert.equal(path, '/api/bookings');
      sent.push(options.body);
      if (sent.length === 1) {
        const error = new Error('Rate limited');
        error.status = 429;
        error.retryAfterSeconds = 4;
        throw error;
      }
      return sampleReceipt;
    },
    money: value => String(value),
    date: value => String(value),
    positive: value => Number(value),
    pageParameters: () => new URLSearchParams('slotId=1&quantity=1'),
    notice(element, message) { element.textContent = message; },
  };

  runInNewContext(source + `
    slotId = 1;
    quantity = 1;
    storageKey = 'test';
    quote = { unitPriceCentavos: 1000, totalPriceCentavos: 1000 };
    ack.disabled = false;
    ack.checked = true;
    button.disabled = false;
  `, context);

  await handlers.get('submit')({ preventDefault() {} });

  assert.match(get('status').textContent, /Booking traffic is high\. Retrying this same request in 4 seconds/);
  assert.equal(sent.length, 2);
  assert.equal(sent[0], sent[1], 'the retry must reuse the exact booking body');
  assert.equal(JSON.parse(sent[0]).requestId, '12345678-1234-1234-1234-123456789abc');
  assert.equal(destination, '/confirmation.html?id=' + receiptId);
});

test('checkout verifies the quote and preserves one request through confirmation failures', async () => {
  const elements = new Map();
  const handlers = new Map();
  const sent = [];
  let finishRequest;
  let navigationStarted = false;
  let quoteReply;
  let bookingFailure;
  let navigationFails = false;

  const get = id => {
    if (!elements.has(id)) {
      elements.set(id, new Element(id));
    }
    return elements.get(id);
  };

  class Element {
    constructor(id) {
      this.id = id;
      this.value = '';
      this.checked = false;
      this.disabled = false;
      this.textContent = '';
      this.elements = { namedItem: name => get(name) };
    }

    addEventListener(type, callback) {
      handlers.set(
        this.id === 'checkout' ? type : `${this.id}:${type}`,
        callback
      );
    }

    reportValidity() {
      return true;
    }
  }

  const form = get('checkout');
  const button = get('submit');
  const ack = get('acceptPrice');
  get('retry');
  get('summary');
  get('status');
  get('chosenSession');
  get('priceLabel');

  get('customerName').value = 'Demo Guest';
  get('customerEmail').value = 'demo@example.com';
  get('paymentMethod').value = 'mock_card';

  const source = (await readFile(
    new URL('../public/js/checkout.js', import.meta.url),
    'utf8'
  ))
    .replace(/^import\s*\{[^}]*\}\s*from "\.\/customer-common\.js";\r?\n/m, '')
    .replace(
      /\ntry\s*\{\s*const params = pageParameters[\s\S]*$/,
      ''
    );

  const context = {
    ...common,
    document: {
      querySelector(selector) {
        return get(selector.replace('#', ''));
      },
    },

    FormData: class {
      constructor() {}
      get(name) {
        return get(name).value;
      }
    },

    sessionStorage: {
      stored: null,
      setItem(key, value) {
        this.stored = value;
      },
      getItem() {
        return this.stored;
      },
      removeItem() {
        this.stored = null;
      },
    },

    crypto: {
      randomUUID: () => '12345678-1234-1234-1234-123456789abc',
    },

    URLSearchParams,

    location: {
      search: '?slotId=1&quantity=1',
      replace() {
        if (navigationFails) throw new Error('Navigation was interrupted');
        navigationStarted = true;
      },
    },

    retryLimitedBooking: async (path, options, {maxRetries, onWait}) => {
      assert.equal(maxRetries, 1);
      assert.equal(typeof onWait, 'function');
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.equal(body.requestId, '12345678-1234-1234-1234-123456789abc');
      return context.request(path, options);
    },

    request: async (path, options) => {
      if (path === '/api/slots/1') return { serviceName: 'Demo session', startsAt: null, demoVariant: 2 };
      if (path.startsWith('/api/pricing/quote?')) {
        if (!quoteReply) throw new Error('Quote unavailable');
        return quoteReply;
      }
      if (path === '/api/bookings') {
        sent.push(options.body);
        if (bookingFailure) throw bookingFailure;
        return new Promise(resolve => {
          finishRequest = resolve;
        });
      }

      throw new Error('Unexpected request: ' + path);
    },

    money: value => String(value),
    date: value => String(value),
    positive: value => Number(value),

    pageParameters: () =>
      new URLSearchParams('slotId=1&quantity=1'),

    notice(element, message) {
      element.textContent = message;
    },
  };

  const load = runInNewContext(
    source + `
      slotId = 1;
      quantity = 1;
      storageKey = 'test';
      load;
    `,
    context
  );

  const submit = handlers.get('submit');

  assert.equal(typeof submit, 'function');

  const event = { preventDefault() {} };

  const failedQuote = load();
  assert.equal(button.disabled, true);
  assert.equal(ack.disabled, true);
  assert.equal(ack.checked, false);
  await failedQuote;
  assert.equal(get('retry').disabled, false);

  quoteReply = { ...sampleQuote, slotId: 2 };
  await load();
  assert.equal(ack.disabled, true, 'a quote for the wrong session cannot be accepted');
  assert.equal(get('retry').disabled, false);

  quoteReply = sampleQuote;
  await load();
  assert.equal(get('chosenSession').textContent, 'Demo session · Month Y, 20XX');
  assert.equal(ack.disabled, false);
  assert.equal(ack.checked, false);
  assert.equal(button.disabled, true);
  await submit(event);
  assert.equal(sent.length, 0);
  ack.checked = true;
  handlers.get('acceptPrice:change')();
  assert.equal(button.disabled, false);

  bookingFailure = Object.assign(new Error('Price changed'), {
    status: 409, code: 'PRICE_CHANGED',
    quote: { ...sampleQuote, unitPriceCentavos: 1100, totalPriceCentavos: 1100 },
  });
  await submit(event);
  assert.equal(get('summary').textContent, '1 × 1100 = 1100');
  assert.equal(ack.checked, false);
  assert.equal(button.disabled, true);
  await submit(event);
  assert.equal(sent.length, 1, 'the new total needs fresh acceptance');

  ack.checked = true;
  handlers.get('acceptPrice:change')();
  bookingFailure = Object.assign(new Error('Price changed'), {
    status: 409, code: 'PRICE_CHANGED', quote: { ...sampleQuote, quantity: 2 },
  });
  await submit(event);
  assert.equal(JSON.parse(sent.at(-1)).expectedTotalCentavos, 1100);
  assert.equal(ack.disabled, true);
  assert.equal(get('summary').textContent, '');
  assert.match(get('status').textContent, /Refresh quote/);
  sent.length = 0;

  bookingFailure = undefined;
  await load();
  ack.checked = true;
  handlers.get('acceptPrice:change')();
  const first = submit(event);

  assert.equal(sent.length, 1);
  assert.equal(JSON.parse(sent[0]).expectedTotalCentavos, 1000);
  assert.equal(button.disabled, true);

  finishRequest({ ...sampleReceipt, slotId: 2 });
  await first;
  assert.equal(navigationStarted, false);
  assert.equal(button.textContent, 'Retry booking');
  assert.equal(context.sessionStorage.stored, sent[0]);

  for (const status of [429, 403]) {
    bookingFailure = Object.assign(new Error('Temporary gateway response'), { status });
    await submit(event);
    assert.equal(button.textContent, 'Retry booking');
    assert.equal(context.sessionStorage.stored, sent[0]);
    assert.equal(sent.at(-1), sent[0]);
  }

  bookingFailure = undefined;
  navigationFails = true;
  const interrupted = submit(event);
  finishRequest(sampleReceipt);
  await interrupted;
  assert.equal(navigationStarted, false);
  assert.equal(button.textContent, 'Retry booking');
  assert.equal(context.sessionStorage.stored, sent[0]);

  navigationFails = false;
  const retryBooking = submit(event);
  assert.ok(sent.every(body => body === sent[0]), 'every retry sends the same booking body');

  // The server confirms the booking, but navigation is still pending.
  finishRequest(sampleReceipt);
  await retryBooking;

  assert.equal(navigationStarted, true);
  assert.equal(button.disabled, true);
  assert.equal(ack.disabled, true);
  assert.equal(context.sessionStorage.stored, null);

  // A second submission must not create another booking.
  await submit(event);

  assert.equal(
    sent.length,
    5,
    'no further booking is sent after a valid receipt'
  );
});

test('Selection shows the session and waits for a verified quote for the current size', async () => {
  const elements = new Map();
  const get = selector => {
    if (!elements.has(selector)) {
      let value = '';
      elements.set(selector, {
        get value() { return value; },
        set value(next) { value = String(next); },
        disabled: true, textContent: '', callbacks: {},
        setAttribute() {},
        addEventListener(type, callback) { this.callbacks[type] = callback; },
      });
    }
    return elements.get(selector);
  };
  let quote = sampleQuote;
  let quoteFailure = new Error('Quote temporarily unavailable');
  let loadSession;
  const session = new Promise(resolve => { loadSession = resolve; });
  const source = (await readFile(new URL('../public/js/selection.js', import.meta.url), 'utf8'))
    .replace(/^import\s*\{[^}]*\}\s*from "\.\/customer-common\.js";\r?\n/m, '');
  runInNewContext(source, {
    ...common, URLSearchParams,
    document: { querySelector: get },
    location: { search: '?slotId=1&quantity=2' },
    request: async url => {
      if (!url.startsWith('/api/pricing/quote')) return session;
      if (quoteFailure) throw quoteFailure;
      return quote;
    },
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(get('#continue').disabled, true);
  assert.equal(get('#status').textContent, 'Quote temporarily unavailable');
  loadSession({ serviceName: 'Demo pottery', startsAt: null });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(get('#chosenSession').textContent, /Demo pottery/);
  assert.equal(get('#continue').disabled, true);
  assert.equal(get('#summary').textContent, '');

  quoteFailure = null;
  await get('#retry').callbacks.click();
  assert.equal(get('#continue').disabled, true);
  assert.match(get('#status').textContent, /could not verify/i);
  quote = { ...sampleQuote, quantity: 2, totalPriceCentavos: 2000 };
  await get('#retry').callbacks.click();
  assert.equal(get('#continue').disabled, false);
  assert.match(get('#summary').textContent, /2 x/);
});
