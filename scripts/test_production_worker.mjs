import assert from 'node:assert/strict';
import worker from '../src/production-worker.js';

const origin = 'https://35wang35-ethan.github.io';
let writes = 0;
let verifies = 0;
let verification = { success: true, action: 'inquiry', hostname: '35wang35-ethan.github.io' };
const env = {
  TURNSTILE_EXPECTED_ACTION: 'inquiry',
  TURNSTILE_ALLOWED_HOSTNAMES: '35wang35-ethan.github.io',
  DB: { prepare() { writes++; return { bind() { return {
    async run() { return { success: true, meta: { changes: 1 } }; }
  }; } }; } }
};
const fixture = { inquiry: {
  name: 'TEST', brand: 'TEST', case_summary: 'TEST', problem: 'TEST',
  email: 'test@example.invalid', privacy_consent: true
}, turnstileToken: 'test-token' };
const send = (method, path, headers = {}, body, bindings = env) => worker.fetch(
  new Request('https://example.invalid' + path, { method, headers, body }), bindings
);
function cors(response) {
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(response.headers.get('Vary'), 'Origin');
  assert.equal(response.headers.has('Access-Control-Allow-Credentials'), false);
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { verifies++; return Response.json(verification); };
try {
  const health = await send('GET', '/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true });
  for (const path of ['/', '/admin/', '/index.html', '/assets/js/inquiry.js', '/unknown']) {
    assert.equal((await send('GET', path)).status, 404);
  }
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    assert.equal((await send(method, '/api/inquiries')).status, 404);
  }
  for (const value of [null, 'null', origin + '/', origin + '.evil.example', 'http://35wang35-ethan.github.io']) {
    for (const method of ['POST', 'OPTIONS']) {
      const r = await send(method, '/api/inquiries', value === null ? {} : { Origin: value });
      assert.equal(r.status, 403);
      assert.equal(r.headers.has('Access-Control-Allow-Origin'), false);
    }
  }
  assert.equal(verifies, 0);
  assert.equal(writes, 0);
  const preflight = { Origin: origin, 'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type' };
  const options = await send('OPTIONS', '/api/inquiries', preflight);
  assert.equal(options.status, 204);
  cors(options);
  assert.equal(options.headers.get('Access-Control-Allow-Methods'), 'POST');
  assert.equal(options.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
  for (const changes of [
    { 'Access-Control-Request-Method': 'GET' },
    { 'Access-Control-Request-Method': '' },
    { 'Access-Control-Request-Headers': 'content-type, authorization' }
  ]) assert.equal((await send('OPTIONS', '/api/inquiries', { ...preflight, ...changes })).status, 403);
  const headers = { Origin: origin, 'Content-Type': 'application/json' };
  for (const [body, status, code] of [
    ['{', 400, 'INVALID_JSON'],
    ['{}', 400, 'INVALID_INPUT'],
    [' '.repeat(20001), 413, 'PAYLOAD_TOO_LARGE'],
    [JSON.stringify(fixture), 503, 'TURNSTILE_NOT_CONFIGURED']
  ]) {
    const r = await send('POST', '/api/inquiries', headers, body);
    assert.equal(r.status, status);
    cors(r);
    assert.equal((await r.json()).error_code, code);
  }
  assert.equal(verifies, 0);
  assert.equal(writes, 0);
  // Isolated mocked Siteverify/D1: never sends a remote request or writes a database.
  const configured = { ...env, TURNSTILE_SECRET_KEY: 'unit-test-only' };
  for (const change of [{ success: false }, { action: 'wrong' }, { hostname: 'wrong.example' }]) {
    const saved = verification;
    verification = { ...saved, ...change };
    const r = await send('POST', '/api/inquiries', headers, JSON.stringify(fixture), configured);
    assert.equal(r.status, 403);
    cors(r);
    assert.equal((await r.json()).error_code, 'TURNSTILE_FAILED');
    assert.equal(writes, 0);
    verification = saved;
  }
  const success = await send('POST', '/api/inquiries', headers, JSON.stringify(fixture), configured);
  assert.equal(success.status, 201);
  cors(success);
  assert.equal((await success.json()).status, 'new');
  assert.equal(writes, 1);
  console.log('PASS production routes, exact-origin guard, preflight, CORS errors/success, missing-secret fail-closed, Turnstile/action/hostname rejection');
} finally {
  globalThis.fetch = originalFetch;
}
