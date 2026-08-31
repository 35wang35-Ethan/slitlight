import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

type Inquiry = {
  name?: unknown
  brand?: unknown
  website_or_social?: unknown
  case_summary?: unknown
  problem?: unknown
  email?: unknown
  contact?: unknown
  privacy_consent?: unknown
  social_contact?: unknown
  problem_type?: unknown
  problem_description?: unknown
  source?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
  utm_term?: unknown
}

const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const optional = (value: string) => value || null
const within = (value: string, maxLength: number) => value.length <= maxLength
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] || character))
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders })
const failure = (status: number, stage: string, errorCode: string, message: string) =>
  json({ ok: false, stage, error_code: errorCode, error: message }, status)

function getSecretKey() {
  const currentKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (currentKeys) {
    try { return JSON.parse(currentKeys).default as string } catch { /* Use legacy fallback. */ }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

export default {
async fetch(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return failure(405, 'edge_function', 'METHOD_NOT_ALLOWED', 'Method not allowed')

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 20000) return failure(413, 'validation', 'PAYLOAD_TOO_LARGE', '請確認欄位長度。')

  try {
    const payload = await request.json() as { inquiry?: Inquiry, turnstileToken?: unknown }
    const rawInquiry = payload.inquiry || {}
    const inquiry = {
      name: text(rawInquiry.name),
      brand: text(rawInquiry.brand),
      website_or_social: text(rawInquiry.website_or_social),
      case_summary: text(rawInquiry.case_summary) || text(rawInquiry.problem_description),
      problem: text(rawInquiry.problem) || text(rawInquiry.problem_type),
      email: text(rawInquiry.email).toLowerCase(),
      contact: text(rawInquiry.contact) || text(rawInquiry.social_contact),
      privacy_consent: rawInquiry.privacy_consent === 'yes' || rawInquiry.privacy_consent === true,
      source: text(rawInquiry.source) || 'direct',
      utm_source: text(rawInquiry.utm_source),
      utm_medium: text(rawInquiry.utm_medium),
      utm_campaign: text(rawInquiry.utm_campaign),
      utm_content: text(rawInquiry.utm_content),
      utm_term: text(rawInquiry.utm_term),
    }

    const validLengths = within(inquiry.name, 80) && within(inquiry.brand, 150) &&
      within(inquiry.website_or_social, 500) && within(inquiry.case_summary, 3000) &&
      within(inquiry.problem, 500) && within(inquiry.email, 320) && within(inquiry.contact, 300) &&
      within(inquiry.source, 100) && [inquiry.utm_source, inquiry.utm_medium, inquiry.utm_campaign,
        inquiry.utm_content, inquiry.utm_term].every(value => within(value, 200))
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)
    if (!inquiry.name || !inquiry.brand || !inquiry.case_summary || !inquiry.problem ||
        !validEmail || !inquiry.privacy_consent || !validLengths) {
      return failure(400, 'validation', 'INVALID_INPUT', '請確認必填欄位與欄位長度。')
    }

    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!turnstileSecret) return failure(503, 'turnstile', 'TURNSTILE_NOT_CONFIGURED', '安全驗證尚未設定。')
    const turnstileToken = text(payload.turnstileToken)
    if (!turnstileToken || !within(turnstileToken, 2048)) {
      return failure(400, 'turnstile', 'TOKEN_MISSING', '請完成安全驗證。')
    }

    const verifyBody = new FormData()
    verifyBody.set('secret', turnstileSecret)
    verifyBody.set('response', turnstileToken)
    const remoteIp = request.headers.get('CF-Connecting-IP')
    if (remoteIp) verifyBody.set('remoteip', remoteIp)
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: verifyBody,
    })
    if (!verifyResponse.ok) return failure(502, 'turnstile', 'VERIFY_UNAVAILABLE', '安全驗證暫時無法完成。')
    const verification = await verifyResponse.json() as { success?: boolean, hostname?: string, action?: string }
    const expectedHostname = Deno.env.get('TURNSTILE_EXPECTED_HOSTNAME')
    if (!verification.success || verification.action !== 'inquiry' ||
        (expectedHostname && verification.hostname !== expectedHostname)) {
      return failure(403, 'turnstile', 'TURNSTILE_FAILED', '安全驗證失敗，請重新嘗試。')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const secretKey = getSecretKey()
    if (!supabaseUrl || !secretKey) return failure(503, 'database', 'DATABASE_NOT_CONFIGURED', '表單服務尚未設定。')
    const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } })
    const record = {
      name: inquiry.name,
      brand: inquiry.brand,
      website_or_social: optional(inquiry.website_or_social),
      case_summary: inquiry.case_summary,
      problem: inquiry.problem,
      email: inquiry.email,
      contact: optional(inquiry.contact),
      privacy_consent: true,
      consented_at: new Date().toISOString(),
      source: inquiry.source,
      status: 'new',
      social_contact: optional(inquiry.contact),
      problem_type: inquiry.problem,
      problem_description: inquiry.case_summary,
      utm_source: optional(inquiry.utm_source),
      utm_medium: optional(inquiry.utm_medium),
      utm_campaign: optional(inquiry.utm_campaign),
      utm_content: optional(inquiry.utm_content),
      utm_term: optional(inquiry.utm_term),
    }
    const { data: inserted, error: insertError } = await supabase
      .from('inquiries').insert(record).select('id,status').single()
    if (insertError || !inserted?.id || inserted.status !== 'new') {
      console.error('Inquiry insert failed', insertError?.code || 'missing confirmation')
      return failure(500, 'database', 'DB_INSERT_FAILED', '目前無法送出，請稍後再試。')
    }

    let notificationSent = false
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const notificationEmail = Deno.env.get('INQUIRY_NOTIFICATION_EMAIL') || '35slit.light@gmail.com'
      const from = Deno.env.get('RESEND_FROM') || 'slit.light <onboarding@resend.dev>'
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [notificationEmail],
          reply_to: inquiry.email,
          subject: `Slit.light 新詢問｜${inquiry.problem}｜${inquiry.name}`,
          text: `姓名：${inquiry.name}\n品牌／目前工作：${inquiry.brand}\n網站／社群：${inquiry.website_or_social || '未提供'}\nEmail：${inquiry.email}\n其他聯絡：${inquiry.contact || '未提供'}\n問題：${inquiry.problem}\n來源：${inquiry.source}\n\n${inquiry.case_summary}`,
          html: `<h2>網站收到新詢問</h2><p><strong>姓名：</strong>${escapeHtml(inquiry.name)}</p><p><strong>品牌／目前工作：</strong>${escapeHtml(inquiry.brand)}</p><p><strong>網站／社群：</strong>${escapeHtml(inquiry.website_or_social || '未提供')}</p><p><strong>Email：</strong><a href="mailto:${escapeHtml(inquiry.email)}">${escapeHtml(inquiry.email)}</a></p><p><strong>其他聯絡：</strong>${escapeHtml(inquiry.contact || '未提供')}</p><p><strong>問題：</strong>${escapeHtml(inquiry.problem)}</p><p><strong>來源：</strong>${escapeHtml(inquiry.source)}</p><hr><p>${escapeHtml(inquiry.case_summary).replace(/\n/g, '<br>')}</p>`,
        }),
      })
      notificationSent = emailResponse.ok
      if (!emailResponse.ok) console.error('Inquiry stored but notification delivery failed')
    }

    return json({ ok: true, id: inserted.id, status: inserted.status, notificationSent })
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown inquiry error')
    return failure(500, 'edge_function', 'UNEXPECTED_ERROR', '目前無法送出，請稍後再試。')
  }
},
}
