/* ==========================================================================
   player.js — movement, collision resolution, footstep dust.
   ========================================================================== */

window.PLAYER = (function () {
  'use strict';

  const W = window.WORLD;

  const ACCEL = 2600;
  const FRICTION = 12;
  const MAX_SPEED = 300;

  /* Riding isn't just "faster". Low friction is what makes it read as a
     board rather than a sprint: you carry speed through turns and drift a
     little past where you stop steering. */
  const RIDE_ACCEL = 3000;
  const RIDE_FRICTION = 3.6;
  const RIDE_MAX_SPEED = 620;

  function create() {
    return {
      x: W.spawn.x,
      y: W.spawn.y,
      vx: 0, vy: 0,
      speed: 0,
      walk: 0,
      face: { x: 0, y: 1 },
      kind: 'player',
      stepTimer: 0,
    };
  }

  /* Move on one axis at a time so the player slides along edges instead of
     sticking to them. */
  function tryMove(p, dx, dy) {
    if (dx) {
      const nx = p.x + dx;
      if (W.isWalkable(nx, p.y)) p.x = nx;
      else {
        // let them scrape past corners rather than dead-stop
        if (W.isWalkable(nx, p.y - 10)) { p.x = nx; p.y -= 10 * Math.min(1, Math.abs(dx) / 4); }
        else if (W.isWalkable(nx, p.y + 10)) { p.x = nx; p.y += 10 * Math.min(1, Math.abs(dx) / 4); }
        else p.vx *= 0.2;
      }
    }
    if (dy) {
      const ny = p.y + dy;
      if (W.isWalkable(p.x, ny)) p.y = ny;
      else {
        if (W.isWalkable(p.x - 10, ny)) { p.y = ny; p.x -= 10 * Math.min(1, Math.abs(dy) / 4); }
        else if (W.isWalkable(p.x + 10, ny)) { p.y = ny; p.x += 10 * Math.min(1, Math.abs(dy) / 4); }
        else p.vy *= 0.2;
      }
    }
  }

  function update(p, dir, dt, particles) {
    const riding = !!p.riding;
    const accel = riding ? RIDE_ACCEL : ACCEL;
    const friction = riding ? RIDE_FRICTION : FRICTION;
    const maxSpeed = riding ? RIDE_MAX_SPEED : MAX_SPEED;

    p.vx += dir.x * accel * dt;
    p.vy += dir.y * accel * dt;

    const damp = Math.max(0, 1 - friction * dt);
    p.vx *= damp;
    p.vy *= damp;

    const sp = Math.hypot(p.vx, p.vy);
    if (sp > maxSpeed) { p.vx = (p.vx / sp) * maxSpeed; p.vy = (p.vy / sp) * maxSpeed; }
    p.speed = sp;

    // lean into the turn, for the sprite
    const want = riding ? Math.max(-1, Math.min(1, (dir.x * sp) / maxSpeed * 1.6)) : 0;
    p.lean = (p.lean || 0) + (want - (p.lean || 0)) * Math.min(1, dt * 6);

    if (sp > 4) {
      // sub-step so fast movement can't tunnel through a prop
      const steps = Math.max(1, Math.ceil((sp * dt) / 6));
      for (let i = 0; i < steps; i++) tryMove(p, (p.vx * dt) / steps, (p.vy * dt) / steps);
      p.walk += sp * dt * 0.055;
      const inv = 1 / sp;
      p.face.x = p.face.x * 0.75 + p.vx * inv * 0.25;
      p.face.y = p.face.y * 0.75 + p.vy * inv * 0.25;
    } else {
      p.vx = p.vy = 0;
    }

    // footstep dust — or a spray of snow off the edge of the board
    p.stepTimer -= dt;
    if (sp > 120 && p.stepTimer <= 0 && !window.REDUCED_MOTION) {
      p.stepTimer = riding ? 0.035 : 0.16;
      const spread = riding ? 26 : 12;
      particles.push({
        x: p.x + (Math.random() - 0.5) * spread,
        y: p.y + (Math.random() - 0.5) * 5,
        vx: -p.vx * (riding ? 0.16 : 0.08) + (Math.random() - 0.5) * (riding ? 60 : 22),
        vy: -p.vy * (riding ? 0.16 : 0.08) + (Math.random() - 0.5) * (riding ? 34 : 14),
        r: (riding ? 1.6 : 2) + Math.random() * (riding ? 2.6 : 3),
        life: 1,
        snow: riding,
      });
      if (!riding && window.SFX.isOn()) window.SFX.step();
    }
  }

  function updateParticles(particles, dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const d = particles[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.94;
      d.vy *= 0.94;
      d.life -= dt * 1.7;
      if (d.life <= 0) particles.splice(i, 1);
    }
  }

  return { create: create, update: update, updateParticles: updateParticles };
})();
