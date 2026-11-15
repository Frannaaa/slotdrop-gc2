const config = {
  "origin": "https://slotdrop-gc2-group-zx8j.onrender.com",
  "build": "3ef579da60439a73dbbfc1700a3dc1b9def29806",
  "deploy": "dep-dbsrohu7bikc73fdfbl0",
  "requestId": "13fa83ba-e330-4176-b849-5c9bc08b0ff2",
  "scripts": {
    "/js/checkout.js": "7420275551e06aaaa1aaa2164c88d35ecdf86a15",
    "/js/browse.js": "ded27166e007a337a5d1e664540b6586ab61c179",
    "/js/customer-common.js": "1aed3f3a63bf1e71051b5ce64b35ff86560c4b40"
  }
};

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { inspectGC2 } from './check-gc2-readiness.mjs';

const { origin } = config;
const out = 'live-evidence';
const viewport = { width: 412, height: 823 };
const phone = { viewport, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true };
const browseUrl = origin + '/browse.html';
const time = () => new Date().toISOString();

async function report(filename, label, value) {
  await writeFile(out + '/' + filename, JSON.stringify(value, null, 2) + '\n');
  console.log(label + ' ' + JSON.stringify(value));
}
async function get(path) {
  const response = await fetch(origin + path, {
    cache: 'no-store', signal: AbortSignal.timeout(30_000), redirect: 'error',
  });
  assert.equal(response.status, 200, 'GET ' + path);
  return response.json();
}
async function verifyDeployedScripts() {
  for (const [path, expected] of Object.entries(config.scripts)) {
    const response = await fetch(origin + path, {
      cache: 'no-store', signal: AbortSignal.timeout(30_000), redirect: 'error',
    });
    assert.equal(response.status, 200, 'GET ' + path);
    const bytes = Buffer.from(await response.arrayBuffer());
    const fingerprint = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    assert.equal(fingerprint, expected, 'The deployed script changed: ' + path);
  }
}
async function preflight() {
  for (let attempt = 0; ; attempt += 1) {
    try {
      assert.equal((await get('/api/health')).status, 'ok');
      break;
    } catch (error) {
      if (attempt === 5) throw error;
      await new Promise(resolve => setTimeout(resolve, 5_000));
    }
  }
  await verifyDeployedScripts();
  const checks = await inspectGC2(origin);
  await report('readiness.json', 'SLOTDROP_READINESS', {
    checkedAt: time(), deployedCommit: config.build, origin, checks,
  });
  assert.equal(checks.length, 16);
  assert.ok(checks.every(check => check.pass), 'One or more live readiness checks failed');
}

async function mobileNetwork(chromium) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext(phone);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const seen = new Map();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    cdp.on('Network.requestWillBeSent', event => {
      if (event.request.url.startsWith(origin + '/')) {
        seen.set(event.requestId, {
          path: event.request.url.slice(origin.length),
          start: event.timestamp, type: event.type,
        });
      }
    });
    cdp.on('Network.responseReceived', event => {
      const record = seen.get(event.requestId);
      if (record) record.status = event.response.status;
    });
    cdp.on('Network.loadingFinished', event => {
      const record = seen.get(event.requestId);
      if (record) {
        record.durationMs = Math.round((event.timestamp - record.start) * 1000);
        record.transferBytes = event.encodedDataLength;
      }
    });

    const pageResponse = await page.goto(browseUrl, { waitUntil: 'networkidle', timeout: 60_000 });
    assert.equal(pageResponse.status(), 200, 'Browse returns 200');
    const cards = page.locator('#results .activity-card');
    await cards.first().waitFor();
    await page.waitForLoadState('networkidle');
    const records = [...seen.values()].filter(record => record.durationMs !== undefined)
      .map(({ start, ...record }) => record);
    const listRequest = records.find(record => record.path === '/api/slots?page=1&limit=6');
    assert.equal(listRequest?.status, 200, 'Browse first List API request returns 200');
    const layout = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    const results = {
      measuredAt: time(), browser: browser.version(), viewport,
      deviceScaleFactor: phone.deviceScaleFactor, cacheDisabled: true,
      sameOriginRequests: records.length,
      totalTransferBytes: records.reduce((sum, item) => sum + item.transferBytes, 0),
      listRequest, records, visibleCards: await cards.count(), layout, pageErrors: errors,
    };
    const photo = cards.first().locator('img');
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate(image => image.decode());
    results.firstPhotoLoaded = await photo.evaluate(image => image.naturalWidth > 0);
    await page.screenshot({ path: out + '/browse-mobile.png', fullPage: true, animations: 'disabled' });

    const archive = page.locator('#closed-sessions');
    const archiveResponse = page.waitForResponse(resp =>
      resp.url().startsWith(origin + '/api/slots?') &&
      new URL(resp.url()).searchParams.get('view') === 'closed');
    await archive.locator('summary').click();
    const closed = await archiveResponse;
    assert.equal(closed.status(), 200, 'Closed sessions returns 200');
    const closedItems = await closed.json();
    const closedCards = page.locator('#closed-results .activity-card');
    if (closedItems.length) {
      await closedCards.first().waitFor();
      assert.ok(/Booking closed|Event ended/.test(await closedCards.first().innerText()));
    }
    results.closedSessions = { http: closed.status(), cards: await closedCards.count() };
    await report('browse-network.json', 'SLOTDROP_NETWORK', results);
    assert.ok(results.firstPhotoLoaded, 'The first workshop image failed to load');
    assert.ok(layout.documentWidth <= layout.viewportWidth + 1, 'Browse has horizontal overflow');
    assert.deepEqual(errors, [], 'Browse JavaScript errors');
    return results;
  } finally {
    await browser.close();
  }
}

