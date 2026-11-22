'use strict';
// ============================================================================
// THE LESSER ARCHIPELAGO — open ocean, nearly three times the Death Desert,
// with thirty-two named islands (and one speck, Okiri) strewn across it: far apart, some stretches
// of sea with nothing in them at all. Each island keeps its own animals.
//
// An island is a set of BLOBS — noise-warped radial shapes — so chains of
// them make crescents, serpents, hooks, atolls and splayed fingers; a blob
// stack makes a lumpy main island with peninsulas. From the blobs comes one
// signed distance-to-coast field (in tiles, + on land), and from that the
// terrain: beach, wadeable shallows, the deep shelf, and past the shelf
// SWIMMER'S DEPTH, which only real swimmers cross.
// ============================================================================
const ARCHI_BEACH = 1.8;     // tiles of beach sand inside the coastline
const ARCHI_SHALLOW = 3;     // tiles of wadeable shallows outside it
const ARCHI_SHELF = 11;      // the deep shelf ends here — swimmer's depth beyond
const ISLE_N = 64;           // radius samples around each blob

// the plan, in tiles on the 1440-tile map. R is the island's base radius;
// the shapes stretch it out. (Giants' Cradle ≈ 3,600 tiles of area — the
// smallest here, Pell; Fern Valley ≈ 14,400 — the largest, Kalimbra.)
const ISLE_PLAN = [
  { key: 'utoriana', name: 'Utoriana', x: 470, y: 600, shape: 'blob', R: 43, lobes: 5, flavor: 'grove' },
  { key: 'narapa', name: 'Narapa', x: 616, y: 526, shape: 'blob', R: 44, lobes: 6, flavor: 'meadow' },
  { key: 'velinra', name: 'Velinra', x: 200, y: 205, shape: 'crescent', R: 15, A: 62, a0: 1.9, span: 3.7, flavor: 'jungle' },
  { key: 'ossamere', name: 'Ossamere', x: 308, y: 154, shape: 'blob', R: 33, lobes: 2, flavor: 'pine' },
  { key: 'kalimbra', name: 'Kalimbra', x: 820, y: 185, shape: 'blob', R: 56, lobes: 5, flavor: 'jungle' },
  { key: 'takurei', name: 'Taku Rei', x: 900, y: 452, shape: 'atoll', R: 13, A: 42, n: 12, flavor: 'scrub' },
  { key: 'merovia', name: 'Merovia', x: 140, y: 545, shape: 'serpent', R: 13, len: 235, ang: 1.42, wav: 26, flavor: 'grove' },
  { key: 'ishandra', name: 'Ishandra', x: 300, y: 820, shape: 'blob', R: 37, lobes: 3, flavor: 'meadow' },
  { key: 'pell', name: 'Pell', x: 392, y: 896, shape: 'blob', R: 31, lobes: 1, flavor: 'cycad' },
  { key: 'zuranoa', name: 'Zuranoa', x: 625, y: 860, shape: 'hook', R: 17, A: 55, a0: -0.4, flavor: 'jungle' },
  { key: 'orrotha', name: 'Orrotha', x: 880, y: 755, shape: 'blob', R: 43, lobes: 3, flavor: 'rocky' },
  { key: 'halune', name: 'Halune', x: 920, y: 864, shape: 'blob', R: 32, lobes: 2, flavor: 'scrub' },
  { key: 'sivanna', name: 'Sivanna', x: 442, y: 330, shape: 'fingers', R: 24, fingers: 5, flen: 46, flavor: 'cycad' },
  { key: 'brekka', name: 'Brekka', x: 112, y: 898, shape: 'blob', R: 32, lobes: 2, flavor: 'rocky' },
  { key: 'nimoru', name: 'Nimoru', x: 560, y: 112, shape: 'blob', R: 35, lobes: 3, flavor: 'pine' },
  { key: 'ekkalia', name: 'Ekkalia', x: 952, y: 632, shape: 'blob', R: 32, lobes: 2, flavor: 'meadow' },
  { key: 'varossa', name: 'Varossa', x: 742, y: 335, shape: 'blob', R: 35, lobes: 3, flavor: 'grove' },
  // OKIRI: a speck of sand and scrub in an empty stretch of sea, no bigger
  // than the Giants' Cradle's pond. Kaiwhekea hatch here, and go to sea.
  // (last in the plan, so it never reshapes the islands before it)
  { key: 'okiri', name: 'Okiri', x: 300, y: 470, shape: 'blob', R: 10, lobes: 0, flavor: 'meadow' },
  // ---- the outer reaches (the map grew to 1440 to the east and south):
  // more islands at the same sizes and spacing, with open sea between ----
  { key: 'tavessa', name: 'Tavessa', x: 1150, y: 120, shape: 'blob', R: 38, lobes: 3, flavor: 'jungle' },
  { key: 'quorran', name: 'Quorran', x: 1320, y: 270, shape: 'crescent', R: 14, A: 55, a0: 2.4, span: 3.5, flavor: 'pine' },
  { key: 'ilmeth', name: 'Ilmeth', x: 1190, y: 430, shape: 'blob', R: 40, lobes: 4, flavor: 'meadow' },
  { key: 'saruun', name: 'Saruun', x: 1290, y: 515, shape: 'blob', R: 34, lobes: 2, flavor: 'rocky' },
  { key: 'pelagra', name: 'Pelagra', x: 1320, y: 790, shape: 'serpent', R: 12, len: 200, ang: 2.2, wav: 22, flavor: 'grove' },
  { key: 'ombrel', name: 'Ombrel', x: 1120, y: 930, shape: 'blob', R: 34, lobes: 3, flavor: 'cycad' },
  { key: 'drevan', name: 'Drevan', x: 150, y: 1150, shape: 'blob', R: 40, lobes: 3, flavor: 'pine' },
  { key: 'kesh', name: 'Kesh', x: 223, y: 1221, shape: 'blob', R: 34, lobes: 2, flavor: 'scrub' },
  { key: 'muradel', name: 'Muradel', x: 480, y: 1170, shape: 'fingers', R: 25, fingers: 4, flen: 46, flavor: 'jungle' },
  { key: 'anzu', name: 'Anzu', x: 380, y: 1360, shape: 'blob', R: 32, lobes: 2, flavor: 'rocky' },
  { key: 'tollan', name: 'Tollan', x: 620, y: 1350, shape: 'atoll', R: 12, A: 38, n: 11, flavor: 'scrub' },
  { key: 'veyra', name: 'Veyra', x: 830, y: 1250, shape: 'hook', R: 16, A: 50, a0: 1.0, flavor: 'meadow' },
  { key: 'hesk', name: 'Hesk', x: 1150, y: 1160, shape: 'blob', R: 44, lobes: 5, flavor: 'grove' },
  { key: 'brimmora', name: 'Brimmora', x: 1238, y: 1226, shape: 'blob', R: 33, lobes: 2, flavor: 'jungle' },
  { key: 'orsk', name: 'Orsk', x: 1315, y: 1335, shape: 'blob', R: 32, lobes: 1, flavor: 'pine' },
];
// the narrow waters between neighbours. The first is THE PATHWAY off
// Utoriana — Garamirala's own. The rest are short channels with their own.
const STRAIT_PLAN = [
  ['utoriana', 'narapa', true],
  ['velinra', 'ossamere', false],
  ['ishandra', 'pell', false],
  ['orrotha', 'halune', false],
  // the outer reaches' channels
  ['orrotha', 'ekkalia', false],
  ['ilmeth', 'saruun', false],
  ['drevan', 'kesh', false],
  ['hesk', 'brimmora', false],
  ['brimmora', 'orsk', false],
];

