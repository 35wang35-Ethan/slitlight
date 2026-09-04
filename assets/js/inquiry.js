(() => {
  const form = document.querySelector('#inquiryForm');
  const modal = document.querySelector('#pre-brief');
  if (!form || !modal) return;

  const config = window.slitConfig || {};
  const status = document.querySelector('#formStatus');
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector('[data-submit-label]');
  const errorState = document.querySelector('#inquiryError');
  const successState = document.querySelector('#inquirySuccess');
  const intro = document.querySelector('#prebrief-intro');
  const turnstileContainer = document.querySelector('#turnstileContainer');
  let turnstileToken = '';
  let turnstileWidgetId = null;
  let isSubmitting = false;
  let hasStarted = false;
  let source = document.body.dataset.page === 'case-sprint' ? 'case_sprint_direct' : 'home_direct';

  const allowedStages = new Set(['validation', 'turnstile', 'network', 'edge_function', 'database', 'unknown']);
  const track = (name, properties = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ stage: null, error_code: null, ...properties, event: name });
  };
  const trackingProperties = extra => ({ source, ...extra });
  const setStatus = (type = '', message = '') => {
    status.className = `form-status${type ? ` ${type}` : ''}`;
    status.textContent = message;
  };
  const setSubmitting = submitting => {
    isSubmitting = submitting;
    submitButton.disabled = submitting;
    submitButton.classList.toggle('is-loading', submitting);
    submitButton.setAttribute('aria-busy', String(submitting));
    submitLabel.textContent = submitting ? '送出中…' : '送出案例';
  };
  const resetTurnstile = () => {
    turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
  };
  const showError = () => {
    submitButton.hidden = true;
    errorState.hidden = false;
    setStatus('', '');
    errorState.querySelector('button')?.focus();
  };

  const renderTurnstile = () => {
    if (!window.turnstile || turnstileWidgetId !== null || !turnstileContainer) return;
    turnstileWidgetId = window.turnstile.render(turnstileContainer, {
      sitekey: config.turnstileSiteKey,
      size: 'flexible',
      theme: 'light',
      language: 'zh-tw',
      action: 'inquiry',
      callback: token => { turnstileToken = token; },
      'expired-callback': () => { turnstileToken = ''; },
      'error-callback': () => {
        turnstileToken = '';
        setStatus('error', '安全驗證暫時無法完成，請稍後再試。');
      }
    });
  };

  if (config.turnstileSiteKey?.trim() && turnstileContainer) {
    turnstileContainer.hidden = false;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', renderTurnstile);
    script.addEventListener('error', () => {
      setStatus('error', '安全驗證載入失敗，請重新整理後再試。');
    });
    document.head.append(script);
  }

  if (document.body.dataset.page === 'case-sprint') {
    track('case_sprint_view', { page_location: window.location.href });
  }

  modal.addEventListener('shown.bs.modal', () => {
    source = modal.dataset.prebriefSource || source;
    track('prebrief_open', trackingProperties());
  });

  const markStarted = event => {
    if (hasStarted || !event.target.matches('input:not([type="hidden"]):not([name="company_website"]), textarea, select')) return;
    hasStarted = true;
    track('inquiry_start', trackingProperties());
  };
  form.addEventListener('input', markStarted);
  form.addEventListener('change', markStarted);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (isSubmitting) return;

    errorState.hidden = true;
    if (form.elements.company_website?.value) {
      form.reset();
      return;
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      form.querySelector(':invalid')?.focus();
      track('inquiry_error', trackingProperties({ stage: 'validation', error_code: 'FORM_INVALID' }));
      return;
    }

    if (config.turnstileSiteKey?.trim() && !turnstileToken) {
      setStatus('info', '請先完成防垃圾訊息驗證。');
      track('inquiry_error', trackingProperties({ stage: 'turnstile', error_code: 'TOKEN_MISSING' }));
      return;
    }

    const values = Object.fromEntries(
      [...new FormData(form)]
        .filter(([key]) => !['company_website', 'cf-turnstile-response'].includes(key))
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );
    const search = new URLSearchParams(window.location.search);
    const inquiry = {
      ...values,
      source,
      problem_type: values.problem,
      problem_description: values.case_summary,
      social_contact: values.contact || '',
      utm_source: search.get('utm_source') || '',
      utm_medium: search.get('utm_medium') || '',
      utm_campaign: search.get('utm_campaign') || '',
      utm_content: search.get('utm_content') || '',
      utm_term: search.get('utm_term') || ''
    };

    setSubmitting(true);
    setStatus('info', '正在安全地送出案例。');

    try {
      if (!window.slitData?.functions?.invoke || !config.secureInquiryEnabled) {
        const unavailable = new Error('Inquiry service unavailable');
        unavailable.stage = 'edge_function';
        unavailable.code = 'SERVICE_UNAVAILABLE';
        throw unavailable;
      }
      const result = await window.slitData.functions.invoke(config.inquiryFunction || 'submit-inquiry', {
        inquiry,
        turnstileToken
      });
      if (!result?.ok || !result?.id || result?.status !== 'new') {
        const incomplete = new Error('Inquiry confirmation missing');
        incomplete.stage = 'database';
        incomplete.code = 'INSERT_NOT_CONFIRMED';
        throw incomplete;
      }

      form.classList.remove('was-validated');
      form.reset();
      form.hidden = true;
      intro.hidden = true;
      successState.hidden = false;
      setSubmitting(false);
      track('inquiry_submit', trackingProperties());
      successState.focus();
    } catch (error) {
      console.error('Inquiry submission failed', {
        stage: error?.stage || 'unknown',
        error_code: error?.code || '',
        status: error?.status || 0
      });
      const networkFailure = error instanceof TypeError || (!error?.status && !error?.stage);
      const reportedStage = networkFailure ? 'network' : error?.stage;
      const stage = allowedStages.has(reportedStage) ? reportedStage : 'unknown';
      const errorCode = /^[A-Z0-9_]{1,64}$/.test(error?.code || '') ? error.code : undefined;
      track('inquiry_error', trackingProperties({ stage, ...(errorCode ? { error_code: errorCode } : {}) }));
      setSubmitting(false);
      resetTurnstile();
      showError();
    }
  });

  document.querySelector('#retryInquiry')?.addEventListener('click', () => {
    errorState.hidden = true;
    submitButton.hidden = false;
    setStatus(config.turnstileSiteKey?.trim() && !turnstileToken ? 'info' : '',
      config.turnstileSiteKey?.trim() && !turnstileToken ? '請完成安全驗證後重新送出。' : '');
    submitButton.focus();
  });

  modal.addEventListener('hide.bs.modal', event => {
    if (isSubmitting) event.preventDefault();
  });

  modal.addEventListener('hidden.bs.modal', () => {
    if (!successState.hidden) {
      successState.hidden = true;
      form.hidden = false;
      intro.hidden = false;
      errorState.hidden = true;
      submitButton.hidden = false;
      setStatus('', '');
      resetTurnstile();
      hasStarted = false;
    }
    setSubmitting(false);
  });
})();
