/* ==========================================================================
   main.js

   Renders the whole page from src/content.js, the same file the other two
   builds use. Nothing here is decorative: every element on the page maps to
   something a reader needs.
   ========================================================================== */

(function () {
  'use strict';

  const C = window.CONTENT;
  const $ = function (id) { return document.getElementById(id); };

  function esc(s) { return String(s == null ? '' : s); }
  function tags(list, soft) {
    if (!list || !list.length) return '';
    return '<div class="tags">' + list.map(function (t) {
      return '<span class="tag' + (soft ? ' soft' : '') + '">' + esc(t) + '</span>';
    }).join('') + '</div>';
  }
  function pts(list) {
    if (!list || !list.length) return '';
    return '<ul class="pts">' + list.map(function (p) {
      return '<li>' + esc(p) + '</li>';
    }).join('') + '</ul>';
  }

  /* ---------- header / sidebar ------------------------------------------
     The prompt uses the bare hostname, not user@host: an email-shaped
     prompt implies an address that does not exist. */
  const host = C.meta.domain || 'localhost';
  $('hero-host').textContent = host;
  $('foot-host').textContent = host;
  $('rail-name').textContent = C.profile.name;
  $('rail-role').textContent = C.profile.role;
  $('rail-loc').textContent = C.profile.location;
  $('hero-name').textContent = C.profile.name;
  $('hero-tagline').textContent = C.profile.tagline;

  $('hero-facts').innerHTML =
    '<b class="hot">' + esc(C.profile.availability) + '</b>' +
    '<b>' + esc(C.profile.location) + '</b>' +
    '<b>' + esc(C.education[0].school) + '</b>';

  $('hero-intro').innerHTML = C.profile.intro.map(function (p) {
    return '<p>' + p + '</p>';
  }).join('');

  const resumeFile = (C.meta.resume && C.meta.resume.file) || '';
  $('hero-cta').innerHTML =
    (resumeFile ? '<a class="btn primary" href="' + resumeFile + '" download>resume.pdf</a>' : '') +
    '<a class="btn" href="mailto:' + C.profile.email + '">email</a>' +
    C.profile.links.filter(function (l) { return l.label !== 'Email'; }).map(function (l) {
      return '<a class="btn" href="' + l.url + '" target="_blank" rel="noopener">' +
             esc(l.label).toLowerCase() + '</a>';
    }).join('');

  $('rail-links').innerHTML = C.profile.links.map(function (l) {
    return '<a href="' + l.url + '"' +
      (l.url.indexOf('mailto:') === 0 ? '' : ' target="_blank" rel="noopener"') + '>' +
      esc(l.label).toLowerCase() + ' <span>' + esc(l.handle || '') + '</span></a>';
  }).join('');

  const gh = C.profile.links.filter(function (l) { return l.label === 'GitHub'; })[0];
  if (gh) $('rail-src').href = gh.url;
  if (C.meta.resume && C.meta.resume.file) $('rail-resume').href = C.meta.resume.file;

  $('foot-note').textContent =
    C.profile.name + '. Written by hand in plain HTML, CSS and JavaScript. ' +
    'No framework, no build step.';

  /* ---------- experience ------------------------------------------------- */
  $('experience-body').innerHTML = C.experience.map(function (e) {
    return '<article class="card">' +
      '<div class="card-head">' +
        '<span class="card-title">' + esc(e.role) + '</span>' +
        '<span class="card-org">' + esc(e.company) + '</span>' +
        '<span class="card-when">' + esc(e.period) + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        (e.location ? '<p class="card-sub">' + esc(e.location) + '</p>' : '') +
        (e.summary ? '<p>' + esc(e.summary) + '</p>' : '') +
        pts(e.bullets) +
        tags(e.stack) +
      '</div>' +
    '</article>';
  }).join('');

  /* ---------- projects, each with its demo pane -------------------------- */
  const pbody = $('projects-body');
  C.projects.forEach(function (p) {
    const card = document.createElement('article');
    card.className = 'card';

    // The primary link names where it goes. "live" tells a reader nothing;
    // "App Store" and "Chrome Web Store" tell them exactly what they get.
    const links = [];
    if (p.links && p.links.demo) {
      links.push('<a class="btn primary" href="' + p.links.demo + '" target="_blank" rel="noopener">' +
        esc(p.links.demoLabel || 'live') + '</a>');
    }
    if (p.links && p.links.repo) {
      links.push('<a class="btn" href="' + p.links.repo + '" target="_blank" rel="noopener">source</a>');
    }

    card.innerHTML =
      '<div class="card-head">' +
        '<span class="card-title">' + esc(p.name) + '</span>' +
        (p.status ? '<span class="card-org status">' + esc(p.status) + '</span>' : '') +
        '<span class="card-when">' + esc(p.year) + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<p>' + esc(p.tagline) + '</p>' +
        '<p class="dim">' + esc(p.description) + '</p>' +
        pts(p.highlights) +
        tags(p.stack) +
        (links.length ? '<div class="links-row">' + links.join('') + '</div>' : '') +
      '</div>';

    pbody.appendChild(card);

    /* PokeDropz shows the real thing instead of the simulated console.
       demos.js always said the replay was a stand-in until a read-only
       status endpoint existed; it exists now, so the card carries live
       figures from the running system and the simulation is retired.
       Every other project keeps its demo pane. */
    if (p.name === 'PokeDropz' && window.MONITOR) {
      const mon = document.createElement('div');
      card.querySelector('.card-body').appendChild(mon);
      window.MONITOR.mount(mon);
    } else {
      window.DEMOS.mount(card, p.name, p);
    }
  });

  /* ---------- education --------------------------------------------------- */
  $('education-body').innerHTML = '<div class="rows">' + C.education.map(function (e) {
    return '<div class="row">' +
      '<div class="row-head"><b>' + esc(e.school) + '</b>' +
        '<span class="dim">' + esc(e.degree) + '</span>' +
        '<span class="when">' + esc(e.period) + '</span></div>' +
      (e.note ? '<p>' + esc(e.note) + '</p>' : '') +
      pts(e.highlights) +
      (e.courses && e.courses.length ? tags(e.courses, true) : '') +
    '</div>';
  }).join('') + '</div>';

  /* ---------- skills ------------------------------------------------------ */
  $('skills-body').innerHTML = '<div class="skill-grid">' + C.skills.map(function (g) {
    return '<div class="skill-g"><h3>' + esc(g.group) + '</h3>' + tags(g.items, !!g.soft) + '</div>';
  }).join('') + '</div>';

  /* ---------- contact ----------------------------------------------------- */
  $('contact-body').innerHTML =
    '<div class="contact-grid">' + C.profile.links.map(function (l) {
      return '<a class="contact-card" href="' + l.url + '"' +
        (l.url.indexOf('mailto:') === 0 ? '' : ' target="_blank" rel="noopener"') + '>' +
        '<div class="k">' + esc(l.label).toLowerCase() + '</div>' +
        '<div class="v">' + esc(l.handle || l.url) + '</div></a>';
    }).join('') + '</div>';

  /* ---------- sidebar nav, built from the sections that exist ------------- */
  const SECTIONS = [
    ['projects', 'projects'],
    ['experience', 'experience'],
    ['education', 'education'],
    ['skills', 'skills'],
    ['contact', 'contact'],
  ];
  $('rail-nav').innerHTML = SECTIONS.map(function (s, i) {
    return '<a href="#' + s[0] + '" data-n="' + String(i + 1).padStart(2, '0') + '">' + s[1] + '</a>';
  }).join('');

  /* Highlight whichever section is currently in view. */
  const navLinks = Array.prototype.slice.call($('rail-nav').querySelectorAll('a'));
  const targets = SECTIONS.map(function (s) { return document.getElementById(s[0]); }).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const seen = {};
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      let best = null, bestV = 0;
      Object.keys(seen).forEach(function (k) { if (seen[k] > bestV) { bestV = seen[k]; best = k; } });
      navLinks.forEach(function (a) {
        a.classList.toggle('on', best && a.getAttribute('href') === '#' + best);
      });
    }, { threshold: [0, 0.15, 0.4, 0.75], rootMargin: '-10% 0px -55% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  document.title = C.profile.name + ' | ' + C.profile.role;

  if (window.RAIN) window.RAIN.init();
})();
