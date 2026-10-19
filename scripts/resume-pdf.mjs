/**
 * Résumé PDFs from the résumé pages — one source of truth (site.ts), so the PDF and the web never disagree.
 *   npm run resume:pdf   → builds, serves dist/ locally, prints /resume and /es/curriculum with headless Chrome
 * Output: public/David-Rosales-Resume.pdf + public/David-Rosales-CV-ES.pdf (also copied into dist/).
 * Print layout (one page, Letter, ATS-friendly) lives in src/views/ResumeView.astro. Needs Chrome or Edge
 * (set CHROME_PATH to override).
 */
import { execFile, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) { console.error('Chrome/Edge not found. Set CHROME_PATH.'); process.exit(1); }

execSync('npx astro build', { stdio: 'inherit' });

const DIST = resolve('dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/') path = '/index';
  let file = join(DIST, path);
  if (!extname(path)) file += '.html'; // clean URLs (build.format: 'file')
  if (!file.startsWith(DIST) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r)); // any free port
const base = `http://localhost:${server.address().port}`;

const jobs = [
  { url: `${base}/resume`, out: 'David-Rosales-Resume.pdf' },
  { url: `${base}/es/curriculum`, out: 'David-Rosales-CV-ES.pdf' },
];
try {
  for (const job of jobs) {
    const out = resolve('public', job.out);
    // Own throwaway profile: otherwise an already-open Chrome takes the command and nothing is printed
    // async: the local server below runs in this same process and must keep answering while Chrome loads the page
    await promisify(execFile)(chrome, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${join(tmpdir(), 'resume-pdf-chrome')}`, `--print-to-pdf=${out}`, job.url]);
    copyFileSync(out, join(DIST, job.out));
    console.log(`✔ ${job.out}`);
  }
} finally {
  server.close();
}
