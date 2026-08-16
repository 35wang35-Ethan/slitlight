const PUBLIC_EMAIL = '35slit.light@gmail.com';

const siteContent = {
  settings: {
    email: PUBLIC_EMAIL,
    instagramUrl: '',
    lineUrl: '',
    facebookUrl: ''
  },
  services: [
    {
      name: '內容診斷',
      fit: '我不知道問題到底在哪裡。',
      subtitle: '先看清楚問題在哪裡，再決定下一步。',
      targetCustomer: '已經有經營社群，但不知道問題在哪裡的人。',
      items: ['事前資料檢視', '60–90 分鐘一對一諮詢', '現有內容診斷', '核心問題整理', '3 個優先改善方向', '會後重點摘要'],
      regularPrice: 'NT$3,500', promoPrice: 'NT$2,500', priceVisible: true,
      duration: '一次 60–90 分鐘', ctaText: '預約內容診斷', featured: false
    },
    {
      name: 'IP 核心企劃',
      fit: '我有專業、有想法，但不知道怎麼說清楚。',
      subtitle: '把專業與經驗，整理成清楚的內容定位。',
      targetCustomer: '有專業、有想法，但不知道如何形成清楚內容定位的人。',
      items: ['前期問卷', '1–2 次深度訪談', 'IP／品牌核心梳理', '目標客群與主要問題整理', '差異化觀點', '3–5 個內容主軸', '10–15 個內容題目', '一次修改'],
      regularPrice: 'NT$12,000', promoPrice: 'NT$8,800', priceVisible: true,
      duration: '約 7–10 個工作天', ctaText: '了解 IP 核心企劃', featured: true
    },
    {
      name: 'IP 內容轉換企劃',
      fit: '已經有人看，但信任與詢問沒有接起來。',
      subtitle: '讓內容從被看見，接到信任與詢問。',
      targetCustomer: '已經有流量，希望進一步建立信任、詢問與完整內容系統的人。',
      items: ['IP 核心企劃全部內容', '現有內容漏斗診斷', '轉換卡點分析', '內容與服務連結設計', '20–30 個內容題目', '3–5 支短影音企劃／腳本架構', 'CTA 建議', '2–4 週執行追蹤'],
      regularPrice: 'NT$25,000', promoPrice: 'NT$18,800', priceVisible: true,
      duration: '約 2–4 週', ctaText: '聊聊目前的轉換問題', featured: false
    }
  ],
  faqs: [
    ['我還不知道自己的定位，可以找隙光嗎？', '可以。定位不清楚正是適合透過訪談與核心挖掘一起整理的狀況，不需要先準備一套完整答案。'],
    ['我沒有很多流量，也適合嗎？', '適合。內容策略不只處理流量，更重要的是讓正確的人理解你的價值。流量不高時先建立清楚方向，也能減少之後反覆試錯。'],
    ['你們會直接幫我拍影片嗎？', '隙光的核心服務是品牌內容與溝通策略。若企劃完成後需要拍攝或剪輯，可以依需求另外評估與報價。'],
    ['這跟社群代操有什麼不同？', '社群代操通常負責持續發布與帳號營運；隙光聚焦在釐清你要說什麼、為誰而說，以及內容如何連接到理解、信任與詢問。'],
    ['一次合作大概需要多久？', '內容診斷約 60–90 分鐘；IP 核心企劃約 7–10 個工作天；IP 內容轉換企劃約 2–4 週。實際時間會依資料與討論節奏調整。'],
    ['可以只做一次諮詢嗎？', '可以。內容診斷就是一次性的服務，適合先釐清目前最主要的問題與改善順序。'],
    ['需要準備什麼資料？', '建議提供目前的社群、網站、服務介紹、過往內容，以及你觀察到的客戶問題。不必整理得很完整，我們會協助梳理。'],
    ['線上還是實體？', '以線上會議為主；若有實體訪談或拍攝需求，可再依地點與專案內容討論。'],
    ['可以保證流量或成交嗎？', '不能。內容策略能提高訊息的清楚度與一致性，但觀看、成交與營收仍受到產品、市場、執行與銷售流程等因素影響。'],
    ['做完之後我會拿到什麼？', '依方案取得診斷摘要、品牌核心、目標客群、內容主軸、內容題目、轉換建議或腳本架構等可執行資料。'],
    ['是否包含腳本？', 'IP 內容轉換企劃包含 3–5 支短影音企劃／腳本架構。完整逐字腳本或更多數量可另行估價。'],
    ['修改次數怎麼計算？', 'IP 核心企劃包含一次整體修改；轉換企劃會依提案與追蹤節點討論調整。新增方向或超出原範圍的內容會另行確認。'],
    ['可以另外加購拍攝或剪輯嗎？', '可以。完成策略與內容方向後，可依需要評估現場拍攝、剪輯或製作執行。']
  ]
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
}

