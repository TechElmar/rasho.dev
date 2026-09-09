/* ==========================================================================
   demos.js

   Each project gets a pane that shows how it actually works rather than
   describing it.

   HONESTY NOTE, and it matters on a professional site: PokeDropz runs on a
   private EC2 box with no public endpoint, so the console below is a
   SIMULATED REPLAY of its real log format, not a live feed. It is labelled
   as such in the title bar. If a read-only status endpoint ever exists,
   set FEED_URL and the same pane renders real data instead.
   ========================================================================== */

window.DEMOS = (function () {
  'use strict';

  const FEED_URL = null;   // set to a JSON endpoint to go genuinely live

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function pad(n, w) { return String(n).padStart(w, '0'); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function between(a, b) { return a + Math.random() * (b - a); }

  /* Only animate a pane while it is actually on screen. */
  function whenVisible(node, start, stop) {
    if (!('IntersectionObserver' in window)) { start(); return; }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.15 });
    io.observe(node);
  }

  /* ======================================================================
     POKEDROPZ: streaming monitor log
     ====================================================================== */
  const SKUS = [
    { id: 'B0CJ2M8TQ7', name: '151-booster-bundle',      role: '@151' },
    { id: 'B0D7K3M1PQ', name: 'charizard-ex-box',        role: '@chase' },
    { id: 'B0F2N9X4LC', name: 'paldea-evolved-etb',      role: '@etb' },
    { id: 'B0CQ8V2WRT', name: 'prismatic-surprise-box',  role: '@prismatic' },
    { id: 'B0BZ5H7YKD', name: 'twilight-masquerade-btb', role: '@btb' },
    { id: 'B0D4L1J8MN', name: 'shrouded-fable-etb',      role: '@etb' },
  ];
  const REGIONS = ['ca-central-1', 'us-east-1', 'us-west-2'];

  function pokedropz(host) {
    const wrap = el('div', 'demo');

    const bar = el('div', 'demo-bar');
    bar.appendChild(el('span', 'demo-dot live'));
    bar.appendChild(el('span', 'demo-name', 'pokedropz &mdash; monitor.log'.replace('&mdash;', '/')));
    const pauseBtn = el('button', 'demo-btn', 'pause');
    pauseBtn.type = 'button';
    bar.appendChild(el('span', 'demo-note', FEED_URL ? 'live feed' : 'simulated replay of the production log format'));
    bar.appendChild(pauseBtn);
    wrap.appendChild(bar);

    const con = el('div', 'console');
    con.setAttribute('aria-hidden', 'true');
    wrap.appendChild(con);

    const stats = el('div', 'stats');
    const S = {
      checks: 128400 + Math.floor(Math.random() * 900),
      alerts: 4127,
      users: 7043,
      p95: 212,
    };
    function statCell(k, v, cls) {
      const c = el('div', 'stat');
      c.appendChild(el('div', 'stat-k', k));
      c.appendChild(el('div', 'stat-v' + (cls ? ' ' + cls : ''), v));
      return c;
    }
    stats.appendChild(statCell('uptime', '12+ mo', 'accent'));
    const cChecks = statCell('checks', S.checks.toLocaleString());
    const cAlerts = statCell('alerts sent', S.alerts.toLocaleString());
    stats.appendChild(cChecks);
    stats.appendChild(cAlerts);
    stats.appendChild(statCell('subscribers', S.users.toLocaleString()));
    stats.appendChild(statCell('p95 check', S.p95 + 'ms'));
    wrap.appendChild(stats);

    wrap.appendChild(el('pre', 'ascii',
      '  <b>watcher</b> ──┬─▶ proxy pool (120)  ──▶ amazon.ca product pages\n' +
      '            │                              │\n' +
      '            │        <b>parse</b> availability ◀──┘\n' +
      '            │              │\n' +
      '            │              ├─ unchanged ──▶ drop\n' +
      '            │              └─ <b>CHANGED</b> ──▶ state → s3\n' +
      '            │                                    │\n' +
      '            └──────────── <b>discord webhook</b> ◀───┘\n' +
      '                          role-routed into Pokémon TCG Canada'
    ));

    host.appendChild(wrap);

    /* ---- the replay ---- */
    let t = new Date();
    t.setHours(14, 2, 11, 204);
    let running = false, timer = null;
    let lines = 0;

    function stamp() {
      t = new Date(t.getTime() + between(120, 900));
      return pad(t.getHours(), 2) + ':' + pad(t.getMinutes(), 2) + ':' +
             pad(t.getSeconds(), 2) + '.' + pad(t.getMilliseconds(), 3);
    }

    function put(html) {
      const ln = el('span', 'ln', html);
      con.appendChild(ln);
      lines++;
      while (lines > 60) { con.removeChild(con.firstChild); lines--; }
      con.scrollTop = con.scrollHeight;
    }

    function step() {
      const r = Math.random();
      const sku = pick(SKUS);
      const ms = Math.round(between(96, 340));

      if (r < 0.10) {
        put('<span class="t">' + stamp() + '</span>  <span class="op">proxy  </span> ' +
            'rotate → pool[<span class="val">' + Math.floor(between(1, 120)) + '/120</span>] ' +
            '<span class="dim">' + pick(REGIONS) + '</span>');
      } else if (r < 0.17) {
        put('<span class="t">' + stamp() + '</span>  <span class="op">retry  </span> ' +
            '<span class="err">429</span> backoff ' + (Math.round(between(1, 8)) * 250) + 'ms ' +
            '<span class="dim">attempt 2/5</span>');
      } else if (r < 0.80) {
        put('<span class="t">' + stamp() + '</span>  <span class="op">GET    </span> ' +
            '/dp/' + sku.id + '  <span class="dim">sku=</span>' + sku.name +
            '  <span class="val">' + ms + 'ms</span> <span class="ok">200</span>');
        put('<span class="t">' + stamp() + '</span>  <span class="op">parse  </span> ' +
            'availability=<span class="val">OUT_OF_STOCK</span> <span class="dim">unchanged</span>');
      } else {
        put('<span class="t">' + stamp() + '</span>  <span class="op">GET    </span> ' +
            '/dp/' + sku.id + '  <span class="dim">sku=</span>' + sku.name +
            '  <span class="val">' + ms + 'ms</span> <span class="ok">200</span>');
        put('<span class="t">' + stamp() + '</span>  <span class="op">parse  </span> ' +
            'availability=<span class="chg">IN_STOCK</span> <span class="chg">← CHANGED</span>');
        put('<span class="t">' + stamp() + '</span>  <span class="op">cache  </span> ' +
            'write state → <span class="dim">s3://pokedropz/state.json</span>');
        put('<span class="t">' + stamp() + '</span>  <span class="op">discord</span> ' +
            'POST <span class="hi">#restock-alerts</span> role=' + sku.role +
            ' <span class="dim">' + S.users.toLocaleString() + ' subs</span>');
        const lat = Math.round(between(140, 260));
        put('<span class="t">' + stamp() + '</span>  <span class="op">ok     </span> ' +
            '<span class="ok">alert delivered</span> <span class="dim">latency ' + lat + 'ms</span>');
        S.alerts++;
        cAlerts.querySelector('.stat-v').textContent = S.alerts.toLocaleString();
      }

      S.checks++;
      cChecks.querySelector('.stat-v').textContent = S.checks.toLocaleString();
      timer = setTimeout(step, between(260, 900));
    }

    function start() { if (running) return; running = true; step(); }
    function stop() { running = false; clearTimeout(timer); }

    pauseBtn.addEventListener('click', function () {
      if (running) { stop(); pauseBtn.textContent = 'resume'; bar.querySelector('.demo-dot').classList.remove('live'); }
      else { start(); pauseBtn.textContent = 'pause'; bar.querySelector('.demo-dot').classList.add('live'); }
    });

    // seed a few lines so the pane is never empty before it scrolls into view
    for (let i = 0; i < 8; i++) step();
    stop();
    whenVisible(wrap, function () { if (pauseBtn.textContent === 'pause') start(); }, stop);
  }

  /* ======================================================================
     MORPH: the prompt chain, stepped through
     ====================================================================== */
  const STAGES = [
    ['upload',   'photo → resized, stripped of EXIF', 'client'],
    ['vision',   'OpenAI Vision: describe physique',  '~1.8s'],
    ['rate',     'chat: score + critique  {json}',    '~2.1s'],
    ['plan',     'chat: meal plan  {json schema}',    '~2.6s'],
    ['train',    'chat: split + progression  {json}', '~2.4s'],
    ['render',   'SwiftUI binds decoded structs',     'instant'],
  ];

  function morph(host) {
    const wrap = el('div', 'demo');
    const bar = el('div', 'demo-bar');
    bar.appendChild(el('span', 'demo-dot'));
    bar.appendChild(el('span', 'demo-name', 'morph / pipeline'));
    bar.appendChild(el('span', 'demo-note', 'the prompt chain, one stage per call'));
    wrap.appendChild(bar);

    const pipe = el('div', 'pipe');
    STAGES.forEach(function (s, i) {
      const st = el('div', 'stage');
      st.appendChild(el('span', 'stage-n', pad(i + 1, 2)));
      st.appendChild(el('span', 'stage-t', '<b style="color:var(--ink-hi);font-weight:500">' + s[0] + '</b> <span class="dim">' + s[1] + '</span>'));
      st.appendChild(el('span', 'stage-m', s[2]));
      pipe.appendChild(st);
    });
    wrap.appendChild(pipe);

    wrap.appendChild(el('pre', 'ascii',
      '  every stage is schema-constrained, so the next call never has to\n' +
      '  guess at the last one\'s output:\n\n' +
      '  <b>{ "rating": 7.4, "critique": [...], "focus": "posterior chain" }</b>\n' +
      '     └─▶ decoded straight into a Swift struct. parse failures: 0'
    ));

    host.appendChild(wrap);

    let i = 0, timer = null, running = false;
    const stages = pipe.querySelectorAll('.stage');
    function step() {
      stages.forEach(function (s, n) {
        s.classList.toggle('on', n === i);
        s.classList.toggle('done', n < i);
      });
      i = (i + 1) % (STAGES.length + 2);   // pause on empty at the end
      timer = setTimeout(step, i === 0 ? 900 : 820);
    }
    function start() { if (running) return; running = true; step(); }
    function stop() { running = false; clearTimeout(timer); }
    whenVisible(wrap, start, stop);
  }

  /* ======================================================================
     GPT MINI: where the model runs
     ====================================================================== */
  function gptmini(host) {
    const wrap = el('div', 'demo');
    const bar = el('div', 'demo-bar');
    bar.appendChild(el('span', 'demo-dot'));
    bar.appendChild(el('span', 'demo-name', 'gpt-mini / data flow'));
    bar.appendChild(el('span', 'demo-note', 'nothing leaves the browser'));
    wrap.appendChild(bar);

    wrap.appendChild(el('pre', 'ascii',
      '  selection ──▶ content script ──▶ service worker\n' +
      '                                        │\n' +
      '                                        ▼\n' +
      '                            <b>WebLLM runtime (WebGPU)</b>\n' +
      '                            model weights cached locally\n' +
      '                                        │\n' +
      '  inline answer ◀── DOM render ◀────────┘\n\n' +
      '  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌\n' +
      '  network calls to a model API: <b>0</b>\n' +
      '  API keys required: <b>0</b>       cost per user: <b>$0</b>'
    ));

    host.appendChild(wrap);
  }

  /* ======================================================================
     Fallback for anything without a bespoke pane
     ====================================================================== */
  function generic(host, project) {
    if (!project.stack || !project.stack.length) return;
    const wrap = el('div', 'demo');
    const bar = el('div', 'demo-bar');
    bar.appendChild(el('span', 'demo-dot'));
    bar.appendChild(el('span', 'demo-name', (project.name || '').toLowerCase() + ' / stack'));
    wrap.appendChild(bar);
    wrap.appendChild(el('pre', 'ascii', '  ' + project.stack.join('  ·  ')));
    host.appendChild(wrap);
  }

  const BY_NAME = {
    'pokedropz': pokedropz,
    'morph': morph,
    'gpt mini': gptmini,
  };

  return {
    mount: function (host, name, project) {
      const fn = BY_NAME[(name || '').toLowerCase()];
      if (fn) fn(host);
      else if (project) generic(host, project);
    },
    has: function (name) { return !!BY_NAME[(name || '').toLowerCase()]; },
  };
})();
