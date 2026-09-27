import { submitInquiry } from './inquiry-handler.js';

const ALLOWED_ORIGIN = 'https://35wang35-ethan.github.io';
const forbidden = () => Response.json({ ok: false, error: 'FORBIDDEN' }, {
  status: 403, headers: { Vary: 'Origin' }
});

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Vary', 'Origin');
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/api/health') return Response.json({ ok: true });
    if (path !== '/api/inquiries' || !['POST', 'OPTIONS'].includes(request.method)) {
      return new Response('Not Found', { status: 404 });
    }
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return forbidden();
    if (request.method === 'OPTIONS') {
      const requestedHeaders = request.headers.get('Access-Control-Request-Headers');
      if (request.headers.get('Access-Control-Request-Method') !== 'POST' ||
          (requestedHeaders !== null && requestedHeaders.split(',').some(
            header => header.trim().toLowerCase() !== 'content-type'
          ))) return cors(forbidden());
      return cors(new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600'
      } }));
    }
    return cors(await submitInquiry(request, env));
  }
};
