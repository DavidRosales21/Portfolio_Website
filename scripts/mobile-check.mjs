/**
 * Mobile UX check (CLAUDE.md §6.1): every page in the sitemap, on two phones (360×780 and 390×844).
 *   npm run build && npm run mobile                  → every sitemap page of dist/ (served by this script)
 *   npm run mobile -- / /pricing                     → only these paths
 *   SITE_URL=http://localhost:4321 npm run mobile    → a running server instead (dev, preview or a live site)
 * Needs a local Chrome (CHROME_PATH to override). Exit code 1 when a hard rule fails.
 *
 * Hard rules (✖): no horizontal scroll · page length within budget (at 390×844) · running text ≥ 16px ·
 * no text under 12px · no tap target under 24px · fixed bars ≤ 25% of the screen.
 * Budgets: home 10 screens, other pages 8; ×1.5 when the page has a sticky "On this page" index (`data-toc`).
 * Warnings (⚠): secondary text under 14px · tap targets under 44px · a section longer than 1.5 screens ·
 * no primary action in the first screen · long legal page without an index ·
 * a one-time notice (consent, language hint — mark it `data-mobile-transient`) taller than 12% of the screen.
 * Mark an element `data-mobile-ok` to skip it (say why in a comment next to it).
 */
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

// No SITE_URL → serve dist/ on a free port (same URL rules as the static hosts: /a → a.html or a/index.html)
let server;
if (!process.env.SITE_URL) {
  if (!existsSync('dist')) { console.error('No dist/ — run `npm run build` first (or set SITE_URL).'); process.exit(1); }
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon', '.pdf': 'application/pdf' };
  const file = (p) => [p, `${p}.html`, join(p, 'index.html')].find((f) => existsSync(f) && statSync(f).isFile());
  server = createServer((req, res) => {
    const found = file(join('dist', decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    const f = found ?? join('dist', '404.html');
    res.writeHead(found ? 200 : 404, { 'content-type': types[extname(f)] ?? 'application/octet-stream' });
    res.end(existsSync(f) ? readFileSync(f) : 'Not found');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
}
const BASE = (process.env.SITE_URL ?? `http://127.0.0.1:${server.address().port}`).replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH ?? ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => existsSync(p));
// Budgets in "screens" = page height ÷ viewport height, measured at 390×844
const BUDGET = { home: 10, page: 8, indexed: 1.5, section: 1.5, fixedBars: 0.25, notice: 0.12 }; // indexed: × budget for a page with a sticky "On this page" index ([data-toc])
const LONG_FORM = /privac|terminos|terms|legal|cookies|reembolso|refund|\/blog\/./; // long text by nature: no length limit, but an index past 4 screens
const SIZES = [{ w: 360, h: 780 }, { w: 390, h: 844 }];

let paths = process.argv.slice(2);
if (!paths.length) {
  const locsOf = async (url) => [...(await (await fetch(url)).text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, BASE));
  let locs = await locsOf(BASE + '/sitemap.xml').catch(() => []);
  if (!locs.length) locs = await locsOf(BASE + '/sitemap-index.xml');
  if (locs.some((l) => /sitemap-\d+\.xml$/.test(l))) locs = (await Promise.all(locs.map(locsOf))).flat();
  paths = locs.map((l) => new URL(l).pathname);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = new Set(), warnings = new Set(), rows = [];
for (const path of paths) {
  for (const s of SIZES) {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setViewport({ width: s.w, height: s.h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle0' });
    if (res.status() >= 400) { errors.add(`${path}: HTTP ${res.status()}`); await page.close(); continue; }
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
    await new Promise((r) => setTimeout(r, 250));
    const m = await page.evaluate(() => {
      const vh = innerHeight, vw = innerWidth;
      const skip = (el) => el.closest('[hidden], [aria-hidden="true"], dialog:not([open]), svg, [data-mobile-ok], .visually-hidden, .sr-only');
      const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.opacity !== '0' && !skip(el); };
      const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('href') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 36);
      const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();

      // Length: the page and each top-level section of <main>
      const main = document.querySelector('main') ?? document.body;
      const sections = [...main.querySelectorAll('section')].filter((el) => !el.parentElement.closest('main section'))
        .map((el) => ({ h: el.getBoundingClientRect().height / vh, heading: (el.querySelector('h1, h2, h3')?.textContent || el.className).trim().replace(/\s+/g, ' ').slice(0, 40), nav: !!el.querySelector('details, nav, [role=tablist], .swipe, [class*="swipe"]') }));

      // Text sizes: running text (sentences) ≥ 16px, secondary ≥ 14px, nothing < 12px
      const running = [], secondary = [], tiny = [];
      for (const el of document.querySelectorAll('body *')) {
        const txt = ownText(el);
        if (txt.length < 2 || !visible(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        const sample = `${+fs.toFixed(1)}px “${txt.slice(0, 28)}”`;
        const block = el.closest('p, li, dd, blockquote, td, figcaption') ?? el;
        if (fs < 12) tiny.push(sample);
        else if (fs < 16 && block.textContent.replace(/\s+/g, ' ').trim().length > 80 && !el.closest('nav, button, label, figcaption, small, code, pre, table')) running.push(sample);
        else if (fs < 14 && getComputedStyle(el).textTransform !== 'uppercase') secondary.push(sample);
      }

      // Tap targets (links inside running text are exempt, as in WCAG 2.5.8). A link stretched over its card (::after inset 0) counts as the card.
      const small = [], tooSmall = [];
      for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]')) {
        if (!visible(el)) continue;
        const p = el.parentElement;
        if (getComputedStyle(el).display === 'inline' && p && /^(P|LI|DD|TD|SPAN|SMALL|LABEL|BLOCKQUOTE)$/.test(p.tagName) && ownText(p).length > 15) continue;
        // A checkbox or radio inside its <label> is tapped through the label
        let r = (el.matches('input[type=checkbox], input[type=radio]') && el.closest('label') ? el.closest('label') : el).getBoundingClientRect();
        const after = getComputedStyle(el, '::after');
        if (after.content !== 'none' && after.position === 'absolute') { let c = el.parentElement; while (c && getComputedStyle(c).position === 'static') c = c.parentElement; if (c) r = c.getBoundingClientRect(); }
        if (r.width < 24 || r.height < 24) tooSmall.push(`${Math.round(r.width)}×${Math.round(r.height)} ${label(el)}`);
        else if (r.width < 44 || r.height < 44) small.push(`${Math.round(r.width)}×${Math.round(r.height)} ${label(el)}`);
      }

      // Primary action fully visible in the first screen
      const ctas = [...document.querySelectorAll('[data-track-cta], .btn, .button, a[href^="tel:"], [data-cta]')]
        .filter((el) => { if (!visible(el)) return false; const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= vh; });

      // Fixed and sticky bars on the first screen. One-time notices (cookie consent, language hint: data-mobile-transient) are counted apart.
      const bars = [...document.querySelectorAll('body *')].filter((el) => { const cs = getComputedStyle(el); if (!['fixed', 'sticky'].includes(cs.position) || !visible(el)) return false; const r = el.getBoundingClientRect(); return r.height < vh * 0.9 && r.bottom > 0 && r.top < vh; });
      const fixed = bars.filter((el) => !el.closest('[data-mobile-transient]'));
      const transient = bars.filter((el) => el.matches('[data-mobile-transient]')).map((el) => ({ name: el.className.toString().split(' ')[0], h: el.getBoundingClientRect().height }));
      const covered = fixed.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0) / vh;

      return {
        screens: document.documentElement.scrollHeight / vh, overflow: document.documentElement.scrollWidth - vw, sections, running, secondary, tiny, small, tooSmall,
        cta: ctas.length, covered, transient, fixed: fixed.map((el) => `${el.tagName.toLowerCase()}.${el.className.toString().split(' ')[0]} ${Math.round(el.getBoundingClientRect().height)}px`),
        index: !!document.querySelector('[data-toc]'), anyIndex: !!main.querySelector('nav, [data-toc], .toc'), menu: !!document.querySelector('header button[aria-expanded], header [aria-controls], header [data-menu-open]'),
      };
    });
    const isHome = /^\/([a-z]{2}\/?)?(index\.html)?$/.test(path);
    const longForm = LONG_FORM.test(path);
    const tag = `${path} @${s.w}`;
    const list = (a) => `${a.length} — ${a.slice(0, 3).join(' · ')}`;
    if (m.overflow > 0) errors.add(`${tag}: horizontal scroll (${m.overflow}px wider than the screen)`);
    if (s.w === 390 && !longForm) {
      const limit = (isHome ? BUDGET.home : BUDGET.page) * (m.index ? BUDGET.indexed : 1);
      if (m.screens > limit) errors.add(`${path}: ${m.screens.toFixed(1)} screens long (budget ${limit})`);
      else if (m.screens > limit * 0.85) warnings.add(`${path}: ${m.screens.toFixed(1)} screens long (close to the ${limit} budget)`);
      for (const sec of m.sections) if (sec.h > BUDGET.section && !sec.nav) warnings.add(`${path}: section “${sec.heading}” is ${sec.h.toFixed(1)} screens — compact it on phones`);
    }
    if (longForm && m.screens > 4 && !m.anyIndex) warnings.add(`${path}: long page without an index`);
    if (m.running.length) errors.add(`${tag}: running text under 16px: ${list(m.running)}`);
    if (m.tiny.length) errors.add(`${tag}: text under 12px: ${list(m.tiny)}`);
    if (m.secondary.length) warnings.add(`${tag}: secondary text under 14px: ${list(m.secondary)}`);
    if (m.tooSmall.length) errors.add(`${tag}: tap targets under 24px: ${list(m.tooSmall)}`);
    if (m.small.length) warnings.add(`${tag}: tap targets under 44px: ${list(m.small)}`);
    if (!m.cta && !longForm) warnings.add(`${tag}: no primary action in the first screen`);
    if (m.covered > BUDGET.fixedBars) errors.add(`${tag}: fixed bars cover ${(m.covered * 100).toFixed(0)}% of the screen (${m.fixed.join(', ')})`);
    for (const t of m.transient) if (t.h > BUDGET.notice * s.h) warnings.add(`${tag}: notice “${t.name}” is ${Math.round(t.h)}px tall — keep one-time notices to one or two lines on phones`);
    if (!m.menu) warnings.add(`${tag}: no menu button in the header`);
    if (s.w === 390) rows.push({ path, screens: +m.screens.toFixed(1), 'longest section': +Math.max(0, ...m.sections.map((x) => x.h)).toFixed(1), 'CTA in 1st screen': m.cta > 0 ? 'yes' : 'NO', 'bars %': Math.round(m.covered * 100) });
    await page.close();
  }
}
await browser.close();
server?.close();
console.table(rows);
if (warnings.size) console.log(`\n⚠ ${[...warnings].join('\n⚠ ')}`);
if (errors.size) console.log(`\n✖ ${[...errors].join('\n✖ ')}`);
console.log(`\nMobile check: ${paths.length} pages · ${errors.size} errors · ${warnings.size} warnings`);
process.exit(errors.size ? 1 : 0);
