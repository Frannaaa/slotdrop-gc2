import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { postgresDatabase } from "../server/repositories/database.js";
import { COMMISSION_BASIS_POINTS } from "../server/config/business.js";

// CI uses a disposable PostgreSQL service, never a hosted/customer database.
const connection = new URL(process.env.TEST_DATABASE_URL || "http://invalid");
if (
  process.env.CI !== "true" ||
  !["localhost", "127.0.0.1"].includes(connection.hostname) ||
  connection.pathname !== "/slotdrop_test"
) {
  throw new Error(
    "Release verification requires the disposable CI slotdrop_test database.",
  );
}
const base = "http://127.0.0.1:3100";
for (let tries = 0; tries < 40; tries++) {
  try {
    if ((await fetch(base + "/api/health")).ok) break;
  } catch {}
  if (tries === 39) throw new Error("Production container did not start.");
  await new Promise((resolve) => setTimeout(resolve, 250));
}
const file = new URL("../.release-state.json", import.meta.url);
if (process.argv[2] === "before") {
  const response = await fetch(base + "/api/slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: 1,
      startsAt: new Date(Date.now() + 24 * 3600000).toISOString(),
      capacity: 4,
      originalPriceCentavos: 200000,
      offerPriceCentavos: 160000,
      buddyPriceCentavos: 152000,
      runsAsScheduled: true,
    }),
  });
  assert.equal(response.status, 201);
  const slot = await response.json();
  const db = postgresDatabase(process.env.TEST_DATABASE_URL);
  const rate = 152000,
    quantity = 2,
    fee = Math.round((rate * COMMISSION_BASIS_POINTS) / 10000) * quantity;
  try {
    // A fictional receipt fixture proves storage/restart and owner readback only.
    // This is deliberately not a replacement for the team's customer booking route.
    const {
      rows: [receipt],
    } = await db.query(
      `INSERT INTO bookings (request_id,slot_id,quantity,customer_name,customer_email,payment_method,session_starts_at,original_unit_price_centavos,offer_unit_price_centavos,pricing_type,unit_price_centavos,commission_basis_points,total_price_centavos,platform_fee_centavos,provider_payout_centavos)
      VALUES (gen_random_uuid(),$1,$2,'CI Demo','ci@example.com','mock_card',$3,200000,160000,'buddy',$4,$5,$6,$7,$8) RETURNING id`,
      [
        slot.id,
        quantity,
        slot.startsAt,
        rate,
        COMMISSION_BASIS_POINTS,
        rate * quantity,
        fee,
        rate * quantity - fee,
      ],
    );
    await writeFile(
      file,
      JSON.stringify({ slotId: slot.id, bookingId: receipt.id, fee }),
    );
  } finally {
    await db.close();
  }
  console.log(
    "Production container saved a session; fictional receipt fixture inserted for restart verification.",
  );
} else {
  const state = JSON.parse(await readFile(file, "utf8"));
  const receipts = await (await fetch(base + "/api/bookings")).json();
  assert.ok(receipts.some((receipt) => receipt.id === state.bookingId));
  const slot = await (await fetch(base + "/api/slots/" + state.slotId)).json();
  assert.equal(slot.remainingSeats, 2);
  const metrics = await (await fetch(base + "/api/metrics")).json();
  assert.equal(metrics.bookingCount, 1);
  assert.equal(metrics.platformRevenueCentavos, state.fee);
  console.log(
    "PASS: saved session, receipt, derived seats and owner metrics survived production-container restart.",
  );
}
