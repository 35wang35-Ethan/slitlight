const inquiryForm = document.querySelector('#inquiryForm');
const inquiryConfig = window.slitConfig || {};
let turnstileToken = '';
let turnstileWidgetId = null;

function loadTurnstile() {
  const siteKey = inquiryConfig.turnstileSiteKey?.trim();
  const container = document.querySelector('#turnstileContainer');
  if (!siteKey || !container) return;
  container.hidden = false;

  const renderWidget = () => {
    if (!window.turnstile || turnstileWidgetId !== null) return;
    turnstileWidgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      size: 'flexible',
      theme: 'light',
      language: 'zh-TW',
      action: 'inquiry',
      callback: token => { turnstileToken = token; },
      'expired-callback': () => { turnstileToken = ''; },
      'error-callback': () => { turnstileToken = ''; }
    });
  };

  if (window.turnstile) {
    renderWidget();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  script.onload = renderWidget;
  document.head.append(script);
}

const utmParameters = Object.fromEntries(
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .map(key => [key, new URLSearchParams(window.location.search).get(key) || ''])
);

if (inquiryForm) {
  loadTurnstile();
  let hasStarted = false;
  let isSubmitting = false;
  inquiryForm.addEventListener('input', () => {
    if (!hasStarted) {
      hasStarted = true;
      trackEvent('inquiry_start');
    }
  });

  inquiryForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (isSubmitting) return;

    const honeypot = form.elements.company_website;
    if (honeypot?.value) {
      form.reset();
      return;
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      form.querySelector(':invalid')?.focus();
      return;
    }

    if (inquiryConfig.turnstileSiteKey?.trim() && !turnstileToken) {
      const status = document.querySelector('#formStatus');
      status.className = 'form-status info';
      status.textContent = '請先完成防垃圾訊息驗證。';
      return;
    }

    const status = document.querySelector('#formStatus');
    const button = form.querySelector('button[type="submit"]');
    const formValues = Object.fromEntries(
      [...new FormData(form)]
        .filter(([key]) => !['company_website', 'cf-turnstile-response'].includes(key))
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );
    const payload = { ...formValues, ...utmParameters, source: utmParameters.utm_source || 'direct' };
    const originalLabel = button.textContent;
    isSubmitting = true;
    button.disabled = true;
    button.textContent = '傳送中…';

    try {
      if (typeof slitSupabase === 'undefined') throw new Error('Inquiry service unavailable');
      if (inquiryConfig.secureInquiryEnabled) {
        const { data, error } = await slitSupabase.functions.invoke(inquiryConfig.inquiryFunction || 'submit-inquiry', {
          body: { inquiry: payload, turnstileToken }
        });
        if (error || !data?.ok) throw error || new Error(data?.error || 'Inquiry service unavailable');
      } else {
        const { error } = await slitSupabase.from('inquiries').insert(payload);
        if (error) throw error;
      }

      form.classList.remove('was-validated');
      form.reset();
      status.className = 'form-status success';
      status.innerHTML = '<strong>已收到你的問題。</strong><br>我會先看看目前的狀況，再於 1–2 個工作天內回覆你。';
      button.textContent = '已成功送出';
      form.querySelectorAll('input, select, textarea, button').forEach(control => { control.disabled = true; });
      trackEvent('inquiry_submit');
    } catch (error) {
      status.className = 'form-status error';
      status.innerHTML = '目前無法送出，請稍後再試，或直接寄信到 <a href="mailto:35slit.light@gmail.com">35slit.light@gmail.com</a>。';
      button.disabled = false;
      button.textContent = originalLabel;
      isSubmitting = false;
      turnstileToken = '';
      if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
      trackEvent('inquiry_error');
    }
  });
}
