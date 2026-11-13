/**
 * Every page of the site, in both languages. Used by the router (pages/[...path].astro),
 * sitemap.xml and the nav, so a page can never exist without being listed (or vice versa).
 */
import { site } from '../config/site';
import { childPath, langs, routes, type L, type Lang, type RouteKey } from '../i18n/routes';

export type View = RouteKey | 'project' | 'fixnext' | 'smartcalories' | 'ctf';

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

export const fixnextAlternates: L = {
  en: childPath('projects', 'en', site.fixnext.slug),
  es: childPath('projects', 'es', site.fixnext.slug),
};

export const smartCaloriesAlternates: L = {
  en: childPath('projects', 'en', site.smartCalories.slug),
  es: childPath('projects', 'es', site.smartCalories.slug),
};

export const ctfAlternates: L = {
  en: childPath('competitions', 'en', site.ctf.slug),
  es: childPath('competitions', 'es', site.ctf.slug),
};

/** Where a competition's full story lives: the CTF has its own page; the Datathon's is the FixNext case study. */
export const awardHref = (id: 'ctf' | 'datathon', lang: Lang) => (id === 'ctf' ? ctfAlternates : fixnextAlternates)[lang];

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
    pages.push({ path: fixnextAlternates[lang], lang, view: 'fixnext', alternates: fixnextAlternates, indexable: true });
    pages.push({ path: smartCaloriesAlternates[lang], lang, view: 'smartcalories', alternates: smartCaloriesAlternates, indexable: true });
    pages.push({ path: ctfAlternates[lang], lang, view: 'ctf', alternates: ctfAlternates, indexable: true });
  }
  return pages;
}

/** Nav items for a language: site.nav + Blog (before Contact) once it has a post. */
export function navKeys(lang: Lang): RouteKey[] {
  const keys = [...site.nav];
  if (blogLive(lang)) keys.splice(keys.indexOf('contact'), 0, 'blog');
  return keys;
}
