(() => {
  'use strict';
  const entry = document.getElementById('entrance');
  const replay = document.getElementById('replay-entrance');
  if (!entry || typeof entry.showModal !== 'function') return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const sessionKey = 'lynn-paper-visited-v1';
  let leaving = false, previousFocus, deadline, animations = [];
  const quiet = () => reduce.matches || root.dataset.motion === 'off';
  const find = selector => entry.querySelector(selector);
  function animate(element, frames, options) {
    const animation = element.animate(frames, {fill: 'both', ...options});
    animations.push(animation);
    return animation;
  }
  function remember() {
    try { sessionStorage.setItem(sessionKey, 'yes'); } catch {}
  }
  function cleanup() {
    clearTimeout(deadline);
    for (const animation of animations) animation.cancel();
    animations = [];
    leaving = false;
    root.classList.remove('entry-active');
    entry.classList.remove('entry-leaving');
    entry.style.removeProperty('--entry-x');
    entry.style.removeProperty('--entry-y');
  }
  function finish() {
    if (!entry.open) return;
    remember();
    entry.close();
    cleanup();
    const target = previousFocus?.isConnected && previousFocus !== document.body
      ? previousFocus : document.querySelector('.hero .primary');
    target?.focus({preventScroll: true});
  }
  function open() {
    if (entry.open || document.getElementById('reader').open) return;
    cleanup();
    previousFocus = document.activeElement;
    entry.showModal();
    root.classList.add('entry-active');
    entry.classList.toggle('entry-paused', document.hidden);
    document.getElementById('enter-site').focus({preventScroll: true});
    if (quiet()) return;
    const ease = 'cubic-bezier(.16,1,.3,1)';
    animate(find('.entry-arch'), [{opacity: 0, transform: 'translateY(18px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 800, easing: ease});
    for (const [index, selector] of ['.entry-books', '.entry-bunny', '.entry-flower', '.entry-flying-note'].entries()) {
      const arrival = animate(find(selector), [{opacity: 0, transform: 'translateY(28px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 720, delay: 90 + index * 90, easing: ease});
      arrival.finished.then(() => { if (!leaving) arrival.cancel(); }).catch(() => {});
    }
  }
  async function enter() {
    if (leaving || !entry.open) return;
    if (quiet() || typeof entry.animate !== 'function') return finish();
    leaving = true;
    for (const animation of animations) animation.cancel();
    animations = [];
    entry.classList.add('entry-leaving');
    // Hard deadline also releases the native modal if animation completion is interrupted.
    deadline = setTimeout(finish, 1900);
    try {
      const curve = 'cubic-bezier(.65,0,.25,1)';
      animate(find('.entry-content'), [{opacity: 1, transform: 'scale(1)'}, {opacity: 0, transform: 'scale(1.12) translateY(-24px)'}], {duration: 480, easing: 'ease-in'});
      animate(find('.entry-landscape'), [{opacity: 1, transform: 'scale(1)'}, {opacity: 0, transform: 'scale(1.18)'}], {duration: 700, easing: curve});
      animate(find('.entry-top'), [{opacity: 1}, {opacity: 0}], {duration: 230});
      animate(find('.entry-bottom'), [{opacity: 1}, {opacity: 0}], {duration: 230});
      const left = animate(find('.entry-paper-left'), [{transform: 'translateX(0) rotateY(0deg)'}, {transform: 'translateX(-12%) rotateY(-104deg)'}], {duration: 1200, delay: 160, easing: curve});
      const right = animate(find('.entry-paper-right'), [{transform: 'translateX(0) rotateY(0deg)'}, {transform: 'translateX(12%) rotateY(104deg)'}], {duration: 1200, delay: 160, easing: curve});
      animate(document.querySelector('.hero'), [{opacity: .35, transform: 'translateY(22px) scale(.98)'}, {opacity: 1, transform: 'none'}], {duration: 900, delay: 420, easing: 'cubic-bezier(.16,1,.3,1)'});
      await Promise.all([left.finished, right.finished]);
    } catch { /* Esc, motion changes and navigation may cancel the sequence. */ }
    finally { finish(); }
  }
  entry.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  entry.addEventListener('close', cleanup);
  document.getElementById('enter-site').addEventListener('click', enter);
  document.getElementById('skip-entrance').addEventListener('click', finish);
  replay.addEventListener('click', open);
  replay.hidden = false;
  entry.addEventListener('pointermove', event => {
    if (quiet() || leaving || !finePointer.matches || event.pointerType === 'touch') return;
    entry.style.setProperty('--entry-x', `${(event.clientX / innerWidth - .5) * 12}px`);
    entry.style.setProperty('--entry-y', `${(event.clientY / innerHeight - .5) * 8}px`);
  });
  entry.addEventListener('pointerleave', () => {
    entry.style.setProperty('--entry-x', '0px'); entry.style.setProperty('--entry-y', '0px');
  });
  function motionChanged() {
    if (!quiet()) return;
    if (leaving) finish();
    for (const animation of animations) animation.cancel();
    animations = [];
    entry.style.removeProperty('--entry-x'); entry.style.removeProperty('--entry-y');
  }
  reduce.addEventListener('change', motionChanged);
  document.addEventListener('motionchange', motionChanged);
  document.addEventListener('visibilitychange', () => {
    entry.classList.toggle('entry-paused', document.hidden);
    if (document.hidden && leaving) finish();
  });
  window.addEventListener('hashchange', () => { if (entry.open) finish(); });
  // Deep links and the current browsing session go straight to the requested content.
  let visited = false;
  try { visited = sessionStorage.getItem(sessionKey) === 'yes'; } catch {}
  if (!location.hash && !visited) open();
})();
