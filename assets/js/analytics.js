(() => {
  document.querySelectorAll('[data-current-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  const analyticsId = window.slitConfig?.analyticsId?.trim();
  const googleAdsId = window.slitConfig?.googleAdsId?.trim();
  const googleTagId = analyticsId || googleAdsId;
  if (!googleTagId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  if (analyticsId) window.gtag('config', analyticsId, { anonymize_ip: true });
  if (googleAdsId) window.gtag('config', googleAdsId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`;
  document.head.append(script);

})();