function mkBlob(x, y, R, wild) {
  const harm = [];
  for (const k of [2, 3, 4, 5, 7]) harm.push([k, rnd() * (k <= 3 ? 0.2 : 0.09) * wild, rnd() * TAU]);
  const seed = rnd() * 100;
  const r = new Float32Array(ISLE_N);
  let rmax = 0;
  for (let i = 0; i < ISLE_N; i++) {
    const a = (i / ISLE_N) * TAU;
    let v = 1;
    for (const [k, amp, ph] of harm) v += amp * Math.cos(k * a + ph);
    v += (fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6 + seed) - 0.5) * 0.45 * wild;
    r[i] = Math.max(R * 0.3, R * v);
    rmax = Math.max(rmax, r[i]);
  }
  return { x, y, R, r, rmax };
}
function blobR(b, a) {
  const f = (((a / TAU) % 1) + 1) % 1 * ISLE_N;
  const i0 = Math.floor(f) % ISLE_N, t = f - Math.floor(f);
  return b.r[i0] + (b.r[(i0 + 1) % ISLE_N] - b.r[i0]) * t;
}
// the blobs of one island, by its shape
function isleBlobs(P) {
  const out = [];
  if (P.shape === 'crescent') {
    // a broken ring: fat in the middle, tapering to two horns
    const n = Math.ceil(P.span * P.A / (P.R * 0.8));
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1), a = P.a0 + P.span * t;
      out.push(mkBlob(P.x + Math.cos(a) * P.A, P.y + Math.sin(a) * P.A, P.R * (0.5 + 0.6 * Math.sin(t * Math.PI)), 0.8));
    }
  } else if (P.shape === 'serpent') {
    // a long sinuous spine with a swollen head at one end
    const n = Math.ceil(P.len / (P.R * 0.9));
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1) - 0.5;
      const along = t * P.len, side = Math.sin(t * Math.PI * 2.4) * P.wav;
      const x = P.x + Math.cos(P.ang) * along - Math.sin(P.ang) * side;
      const y = P.y + Math.sin(P.ang) * along + Math.cos(P.ang) * side;
      const head = t > 0.38 ? 1.7 : 1;
      out.push(mkBlob(x, y, P.R * (0.7 + 0.5 * fbm(j * 0.4, 3.3)) * head, 0.7));
    }
  } else if (P.shape === 'atoll') {
    // a ring of reef-islets round a lagoon — one gap lets the sea in, and
    // the lagoon's heart drops away into a blue hole
    const skip = Math.floor(rnd() * P.n);
    for (let j = 0; j < P.n; j++) {
      if (j === skip) continue;
      const a = (j / P.n) * TAU + rrange(-0.1, 0.1), A = P.A * rrange(0.9, 1.1);
      out.push(mkBlob(P.x + Math.cos(a) * A, P.y + Math.sin(a) * A, P.R * rrange(0.75, 1.25), 0.9));
    }
  } else if (P.shape === 'hook') {
    // a spiral that curls in on itself: a bay you can't see the end of
    const n = 13;
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1), a = P.a0 + t * 4.4, rad = P.A * (1 - 0.62 * t);
      out.push(mkBlob(P.x + Math.cos(a) * rad, P.y + Math.sin(a) * rad, P.R * (1.35 - 0.65 * t), 0.8));
    }
  } else if (P.shape === 'fingers') {
    // a small core with long crooked fingers splayed out into the sea
    out.push(mkBlob(P.x, P.y, P.R, 0.8));
    for (let f = 0; f < P.fingers; f++) {
      let a = (f / P.fingers) * TAU + rrange(-0.3, 0.3);
      const segs = 6;
      for (let s = 1; s <= segs; s++) {
        a += rrange(-0.13, 0.13);
        const dd = P.R * 0.6 + s * (P.flen / segs);
        out.push(mkBlob(P.x + Math.cos(a) * dd, P.y + Math.sin(a) * dd, P.R * 0.42 * (1 - (s / (segs + 1)) * 0.6), 0.6));
      }
    }
  } else {
    // a lumpy main body with lobes and peninsulas shoved off its sides
    out.push(mkBlob(P.x, P.y, P.R, 1.3));
    for (let k = 0; k < (P.lobes || 0); k++) {
      const a = rnd() * TAU, dd = P.R * rrange(0.6, 1.15);
      out.push(mkBlob(P.x + Math.cos(a) * dd, P.y + Math.sin(a) * dd, P.R * rrange(0.25, 0.55), 1.5));
    }
  }
  return out;
}

