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

test('detail exposes inactive activity state for direct session links', async () => {
  const f = await fixture();
  try {
    const detail = async () => (await fetch(f.base + '/api/slots/1')).json();
    assert.equal((await detail()).serviceActive, true);
    await f.database.query('UPDATE services SET active=false WHERE id=1');
    const response = await fetch(f.base + '/api/slots/1');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).serviceActive, false);
    const list = await (await fetch(f.base + '/api/slots')).json();
    assert.ok(list.every(slot => slot.serviceId !== 1));
  } finally { await f.close(); }
});

test('null characters in search filters return input errors before SQL', async () => {
  const f = await fixture();
  try {
    for (const key of ['q', 'area']) {
      for (const value of ['%00', 'pot%00tery']) {
        const response = await fetch(f.base + '/api/slots?' + key + '=' + value);
        assert.equal(response.status, 400);
        assert.equal((await response.json()).error.code, 'INVALID_INPUT');
      }
    }
    const response = await fetch(f.base + '/api/slots?q=Beginner');
    assert.equal(response.status, 200);
    assert.ok((await response.json()).length > 0);
  } finally { await f.close(); }
});

test('optional page/limit paginate eligible slots with stable ordering and 400 validation', async () => {
  const f = await fixture();
  try {
    const fetchList = async query => {
      const response = await fetch(f.base + '/api/slots' + query);
      assert.equal(response.status, 200, query);
      return response.json();
    };
    const all = await fetchList('');
    const first = await fetchList('?page=1&limit=3');
    const second = await fetchList('?page=2&limit=3');
    const third = await fetchList('?page=3&limit=3');
    assert.deepEqual([...first, ...second, ...third], all);
    assert.equal(first.length, 3);
    assert.deepEqual(await fetchList('?page=1'), all);
    assert.deepEqual(await fetchList('?limit=2'), all.slice(0, 2));
    assert.deepEqual(await fetchList('?page=25&limit=3'), []);
    assert.deepEqual(await fetchList('?page=1&limit=3&pagination=metadata'), {
      slots: first, hasNextPage: true,
    });
    assert.deepEqual(await fetchList('?page=2&limit=3&pagination=metadata'), {
      slots: second, hasNextPage: all.length > 6,
    });
    assert.deepEqual(await fetchList('?page=25&limit=3&pagination=metadata'), {
      slots: [], hasNextPage: false,
    });

    const filtered = await fetchList('?type=pottery&sort=price-low&people=2');
    assert.deepEqual(
      await fetchList('?type=pottery&sort=price-low&people=2&page=1&limit=2'),
      filtered.slice(0, 2),
    );
    assert.deepEqual(
      await fetchList('?type=pottery&sort=price-low&people=2&page=2&limit=2'),
      filtered.slice(2, 4),
    );

    for (const query of [
      '?page=0', '?page=-1', '?page=1.5', '?page=10001',
      '?limit=0', '?limit=51', '?limit=x', '?limit=2&limit=3',
      '?page=1&page=2',
      '?pagination=invalid', '?pagination=metadata&pagination=metadata',
    ]) {
      const response = await fetch(f.base + '/api/slots' + query);
      assert.equal(response.status, 400, query);
      assert.equal((await response.json()).error.code, 'INVALID_INPUT', query);
    }
  } finally { await f.close(); }
});
