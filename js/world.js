'use strict';
// ---------- world: painterly tile map, prerendered in cached chunks ----------
// The map SIZE is per-ecosystem (ECOS[eco].size, default 120 tiles square) —
// the Lertentous Delta runs at 240. Everything below reads these lets at call
// time, so genWorld can resize the world between ecosystems.
const TILE = 24;
let WT = 120, HT = 120;                   // tiles (per-eco, set by genWorld)
let WORLD_W = WT * TILE, WORLD_H = HT * TILE;

// terrain ids
const T_GRASS = 0, T_FOREST = 1, T_SAND = 2, T_WATER = 3, T_DEEP = 4, T_MUD = 5, T_LAVA = 6;
// the Nivalotitan Wall adds rock walls (the climbing maze) and frozen ponds
const T_CLIFF = 7, T_ICE = 8;

const TGRID = 96;   // tree-collision grid cell size (px)
const World = {
  eco: 'valley',                       // 'valley' (Fern Valley) | 'prairie' (Skull Prairie)
  ter: new Uint8Array(WT * HT),
  forest: new Float32Array(WT * HT),   // 0..1 forest density
  ground: null,                        // prerendered canvas
  trees: [], rocks: [], ferns: [], horsetails: [],
  props: [],                           // bushes, logs, mushrooms, bones, tall grass…
  blockers: [],                        // extra collision circles from props
  trails: [],                          // worn animal paths baked into the ground
  waterTiles: [],
  mudPools: [],
  waterBlobs: [],                      // prairie ponds & swamp (px coords, smooth-rendered)
  lavaBlobs: [],                       // ashfall lava fields (px coords, glow-rendered)
  nests: {},
};
const FORD_TYS = [30, 62, 100];

// ============================================================================
// ECOSYSTEM REGISTRY — the game is built to keep growing: to add an ecosystem,
// register it here (name/seed/generator/lobby copy/unlock cost), give it a
// spawn table in ECO_SPAWNS (entities.js), and add its playables to PLAYER_DEF
// + DINO + CARD_INFO. Tabs, cards, unlocking and spawning all read these
// registries — no other code needs to change.
// ============================================================================
const ECOS = {
  valley: {
    name: 'Fern Valley', emoji: '🌿', sub: 'forest · river · plains',
    seed: 20260704, cost: 0,
    gen: () => genValley(),
  },
  prairie: {
    name: 'Skull Prairie', emoji: '🦴', sub: 'bones · ponds · swamp',
    seed: 20260705, cost: 100,          // unlocked by any Full Adult, then paid once
    gen: () => genPrairie(),
  },
  coast: {
    name: 'Coastal Scrubs', emoji: '🌊', sub: 'scrubland · lake · the beach',
    seed: 20260706, cost: 250,
    gen: () => genCoast(),
  },
  ash: {
    name: 'Ashfall Ridge', emoji: '🌋', sub: 'lava · hot springs · eruptions',
    seed: 20260707, cost: 500,
    gen: () => genAsh(),
  },
  delta: {
    name: 'Lertentous Delta', emoji: '🐟', sub: 'rainforest · a hundred islands · the drowned south',
    seed: 20260711, cost: 1000, size: 256,   // the engine's maximum — tile packing caps at 256
    gen: () => genDelta(),
  },
  wall: {
    name: 'The Nivalotitan Wall', emoji: '🏔️', sub: 'the climbing maze · giant pines · the frozen dark',
    seed: 20260718, cost: 2000, size: 256,   // the new endgame — biggest, coldest, deadliest
    gen: () => genWall(),
  },
};
// the river only ever occupies this x window (px) — used to cull river passes
const RIVER_X0 = 850, RIVER_X1 = 2240;
// one water palette for every ecosystem: river bands and pond blobs stay in sync
const WATER_COLS = { sand: '#c8b585', foam: '#9cbfb2', shallow: '#5b8fa3', open: '#4a7b90', deep2: '#40707f', deep: '#35616f' };

function waterTilePos(v) { return { x: (v & 255) * TILE + TILE / 2, y: (v >> 8) * TILE + TILE / 2 }; }

// worn animal trail between two landmarks (baked into the ground art)
function addTrail(x1, y1, x2, y2) {
  World.trails.push({
    x1, y1, x2, y2,
    mx: (x1 + x2) / 2 + rrange(-130, 130),
    my: (y1 + y2) / 2 + rrange(-130, 130),
  });
}

// carve a hygiene mud pool into the tiles and ring it with horsetails
function addMudPool(p) {
  const W = World;
  W.mudPools.push({ x: p.x * TILE, y: p.y * TILE, r: p.r * TILE });
  for (let ty = Math.floor(p.y - p.r - 1); ty <= p.y + p.r + 1; ty++) {
    for (let tx = Math.floor(p.x - p.r - 1); tx <= p.x + p.r + 1; tx++) {
      if (tx < 1 || ty < 1 || tx >= WT - 1 || ty >= HT - 1) continue;
      const d = Math.hypot(tx - p.x, ty - p.y) + (vnoise(tx * 0.5, ty * 0.5) - 0.5) * 1.6;
      const i = tIdx(tx, ty);
      if (d < p.r && W.ter[i] !== T_WATER && W.ter[i] !== T_DEEP) W.ter[i] = T_MUD;
    }
  }
  const n = 10 + Math.floor(rnd() * 6);
  for (let k = 0; k < n; k++) {
    const a = rnd() * TAU, rr = (p.r + rrange(0.6, 2.2)) * TILE;
    const hx = p.x * TILE + Math.cos(a) * rr, hy = p.y * TILE + Math.sin(a) * rr;
    if (!isWaterPx(hx, hy) && !isMudPx(hx, hy))
      W.horsetails.push({ x: hx, y: hy, food: 1, regrow: 0, s: rrange(0.8, 1.25) });
  }
}

// a smooth-rendered pond/sea blob, carved into the tiles; overlapping blobs
// merge into one waterline (the swamp and the coast are built from these)
function addWaterBlob(bx, by, br, deep) {
  const W = World;
  W.waterBlobs.push({ x: bx * TILE, y: by * TILE, r: br * TILE, deep });
  for (let ty = Math.max(1, Math.floor(by - br - 2)); ty <= Math.min(HT - 2, by + br + 2); ty++) {
    for (let tx = Math.max(1, Math.floor(bx - br - 2)); tx <= Math.min(WT - 2, bx + br + 2); tx++) {
      const d = Math.hypot(tx - bx, ty - by) + (vnoise(tx * 0.5, ty * 0.5) - 0.5) * 1.4;
      const i = tIdx(tx, ty);
      if (deep && d < br * 0.5) W.ter[i] = T_DEEP;
      else if (d < br) { if (W.ter[i] !== T_DEEP) W.ter[i] = T_WATER; }
      else if (d < br + 1.5 && W.ter[i] !== T_WATER && W.ter[i] !== T_DEEP) W.ter[i] = T_SAND;
    }
  }
}

// a glowing lava blob carved into the tiles (rendered like the ponds, but hot)
function addLavaBlob(bx, by, br) {
  const W = World;
  W.lavaBlobs.push({ x: bx * TILE, y: by * TILE, r: br * TILE });
  for (let ty = Math.max(1, Math.floor(by - br - 2)); ty <= Math.min(HT - 2, by + br + 2); ty++) {
    for (let tx = Math.max(1, Math.floor(bx - br - 2)); tx <= Math.min(WT - 2, bx + br + 2); tx++) {
      const d = Math.hypot(tx - bx, ty - by) + (vnoise(tx * 0.5, ty * 0.5) - 0.5) * 1.4;
      if (d < br) W.ter[tIdx(tx, ty)] = T_LAVA;
    }
  }
}

// scenic ferns + a log around every nest
function dressNests() {
  const W = World;
  for (const key in W.nests) {
    const n = W.nests[key];
    for (let k = 0; k < 3; k++) {
      const a = rnd() * TAU, rr = rrange(42, 64);
      const px = n.x + Math.cos(a) * rr, py = n.y + Math.sin(a) * rr;
      if (!isWaterPx(px, py)) W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.9, 1.2) });
    }
    W.props.push({ kind: 'log', x: n.x + rrange(-70, 70), y: n.y + rrange(45, 70), s: 1.1, flip: 1 });
  }
}

function tIdx(tx, ty) { return ty * WT + tx; }
function terAtPx(x, y) {
  const tx = clamp(Math.floor(x / TILE), 0, WT - 1);
  const ty = clamp(Math.floor(y / TILE), 0, HT - 1);
  return World.ter[tIdx(tx, ty)];
}
function isWaterPx(x, y) { const t = terAtPx(x, y); return t === T_WATER || t === T_DEEP; }
function isDeepPx(x, y) { return terAtPx(x, y) === T_DEEP; }
function isMudPx(x, y) { return terAtPx(x, y) === T_MUD; }
function isLavaPx(x, y) { return terAtPx(x, y) === T_LAVA; }
function isCliffPx(x, y) { return terAtPx(x, y) === T_CLIFF; }
// inside a Wall cave's wind shadow — the warmth (and the secret) live here
function caveAt(x, y) {
  for (const c of World.caves) if (dist(x, y, c.x, c.y) < c.r) return c;
  return null;
}
// direction of the nearest walkable ground off a rock wall (the climb-block hatch)
function offCliffDir(x, y) {
  for (let r = TILE; r <= TILE * 6; r += TILE) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU;
      if (!isCliffPx(x + Math.cos(a) * r, y + Math.sin(a) * r)) return a;
    }
  }
  return 0;
}
// direction of the nearest non-lava ground (npc escape hatch)
function coolDir(x, y) {
  for (let r = TILE; r <= TILE * 8; r += TILE) {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      if (!isLavaPx(x + Math.cos(a) * r, y + Math.sin(a) * r)) return a;
    }
  }
  return 0;
}
function forestShadePx(x, y) {
  const tx = clamp(Math.floor(x / TILE), 0, WT - 1);
  const ty = clamp(Math.floor(y / TILE), 0, HT - 1);
  return World.forest[tIdx(tx, ty)];
}
function nearWaterPx(x, y, range) {
  const r = range || 26;
  for (let a = 0; a < 8; a++) {
    const px = x + Math.cos(a / 8 * TAU) * r, py = y + Math.sin(a / 8 * TAU) * r;
    if (isWaterPx(px, py)) return true;
  }
  return isWaterPx(x, y);
}

function riverX(ty) {
  return 64 + Math.sin(ty * 0.055) * 10 + (fbm(3.3, ty * 0.13) - 0.5) * 12;
}
function riverW(ty) {
  let w = 3.1 + vnoise(9.7, ty * 0.11) * 1.8;
  w += 4.2 * Math.exp(-Math.pow(ty - 86, 2) / 90);   // pond bulge in the south
  return w;
}
function shoreWobT(ty) { return (fbm(4.2, ty * 0.31) - 0.5) * 1.2; }

function genWorld(eco) {
  World.eco = eco = eco || 'valley';
  srand(ECOS[eco].seed);
  const W = World;
  // per-eco world size: resize the tile arrays and the chunk grid to match
  const size = ECOS[eco].size || 120;
  if (size !== WT || W.ter.length !== size * size) {
    WT = HT = size;
    WORLD_W = WT * TILE; WORLD_H = HT * TILE;
    W.ter = new Uint8Array(WT * HT);
    W.forest = new Float32Array(WT * HT);
    NCHX = Math.ceil(WORLD_W / CHUNK); NCHY = Math.ceil(WORLD_H / CHUNK);
  }
  W.trees.length = 0; W.rocks.length = 0; W.ferns.length = 0; W.horsetails.length = 0;
  W.waterTiles.length = 0; W.mudPools.length = 0; W.waterBlobs.length = 0;
  W.props.length = 0; W.blockers.length = 0; W.trails.length = 0;
  W.lavaBlobs.length = 0;
  W.nests = {};
  W.burrows = [];       // protoceratops warrens (delta) — invadeable underground
  W.hasRiver = false;   // ecosystems with a river switch this on
  W.ashy = false;       // volcanic ecosystems tint the whole palette
  W.lush = false;       // rainforest ecosystems deepen every green
  W.snowy = false;      // the Wall whitens the land and hides it in mist
  W.caves = [];         // wind-shadow shelters (the Wall) — one hides the giant

  ECOS[eco].gen();
  dressNests();

  // --- collect water tiles (for shimmer / fish spawns / drink search) ---
  for (let ty = 0; ty < HT; ty++) for (let tx = 0; tx < WT; tx++) {
    const t = W.ter[tIdx(tx, ty)];
    if (t === T_WATER || t === T_DEEP) W.waterTiles.push(tx | (ty << 8));
  }

  // props that block movement
  for (const p of W.props) {
    if (p.kind === 'log') W.blockers.push({ x: p.x, y: p.y, r: 9 * p.s });
    else if (p.kind === 'waterrock') W.blockers.push({ x: p.x, y: p.y, r: 6 * p.s });
    else if (p.kind === 'ribcage') W.blockers.push({ x: p.x, y: p.y, r: 6 * p.s });
    else if (p.kind === 'skull') W.blockers.push({ x: p.x, y: p.y, r: 8 * p.s });
  }

  // spatial grid for tree collision — the rainforest holds thousands of
  // trunks, and every animal asks about all of them every frame
  W.treeGrid = new Map();
  for (const t of W.trees) {
    const k = ((t.x / TGRID) | 0) + ',' + ((t.y / TGRID) | 0);
    let cell = W.treeGrid.get(k);
    if (!cell) W.treeGrid.set(k, cell = []);
    cell.push(t);
  }

  buildPaintData();
  clearGroundCache();
}

function genValley() {
  const W = World;
  W.hasRiver = true;
  // --- terrain + forest density ---
  for (let ty = 0; ty < HT; ty++) {
    const rx = riverX(ty), rw = riverW(ty);
    for (let tx = 0; tx < WT; tx++) {
      const i = tIdx(tx, ty);
      const dRiver = Math.abs(tx - rx);
      // forest factor: strong west of the river, fading eastward (noisy boundary)
      let ff = clamp((rx - 6 - tx) / 26 + (fbm(tx * 0.11 + 9, ty * 0.11 + 4) - 0.5) * 0.7, 0, 1);
      ff *= 0.55 + 0.45 * fbm(tx * 0.07, ty * 0.07);
      // a couple of forest fingers east of the river near the south fern patch
      if (tx > rx && ty > 92) ff = Math.max(ff, 0.35 * clamp((HT - ty) / 20, 0, 1) * fbm(tx * 0.1, ty * 0.1));
      W.forest[i] = ff;
      // shallow fords let animals wade across the river
      const ford = FORD_TYS.some(f => Math.abs(ty - f) < 2.5);
      if (dRiver < rw - 1.9 && !ford) W.ter[i] = T_DEEP;
      else if (dRiver < rw) W.ter[i] = T_WATER;
      else if (dRiver < rw + 1.7) W.ter[i] = T_SAND;
      else W.ter[i] = ff > 0.42 ? T_FOREST : T_GRASS;
    }
  }

  // --- mud pools (fringed with horsetails, near the forest / river) ---
  const pools = [{ x: 40, y: 52, r: 3.6 }, { x: 38, y: 78, r: 4.2 }, { x: 44, y: 22, r: 3.2 }, { x: 82, y: 98, r: 3.4 }];
  for (const p of pools) addMudPool(p);

  // --- nests ---
  W.nests.raja = { x: 24 * TILE, y: 36 * TILE };
  W.nests.campto = { x: 92 * TILE, y: 60 * TILE };

  // --- vegetation & rocks ---
  for (let ty = 1; ty < HT - 1; ty++) {
    for (let tx = 1; tx < WT - 1; tx++) {
      const i = tIdx(tx, ty), t = W.ter[i];
      if (t === T_WATER || t === T_DEEP || t === T_MUD) continue;
      const px = tx * TILE + rrange(2, TILE - 2), py = ty * TILE + rrange(2, TILE - 2);
      const nestClear = nearAnyNest(px, py, 70);
      const ff = W.forest[i];
      const r = rnd();
      // trees gather into groves with clearings between them
      const grove = clamp((fbm(tx * 0.13 + 7, ty * 0.13 + 3) - 0.45) * 2.6, 0, 1);
      if (!nestClear && ff > 0.48 && r < 0.02 + 0.13 * grove) {
        const kr = rnd(), vr = rnd();
        const kind = kr < 0.5 ? 0 : kr < 0.93 ? 1 : 2;
        // flowering trees are rare and only ever the broadleaf kind
        const v = kind === 1 && vr > 0.92 ? 2 : vr < 0.5 ? 0 : 1;
        W.trees.push({ x: px, y: py, s: rrange(0.65, 1.5), kind, v });
      } else if (!nestClear && t === T_GRASS && r < 0.0042) {
        const kind = rnd() < 0.6 ? 1 : 3, vr = rnd();
        const v = kind === 1 && vr > 0.9 ? 2 : vr < 0.5 ? 0 : 1;
        W.trees.push({ x: px, y: py, s: rrange(0.9, 1.3), kind, v });
      } else if (ff > 0.42 && r > 0.9 && r < 0.945) {
        W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
      } else if (t === T_SAND && r > 0.96) {
        W.horsetails.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.7, 1.1) });
      } else if (!nestClear && r > 0.994) {
        W.rocks.push({ x: px, y: py, s: rrange(0.7, 1.6) });
      } else if (!nestClear) {
        // undergrowth & set dressing
        const r2 = rnd();
        if (ff > 0.45 && r2 < 0.008) W.props.push({ kind: 'bush', x: px, y: py, s: rrange(0.8, 1.3), v: 0 });
        else if (ff > 0.45 && r2 < 0.012) W.props.push({ kind: 'log', x: px, y: py, s: rrange(0.8, 1.2), flip: rnd() < 0.5 ? 1 : -1 });
        else if (ff > 0.5 && r2 < 0.016) W.props.push({ kind: 'mushroom', x: px, y: py, s: rrange(0.8, 1.2) });
        else if (t === T_GRASS && ff < 0.3 && r2 < 0.011) W.props.push({ kind: 'tallgrass', x: px, y: py, s: rrange(0.8, 1.3) });
        else if (t === T_GRASS && ff < 0.3 && r2 > 0.9985) W.props.push({ kind: 'ribcage', x: px, y: py, s: rrange(0.9, 1.4), flip: rnd() < 0.5 ? 1 : -1 });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.995) W.props.push({ kind: 'bush', x: px, y: py, s: rrange(0.7, 1.1), v: 1 });
        else if (t === T_WATER && r2 > 0.994) W.props.push({ kind: 'waterrock', x: px, y: py, s: rrange(0.8, 1.4) });
      }
    }
  }

  // worn animal trails between landmarks (baked into the ground art)
  const fordPx = (fty) => ({ x: riverX(fty) * TILE, y: fty * TILE });
  addTrail(W.nests.raja.x, W.nests.raja.y, W.mudPools[0].x, W.mudPools[0].y);
  addTrail(W.mudPools[0].x, W.mudPools[0].y, fordPx(62).x, fordPx(62).y);
  addTrail(W.nests.campto.x, W.nests.campto.y, fordPx(62).x, fordPx(62).y);
  addTrail(W.nests.campto.x, W.nests.campto.y, W.mudPools[3].x, W.mudPools[3].y);
  addTrail(W.mudPools[2].x, W.mudPools[2].y, fordPx(30).x, fordPx(30).y);

  // a couple of fern patches east of the river (Camptosaurus refuge, south)
  for (let k = 0; k < 26; k++) {
    const px = rrange(70, 100) * TILE, py = rrange(96, 116) * TILE;
    if (!isWaterPx(px, py) && !isMudPx(px, py)) W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
  }
}