// how wooded an island's interior is, by its character
function isleForest(flavor, tx, ty) {
  const n = fbm(tx * 0.07 + 300, ty * 0.07 + 120);
  switch (flavor) {
    case 'jungle': return clamp(0.4 + (n - 0.35) * 1.6, 0, 1);
    case 'meadow': return clamp((n - 0.52) * 2.4, 0, 1);
    case 'scrub': return clamp((n - 0.6) * 2, 0, 1) * 0.8;
    case 'rocky': return clamp((n - 0.55) * 2, 0, 1) * 0.7;
    case 'cycad': return clamp((n - 0.45) * 2, 0, 1) * 0.85;
    default: return clamp((n - 0.38) * 2.2, 0, 1);   // grove, pine
  }
}

// how many stands of trees (cover from the sky) the prey islands get
const COPSES = { takurei: 6, kalimbra: 3, halune: 4, ekkalia: 4, varossa: 4, ilmeth: 4 };
function genArchipelago() {
  const W = World;
  W.ocean = true;
  W.isles = [];
  // ---- the islands' shapes ----
  for (let k = 0; k < ISLE_PLAN.length; k++) {
    const P = ISLE_PLAN[k];
    W.isles.push({ key: P.key, name: P.name, idx: k + 1, flavor: P.flavor, blobs: isleBlobs(P), x: P.x * TILE, y: P.y * TILE });
  }
  // ---- one signed distance-to-coast field over the whole sea ----
  const S = new Float32Array(WT * HT).fill(-99);
  const OWN = new Uint8Array(WT * HT);
  for (const isle of W.isles) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const b of isle.blobs) {
      const ext = b.rmax + ARCHI_SHELF + 3;
      const bx0 = Math.max(0, Math.floor(b.x - ext)), bx1 = Math.min(WT - 1, Math.ceil(b.x + ext));
      const by0 = Math.max(0, Math.floor(b.y - ext)), by1 = Math.min(HT - 1, Math.ceil(b.y + ext));
      x0 = Math.min(x0, b.x - b.rmax); x1 = Math.max(x1, b.x + b.rmax);
      y0 = Math.min(y0, b.y - b.rmax); y1 = Math.max(y1, b.y + b.rmax);
      for (let ty = by0; ty <= by1; ty++) {
        for (let tx = bx0; tx <= bx1; tx++) {
          const dx = tx + 0.5 - b.x, dy = ty + 0.5 - b.y;
          const d = Math.hypot(dx, dy);
          if (d > ext) continue;
          const s = blobR(b, Math.atan2(dy, dx)) - d;
          const i = ty * WT + tx;
          if (s > S[i]) { S[i] = s; OWN[i] = isle.idx; }
        }
      }
    }
    isle.bb = { x0: Math.max(1, Math.floor(x0)), y0: Math.max(1, Math.floor(y0)), x1: Math.min(WT - 2, Math.ceil(x1)), y1: Math.min(HT - 2, Math.ceil(y1)) };
  }
  W.isleMap = OWN;
  // ---- terrain from the field ----
  const flavorOf = [null].concat(W.isles.map(i => i.flavor));
  for (let ty = 0; ty < HT; ty++) {
    for (let tx = 0; tx < WT; tx++) {
      const i = ty * WT + tx, s = S[i];
      if (s > ARCHI_BEACH) {
        const fl = flavorOf[OWN[i]];
        const ff = isleForest(fl, tx, ty) * clamp((s - ARCHI_BEACH) / 5, 0, 1);
        W.forest[i] = ff;
        // the scrub and the rocky isles open into sandy clearings inland
        const open = (fl === 'scrub' || fl === 'rocky') && fbm(tx * 0.09 + 77, ty * 0.09 + 31) > 0.64;
        W.ter[i] = open ? T_SAND : ff > 0.45 ? T_FOREST : T_GRASS;
      } else {
        W.forest[i] = 0;
        W.ter[i] = s > 0 ? T_SAND : s > -ARCHI_SHALLOW ? T_WATER : s > -ARCHI_SHELF ? T_DEEP : T_SWIM;
      }
    }
  }
  // the world's edge is always open ocean
  for (let k = 0; k < WT; k++) { W.ter[k] = W.ter[(HT - 1) * WT + k] = T_SWIM; W.ter[k * WT] = W.ter[k * WT + WT - 1] = T_SWIM; }
  W.isleS = S;
  // ---- fresh water: a pond or two in the bigger islands' hearts ----
  for (const isle of W.isles) {
    const P = ISLE_PLAN[isle.idx - 1];
    const ponds = P.R >= 44 ? 2 : P.R >= 30 ? 1 : 0;
    for (let k = 0, made = 0; k < 40 && made < ponds; k++) {
      const b = isle.blobs[Math.floor(rnd() * isle.blobs.length)];
      const a = rnd() * TAU, dd = rnd() * b.R * 0.5;
      const px = b.x + Math.cos(a) * dd, py = b.y + Math.sin(a) * dd;
      const i = tIdx(clamp(Math.floor(px), 0, WT - 1), clamp(Math.floor(py), 0, HT - 1));
      if (S[i] < 14 || dist(px, py, P.x, P.y) < 9) continue;   // well inland, and off the island's very centre (nests)
      addWaterBlob(px, py, rrange(3.2, 4.4), rnd() < 0.5);
      made++;
    }
  }
  // ---- a mud bath on EVERY island (hygiene: the only way to scrub clean),
  // inland, off the water, ringed with horsetails like everywhere else ----
  for (const isle of W.isles) {
    const P = ISLE_PLAN[isle.idx - 1];
    const tiny = P.R < 15 && P.shape === 'blob';
    const need = tiny ? 3.5 : 7;
    let best = null, bs = -1;
    for (let k = 0; k < 80; k++) {
      const b = isle.blobs[Math.floor(rnd() * isle.blobs.length)];
      const a = rnd() * TAU, dd = rnd() * b.R * 0.6;
      const tx = Math.floor(b.x + Math.cos(a) * dd), ty = Math.floor(b.y + Math.sin(a) * dd);
      if (tx < 2 || ty < 2 || tx >= WT - 2 || ty >= HT - 2) continue;
      const i = tIdx(tx, ty), t = W.ter[i];
      if (OWN[i] !== isle.idx || t === T_WATER || t === T_DEEP || t === T_SWIM || t === T_MUD) continue;
      if (S[i] > bs) { bs = S[i]; best = { x: tx + 0.5, y: ty + 0.5 }; }
      if (S[i] > need + 3) break;
    }
    if (best) addMudPool({ x: best.x, y: best.y, r: tiny ? 1.8 : rrange(2.6, 3.4) });
  }
  // ---- the nests: Ekrixinatosaurus hatches on Utoriana, Chenanisaurus on
  // Narapa, Kaiwhekea on the speck of Okiri (on its sand, by the sea) ----
  const nestOn = (key, ok) => {
    const b = W.isles.find(i => i.key === key).blobs[0];
    for (let r = 0; r < 30; r++) {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * TAU, x = (b.x + Math.cos(a) * r) * TILE, y = (b.y + Math.sin(a) * r) * TILE;
        if (ok(terAtPx(x, y))) return { x, y };
      }
    }
    return { x: b.x * TILE, y: b.y * TILE };
  };
  const dry = (t) => t === T_GRASS || t === T_FOREST;
  W.nests = {
    ekrix: nestOn('utoriana', dry),
    chenani: nestOn('narapa', dry),
    iani: nestOn('drevan', dry),
    kaiwhe: nestOn('okiri', (t) => t === T_SAND || dry(t)),
    ptero: nestOn('brekka', (t) => t === T_SAND || dry(t)),
    hatzego: nestOn('saruun', dry),
    magyaro: nestOn('takurei', dry),   // the dwarf titanosaurs' atoll
    tethys: nestOn('ekkalia', dry),
  };
  // ---- vegetation, island by island ----
  for (const isle of W.isles) {
    const bb = isle.bb, fl = isle.flavor;
    for (let ty = bb.y0; ty <= bb.y1; ty++) {
      for (let tx = bb.x0; tx <= bb.x1; tx++) {
        const i = tIdx(tx, ty), t = W.ter[i];
        if (OWN[i] !== isle.idx || t === T_WATER || t === T_DEEP || t === T_SWIM || t === T_MUD) continue;
        const px = tx * TILE + rrange(2, TILE - 2), py = ty * TILE + rrange(2, TILE - 2);
        if (nearAnyNest(px, py, 70)) continue;
        const ff = W.forest[i], r = rnd();
        if (t === T_SAND) {
          // beaches and sandy clearings: driftwood, stones, the odd cycad
          if (r < 0.006) W.props.push({ kind: 'log', x: px, y: py, s: rrange(0.7, 1.2), flip: rnd() < 0.5 ? 1 : -1 });
          else if (r < 0.012) W.rocks.push({ x: px, y: py, s: rrange(0.6, 1.4) });
          else if (r < 0.016 && S[i] > 1) W.trees.push({ x: px, y: py, s: rrange(0.9, 1.4), kind: 4, v: 0 });
          continue;
        }
        if (ff > 0.45 && r < 0.06 + 0.12 * clamp((ff - 0.5) * 2.4, 0, 1)) {
          const kr = rnd(), vr = rnd();
          let kind, v;
          if (fl === 'jungle') { kind = kr < 0.22 ? 0 : kr < 0.84 ? 1 : 3; v = kind === 1 && vr > 0.85 ? 4 : 3; }
          else if (fl === 'pine') { kind = kr < 0.75 ? 0 : 1; v = vr < 0.5 ? 0 : 1; }
          else if (fl === 'cycad') { kind = kr < 0.6 ? 4 : 1; v = vr < 0.5 ? 0 : 3; }
          else { kind = kr < 0.3 ? 0 : 1; v = kind === 1 && vr > 0.9 ? 2 : vr < 0.5 ? 0 : 1; }
          W.trees.push({ x: px, y: py, s: rrange(0.7, 1.5), kind, v });
        } else if (t === T_GRASS && ff < 0.3 && r < 0.004) {
          W.trees.push({ x: px, y: py, s: rrange(0.9, 1.5), kind: fl === 'cycad' || fl === 'scrub' ? 4 : 3, v: 0 });
        } else if (fl === 'rocky' && r < 0.02) {
          W.rocks.push({ x: px, y: py, s: rrange(0.8, 2.0) });
        } else if (ff > 0.42 && r > 0.88 && r < 0.95) {
          W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.85, 1.4) });
        } else if (r > 0.965) {
          W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
        } else if (ff < 0.45 && r < 0.03 + (fl === 'meadow' ? 0.05 : 0)) {
          W.props.push({ kind: 'tallgrass', x: px, y: py, s: rrange(0.9, 1.5) });
        }
      }
    }
    // COPSES: the prey islands keep little stands of trees close together,
    // cover from the sky (see treeCover): a wild Hatzegopteryx won't go in
    const nCopse = COPSES[isle.key] || 0;
    for (let c = 0, tries = 0; c < nCopse && tries < 300; tries++) {
      const cx = rrange(bb.x0, bb.x1) * TILE, cy = rrange(bb.y0, bb.y1) * TILE;
      const ci = tIdx(Math.floor(cx / TILE), Math.floor(cy / TILE));
      if (OWN[ci] !== isle.idx || (W.ter[ci] !== T_GRASS && W.ter[ci] !== T_FOREST) || nearAnyNest(cx, cy, 90)) continue;
      c++;
      const n = 6 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        const a = rnd() * TAU, rr = 8 + Math.sqrt(rnd()) * 24, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (isWaterPx(x, y) || isMudPx(x, y)) continue;
        W.trees.push({ x, y, s: rrange(0.85, 1.3), kind: rnd() < 0.4 ? 0 : 1, v: rnd() < 0.5 ? 0 : 1, copse: true });
      }
    }
    // horsetails along this island's waterline
    for (let k = 0; k < 70; k++) {
      const px = rrange(bb.x0, bb.x1) * TILE, py = rrange(bb.y0, bb.y1) * TILE;
      if (!isWaterPx(px, py) && nearWaterPx(px, py, 40)) W.horsetails.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
    }
  }
  // ---- the straits: where two islands come closest ----
  W.straits = [];
  for (const [ka, kb, guard] of STRAIT_PLAN) {
    const A = W.isles.find(i => i.key === ka), B = W.isles.find(i => i.key === kb);
    let best = null, bd = 1e9;
    const pts = (isle) => {
      const out = [];
      for (const b of isle.blobs) for (let i = 0; i < ISLE_N; i += 2) {
        const a = (i / ISLE_N) * TAU, x = b.x + Math.cos(a) * b.r[i], y = b.y + Math.sin(a) * b.r[i];
        if (S[tIdx(clamp(Math.floor(x), 0, WT - 1), clamp(Math.floor(y), 0, HT - 1))] < 1.5) out.push({ x, y });   // only the true outer coast
      }
      return out;
    };
    const pa = pts(A), pb = pts(B);
    for (const p of pa) for (const q of pb) { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < bd) { bd = d; best = [p, q]; } }
    if (!best) continue;
    const [p, q] = best;
    W.straits.push({ a: ka, b: kb, guard, x: (p.x + q.x) / 2 * TILE, y: (p.y + q.y) / 2 * TILE, gap: bd * TILE, ang: Math.atan2(q.y - p.y, q.x - p.x) });
  }
  W.isleLinks = isleLinks(S);
}
// ---- the small waterways: island pairs close enough that a land animal
// can wade and paddle across WITHOUT meeting swimmer's depth. Island NPCs
// cross these to join their own kind on the far side (see isleMigration).
// Each link keeps its crossing: a launch point on one coast, a landing on
// the other (tiles).
const LINK_MAX_GAP = 60;   // tiles: nothing wider counts as a waterway
function isleLinks(S) {
  const W = World, out = [];
  const coast = W.isles.map(isle => {
    const pts = [];
    for (const b of isle.blobs) for (let i = 0; i < ISLE_N; i += 2) {
      const a = (i / ISLE_N) * TAU, x = b.x + Math.cos(a) * b.r[i], y = b.y + Math.sin(a) * b.r[i];
      if (S[tIdx(clamp(Math.floor(x), 0, WT - 1), clamp(Math.floor(y), 0, HT - 1))] < 1.5) pts.push({ x, y });
    }
    return pts;
  });
  for (let i = 0; i < W.isles.length; i++) {
    for (let j = i + 1; j < W.isles.length; j++) {
      const A = W.isles[i].bb, B = W.isles[j].bb;
      const gx = Math.max(0, A.x0 - B.x1, B.x0 - A.x1), gy = Math.max(0, A.y0 - B.y1, B.y0 - A.y1);
      if (Math.hypot(gx, gy) > LINK_MAX_GAP) continue;
      let best = null, bd = 1e9;
      for (const p of coast[i]) for (const q of coast[j]) {
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < bd) { bd = d; best = [p, q]; }
      }
      if (!best || bd > LINK_MAX_GAP) continue;
      // wadeable all the way? (no swimmer's depth on the line between)
      const [p, q] = best;
      let open = true;
      for (let k = 1; k < 40 && open; k++) {
        const x = lerp(p.x, q.x, k / 40), y = lerp(p.y, q.y, k / 40);
        if (W.ter[tIdx(clamp(Math.floor(x), 0, WT - 1), clamp(Math.floor(y), 0, HT - 1))] === T_SWIM) open = false;
      }
      if (!open) continue;
      out.push({ a: W.isles[i].key, b: W.isles[j].key, pa: { x: p.x * TILE, y: p.y * TILE }, pb: { x: q.x * TILE, y: q.y * TILE }, gap: bd });
    }
  }
  return out;
}

