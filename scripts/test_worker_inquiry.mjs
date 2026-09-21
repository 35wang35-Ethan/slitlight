// Run with `wrangler dev --local` on 127.0.0.1:8787 and official dummy credentials.
// Use --expect-turnstile-rejection with the always-fail secret or a mismatched
// action/hostname configuration. Requires an empty local inquiries table.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const endpoint = 'http://127.0.0.1:8787/api/inquiries';
const rejectTurnstile = process.argv.includes('--expect-turnstile-rejection');
const fixture = () => ({
  inquiry: {
    name: ' Local test ', brand: 'Local test brand',
    website_or_social: 'https://example.invalid', case_summary: 'Local inquiry test',
    problem: 'Local test problem', email: ' PHASE2-LOCAL-TEST@EXAMPLE.INVALID ',
    contact: 'Local contact', privacy_consent: true, source: 'phase2_local_test',
    utm_source: ' local ', utm_medium: 'test', utm_campaign: 'phase2',
    utm_content: '', utm_term: 'inquiry'
  },
  turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX'
});

function sql(query) {
  const result = spawnSync(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB',
    '--local', '--json', '--command', query
  ], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }
  });
  assert.equal(result.status, 0, 'Local D1 command failed');
  return JSON.parse(result.stdout)[0].results;
}
const count = () => sql('SELECT COUNT(*) AS count FROM inquiries;')[0].count;
const post = body => fetch(endpoint, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body), signal: AbortSignal.timeout(20000)
});

async function rejected(label, send, status, code) {
  const before = count();
  const response = await send();
  assert.equal(response.status, status, label);
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ['error', 'error_code', 'ok', 'stage']);
  assert.equal(body.ok, false);
  assert.equal(body.error, code);
  assert.equal(body.error_code, code);
  assert.equal(count(), before, `${label}: D1 must not change`);
  console.log(`PASS ${label}: ${status}, D1 unchanged`);
}

async function accepted(payload) {
  const before = count();
  const started = Date.now();
  const response = await post(payload);
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ['id', 'ok', 'status']);
  assert.equal(body.ok, true);
  assert.equal(body.status, 'new');
  assert.match(body.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(count(), before + 1);
  const row = sql('SELECT * FROM inquiries;').find(item => item.id === body.id);
  assert.ok(row);
  assert.equal(row.name, 'Local test');
  assert.equal(row.email, 'phase2-local-test@example.invalid');
  assert.equal(row.status, 'new');
  assert.equal(row.privacy_consent, 1);
  assert.equal(row.created_at, row.consented_at);
  assert.ok(Date.parse(row.created_at) >= started && Date.parse(row.created_at) <= Date.now());
  assert.ok(row.created_at.endsWith('Z'));
  assert.equal(JSON.stringify(row).includes(payload.turnstileToken), false);
  return row;
}

assert.equal(count(), 0, 'Refusing to test against non-empty local inquiries');
try {
  const health = await fetch('http://127.0.0.1:8787/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true });
  console.log('PASS health: 200');

  if (rejectTurnstile) {
    await rejected('Turnstile rejection', () => post(fixture()), 403, 'TURNSTILE_FAILED');
  } else {
    const row = await accepted(fixture());
    assert.equal(row.utm_source, 'local');
    assert.equal(row.utm_content, null);
    assert.equal(row.source, 'phase2_local_test');
    console.log('PASS valid inquiry: 201, one row, server timestamps, consent=1, UTM normalization');

    const tampered = fixture();
    Object.assign(tampered.inquiry, {
      status: 'completed', id: 'client-id', created_at: '2000-01-01', consented_at: '2000-01-01',
      privacy_consent: 'yes', source: '', case_summary: '', problem: '', contact: '',
      problem_description: 'Legacy summary', problem_type: 'Legacy problem', social_contact: 'Legacy contact'
    });
    const legacy = await accepted(tampered);
    assert.equal(legacy.source, 'direct');
    assert.equal(legacy.case_summary, 'Legacy summary');
    assert.equal(legacy.problem, 'Legacy problem');
    assert.equal(legacy.contact, 'Legacy contact');
    console.log('PASS status/id/timestamp tampering ignored; yes consent, legacy aliases and direct source preserved');

    for (const [label, change] of [
      ['missing required name', p => { delete p.inquiry.name; }],
      ['invalid email', p => { p.inquiry.email = 'invalid'; }],
      ['false consent', p => { p.inquiry.privacy_consent = false; }],
      ['string true consent', p => { p.inquiry.privacy_consent = 'true'; }],
      ['honeypot populated', p => { p.inquiry.company_website = 'bot'; }],
      ['top-level honeypot', p => { p.company_website = 'bot'; }],
      ['name too long', p => { p.inquiry.name = 'x'.repeat(81); }],
      ['summary too long', p => { p.inquiry.case_summary = 'x'.repeat(3001); }],
      ['UTM too long', p => { p.inquiry.utm_source = 'x'.repeat(201); }],
      ['wrong inquiry shape', p => { p.inquiry = []; }]
    ]) {
      const payload = fixture();
      change(payload);
      await rejected(label, () => post(payload), 400, 'INVALID_INPUT');
    }
    for (const token of ['', 'x'.repeat(2049)]) {
      const payload = fixture();
      payload.turnstileToken = token;
      await rejected('missing/oversized token', () => post(payload), 400, 'TOKEN_MISSING');
    }
    for (const body of ['', '{']) {
      await rejected('empty/invalid JSON', () => fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body
      }), 400, 'INVALID_JSON');
    }
    await rejected('wrong Content-Type', () => fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(fixture())
    }), 415, 'UNSUPPORTED_MEDIA_TYPE');
    await rejected('oversized streamed body without Content-Length', () => fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, duplex: 'half',
      body: new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode(' '.repeat(20001)));
        controller.close();
      } })
    }), 413, 'PAYLOAD_TOO_LARGE');
  }
} finally {
  sql("DELETE FROM inquiries WHERE email = 'phase2-local-test@example.invalid';");
  assert.equal(count(), 0, 'Local inquiries must finish empty');
  console.log('PASS cleanup: local inquiries count=0');
}
