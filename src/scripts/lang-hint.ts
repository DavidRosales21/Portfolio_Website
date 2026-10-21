/**
 * Shows the LangHint when the visitor's browser prefers the other language
 * (e.g. Spanish browser on an English page). Once dismissed or used, it never shows again on this device.
 * Desktop: right away, top right (covers nothing). Phones: after the first 240px of scroll, above the action bar.
 */
const hint = document.querySelector<HTMLElement>('[data-lang-hint]');
const KEY = 'lang-hint-dismissed';

function dismissed() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}
function remember() {
  try { localStorage.setItem(KEY, '1'); } catch { /* storage blocked: the hint simply may show again */ }
}

if (hint && !dismissed()) {
  const target = hint.dataset.langHint; // the language the hint offers
  const prefs = (navigator.languages?.length ? navigator.languages : [navigator.language]).map((l) => l.toLowerCase());
  const wantsSpanish = prefs.some((l) => l.startsWith('es'));
  const show = target === 'es' ? wantsSpanish : !wantsSpanish;
  if (show) {
    const open = () => {
      hint.hidden = false;
      hint.querySelector('[data-lang-hint-close]')?.addEventListener('click', () => { remember(); hint.hidden = true; });
      hint.querySelector('a')?.addEventListener('click', remember);
    };
    // Phones: the hint sits at the bottom, where the hero buttons are on first load — wait until the visitor scrolls past them.
    if (window.matchMedia('(max-width: 767px)').matches && window.scrollY < 240) {
      const onScroll = () => { if (window.scrollY >= 240) { window.removeEventListener('scroll', onScroll); open(); } };
      window.addEventListener('scroll', onScroll, { passive: true });
    } else {
      open();
    }
  }
}
