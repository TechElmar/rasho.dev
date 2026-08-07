/* ==========================================================================
   music.js — looping background music with a crossfaded loop point.

   Rules this follows, deliberately:
   - Nothing ever autoplays. Browsers block it anyway, and a portfolio that
     starts making noise at a recruiter is a portfolio they close.
   - The choice is remembered, so a returning visitor gets what they picked.
   - It ducks out of the way when a panel plays its own audio or video.

   Why two <audio> elements instead of one with loop=true:
   `loop` splices the end straight onto the start, so any mismatch at the
   seam is audible as a click or a jump every pass. Instead two elements
   ping-pong — as one nears its end the other starts from zero and they
   crossfade over ~2s, which hides an imperfect loop point entirely.

   The crossfade is equal-power (sine-shaped), not linear. The two sides of
   the seam are different material, so a linear fade would dip in volume
   through the middle of every crossover; sine shaping holds it steady.
   ========================================================================== */

window.MUSIC = (function () {
  'use strict';

  const cfg = (window.CONTENT.meta && window.CONTENT.meta.music) || null;

  const TICK = 40;          // ms between volume updates
  const MASTER_EASE = 0.10; // per tick — master fade in/out over roughly 0.8s

  let a = null, b = null;   // the two ping-ponging elements
  let active = null;        // the one currently heading toward its loop point
  let timer = null;
  let swapGuard = 0;

  let masterVol = 0;        // current master level
  let masterTarget = 0;     // where it wants to be
  let on = false;           // the visitor's preference, remembered
  let inWorld = false;      // are we actually in the world right now
  let ducked = false;

  try { on = localStorage.getItem('music') === '1'; } catch (e) { /* private mode */ }

  function available() { return !!(cfg && cfg.src); }
  function baseVol() { return (cfg && cfg.volume != null) ? cfg.volume : 0.26; }

  /* Music needs BOTH the preference and the context: it must never play over
     the title screen or the résumé, and a returning visitor whose preference
     is already `on` should hear it the moment they enter the world without
     having to toggle the button twice. */
  function wanted() {
    if (!on || !inWorld) return 0;
    return ducked ? baseVol() * 0.12 : baseVol();
  }

  function apply() {
    if (on && inWorld) play(); else stop();
  }

  /* Crossfade length, clamped so a short file can't overlap with itself. */
  function xfade(dur) {
    const want = (cfg && cfg.crossfade != null) ? cfg.crossfade : 2.2;
    if (!dur || isNaN(dur)) return want;
    return Math.min(want, Math.max(0.4, dur / 4));
  }

  function make() {
    const el = new Audio(cfg.src);
    el.loop = false;        // we do the looping ourselves
    el.preload = 'auto';    // the second element must be buffered before it is needed
    el.volume = 0;
    el.addEventListener('error', function () { on = false; teardown(); });
    return el;
  }

  function ensure() {
    if (a || !available()) return;
    a = make();
    b = make();
    active = a;
  }

  function teardown() {
    clearInterval(timer); timer = null;
    [a, b].forEach(function (el) { if (el) { try { el.pause(); } catch (e) { /* gone */ } } });
    a = b = active = null;
    masterVol = 0;
  }

  /* Equal-power curve: sin(x · π/2). Holds perceived loudness flat across
     the overlap instead of dipping in the middle the way a linear fade does. */
  function shape(x) {
    return Math.sin(Math.max(0, Math.min(1, x)) * Math.PI / 2);
  }

  /* An element's own gain, derived purely from where its playhead is. */
  function gainFor(el) {
    if (!el || !el.duration || isNaN(el.duration)) return 1;
    const xf = xfade(el.duration);
    return Math.min(
      shape(el.currentTime / xf),                     // fading in
      shape((el.duration - el.currentTime) / xf)      // fading out
    );
  }

  function tick() {
    masterVol += (masterTarget - masterVol) * MASTER_EASE;

    // Hand over to the other element as this one approaches its end.
    if (active && active.duration && !isNaN(active.duration)) {
      const xf = xfade(active.duration);
      const now = Date.now();
      if (active.currentTime >= active.duration - xf && now - swapGuard > xf * 1000 * 0.8) {
        swapGuard = now;
        const other = (active === a) ? b : a;
        try {
          other.currentTime = 0;
          const p = other.play();
          if (p && p.catch) p.catch(function () { /* ignore */ });
        } catch (e) { /* element not ready; next tick retries */ }
        active = other;
      }
    }

    [a, b].forEach(function (el) {
      if (!el) return;
      const v = masterVol * gainFor(el);
      try { el.volume = Math.max(0, Math.min(1, v)); } catch (e) { /* detached */ }
    });

    // Fully faded out — stop burning cycles and release playback.
    if (masterTarget === 0 && masterVol < 0.004) {
      [a, b].forEach(function (el) { if (el) { try { el.pause(); } catch (e) { /* gone */ } } });
      clearInterval(timer); timer = null;
      masterVol = 0;
    }
  }

  function run() {
    if (!timer) timer = setInterval(tick, TICK);
  }

  function play() {
    ensure();
    if (!active) return;
    const p = active.play();
    if (p && p.catch) p.catch(function () { /* needs a gesture; the toggle is one */ });
    masterTarget = wanted();
    run();
  }

  function stop() {
    masterTarget = 0;
    run(); // let the ticker fade it down, then pause
  }

  return {
    available: available,
    isOn: function () { return on; },

    toggle: function () {
      on = !on;
      try { localStorage.setItem('music', on ? '1' : '0'); } catch (e) { /* ignore */ }
      apply();
      return on;
    },

    /* Entering / leaving the world. Called with a real user gesture behind it
       (the Enter button, the R key), which is what unblocks autoplay. */
    setWorld: function (state) {
      if (inWorld === !!state) return;
      inWorld = !!state;
      apply();
    },

    /* Panel media takes priority — drop to a background murmur, don't stop. */
    duck: function (state) {
      ducked = !!state;
      if (!on || !inWorld) return;
      masterTarget = wanted();
      if (a) run();
    },

    onVisibility: function () {
      if (!on || !inWorld || !a) return;
      if (document.hidden) {
        [a, b].forEach(function (el) { try { el.pause(); } catch (e) { /* gone */ } });
        clearInterval(timer); timer = null;
      } else {
        const p = active && active.play();
        if (p && p.catch) p.catch(function () { /* ignore */ });
        run();
      }
    },

    /* exposed for verification */
    _debug: function () {
      return {
        on: on, ducked: ducked, masterVol: masterVol, masterTarget: masterTarget,
        active: active === a ? 'a' : (active === b ? 'b' : null),
        aTime: a ? a.currentTime : null, bTime: b ? b.currentTime : null,
        aVol: a ? a.volume : null, bVol: b ? b.volume : null,
        duration: a ? a.duration : null, xfade: a ? xfade(a.duration) : null,
      };
    },
  };
})();
