const statusLabels = { new:'新諮詢', contacted:'已聯絡', discovery:'初談完成', quoted:'已報價', active:'合作中', completed:'完成', declined:'未合作' };
let services = [], faqs = [], inquiries = [], settings = {};
let homepageSections = [], painPoints = [], methods = [], cases = [];

function showAlert(message, isError = false) {
  const alert = document.querySelector('#adminAlert');
  alert.textContent = message;
  alert.classList.toggle('error', isError);
  alert.classList.add('show');
  setTimeout(() => alert.classList.remove('show'), 3000);
}

function escapeAdmin(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
}

function imageFields(value = '') {
  return `<label class="full">圖片網址<input class="form-control image-url" name="image_url" value="${escapeAdmin(value)}"></label><label class="full image-upload-label">或上傳圖片<input class="form-control image-upload" type="file" accept="image/jpeg,image/png,image/webp"><small>最大 5 MB；上傳完成後會自動填入網址。</small></label>`;
}

function withId(card, row) {
  return card.dataset.id ? { ...row, id: Number(card.dataset.id) } : row;
}

async function requireAdmin() {
  const { data: { user } } = await slitSupabase.auth.getUser();
  if (!user) { location.replace('./login.html'); return null; }
  const { data } = await slitSupabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) { await slitSupabase.auth.signOut(); location.replace('./login.html'); return null; }
  document.querySelector('#adminEmail').textContent = user.email;
  return user;
}

function renderHomepageEditor() {
  document.querySelector('#homepageEditor').innerHTML = homepageSections.map((section, index) => `<article class="editor-card" data-id="${section.id || ''}" data-key="${escapeAdmin(section.section_key)}"><h3>${escapeAdmin(section.section_key)}</h3><label>標題<textarea class="form-control" name="title">${escapeAdmin(section.title)}</textarea></label><label>說明<textarea class="form-control" name="content">${escapeAdmin(section.content)}</textarea></label>${imageFields(section.image_url)}<div class="row g-2"><label class="col-6">按鈕文字<input class="form-control" name="cta_text" value="${escapeAdmin(section.cta_text)}"></label><label class="col-6">按鈕連結<input class="form-control" name="cta_url" value="${escapeAdmin(section.cta_url)}"></label></div><label>排序<input class="form-control" name="sort_order" type="number" value="${section.sort_order ?? index + 1}"></label><label class="form-check"><input class="form-check-input" type="checkbox" name="enabled" ${section.enabled ? 'checked' : ''}> 前台顯示</label></article>`).join('') || '<p class="admin-card">尚無首頁資料，請先執行最新 Supabase migration。</p>';
}

function renderPainPointsEditor() {
  document.querySelector('#painPointsEditor').innerHTML = painPoints.map((item, index) => `<article class="editor-card" data-id="${item.id || ''}"><h3>痛點 ${index + 1}</h3><label>短標題<input class="form-control" name="title" value="${escapeAdmin(item.title)}"></label><label>補充說明<textarea class="form-control" name="description">${escapeAdmin(item.description)}</textarea></label><label>排序<input class="form-control" name="sort_order" type="number" value="${item.sort_order ?? index + 1}"></label><label class="form-check"><input class="form-check-input" type="checkbox" name="enabled" ${item.enabled !== false ? 'checked' : ''}> 前台顯示</label></article>`).join('');
}

function renderMethodsEditor() {
  document.querySelector('#methodsEditor').innerHTML = methods.map((item, index) => `<article class="editor-card" data-id="${item.id || ''}"><h3>方法 ${index + 1}</h3><label>標題<input class="form-control" name="title" value="${escapeAdmin(item.title)}"></label><label>說明<textarea class="form-control" name="description">${escapeAdmin(item.description)}</textarea></label>${imageFields(item.image_url)}<label>排序<input class="form-control" name="sort_order" type="number" value="${item.sort_order ?? index + 1}"></label><label class="form-check"><input class="form-check-input" type="checkbox" name="enabled" ${item.enabled !== false ? 'checked' : ''}> 前台顯示</label></article>`).join('');
}

