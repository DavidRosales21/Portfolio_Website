import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';

export default defineConfig({
  site: site.url,
  // Folder URLs with a trailing slash (/projects/studia-notes/): every static host serves them natively,
  // GitHub Pages included (a projects.html next to a projects/ folder is ambiguous there).
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Sitemap: src/pages/sitemap.xml.ts (bilingual, translated slugs, hreflang) instead of @astrojs/sitemap
});
