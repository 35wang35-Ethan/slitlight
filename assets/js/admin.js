(() => {
  const statusLabels = { new: '新詢問', contacted: '已聯絡', discovery: '初談完成', quoted: '已報價', active: '合作中', completed: '完成', declined: '未合作' };
  const state = { inquiries: [] };

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

  async function inquiryRequest(path = '', options = {}) {
    const response = await fetch(`/api/admin/inquiries${path}`, {
      ...options, credentials: 'same-origin', cache: 'no-store', redirect: 'error'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      const error = new Error('請重新整理或稍後再試');
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function loadData() {
    try {
      const payload = await inquiryRequest();
      if (!Array.isArray(payload.inquiries)) throw new Error('資料格式錯誤');
      state.inquiries = payload.inquiries;
      renderInquiries();
      setMessage('#inquiries-load-status', '');
      return true;
    } catch (error) {
      setMessage('#inquiries-load-status', `Inquiries 載入失敗：${error.message || '未知錯誤'}`, true);
      showToast('已登入；詢問資料暫時無法載入');
      return false;
    } finally {
      updateStats();
    }
  }

  document.querySelector('#studio-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-panel-target]');
    if (button) showPanel(button.dataset.panelTarget);
  });
  document.querySelector('#menu-button').addEventListener('click', event => {
    const open = document.querySelector('.studio-sidebar').classList.toggle('is-open');
    event.currentTarget.setAttribute('aria-expanded', String(open));
  });
  document.querySelector('#logout-button').addEventListener('click', () => {
    window.location.assign('/cdn-cgi/access/logout');
  });

  document.querySelector('#inquiries-table').addEventListener('change', async event => {
    const select = event.target.closest('[data-inquiry]');
    if (!select) return;
    const item = state.inquiries.find(row => row.id === select.dataset.inquiry);
    if (!item) return;
    select.disabled = true;
    try {
      const payload = await inquiryRequest(`/${encodeURIComponent(item.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: select.value, expectedUpdatedAt: item.updated_at })
      });
      if (payload.inquiry?.id !== item.id) throw new Error('更新未確認');
      state.inquiries = state.inquiries.map(row => row.id === item.id ? payload.inquiry : row);
      select.value = payload.inquiry.status;
      updateStats();
      showToast('詢問狀態已更新');
    } catch (error) {
      select.value = item.status;
      if (error.status === 409) {
        const loaded = await loadData();
        showToast(loaded ? '資料已被更新，已重新載入最新狀態' : '資料已被更新，重新載入失敗，請重新整理');
      } else showToast(`狀態更新失敗：${error.message}`);
    } finally {
      select.disabled = false;
    }
  });

  document.querySelector('#inquiries-table').addEventListener('click', event => {
    const button = event.target.closest('[data-delete-inquiry]');
    if (!button) return;
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
    if (!inquiryId) return;
    try {
      confirmDeleteInquiryButton.disabled = true;
      const deleted = await inquiryRequest(`/${encodeURIComponent(inquiryId)}`, { method: 'DELETE' });
      if (deleted.deleted !== true || deleted.id !== inquiryId) throw new Error('Delete was not confirmed');
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
    try {
      await loadData();
    } finally {
      loadingState.hidden = true;
    }
  })();
})();