function formatEditableText(value) {
  return escapeHtml(value || '').replace(/\r?\n/g, '<br>');
}

function renderPainPoints(points = []) {
  const grid = document.querySelector('#painGrid');
  if (!grid || !points.length) return;
  grid.innerHTML = points.map((point, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><p>${point.title ? `<strong>${escapeHtml(point.title)}</strong>` : ''}${point.description ? `${point.title ? '<br>' : ''}${formatEditableText(point.description)}` : ''}</p></article>`).join('');
}

function renderMethods(methods = []) {
  const list = document.querySelector('#methodsList');
  if (!list || !methods.length) return;
  list.innerHTML = methods.map((method, index) => {
    const image = method.image_url?.trim();
    return `<article><div class="method-body"><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(method.title)}</h3><p>${formatEditableText(method.description)}</p></div></div>${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(method.title)}示意圖" loading="lazy" decoding="async">` : ''}</article>`;
  }).join('');
}

function renderCases(cases = []) {
  const grid = document.querySelector('#casesGrid');
  if (!grid || !cases.length) return;
  const labels = [['problem', '原本問題'], ['insight', '關鍵洞察'], ['strategy', '策略處理'], ['execution', '執行內容'], ['result', '目前成果']];
  grid.innerHTML = cases.map(item => {
    const image = item.cover_image?.trim() || 'assets/images/case-placeholder.jpg';
    const details = labels.filter(([key]) => item[key]).map(([key, label]) => `<div><dt>${label}</dt><dd>${formatEditableText(item[key])}</dd></div>`).join('');
    const isDemo = item.client_type?.includes('示範');
    return `<article class="case-card"><img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async"><div><p class="eyebrow">${isDemo ? 'SELF-INITIATED DEMO' : 'CONSULTING CASE'}</p>${item.client_type ? `<span class="case-label">${escapeHtml(item.client_type)}${isDemo ? '｜不是客戶案例' : ''}</span>` : ''}<h3>${escapeHtml(item.title)}</h3>${item.problem ? `<p>${formatEditableText(item.problem)}</p>` : ''}${details ? `<dl>${details}</dl>` : ''}${item.testimonial ? `<blockquote>${formatEditableText(item.testimonial)}</blockquote>` : ''}</div></article>`;
  }).join('');
}

function applyHomepageSections(sections = []) {
  sections.forEach(section => {
    const container = document.querySelector(`[data-cms-section="${CSS.escape(section.section_key)}"]`);
    if (!container) return;
    if (section.title) container.querySelector('[data-cms-title]').innerHTML = formatEditableText(section.title);
    if (section.content) container.querySelector('[data-cms-content]').innerHTML = formatEditableText(section.content);
    if (section.image_url) {
      const image = container.querySelector('[data-cms-image]');
      const heroImage = container.querySelector('.hero-image');
      if (image) {
        image.src = section.image_url;
        image.removeAttribute('srcset');
      }
      if (heroImage) heroImage.style.backgroundImage = `url("${section.image_url.replace(/["\\]/g, '\\$&')}")`;
    }
    if (section.cta_text) {
      const cta = container.querySelector('[data-track="inquiry_click"]');
      if (cta) cta.textContent = section.cta_text;
      if (cta && section.cta_url) cta.href = section.cta_url;
    }
  });
}

function renderServices(services = siteContent.services) {
  const grid = document.querySelector('#servicesGrid');
  if (!grid) return;
  grid.innerHTML = services.map((service, index) => {
    const promoPrice = typeof service.promoPrice === 'number' ? `NT$${service.promoPrice.toLocaleString()}` : service.promoPrice;
    const regularPrice = typeof service.regularPrice === 'number' ? `NT$${service.regularPrice.toLocaleString()}` : service.regularPrice;
    const priceParts = promoPrice?.match(/^(NT\$)(.+)$/);
    const price = service.priceVisible ? `<div class="service-price"><del>原價 ${escapeHtml(regularPrice)}</del><div><span>${escapeHtml(priceParts?.[1] || '')}</span><strong>${escapeHtml(priceParts?.[2] || promoPrice)}</strong></div><small>初期案例價</small></div>` : '';
    return `<div class="col-lg-4 col-md-6"><article class="service-card${service.featured ? ' featured' : ''}" data-service="${escapeHtml(service.name)}">${service.featured ? '<span class="service-badge">適合從這裡開始</span>' : ''}<span class="service-index">0${index + 1}</span><h3>${escapeHtml(service.name)}</h3><p class="service-fit">${escapeHtml(service.fit)}</p><p class="service-target"><strong>適合：</strong>${escapeHtml(service.targetCustomer)}</p>${price}<p class="service-subtitle">${escapeHtml(service.subtitle)}</p><ul>${service.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul><p class="service-duration">時間：${escapeHtml(service.duration)}</p><a class="btn btn-gold" href="#contact" data-track="inquiry_click" aria-label="看看${escapeHtml(service.name)}是否適合">看看適不適合</a></article></div>`;
  }).join('');
}

