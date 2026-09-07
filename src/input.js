/* ==========================================================================
   input.js: keyboard, virtual stick and click-to-move, normalised into
   one { dir, action } shape the game loop reads each frame.
   ========================================================================== */

window.INPUT = (function () {
  'use strict';

  const keys = Object.create(null);
  const dir = { x: 0, y: 0 };
  const stick = { active: false, x: 0, y: 0 };
  const tap = { active: false, x: 0, y: 0 }; // click-to-move target (world px)

  let actionQueued = false;
  const onKeyHandlers = [];

  const MAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  /* Controls that need the keyboard for themselves: a focused button must
     still get Space, and a focused <video> must still get arrow keys. The
     game gives up movement/action keys while one of these has focus, but
     Esc and the overlay shortcuts must keep working, so the key handlers
     below still run either way. */
  function ownsKeys(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' ||
           tag === 'A' || tag === 'AUDIO' || tag === 'VIDEO' ||
           tag === 'SELECT' || el.isContentEditable;
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Shift') keys.shift = true;
    if (!ownsKeys(document.activeElement)) {
      const m = MAP[e.code];
      if (m) { keys[m] = true; e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        actionQueued = true;
        if (e.code === 'Space') e.preventDefault();
      }
    }
    for (let i = 0; i < onKeyHandlers.length; i++) onKeyHandlers[i](e);
  });

  window.addEventListener('keyup', function (e) {
    if (e.key === 'Shift') keys.shift = false;
    const m = MAP[e.code];
    if (m) keys[m] = false;
  });

  window.addEventListener('blur', function () {
    keys.up = keys.down = keys.left = keys.right = false;
    keys.shift = false;   // alt-tabbing away must not leave you stuck riding
    stick.active = false; stick.x = stick.y = 0;
  });

  /* ---------- virtual stick --------------------------------------------- */
  function bindStick(el, nub) {
    const R = 44;
    let id = null;

    function place(dx, dy) {
      const len = Math.hypot(dx, dy);
      const k = len > R ? R / len : 1;
      nub.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px)';
      stick.x = (dx * k) / R;
      stick.y = (dy * k) / R;
    }

    function start(e) {
      const t = e.changedTouches ? e.changedTouches[0] : e;
      id = e.changedTouches ? t.identifier : 'mouse';
      stick.active = true;
      move(e);
      e.preventDefault();
    }
    function move(e) {
      if (!stick.active) return;
      const r = el.getBoundingClientRect();
      let t = e;
      if (e.changedTouches) {
        t = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === id) { t = e.changedTouches[i]; break; }
        }
        if (!t) return;
      }
      place(t.clientX - (r.left + r.width / 2), t.clientY - (r.top + r.height / 2));
      e.preventDefault();
    }
    function end() {
      stick.active = false; stick.x = stick.y = 0;
      nub.style.transform = 'translate(0,0)';
    }

    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    el.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
  }

  /* ---------- per-frame read --------------------------------------------- */
  function update() {
    let x = 0, y = 0;
    if (keys.left) x -= 1;
    if (keys.right) x += 1;
    if (keys.up) y -= 1;
    if (keys.down) y += 1;

    if (stick.active && (Math.abs(stick.x) > 0.14 || Math.abs(stick.y) > 0.14)) {
      x = stick.x; y = stick.y;
    }

    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    dir.x = x; dir.y = y;
    return dir;
  }

  return {
    dir: dir,
    tap: tap,
    update: update,
    bindStick: bindStick,
    isShift: function () { return !!keys.shift; },
    isMoving: function () { return Math.abs(dir.x) > 0.01 || Math.abs(dir.y) > 0.01; },
    queueAction: function () { actionQueued = true; },
    consumeAction: function () { const a = actionQueued; actionQueued = false; return a; },
    onKey: function (fn) { onKeyHandlers.push(fn); },
    clearMove: function () {
      keys.up = keys.down = keys.left = keys.right = false;
      stick.x = stick.y = 0; stick.active = false;
      tap.active = false;
    },
  };
})();
