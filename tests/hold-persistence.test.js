import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { createHold, getHold } from '../server/services/holds.js';

test('stored hold expiry survives closing and reopening the database without a browser or timer', async () => {
  const parent = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(parent, 'slotdrop-hold-persistence-'));
  let database;
  const adapter = () => ({
    query: (sql, values) => database.query(sql, values),
    transaction: run => database.transaction(tx => run({
      query: (sql, values) => values === undefined ? tx.exec(sql).then(r => r.at(-1)) : tx.query(sql, values),
    })),
  });
  try {
    database = new PGlite(directory);
    await database.exec(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('./fixtures/legacy-seed.sql', import.meta.url), 'utf8'));
    const now = new Date((await database.query('SELECT NOW() AS time')).rows[0].time);
    const created = await createHold(adapter(), { requestId: randomUUID(), slotId: 1, quantity: 2 }, () => now);
    await database.close();
    database = new PGlite(directory);
    const restored = await getHold(adapter(), created.hold.id, new Date(now.getTime() + 1000));
    assert.equal(restored.status, 'active');
    assert.equal(restored.remainingSeats, 2);
    assert.equal(restored.expiresAt, created.hold.expiresAt);
    const expired = await getHold(adapter(), created.hold.id, new Date(now.getTime() + 600000));
    assert.equal(expired.status, 'expired');
    assert.equal(expired.remainingSeats, 4);
  } finally {
    await database?.close();
    if (path.dirname(path.resolve(directory)) !== parent || !path.basename(directory).startsWith('slotdrop-hold-persistence-')) {
      throw new Error('Unexpected persistence fixture directory');
    }
    await rm(directory, { recursive: true, force: true });
  }
});
