export default {
  fetch(request, env) {
    if (request.method === 'GET' && new URL(request.url).pathname === '/api/health') {
      return Response.json({ ok: true });
    }
    return env.ASSETS.fetch(request);
  }
};
