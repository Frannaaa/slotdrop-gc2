// Disposable in-memory PostgreSQL checks. Never connects to DATABASE_URL.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const seed = await readFile(new URL('../tests/fixtures/legacy-seed.sql', import.meta.url), 'utf8');
const cases = [];
async function check(name, run) {
  await run();
  cases.push(name);
  console.log('PASS ' + name);
}
async function rejectsSQL(sql, params, code) {
  await assert.rejects(db.query(sql, params), error => error.code === code);
}
async function saveReceipt(quantity, requestId) {
  return db.query(`
    INSERT INTO bookings (
      request_id,slot_id,quantity,customer_name,customer_email,payment_method,
      session_starts_at,original_unit_price_centavos,offer_unit_price_centavos,
      pricing_type,unit_price_centavos,commission_basis_points,
      total_price_centavos,platform_fee_centavos,provider_payout_centavos
    )
    SELECT $1, id, $2, 'Demo Customer', 'demo@example.com', 'mock_card',
      starts_at, original_price_centavos,offer_price_centavos,
      CASE WHEN $2 >= 2 AND buddy_price_centavos IS NOT NULL THEN 'buddy' ELSE 'standard' END,
      CASE WHEN $2 >= 2 AND buddy_price_centavos IS NOT NULL THEN buddy_price_centavos ELSE offer_price_centavos END,
      1000,
      (CASE WHEN $2 >= 2 AND buddy_price_centavos IS NOT NULL THEN buddy_price_centavos ELSE offer_price_centavos END)::BIGINT * $2,
      ROUND((CASE WHEN $2 >= 2 AND buddy_price_centavos IS NOT NULL THEN buddy_price_centavos ELSE offer_price_centavos END)::NUMERIC / 10)::BIGINT * $2,
      ((CASE WHEN $2 >= 2 AND buddy_price_centavos IS NOT NULL THEN buddy_price_centavos ELSE offer_price_centavos END)::BIGINT
        - ROUND((CASE WHEN $2 >= 2 AND buddy_price_centavos IS NOT NULL THEN buddy_price_centavos ELSE offer_price_centavos END)::NUMERIC / 10)::BIGINT) * $2
    FROM slots WHERE id = 1 RETURNING *`, [requestId, quantity]);
}
try {
  await db.exec(schema);
  await db.exec(seed);
  await check('five tables and eight eligible synthetic regression sessions', async () => {
    const tables = await db.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    assert.equal(tables.rows[0].n, 5);
    const slots = await db.query("SELECT count(*)::int AS n FROM slots WHERE starts_at > NOW() AND starts_at < NOW()+INTERVAL '72 hours' AND booking_closes_at > NOW() AND booking_closes_at < starts_at");
    assert.equal(slots.rows[0].n, 8);
    const daytime = await db.query("SELECT count(*)::int AS n FROM slots WHERE EXTRACT(HOUR FROM starts_at AT TIME ZONE 'Asia/Manila') BETWEEN 9 AND 20");
    assert.equal(daytime.rows[0].n,8);
  });
  await check('different activity defaults and a per-session override remain independent', async () => {
    const {rows} = await db.query('SELECT default_booking_cutoff_minutes FROM services ORDER BY id');
    assert.deepEqual(rows.map(row => row.default_booking_cutoff_minutes), [180,120,60,30]);
    const {rows: [before]} = await db.query('SELECT booking_closes_at FROM slots WHERE id=1');
    await db.query('UPDATE services SET default_booking_cutoff_minutes=240 WHERE id=1');
    const {rows: [after]} = await db.query('SELECT booking_closes_at FROM slots WHERE id=1');
    assert.equal(new Date(before.booking_closes_at).getTime(), new Date(after.booking_closes_at).getTime());
    // One session can have a 15-minute cutoff without changing its activity default.
    await db.query("UPDATE slots SET booking_closes_at=starts_at-INTERVAL '15 minutes' WHERE id=1");
    const {rows: [service]} = await db.query('SELECT default_booking_cutoff_minutes FROM services WHERE id=1');
    assert.equal(service.default_booking_cutoff_minutes, 240);
    await db.query("UPDATE slots SET booking_closes_at=starts_at-INTERVAL '3 hours' WHERE id=1");
    await db.query('UPDATE services SET default_booking_cutoff_minutes=180 WHERE id=1');
  });
  await check('quantity 1/2/3 selects the expected standard or buddy receipt', async () => {
    for (const [quantity,total,fee,payout,type] of [
      [1,160000,16000,144000,'standard'],[2,304000,30400,273600,'buddy'],[3,456000,45600,410400,'buddy']
    ]) {
      const key = '10000000-0000-4000-8000-00000000000' + quantity;
      const { rows: [receipt] } = await saveReceipt(quantity, key);
      assert.equal(Number(receipt.total_price_centavos), total);
      assert.equal(Number(receipt.platform_fee_centavos), fee);
      assert.equal(Number(receipt.provider_payout_centavos), payout);
      assert.equal(receipt.pricing_type, type);
      await db.query('DELETE FROM bookings WHERE request_id=$1', [key]);
    }
  });
  await check('duplicate retry keys fail and two bookings consume exactly three allocated seats', async () => {
    await saveReceipt(2, '20000000-0000-4000-8000-000000000001');
    await assert.rejects(saveReceipt(2, '20000000-0000-4000-8000-000000000001'), error => error.code === '23505');
    await saveReceipt(1, '20000000-0000-4000-8000-000000000002');
    const { rows: [row] } = await db.query("SELECT capacity-(SELECT SUM(quantity) FROM bookings WHERE slot_id=1 AND status='confirmed') AS remaining FROM slots WHERE id=1");
    assert.equal(Number(row.remaining), 1);
  });
  await check('invalid quantity, buddy rate, price bounds, cutoff and receipt totals are refused', async () => {
    await assert.rejects(saveReceipt(0, '30000000-0000-4000-8000-000000000001'), error => error.code === '23514');
    for (const sql of [
      'UPDATE slots SET buddy_price_centavos=0 WHERE id=1',
      'UPDATE slots SET buddy_price_centavos=offer_price_centavos WHERE id=1',
      'UPDATE slots SET original_price_centavos=100000001 WHERE id=1',
      "UPDATE slots SET booking_closes_at=starts_at WHERE id=1",
      'UPDATE services SET default_booking_cutoff_minutes=0 WHERE id=1',
      "UPDATE bookings SET quantity=1 WHERE pricing_type='buddy'",
      "UPDATE bookings SET platform_fee_centavos=0,provider_payout_centavos=total_price_centavos WHERE pricing_type='buddy'"
    ]) await rejectsSQL(sql, [], '23514');
  });
  await check('disabling group pricing preserves old receipts and changes future bookings', async () => {
    await db.query('UPDATE slots SET buddy_price_centavos=NULL WHERE id=1');
    const { rows: [old] } = await db.query("SELECT * FROM bookings WHERE request_id='20000000-0000-4000-8000-000000000001'");
    assert.equal(old.unit_price_centavos, 152000);
    assert.equal(old.offer_unit_price_centavos, 160000);
    const { rows: [next] } = await saveReceipt(2, '40000000-0000-4000-8000-000000000001');
    assert.equal(next.pricing_type, 'standard');
    assert.equal(Number(next.total_price_centavos), 320000);
    await db.query("DELETE FROM bookings WHERE request_id='40000000-0000-4000-8000-000000000001'");
  });
  await check('fee rounding agrees with the per-seat rule for fractional-cent fees', async () => {
    await db.query('UPDATE slots SET offer_price_centavos=100005 WHERE id=1');
    const { rows: [row] } = await saveReceipt(2, '50000000-0000-4000-8000-000000000001');
    assert.equal(Number(row.platform_fee_centavos), 20002);
    await db.query("DELETE FROM bookings WHERE request_id='50000000-0000-4000-8000-000000000001'");
  });
  await check('repeat seed refuses existing data without deleting sessions or receipts', async () => {
    await assert.rejects(db.exec(seed));
    await db.exec('ROLLBACK');
    const { rows: [counts] } = await db.query('SELECT (SELECT count(*) FROM slots)::int AS slots, (SELECT count(*) FROM bookings)::int AS bookings');
    assert.deepEqual(counts, { slots: 8, bookings: 2 });
  });
  console.log(cases.length + ' SQL scenario groups passed. These are schema checks, not HTTP/concurrency tests.');
} finally { await db.close(); }
