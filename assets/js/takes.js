(() => {
  const script = document.currentScript;
  const source = script?.dataset.source;
  const grid = document.querySelector('[data-selected-grid]');
  if (!source || !grid) return;

  const labels = { choice: 'CHOICE', 'second-look': 'SECOND LOOK', frame: 'FRAME' };
  const allowedCategories = new Set(Object.keys(labels));
  const pageBase = document.body.dataset.pageBase || '';
  const dataUrl = new URL(source, document.baseURI).href;

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const assetPath = path => `${pageBase}${String(path || '').replace(/^\/+/, '')}`;
  const webpPath = path => assetPath(path).replace(/\.jpe?g$/i, '.webp');
  const mobilePath = (path, extension) => assetPath(path).replace(/\.jpe?g$/i, `-768.${extension}`);
  const isExternal = value => /^https?:\/\//i.test(String(value || ''));
  const safeLink = value => {
    const link = String(value || '').trim();
    return /^(https?:\/\/|\.\.\/|\.\/|\/)/.test(link) ? link : '';
  };
  const internalLink = value => {
    const slug = String(value || '').trim();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) ? `${pageBase}takes/${encodeURIComponent(slug)}/` : '';
  };

  function linkMarkup(url, label, content, className = '') {
    if (!url) return content;
    const external = isExternal(url);
    return `<a${className ? ` class="${className}"` : ''} href="${escapeHtml(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''} aria-label="${escapeHtml(label)}">${content}</a>`;
  }

  function workInfoMarkup(item) {
    const parts = [];
    if (item.workTitle) parts.push(escapeHtml(item.workTitle));
    if (item.year) parts.push(escapeHtml(item.year));
    if (item.director) parts.push(escapeHtml(item.director));
    if (item.creator) parts.push(escapeHtml(item.creator));
    return parts.length ? `<p class="selected-work">Work｜${parts.join('｜')}</p>` : '';
  }

  function imageMarkup(item, featured) {
    const image = String(item.cover || '');
    const width = Number(item.coverWidth) || 1200;
    const height = Number(item.coverHeight) || 900;
    const alt = escapeHtml(item.coverAlt || item.title);
    if (isExternal(image)) {
      return `<div class="selected-media site-image"><img class="selected-image" src="${escapeHtml(image)}" width="${width}" height="${height}" loading="lazy" decoding="async" alt="${alt}"></div>`;
    }
    const sizes = featured ? '(max-width: 767px) 100vw, (max-width: 1199px) 92vw, 62vw' : '(max-width: 767px) 100vw, 46vw';
    return `<picture class="selected-media site-image"><source type="image/webp" srcset="${escapeHtml(mobilePath(image, 'webp'))} 768w, ${escapeHtml(webpPath(image))} ${width}w" sizes="${sizes}"><img class="selected-image" src="${escapeHtml(assetPath(image))}" srcset="${escapeHtml(mobilePath(image, 'jpg'))} 768w, ${escapeHtml(assetPath(image))} ${width}w" sizes="${sizes}" width="${width}" height="${height}" loading="lazy" decoding="async" alt="${alt}"></picture>`;
  }

  function cardMarkup(item, index) {
    const title = escapeHtml(item.title);
    const url = safeLink(item.instagramUrl || item.externalUrl) || internalLink(item.internalSlug);
    const featured = index === 0;
    const media = linkMarkup(url, `觀看：${item.title}`, imageMarkup(item, featured), 'selected-media-link');
    const heading = linkMarkup(url, `觀看：${item.title}`, title);
    return `<article class="selected-item${featured ? ' selected-item--featured' : ''} reveal is-visible" data-category="${escapeHtml(item.category)}">${media}<div class="selected-copy"><p class="selected-category">${labels[item.category]}</p><h3>${heading}</h3><p class="selected-description">${escapeHtml(item.description)}</p>${workInfoMarkup(item)}</div></article>`;
  }

  function visibleItems(items) {
    const selectedOnly = grid.dataset.selectedOnly === 'true';
    const limit = Math.min(5, Math.max(0, Number.parseInt(grid.dataset.limit || '0', 10)));
    const ordered = items
      .filter(item => allowedCategories.has(item.category) && (!selectedOnly || item.selected))
      .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    return limit ? ordered.slice(0, limit) : ordered;
  }

  function render(items) {
    const visible = visibleItems(items);
    if (!visible.length) return false;
    grid.innerHTML = visible.map(cardMarkup).join('');
    return true;
  }

  function parseMetadata(value) {
    try {
      const parsed = JSON.parse(value || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function caseToTake(row) {
    const metadata = parseMetadata(row.execution);
    return {
      id: row.id,
      slug: row.slug,
      category: row.client_type,
      title: row.title,
      description: row.insight || '',
      cover: row.cover_image || '',
      coverAlt: metadata.coverAlt || row.title,
      coverWidth: Number(metadata.coverWidth) || 1200,
      coverHeight: Number(metadata.coverHeight) || 900,
      selected: row.publish_status === 'published',
      order: Number(row.sort_order) || 999,
      workTitle: row.client_name || '',
      year: metadata.year || null,
      director: metadata.director || '',
      creator: metadata.creator || '',
      externalUrl: metadata.externalUrl || '',
      instagramUrl: metadata.instagramUrl || '',
      internalSlug: metadata.internalSlug || ''
    };
  }

  async function loadStatic() {
    const response = await fetch(dataUrl, { cache: 'no-cache', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadCms() {
    if (!window.slitData) return [];
    const query = 'select=id,title,slug,cover_image,client_name,client_type,insight,execution,publish_status,sort_order&client_type=in.(choice,second-look,frame)&publish_status=eq.published&order=sort_order.asc&limit=5';
    const rows = await window.slitData.rest.select('cases', query);
    return (rows || []).map(caseToTake);
  }

  loadStatic()
    .then(items => {
      if (!render(items)) grid.innerHTML = '<p class="selected-empty">精選內容正在整理中。</p>';
      return loadCms();
    })
    .then(items => {
      if (items.length >= 3) render(items);
    })
    .catch(() => {
      if (!grid.querySelector('.selected-item')) grid.innerHTML = '<p class="selected-error">內容暫時無法載入，請稍後再試。</p>';
    });
})();
