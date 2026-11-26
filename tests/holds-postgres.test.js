import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';

test('PostgreSQL hold and booking requests race for one seat without overselling', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const f = await fixture();
  try {
    await f.db.query('UPDATE slots SET capacity=1 WHERE id=1');
    const send = (route, body) => fetch(f.base + route, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const results = await Promise.all([
      send('/api/holds', { requestId: randomUUID(), slotId: 1, quantity: 1 }),
      send('/api/bookings', { requestId: randomUUID(), slotId: 1, quantity: 1, customerName: 'Race',
        customerEmail: 'race@example.com', paymentMethod: 'mock_card', expectedTotalCentavos: 160000 }),
    ]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    const { rows: [inventory] } = await f.db.query(`SELECT
      (SELECT COALESCE(SUM(quantity),0) FROM bookings WHERE slot_id=1 AND status='confirmed') +
      (SELECT COALESCE(SUM(quantity),0) FROM seat_holds WHERE slot_id=1 AND status='active' AND expires_at > $1) AS used`, [f.now]);
    assert.equal(Number(inventory.used), 1);
  } finally { await f.close(); }
});
