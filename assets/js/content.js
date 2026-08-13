const siteContent = {
  settings: {
    email: 'hello@seamoflight.com',
    instagramUrl: '',
    lineUrl: ''
  },
  services: [
    {
      name: '內容診斷',
      subtitle: '先看清楚問題在哪裡，再決定下一步。',
      targetCustomer: '已經有經營社群，但不知道問題在哪裡的人。',
      items: ['事前資料檢視', '60–90 分鐘一對一諮詢', '現有內容診斷', '核心問題整理', '3 個優先改善方向', '會後重點摘要'],
      regularPrice: 'NT$3,500', promoPrice: 'NT$2,500', priceVisible: true,
      duration: '一次 60–90 分鐘', ctaText: '預約內容診斷', featured: false
    },
    {
      name: 'IP 核心企劃',
      subtitle: '把專業與經驗，整理成清楚的內容定位。',
      targetCustomer: '有專業、有想法，但不知道如何形成清楚內容定位的人。',
      items: ['前期問卷', '1–2 次深度訪談', 'IP／品牌核心梳理', '目標客群與主要問題整理', '差異化觀點', '3–5 個內容主軸', '10–15 個內容題目', '一次修改'],
      regularPrice: 'NT$12,000', promoPrice: 'NT$8,800', priceVisible: true,
      duration: '約 7–10 個工作天', ctaText: '了解 IP 核心企劃', featured: true
    },
    {
      name: 'IP 內容轉換企劃',
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

function renderServices() {
  const grid = document.querySelector('#servicesGrid');
  if (!grid) return;
  grid.innerHTML = siteContent.services.map((service, index) => {
    const price = service.priceVisible ? `<div class="service-price"><del>原價 ${escapeHtml(service.regularPrice)}</del><strong>初期案例價 ${escapeHtml(service.promoPrice)}</strong></div>` : '';
    return `<div class="col-lg-4 col-md-6"><article class="service-card${service.featured ? ' featured' : ''}" data-service="${escapeHtml(service.name)}"><span class="service-index">0${index + 1}</span><h3>${escapeHtml(service.name)}</h3><p class="service-subtitle">${escapeHtml(service.subtitle)}</p><p class="service-target"><strong>適合：</strong>${escapeHtml(service.targetCustomer)}</p><ul>${service.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul><p class="service-duration">時間：${escapeHtml(service.duration)}</p>${price}<a class="btn btn-gold" href="#contact" data-track="inquiry_click">${escapeHtml(service.ctaText)}</a></article></div>`;
  }).join('');
}

function renderFaqs() {
  const accordion = document.querySelector('#faqAccordion');
  if (!accordion) return;
  accordion.innerHTML = siteContent.faqs.map(([question, answer], index) => `<div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-${index}" aria-expanded="false" aria-controls="faq-${index}">${escapeHtml(question)}</button></h3><div id="faq-${index}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion"><div class="accordion-body">${escapeHtml(answer)}</div></div></div>`).join('');
}

renderServices();
renderFaqs();
