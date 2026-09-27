import { submitInquiry } from './inquiry-handler.js';

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/api/health') return Response.json({ ok: true });
    if (request.method === 'POST' && path === '/api/inquiries') return submitInquiry(request, env);
    return env.ASSETS.fetch(request);
  }
};
