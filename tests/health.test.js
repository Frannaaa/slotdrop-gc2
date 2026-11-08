import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../server/app.js';

async function withServer(db, checkDatabaseHealth, inspect) {
  const server = createApp({db, checkDatabaseHealth}).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/health');
    await inspect(response);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('production health checks that the required SlotDrop tables exist', async () => {
  const statements = [];
  await withServer({query: async statement => {
    statements.push(statement);
    return {rows:[{slots:'slots',services:'services',bookings:'bookings'}]};
  }}, true, async response => {
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {status:'ok',app:'SlotDrop'});
  });
  assert.equal(statements.length, 1);
  assert.match(statements[0], /to_regclass\('slots'\)/);
});

test('production health rejects a reachable but uninitialized database', async () => {
  await withServer({query:async () => ({rows:[{slots:null,services:null,bookings:null}]})},
    true, async response => {
      assert.equal(response.status,503);
      assert.deepEqual(await response.json(),{status:'unavailable',app:'SlotDrop'});
    });
  await withServer({query:async () => ({rows:[{slots:'slots',services:'services',bookings:null}]})},
    true, async response => assert.equal(response.status,503));
});

test('production health returns 503 on database outage without leaking details', async () => {
  let checks = 0;
  await withServer({query: async () => {
    checks++;
    throw new Error('postgresql://secret-user:secret-password@internal.example/db');
  }}, true, async response => {
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.deepEqual(JSON.parse(body), {status:'unavailable',app:'SlotDrop'});
    assert.doesNotMatch(body, /secret-password|secret-user|internal\.example/);
  });
  assert.equal(checks, 1);
});

test('local health remains available without an initialized database', async () => {
  await withServer({query: async () => {throw new Error('Should not query DB in local mode');}},
    false, async response => {
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {status:'ok',app:'SlotDrop'});
    });
});
