import type { APIRoute } from 'astro';
import { site, absoluteUrl } from '../config/site';
import { routes } from '../i18n/routes';
import { projectAlternates, fixnextAlternates, smartCaloriesAlternates } from '../lib/pages';

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

## Team project: ${site.fixnext.name} (${site.fixnext.event.en}, ${site.fixnext.dates.en})
A hackathon project by a team of four Sheridan students that ranks every vulnerability (CVE) published in 2026 by how likely attackers are to actually use it (LightGBM + IBM Granite, Streamlit dashboard, Google Gemini assistant). The model and the final dashboard were built by the team lead, Hossam. ${p.name}'s part: the GitHub repository, hosting and deployments (Streamlit Community Cloud and fixnext.select on GitHub Pages), the dashboard's first version, and the fix that made the Gemini assistant work on Streamlit Cloud on demo day. Live: ${site.fixnext.url} · Code: ${site.fixnext.repo}

## Team project: ${site.smartCalories.name} (${site.smartCalories.course.en}, ${site.smartCalories.dates.en})
A meal and workout planner in C# and .NET MAUI, written by hand by a team of three Sheridan students (no AI coding tools). The user sets a weight goal; the app works out a daily calorie target, plans meals and workouts day by day, and builds a shopping list for a range of dates. The team planned the structure together and split the work. ${p.name}'s part: the food model (an abstract FoodItem class with Meal and Ingredient), the Day page, the shopping list, the dependency-injection singletons that share the plan with those pages, the UML class diagram and the README report. Code: ${site.smartCalories.repo}

## Key pages
- [Home](${absoluteUrl(routes.home.en)})
- [studIA Notes case study](${absoluteUrl(projectAlternates.en)})
- [FixNext case study (team hackathon)](${absoluteUrl(fixnextAlternates.en)})
- [Smart Calories case study (team term project, C#)](${absoluteUrl(smartCaloriesAlternates.en)})
- [Résumé](${absoluteUrl(routes.resume.en)}) — PDF: ${absoluteUrl(site.resumePdf.en)}
- [About](${absoluteUrl(routes.about.en)})
- [Contact](${absoluteUrl(routes.contact.en)})
- Spanish version: ${absoluteUrl(routes.home.es)}

## FAQ
${site.faq.en.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
