/* ==========================================================================
   content.js — THE ONLY FILE YOU NEED TO EDIT.

   Everything on the site is generated from the data below. The game world
   builds itself around it: add a project and a new terminal appears in The
   Workshop; add a job and a new monolith rises in The Ledger; add a passion
   and a new totem appears in Origin.
   ========================================================================== */

window.CONTENT = (function () {
  'use strict';

  /* ---- 1. Site meta ---------------------------------------------------- */
  const meta = {
    contentReady: true,
    domain: 'rasho.dev',
    themeAccent: '#7dd3fc',

    // The résumé button downloads this file directly — it is your master
    // .docx exported to PDF, NOT the in-game résumé view. Re-export whenever
    // you update the master (see README).
    resume: {
      file: 'assets/Elmar_Rasho_Resume.pdf',
      filename: 'Elmar_Rasho_Resume.pdf',
    },

    // Background music. Off until the visitor turns it on — nothing autoplays.
    // `crossfade` is how many seconds the end of the loop overlaps the start;
    // raise it if the seam is still audible, lower it if the overlap muddies.
    music: {
      src: 'assets/ambient.mp3',
      // Deliberately low: this is a bed under the footsteps and interaction
      // blips, not a foreground track. Raise it and the sound effects vanish.
      volume: 0.12,
      crossfade: 2.6,
    },
  };

  /* ---- 2. Who you are -------------------------------------------------- */
  const profile = {
    name: 'Elmar Rasho',
    short: 'Elmar',
    // What you *are*, not what you're applying to be. The work in The Ledger
    // and The Workshop makes the case on its own; claiming a title you have
    // not held yet just gives an interviewer something to poke at.
    role: 'Computer Science Graduate',
    tagline: 'I build things for people to use — then give them away.',
    location: 'Hamilton / Toronto, Ontario',
    email: 'rashoelmar@gmail.com',
    availability: 'Western CS &rsquo;26 — looking for my first software role',

    intro: [
      'Hi &mdash; I&rsquo;m Elmar. Assyrian, born and raised in Hamilton, Ontario, and hooked on computers from the moment I got my hands on one.',
      'I&rsquo;ve always liked putting small pieces together until they become something bigger. That&rsquo;s what coding is to me: lines and lines of it, then the hunt for the one syntax error, and that rush when it finally runs. Nothing else quite matches it.',
      'From a young age the dream was specific &mdash; <em>make something a lot of people actually use</em>. That&rsquo;s happened twice now, and neither time did I charge for it. PokeDropz runs free for 7,000+ people in Canada&rsquo;s biggest Pok&eacute;mon TCG Discord. My music has passed 2 million plays with no monetisation on it. I like building the thing and handing it over more than I like owning it.',
      'Away from a keyboard I&rsquo;m in the gym, on a snowboard, or making music. Those three aren&rsquo;t a break from the work &mdash; they&rsquo;re the same instinct pointed somewhere else.',
    ],

    links: [
      { label: 'GitHub', url: 'https://github.com/TechElmar', handle: '@TechElmar' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/elmarrasho/', handle: '/in/elmarrasho' },
      { label: 'SoundCloud', url: 'https://soundcloud.com/chestpump', handle: '@chestpump · 2M+ plays' },
      { label: 'Email', url: 'mailto:rashoelmar@gmail.com', handle: 'rashoelmar@gmail.com' },
    ],
  };

  /* ---- 3. Life — the framed memories in Origin ------------------------- */
  const life = [
    {
      year: 'day one',
      title: 'Hamilton, Ontario',
      text: 'Assyrian, born and raised here. I got my hands on a computer early and that was more or less that &mdash; I knew before I could explain why that I wanted to build software.',
    },
    {
      year: 'early',
      title: 'The rush',
      text: 'I liked making things out of smaller pieces long before I had a word for it. Coding just gave it a name. Writing lines and lines, debugging, hunting the one syntax error &mdash; and the moment it finally works there&rsquo;s a rush like nothing else. I&rsquo;m still chasing that one.',
    },
    {
      year: '2021',
      title: 'Two things clicked at once',
      text: 'I got serious in the gym, and at the same time I found my way back to EDM and dubstep &mdash; music I&rsquo;d genuinely loved as a kid, then buried in high school listening to whatever everyone else decided was cool. Both stuck. Neither has let go since.',
    },
    {
      year: '2022',
      title: 'Western, and the shop floor',
      text: 'Started my CS degree at Western in London, and started at Popeye&rsquo;s Supplements in Hamilton. I&rsquo;m still at the second one four years later. Years of self-taught gym and supplement knowledge is exactly how I got that job &mdash; and how I&rsquo;ve been useful in it.',
    },
    {
      year: '2025',
      title: 'PokeDropz, and giving it away',
      text: 'I built a bot to win Pok&eacute;mon card drops for myself. Then I found 7,000 people who needed it more than I did, and handed it over for nothing. Still the thing I&rsquo;m proudest of.',
    },
    {
      year: '2026',
      title: 'A MacBook I couldn&rsquo;t afford',
      text: 'I was sure enough about Morph that I bought a MacBook as a broke student purely to learn Xcode. It&rsquo;s finished and sitting in App Review now. Graduated Western the same year.',
    },
  ];

  /* ---- 4. Passions — the totems in Origin ------------------------------ */
  const passions = [
    {
      kind: 'rack',
      title: 'The gym',
      eyebrow: 'seven years, year-round',
      lede: 'Seven years without a real break. It&rsquo;s where I go to think.',
      // Drop the file in assets/. See assets/README.md for specs.
      media: {
        kind: 'image',
        src: 'assets/gym-2.jpg',
        alt: 'Elmar training in the gym',
        caption: 'Seven years of this.',
      },
      body: [
        'The gym is my solo time &mdash; the place I let off steam and nobody needs anything from me. It also scratches exactly the same itch coding does. You put in the work, sets and reps, and one day you look in the mirror and you&rsquo;re measurably different. Input, output, delayed but undeniable. Same feeling as watching a build finally go green.',
        'None of what I learned stayed with me. I give gym and lifestyle advice almost every day &mdash; to friends, to family, to customers. It&rsquo;s also the whole reason I got hired at Popeye&rsquo;s: I already knew supplements cold because I&rsquo;d taught myself, and I could turn that into a straight answer for someone standing in front of me.',
      ],
      points: [
        'Seven years consistent, all year round',
        'Directly landed me the job at Popeye&rsquo;s Supplements',
        'The origin of Morph — an AI physique coach only makes sense if you have lived it',
      ],
    },
    {
      kind: 'speaker',
      title: 'chestpump',
      eyebrow: '2,000,000+ plays',
      lede: 'EDM and dubstep. Over two million plays. Zero dollars.',
      // A snippet of your own track — cover art + play button. Keep it short.
      media: {
        kind: 'audio',
        src: 'assets/track.mp3',
        art: 'assets/track-art.jpg',
        title: 'Watch Over Us x Vegeta',
        meta: '1.4M plays · chestpump remix · original by Tevvez',
        href: 'https://soundcloud.com/chestpump',
      },
      body: [
        'I found my way back to EDM and dubstep around 2021, the same time I got serious about lifting. It was nostalgic more than anything &mdash; this was the music I actually loved as a kid before high school taught me to listen to whatever was cool instead.',
        'So I started making it &mdash; remixes and edits, released as chestpump. The one playing here is my remix; the original is by Tevvez. The account has picked up over 2 million plays in the last couple of years, with no monetisation on any of it. I never turned it on. I liked making the thing, and I liked even more that millions of people were listening to it. That&rsquo;s the same reason I gave PokeDropz away.',
      ],
      points: [
        'Over 2M plays across the last couple of years',
        'Never monetised — not once',
        'Summers are music festivals; the rest of the year it is headphones and the gym',
      ],
      link: { label: 'SoundCloud', url: 'https://soundcloud.com/chestpump', handle: '@chestpump' },
    },
    {
      kind: 'snowboard',
      title: 'Snowboarding',
      eyebrow: 'every winter since',
      lede: 'One birthday trip turned into the reason I look forward to winter.',
      // Short clip of you hitting a jump. Keep it under ~6s / 2MB.
      media: {
        kind: 'video',
        src: 'assets/snowboard.mp4',
        poster: 'assets/snowboard-poster.jpg',
        loop: true,
        caption: 'Hitting a jump.',
      },
      body: [
        'It started as a single trip for a friend&rsquo;s birthday. Now every winter is built around it &mdash; getting out with my boys, ripping down hills, and coming back with one more trick than I left with.',
        'It&rsquo;s the same loop as everything else I care about: go, be bad at something, get incrementally better, look forward to the next attempt. I&rsquo;m writing this in August and I&rsquo;m already impatient for the season.',
      ],
      points: [
        'Summers: pickleball, soccer and EDM festivals with friends',
        'Winters: the hills, and one new trick at a time',
        'Also collect Pokémon cards — which is how PokeDropz happened in the first place',
      ],
    },
  ];

  /* ---- 5. Education ---------------------------------------------------- */
  const education = [
    {
      school: 'Western University',
      degree: 'BSc Honours, Computer Science',
      period: '2022 — June 2026',
      location: 'London, Ontario',
      note: 'Systems-heavy course load. The distributed systems and operating systems courses are the ones I still reach for.',
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
      // `minor: true` renders this as a small plaque off to the side of The
      // Academy rather than a full blackboard.
      minor: true,
      school: 'St Thomas More C.S.S.',
      degree: 'Secondary School Diploma',
      period: '2018 — 2022',
      location: 'Hamilton, Ontario',
      note: '91% average in Grade 12. Honour roll every year.',
      highlights: [
        '91% average, Grade 12',
        'Honour roll — all four years',
      ],
      courses: [],
    },
  ];

  /* ---- 6. Experience — the monoliths in The Ledger ---------------------- */
  const experience = [
    {
      company: 'PokeDropz',
      role: 'Built it, run it, on call for it',
      period: '2025 — present',
      location: 'Independent · Production on AWS',
      summary: 'A real-time inventory monitoring and alert platform I own end to end — the closest thing I have to a production on-call rotation, because it is one.',
      bullets: [
        'Serves 7,000+ active users with 12+ months of continuous production operation and zero manual intervention.',
        'Triaged live failures, refactored the caching layer to eliminate false-positive alerts, and shipped continuous improvements against real users.',
        'Wrote and maintained the documentation — for a system where I am the only person who can fix it at 2am.',
        'Runs free. I took no commission and no revenue from it at any point.',
      ],
      stack: ['Python', 'AWS EC2', 'AWS S3', 'Linux', 'Discord API', 'Async pipelines'],
    },
    {
      company: 'Morph',
      role: 'Solo iOS developer — concept to App Review',
      period: '2026',
      location: 'Independent',
      summary: 'Took a native iOS app the whole way from empty Xcode project to Apple App Review submission — on a MacBook I bought as a student specifically to learn Xcode.',
      bullets: [
        'Owned the full release process: build, TestFlight distribution, and App Store submission.',
        'Designed a multi-step OpenAI pipeline with enforced JSON schemas so model output could be trusted by the UI layer.',
        'Structured the app MVVM so the AI pipeline and the interface could be tested and replaced independently.',
        'Learned Swift, SwiftUI and the entire Apple release process from zero to submitted.',
      ],
      stack: ['Swift', 'SwiftUI', 'XCTest', 'OpenAI API', 'MVVM'],
    },
    {
      company: "Popeye's Supplements Canada",
      role: 'Salesperson — permanent part-time',
      period: 'Jun 2022 — present · 4+ years',
      location: 'Hamilton, Ontario',
      summary: 'Held continuously through four years of a full-time CS degree, and through every project on this island chain. I got the job because of what I already knew from seven years of training.',
      bullets: [
        'Advise customers on supplement selection — turning self-taught, dense technical knowledge into the plain answer someone actually needs. Same skill as good documentation, with a much shorter feedback loop.',
        'Process and fulfil online orders through Shopify.',
        'Take in stock orders and reconcile incoming order invoices.',
        'Four years in the same role while shipping three products and finishing a degree — I show up.',
      ],
      stackLabel: 'day to day',
      stack: ['Shopify', 'Order fulfilment', 'Inventory & invoicing', 'Customer-facing'],
    },
  ];

  /* ---- 7. Projects — the terminals in The Workshop ---------------------- */
  const projects = [
    {
      name: 'PokeDropz',
      year: '2025',
      status: 'live · 12+ months in production',
      tagline: 'I built it to win card drops for myself. Then I gave it to 7,000 people.',
      description:
        'It started selfishly. I collect Pokémon cards, and I wanted to beat every other bot to Amazon restocks — so I wrote one that pinged only me, with auto-checkout attached. The ping half worked beautifully. The checkout half never could: bots with real budgets and whole teams behind them will always be faster. So I had a very good alerting system and no use for it. Around then the dev running the ping bot for the biggest Canadian Pokémon TCG Discord walked out over a commission split, leaving 7,000 people with nothing. I spent weeks talking to the mods and admins, polished what I had, and handed it over at zero cost. I have never taken a dollar from it.',
      highlights: [
        'Python backend on AWS EC2 monitoring hundreds of SKUs in real time through a rotating proxy pool',
        'Async pipeline with per-request retry logic and exponential backoff; S3 holds persistent state so a restart never loses its place',
        'Discord bot layer handling command parsing, role-based notification preferences and channel routing for 7,000+ users',
        '12+ months live on Linux with zero manual intervention — refactored caching to kill false-positive alerts',
      ],
      stack: ['Python', 'Java', 'AWS EC2', 'AWS S3', 'REST APIs', 'Event-driven', 'Discord API'],
      links: { repo: 'https://github.com/TechElmar/amazon-stock-pinger', demo: '' },
    },
    {
      name: 'Morph',
      year: '2026',
      status: 'pending App Store approval',
      tagline: 'An AI physique coach, native on iOS — from someone who actually trains.',
      description:
        'With AI everywhere last year I wanted to build something that genuinely needed it rather than something that name-dropped it. Seven years in the gym made the answer obvious: a coach that looks at your physique day by day, rates it honestly, and adjusts your training and diet toward your goal. I was confident enough in the idea to buy a MacBook I could not really afford as a student, purely to learn Xcode. It is finished and sitting in App Review now.',
      highlights: [
        'Physique photo through OpenAI’s Vision API, then a multi-step prompt chain across Chat Completions',
        'Produces a rating, a critique, a personalised meal plan and a workout program',
        'JSON schema constraints enforced at every stage — clean contracts between model calls, no parsing failures',
        'MVVM keeps the AI pipeline decoupled from the UI: each layer independently testable and swappable',
      ],
      stack: ['Swift', 'SwiftUI', 'Xcode', 'OpenAI Vision', 'Prompt chaining', 'MVVM'],
      links: { repo: 'https://github.com/TechElmar/morph', demo: '' },
    },
    {
      name: 'GPT Mini',
      year: '2026',
      status: 'published',
      tagline: 'Highlight text, get an answer inline — with no cloud involved at all.',
      description:
        'A published Chrome extension that intercepts selected webpage text and renders an AI answer inline on the page — no new tab, no reload, zero layout disruption to the host page. The interesting part is where the model runs: entirely on the user’s own device via WebLLM and WebGPU. No API key, no server, no request ever leaves the browser.',
      highlights: [
        'Runs the model locally through WebLLM / WebGPU — no API key and no cloud dependency',
        'MV3 architecture: background service worker owns message passing and model lifecycle',
        'TypeScript content script handles all DOM manipulation, response rendering and contextual UI anchoring',
        'Clean separation of concerns between worker and content script throughout',
      ],
      stack: ['JavaScript', 'TypeScript', 'Chrome MV3', 'WebLLM', 'WebGPU'],
      links: { repo: 'https://github.com/TechElmar/gpt-mini', demo: '' },
    },
    {
      name: 'This Website',
      year: '2026',
      status: 'live',
      tagline: 'A portfolio you walk around in.',
      description:
        'A hand-written 2D game engine in roughly 2,000 lines of vanilla JavaScript. No framework, no build step, no sprite sheets — every island, terminal, campfire and squat rack is drawn with canvas primitives at runtime. The only images anywhere on the site are my own photos.',
      highlights: [
        'Zero dependencies and zero build step — the engine is ~150 KB total',
        'Every sprite drawn procedurally in code; not one sprite asset in the repo',
        'Full keyboard, mouse and touch support, plus a printable résumé view for people in a hurry',
        'Media degrades gracefully: a missing file removes its own block rather than breaking the page',
      ],
      stack: ['JavaScript', 'Canvas 2D', 'Web Audio'],
      links: { repo: '', demo: '' },
    },
  ];

  /* ---- 8. Skills — the plaza board ------------------------------------- */
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

  /* ---- 9. Fun facts — the campfire ------------------------------------- */
  const funFacts = [
    'I have made two things a lot of people use, and charged for neither. PokeDropz is free to 7,000 people; my music has 2M+ plays with monetisation switched off.',
    'Seven years in the gym without a real break. It is the same loop as coding — put in the reps, wait, then notice you are different.',
    'I bought a MacBook I could not afford as a student just to learn Xcode, because I was that sure about one app idea.',
    'Summers are pickleball, soccer and EDM festivals. Winters are snowboarding. It is August and I am already impatient for snow.',
    'The best bug I ever fixed was a caching issue quietly firing false alerts to 7,000 people.',
    'I got hired at a supplement store because of knowledge I taught myself for free, in my own time, for fun. That keeps happening to me.',
  ];

  return { meta, profile, life, passions, education, experience, projects, skills, funFacts };
})();
