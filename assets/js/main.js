document.querySelectorAll('[data-current-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});

const offcanvasNavigation = document.querySelector('.site-nav-panel');
offcanvasNavigation?.querySelectorAll('a[href]').forEach(link => {
  link.addEventListener('click', () => {
    window.bootstrap?.Offcanvas.getInstance(offcanvasNavigation)?.hide();
  });
});

const revealItems = [...document.querySelectorAll('.reveal:not(.is-visible)')];
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}
