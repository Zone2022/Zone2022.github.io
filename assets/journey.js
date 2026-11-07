(() => {
  'use strict';
  const root = document.documentElement, body = document.body;
  const hero = document.querySelector('.hero'), archive = document.getElementById('archive');
  const about = document.getElementById('about'), art = document.getElementById('hero-art');
  const stage = document.getElementById('scene-theatre'), nav = document.querySelector('.scene-nav');
  if (!hero || !archive || !stage || !nav) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const quiet = () => reduced.matches || root.dataset.motion === 'off';
  const modal = () => !!document.querySelector('dialog[open]');
  const maxScroll = () => Math.max(0, root.scrollHeight - innerHeight);
  const positions = { desk: 0, notes: 0, tail: 0 };
  const pending = new Set(), animations = [];
  let active = 'desk', source = 'desk', target = 'desk', phase = 'idle';
  let lastInput = 0, started = 0, settleTimer, safetyTimer, touch, boundaryHold = false;
  let movedArt, restoreInert = [], focusAfter = false, previousFocus;
  function later(fn, delay) {
    const id = setTimeout(() => { pending.delete(id); fn(); }, delay);
    pending.add(id); return id;
  }
  function animate(el, frames, duration, delay = 0, fill = 'both') {
    const a = el.animate(frames, { duration, delay, fill, easing: frames.length > 2 ? 'linear' : 'cubic-bezier(.22,.75,.2,1)' });
    animations.push(a); return a;
  }
  function setPhase(value) { phase = value; body.dataset.transition = value; }
  function emit(name) {
    document.dispatchEvent(new CustomEvent(name, { detail: { from: source, to: target, elapsed: performance.now() - started } }));
  }
  function syncNav() {
    nav.hidden = modal();
    nav.querySelectorAll('button').forEach(b => {
      if (b.dataset.sceneTarget === active) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }
  function activate(scene, y = 0) {
    active = scene; body.dataset.scene = scene;
    scrollTo({ top: Math.min(y, maxScroll()), behavior: 'instant' });
    syncNav();
  }
  function settle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (touch || performance.now() - lastInput < 180) { settle(); return; }
      boundaryHold = false; setPhase('idle');
    }, 190);
  }
  function lock() {
    previousFocus = document.activeElement;
    root.classList.add('scene-locked');
    restoreInert = [...document.querySelectorAll('main,.topbar,footer,.scene-nav')].map(el => [el, el.inert]);
    restoreInert.forEach(([el]) => { el.inert = true; });
  }
  function restoreArt() {
    if (!movedArt) return;
    const { marker, style, className } = movedArt;
    marker.replaceWith(art); art.className = className;
    if (style === null) art.removeAttribute('style'); else art.setAttribute('style', style);
    movedArt = null; window.dispatchEvent(new Event('resize'));
  }
  function finish(options) {
    if (phase !== 'playing') return;
    pending.forEach(clearTimeout); pending.clear(); clearTimeout(safetyTimer);
    animations.splice(0).forEach(a => a.cancel());
    restoreArt(); stage.hidden = true; stage.replaceChildren(); stage.removeAttribute('style');
    root.classList.remove('scene-locked');
    restoreInert.forEach(([el, was]) => { el.inert = was; }); restoreInert = [];
    activate(target, source === 'tail' && target === 'notes' ? positions.notes : 0);
    if (!options?.preserveHash) history.replaceState(history.state, '', { desk: '#top', notes: '#archive', tail: '#about' }[target]);
    document.getElementById('scene-status').textContent = { desk: '已回到书桌', notes: '已翻开学习手记', tail: '已来到尾页' }[target];
    if (focusAfter) { document.getElementById('search').focus({ preventScroll: true }); focusAfter = false; }
    else if (previousFocus !== body && previousFocus?.getClientRects().length === 0) {
      nav.querySelector('[aria-current]')?.focus({ preventScroll: true });
    }
    setPhase('settling'); emit('scene-transition-end'); settle();
  }
  function rectClone(el, extra = '') {
    const r = el.getBoundingClientRect(), clone = el.cloneNode(true);
    clone.removeAttribute('id'); clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    clone.classList.add('theatre-ghost'); if (extra) clone.classList.add(extra);
    clone.inert = true; clone.setAttribute('aria-hidden', 'true');
    // Keep ancestor-dependent typography and each card's own paper colour during reparenting.
    const heading = el.querySelector('h1');
    if (heading) {
      const css = getComputedStyle(heading), copy = clone.querySelector('h1');
      Object.assign(copy.style, { font: css.font, margin: css.margin, letterSpacing: css.letterSpacing });
    }
    const cover = el.querySelector('.note-cover');
    if (cover) clone.querySelector('.note-cover').style.background = getComputedStyle(cover).background;
    Object.assign(clone.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    stage.append(clone); return { el: clone, r };
  }
  function liftArt() {
    const r = art.getBoundingClientRect(), marker = document.createComment('live-notebook');
    movedArt = { marker, style: art.getAttribute('style'), className: art.className };
    art.replaceWith(marker); stage.append(art); art.classList.add('theatre-ghost', 'theatre-art');
    Object.assign(art.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    return art;
  }
  function rabbit(host) {
    const bunny = document.querySelector('.entry-bunny'); if (!bunny) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '265 30 170 235'); svg.append(bunny.cloneNode(true)); host.append(svg);
  }
  function setTheatre() {
    stage.innerHTML = '<div class="theatre-landscape"></div><div class="theatre-label">Lynn<small></small></div><div class="theatre-progress"><i></i></div>';
    stage.querySelector('small').textContent = target === 'notes' ? '把好奇，收进每一页。' : target === 'tail' ? '留一页，给明天。' : '回到灵感开始的地方。';
    animate(stage.querySelector('.theatre-progress i'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 2150);
    animate(stage.querySelector('.theatre-landscape'), [{ opacity: 0 }, { opacity: 1 }], 450);
  }
  function folio() {
    const closing = target === 'tail';
    const book = document.createElement('div'); book.className = 'theatre-folio';
    book.innerHTML = '<div class="theatre-leaf"><em>Lynn</em><strong>好奇心手记</strong><small>A LITTLE MORE EVERY DAY</small></div><div class="theatre-leaf"><div class="theatre-stamp"></div><div class="theatre-rules"></div></div><div class="theatre-ribbon"></div>';
    if (closing) {
      book.classList.add('is-closing');
      book.querySelector('.theatre-stamp').innerHTML = '<span>今天的好奇，<br>先收到这里。</span>';
    } else rabbit(book.querySelector('.theatre-stamp'));
    stage.append(book);
    animate(book, [
      { opacity: 0, transform: 'translateY(65vh) rotateX(24deg) rotateZ(-16deg) scale(.65)', offset: 0 },
      { opacity: 1, offset: .14 },
      { opacity: 1, transform: 'translateY(0) rotateX(8deg) rotateZ(-6deg) scale(1)', offset: .4 },
      { opacity: 1, transform: 'translateY(-5vh) rotateX(0) rotateZ(2deg) scale(1.03)', offset: .68 },
      { opacity: 1, offset: .88 },
      { opacity: 0, transform: 'translateY(-25vh) rotateX(14deg) rotateZ(9deg) scale(.93)', offset: 1 }
    ], 1650, 160);
    const leaves = book.querySelectorAll('.theatre-leaf');
    animate(leaves[0], [{ transform: `rotateY(${closing ? 0 : 68}deg)` }, { transform: 'rotateY(0deg)', offset: .6 }, { transform: `rotateY(${closing ? 76 : 22}deg)` }], 1250, 220);
    animate(leaves[1], [{ transform: `rotateY(${closing ? 0 : -68}deg)` }, { transform: 'rotateY(0deg)', offset: .6 }, { transform: `rotateY(${closing ? -76 : -28}deg)` }], 1250, 290);
    animate(book.querySelector('.theatre-ribbon'), [{ transform: 'rotate(18deg)' }, { transform: 'rotate(-9deg)', offset: .6 }, { transform: 'rotate(5deg)' }], 1500, 230);
    animate(book.querySelector('.theatre-stamp'), [{ opacity: 0, transform: 'translateY(-50px) rotate(-14deg)' }, { opacity: 1, transform: 'translateY(0) rotate(0)' }], 600, 500);
  }
  const visibleNotes = () => [...archive.querySelectorAll('.note')].filter(el => {
    const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight;
  }).slice(0, 4);
  function departing() {
    if (source === 'desk') {
      const text = hero.querySelector('.hero-copy');
      const copy = rectClone(getComputedStyle(text).display === 'contents' ? hero : text).el;
      const artPlaceholder = copy.querySelector('.hero-art');
      if (artPlaceholder) artPlaceholder.style.visibility = 'hidden';
      animate(copy, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-65px)' }], 500);
      animate(liftArt(), [
        { opacity: 1, transform: 'translate(0,0) rotate(0) scale(1)' },
        { opacity: 1, transform: 'translate(-8vw,-6vh) rotate(-18deg) scale(1.08)', offset: .4 },
        { opacity: 0, transform: 'translate(5vw,-100vh) rotate(14deg) scale(.7)' }
      ], 1050);
    } else if (source === 'notes') {
      visibleNotes().forEach((note, i) => {
        const { el, r } = rectClone(note, 'theatre-note');
        const dx = innerWidth / 2 - r.left - r.width / 2;
        animate(el, [
          { opacity: 1, transform: 'translate(0,0) rotate(0) scale(1)' },
          { opacity: 1, transform: `translate(${dx}px,${-r.top + innerHeight * .25}px) rotate(${(i - 1.5) * 9}deg) scale(.65)`, offset: .5 },
          { opacity: 0, transform: `translate(${dx}px,${-innerHeight - r.top}px) rotate(-18deg) scale(.6)` }
        ], 1150, i * 65);
      });
    } else {
      animate(rectClone(about).el, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-80px) rotate(-3deg)' }], 600);
    }
  }
  function arriving() {
    restoreArt(); activate(target, source === 'tail' && target === 'notes' ? positions.notes : 0);
    if (target === 'notes') {
      visibleNotes().forEach((note, i) => {
        const { el, r } = rectClone(note, 'theatre-note');
        const dx = innerWidth / 2 - r.left - r.width / 2;
        animate(el, [
          { opacity: 0, transform: `translate(${dx}px,${innerHeight - r.top}px) rotate(${(i - 1.5) * 13}deg) scale(.65)` },
          { opacity: 1, offset: .16 },
          { opacity: 1, transform: `translate(${dx * .22}px,35px) rotate(${(i - 1.5) * 5}deg) scale(.94)`, offset: .65 },
          { opacity: 1, transform: 'translate(0,0) rotate(0) scale(1)' }
        ], 1000, i * 100);
        const icon = el.querySelector('svg');
        if (icon) animate(icon, [{ opacity: 0, transform: 'translateY(-38px) rotate(-12deg)' }, { opacity: 1, transform: 'translateY(0) rotate(0)' }], 650, 220 + i * 100);
      });
    } else if (target === 'tail') {
      const quote = document.createElement('div'); quote.className = 'theatre-quote';
      quote.innerHTML = '<div class="theatre-stamp"></div><h2>每一页，都算数。</h2><p>明天，继续好奇。</p>';
      rabbit(quote.querySelector('.theatre-stamp')); stage.append(quote);
      animate(quote, [{ opacity: 0, transform: 'translate(-50%,65vh) rotate(15deg) scale(.7)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-3deg) scale(1)' }], 1000);
    } else {
      animate(liftArt(), [{ opacity: 0, transform: 'translateY(65vh) rotate(16deg) scale(.7)' }, { opacity: 1, transform: 'translateY(0) rotate(0) scale(1)' }], 1050);
    }
  }
  function transition(to) {
    if (phase !== 'idle' || modal() || to === active) return;
    source = active; target = to; positions[source] = scrollY; started = performance.now();
    setPhase('playing'); lock(); stage.hidden = false; emit('scene-transition-start');
    safetyTimer = setTimeout(finish, 4500);
    try {
      if (quiet()) {
        animate(stage, [{ opacity: 0 }, { opacity: 1 }], 160);
        later(() => { activate(target); animate(stage, [{ opacity: 1 }, { opacity: 0 }], 160); }, 165);
        later(finish, 340);
      } else {
        setTheatre(); departing(); folio();
        later(arriving, 900);
        later(() => animate(stage, [{ opacity: 1 }, { opacity: 0 }], 320), 2000);
        later(finish, 2340);
      }
    } catch (error) { console.warn('Scene transition recovered:', error); finish(); }
  }
  function consume(e, delta) {
    if (modal()) return;
    lastInput = performance.now();
    if (phase !== 'idle') { e.preventDefault(); if (phase === 'settling') settle(); return; }
    if (boundaryHold) { e.preventDefault(); settle(); return; }
    const top = scrollY <= 2, bottom = scrollY >= maxScroll() - 2;
    let next;
    if (active === 'desk' && delta > 0) next = 'notes';
    if (active === 'notes' && delta < 0 && top) next = 'desk';
    if (active === 'notes' && delta > 0 && bottom) next = 'tail';
    if (active === 'tail' && delta < 0 && top) next = 'notes';
    if (next) { e.preventDefault(); transition(next); return; }
    // A fling that reaches a document edge belongs to that document, not the next film.
    if (active !== 'desk' && ((delta > 0 && !bottom && scrollY + delta >= maxScroll()) || (delta < 0 && !top && scrollY + delta <= 0))) {
      e.preventDefault(); scrollTo({ top: delta > 0 ? maxScroll() : 0, behavior: 'instant' });
      boundaryHold = true; settle();
    }
  }
  const editable = el => el?.closest('input,textarea,select,[contenteditable="true"]');
  window.addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return;
    const unit = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? innerHeight : 1;
    consume(e, e.deltaY * unit);
  }, { capture: true, passive: false });
  window.addEventListener('touchstart', e => {
    if (modal() || e.touches.length !== 1) return;
    if (phase === 'idle' && e.target.closest('#notebook')) { touch = null; return; }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (phase !== 'idle') { lastInput = performance.now(); e.preventDefault(); }
  }, { capture: true, passive: false });
  window.addEventListener('touchmove', e => {
    if (!touch || modal() || e.touches.length !== 1) return;
    const point = e.touches[0], dy = touch.y - point.clientY, dx = touch.x - point.clientX;
    if (phase !== 'idle') { lastInput = performance.now(); e.preventDefault(); return; }
    if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) && !editable(e.target)) {
      consume(e, dy); touch = { x: point.clientX, y: point.clientY };
    }
  }, { capture: true, passive: false });
  const touchEnd = () => { touch = null; if (phase === 'settling' || boundaryHold) settle(); };
  window.addEventListener('touchend', touchEnd); window.addEventListener('touchcancel', touchEnd);
  window.addEventListener('keydown', e => {
    if (modal() || editable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) return;
    if (phase !== 'idle') { lastInput = performance.now(); e.preventDefault(); return; }
    if (e.key === ' ' && e.target.closest('button,a')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) consume(e, e.shiftKey ? -innerHeight * .8 : innerHeight * .8);
    else if (['ArrowUp', 'PageUp'].includes(e.key)) consume(e, -innerHeight * .8);
  }, { capture: true });
  nav.addEventListener('click', e => { const to = e.target.closest('[data-scene-target]')?.dataset.sceneTarget; if (to) transition(to); });
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0 || modal()) return;
    const to = { '#top': 'desk', '#archive': 'notes', '#about': 'tail' }[link.getAttribute('href')];
    if (!to) return; e.preventDefault();
    if (to === active && phase === 'idle') scrollTo({ top: 0, behavior: quiet() ? 'instant' : 'smooth' }); else transition(to);
  });
  document.addEventListener('show-notes-search', () => {
    if (phase !== 'idle') return;
    if (active === 'notes') document.getElementById('search').focus();
    else { focusAfter = true; transition('notes'); }
  });
  function route() {
    const hash = location.hash;
    if (phase === 'playing') finish({ preserveHash: true });
    const to = hash.startsWith('#note=') || hash === '#archive' || hash === '#directory' ? 'notes' : hash === '#about' ? 'tail' : 'desk';
    if (body.dataset.scene !== to) activate(to); else syncNav();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('load', () => requestAnimationFrame(() => {
    // The browser applies the initial fragment after deferred scripts have laid out the scene.
    if (phase === 'idle' && !modal()) scrollTo({ top: 0, behavior: 'instant' });
  }), { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  window.addEventListener('pagehide', finish);
  new MutationObserver(() => { syncNav(); if (modal()) finish({ preserveHash: true }); }).observe(body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  body.classList.add('theatre-ready'); setPhase('idle'); route();
})();
