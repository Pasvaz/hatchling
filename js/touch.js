'use strict';
// ---------- touch controls: virtual joystick + transparent buttons ----------
// Loads on coarse-pointer devices (phones/tablets); add ?touch=1 to the URL to
// force it on desktop for testing. Everything funnels into the SAME G.input /
// G.keys flags the keyboard sets, so the game code never knows the difference.
(() => {
  const forced = new URLSearchParams(location.search).get('touch') === '1';
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const enabled = forced || coarse || 'ontouchstart' in window;
  window.TOUCH = { enabled };
  if (!enabled) return;
  document.body.classList.add('touch');
  resize();   // main.js booted before the class existed — re-derive the zoomed-in touch view

  const layer = document.getElementById('touch');
  const ctxBox = document.getElementById('ctxbtns');
  const swz = document.getElementById('swipezone');

  // no zoom, ever: CSS touch-action handles double-tap on modern browsers,
  // these catch iOS Safari's pinch gesture and stray double-clicks
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());

  // ---- a flick is not a tap: drop any click whose finger travelled ----
  // scrolling the lobby used to launch whatever card the flick ended on.
  // Capture phase so it beats every UI handler; synthetic clicks are
  // isTrusted:false and pass through untouched (the test harness needs them).
  let downAt = null;
  document.addEventListener('pointerdown', (ev) => { downAt = { x: ev.clientX, y: ev.clientY }; }, true);
  document.addEventListener('click', (ev) => {
    // isTrusted is unforgeable, so the harness marks its events _testTrusted
    if (!(ev.isTrusted || ev._testTrusted) || !downAt) return;
    if (Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y) > 12) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  }, true);

  // ---- fullscreen + landscape lock, on the first tap once a game is on ----
  // (Android honors the lock; iPhones can't lock at all — the #rotate overlay
  // covers portrait there, and add-to-home-screen gives them fullscreen)
  document.addEventListener('touchend', () => {
    if (!G.started || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    document.documentElement.requestFullscreen().then(() => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { });
    }).catch(() => { });
  }, { passive: true });

  // ---- the joystick: spawns UNDER the thumb, anywhere on the left side ----
  // dynamic mode — nipplejs creates the stick at the touch point and removes
  // it on release, so it's always exactly where the thumb landed (the old
  // fixed stick sat at one arbitrary spot and felt "randomly located").
  // Still created lazily on first in-game frame: the zone is display:none in
  // the lobby and can't take touches anyway.
  const joyzone = document.getElementById('joyzone');
  const clearDirs = () => {
    const i = G.input;
    i.up = i.down = i.left = i.right = i.sprint = false;
    joyzone.classList.remove('sprint');
  };
  let joy = null;
  function ensureJoy() {
    if (joy) return;
    joy = nipplejs.create({
      zone: joyzone,
      mode: 'dynamic',
      color: '#ffe9a0',
      size: 110,
      maxNumberOfNipples: 1,
      restOpacity: 0.35,
    });
    joy.on('move', (ev, data) => {
      if (!data.vector) return;
      const i = G.input, dead = 0.28;
      i.left = data.vector.x < -dead;
      i.right = data.vector.x > dead;
      i.up = data.vector.y > dead;      // nipplejs y points UP
      i.down = data.vector.y < -dead;
      // sprint LATCHES near the rim and only lets go well inside it — the old
      // razor 'force >= 1' trigger flickered off with every thumb wobble
      i.sprint = i.sprint ? data.force > 0.7 : data.force >= 0.95;
      joyzone.classList.toggle('sprint', i.sprint);   // the stick heats up while running
    });
    joy.on('end', clearDirs);
    window.TOUCH._joy = joy;   // exposed for the test harness
  }

  // ---- buttons: everything presses the same flags the keyboard does ----
  const press = (el, down, up) => {
    el.addEventListener('pointerdown', (ev) => { ev.preventDefault(); down(); });
    if (up) {
      for (const evn of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(evn, up);
    }
  };
  press(document.getElementById('btn-atk'), () => { G.input.attack = true; });
  // grab is HOLD-sensitive (hold to tear a chunk) — mirror the real key state
  press(document.getElementById('btn-grab'),
    () => { G.input.grab = true; G.keys.KeyG = true; },
    () => { G.keys.KeyG = false; });
  press(document.getElementById('btn-rest'), () => { G.input.rest = true; });
  press(document.getElementById('btn-pause'), () => {
    if (!G.started) return;
    G.paused = !G.paused;
    document.getElementById('pause').classList.toggle('hidden', !G.paused);
  });

  // ---- context actions: the game's own prompts become buttons ----
  // G.prompt strings look like 'E — Drink' (several joined by wide spaces);
  // the leading letter tells us which input flag the action wants.
  const KEYACT = { E: 'interact', N: 'nest', F: 'fish', M: 'wrestle', P: 'pack', I: 'burrow', R: 'rest', G: 'grab' };
  let lastPrompt = null;
  function buildCtx(prompt) {
    ctxBox.innerHTML = '';
    if (!prompt) return;
    for (const seg of prompt.split(/\s{3,}/)) {
      const m = seg.match(/^([A-Z])\s*—\s*(.+)$/);
      if (!m || !KEYACT[m[1]]) continue;
      const act = KEYACT[m[1]];
      const b = document.createElement('div');
      b.className = 'tbtn ctx';
      b.textContent = m[2].toUpperCase();
      b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); G.input[act] = true; });
      ctxBox.appendChild(b);
    }
  }

  // ---- wrestle QTE: the right half becomes a swipe pad (W A S D → ↑ ← ↓ →) ----
  const ARROW = { KeyW: '⬆', KeyA: '⬅', KeyS: '⬇', KeyD: '➡' };
  let swStart = null;
  swz.addEventListener('pointerdown', (ev) => { ev.preventDefault(); swStart = { x: ev.clientX, y: ev.clientY }; });
  swz.addEventListener('pointerup', (ev) => {
    const s = swStart; swStart = null;
    if (!s || !G.wrestle) return;
    const dx = ev.clientX - s.x, dy = ev.clientY - s.y;
    if (Math.hypot(dx, dy) < 24) return;
    G.wrestle.pressed = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'KeyD' : 'KeyA') : (dy > 0 ? 'KeyS' : 'KeyW');
  });

  // ---- per-frame sync: show/hide with the game, rebuild the context row ----
  function syncTouch() {
    const on = G.started && G.player && G.player.alive;
    layer.classList.toggle('ingame', !!on);
    if (on) ensureJoy();   // the zone is measurable now — safe to anchor the stick
    layer.classList.toggle('paused', !!(on && G.paused));
    layer.classList.toggle('wrestling', !!(on && G.wrestle));
    if (on && G.wrestle) {
      const key = G.wrestle.seq && G.wrestle.seq[G.wrestle.idx];
      swz.textContent = key ? 'SWIPE ' + (ARROW[key] || '') : '';
    }
    const prompt = on && !G.paused && !G.wrestle ? (G.prompt || '') : '';
    if (prompt !== lastPrompt) { lastPrompt = prompt; buildCtx(prompt); }
    if (!on && (G.input.up || G.input.down || G.input.left || G.input.right)) clearDirs();
  }
  window.TOUCH.sync = syncTouch;   // exposed so tests can step it manually
  (function loop() { requestAnimationFrame(loop); syncTouch(); })();
})();
