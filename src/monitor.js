/* ==========================================================================
   monitor.js

   Live panel for the PokeDropz card. Reads a snapshot published by the
   running system, so the numbers on this page are the real ones rather
   than copy written once and left to rot.

   Two deliberate properties:

   - DELAYED. The feed is published a fixed number of minutes behind
     reality, stated on the panel. Real data, useless for racing a
     restock.
   - NO SECRETS. The snapshot carries counts, timings and product names
     only. No webhook, no token, no proxy address ever reaches it.

   The counters tick between fetches by extrapolating from the measured
   scan rate, which is why the panel feels live at 60fps while only
   hitting the network every POLL_MS.
   ========================================================================== */

window.MONITOR = (function () {
  'use strict';

  var ENDPOINT = '/api/stats';
  var POLL_MS = 20000;

  var state = null;
  var baseChecks = 0;     // checks at the moment of the last fetch
  var baseAt = 0;         // performance.now() at that moment
  var raf = null;

  function num(n) {
    return (n == null ? '0' : Number(n).toLocaleString('en-CA'));
  }

  function el(cls, html) {
    var d = document.createElement('div');
    d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  /* Checks performed TODAY, not since launch.

     The backend reports a rate, not a lifetime counter. Multiplying
     today's rate by the whole uptime would claim a number the system
     never actually did, because the scanner has not always run this
     fast. Seconds-since-midnight times the measured rate is a figure
     that holds up. */
  function secondsToday() {
    var now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  }

  function checksNow() {
    if (!state || !state.live.scans_per_s) return 0;
    var elapsed = (performance.now() - baseAt) / 1000;
    return Math.floor(baseChecks + state.live.scans_per_s * elapsed);
  }

  function stat(value, label, hot) {
    return '<div class="mon-stat' + (hot ? ' hot' : '') + '">' +
      '<b>' + value + '</b><span>' + label + '</span></div>';
  }

  function render(root) {
    if (!state) return;
    var L = state.live;

    var head =
      '<div class="mon-head">' +
        '<span class="mon-dot"></span>' +
        '<span class="mon-title">live monitor</span>' +
        '<span class="mon-delay">delayed ' + L_delay() + ' min</span>' +
      '</div>';

    var stats = '<div class="mon-stats">' +
      stat(L.uptime_months + ' mo', 'uptime', true) +
      stat(num(L.users) + '+', 'users served') +
      stat(num(L.tracked), 'products tracked') +
      stat(num(L.in_stock), 'in stock now') +
      stat(num(L.alerts_sent), 'alerts sent') +
      stat((L.cadence_s == null ? '-' : L.cadence_s + 's'), 'per-product check') +
      '</div>';

    var ticker =
      '<div class="mon-ticker">' +
        '<span class="mon-tick-n" id="mon-tick">' + num(checksNow()) + '</span>' +
        '<span class="mon-tick-l">stock checks today' +
          (L.scans_per_s ? ' &middot; ' + L.scans_per_s + '/sec live' : '') +
        '</span>' +
      '</div>';

    var rows = (state.recent || []).slice(0, 8).map(function (r) {
      return '<li>' +
        '<span class="mon-price">' + (r.price || '-') + '</span>' +
        '<span class="mon-name">' + r.title + '</span>' +
        '<span class="mon-ago">' + ago(r.ago_min) + '</span>' +
      '</li>';
    }).join('');

    var feed = rows
      ? '<div class="mon-feed"><h4>recent detections</h4><ul>' + rows + '</ul></div>'
      : '';

    root.innerHTML = head + stats + ticker + feed;
  }

  function L_delay() {
    return state && state.delay_minutes != null ? state.delay_minutes : 15;
  }

  function ago(min) {
    if (min == null) return '';
    if (min < 60) return min + 'm ago';
    var h = Math.floor(min / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  /* Repaint only the ticker between fetches: cheap, and it keeps the
     number visibly moving without re-rendering the whole panel.

     A timer rather than requestAnimationFrame: rAF is paused whenever
     the page is not painting, which froze the counter outright in
     testing. 100ms is well under the eye's threshold for 'live' and
     costs nothing. */
  function tick() {
    var n = document.getElementById('mon-tick');
    if (n && state) n.textContent = num(checksNow());
  }

  function load(root) {
    return fetch(ENDPOINT, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        state = d;
        baseChecks = (d.live.scans_per_s || 0) * secondsToday();
        baseAt = performance.now();
        render(root);
        if (!raf) { tick(); raf = setInterval(tick, 100); }
      })
      .catch(function () {
        if (!state) {
          root.innerHTML =
            '<div class="mon-head"><span class="mon-dot off"></span>' +
            '<span class="mon-title">live monitor</span></div>' +
            '<p class="mon-err">Monitor unreachable right now. ' +
            'The service itself is unaffected.</p>';
        }
      });
  }

  function mount(root) {
    if (!root) return;
    root.className = 'monitor';
    load(root);
    setInterval(function () { load(root); }, POLL_MS);
  }

  return { mount: mount };
})();
