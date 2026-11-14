import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

test('checkout requires acceptance after a quote and stays locked through confirmation', async () => {
  const elements = new Map();
  const handlers = new Map();
  const sent = [];
  let finishRequest;
  let navigationStarted = false;
  let quoteAvailable = false;

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
      if (path === '/api/slots/1') return { serviceName: 'Demo session' };
      if (path.startsWith('/api/pricing/quote?')) {
        if (!quoteAvailable) throw new Error('Quote unavailable');
        return { unitPriceCentavos: 1000, totalPriceCentavos: 1000 };
      }
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

  quoteAvailable = true;
  await load();
  assert.equal(ack.disabled, false);
  assert.equal(ack.checked, false);
  assert.equal(button.disabled, true);
  await submit(event);
  assert.equal(sent.length, 0);
  ack.checked = true;
  handlers.get('acceptPrice:change')();
  assert.equal(button.disabled, false);

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
