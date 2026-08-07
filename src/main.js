/* ==========================================================================
   main.js — boot, camera, game loop, interaction, progress.
   ========================================================================== */

(function () {
  'use strict';

  const C = window.CONTENT;
  const W = window.WORLD;
  const D = window.DRAW;
  const IN = window.INPUT;
  const UI = window.UI;
  const SFX = window.SFX;

  const $ = function (id) { return document.getElementById(id); };

  const canvas = $('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  let vw = 0, vh = 0, dpr = 1;
  let started = false;
  let t = 0;

  const cam = { x: 0, y: 0 };
  const player = window.PLAYER.create();
  const particles = [];
  let activeProp = null;
  let lastZone = null;

  /* ---------- world bounds for camera clamping --------------------------- */
  const bounds = (function () {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    W.islands.forEach(function (i) {
      x0 = Math.min(x0, i.x); y0 = Math.min(y0, i.y);
      x1 = Math.max(x1, i.x + i.w); y1 = Math.max(y1, i.y + i.h);
    });
    const pad = 240;
    return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad };
  })();

  /* ======================================================================
     progress
     ====================================================================== */
  const SAVE_KEY = 'world-progress-v1';

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        bits: W.bits.filter(function (b) { return b.taken; }).map(function (b) { return b.id; }),
        vault: W.state.vaultOpen,
        visited: W.state.visited,
        board: W.state.hasBoard,
      }));
    } catch (e) { /* private mode — progress just won't persist */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      (s.bits || []).forEach(function (id) {
        const b = W.bits.filter(function (x) { return x.id === id; })[0];
        if (b) { b.taken = true; W.state.bitsFound++; }
      });
      W.state.vaultOpen = !!s.vault;
      W.state.visited = s.visited || {};
      W.state.hasBoard = !!s.board;
    } catch (e) { /* ignore corrupt save */ }
  }

  /* ======================================================================
     sizing
     ====================================================================== */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });

  function centreCamera(snap) {
    const tx = player.x - vw / 2;
    const ty = player.y - vh / 2;
    const cx = bounds.x1 - bounds.x0 < vw
      ? (bounds.x0 + bounds.x1) / 2 - vw / 2
      : Math.max(bounds.x0, Math.min(tx, bounds.x1 - vw));
    const cy = bounds.y1 - bounds.y0 < vh
      ? (bounds.y0 + bounds.y1) / 2 - vh / 2
      : Math.max(bounds.y0, Math.min(ty, bounds.y1 - vh));
    if (snap) { cam.x = cx; cam.y = cy; }
    else { cam.x += (cx - cam.x) * 0.12; cam.y += (cy - cam.y) * 0.12; }
  }

  /* ======================================================================
     interaction
     ====================================================================== */
  function findActive() {
    let best = null, bestD = 104;
    for (let i = 0; i < W.props.length; i++) {
      const p = W.props[i];
      if (!p.view) continue;
      const island = W.byId[p.island];
      if (island && island.secret && !W.state.vaultOpen) continue;
      if (p.hideWhen && W.state[p.hideWhen]) continue;
      const d = Math.hypot(p.x - player.x, p.y - player.y - 10);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  function interact(p) {
    if (!p) return;
    if (p.action === 'takeBoard' && !W.state.hasBoard) {
      W.state.hasBoard = true;
      save();
      SFX.fanfare();
      updateRideUI();
      activeProp = null;
    }
    UI.open(p.view, p.index || 0);
    W.state.seen[p.id] = true;
  }

  /* Riding: hold Shift on a keyboard, or the board button on touch. */
  let rideToggle = false;

  function updateRideUI() {
    const btn = $('btn-ride');
    btn.hidden = !W.state.hasBoard;
    btn.classList.toggle('off', !rideToggle);
  }

  function isRiding() {
    if (!W.state.hasBoard) return false;
    return IN.isShift() || rideToggle;
  }

  function updatePrompt() {
    const el = $('prompt');
    if (!activeProp || UI.isOpen()) { el.hidden = true; return; }
    el.hidden = false;
    $('prompt-text').textContent = activeProp.label || 'Examine';
    const sx = activeProp.x - cam.x;
    const sy = activeProp.y - activeProp.h - 34 - cam.y;
    el.style.left = Math.round(sx) + 'px';
    el.style.top = Math.round(Math.max(46, sy)) + 'px';
  }

  /* ======================================================================
     pickups + zone changes
     ====================================================================== */
  function checkBits() {
    for (let i = 0; i < W.bits.length; i++) {
      const b = W.bits[i];
      if (b.taken) continue;
      if (Math.hypot(b.x - player.x, b.y - player.y) < 42) {
        b.taken = true;
        W.state.bitsFound++;
        UI.setBits(W.state.bitsFound);
        SFX.pickup();
        save();
        if (W.state.bitsFound >= W.BIT_TOTAL) {
          W.state.vaultOpen = true;
          SFX.fanfare();
          UI.toast('All fragments found — a bridge appeared north-east of The Workshop', '✧');
          save();
        } else {
          UI.toast('Fragment ' + W.state.bitsFound + ' of ' + W.BIT_TOTAL, '✦');
        }
      }
    }
  }

  function checkZone() {
    const island = W.islandAt(player.x, player.y);
    if (!island || island === lastZone) return;
    lastZone = island;
    UI.setZone(island);
    if (!W.state.visited[island.id]) {
      W.state.visited[island.id] = true;
      SFX.enter();
      UI.toast('Entered ' + island.name, island.icon);
      save();
      const main = W.islands.filter(function (i) { return !i.secret; });
      const all = main.every(function (i) { return W.state.visited[i.id]; });
      if (all) setTimeout(function () { UI.toast('Every district visited. Now find the fragments.', '★'); }, 2200);
    }
  }

  /* ======================================================================
     click / tap to move
     ====================================================================== */
  let moveTarget = null;
  let autoTarget = null;
  let stuckTimer = 0;

  canvas.addEventListener('pointerdown', function (e) {
    if (!started || UI.isOpen()) return;
    const wx = e.clientX + cam.x;
    const wy = e.clientY + cam.y;

    let hit = null;
    for (let i = 0; i < W.props.length; i++) {
      const p = W.props[i];
      if (!p.view) continue;
      const island = W.byId[p.island];
      if (island && island.secret && !W.state.vaultOpen) continue;
      if (wx > p.x - p.w / 2 - 10 && wx < p.x + p.w / 2 + 10 && wy > p.y - p.h - 10 && wy < p.y + 16) { hit = p; break; }
    }

    if (hit) {
      if (Math.hypot(hit.x - player.x, hit.y - player.y) < 104) { interact(hit); return; }
      moveTarget = { x: hit.x, y: hit.y + 46 };
      autoTarget = hit;
    } else if (W.isWalkable(wx, wy)) {
      moveTarget = { x: wx, y: wy };
      autoTarget = null;
    }
    stuckTimer = 0;
  });

  function steerToTarget(dir) {
    if (!moveTarget) return dir;
    if (IN.isMoving()) { moveTarget = null; autoTarget = null; return dir; }
    const dx = moveTarget.x - player.x;
    const dy = moveTarget.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 16) {
      moveTarget = null;
      if (autoTarget) { interact(autoTarget); autoTarget = null; }
      return dir;
    }
    dir.x = dx / d;
    dir.y = dy / d;
    return dir;
  }

  /* ======================================================================
     loop
     ====================================================================== */
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    t += dt;

    if (started) {
      const blocked = UI.isOpen();
      let dir = blocked ? { x: 0, y: 0 } : IN.update();
      if (blocked) { moveTarget = null; autoTarget = null; }
      else dir = steerToTarget(dir);

      player.riding = !blocked && isRiding();

      const px = player.x, py = player.y;
      window.PLAYER.update(player, dir, dt, particles);

      if (moveTarget) {
        stuckTimer = Math.hypot(player.x - px, player.y - py) < 0.4 ? stuckTimer + dt : 0;
        if (stuckTimer > 0.45) { moveTarget = null; autoTarget = null; stuckTimer = 0; }
      }

      window.PLAYER.updateParticles(particles, dt);

      // snow under the board, scaled by how fast you're actually going
      if (W.state.hasBoard) {
        SFX.ride(player.riding && player.speed > 40, player.speed / 620);
      }

      checkBits();
      checkZone();
      activeProp = blocked ? null : findActive();
      centreCamera(false);
      updatePrompt();
      if (UI.mapOpen()) UI.drawMap(player);
    } else {
      centreCamera(true);
    }

    D.render(ctx, cam, vw, vh, t, player, activeProp, particles);
  }

  /* ======================================================================
     input wiring
     ====================================================================== */
  IN.onKey(function (e) {
    if (!started) {
      if (e.code === 'Enter' || e.code === 'Space') start();
      return;
    }
    switch (e.code) {
      case 'Escape':
        if (UI.resumeOpen()) closeResume();
        else if (UI.mapOpen()) UI.closeMap();
        else UI.close();
        break;
      case 'KeyM':
        if (UI.panelOpen()) return;
        UI.mapOpen() ? UI.closeMap() : UI.openMap(player);
        break;
      case 'KeyR':
        if (UI.resumeOpen()) closeResume(); else openResume();
        break;
      case 'KeyT':
        toggleSound();
        break;
      case 'KeyB':
        toggleMusic();
        break;
      case 'ArrowLeft':
        if (UI.panelOpen()) UI.step(-1);
        break;
      case 'ArrowRight':
        if (UI.panelOpen()) UI.step(1);
        break;
    }
  });

  window.addEventListener('keydown', function (e) {
    if (started && !UI.isOpen() && (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter')) {
      if (IN.consumeAction() && activeProp) interact(activeProp);
    }
  });

  function toggleSound() {
    const on = SFX.toggle();
    $('btn-sound').classList.toggle('off', !on);
    UI.toast(on ? 'Sound effects on' : 'Sound effects off', '♪');
  }

  function toggleMusic() {
    if (!window.MUSIC.available()) { UI.toast('No music file loaded', '♫'); return; }
    const on = window.MUSIC.toggle();
    $('btn-music').classList.toggle('off', !on);
    const label = (C.meta.music && C.meta.music.label) || 'Music';
    UI.toast(on ? label + ' on' : label + ' off', '♫');
  }

  document.addEventListener('visibilitychange', function () { window.MUSIC.onVisibility(); });

  /* ---------- buttons ---------------------------------------------------- */
  $('panel-close').onclick = UI.close;
  $('map-close').onclick = UI.closeMap;
  $('btn-map').onclick = function () { UI.mapOpen() ? UI.closeMap() : UI.openMap(player); };
  $('btn-resume').onclick = openResume;
  $('btn-sound').onclick = toggleSound;
  $('btn-music').onclick = toggleMusic;
  $('resume-back').onclick = function () { closeResume(); };
  $('btn-ride').onclick = function () {
    rideToggle = !rideToggle;
    updateRideUI();
    UI.toast(rideToggle ? 'Riding — the board is out' : 'Back on foot', '🏂');
  };

  // Keep HUD buttons from swallowing the next keypress: a focused button
  // holds on to Space/E, which are the movement and interact keys.
  ['btn-map', 'btn-music', 'btn-sound', 'btn-resume', 'btn-ride'].forEach(function (id) {
    $(id).addEventListener('click', function () { this.blur(); });
  });

  /* Music belongs to the world only — never over the title or the résumé. */
  function openResume() {
    window.MUSIC.setWorld(false);
    UI.openResume();
  }

  function closeResume() {
    UI.closeResume();
    if (started) window.MUSIC.setWorld(true);
    else $('title').classList.remove('leaving');
  }

  $('panel-wrap').addEventListener('pointerdown', function (e) {
    if (e.target === $('panel-wrap')) UI.close();
  });
  $('map-wrap').addEventListener('pointerdown', function (e) {
    if (e.target === $('map-wrap')) UI.closeMap();
  });

  $('touch-action').addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (activeProp) interact(activeProp);
  });

  UI.setWarpHandler(function (island) {
    player.x = island.cx;
    player.y = island.y + island.h - 90;
    player.vx = player.vy = 0;
    moveTarget = null; autoTarget = null;
    centreCamera(true);
    checkZone();
    SFX.enter();
  });

  /* ======================================================================
     start
     ====================================================================== */
  function start() {
    if (started) return;
    started = true;
    const title = $('title');
    title.classList.add('leaving');
    setTimeout(function () { title.style.display = 'none'; }, 750);
    $('hud').hidden = false;
    UI.setZone(W.byId.plaza);
    UI.setBits(W.state.bitsFound);
    updateRideUI();
    checkZone();
    SFX.enter();
    // This runs off the Enter button / Enter key — a real user gesture, which
    // is what lets a remembered "music on" actually start playing.
    window.MUSIC.setWorld(true);
    setTimeout(function () {
      UI.hint(isTouch ? 'drag the stick to move · tap things to inspect' : 'WASD to move · E to interact · M for the map');
    }, 700);
  }

  $('btn-start').onclick = start;
  $('btn-resume-fast').onclick = function () { openResume(); };

  /* ======================================================================
     boot
     ====================================================================== */
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  function boot() {
    window.REDUCED_MOTION = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    load();
    resize();
    D.initSky();
    D.initMotes();
    UI.setBits(W.state.bitsFound);
    $('bit-total').textContent = W.BIT_TOTAL;

    $('title-name').textContent = C.profile.name;
    $('title-role').textContent = C.profile.role;
    $('title-foot').textContent = C.profile.location + '  ·  ' + (C.meta.domain || '');
    document.title = C.profile.name + ' — ' + C.profile.role;

    if (!C.meta.contentReady) $('sample-badge').hidden = false;
    if (!SFX.isOn()) $('btn-sound').classList.add('off');
    if (!window.MUSIC.isOn()) $('btn-music').classList.add('off');
    if (!window.MUSIC.available()) $('btn-music').hidden = true;

    const dl = $('resume-download');
    if (C.meta.resume && C.meta.resume.file) {
      dl.href = C.meta.resume.file;
      dl.setAttribute('download', C.meta.resume.filename || '');
    } else {
      dl.hidden = true;
    }

    if (isTouch) {
      $('touch').hidden = false;
      IN.bindStick($('stick'), $('stick-nub'));
    }

    centreCamera(true);
    requestAnimationFrame(function (n) { last = n; requestAnimationFrame(frame); });
  }

  boot();
})();
