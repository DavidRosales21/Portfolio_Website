/**
 * Lighthouse speed/SEO/accessibility scores, mobile + desktop.
 *   npm run lighthouse                      → tests this site (builds + local preview)
 *   npm run lighthouse -- https://site.com  → tests any live site (e.g. the client's OLD site for baseline.md)
 * HTML + JSON reports are saved to ../lighthouse/ (the client folder). Needs Chrome installed.
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2];
const outDir = join('..', 'lighthouse');
mkdirSync(outDir, { recursive: true });

let server;
let url = target;

if (!url) {
  if (!existsSync('dist')) execSync('npx astro build', { stdio: 'inherit' });
  server = spawn('npx astro preview --port 4322', { shell: true, stdio: 'ignore' });
  url = 'http://localhost:4322/';
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* not ready yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
}

const host = new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '_');
const date = new Date().toISOString().slice(0, 10);
const rows = [];

try {
  for (const device of ['mobile', 'desktop']) {
    const base = join(outDir, `${date}-${host}-${device}`);
    const preset = device === 'desktop' ? '--preset=desktop' : '';
    console.log(`\n▶ Lighthouse ${device}: ${url}`);
    execSync(
      `npx -y lighthouse@latest "${url}" ${preset} --output=html --output=json --output-path="${base}" ` +
      `--only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless=new"`,
      { stdio: 'inherit' },
    );
    const r = JSON.parse(readFileSync(`${base}.report.json`, 'utf8'));
    const score = (k) => Math.round((r.categories[k]?.score ?? 0) * 100);
    const audit = (k) => r.audits[k]?.displayValue ?? '–';
    rows.push({
      device,
      Performance: score('performance'),
      Accessibility: score('accessibility'),
      'Best practices': score('best-practices'),
      SEO: score('seo'),
      LCP: audit('largest-contentful-paint'),
      CLS: audit('cumulative-layout-shift'),
      TBT: audit('total-blocking-time'),
    });
  }
} finally {
  if (server) {
    if (process.platform === 'win32') execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' });
    else server.kill();
  }
}

console.log(`\nResults for ${url} (${date}) — reports in ${outDir}`);
console.table(rows);
console.log('Targets (CLAUDE.md §11): Performance ≥ 90 · Accessibility ≥ 95 · Best practices 100 · SEO 100 · LCP < 2.5 s · CLS < 0.1');