const FAQ_PREVIEW_COUNT = 6;
let faqExpanded = false;

function setFaqExpanded(expanded) {
  faqExpanded = expanded;
  const extraItems = [...document.querySelectorAll('#faqAccordion .faq-extra')];
  extraItems.forEach(item => { item.hidden = !expanded; });

  const toggle = document.querySelector('#faqToggle');
  const label = toggle?.querySelector('[data-faq-toggle-label]');
  const icon = toggle?.querySelector('.faq-toggle-icon');
  if (!toggle || !label || !icon) return;
  toggle.setAttribute('aria-expanded', String(expanded));
  label.textContent = expanded ? '收合常見問題' : `查看更多常見問題（${extraItems.length}）`;
  icon.textContent = expanded ? '−' : '＋';
}

function renderFaqs(faqs = siteContent.faqs) {
  const accordion = document.querySelector('#faqAccordion');
  if (!accordion) return;
  accordion.innerHTML = faqs.map((faq, index) => { const [question, answer] = Array.isArray(faq) ? faq : [faq.question, faq.answer]; const isExtra = index >= FAQ_PREVIEW_COUNT; return `<div class="accordion-item${isExtra ? ' faq-extra' : ''}"${isExtra ? ' hidden' : ''}><h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-${index}" aria-expanded="false" aria-controls="faq-${index}">${escapeHtml(question)}</button></h3><div id="faq-${index}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion"><div class="accordion-body">${escapeHtml(answer)}</div></div></div>`; }).join('');
  const more = document.querySelector('#faqMore');
  if (more) more.hidden = faqs.length <= FAQ_PREVIEW_COUNT;
  setFaqExpanded(false);
}

function applySiteSettings(settings = {}) {
  siteContent.settings = {
    email: PUBLIC_EMAIL,
    instagramUrl: settings.instagram_url || '',
    lineUrl: settings.line_url || '',
    facebookUrl: settings.facebook_url || ''
  };

  document.querySelectorAll('[data-link]').forEach(link => {
    const value = siteContent.settings[link.dataset.link]?.trim();
    link.hidden = !value;
    if (!value) {
      link.removeAttribute('href');
      return;
    }
    link.href = link.dataset.link === 'email' ? `mailto:${value}` : value;
    if (link.dataset.link === 'email') link.textContent = value;
  });

  const title = settings.meta_title?.trim();
  const description = settings.meta_description?.trim();
  const image = settings.og_image_url?.trim();
  if (title) {
    document.title = title;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  }
  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  }
  if (image) {
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', image);
    document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', image);
  }
}

renderServices();
renderFaqs();
document.querySelector('#faqToggle')?.addEventListener('click', () => setFaqExpanded(!faqExpanded));

async function loadCloudContent() {
  if (typeof slitSupabase === 'undefined') return;
  const [servicesResult, faqsResult, settingsResult, homepageResult, painResult, methodsResult, casesResult] = await Promise.all([
    slitSupabase.from('services').select('*').eq('enabled', true).order('sort_order'),
    slitSupabase.from('faqs').select('question,answer').eq('enabled', true).order('sort_order'),
    slitSupabase.from('site_settings').select('email,instagram_url,line_url,facebook_url,meta_title,meta_description,og_image_url').eq('is_published', true).limit(1).maybeSingle(),
    slitSupabase.from('homepage_sections').select('*').eq('enabled', true).order('sort_order'),
    slitSupabase.from('pain_points').select('*').eq('enabled', true).order('sort_order'),
    slitSupabase.from('methods').select('*').eq('enabled', true).order('sort_order'),
    slitSupabase.from('cases').select('*').eq('publish_status', 'published').order('sort_order')
  ]);
  if (!servicesResult.error && servicesResult.data?.length) renderServices(servicesResult.data.map(service => ({
    name: service.name, fit: service.description, subtitle: service.subtitle, targetCustomer: service.target_customer,
    items: service.items, regularPrice: service.regular_price, promoPrice: service.promo_price,
    priceVisible: service.price_visible, duration: service.duration, featured: service.featured
  })));
  if (!faqsResult.error && faqsResult.data?.length) renderFaqs(faqsResult.data);
  if (!settingsResult.error && settingsResult.data) applySiteSettings(settingsResult.data);
  if (!homepageResult.error && homepageResult.data?.length) applyHomepageSections(homepageResult.data);
  if (!painResult.error && painResult.data?.length) renderPainPoints(painResult.data);
  if (!methodsResult.error && methodsResult.data?.length) renderMethods(methodsResult.data);
  if (!casesResult.error && casesResult.data?.length) renderCases(casesResult.data);
}

loadCloudContent();
