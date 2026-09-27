// Isolated test keys and SQLite only. No remote D1, cookies, or real Access tokens.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import worker from '../src/admin-worker.js';

const db = new DatabaseSync(':memory:');
for (const file of ['0001_inquiries.sql', '0002_inquiries_updated_at.sql']) {
  db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
}
let reads = 0;
const env = {
  TEAM_DOMAIN: 'https://access.example.test', POLICY_AUD: 'test-audience',
  DB: { prepare(sql) {
    reads++;
    const statement = db.prepare(sql);
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async all() {
        const results = statement.all(...args);
        const changes = sql.startsWith('UPDATE') ? db.prepare('SELECT changes() AS n').get().n : 0;
        return { success: true, results, meta: { changes } };
      },
      async first() { return statement.get(...args) ?? null; },
      async run() { return { success: true, meta: { changes: Number(statement.run(...args).changes) } }; }
    };
  } }
};
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256' };
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => {
  assert.equal(String(url), `${env.TEAM_DOMAIN}/cdn-cgi/access/certs`);
  return Response.json({ keys: [jwk] });
};
const token = async (claims = {}, key = privateKey) => new SignJWT({
  iss: env.TEAM_DOMAIN, aud: env.POLICY_AUD, exp: Math.floor(Date.now() / 1000) + 300, ...claims
}).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(key);
const valid = await token();
const id = '11111111-1111-4111-8111-111111111111';
const old = '2026-09-02T07:14:24.436607+00:00';
const base = '/api/admin/inquiries';
async function call(method, path = base, body, jwt = valid, headers = {}) {
  const response = await worker.fetch(new Request(`https://admin.example.test${path}`, {
    method, headers: { ...(jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {})
  }), env);
  if (path.startsWith(base) && path !== `${base}/x/extra`) assert.equal(response.headers.get('Cache-Control'), 'no-store');
  return response;
}
try {
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const path = method === 'GET' ? base : `${base}/${id}`;
    for (const jwt of [null, 'malformed', await token({ aud: 'wrong' }), await token({ iss: 'https://wrong.test' }), await token({ exp: 1 }), await token({ exp: undefined }), await token({}, (await generateKeyPair('RS256')).privateKey)]) {
      const before = reads;
      const r = await call(method, path, undefined, jwt);
      assert.equal(r.status, 403); assert.deepEqual(await r.json(), { error: 'forbidden' });
      assert.equal(reads, before, 'Unauthorized request reached D1');
    }
  }
  console.log('PASS JWT: missing/malformed/signature/issuer/audience/expiration rejected before D1');
  assert.equal((await call('GET', '/unknown')).status, 404);
  assert.equal((await call('GET', `${base}/x/extra`)).status, 404);
  assert.equal((await call('POST')).status, 405);
  assert.equal((await call('DELETE', `${base}/bad-id`)).status, 400);
  assert.equal((await call('PATCH', `${base}/bad-id`, {})).status, 400);
  assert.equal((await call('GET', base, undefined, valid, { Origin: 'https://evil.test' })).status, 403);
  for (const body of [{ status: 'invalid', expectedUpdatedAt: old }, { status: 'new', expectedUpdatedAt: old, updated_at: old }, {}, null, []]) {
    assert.equal((await call('PATCH', `${base}/${id}`, JSON.stringify(body))).status, 400);
  }
  assert.equal((await call('PATCH', `${base}/${id}`, '{')).status, 400);
  assert.equal((await call('PATCH', `${base}/${id}`, '{}', valid, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await call('PATCH', `${base}/${id}`, ' '.repeat(2049))).status, 413);
  console.log('PASS route/method/origin/ID/status/JSON/content-type/body-limit checks');
  db.prepare('INSERT INTO inquiries (id,created_at,updated_at,name,brand,case_summary,problem,email,privacy_consent,status) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, old, old, 'TEST', 'TEST', 'TEST', 'TEST', 'test@example.invalid', 1, 'new');
  let r = await call('GET'); assert.equal(r.status, 200);
  const list = (await r.json()).inquiries; assert.equal(list.length, 1); assert.equal(Object.keys(list[0]).length, 19);
  r = await call('PATCH', `${base}/${id}`, { status: 'contacted', expectedUpdatedAt: old }); assert.equal(r.status, 200);
  const updated = (await r.json()).inquiry; assert.equal(updated.status, 'contacted'); assert.notEqual(updated.updated_at, old); assert.equal(updated.created_at, old);
  r = await call('PATCH', `${base}/${id}`, { status: 'completed', expectedUpdatedAt: old }); assert.equal(r.status, 409); assert.deepEqual(await r.json(), { error: 'conflict' });
  assert.equal(db.prepare('SELECT status FROM inquiries WHERE id=?').get(id).status, 'contacted');
  r = await call('DELETE', `${base}/${id}`); assert.equal(r.status, 200); assert.deepEqual(await r.json(), { deleted: true, id });
  assert.equal((await call('DELETE', `${base}/${id}`)).status, 404);
  assert.equal((await call('PATCH', `${base}/${id}`, { status: 'new', expectedUpdatedAt: old })).status, 404);
  assert.equal(db.prepare('SELECT count(*) AS n FROM inquiries').get().n, 0);
  console.log('PASS canonical GET, conditional PATCH, stale 409, exact DELETE, missing 404; test database empty');
} finally { globalThis.fetch = originalFetch; db.close(); }
