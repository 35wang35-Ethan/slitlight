(() => {
  if (!window.slitData) return;

  function setText(field, value, preserveBreaks = false) {
    const node = document.querySelector(`[data-cms-field="${field}"]`);
    if (!node || !String(value || '').trim()) return;
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
    .select('homepage_sections', 'select=content&section_key=eq.editorial_copy&enabled=eq.true&limit=1')
    .then(rows => {
      if (!rows?.[0]?.content) return;
      const copy = JSON.parse(rows[0].content);
      Object.entries(copy).forEach(([field, value]) => setText(field, value, field === 'collaborationBody'));
    })
    .catch(() => {
      // The committed HTML remains the reliable fallback when CMS content is unavailable.
    });
})();
