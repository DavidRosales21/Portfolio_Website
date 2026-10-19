import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';

export default defineConfig({
  site: site.url,
  // Clean URLs without trailing slash: /projects/studia-notes
  trailingSlash: 'never',
  build: { format: 'file' },
  // Sitemap: src/pages/sitemap.xml.ts (bilingual, translated slugs, hreflang) instead of @astrojs/sitemap
});