function nearAnyNest(px, py, r) {
  for (const k in World.nests) {
    if (dist(px, py, World.nests[k].x, World.nests[k].y) < r) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// SKULL PRAIRIE — the unlockable second ecosystem. Wide golden grassland
// strewn with old bones; ponds with deep hearts, dense tree rings around the
// mud baths, and a reedy swamp across the whole south where the gar swim.
// ---------------------------------------------------------------------------
function genPrairie() {
  const W = World;
  // nests first so water and vegetation keep clear of them
  W.nests = {
    ichthyo: { x: 57 * TILE, y: 100 * TILE },   // swamp edge, deep south
    qianzho: { x: 26 * TILE, y: 15 * TILE },    // open north-west
    scutello: { x: 86 * TILE, y: 60 * TILE },   // beside the eastern mud grove
  };

  const ponds = [
    { x: 30, y: 24, r: 4.6 }, { x: 78, y: 16, r: 3.4 }, { x: 98, y: 46, r: 4.2 },
    { x: 16, y: 62, r: 3.2 }, { x: 57, y: 44, r: 5.4 }, { x: 90, y: 84, r: 3.8 },
  ];
  // hygiene mud: 4 grove pools on the plain + 3 swampy wallows in the south
  const muds = [
    { x: 42, y: 60, r: 4.4 }, { x: 68, y: 30, r: 3.6 }, { x: 20, y: 40, r: 3.2 }, { x: 88, y: 66, r: 3.4 },
    { x: 30, y: 104, r: 3.4 }, { x: 74, y: 108, r: 3.0 }, { x: 96, y: 102, r: 2.8 },
  ];

  // --- base terrain: open prairie; trees only in copses, mud rings, swamp hummocks ---
  for (let ty = 0; ty < HT; ty++) {
    for (let tx = 0; tx < WT; tx++) {
      const i = tIdx(tx, ty);
      // sparse noise copses
      let ff = clamp((fbm(tx * 0.09 + 33, ty * 0.09 + 12) - 0.60) * 1.8, 0, 1) * 0.55;
      // the mud baths grow thick tree rings — shady refuges on an open map
      for (const m of muds) {
        const dd = Math.hypot(tx - m.x, ty - m.y);
        ff = Math.max(ff, clamp(1.25 - dd / (m.r + 9), 0, 1) * 0.95);
      }
      // swampy south: wet ground sprouts reed-tree hummocks
      if (ty > 96) ff = Math.max(ff, 0.55 * clamp((ty - 96) / 8, 0, 1) * fbm(tx * 0.14, ty * 0.14 + 7));
      W.forest[i] = ff;
      W.ter[i] = ff > 0.45 ? T_FOREST : T_GRASS;
    }
  }

  // --- ponds & the southern swamp, applied to tiles + kept as smooth blobs ---
  for (const p of ponds) addWaterBlob(p.x, p.y, p.r, p.r >= 4);   // big ponds have deep hearts
  addWaterBlob(63, 104, 4.5, true);   // the nursery pool: guaranteed water by the swamp nest
  for (let k = 0; k < 26; k++) {
    const bx = rrange(8, 112), by = rrange(100, 116), br = rrange(1.7, 4.3);
    if (Math.hypot(bx - 57, by - 100) < 6.5) continue;            // keep the swamp nest dry
    if (muds.some(m => m.y > 96 && Math.hypot(bx - m.x, by - m.y) < m.r + 2)) continue;
    addWaterBlob(bx, by, br, br > 2.4 && rnd() < 0.5);
  }

  // --- mud pools (fringed with horsetails) ---
  for (const p of muds) addMudPool(p);

  // --- vegetation, bones & set dressing ---
  for (let ty = 1; ty < HT - 1; ty++) {
    for (let tx = 1; tx < WT - 1; tx++) {
      const i = tIdx(tx, ty), t = W.ter[i];
      if (t === T_WATER || t === T_DEEP || t === T_MUD) continue;
      const px = tx * TILE + rrange(2, TILE - 2), py = ty * TILE + rrange(2, TILE - 2);
      const nestClear = nearAnyNest(px, py, 70);
      const ff = W.forest[i];
      const r = rnd();
      const grove = clamp((fbm(tx * 0.13 + 7, ty * 0.13 + 3) - 0.45) * 2.6, 0, 1);
      if (!nestClear && ff > 0.5 && r < 0.03 + 0.16 * grove + 0.07 * clamp((ff - 0.55) * 3, 0, 1)) {
        const kr = rnd(), vr = rnd();
        const kind = kr < 0.45 ? 0 : kr < 0.88 ? 1 : 3;    // groves: conifer/araucaria + cycads
        const v = kind === 1 && vr > 0.92 ? 2 : vr < 0.5 ? 0 : 1;
        W.trees.push({ x: px, y: py, s: rrange(0.65, 1.5), kind, v });
      } else if (!nestClear && t === T_GRASS && ff < 0.3 && r < 0.0018) {
        // lone prairie trees: mostly cycads and dead snags
        const kind = rnd() < 0.55 ? 3 : 2;
        W.trees.push({ x: px, y: py, s: rrange(0.85, 1.3), kind, v: rnd() < 0.5 ? 0 : 1 });
      } else if (ff > 0.42 && r > 0.9 && r < 0.952) {
        W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
      } else if (t === T_SAND && r > 0.93) {
        W.horsetails.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.7, 1.15) });
      } else if (ty > 97 && t === T_GRASS && r > 0.88 && r < 0.915) {
        W.horsetails.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.2) });   // swamp reeds
      } else if (!nestClear && r > 0.9955) {
        W.rocks.push({ x: px, y: py, s: rrange(0.7, 1.6) });
      } else if (!nestClear) {
        const r2 = rnd();
        if (ff > 0.45 && r2 < 0.008) W.props.push({ kind: 'bush', x: px, y: py, s: rrange(0.8, 1.3), v: 0 });
        else if (ff > 0.45 && r2 < 0.012) W.props.push({ kind: 'log', x: px, y: py, s: rrange(0.8, 1.2), flip: rnd() < 0.5 ? 1 : -1 });
        else if (ff > 0.5 && r2 < 0.016) W.props.push({ kind: 'mushroom', x: px, y: py, s: rrange(0.8, 1.2) });
        else if (t === T_GRASS && ff < 0.3 && r2 < 0.034) W.props.push({ kind: 'tallgrass', x: px, y: py, s: rrange(0.8, 1.4) });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.9975) W.props.push({ kind: 'ribcage', x: px, y: py, s: rrange(0.9, 1.5), flip: rnd() < 0.5 ? 1 : -1 });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.9942 && r2 < 0.9952) W.props.push({ kind: 'skull', x: px, y: py, s: rrange(0.9, 1.4), flip: rnd() < 0.5 ? 1 : -1 });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.995 && r2 < 0.9958) W.props.push({ kind: 'bush', x: px, y: py, s: rrange(0.7, 1.1), v: 1 });
        else if (t === T_WATER && r2 > 0.9965) W.props.push({ kind: 'waterrock', x: px, y: py, s: rrange(0.8, 1.4) });
      }
    }
  }

  // worn trails between the prairie landmarks
  addTrail(W.nests.qianzho.x, W.nests.qianzho.y, ponds[0].x * TILE, ponds[0].y * TILE);
  addTrail(W.nests.scutello.x, W.nests.scutello.y, muds[3].x * TILE, muds[3].y * TILE);
  addTrail(muds[0].x * TILE, muds[0].y * TILE, ponds[4].x * TILE, ponds[4].y * TILE);
  addTrail(ponds[4].x * TILE, ponds[4].y * TILE, W.nests.ichthyo.x, W.nests.ichthyo.y);
  addTrail(muds[1].x * TILE, muds[1].y * TILE, ponds[1].x * TILE, ponds[1].y * TILE);
}

// ---------------------------------------------------------------------------
// COASTAL SCRUBS — a sea of waving grass rolling down to a real sea. The only
// water is the lake left of centre and the surf along the eastern beach —
// every drink is a walk, and something big lurks in the shallows. One lone
// mud wallow, ringed by the map's only real shade.
// ---------------------------------------------------------------------------
function genCoast() {
  const W = World;
  W.nests = {
    metria: { x: 74 * TILE, y: 34 * TILE },    // open grass, the ugrunaaluk meadows
    giganto: { x: 28 * TILE, y: 96 * TILE },   // quiet south-west, a walk from the wallow
    crista: { x: 94 * TILE, y: 22 * TILE },    // the north shore — croc country
  };
  const mud = { x: 26, y: 80, r: 4.2 };        // the ONE mud pool

  // --- base terrain: grass, grass, grass; a few scrub copses + the mud ring ---
  for (let ty = 0; ty < HT; ty++) {
    for (let tx = 0; tx < WT; tx++) {
      const i = tIdx(tx, ty);
      let ff = clamp((fbm(tx * 0.09 + 53, ty * 0.09 + 22) - 0.66) * 1.6, 0, 1) * 0.5;
      const dd = Math.hypot(tx - mud.x, ty - mud.y);
      ff = Math.max(ff, clamp(1.25 - dd / (mud.r + 9), 0, 1) * 0.95);   // shade ring on the wallow
      W.forest[i] = ff;
      W.ter[i] = ff > 0.45 ? T_FOREST : T_GRASS;
    }
  }

  // --- the lake, left of centre (deep-hearted; the inland water source) ---
  addWaterBlob(40, 52, 6.2, true);
  addWaterBlob(45, 58, 4.6, true);
  addWaterBlob(36, 59, 3.6, false);

  // --- the beach: overlapping deep blobs merge into one surf line east ---
  for (let by = -2; by <= HT + 2; by += 4) {
    const bx = 114.5 + Math.sin(by * 0.12) * 2.2 + (fbm(by * 0.3, 7) - 0.5) * 3;
    addWaterBlob(bx, by, rrange(6.5, 8.5), true);
  }
  for (let ty = 0; ty < HT; ty++) W.ter[tIdx(WT - 1, ty)] = T_DEEP;   // open sea past the blobs

  addMudPool(mud);

  // --- vegetation: tall scrub grass everywhere, driftwood on the sand ---
  for (let ty = 1; ty < HT - 1; ty++) {
    for (let tx = 1; tx < WT - 1; tx++) {
      const i = tIdx(tx, ty), t = W.ter[i];
      if (t === T_WATER || t === T_DEEP || t === T_MUD) continue;
      const px = tx * TILE + rrange(2, TILE - 2), py = ty * TILE + rrange(2, TILE - 2);
      const nestClear = nearAnyNest(px, py, 70);
      const ff = W.forest[i];
      const r = rnd();
      const grove = clamp((fbm(tx * 0.13 + 7, ty * 0.13 + 3) - 0.45) * 2.6, 0, 1);
      if (!nestClear && ff > 0.5 && r < 0.03 + 0.14 * grove + 0.07 * clamp((ff - 0.55) * 3, 0, 1)) {
        const kr = rnd(), vr = rnd();
        const kind = kr < 0.35 ? 0 : kr < 0.7 ? 1 : 3;   // copses: conifer/araucaria/cycad
        const v = kind === 1 && vr > 0.92 ? 2 : vr < 0.5 ? 0 : 1;
        W.trees.push({ x: px, y: py, s: rrange(0.65, 1.5), kind, v });
      } else if (!nestClear && t === T_GRASS && ff < 0.3 && r < 0.0012) {
        // lone windswept scrub trees: cycads and dead snags
        W.trees.push({ x: px, y: py, s: rrange(0.85, 1.25), kind: rnd() < 0.55 ? 3 : 2, v: rnd() < 0.5 ? 0 : 1 });
      } else if (ff > 0.42 && r > 0.9 && r < 0.952) {
        W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
      } else if (t === T_SAND && r > 0.955) {
        W.horsetails.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.7, 1.15) });
      } else if (!nestClear && r > 0.9955) {
        W.rocks.push({ x: px, y: py, s: rrange(0.7, 1.6) });
      } else if (!nestClear) {
        const r2 = rnd();
        if (ff > 0.45 && r2 < 0.01) W.props.push({ kind: 'bush', x: px, y: py, s: rrange(0.8, 1.3), v: 0 });
        else if (ff > 0.45 && r2 < 0.014) W.props.push({ kind: 'log', x: px, y: py, s: rrange(0.8, 1.2), flip: rnd() < 0.5 ? 1 : -1 });
        else if (t === T_GRASS && ff < 0.3 && r2 < 0.06) W.props.push({ kind: 'tallgrass', x: px, y: py, s: rrange(0.85, 1.45) });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.986 && r2 < 0.994) W.props.push({ kind: 'bush', x: px, y: py, s: rrange(0.7, 1.1), v: 1 });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.9985) W.props.push({ kind: 'ribcage', x: px, y: py, s: rrange(0.9, 1.4), flip: rnd() < 0.5 ? 1 : -1 });
        else if (t === T_SAND && r2 > 0.992) W.props.push({ kind: 'log', x: px, y: py, s: rrange(0.8, 1.25), flip: rnd() < 0.5 ? 1 : -1 });   // driftwood
        else if (t === T_WATER && r2 > 0.997) W.props.push({ kind: 'waterrock', x: px, y: py, s: rrange(0.8, 1.4) });
      }
    }
  }

  // scattered forage so a grazer can actually live out here: fern clumps in
  // the open scrub + a reed fringe around the lake
  for (let k = 0; k < 34; k++) {
    const px = rrange(8, 100) * TILE, py = rrange(8, 112) * TILE;
    if (!isWaterPx(px, py) && !isMudPx(px, py)) W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.25) });
  }
  for (let k = 0; k < 24; k++) {
    const a = rnd() * TAU, rr = rrange(7.5, 10.5) * TILE;
    const px = 41 * TILE + Math.cos(a) * rr, py = 55 * TILE + Math.sin(a) * rr;
    if (!isWaterPx(px, py) && !isMudPx(px, py)) W.horsetails.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.2) });
  }

  // worn trails: nest → lake, nest → surf, wallow → lake
  addTrail(W.nests.metria.x, W.nests.metria.y, 45 * TILE, 55 * TILE);
  addTrail(W.nests.metria.x, W.nests.metria.y, 104 * TILE, 40 * TILE);
  addTrail(mud.x * TILE, mud.y * TILE, 38 * TILE, 58 * TILE);
}

