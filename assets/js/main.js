const trackEvent = (eventName, parameters = {}) => {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, parameters);
};

document.querySelector('#currentYear').textContent = new Date().getFullYear();

const navbar = document.querySelector('.navbar');
const updateNavbar = () => navbar?.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

document.querySelectorAll('[data-link]').forEach(link => {
  const key = link.dataset.link;
  const value = siteContent.settings[key]?.trim();
  if (!value) {
    link.hidden = true;
    return;
  }
  link.href = key === 'email' ? `mailto:${value}` : value;
});

document.addEventListener('click', event => {
  const tracked = event.target.closest('[data-track]');
  if (tracked) trackEvent(tracked.dataset.track, { link_text: tracked.textContent.trim() });

  const navLink = event.target.closest('#mainNav a');
  const collapseElement = document.querySelector('#mainNav');
  if (navLink && collapseElement?.classList.contains('show') && window.bootstrap) {
    window.bootstrap.Collapse.getOrCreateInstance(collapseElement).hide();
  }
});

document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mouseenter', () => trackEvent('service_view', { service_name: card.dataset.service }), { once: true });
});
