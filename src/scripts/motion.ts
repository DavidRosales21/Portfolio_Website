/**
 * Motion engine: Lenis smooth scroll + GSAP ScrollTrigger utilities.
 * Markup API (personality/values come from src/config/motion.ts):
 *   data-reveal                → fade + rise in on scroll
 *   data-reveal="left|right|scale|fade"
 *   data-stagger               → children reveal one after another
 *   data-parallax="0.2"        → moves slower/faster than scroll (-1..1)
 * Rules: never put data-reveal on the hero <h1> or LCP image. Content stays visible
 * if JS fails (the `motion` class is removed by a safety timeout in BaseLayout).
 */
import { motion as cfg } from '../config/motion';

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

declare global { interface Window { lenis?: import('lenis').default } }

async function init() {
  // Content already shown by the safety timeout (BaseLayout) is never hidden again: smooth scroll only.
  const needsGsap = root.classList.contains('motion') && document.querySelector('[data-reveal], [data-stagger], [data-parallax]');

  const [{ default: Lenis }, gsapMod, stMod] = await Promise.all([
    cfg.smoothScroll ? import('lenis') : Promise.resolve({ default: null as any }),
    needsGsap ? import('gsap') : Promise.resolve(null),
    needsGsap ? import('gsap/ScrollTrigger') : Promise.resolve(null),
  ]);

  const lenis = Lenis ? new Lenis({ duration: cfg.scrollDuration, anchors: true, autoRaf: !gsapMod }) : null;
  if (lenis) window.lenis = lenis;

  if (gsapMod && stMod) {
    const { gsap } = gsapMod;
    const { ScrollTrigger } = stMod;
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    // The safety timeout fired while the libraries were loading: keep the content as it is.
    if (!root.classList.contains('motion')) return;

    const from = (kind: string | undefined) => {
      const d = cfg.revealDistance;
      switch (kind) {
        case 'left': return { x: -d };
        case 'right': return { x: d };
        case 'scale': return { scale: 0.94 };
        case 'fade': return {};
        default: return { y: d };
      }
    };
    const base = { duration: cfg.revealDuration, ease: cfg.revealEase };
    // Opacity only (never autoAlpha/visibility): hidden-but-waiting content must stay
    // in the tab order and the accessibility tree.
    const reveals = new Map<Element, ReturnType<typeof gsap.fromTo>>();

    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      reveals.set(el, gsap.fromTo(el, { opacity: 0, ...from(el.dataset.reveal) }, {
        opacity: 1, x: 0, y: 0, scale: 1, ...base, clearProps: 'transform', // leave CSS hover/tilt transforms free
        scrollTrigger: { trigger: el, start: cfg.revealStart, once: true },
      }));
    });

    gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
      reveals.set(group, gsap.fromTo(group.children, { opacity: 0, y: cfg.revealDistance }, {
        opacity: 1, y: 0, ...base, stagger: cfg.stagger, clearProps: 'transform',
        scrollTrigger: { trigger: group, start: cfg.revealStart, once: true },
      }));
    });

    // Keyboard users: whatever receives focus is shown at once, even before it scrolls into view.
    document.addEventListener('focusin', (e) => {
      let el = (e.target as Element).closest('[data-reveal], [data-stagger]');
      while (el) {
        reveals.get(el)?.progress(1);
        el = el.parentElement?.closest('[data-reveal], [data-stagger]') ?? null;
      }
    });

    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
      const speed = Number(el.dataset.parallax) || 0.2;
      gsap.to(el, {
        yPercent: -speed * 100, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  root.classList.add('motion-ready');
}

// Start after the page has loaded: the motion libraries never compete with the first paint (LCP).
const start = () => init().catch(() => root.classList.remove('motion'));
if (reduce) {
  root.classList.remove('motion');
} else if (document.readyState === 'complete') {
  start();
} else {
  window.addEventListener('load', start, { once: true });
}