// ---------------------------------------------------------------------------
// ASHFALL RIDGE — grey grass under a grumbling mountain. Lava fields spill
// down from the north-east (crossable, if you can take the burn), the only
// water steams out of a few hot springs, and every so often the sky itself
// starts throwing rocks. Dodge the rings.
// ---------------------------------------------------------------------------
function genAsh() {
  const W = World;
  W.ashy = true;
  W.nests = {
    linhe: { x: 22 * TILE, y: 34 * TILE },    // west, by the big spring
    nothro: { x: 72 * TILE, y: 102 * TILE },  // quiet south, near the green fringe
  };
  const springs = [
    { x: 28, y: 28, r: 3.6 }, { x: 16, y: 70, r: 4.2 },
    { x: 58, y: 62, r: 3.2 }, { x: 82, y: 88, r: 3.8 },
  ];
  const muds = [{ x: 40, y: 84, r: 3.6 }, { x: 62, y: 26, r: 3.0 }];

  // --- base terrain: ash grass; groves only ring the springs and the muds ---
  for (let ty = 0; ty < HT; ty++) {
    for (let tx = 0; tx < WT; tx++) {
      const i = tIdx(tx, ty);
      let ff = clamp((fbm(tx * 0.09 + 71, ty * 0.09 + 44) - 0.68) * 1.5, 0, 1) * 0.4;
      for (const g of springs.concat(muds)) {
        const dd = Math.hypot(tx - g.x, ty - g.y);
        ff = Math.max(ff, clamp(1.2 - dd / (g.r + 8), 0, 1) * 0.9);
      }
      // the south edge keeps a greener fringe — the herbivores' refuge
      if (ty > 104) ff = Math.max(ff, 0.4 * clamp((ty - 104) / 8, 0, 1) * fbm(tx * 0.12, ty * 0.12 + 3));
      W.forest[i] = ff;
      W.ter[i] = ff > 0.45 ? T_FOREST : T_GRASS;
    }
  }

  // --- hot springs: the ONLY water on the ridge ---
  for (const sp2 of springs) addWaterBlob(sp2.x, sp2.y, sp2.r, false);

  // --- the lava: a field high in the NE spilling into two tongues ---
  addLavaBlob(104, 12, 8.5);
  addLavaBlob(96, 20, 6.5);
  addLavaBlob(110, 24, 5.5);
  // tongue A: south-west, thinning as it runs
  for (const [bx, by, br] of [[88, 28, 4.4], [80, 34, 3.8], [73, 41, 3.2], [67, 48, 2.6]]) addLavaBlob(bx, by, br);
  // tongue B: due south along the eastern side
  for (const [bx, by, br] of [[104, 34, 4.2], [100, 44, 3.6], [97, 54, 3.0], [95, 63, 2.5]]) addLavaBlob(bx, by, br);
  // scattered vents
  addLavaBlob(34, 12, 3.2);
  addLavaBlob(52, 44, 2.4);
  addLavaBlob(20, 96, 2.6);

  for (const p of muds) addMudPool(p);

  // --- vegetation: charred snags on the ash, real green only near water ---
  for (let ty = 1; ty < HT - 1; ty++) {
    for (let tx = 1; tx < WT - 1; tx++) {
      const i = tIdx(tx, ty), t = W.ter[i];
      if (t === T_WATER || t === T_DEEP || t === T_MUD || t === T_LAVA) continue;
      const px = tx * TILE + rrange(2, TILE - 2), py = ty * TILE + rrange(2, TILE - 2);
      const nestClear = nearAnyNest(px, py, 70);
      const ff = W.forest[i];
      const r = rnd();
      if (!nestClear && ff > 0.5 && r < 0.03 + 0.13 * clamp((ff - 0.5) * 3, 0, 1)) {
        const kr = rnd(), vr = rnd();
        const kind = kr < 0.5 ? 0 : kr < 0.85 ? 1 : 3;   // spring groves stay green
        W.trees.push({ x: px, y: py, s: rrange(0.65, 1.4), kind, v: vr < 0.5 ? 0 : 1 });
      } else if (!nestClear && t === T_GRASS && ff < 0.3 && r < 0.003) {
        W.trees.push({ x: px, y: py, s: rrange(0.8, 1.3), kind: 2 });   // charred snags
      } else if (ff > 0.42 && r > 0.9 && r < 0.955) {
        W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
      } else if (t === T_SAND && r > 0.94) {
        W.horsetails.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.7, 1.15) });
      } else if (!nestClear && r > 0.992) {
        W.rocks.push({ x: px, y: py, s: rrange(0.8, 1.8) });   // a stony land
      } else if (!nestClear) {
        const r2 = rnd();
        if (ff > 0.45 && r2 < 0.01) W.props.push({ kind: 'bush', x: px, y: py, s: rrange(0.8, 1.2), v: 0 });
        else if (t === T_GRASS && ff < 0.3 && r2 < 0.02) W.props.push({ kind: 'tallgrass', x: px, y: py, s: rrange(0.7, 1.1) });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.9975) W.props.push({ kind: 'ribcage', x: px, y: py, s: rrange(0.9, 1.5), flip: rnd() < 0.5 ? 1 : -1 });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.9945 && r2 < 0.9955) W.props.push({ kind: 'skull', x: px, y: py, s: rrange(0.9, 1.3), flip: rnd() < 0.5 ? 1 : -1 });
      }
    }
  }

  // forage for the big herbivore: fern clumps along the greener south + west
  for (let k = 0; k < 30; k++) {
    const px = rrange(6, 90) * TILE, py = rrange(60, 114) * TILE;
    if (!isWaterPx(px, py) && !isMudPx(px, py) && !isLavaPx(px, py))
      W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.25) });
  }

  // worn trails between the springs — every living thing walks these
  addTrail(W.nests.linhe.x, W.nests.linhe.y, springs[0].x * TILE, springs[0].y * TILE);
  addTrail(springs[0].x * TILE, springs[0].y * TILE, springs[2].x * TILE, springs[2].y * TILE);
  addTrail(springs[2].x * TILE, springs[2].y * TILE, springs[3].x * TILE, springs[3].y * TILE);
  addTrail(W.nests.nothro.x, W.nests.nothro.y, springs[3].x * TILE, springs[3].y * TILE);
  addTrail(springs[1].x * TILE, springs[1].y * TILE, muds[0].x * TILE, muds[0].y * TILE);
}

// ---------------------------------------------------------------------------
// THE NIVALOTITAN WALL — a misty mountain the size of the delta, but built
// UP instead of out. Rock walls (T_CLIFF) break the snowfield into a climbing
// maze: non-climbers route the long way around, climbers cross them, and
// height off a wall feeds the pounce. The higher you go (north = the summit)
// the barer, colder and more walled it gets. Giant pines cloak the southern
// belt; frozen ponds are the only drink; caves are the only warmth — and one
// cave, hidden deep, holds the frozen giant the whole mountain is named for.
// ---------------------------------------------------------------------------
function genWall() {
  const W = World;
  W.snowy = true;
  // elevation: south (high ty) is the wooded lower slope, north (low ty) the
  // bare summit. The maze walls follow this field's contour lines.
  const elev = (tx, ty) => {
    const base = fbm(tx * 0.045 + 12, ty * 0.045 + 30);
    const detail = fbm(tx * 0.12 + 5, ty * 0.12 + 8);
    const north = 1 - ty / HT;                 // 0 at the south foot, 1 at the summit
    return base * 0.62 + detail * 0.24 + north * 0.4;
  };
  for (let ty = 0; ty < HT; ty++) {
    for (let tx = 0; tx < WT; tx++) {
      const i = tIdx(tx, ty);
      const el = elev(tx, ty);
      // pines belong to the lower southern belt, thinning as the air bites
      const belt = clamp((ty / HT - 0.28) * 1.7, 0, 1) * (1 - clamp((el - 0.6) * 3, 0, 1));
      const ff = belt * (0.35 + 0.6 * fbm(tx * 0.1 + 3, ty * 0.1 + 7));
      W.forest[i] = ff;
      // CLIFF WALLS: the contour bands of the elevation field, thin so passes
      // stay open, punched with gaps so nothing is ever fully sealed in.
      // Denser up high (the summit is the true maze); the border is solid rock.
      const contour = ((el * 7) % 1 + 1) % 1;
      const gap = fbm(tx * 0.33 + 40, ty * 0.33 + 20);
      const bandW = 0.09 + 0.05 * clamp((el - 0.4) * 2, 0, 1);   // walls thicken up high
      const edge = tx < 2 || ty < 2 || tx >= WT - 2 || ty >= HT - 2;
      if (edge || (el > 0.22 && contour < bandW && gap > 0.42)) W.ter[i] = T_CLIFF;
      else W.ter[i] = ff > 0.4 ? T_FOREST : T_GRASS;   // snow (a grass tile the snowy palette whitens)
    }
  }

  // a clear spawn bowl at the southern foot — never hatch inside a wall
  const sx = Math.floor(WT * 0.5), sy = Math.floor(HT * 0.8);
  W.nests.spawn = { x: sx * TILE, y: sy * TILE };
  W.nests.eshano = { x: sx * TILE, y: sy * TILE };            // hatches in the pine-belt bowl
  W.nests.jianchang = { x: (sx - 16) * TILE, y: (sy + 4) * TILE };   // its own corner of the belt
  W.nests.nanuq = { x: (sx + 22) * TILE, y: (sy - 14) * TILE };      // the king hatches higher up
  for (let ty = sy - 17; ty <= sy - 11; ty++) for (let tx = sx + 19; tx <= sx + 25; tx++) {
    if (tx > 0 && ty > 0 && tx < WT - 1 && ty < HT - 1 && W.ter[tIdx(tx, ty)] === T_CLIFF) W.ter[tIdx(tx, ty)] = T_GRASS;
  }
  // the little climber never hatches inside a wall either
  for (let ty = sy - 2; ty <= sy + 8; ty++) for (let tx = sx - 20; tx <= sx - 12; tx++) {
    if (tx > 0 && ty > 0 && tx < WT - 1 && ty < HT - 1 && W.ter[tIdx(tx, ty)] === T_CLIFF) W.ter[tIdx(tx, ty)] = T_GRASS;
  }
  for (let ty = sy - 7; ty <= sy + 7; ty++) {
    for (let tx = sx - 7; tx <= sx + 7; tx++) {
      if (tx < 1 || ty < 1 || tx >= WT - 1 || ty >= HT - 1) continue;
      if (Math.hypot(tx - sx, ty - sy) < 7) { const i = tIdx(tx, ty); if (W.ter[i] === T_CLIFF) W.ter[i] = T_GRASS; }
    }
  }

  // frozen ponds — the only drink on the mountain (rendered pale as ice)
  const ponds = [{ x: 48, y: 196, r: 3.4 }, { x: 176, y: 210, r: 3.8 }, { x: 118, y: 150, r: 3.0 }, { x: 82, y: 96, r: 2.6 }];
  for (const p of ponds) addWaterBlob(p.x, p.y, p.r, false);

  // caves: wind-shadow shelters tucked against the walls. The last one, buried
  // deep in the high north maze, is SECRET — it holds the frozen Nivalotitan.
  const caveSpots = [
    { x: 40, y: 168 }, { x: 150, y: 182 }, { x: 96, y: 128 }, { x: 200, y: 120 }, { x: 64, y: 92 },
  ];
  for (const c of caveSpots) {
    const cx = c.x * TILE, cy = c.y * TILE;
    W.caves.push({ x: cx, y: cy, r: 46, secret: false });
    W.props.push({ kind: 'cavemouth', x: cx, y: cy, s: rrange(1.1, 1.5), flip: rnd() < 0.5 ? 1 : -1 });
  }
  // the secret cave: high in the north, off in a maze pocket
  const gx = 210 * TILE, gy = 30 * TILE;
  W.caves.push({ x: gx, y: gy, r: 40, secret: true, found: false });
  W.nests.nivalo = { x: gx, y: gy };

  // giant pines + snow rocks, thickest in the southern belt
  for (let ty = 1; ty < HT - 1; ty++) {
    for (let tx = 1; tx < WT - 1; tx++) {
      const i = tIdx(tx, ty), t = W.ter[i];
      if (t === T_WATER || t === T_DEEP || t === T_CLIFF) continue;
      const px = tx * TILE + rrange(2, TILE - 2), py = ty * TILE + rrange(2, TILE - 2);
      const ff = W.forest[i];
      const r = rnd();
      if (ff > 0.42 && r < 0.05 + 0.16 * clamp((ff - 0.42) * 3, 0, 1)) {
        // giant pines: kind-0 conifers, but towering — the tallest trees around
        W.trees.push({ x: px, y: py, s: rrange(1.7, 2.9), kind: 0, v: rnd() < 0.5 ? 0 : 3 });
      } else if (ff > 0.25 && r > 0.9 && r < 0.93) {
        W.trees.push({ x: px, y: py, s: rrange(1.0, 1.7), kind: 0, v: rnd() < 0.5 ? 0 : 3 });   // scattered smaller firs
      } else if (r > 0.985) {
        W.rocks.push({ x: px, y: py, s: rrange(0.9, 2.2) });   // boulders & scree
      } else if (r > 0.978) {
        W.props.push({ kind: 'snowdrift', x: px, y: py, s: rrange(0.8, 1.6), flip: rnd() < 0.5 ? 1 : -1 });
      }
    }
  }

  // forage: hardy conifer browse (ferns stand in for evergreen shoots) in the belt
  for (let k = 0; k < 60; k++) {
    const px = rrange(6, WT - 6) * TILE, py = rrange(HT * 0.45, HT - 6) * TILE;
    if (!isWaterPx(px, py) && terAtPx(px, py) !== T_CLIFF)
      W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
  }
}

