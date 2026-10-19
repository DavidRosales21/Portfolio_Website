import type { APIRoute } from 'astro';
import { absoluteUrl } from '../config/site';
import { allPages } from '../lib/pages';

// Bilingual sitemap with hreflang alternates. Built here instead of @astrojs/sitemap because slugs are translated.
// Only indexable pages (no thank-you / recommend, no blog while it's empty).
export const GET: APIRoute = () => {
  const pages = allPages().filter((p) => p.indexable);
  const urls = pages.map((p) => {
    const alts = Object.entries(p.alternates)
      .map(([lang, path]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${absoluteUrl(path)}"/>`)
      .join('\n');
    const xDefault = p.alternates.en ? `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(p.alternates.en)}"/>` : '';
    return `  <url>\n    <loc>${absoluteUrl(p.path)}</loc>\n${alts}${xDefault}\n  </url>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
