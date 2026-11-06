(() => {
  'use strict';
  const root = document.documentElement;
  const story = document.getElementById('journey');
  const hero = story?.querySelector('.hero');
  const directory = document.getElementById('directory');
  const archive = document.getElementById('archive');
  if (!story || !directory) return;
  const stage = story.querySelector('.journey-stage');
  const art = document.getElementById('hero-art');
  const sheet = story.querySelector('.journey-sheet');
  const book = directory.querySelector('.directory-book');
  const bookmarks = document.getElementById('bookmarks');
  const nav = document.querySelector('.journey-nav');
  const desktop = matchMedia('(min-width: 900px) and (min-height: 620px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let enhanced = false, top = 0, end = 0, frame = 0, travel = 0;
  let gestureTime = 0, gestureUsed = false, gestureTotal = 0, journeyObserver;
  let activeScene = 0, generation = 0;
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = (n, a, b) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
  const quiet = () => reduced.matches || root.dataset.motion === 'off';
  const modal = () => !!document.querySelector('dialog[open]');
  const nodes = () => [...bookmarks.querySelectorAll('.bookmark')];
  function showScene(number) {
    activeScene = number;
    nav.querySelectorAll('button').forEach(button => {
      if (+button.dataset.scene === number) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (enhanced) {
      hero.inert = number !== 0;
      directory.inert = number !== 1;
    }
  }
  function paint() {
    frame = 0;
    if (!enhanced) return;
    const p = clamp((scrollY - top) / Math.max(1, end - top));
    const exit = clamp((scrollY - end) / innerHeight);
    const heroFade = 1 - smooth(p, .12, .45);
    hero.style.opacity = heroFade;
    hero.style.visibility = heroFade > 0 ? 'visible' : 'hidden';
    hero.style.transform = `translate3d(${-p * 4}%,${-p * 6}%,0) scale(${1 + p * .08})`;
    art.style.transform = `translate3d(${-p * 18}%,0,0) scale(${1 + p * .55}) rotateY(${-p * 32}deg) rotateZ(${-p * 9}deg)`;
    const reveal = smooth(p, .37, .85);
    directory.style.opacity = reveal;
    directory.style.visibility = reveal > 0 ? 'visible' : 'hidden';
    directory.style.transform = `translate3d(0,${(1 - reveal) * 45}px,0) scale(${1.1 - reveal * .1})`;
    book.style.transform = `rotate(${1.2 + exit * 3}deg) scale(${1 - exit * .08})`;
    const paper = clamp((p - .18) / .64);
    sheet.style.visibility = p > .18 && p < .82 ? 'visible' : 'hidden';
    sheet.style.transform = `translate3d(${115 - paper * 230}%,0,180px) rotateY(${-28 + paper * 56}deg) rotateZ(${-5 + paper * 10}deg)`;
    nodes().forEach((node, i) => {
      const n = smooth(p, .48 + Math.min(i, 5) * .035, .78 + Math.min(i, 5) * .035);
      node.style.opacity = n;
      node.style.translate = `0 ${(1 - n) * (85 + i % 3 * 13) - exit * (i % 2 ? 22 : 50)}px`;
      node.style.rotate = `${(1 - n) * (i % 2 ? 12 : -12)}deg`;
    });
    const scene = scrollY > end + innerHeight * .45 ? 2 : p >= .55 ? 1 : 0;
    if (activeScene !== scene) showScene(scene);
    nav.hidden = modal() || scrollY > archive.offsetTop + 80;
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
  function measure() {
    top = story.offsetTop;
    end = top + story.offsetHeight - stage.offsetHeight;
    schedule();
  }
  function stopTravel() { generation++; cancelAnimationFrame(travel); travel = 0; }
  function position(number) {
    if (number === 0) return 0;
    if (number === 1) return enhanced ? end : directory.getBoundingClientRect().top + scrollY - 25;
    return archive.getBoundingClientRect().top + scrollY - 25;
  }
  function go(number, focus = false) {
    stopTravel();
    const currentGeneration = generation;
    const from = scrollY, to = position(number);
    const complete = () => {
      travel = 0;
      if (enhanced) { paint(); showScene(number); }
      if (focus) {
        const target = number === 0 ? document.querySelector('.hero .primary') : number === 1 ? document.getElementById('directory-title') : document.getElementById('archive-title');
        target.setAttribute('tabindex', '-1'); target.focus({preventScroll: true});
      }
    };
    if (quiet() || Math.abs(to - from) < 2) { window.scrollTo({top: to, behavior: 'instant'}); complete(); return; }
    const start = performance.now(), duration = enhanced ? 1150 : 650;
    function tick(now) {
      if (currentGeneration !== generation) return;
      const t = clamp((now - start) / duration);
      const ease = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo({top: from + (to - from) * ease, behavior: 'instant'});
      if (t < 1) travel = requestAnimationFrame(tick); else complete();
    }
    travel = requestAnimationFrame(tick);
  }
  function clearStyles() {
    for (const node of [hero, art, directory, sheet, book, ...nodes()]) {
      for (const property of ['opacity','visibility','transform','translate','rotate']) node.style.removeProperty(property);
    }
    hero.inert = false; directory.inert = false;
  }
  function configure() {
    const next = desktop.matches && !quiet();
    if (quiet()) {
      stopTravel();
      for (const animation of book.getAnimations()) animation.cancel();
    }
    if (enhanced === next) { measure(); return; }
    const oldScene = activeScene;
    const readingBelow = scrollY >= archive.offsetTop - 35;
    const archiveOffset = scrollY - archive.offsetTop;
    const wasEnhanced = enhanced;
    stopTravel(); enhanced = next;
    root.classList.toggle('journey-enhanced', enhanced);
    clearStyles(); measure();
    nav.hidden = !enhanced || modal();
    if (readingBelow) window.scrollTo({top: archive.offsetTop + archiveOffset, behavior: 'instant'});
    else if (wasEnhanced && oldScene === 1) window.scrollTo({top: position(1), behavior: 'instant'});
    showScene(enhanced ? oldScene : 0);
    schedule();
  }
  function renderCategories(notes) {
    const counts = new Map();
    for (const note of notes) {
      if (!counts.has(note.category)) counts.set(note.category, []);
      counts.get(note.category).push(note.title);
    }
    bookmarks.replaceChildren();
    for (const [name, titles] of [...counts].sort(([a],[b]) => a.localeCompare(b, 'zh-CN'))) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'bookmark'; button.dataset.category = name;
      const title = document.createElement('span'); title.className = 'bookmark-title'; title.textContent = name;
      const preview = document.createElement('span'); preview.className = 'bookmark-preview'; preview.textContent = titles[0];
      const amount = document.createElement('span'); amount.className = 'bookmark-count'; amount.textContent = `${titles.length} 篇手记`;
      const line = document.createElement('span'); line.className = 'bookmark-line'; line.setAttribute('aria-hidden', 'true');
      button.append(title, preview, amount, line); bookmarks.append(button);
    }
    document.getElementById('directory-count').textContent = `${counts.size} 个方向 · ${notes.length} 篇`;
    if (!counts.size) bookmarks.textContent = '这里还没有手记，下一页等你来写。';
    schedule();
  }
  document.addEventListener('notesready', event => renderCategories(event.detail));
  document.addEventListener('noteserror', () => {
    bookmarks.textContent = '目录暂时未能加载，可以到学习手记中重试。';
    document.getElementById('directory-count').textContent = '稍后再试';
  });
  const loaded = [...document.querySelectorAll('.note')].map(node => ({category: node.querySelector('.note-category').textContent, title: node.querySelector('.note-title').textContent}));
  if (loaded.length) renderCategories(loaded);
  bookmarks.addEventListener('click', event => {
    const button = event.target.closest('.bookmark'); if (!button) return;
    const filter = document.getElementById('category');
    document.getElementById('search').value = '';
    filter.value = button.dataset.category; filter.dispatchEvent(new Event('change'));
    history.replaceState(history.state, '', '#archive'); go(2, true);
  });
  nav.addEventListener('click', event => {
    const button = event.target.closest('button'); if (button) go(+button.dataset.scene, true);
  });
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || modal()) return;
    const target = anchor.getAttribute('href');
    const number = target === '#top' ? 0 : target === '#directory' ? 1 : target === '#archive' ? 2 : -1;
    if (number < 0) return;
    if (anchor.hasAttribute('data-all-notes')) {
      const filter = document.getElementById('category'); filter.value = '';
      document.getElementById('search').value = ''; filter.dispatchEvent(new Event('change'));
    }
    event.preventDefault(); history.replaceState(history.state, '', target); go(number, true);
  });
  // One desktop wheel gesture moves one chapter. The document area keeps its normal wheel behavior.
  window.addEventListener('wheel', event => {
    if (!enhanced || !fine.matches || modal() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.target.closest('input,textarea,select')) return;
    const scrollable = event.target.closest('.bookmarks');
    if (scrollable && scrollable.scrollHeight > scrollable.clientHeight + 1) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    const returning = delta < 0 && scrollY > end + 2 && scrollY + delta <= end + 40;
    if (scrollY > end + 40 && !travel && !returning) return;
    if (scrollY <= 1 && event.deltaY < 0) return;
    const now = performance.now();
    if (now - gestureTime > 220) { gestureUsed = false; gestureTotal = 0; }
    gestureTime = now;
    event.preventDefault();
    if (travel || gestureUsed) return;
    gestureTotal += delta;
    if (Math.abs(gestureTotal) < 35) return;
    const current = scrollY < top + (end - top) * .5 ? 0 : 1;
    gestureUsed = true;
    go(returning ? 1 : Math.max(0, Math.min(2, current + Math.sign(gestureTotal))));
  }, {passive: false});
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', configure, {passive: true});
  window.addEventListener('hashchange', () => {
    stopTravel();
    if (location.hash === '#directory') go(1);
    else if (location.hash === '#archive') go(2);
    else if (location.hash === '#top') go(0);
    else schedule();
  });
  window.addEventListener('keydown', event => { if (['Escape','PageDown','PageUp','Home','End','ArrowDown','ArrowUp','Tab'].includes(event.key)) stopTravel(); });
  window.addEventListener('touchstart', stopTravel, {passive: true});
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopTravel(); else schedule(); });
  document.addEventListener('motionchange', configure);
  reduced.addEventListener('change', configure); desktop.addEventListener('change', configure);
  new MutationObserver(() => { if (modal()) stopTravel(); schedule(); }).observe(document.body, {attributes: true, subtree: true, attributeFilter: ['open']});
  // Reuse Lynn's original rabbit drawing, with its own viewBox and no duplicated SVG IDs.
  const bunny = document.querySelector('.entry-bunny');
  if (bunny) {
    const drawing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    drawing.setAttribute('viewBox','265 30 170 235'); drawing.append(bunny.cloneNode(true));
    directory.querySelector('.directory-bunny').append(drawing);
  }
  journeyObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || enhanced || quiet()) continue;
      const version = entry.target.dataset.arrived;
      if (version) continue;
      entry.target.dataset.arrived = 'yes';
      entry.target.animate([{opacity: .2, transform: 'translateY(28px) rotate(2deg)'},{opacity: 1, transform: 'none'}], {duration: 750, easing: 'cubic-bezier(.16,1,.3,1)'});
    }
  }, {threshold: .15});
  journeyObserver.observe(book);
  configure();
  // Native fragment positioning can happen before the enhanced layout changes height.
  // Resolve direct links again after layout, without playing a journey on arrival.
  const land = () => {
    const target = location.hash === '#directory' ? 1 : location.hash === '#archive' ? 2 : -1;
    if (target < 0) return;
    stopTravel(); measure(); window.scrollTo({top: position(target), behavior: 'instant'}); paint();
  };
  requestAnimationFrame(land);
  window.addEventListener('pageshow', event => { if (!event.persisted) requestAnimationFrame(land); });
})();
