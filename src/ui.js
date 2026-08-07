/* ==========================================================================
   ui.js — everything that is DOM rather than canvas: content panels, the
   world map, the résumé view, toasts.

   Content from src/content.js is treated as trusted HTML (it is your own
   file), so you can use <b>, <a> and entities inside it.
   ========================================================================== */

window.UI = (function () {
  'use strict';

  const C = window.CONTENT;
  const W = window.WORLD;

  const $ = function (id) { return document.getElementById(id); };

  const panelWrap = $('panel-wrap');
  const panelTitle = $('panel-title');
  const panelEyebrow = $('panel-eyebrow');
  const panelBody = $('panel-body');
  const panelNav = $('panel-nav');
  const mapWrap = $('map-wrap');
  const resumeEl = $('resume');

  let current = null;   // { view, index }
  let onWarp = null;

  /* ======================================================================
     small builders
     ====================================================================== */
  function tags(list, on) {
    if (!list || !list.length) return '';
    return '<div class="tags">' + list.map(function (s) {
      return '<span class="tag' + (on ? ' tag-on' : '') + '">' + s + '</span>';
    }).join('') + '</div>';
  }

  function bullets(list) {
    if (!list || !list.length) return '';
    return '<ul class="bullets">' + list.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
  }

  function metaRow(parts) {
    const clean = parts.filter(Boolean);
    if (!clean.length) return '';
    return '<p class="meta-row">' + clean.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</p>';
  }

  function label(text) { return '<p class="section-label">' + text + '</p>'; }

  /* ======================================================================
     media — photo / clip / audio snippet inside a panel

     Files live in assets/. If one is missing the block removes itself, so
     the site never shows a broken image in production. When running
     locally you get a dashed placeholder naming the file instead, so it's
     obvious what still needs dropping in.
     ====================================================================== */
  const IS_DEV = location.protocol === 'file:' ||
    location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  function mediaBlock(m) {
    if (!m || !m.src) return '';

    if (m.kind === 'image') {
      // The blurred copy behind fills the letterbox bars a portrait photo
      // leaves in a wide box, so `contain` reads as deliberate framing.
      return '<figure class="media" data-src="' + m.src + '">' +
        '<div class="media-shot">' +
          '<div class="media-blur" style="background-image:url(\'' + m.src + '\')"></div>' +
          // NOT loading="lazy": the panel is built on demand, so by the time
          // this exists the image is already wanted. Lazy here just delays it.
          '<img class="media-img" data-essential decoding="async" src="' + m.src + '" alt="' + (m.alt || '') + '">' +
        '</div>' +
        (m.caption ? '<figcaption>' + m.caption + '</figcaption>' : '') +
        '</figure>';
    }

    if (m.kind === 'video') {
      // src on the element itself, not a <source> child: a failing <source>
      // fires `error` on the source, never on the <video>, so a missing file
      // would go undetected.
      return '<figure class="media" data-src="' + m.src + '">' +
        '<video class="media-vid" data-essential playsinline controls preload="metadata"' +
        ' src="' + m.src + '"' +
        (m.poster ? ' poster="' + m.poster + '"' : '') +
        (m.loop ? ' loop' : '') + '></video>' +
        (m.caption ? '<figcaption>' + m.caption + '</figcaption>' : '') +
        '</figure>';
    }

    if (m.kind === 'audio') {
      return '<div class="media player" data-src="' + m.src + '">' +
        '<div class="player-art">' +
          (m.art ? '<img src="' + m.art + '" alt="">' : '') +
          '<span class="player-art-fallback">♪</span>' +
        '</div>' +
        '<button class="player-btn" type="button" aria-label="Play snippet">▶</button>' +
        '<div class="player-info">' +
          '<b>' + (m.title || 'Untitled') + '</b>' +
          '<small>' + (m.meta || '') + '</small>' +
          '<div class="player-bar"><span class="player-fill"></span></div>' +
        '</div>' +
        (m.href ? '<a class="player-link" href="' + m.href + '" target="_blank" rel="noopener" title="Listen in full">↗</a>' : '') +
        // preload="metadata", not "none": it costs a few KB, but it means a
        // missing file errors up front instead of silently doing nothing when
        // play is pressed — and the duration is known before first play, so
        // the progress bar is accurate from the start.
        '<audio class="player-audio" data-essential src="' + m.src + '" preload="metadata"></audio>' +
        '</div>';
    }
    return '';
  }

  let liveAudio = null;

  function stopMedia() {
    if (liveAudio) { try { liveAudio.pause(); } catch (e) { /* gone */ } liveAudio = null; }
    const vids = panelBody.querySelectorAll('video');
    for (let i = 0; i < vids.length; i++) { try { vids[i].pause(); } catch (e) { /* gone */ } }
    if (window.MUSIC) window.MUSIC.duck(false);
  }

  function wireMedia() {
    const blocks = panelBody.querySelectorAll('.media');

    for (let i = 0; i < blocks.length; i++) {
      (function (block) {
        const essential = block.querySelector('[data-essential]');
        if (essential) {
          essential.addEventListener('error', function () {
            if (!IS_DEV) { block.remove(); return; }
            block.classList.add('media-missing');
            block.innerHTML = '<span>add <b>' + block.getAttribute('data-src') + '</b></span>';
          });
        }
        const art = block.querySelector('.player-art img');
        if (art) art.addEventListener('error', function () { art.remove(); });
      })(blocks[i]);
    }

    // Any panel media takes priority over the background loop.
    const vid = panelBody.querySelector('video');
    if (vid) {
      vid.addEventListener('play', function () { window.MUSIC.duck(true); });
      vid.addEventListener('pause', function () { window.MUSIC.duck(false); });
      vid.addEventListener('ended', function () { window.MUSIC.duck(false); });
    }

    const player = panelBody.querySelector('.player');
    if (!player) return;

    const audio = player.querySelector('.player-audio');
    const btn = player.querySelector('.player-btn');
    const fill = player.querySelector('.player-fill');
    const bar = player.querySelector('.player-bar');
    liveAudio = audio;

    btn.addEventListener('click', function () {
      if (audio.paused) audio.play().catch(function () { /* user gesture / missing file */ });
      else audio.pause();
    });
    audio.addEventListener('play', function () {
      btn.textContent = '❚❚'; player.classList.add('playing'); window.MUSIC.duck(true);
    });
    audio.addEventListener('pause', function () {
      btn.textContent = '▶'; player.classList.remove('playing'); window.MUSIC.duck(false);
    });
    audio.addEventListener('ended', function () {
      btn.textContent = '▶'; player.classList.remove('playing'); fill.style.width = '0%';
      window.MUSIC.duck(false);
    });
    audio.addEventListener('timeupdate', function () {
      if (audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    });
    bar.addEventListener('click', function (e) {
      const r = bar.getBoundingClientRect();
      if (audio.duration) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
  }

  /* ======================================================================
     views
     ====================================================================== */
  const VIEWS = {

    howto: function () {
      return {
        eyebrow: 'signpost', title: 'How this works',
        html:
          '<p class="p-lede">You are standing in the middle of a small world. Everything in it is a piece of my CV.</p>' +
          label('controls') +
          '<div class="stat-line"><b>Move</b><span>W A S D &nbsp;/&nbsp; arrow keys &nbsp;/&nbsp; drag the stick</span></div>' +
          '<div class="stat-line"><b>Interact</b><span>E &nbsp;/&nbsp; Space &nbsp;/&nbsp; tap the button</span></div>' +
          '<div class="stat-line"><b>World map &amp; fast travel</b><span>M</span></div>' +
          '<div class="stat-line"><b>Plain résumé</b><span>R</span></div>' +
          '<div class="stat-line"><b>Close a window</b><span>Esc</span></div>' +
          label('where to go') +
          '<ul class="bullets">' +
          '<li><b>West — Origin.</b> The life story, the parts that are not on a résumé.</li>' +
          '<li><b>North — The Academy.</b> Education.</li>' +
          '<li><b>East — The Workshop.</b> Projects. Boot a terminal to read one.</li>' +
          '<li><b>South — The Ledger.</b> Work experience.</li>' +
          '</ul>' +
          '<p class="quote">There are ' + W.BIT_TOTAL + ' green fragments scattered across the islands. Find them all and something opens up.</p>' +
          '<p class="p-body" style="margin-top:1.2rem">In a hurry? Press <kbd>R</kbd> for the whole thing as a plain, printable document.</p>',
      };
    },

    about: function () {
      const p = C.profile;
      return {
        eyebrow: 'about', title: p.name,
        html:
          '<p class="p-lede">' + p.tagline + '</p>' +
          metaRow([p.role, p.location, p.availability]) +
          '<div class="p-body">' + p.intro.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>' +
          label('find me') +
          '<div class="link-row">' + p.links.map(function (l) {
            return '<a class="link-chip" href="' + l.url + '" target="_blank" rel="noopener">' +
              l.label + ' <small>' + (l.handle || '') + '</small></a>';
          }).join('') + '</div>',
      };
    },

    skills: function () {
      return {
        eyebrow: 'skills', title: 'Toolkit',
        html:
          '<p class="p-lede">What I reach for, roughly in order of how often I reach for it.</p>' +
          '<div class="skill-grid">' + C.skills.map(function (g) {
            return '<div><h4>' + g.group + '</h4>' + tags(g.items, !!g.soft) + '</div>';
          }).join('') + '</div>',
      };
    },

    contact: function () {
      const p = C.profile;
      return {
        eyebrow: 'contact', title: 'Signal received',
        html:
          '<p class="p-lede">The beacon is on. If you have something interesting — a role, a project, a bug in this website — say hello.</p>' +
          metaRow([p.availability, p.location]) +
          '<div class="link-row">' +
          '<a class="link-chip" href="mailto:' + p.email + '">Email <small>' + p.email + '</small></a>' +
          p.links.filter(function (l) { return l.label !== 'Email'; }).map(function (l) {
            return '<a class="link-chip" href="' + l.url + '" target="_blank" rel="noopener">' +
              l.label + ' <small>' + (l.handle || '') + '</small></a>';
          }).join('') + '</div>' +
          '<p class="quote">I reply to everything that is not a recruiter template. Sometimes even to those.</p>',
      };
    },

    passion: function (i) {
      const p = C.passions[i];
      return {
        eyebrow: p.eyebrow, title: p.title, count: C.passions.length, index: i,
        html:
          '<p class="p-lede">' + p.lede + '</p>' +
          mediaBlock(p.media) +
          '<div class="p-body">' + p.body.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>' +
          (p.points && p.points.length ? label('the details') + bullets(p.points) : '') +
          (p.link
            ? '<div class="link-row"><a class="link-chip" href="' + p.link.url + '" target="_blank" rel="noopener">' +
              p.link.label + ' <small>' + (p.link.handle || '') + '</small></a></div>'
            : ''),
      };
    },

    facts: function () {
      return {
        eyebrow: 'campfire', title: 'Things that are true',
        html:
          '<p class="p-lede">The stuff that does not fit on a résumé.</p>' +
          bullets(C.funFacts),
      };
    },

    life: function (i) {
      const e = C.life[i];
      return {
        eyebrow: e.year, title: e.title, count: C.life.length, index: i,
        html:
          '<p class="p-lede">' + e.text + '</p>' +
          label('the whole timeline') +
          '<ul class="timeline">' + C.life.map(function (l, n) {
            return '<li' + (n === i ? ' style="opacity:1"' : ' style="opacity:.55"') + '>' +
              '<span class="t-year">' + l.year + '</span>' +
              '<b class="t-title">' + l.title + '</b>' +
              '<p>' + l.text + '</p></li>';
          }).join('') + '</ul>',
      };
    },

    education: function (i) {
      const e = C.education[i];
      return {
        eyebrow: e.degree, title: e.school, count: C.education.length, index: i,
        html:
          '<p class="p-lede">' + (e.note || '') + '</p>' +
          metaRow([e.period, e.location]) +
          (e.highlights && e.highlights.length ? label('highlights') + bullets(e.highlights) : '') +
          (e.courses && e.courses.length ? label('coursework') + tags(e.courses) : ''),
      };
    },

    educationAll: function () {
      return {
        eyebrow: 'the academy', title: 'Education',
        html: C.education.map(function (e) {
          return '<div style="margin-bottom:2rem">' +
            '<p class="section-label" style="margin-top:0">' + e.period + '</p>' +
            '<p class="p-lede" style="margin-bottom:.4rem">' + e.school + '</p>' +
            '<div class="p-body"><p>' + e.degree + (e.note ? ' &mdash; ' + e.note : '') + '</p></div>' +
            bullets(e.highlights) + '</div>';
        }).join(''),
      };
    },

    project: function (i) {
      const p = C.projects[i];
      const links = [];
      if (p.links && p.links.demo) links.push('<a class="link-chip" href="' + p.links.demo + '" target="_blank" rel="noopener">Live <small>demo</small></a>');
      if (p.links && p.links.repo) links.push('<a class="link-chip" href="' + p.links.repo + '" target="_blank" rel="noopener">Source <small>repo</small></a>');
      return {
        eyebrow: p.year + ' &middot; ' + (p.status || ''), title: p.name, count: C.projects.length, index: i,
        html:
          '<p class="p-lede">' + p.tagline + '</p>' +
          '<div class="p-body"><p>' + p.description + '</p></div>' +
          (p.highlights && p.highlights.length ? label('what mattered') + bullets(p.highlights) : '') +
          label('built with') + tags(p.stack) +
          (links.length ? '<div class="link-row">' + links.join('') + '</div>' : ''),
      };
    },

    experience: function (i) {
      const e = C.experience[i];
      return {
        eyebrow: e.role, title: e.company, count: C.experience.length, index: i,
        html:
          '<p class="p-lede">' + (e.summary || '') + '</p>' +
          metaRow([e.period, e.location]) +
          bullets(e.bullets) +
          (e.stack && e.stack.length
            ? label(e.stackLabel || 'stack') + tags(e.stack)
            : ''),
      };
    },

    board: function () {
      return {
        eyebrow: 'the real reward', title: 'Snowboard',
        html:
          '<p class="p-lede">It&rsquo;s yours. Hold <kbd>Shift</kbd> and the board comes out.</p>' +
          '<div class="p-body">' +
          '<p>About three and a half times the speed, and it carries momentum the way a board should &mdash; you&rsquo;ll drift a good way past where you stop steering. Let go of Shift and you stop hard, so it doubles as the brake. Crossing the whole map takes about five seconds now.</p>' +
          '<p>It seemed like the right thing to hide behind all ten fragments. Snowboarding started as one trip for a friend&rsquo;s birthday and turned into the reason I look forward to winter; if you went to the trouble of finding every fragment, you get the thing I actually care about.</p>' +
          '</div>' +
          label('controls') +
          '<div class="stat-line"><b>Ride</b><span>hold <kbd>Shift</kbd></span></div>' +
          '<div class="stat-line"><b>On touch</b><span>the 🏂 button, top right</span></div>',
      };
    },

    vault: function () {
      return {
        eyebrow: 'secret', title: 'You actually found them all',
        html:
          '<p class="p-lede">Ten fragments, one hidden island. Most visitors read two paragraphs and leave — you went looking. That says something.</p>' +
          '<div class="p-body">' +
          '<p>Since you are clearly thorough: this whole site is about 2,000 lines of vanilla JavaScript with no framework, no build step and no image files. Every tree, terminal and campfire you walked past is drawn with canvas primitives at runtime.</p>' +
          '<p>If you want to talk about how it works &mdash; or about a role &mdash; the beacon back on The Crossroads has my email.</p>' +
          '</div>' +
          '<div class="link-row"><a class="link-chip" href="mailto:' + C.profile.email + '">Email me <small>' + C.profile.email + '</small></a></div>',
      };
    },
  };

  /* ======================================================================
     panel plumbing
     ====================================================================== */
  function open(view, index) {
    const fn = VIEWS[view];
    if (!fn) return;
    stopMedia();
    const data = fn(index || 0);
    current = { view: view, index: index || 0, count: data.count || 0 };

    panelEyebrow.innerHTML = data.eyebrow || '';
    panelTitle.innerHTML = data.title || '';
    panelBody.innerHTML = data.html || '';
    panelBody.scrollTop = 0;
    wireMedia();

    panelNav.innerHTML = data.count > 1
      ? '<kbd>←</kbd><kbd>→</kbd> ' + (current.index + 1) + ' / ' + data.count
      : '';

    panelWrap.hidden = false;
    window.SFX.open();
    setTimeout(function () { panelBody.focus(); }, 40);
  }

  function step(delta) {
    if (!current || !current.count || current.count < 2) return;
    const n = (current.index + delta + current.count) % current.count;
    open(current.view, n);
  }

  /* Focus must not be left on a button when an overlay closes: focused
     controls keep the keyboard for themselves (so Space can activate them),
     which would leave WASD and E dead until the visitor clicked the page. */
  function releaseFocus() {
    const el = document.activeElement;
    if (el && el !== document.body && typeof el.blur === 'function') el.blur();
  }

  function close() {
    if (panelWrap.hidden) return;
    stopMedia();
    panelWrap.hidden = true;
    current = null;
    releaseFocus();
    window.SFX.close();
  }

  function isOpen() { return !panelWrap.hidden || !mapWrap.hidden || !resumeEl.hidden; }
  function panelOpen() { return !panelWrap.hidden; }

  /* ======================================================================
     toasts
     ====================================================================== */
  function toast(text, icon) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="t-ico">' + (icon || '✦') + '</span><span>' + text + '</span>';
    $('toasts').appendChild(el);
    setTimeout(function () { el.remove(); }, 3300);
  }

  /* ======================================================================
     HUD
     ====================================================================== */
  let hintTimer = null;
  function hint(text) {
    const el = $('hud-hint');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { el.classList.remove('show'); }, 4200);
  }

  function setZone(island) {
    $('hud-zone').textContent = island.name;
    $('hud-sub').textContent = island.sub;
    $('hud-icon').textContent = island.icon;
    $('hud-icon').style.color = island.glow;
    document.querySelector('.hud-zone').style.borderColor = window.DRAW.hexA(island.glow, 0.45);
  }

  function setBits(n) {
    $('bit-count').textContent = n;
  }

  /* ======================================================================
     world map / fast travel
     ====================================================================== */
  const mini = $('minimap');
  const mctx = mini.getContext('2d');
  let mapTargets = [];

  function drawMap(player) {
    const pad = 24;
    const sx = (mini.width - pad * 2) / W.WORLD_W;
    const sy = (mini.height - pad * 2) / W.WORLD_H;
    const s = Math.min(sx, sy);
    const ox = (mini.width - W.WORLD_W * s) / 2;
    const oy = (mini.height - W.WORLD_H * s) / 2;

    mctx.fillStyle = '#05070f';
    mctx.fillRect(0, 0, mini.width, mini.height);

    mapTargets = [];

    W.bridges.forEach(function (b) {
      if (b.secret && !W.state.vaultOpen) return;
      mctx.fillStyle = 'rgba(125,211,252,0.28)';
      mctx.fillRect(ox + b.x * s, oy + b.y * s, b.w * s, b.h * s);
    });

    W.islands.forEach(function (i) {
      const locked = i.secret && !W.state.vaultOpen;
      const x = ox + i.x * s, y = oy + i.y * s, w = i.w * s, h = i.h * s;
      mctx.globalAlpha = locked ? 0.22 : 1;
      window.DRAW.rr(mctx, x, y, w, h, i.r * s);
      mctx.fillStyle = W.state.visited[i.id] ? i.base : '#101728';
      mctx.fill();
      mctx.strokeStyle = window.DRAW.hexA(i.glow, W.state.visited[i.id] ? 0.75 : 0.3);
      mctx.lineWidth = 1.5;
      mctx.stroke();

      mctx.fillStyle = W.state.visited[i.id] ? window.DRAW.hexA(i.glow, 0.95) : 'rgba(140,160,200,0.4)';
      mctx.font = '600 13px "Space Grotesk", sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText(locked ? '???' : i.name, x + w / 2, y + h / 2 + 4);
      mctx.font = '10px "JetBrains Mono", monospace';
      mctx.globalAlpha *= 0.6;
      mctx.fillText(locked ? 'locked' : i.sub, x + w / 2, y + h / 2 + 20);
      mctx.globalAlpha = 1;

      if (!locked) mapTargets.push({ x: x, y: y, w: w, h: h, island: i });
    });

    // player marker
    const px = ox + player.x * s, py = oy + player.y * s;
    mctx.fillStyle = '#fff';
    mctx.beginPath(); mctx.arc(px, py, 4.5, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = 'rgba(255,255,255,0.45)';
    mctx.lineWidth = 2;
    mctx.beginPath(); mctx.arc(px, py, 10, 0, Math.PI * 2); mctx.stroke();
  }

  function buildMapList() {
    const list = $('map-list');
    list.innerHTML = '';
    W.islands.forEach(function (i) {
      if (i.secret && !W.state.vaultOpen) return;
      const b = document.createElement('button');
      b.className = 'map-item';
      b.innerHTML = '<b>' + i.name + '</b><small>' + i.sub + '</small>';
      b.onclick = function () { warp(i); };
      list.appendChild(b);
    });
  }

  function warp(island) {
    closeMap();
    if (onWarp) onWarp(island);
  }

  function openMap(player) {
    mapWrap.hidden = false;
    buildMapList();
    drawMap(player);
    window.SFX.open();
  }
  function closeMap() {
    if (mapWrap.hidden) return;
    mapWrap.hidden = true;
    releaseFocus();
    window.SFX.close();
  }
  function mapOpen() { return !mapWrap.hidden; }

  mini.addEventListener('click', function (e) {
    const r = mini.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * mini.width;
    const y = ((e.clientY - r.top) / r.height) * mini.height;
    for (let i = 0; i < mapTargets.length; i++) {
      const t = mapTargets[i];
      if (x > t.x && x < t.x + t.w && y > t.y && y < t.y + t.h) { warp(t.island); return; }
    }
  });

  /* ======================================================================
     résumé view
     ====================================================================== */
  function buildResume() {
    const p = C.profile;
    let h = '';

    h += '<h1>' + p.name + '</h1>';
    h += '<p class="r-sub">' + p.role + ' &middot; ' + p.location + '</p>';
    h += '<p class="r-contact">' +
      '<a href="mailto:' + p.email + '">' + p.email + '</a>' +
      p.links.filter(function (l) { return l.label !== 'Email'; }).map(function (l) {
        return '<a href="' + l.url + '" target="_blank" rel="noopener">' + l.label + '</a>';
      }).join('') +
      (C.meta.domain ? '<span>' + C.meta.domain + '</span>' : '') +
      '</p>';

    h += '<h2>Profile</h2>';
    h += '<div class="r-entry">' + p.intro.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>';

    h += '<h2>Experience</h2>';
    C.experience.forEach(function (e) {
      h += '<div class="r-entry">' +
        '<div class="r-entry-head"><h3>' + e.role + '</h3><span class="r-org">' + e.company + '</span>' +
        '<span class="r-when">' + e.period + (e.location ? ' &middot; ' + e.location : '') + '</span></div>' +
        (e.summary ? '<p>' + e.summary + '</p>' : '') +
        bullets(e.bullets) +
        tags(e.stack) + '</div>';
    });

    h += '<h2>Projects</h2>';
    C.projects.forEach(function (pr) {
      h += '<div class="r-entry">' +
        '<div class="r-entry-head"><h3>' + pr.name + '</h3>' +
        '<span class="r-when">' + pr.year + '</span></div>' +
        '<p>' + pr.tagline + ' ' + pr.description + '</p>' +
        bullets(pr.highlights) +
        tags(pr.stack) + '</div>';
    });

    h += '<h2>Education</h2>';
    C.education.forEach(function (e) {
      h += '<div class="r-entry">' +
        '<div class="r-entry-head"><h3>' + e.degree + '</h3><span class="r-org">' + e.school + '</span>' +
        '<span class="r-when">' + e.period + '</span></div>' +
        (e.note ? '<p>' + e.note + '</p>' : '') +
        bullets(e.highlights) +
        tags(e.courses) + '</div>';
    });

    h += '<h2>Skills</h2>';
    C.skills.forEach(function (g) {
      h += '<div class="r-entry"><div class="r-entry-head"><h3>' + g.group + '</h3></div>' + tags(g.items) + '</div>';
    });

    h += '<h2>Outside the terminal</h2>';
    C.passions.forEach(function (p) {
      h += '<div class="r-entry">' +
        '<div class="r-entry-head"><h3>' + p.title + '</h3>' +
        '<span class="r-when">' + p.eyebrow + '</span></div>' +
        '<p>' + p.lede + '</p>' +
        bullets(p.points) + '</div>';
    });

    h += '<h2>Beyond the résumé</h2>';
    h += '<div class="r-entry">' + bullets(C.funFacts) + '</div>';

    $('resume-doc').innerHTML = h;
  }

  function openResume() {
    buildResume();
    resumeEl.hidden = false;
    document.body.classList.add('is-resume');
    resumeEl.scrollTop = 0;
  }
  function closeResume() {
    resumeEl.hidden = true;
    document.body.classList.remove('is-resume');
    releaseFocus();
  }
  function resumeOpen() { return !resumeEl.hidden; }

  /* ====================================================================== */
  return {
    open: open, close: close, step: step, isOpen: isOpen, panelOpen: panelOpen,
    toast: toast, hint: hint, setZone: setZone, setBits: setBits,
    openMap: openMap, closeMap: closeMap, mapOpen: mapOpen, drawMap: drawMap,
    openResume: openResume, closeResume: closeResume, resumeOpen: resumeOpen,
    setWarpHandler: function (fn) { onWarp = fn; },
  };
})();
