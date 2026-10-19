/**
 * SINGLE SOURCE OF TRUTH — David Rosales, personal portfolio (client-intake.md).
 * Pages, header, footer, schema, llms.txt, the résumé page and its PDF all read from here.
 * Never invent facts — anything unconfirmed stays [TODO] (CLAUDE.md §14).
 */
import type { L, Lang, RouteKey } from '../i18n/routes';

export interface Recommendation {
  highlight: L;  // the most concrete line, in bold
  quote: L;      // 1–2 sentences, approved by the author
  name: string;
  role: L;       // e.g. "Professor, Sheridan College"
}

export interface CvEntry {
  org: string;
  place: L;
  title: L;
  dates: L;
  bullets: L<string[]>;
  url?: string;
  stack?: string;
}

export const site = {
  url: 'https://example.com', // [TODO] final domain (client-intake S6 — David decides later), no trailing slash
  locale: { en: 'en_CA', es: 'es_ES' } as L,

  person: {
    name: 'David Rosales',
    jobTitle: { en: 'Software developer', es: 'Desarrollador de software' } as L,
    role: {
      en: 'Computer Science (Cloud Computing) at Sheridan College',
      es: 'Computer Science (Cloud Computing) en Sheridan College',
    } as L,
    location: { en: 'Toronto area (GTA), Ontario, Canada', es: 'Área de Toronto (GTA), Ontario, Canadá' } as L,
    locationShort: { en: 'Toronto area', es: 'Área de Toronto' } as L,
    slogan: { en: 'Already shipping. Still learning.', es: 'Ya publico software. Sigo aprendiendo.' } as L,
    bio: {
      en: 'Computer Science (Cloud Computing) student at Sheridan College, in the Toronto area. I designed the architecture of studIA Notes — an AI study app for Android and Windows — directed its AI-assisted development and built its server. Bilingual (English/Spanish). Looking for a Winter 2027 co-op or internship, in the GTA or remote.',
      es: 'Estudiante de Computer Science (Cloud Computing) en Sheridan College, en el área de Toronto. Diseñé la arquitectura de studIA Notes —una app de estudio con IA para Android y Windows—, dirigí su desarrollo asistido por IA y construí su servidor. Bilingüe (inglés/español). Busco un co-op o internship para Winter 2027, en el GTA o remoto.',
    } as L,
    email: 'david.rosales.dev@gmail.com',
    linkedin: 'https://www.linkedin.com/in/david-rosales-078615333',
    github: 'https://github.com/DavidRosales21',
    school: { name: 'Sheridan College', url: 'https://www.sheridancollege.ca' },
    knowsLanguage: ['en', 'es', 'fr'],
    knowsAbout: ['Python', 'C#', '.NET', 'Flutter', 'Node.js', 'Software architecture', 'Cloud computing'],
    photo: '', // [TODO] real photo (content/image-prompts.md §1) — empty = "DR" monogram fallback
  },

  /** Main nav (max 6). Blog joins automatically once the first post exists (lib/pages.ts). */
  nav: ['projects', 'about', 'resume', 'contact'] as RouteKey[],

  studia: {
    name: 'studIA Notes',
    url: 'https://studianotes.com',
    aboutUrl: 'https://studianotes.com/sobre-studia', // names David as founder — sameAs for the Person entity
    playUrl: '', // [TODO] Google Play link once live (planned 2026-10-27) — empty = launch-date fallback
    playDate: { en: 'October 27, 2026', es: '27 de octubre de 2026' } as L,
    githubShowcase: '', // [TODO] public showcase repo (github-studia-public.md) — empty = link hidden
    slug: 'studia-notes',
    stack: ['Flutter', 'Node.js', 'OpenAI API', 'Google Play Billing', 'SQLite'],
    platforms: { en: 'Android (phone + tablet) · Windows', es: 'Android (móvil + tablet) · Windows' } as L,
  },

  skills: {
    strongest: ['Python', 'C#', '.NET'],
    also: ['Flutter', 'Node.js', 'JavaScript', 'SQL', 'JSON', '.NET MAUI', 'XAML', 'Git'],
    learning: { en: 'Cloud computing', es: 'Cloud computing' } as L,
  },

  languages: {
    en: 'English and Spanish — bilingual · French — basic',
    es: 'Inglés y español — bilingüe · Francés — básico',
  } as L,

  education: [
    {
      org: 'Sheridan College',
      place: { en: 'Oakville, ON', es: 'Oakville, ON' },
      title: { en: 'Honours Bachelor of Computer Science (Cloud Computing)', es: 'Honours Bachelor of Computer Science (Cloud Computing)' },
      dates: { en: 'Sept 2025 – Apr 2029 (expected)', es: 'Sept. 2025 – abr. 2029 (previsto)' },
      bullets: { en: [], es: [] },
    },
  ] as CvEntry[],

  experience: [
    {
      org: 'COORATIENDAS',
      place: { en: 'Bogotá, Colombia · family business — on site when I’m in Colombia, remote the rest of the year', es: 'Bogotá, Colombia · negocio familiar — presencial cuando estoy en Colombia, a distancia el resto del año' },
      title: { en: 'Store Manager and Tech Assistant', es: 'Store Manager and Tech Assistant' },
      dates: { en: 'Jan 2022 – Present', es: 'Ene. 2022 – actualidad' },
      bullets: {
        en: [
          'Administered the store’s accounting software, keeping transaction and inventory records accurate.',
          'Diagnosed and fixed computer and point-of-sale problems, minimizing downtime.',
          'Provide remote IT support — for example, restored the employee time-clock (attendance) software remotely with AnyDesk.',
          'Supervised staff and handled supplier negotiations, cash and inventory.',
        ],
        es: [
          'Administré el software contable de la tienda y mantuve exactos los registros de transacciones e inventario.',
          'Diagnostiqué y resolví problemas de computadores y cajas registradoras, reduciendo el tiempo de inactividad.',
          'Doy soporte técnico a distancia: por ejemplo, restablecí por AnyDesk el software del reloj que registra entradas y salidas del personal.',
          'Supervisé al personal y me encargué de negociar con proveedores, de la caja y del inventario.',
        ],
      },
    },
  ] as CvEntry[],

  projectCv: {
    org: 'studIA Notes',
    place: { en: 'Founder & developer', es: 'Fundador y desarrollador' },
    title: { en: 'Founder & developer', es: 'Fundador y desarrollador' },
    dates: { en: '2026 – present', es: '2026 – actualidad' },
    url: 'https://studianotes.com',
    stack: 'Flutter · Node.js · OpenAI API · Google Play Billing · SQLite',
    bullets: {
      en: [
        'Designed the architecture of an AI note-taking app for university students — one Flutter codebase for Android and Windows — and directed its AI-assisted development.',
        'Built the Node.js server: AI requests go through the server so API keys never ship in the app; purchases are validated server-side.',
        'Kept notebooks on the device (privacy by default) and made core features work offline.',
        'Released a Windows installer; in closed testing with real users ahead of the Google Play launch on October 27, 2026.',
      ],
      es: [
        'Diseñé la arquitectura de una app de apuntes con IA para universitarios (un solo código en Flutter para Android y Windows) y dirigí su desarrollo asistido por IA.',
        'Construí el servidor en Node.js: las peticiones de IA pasan por el servidor, así las API keys nunca van dentro de la app; las compras se validan en el servidor.',
        'Mantuve los cuadernos en el dispositivo (privacidad por defecto) e hice que las funciones principales funcionen sin conexión.',
        'Publiqué un instalador de Windows; en pruebas cerradas con usuarios reales antes del lanzamiento en Google Play el 27 de octubre de 2026.',
      ],
    },
  } as CvEntry,

  /** Résumé PDFs in /public, exported from the résumé page (npm run resume:pdf). */
  resumePdf: { en: '/David-Rosales-Resume.pdf', es: '/David-Rosales-CV-ES.pdf' } as L,

  /** REAL recommendations only, with written permission (content/07-recommendations.md). Empty = section hidden. */
  recommendations: [] as Recommendation[],

  /** Site-wide FAQ (content/11-faq.md) — feeds FAQPage schema + llms.txt. */
  faq: {
    en: [
      { q: 'Are you available for a Winter 2027 co-op?', a: 'Yes. I’m available for a co-op or internship starting in the Winter 2027 term (January), and as soon as possible.' },
      { q: 'Do you work on site or remotely?', a: 'Both. I’m in the Toronto area (Oakville) and can work on site in the GTA, hybrid or fully remote.' },
      { q: 'What languages and tools do you work with?', a: 'My strongest are Python, C# and .NET. I’ve also built with Flutter, Node.js, JavaScript and SQL, and I’m studying cloud computing.' },
      { q: 'Did you build studIA Notes by yourself?', a: 'Yes. I designed its architecture, directed the AI-assisted development of the app and built its server, including how API keys are handled.' },
      { q: 'How do you use AI when you code?', a: 'As a tool I direct and review. I decide the structure, ask for specific pieces, review what comes back and can explain every decision in the code.' },
      { q: 'What languages do you speak?', a: 'English and Spanish (bilingual), and basic French.' },
      { q: 'How long is the co-op in your program?', a: 'Sheridan’s Computer Science degree includes a work term between third and fourth year: a four-month summer internship or a paid co-op placement of up to 16 months.' },
      { q: 'How fast do you reply?', a: 'Within one day. Email david.rosales.dev@gmail.com, use the contact form or message me on LinkedIn.' },
    ],
    es: [
      { q: '¿Estás disponible para un co-op en Winter 2027?', a: 'Sí. Estoy disponible para un co-op o internship desde el periodo de Winter 2027 (enero), o antes si es posible.' },
      { q: '¿Trabajas presencial o en remoto?', a: 'Las dos cosas. Estoy en el área de Toronto (Oakville) y puedo trabajar presencial en el GTA, híbrido o en remoto.' },
      { q: '¿Con qué lenguajes y herramientas trabajas?', a: 'Lo que más domino es Python, C# y .NET. También he construido con Flutter, Node.js, JavaScript y SQL, y estudio cloud computing.' },
      { q: '¿Construiste studIA Notes solo?', a: 'Sí. Diseñé su arquitectura, dirigí el desarrollo asistido por IA de la app y construí su servidor, incluido el manejo de las API keys.' },
      { q: '¿Cómo usas la IA cuando programas?', a: 'Como una herramienta que dirijo y reviso. Decido la estructura, pido piezas concretas, reviso lo que recibo y puedo explicar cada decisión del código.' },
      { q: '¿Qué idiomas hablas?', a: 'Inglés y español (bilingüe), y francés básico.' },
      { q: '¿Cuánto dura el co-op de tu programa?', a: 'El grado de Computer Science de Sheridan incluye un periodo de trabajo entre tercer y cuarto año: un internship de cuatro meses en verano o un co-op pagado de hasta 16 meses.' },
      { q: '¿Cuánto tardas en responder?', a: 'Un día como máximo. Escribe a david.rosales.dev@gmail.com, usa el formulario o escríbeme por LinkedIn.' },
    ],
  } as L<{ q: string; a: string }[]>,

  analytics: {
    ga4Id: '',      // [TODO] G-XXXXXXXXXX — David's GA4 property (david.rosales.dev@gmail.com). Off until the privacy policy is reviewed.
    clarityId: '',  // [TODO] Microsoft Clarity project id
    consentRequired: true, // banner for everyone (content/12-legal.md)
  },
};

// ---------- Derived helpers ----------
export const emailHref = `mailto:${site.person.email}`;

export type CtaType = 'email' | 'resume' | 'contact' | 'linkedin';

export function absoluteUrl(path = '/') {
  const clean = path === '/' ? '' : path.replace(/\/$/, '');
  return `${site.url}${clean}`;
}

/** Clean URL path of the current page. With build.format 'file', Astro.url.pathname ends in .html at build time. */
export function cleanPath(pathname: string) {
  return pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
}

export const isLang = (x: string): x is Lang => x === 'en' || x === 'es';
