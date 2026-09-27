const adminAssets = new Set([
  '/admin/',
  '/assets/css/admin.css',
  '/assets/js/admin.js',
  '/assets/favicon.svg',
  '/assets/brand-symbol.svg'
]);

import { createRemoteJWKSet, jwtVerify } from 'jose';

const fields = 'id, created_at, updated_at, name, brand, website_or_social, case_summary, problem, email, contact, privacy_consent, consented_at, source, status, utm_source, utm_medium, utm_campaign, utm_content, utm_term';
const statuses = new Set(['new', 'contacted', 'discovery', 'quoted', 'active', 'completed', 'declined']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body, status = 200, headers = {}) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', ...headers }
});
// Cache public signing keys only, never tokens or inquiry data.
let keySet;
let keySetUrl;
async function authorized(request, env) {
  try {
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token || !env.TEAM_DOMAIN || !env.POLICY_AUD) return false;
    const url = `${env.TEAM_DOMAIN}/cdn-cgi/access/certs`;
    if (keySetUrl !== url) {
      keySet = createRemoteJWKSet(new URL(url));
      keySetUrl = url;
    }
    await jwtVerify(token, keySet, {
      issuer: env.TEAM_DOMAIN, audience: env.POLICY_AUD,
      algorithms: ['RS256'], requiredClaims: ['exp']
    });
    return true;
  } catch { return false; }
}

async function readPatch(request) {
  if (Number(request.headers.get('content-length')) > 2048) throw new RangeError();
  if (!request.body) throw new SyntaxError();
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); throw new RangeError(); }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } finally { reader.releaseLock(); }
}

async function inquiryApi(request, env, id) {
  if (!await authorized(request, env)) return json({ error: 'forbidden' }, 403);
  const origin = request.headers.get('Origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'forbidden' }, 403);
  const allowed = id === null ? ['GET'] : ['PATCH', 'DELETE'];
  if (!allowed.includes(request.method)) return json({ error: 'method_not_allowed' }, 405, { Allow: allowed.join(', ') });
  if (id !== null && !uuid.test(id)) return json({ error: 'invalid_id' }, 400);
  try {
    if (request.method === 'GET') {
      const result = await env.DB.prepare(`SELECT ${fields} FROM inquiries ORDER BY created_at DESC`).all();
      if (!result.success) throw new Error();
      return json({ inquiries: result.results });
    }
    if (request.method === 'DELETE') {
      const result = await env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();
      if (!result.success) throw new Error();
      if (result.meta.changes === 0) return json({ error: 'not_found' }, 404);
      if (result.meta.changes !== 1) throw new Error();
      return json({ deleted: true, id });
    }
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json({ error: 'unsupported_media_type' }, 415);
    let body;
    try { body = await readPatch(request); } catch (error) {
      return json({ error: error instanceof RangeError ? 'payload_too_large' : 'invalid_json' }, error instanceof RangeError ? 413 : 400);
    }
    if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).length !== 2 ||
        !statuses.has(body.status) || typeof body.expectedUpdatedAt !== 'string' ||
        body.expectedUpdatedAt.length > 100 || !Number.isFinite(Date.parse(body.expectedUpdatedAt))) return json({ error: 'invalid_input' }, 400);
    const timestamp = new Date().toISOString();
    // A same-millisecond retry must not reuse the concurrency version.
    if (timestamp === body.expectedUpdatedAt) {
      const existing = await env.DB.prepare('SELECT id FROM inquiries WHERE id = ?').bind(id).first();
      return existing ? json({ error: 'conflict' }, 409) : json({ error: 'not_found' }, 404);
    }
    // RETURNING captures the updated row atomically, avoiding a second read race.
    const result = await env.DB.prepare(`UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ? AND updated_at = ? RETURNING ${fields}`)
      .bind(body.status, timestamp, id, body.expectedUpdatedAt).all();
    if (!result.success) throw new Error();
    if (result.meta.changes === 1 && result.results.length === 1) return json({ inquiry: result.results[0] });
    if (result.meta.changes !== 0) throw new Error();
    const existing = await env.DB.prepare('SELECT id FROM inquiries WHERE id = ?').bind(id).first();
    return existing ? json({ error: 'conflict' }, 409) : json({ error: 'not_found' }, 404);
  } catch { return json({ error: 'internal_error' }, 500); }
}

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/admin/inquiries') return inquiryApi(request, env, null);
    const item = path.match(/^\/api\/admin\/inquiries\/([^/]+)$/);
    if (item) return inquiryApi(request, env, item[1]);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Not Found', { status: 404 });
    }
    if (path === '/' || path === '/admin') {
      return new Response(null, { status: 302, headers: { Location: '/admin/' } });
    }
    if (path === '/api/admin/health') {
      return Response.json({ ok: true, scope: 'admin' });
    }
    if (adminAssets.has(path)) return env.ASSETS.fetch(request);
    return new Response('Not Found', { status: 404 });
  }
};
