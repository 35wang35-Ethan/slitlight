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
const sequenceItems = [...document.querySelectorAll('[data-sequence-reveal]:not(.is-visible)')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  revealItems.forEach(item => observer.observe(item));
  sequenceItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
  sequenceItems.forEach(item => item.classList.add('is-visible'));
}

const primaryNavigation = document.querySelector('#primary-navigation');
if (primaryNavigation && window.bootstrap?.ScrollSpy) {
  window.bootstrap.ScrollSpy.getOrCreateInstance(document.body, {
    target: '#primary-navigation',
    smoothScroll: !reduceMotion,
    rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--header-height').trim()} 0px -65%`
  });
} else if (primaryNavigation) {
  const spyLinks = [...primaryNavigation.querySelectorAll('a[href^="#"]')]
    .filter(link => link.hash && document.querySelector(link.hash));
  const spySections = spyLinks.map(link => document.querySelector(link.hash));
  let spyFrame;

  const updateActiveLink = () => {
    const threshold = Math.min(window.innerHeight * .35, 280);
    let activeSection = null;
    spySections.forEach(section => {
      if (section.getBoundingClientRect().top <= threshold) activeSection = section;
    });
    spyLinks.forEach(link => link.classList.toggle('active', Boolean(activeSection) && link.hash === `#${activeSection.id}`));
    spyFrame = null;
  };

  const requestSpyUpdate = () => {
    if (!spyFrame) spyFrame = window.requestAnimationFrame(updateActiveLink);
  };

  window.addEventListener('scroll', requestSpyUpdate, { passive: true });
  window.addEventListener('resize', requestSpyUpdate);
  updateActiveLink();
}
