(() => {
  if (!window.slitData) return;

  function setText(field, value, preserveBreaks = false) {
    const node = document.querySelector(`[data-cms-field="${field}"]`);
    if (!node || !String(value || '').trim()) return;
    if (field === 'heroLabel') {
      node.textContent = 'Slit.light';
      return;
    }
    if (field === 'heroTitle') {
      node.textContent = String(value).trim();
      return;
    }
    if (field === 'aboutTitle' || field === 'collaborationTitle') {
      node.textContent = String(value).trim();
      return;
    }
    if (field === 'aboutName') {
      node.textContent = 'ETHAN';
      return;
    }
    if (field === 'aboutBody') {
      node.replaceChildren(...String(value).split(/\r?\n/).filter(Boolean).map(line => {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        return paragraph;
      }));
      return;
    }
    if (!preserveBreaks) {
      node.textContent = value;
      return;
    }
    const lines = String(value).split(/\r?\n/);
    node.replaceChildren();
    lines.forEach((line, index) => {
      if (index) node.append(document.createElement('br'));
      node.append(document.createTextNode(line));
    });
  }

  window.slitData.rest
    .select('homepage_sections', 'select=content&section_key=eq.homepage_layout_text_rhythm_20260829&enabled=eq.true&limit=1')
    .then(rows => {
      if (!rows?.[0]?.content) return;
      const copy = JSON.parse(rows[0].content);
      Object.entries(copy).forEach(([field, value]) => setText(field, value, field === 'aboutBody'));
    })
    .catch(() => {
      // The committed HTML remains the reliable fallback when CMS content is unavailable.
    });
})();
