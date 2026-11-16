import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

// Exercise the actual Browse controller with a DOM stub. This is not a claim
// of a deployed/mobile browser test.
test('Browse pages workshops separately from practice bookings and closed dates', async () => {
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
    ['#results', '#status', '#search', '#when', '#people', '#sort', '#pagination', '#retry',
      '#practice-sessions', '#practice-results', '#practice-status', '#practice-retry',
      '#closed-sessions', '#closed-results', '#closed-status', '#closed-retry'].map(key => [key, new Element()])
  );
  elements.get('#people').value = '1';
  const activities = ['all', 'pottery', 'painting'].map(activity => {
    const button = new Element();
    button.dataset.activity = activity;
    return button;
  });
  const catalog = Array.from({length:13}, (_x, i) => ({
    id:i+1, serviceName:'Pottery '+(i+1), providerName:'Demo Studio',
    activityType:i%2===0?'pottery':'painting',
  }));
  const sent = [];
  let failWorkshops = false;
  let failClosed = false;
  let failPractice = true;
  const source = (await readFile(new URL('../public/js/browse.js', import.meta.url), 'utf8'))
    .replace(/^import .*?;\r?\n/m, '');

  const request = async path => {
    sent.push(path);
    const url = new URL(path, 'http://example.test');
    assert.equal(url.pathname, '/api/slots');
    const params = url.searchParams;
    const page = Number(params.get('page')), limit = Number(params.get('limit'));
    if (params.get('view') === 'closed') {
      assert.equal(limit, 16);
      if (failClosed) throw new Error('Request failed');
      return [{ id: 17 }];
    }
    if (params.get('view') === 'practice') {
      if (failPractice) throw new Error('Request failed');
      return [{ id: 18 }];
    }
    assert.equal(params.get('view'), 'workshops');
    assert.ok(params.has('page'), 'API pagination must be used on every workshop page request');
    assert.ok(params.has('limit'), 'a bounded API limit must be used');
    assert.equal(limit, 6);
    assert.ok(Number.isSafeInteger(page) && page > 0);
    if (failWorkshops) throw new Error('Request failed');
    const match = catalog.filter(slot =>
      (!params.has('type') || slot.activityType === params.get('type')) &&
      (!params.has('q') || slot.serviceName.toLowerCase().includes(params.get('q').toLowerCase()))
    );
    return {
      workshops: match.slice((page - 1) * limit, page * limit)
        .map(slot => ({ serviceId: slot.id, sessions: [slot] })),
      hasNextPage: match.length > page * limit,
    };
  };

  runInNewContext(source, {
    document: {
      querySelector: selector => elements.get(selector),
      querySelectorAll: () => activities,
      createElement: () => new Element(),
    },
    URLSearchParams, request,
    card: (slot, _quantity, { closed = false } = {}) =>
      '<article data-slot="' + slot.id + '" data-closed="' + closed + '"></article>',
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
  assert.equal(sent.filter(path => path.includes('view=workshops')).length, 1, 'page and Next state use one request');
  const practiceDisclosure = elements.get('#practice-sessions');
  const practiceRetry = elements.get('#practice-retry');
  assert.equal(sent.filter(path => path.includes('view=practice')).length, 1,
    'always-visible grading panel loads automatically once');
  assert.equal(practiceDisclosure.handlers.toggle, undefined, 'grading examples are not collapsible');
  assert.equal(practiceRetry.hidden, false);
  failPractice = false;
  practiceRetry.handlers.click();
  await flush();
  assert.match(elements.get('#practice-results').innerHTML, /data-slot="18"/);
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
  activities[2].handlers.click();
  await flush();
  assert.deepEqual(shownIds(), [2,4,6,8,10,12]);
  assert.equal(sent.filter(path => path.includes('view=practice')).length, 2, 'workshop filters never reload the practice section');
  assert.ok(sent.some(path => path.includes('type=painting') && path.includes('limit=6')));
  assert.equal(pagination.children.length, 0, 'exactly one full page has no phantom next button');
  assert.ok(sent.every(path => path !== '/api/slots'), 'never fetch the unpaginated list');

  failWorkshops = true;
  activities[0].handlers.click();
  await flush();
  assert.deepEqual(shownIds(), []);
  assert.match(elements.get('#status').textContent, /Request failed/);
  assert.match(elements.get('#practice-results').innerHTML, /data-slot="18"/);
  const retry = elements.get('#retry');
  assert.equal(retry.disabled, false);
  assert.equal(retry.hidden, false);
  failWorkshops = false;
  retry.handlers.click();
  await flush();
  assert.deepEqual(shownIds(), [1,2,3,4,5,6]);
  assert.ok(sent.every(path => !path.includes('view=closed')), 'closed results load on demand');
  const disclosure = elements.get('#closed-sessions');
  const closedRetry = elements.get('#closed-retry');
  disclosure.open = true;
  failClosed = true;
  disclosure.handlers.toggle();
  await flush();
  assert.equal(closedRetry.hidden, false);
  failClosed = false;
  closedRetry.handlers.click();
  await flush();
  assert.match(elements.get('#closed-results').innerHTML, /data-slot="17" data-closed="true"/);
  assert.deepEqual(shownIds(), [1,2,3,4,5,6]);
});
