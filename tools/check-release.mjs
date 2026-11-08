import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

// Only ever run against the disposable localhost PostgreSQL CI database.
// Never point this test at a hosted database or real studio account.
const connection = new URL(process.env.TEST_DATABASE_URL || "http://invalid");
if (
  process.env.CI !== "true" ||
  !["localhost", "127.0.0.1"].includes(connection.hostname) ||
  connection.pathname !== "/slotdrop_test"
) {
  throw new Error("Release verification requires the disposable CI slotdrop_test database.");
}

const base = "http://127.0.0.1:3100";
async function json(path, options) {
  const response = await fetch(base + path, options);
  return { status: response.status, body: await response.json() };
}
const postBooking = request => json("/api/bookings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(request)
});

for (let tries = 0; tries < 40; tries++) {
  try {
    if ((await fetch(base + "/api/health")).ok) break;
  } catch {}
  if (tries === 39) throw new Error("Production container did not start.");
  await new Promise(resolve => setTimeout(resolve, 250));
}

const file = new URL("../.release-state.json", import.meta.url);
if (process.argv[2] === "before") {
  const {status,body:slot} = await json("/api/slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: 1,
      startsAt: new Date(Date.now() + 24 * 3600000).toISOString(),
      capacity: 4,
      originalPriceCentavos: 200000,
      offerPriceCentavos: 160000,
      buddyPriceCentavos: 152000,
      runsAsScheduled: true
    })
  });
  assert.equal(status, 201, "Create a disposable demo session through the Owner API");
  const quantity = 2;
  const quote = await json("/api/pricing/quote?slotId=" + slot.id + "&quantity=" + quantity);
  assert.equal(quote.status, 200, "Quote must work in the production container");
  assert.equal(quote.body.totalPriceCentavos, 304000);
  assert.equal(quote.body.platformFeeCentavos, 30400);

  const request = {
    requestId: randomUUID(),
    slotId: slot.id,
    quantity,
    customerName: "CI Demo",
    customerEmail: "ci@example.com",
    paymentMethod: "mock_card",
    expectedTotalCentavos: quote.body.totalPriceCentavos
  };
  const saved = await postBooking(request);
  assert.equal(saved.status, 201, "Booking must be saved through the real transactional API");
  assert.equal(saved.body.slotId, slot.id);
  assert.equal(saved.body.quantity, quantity);
  assert.equal(saved.body.totalPriceCentavos, quote.body.totalPriceCentavos);
  assert.equal(saved.body.platformFeeCentavos, quote.body.platformFeeCentavos);
  assert.match(saved.body.id, /^[0-9a-f-]{36}$/);

  await writeFile(file, JSON.stringify({
    slotId: slot.id, bookingId: saved.body.id,
    total: saved.body.totalPriceCentavos,
    fee: saved.body.platformFeeCentavos,
    request
  }));
  console.log("PASS: production container quoted and persisted a booking through the transactional API.");
} else if (process.argv[2] === "after") {
  const state = JSON.parse(await readFile(file, "utf8"));
  const receipt = await json("/api/bookings/" + state.bookingId);
  assert.equal(receipt.status, 200);
  assert.equal(receipt.body.id, state.bookingId);
  assert.equal(receipt.body.totalPriceCentavos, state.total);
  assert.equal(receipt.body.platformFeeCentavos, state.fee);

  // Identical retries across process restarts must return the original booking,
  // not charge more seats or create a second receipt.
  const retry = await postBooking(state.request);
  assert.equal(retry.status, 200, "An identical idempotency key must replay after restart");
  assert.deepEqual(retry.body, receipt.body);

  const list = await json("/api/bookings");
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 1, "Retry must not create a duplicate booking");
  assert.equal(list.body[0].id, state.bookingId);
  const slot = await json("/api/slots/" + state.slotId);
  assert.equal(slot.status, 200);
  assert.equal(slot.body.remainingSeats, 2);
  const metrics = await json("/api/metrics");
  assert.equal(metrics.status, 200);
  assert.equal(metrics.body.bookingCount, 1);
  assert.equal(metrics.body.platformRevenueCentavos, state.fee);
  console.log("PASS: transactional receipt, retry, seats and Owner metrics survived production-container restart.");
} else {
  throw new Error('Choose "before" or "after" for the release verification stage.');
}
