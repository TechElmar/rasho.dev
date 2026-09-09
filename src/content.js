/* ==========================================================================
   content.js: the only file you normally edit.

   NOTE: this copy has deliberately diverged from the one in
   `elmar-portfolio`. This build is résumé-first and professional, so the
   personal sections (passions, fun facts) and the SoundCloud link are not
   here. If this becomes the site you keep, this is the copy to keep.
   ========================================================================== */

window.CONTENT = (function () {
  'use strict';

  const meta = {
    domain: 'rasho.dev',
    resume: {
      file: 'assets/Elmar_Rasho_Resume.pdf',
      filename: 'Elmar_Rasho_Resume.pdf',
    },
  };

  const profile = {
    name: 'Elmar Rasho',
    role: 'Computer Science Graduate',
    tagline: 'Backend services, mobile apps and AI-integrated pipelines. Built independently, running in production.',
    location: 'Hamilton / Toronto, Ontario',
    email: 'rashoelmar@gmail.com',
    availability: 'Western CS 2026, open to software engineering roles',

    intro: [
      'Computer Science graduate from Western University. I build backend services, full-stack web apps, mobile apps and AI-integrated pipelines, and I ship them independently rather than leaving them at the prototype stage.',
      'PokeDropz is the one I point at first: a real-time inventory monitoring platform on AWS that has run continuously for over twelve months, serving 7,000+ users in <a href="https://discord.com/invite/3dGaCuKn6E" target="_blank" rel="noopener">Pokémon TCG Canada</a>. Morph is live on the App Store. GPT Mini is published on the Chrome Web Store.',
      'Most of what I know came from operating what I built, not only writing it: triaging live failures, tracking down the caching bug behind a wave of false alerts, and keeping a system running when I am the only person who can fix it.',
    ],

    links: [
      { label: 'GitHub', url: 'https://github.com/TechElmar', handle: '@TechElmar' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/elmarrasho/', handle: '/in/elmarrasho' },
      { label: 'Email', url: 'mailto:rashoelmar@gmail.com', handle: 'rashoelmar@gmail.com' },
    ],
  };

  const experience = [
    {
      company: 'PokeDropz',
      role: 'Backend Developer, Independent',
      period: '2025 to present',
      location: 'Production on AWS',
      summary: 'A real-time inventory monitoring and alert platform I designed, built and operate end to end.',
      bullets: [
        'Serves 7,000+ users in Pokémon TCG Canada with 12+ months of continuous production operation and zero manual intervention.',
        'Python backend on AWS EC2 polling hundreds of SKUs through a rotating proxy pool, with per-request retry logic and exponential backoff.',
        'S3-backed persistent state so a restart never loses its place; Discord bot layer handles command parsing and role-based notification routing.',
        'Triaged live failures, refactored the caching layer to eliminate false-positive alerts, and maintained the documentation for a system I am solely on call for.',
      ],
      stack: ['Python', 'AWS EC2', 'AWS S3', 'Linux', 'Discord API', 'Async pipelines'],
    },
    {
      company: 'Morph',
      role: 'iOS Developer, Independent',
      period: '2026',
      location: 'Live on the App Store',
      summary: 'A native iOS app taken from empty Xcode project to a published App Store release.',
      bullets: [
        'Owned the full release process: build, TestFlight distribution, App Review submission and launch.',
        'Designed a multi-step OpenAI pipeline with JSON schemas enforced at every stage, so model output could be decoded straight into Swift structs.',
        'Structured the app MVVM so the AI pipeline and the interface could be tested and replaced independently.',
        'Learned Swift, SwiftUI and the Apple release process from zero to shipped.',
      ],
      stack: ['Swift', 'SwiftUI', 'XCTest', 'OpenAI API', 'MVVM'],
    },
    {
      company: "Popeye's Supplements Canada",
      role: 'Salesperson, Permanent Part-time',
      period: 'Jun 2022 to present',
      location: 'Hamilton, Ontario',
      summary: 'Held continuously through four years of a full-time Computer Science degree.',
      bullets: [
        'Advise customers on product selection, translating dense technical detail into a clear recommendation.',
        'Process and fulfil online orders through Shopify.',
        'Take in stock orders and reconcile incoming invoices.',
      ],
      stack: ['Shopify', 'Order fulfilment', 'Inventory & invoicing'],
    },
  ];

  const projects = [
    {
      name: 'PokeDropz',
      year: '2025',
      status: '12+ months in production',
      tagline: 'Real-time inventory monitoring and alerting for a 10,000-member community.',
      description:
        'Python backend on AWS EC2 monitoring hundreds of e-commerce SKUs in real time through a rotating proxy pool. Parses availability changes and pushes instant alerts over Discord webhooks, with S3 holding persistent state across restarts. Runs free for the community.',
      highlights: [
        'Async pipeline with per-request retry logic and exponential backoff',
        'Role-based notification routing so members only get the SKUs they asked for',
        '12+ months live on Linux with zero manual intervention',
      ],
      stack: ['Python', 'AWS EC2', 'AWS S3', 'REST APIs', 'Event-driven', 'Discord API'],
      links: {
        repo: 'https://github.com/TechElmar/amazon-stock-pinger',
        demo: 'https://discord.com/invite/3dGaCuKn6E',
        demoLabel: 'Pokémon TCG Canada',
      },
    },
    {
      name: 'Morph',
      year: '2026',
      status: 'live on the App Store',
      tagline: 'An AI physique coach, native on iOS.',
      description:
        'A Swift and SwiftUI app that sends a photo through OpenAI Vision, then runs a multi-step prompt chain across Chat Completions to produce a rating, a critique, a personalised meal plan and a training program. JSON schema constraints at every stage keep the contracts between calls clean.',
      highlights: [
        'Multi-step prompt chain with schema-enforced output at every stage',
        'MVVM keeps the AI pipeline decoupled from the interface, each independently testable',
        'Full release process owned solo: build, TestFlight, App Review, launch',
      ],
      stack: ['Swift', 'SwiftUI', 'Xcode', 'OpenAI Vision', 'Prompt chaining', 'MVVM'],
      links: {
        repo: 'https://github.com/TechElmar/morph',
        demo: 'https://apps.apple.com/ca/app/morph-ai-physique-coach/id6794569815',
        demoLabel: 'App Store',
      },
    },
    {
      name: 'GPT Mini',
      year: '2026',
      status: 'published on the Chrome Web Store',
      tagline: 'Highlight text, get an answer inline, with no cloud involved.',
      description:
        'A Chrome extension that runs LLM inference entirely in the browser through WebLLM and WebGPU. Selected text is answered inline on the page with no new tab and no layout disruption. No API key, no server, and no request ever leaves the device.',
      highlights: [
        'Local inference via WebLLM and WebGPU, so there is no API cost and no data egress',
        'MV3 service worker owns model loading and inference orchestration',
        'TypeScript content script handles DOM manipulation and contextual UI anchoring',
      ],
      stack: ['JavaScript', 'TypeScript', 'Chrome MV3', 'WebLLM', 'WebGPU'],
      links: {
        repo: 'https://github.com/TechElmar/gpt-mini',
        demo: 'https://chromewebstore.google.com/detail/ejlpjombpcmojjjedjiebolgapeekenj',
        demoLabel: 'Chrome Web Store',
      },
    },
    {
      name: 'This Site',
      year: '2026',
      status: 'live',
      tagline: 'A résumé written in plain HTML, CSS and JavaScript.',
      description:
        'No framework, no build step and no dependencies. Every project section carries a pane that demonstrates the mechanism rather than describing it.',
      highlights: [
        'Renders entirely from a single content file',
        'Under 60 KB of code',
      ],
      stack: ['JavaScript', 'CSS', 'Canvas'],
      links: { repo: '', demo: '' },
    },
  ];

  const education = [
    {
      school: 'Western University',
      degree: 'BSc Honours, Computer Science',
      period: '2022 to June 2026',
      location: 'London, Ontario',
      note: 'Systems-focused course load.',
      highlights: [],
      courses: [
        'Java OOP & Design Patterns',
        'Data Structures & Algorithms',
        'Distributed Systems',
        'Operating Systems',
        'Databases I (SQL)',
        'Software Engineering',
        'Artificial Intelligence I',
        'Computer Organization',
        'C / C++',
        'C#',
        'Statistics for Science',
      ],
    },
    {
      school: 'St Thomas More C.S.S.',
      degree: 'Secondary School Diploma',
      period: '2018 to 2022',
      location: 'Hamilton, Ontario',
      note: '91% average in Grade 12. Honour roll every year.',
      highlights: [],
      courses: [],
    },
  ];

  const skills = [
    { group: 'Languages', items: ['Python', 'Java', 'JavaScript', 'TypeScript', 'Swift', 'C++', 'C#', 'Go'] },
    {
      group: 'Backend & APIs',
      items: ['Node.js', 'Spring Boot', 'FastAPI', 'Flask', 'REST API design', 'Async & event-driven', 'Microservices', 'PostgreSQL', 'MySQL', 'WebSockets', 'Socket.IO'],
    },
    {
      group: 'Mobile & frontend',
      items: ['Swift', 'SwiftUI', 'iOS SDK', 'Xcode', 'XCTest', 'MVVM', 'React', 'Chrome MV3', 'HTML/CSS', 'Tailwind'],
    },
    {
      group: 'AI & agentic systems',
      items: ['OpenAI API', 'Vision & Chat Completions', 'WebLLM / WebGPU', 'Prompt chaining', 'Structured outputs', 'Agentic workflow design', 'MCP', 'Claude Code', 'Cursor'],
    },
    {
      group: 'Cloud & DevOps',
      items: ['AWS EC2', 'AWS S3', 'GCP', 'Docker', 'Git & GitHub', 'CI/CD', 'Linux', 'Monitoring & alerting', 'Agile / Scrum'],
    },
    {
      group: 'Familiar with',
      soft: true,
      items: ['Kotlin / Android', 'React Native', 'Vue 3', 'Next.js', 'Redis', 'Kafka', 'Kubernetes', 'Azure', 'LangChain', 'RAG', 'TDD'],
    },
  ];

  return { meta, profile, experience, projects, education, skills };
})();
