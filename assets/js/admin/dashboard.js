const statusLabels = { new:'新諮詢', contacted:'已聯絡', discovery:'初談完成', quoted:'已報價', active:'合作中', completed:'完成', declined:'未合作' };
let services = [], faqs = [], inquiries = [], settings = {};

function showAlert(message) {
  const alert = document.querySelector('#adminAlert');
  alert.textContent = message; alert.classList.add('show');
  setTimeout(() => alert.classList.remove('show'), 2500);
}

function escapeAdmin(value = '') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

async function requireAdmin() {
  const { data: { user } } = await slitSupabase.auth.getUser();
  if (!user) { location.replace('./login.html'); return null; }
  const { data } = await slitSupabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) { await slitSupabase.auth.signOut(); location.replace('./login.html'); return null; }
  document.querySelector('#adminEmail').textContent = user.email;
  return user;
}

function renderServicesEditor() {
  document.querySelector('#servicesEditor').innerHTML = services.map((s, i) => `<article class="editor-card" data-id="${s.id}"><h3>0${i+1}｜${escapeAdmin(s.name)}</h3><label>方案名稱<input class="form-control" name="name" value="${escapeAdmin(s.name)}"></label><label>快速定位<input class="form-control" name="description" value="${escapeAdmin(s.description)}"></label><label>適合誰<textarea class="form-control" name="target_customer">${escapeAdmin(s.target_customer)}</textarea></label><label>服務內容（每行一項）<textarea class="form-control items-field" name="items">${escapeAdmin((s.items||[]).join('\n'))}</textarea></label><div class="row g-2"><label class="col-6">原價<input class="form-control" name="regular_price" type="number" value="${s.regular_price||''}"></label><label class="col-6">優惠價<input class="form-control" name="promo_price" type="number" value="${s.promo_price||''}"></label></div><label>時間<input class="form-control" name="duration" value="${escapeAdmin(s.duration)}"></label><div class="form-check"><input class="form-check-input" type="checkbox" name="price_visible" ${s.price_visible?'checked':''}><label class="form-check-label">顯示價格</label></div><div class="form-check"><input class="form-check-input" type="checkbox" name="enabled" ${s.enabled?'checked':''}><label class="form-check-label">前台顯示</label></div></article>`).join('');
}

function renderFaqsEditor() {
  document.querySelector('#faqsEditor').innerHTML = faqs.map((f,i) => `<div class="faq-row" data-id="${f.id}"><strong>${i+1}</strong><input class="form-control" name="question" value="${escapeAdmin(f.question)}"><textarea class="form-control" name="answer">${escapeAdmin(f.answer)}</textarea><label class="form-check"><input class="form-check-input" type="checkbox" name="enabled" ${f.enabled?'checked':''}> 顯示</label></div>`).join('');
}

function renderInquiries() {
  const rows = inquiries.map(item => `<tr><td><strong>${escapeAdmin(item.name)}</strong><br><small>${escapeAdmin(item.email)}</small></td><td>${escapeAdmin(item.social_contact||'—')}</td><td>${escapeAdmin(item.problem_type)}<details><summary>查看內容</summary><p>${escapeAdmin(item.problem_description)}</p></details></td><td>${new Date(item.created_at).toLocaleDateString('zh-TW')}</td><td><select class="form-select status-select" data-inquiry="${item.id}">${Object.entries(statusLabels).map(([value,label])=>`<option value="${value}" ${item.status===value?'selected':''}>${label}</option>`).join('')}</select></td></tr>`).join('');
  document.querySelector('#inquiriesEditor').innerHTML = rows || '<tr><td colspan="5">目前沒有諮詢資料</td></tr>';
  document.querySelector('#recentInquiries').innerHTML = rows ? inquiries.slice(0,5).map(item=>`<tr><td>${escapeAdmin(item.name)}</td><td>${escapeAdmin(item.problem_type)}</td><td>${new Date(item.created_at).toLocaleDateString('zh-TW')}</td><td>${statusLabels[item.status]}</td></tr>`).join('') : '<tr><td colspan="4">目前沒有資料</td></tr>';
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  document.querySelector('#statNew').textContent = inquiries.filter(i=>new Date(i.created_at)>=monthStart).length;
  document.querySelector('#statContact').textContent = inquiries.filter(i=>i.status==='new').length;
  document.querySelector('#statDiscovery').textContent = inquiries.filter(i=>i.status==='discovery').length;
  document.querySelector('#statActive').textContent = inquiries.filter(i=>i.status==='active').length;
}