function renderCasesEditor() {
  document.querySelector('#casesEditor').innerHTML = cases.map((item, index) => `<article class="editor-card case-editor" data-id="${item.id || ''}"><h3>案例 ${index + 1}｜${escapeAdmin(item.title || '未命名')}</h3><label>案例標題<input class="form-control" name="title" value="${escapeAdmin(item.title)}"></label><label>網址代稱（英文小寫與連字號）<input class="form-control" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value="${escapeAdmin(item.slug)}"></label><div class="row g-2"><label class="col-6">客戶／專案名稱<input class="form-control" name="client_name" value="${escapeAdmin(item.client_name)}"></label><label class="col-6">案例類型<input class="form-control" name="client_type" value="${escapeAdmin(item.client_type)}" placeholder="例如：自有品牌示範"></label></div>${imageFields(item.cover_image)}${['problem:原本問題','insight:關鍵洞察','strategy:策略處理','execution:執行內容','result:成果','testimonial:見證（沒有就留白）'].map(field => { const [name,label] = field.split(':'); return `<label>${label}<textarea class="form-control" name="${name}">${escapeAdmin(item[name])}</textarea></label>`; }).join('')}<div class="row g-2"><label class="col-6">發布狀態<select class="form-select" name="publish_status"><option value="draft" ${item.publish_status !== 'published' ? 'selected' : ''}>草稿</option><option value="published" ${item.publish_status === 'published' ? 'selected' : ''}>已發布</option></select></label><label class="col-6">排序<input class="form-control" name="sort_order" type="number" value="${item.sort_order ?? index + 1}"></label></div></article>`).join('');
}

function renderServicesEditor() {
  document.querySelector('#servicesEditor').innerHTML = services.map((service, index) => `<article class="editor-card" data-id="${service.id}"><h3>0${index+1}｜${escapeAdmin(service.name)}</h3><label>方案名稱<input class="form-control" name="name" value="${escapeAdmin(service.name)}"></label><label>快速定位<input class="form-control" name="description" value="${escapeAdmin(service.description)}"></label><label>方案說明<textarea class="form-control" name="subtitle">${escapeAdmin(service.subtitle)}</textarea></label><label>適合誰<textarea class="form-control" name="target_customer">${escapeAdmin(service.target_customer)}</textarea></label><label>服務內容（每行一項）<textarea class="form-control items-field" name="items">${escapeAdmin((service.items||[]).join('\n'))}</textarea></label><div class="row g-2"><label class="col-6">原價<input class="form-control" name="regular_price" type="number" value="${service.regular_price||''}"></label><label class="col-6">優惠價<input class="form-control" name="promo_price" type="number" value="${service.promo_price||''}"></label></div><label>時間<input class="form-control" name="duration" value="${escapeAdmin(service.duration)}"></label><label class="form-check"><input class="form-check-input" type="checkbox" name="price_visible" ${service.price_visible?'checked':''}> 顯示價格</label><label class="form-check"><input class="form-check-input" type="checkbox" name="enabled" ${service.enabled?'checked':''}> 前台顯示</label></article>`).join('');
}

function renderFaqsEditor() {
  document.querySelector('#faqsEditor').innerHTML = faqs.map((faq,index) => `<div class="faq-row" data-id="${faq.id}"><strong>${index+1}</strong><input class="form-control" name="question" value="${escapeAdmin(faq.question)}"><textarea class="form-control" name="answer">${escapeAdmin(faq.answer)}</textarea><label class="form-check"><input class="form-check-input" type="checkbox" name="enabled" ${faq.enabled?'checked':''}> 顯示</label></div>`).join('');
}

function renderInquiries() {
  const rows = inquiries.map(item => `<tr><td><strong>${escapeAdmin(item.name)}</strong><br><small>${escapeAdmin(item.email)}</small></td><td>${escapeAdmin(item.social_contact||'—')}</td><td>${escapeAdmin(item.problem_type)}<details><summary>查看內容</summary><p>${escapeAdmin(item.problem_description)}</p></details></td><td>${new Date(item.created_at).toLocaleDateString('zh-TW')}</td><td><select class="form-select status-select" data-inquiry="${item.id}">${Object.entries(statusLabels).map(([value,label])=>`<option value="${value}" ${item.status===value?'selected':''}>${label}</option>`).join('')}</select></td></tr>`).join('');
  document.querySelector('#inquiriesEditor').innerHTML = rows || '<tr><td colspan="5">目前沒有諮詢資料</td></tr>';
  document.querySelector('#recentInquiries').innerHTML = rows ? inquiries.slice(0,5).map(item=>`<tr><td>${escapeAdmin(item.name)}</td><td>${escapeAdmin(item.problem_type)}</td><td>${new Date(item.created_at).toLocaleDateString('zh-TW')}</td><td>${statusLabels[item.status]}</td></tr>`).join('') : '<tr><td colspan="4">目前沒有資料</td></tr>';
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  document.querySelector('#statNew').textContent = inquiries.filter(item => new Date(item.created_at) >= monthStart).length;
  document.querySelector('#statContact').textContent = inquiries.filter(item => item.status === 'new').length;
  document.querySelector('#statDiscovery').textContent = inquiries.filter(item => item.status === 'discovery').length;
  document.querySelector('#statActive').textContent = inquiries.filter(item => item.status === 'active').length;
}

