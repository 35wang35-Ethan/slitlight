const inquiryForm = document.querySelector('#inquiryForm');

const utmParameters = Object.fromEntries(
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .map(key => [key, new URLSearchParams(window.location.search).get(key) || ''])
);

if (inquiryForm) {
  let hasStarted = false;
  inquiryForm.addEventListener('input', () => {
    if (!hasStarted) {
      hasStarted = true;
      trackEvent('inquiry_start');
    }
  });

  inquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      form.querySelector(':invalid')?.focus();
      return;
    }

    const status = document.querySelector('#formStatus');
    const button = form.querySelector('button[type="submit"]');
    const payload = { ...Object.fromEntries(new FormData(form)), ...utmParameters, source: utmParameters.utm_source || 'direct' };
    button.disabled = true;
    button.textContent = '傳送中…';
    slitSupabase.from('inquiries').insert(payload).then(({ error }) => {
      if (error) {
        status.className = 'form-status error';
        status.textContent = '目前無法送出，請稍後再試，或透過 Email 與我們聯絡。';
        return;
      }
      form.classList.remove('was-validated');
      form.reset();
      status.className = 'form-status success';
      status.innerHTML = '<strong>已收到你的問題。</strong><br>我會先看看目前的狀況，再於 1–2 個工作天內回覆你。';
      trackEvent('inquiry_submit');
    }).finally(() => {
      button.disabled = false;
      button.textContent = '送出目前的問題';
    });
  });
}