// ---------------------------------------------------------------------------
// LERTENTOUS DELTA — the biggest world in the game, four times the land of
// any other. One great trunk river pours in from the north, splits at the fan
// apex and braids into four distributary channels that wander south through
// grass islands and gallery forest, all of them emptying into a drowned sea
// along the whole southern edge. Sandbar fords cross every channel — deep
// water between them belongs to the fish. ALL of them.
// ---------------------------------------------------------------------------
function genDelta() {
  const W = World;
  W.lush = true;   // the delta is RAINFOREST — every green runs deeper here
  W.nests = {
    centro:  { x: 47 * TILE,  y: 36 * TILE },    // north-west jungle isle
    loki:    { x: 208 * TILE, y: 50 * TILE },    // north-east jungle isle
    spino:   { x: 141 * TILE, y: 55 * TILE },    // beside the fan apex — river country
    tyranno: { x: 68 * TILE,  y: 106 * TILE },   // the western hunting isle
    omni:    { x: 188 * TILE, y: 116 * TILE },   // an eastern mid-delta island
    eotrach: { x: 38 * TILE,  y: 168 * TILE },   // a quiet south-western island
    moro:    { x: 126 * TILE, y: 166 * TILE },   // the great mid-south island
    aardi:   { x: 75 * TILE,  y: 99 * TILE },    // scrub on the western hunting isle
  };
  // protoceratops burrows: dirt mounds hiding little warrens underneath.
  // chambers (rooms) and residents are seeded per burrow — sometimes one of
  // each, sometimes more of either, sometimes more of both
  W.burrows = [
    { x: 52 * TILE, y: 36 * TILE }, { x: 203 * TILE, y: 55 * TILE },
    { x: 140 * TILE, y: 53 * TILE }, { x: 64 * TILE, y: 112 * TILE },
    { x: 187 * TILE, y: 114 * TILE }, { x: 122 * TILE, y: 162 * TILE },
  ];
  W.burrows.forEach((b, i) => {
    b.id = i;
    b.chambers = 1 + (i * 7 + 3) % 3;             // 1-3 rooms
    b.residents = 1 + (i * 5 + 2) % 3;            // 1-3 protoceratops
    b.left = b.residents;
    b.owned = false;
  });
  const muds = [
    { x: 32, y: 64, r: 4.0 }, { x: 92, y: 32, r: 3.4 }, { x: 170, y: 28, r: 3.6 },
    { x: 226, y: 92, r: 3.4 }, { x: 96, y: 108, r: 3.2 }, { x: 156, y: 106, r: 3.2 },
    { x: 40, y: 130, r: 3.6 }, { x: 210, y: 160, r: 3.4 }, { x: 90, y: 164, r: 3.4 },
    { x: 160, y: 168, r: 3.4 }, { x: 66, y: 214, r: 3.0 }, { x: 186, y: 216, r: 3.0 },
  ];

  // --- base terrain: RAINFOREST — jungle is the default, and open ground
  // only survives as sun-glades punched through the canopy (the herds and
  // the chargers need somewhere to run) plus the open southern shore ---
  for (let ty = 0; ty < HT; ty++) {
    for (let tx = 0; tx < WT; tx++) {
      const i = tIdx(tx, ty);
      let ff = clamp((fbm(tx * 0.055 + 91, ty * 0.055 + 63) - 0.28) * 1.6, 0, 1) * 0.82;
      // sun-glades: broad meadow noise carves clearings through the jungle
      const glade = fbm(tx * 0.042 + 11, ty * 0.042 + 77);
      if (glade > 0.60) ff *= clamp(1 - (glade - 0.60) * 5.5, 0, 1);
      // the shore band stays open sand and surf-grass
      if (ty > 236) ff *= clamp((246 - ty) / 10, 0, 1);
      for (const m of muds) {
        const dd = Math.hypot(tx - m.x, ty - m.y);
        ff = Math.max(ff, clamp(1.2 - dd / (m.r + 8), 0, 1) * 0.9);   // shade rings on the wallows
      }
      W.forest[i] = ff;
      W.ter[i] = ff > 0.45 ? T_FOREST : T_GRASS;
    }
  }

  // --- the channels: chains of water blobs walked along a bezier ---
  const bez = (t, a, m, b) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * m + t * t * b;
  // fords: t-windows left shallow (no deep heart) so land animals can cross
  const carveChannel = (x0, y0, mx, my, x1, y1, w0, w1, fords) => {
    const est = (Math.hypot(mx - x0, my - y0) + Math.hypot(x1 - mx, y1 - my)) * 1.05;
    const steps = Math.max(10, Math.ceil(est / 2.2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const bx = bez(t, x0, mx, x1) + (fbm(t * 23 + x0 * 0.7, y0 * 0.5 + 3) - 0.5) * 5;
      const by = bez(t, y0, my, y1) + (fbm(t * 23 + x0 * 0.7, y0 * 0.5 + 47) - 0.5) * 5;
      const r = lerp(w0, w1, t) * (0.85 + 0.3 * vnoise(t * 31 + x0, y0));
      const deep = !fords.some(f => Math.abs(t - f) < 0.045);
      addWaterBlob(bx, by, r, deep);
    }
  };
  // the trunk: one great river in from the north
  carveChannel(124, -6, 118, 26, 124, 50, 9, 7, [0.45]);
  // four distributaries fanning from the apex to the southern sea
  carveChannel(124, 50, 56, 116, 20, 246, 6, 7.5, [0.2, 0.5, 0.8]);      // west arm
  carveChannel(124, 52, 92, 152, 74, 248, 5, 6.5, [0.3, 0.62]);          // mid-west arm
  carveChannel(124, 52, 148, 152, 134, 248, 5, 6.5, [0.28, 0.6, 0.85]);  // mid-east arm
  carveChannel(124, 50, 192, 112, 226, 246, 6, 7.5, [0.22, 0.55, 0.82]); // east arm
  carveChannel(90, 140, 112, 192, 102, 248, 4, 5, [0.45]);               // braid off the mid-west
  carveChannel(186, 124, 166, 184, 178, 248, 4, 5, [0.5]);               // braid off the east
  // CROSS-BRAIDS: side channels running between the arms — these are what
  // shatter the mainland into islands. Every one keeps fords
  // (they run past both map edges — a braid that stops short leaves a dry
  // land bridge around its end, and the islands quietly reunite)
  carveChannel(-8, 44, 120, 36, 264, 44, 4, 4.5, [0.15, 0.4, 0.72, 0.92]);     // far-north cross
  carveChannel(-8, 84, 122, 96, 264, 84, 4, 4.5, [0.14, 0.38, 0.62, 0.88]);    // north cross
  carveChannel(-8, 142, 122, 130, 264, 142, 4.5, 4.5, [0.16, 0.42, 0.68, 0.9]); // mid cross
  carveChannel(-8, 198, 124, 188, 264, 198, 4.5, 4.5, [0.2, 0.5, 0.82]);       // south cross
  // backwater lagoons and oxbows between the arms — still, fishy water
  const lagoons = [
    { x: 76, y: 62, r: 4.4, deep: true }, { x: 170, y: 62, r: 3.8, deep: false },
    { x: 44, y: 110, r: 3.6, deep: false }, { x: 206, y: 118, r: 4.6, deep: true },
    { x: 118, y: 116, r: 3.6, deep: true }, { x: 66, y: 176, r: 4.0, deep: true },
    { x: 148, y: 128, r: 3.2, deep: false }, { x: 190, y: 172, r: 3.8, deep: false },
    { x: 46, y: 224, r: 3.6, deep: false }, { x: 226, y: 220, r: 3.6, deep: true },
    { x: 118, y: 214, r: 4.2, deep: true }, { x: 30, y: 30, r: 3.4, deep: false },
    { x: 220, y: 26, r: 3.6, deep: true }, { x: 156, y: 220, r: 3.2, deep: false },
  ];
  for (const l of lagoons) addWaterBlob(l.x, l.y, l.r, l.deep);
  // the drowned south: overlapping deep blobs merge into one long sea line
  for (let bx = -2; bx <= WT + 2; bx += 4) {
    const by = 249.5 + Math.sin(bx * 0.1) * 1.8 + (fbm(bx * 0.3, 17) - 0.5) * 3;
    addWaterBlob(bx, by, rrange(6.5, 8.5), true);
  }
  for (let tx = 0; tx < WT; tx++) W.ter[tIdx(tx, HT - 1)] = T_DEEP;   // open sea past the blobs
  // the delta is SURROUNDED by water — the blob carver never touches the
  // outermost tile ring, and a dry rim would quietly stitch every island
  // back together around the outside
  for (let ty = 0; ty < HT; ty++) {
    W.ter[tIdx(0, ty)] = T_DEEP; W.ter[tIdx(WT - 1, ty)] = T_DEEP;
    if (W.ter[tIdx(1, ty)] !== T_DEEP) W.ter[tIdx(1, ty)] = T_WATER;
    if (W.ter[tIdx(WT - 2, ty)] !== T_DEEP) W.ter[tIdx(WT - 2, ty)] = T_WATER;
  }
  for (let tx = 0; tx < WT; tx++) {
    W.ter[tIdx(tx, 0)] = T_DEEP;
    if (W.ter[tIdx(tx, 1)] !== T_DEEP) W.ter[tIdx(tx, 1)] = T_WATER;
  }

  for (const p of muds) addMudPool(p);

  // --- gallery forest: the banks themselves grow the delta's real woods ---
  for (let ty = 1; ty < HT - 1; ty++) {
    for (let tx = 1; tx < WT - 1; tx++) {
      const i = tIdx(tx, ty), t = W.ter[i];
      if (t !== T_GRASS && t !== T_FOREST) continue;
      if (ty > 242) continue;                              // the sea shore stays open
      let nearW = false;
      for (const [ox, oy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, -2], [2, -2], [-2, 2]]) {
        const tx2 = clamp(tx + ox, 0, WT - 1), ty2 = clamp(ty + oy, 0, HT - 1);
        const t2 = W.ter[tIdx(tx2, ty2)];
        if (t2 === T_WATER || t2 === T_DEEP) { nearW = true; break; }
      }
      if (nearW && !nearAnyNest(tx * TILE, ty * TILE, 80)) {
        const ff = Math.max(W.forest[i], 0.92 * clamp(fbm(tx * 0.16 + 5, ty * 0.16 + 9) + 0.28, 0, 1));
        W.forest[i] = ff;
        if (ff > 0.45) W.ter[i] = T_FOREST;
      }
    }
  }

  // --- vegetation: reed banks, gallery trees, tall island grass ---
  for (let ty = 1; ty < HT - 1; ty++) {
    for (let tx = 1; tx < WT - 1; tx++) {
      const i = tIdx(tx, ty), t = W.ter[i];
      if (t === T_WATER || t === T_DEEP || t === T_MUD) continue;
      const px = tx * TILE + rrange(2, TILE - 2), py = ty * TILE + rrange(2, TILE - 2);
      const nestClear = nearAnyNest(px, py, 70);
      const ff = W.forest[i];
      const r = rnd();
      const grove = clamp((fbm(tx * 0.13 + 7, ty * 0.13 + 3) - 0.45) * 2.6, 0, 1);
      if (!nestClear && ff > 0.45 && r < 0.09 + 0.1 * grove + 0.17 * clamp((ff - 0.55) * 3, 0, 1)) {
        // the jungle canopy: broadleaf-heavy, near-continuous, deep lush greens
        const kr = rnd(), vr = rnd();
        const kind = kr < 0.28 ? 0 : kr < 0.86 ? 1 : 3;
        const v = kind === 1 && vr > 0.88 ? 4 : 3;        // jungle blossoms are common
        W.trees.push({ x: px, y: py, s: rrange(0.7, 1.55), kind, v });
      } else if (!nestClear && t === T_GRASS && ff < 0.3 && r < 0.0016) {
        W.trees.push({ x: px, y: py, s: rrange(0.85, 1.25), kind: rnd() < 0.7 ? 3 : 2, v: rnd() < 0.7 ? 3 : 0 });
      } else if (ff > 0.42 && r > 0.88 && r < 0.95) {
        W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.85, 1.4) });   // fern understory
      } else if (t === T_SAND && r > 0.9) {
        // the delta's true crop: reeds on every sandbar and bank
        W.horsetails.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.75, 1.2) });
      } else if (!nestClear && r > 0.9962) {
        W.rocks.push({ x: px, y: py, s: rrange(0.7, 1.5) });
      } else if (!nestClear) {
        const r2 = rnd();
        if (ff > 0.45 && r2 < 0.016) W.props.push({ kind: 'bush', x: px, y: py, s: rrange(0.85, 1.4), v: 0 });
        else if (ff > 0.45 && r2 < 0.021) W.props.push({ kind: 'log', x: px, y: py, s: rrange(0.8, 1.2), flip: rnd() < 0.5 ? 1 : -1 });
        else if (ff > 0.48 && r2 < 0.027) W.props.push({ kind: 'mushroom', x: px, y: py, s: rrange(0.8, 1.25) });
        else if (t === T_GRASS && ff < 0.3 && r2 < 0.04) W.props.push({ kind: 'tallgrass', x: px, y: py, s: rrange(0.85, 1.45) });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.9985) W.props.push({ kind: 'ribcage', x: px, y: py, s: rrange(0.9, 1.4), flip: rnd() < 0.5 ? 1 : -1 });
        else if (t === T_GRASS && ff < 0.35 && r2 > 0.9948 && r2 < 0.9956) W.props.push({ kind: 'skull', x: px, y: py, s: rrange(0.9, 1.3), flip: rnd() < 0.5 ? 1 : -1 });
        else if (t === T_SAND && r2 > 0.992) W.props.push({ kind: 'log', x: px, y: py, s: rrange(0.8, 1.25), flip: rnd() < 0.5 ? 1 : -1 });   // driftwood
        else if (t === T_WATER && r2 > 0.9975) W.props.push({ kind: 'waterrock', x: px, y: py, s: rrange(0.8, 1.4) });
      }
    }
  }

  // scattered forage so the island grazers can live anywhere: fern clumps
  // across all the dry ground (it's a big place — there are a lot of them)
  for (let k = 0; k < 170; k++) {
    const px = rrange(6, 250) * TILE, py = rrange(6, 240) * TILE;
    if (!isWaterPx(px, py) && !isMudPx(px, py)) W.ferns.push({ x: px, y: py, food: 1, regrow: 0, s: rrange(0.8, 1.3) });
  }

  // worn trails: every nest walks to its water and its wallow
  addTrail(W.nests.centro.x, W.nests.centro.y, muds[0].x * TILE, muds[0].y * TILE);
  addTrail(W.nests.loki.x, W.nests.loki.y, 220 * TILE, 28 * TILE);
  addTrail(W.nests.spino.x, W.nests.spino.y, 124 * TILE, 52 * TILE);
  addTrail(W.nests.tyranno.x, W.nests.tyranno.y, muds[6].x * TILE, muds[6].y * TILE);
  addTrail(W.nests.omni.x, W.nests.omni.y, 206 * TILE, 118 * TILE);
  addTrail(W.nests.eotrach.x, W.nests.eotrach.y, muds[10].x * TILE, muds[10].y * TILE);
  addTrail(W.nests.moro.x, W.nests.moro.y, muds[9].x * TILE, muds[9].y * TILE);
}

// ---------- painterly ground, rendered in crisp cached chunks ----------
// All decorative paint (clouds, grass blades, trail dots, footprints) is
// precomputed as data so any region can be redrawn, at any render scale.
const Paint = { clouds: [], blades: [], trailDots: [], prints: [] };

function buildPaintData() {
  Paint.clouds.length = 0; Paint.blades.length = 0;
  Paint.trailDots.length = 0; Paint.prints.length = 0;
  let _cs = 987231;
  const crnd = () => ((_cs = (_cs * 1664525 + 1013904223) >>> 0) / 4294967296);
  // paint density scales with the map's area, so big worlds stay as lush
  const areaMul = (WT * HT) / (120 * 120);

  // tonal colour clouds
  for (let k = 0; k < Math.round(170 * areaMul); k++) {
    const x = crnd() * WORLD_W, y = crnd() * WORLD_H;
    const ff = forestShadePx(x, y);
    const r = 55 + crnd() * 130;
    const warm = crnd();
    const alpha = 0.05 + crnd() * 0.055;
    let rgb;
    if (World.snowy) rgb = warm < 0.5 ? '210,224,238' : warm < 0.8 ? '176,196,216' : '150,172,196';
    else if (World.ashy) rgb = warm < 0.4 ? '74,70,62' : warm < 0.75 ? '128,120,104' : '156,120,84';
    else if (World.lush) rgb = ff > 0.42
      ? (warm < 0.45 ? '24,58,30' : warm < 0.8 ? '52,104,52' : '88,128,58')
      : (warm < 0.4 ? '120,142,66' : warm < 0.75 ? '72,116,54' : '96,132,60');
    else if (ff > 0.42) rgb = warm < 0.45 ? '42,62,28' : warm < 0.8 ? '104,124,60' : '128,138,70';
    else rgb = warm < 0.4 ? '186,168,92' : warm < 0.75 ? '124,138,66' : '150,150,74';
    Paint.clouds.push({ x, y, r, rot: crnd() * 3, rgb, alpha });
  }

  // brush-stroke grass blades (ash-grey tussocks on the ridge)
  const FOREST_BLADES = World.ashy
    ? ['#4c5238', '#5c6242', '#6d7350', '#424836']
    : World.lush
      ? ['#2a5c30', '#376e3a', '#468248', '#204c28']
      : ['#46572c', '#586b36', '#6d8246', '#3c4c26'];
  const PLAINS_BLADES = World.ashy
    ? ['#84806c', '#948e76', '#a39a80', '#726e5c']
    : World.lush
      ? ['#5c8a42', '#6e9c4c', '#82ae58', '#4c7838']
      : ['#8f8a48', '#a89a54', '#bbaf62', '#7d7a40'];
  for (let k = 0; World.snowy ? false : k < Math.round(2800 * areaMul); k++) {
    const x = crnd() * WORLD_W, y = crnd() * WORLD_H;
    const t = terAtPx(x, y);
    if (t !== T_GRASS && t !== T_FOREST) continue;
    const pal = forestShadePx(x, y) > 0.42 ? FOREST_BLADES : PLAINS_BLADES;
    const clump = 3 + Math.floor(crnd() * 4);
    for (let c = 0; c < clump; c++) {
      const bx = x + (crnd() - 0.5) * 16;
      const by = y + (crnd() - 0.5) * 11;
      const len = 3.5 + crnd() * 5.5;
      const lean = (crnd() - 0.5) * 5;
      Paint.blades.push({
        x: bx, y: by,
        cx: bx + lean * 0.3, cy: by - len * 0.6,
        ex: bx + lean, ey: by - len,
        color: pal[Math.floor(crnd() * pal.length)],
        alpha: 0.55 + crnd() * 0.35,
      });
    }
  }

  // worn animal trail dots (two passes: wide soft, then dashed worn centre)
  const bez = (t, a, m, b) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * m + t * t * b;
  for (const tr of World.trails) {
    const len = dist(tr.x1, tr.y1, tr.x2, tr.y2) * 1.15;
    const steps = Math.max(12, Math.floor(len / 5));
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const fade = clamp(Math.min(t, 1 - t) * 6, 0.25, 1);
        const h = hash2(Math.round(tr.x1 + k * 17), Math.round(tr.y1 + k * 29));
        if (pass === 1 && h < 0.45) continue;
        Paint.trailDots.push({
          x: bez(t, tr.x1, tr.mx, tr.x2) + (hash2(k * 3, k) - 0.5) * 6,
          y: bez(t, tr.y1, tr.my, tr.y2) + (hash2(k, k * 7) - 0.5) * 6,
          r: pass === 0 ? 8 + h * 3 : 3.5 + h * 2,
          fill: pass === 0
            ? 'rgba(154,136,86,' + (0.20 * fade).toFixed(3) + ')'
            : 'rgba(140,120,72,' + (0.38 * fade).toFixed(3) + ')',
        });
      }
    }
  }

  // three-toed footprint chains near mud pools and fords
  const collectChain = (x0, y0, ang, count, size) => {
    for (let k = 0; k < count; k++) {
      const px = x0 + Math.cos(ang) * k * 8.5;
      const py = y0 + Math.sin(ang) * k * 8.5;
      if (isWaterPx(px, py)) continue;
      const side = (k % 2 ? 1 : -1);
      Paint.prints.push({
        x: px - Math.sin(ang) * side * 3.2,
        y: py + Math.cos(ang) * side * 3.2,
        ang, size, mud: isMudPx(px, py),
      });
    }
  };
  for (let pi = 0; pi < World.mudPools.length; pi++) {
    const p = World.mudPools[pi];
    for (let c = 0; c < 2; c++) {
      const a = hash2(pi * 7 + c, 13) * TAU;
      collectChain(p.x + Math.cos(a) * (p.r + 60), p.y + Math.sin(a) * (p.r + 60), a + Math.PI, 9, 1 + hash2(pi, c) * 0.6);
    }
  }
  if (World.hasRiver) {
    for (const fty of FORD_TYS) {
      collectChain(riverX(fty) * TILE - 90, fty * TILE + 8, 0.05, 22, 1.1);
    }
  } else {
    // thirsty animals walk to the ponds
    for (let bi = 0; bi < Math.min(5, World.waterBlobs.length); bi++) {
      const b = World.waterBlobs[bi];
      const a = hash2(bi * 11, 29) * TAU;
      collectChain(b.x + Math.cos(a) * (b.r + 80), b.y + Math.sin(a) * (b.r + 80), a + Math.PI, 10, 1 + hash2(bi, 5) * 0.5);
    }
  }
}

