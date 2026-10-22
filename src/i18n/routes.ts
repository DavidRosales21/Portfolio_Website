/**
 * Bilingual URL map. English lives at the root (main language), Spanish under /es (client-intake A8).
 * Slugs are translated per language; every URL ends in "/" (astro.config: trailingSlash 'always'). Every page is listed here, so the language switcher,
 * hreflang, sitemap and internal links all come from one place.
 */
export type Lang = 'en' | 'es';
export const langs: Lang[] = ['en', 'es'];
export const defaultLang: Lang = 'en';
export type L<T = string> = Record<Lang, T>;

export const routes = {
  home: { en: '/', es: '/es/' },
  projects: { en: '/projects/', es: '/es/proyectos/' },
  about: { en: '/about/', es: '/es/sobre-mi/' },
  resume: { en: '/resume/', es: '/es/curriculum/' },
  blog: { en: '/blog/', es: '/es/blog/' },
  contact: { en: '/contact/', es: '/es/contacto/' },
  privacy: { en: '/privacy/', es: '/es/privacidad/' },
  // Utility pages (noindex)
  recommend: { en: '/recommend/', es: '/es/recomendar/' },
  thanks: { en: '/thank-you/', es: '/es/gracias/' },
} as const satisfies Record<string, L>;

export type RouteKey = keyof typeof routes;

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'es' : 'en');

export function langFromPath(pathname: string): Lang {
  return pathname === '/es' || pathname.startsWith('/es/') ? 'es' : 'en';
}

/** Sub-page (project, blog post) under a section route. */
export const childPath = (section: RouteKey, lang: Lang, slug: string) => `${routes[section][lang]}${slug}/`;
