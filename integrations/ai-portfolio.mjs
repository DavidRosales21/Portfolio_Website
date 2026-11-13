/**
 * "Portfolio for AI" — after every build, turns the built pages into ONE Markdown file per language
 * (dist/David-Rosales-Portfolio-for-AI.md, dist/David-Rosales-Portafolio-para-IA.md) that a recruiter can
 * download and upload to ChatGPT / Claude / Gemini / Copilot to ask about David.
 * Built from dist/, so it always says exactly what the site says (nothing to keep in sync by hand).
 *
 * Skipped from each page: navigation, breadcrumbs, "On this page" indexes, buttons, images, decorative
 * (aria-hidden) and visually-hidden bits, final "let's talk" CTAs, and anything marked data-ai-skip.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse, NodeType } from 'node-html-parser';

const SKIP_TAGS = new Set(['script', 'style', 'svg', 'button', 'form', 'dialog', 'template', 'noscript', 'img', 'picture', 'source', 'video', 'iframe', 'input', 'select', 'textarea', 'nav']);
const BLOCK_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'dl', 'table', 'blockquote', 'figure', 'figcaption', 'details', 'pre', 'hr', 'div', 'section', 'article', 'header', 'footer', 'aside', 'main', 'li', 'dt', 'dd', 'summary', 'caption']);

const clean = (s) => s.replace(/\s+/g, ' ').trim();

function skip(el) {
  if (el.nodeType !== NodeType.ELEMENT_NODE) return false;
  const tag = el.rawTagName?.toLowerCase();
  if (SKIP_TAGS.has(tag)) return true;
  if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden') || el.hasAttribute('data-ai-skip')) return true;
  if (el.getAttribute('data-track-location') === 'final_cta') return true;
  const cls = ` ${el.getAttribute('class') ?? ''} `;
  return / (visually-hidden|resume-tools|breadcrumbs|jump|lang-hint) /.test(cls);
}

function inline(node, base) {
  if (node.nodeType === NodeType.TEXT_NODE) return node.text;
  if (node.nodeType !== NodeType.ELEMENT_NODE || skip(node)) return '';
  const tag = node.rawTagName.toLowerCase();
  const inner = () => node.childNodes.map((n) => inline(n, base)).join('');
  if (tag === 'br') return ' ';
  if (/\bresume__dates\b/.test(node.getAttribute('class') ?? '')) return ` · ${clean(inner())}`;
  if (tag === 'strong' || tag === 'b') { const t = clean(inner()); return t ? `**${t}**` : ''; }
  if (tag === 'em' || tag === 'i') { const t = clean(inner()); return t ? `_${t}_` : ''; }
  if (tag === 'code') return `\`${clean(inner())}\``;
  if (tag === 'a') {
    const text = clean(inner());
    const href = node.getAttribute('href') ?? '';
    if (!href || href.startsWith('#')) return text;
    const url = href.startsWith('mailto:') ? href : new URL(href, base).href;
    return text ? `[${text}](${url})` : url;
  }
  return inner();
}

/** True when an element holds only inline content (text, links, spans…). */
const isInlineOnly = (el) => el.childNodes.every((n) => n.nodeType !== NodeType.ELEMENT_NODE || skip(n) || !BLOCK_TAGS.has(n.rawTagName.toLowerCase()));

