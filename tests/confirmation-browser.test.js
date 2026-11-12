import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import {
  date,
  escapeHtml,
  money,
  notice,
  pageParameters,
} from '../public/js/customer-common.js';

const validId = '11111111-1111-4111-8111-111111111111';

async function openConfirmation(search, request) {
  const elements = new Map();
  const handlers = new Map();

  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element(id));
    return elements.get(id);
  };

  class Element {
    constructor(id) {
      this.id = id;
      this.hidden = true;
      this.textContent = '';
      this.className = '';
      this.innerHTML = '';
    }

    addEventListener(type, callback) {
      handlers.set(`${this.id}:${type}`, callback);
    }

    replaceChildren() {
      this.innerHTML = '';
    }

    setAttribute() {}
  }

  const source = (await readFile(
    new URL('../public/js/confirmation.js', import.meta.url),
    'utf8'
  )).replace(/^import[^\n]*\r?\n/m, '');

  runInNewContext(source, {
    document: {
      querySelector: selector => get(selector.replace('#', '')),
    },
    location: { search },
    request,
    date,
    escapeHtml,
    money,
    notice,
    pageParameters,
  });

  await new Promise(resolve => setImmediate(resolve));
  return { get, handlers };
}

test('missing and invalid booking references offer Browse, not Reload', async () => {
  for (const search of ['', '?id=not-a-reference', `?id=${validId}&id=${validId}`]) {
    let requests = 0;
    const page = await openConfirmation(search, async () => {
      requests++;
      throw new Error('Should not request an invalid reference');
    });

    assert.match(page.get('status').textContent, /missing or invalid/i);
    assert.equal(page.get('browse').hidden, false);
    assert.equal(page.get('retry').hidden, true);
    assert.equal(requests, 0);
  }
});

test('a nonexistent booking reference offers Browse, not Reload', async () => {
  const page = await openConfirmation(`?id=${validId}`, async () => {
    const error = new Error('Booking not found.');
    error.status = 404;
    throw error;
  });

  assert.match(page.get('status').textContent, /no booking was found/i);
  assert.equal(page.get('browse').hidden, false);
  assert.equal(page.get('retry').hidden, true);
});

test('temporary receipt errors offer Reload and retry when clicked', async () => {
  let requests = 0;
  const page = await openConfirmation(`?id=${validId}`, async () => {
    requests++;
    const error = new Error('Service unavailable');
    error.status = 503;
    throw error;
  });

  assert.match(page.get('status').textContent, /could not be loaded right now/i);
  assert.equal(page.get('retry').hidden, false);
  assert.equal(page.get('browse').hidden, true);

  await page.handlers.get('retry:click')();

  assert.equal(requests, 2);
  assert.equal(page.get('retry').hidden, false);
});

test('confirmation page links its stylesheet and Back to Browse', async () => {
  const [html, css] = await Promise.all([
    readFile(new URL('../public/confirmation.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/css/style.css', import.meta.url), 'utf8'),
  ]);

  assert.match(html, /href="\/css\/style\.css"/);
  assert.match(html, /id="browse" class="button" href="\/browse\.html" hidden[\s\S]*?Back to Browse/);
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
});