function renderSettings() {
  const form = document.querySelector('#settingsForm');
  Object.entries(settings || {}).forEach(([key,value]) => { if (form.elements[key]) form.elements[key].value = value || ''; });
}

async function loadData() {
  const results = await Promise.all([
    slitSupabase.from('services').select('*').order('sort_order'),
    slitSupabase.from('faqs').select('*').order('sort_order'),
    slitSupabase.from('inquiries').select('*').order('created_at',{ascending:false}),
    slitSupabase.from('site_settings').select('*').limit(1).maybeSingle(),
    slitSupabase.from('homepage_sections').select('*').order('sort_order'),
    slitSupabase.from('pain_points').select('*').order('sort_order'),
    slitSupabase.from('methods').select('*').order('sort_order'),
    slitSupabase.from('cases').select('*').order('sort_order')
  ]);
  services = results[0].data || []; faqs = results[1].data || []; inquiries = results[2].data || []; settings = results[3].data || {};
  homepageSections = results[4].data || []; painPoints = results[5].data || []; methods = results[6].data || []; cases = results[7].data || [];
  renderServicesEditor(); renderFaqsEditor(); renderInquiries(); renderSettings();
  renderHomepageEditor(); renderPainPointsEditor(); renderMethodsEditor(); renderCasesEditor();
}

async function saveRows(table, rows, successMessage, options = {}) {
  const query = options.onConflict ? slitSupabase.from(table).upsert(rows, { onConflict: options.onConflict }) : slitSupabase.from(table).upsert(rows);
  const { error } = await query;
  showAlert(error ? `儲存失敗：${error.message}` : successMessage, Boolean(error));
  if (!error) await loadData();
}

document.querySelector('#adminNav').addEventListener('click', event => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  document.querySelectorAll('.admin-view').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === button.dataset.view));
  document.querySelectorAll('#adminNav button').forEach(item => item.classList.toggle('active', item === button));
  document.querySelector('#viewTitle').textContent = button.textContent;
  document.querySelector('.admin-sidebar').classList.remove('open');
});
document.querySelector('#menuButton').onclick = () => document.querySelector('.admin-sidebar').classList.toggle('open');
document.querySelector('#logoutButton').onclick = async () => { await slitSupabase.auth.signOut(); location.replace('./login.html'); };

document.querySelector('#addPainPoint').onclick = () => { painPoints.push({ title:'', description:'', sort_order:painPoints.length + 1, enabled:true }); renderPainPointsEditor(); };
document.querySelector('#addMethod').onclick = () => { methods.push({ title:'', description:'', image_url:'', sort_order:methods.length + 1, enabled:true }); renderMethodsEditor(); };
document.querySelector('#addCase').onclick = () => { cases.push({ title:'', slug:`case-${Date.now()}`, cover_image:'', client_name:'', client_type:'', problem:'', insight:'', strategy:'', execution:'', result:'', testimonial:'', publish_status:'draft', sort_order:cases.length + 1 }); renderCasesEditor(); };

