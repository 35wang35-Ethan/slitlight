const MAX_BODY_BYTES = 20000;
const text = value => typeof value === 'string' ? value.trim() : '';
const optional = value => value || null;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const failure = (status, stage, code) => Response.json(
  { ok: false, stage, error_code: code, error: code }, { status }
);

async function readPayload(request) {
  if (!request.body) throw new SyntaxError('Missing body');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError('Payload too large');
      }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

async function submitInquiry(request, env) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return failure(415, 'validation', 'UNSUPPORTED_MEDIA_TYPE');
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    return failure(413, 'validation', 'PAYLOAD_TOO_LARGE');
  }
  let payload;
  try {
    payload = await readPayload(request);
  } catch (error) {
    return error instanceof RangeError
      ? failure(413, 'validation', 'PAYLOAD_TOO_LARGE')
      : failure(400, 'validation', 'INVALID_JSON');
  }
  if (!isRecord(payload) || !isRecord(payload.inquiry)) {
    return failure(400, 'validation', 'INVALID_INPUT');
  }
  const raw = payload.inquiry;
  // The current form omits this field when empty; never persist honeypot data.
  if (raw.company_website || payload.company_website) {
    return failure(400, 'validation', 'INVALID_INPUT');
  }
  // Preserve normalization, legacy aliases and limits from submit-inquiry.
  const inquiry = {
    name: text(raw.name),
    brand: text(raw.brand),
    website_or_social: text(raw.website_or_social),
    case_summary: text(raw.case_summary) || text(raw.problem_description),
    problem: text(raw.problem) || text(raw.problem_type),
    email: text(raw.email).toLowerCase(),
    contact: text(raw.contact) || text(raw.social_contact),
    privacy_consent: raw.privacy_consent === true || raw.privacy_consent === 'yes',
    source: text(raw.source) || 'direct',
    utm_source: text(raw.utm_source),
    utm_medium: text(raw.utm_medium),
    utm_campaign: text(raw.utm_campaign),
    utm_content: text(raw.utm_content),
    utm_term: text(raw.utm_term)
  };
  const limits = {
    name: 80, brand: 150, website_or_social: 500, case_summary: 3000,
    problem: 500, email: 320, contact: 300, source: 100,
    utm_source: 200, utm_medium: 200, utm_campaign: 200, utm_content: 200, utm_term: 200
  };
  if (!inquiry.name || !inquiry.brand || !inquiry.case_summary || !inquiry.problem ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email) || !inquiry.privacy_consent ||
      !Object.entries(limits).every(([field, limit]) => inquiry[field].length <= limit)) {
    return failure(400, 'validation', 'INVALID_INPUT');
  }

  const token = text(payload.turnstileToken);
  if (!token || token.length > 2048) return failure(400, 'turnstile', 'TOKEN_MISSING');
  const secret = text(env.TURNSTILE_SECRET_KEY);
  const allowedHostnames = text(env.TURNSTILE_ALLOWED_HOSTNAMES).split(',').map(text).filter(Boolean);
  // An explicit empty action matches an absent/empty action, not any action.
  // Local dummy responses can omit action; the default remains "inquiry".
  const expectedAction = env.TURNSTILE_EXPECTED_ACTION ?? 'inquiry';
  if (!secret || !allowedHostnames.length || typeof expectedAction !== 'string') {
    return failure(503, 'turnstile', 'TURNSTILE_NOT_CONFIGURED');
  }
  let verification;
  // Log only verification metadata, never credentials, bodies or exception text.
  try {
    const verifyBody = new FormData();
    verifyBody.set('secret', secret);
    verifyBody.set('response', token);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: verifyBody, signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      let errorPayload = null;
      try {
        errorPayload = await response.json();
      } catch {
        console.error('TURNSTILE_VERIFY_HTTP_ERROR', {
          status: response.status, parse_error: true
        });
        return failure(502, 'turnstile', 'VERIFY_UNAVAILABLE');
      }
      console.error('TURNSTILE_VERIFY_HTTP_ERROR', {
        status: response.status,
        success: typeof errorPayload?.success === 'boolean' ? errorPayload.success : null,
        error_codes: Array.isArray(errorPayload?.['error-codes']) ? errorPayload['error-codes'] : [],
        action: errorPayload?.action ?? null,
        hostname: errorPayload?.hostname ?? null
      });
      return failure(502, 'turnstile', 'VERIFY_UNAVAILABLE');
    }
    try {
      verification = await response.json();
    } catch {
      console.error('TURNSTILE_VERIFY_PARSE_ERROR', {
        status: response.status
      });
      return failure(502, 'turnstile', 'VERIFY_UNAVAILABLE');
    }
    if (!isRecord(verification)) return failure(502, 'turnstile', 'VERIFY_UNAVAILABLE');
  } catch {
    console.error('TURNSTILE_VERIFY_FETCH_EXCEPTION');
    return failure(502, 'turnstile', 'VERIFY_UNAVAILABLE');
  }
  if (verification.success !== true || (verification.action ?? '') !== expectedAction ||
      !allowedHostnames.includes(verification.hostname)) {
    console.error('TURNSTILE_VERIFY_REJECTED', {
      error_codes: verification['error-codes'] ?? [],
      action: verification.action ?? null, hostname: verification.hostname ?? null
    });
    return failure(403, 'turnstile', 'TURNSTILE_FAILED');
  }

  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  try {
    const result = await env.DB.prepare(`
      INSERT INTO inquiries (
        id, created_at, name, brand, website_or_social, case_summary, problem,
        email, contact, privacy_consent, consented_at, source, status,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, timestamp, inquiry.name, inquiry.brand, optional(inquiry.website_or_social),
      inquiry.case_summary, inquiry.problem, inquiry.email, optional(inquiry.contact),
      1, timestamp, inquiry.source, 'new', optional(inquiry.utm_source), optional(inquiry.utm_medium),
      optional(inquiry.utm_campaign), optional(inquiry.utm_content), optional(inquiry.utm_term), timestamp
    ).run();
    if (!result.success || result.meta.changes !== 1) throw new Error('Insert not confirmed');
  } catch {
    console.error('Inquiry insert failed');
    return failure(500, 'database', 'INQUIRY_SAVE_FAILED');
  }
  return Response.json({ ok: true, id, status: 'new' }, { status: 201 });
}

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/api/health') return Response.json({ ok: true });
    if (request.method === 'POST' && path === '/api/inquiries') return submitInquiry(request, env);
    return env.ASSETS.fetch(request);
  }
};
