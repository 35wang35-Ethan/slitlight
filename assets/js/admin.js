(() => {
  const categories = ['choice', 'second-look', 'frame'];
  const originalAdminIds = new Set(['bae94b1b-c832-425b-bd0b-8240718c654f']);
  const statusLabels = { new: '新詢問', contacted: '已聯絡', discovery: '初談完成', quoted: '已報價', active: '合作中', completed: '完成', declined: '未合作' };
  const state = {
    user: null,
    selected: [],
    originalCaseIds: new Set(),
    copy: {},
    copyRowId: null,
    inquiries: [],
    selectedDirty: false,
    copyDirty: false
  };

  const authView = document.querySelector('#auth-view');
  const authForm = document.querySelector('#auth-form');
  const forgotPasswordButton = document.querySelector('#forgot-password-button');
  const recoveryRequestForm = document.querySelector('#recovery-request-form');
  const recoveryUpdateForm = document.querySelector('#recovery-update-form');
  const studioView = document.querySelector('#studio-view');
  const loadingState = document.querySelector('#loading-state');
  const selectedEditors = document.querySelector('#selected-editors');
  const copyForm = document.querySelector('#copy-form');
  const toast = document.querySelector('#toast');

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function setMessage(selector, message, isError = false) {
    const node = document.querySelector(selector);
    node.textContent = message;
    node.classList.toggle('is-error', isError);
    node.classList.toggle('is-success', Boolean(message) && !isError);
  }

  function showAuthMode(mode) {
    authForm.hidden = mode !== 'login';
    forgotPasswordButton.hidden = mode !== 'login';
    recoveryRequestForm.hidden = mode !== 'request';
    recoveryUpdateForm.hidden = mode !== 'update';
    setMessage('#auth-error', '');
    setMessage('#recovery-request-message', '');
    setMessage('#recovery-update-message', '');
    if (mode === 'request') {
      recoveryRequestForm.email.value = authForm.email.value.trim();
      recoveryRequestForm.email.focus();
    }
    if (mode === 'update') recoveryUpdateForm.password.focus();
  }

  function normalizeText(value) {
    return String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
  }

  function readCmsField(documentNode, field, preserveBreaks = false) {
    const node = documentNode.querySelector(`[data-cms-field="${field}"]`);
    if (!node) throw new Error(`首頁缺少可編輯欄位：${field}`);
    if (!preserveBreaks) return normalizeText(node.textContent);
    const clone = node.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return clone.textContent.replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim();
  }

  function extractCopy(html) {
    const documentNode = new DOMParser().parseFromString(html, 'text/html');
    return {
      heroLabel: readCmsField(documentNode, 'heroLabel'),
      heroTitle: readCmsField(documentNode, 'heroTitle'),
      heroNote: readCmsField(documentNode, 'heroNote'),
      heroStatement: readCmsField(documentNode, 'heroStatement'),
      aboutTitle: readCmsField(documentNode, 'aboutTitle'),
      aboutBody: readCmsField(documentNode, 'aboutBody'),
      aboutName: readCmsField(documentNode, 'aboutName'),
      aboutRole: readCmsField(documentNode, 'aboutRole'),
      collaborationTitle: readCmsField(documentNode, 'collaborationTitle'),
      collaborationBody: readCmsField(documentNode, 'collaborationBody', true),
      collaborationScope: readCmsField(documentNode, 'collaborationScope'),
      collaborationCta: readCmsField(documentNode, 'collaborationCta')
    };
  }

  function element(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== '') node.textContent = text;
    return node;
  }

  function inputControl(name, value = '', options = {}) {
    const control = document.createElement(options.tag || 'input');
    control.name = name;
    if (options.type) control.type = options.type;
    if (options.rows) control.rows = options.rows;
    if (options.min !== undefined) control.min = options.min;
    if (options.max !== undefined) control.max = options.max;
    if (options.placeholder) control.placeholder = options.placeholder;
    control.value = value ?? '';
    return control;
  }

  function labelled(labelText, control) {
    const label = document.createElement('label');
    label.append(element('span', '', labelText), control);
    return label;
  }

  function selectControl(name, value, choices) {
    const select = document.createElement('select');
    select.name = name;
    choices.forEach(([optionValue, label]) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = label;
      option.selected = optionValue === value;
      select.append(option);
    });
    return select;
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
      sourceNote: metadata.sourceNote || '',
      externalUrl: metadata.externalUrl || '',
      instagramUrl: metadata.instagramUrl || '',
      internalSlug: metadata.internalSlug || ''
    };
  }

  function takeToCase(item) {
    const row = {
      title: item.title,
      slug: item.slug,
      cover_image: item.cover,
      client_name: item.workTitle || null,
      client_type: item.category,
      insight: item.description,
      execution: JSON.stringify({
        coverAlt: item.coverAlt,
        coverWidth: item.coverWidth,
        coverHeight: item.coverHeight,
        year: item.year,
        director: item.director || '',
        creator: item.creator || '',
        sourceNote: item.sourceNote || '',
        externalUrl: item.externalUrl || '',
        instagramUrl: item.instagramUrl || '',
        internalSlug: item.internalSlug || ''
      }),
      publish_status: item.selected ? 'published' : 'draft',
      sort_order: item.order
    };
    if (item.id) row.id = item.id;
    return row;
  }

  function previewPath(path) {
    const value = String(path || '').trim();
    return /^https?:\/\//i.test(value) ? value : `../${value.replace(/^\/+/, '')}`;
  }

  function renderSelected() {
    selectedEditors.replaceChildren();
    state.selected.forEach((item, index) => {
      const article = element('article', 'take-editor');
      article.dataset.index = index;
      const preview = element('div', 'take-preview');
      preview.append(element('span', 'take-number', `0${index + 1} / ${String(item.category || '').toUpperCase()}`));
      const image = document.createElement('img');
      image.src = previewPath(item.cover);
      image.alt = item.coverAlt || '';
      image.width = Number(item.coverWidth) || 1200;
      image.height = Number(item.coverHeight) || 900;
      image.loading = 'lazy';
      preview.append(image);

      const fields = element('div', 'take-fields');
      const firstRow = element('div', 'field-row');
      firstRow.append(
        labelled('Category', selectControl('category', item.category, [['choice', 'CHOICE'], ['second-look', 'SECOND LOOK'], ['frame', 'FRAME']])),
        labelled('Order', inputControl('order', item.order, { type: 'number', min: 1, max: 99 }))
      );
      fields.append(
        firstRow,
        labelled('Slug', inputControl('slug', item.slug, { placeholder: 'lowercase-with-hyphens' })),
        labelled('Title', inputControl('title', item.title)),
        labelled('Short note', inputControl('description', item.description, { tag: 'textarea', rows: 3 })),
        labelled('Cover path／URL', inputControl('cover', item.cover, { placeholder: 'assets/images/example.jpg 或 https://…' })),
        labelled('Cover alt', inputControl('coverAlt', item.coverAlt))
      );
      const sizeRow = element('div', 'field-row');
      sizeRow.append(
        labelled('Cover width', inputControl('coverWidth', item.coverWidth, { type: 'number', min: 1 })),
        labelled('Cover height', inputControl('coverHeight', item.coverHeight, { type: 'number', min: 1 }))
      );
      const workRow = element('div', 'field-row');
      workRow.append(
        labelled('Work title（選填）', inputControl('workTitle', item.workTitle)),
        labelled('Year（選填）', inputControl('year', item.year, { type: 'number', min: 1800, max: 2200 }))
      );
      fields.append(sizeRow, workRow);
      fields.append(
        labelled('Instagram URL（選填）', inputControl('instagramUrl', item.instagramUrl, { type: 'url' })),
        labelled('External URL（選填）', inputControl('externalUrl', item.externalUrl, { type: 'url' })),
        labelled('Internal slug（選填）', inputControl('internalSlug', item.internalSlug))
      );
      const toolbar = element('div', 'take-toolbar');
      const selectedLabel = element('label', 'toggle-label');
      const checkbox = inputControl('selected', '', { type: 'checkbox' });
      checkbox.checked = item.selected === true;
      selectedLabel.append(checkbox, element('span', '', '顯示在首頁'));
      const removeButton = element('button', 'remove-take-button', '移除');
      removeButton.type = 'button';
      removeButton.dataset.removeTake = index;
      toolbar.append(selectedLabel, removeButton);
      fields.append(toolbar);
      article.append(preview, fields);
      selectedEditors.append(article);
    });
    document.querySelector('#add-take-button').disabled = state.selected.length >= 5;
  }

  function fillCopyForm() {
    Object.entries(state.copy).forEach(([name, value]) => {
      if (copyForm.elements[name]) copyForm.elements[name].value = value;
    });
  }

  function collectSelected() {
    return [...selectedEditors.querySelectorAll('.take-editor')].map((card, index) => {
      const original = state.selected[index] || {};
      const value = name => card.querySelector(`[name="${name}"]`).value.trim();
      return {
        ...original,
        slug: value('slug'),
        category: value('category'),
        title: value('title'),
        description: value('description'),
        cover: value('cover'),
        coverAlt: value('coverAlt'),
        coverWidth: Number(value('coverWidth')),
        coverHeight: Number(value('coverHeight')),
        selected: card.querySelector('[name="selected"]').checked,
        order: Number(value('order')),
        workTitle: value('workTitle'),
        year: value('year') ? Number(value('year')) : null,
        externalUrl: value('externalUrl'),
        instagramUrl: value('instagramUrl'),
        internalSlug: value('internalSlug')
      };
    });
  }

  function collectCopy() {
    return Object.fromEntries(new FormData(copyForm).entries());
  }

  function validateSelected(items) {
    if (items.length < 3 || items.length > 5) throw new Error('Selected 必須維持 3–5 筆。');
    const selectedCount = items.filter(item => item.selected).length;
    if (selectedCount < 3 || selectedCount > 5) throw new Error('首頁必須勾選 3–5 筆 Selected。');
    const orders = new Set();
    const slugs = new Set();
    items.forEach((item, index) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) throw new Error(`第 ${index + 1} 筆 slug 格式不正確。`);
      if (slugs.has(item.slug)) throw new Error(`Slug 重複：${item.slug}`);
      slugs.add(item.slug);
      if (!categories.includes(item.category)) throw new Error(`第 ${index + 1} 筆 category 不正確。`);
      if (!item.title || !item.description || !item.cover || !item.coverAlt) throw new Error(`第 ${index + 1} 筆需要標題、摘要、Cover 與 Cover Alt。`);
      const localCover = /^assets\/images\/[a-z0-9-]+\.jpg$/.test(item.cover);
      const remoteCover = /^https:\/\/ptruiafyvqhyeodvkiub\.supabase\.co\/storage\/v1\/object\/public\/site-images\//.test(item.cover);
      if (!localCover && !remoteCover) throw new Error(`第 ${index + 1} 筆 Cover 必須使用網站圖片路徑或後台上傳網址。`);
      if (!Number.isInteger(item.order) || item.order < 1 || orders.has(item.order)) throw new Error(`第 ${index + 1} 筆 order 必須是唯一正整數。`);
      orders.add(item.order);
      if (!Number.isInteger(item.coverWidth) || item.coverWidth < 1 || !Number.isInteger(item.coverHeight) || item.coverHeight < 1) throw new Error(`第 ${index + 1} 筆圖片尺寸不正確。`);
    });
  }

  function validateCopy(copy) {
    const required = ['heroLabel', 'heroTitle', 'heroNote', 'heroStatement', 'aboutTitle', 'aboutBody', 'aboutName', 'aboutRole', 'collaborationTitle', 'collaborationBody', 'collaborationScope', 'collaborationCta'];
    required.forEach(field => { if (!String(copy[field] || '').trim()) throw new Error(`網站文字欄位不可留白：${field}`); });
  }

  function renderInquiries() {
    const body = document.querySelector('#inquiries-table');
    body.replaceChildren();
    if (!state.inquiries.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = '目前沒有詢問資料。';
      row.append(cell);
      body.append(row);
    }
    state.inquiries.forEach(item => {
      const row = document.createElement('tr');
      const contact = document.createElement('td');
      contact.append(element('strong', '', item.name || '未命名'), document.createElement('br'), element('small', '', item.email || item.social_contact || '—'));
      const detailCell = document.createElement('td');
      detailCell.append(element('span', '', item.problem_type || '未分類'));
      const details = document.createElement('details');
      details.append(element('summary', '', '查看內容'), element('p', '', item.problem_description || '—'));
      detailCell.append(details);
      const date = document.createElement('td');
      date.textContent = item.created_at ? new Date(item.created_at).toLocaleDateString('zh-TW') : '—';
      const statusCell = document.createElement('td');
      const select = selectControl('inquiry-status', item.status, Object.entries(statusLabels));
      select.dataset.inquiry = item.id;
      statusCell.append(select);
      row.append(contact, detailCell, date, statusCell);
      body.append(row);
    });
  }

  function updateStats() {
    document.querySelector('#stat-selected').textContent = state.selected.filter(item => item.selected).length;
    document.querySelector('#stat-inquiries').textContent = state.inquiries.filter(item => item.status === 'new').length;
    document.querySelector('#stat-pending').textContent = Number(state.selectedDirty) + Number(state.copyDirty);
    const summary = document.querySelector('#change-summary');
    summary.replaceChildren();
    const changes = [];
    if (state.selectedDirty) changes.push('Selected Takes');
    if (state.copyDirty) changes.push('Hero／About／Collaborate 文字');
    if (!changes.length) changes.push('目前沒有尚未儲存的變更。');
    changes.forEach(change => summary.append(element('li', '', change)));
  }

  function markDirty(kind) {
    if (kind === 'selected') state.selectedDirty = true;
    if (kind === 'copy') state.copyDirty = true;
    updateStats();
  }

  function showPanel(name) {
    document.querySelectorAll('[data-panel]').forEach(panel => panel.classList.toggle('is-active', panel.dataset.panel === name));
    document.querySelectorAll('[data-panel-target]').forEach(button => button.classList.toggle('is-active', button.dataset.panelTarget === name));
    document.querySelector('.studio-sidebar').classList.remove('is-open');
    document.querySelector('#menu-button').setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function loadSameOriginText(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.setRequestHeader('Accept', 'text/html,application/json');
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) resolve(request.responseText);
        else reject(new Error(`備援內容回應 ${request.status}`));
      };
      request.onerror = () => reject(new Error('無法讀取網站備援內容。'));
      request.send();
    });
  }

  async function loadData() {
    const staticSelectedUrl = new URL('../assets/data/selected.json', document.baseURI).href;
    const indexUrl = new URL('../index.html', document.baseURI).href;
    const [staticSelectedText, indexHtml, cmsCases, copyRows, inquiries] = await Promise.all([
      loadSameOriginText(staticSelectedUrl),
      loadSameOriginText(indexUrl),
      window.slitData.rest.select('cases', 'select=id,title,slug,cover_image,client_name,client_type,insight,execution,publish_status,sort_order&client_type=in.(choice,second-look,frame)&order=sort_order.asc', { auth: true }),
      window.slitData.rest.select('homepage_sections', 'select=id,content&section_key=eq.editorial_copy&limit=1', { auth: true }),
      window.slitData.rest.select('inquiries', 'select=id,name,email,social_contact,problem_type,problem_description,status,created_at&order=created_at.desc', { auth: true })
    ]);
    const staticSelected = JSON.parse(staticSelectedText);
    state.selected = cmsCases.length >= 3 ? cmsCases.map(caseToTake) : staticSelected;
    state.originalCaseIds = new Set(cmsCases.map(item => item.id));
    state.copyRowId = copyRows[0]?.id || null;
    try {
      state.copy = copyRows[0]?.content ? JSON.parse(copyRows[0].content) : extractCopy(indexHtml);
    } catch {
      state.copy = extractCopy(indexHtml);
    }
    state.inquiries = inquiries || [];
    state.selectedDirty = false;
    state.copyDirty = false;
    renderSelected();
    fillCopyForm();
    renderInquiries();
    updateStats();
  }

  async function requireAdmin() {
    const user = await window.slitData.auth.getUser();
    let isAdmin = originalAdminIds.has(user.id);
    if (!isAdmin) {
      const rows = await window.slitData.rest.select('admins', `select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { auth: true });
      isAdmin = rows.length > 0;
    }
    if (!isAdmin) {
      await window.slitData.auth.signOut();
      throw new Error('這個帳號沒有後台管理權限。');
    }
    state.user = user;
    document.querySelector('#admin-user').textContent = user.email || '管理員';
    authView.hidden = true;
    studioView.hidden = false;
    document.querySelector('.skip-link').href = '#studio-main';
    loadingState.hidden = false;
    try {
      await loadData();
    } catch (error) {
      loadingState.hidden = false;
      loadingState.textContent = `登入成功，但內容載入失敗：${error.message}`;
      showToast('已登入；部分內容暫時無法載入');
      return;
    } finally {
      if (!loadingState.textContent.startsWith('登入成功')) loadingState.hidden = true;
    }
  }

  async function saveSelected(items) {
    const currentIds = new Set(items.filter(item => item.id).map(item => item.id));
    const removedIds = [...state.originalCaseIds].filter(id => !currentIds.has(id));
    if (removedIds.length) await window.slitData.rest.update('cases', { publish_status: 'draft' }, `id=in.(${removedIds.join(',')})`);
    const rows = items.map(takeToCase);
    const existing = rows.filter(row => row.id);
    const fresh = rows.filter(row => !row.id);
    if (existing.length) await window.slitData.rest.upsert('cases', existing);
    if (fresh.length) await window.slitData.rest.upsert('cases', fresh, { onConflict: 'slug' });
  }

  async function saveCopy(copy) {
    const row = { section_key: 'editorial_copy', title: 'slit.light editorial site copy', content: JSON.stringify(copy), sort_order: 100, enabled: true };
    if (state.copyRowId) row.id = state.copyRowId;
    await window.slitData.rest.upsert('homepage_sections', [row], { onConflict: 'section_key' });
  }

  async function saveChanges() {
    const button = document.querySelector('#save-button');
    if (!state.selectedDirty && !state.copyDirty) {
      setMessage('#save-status', '目前沒有需要儲存的變更。');
      return;
    }
    try {
      button.disabled = true;
      setMessage('#save-status', '正在檢查並儲存…');
      if (state.selectedDirty) {
        const items = collectSelected().sort((a, b) => Number(a.order) - Number(b.order));
        validateSelected(items);
        await saveSelected(items);
      }
      if (state.copyDirty) {
        const copy = collectCopy();
        validateCopy(copy);
        await saveCopy(copy);
      }
      await loadData();
      setMessage('#save-status', '已儲存。公開網站重新整理後即可看到。');
      showToast('內容已同步到 Supabase');
    } catch (error) {
      setMessage('#save-status', `儲存失敗：${error.message}`, true);
    } finally {
      button.disabled = false;
    }
  }

  authForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    setMessage('#auth-error', '');
    button.disabled = true;
    button.textContent = '登入中…';
    try {
      await window.slitData.auth.signIn(event.currentTarget.email.value.trim(), event.currentTarget.password.value);
      event.currentTarget.password.value = '';
      await requireAdmin();
    } catch (error) {
      if (error.message.includes('管理權限')) await window.slitData.auth.signOut();
      const message = error.message.includes('Invalid login credentials')
        ? '登入失敗，請確認 Email 與密碼。'
        : error.message;
      setMessage('#auth-error', message, true);
    } finally {
      button.disabled = false;
      button.textContent = '登入';
    }
  });

  forgotPasswordButton.addEventListener('click', () => showAuthMode('request'));
  document.querySelectorAll('[data-auth-mode="login"]').forEach(button => {
    button.addEventListener('click', () => showAuthMode('login'));
  });

  recoveryRequestForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const email = event.currentTarget.email.value.trim();
    try {
      button.disabled = true;
      button.textContent = '寄送中…';
      setMessage('#recovery-request-message', '');
      await window.slitData.auth.requestPasswordRecovery(email, new URL('./', window.location.href).href);
      setMessage('#recovery-request-message', '已寄出。請從信件返回這個後台，連結有效時間依 Supabase 設定為準。');
    } catch (error) {
      setMessage('#recovery-request-message', `寄送失敗：${error.message}`, true);
    } finally {
      button.disabled = false;
      button.textContent = '寄出密碼重設信';
    }
  });

  recoveryUpdateForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    const password = event.currentTarget.password.value;
    const confirmation = event.currentTarget.confirmation.value;
    if (password.length < 12) return setMessage('#recovery-update-message', '新密碼至少需要 12 個字元。', true);
    if (password !== confirmation) return setMessage('#recovery-update-message', '兩次輸入的密碼不一致。', true);
    try {
      button.disabled = true;
      button.textContent = '更新中…';
      setMessage('#recovery-update-message', '');
      await window.slitData.auth.updatePassword(password);
      event.currentTarget.reset();
      await requireAdmin();
      showToast('原管理員帳號密碼已更新');
    } catch (error) {
      setMessage('#recovery-update-message', `更新失敗：${error.message}`, true);
    } finally {
      button.disabled = false;
      button.textContent = '更新原帳號密碼';
    }
  });

  document.querySelector('#studio-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-panel-target]');
    if (button) showPanel(button.dataset.panelTarget);
  });
  document.querySelectorAll('[data-save-shortcut]').forEach(button => button.addEventListener('click', () => showPanel('save')));
  document.querySelector('#menu-button').addEventListener('click', event => {
    const open = document.querySelector('.studio-sidebar').classList.toggle('is-open');
    event.currentTarget.setAttribute('aria-expanded', String(open));
  });
  document.querySelector('#logout-button').addEventListener('click', async () => {
    await window.slitData.auth.signOut();
    window.location.reload();
  });

  selectedEditors.addEventListener('input', event => {
    if (event.target.name === 'cover') event.target.closest('.take-editor').querySelector('img').src = previewPath(event.target.value);
    markDirty('selected');
  });
  selectedEditors.addEventListener('change', () => markDirty('selected'));
  selectedEditors.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-take]');
    if (!button) return;
    if (state.selected.length <= 3) return showToast('Selected 至少保留 3 筆');
    state.selected.splice(Number(button.dataset.removeTake), 1);
    renderSelected();
    markDirty('selected');
  });
  document.querySelector('#add-take-button').addEventListener('click', () => {
    if (state.selected.length >= 5) return;
    const nextOrder = Math.max(0, ...state.selected.map(item => Number(item.order) || 0)) + 1;
    state.selected.push({ slug: `new-take-${nextOrder}`, category: 'choice', title: '', description: '', cover: 'assets/images/selected-choice.jpg', coverAlt: '', coverWidth: 1916, coverHeight: 821, selected: true, order: nextOrder, workTitle: '', year: null, director: '', creator: '', sourceNote: '', externalUrl: '', instagramUrl: '', internalSlug: '' });
    renderSelected();
    markDirty('selected');
  });
  copyForm.addEventListener('input', () => markDirty('copy'));
  document.querySelector('#save-button').addEventListener('click', saveChanges);

  document.querySelector('#inquiries-table').addEventListener('change', async event => {
    const select = event.target.closest('[data-inquiry]');
    if (!select) return;
    try {
      await window.slitData.rest.update('inquiries', { status: select.value }, `id=eq.${encodeURIComponent(select.dataset.inquiry)}`);
      const item = state.inquiries.find(row => row.id === select.dataset.inquiry);
      if (item) item.status = select.value;
      updateStats();
      showToast('詢問狀態已更新');
    } catch (error) {
      showToast(`狀態更新失敗：${error.message}`);
    }
  });

  document.querySelector('#media-upload-button').addEventListener('click', async () => {
    const input = document.querySelector('#media-file');
    const file = input.files?.[0];
    if (!file) return setMessage('#media-status', '請先選擇圖片。', true);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setMessage('#media-status', '只接受 JPG、PNG 或 WebP。', true);
    if (file.size > 5 * 1024 * 1024) return setMessage('#media-status', '圖片不可超過 5 MB。', true);
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const safeBase = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
    const path = `cms/${Date.now()}-${safeBase}.${extension}`;
    const button = document.querySelector('#media-upload-button');
    try {
      button.disabled = true;
      setMessage('#media-status', '圖片上傳中…');
      await window.slitData.storage.uploadImage(path, file);
      const url = window.slitData.storage.publicImageUrl(path);
      document.querySelector('#media-url').value = url;
      setMessage('#media-status', '上傳完成。');
    } catch (error) {
      setMessage('#media-status', `上傳失敗：${error.message}`, true);
    } finally {
      button.disabled = false;
    }
  });
  document.querySelector('#copy-media-url').addEventListener('click', async () => {
    const value = document.querySelector('#media-url').value;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    showToast('圖片網址已複製');
  });

  (async () => {
    if (!window.slitData) return setMessage('#auth-error', '後台連線元件載入失敗，請重新整理。', true);
    if (window.slitData.auth.isRecovery()) {
      showAuthMode('update');
      return;
    }
    const current = await window.slitData.auth.getSession();
    if (!current) return;
    try {
      await requireAdmin();
    } catch {
      await window.slitData.auth.signOut();
      setMessage('#auth-error', '登入狀態已失效，請重新登入。', true);
    }
  })();
})();
