'use strict';
// ---------- tiny utility layer + shared game object ----------
const TAU = Math.PI * 2;
const G = { time: 0 };            // global game state, filled by main.js

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return Math.hypot(dx, dy); }
function angTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

// deterministic RNG (world gen)
let _seed = 987654321;
function srand(s) { _seed = (s >>> 0) || 1; }
function rnd() {
  _seed ^= _seed << 13; _seed >>>= 0;
  _seed ^= _seed >> 17;
  _seed ^= _seed << 5; _seed >>>= 0;
  return _seed / 4294967296;
}
function rrange(a, b) { return a + rnd() * (b - a); }

// hash / value noise (world gen, static detail)
function hash2(x, y) {
  let n = (x * 374761393 + y * 668265263) >>> 0;
  n = ((n ^ (n >>> 13)) * 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi), b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}
function fbm(x, y) { return vnoise(x, y) * 0.62 + vnoise(x * 2.13 + 5.2, y * 2.13 + 1.3) * 0.38; }

// ---------- colors ----------
function hexRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(r, g, b) {
  return '#' + ((1 << 24) | (clamp(r, 0, 255) << 16) | (clamp(g, 0, 255) << 8) | clamp(b, 0, 255)).toString(16).slice(1);
}
function shade(hex, f) {
  const [r, g, b] = hexRGB(hex);
  return rgbHex(Math.round(r * f), Math.round(g * f), Math.round(b * f));
}
function mixHex(h1, h2, t) {
  const a = hexRGB(h1), b = hexRGB(h2);
  return rgbHex(Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t)));
}

// ---------- growth stages ----------
function stageOf(g) {
  if (g >= 0.999) return 'Full Adult';
  if (g >= 0.9) return 'Adult';
  if (g >= 0.3) return 'Sub-adult';
  if (g >= 0.2) return 'Adolescent';
  if (g >= 0.1) return 'Juvenile';
  return 'Hatchling';
}
function sizeScale(g) { return 0.30 + 0.70 * g; }

// ---------- genders: every playable comes in two loadouts ----------
// females wear plain coats but are quicker and earn more growths; males wear
// bright showy coats and are bigger, tougher and stronger — but slower, and
// they earn less. NPCs carry no gender and get the neutral row.
const GENDER_MOD = {
  f: { hp: 1.0, dmg: 1.0, speed: 1.06, size: 1.0, earn: 1.25 },
  m: { hp: 1.3, dmg: 1.2, speed: 0.9, size: 1.09, earn: 0.8 },
};
const GENDER_NEUTRAL = { hp: 1, dmg: 1, speed: 1, size: 1, earn: 1 };
function genderMod(e) { return (e && GENDER_MOD[e.gender]) || GENDER_NEUTRAL; }

// ---------- tiny synth SFX ----------
const SFX = (() => {
  let ac = null, muted = false;
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type, vol, slide) {
    const a = ctx(); if (!a || muted) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), a.currentTime + dur);
    g.gain.value = vol || 0.08;
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  }
  function noise(dur, vol, lp) {
    const a = ctx(); if (!a || muted) return;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp || 900;
    const g = a.createGain(); g.gain.value = vol || 0.1;
    src.connect(f); f.connect(g); g.connect(a.destination); src.start();
  }
  return {
    toggleMute() { muted = !muted; return muted; },
    bite() { noise(0.09, 0.16, 1400); tone(110, 0.1, 'square', 0.06, 60); },
    hurt() { tone(240, 0.22, 'sawtooth', 0.09, 70); },
    eat() { noise(0.06, 0.1, 700); setTimeout(() => noise(0.06, 0.08, 600), 90); },
    drink() { tone(500, 0.08, 'sine', 0.05, 700); setTimeout(() => tone(560, 0.08, 'sine', 0.05, 760), 110); },
    splash() { noise(0.25, 0.08, 500); },
    stage() { [392, 494, 587, 784].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.07), i * 110)); },
    coin() { tone(740, 0.07, 'triangle', 0.045); setTimeout(() => tone(988, 0.1, 'triangle', 0.045), 70); },
    buy() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'triangle', 0.06), i * 80)); },
    die() { tone(180, 0.6, 'sawtooth', 0.1, 40); },
    kill() { noise(0.18, 0.12, 800); tone(90, 0.3, 'square', 0.07, 45); },
  };
})();
