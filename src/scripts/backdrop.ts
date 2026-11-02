/**
 * Animated backgrounds (CLAUDE.md §7.2): the engine. <Backdrop scene="…" /> renders a
 * <canvas data-backdrop="scene"> behind a section; this file runs the scene the client registered.
 * The engine owns every rule, so scenes only draw:
 *   - starts after `load` + idle (never competes with LCP); the canvas fades in, the CSS fallback shows until then
 *   - stops while off screen or in a background tab (IntersectionObserver + visibilitychange)
 *   - prefers-reduced-motion or Save-Data → one still frame, no loop, no pointer
 *   - pointer only with data-backdrop-interactive: mouse while inside, a tap glows for ~1.2 s on touch
 *   - colors come from --bd-1…--bd-4 on the canvas (design tokens), re-read when the theme changes
 *   - devicePixelRatio capped (2 desktop, 1.5 phones); size follows the host (ResizeObserver)
 */

export interface Pointer {
  x: number;          // CSS px, relative to the canvas
  y: number;
  /** 0 → 1 eased: 1 while the mouse is inside (or just after a tap), fades out when it leaves */
  strength: number;
  /** ms timestamp of the last click/tap (ripples), 0 if none */
  tap: number;
}

export interface Frame {
  ctx: CanvasRenderingContext2D;
  w: number;            // CSS px
  h: number;
  t: number;            // ms since start
  dt: number;           // ms since last frame (clamped to 50)
  pointer: Pointer;
  /** 0 while the host is fully in view → 1 when it has scrolled out at the top (scroll-linked effects) */
  scroll: number;
  colors: string[];     // [--bd-1, --bd-2, --bd-3, --bd-4]
  /** true when drawing the single frame for reduced motion / Save-Data */
  still: boolean;
  phone: boolean;       // narrow screen: draw less
}

export interface Scene {
  /** Canvas pixels per CSS px. Soft scenes (glows, blurs) look the same at 0.5 and cost a quarter. Default: devicePixelRatio, capped. */
  resolution?: number;
  /** Build the scene's objects; called at start and after every resize. */
  setup(f: Frame): void;
  /** Draw one frame (clear the canvas yourself). */
  draw(f: Frame): void;
}

export type SceneFactory = () => Scene;

/** Objects for an area: `perMp` per million CSS px², at least `min`. */
export const density = (w: number, h: number, perMp: number, min = 8) => Math.max(min, Math.round((w * h / 1e6) * perMp));
export const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function mountBackdrops(scenes: Record<string, SceneFactory>) {
  const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas[data-backdrop]');
  if (!canvases.length) return;

  const start = () => canvases.forEach((c) => {
    const make = scenes[c.dataset.backdrop ?? ''];
    if (make) run(c, make());
    else if (import.meta.env.DEV) console.warn(`[backdrop] unknown scene "${c.dataset.backdrop}"`);
  });
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 200));
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}

function run(canvas: HTMLCanvasElement, scene: Scene) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const still =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const interactive = canvas.hasAttribute('data-backdrop-interactive') && !still;
  const host = canvas.parentElement ?? canvas;

  const f: Frame = {
    ctx, w: 0, h: 0, t: 0, dt: 16, still, phone: false, scroll: 0,
    pointer: { x: -9999, y: -9999, strength: 0, tap: 0 },
    colors: [],
  };
  let playing = false;
  let raf = 0;
  let last = 0;
  let visible = true;
  let inside = false;

  const readColors = () => {
    const cs = getComputedStyle(canvas);
    f.colors = [1, 2, 3, 4].map((i) => cs.getPropertyValue(`--bd-${i}`).trim() || '#888');
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    f.phone = r.width < 640;
    const dpr = scene.resolution ?? Math.min(window.devicePixelRatio || 1, f.phone ? 1.5 : 2);
    f.w = r.width; f.h = r.height;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.setup(f);
    if (still || !playing) scene.draw(f);
  };

  readColors();
  // Theme switches (class / data-theme on <html>) and the system light/dark change
  new MutationObserver(() => { readColors(); if (still || !playing) scene.draw(f); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { readColors(); if (still) scene.draw(f); });

  const scrollProgress = () => {
    const r = host.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    f.dt = last ? Math.min(50, now - last) : 16;
    last = now;
    f.t += f.dt;
    f.scroll = scrollProgress();
    // Pointer strength eases toward its target so effects never pop
    const p = f.pointer;
    const sinceTap = p.tap ? performance.now() - p.tap : Infinity;
    const target = inside || sinceTap < 1200 ? 1 : 0;
    p.strength += (target - p.strength) * Math.min(1, f.dt / 180);
    scene.draw(f);
  };

  const play = () => {
    if (playing || still || !visible || document.hidden) return;
    playing = true; last = 0;
    raf = requestAnimationFrame(loop);
  };
  const pause = () => { playing = false; cancelAnimationFrame(raf); };

  new ResizeObserver(resize).observe(canvas);
  resize();
  canvas.classList.add('is-on');
  if (still) return;

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : pause(); }, { rootMargin: '80px' }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));

  if (interactive) {
    // The canvas has pointer-events: none (content stays clickable), so listen on the window
    const locate = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      f.pointer.x = e.clientX - r.left;
      f.pointer.y = e.clientY - r.top;
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') inside = locate(e); }, { passive: true });
    window.addEventListener('pointerdown', (e) => { if (locate(e)) f.pointer.tap = performance.now(); }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { inside = false; });
  }
  play();
}