document.querySelector('#saveHomepage').onclick = () => {
  const rows = [...document.querySelectorAll('#homepageEditor .editor-card')].map(card => withId(card, { section_key:card.dataset.key, title:card.querySelector('[name=title]').value.trim(), content:card.querySelector('[name=content]').value.trim(), image_url:card.querySelector('[name=image_url]').value.trim() || null, cta_text:card.querySelector('[name=cta_text]').value.trim() || null, cta_url:card.querySelector('[name=cta_url]').value.trim() || null, sort_order:Number(card.querySelector('[name=sort_order]').value) || 0, enabled:card.querySelector('[name=enabled]').checked }));
  saveRows('homepage_sections', rows, '首頁區塊已儲存', { onConflict:'section_key' });
};
document.querySelector('#savePainPoints').onclick = () => {
  const rows = [...document.querySelectorAll('#painPointsEditor .editor-card')].map(card => withId(card, { title:card.querySelector('[name=title]').value.trim(), description:card.querySelector('[name=description]').value.trim(), sort_order:Number(card.querySelector('[name=sort_order]').value) || 0, enabled:card.querySelector('[name=enabled]').checked }));
  saveRows('pain_points', rows, '痛點內容已儲存');
};
document.querySelector('#saveMethods').onclick = () => {
  const rows = [...document.querySelectorAll('#methodsEditor .editor-card')].map(card => withId(card, { title:card.querySelector('[name=title]').value.trim(), description:card.querySelector('[name=description]').value.trim(), image_url:card.querySelector('[name=image_url]').value.trim() || null, sort_order:Number(card.querySelector('[name=sort_order]').value) || 0, enabled:card.querySelector('[name=enabled]').checked }));
  saveRows('methods', rows, '方法內容已儲存');
};
document.querySelector('#saveCases').onclick = () => {
  const rows = [...document.querySelectorAll('#casesEditor .editor-card')].map(card => withId(card, { title:card.querySelector('[name=title]').value.trim(), slug:card.querySelector('[name=slug]').value.trim(), cover_image:card.querySelector('[name=image_url]').value.trim() || null, client_name:card.querySelector('[name=client_name]').value.trim() || null, client_type:card.querySelector('[name=client_type]').value.trim() || null, problem:card.querySelector('[name=problem]').value.trim() || null, insight:card.querySelector('[name=insight]').value.trim() || null, strategy:card.querySelector('[name=strategy]').value.trim() || null, execution:card.querySelector('[name=execution]').value.trim() || null, result:card.querySelector('[name=result]').value.trim() || null, testimonial:card.querySelector('[name=testimonial]').value.trim() || null, publish_status:card.querySelector('[name=publish_status]').value, sort_order:Number(card.querySelector('[name=sort_order]').value) || 0 }));
  saveRows('cases', rows, '案例已儲存');
};
document.querySelector('#saveServices').onclick = () => {
  const rows = [...document.querySelectorAll('#servicesEditor .editor-card')].map(card => ({ id:Number(card.dataset.id), name:card.querySelector('[name=name]').value, description:card.querySelector('[name=description]').value, subtitle:card.querySelector('[name=subtitle]').value, target_customer:card.querySelector('[name=target_customer]').value, items:card.querySelector('[name=items]').value.split('\n').map(item=>item.trim()).filter(Boolean), regular_price:Number(card.querySelector('[name=regular_price]').value)||null, promo_price:Number(card.querySelector('[name=promo_price]').value)||null, duration:card.querySelector('[name=duration]').value, price_visible:card.querySelector('[name=price_visible]').checked, enabled:card.querySelector('[name=enabled]').checked }));
  saveRows('services', rows, '服務方案已儲存');
};
document.querySelector('#saveFaqs').onclick = () => {
  const rows = [...document.querySelectorAll('.faq-row')].map(row => ({ id:Number(row.dataset.id), question:row.querySelector('[name=question]').value, answer:row.querySelector('[name=answer]').value, enabled:row.querySelector('[name=enabled]').checked }));
  saveRows('faqs', rows, 'FAQ 已儲存');
};
document.querySelector('#saveSettings').onclick = async () => {
  const values = Object.fromEntries(new FormData(document.querySelector('#settingsForm')));
  const { error } = await slitSupabase.from('site_settings').update(values).eq('id',settings.id);
  showAlert(error ? `儲存失敗：${error.message}` : '網站設定已儲存', Boolean(error));
};

document.querySelector('#inquiriesEditor').addEventListener('change', async event => {
  if (!event.target.matches('[data-inquiry]')) return;
  const { error } = await slitSupabase.from('inquiries').update({ status:event.target.value }).eq('id',event.target.dataset.inquiry);
  showAlert(error ? '狀態更新失敗' : '狀態已更新', Boolean(error));
});

document.querySelector('.admin-main').addEventListener('change', async event => {
  const input = event.target.closest('.image-upload');
  if (!input?.files?.[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { showAlert('圖片不可超過 5 MB', true); input.value = ''; return; }
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeBase = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
  const path = `cms/${Date.now()}-${safeBase}.${extension}`;
  input.disabled = true;
  showAlert('圖片上傳中…');
  const { error } = await slitSupabase.storage.from('site-images').upload(path, file, { cacheControl:'31536000', upsert:false, contentType:file.type });
  if (error) {
    showAlert(`圖片上傳失敗：${error.message}`, true);
  } else {
    const { data } = slitSupabase.storage.from('site-images').getPublicUrl(path);
    input.closest('.editor-card').querySelector('.image-url').value = data.publicUrl;
    showAlert('圖片已上傳，請再按儲存套用');
  }
  input.disabled = false;
});

(async () => { if (await requireAdmin()) await loadData(); })();
