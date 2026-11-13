import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';
import aiPortfolio from './integrations/ai-portfolio.mjs';
import { aiDocs } from './src/lib/ai-portfolio.ts';

export default defineConfig({
  site: site.url,
  // Folder URLs with a trailing slash (/projects/studia-notes/): every static host serves them natively,
  // GitHub Pages included (a projects.html next to a projects/ folder is ambiguous there).
  trailingSlash: 'always',
  build: { format: 'directory' },
  // One-file portfolio for recruiters who screen with AI, written from the built pages (src/lib/ai-portfolio.ts)
  integrations: [aiPortfolio({ siteUrl: site.url, docs: aiDocs() })],
  // Sitemap: src/pages/sitemap.xml.ts (bilingual, translated slugs, hreflang) instead of @astrojs/sitemap
});
