/* ==========================================================================
   audio.js — tiny Web Audio blips. No files, no autoplay, off by default.
   ========================================================================== */

window.SFX = (function () {
  'use strict';

  let ctx = null;
  let on = false;
  try { on = localStorage.getItem('sound') === '1'; } catch (e) { /* private mode */ }

  function ensure() {
    if (!on) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slide) {
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol || 0.08, c.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur + 0.02);
  }

  return {
    isOn: function () { return on; },
    toggle: function () {
      on = !on;
      try { localStorage.setItem('sound', on ? '1' : '0'); } catch (e) { /* ignore */ }
      if (on) tone(660, 0.09, 'triangle', 0.07);
      return on;
    },
    // Footsteps sit under everything else, but not by much — at 0.018 they
    // disappeared entirely once background music was playing.
    step:   function () { tone(180 + Math.random() * 40, 0.07, 'triangle', 0.05); },
    open:   function () { tone(420, 0.13, 'triangle', 0.07, 720); },
    close:  function () { tone(520, 0.1, 'triangle', 0.05, 300); },
    pickup: function () { tone(880, 0.09, 'square', 0.05); setTimeout(function () { tone(1320, 0.13, 'square', 0.045); }, 70); },
    enter:  function () { tone(300, 0.18, 'sine', 0.06, 600); },
    deny:   function () { tone(200, 0.14, 'sawtooth', 0.04, 120); },
    fanfare: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        setTimeout(function () { tone(f, 0.22, 'triangle', 0.06); }, i * 110);
      });
    },
  };
})();