function renderSettings() { const form=document.querySelector('#settingsForm'); Object.entries(settings||{}).forEach(([key,value])=>{if(form.elements[key]) form.elements[key].value=value||''}); }

async function loadData() {
  const results = await Promise.all([
    slitSupabase.from('services').select('*').order('sort_order'), slitSupabase.from('faqs').select('*').order('sort_order'),
    slitSupabase.from('inquiries').select('*').order('created_at',{ascending:false}), slitSupabase.from('site_settings').select('*').limit(1).maybeSingle()
  ]);
  services=results[0].data||[]; faqs=results[1].data||[]; inquiries=results[2].data||[]; settings=results[3].data||{};
  renderServicesEditor(); renderFaqsEditor(); renderInquiries(); renderSettings();
}

document.querySelector('#adminNav').addEventListener('click', event => { const button=event.target.closest('[data-view]'); if(!button)return; document.querySelectorAll('.admin-view').forEach(p=>p.classList.toggle('active',p.dataset.panel===button.dataset.view)); document.querySelectorAll('#adminNav button').forEach(b=>b.classList.toggle('active',b===button)); document.querySelector('#viewTitle').textContent=button.textContent; document.querySelector('.admin-sidebar').classList.remove('open'); });
document.querySelector('#menuButton').onclick=()=>document.querySelector('.admin-sidebar').classList.toggle('open');
document.querySelector('#logoutButton').onclick=async()=>{await slitSupabase.auth.signOut();location.replace('./login.html')};

document.querySelector('#saveServices').onclick=async()=>{const updates=[...document.querySelectorAll('#servicesEditor .editor-card')].map(card=>({id:Number(card.dataset.id),name:card.elements?.name?.value||card.querySelector('[name=name]').value,description:card.querySelector('[name=description]').value,target_customer:card.querySelector('[name=target_customer]').value,items:card.querySelector('[name=items]').value.split('\n').map(x=>x.trim()).filter(Boolean),regular_price:Number(card.querySelector('[name=regular_price]').value)||null,promo_price:Number(card.querySelector('[name=promo_price]').value)||null,duration:card.querySelector('[name=duration]').value,price_visible:card.querySelector('[name=price_visible]').checked,enabled:card.querySelector('[name=enabled]').checked}));const {error}=await slitSupabase.from('services').upsert(updates);showAlert(error?'儲存失敗':'服務方案已儲存')};
document.querySelector('#saveFaqs').onclick=async()=>{const updates=[...document.querySelectorAll('.faq-row')].map(row=>({id:Number(row.dataset.id),question:row.querySelector('[name=question]').value,answer:row.querySelector('[name=answer]').value,enabled:row.querySelector('[name=enabled]').checked}));const {error}=await slitSupabase.from('faqs').upsert(updates);showAlert(error?'儲存失敗':'FAQ 已儲存')};
document.querySelector('#saveSettings').onclick=async()=>{const values=Object.fromEntries(new FormData(document.querySelector('#settingsForm')));const {error}=await slitSupabase.from('site_settings').update(values).eq('id',settings.id);showAlert(error?'儲存失敗':'網站設定已儲存')};
document.querySelector('#inquiriesEditor').addEventListener('change',async event=>{if(!event.target.matches('[data-inquiry]'))return;const {error}=await slitSupabase.from('inquiries').update({status:event.target.value}).eq('id',event.target.dataset.inquiry);showAlert(error?'狀態更新失敗':'狀態已更新')});

(async()=>{if(await requireAdmin())await loadData()})();
