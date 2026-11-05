(() => {
  const title = document.getElementById('hero-title');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const lens = document.createElement('div');
  lens.className = 'title-lens';
  lens.setAttribute('aria-hidden', 'true');
  document.body.append(lens);

  let frame = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0, previousTime = 0;
  function paint() {
    lens.style.transform = `translate3d(${x - 32}px, ${y - 32}px, 0)`;
  }
  function follow(time) {
    frame = 0;
    const dt = Math.min(64, time - previousTime);
    previousTime = time;
    const weight = 1 - Math.exp(-dt / 24);
    x += (targetX - x) * weight;
    y += (targetY - y) * weight;
    if (Math.hypot(targetX - x, targetY - y) < 0.2) {
      x = targetX;
      y = targetY;
    } else {
      frame = requestAnimationFrame(follow);
    }
    paint();
  }
  function hide() {
    lens.classList.remove('is-visible');
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function move(event) {
    if (event.pointerType === 'touch' || !finePointer.matches || reduceMotion.matches ||
        document.documentElement.dataset.motion === 'off' || document.hidden) return hide();
    targetX = event.clientX;
    targetY = event.clientY;
    if (!lens.classList.contains('is-visible')) {
      x = targetX;
      y = targetY;
      paint();
      lens.classList.add('is-visible');
    } else if (!frame) {
      previousTime = performance.now();
      frame = requestAnimationFrame(follow);
    }
  }
  for (const line of title.querySelectorAll('.ink-line')) {
    line.addEventListener('pointerenter', move);
    line.addEventListener('pointermove', move);
    line.addEventListener('pointerleave', hide);
    line.addEventListener('pointercancel', hide);
  }
  window.addEventListener('scroll', hide, {passive:true});
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', hide);
  document.addEventListener('motionchange', hide);
  finePointer.addEventListener('change', hide);
  reduceMotion.addEventListener('change', hide);
})();