// draws every terrain pass, culled to a world-space region
function renderGroundRegion(ctx, rx, ry, rw, rh) {
  const tx0 = clamp(Math.floor(rx / TILE) - 1, 0, WT - 1);
  const ty0 = clamp(Math.floor(ry / TILE) - 1, 0, HT - 1);
  const tx1 = clamp(Math.ceil((rx + rw) / TILE) + 1, 0, WT - 1);
  const ty1 = clamp(Math.ceil((ry + rh) / TILE) + 1, 0, HT - 1);
  const inR = (x, y, m) => x > rx - m && x < rx + rw + m && y > ry - m && y < ry + rh + m;

  // ---- pass 1: land base + forest-edge dither ----
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const i = tIdx(tx, ty);
      const n = fbm(tx * 0.18, ty * 0.18);
      const big = fbm(tx * 0.045 + 40, ty * 0.045 + 40);
      const grass = mixHex(mixHex('#b0a55c', '#98944c', n), '#8d9251', big * 0.7);
      const forest = mixHex(mixHex('#78884a', '#61723c', n), '#576939', big * 0.6);
      const ff = clamp((World.forest[i] - 0.28) / 0.3, 0, 1);
      const t = World.ter[i];
      let ground = mixHex(grass, forest, ff);
      // ashfall: the whole land is grey with ash, greener only under the groves
      if (World.ashy) ground = mixHex(ground, '#736c60', 0.55 - ff * 0.25);
      // rainforest: everything sinks toward deep wet green, jungle deepest
      else if (World.lush) ground = mixHex(ground, '#3d6b38', 0.34 + ff * 0.22);
      // the Wall: deep snow, a hair bluer up high (north), a hair warmer under pines
      else if (World.snowy) {
        const alt = 1 - ty / HT;
        ground = mixHex(mixHex('#dfe8f2', '#c8d6e6', alt), '#c2cbd0', ff * 0.35);
        if (t === T_CLIFF) ground = mixHex('#43454f', '#565863', fbm(tx * 0.4 + 2, ty * 0.4));   // bare rock wall
      }
      ctx.fillStyle = ground;
      // +1px overdraw: at fractional render scales adjacent rects would
      // otherwise antialias apart and show a hairline grid
      ctx.fillRect(tx * TILE, ty * TILE, TILE + 1, TILE + 1);
      if (!World.snowy && (t === T_GRASS || t === T_FOREST) && ff > 0.15 && ff < 0.85) {
        ctx.fillStyle = ff > 0.5 ? 'rgba(170,161,90,0.5)' : 'rgba(98,112,60,0.5)';
        for (let k = 0; k < 4; k++) {
          const hx = hash2(tx * 13 + k * 5, ty * 7 + k), hy = hash2(tx * 3 + k, ty * 19 + k * 3);
          ctx.fillRect(tx * TILE + hx * 22, ty * TILE + hy * 22, 2, 2);
        }
      }
    }
  }

  // ---- pass 1b: tonal clouds ----
  for (const cl of Paint.clouds) {
    if (!inR(cl.x, cl.y, cl.r + 10)) continue;
    const g = ctx.createRadialGradient(cl.x, cl.y, cl.r * 0.15, cl.x, cl.y, cl.r);
    g.addColorStop(0, 'rgba(' + cl.rgb + ',' + cl.alpha.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + cl.rgb + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cl.x, cl.y, cl.r, cl.r * 0.72, cl.rot, 0, TAU);
    ctx.fill();
  }

  // ---- pass 1c: brush-stroke grass ----
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.1;
  for (const b of Paint.blades) {
    if (!inR(b.x, b.y, 20)) continue;
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = b.alpha;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.quadraticCurveTo(b.cx, b.cy, b.ex, b.ey);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // ---- pass 1.5: worn animal trails ----
  for (const d of Paint.trailDots) {
    if (!inR(d.x, d.y, 14)) continue;
    ctx.fillStyle = d.fill;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, TAU);
    ctx.fill();
  }

  // ---- pass 2: river & mud as smooth curves from their generating functions ----
  function smoothClosed(pts) {
    ctx.beginPath();
    ctx.moveTo((pts[0].x + pts[pts.length - 1].x) / 2, (pts[0].y + pts[pts.length - 1].y) / 2);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
    ctx.closePath();
  }
  function riverBand(widthFn, color) {
    const pts = [];
    for (let ty = -3; ty <= HT + 3; ty += 1.25) {
      pts.push({ x: (riverX(ty) - Math.max(0.02, widthFn(ty))) * TILE, y: ty * TILE });
    }
    for (let ty = HT + 3; ty >= -3; ty -= 1.25) {
      pts.push({ x: (riverX(ty) + Math.max(0.02, widthFn(ty))) * TILE, y: ty * TILE });
    }
    smoothClosed(pts);
    ctx.fillStyle = color;
    ctx.fill();
  }
  const fordPinch = (ty) => {
    let d = 1e9;
    for (const f of FORD_TYS) d = Math.min(d, Math.abs(ty - f));
    const t = clamp((d - 1.6) / 2.4, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const shoreWob = shoreWobT;
  const nearRiver = World.hasRiver && rx + rw > RIVER_X0 && rx < RIVER_X1;
  if (nearRiver) {
    riverBand(ty => riverW(ty) + 1.9 + shoreWob(ty), WATER_COLS.sand);         // sandy banks
  }
  function poolBlob(p, mul, grow, color) {
    const pts = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      const rr = p.r * mul * (1 + (hash2(Math.round(p.x) + i, Math.round(p.y)) - 0.5) * 0.34) + grow;
      pts.push({ x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr * 0.94 });
    }
    smoothClosed(pts);
    ctx.fillStyle = color;
    ctx.fill();
  }
  // prairie ponds & swamp: layered blob stack (all rims first so overlapping
  // swamp pools merge into one waterline, then shallows, then deep hearts)
  if (World.waterBlobs.length) {
    const bs = World.waterBlobs.filter(b => inR(b.x, b.y, b.r * 1.5 + 14));
    // frozen ponds on the Wall read as pale cracked ice, not open water
    const WC = World.snowy
      ? { sand: '#b8c4cf', foam: '#d6e2ec', shallow: '#c2d2df', open: '#a6bccb', deep: '#8ea9bc' }
      : WATER_COLS;
    for (const b of bs) poolBlob(b, 1.3, 5, WC.sand);
    for (const b of bs) poolBlob(b, 1.08, 1.5, WC.foam);
    for (const b of bs) poolBlob(b, 1.0, 0, WC.shallow);
    for (const b of bs) poolBlob(b, 0.8, 0, WC.open);
    for (const b of bs) if (b.deep) poolBlob(b, 0.52, 0, WC.deep);
    // a few dark crack lines etched across each ice sheet
    if (World.snowy) {
      ctx.strokeStyle = 'rgba(90,120,145,0.4)'; ctx.lineWidth = 0.8;
      for (const b of bs) {
        for (let k = 0; k < 3; k++) {
          const a = hash2(Math.round(b.x) + k, Math.round(b.y)) * TAU;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * b.r * 0.7, b.y + Math.sin(a) * b.r * 0.5);
          ctx.lineTo(b.x - Math.cos(a + 0.6) * b.r * 0.6, b.y - Math.sin(a + 0.6) * b.r * 0.5);
          ctx.stroke();
        }
      }
    }
  }
  for (const p of World.mudPools) {
    if (!inR(p.x, p.y, p.r * 1.4 + 10)) continue;
    poolBlob(p, 1.14, 5, '#7d6045');   // dry cracked rim
    poolBlob(p, 1.02, 0, '#63492f');   // mud
    poolBlob(p, 0.55, 0, '#55402a');   // wet centre
  }
  // lava fields: charred rim, cooling crust, molten heart (hottest innermost)
  if (World.lavaBlobs.length) {
    const ls = World.lavaBlobs.filter(b => inR(b.x, b.y, b.r * 1.5 + 14));
    for (const b of ls) poolBlob(b, 1.28, 5, '#2c221a');
    for (const b of ls) poolBlob(b, 1.06, 1.5, '#57241a');
    for (const b of ls) poolBlob(b, 0.96, 0, '#b23416');
    for (const b of ls) poolBlob(b, 0.68, 0, '#e0611f');
    for (const b of ls) poolBlob(b, 0.4, 0, '#ffAA38');
  }
  if (nearRiver) {
    riverBand(ty => riverW(ty) + 0.55 + shoreWob(ty) * 0.7, WATER_COLS.foam);         // shoreline foam
    riverBand(ty => riverW(ty), WATER_COLS.shallow);                                  // sunlit shallows
    riverBand(ty => riverW(ty) - 1.25, WATER_COLS.open);                              // open water
    riverBand(ty => (riverW(ty) - 1.7) * fordPinch(ty), WATER_COLS.deep2);            // depth transition
    riverBand(ty => (riverW(ty) - 2.1) * fordPinch(ty), WATER_COLS.deep);             // deep channel
  }

  // ---- pass 2.5: stepping stones across the fords ----
  for (const fty of World.hasRiver ? FORD_TYS : []) {
    if (!inR(riverX(fty) * TILE, fty * TILE, 260)) continue;
    const srx = riverX(fty), srw = riverW(fty);
    const y0 = fty * TILE + TILE / 2;
    for (let fx = srx - srw - 0.6; fx < srx + srw + 0.6; fx += 1.15) {
      const h = hash2(Math.round(fx * 31), fty * 7);
      const sx = fx * TILE + (h - 0.5) * 8;
      const sy = y0 + (hash2(Math.round(fx * 13), fty * 3) - 0.5) * 22;
      const r = 4.5 + h * 2.5;
      // dark waterline ring, stone, lit top
      ctx.fillStyle = 'rgba(30,52,60,0.5)';
      ctx.beginPath(); ctx.ellipse(sx, sy + 1, r + 1.6, r * 0.62 + 1.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = h > 0.5 ? '#8d8779' : '#817b6d';
      ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.62, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#a6a08f';
      ctx.beginPath(); ctx.ellipse(sx - r * 0.2, sy - r * 0.22, r * 0.55, r * 0.3, 0, 0, TAU); ctx.fill();
    }
  }

  // ---- pass 3: per-tile painterly details ----
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const i = tIdx(tx, ty), t = World.ter[i];
      const x0 = tx * TILE, y0 = ty * TILE;
      const h = hash2(tx * 7 + 3, ty * 13 + 1);
      const ff = clamp((World.forest[i] - 0.28) / 0.3, 0, 1);

      // --- the Wall: rock walls and glittering snow instead of grass ---
      if (World.snowy) {
        if (t === T_CLIFF) {
          // cracked-rock strata + a snow cap where the wall meets open sky above
          ctx.strokeStyle = 'rgba(20,22,30,0.5)'; ctx.lineWidth = 1;
          for (let k = 0; k < 2; k++) {
            const cy = y0 + 4 + hash2(tx * 9 + k, ty * 5 + k * 3) * (TILE - 6);
            ctx.beginPath();
            ctx.moveTo(x0 + 2, cy);
            ctx.lineTo(x0 + TILE - 2, cy + (h - 0.5) * 6);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(90,96,110,0.5)';
          ctx.beginPath(); ctx.arc(x0 + h * TILE, y0 + hash2(tx, ty * 3) * TILE, 1.6, 0, TAU); ctx.fill();
          // snow settles on the top lip of the wall
          if (ty > 0 && World.ter[tIdx(tx, ty - 1)] !== T_CLIFF) {
            ctx.fillStyle = '#eef4fb';
            ctx.beginPath();
            ctx.moveTo(x0, y0 + 5);
            ctx.quadraticCurveTo(x0 + TILE * 0.5, y0 - 2, x0 + TILE + 1, y0 + 4);
            ctx.lineTo(x0 + TILE + 1, y0);
            ctx.lineTo(x0, y0); ctx.closePath(); ctx.fill();
          }
        } else if (t === T_GRASS || t === T_FOREST) {
          // snow glitter — a couple of tiny cold sparkles, an occasional rock nub
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          for (let k = 0; k < 2; k++) {
            const sxp = x0 + hash2(tx * 13 + k * 7, ty * 5 + k) * TILE;
            const syp = y0 + hash2(tx * 3 + k, ty * 17 + k * 5) * TILE;
            ctx.fillRect(sxp, syp, 1.3, 1.3);
          }
          if (h > 0.95) {
            ctx.fillStyle = 'rgba(120,128,140,0.55)';
            ctx.beginPath(); ctx.ellipse(x0 + h * 20, y0 + 14, 2.4, 1.4, 0, 0, TAU); ctx.fill();
          }
        }
        continue;
      }

      if (t === T_GRASS || t === T_FOREST) {
        // layered grass tufts: a base shadow and fanned two-tone blades
        const nTufts = h < 0.45 ? 2 : 1;
        for (let k = 0; k < nTufts; k++) {
          const hx = hash2(tx * 31 + k * 11, ty * 17 + k * 3);
          const hy = hash2(tx * 11 + k * 7, ty * 29 + k);
          const gx = x0 + hx * TILE, gy = y0 + 4 + hy * (TILE - 4);
          const tall = 3 + hy * 3;
          const darkG = World.ashy ? (ff > 0.5 ? '#4a5038' : '#6e6a5a')
            : World.lush ? (ff > 0.5 ? '#2c5a32' : '#4c7a3c') : ff > 0.5 ? '#4c5c30' : '#7d7a40';
          const liteG = World.ashy ? (ff > 0.5 ? '#6d7350' : '#98917c')
            : World.lush ? (ff > 0.5 ? '#4a8a4c' : '#78a858') : ff > 0.5 ? '#7f9150' : '#bcb56a';
          ctx.fillStyle = 'rgba(30,32,12,0.13)';
          ctx.beginPath(); ctx.ellipse(gx, gy + 0.5, 3, 1.1, 0, 0, TAU); ctx.fill();
          for (let b = -1; b <= 1; b++) {
            ctx.strokeStyle = b === 0 ? liteG : darkG;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gx + b, gy);
            ctx.quadraticCurveTo(gx + b * 2, gy - tall * 0.6, gx + b * 2.6 + (hx - 0.5), gy - tall);
            ctx.stroke();
          }
        }
        // wildflowers gather in drifts (noise-masked clusters, two colours per drift)
        const flowerMask = fbm(tx * 0.3 + 80, ty * 0.3 + 21);
        if (t === T_GRASS && ff < 0.35 && flowerMask > 0.62 && h > 0.45) {
          const n = h > 0.8 ? 3 : 2;
          const drift = hash2(Math.floor(tx / 5), Math.floor(ty / 5));
          for (let k = 0; k < n; k++) {
            const fx = x0 + hash2(tx * 5 + k, ty * 3 + k * 7) * 20 + 2;
            const fy = y0 + hash2(tx * 9 + k * 3, ty * 5 + k) * 20 + 2;
            // on the ridge the drifts are rare orange firelilies; in the
            // rainforest they bloom hot pink and white like wild orchids
            ctx.fillStyle = World.ashy ? (k % 2 ? '#d8763a' : '#c9553a')
              : World.lush ? (k % 2 ? '#e87ab8' : '#f2ecd8')
                : (drift > 0.5) === (k % 2 === 0) ? '#ece6c6' : '#d9c05e';
            ctx.fillRect(fx - 1, fy - 1, 2, 2);
            ctx.fillRect(fx, fy - 2, 1, 1); ctx.fillRect(fx, fy + 1, 1, 1);
            ctx.fillRect(fx - 2, fy, 1, 1); ctx.fillRect(fx + 1, fy, 1, 1);
            ctx.fillStyle = '#8a6a2a';
            ctx.fillRect(fx, fy, 1, 1);
          }
        }
        // mossy patches with clover on the forest floor
        if (t === T_FOREST && h > 0.5 && h < 0.6) {
          const mx = x0 + 12, my = y0 + 12;
          ctx.fillStyle = 'rgba(52,72,36,0.35)';
          ctx.beginPath(); ctx.ellipse(mx, my, 7 + h * 8, 4 + h * 4, h * 3, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(120,150,80,0.55)';
          for (let k = 0; k < 3; k++) {
            ctx.fillRect(mx - 5 + hash2(tx + k, ty * 3) * 10, my - 3 + hash2(tx * 3, ty + k) * 6, 1.5, 1.5);
          }
        }
        if (t === T_FOREST && h > 0.72) {
          // fallen leaf litter
          ctx.fillStyle = h > 0.86 ? 'rgba(122,106,58,0.6)' : 'rgba(74,84,42,0.55)';
          const lx = x0 + hash2(tx * 3, ty * 9) * 20, ly = y0 + hash2(tx * 9, ty * 3) * 20;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(h * 6);
          ctx.beginPath(); ctx.ellipse(0, 0, 2.2, 1, 0, 0, TAU); ctx.fill();
          ctx.restore();
        }
        if (t === T_GRASS && ff < 0.3 && h > 0.88 && h < 0.905) {
          // pebble
          const px = x0 + 12, py = y0 + 12;
          ctx.fillStyle = '#8b8676';
          ctx.beginPath(); ctx.ellipse(px, py, 2.4, 1.6, 0.3, 0, TAU); ctx.fill();
          ctx.fillStyle = '#a5a08e';
          ctx.beginPath(); ctx.ellipse(px - 0.6, py - 0.6, 1.1, 0.7, 0.3, 0, TAU); ctx.fill();
        }
      } else if (t === T_MUD) {
        if (h > 0.55) {
          ctx.fillStyle = 'rgba(38,24,12,0.3)';
          ctx.beginPath();
          ctx.ellipse(x0 + h * TILE, y0 + hash2(ty, tx) * TILE, 4, 2.2, 0.2, 0, TAU);
          ctx.fill();
        }
        if (h > 0.8) {
          // mud bubbles
          ctx.strokeStyle = 'rgba(130,100,70,0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x0 + 8, y0 + h * 16, 1.6, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(x0 + 13, y0 + h * 16 + 3, 1, 0, TAU); ctx.stroke();
        }
      } else if (t === T_WATER || t === T_DEEP) {
        if (h > 0.7) {
          ctx.strokeStyle = t === T_DEEP ? 'rgba(215,232,230,0.13)' : 'rgba(220,238,235,0.2)';
          ctx.lineWidth = 1;
          const wy = y0 + h * 18;
          ctx.beginPath();
          ctx.moveTo(x0 + 3, wy);
          ctx.quadraticCurveTo(x0 + 8, wy - 1.6, x0 + 13, wy);
          ctx.quadraticCurveTo(x0 + 17, wy + 1.2, x0 + 21, wy);
          ctx.stroke();
        } else if (h > 0.35 && h < 0.52) {
          // downstream flow streak (the river runs north-south)
          ctx.strokeStyle = 'rgba(226,240,238,0.09)';
          ctx.lineWidth = 1.4;
          const wx = x0 + 4 + h * 30;
          ctx.beginPath();
          ctx.moveTo(wx, y0 + 2);
          ctx.quadraticCurveTo(wx + 2, y0 + 11, wx, y0 + 21);
          ctx.stroke();
        }
      } else if (t === T_SAND) {
        if (h > 0.62) {
          ctx.fillStyle = 'rgba(96,80,52,0.35)';
          ctx.fillRect(x0 + h * 18, y0 + hash2(tx * 3, ty) * 18, 2, 2);
          ctx.fillRect(x0 + hash2(ty, tx * 7) * 18, y0 + h * 14, 1, 1);
        }
        if (h > 0.28 && h < 0.4) {
          // gravel scatter
          for (let k = 0; k < 5; k++) {
            const gx = x0 + hash2(tx * 7 + k, ty + k * 3) * 20 + 2;
            const gy = y0 + hash2(tx + k * 5, ty * 9 + k) * 20 + 2;
            ctx.fillStyle = k % 2 ? '#a09781' : '#8a8271';
            ctx.beginPath(); ctx.ellipse(gx, gy, 1.6, 1.1, k, 0, TAU); ctx.fill();
          }
        }
        if (h > 0.9) {
          // wind ripple
          ctx.strokeStyle = 'rgba(150,130,90,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0 + 4, y0 + 14);
          ctx.quadraticCurveTo(x0 + 12, y0 + 11, x0 + 20, y0 + 14);
          ctx.stroke();
        }
      }
    }
  }

  // ---- pass 3.5: three-toed footprint trails ----
  for (const pr of Paint.prints) {
    if (!inR(pr.x, pr.y, 12)) continue;
    ctx.fillStyle = pr.mud ? 'rgba(30,18,8,0.4)' : 'rgba(66,52,28,0.30)';
    ctx.beginPath();
    ctx.ellipse(pr.x, pr.y, 1.9 * pr.size, 1.3 * pr.size, pr.ang, 0, TAU);
    ctx.fill();
    for (let tn = -1; tn <= 1; tn++) {          // toes
      ctx.beginPath();
      ctx.arc(pr.x + Math.cos(pr.ang + tn * 0.5) * 2.4 * pr.size, pr.y + Math.sin(pr.ang + tn * 0.5) * 2.4 * pr.size, 0.7 * pr.size, 0, TAU);
      ctx.fill();
    }
  }

  // ---- pass 4: soft canopy shadows beneath trees ----
  for (const t of World.trees) {
    const r = (t.kind === 1 ? 24 : t.kind === 3 ? 12 : 18) * t.s;
    if (!inR(t.x, t.y, r + 10)) continue;
    ctx.fillStyle = 'rgba(26,30,10,0.16)';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y - 1, r, r * 0.42, 0, 0, TAU);
    ctx.fill();
  }
}

