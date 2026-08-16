import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

type Inquiry = {
  name?: string
  email?: string
  social_contact?: string
  problem_type?: string
  problem_description?: string
  source?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

const text = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] || character))

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders })

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
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const { inquiry: rawInquiry, turnstileToken } = await request.json() as { inquiry?: Inquiry, turnstileToken?: string }
    const inquiry = {
      name: text(rawInquiry?.name, 100),
      email: text(rawInquiry?.email, 320).toLowerCase(),
      social_contact: text(rawInquiry?.social_contact, 200) || null,
      problem_type: text(rawInquiry?.problem_type, 200),
      problem_description: text(rawInquiry?.problem_description, 5000),
      source: text(rawInquiry?.source, 200) || 'direct',
      utm_source: text(rawInquiry?.utm_source, 200) || null,
      utm_medium: text(rawInquiry?.utm_medium, 200) || null,
      utm_campaign: text(rawInquiry?.utm_campaign, 200) || null,
      utm_content: text(rawInquiry?.utm_content, 200) || null,
      utm_term: text(rawInquiry?.utm_term, 200) || null,
    }

    if (!inquiry.name || !inquiry.problem_type || !inquiry.problem_description ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) {
      return json({ ok: false, error: '請確認必填欄位。' }, 400)
    }

    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!turnstileSecret) return json({ ok: false, error: '安全驗證尚未設定。' }, 503)
    if (!turnstileToken) return json({ ok: false, error: '請完成安全驗證。' }, 400)

    const verifyBody = new FormData()
    verifyBody.set('secret', turnstileSecret)
    verifyBody.set('response', turnstileToken)
    const remoteIp = request.headers.get('CF-Connecting-IP')
    if (remoteIp) verifyBody.set('remoteip', remoteIp)

    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: verifyBody,
    })
    const verification = await verifyResponse.json() as { success?: boolean, hostname?: string, action?: string }
    const expectedHostname = Deno.env.get('TURNSTILE_EXPECTED_HOSTNAME')
    if (!verification.success || verification.action !== 'inquiry' ||
        (expectedHostname && verification.hostname !== expectedHostname)) {
      return json({ ok: false, error: '安全驗證失敗，請重新嘗試。' }, 403)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const secretKey = getSecretKey()
    if (!supabaseUrl || !secretKey) return json({ ok: false, error: '表單服務尚未設定。' }, 503)
    const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } })
    const { error: insertError } = await supabase.from('inquiries').insert(inquiry)
    if (insertError) throw insertError

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
          subject: `隙光新詢問｜${inquiry.problem_type}｜${inquiry.name}`,
          text: `姓名：${inquiry.name}\nEmail：${inquiry.email}\n社群：${inquiry.social_contact || '未提供'}\n問題類型：${inquiry.problem_type}\n\n${inquiry.problem_description}`,
          html: `<h2>網站收到新詢問</h2><p><strong>姓名：</strong>${escapeHtml(inquiry.name)}</p><p><strong>Email：</strong><a href="mailto:${escapeHtml(inquiry.email)}">${escapeHtml(inquiry.email)}</a></p><p><strong>社群：</strong>${escapeHtml(inquiry.social_contact || '未提供')}</p><p><strong>問題類型：</strong>${escapeHtml(inquiry.problem_type)}</p><hr><p>${escapeHtml(inquiry.problem_description).replace(/\n/g, '<br>')}</p>`,
        }),
      })
      notificationSent = emailResponse.ok
      if (!emailResponse.ok) console.error('Inquiry stored but notification delivery failed')
    }

    return json({ ok: true, notificationSent })
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown inquiry error')
    return json({ ok: false, error: '目前無法送出，請稍後再試。' }, 500)
  }
},
}