function blocks(node, base, ctx = { depth: 0, inItem: false }) {
  const out = [];
  if (node.nodeType === NodeType.TEXT_NODE) { const t = clean(node.text); if (t) out.push(t); return out; }
  if (node.nodeType !== NodeType.ELEMENT_NODE || skip(node)) return out;
  const tag = node.rawTagName.toLowerCase();
  const text = () => clean(inline(node, base));

  const h = /^h([1-6])$/.exec(tag);
  if (h) {
    const t = text();
    if (t) out.push(ctx.inItem ? `**${t}**` : `${'#'.repeat(Math.min(Number(h[1]) + 1, 6))} ${t}`);
    return out;
  }
  if (['p', 'figcaption', 'caption', 'summary'].includes(tag)) { const t = text(); if (t) out.push(tag === 'summary' ? `**${t}**` : t); return out; }
  if (tag === 'hr') return out;
  if (tag === 'ul' || tag === 'ol') {
    let i = 0;
    const items = node.childNodes.filter((n) => n.nodeType === NodeType.ELEMENT_NODE && n.rawTagName.toLowerCase() === 'li' && !skip(n));
    const lines = items.map((li) => {
      let t, nested = '';
      if (isInlineOnly(li)) t = clean(inline(li, base));
      else {
        const parts = blocks(li, base, { ...ctx, inItem: true });
        const isList = (b) => /^(- |\d+\. )/.test(b);
        t = parts.filter((b) => !isList(b)).join(' — ');
        nested = parts.filter(isList).map((b) => '\n' + b.split('\n').map((l) => `  ${l}`).join('\n')).join('');
      }
      return t || nested ? `${tag === 'ol' ? `${++i}.` : '-'} ${t}${nested}` : '';
    }).filter(Boolean);
    if (lines.length) out.push(lines.join('\n'));
    return out;
  }
  if (tag === 'dl') {
    const lines = [];
    let term = '';
    const visit = (el) => {
      for (const n of el.childNodes) {
        if (n.nodeType !== NodeType.ELEMENT_NODE || skip(n)) continue;
        const t = n.rawTagName.toLowerCase();
        if (t === 'dt') term = clean(inline(n, base));
        else if (t === 'dd') lines.push(`- **${term}:** ${isInlineOnly(n) ? clean(inline(n, base)) : blocks(n, base, { ...ctx, inItem: true }).join(' ')}`);
        else visit(n); // <div><dt/><dd/></div>
      }
    };
    visit(node);
    if (lines.length) out.push(lines.join('\n'));
    return out;
  }
  if (tag === 'table') {
    const rows = node.querySelectorAll('tr').map((tr) => tr.querySelectorAll('th, td').map((c) => clean(inline(c, base)).replace(/\|/g, '\\|')));
    if (rows.length) {
      const [head, ...body] = rows;
      out.push([`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...body.map((r) => `| ${r.join(' | ')} |`)].join('\n'));
    }
    return out;
  }
  if (tag === 'pre') { out.push('```\n' + node.text.trim() + '\n```'); return out; }
  if (tag === 'blockquote') { const t = blocks(node, base, ctx).join('\n\n'); if (t) out.push(t.split('\n').map((l) => `> ${l}`).join('\n')); return out; }

  // A row of buttons (.cluster): one line of links
  if (/\bcluster\b/.test(node.getAttribute('class') ?? '') && isInlineOnly(node)) {
    const links = node.querySelectorAll('a').filter((a) => !skip(a)).map((a) => inline(a, base)).filter(Boolean);
    if (links.length) out.push(links.join(' · '));
    return out;
  }

  // Containers: runs of inline content become one paragraph; block children recurse
  let run = '';
  const flush = () => { const t = clean(run); if (t) out.push(t); run = ''; };
  for (const n of node.childNodes) {
    const isBlock = n.nodeType === NodeType.ELEMENT_NODE && !skip(n) && BLOCK_TAGS.has(n.rawTagName.toLowerCase());
    if (isBlock) { flush(); out.push(...blocks(n, base, ctx)); }
    else run += inline(n, base);
  }
  flush();
  return out;
}

async function pageToMarkdown(dist, siteUrl, path) {
  const file = join(dist, path, 'index.html');
  const root = parse(await readFile(file, 'utf8'));
  const main = root.querySelector('main');
  if (!main) throw new Error(`ai-portfolio: no <main> in ${file}`);
  const base = new URL(path, siteUrl).href;
  return `Source: ${base}\n\n${blocks(main, base).join('\n\n')}`;
}

/**
 * @param {{ siteUrl: string, docs: { lang: string, file: string, header: string, pages: string[], footer: string }[] }} options
 */
export default function aiPortfolio({ siteUrl, docs }) {
  return {
    name: 'ai-portfolio',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        for (const doc of docs) {
          const parts = [];
          for (const path of doc.pages) parts.push(await pageToMarkdown(dist, siteUrl, path));
          const body = `${doc.header.trim()}\n\n---\n\n${parts.join('\n\n---\n\n')}\n\n---\n\n${doc.footer.trim()}\n`;
          await writeFile(join(dist, doc.file.replace(/^\//, '')), body, 'utf8');
          logger.info(`${doc.file} (${Math.round(body.length / 1024)} KB, ${doc.pages.length} pages)`);
        }
      },
    },
  };
}
