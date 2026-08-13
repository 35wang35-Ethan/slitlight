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

    const payload = { ...Object.fromEntries(new FormData(form)), ...utmParameters, source: utmParameters.utm_source || 'direct' };
    console.info('Phase 2 inquiry preview:', payload);
    form.classList.remove('was-validated');
    form.reset();
    const status = document.querySelector('#formStatus');
    status.className = 'form-status info';
    status.innerHTML = '<strong>表單介面已完成。</strong><br>正式送出功能會在 Supabase 串接階段啟用；目前沒有傳送或保存你的資料。';
  });
}