// ---------- island lookups ----------
function isleAtPx(x, y) {
  const W = World;
  if (!W.isleMap) return null;
  const k = W.isleMap[tIdx(clamp(Math.floor(x / TILE), 0, WT - 1), clamp(Math.floor(y / TILE), 0, HT - 1))];
  return k ? W.isles[k - 1] : null;
}
function isleByKey(key) { return (World.isles || []).find(i => i.key === key) || null; }
// a random spot of dry land on one island; biome 'forest' prefers the woods,
// 'plains' the open ground (either falls back to any dry land)
function randIslePos(key, biome) {
  const isle = isleByKey(key);
  if (!isle) return randPlainsPos();
  const bb = isle.bb;
  let any = null;
  for (let k = 0; k < 120; k++) {
    const x = rrange(bb.x0, bb.x1) * TILE, y = rrange(bb.y0, bb.y1) * TILE;
    if (World.isleMap[tIdx(Math.floor(x / TILE), Math.floor(y / TILE))] !== isle.idx) continue;
    if (isWaterPx(x, y) || isMudPx(x, y) || nearAnyNest(x, y, 260)) continue;
    if (!any) any = { x, y };
    const ff = forestShadePx(x, y);
    if (biome === 'forest' ? ff > 0.35 : biome === 'plains' ? ff < 0.3 : true) return { x, y };
  }
  return any || { x: isle.x, y: isle.y };
}
// open sea somewhere (fish and the like): anywhere on the deep shelf or in
// swimmer's depth, kept off the map's very edge
function randOceanPos() {
  for (let k = 0; k < 60; k++) {
    const x = rrange(0.04, 0.96) * WORLD_W, y = rrange(0.04, 0.96) * WORLD_H;
    if (isDeepPx(x, y)) return { x, y };
  }
  return { x: WORLD_W * 0.5, y: WORLD_H * 0.5 };
}

