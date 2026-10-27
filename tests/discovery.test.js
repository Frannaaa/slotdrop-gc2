import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
import { dateRange } from '../server/services/discovery.js';

test('discovery respects filters, released capacity, cutoffs and known unavailable detail', async () => {
  const f = await fixture();
  try {
    const get = async path => { const response = await fetch(f.base + path); return [response.status, await response.json()]; };
    let [status, rows] = await get('/api/slots');
    assert.equal(status, 200); assert.equal(rows.length, 8); assert.equal(typeof rows[0].id, 'number');
    assert.equal(rows[0].remainingSeats, 4); assert.equal(rows[0].defaultBookingCutoffMinutes, 180);
    assert.equal((await get('/api/slots?category=active'))[1].length, 2);
    assert.equal((await get('/api/slots?people=7'))[1].length, 1);
    assert.equal((await get('/api/slots?q=%27%20OR%201%3D1--'))[1].length, 0);
    assert.equal((await get('/api/slots?area=UP%20Village'))[1].length, 2);
    for (const path of ['/api/slots?people=0','/api/slots?people=2&people=3','/api/slots?when=nextyear','/api/slots/no','/api/slots/9007199254740992']) assert.equal((await get(path))[0], 400);
    assert.equal((await get('/api/slots/999'))[0], 404);
    await f.database.query('UPDATE slots SET booking_closes_at=$1 WHERE id=1', [f.now]);
    await f.database.query('UPDATE slots SET starts_at=$1 WHERE id=2', [new Date(f.now.getTime()+72*3600000)]);
    await f.database.query("UPDATE slots SET status='paused' WHERE id=3");
    await f.database.query('UPDATE services SET active=false WHERE id=4');
    rows = (await get('/api/slots'))[1];
    assert.deepEqual(rows.map(row => row.id), [5,6,7]);
    assert.equal((await get('/api/slots/1'))[0], 200);
  } finally { await f.close(); }
});

test('Manila date boundaries retain the current weekend on Sundays', () => {
  assert.deepEqual(dateRange('today', new Date('2026-10-27T18:00:00Z')).map(date=>date.toISOString()), ['2026-10-27T16:00:00.000Z','2026-10-28T16:00:00.000Z']);
  assert.deepEqual(dateRange('weekend', new Date('2026-11-01T03:00:00Z')).map(date=>date.toISOString()), ['2026-10-30T16:00:00.000Z','2026-11-01T16:00:00.000Z']);
});
