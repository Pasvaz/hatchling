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
    // the RUN RING sits exactly where sprint engages: walk inside it, cross
    // it to run. Positioned at the stick's spawn point every touch.
    const ring = document.getElementById('joyring');
    joy.on('start', (ev, data) => {
      const zr = joyzone.getBoundingClientRect();
      ring.style.left = (data.position.x - zr.left) + 'px';
      ring.style.top = (data.position.y - zr.top) + 'px';
      joyzone.classList.add('active');
    });
    joy.on('move', (ev, data) => {
      if (!data.vector) return;
      const i = G.input, dead = 0.28;
      i.left = data.vector.x < -dead;
      i.right = data.vector.x > dead;
      i.up = data.vector.y > dead;      // nipplejs y points UP
      i.down = data.vector.y < -dead;
      // sprint LATCHES when the thumb crosses the ring (0.85 of the rim) and
      // only lets go well back inside (0.55) — walk and run stay distinct
      const was = i.sprint;
      i.sprint = i.sprint ? data.force > 0.55 : data.force >= 0.85;
      if (i.sprint && !was && navigator.vibrate) navigator.vibrate(18);   // a tick you can feel
      joyzone.classList.toggle('sprint', i.sprint);
    });
    joy.on('end', () => { joyzone.classList.remove('active'); clearDirs(); });
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
  // pounce (or the tail-spin) is a HOLD: down starts the coil, release either
  // cancels it (mid-prep) or ends the swing — the game reads the held flag
  const pncBtn = document.getElementById('btn-pnc');
  press(pncBtn,
    () => { G.input.pounceHold = true; },
    () => { G.input.pounceHold = false; });
  // grab is HOLD-sensitive (hold to tear a chunk) — mirror the real key state
  const grabBtn = document.getElementById('btn-grab');
  press(grabBtn,
    () => { G.input.grab = true; G.keys.KeyG = true; },
    () => { G.keys.KeyG = false; });
  // the 4th slot: eat / drink, whenever the world offers a meal
  const eatBtn = document.getElementById('btn-eat');
  press(eatBtn, () => { G.input.interact = true; });
  press(document.getElementById('btn-rest'), () => { G.input.rest = true; });
  press(document.getElementById('btn-pause'), () => {
    if (!G.started) return;
    G.paused = !G.paused;
    document.getElementById('pause').classList.toggle('hidden', !G.paused);
  });

  // ---- context actions: the game's own prompts become buttons ----
  // G.prompt strings look like 'E — Drink' (several joined by wide spaces);
  // the leading letter tells us which input flag the action wants.
  const KEYACT = { E: 'interact', N: 'nest', F: 'fish', M: 'wrestle', P: 'pack', I: 'burrow', R: 'rest' };
  let lastPrompt = null;
  function buildCtx(prompt) {
    ctxBox.innerHTML = '';
    // G-actions light up the GRAB button; drink/eat light up the 4th slot
    // with the right icon — everything else stays a labelled pill
    let grabOn = false, eatIcon = null;
    if (prompt) for (const seg of prompt.split(/\s{3,}/)) {
      const m = seg.match(/^([A-Z])\s*—\s*(.+)$/);
      if (!m) continue;
      if (m[1] === 'G') { grabOn = true; continue; }
      if (m[1] === 'E' && /Drink/i.test(m[2])) { eatIcon = '💧'; continue; }
      if (m[1] === 'E' && /Eat|Feed|Swallow|Browse/i.test(m[2])) {
        eatIcon = /carcass|Swallow/i.test(m[2]) ? '🍖' : '🌿';
        continue;
      }
      if (!KEYACT[m[1]]) continue;
      const act = KEYACT[m[1]];
      const b = document.createElement('div');
      b.className = 'tbtn ctx';
      b.textContent = m[2].toUpperCase();
      b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); G.input[act] = true; });
      ctxBox.appendChild(b);
    }
    grabBtn.classList.toggle('on', grabOn);
    if (eatIcon) eatBtn.textContent = eatIcon;
    eatBtn.classList.toggle('on', !!eatIcon);
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
  let pncSp = null;
  function syncTouch() {
    const on = G.started && G.player && G.player.alive;
    layer.classList.toggle('ingame', !!on);
    if (on) ensureJoy();   // the zone is measurable now — safe to anchor the stick
    // the third button is the dino's power: leap for biters, spin for tails
    if (on && G.player.species !== pncSp) {
      pncSp = G.player.species;
      pncBtn.textContent = DINO[pncSp].tailWeapon ? '🌀' : '🐾';
    }
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
