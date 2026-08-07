/* ==========================================================================
   draw.js — every pixel in this world is drawn with canvas primitives.
   There are no image assets: sprites are functions, not files.
   ========================================================================== */

window.DRAW = (function () {
  'use strict';

  const W = window.WORLD;
  const TAU = Math.PI * 2;

  /* ---------- path helpers ---------------------------------------------- */
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  }

  function shadow(ctx, x, y, w, a) {
    ctx.save();
    ctx.globalAlpha = a == null ? 0.32 : a;
    ctx.fillStyle = '#000';
    ellipse(ctx, x, y + 2, w / 2, w / 5);
    ctx.fill();
    ctx.restore();
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ======================================================================
     SKY
     ====================================================================== */
  let stars = null;
  let nebulae = null;

  function initSky() {
    const rand = W.rng(20260805);
    stars = [];
    for (let i = 0; i < 420; i++) {
      stars.push({
        x: rand(), y: rand(),
        r: 0.4 + rand() * 1.5,
        a: 0.25 + rand() * 0.7,
        layer: rand() < 0.5 ? 0.012 : 0.03,
        tw: rand() * TAU,
      });
    }
    nebulae = [
      { x: 0.18, y: 0.22, r: 0.42, c: 'rgba(125,211,252,0.10)' },
      { x: 0.82, y: 0.35, r: 0.5,  c: 'rgba(196,181,253,0.10)' },
      { x: 0.5,  y: 0.88, r: 0.55, c: 'rgba(94,234,212,0.07)' },
    ];
  }

  function drawSky(ctx, cam, vw, vh, t) {
    const g = ctx.createLinearGradient(0, 0, 0, vh);
    g.addColorStop(0, '#050813');
    g.addColorStop(0.55, '#070c1e');
    g.addColorStop(1, '#0a0f26');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);

    for (let i = 0; i < nebulae.length; i++) {
      const n = nebulae[i];
      const nx = n.x * vw - cam.x * 0.006;
      const ny = n.y * vh - cam.y * 0.006;
      const rad = n.r * Math.max(vw, vh);
      const rg = ctx.createRadialGradient(nx, ny, 0, nx, ny, rad);
      rg.addColorStop(0, n.c);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, vw, vh);
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      let x = (s.x * vw - cam.x * s.layer) % vw; if (x < 0) x += vw;
      let y = (s.y * vh - cam.y * s.layer) % vh; if (y < 0) y += vh;
      const tw = 0.65 + 0.35 * Math.sin(t * 1.4 + s.tw);
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = i % 11 === 0 ? '#a7d8ff' : '#ffffff';
      ctx.fillRect(x, y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  /* ======================================================================
     ISLANDS + BRIDGES
     ====================================================================== */
  const DEPTH = 46;

  function drawIsland(ctx, s, t, locked) {
    ctx.save();
    if (locked) ctx.globalAlpha = 0.28;

    // ambient glow under the island
    const gx = s.cx, gy = s.cy + 30;
    const rad = Math.max(s.w, s.h) * 0.85;
    const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
    rg.addColorStop(0, hexA(s.glow, 0.13));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(s.x - rad, s.y - rad, rad * 2 + s.w, rad * 2 + s.h);

    // cliff body
    rr(ctx, s.x, s.y + DEPTH * 0.4, s.w, s.h, s.r);
    const cg = ctx.createLinearGradient(0, s.y, 0, s.y + s.h + DEPTH);
    cg.addColorStop(0, s.edge);
    cg.addColorStop(1, '#03050c');
    ctx.fillStyle = cg;
    ctx.fill();

    // roots / stalactites hanging off the underside
    const rand = W.rng(s.w + s.x);
    ctx.fillStyle = '#03050c';
    for (let i = 0; i < 14; i++) {
      const px = s.x + s.r * 0.6 + rand() * (s.w - s.r * 1.2);
      const len = 20 + rand() * 90;
      const wid = 8 + rand() * 22;
      ctx.beginPath();
      ctx.moveTo(px - wid / 2, s.y + s.h + DEPTH * 0.3);
      ctx.lineTo(px + wid / 2, s.y + s.h + DEPTH * 0.3);
      ctx.lineTo(px, s.y + s.h + DEPTH * 0.3 + len);
      ctx.closePath();
      ctx.fill();
    }

    // top surface
    rr(ctx, s.x, s.y, s.w, s.h, s.r);
    const tg = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
    tg.addColorStop(0, s.top);
    tg.addColorStop(1, s.base);
    ctx.fillStyle = tg;
    ctx.fill();

    // rim light
    ctx.save();
    ctx.clip();
    const lg = ctx.createLinearGradient(0, s.y, 0, s.y + 90);
    lg.addColorStop(0, hexA(s.glow, 0.18));
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(s.x, s.y, s.w, 90);

    // ground speckle
    const r2 = W.rng(s.h + s.y);
    for (let i = 0; i < 150; i++) {
      const px = s.x + r2() * s.w, py = s.y + r2() * s.h;
      ctx.globalAlpha = 0.05 + r2() * 0.09;
      ctx.fillStyle = i % 3 === 0 ? s.glow : '#ffffff';
      const sz = 1 + r2() * 2.4;
      ctx.fillRect(px, py, sz, sz);
    }
    ctx.globalAlpha = 1;

    // district name, ghosted into the ground — shrunk to fit the island
    ctx.textAlign = 'center';
    ctx.fillStyle = hexA(s.glow, 0.09);
    const name = s.name.toUpperCase();
    let fs = Math.min(s.w * 0.17, 116);
    const maxW = s.w - s.r * 0.9;
    ctx.font = '700 ' + Math.round(fs) + 'px "Space Grotesk", sans-serif';
    const measured = ctx.measureText(name).width;
    if (measured > maxW) {
      fs = Math.max(18, Math.floor(fs * (maxW / measured)));
      ctx.font = '700 ' + fs + 'px "Space Grotesk", sans-serif';
    }
    ctx.fillText(name, s.cx, s.y + s.h - 40);
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillStyle = hexA(s.glow, 0.13);
    ctx.fillText(s.sub.toUpperCase(), s.cx, s.y + s.h - 12);
    ctx.restore();

    // outline
    rr(ctx, s.x, s.y, s.w, s.h, s.r);
    ctx.strokeStyle = hexA(s.glow, 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  function drawBridge(ctx, b, t, locked) {
    ctx.save();
    if (locked) ctx.globalAlpha = 0.18;
    const horiz = b.w > b.h;

    rr(ctx, b.x, b.y, b.w, b.h, 12);
    const g = horiz
      ? ctx.createLinearGradient(0, b.y, 0, b.y + b.h)
      : ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
    g.addColorStop(0, 'rgba(125,211,252,0.30)');
    g.addColorStop(0.5, 'rgba(125,211,252,0.10)');
    g.addColorStop(1, 'rgba(125,211,252,0.30)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(125,211,252,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // travelling light pulses along the span
    const len = horiz ? b.w : b.h;
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.22 + i / 3) % 1) * len;
      const x = horiz ? b.x + p : b.x + b.w / 2;
      const y = horiz ? b.y + b.h / 2 : b.y + p;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 26);
      rg.addColorStop(0, 'rgba(190,240,255,0.55)');
      rg.addColorStop(1, 'rgba(125,211,252,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - 26, y - 26, 52, 52);
    }
    ctx.restore();
  }

  /* ======================================================================
     PROPS
     ====================================================================== */
  function drawProp(ctx, p, t, active) {
    const x = p.x, y = p.y;
    ctx.save();

    if (active) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.4);
      ctx.save();
      ellipse(ctx, x, y + 4, p.w * 0.62, p.w * 0.24);
      ctx.strokeStyle = 'rgba(125,211,252,' + (0.35 + pulse * 0.45) + ')';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    shadow(ctx, x, y, p.w * 0.62, 0.22);
    const fn = PROP[p.kind];
    if (fn) fn(ctx, x, y, p, t, active);
    ctx.restore();
  }

  const PROP = {};

  PROP.signpost = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#5b452e';
    ctx.fillRect(x - 5, y - 74, 10, 74);
    ctx.fillStyle = '#8a6a44';
    ctx.fillRect(x - 5, y - 74, 4, 74);
    [[-1, -66, 46], [1, -44, 38]].forEach(function (b, i) {
      const w = b[2];
      ctx.save();
      ctx.translate(x, y + b[1]);
      ctx.rotate(b[0] * 0.06);
      ctx.fillStyle = i ? '#c9a06a' : '#e0bd85';
      ctx.fillRect(b[0] > 0 ? 0 : -w, -9, w, 18);
      ctx.fillStyle = 'rgba(60,40,20,0.55)';
      for (let l = 0; l < 2; l++) {
        ctx.fillRect((b[0] > 0 ? 6 : -w + 6), -4 + l * 5, w - 14 - l * 8, 2);
      }
      ctx.restore();
    });
  };

  PROP.statue = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#2c3a5e';
    rr(ctx, x - 30, y - 18, 60, 18, 4); ctx.fill();
    ctx.fillStyle = '#3a4c78';
    rr(ctx, x - 24, y - 30, 48, 14, 3); ctx.fill();
    // figure
    ctx.fillStyle = '#8ea3d4';
    rr(ctx, x - 15, y - 74, 30, 46, 13); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 86, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b6c8f0';
    ctx.beginPath(); ctx.arc(x - 4, y - 90, 10, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
    // glow halo
    const g = ctx.createRadialGradient(x, y - 84, 2, x, y - 84, 40);
    g.addColorStop(0, 'rgba(125,211,252,' + (0.16 + 0.08 * Math.sin(t * 1.6)) + ')');
    g.addColorStop(1, 'rgba(125,211,252,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 46, y - 130, 92, 92);
  };

  PROP.board = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#4a3826';
    ctx.fillRect(x - 42, y - 34, 8, 34);
    ctx.fillRect(x + 34, y - 34, 8, 34);
    ctx.fillStyle = '#1a2440';
    rr(ctx, x - 56, y - 90, 112, 60, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(125,211,252,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(125,211,252,0.45)';
    for (let i = 0; i < 4; i++) {
      const w = 78 - (i % 3) * 22;
      ctx.fillRect(x - 44, y - 80 + i * 12, w, 4);
    }
  };

  PROP.beacon = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#20304f';
    ctx.beginPath();
    ctx.moveTo(x - 30, y); ctx.lineTo(x - 15, y - 108);
    ctx.lineTo(x + 15, y - 108); ctx.lineTo(x + 30, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2e4470';
    ctx.fillRect(x - 26, y - 44, 52, 7);
    ctx.fillRect(x - 22, y - 76, 44, 6);

    // rotating beam
    ctx.save();
    ctx.translate(x, y - 120);
    ctx.rotate(t * 0.9);
    const bg = ctx.createLinearGradient(0, 0, 200, 0);
    bg.addColorStop(0, 'rgba(125,211,252,0.35)');
    bg.addColorStop(1, 'rgba(125,211,252,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(210, -34); ctx.lineTo(210, 34); ctx.closePath(); ctx.fill();
    ctx.restore();

    const pulse = 0.6 + 0.4 * Math.sin(t * 2.6);
    const g = ctx.createRadialGradient(x, y - 120, 0, x, y - 120, 34);
    g.addColorStop(0, 'rgba(220,246,255,' + pulse + ')');
    g.addColorStop(0.4, 'rgba(125,211,252,' + pulse * 0.6 + ')');
    g.addColorStop(1, 'rgba(125,211,252,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, y - 160, 80, 80);
    ctx.fillStyle = '#eaf7ff';
    ctx.beginPath(); ctx.arc(x, y - 120, 9, 0, TAU); ctx.fill();
  };

  PROP.house = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#33455f';
    ctx.fillRect(x - 60, y - 78, 120, 78);
    ctx.fillStyle = '#3d5271';
    ctx.fillRect(x - 60, y - 78, 12, 78);
    // roof
    ctx.fillStyle = '#8b3a4c';
    ctx.beginPath();
    ctx.moveTo(x - 74, y - 74); ctx.lineTo(x, y - 132);
    ctx.lineTo(x + 74, y - 74); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.beginPath();
    ctx.moveTo(x - 74, y - 74); ctx.lineTo(x, y - 132); ctx.lineTo(x, y - 74); ctx.closePath(); ctx.fill();
    // door
    ctx.fillStyle = '#22160f';
    rr(ctx, x - 14, y - 46, 28, 46, 12); ctx.fill();
    ctx.fillStyle = '#ffd08a';
    ctx.beginPath(); ctx.arc(x + 7, y - 24, 2.4, 0, TAU); ctx.fill();
    // windows, warm
    const flick = 0.75 + 0.25 * Math.sin(t * 2.1);
    ctx.fillStyle = 'rgba(255,201,120,' + flick + ')';
    ctx.fillRect(x - 48, y - 64, 22, 20);
    ctx.fillRect(x + 26, y - 64, 22, 20);
    ctx.strokeStyle = '#22160f'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 48, y - 64, 22, 20);
    ctx.strokeRect(x + 26, y - 64, 22, 20);
    // window light spill
    const g = ctx.createRadialGradient(x, y - 54, 4, x, y - 54, 110);
    g.addColorStop(0, 'rgba(255,190,110,0.16)');
    g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 120, y - 160, 240, 200);
    // chimney smoke
    ctx.fillStyle = 'rgba(200,215,255,0.14)';
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.5 + i * 0.25) % 1;
      ctx.beginPath();
      ctx.arc(x + 34 + Math.sin(ph * 6) * 9, y - 138 - ph * 60, 5 + ph * 12, 0, TAU);
      ctx.fill();
    }
  };

  PROP.campfire = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#3b4256';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      ellipse(ctx, x + Math.cos(a) * 30, y + Math.sin(a) * 12, 8, 5);
      ctx.fill();
    }
    ctx.strokeStyle = '#4a3524'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 16, y - 2); ctx.lineTo(x + 16, y - 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 16, y - 14); ctx.lineTo(x + 16, y - 2); ctx.stroke();

    const glow = ctx.createRadialGradient(x, y - 16, 2, x, y - 16, 130);
    glow.addColorStop(0, 'rgba(255,160,60,' + (0.22 + 0.06 * Math.sin(t * 7)) + ')');
    glow.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 140, y - 150, 280, 280);

    for (let i = 0; i < 3; i++) {
      const f = Math.sin(t * (7 + i * 2) + i) * 0.5 + 0.5;
      const h = 26 + f * 20 + i * 4;
      ctx.fillStyle = ['#ff8a3c', '#ffc14d', '#fff0a8'][i];
      ctx.globalAlpha = 0.9 - i * 0.12;
      ctx.beginPath();
      ctx.moveTo(x - (12 - i * 3), y - 6);
      ctx.quadraticCurveTo(x - 3, y - h * 0.6, x + Math.sin(t * 6 + i) * 4, y - h);
      ctx.quadraticCurveTo(x + 4, y - h * 0.5, x + (12 - i * 3), y - 6);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.8 + i * 0.17) % 1;
      ctx.globalAlpha = (1 - ph) * 0.7;
      ctx.fillStyle = '#ffbe6a';
      ctx.fillRect(x + Math.sin(ph * 9 + i) * 22, y - 30 - ph * 90, 2.4, 2.4);
    }
    ctx.globalAlpha = 1;
  };

  PROP.frame = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#3b2a1c';
    ctx.fillRect(x - 4, y - 24, 8, 24);
    ctx.fillStyle = '#c8a978';
    rr(ctx, x - 33, y - 92, 66, 70, 5); ctx.fill();
    ctx.fillStyle = '#141c33';
    ctx.fillRect(x - 26, y - 85, 52, 56);
    // a tiny abstract scene, stable per prop
    const rand = W.rng(p.seed);
    const hues = ['#7dd3fc', '#86efac', '#fbbf24', '#f0abfc', '#c4b5fd'];
    const hue = hues[Math.floor(rand() * hues.length)];
    ctx.fillStyle = hexA(hue, 0.5);
    for (let i = 0; i < 4; i++) {
      const bw = 6 + rand() * 16;
      ctx.fillRect(x - 24 + rand() * 44, y - 40 - rand() * 30, bw, 3 + rand() * 18);
    }
    ctx.fillStyle = hexA(hue, 0.85);
    ctx.beginPath(); ctx.arc(x - 12 + rand() * 24, y - 70, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    ctx.strokeRect(x - 26, y - 85, 52, 56);
  };

  PROP.hall = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#2f2750';
    ctx.fillRect(x - 92, y - 96, 184, 96);
    ctx.fillStyle = '#3b3166';
    for (let i = 0; i < 5; i++) ctx.fillRect(x - 78 + i * 36, y - 92, 16, 92);
    ctx.fillStyle = '#241d40';
    ctx.beginPath();
    ctx.moveTo(x - 104, y - 96); ctx.lineTo(x, y - 152); ctx.lineTo(x + 104, y - 96);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(196,181,253,0.18)';
    ctx.beginPath();
    ctx.moveTo(x - 104, y - 96); ctx.lineTo(x, y - 152); ctx.lineTo(x, y - 96);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#12102a';
    rr(ctx, x - 20, y - 56, 40, 56, 16); ctx.fill();
    const g = ctx.createRadialGradient(x, y - 30, 2, x, y - 30, 70);
    g.addColorStop(0, 'rgba(196,181,253,' + (0.2 + 0.06 * Math.sin(t * 1.7)) + ')');
    g.addColorStop(1, 'rgba(196,181,253,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 80, y - 100, 160, 130);
    ctx.fillStyle = 'rgba(196,181,253,0.7)';
    ctx.beginPath(); ctx.arc(x, y - 120, 6, 0, TAU); ctx.fill();
  };

  PROP.blackboard = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#4a3826';
    ctx.fillRect(x - 52, y - 30, 7, 30);
    ctx.fillRect(x + 45, y - 30, 7, 30);
    ctx.fillStyle = '#3c2f1e';
    rr(ctx, x - 62, y - 96, 124, 68, 5); ctx.fill();
    ctx.fillStyle = '#16241f';
    ctx.fillRect(x - 55, y - 90, 110, 56);
    const rand = W.rng(p.seed);
    ctx.strokeStyle = 'rgba(220,240,230,0.45)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const ly = y - 82 + i * 12;
      ctx.beginPath();
      ctx.moveTo(x - 48, ly);
      ctx.lineTo(x - 48 + 30 + rand() * 60, ly);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160,240,200,0.6)';
    ctx.beginPath(); ctx.arc(x + 30, y - 62, 11, 0.4, 5.2); ctx.stroke();
  };

  // small honour-roll plaque on a post — the high-school footnote
  PROP.plaque = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#2f2750';
    ctx.fillRect(x - 4, y - 34, 8, 34);
    // plate
    ctx.fillStyle = '#5b4a2a';
    rr(ctx, x - 32, y - 78, 64, 46, 4); ctx.fill();
    ctx.fillStyle = '#c9a86a';
    rr(ctx, x - 29, y - 75, 58, 40, 3); ctx.fill();
    // engraved lines
    ctx.fillStyle = 'rgba(60,44,20,0.55)';
    ctx.fillRect(x - 21, y - 67, 42, 3);
    ctx.fillRect(x - 21, y - 60, 30, 2);
    ctx.fillRect(x - 21, y - 55, 36, 2);
    // seal + ribbon
    const shine = 0.6 + 0.4 * Math.sin(t * 1.9 + p.seed);
    ctx.fillStyle = 'rgba(196,181,253,' + shine + ')';
    ctx.beginPath(); ctx.arc(x + 17, y - 45, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8b7ad6';
    ctx.beginPath();
    ctx.moveTo(x + 13, y - 41); ctx.lineTo(x + 11, y - 32); ctx.lineTo(x + 17, y - 36);
    ctx.lineTo(x + 23, y - 32); ctx.lineTo(x + 21, y - 41);
    ctx.closePath(); ctx.fill();

    const g = ctx.createRadialGradient(x, y - 55, 3, x, y - 55, 70);
    g.addColorStop(0, 'rgba(196,181,253,0.12)');
    g.addColorStop(1, 'rgba(196,181,253,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 76, y - 130, 152, 150);
  };

  PROP.terminal = function (ctx, x, y, p, t, active) {
    ctx.fillStyle = '#16202f';
    rr(ctx, x - 16, y - 28, 32, 28, 5); ctx.fill();
    ctx.fillStyle = '#1e2b3d';
    rr(ctx, x - 36, y - 34, 72, 10, 4); ctx.fill();
    // bezel
    ctx.fillStyle = '#22303f';
    rr(ctx, x - 46, y - 100, 92, 72, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(94,234,212,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    // screen
    ctx.save();
    rr(ctx, x - 39, y - 93, 78, 56, 5); ctx.clip();
    ctx.fillStyle = '#03110f'; ctx.fillRect(x - 39, y - 93, 78, 56);
    const rand = W.rng(p.seed);
    ctx.fillStyle = 'rgba(94,234,212,0.75)';
    for (let i = 0; i < 5; i++) {
      const lw = 10 + rand() * 52;
      const blink = i === 4 ? (Math.sin(t * 5) > 0 ? 1 : 0.15) : 1;
      ctx.globalAlpha = 0.55 + 0.45 * blink;
      ctx.fillRect(x - 33, y - 86 + i * 10, lw, 3);
    }
    ctx.globalAlpha = 1;
    // scanline
    const sy = y - 93 + ((t * 40) % 56);
    ctx.fillStyle = 'rgba(180,255,240,0.10)';
    ctx.fillRect(x - 39, sy, 78, 6);
    ctx.restore();
    // screen glow
    const g = ctx.createRadialGradient(x, y - 66, 4, x, y - 66, active ? 120 : 84);
    g.addColorStop(0, 'rgba(94,234,212,' + (active ? 0.28 : 0.16) + ')');
    g.addColorStop(1, 'rgba(94,234,212,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 130, y - 190, 260, 250);
  };

  PROP.monolith = function (ctx, x, y, p, t, active) {
    const float = Math.sin(t * 1.1 + p.seed) * 5;
    ctx.save();
    ctx.translate(0, float);
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.moveTo(x - 30, y); ctx.lineTo(x - 22, y - 132);
    ctx.lineTo(x + 22, y - 132); ctx.lineTo(x + 30, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(251,191,36,0.14)';
    ctx.beginPath();
    ctx.moveTo(x - 30, y); ctx.lineTo(x - 22, y - 132); ctx.lineTo(x, y - 132); ctx.lineTo(x, y);
    ctx.closePath(); ctx.fill();
    // runes
    const rand = W.rng(p.seed);
    ctx.fillStyle = 'rgba(251,191,36,' + (0.55 + 0.3 * Math.sin(t * 2 + p.seed)) + ')';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x - 12 + rand() * 8, y - 116 + i * 20, 8 + rand() * 14, 3);
    }
    const g = ctx.createRadialGradient(x, y - 70, 6, x, y - 70, active ? 120 : 80);
    g.addColorStop(0, 'rgba(251,191,36,' + (active ? 0.22 : 0.12) + ')');
    g.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 130, y - 200, 260, 260);
    ctx.restore();
  };

  // the board waiting on its rack in the vault
  PROP.boardstand = function (ctx, x, y, p, t) {
    ctx.strokeStyle = '#4a2f3c';
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x - 14, y - 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 24, y); ctx.lineTo(x + 14, y - 34); ctx.stroke();

    const glow = 0.5 + 0.5 * Math.sin(t * 2.1);
    const g = ctx.createRadialGradient(x, y - 70, 4, x, y - 70, 110);
    g.addColorStop(0, 'rgba(125,211,252,' + (0.18 + glow * 0.14) + ')');
    g.addColorStop(1, 'rgba(125,211,252,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 120, y - 190, 240, 220);

    ctx.save();
    ctx.translate(x, y - 34);
    ctx.rotate(-0.1 + Math.sin(t * 0.9) * 0.03);
    drawBoard(ctx, 0, 0, 32, 108, 1);
    ctx.restore();

    // little floating sparkles, to read as "take me"
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.5 + i * 0.2) % 1;
      ctx.globalAlpha = (1 - ph) * 0.8;
      ctx.fillStyle = '#bfe4ff';
      ctx.fillRect(x + Math.sin(ph * 7 + i * 2) * 30, y - 40 - ph * 90, 2.2, 2.2);
    }
    ctx.globalAlpha = 1;
  };

  /* Shared board shape, used on the rack and under the player. */
  function drawBoard(ctx, cx, cy, w, h, alpha) {
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    const g = ctx.createLinearGradient(0, cy - h, 0, cy);
    g.addColorStop(0, '#7dd3fc');
    g.addColorStop(0.5, '#4f7fd0');
    g.addColorStop(1, '#3b5bb5');
    ctx.fillStyle = g;
    rr(ctx, cx - w / 2, cy - h, w, h, w / 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    rr(ctx, cx - w / 2 + 3, cy - h + h * 0.18, w - 6, h * 0.08, 4); ctx.fill();
    ctx.fillStyle = '#16203a';
    rr(ctx, cx - w / 2 + 2, cy - h * 0.62, w - 4, h * 0.07, 3); ctx.fill();
    rr(ctx, cx - w / 2 + 2, cy - h * 0.36, w - 4, h * 0.07, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.4;
    rr(ctx, cx - w / 2, cy - h, w, h, w / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  PROP.chest = function (ctx, x, y, p, t) {
    ctx.fillStyle = '#4a2f3c';
    rr(ctx, x - 40, y - 40, 80, 40, 4); ctx.fill();
    ctx.fillStyle = '#6b4358';
    ctx.beginPath();
    ctx.moveTo(x - 40, y - 40);
    ctx.quadraticCurveTo(x, y - 76, x + 40, y - 40);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f0abfc';
    ctx.fillRect(x - 5, y - 46, 10, 14);
    const g = ctx.createRadialGradient(x, y - 40, 4, x, y - 40, 130);
    g.addColorStop(0, 'rgba(240,171,252,' + (0.24 + 0.08 * Math.sin(t * 2.4)) + ')');
    g.addColorStop(1, 'rgba(240,171,252,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 140, y - 180, 280, 220);
  };

  /* ---------- the three totems in Origin -------------------------------- */

  // squat rack + loaded barbell — seven years in the gym
  PROP.rack = function (ctx, x, y, p, t) {
    const H = 96;
    ctx.fillStyle = '#2b2f3f';
    ctx.fillRect(x - 44, y - 10, 88, 10);            // base rail
    ctx.fillStyle = '#3a4055';
    ctx.fillRect(x - 40, y - H, 11, H);              // uprights
    ctx.fillRect(x + 29, y - H, 11, H);
    ctx.fillStyle = '#4b5470';
    ctx.fillRect(x - 40, y - H, 4, H);
    ctx.fillRect(x + 29, y - H, 4, H);
    // j-hooks
    ctx.fillStyle = '#59627f';
    ctx.fillRect(x - 46, y - H + 16, 8, 7);
    ctx.fillRect(x + 38, y - H + 16, 8, 7);

    // barbell
    const by = y - H + 19;
    ctx.fillStyle = '#8b93ad';
    ctx.fillRect(x - 58, by - 3, 116, 6);
    ctx.fillStyle = '#c3cade';
    ctx.fillRect(x - 58, by - 3, 116, 2);
    // plates
    ctx.fillStyle = '#1d2333';
    [-50, -42, 42, 50].forEach(function (dx, i) {
      const r = i === 0 || i === 3 ? 17 : 13;
      ellipse(ctx, x + dx, by, 4, r);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(134,239,172,0.5)';
    [-50, 50].forEach(function (dx) { ellipse(ctx, x + dx, by, 2, 8); ctx.fill(); });

    const g = ctx.createRadialGradient(x, y - 60, 4, x, y - 60, 100);
    g.addColorStop(0, 'rgba(134,239,172,' + (0.12 + 0.05 * Math.sin(t * 1.6)) + ')');
    g.addColorStop(1, 'rgba(134,239,172,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 110, y - 160, 220, 190);
  };

  // PA stack pushing sound rings — chestpump, 2M plays
  PROP.speaker = function (ctx, x, y, p, t) {
    const H = 118;
    // cabinet, slightly trapezoid
    ctx.fillStyle = '#1c2233';
    ctx.beginPath();
    ctx.moveTo(x - 30, y);
    ctx.lineTo(x - 26, y - H);
    ctx.lineTo(x + 26, y - H);
    ctx.lineTo(x + 30, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(x - 30, y); ctx.lineTo(x - 26, y - H); ctx.lineTo(x - 4, y - H); ctx.lineTo(x - 6, y);
    ctx.closePath(); ctx.fill();

    // drivers, pulsing on the beat
    const beat = 0.5 + 0.5 * Math.sin(t * 5.2);
    ctx.fillStyle = '#0c111c';
    ctx.beginPath(); ctx.arc(x, y - 34, 17, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 82, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(196,181,253,' + (0.45 + beat * 0.5) + ')';
    ctx.beginPath(); ctx.arc(x, y - 34, 8 + beat * 2.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 82, 5 + beat * 1.6, 0, TAU); ctx.fill();

    // sound rings travelling outward
    for (let i = 0; i < 3; i++) {
      const ph = ((t * 0.85 + i / 3) % 1);
      ctx.strokeStyle = 'rgba(196,181,253,' + (0.4 * (1 - ph)) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 58, 26 + ph * 62, -0.95, 0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 58, 26 + ph * 62, Math.PI - 0.95, Math.PI + 0.95);
      ctx.stroke();
    }

    const g = ctx.createRadialGradient(x, y - 60, 4, x, y - 60, 110);
    g.addColorStop(0, 'rgba(196,181,253,' + (0.1 + beat * 0.08) + ')');
    g.addColorStop(1, 'rgba(196,181,253,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 120, y - 180, 240, 210);
  };

  // board planted in a drift of snow — every winter since
  PROP.snowboard = function (ctx, x, y, p, t) {
    // snow mound
    ctx.fillStyle = '#dfe9ff';
    ellipse(ctx, x, y - 3, 30, 9);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, x - 4, y - 5, 20, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y - 6);
    ctx.rotate(-0.16 + Math.sin(t * 0.7) * 0.012);

    const H = 122, W = 30;
    // deck
    const g = ctx.createLinearGradient(0, -H, 0, 0);
    g.addColorStop(0, '#7dd3fc');
    g.addColorStop(0.5, '#4f7fd0');
    g.addColorStop(1, '#3b5bb5');
    ctx.fillStyle = g;
    rr(ctx, -W / 2, -H, W, H, W / 2);
    ctx.fill();
    // graphic
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    rr(ctx, -W / 2 + 4, -H + 26, W - 8, 12, 6); ctx.fill();
    ctx.fillStyle = 'rgba(12,20,40,0.4)';
    ctx.beginPath();
    ctx.moveTo(-W / 2 + 3, -H * 0.62);
    ctx.lineTo(W / 2 - 3, -H * 0.52);
    ctx.lineTo(W / 2 - 3, -H * 0.40);
    ctx.lineTo(-W / 2 + 3, -H * 0.50);
    ctx.closePath(); ctx.fill();
    // bindings
    ctx.fillStyle = '#16203a';
    rr(ctx, -W / 2 + 2, -H * 0.34, W - 4, 9, 3); ctx.fill();
    rr(ctx, -W / 2 + 2, -H * 0.20, W - 4, 9, 3); ctx.fill();
    // edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    rr(ctx, -W / 2, -H, W, H, W / 2);
    ctx.stroke();
    ctx.restore();

    // drifting flakes
    for (let i = 0; i < 7; i++) {
      const ph = (t * 0.32 + i * 0.14) % 1;
      ctx.globalAlpha = (1 - ph) * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + Math.sin(ph * 7 + i * 2) * 26, y - 130 + ph * 118, 1.7, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- decor ------------------------------------------------------ */
  PROP.tree = function (ctx, x, y, d, t) {
    const s = d.scale, sway = Math.sin(t * 0.9 + d.seed) * 3;
    ctx.fillStyle = '#2a1c14';
    ctx.fillRect(x - 5 * s, y - 40 * s, 10 * s, 40 * s);
    const greens = ['#1f4b32', '#2a6844', '#357f52'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = greens[i];
      ctx.beginPath();
      ctx.arc(x + sway * (i + 1) * 0.4, y - (52 + i * 17) * s, (30 - i * 6) * s, 0, TAU);
      ctx.fill();
    }
  };

  PROP.bush = function (ctx, x, y, d, t) {
    const s = d.scale;
    ctx.fillStyle = '#245239';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + (i - 1) * 12 * s, y - 10 * s - (i === 1 ? 6 * s : 0), 12 * s, 0, TAU);
      ctx.fill();
    }
  };

  PROP.flower = function (ctx, x, y, d, t) {
    const s = d.scale, sway = Math.sin(t * 1.6 + d.seed) * 2;
    ctx.strokeStyle = '#2f6b46'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sway, y - 16 * s); ctx.stroke();
    ctx.fillStyle = ['#fca5a5', '#fcd34d', '#f0abfc', '#a5f3fc'][d.seed % 4];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      ctx.beginPath();
      ctx.arc(x + sway + Math.cos(a) * 4 * s, y - 16 * s + Math.sin(a) * 4 * s, 3 * s, 0, TAU);
      ctx.fill();
    }
  };

  PROP.rock = function (ctx, x, y, d) {
    const s = d.scale;
    ctx.fillStyle = '#3c4660';
    ctx.beginPath();
    ctx.moveTo(x - 16 * s, y);
    ctx.lineTo(x - 10 * s, y - 14 * s);
    ctx.lineTo(x + 4 * s, y - 18 * s);
    ctx.lineTo(x + 16 * s, y - 6 * s);
    ctx.lineTo(x + 12 * s, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y - 14 * s);
    ctx.lineTo(x + 4 * s, y - 18 * s);
    ctx.lineTo(x - 2 * s, y - 6 * s);
    ctx.closePath(); ctx.fill();
  };

  PROP.crystal = function (ctx, x, y, d, t) {
    const s = d.scale, pulse = 0.55 + 0.45 * Math.sin(t * 1.8 + d.seed);
    const c = d.hue || '#5eead4';
    const g = ctx.createRadialGradient(x, y - 20 * s, 2, x, y - 20 * s, 60 * s);
    g.addColorStop(0, hexA(c, 0.2 * pulse));
    g.addColorStop(1, hexA(c, 0));
    ctx.fillStyle = g; ctx.fillRect(x - 60 * s, y - 80 * s, 120 * s, 120 * s);
    ctx.fillStyle = hexA(c, 0.55);
    ctx.beginPath();
    ctx.moveTo(x, y - 42 * s); ctx.lineTo(x + 11 * s, y - 16 * s);
    ctx.lineTo(x, y); ctx.lineTo(x - 11 * s, y - 16 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = hexA(c, 0.9);
    ctx.beginPath();
    ctx.moveTo(x, y - 42 * s); ctx.lineTo(x + 11 * s, y - 16 * s); ctx.lineTo(x, y - 12 * s);
    ctx.closePath(); ctx.fill();
  };

  PROP.lantern = function (ctx, x, y, d, t) {
    const s = d.scale;
    ctx.fillStyle = '#2b3550';
    ctx.fillRect(x - 2.5 * s, y - 44 * s, 5 * s, 44 * s);
    const pulse = 0.7 + 0.3 * Math.sin(t * 2 + d.seed);
    const c = d.hue || '#7dd3fc';
    const g = ctx.createRadialGradient(x, y - 50 * s, 1, x, y - 50 * s, 74 * s);
    g.addColorStop(0, hexA(c, 0.22 * pulse));
    g.addColorStop(1, hexA(c, 0));
    ctx.fillStyle = g; ctx.fillRect(x - 76 * s, y - 120 * s, 152 * s, 152 * s);
    // housing, so it reads as a lamp rather than a stick with a dot on it
    ctx.fillStyle = '#1b2338';
    rr(ctx, x - 8 * s, y - 60 * s, 16 * s, 20 * s, 3 * s); ctx.fill();
    ctx.fillStyle = hexA(c, 0.95);
    rr(ctx, x - 5 * s, y - 57 * s, 10 * s, 14 * s, 2 * s); ctx.fill();
    ctx.fillStyle = '#1b2338';
    rr(ctx, x - 10 * s, y - 64 * s, 20 * s, 5 * s, 2 * s); ctx.fill();
  };

  /* ======================================================================
     COLLECTIBLE FRAGMENTS
     ====================================================================== */
  function drawBit(ctx, b, t) {
    const y = b.y - 26 + Math.sin(t * 2.2 + b.x * 0.01) * 6;
    const g = ctx.createRadialGradient(b.x, y, 0, b.x, y, 40);
    g.addColorStop(0, 'rgba(134,239,172,0.35)');
    g.addColorStop(1, 'rgba(134,239,172,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 40, y - 40, 80, 80);

    ctx.save();
    ctx.translate(b.x, y);
    ctx.rotate(t * 1.6);
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#eafff2';
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ellipse(ctx, b.x, b.y + 2, 10, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* ======================================================================
     PLAYER
     ====================================================================== */
  function drawPlayer(ctx, p, t) {
    const x = p.x, y = p.y;
    const riding = !!p.riding;
    const moving = p.speed > 8;
    // riding: no walk cycle, a steady glide and a lean into the turn
    const bob = riding ? Math.sin(t * 3) * 1.2
      : moving ? Math.abs(Math.sin(p.walk * 2)) * 3 : Math.sin(t * 1.5) * 1.6;
    const swing = riding ? 0 : (moving ? Math.sin(p.walk * 2) : 0);
    const lean = riding ? (p.lean || 0) : 0;

    shadow(ctx, x, y, riding ? 46 : 34, moving ? 0.28 : 0.34);

    if (riding) {
      // speed streaks trailing the direction of travel
      const sp = p.speed;
      if (sp > 200) {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.globalAlpha = Math.min(0.5, (sp - 200) / 700);
        ctx.strokeStyle = '#bfe4ff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const off = (i - 2) * 9;
          const len = 26 + (i % 2) * 18 + (sp / 620) * 34;
          const ox = Math.cos(ang + Math.PI / 2) * off;
          const oy = Math.sin(ang + Math.PI / 2) * off;
          ctx.beginPath();
          ctx.moveTo(x + ox - Math.cos(ang) * 14, y + oy - 26 - Math.sin(ang) * 14);
          ctx.lineTo(x + ox - Math.cos(ang) * (14 + len), y + oy - 26 - Math.sin(ang) * (14 + len));
          ctx.stroke();
        }
        ctx.restore();
      }
      // the board, under the feet, angled across the direction of travel
      ctx.save();
      ctx.translate(x, y + 2);
      ctx.rotate(Math.PI / 2 + lean * 0.5);
      drawBoard(ctx, 0, 44, 22, 88, 1);
      ctx.restore();
    }

    // soft aura
    const g = ctx.createRadialGradient(x, y - 26, 2, x, y - 26, 58);
    g.addColorStop(0, 'rgba(125,211,252,0.16)');
    g.addColorStop(1, 'rgba(125,211,252,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 60, y - 90, 120, 120);

    const top = y - bob - (riding ? 6 : 0);

    ctx.save();
    if (lean) { ctx.translate(x, y); ctx.rotate(lean * 0.22); ctx.translate(-x, -y); }

    // legs
    ctx.fillStyle = '#1e2b4d';
    ctx.save();
    ctx.translate(x - 6, top - 18);
    ctx.rotate(swing * 0.5);
    rr(ctx, -4, 0, 8, 20, 3); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x + 6, top - 18);
    ctx.rotate(-swing * 0.5);
    rr(ctx, -4, 0, 8, 20, 3); ctx.fill();
    ctx.restore();

    // body
    const bg = ctx.createLinearGradient(0, top - 46, 0, top - 14);
    bg.addColorStop(0, '#7dd3fc');
    bg.addColorStop(1, '#3f8fc4');
    ctx.fillStyle = bg;
    rr(ctx, x - 13, top - 46, 26, 32, 11); ctx.fill();

    // arms
    ctx.fillStyle = '#5fb4e0';
    ctx.save();
    ctx.translate(x - 13, top - 42);
    ctx.rotate(-swing * 0.6);
    rr(ctx, -5, 0, 7, 22, 3.5); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x + 13, top - 42);
    ctx.rotate(swing * 0.6);
    rr(ctx, -2, 0, 7, 22, 3.5); ctx.fill();
    ctx.restore();

    // head
    ctx.fillStyle = '#f2c9a0';
    ctx.beginPath(); ctx.arc(x, top - 58, 13, 0, TAU); ctx.fill();
    // hair
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(x, top - 61, 13.4, Math.PI * 0.98, Math.PI * 2.02);
    ctx.fill();
    ctx.fillRect(x - 13.4, top - 62, 3.4, 7);
    ctx.fillRect(x + 10, top - 62, 3.4, 7);

    // Face — eyes track the facing direction. Screen y grows downward, so
    // face.y < 0 is walking UP, i.e. away from the camera: that's the back of
    // the head. Walking DOWN faces the viewer and must keep the face.
    const fx = p.face.x * 3.4, fy = p.face.y * 2.2;
    if (p.face.y < -0.5) {
      ctx.fillStyle = '#2b2118';
      ctx.beginPath(); ctx.arc(x, top - 58, 12.6, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = '#221a14';
      ctx.beginPath(); ctx.arc(x - 4.4 + fx, top - 57 + fy, 1.7, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4.4 + fx, top - 57 + fy, 1.7, 0, TAU); ctx.fill();
    }

    ctx.restore();
  }

  function drawDust(ctx, particles) {
    for (let i = 0; i < particles.length; i++) {
      const d = particles[i];
      ctx.globalAlpha = d.life * (d.snow ? 0.75 : 0.4);
      ctx.fillStyle = d.snow ? '#ffffff' : '#cfe6ff';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * d.life, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- floating motes in the foreground -------------------------- */
  let motes = null;
  function initMotes() {
    const rand = W.rng(4242);
    motes = [];
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: rand() * W.WORLD_W, y: rand() * W.WORLD_H,
        r: 0.7 + rand() * 1.8, s: 0.2 + rand() * 0.6, ph: rand() * TAU,
      });
    }
  }
  function drawMotes(ctx, cam, vw, vh, t) {
    if (window.REDUCED_MOTION) return;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#bfe4ff';
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x + Math.sin(t * m.s + m.ph) * 24;
      const y = m.y + Math.cos(t * m.s * 0.7 + m.ph) * 18 - ((t * 8 * m.s) % 300);
      if (x < cam.x - 40 || x > cam.x + vw + 40 || y < cam.y - 40 || y > cam.y + vh + 40) continue;
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ======================================================================
     FRAME COMPOSITION
     ====================================================================== */
  function render(ctx, cam, vw, vh, t, player, activeProp, particles) {
    drawSky(ctx, cam, vw, vh, t);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    const L = cam.x - 200, R = cam.x + vw + 200, T = cam.y - 260, B = cam.y + vh + 260;
    const vis = function (x, y) { return x > L && x < R && y > T && y < B; };

    // Bridges first: their spans deliberately run under the islands they
    // join, so painting the islands on top hides the overlap and the deck
    // reads as meeting the island edge cleanly.
    W.bridges.forEach(function (b) {
      drawBridge(ctx, b, t, b.secret && !W.state.vaultOpen);
    });
    W.islands.forEach(function (s) {
      if (s.x + s.w < L || s.x > R || s.y + s.h + 120 < T || s.y > B) return;
      drawIsland(ctx, s, t, s.secret && !W.state.vaultOpen);
    });

    // everything that stands on the ground, painted back-to-front
    const layer = [];
    W.decor.forEach(function (d) { if (vis(d.x, d.y)) layer.push(d); });
    W.props.forEach(function (p) {
      if (!vis(p.x, p.y)) return;
      const island = W.byId[p.island];
      if (island && island.secret && !W.state.vaultOpen) return;
      if (p.hideWhen && W.state[p.hideWhen]) return;   // already picked up
      layer.push(p);
    });
    W.bits.forEach(function (b) { if (!b.taken && vis(b.x, b.y)) layer.push(b); });
    layer.push(player);
    layer.sort(function (a, b) { return a.y - b.y; });

    drawDust(ctx, particles);

    for (let i = 0; i < layer.length; i++) {
      const it = layer[i];
      if (it === player) drawPlayer(ctx, player, t);
      else if (it.id && it.id.charAt(0) === 'b' && 'taken' in it) drawBit(ctx, it, t);
      else if (it.kind) {
        if (it.island && !it.view) { ctx.save(); PROP[it.kind] && PROP[it.kind](ctx, it.x, it.y, it, t); ctx.restore(); }
        else drawProp(ctx, it, t, activeProp === it);
      }
    }

    drawMotes(ctx, cam, vw, vh, t);
    ctx.restore();

    // vignette
    const vg = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.42, vw / 2, vh / 2, Math.max(vw, vh) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, vw, vh);
  }

  return {
    initSky: initSky, initMotes: initMotes, render: render,
    rr: rr, hexA: hexA, PROP: PROP,
  };
})();
