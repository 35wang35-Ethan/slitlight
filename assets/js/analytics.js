(() => {
  document.querySelectorAll('[data-current-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  const analyticsId = window.slitConfig?.analyticsId?.trim();
  if (!analyticsId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', analyticsId, { anonymize_ip: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
  document.head.append(script);

})();
