/**
 * Blueprint signature interactions (design.md → Direction A). All optional enhancements:
 * without JS, with reduced motion or on touch screens the page is complete and nothing is hidden.
 *   1. The architecture diagram comes alive when it enters the viewport (.is-live: lines draw, pulses travel).
 *   2. Diagram nodes ↔ legend: pointing at a node highlights its explanation (the text is always visible — UI-STATES H4).
 *   3. Edge guides: a tick on the left guide follows the pointer (fine pointer only).
 *   4. Magnetic primary buttons (fine pointer only), max 5px, via the `translate` property.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// 1 · Diagram comes alive
const diagrams = document.querySelectorAll<HTMLElement>('.arch');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-live'); io.unobserve(e.target); }
    }
  }, { threshold: 0.35 });
  diagrams.forEach((d) => io.observe(d));
} else {
  diagrams.forEach((d) => d.classList.add('is-live'));
}

// 2 · Node ↔ legend highlight (mouse hover and tap; the legend already shows every explanation)
diagrams.forEach((d) => {
  const legend = [...d.querySelectorAll<HTMLElement>('.arch__legend > div')];
  const nodes = [...d.querySelectorAll<SVGGElement>('[data-arch-node]')];
  const setActive = (key: string | null) => {
    nodes.forEach((n) => n.classList.toggle('is-active', n.dataset.archNode === key));
    legend.forEach((l) => l.classList.toggle('is-active', !!key && l.dataset.archKey?.split(' ').includes(key)));
  };
  nodes.forEach((n) => {
    n.addEventListener('pointerenter', () => setActive(n.dataset.archNode ?? null));
    n.addEventListener('pointerleave', () => setActive(null));
    n.addEventListener('click', () => setActive(n.dataset.archNode ?? null));
  });
  legend.forEach((l) => {
    l.addEventListener('pointerenter', () => setActive(l.dataset.archKey?.split(' ')[0] ?? null));
    l.addEventListener('pointerleave', () => setActive(null));
  });
});

if (finePointer && !reduce) {
  // 3 · Guide tick follows the pointer (one rAF per frame at most)
  const guides = document.querySelector<HTMLElement>('.guides');
  const tick = guides?.querySelector<HTMLElement>('.guides__tick');
  if (guides && tick) {
    let y = 0, queued = false;
    window.addEventListener('pointermove', (e) => {
      y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { tick.style.transform = `translateY(${y}px)`; queued = false; });
      guides.classList.add('is-tracking');
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => guides.classList.remove('is-tracking'));
  }

  // 4 · Magnetic primary buttons
  document.querySelectorAll<HTMLElement>('.btn--primary').forEach((btn) => {
    const MAX = 5;
    btn.addEventListener('pointermove', (e) => {
      if (btn.matches(':disabled, [aria-disabled="true"], [aria-busy="true"]')) return;
      const r = btn.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const dy = ((e.clientY - r.top) / r.height - 0.5) * 2;
      btn.style.setProperty('--mx', `${(dx * MAX).toFixed(1)}px`);
      btn.style.setProperty('--my', `${(dy * MAX * 0.6).toFixed(1)}px`);
    });
    btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
  });
}