// ---------- chunked terrain cache: crisp ground at any render scale ----------
const CHUNK = 288, CHUNK_PAD = 3;
let NCHX = Math.ceil(WORLD_W / CHUNK), NCHY = Math.ceil(WORLD_H / CHUNK);   // per-eco (genWorld updates)
const groundChunks = new Map();
let chunkTick = 0;
function clearGroundCache() { groundChunks.clear(); }

function getGroundChunk(cx, cy) {
  const RS = G.RS || 1;
  const key = cx + ',' + cy + '@' + RS;
  let ch = groundChunks.get(key);
  if (!ch) {
    const size = CHUNK + CHUNK_PAD * 2;         // padded: neighbours overlap, no seams
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(size * RS);
    cv.height = Math.ceil(size * RS);
    const c = cv.getContext('2d');
    c.scale(RS, RS);
    c.translate(CHUNK_PAD - cx * CHUNK, CHUNK_PAD - cy * CHUNK);
    renderGroundRegion(c, cx * CHUNK - CHUNK_PAD, cy * CHUNK - CHUNK_PAD, size, size);
    ch = { cv };
    groundChunks.set(key, ch);
    if (groundChunks.size > 40) {
      let oldK = null, oldT = Infinity;
      for (const [k, v] of groundChunks) if (v.t < oldT) { oldT = v.t; oldK = k; }
      groundChunks.delete(oldK);
    }
  }
  ch.t = ++chunkTick;
  return ch;
}

// draw all chunks covering the view; pre-bake a ring around it, 2 per frame max
function drawGroundChunks(ctx, camX, camY, vw, vh) {
  const cx0 = clamp(Math.floor(camX / CHUNK), 0, NCHX - 1);
  const cy0 = clamp(Math.floor(camY / CHUNK), 0, NCHY - 1);
  const cx1 = clamp(Math.floor((camX + vw) / CHUNK), 0, NCHX - 1);
  const cy1 = clamp(Math.floor((camY + vh) / CHUNK), 0, NCHY - 1);
  const size = CHUNK + CHUNK_PAD * 2;
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const ch = getGroundChunk(cx, cy);
      ctx.drawImage(ch.cv, cx * CHUNK - CHUNK_PAD, cy * CHUNK - CHUNK_PAD, size, size);
    }
  }
  let budget = 2;
  for (let cy = cy0 - 1; cy <= cy1 + 1 && budget > 0; cy++) {
    for (let cx = cx0 - 1; cx <= cx1 + 1 && budget > 0; cx++) {
      if (cx < 0 || cy < 0 || cx >= NCHX || cy >= NCHY) continue;
      if (cx >= cx0 && cx <= cx1 && cy >= cy0 && cy <= cy1) continue;
      if (!groundChunks.has(cx + ',' + cy + '@' + (G.RS || 1))) {
        getGroundChunk(cx, cy);
        budget--;
      }
    }
  }
}

// ---------- static object drawing (called depth-sorted with entities) ----------

// sprite cache: statics are path-drawn once into an offscreen canvas, then blitted
const SpriteCache = {};
function cachedSprite(key, w, h, ox, oy, drawFn) {
  // bake at the current render scale so sprites stay sharp in crisp mode
  const RS = G.RS || 1;
  key = key + '@' + RS;
  let sp = SpriteCache[key];
  if (!sp) {
    const cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.ceil(w * RS));
    cv.height = Math.max(2, Math.ceil(h * RS));
    const c = cv.getContext('2d');
    c.setTransform(RS, 0, 0, RS, ox * RS, oy * RS);
    drawFn(c);
    sp = SpriteCache[key] = { cv, ox, oy, w, h };
  }
  return sp;
}
function q1(s) { return Math.round(s * 10) / 10; } // quantize scale for cache keys

// a scalloped conifer layer: two humps per side meeting at an apex
function coniferLayer(ctx, x, y, w, h, fill, line) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w * 0.78, y - h * 0.18, x - w * 0.52, y - h * 0.34);
  ctx.quadraticCurveTo(x - w * 0.62, y - h * 0.4, x - w * 0.42, y - h * 0.52);
  ctx.quadraticCurveTo(x - w * 0.2, y - h * 0.92, x, y - h);
  ctx.quadraticCurveTo(x + w * 0.2, y - h * 0.92, x + w * 0.42, y - h * 0.52);
  ctx.quadraticCurveTo(x + w * 0.62, y - h * 0.4, x + w * 0.52, y - h * 0.34);
  ctx.quadraticCurveTo(x + w * 0.78, y - h * 0.18, x + w, y);
  ctx.quadraticCurveTo(x, y + h * 0.08, x - w, y);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

function drawTree(ctx, t) {
  const s = q1(t.s), v = t.v || 0;
  const w = Math.ceil(52 * s) + 8, h = Math.ceil(52 * s) + 12;
  const sp = cachedSprite('tree' + t.kind + '_' + s + '_' + v, w, h, w / 2, h - 6,
    (c) => drawTreeRaw(c, { x: 0, y: 0, s, kind: t.kind, v }));
  ctx.drawImage(sp.cv, t.x - sp.ox, t.y - sp.oy, sp.w, sp.h);
}

// foliage palettes for natural variety; the third is the rare flowering tree,
// and the last two are the RAINFOREST greens (deep, wet, saturated) that the
// Lertentous Delta's jungle wears — v=4 is its blossoming canopy tree
const TREE_PAL = [
  { con: ['#38512e', '#41603a', '#4c6f40'], ara: ['#4f6a33', '#5b783a'], araDark: '#2c4224' },
  { con: ['#33502f', '#3d6040', '#487a4c'], ara: ['#57713b', '#657f42'], araDark: '#2e4526' },
  { con: ['#38512e', '#41603a', '#4c6f40'], ara: ['#5c7238', '#68803f'], araDark: '#2c4224', blossom: true },
  { con: ['#25522e', '#2e6338', '#3a7a44'], ara: ['#387a34', '#46903c'], araDark: '#1a3d20' },
  { con: ['#25522e', '#2e6338', '#3a7a44'], ara: ['#409040', '#4ea648'], araDark: '#1a3d20', blossom: true },
];

function drawTreeRaw(ctx, t) {
  const s = t.s, x = t.x, y = t.y;
  const pal = TREE_PAL[t.v || 0];
  drawShadow(ctx, x, y, 9 * s);
  if (t.kind === 0) {
    // conifer: tapered trunk + three scalloped cel-shaded layers
    ctx.fillStyle = '#553d24';
    ctx.strokeStyle = '#2e2010';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 2.4 * s, y);
    ctx.lineTo(x - 1.1 * s, y - 15 * s);
    ctx.lineTo(x + 1.1 * s, y - 15 * s);
    ctx.lineTo(x + 2.4 * s, y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6d5232';
    ctx.beginPath(); ctx.moveTo(x - 0.8 * s, y - 2 * s); ctx.lineTo(x - 0.4 * s, y - 10 * s); ctx.stroke();
    coniferLayer(ctx, x, y - 10 * s, 13 * s, 15 * s, pal.con[0], '#1e3018');
    coniferLayer(ctx, x, y - 19 * s, 10 * s, 13 * s, pal.con[1], '#1e3018');
    coniferLayer(ctx, x, y - 27 * s, 7 * s, 11 * s, pal.con[2], '#1e3018');
    // sun-lit tips
    ctx.fillStyle = 'rgba(168,192,110,0.5)';
    ctx.beginPath(); ctx.ellipse(x - 3 * s, y - 34 * s, 2.6 * s, 1.2 * s, -0.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - 5.5 * s, y - 26 * s, 3 * s, 1.2 * s, -0.35, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - 7 * s, y - 17 * s, 3.4 * s, 1.3 * s, -0.3, 0, TAU); ctx.fill();
  } else if (t.kind === 1) {
    // araucaria: tall curved trunk, umbrella rosette crown
    ctx.strokeStyle = '#2e2010';
    ctx.lineWidth = 3.8 * s;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2.5 * s, y - 18 * s, x + 0.5 * s, y - 33 * s); ctx.stroke();
    ctx.strokeStyle = '#5a4128';
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2.5 * s, y - 18 * s, x + 0.5 * s, y - 33 * s); ctx.stroke();
    ctx.strokeStyle = '#7a5c38';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x - 0.7 * s, y - 3 * s); ctx.quadraticCurveTo(x + 1.6 * s, y - 17 * s, x - 0.1 * s, y - 29 * s); ctx.stroke();
    // branch stubs
    ctx.strokeStyle = '#4a3320';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath(); ctx.moveTo(x + 1.8 * s, y - 20 * s); ctx.lineTo(x + 5 * s, y - 23 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 1 * s, y - 14 * s); ctx.lineTo(x - 2.6 * s, y - 16.5 * s); ctx.stroke();
    // crown: under-shadow lobes then lit lobes
    const cyy = y - 35 * s, cxx = x + 0.5 * s;
    ctx.lineWidth = 1;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * (0.08 + 0.84 * i / 5);
        const rr = 10.5 * s - Math.abs(i - 2.5) * 0.8 * s;
        const lx = cxx + Math.cos(a) * rr, ly = cyy + Math.sin(a) * rr * 0.62;
        if (pass === 0) {
          ctx.fillStyle = pal.araDark;
          ctx.beginPath();
          ctx.ellipse(lx + 1.2 * s, ly + 1.6 * s, 6.4 * s, 3 * s, a * 0.35, 0, TAU);
          ctx.fill();
        } else {
          ctx.fillStyle = i % 2 ? pal.ara[0] : pal.ara[1];
          ctx.strokeStyle = '#22351a';
          ctx.beginPath();
          ctx.ellipse(lx, ly, 6.2 * s, 2.9 * s, a * 0.35, 0, TAU);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(178,198,120,0.4)';
          ctx.beginPath();
          ctx.ellipse(lx - 1.2 * s, ly - 1 * s, 3 * s, 1.1 * s, a * 0.3, 0, TAU);
          ctx.fill();
        }
      }
    }
    if (pal.blossom) {
      // scattered magnolia-like blossoms across the crown, petals drifting below
      for (let i = 0; i < 11; i++) {
        const ba = -Math.PI * (0.05 + 0.9 * hash2(i * 7, 3));
        const br = (3 + hash2(i, 11) * 9) * s;
        const bx = cxx + Math.cos(ba) * br, by = cyy + Math.sin(ba) * br * 0.62;
        ctx.fillStyle = i % 3 ? '#e8cdd2' : '#dcb4bd';
        ctx.beginPath(); ctx.arc(bx, by, (0.9 + hash2(i * 3, 5) * 0.7) * s, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c9939e';
        ctx.beginPath(); ctx.arc(bx + 0.3 * s, by + 0.3 * s, 0.35 * s, 0, TAU); ctx.fill();
      }
      // a few fallen petals at the foot of the tree
      ctx.fillStyle = 'rgba(226,190,198,0.8)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(x - 8 * s + hash2(i, 21) * 16 * s, y - 2 + hash2(i * 5, 9) * 4, 1.1 * s, 0.6 * s, i, 0, TAU);
        ctx.fill();
      }
    }
  } else if (t.kind === 2) {
    // dead snag
    ctx.fillStyle = '#7a6a52';
    ctx.strokeStyle = '#3a3226';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 2.6 * s, y);
    ctx.lineTo(x - 1.4 * s, y - 12 * s);
    ctx.lineTo(x - 2.8 * s, y - 19 * s);   // left fork
    ctx.lineTo(x - 1.6 * s, y - 19.5 * s);
    ctx.lineTo(x - 0.2 * s, y - 14 * s);
    ctx.lineTo(x + 1.4 * s, y - 23 * s);   // right fork
    ctx.lineTo(x + 2.6 * s, y - 22.5 * s);
    ctx.lineTo(x + 1.8 * s, y - 10 * s);
    ctx.lineTo(x + 2.8 * s, y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#57493a';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 0.8 * s, y - 2 * s); ctx.lineTo(x, y - 12 * s); ctx.stroke();
  } else {
    // cycad: stubby crosshatched trunk with a rosette of arcing fronds
    ctx.fillStyle = '#6a4e2c';
    ctx.strokeStyle = '#3a2c16';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 3 * s, y);
    ctx.lineTo(x - 2.2 * s, y - 7 * s);
    ctx.lineTo(x + 2.2 * s, y - 7 * s);
    ctx.lineTo(x + 3 * s, y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(58,44,22,0.7)';
    ctx.lineWidth = 0.8;
    for (let k = 0; k < 3; k++) {
      const yy = y - 1.6 * s - k * 1.8 * s;
      ctx.beginPath(); ctx.moveTo(x - 2.5 * s, yy); ctx.lineTo(x + 2.5 * s, yy - 0.8 * s); ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * (0.1 + 0.8 * i / 6);
      const len = (9 + (i % 2) * 2.5) * s;
      const ex = x + Math.cos(a) * len, ey = y - 7 * s + Math.sin(a) * len * 0.8;
      ctx.strokeStyle = i % 2 ? '#5d7a33' : '#6f8e3d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 7 * s);
      ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.6, y - 7 * s + Math.sin(a) * len * 0.9 - 2 * s, ex, ey);
      ctx.stroke();
    }
  }
}

