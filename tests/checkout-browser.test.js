import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

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
    .replace(/^import[^\n]*\r?\n/m, '')
    .replace(/\ntry\s*\{\s*const params = pageParameters[\s\S]*$/, '');

  const context = {
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
      assign(url) { destination = url; },
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
      return { id: 42 };
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
  assert.equal(destination, '/confirmation.html?id=42');
});

test('successful checkout stays locked while confirmation navigation is pending', async () => {
  const elements = new Map();
  const handlers = new Map();
  const sent = [];
  let finishRequest;
  let navigationStarted = false;

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
    .replace(/^import[^\n]*\r?\n/m, '')
    .replace(
      /\ntry\s*\{\s*const params = pageParameters[\s\S]*$/,
      ''
    );

  const context = {
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
      assign() {
        navigationStarted = true;
      },
    },

    retryLimitedBooking: async (path, options, {maxRetries, onWait}) => {
      assert.equal(maxRetries, 1);
      assert.equal(typeof onWait, 'function');
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.equal(body.requestId, '12345678-1234-1234-1234-123456789abc');
      assert.equal(body.expectedTotalCentavos, 1000);
      return context.request(path, options);
    },

    request: async path => {
      if (path === '/api/bookings') {
        sent.push(path);

        if (sent.length === 1) {
          return new Promise(resolve => {
            finishRequest = () => resolve({ id: 42 });
          });
        }

        return { id: 43 };
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

  runInNewContext(
    source + `
      slotId = 1;
      quantity = 1;
      storageKey = 'test';
      quote = {
        unitPriceCentavos: 1000,
        totalPriceCentavos: 1000
      };
      ack.disabled = false;
      ack.checked = true;
      button.disabled = false;
    `,
    context
  );

  const submit = handlers.get('submit');

  assert.equal(typeof submit, 'function');

  const event = { preventDefault() {} };

  const first = submit(event);

  assert.equal(sent.length, 1);
  assert.equal(button.disabled, true);

  // The server confirms the booking, but navigation is still pending.
  finishRequest();
  await first;

  assert.equal(navigationStarted, true);
  assert.equal(button.disabled, true);
  assert.equal(ack.disabled, true);

  // A second submission must not create another booking.
  await submit(event);

  assert.equal(
    sent.length,
    1,
    'a second booking must not be sent'
  );
});