(() => {
  const originalAdminIds = new Set(['bae94b1b-c832-425b-bd0b-8240718c654f']);
  const statusLabels = { new: '新詢問', contacted: '已聯絡', discovery: '初談完成', quoted: '已報價', active: '合作中', completed: '完成', declined: '未合作' };
  const state = { user: null, inquiries: [] };

  const authView = document.querySelector('#auth-view');
  const authForm = document.querySelector('#auth-form');
  const forgotPasswordButton = document.querySelector('#forgot-password-button');
  const recoveryRequestForm = document.querySelector('#recovery-request-form');
  const recoveryUpdateForm = document.querySelector('#recovery-update-form');
  const studioView = document.querySelector('#studio-view');
  const loadingState = document.querySelector('#loading-state');
  const toast = document.querySelector('#toast');
  const deleteInquiryDialog = document.querySelector('#delete-inquiry-dialog');
  const confirmDeleteInquiryButton = document.querySelector('#confirm-delete-inquiry');
  let pendingDeleteInquiryId = null;

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

  function element(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== '') node.textContent = text;
    return node;
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

  function renderInquiries() {
    const body = document.querySelector('#inquiries-table');
    body.replaceChildren();
    if (!state.inquiries.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 11;
      cell.textContent = '目前沒有詢問資料。';
      row.append(cell);
      body.append(row);
    }
    state.inquiries.forEach(item => {
      const row = document.createElement('tr');
      const date = document.createElement('td');
      date.textContent = item.created_at ? new Date(item.created_at).toLocaleString('zh-TW', { hour12: false }) : '—';
      const name = element('td', '', item.name || '—');
      const brand = element('td', '', item.brand || '—');
      const website = element('td', '', item.website_or_social || item.website || item.instagram || '—');
      const caseSummary = element('td', '', item.case_summary || item.problem_description || '—');
      const problem = element('td', '', item.problem || item.problem_type || '—');
      const email = element('td', '', item.email || '—');
      const contact = element('td', '', item.contact || item.social_contact || '—');
      const source = element('td', '', item.source || '—');
      const statusCell = document.createElement('td');
      const select = selectControl('inquiry-status', item.status, Object.entries(statusLabels));
      select.dataset.inquiry = item.id;
      statusCell.append(select);
      const actionsCell = document.createElement('td');
      actionsCell.className = 'inquiry-actions-cell';
      const deleteButton = element('button', 'inquiry-delete-button', '刪除');
      deleteButton.type = 'button';
      deleteButton.dataset.deleteInquiry = item.id;
      deleteButton.setAttribute('aria-label', `刪除 ${item.name || '這筆'}詢問`);
      actionsCell.append(deleteButton);
      row.append(date, name, brand, website, caseSummary, problem, email, contact, source, statusCell, actionsCell);
      body.append(row);
    });
  }

  function updateStats() {
    document.querySelector('#stat-total').textContent = state.inquiries.length;
    document.querySelector('#stat-inquiries').textContent = state.inquiries.filter(item => item.status === 'new').length;
  }

  function showPanel(name) {
    document.querySelectorAll('[data-panel]').forEach(panel => panel.classList.toggle('is-active', panel.dataset.panel === name));
    document.querySelectorAll('[data-panel-target]').forEach(button => button.classList.toggle('is-active', button.dataset.panelTarget === name));
    document.querySelector('.studio-sidebar').classList.remove('is-open');
    document.querySelector('#menu-button').setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadData() {
    try {
      state.inquiries = await window.slitData.rest.select('inquiries', 'select=*&order=created_at.desc', { auth: true }) || [];
      renderInquiries();
      setMessage('#inquiries-load-status', '');
    } catch (error) {
      setMessage('#inquiries-load-status', `Inquiries 載入失敗：${error.message || '未知錯誤'}`, true);
      showToast('已登入；詢問資料暫時無法載入');
    }
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

  authForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button');
    setMessage('#auth-error', '');
    button.disabled = true;
    button.textContent = '登入中…';
    try {
      await window.slitData.auth.signIn(form.email.value.trim(), form.password.value);
      form.password.value = '';
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
    const form = event.currentTarget;
    const button = form.querySelector('button');
    const password = form.password.value;
    const confirmation = form.confirmation.value;
    if (password.length < 12) return setMessage('#recovery-update-message', '新密碼至少需要 12 個字元。', true);
    if (password !== confirmation) return setMessage('#recovery-update-message', '兩次輸入的密碼不一致。', true);
    try {
      button.disabled = true;
      button.textContent = '更新中…';
      setMessage('#recovery-update-message', '');
      await window.slitData.auth.updatePassword(password);
      form.reset();
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
  document.querySelector('#menu-button').addEventListener('click', event => {
    const open = document.querySelector('.studio-sidebar').classList.toggle('is-open');
    event.currentTarget.setAttribute('aria-expanded', String(open));
  });
  document.querySelector('#logout-button').addEventListener('click', async () => {
    await window.slitData.auth.signOut();
    window.location.reload();
  });

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

  document.querySelector('#inquiries-table').addEventListener('click', event => {
    const button = event.target.closest('[data-delete-inquiry]');
    if (!button || !state.user) return;
    pendingDeleteInquiryId = button.dataset.deleteInquiry;
    deleteInquiryDialog.showModal();
  });

  document.querySelector('#cancel-delete-inquiry').addEventListener('click', () => {
    deleteInquiryDialog.close();
  });

  deleteInquiryDialog.addEventListener('close', () => {
    pendingDeleteInquiryId = null;
  });

  confirmDeleteInquiryButton.addEventListener('click', async () => {
    const inquiryId = pendingDeleteInquiryId;
    if (!state.user || !inquiryId) return;
    try {
      confirmDeleteInquiryButton.disabled = true;
      const deleted = await window.slitData.rest.remove('inquiries', `id=eq.${encodeURIComponent(inquiryId)}`);
      if (!Array.isArray(deleted) || !deleted.some(item => item.id === inquiryId)) throw new Error('Delete was not confirmed');
      state.inquiries = state.inquiries.filter(item => item.id !== inquiryId);
      renderInquiries();
      updateStats();
      deleteInquiryDialog.close();
      showToast('詢問已刪除');
    } catch {
      deleteInquiryDialog.close();
      showToast('刪除失敗，請稍後再試');
    } finally {
      confirmDeleteInquiryButton.disabled = false;
    }
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
