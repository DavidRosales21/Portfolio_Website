import type { APIRoute } from 'astro';
import { site, absoluteUrl } from '../config/site';
import { routes } from '../i18n/routes';
import { projectAlternates } from '../lib/pages';

// Plain-language summary for AI assistants (https://llmstxt.org, CLAUDE.md §10). Generated from site.ts.
export const GET: APIRoute = () => {
  const p = site.person;
  const body = `# ${p.name}

> ${p.bio.en}

- Role: ${p.jobTitle.en} — ${p.role.en}
- Location: ${p.location.en} (on site in the GTA, hybrid or remote)
- Availability: now, for an internship or co-op (GTA or remote)
- Languages: ${site.languages.en}
- Email: ${p.email}
- LinkedIn: ${p.linkedin}
- GitHub: ${p.github}

## Featured project: ${site.studia.name}
An AI study app for university students on ${site.studia.platforms.en}. ${p.name} designed its architecture, directed its AI-assisted development and built its Node.js server (AI requests go through the server, so API keys never ship in the app). Website: ${site.studia.url}

## Key pages
- [Home](${absoluteUrl(routes.home.en)})
- [studIA Notes case study](${absoluteUrl(projectAlternates.en)})
- [Résumé](${absoluteUrl(routes.resume.en)}) — PDF: ${absoluteUrl(site.resumePdf.en)}
- [About](${absoluteUrl(routes.about.en)})
- [Contact](${absoluteUrl(routes.contact.en)})
- Spanish version: ${absoluteUrl(routes.home.es)}

## FAQ
${site.faq.en.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