async function mobileLighthouse(chromium) {
  const port = 9223;
  const browser = await chromium.launch({
    executablePath: chromium.executablePath(),
    args: ['--remote-debugging-address=127.0.0.1', '--remote-debugging-port=' + port],
  });
  try {
    const { default: lighthouse } = await import('lighthouse');
    const { lhr } = await lighthouse(browseUrl, {
      port, logLevel: 'error', output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices'],
    });
    assert.ok(!lhr.runtimeError, lhr.runtimeError?.message);
    const scores = Object.fromEntries(Object.entries(lhr.categories)
      .map(([key, category]) => [key, Math.round(category.score * 100)]));
    const metrics = Object.fromEntries([
      'first-contentful-paint', 'largest-contentful-paint', 'speed-index',
      'total-blocking-time', 'cumulative-layout-shift',
    ].map(key => [key, {
      value: lhr.audits[key].numericValue,
      unit: lhr.audits[key].numericUnit,
    }]));
    const network = lhr.audits['network-requests'].details.items;
    const list = network.find(item => item.url === origin + '/api/slots?page=1&limit=6');
    assert.equal(list?.statusCode, 200, 'Lighthouse saw the List request succeed');
    const start = list.networkRequestTime ?? list.startTime;
    const end = list.networkEndTime ?? list.endTime;
    assert.ok(Number.isFinite(start) && Number.isFinite(end), 'Lighthouse List timings');
    const summary = {
      measuredAt: lhr.fetchTime, version: lhr.lighthouseVersion, browser: browser.version(),
      formFactor: lhr.configSettings.formFactor, throttlingMethod: lhr.configSettings.throttlingMethod,
      screenEmulation: lhr.configSettings.screenEmulation, scores, metrics,
      listApiStatus: list.statusCode, listApiMs: Math.round(end - start), warnings: lhr.runWarnings,
    };
    await report('browse-lighthouse-summary.json', 'SLOTDROP_LIGHTHOUSE', summary);
    await writeFile(out + '/browse-lighthouse.json', JSON.stringify(lhr));
    return summary;
  } finally {
    await browser.close();
  }
}

