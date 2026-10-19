/**
 * Consent management (Google Consent Mode v2 + Microsoft Clarity).
 * - GA4 is always loaded; with consent denied it only sends cookieless pings.
 * - Clarity (recordings/heatmaps) loads only after consent when consent is required.
 * Config comes from data attributes on <html> (set in BaseLayout from site.ts).
 */
const KEY = 'consent';
const root = document.documentElement;
const clarityId = root.dataset.clarity || '';
const required = root.dataset.consentRequired === 'true';

function getChoice(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function saveChoice(v: 'granted' | 'denied') {
  try { localStorage.setItem(KEY, v); } catch { /* storage blocked */ }
}

let clarityLoaded = false;
function loadClarity() {
  if (!clarityId || clarityLoaded) return;
  clarityLoaded = true;
  const w = window as any;
  w.clarity = w.clarity || function (...args: unknown[]) { (w.clarity.q = w.clarity.q || []).push(args); };
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${clarityId}`;
  document.head.appendChild(s);
}

function apply(v: 'granted' | 'denied') {
  window.gtag?.('consent', 'update', { analytics_storage: v });
  if (v === 'granted') {
    loadClarity();
    window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  } else {
    window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
  }
}

const banner = document.getElementById('consent');

function show() { if (banner) banner.hidden = false; }
function hide() { if (banner) banner.hidden = true; }

const choice = getChoice();
if (!required) {
  loadClarity();
} else if (choice === 'granted' || choice === 'denied') {
  apply(choice);
} else {
  show();
}

banner?.querySelector('[data-consent="accept"]')?.addEventListener('click', () => {
  saveChoice('granted'); apply('granted'); hide();
});
banner?.querySelector('[data-consent="decline"]')?.addEventListener('click', () => {
  saveChoice('denied'); apply('denied'); hide();
});
document.querySelectorAll('[data-consent-open]').forEach((el) =>
  el.addEventListener('click', () => { show(); banner?.querySelector<HTMLElement>('button')?.focus(); }),
);
