/**
 * QA check over the built site (dist/). Run with: npm run qa
 * Checks every page against the studio SEO/accessibility rules (CLAUDE.md §8, §12, §19)
 * and the UI-state rules that can be automated (UI-STATES-PROTOCOL.md): no sticky hover, no empty lists.
 * Exit code 1 if any ERROR is found.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
if (!existsSync(DIST)) { console.error('No dist/ folder. Run `npm run build` first.'); process.exit(1); }

const files = [], cssFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) files.push(p);
    else if (p.endsWith('.css')) cssFiles.push(p);
  }
})(DIST);

let errors = 0, warnings = 0;
const err = (page, msg) => { errors++; console.log(`  ✖ ERROR  ${msg}`); };
const warn = (page, msg) => { warnings++; console.log(`  ⚠ warn   ${msg}`); };
const attr = (tag, name) => tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))?.[1];
const css = cssFiles.map((f) => readFileSync(f, 'utf8'));

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(DIST, file).replace(/\\/g, '/');
  console.log(`\n${page}`);
  const noindex = /<meta name="robots" content="noindex/i.test(html);

  if (!/<html[^>]+lang=/i.test(html)) err(page, 'Missing <html lang>');

  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  if (!title) err(page, 'Missing <title>');
  else if (!noindex && (title.length < 30 || title.length > 65)) warn(page, `Title length ${title.length} (aim 50–60): "${title}"`);

  const descTag = html.match(/<meta name="description"[^>]*>/i)?.[0];
  const desc = descTag && attr(descTag, 'content');
  if (!desc) err(page, 'Missing meta description');
  else if (!noindex && (desc.length < 120 || desc.length > 165)) warn(page, `Description length ${desc.length} (aim 140–160)`);

  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) err(page, `Found ${h1s} <h1> (must be exactly 1)`);

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/i)?.[1];
  if (!canonical) err(page, 'Missing canonical');
  else if (/\.html$|\/index$/.test(canonical)) err(page, `Canonical is not a clean URL: ${canonical}`);
  if (!/property="og:image"/i.test(html)) err(page, 'Missing og:image');

  for (const img of html.match(/<img\b[^>]*>/gi) || []) {
    if (!/\balt=/i.test(img)) err(page, `Image without alt: ${img.slice(0, 80)}`);
    if (!/\bwidth=/i.test(img) || !/\bheight=/i.test(img)) warn(page, `Image without width/height (layout shift): ${img.slice(0, 80)}`);
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch { err(page, 'Invalid JSON-LD'); }
  }

  // UI states E1: a list with nothing in it is either hidden or replaced by an empty state
  for (const m of html.matchAll(/<(ul|ol|dl)\b[^>]*>\s*<\/\1>/gi)) {
    err(page, `Empty <${m[1]}> — hide the block or show an empty state (UI-STATES-PROTOCOL.md §4): ${m[0].slice(0, 80)}`);
  }
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) css.push(m[1]); // Astro inlines small stylesheets

  const todos = (html.match(/\[TODO[^\]]*\]/g) || []).length;
  if (todos) warn(page, `${todos} [TODO] placeholder(s) left — must be 0 before delivery`);
  // Example testimonials must never be published (fake reviews are illegal + against Google policy)
  const examples = (html.match(/\[EXAMPLE[^\]]*\]/g) || []).length;
  if (examples) err(page, `${examples} [EXAMPLE] placeholder(s) — replace with real content before launch`);
}

// UI states H1: hover only with a mouse. A bare :hover stays "stuck" after a tap on phones and tablets.
const sticky = new Set(css.flatMap(bareHover));
if (sticky.size) {
  console.log('\nCSS');
  for (const sel of sticky) err('css', `:hover outside @media (hover: hover) — sticks after a tap on touch screens: ${sel.slice(0, 120)}`);
}

for (const f of ['robots.txt', 'llms.txt', '404.html', 'favicon.svg', 'og-default.png', '_headers']) {
  if (!existsSync(join(DIST, f))) { errors++; console.log(`\n✖ ERROR  Missing /${f}`); }
}
// @astrojs/sitemap writes sitemap-index.xml; bilingual sites with translated slugs generate their own sitemap.xml
if (!['sitemap-index.xml', 'sitemap.xml'].some((f) => existsSync(join(DIST, f)))) {
  errors++; console.log('\n✖ ERROR  Missing /sitemap.xml (or /sitemap-index.xml)');
}

console.log(`\n${files.length} pages checked — ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);

/** Selectors with :hover that are not inside an @media (hover: hover) / (any-hover: hover) block. */
function bareHover(text) {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = [], stack = [];
  let buf = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") { // skip strings (content: '…', url("…"))
      const end = src.indexOf(c, i + 1);
      if (end < 0) break;
      buf += src.slice(i, end + 1);
      i = end;
    } else if (c === '{') {
      const prelude = buf.trim();
      const mouseOnly = stack.some((p) => /\(\s*(any-)?hover\s*:\s*hover\s*\)/.test(p));
      if (!prelude.startsWith('@') && prelude.includes(':hover') && !mouseOnly) found.push(prelude);
      stack.push(prelude);
      buf = '';
    } else if (c === '}') { stack.pop(); buf = ''; }
    else if (c === ';') buf = '';
    else buf += c;
  }
  return found;
}
