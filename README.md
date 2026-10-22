# David Rosales — portfolio website

Personal portfolio of David Rosales, Computer Science (Cloud Computing) student at Sheridan College.
It features the case study of **studIA Notes**, an AI study app for Android and Windows.

- **Stack:** [Astro](https://astro.build) (static output), modern CSS (design tokens, light/dark), GSAP + Lenis for motion
- **Languages:** English at `/`, Spanish at `/es` (translated slugs, `hreflang`)
- **SEO & AI search:** `Person` / `ProfilePage` / `SoftwareApplication` JSON-LD, `sitemap.xml`, `robots.txt`, `llms.txt`
- **Résumé:** web page + one-page PDF generated from the same data
- **Hosting:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`); folder URLs with a trailing slash (`/projects/`)

## Commands
| Command | What it does |
|---|---|
| `npm install` | Install dependencies (Node 22+) |
| `npm run dev` | Local dev server |
| `npm run build` | Build the static site into `dist/` |
| `npm run qa` | Build + SEO/accessibility checks |
| `npm run resume:pdf` | Export the résumé PDFs (EN/ES) with Chrome |
| `npm run lighthouse` | Lighthouse scores, mobile + desktop |

Content and data live in `src/config/site.ts`; page copy in `src/views/`.
