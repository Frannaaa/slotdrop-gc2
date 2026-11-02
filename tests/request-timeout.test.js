import assert from 'node:assert/strict';
import { test } from 'node:test';
import { api, REQUEST_TIMEOUT_MS } from '../public/js/api.js';

test('a stalled workspace read aborts and offers a retry', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  let calls = 0, signal;
  t.mock.method(globalThis, 'fetch', async (_path, options) => {
    calls++; signal = options.signal;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), {once:true}));
  });
  const rejected = assert.rejects(api('/api/owner/catalog'), /timed out.*Refresh data/);
  t.mock.timers.tick(REQUEST_TIMEOUT_MS);
  await rejected;
  assert.equal(signal.aborted, true);
  assert.equal(calls, 1);
});

test('the timeout also covers a response body that never finishes', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  t.mock.method(globalThis, 'fetch', async (_path, {signal}) => ({ok:true,
    json:() => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), {once:true}))}));
  const rejected = assert.rejects(api('/api/metrics'), /timed out/);
  await Promise.resolve();
  t.mock.timers.tick(REQUEST_TIMEOUT_MS);
  await rejected;
});

test('a timed-out save is not retried and explains the uncertain outcome', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_path, {signal}) => {
    calls++;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), {once:true}));
  });
  const rejected = assert.rejects(api('/api/slots', {method:'POST',body:'{}'}), /may have been saved.*check before trying again/);
  t.mock.timers.tick(REQUEST_TIMEOUT_MS);
  await rejected;
  assert.equal(calls, 1);
});

test('successful requests clear their timer and preserve server validation messages', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  let signal;
  t.mock.method(globalThis, 'fetch', async (_path, options) => {
    signal = options.signal;
    return {ok:true,json:async()=>({id:1})};
  });
  assert.deepEqual(await api('/api/slots/1'), {id:1});
  t.mock.timers.tick(REQUEST_TIMEOUT_MS);
  assert.equal(signal.aborted, false);
  globalThis.fetch.mock.mockImplementation(async () => ({ok:false,json:async()=>({error:{message:'No seats remain.'}})}));
  await assert.rejects(api('/api/slots/1', {method:'PATCH'}), /No seats remain\./);
  globalThis.fetch.mock.mockImplementation(async () => ({ok:false,json:async()=>null}));
  await assert.rejects(api('/api/slots'), /The request failed\./);
});
