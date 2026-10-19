/**
 * Every page of the site, in both languages. Used by the router (pages/[...path].astro),
 * sitemap.xml and the nav, so a page can never exist without being listed (or vice versa).
 */
import { site } from '../config/site';
import { childPath, langs, routes, type L, type Lang, type RouteKey } from '../i18n/routes';

export type View = RouteKey | 'project';

export interface PageEntry {
  path: string;
  lang: Lang;
  view: View;
  alternates: Partial<L>;
  indexable: boolean;
}

/** Blog posts (Phase 18). Empty until the first post is approved → blog stays noindex, out of the nav and the sitemap. */
export const posts: { lang: Lang; slug: string; title: string }[] = [];
export const blogLive = (lang: Lang) => posts.some((p) => p.lang === lang);

// Pages that are never in the sitemap (noindex in their view too)
const NOINDEX: RouteKey[] = ['recommend', 'thanks'];

export const projectAlternates: L = {
  en: childPath('projects', 'en', site.studia.slug),
  es: childPath('projects', 'es', site.studia.slug),
};

export function allPages(): PageEntry[] {
  const pages: PageEntry[] = [];
  for (const key of Object.keys(routes) as RouteKey[]) {
    for (const lang of langs) {
      const indexable = !NOINDEX.includes(key) && !(key === 'blog' && !blogLive(lang));
      pages.push({ path: routes[key][lang], lang, view: key, alternates: { ...routes[key] }, indexable });
    }
  }
  for (const lang of langs) {
    pages.push({ path: projectAlternates[lang], lang, view: 'project', alternates: projectAlternates, indexable: true });
  }
  return pages;
}

/** Nav items for a language: site.nav + Blog (before Contact) once it has a post. */
export function navKeys(lang: Lang): RouteKey[] {
  const keys = [...site.nav];
  if (blogLive(lang)) keys.splice(keys.indexOf('contact'), 0, 'blog');
  return keys;
}
