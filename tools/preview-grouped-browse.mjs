import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';

const origin = 'http://127.0.0.1:3100';
const target = origin + '/browse.html';
await mkdir('browse-preview', { recursive: true });

async function get(path) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, path);
  return response.json();
}
const practice = await get('/api/slots?view=practice');
const first = await get('/api/slots?page=1&limit=6&view=workshops');
const second = await get('/api/slots?page=2&limit=6&view=workshops');
assert.equal(practice.length, 3);
assert.ok(practice.every(s => s.startsAt === null));
assert.equal(first.workshops.length, 6);
assert.ok(first.hasNextPage);
assert.ok(second.workshops.length > 0);
const ids = [...first.workshops, ...second.workshops].map(group => group.serviceId);
assert.equal(new Set(ids).size, ids.length, 'No duplicate workshop across both pages');
const repeated = first.workshops.find(group => group.sessions.length > 1);
assert.ok(repeated, 'At least one workshop should have multiple genuine dates');

const browser = await chromium.launch();
const outcomes = [];
try {
  for (const viewport of [{ width: 1366, height: 900 }, { width: 412, height: 823 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    const browseCalls = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.searchParams.get('view') === 'workshops') browseCalls.push(url.searchParams.get('page'));
    });
    await page.goto(target);
    const available = page.locator('#results .activity-card');
    const samples = page.locator('#practice-results .activity-card');
    const rows = page.locator('#results .session-options a');
    await available.first().waitFor();
    await samples.first().waitFor();
    assert.equal(await available.count(), 6);
    assert.equal(await samples.count(), 3);
    assert.equal(await samples.locator('img').count(), 0);
    assert.equal(await samples.getByText('Sample booking with no expiry for grading.').count(), 3);
    const group = available.filter({ hasText: repeated.sessions[0].serviceName });
    assert.equal(await group.count(), 1);
    for (const session of repeated.sessions) {
      const link = group.locator('a[href="/detail.html?slotId=' + session.id + '&quantity=1"]');
      assert.equal(await link.count(), 1, 'Each date has its own booking link');
    }
    assert.ok(await rows.count() > 1);
    assert.deepEqual(browseCalls, ['1'], 'Browse makes one scheduled list request per page');
    const photo = available.first().locator('img');
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate(image => image.decode());
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
      fonts: performance.getEntriesByType('resource').map(r => r.name)
        .filter(url => /\/fonts\/[^/]+\.woff2$/.test(url)).map(url => url.split('/').pop()),
    }));
    assert.equal(layout.viewport, layout.content);
    assert.ok(layout.fonts.includes('SpaceGrotesk700.woff2'));
    await page.screenshot({ path: 'browse-preview/browse-' + viewport.width + '.png', fullPage: true });
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('page 2'));
    assert.equal(await available.count(), second.workshops.length);
    assert.equal(await samples.count(), 3);
    assert.deepEqual(browseCalls, ['1', '2']);
    assert.equal(await page.locator('#closed-sessions').evaluate(node => node.open), false);
    await page.locator('#closed-sessions summary').click();
    const archive = page.locator('#closed-results .closed-card');
    await archive.first().waitFor();
    assert.match(await archive.first().innerText(), /Booking closed|Event ended/);
    assert.equal(await archive.locator('img').count(), 0);
    assert.deepEqual(errors, []);
    outcomes.push({ width: viewport.width, practice: 3, workshops: first.workshops.length,
      repeatedDates: repeated.sessions.length, secondPageWorkshops: second.workshops.length,
      closedRows: await archive.count(), assets: layout.fonts });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log('SLOTDROP_BROWSE_GROUPS ' + JSON.stringify(outcomes));

for (let attempt = 1; attempt <= 3; attempt++) {
  const port = 9230 + attempt;
  const chrome = await chromium.launch({
    executablePath: chromium.executablePath(),
    args: ['--remote-debugging-address=127.0.0.1', '--remote-debugging-port=' + port],
  });
  try {
    const { lhr } = await lighthouse(target, {
      port, logLevel: 'error', output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices'],
    });
    assert.ok(!lhr.runtimeError, lhr.runtimeError?.message);
    const scores = Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const failures = Object.fromEntries(Object.entries(lhr.categories).map(([key, category]) =>
      [key, category.auditRefs.filter(({id,weight}) => weight && lhr.audits[id].score != null && lhr.audits[id].score < 1)
        .map(({id}) => [id, lhr.audits[id].score, lhr.audits[id].numericValue])]));
    const result = { attempt, scores, failures, lighthouse: lhr.lighthouseVersion, formFactor: lhr.configSettings.formFactor };
    console.log('SLOTDROP_LIGHTHOUSE_GROUPED ' + JSON.stringify(result));
    await writeFile('browse-preview/lighthouse-' + attempt + '.json', JSON.stringify(lhr));
    assert.equal(scores['best-practices'], 100);
    assert.equal(scores.accessibility, 100);
  } finally {
    await chrome.close();
  }
}