function drawRock(ctx, r) {
  const s = q1(r.s);
  const w = Math.ceil(18 * s) + 6, h = Math.ceil(11 * s) + 6;
  const sp = cachedSprite('rock_' + s, w, h, w / 2, h - 3,
    (c) => drawRockRaw(c, { x: 0, y: 0, s }));
  ctx.drawImage(sp.cv, r.x - sp.ox, r.y - sp.oy, sp.w, sp.h);
}

function drawRockRaw(ctx, r) {
  const s = r.s, x = r.x, y = r.y;
  drawShadow(ctx, x, y, 7 * s);
  // main mass
  ctx.beginPath();
  ctx.moveTo(x - 7 * s, y);
  ctx.lineTo(x - 5.6 * s, y - 4.6 * s);
  ctx.lineTo(x - 1.2 * s, y - 7 * s);
  ctx.lineTo(x + 3.6 * s, y - 5.6 * s);
  ctx.lineTo(x + 7 * s, y - 2 * s);
  ctx.lineTo(x + 6.4 * s, y);
  ctx.closePath();
  ctx.fillStyle = '#8b8577'; ctx.fill();
  ctx.strokeStyle = '#43403a'; ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.stroke();
  // lit top facet
  ctx.fillStyle = '#a7a291';
  ctx.beginPath();
  ctx.moveTo(x - 5.6 * s, y - 4.6 * s);
  ctx.lineTo(x - 1.2 * s, y - 7 * s);
  ctx.lineTo(x + 3.6 * s, y - 5.6 * s);
  ctx.lineTo(x - 0.6 * s, y - 3.6 * s);
  ctx.closePath(); ctx.fill();
  // shadowed right facet
  ctx.fillStyle = '#6f6a5e';
  ctx.beginPath();
  ctx.moveTo(x + 3.6 * s, y - 5.6 * s);
  ctx.lineTo(x + 7 * s, y - 2 * s);
  ctx.lineTo(x + 6.4 * s, y);
  ctx.lineTo(x + 1.8 * s, y);
  ctx.closePath(); ctx.fill();
  // crack
  ctx.strokeStyle = 'rgba(58,54,46,0.8)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 0.6 * s, y - 3.6 * s);
  ctx.lineTo(x - 1.6 * s, y - 1.4 * s);
  ctx.lineTo(x - 0.8 * s, y);
  ctx.stroke();
  // grass at the base
  ctx.strokeStyle = '#7d7a40';
  ctx.beginPath(); ctx.moveTo(x - 6 * s, y); ctx.lineTo(x - 7 * s, y - 2.4 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 5 * s, y); ctx.lineTo(x + 6 * s, y - 2 * s); ctx.stroke();
}

function drawFern(ctx, f) {
  const s = q1(f.s);
  if (f.food <= 0) { // grazed stub
    ctx.strokeStyle = '#4c5a2c'; ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + i * 2 * s, f.y - 3 * s); ctx.stroke();
    }
    return;
  }
  const w = Math.ceil(30 * s) + 6, h = Math.ceil(16 * s) + 6;
  const sp = cachedSprite('fern_' + s, w, h, w / 2, h - 3,
    (c) => drawFernRaw(c, s));
  const flip = hash2(Math.round(f.x), Math.round(f.y)) > 0.5 ? -1 : 1;
  const sway = Math.sin(G.time * 1.4 + f.x * 0.13) * 0.06;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(sway);
  ctx.scale(flip, 1);
  ctx.drawImage(sp.cv, -sp.ox, -sp.oy, sp.w, sp.h);
  ctx.restore();
}

function drawFernRaw(ctx, s) {
  // base shadow
  ctx.fillStyle = 'rgba(28,32,10,0.16)';
  ctx.beginPath(); ctx.ellipse(0, 0.5, 7 * s, 2 * s, 0, 0, TAU); ctx.fill();
  // two layers of fronds: dark behind, bright in front, with leaflet teeth
  for (let layer = 0; layer < 2; layer++) {
    const nf = layer === 0 ? 5 : 4;
    const colR = layer === 0 ? '#3f632a' : '#5d8c3a';
    const colL = layer === 0 ? '#365723' : '#517c32';
    for (let i = 0; i < nf; i++) {
      const a = -Math.PI / 2 + (i - (nf - 1) / 2) * (layer === 0 ? 0.55 : 0.4);
      const len = (layer === 0 ? 10 : 8.5) * s * (1 + (i % 2) * 0.25);
      const cxx = Math.cos(a + 0.12) * len * 0.55, cyy = Math.sin(a) * len * 0.7 - 2 * s;
      const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
      // rib
      ctx.strokeStyle = colR;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(cxx, cyy, ex, ey);
      ctx.stroke();
      // leaflets along the rib
      ctx.strokeStyle = colL;
      ctx.lineWidth = 1;
      for (let k = 2; k <= 4; k++) {
        const tt = k / 5;
        const px = (1 - tt) * (1 - tt) * 0 + 2 * (1 - tt) * tt * cxx + tt * tt * ex;
        const py = (1 - tt) * (1 - tt) * 0 + 2 * (1 - tt) * tt * cyy + tt * tt * ey;
        const la = a + 0.9, lb = a - 0.9;
        const ll = 2.2 * s * (1 - tt * 0.5);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(la) * ll, py + Math.sin(la) * ll); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(lb) * ll, py + Math.sin(lb) * ll); ctx.stroke();
      }
      // curled tip
      ctx.fillStyle = colR;
      ctx.beginPath(); ctx.arc(ex, ey, 0.9 * s, 0, TAU); ctx.fill();
    }
  }
}

function drawHorsetail(ctx, h) {
  const s = q1(h.s);
  if (h.food <= 0) {
    ctx.strokeStyle = '#5c6e2e'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x, h.y - 3 * s); ctx.stroke();
    return;
  }
  const w = Math.ceil(18 * s) + 8, hh2 = Math.ceil(20 * s) + 8;
  const sp = cachedSprite('horsetail_' + s, w, hh2, w / 2, hh2 - 3,
    (c) => drawHorsetailRaw(c, s));
  const sway = Math.sin(G.time * 1.7 + h.y * 0.11) * 0.07;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(sway);
  ctx.drawImage(sp.cv, -sp.ox, -sp.oy, sp.w, sp.h);
  ctx.restore();
}

function drawHorsetailRaw(ctx, s) {
  const x = 0, y = 0;
  ctx.fillStyle = 'rgba(28,32,10,0.14)';
  ctx.beginPath(); ctx.ellipse(x, y + 0.5, 6 * s, 1.6 * s, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 5; i++) {
    const bx = x + (i - 2) * 2.6 * s;
    const hgt = (11 + (i % 3) * 4) * s;
    const lean = (i - 2) * 0.5 * s;
    // stalk
    ctx.strokeStyle = i % 2 ? '#6f9a38' : '#7fae42';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx, y);
    ctx.quadraticCurveTo(bx + lean * 0.4, y - hgt * 0.6, bx + lean, y - hgt);
    ctx.stroke();
    // whorls of thin side needles at each joint
    ctx.strokeStyle = '#4c6a24';
    ctx.lineWidth = 0.9;
    for (let k = 1; k <= 3; k++) {
      const tt = k / 4;
      const jx = bx + lean * tt * tt, jy = y - hgt * tt;
      ctx.beginPath(); ctx.moveTo(jx, jy); ctx.lineTo(jx - 2.2 * s * (1 - tt * 0.4), jy - 1.2 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(jx, jy); ctx.lineTo(jx + 2.2 * s * (1 - tt * 0.4), jy - 1.2 * s); ctx.stroke();
    }
    // spore cone tip
    ctx.fillStyle = '#a8963e';
    ctx.strokeStyle = '#5c4c1e';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(bx + lean, y - hgt - 1.4 * s, 1 * s, 1.7 * s, lean * 0.05, 0, TAU);
    ctx.fill(); ctx.stroke();
  }
}

function drawNest(ctx, n, eggs) {
  drawShadow(ctx, n.x, n.y + 2, 18);
  // outer twig ring: two-tone crosshatched sticks
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? '#4f3a1e' : '#7a5c34';
    ctx.lineWidth = pass === 0 ? 2.2 : 1.4;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + pass * 0.2;
      const r1 = 13 + hash2(i, 3 + pass) * 5;
      const x1 = n.x + Math.cos(a) * r1, y1 = n.y + Math.sin(a) * r1 * 0.45 - 2;
      const x2 = n.x + Math.cos(a + 0.55) * (r1 + 3.5), y2 = n.y + Math.sin(a + 0.55) * (r1 + 3.5) * 0.45 - 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }
  // bowl
  ctx.fillStyle = '#8a6a40';
  ctx.beginPath(); ctx.ellipse(n.x, n.y - 1, 13, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5f4626';
  ctx.beginPath(); ctx.ellipse(n.x, n.y - 0.5, 9.5, 4.2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#74562e';
  ctx.beginPath(); ctx.ellipse(n.x, n.y + 0.4, 8, 3.2, 0, 0, TAU); ctx.fill();
  // inner straw lines
  ctx.strokeStyle = 'rgba(160,130,80,0.6)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI + 0.3;
    ctx.beginPath();
    ctx.moveTo(n.x - Math.cos(a) * 7, n.y + 0.5 - Math.sin(a) * 2.4);
    ctx.lineTo(n.x + Math.cos(a) * 7, n.y + 0.5 + Math.sin(a) * 2.4);
    ctx.stroke();
  }
  drawEgg(ctx, n.x - 5, n.y, 1, true);
  if (eggs) { drawEgg(ctx, n.x + 4, n.y - 1, 0.9, false); drawEgg(ctx, n.x, n.y + 2, 0.85, false); }
}

