/* ==========================================================================
   world.js — builds the world from src/content.js.

   The map is a set of floating islands connected by light bridges. Each
   island is a district; each piece of your content becomes a prop you can
   walk up to and interact with. Add content, get world — no map editing.
   ========================================================================== */

window.WORLD = (function () {
  'use strict';

  const C = window.CONTENT;

  const WORLD_W = 3700;
  const WORLD_H = 2700;

  /* ---------- deterministic RNG so decor never jitters between loads ---- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- mutable run state (declared early: used during map build) -- */
  const state = {
    vaultOpen: false,
    visited: {},
    seen: {},
    bitsFound: 0,
    hasBoard: false,   // the snowboard from the vault — hold Shift to ride
  };

  const EDGE = 16; // keep the player off the very lip of an island

  /* ---------- districts ------------------------------------------------- */
  const islands = [
    {
      id: 'plaza', name: 'The Crossroads', sub: 'start here', icon: '✦',
      x: 1480, y: 1080, w: 640, h: 480, r: 120,
      base: '#1b2a52', top: '#25406e', edge: '#0e1733', glow: '#7dd3fc',
    },
    {
      id: 'origin', name: 'Origin', sub: 'the life', icon: '✿',
      x: 380, y: 980, w: 880, h: 740, r: 150,
      base: '#1d3327', top: '#27503a', edge: '#0d1a15', glow: '#86efac',
    },
    {
      id: 'academy', name: 'The Academy', sub: 'education', icon: '✎',
      x: 1360, y: 220, w: 900, h: 600, r: 150,
      base: '#2b2244', top: '#3d3068', edge: '#150f26', glow: '#c4b5fd',
    },
    {
      id: 'workshop', name: 'The Workshop', sub: 'projects', icon: '⌘',
      x: 2440, y: 940, w: 940, h: 760, r: 160,
      base: '#123040', top: '#17485f', edge: '#08171f', glow: '#5eead4',
    },
    {
      id: 'ledger', name: 'The Ledger', sub: 'experience', icon: '▤',
      x: 1240, y: 1900, w: 1120, h: 560, r: 140,
      base: '#3a2a1c', top: '#57402a', edge: '#1c1310', glow: '#fbbf24',
    },
    {
      id: 'vault', name: 'The Vault', sub: 'locked', icon: '✧',
      x: 2780, y: 240, w: 520, h: 420, r: 130,
      base: '#3a1c2c', top: '#5a2b43', edge: '#1c0d15', glow: '#f0abfc',
      secret: true,
    },
  ];

  /* Each span deliberately overlaps the islands it joins — the islands have
     rounded corners, so a bridge that merely touches the bounding box can
     still leave a gap you cannot walk across. */
  const bridges = [
    { x: 1100, y: 1285, w: 440, h: 96 },  // plaza  <-> origin
    { x: 1758, y: 760,  w: 96,  h: 380 }, // plaza  <-> academy
    { x: 2064, y: 1285, w: 432, h: 96 },  // plaza  <-> workshop
    { x: 1758, y: 1500, w: 96,  h: 460 }, // plaza  <-> ledger
    { x: 2998, y: 600,  w: 96,  h: 400, secret: true }, // workshop <-> vault
  ];

  const byId = {};
  islands.forEach(function (i) {
    byId[i.id] = i;
    i.cx = i.x + i.w / 2;
    i.cy = i.y + i.h / 2;
  });

  /* ---------- layout helper: spread n items across an island ------------ */
  function spread(island, n, opts) {
    opts = opts || {};
    const padX = opts.padX == null ? 130 : opts.padX;
    const perRow = opts.perRow || Math.min(n, 4);
    const rows = Math.ceil(n / perRow);

    // Rows are packed into the band between `top` and the island's bottom
    // margin, so adding content compresses the layout instead of pushing
    // props over the edge into the void.
    const bandTop = island.y + (opts.top == null ? island.h * 0.55 : opts.top);
    const bandBottom = island.y + island.h - (opts.bottom == null ? 110 : opts.bottom);
    const rowGap = rows > 1
      ? Math.min(opts.rowGap || 190, Math.max(120, (bandBottom - bandTop) / (rows - 1)))
      : 0;

    const out = [];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, n - row * perRow);
      const col = i % perRow;
      const usable = island.w - padX * 2;
      const step = inRow > 1 ? usable / (inRow - 1) : 0;
      const x = inRow > 1 ? island.x + padX + step * col : island.cx;
      out.push({ x: x, y: bandTop + row * rowGap });
    }
    return out;
  }

  /* ---------- props ------------------------------------------------------ */
  const props = [];
  let uid = 0;

  function add(p) {
    p.id = 'p' + uid++;
    p.fw = p.fw || p.w * 0.78;
    p.fh = p.fh || 20;
    p.seed = uid * 977;
    props.push(p);
    return p;
  }

  /* --- The Crossroads: orientation, identity, skills, contact --- */
  const plaza = byId.plaza;

  add({
    kind: 'signpost', island: 'plaza', x: plaza.cx, y: plaza.y + 380,
    w: 54, h: 74, solid: true,
    label: 'Read the signpost', title: 'How this works', eyebrow: 'signpost',
    view: 'howto',
  });

  add({
    kind: 'statue', island: 'plaza', x: plaza.x + 150, y: plaza.y + 250,
    w: 76, h: 112, solid: true,
    label: 'Who is this?', title: C.profile.name, eyebrow: 'about',
    view: 'about',
  });

  add({
    kind: 'board', island: 'plaza', x: plaza.x + plaza.w - 150, y: plaza.y + 250,
    w: 118, h: 92, solid: true,
    label: 'Read the board', title: 'Toolkit', eyebrow: 'skills',
    view: 'skills',
  });

  add({
    kind: 'beacon', island: 'plaza', x: plaza.cx, y: plaza.y + 140,
    w: 84, h: 150, solid: true,
    label: 'Signal the beacon', title: 'Get in touch', eyebrow: 'contact',
    view: 'contact',
  });

  /* --- Origin: life story --- */
  const origin = byId.origin;

  add({
    kind: 'house', island: 'origin', x: origin.x + 200, y: origin.y + 210,
    w: 172, h: 148, solid: true,
    label: 'Enter the house', title: 'The long version', eyebrow: 'about',
    view: 'about',
  });

  add({
    kind: 'campfire', island: 'origin', x: origin.x + 650, y: origin.y + 210,
    w: 64, h: 54, solid: false,
    label: 'Sit by the fire', title: 'Things that are true', eyebrow: 'fun facts',
    view: 'facts',
  });

  // the three totems — gym, music, snowboard
  const TOTEM = {
    rack:      { w: 104, h: 104 },
    speaker:   { w: 78,  h: 126 },
    snowboard: { w: 64,  h: 134 },
  };
  spread(origin, C.passions.length, { top: 380, perRow: 3, padX: 195 }).forEach(function (pos, i) {
    const p = C.passions[i];
    const size = TOTEM[p.kind] || { w: 90, h: 110 };
    add({
      kind: p.kind, island: 'origin', x: pos.x, y: pos.y,
      w: size.w, h: size.h, solid: true,
      label: 'Take a look', title: p.title, eyebrow: p.eyebrow,
      view: 'passion', index: i,
    });
  });

  spread(origin, C.life.length, { top: 580, perRow: 6, padX: 130 }).forEach(function (pos, i) {
    add({
      kind: 'frame', island: 'origin', x: pos.x, y: pos.y,
      w: 66, h: 88, solid: true,
      label: 'Look closer', title: C.life[i].title, eyebrow: C.life[i].year,
      view: 'life', index: i,
    });
  });

  /* --- The Academy: education --- */
  const academy = byId.academy;

  add({
    kind: 'hall', island: 'academy', x: academy.cx, y: academy.y + 240,
    w: 210, h: 168, solid: true,
    label: 'Enter the hall', title: 'Education', eyebrow: 'overview',
    view: 'educationAll',
  });

  // Full degrees get a blackboard in the middle of the campus; anything
  // flagged `minor` (high school and the like) gets a small plaque off to
  // the side, so it reads as a footnote rather than a headline.
  const eduMajor = [], eduMinor = [];
  C.education.forEach(function (e, i) { (e.minor ? eduMinor : eduMajor).push(i); });

  spread(academy, eduMajor.length, { top: 460, perRow: 3, padX: 200 }).forEach(function (pos, n) {
    const i = eduMajor[n];
    add({
      kind: 'blackboard', island: 'academy', x: pos.x, y: pos.y,
      w: 126, h: 96, solid: true,
      label: 'Read the board', title: C.education[i].school, eyebrow: C.education[i].degree,
      view: 'education', index: i,
    });
  });

  eduMinor.forEach(function (i, n) {
    add({
      kind: 'plaque', island: 'academy',
      x: academy.x + academy.w - 155, y: academy.y + 320 + n * 150,
      w: 84, h: 82, solid: true,
      label: 'Read the plaque', title: C.education[i].school, eyebrow: C.education[i].period,
      view: 'education', index: i,
    });
  });

  /* --- The Workshop: projects --- */
  const workshop = byId.workshop;

  spread(workshop, C.projects.length, { top: 250, perRow: 3, padX: 180, rowGap: 250 })
    .forEach(function (pos, i) {
      add({
        kind: 'terminal', island: 'workshop', x: pos.x, y: pos.y,
        w: 100, h: 104, solid: true,
        label: 'Boot the terminal', title: C.projects[i].name, eyebrow: C.projects[i].year,
        view: 'project', index: i,
      });
    });

  /* --- The Ledger: experience --- */
  const ledger = byId.ledger;

  spread(ledger, C.experience.length, { top: 340, perRow: 4, padX: 190 }).forEach(function (pos, i) {
    add({
      kind: 'monolith', island: 'ledger', x: pos.x, y: pos.y,
      w: 84, h: 148, solid: true,
      label: 'Touch the monolith', title: C.experience[i].company, eyebrow: C.experience[i].role,
      view: 'experience', index: i,
    });
  });

  /* --- The Vault: the reward --- */
  const vault = byId.vault;
  add({
    kind: 'chest', island: 'vault', x: vault.cx - 80, y: vault.y + 260,
    w: 88, h: 72, solid: true,
    label: 'Open it', title: 'You found the vault', eyebrow: 'secret',
    view: 'vault',
  });

  // The reward for finding all ten fragments: a board that makes crossing
  // the map genuinely fast. Disappears from the world once taken.
  add({
    kind: 'boardstand', island: 'vault', x: vault.cx + 90, y: vault.y + 260,
    w: 66, h: 140, solid: true,
    label: 'Take the board', title: 'Snowboard', eyebrow: 'the real reward',
    view: 'board', action: 'takeBoard', hideWhen: 'hasBoard',
  });

  /* ---------- decorative scatter ---------------------------------------- */
  const decor = [];
  islands.forEach(function (island) {
    const rand = rng(island.id.charCodeAt(0) * 7919 + island.w);
    const kinds = island.id === 'origin' ? ['tree', 'tree', 'bush', 'flower', 'rock']
      : island.id === 'workshop' ? ['crystal', 'crystal', 'rock', 'lantern']
      : island.id === 'academy' ? ['lantern', 'crystal', 'bush']
      : island.id === 'ledger' ? ['rock', 'rock', 'lantern']
      : island.id === 'vault' ? ['crystal', 'crystal']
      : ['lantern', 'bush', 'rock'];

    const count = Math.round((island.w * island.h) / 22000);
    for (let i = 0; i < count; i++) {
      const x = island.x + 70 + rand() * (island.w - 140);
      const y = island.y + 70 + rand() * (island.h - 110);
      // rounded corners mean a point inside the bounding box can still be
      // over the void — only keep decor that is actually standing on ground
      if (!inRoundRect(x, y, island.x + EDGE, island.y + EDGE,
                       island.w - EDGE * 2, island.h - EDGE * 2,
                       Math.max(4, island.r - EDGE))) continue;
      // keep decor off the props and off the middle walking lanes
      let clear = true;
      for (let j = 0; j < props.length; j++) {
        const p = props[j];
        if (p.island === island.id && Math.abs(p.x - x) < 130 && Math.abs(p.y - y) < 120) { clear = false; break; }
      }
      if (!clear) continue;
      const kind = kinds[Math.floor(rand() * kinds.length)];
      decor.push({
        kind: kind, x: x, y: y, island: island.id,
        scale: 0.75 + rand() * 0.6, seed: Math.floor(rand() * 9999),
        solid: kind === 'tree', fw: 22, fh: 12,
        hue: island.glow,
      });
    }
  });

  /* ---------- collectible fragments -------------------------------------- */
  const bits = [
    { x: 520,  y: 1120 }, { x: 1080, y: 1560 },
    { x: 1520, y: 300 },  { x: 2180, y: 700 },
    { x: 2560, y: 1620 }, { x: 3280, y: 1050 },
    { x: 1330, y: 2380 }, { x: 2280, y: 2000 },
    { x: 1806, y: 1700 }, { x: 3050, y: 1580 },
  ].map(function (b, i) { return { id: 'b' + i, x: b.x, y: b.y, taken: false }; });

  const BIT_TOTAL = bits.length;

  /* ---------- geometry --------------------------------------------------- */
  function inRoundRect(px, py, x, y, w, h, r) {
    if (px < x || py < y || px > x + w || py > y + h) return false;
    const rx = Math.min(Math.max(px, x + r), x + w - r);
    const ry = Math.min(Math.max(py, y + r), y + h - r);
    const dx = px - rx, dy = py - ry;
    return dx * dx + dy * dy <= r * r;
  }

  function onGround(x, y) {
    for (let i = 0; i < islands.length; i++) {
      const s = islands[i];
      if (s.secret && !state.vaultOpen) continue;
      if (inRoundRect(x, y, s.x + EDGE, s.y + EDGE, s.w - EDGE * 2, s.h - EDGE * 2, Math.max(4, s.r - EDGE))) return s;
    }
    // Inset the *sides* of a bridge (so you can fall off the rail) but never
    // its ends — the ends are where it meets the island.
    for (let i = 0; i < bridges.length; i++) {
      const b = bridges[i];
      if (b.secret && !state.vaultOpen) continue;
      const rail = 10;
      const horiz = b.w > b.h;
      const x0 = horiz ? b.x : b.x + rail;
      const x1 = horiz ? b.x + b.w : b.x + b.w - rail;
      const y0 = horiz ? b.y + rail : b.y;
      const y1 = horiz ? b.y + b.h - rail : b.y + b.h;
      if (x > x0 && x < x1 && y > y0 && y < y1) return b;
    }
    return null;
  }

  function blocked(x, y) {
    const all = props.concat(decor);
    for (let i = 0; i < all.length; i++) {
      const p = all[i];
      if (!p.solid) continue;
      const hw = p.fw / 2;
      if (x > p.x - hw && x < p.x + hw && y > p.y - p.fh && y < p.y + p.fh * 0.6) return true;
    }
    return false;
  }

  function isWalkable(x, y) {
    return !!onGround(x, y) && !blocked(x, y);
  }

  function islandAt(x, y) {
    const g = onGround(x, y);
    return g && g.id ? g : null;
  }

  return {
    WORLD_W: WORLD_W, WORLD_H: WORLD_H,
    islands: islands, byId: byId, bridges: bridges,
    props: props, decor: decor, bits: bits, BIT_TOTAL: BIT_TOTAL,
    state: state,
    spawn: { x: plaza.cx - 10, y: plaza.y + plaza.h - 66 },
    isWalkable: isWalkable, onGround: onGround, islandAt: islandAt,
    inRoundRect: inRoundRect, rng: rng,
  };
})();
