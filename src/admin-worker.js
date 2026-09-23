const adminAssets = new Set([
  '/admin/',
  '/assets/css/admin.css',
  '/assets/js/admin.js',
  '/assets/js/supabase.js',
  '/assets/favicon.svg',
  '/assets/brand-symbol.svg'
]);

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
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
