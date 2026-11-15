import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';

const origin = 'http://127.0.0.1:3100';
const target = origin + '/browse.html';
await mkdir('browse-preview', { recursive: true });
const slots = await (await fetch(origin + '/api/slots?page=1&limit=6')).json();
assert.equal(slots.filter(row => row.startsAt === null).length, 3);
assert.deepEqual(slots.slice(0, 3).map(row => row.studioReference.key),
  ['laro-mug', 'bumi-mug', 'sip-open']);

const browser = await chromium.launch();
const browserChecks = [];
const practice = slots.slice(0, 3).map(row => ({ workshop: row.serviceName, studio: row.providerName, seats: row.remainingSeats }));
try {
  for (const viewport of [{ width: 1366, height: 900 }, { width: 412, height: 823 }]) {
    const phone = viewport.width < 600;
    const ctx = await browser.newContext({ viewport, isMobile: phone, hasTouch: phone });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(target, { waitUntil: 'networkidle' });
    const practiceButtons = page.getByRole('link', { name: 'Try practice booking' });
    await practiceButtons.first().waitFor();
    assert.equal(await practiceButtons.count(), 3);
    const cards = page.locator('#results .activity-card');
    assert.equal(await cards.count(), 6);
    assert.match(await cards.nth(2).innerText(), /Sip & Gogh/);
    const photo = cards.nth(2).locator('img');
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate(img => img.decode());
    assert.ok(await photo.evaluate(img => img.naturalWidth > 0));
    if (phone) {
      await cards.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'browse-preview/available-phone.png', animations: 'disabled' });
    } else {
      await page.locator('#results').screenshot({ path: 'browse-preview/available-desktop.png', animations: 'disabled' });
    }
    const details = page.locator('#closed-sessions');
    assert.equal(await details.getAttribute('open'), null, 'The archive starts collapsed');
    await details.locator('summary').click();
    const closed = page.locator('#closed-results .closed-card');
    await closed.first().waitFor();
    assert.match(await closed.first().innerText(), /Event ended/);
    assert.equal(await closed.locator('img, .party-price').count(), 0);
    assert.equal(await closed.getByRole('link', { name: 'View details' }).count(), await closed.count());
    const sizes = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      totalWidth: document.documentElement.scrollWidth,
      archiveColumns: getComputedStyle(document.querySelector('#closed-results')).gridTemplateColumns,
      cardLayout: getComputedStyle(document.querySelector('.closed-card .card-body')).display,
    }));
    assert.equal(sizes.width, sizes.totalWidth, 'No horizontal overflow after opening the archive');
    assert.equal(sizes.archiveColumns.trim().split(/\s+/).length, 1);
    assert.equal(sizes.cardLayout, phone ? 'flex' : 'grid');
    assert.deepEqual(errors, []);
    await details.screenshot({ path: 'browse-preview/archive-' + (phone ? 'phone' : 'desktop') + '.png', animations: 'disabled' });
    browserChecks.push({ viewport, available: 6, practice: 3, closed: await closed.count(), ...sizes });
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log('SLOTDROP_CARD_PREVIEW ' + JSON.stringify({ practice, browserChecks }));
const port = 9223;
const auditBrowser = await chromium.launch({
  executablePath: chromium.executablePath(),
  args: ['--remote-debugging-address=127.0.0.1', '--remote-debugging-port=' + port],
});
try {
  const { lhr } = await lighthouse(target, { port, logLevel: 'error', onlyCategories: ['best-practices'] });
  assert.ok(!lhr.runtimeError, lhr.runtimeError?.message);
  const audits = lhr.categories['best-practices'].auditRefs
    .filter(a => a.weight > 0 && lhr.audits[a.id]?.score === 0)
    .map(a => ({ id: a.id, title: lhr.audits[a.id].title }));
  console.log('SLOTDROP_LIGHTHOUSE_PREVIEW ' + JSON.stringify({
    bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
    errorAudit: lhr.audits['errors-in-console']?.score, failedAudits: audits,
    version: lhr.lighthouseVersion, formFactor: lhr.configSettings.formFactor,
  }));
} finally {
  await auditBrowser.close();
}
