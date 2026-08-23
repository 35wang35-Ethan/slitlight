(() => {
  const script = document.currentScript;
  const source = script?.dataset.source;
  const grid = document.querySelector('[data-takes-grid]');
  if (!source || !grid) return;

  const labels = {
    choice: 'CHOICE',
    'second-look': 'SECOND LOOK',
    frame: 'FRAME'
  };
  const allowedCategories = new Set(Object.keys(labels));
  const pageBase = document.body.dataset.pageBase || '';
  const isHomepage = grid.dataset.featuredOnly === 'true';

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const assetPath = path => `${pageBase}${String(path || '').replace(/^\/+/, '')}`;
  const webpPath = path => assetPath(path).replace(/\.jpe?g$/i, '.webp');
  const mobilePath = (path, extension) => assetPath(path).replace(/\.jpe?g$/i, `-768.${extension}`);
  const formatDate = value => new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(`${value}T00:00:00`));

  const cardMarkup = take => {
    const title = escapeHtml(take.title);
    const externalUrl = String(take.external_url || '').trim();
    const titleMarkup = externalUrl
      ? `<a href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">${title}</a>`
      : title;
    const film = take.category === 'frame' && take.film_title
      ? `<p class="take-card-film">Film｜${escapeHtml(take.film_title)}${take.film_year ? `｜${escapeHtml(take.film_year)}` : ''}</p>`
      : '';
    const image = take.cover_image;
    const imageMarkup = `<picture><source type="image/webp" srcset="${escapeHtml(mobilePath(image, 'webp'))} 768w, ${escapeHtml(webpPath(image))} 1122w" sizes="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 33vw"><img src="${escapeHtml(assetPath(image))}" srcset="${escapeHtml(mobilePath(image, 'jpg'))} 768w, ${escapeHtml(assetPath(image))} 1122w" sizes="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 33vw" width="1122" height="1402" loading="lazy" decoding="async" alt="${title}"></picture>`;
    const mediaMarkup = externalUrl
      ? `<a href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="閱讀：${title}">${imageMarkup}</a>`
      : imageMarkup;
    const meta = `<div class="take-card-meta"><span>${labels[take.category]}</span>${isHomepage ? '' : `<time datetime="${escapeHtml(take.date)}">${formatDate(take.date)}</time>`}</div>`;
    const supporting = isHomepage
      ? (film || `<p class="take-card-excerpt">${escapeHtml(take.excerpt)}</p>`)
      : `<p class="take-card-excerpt">${escapeHtml(take.excerpt)}</p>${film}`;
    return `<article class="col-12 col-md-6 col-lg-4 reveal is-visible" data-category="${escapeHtml(take.category)}"><div class="take-card${isHomepage ? ' take-card--home' : ''} h-100">${isHomepage ? `${meta}${mediaMarkup}` : `${mediaMarkup}${meta}`}<h3>${titleMarkup}</h3>${supporting}</div></article>`;
  };

  let publishedTakes = [];
  const render = category => {
    const filtered = category && allowedCategories.has(category)
      ? publishedTakes.filter(take => take.category === category)
      : publishedTakes;
    const eligible = grid.dataset.featuredOnly === 'true'
      ? filtered.filter(take => take.featured)
      : filtered;
    const limit = Number.parseInt(grid.dataset.limit || '0', 10);
    const visible = limit > 0 ? eligible.slice(0, limit) : eligible;
    grid.innerHTML = visible.length
      ? visible.map(cardMarkup).join('')
      : '<p class="archive-empty col-12">這個分類的內容正在整理中。</p>';
  };

  const setFilter = (category, updateHistory = false) => {
    const active = allowedCategories.has(category) ? category : '';
    document.querySelectorAll('[data-take-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.takeFilter === active));
    });
    render(active);
    if (updateHistory) {
      const url = new URL(window.location.href);
      if (active) url.searchParams.set('category', active); else url.searchParams.delete('category');
      window.history.replaceState({}, '', url);
    }
  };

  fetch(source)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(takes => {
      publishedTakes = takes
        .filter(take => take.published && allowedCategories.has(take.category))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const initialCategory = new URLSearchParams(window.location.search).get('category') || '';
      setFilter(initialCategory);
      if (isHomepage && window.location.hash) {
        window.requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
      }
      document.querySelectorAll('[data-take-filter]').forEach(button => {
        button.addEventListener('click', () => setFilter(button.dataset.takeFilter, true));
      });
    })
    .catch(() => {
      grid.innerHTML = '<p class="takes-error col-12">內容暫時無法載入，請稍後再試。</p>';
    });
})();