// ---------- the shores, painted ----------
// One smooth outline per blob at each depth step, from the outer shelf in to
// the sand; every blob's step is drawn before the next step starts, so the
// blobs of an island merge into one coast. Then the land is repainted over
// the beach, clipped to the coastline, so the tiles never show their edges.
function blobPath(ctx, b, grow) {
  const pts = [];
  for (let i = 0; i < ISLE_N; i++) {
    const a = (i / ISLE_N) * TAU, r = Math.max(0.4, b.r[i] + grow) * TILE;
    pts.push(b.x * TILE + Math.cos(a) * r, b.y * TILE + Math.sin(a) * r);
  }
  const n = ISLE_N;
  ctx.moveTo((pts[0] + pts[2 * n - 2]) / 2, (pts[1] + pts[2 * n - 1]) / 2);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    ctx.quadraticCurveTo(pts[2 * i], pts[2 * i + 1], (pts[2 * i] + pts[2 * j]) / 2, (pts[2 * i + 1] + pts[2 * j + 1]) / 2);
  }
  ctx.closePath();
}
function drawIsleShores(ctx, rx, ry, rw, rh, paintTile) {
  const m = (ARCHI_SHELF + 5) * TILE;
  const bl = [];
  for (const isle of World.isles) for (const b of isle.blobs) {
    const bx = b.x * TILE, by = b.y * TILE, br = b.rmax * TILE + m;
    if (bx + br > rx && bx - br < rx + rw && by + br > ry && by - br < ry + rh) bl.push(b);
  }
  if (!bl.length) return;
  const bands = [
    [ARCHI_SHELF + 3, OCEAN_COLS.shelf], [ARCHI_SHELF, WATER_COLS.deep], [7, WATER_COLS.deep2],
    [ARCHI_SHALLOW, WATER_COLS.open], [1.3, WATER_COLS.shallow], [0.35, WATER_COLS.foam], [0, WATER_COLS.sand],
  ];
  for (const [g, col] of bands) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (const b of bl) blobPath(ctx, b, g);
    ctx.fill();
  }
  // wet sand: a darker line just inside the waterline
  ctx.strokeStyle = 'rgba(120,104,70,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const b of bl) blobPath(ctx, b, -0.2);
  ctx.stroke();
  // the land, back over the beach — clipped to the smooth coast
  ctx.save();
  ctx.beginPath();
  for (const b of bl) blobPath(ctx, b, -ARCHI_BEACH);
  ctx.clip();
  const tx0 = clamp(Math.floor(rx / TILE) - 1, 0, WT - 1), ty0 = clamp(Math.floor(ry / TILE) - 1, 0, HT - 1);
  const tx1 = clamp(Math.ceil((rx + rw) / TILE) + 1, 0, WT - 1), ty1 = clamp(Math.ceil((ry + rh) / TILE) + 1, 0, HT - 1);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = World.ter[tIdx(tx, ty)];
      if (t === T_WATER || t === T_DEEP || t === T_SWIM) continue;
      paintTile(tx, ty);
    }
  }
  ctx.restore();
}

// ---------- landfall: the island's name as you walk up its beach ----------
function updateIsleLandfall(p) {
  if (!World.ocean || !p || !p.alive) return;
  if (isWaterPx(p.x, p.y)) return;
  const isle = isleAtPx(p.x, p.y);
  if (!isle || isle.key === p.isle) return;
  const first = p.isle == null;
  p.isle = isle.key;
  if (!first) G.banner = { str: '⛰ ' + isle.name, t: 3.5, color: '#bfe8ff' };   // (silent on the island you hatch on)
}
