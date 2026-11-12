import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

// Exercise the actual Browse controller with a DOM stub. This is not a claim
// of a deployed/mobile browser test.
test('Browse requests API-filtered page/limit and navigates without skipping slots', async () => {
  class Element {
    constructor() {
      this.children = [];
      this.handlers = {};
      this.textContent = '';
      this.innerHTML = '';
      this.value = '';
      this.disabled = false;
      this.dataset = {};
    }
    addEventListener(type, cb) { this.handlers[type] = cb; }
    replaceChildren(...children) {
      this.children = children;
      this.innerHTML = '';
    }
    append(...children) { this.children.push(...children); }
    setAttribute(name, value) { this[name] = value; }
  }

  const elements = new Map(
    ['#results', '#status', '#search', '#pagination', '#retry'].map(key => [key, new Element()])
  );
  const categories = ['all', 'creative', 'active'].map(category => {
    const button = new Element();
    button.dataset.category = category;
    return button;
  });
  const catalog = Array.from({length:13}, (_x, i) => ({
    id:i+1, serviceName:'Pottery '+(i+1), providerName:'Demo Studio',
    category:i%2===0?'creative':'active',
  }));
  const sent = [];
  const source = (await readFile(new URL('../public/js/browse.js', import.meta.url), 'utf8'))
    .replace(/^import .*?;\r?\n/m, '');

  const request = async path => {
    sent.push(path);
    const url = new URL(path, 'http://example.test');
    assert.equal(url.pathname, '/api/slots');
    const params = url.searchParams;
    assert.ok(params.has('page'), 'API pagination must be used on every Browse request');
    assert.ok(params.has('limit'), 'a bounded API limit must be used');
    const page = Number(params.get('page')), limit = Number(params.get('limit'));
    assert.equal(limit, 6);
    assert.ok(Number.isSafeInteger(page) && page > 0);
    const match = catalog.filter(slot =>
      (!params.has('category') || slot.category === params.get('category')) &&
      (!params.has('q') || slot.serviceName.toLowerCase().includes(params.get('q').toLowerCase()))
    );
    return match.slice((page-1)*limit, page*limit);
  };

  runInNewContext(source, {
    document: {
      querySelector: selector => elements.get(selector),
      querySelectorAll: () => categories,
      createElement: () => new Element(),
    },
    URLSearchParams, request,
    card: slot => '<article data-slot="' + slot.id + '"></article>',
    notice(el, text) { el.textContent = text; },
    setTimeout(fn) { fn(); return 1; },
    clearTimeout() {},
  });

  const flush = () => new Promise(resolve => setImmediate(resolve));
  const results = elements.get('#results');
  const pagination = elements.get('#pagination');
  const pageButton = label => pagination.children.find(el => el.textContent === label);
  const shownIds = () => [...results.innerHTML.matchAll(/data-slot="(\d+)"/g)].map(m => Number(m[1]));

  await flush();
  assert.deepEqual(shownIds(), [1,2,3,4,5,6]);
  assert.equal(pageButton('Next').disabled, false);
  assert.equal(pageButton('Previous').disabled, true);
  pageButton('Next').handlers.click();
  await flush();
  assert.deepEqual(shownIds(), [7,8,9,10,11,12]);
  pageButton('Next').handlers.click();
  await flush();
  assert.deepEqual(shownIds(), [13]);
  assert.equal(pageButton('Next').disabled, true);
  assert.equal(pageButton('Previous').disabled, false);
  assert.match(elements.get('#status').textContent, /page 3/);
  pageButton('Previous').handlers.click();
  await flush();
  assert.deepEqual(shownIds(), [7,8,9,10,11,12]);

  elements.get('#search').value = 'Pottery 2';
  elements.get('#search').handlers.input();
  await flush();
  assert.deepEqual(shownIds(), [2], 'search resets to page one and filters before SQL pagination');
  assert.ok(sent.some(path => path.includes('q=Pottery+2') && path.includes('page=1')));
  assert.equal(pagination.children.length, 0, 'single result does not display false pagination');

  elements.get('#search').value = '';
  elements.get('#search').handlers.input();
  categories[2].handlers.click();
  await flush();
  assert.deepEqual(shownIds(), [2,4,6,8,10,12]);
  assert.ok(sent.some(path => path.includes('category=active') && path.includes('limit=6')));
  assert.equal(pagination.children.length, 0, 'exactly one full page has no phantom next button');
  assert.ok(sent.every(path => path !== '/api/slots'), 'never fetch the unpaginated list');
});
