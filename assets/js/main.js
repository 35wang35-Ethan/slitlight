document.querySelectorAll('[data-current-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});

const siteHeader = document.querySelector('.site-header');
const updateHeaderState = () => siteHeader?.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', updateHeaderState, { passive: true });
updateHeaderState();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const offcanvasNavigation = document.querySelector('.site-nav-panel');
offcanvasNavigation?.querySelectorAll('a[href]').forEach(link => {
  link.addEventListener('click', event => {
    const instance = window.bootstrap?.Offcanvas.getInstance(offcanvasNavigation);
    const target = link.hash && link.getAttribute('href')?.startsWith('#')
      ? document.querySelector(link.hash)
      : null;
    if (instance && target && link.dataset.bsToggle === 'modal') {
      event.preventDefault();
      event.stopPropagation();
      offcanvasNavigation.addEventListener('hidden.bs.offcanvas', () => {
        window.bootstrap?.Modal.getOrCreateInstance(target).show(link);
      }, { once: true });
      instance.hide();
      return;
    }
    if (instance && target) {
      event.preventDefault();
      offcanvasNavigation.addEventListener('hidden.bs.offcanvas', () => {
        window.history.pushState(null, '', link.hash);
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }, { once: true });
    }
    instance?.hide();
  });
});

const revealItems = [...document.querySelectorAll('.reveal:not(.is-visible)')];
const sequenceItems = [...document.querySelectorAll('[data-sequence-reveal]:not(.is-visible)')];

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

const prebriefModal = document.querySelector('#pre-brief');
if (prebriefModal && window.bootstrap?.Modal) {
  const modal = window.bootstrap.Modal.getOrCreateInstance(prebriefModal);
  const allowedPrebriefSources = new Set(['takes_header']);
  const requestedPrebriefSource = new URLSearchParams(window.location.search).get('prebrief_source');
  const defaultPrebriefSource = allowedPrebriefSources.has(requestedPrebriefSource)
    ? requestedPrebriefSource
    : document.body.dataset.page === 'case-sprint' ? 'case_sprint_direct' : 'home_direct';
  const openPrebriefFromHash = () => {
    if (window.location.hash === '#pre-brief') modal.show();
  };

  prebriefModal.addEventListener('show.bs.modal', event => {
    prebriefModal.dataset.prebriefSource = event.relatedTarget?.dataset.prebriefSource || defaultPrebriefSource;
  });
  prebriefModal.addEventListener('shown.bs.modal', () => {
    if (window.location.hash !== '#pre-brief') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#pre-brief`);
    }
  });
  prebriefModal.addEventListener('hidden.bs.modal', () => {
    if (window.location.hash === '#pre-brief') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  });
  window.addEventListener('hashchange', openPrebriefFromHash);
  openPrebriefFromHash();
}
