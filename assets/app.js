(() => {
  const $ = id => document.getElementById(id);
  const list = $('notes'), search = $('search'), category = $('category'), reader = $('reader'), content = $('content');
  let notes = [], active = null;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    const q = search.value.trim().toLocaleLowerCase(), selected = category.value;
    const visible = notes.filter(n => (!selected || n.category === selected) && (n.title + ' ' + n.category).toLocaleLowerCase().includes(q));
    $('count').textContent = `${visible.length} / ${notes.length} 篇文档`;
    list.innerHTML = visible.length ? visible.map(n => `<button class="note" type="button" data-path="${escape(n.path)}"><span class="note-title">${escape(n.title)}</span><span class="note-category">${escape(n.category)}</span><span class="note-arrow" aria-hidden="true">↗</span></button>`).join('') : '<p class="state">没有找到匹配的文档。换个关键词试试。</p>';
  }
  function closeReader() { if(reader.open) reader.close(); if(location.hash.startsWith('#note=')) history.replaceState(null,'',location.pathname + location.search + '#archive'); }
  async function openNote(note, updateHash = true) {
    active = note; $('reader-title').textContent = note.title; $('reader-category').textContent = note.category; $('toc').replaceChildren(); content.textContent = '正在加载文档…';
    if (!reader.open) reader.showModal(); reader.scrollTop = 0;
    if(updateHash) history.replaceState(null,'','#note=' + encodeURIComponent(note.path));
    try {
      if (!window.marked || !window.DOMPurify) throw new Error('渲染组件加载失败，请检查网络连接后刷新。');
      const response = await fetch(note.path); if(!response.ok) throw new Error('文档加载失败，请稍后重试。');
      const md = await response.text(); if(active !== note) return;
      const html = DOMPurify.sanitize(marked.parse(md));
      content.innerHTML = html;
      const base = new URL(note.path, location.href);
      content.querySelectorAll('a[href],img[src]').forEach(el => { const attr = el.tagName === 'A' ? 'href' : 'src'; const value = el.getAttribute(attr); if(value && !value.startsWith('#')) { try { const url = new URL(value, base); if(['http:','https:','mailto:'].includes(url.protocol)) el.setAttribute(attr,url.href); else el.removeAttribute(attr); } catch { el.removeAttribute(attr); } } });
      content.querySelectorAll('h2,h3').forEach((heading,i) => { heading.id = `section-${i}`; const link = document.createElement('a'); link.href = `#section-${i}`; link.textContent = heading.textContent; link.addEventListener('click', e => { e.preventDefault(); heading.scrollIntoView({behavior:'smooth'}); }); $('toc').append(link); });
    } catch (error) { content.textContent = error.message; }
  }
  list.addEventListener('click', e => { const button = e.target.closest('[data-path]'); if(button) { const note = notes.find(n => n.path === button.dataset.path); if(note) openNote(note); } });
  $('close-reader').addEventListener('click', closeReader); reader.addEventListener('cancel', e => { e.preventDefault(); closeReader(); });
  reader.addEventListener('scroll', () => { const range = reader.scrollHeight - reader.clientHeight; document.querySelector('.reader-progress span').style.width = (range > 0 ? reader.scrollTop / range * 100 : 0) + '%'; });
  search.addEventListener('input', render); category.addEventListener('change', render);
  document.addEventListener('keydown', e => { if(e.key === '/' && !reader.open && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {e.preventDefault(); search.focus();} });
  fetch('notes-index.json').then(r => { if(!r.ok) throw new Error(); return r.json(); }).then(paths => {
    notes = paths.map(path => { const parts = decodeURIComponent(path).split('/'); const filename = parts.pop(); const root = parts.lastIndexOf('notes'); return {path, title:filename.replace(/\.md$/i,''), category:parts.slice(root + 1).join(' / ') || '未分类'}; }).sort((a,b) => a.title.localeCompare(b.title,'zh-CN'));
    [...new Set(notes.map(n => n.category))].sort((a,b) => a.localeCompare(b,'zh-CN')).forEach(name => { const o = document.createElement('option'); o.value = o.textContent = name; category.append(o); }); render();
    if(location.hash.startsWith('#note=')) { try { const path = decodeURIComponent(location.hash.slice(6)); const note = notes.find(n => n.path === path); if(note) openNote(note, false); } catch {} }
  }).catch(() => { $('count').textContent = '目录不可用'; list.innerHTML = '<p class="state">无法加载文档目录。请确认站点已由 GitHub Pages / Jekyll 构建。</p>'; });
})();