// ---------- props: undergrowth & set dressing ----------
const PROP_DIMS = {
  bush: { w: 32, h: 22 }, log: { w: 34, h: 18 }, mushroom: { w: 18, h: 13 },
  tallgrass: { w: 26, h: 22 }, ribcage: { w: 32, h: 18 }, waterrock: { w: 30, h: 16 },
  skull: { w: 34, h: 24 },
  cavemouth: { w: 64, h: 52 }, snowdrift: { w: 40, h: 20 },
};
const PROP_DRAW = {
  bush(c, s, v) {
    const dark = v ? '#565a2e' : '#2f4526', mid = v ? '#767a40' : '#476338';
    const lite = v ? '#989a54' : '#5f7d46', line = v ? '#33351a' : '#1e3018';
    drawShadow(c, 0, 0, 10 * s);
    c.fillStyle = dark;
    c.beginPath(); c.ellipse(0, -4 * s, 10.5 * s, 6.5 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = line; c.lineWidth = 1;
    for (const [bx, by, br] of [[-5.5, -7, 5.5], [5, -6.5, 5], [0, -9.5, 6.5]]) {
      c.fillStyle = mid;
      c.beginPath(); c.arc(bx * s, by * s, br * s, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = lite;
      c.beginPath(); c.ellipse((bx - br * 0.3) * s, (by - br * 0.4) * s, br * 0.55 * s, br * 0.32 * s, -0.4, 0, TAU); c.fill();
    }
    // leaf ticks
    c.strokeStyle = line; c.lineWidth = 0.8;
    for (const [tx2, ty2] of [[-6, -9], [2, -12], [7, -8]]) {
      c.beginPath(); c.moveTo(tx2 * s, ty2 * s); c.lineTo((tx2 + 1.6) * s, (ty2 - 1.6) * s); c.stroke();
    }
  },
  log(c, s) {
    drawShadow(c, 0, 1, 13 * s);
    // trunk
    c.fillStyle = '#6b4e2e'; c.strokeStyle = '#33210f'; c.lineWidth = 1;
    c.beginPath(); c.roundRect(-13 * s, -7 * s, 25 * s, 6.4 * s, 2.5 * s); c.fill(); c.stroke();
    // bark lines
    c.strokeStyle = 'rgba(50,33,15,0.6)'; c.lineWidth = 0.8;
    for (const ly of [-5.4, -3.4]) {
      c.beginPath(); c.moveTo(-10 * s, ly * s); c.lineTo(8 * s, (ly + 0.4) * s); c.stroke();
    }
    // sawn end cap with growth rings
    c.fillStyle = '#9a7848'; c.strokeStyle = '#33210f';
    c.beginPath(); c.ellipse(12 * s, -3.8 * s, 2.6 * s, 3.4 * s, 0, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = '#6b4e2e'; c.lineWidth = 0.7;
    c.beginPath(); c.ellipse(12 * s, -3.8 * s, 1.4 * s, 1.9 * s, 0, 0, TAU); c.stroke();
    // moss on top
    c.fillStyle = 'rgba(96,128,64,0.85)';
    c.beginPath(); c.ellipse(-5 * s, -7.2 * s, 5.5 * s, 1.6 * s, 0.05, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(3 * s, -6.8 * s, 3 * s, 1.1 * s, -0.05, 0, TAU); c.fill();
    // branch stub
    c.strokeStyle = '#4a3320'; c.lineWidth = 1.6 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8 * s, -6.5 * s); c.lineTo(-10.5 * s, -11 * s); c.stroke();
  },
  mushroom(c, s) {
    for (const [mx, sc] of [[-4.5, 0.75], [0.5, 1], [5, 0.6]]) {
      const ss = s * sc;
      c.fillStyle = '#d8cba8'; c.strokeStyle = '#5c452a'; c.lineWidth = 0.8;
      c.beginPath(); c.roundRect(mx * s - 1.2 * ss, -5.5 * ss, 2.4 * ss, 5.5 * ss, 1 * ss); c.fill(); c.stroke();
      c.fillStyle = '#a45f38';
      c.beginPath();
      c.moveTo(mx * s - 4 * ss, -5 * ss);
      c.quadraticCurveTo(mx * s, -10.5 * ss, mx * s + 4 * ss, -5 * ss);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(240,225,195,0.8)';
      c.beginPath(); c.arc(mx * s - 1.4 * ss, -7 * ss, 0.7 * ss, 0, TAU); c.fill();
      c.beginPath(); c.arc(mx * s + 1.2 * ss, -6.4 * ss, 0.5 * ss, 0, TAU); c.fill();
    }
  },
  cavemouth(c, s) {
    // a dark opening in a snow-capped rock face — shelter from the wind
    drawShadow(c, 0, 0, 22 * s);
    // rock shoulders
    c.fillStyle = '#4a4b55'; c.strokeStyle = '#26272e'; c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-26 * s, 2 * s);
    c.quadraticCurveTo(-30 * s, -22 * s, -8 * s, -26 * s);
    c.quadraticCurveTo(14 * s, -30 * s, 26 * s, -20 * s);
    c.quadraticCurveTo(32 * s, -6 * s, 26 * s, 2 * s);
    c.closePath(); c.fill(); c.stroke();
    // snow cap on the crag
    c.fillStyle = '#eaf1f8';
    c.beginPath();
    c.moveTo(-24 * s, -18 * s);
    c.quadraticCurveTo(-6 * s, -30 * s, 24 * s, -19 * s);
    c.quadraticCurveTo(6 * s, -24 * s, -8 * s, -23 * s);
    c.quadraticCurveTo(-18 * s, -22 * s, -24 * s, -18 * s);
    c.closePath(); c.fill();
    // the black mouth
    c.fillStyle = '#0b0c12';
    c.beginPath();
    c.moveTo(-13 * s, 2 * s);
    c.quadraticCurveTo(-16 * s, -18 * s, 0, -20 * s);
    c.quadraticCurveTo(16 * s, -18 * s, 13 * s, 2 * s);
    c.closePath(); c.fill();
    // a faint inner glow so it reads as depth, not a hole
    c.fillStyle = 'rgba(90,110,150,0.22)';
    c.beginPath(); c.ellipse(0, -7 * s, 9 * s, 8 * s, 0, 0, TAU); c.fill();
  },
  snowdrift(c, s) {
    // a soft wind-blown mound of snow with a blue shadow side
    c.fillStyle = 'rgba(120,140,170,0.28)';
    c.beginPath(); c.ellipse(2 * s, 1 * s, 18 * s, 5 * s, 0, 0, TAU); c.fill();
    c.fillStyle = '#e7eef7';
    c.beginPath();
    c.moveTo(-18 * s, 0);
    c.quadraticCurveTo(-10 * s, -10 * s, 2 * s, -9 * s);
    c.quadraticCurveTo(16 * s, -8 * s, 18 * s, 0);
    c.closePath(); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(-14 * s, -1 * s);
    c.quadraticCurveTo(-8 * s, -8 * s, 0, -7.5 * s);
    c.quadraticCurveTo(8 * s, -7 * s, 10 * s, -2 * s);
    c.quadraticCurveTo(-2 * s, -5 * s, -14 * s, -1 * s);
    c.closePath(); c.fill();
  },
  tallgrass(c, s) {
    c.fillStyle = 'rgba(30,32,12,0.15)';
    c.beginPath(); c.ellipse(0, 0.5, 7 * s, 1.8 * s, 0, 0, TAU); c.fill();
    const cols = ['#a89a54', '#8f8a4a', '#bcb56a'];
    for (let i = 0; i < 9; i++) {
      const bx = (i - 4) * 1.4 * s;
      const tall = (11 + ((i * 5) % 3) * 3.4) * s;
      const lean = (i - 4) * 0.9 * s;
      c.strokeStyle = cols[i % 3];
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(bx, 0);
      c.quadraticCurveTo(bx + lean * 0.4, -tall * 0.62, bx + lean, -tall);
      c.stroke();
    }
    // seed heads
    c.fillStyle = '#c9b465';
    for (const i of [1, 4, 7]) {
      const bx = (i - 4) * 1.4 * s, tall = (11 + ((i * 5) % 3) * 3.4) * s, lean = (i - 4) * 0.9 * s;
      c.beginPath(); c.ellipse(bx + lean, -tall, 1 * s, 2 * s, lean * 0.04, 0, TAU); c.fill();
    }
  },
  ribcage(c, s) {
    drawShadow(c, 0, 0, 11 * s);
    c.strokeStyle = '#8a7f66';
    c.lineWidth = Math.max(1.4, 2 * s);
    c.lineCap = 'round';
    // sun-bleached ribs
    for (let i = 0; i < 4; i++) {
      const cx2 = (-6 + i * 3.6) * s;
      const rr = (7.5 - i * 1.1) * s;
      c.strokeStyle = '#8a7f66';
      c.beginPath(); c.arc(cx2 + 0.6, -0.4, rr, Math.PI * 1.05, Math.PI * 1.75); c.stroke();
      c.strokeStyle = '#ddd2b8';
      c.beginPath(); c.arc(cx2, -1, rr, Math.PI * 1.05, Math.PI * 1.75); c.stroke();
    }
    // spine ridge
    c.strokeStyle = '#ddd2b8';
    c.beginPath(); c.moveTo(-10 * s, -7 * s); c.quadraticCurveTo(0, -9.5 * s, 8 * s, -6.5 * s); c.stroke();
    // a scattered long bone
    c.beginPath(); c.moveTo(8 * s, -0.5 * s); c.lineTo(13 * s, -2.5 * s); c.stroke();
    c.fillStyle = '#ddd2b8';
    c.beginPath(); c.arc(13.4 * s, -2.9 * s, 1.1 * s, 0, TAU); c.fill();
  },
  skull(c, s) {
    // the prairie's namesake: a huge weathered ceratopsian skull, half-sunk
    drawShadow(c, 0, 0, 13 * s);
    c.lineJoin = 'round';
    // frill shield behind
    c.fillStyle = '#c9bd9f'; c.strokeStyle = '#57503e'; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-4 * s, -2 * s);
    c.quadraticCurveTo(-15 * s, -5 * s, -14.5 * s, -13 * s);
    c.quadraticCurveTo(-13 * s, -19 * s, -5.5 * s, -18.5 * s);
    c.quadraticCurveTo(-1 * s, -18 * s, 0.5 * s, -13 * s);
    c.lineTo(0, -3 * s);
    c.closePath(); c.fill(); c.stroke();
    // frill scallops
    c.strokeStyle = 'rgba(87,80,62,0.7)'; c.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(-12 * s + i * 3.4 * s, -16.5 * s + Math.abs(i - 1) * 1.2 * s, 1.4 * s, Math.PI * 0.9, Math.PI * 1.9);
      c.stroke();
    }
    // face + beak
    c.fillStyle = '#ddd2b8'; c.strokeStyle = '#57503e'; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-1 * s, -14 * s);
    c.quadraticCurveTo(6 * s, -14.5 * s, 10 * s, -8 * s);   // snout top
    c.quadraticCurveTo(13.5 * s, -4.5 * s, 12 * s, -1 * s); // hooked beak
    c.lineTo(9 * s, 0);
    c.lineTo(-2 * s, 0);
    c.closePath(); c.fill(); c.stroke();
    // brow horn
    c.fillStyle = '#e8dfc8';
    c.beginPath();
    c.moveTo(1.5 * s, -13 * s);
    c.quadraticCurveTo(3 * s, -21 * s, 7.5 * s, -22 * s);
    c.quadraticCurveTo(4.5 * s, -18 * s, 4.5 * s, -12.5 * s);
    c.closePath(); c.fill(); c.stroke();
    // eye socket + nostril: the dark hollows that make it read as bone
    c.fillStyle = '#2c2618';
    c.beginPath(); c.ellipse(2.2 * s, -8.5 * s, 2.6 * s, 3 * s, 0.15, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(8.6 * s, -4.5 * s, 1.3 * s, 1.7 * s, 0.3, 0, TAU); c.fill();
    // crack + half-buried grass
    c.strokeStyle = 'rgba(87,80,62,0.8)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-3 * s, -12 * s); c.lineTo(-1.5 * s, -6 * s); c.lineTo(-3.5 * s, -2 * s); c.stroke();
    c.strokeStyle = '#7d7a40';
    c.beginPath(); c.moveTo(-9 * s, 0); c.lineTo(-10.5 * s, -3 * s); c.stroke();
    c.beginPath(); c.moveTo(11 * s, 0); c.lineTo(12.5 * s, -2.6 * s); c.stroke();
  },
  waterrock(c, s) {
    // ripple rings
    c.strokeStyle = 'rgba(225,240,238,0.35)'; c.lineWidth = 1;
    c.beginPath(); c.ellipse(0, -1, 11 * s, 4.4 * s, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(225,240,238,0.16)';
    c.beginPath(); c.ellipse(0, -1, 13.5 * s, 5.6 * s, 0, 0, TAU); c.stroke();
    // dark waterline
    c.fillStyle = 'rgba(28,48,56,0.55)';
    c.beginPath(); c.ellipse(0, -0.6, 7.6 * s, 3.2 * s, 0, 0, TAU); c.fill();
    // wet boulder
    c.fillStyle = '#6f6a5e'; c.strokeStyle = '#3a3830'; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-6.5 * s, -1);
    c.lineTo(-4.6 * s, -5.5 * s);
    c.lineTo(0.5 * s, -7.5 * s);
    c.lineTo(4.8 * s, -4.5 * s);
    c.lineTo(6.5 * s, -1);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#8d8779';
    c.beginPath();
    c.moveTo(-4.6 * s, -5.5 * s); c.lineTo(0.5 * s, -7.5 * s); c.lineTo(2.4 * s, -5.4 * s); c.lineTo(-2 * s, -4 * s);
    c.closePath(); c.fill();
  },
};

function drawProp(ctx, p) {
  const s = q1(p.s), v = p.v || 0;
  const d = PROP_DIMS[p.kind];
  const w = Math.ceil(d.w * s) + 8, h = Math.ceil(d.h * s) + 8;
  const sp = cachedSprite('prop_' + p.kind + '_' + s + '_' + v, w, h, w / 2, h - 4,
    (c) => PROP_DRAW[p.kind](c, s, v));
  if (p.kind === 'tallgrass') {
    const sway = Math.sin(G.time * 1.5 + p.x * 0.11) * 0.05;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(sway);
    ctx.drawImage(sp.cv, -sp.ox, -sp.oy, sp.w, sp.h);
    ctx.restore();
  } else if (p.flip === -1) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(-1, 1);
    ctx.drawImage(sp.cv, -sp.ox, -sp.oy, sp.w, sp.h);
    ctx.restore();
  } else {
    ctx.drawImage(sp.cv, p.x - sp.ox, p.y - sp.oy, sp.w, sp.h);
  }
}

// animated lapping foam along the riverbanks — the bank curve is a known
// function, so the water's edge can gently breathe against it
function drawShoreFoam(ctx, camX, camY, vw, vh) {
  if (!World.hasRiver) return;                            // the breathing bank line is the river's
  if (camX + vw < RIVER_X0 || camX > RIVER_X1) return;    // river bounds
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    let drawing = false;
    for (let py = camY - 24; py <= camY + vh + 24; py += 9) {
      const ty = py / TILE;
      const lap = Math.sin(G.time * 1.7 + ty * 2.6 + side * 1.3) * 1.4
        + Math.sin(G.time * 0.9 + ty * 1.1) * 0.8;
      const x = (riverX(ty) + side * (riverW(ty) + 0.55 + shoreWobT(ty) * 0.7)) * TILE - side * 1.5 + side * lap;
      if (!drawing) { ctx.moveTo(x, py); drawing = true; }
      else ctx.lineTo(x, py);
    }
    const pulse = 0.16 + 0.10 * Math.sin(G.time * 1.3 + side * 2);
    ctx.strokeStyle = 'rgba(238,250,248,' + pulse.toFixed(3) + ')';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
}

// water shimmer over the prerendered ground (animated, viewport only)
function drawWaterShimmer(ctx, camX, camY, vw, vh) {
  const tx0 = Math.floor(camX / TILE), ty0 = Math.floor(camY / TILE);
  const tx1 = Math.ceil((camX + vw) / TILE), ty1 = Math.ceil((camY + vh) / TILE);
  // moonlight silvers the water at night
  const nightF = (G.day && G.day.nightF) || 0;
  const glintBoost = 1 + nightF * 1.3;
  ctx.strokeStyle = nightF > 0.4 ? 'rgba(215,230,255,0.28)' : 'rgba(225,240,240,0.20)';
  ctx.lineWidth = 1;
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (tx < 0 || ty < 0 || tx >= WT || ty >= HT) continue;
      const t = World.ter[tIdx(tx, ty)];
      if (t === T_LAVA) {
        // popping embers and a slow molten pulse over the lava
        const hL = hash2(tx * 5 + 3, ty * 7 + 1);
        if (hL > 0.35) {
          const phL = (G.time * (0.7 + hL) + hL * 7) % 2.4;
          if (phL < 1) {
            const aL = Math.sin(phL * Math.PI);
            ctx.fillStyle = 'rgba(255,220,120,' + (0.5 * aL).toFixed(3) + ')';
            const lx = tx * TILE + hL * 18 + 2, ly = ty * TILE + ((hL * 73) % 1) * 18 + 2;
            ctx.fillRect(lx, ly - aL * 3, 2, 2);
          }
        }
        continue;
      }
      if (t !== T_WATER && t !== T_DEEP) continue;
      const h = hash2(tx * 3 + 7, ty * 5 + 2);
      if (h < 0.55) continue;
      const ph = (G.time * (0.5 + h) + h * 9) % 3;
      if (ph > 1.1) continue;
      const x = tx * TILE + h * 14, y = ty * TILE + ((h * 91) % 1) * 20;
      const a = 1 - Math.abs(ph - 0.55) / 0.55;
      if (h > 0.9) {
        // sun glint: a tiny twinkling cross
        ctx.globalAlpha = Math.min(1, 0.55 * a * glintBoost);
        ctx.beginPath(); ctx.moveTo(x - 2.5, y); ctx.lineTo(x + 2.5, y);
        ctx.moveTo(x, y - 2.5); ctx.lineTo(x, y + 2.5);
        ctx.stroke();
      } else {
        ctx.globalAlpha = 0.22 * a;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 5, y - 1.5, x + 10, y);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

// spawn position helpers (per-eco open ranges: valley plains sit east of the
// river, prairie stops before the swamp, coast stops before the surf)
const PLAINS_RANGE = {
  valley: { xa: 0.58, xb: 0.97, yb: 0.95 },
  prairie: { xa: 0.04, xb: 0.96, yb: 0.78 },
  coast: { xa: 0.05, xb: 0.80, yb: 0.95 },
  ash: { xa: 0.04, xb: 0.94, yb: 0.95 },
  delta: { xa: 0.03, xb: 0.97, yb: 0.92 },   // stop before the drowned south
};
function randPlainsPos() {
  const R = PLAINS_RANGE[World.eco] || PLAINS_RANGE.prairie;
  for (let k = 0; k < 60; k++) {
    const x = rrange(R.xa, R.xb) * WORLD_W, y = rrange(0.05, R.yb) * WORLD_H;
    if (!isWaterPx(x, y) && !isMudPx(x, y) && !isLavaPx(x, y) && forestShadePx(x, y) < 0.3) return { x, y };
  }
  return { x: WORLD_W * 0.7, y: WORLD_H * 0.4 };
}
function randBeachPos() {
  // dry ground within a stroll of the surf (eastern shore on the coast map)
  for (let k = 0; k < 80; k++) {
    const x = rrange(0.78, 0.92) * WORLD_W, y = rrange(0.06, 0.94) * WORLD_H;
    if (isWaterPx(x, y) || isMudPx(x, y)) continue;
    if (terAtPx(x, y) === T_SAND || nearWaterPx(x, y, 60)) return { x, y };
  }
  return { x: WORLD_W * 0.84, y: WORLD_H * 0.5 };
}
function randSeaPos() {
  // open sea water: the coast's is off the eastern beach, the delta's is the
  // drowned south — wherever the map keeps its biggest, deepest water
  const inSea = World.eco === 'delta'
    ? (p) => p.y > WORLD_H * 0.88
    : (p) => p.x > WORLD_W * 0.82;
  for (let k = 0; k < 60; k++) {
    const p = randWaterPos();
    if (inSea(p)) return p;
  }
  return World.eco === 'delta'
    ? { x: WORLD_W * 0.5, y: WORLD_H * 0.95 }
    : { x: WORLD_W * 0.92, y: WORLD_H * 0.5 };
}
function randLakePos() {
  // inland water — the coast's lake west of the surf; the delta's channels
  // and lagoons north of the sea
  const inland = World.eco === 'delta'
    ? (p) => p.y < WORLD_H * 0.84
    : (p) => p.x < WORLD_W * 0.72;
  for (let k = 0; k < 60; k++) {
    const p = randWaterPos();
    if (inland(p)) return p;
  }
  return randWaterPos();
}
function randForestPos() {
  const xa = World.eco === 'valley' ? 0.05 : 0.04, xb = World.eco === 'valley' ? 0.45 : 0.96;
  for (let k = 0; k < 60; k++) {
    const x = rrange(xa, xb) * WORLD_W, y = rrange(0.05, 0.95) * WORLD_H;
    if (!isWaterPx(x, y) && !isMudPx(x, y) && !isLavaPx(x, y) && forestShadePx(x, y) > 0.35) return { x, y };
  }
  return World.eco === 'valley' ? { x: WORLD_W * 0.25, y: WORLD_H * 0.5 } : randPlainsPos();
}
function randWaterPos() {
  if (!World.waterTiles.length) return { x: WORLD_W / 2, y: WORLD_H / 2 };
  for (let k = 0; k < 40; k++) {
    const p = waterTilePos(World.waterTiles[Math.floor(rnd() * World.waterTiles.length)]);
    if (isWaterPx(p.x, p.y)) return p;
  }
  return waterTilePos(World.waterTiles[0]);
}
