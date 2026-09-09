/* ==========================================================================
   rain.js: falling code behind the page.

   The trap with this effect is that it fights the text. Three things keep it
   readable:
   - very low alpha, so it reads as texture rather than content
   - a slow frame rate (about 14fps), because fast rain draws the eye
   - a vignette in CSS that fades it out behind the main column

   It freezes entirely for prefers-reduced-motion and when the tab is hidden.
   ========================================================================== */

window.RAIN = (function () {
  'use strict';

  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}()/*+-=$#@!;:.^~|&%'.split('');
  const FONT = 14;          // px, at device scale 1
  const FPS = 14;
  const HEAD = 'rgba(160, 255, 180, 0.85)';
  const BODY = 'rgba(80, 200, 110, 0.55)';

  let canvas, ctx, cols, drops, w, h, dpr, timer, running = false;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT + 'px "JetBrains Mono", monospace';
    ctx.textBaseline = 'top';

    cols = Math.ceil(w / FONT);
    drops = new Array(cols);
    for (let i = 0; i < cols; i++) {
      // stagger the start so columns do not fall in lockstep
      drops[i] = {
        y: Math.random() * -h,
        speed: 0.55 + Math.random() * 1.15,
        len: 6 + Math.floor(Math.random() * 16),
      };
    }
  }

  function frame() {
    // fade the previous frame instead of clearing, which leaves the trail
    ctx.fillStyle = 'rgba(10, 12, 16, 0.16)';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < cols; i++) {
      const d = drops[i];
      const x = i * FONT;
      const y = Math.floor(d.y) * FONT;

      if (y > -FONT && y < h) {
        ctx.fillStyle = HEAD;
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y);
      }
      // a couple of dimmer glyphs trailing behind the head
      ctx.fillStyle = BODY;
      for (let k = 1; k < 3; k++) {
        const ty = y - k * FONT;
        if (ty > -FONT && ty < h && Math.random() > 0.55) {
          ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, ty);
        }
      }

      d.y += d.speed;
      if (y > h + d.len * FONT) {
        d.y = Math.random() * -40;
        d.speed = 0.55 + Math.random() * 1.15;
      }
    }
  }

  function loop() {
    if (!running) return;
    frame();
    timer = setTimeout(loop, 1000 / FPS);
  }

  function start() { if (running) return; running = true; loop(); }
  function stop() { running = false; clearTimeout(timer); }

  return {
    init: function () {
      canvas = document.getElementById('rain');
      if (!canvas) return;
      ctx = canvas.getContext('2d');

      const reduced = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      size();
      if (reduced) { frame(); return; }   // one static frame, then leave it alone

      start();

      let rt = null;
      window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(size, 180);
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
    },
    stop: stop,
    start: start,
  };
})();
