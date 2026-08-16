(() => {
  const storageKey = 'slit-consent-v1';
  const banner = document.querySelector('#consentBanner');
  const analyticsId = window.slitConfig?.analyticsId?.trim();
  let analyticsLoaded = false;

  const readChoice = () => {
    try { return localStorage.getItem(storageKey); } catch { return null; }
  };

  const saveChoice = value => {
    try { localStorage.setItem(storageKey, value); } catch { /* Consent still applies to this page. */ }
  };

  const loadAnalytics = () => {
    if (!analyticsId || analyticsLoaded) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', analyticsId, { anonymize_ip: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
    document.head.append(script);
  };

  const showBanner = (moveFocus = false) => {
    if (!banner) return;
    banner.hidden = false;
    if (moveFocus) banner.querySelector('[data-consent="essential"]')?.focus();
  };

  const hideBanner = () => {
    if (banner) banner.hidden = true;
  };

  const applyChoice = choice => {
    if (choice === 'analytics') loadAnalytics();
    hideBanner();
  };

  banner?.addEventListener('click', event => {
    const button = event.target.closest('[data-consent]');
    if (!button) return;
    const choice = button.dataset.consent;
    saveChoice(choice);
    applyChoice(choice);
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('[data-consent-settings]')) return;
    showBanner(true);
  });

  const choice = readChoice();
  if (choice) applyChoice(choice); else showBanner();
  document.querySelectorAll('[data-current-year]').forEach(element => { element.textContent = new Date().getFullYear(); });
})();
