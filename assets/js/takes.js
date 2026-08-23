(() => {
  const script = document.currentScript;
  const source = script?.dataset.source;
  const grid = document.querySelector('[data-selected-grid]');
  if (!source || !grid) return;

  const labels = {
    choice: 'CHOICE',
    'second-look': 'SECOND LOOK',
    frame: 'FRAME'
  };
  const allowedCategories = new Set(Object.keys(labels));
  const pageBase = document.body.dataset.pageBase || '';

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const assetPath = path => `${pageBase}${String(path || '').replace(/^\/+/, '')}`;
  const webpPath = path => assetPath(path).replace(/\.jpe?g$/i, '.webp');
  const mobilePath = (path, extension) => assetPath(path).replace(/\.jpe?g$/i, `-768.${extension}`);
  const safeLink = value => {
    const link = String(value || '').trim();
    return /^(https?:\/\/|\.\.\/|\.\/|\/)/.test(link) ? link : '';
  };
  const internalLink = value => {
    const slug = String(value || '').trim();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) ? `${pageBase}takes/${encodeURIComponent(slug)}/` : '';
  };

  const linkMarkup = (url, label, content, className = '') => {
    if (!url) return content;
    const external = /^https?:\/\//.test(url);
    return `<a${className ? ` class="${className}"` : ''} href="${escapeHtml(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''} aria-label="${escapeHtml(label)}">${content}</a>`;
  };

  const workInfoMarkup = item => {
    const parts = [];
    if (item.workTitle) parts.push(escapeHtml(item.workTitle));
    if (item.year) parts.push(escapeHtml(item.year));
    if (item.director) parts.push(escapeHtml(item.director));
    if (item.creator) parts.push(escapeHtml(item.creator));
    return parts.length ? `<p class="selected-work">Work｜${parts.join('｜')}</p>` : '';
  };

  const cardMarkup = (item, index) => {
    const title = escapeHtml(item.title);
    const url = safeLink(item.instagramUrl || item.externalUrl) || internalLink(item.internalSlug);
    const featured = index === 0;
    const image = item.cover;
    const width = Number(item.coverWidth) || 1200;
    const height = Number(item.coverHeight) || 900;
    const sizes = featured
      ? '(max-width: 767px) 100vw, (max-width: 1199px) 92vw, 62vw'
      : '(max-width: 767px) 100vw, 46vw';
    const imageMarkup = `<picture class="selected-media site-image"><source type="image/webp" srcset="${escapeHtml(mobilePath(image, 'webp'))} 768w, ${escapeHtml(webpPath(image))} ${width}w" sizes="${sizes}"><img src="${escapeHtml(assetPath(image))}" srcset="${escapeHtml(mobilePath(image, 'jpg'))} 768w, ${escapeHtml(assetPath(image))} ${width}w" sizes="${sizes}" width="${width}" height="${height}" loading="lazy" decoding="async" alt="${escapeHtml(item.coverAlt)}"></picture>`;
    const media = linkMarkup(url, `觀看：${item.title}`, imageMarkup, 'selected-media-link');
    const heading = linkMarkup(url, `觀看：${item.title}`, title);

    return `<article class="selected-item${featured ? ' selected-item--featured' : ''} reveal is-visible" data-category="${escapeHtml(item.category)}">${media}<div class="selected-copy"><p class="selected-category">${labels[item.category]}</p><h3>${heading}</h3><p class="selected-description">${escapeHtml(item.description)}</p>${workInfoMarkup(item)}</div></article>`;
  };

  fetch(source)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(items => {
      const selectedOnly = grid.dataset.selectedOnly === 'true';
      const limit = Math.min(5, Math.max(0, Number.parseInt(grid.dataset.limit || '0', 10)));
      const ordered = items
        .filter(item => allowedCategories.has(item.category) && (!selectedOnly || item.selected))
        .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
      const visible = limit ? ordered.slice(0, limit) : ordered;
      grid.innerHTML = visible.length
        ? visible.map(cardMarkup).join('')
        : '<p class="selected-empty">精選內容正在整理中。</p>';
    })
    .catch(() => {
      grid.innerHTML = '<p class="selected-error">內容暫時無法載入，請稍後再試。</p>';
    });
})();
