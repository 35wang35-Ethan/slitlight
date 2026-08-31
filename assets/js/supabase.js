(() => {
  const endpoint = 'https://ptruiafyvqhyeodvkiub.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnVpYWZ5dnFoeWVvZHZraXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MTAzMjYsImV4cCI6MjEwMjE4NjMyNn0.UYuhfgpVX471np9zdl4Zg5mUX0d406RK8_bYKwN4eIY';
  const sessionKey = 'slit.light.admin.session';
  let session = readSession();
  let recoverySession = Boolean(session?.recovery);

  readAuthCallback();

  function readSession() {
    try {
      const value = window.localStorage.getItem(sessionKey);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  function saveSession(value) {
    session = value;
    try {
      if (value) window.localStorage.setItem(sessionKey, JSON.stringify(value));
      else window.localStorage.removeItem(sessionKey);
    } catch {
      // The active tab still retains the session when browser storage is unavailable.
    }
  }

  function readAuthCallback() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (params.get('type') !== 'recovery') return;
    const authenticated = normalizeSession({
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      expires_in: params.get('expires_in')
    });
    if (!authenticated) return;
    authenticated.recovery = true;
    saveSession(authenticated);
    recoverySession = true;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }

  function normalizeSession(payload) {
    if (!payload?.access_token || !payload?.refresh_token) return null;
    return {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at || Math.floor(Date.now() / 1000) + Number(payload.expires_in || 3600),
      user: payload.user || session?.user || null,
      recovery: Boolean(payload.recovery)
    };
  }

  async function request(path, options = {}) {
    const authMode = options.auth || 'anon';
    const currentSession = authMode === 'user' ? await ensureSession() : null;
    const token = currentSession?.access_token || anonKey;
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    };
    const response = await fetch(`${endpoint}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body
    });
    const contentType = response.headers.get('content-type') || '';
    const payload = response.status === 204
      ? null
      : contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '');
    if (!response.ok) {
      const message = payload?.message || payload?.error_description || payload?.error || `Supabase 回應 ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.code = payload?.error_code || '';
      error.stage = payload?.stage || '';
      throw error;
    }
    return payload;
  }

  async function refreshSession() {
    if (!session?.refresh_token) return null;
    try {
      const payload = await request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      const refreshed = normalizeSession({ ...payload, recovery: recoverySession });
      saveSession(refreshed);
      return refreshed;
    } catch {
      saveSession(null);
      return null;
    }
  }

  async function ensureSession() {
    if (!session) throw new Error('登入狀態已失效，請重新登入。');
    if (Number(session.expires_at || 0) - Math.floor(Date.now() / 1000) < 90) {
      const refreshed = await refreshSession();
      if (!refreshed) throw new Error('登入狀態已失效，請重新登入。');
    }
    return session;
  }

  async function signIn(email, password) {
    const payload = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const authenticated = normalizeSession(payload);
    if (!authenticated) throw new Error('登入回應不完整，請稍後再試。');
    saveSession(authenticated);
    return authenticated;
  }

  async function requestPasswordRecovery(email, redirectTo) {
    const destination = new URL(redirectTo, window.location.href).href;
    return request(`/auth/v1/recover?redirect_to=${encodeURIComponent(destination)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  }

  async function updatePassword(password) {
    const payload = await request('/auth/v1/user', {
      method: 'PUT',
      auth: 'user',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    session.user = payload;
    recoverySession = false;
    session.recovery = false;
    saveSession(session);
    return payload;
  }

  function isRecovery() {
    return recoverySession;
  }

  async function getSession() {
    if (!session) return null;
    return ensureSession().catch(() => null);
  }

  async function getUser() {
    const payload = await request('/auth/v1/user', { auth: 'user' });
    session.user = payload;
    saveSession(session);
    return payload;
  }

  async function signOut() {
    try {
      if (session) await request('/auth/v1/logout', { method: 'POST', auth: 'user' });
    } catch {
      // Local sign-out must still succeed if the network session has already expired.
    }
    recoverySession = false;
    saveSession(null);
  }

  function queryPath(table, query = '') {
    return `/rest/v1/${encodeURIComponent(table)}${query ? `?${query}` : ''}`;
  }

  async function select(table, query = '', options = {}) {
    return request(queryPath(table, query), { auth: options.auth ? 'user' : 'anon' });
  }

  async function upsert(table, rows, options = {}) {
    const onConflict = options.onConflict ? `${options.query ? '&' : '?'}on_conflict=${encodeURIComponent(options.onConflict)}` : '';
    return request(`${queryPath(table, options.query || '')}${onConflict}`, {
      method: 'POST',
      auth: 'user',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(rows)
    });
  }

  async function update(table, values, query) {
    return request(queryPath(table, query), {
      method: 'PATCH',
      auth: 'user',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(values)
    });
  }

  async function invoke(functionName, body) {
    return request(`/functions/v1/${encodeURIComponent(functionName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  async function uploadImage(path, file) {
    const safePath = String(path).split('/').map(encodeURIComponent).join('/');
    return request(`/storage/v1/object/site-images/${safePath}`, {
      method: 'POST',
      auth: 'user',
      headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
      body: file
    });
  }

  function publicImageUrl(path) {
    return `${endpoint}/storage/v1/object/public/site-images/${String(path).split('/').map(encodeURIComponent).join('/')}`;
  }

  window.slitData = Object.freeze({
    endpoint,
    auth: Object.freeze({ signIn, getSession, getUser, signOut, requestPasswordRecovery, updatePassword, isRecovery }),
    rest: Object.freeze({ select, upsert, update }),
    functions: Object.freeze({ invoke }),
    storage: Object.freeze({ uploadImage, publicImageUrl })
  });
})();
