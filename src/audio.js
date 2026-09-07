/* ==========================================================================
   audio.js: tiny Web Audio blips. No files, no autoplay, off by default.
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

  /* ---- sustained snow-under-the-board -------------------------------------
     Riding on snow is broadband noise shaped by how fast you're going, so it
     synthesises cleanly: one looping noise buffer through a bandpass (the
     hiss) and a lowpass (the body). Speed opens both filters and lifts the
     gain, so it rises as you accelerate and settles as you coast. No audio
     file involved. */
  let rideNodes = null;

  function noiseBuffer(c) {
    const len = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function ensureRide() {
    const c = ensure();
    if (!c) return null;
    if (rideNodes) return rideNodes;

    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;

    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.55;

    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;

    const gain = c.createGain();
    gain.gain.value = 0;

    src.connect(bp); bp.connect(lp); lp.connect(gain); gain.connect(c.destination);
    src.start();

    rideNodes = { src: src, bp: bp, lp: lp, gain: gain };
    return rideNodes;
  }

  return {
    isOn: function () { return on; },

    /* Called every frame while the board is out. `speed` is 0..1. */
    ride: function (active, speed) {
      if (!on) {
        if (rideNodes) { try { rideNodes.gain.gain.value = 0; } catch (e) { /* gone */ } }
        return;
      }
      const n = ensureRide();
      if (!n || !ctx) return;
      const now = ctx.currentTime;
      const s = Math.max(0, Math.min(1, speed || 0));
      // quick to swell, slower to die away, like the board settling
      n.gain.gain.setTargetAtTime(active ? 0.015 + s * 0.055 : 0, now, active ? 0.07 : 0.2);
      n.bp.frequency.setTargetAtTime(700 + s * 1600, now, 0.12);
      n.lp.frequency.setTargetAtTime(2200 + s * 3000, now, 0.12);
    },
    toggle: function () {
      on = !on;
      try { localStorage.setItem('sound', on ? '1' : '0'); } catch (e) { /* ignore */ }
      if (on) tone(660, 0.09, 'triangle', 0.07);
      return on;
    },
    // Footsteps sit under everything else, but not by much. At 0.018 they
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
