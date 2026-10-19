import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { routes } from '../i18n/routes';

// AI crawlers are explicitly welcome (CLAUDE.md §10). Utility pages stay out of the index.
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot'];
const hidden = [routes.thanks.en, routes.thanks.es];

export const GET: APIRoute = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    ...hidden.map((p) => `Disallow: ${p}`),
    '',
    ...aiBots.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${site.url}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
