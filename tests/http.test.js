import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import app from '../server/app.js';
import { errorHandler } from '../server/middleware/errors.js';

async function withServer(target, run) {
  const server = target.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run('http://127.0.0.1:' + server.address().port); }
  finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

test('starter serves the page, CSS and health without a database', async () => {
  await withServer(app, async base => {
    for (const path of ['/', '/css/style.css']) {
      assert.equal((await fetch(base + path)).status, 200);
    }
    const response = await fetch(base + '/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', app: 'SlotDrop' });
  });
});

test('unimplemented APIs and invalid bodies use safe, structured JSON', async () => {
  await withServer(app, async base => {
    for (const scenario of [
      { body: undefined, status: 404, code: 'ROUTE_NOT_IMPLEMENTED' },
      { body: '{', status: 400, code: 'INVALID_JSON' },
      { body: JSON.stringify({ value: 'x'.repeat(17000) }), status: 413, code: 'PAYLOAD_TOO_LARGE' }
    ]) {
      const response = await fetch(base + '/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: scenario.body
      });
      assert.equal(response.status, scenario.status);
      assert.match(response.headers.get('content-type'), /application\/json/);
      const payload = await response.json();
      assert.equal(payload.error.code, scenario.code);
      assert.equal(typeof payload.error.message, 'string');
      assert.doesNotMatch(JSON.stringify(payload), /SyntaxError|node_modules|stack|credentials/);
    }
  });
});

test('unexpected failures conceal their original message and stack', async () => {
  const broken = express();
  broken.get('/broken', () => { throw new Error('private SQL and credentials'); });
  broken.use(errorHandler);
  await withServer(broken, async base => {
    const response = await fetch(base + '/broken');
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' }
    });
  });
});
