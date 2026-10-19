/**
 * Automatic tracking for every page — no per-element setup needed for the standard events.
 * Optional attributes:
 *   data-track-cta="Label"         → click_cta with cta_label
 *   data-track-location="header"   → adds `location` to clicks inside that element
 *   data-track-section="services"  → section_view when 50% visible
 */
import { track } from './track';

const DOWNLOAD_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|csv|txt|mp3|mp4)$/i;

function locationOf(el: Element) {
  return el.closest<HTMLElement>('[data-track-location]')?.dataset.trackLocation ?? 'content';
}

// ---- Clicks (event delegation) ----
document.addEventListener('click', (e) => {
  const target = e.target as Element | null;
  const el = target?.closest<HTMLElement>('a, button');
  if (!el) return;
  const location = locationOf(el);

  if (el.dataset.trackCta) {
    track('click_cta', { cta_label: el.dataset.trackCta, location });
  }

  if (!(el instanceof HTMLAnchorElement) || !el.href) return;
  const href = el.href;
  const url = new URL(href, window.location.href);

  if (href.startsWith('tel:')) return track('click_call', { location });
  if (href.startsWith('mailto:')) return track('click_email', { location });
  if (/wa\.me|whatsapp\.com/.test(url.hostname)) return track('click_whatsapp', { location });
  if (/google\.[^/]+\/maps|maps\.app\.goo\.gl|maps\.google\./.test(href)) return track('click_directions', { location });
  if (DOWNLOAD_RE.test(url.pathname)) return track('file_download', { file_name: url.pathname.split('/').pop(), location });
  if (url.origin !== window.location.origin && url.protocol.startsWith('http')) {
    return track('outbound_click', { link_url: href, link_domain: url.hostname, location });
  }
}, { capture: true });

// ---- Form start (first interaction per form) ----
const startedForms = new WeakSet<HTMLFormElement>();
document.addEventListener('focusin', (e) => {
  const form = (e.target as Element | null)?.closest('form');
  if (!form || startedForms.has(form)) return;
  startedForms.add(form);
  track('form_start', { form_id: form.id || form.getAttribute('name') || 'form' });
});

// ---- Scroll depth: 25 / 50 / 75 / 100 ----
const marks = [25, 50, 75, 100];
const reached = new Set<number>();
let ticking = false;
function checkScroll() {
  ticking = false;
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const pct = max <= 0 ? 100 : (window.scrollY / max) * 100;
  for (const m of marks) {
    if (pct >= m - 1 && !reached.has(m)) {
      reached.add(m);
      track('scroll_depth', { percent: m });
    }
  }
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(checkScroll); }
}, { passive: true });

// ---- Section views ----
const sections = document.querySelectorAll<HTMLElement>('[data-track-section]');
if (sections.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      track('section_view', { section: (entry.target as HTMLElement).dataset.trackSection });
      io.unobserve(entry.target);
    }
  }, { threshold: 0.5 });
  sections.forEach((s) => io.observe(s));
}

// ---- Video ----
document.addEventListener('play', (e) => {
  const v = e.target;
  if (v instanceof HTMLVideoElement) track('video_play', { video: v.dataset.name || v.currentSrc.split('/').pop() });
}, true);
document.addEventListener('ended', (e) => {
  const v = e.target;
  if (v instanceof HTMLVideoElement) track('video_complete', { video: v.dataset.name || v.currentSrc.split('/').pop() });
}, true);