async function verifyBooking(chromium) {
  await verifyDeployedScripts();
  const slots = await get('/api/slots');
  const slot = slots.find(record => record.startsAt === null && record.remainingSeats >= 1);
  assert.ok(slot, 'A bookable undated practice slot is required');
  const browser = await chromium.launch();
  const attempts = [];
  const waitSeconds = 5;
  try {
    const context = await browser.newContext(phone);
    const page = await context.newPage();
    await page.addInitScript(({ expectedOrigin, requestId }) => {
      if (location.origin === expectedOrigin && location.pathname === '/checkout.html') {
        Object.defineProperty(crypto, 'randomUUID', { value: () => requestId });
      }
    }, { expectedOrigin: origin, requestId: config.requestId });
    await page.route(origin + '/api/bookings', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      const body = route.request().postData();
      const timestamp = Date.now();
      const fields = JSON.parse(body);
      if (fields.requestId !== config.requestId || fields.slotId !== slot.id || fields.quantity !== 1) {
        return route.abort('aborted');
      }
      attempts.push({ body, timestamp });
      if (attempts.length === 1) {
        return route.fulfill({
          status: 429, headers: { 'Retry-After': String(waitSeconds) },
          json: { error: { code: 'RATE_LIMITED', message: 'QA retry check.', retryAfterSeconds: waitSeconds } },
        });
      }
      if (attempts.length !== 2 || body !== attempts[0].body) return route.abort('aborted');
      return route.continue();
    });

    await page.goto(browseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.locator('#results a[href="/detail.html?slotId=' + slot.id + '&quantity=1"]').click();
    await page.waitForURL(url => url.pathname === '/detail.html');
    await page.locator('#continue').click();
    await page.waitForURL(url => url.pathname === '/selection.html');
    await page.locator('#continue').click();
    await page.waitForURL(url => url.pathname === '/checkout.html');
    await page.locator('[name="customerName"]').fill('GC2 Release Check');
    await page.locator('[name="customerEmail"]').fill('gc2-release-check@example.test');
    await page.locator('[name="paymentMethod"]').selectOption('pay_on_site');
    await page.locator('#acceptPrice').check();
    const responses = [];
    page.on('response', response => {
      if (response.url() === origin + '/api/bookings' && response.request().method() === 'POST')
        responses.push(response.status());
    });
    const liveResponse = page.waitForResponse(response =>
      response.url() === origin + '/api/bookings' && response.request().method() === 'POST' &&
      response.status() !== 429, { timeout: 30_000 });
    await page.locator('#submit').click();
    const waitStatus = page.locator('#status').filter({ hasText: 'Retrying this same request in 5 seconds' });
    await waitStatus.waitFor({ timeout: 4_000 });
    const disabledWhileWaiting = await page.locator('#submit').isDisabled();
    const acknowledgementLocked = await page.locator('#acceptPrice').isDisabled();
    assert.ok(disabledWhileWaiting && acknowledgementLocked, 'Checkout must lock the booking while waiting');
    const waitText = await waitStatus.innerText();
    await waitStatus.scrollIntoViewIfNeeded();
    await page.screenshot({ path: out + '/checkout-wait.png', animations: 'disabled' });

    const savedResponse = await liveResponse;
    assert.ok([200, 201].includes(savedResponse.status()), 'Live booking status: ' + savedResponse.status());
    assert.deepEqual(responses, [429, savedResponse.status()]);
    const receipt = await savedResponse.json();
    assert.equal(receipt.status, 'confirmed');
    assert.equal(receipt.slotId, slot.id);
    assert.equal(receipt.quantity, 1);
    assert.equal(receipt.totalPriceCentavos, JSON.parse(attempts[0].body).expectedTotalCentavos);
    assert.equal(attempts.length, 2);
    assert.equal(attempts[1].body, attempts[0].body);
    const waitMs = attempts[1].timestamp - attempts[0].timestamp;
    assert.ok(waitMs >= waitSeconds * 1000, 'Checkout retried too soon');

    const confirmationUrl = origin + '/confirmation.html?id=' + receipt.id;
    await page.waitForURL(confirmationUrl);
    const visibleReceipt = page.locator('#receipt').filter({ hasText: receipt.id });
    await visibleReceipt.waitFor();
    const reloaded = page.waitForResponse(response =>
      response.url() === origin + '/api/bookings/' + receipt.id &&
      response.request().method() === 'GET');
    await page.reload({ waitUntil: 'domcontentloaded' });
    const receiptGet = await reloaded;
    assert.equal(receiptGet.status(), 200);
    const readback = await receiptGet.json();
    for (const key of ['id', 'slotId', 'quantity', 'totalPriceCentavos', 'status']) {
      assert.equal(readback[key], receipt[key], 'Receipt after reload: ' + key);
    }
    await visibleReceipt.waitFor();
    await visibleReceipt.screenshot({ path: out + '/receipt-reloaded.png', animations: 'disabled' });

    const owner = await browser.newPage({ viewport: { width: 1660, height: 1000 } });
    const ownerResponse = owner.waitForResponse(response =>
      response.url() === origin + '/api/bookings' && response.request().method() === 'GET');
    await owner.goto(origin + '/owner.html', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const ownerGet = await ownerResponse;
    assert.equal(ownerGet.status(), 200);
    const ownedList = await ownerGet.json();
    const matching = ownedList.filter(item => item.id === receipt.id);
    assert.equal(matching.length, 1, 'There must be one Owner row for the saved ID');
    const fields = ['id', 'slotId', 'quantity', 'totalPriceCentavos', 'status',
      'platformFeeCentavos', 'providerPayoutCentavos', 'serviceName'];
    for (const field of fields) assert.equal(matching[0][field], receipt[field], 'Owner match: ' + field);
    const ownerRow = owner.locator('#bookings tbody tr').filter({ hasText: receipt.id });
    await ownerRow.waitFor();
    assert.equal(await ownerRow.count(), 1);
    await ownerRow.screenshot({ path: out + '/owner-row.png', animations: 'disabled' });

    const slotAfter = await get('/api/slots/' + slot.id);
    return await report('checkout-and-receipt.json', 'SLOTDROP_BOOKING', {
      checkedAt: time(), deployedCommit: config.build, simulatedFirstResponse: 429,
      simulatedRetryAfterSeconds: waitSeconds, checkoutPostResponses: responses, waitMs, waitText,
      disabledWhileWaiting, acknowledgementLocked, sameRequestId: true, sameRequestBody: true,
      liveBookingStatus: savedResponse.status(), receiptGetAfterReload: receiptGet.status(),
      receipt: Object.fromEntries(fields.map(field => [field, receipt[field]])),
      ownerGetStatus: ownerGet.status(), matchingOwnerRows: matching.length,
      ownerRowText: await ownerRow.innerText(), seatsBefore: slot.remainingSeats, seatsAfter: slotAfter.remainingSeats,
    });
  } finally {
    await browser.close();
  }
}

await mkdir(out, { recursive: true });
const mode = process.argv[2];
if (mode === 'preflight') {
  await preflight();
} else {
  const { chromium } = await import('playwright');
  if (mode === 'browser') await mobileNetwork(chromium);
  else if (mode === 'lighthouse') await mobileLighthouse(chromium);
  else if (mode === 'booking') await verifyBooking(chromium);
  else throw new Error('Expected preflight, browser, lighthouse or booking');
}
