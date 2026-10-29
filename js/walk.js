'use strict';
// ============================================================================
// THE GREAT WALK — every species' ending (docs/endgame-proposal.md)
// ----------------------------------------------------------------------------
// hatch → Full Adult (♀ and ♂) → mate → eggs → young → THE GREAT WALK → SETTLED
//
// The moment the last of a clutch reaches sub-adult, the season turns on its
// own: the land's hazard comes on for real, a rival that matches you in diet
// and build starts hunting the young, and you lead the family to the land's
// landmark (World.landmark, placed by world.js). Arrive with enough young
// alive — how many depends on how fast, strong and quick-growing the species
// is — and the ending plays: the young walk off into the land in your
// colours, and they stay there. Every later visit to that land, with any
// dinosaur, they are out there: your bloodline. A fresh egg of a settled
// species hatches into the next generation, with a small inherited edge.
//
// Stages on G.nesting: 'babies' → 'walk' → 'cine' → 'accepted' (settled), or
// back to 'babies' if too many young fall. Nothing is ever deleted on failure.
// ============================================================================

const ROMAN_N = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
function roman(n) { return ROMAN_N[n] || String(n); }

// the season that turns, per land: what the land throws at a walking family
const WALK_SEASONS = {
  valley: { name: 'THE HUNTERS GATHER', kind: 'raids', line: 'every hunter in the valley has caught the scent' },
  prairie: { name: 'THE LONG DRY', kind: 'dry', line: 'the ponds are going to mud — drink where you can' },
  coast: { name: 'THE STORM SURGE', kind: 'flood', line: 'the sea is coming over the grass' },
  ash: { name: 'THE MOUNTAIN WAKES', kind: 'erupt', line: 'the sky is throwing fire' },
  delta: { name: 'THE FLOOD', kind: 'flood', line: 'every channel is climbing its banks' },
  wall: { name: 'THE STORM THAT DOES NOT PASS', kind: 'blizzard', line: 'the whiteout will not lift until you arrive' },
  moor: { name: 'THE LONG NIGHT', kind: 'night', line: 'the mist closes in for good' },
  jungle: { name: 'THE ENDLESS RAIN', kind: 'flood', line: 'the monsoon will not break' },
  desert: { name: 'THE SAND THAT WALKS', kind: 'sand', line: 'the storms come one after another' },
};

function walkActive() {
  const ns = G.nesting;
  return !!(ns && ns.stage === 'walk' && ns.walk && G.player && G.player.alive);
}
function walkForces(kind) { return walkActive() && G.nesting.walk.season.kind === kind; }

// how many young must reach the landmark: fast, strong, quick-growing young
// are expected home in numbers; fragile, slow-growing ones need only one
function walkNeeded(sp) {
  const d = PLAYER_DEF[sp];
  const score = Math.sqrt(d.hp / 1200) * (d.speed / 125) * Math.sqrt(d.growthRate || 1);
  return score >= 1.15 ? 3 : score >= 0.75 ? 2 : 1;
}

// the rival: the land's animal that most resembles you — same diet first,
// then the closest health, bite and speed (never your own species)
function pickRival(p) {
  const def = PLAYER_DEF[p.species], gm = genderMod(p);
  const hp = def.hp * gm.hp, dmg = def.dmg * gm.dmg, spd = def.speed;
  const seen = new Set();
  let best = null, bs = 1e9;
  for (const s of ECO_SPAWNS[World.eco] || []) {
    const sp = s.sp;
    if (seen.has(sp)) continue;
    seen.add(sp);
    const nd = NPC_DEF[sp];
    if (!nd || nd.aquatic || DINO[sp].fish || !(nd.dmg > 0) || sp === p.species) continue;
    let score = Math.abs(Math.log(nd.hp / hp)) + Math.abs(Math.log(nd.dmg / dmg)) + 0.7 * Math.abs(Math.log(nd.speed / spd));
    if (DINO[sp].diet !== def.diet) score += 3;
    if (score < bs) { bs = score; best = sp; }
  }
  return best;
}

function walkGround(x, y) {
  return x > 40 && y > 40 && x < WORLD_W - 40 && y < WORLD_H - 40 &&
    !isWaterPx(x, y) && !isLavaPx(x, y) && !isCliffPx(x, y);
}
function aliveYoung() {
  const ns = G.nesting;
  return (ns && ns.babies || []).filter(b => b.hp > 0 && G.npcs.includes(b));
}
function centroidOf(list) {
  if (!list.length) return null;
  let x = 0, y = 0;
  for (const e of list) { x += e.x; y += e.y; }
  return { x: x / list.length, y: y / list.length };
}

// the young are grown enough to fight now
function armYoung(b) {
  const def = PLAYER_DEF[G.player.species];
  const d = b.mateDef;
  d.dmg = def.dmg * dmgFrac(b.growth) * 0.55;
  d.reach = def.reach * 0.8;
  d.atkCd = def.atkCd * 1.3;
  d.detect = 220; d.homeR = 200;
}

// ---------- departure ----------
function startWalk() {
  const ns = G.nesting, p = G.player;
  let lm = World.landmark;
  // the Wall: the secret cave, if you ever found it — the summit otherwise
  if (World.eco === 'wall' && Save.owned && Save.owned.nivalo) {
    const cv = (World.caves || []).find(c => c.secret);
    if (cv) lm = { x: cv.x, y: cv.y + 30, r: 110, name: 'the secret cave' };
  }
  const young = aliveYoung();
  const season = WALK_SEASONS[World.eco] || WALK_SEASONS.valley;
  ns.stage = 'walk';
  ns.guardian = 'player';     // they walk with YOU now, whoever raised them
  ns.walkTried = true;        // one walk per clutch
  ns.walk = {
    lm, season, start: G.time, clutch: young.length,
    need: Math.min(walkNeeded(p.species), young.length),
    raidT: 10, frontT: 18, rival: null, rivalT: rrange(14, 22), gather: false,
  };
  for (const b of young) armYoung(b);
  // the call goes out over the whole land
  p.call = { k: 1, t: 0, dur: 2.2, fired: true };
  SFX.call(1, p.species, 1);
  G.shake = Math.min(5, G.shake + 3);
  G.banner = { str: '⚜ THE GREAT WALK — ' + season.name + '. Lead your young to ' + lm.name.toUpperCase() + '!', t: 8, color: '#ffd23e' };
  floatText(p.x, p.y - 70, season.line, '#ffe9a0');
}

// ---------- the walk, every tick (from updateNesting) ----------
function updateWalk(dt) {
  const ns = G.nesting, W = ns.walk, p = G.player, def = PLAYER_DEF[p.species];
  if (!W) { ns.stage = 'babies'; return; }
  // the young: still growing (never past adult on the road), healing slowly
  // — and the fallen are counted
  for (let i = ns.babies.length - 1; i >= 0; i--) {
    const b = ns.babies[i];
    if (!G.npcs.includes(b) || b.hp <= 0) {
      ns.babies.splice(i, 1);
      G.banner = { str: 'One of your young has fallen… ' + aliveYoung().length + ' still walk with you.', t: 5, color: '#ff6a5e' };
      continue;
    }
    b.growth = Math.min(0.85, b.growth + dt / 240);
    b.maxhp = Math.round(def.hp * hpFrac(b.growth));
    b.hp = Math.min(b.maxhp, b.hp + dt * 2);
    b.mateDef.dmg = def.dmg * dmgFrac(b.growth) * 0.55;
  }
  if (ns.babies.length < W.need) { failWalk(); return; }

  // the season, for real
  const k = W.season.kind;
  if (k === 'dry') p.water = Math.max(0, p.water - dt * 0.55);
  else if (k === 'flood') forceFlood();
  else if (k === 'erupt') { if (G.eruption && G.eruption.warn <= 0) G.eruption.nextT = Math.min(G.eruption.nextT, 9); }
  else if (k === 'blizzard') {
    const B = G.blizzard;
    if (B) { if (!B.on) { B.warnT = 0; B.on = true; B.t = 10; } B.t = Math.max(B.t, 4); }
  } else if (k === 'night') G.mist = 1;
  else if (k === 'sand') {
    const S = G.sandstorm;
    if (S) {
      if (!S.on) { S.warnT = 0; S.on = true; S.t = 10; }
      S.t = Math.max(S.t, 4);
      W.frontT -= dt;
      if (W.frontT <= 0 && !S.front) {
        W.frontT = rrange(28, 40);
        S.front = { x: Math.max(40, p.x - VIEW_W * 1.6), speed: 230, t: 0 };
        G.banner = { str: 'THE WALL OF SAND! Get them under the trees — or into the water!', t: 5, color: '#ffffff' };
      }
    }
  }

  // the hunters come for the young (every land; the valley's come in force)
  W.raidT -= dt;
  if (W.raidT <= 0) {
    W.raidT = k === 'raids' ? rrange(7, 11) : rrange(16, 24);
    const young = aliveYoung();
    const target = young[Math.floor(Math.random() * young.length)];
    let best = null, bd = 1100;
    for (const o of G.npcs) {
      if (isFamily(o) || o.walkRival || o.bloodline || o.hp <= 0 || !isPredatorNPC(o.species)) continue;
      const dd = dist(o.x, o.y, target.x, target.y);
      if (dd < bd && dd > 160) { bd = dd; best = o; }
    }
    if (best) { best.state = 'chase'; best.target = target; best.stateT = 8; }
  }

  // the rival: arrives a little way in, stalks the route, goes for the young
  if (!W.rival && !W.rivalGone) {
    W.rivalT -= dt;
    if (W.rivalT <= 0) spawnRival();
  } else if (W.rival && (W.rival.hp <= 0 || !G.npcs.includes(W.rival))) {
    W.rival = null; W.rivalGone = true;
    G.banner = { str: 'The rival is down. The road is yours.', t: 5, color: '#ffd23e' };
  }

  // ARRIVAL: inside the landmark's ring, with enough young at your side
  const dl = dist(p.x, p.y, W.lm.x, W.lm.y);
  W.gather = false;
  if (dl < W.lm.r && G.time - W.start > 4) {
    const near = ns.babies.filter(b => dist(b.x, b.y, p.x, p.y) < 260).length;
    if (near >= W.need) { beginSettle(); return; }
    W.gather = true;   // here — but the family isn't
  }
}

function spawnRival() {
  const p = G.player, W = G.nesting.walk;
  W.rivalT = 1e9;
  const sp = pickRival(p);
  if (!sp) { W.rivalGone = true; return; }
  const toL = angTo(p.x, p.y, W.lm.x, W.lm.y);
  let pos = null;
  for (let k = 0; k < 24 && !pos; k++) {
    const a = toL + (k % 2 ? 1 : -1) * (0.5 + k * 0.12);
    const x = p.x + Math.cos(a) * 900, y = p.y + Math.sin(a) * 900;
    if (walkGround(x, y)) pos = { x, y };
  }
  if (!pos) { W.rivalT = 6; return; }
  const e = makeNPC(sp, pos.x, pos.y);
  e.walkRival = true;
  e.hp = e.maxhp = Math.max(e.maxhp, Math.round(playerMaxHp() * 0.9));
  e.home = { x: pos.x, y: pos.y };
  G.npcs.push(e);
  W.rival = e;
  G.banner = { str: 'A RIVAL ' + DINO[sp].name.toUpperCase() + ' has your young\'s scent. It will come for them.', t: 6, color: '#ff8a5e' };
}
function dismissRival(remove) {
  const W = G.nesting && G.nesting.walk;
  const r = W && W.rival;
  if (!r) return;
  r.walkRival = false;
  if (remove) { const i = G.npcs.indexOf(r); if (i >= 0) G.npcs.splice(i, 1); }
  else { r.state = 'return'; r.target = null; r.stateT = 8; r.tiredT = 30; }
  W.rival = null;
}

// ---------- the season's weather: forced on for the walk, eased off after ----------
function borrowWalkChannels() {
  if (World.monsoonWorld || World._chanBak !== undefined) return;
  World._chanBak = World.channels;
  const bl = World.waterBlobs || [];
  let ch = World.eco === 'delta' ? bl.filter((b, i) => b.deep && i % 2 === 0) : bl.filter(b => b.r >= 4.4 * TILE);
  if (!ch.length) ch = bl;
  World.channels = ch.map(b => ({ x: b.x, y: b.y, r: b.r }));
}
function restoreWalkChannels() {
  if (World._chanBak === undefined) return;
  World.channels = World._chanBak;
  World._chanBak = undefined;
}
function forceFlood() {
  let M = G.monsoon;
  if (!M) {
    M = G.monsoon = { phase: 'storm', t: 30, rise: 0, rain: 0, shove: 0 };
    G.banner = { str: (World.monsoonWorld ? 'The monsoon will not break' : 'The water is rising') + ' — keep the young out of the current!', t: 5, color: '#bfe6ff' };
  }
  if (!World.monsoonWorld) {
    M.forced = true;
    M.cap = World.eco === 'delta' ? 0.45 : 0.7;
    borrowWalkChannels();
  }
  M.phase = 'storm';
  M.t = Math.max(M.t, 5);
}
// hard: a death / the lobby — everything off at once
function endWalkWeather(hard) {
  const M = G.monsoon;
  if (M && M.forced) {
    if (hard) { G.monsoon = null; restoreWalkChannels(); }
    else { M.phase = 'easing'; M.t = 12; }
  } else if (M && World.monsoonWorld && !hard && M.phase === 'storm') { M.phase = 'easing'; M.t = 14; }
  if (hard) restoreWalkChannels();
  if (!hard && G.blizzard && G.blizzard.on) G.blizzard.t = Math.min(G.blizzard.t, 2);
  if (!hard && G.sandstorm && G.sandstorm.on) { G.sandstorm.t = Math.min(G.sandstorm.t, 2); G.sandstorm.front = null; }
  if (hard) document.body.classList.remove('cine');
}

// ---------- failure: never a deletion ----------
function failWalk() {
  const ns = G.nesting, p = G.player;
  endWalkWeather(false);
  dismissRival(false);
  ns.walk = null;
  if (ns.babies.length) {
    ns.stage = 'babies';
    ns.guardian = p.gender === 'f' ? 'player' : 'mate';
  } else {
    ns.stage = 'accepted'; ns.reNestT = 45;
  }
  G.banner = { str: 'The season was stronger. ' + (ns.babies.length ? 'Your young will grow up on their own — nest again, and walk with the next clutch.' : 'Nest again, and walk with the next clutch.'), t: 8, color: '#ff6a5e' };
}

// ---------- THE PIN: arrival, the cutscene, settled ----------
function beginSettle() {
  const ns = G.nesting, W = ns.walk, p = G.player;
  endWalkWeather(false);
  dismissRival(true);
  // the hunters melt back into the land
  for (const e of G.npcs) {
    if (isFamily(e) || e.bloodline || e.hp <= 0) continue;
    const nd = NPC_DEF[e.species];
    if (!nd || !(nd.dmg > 0) || dist(e.x, e.y, p.x, p.y) > 900) continue;
    e.state = 'flee'; e.target = p; e.stateT = 12; e.tiredT = 25;
  }
  const young = aliveYoung();
  for (const b of young) b.cineHold = true;
  if (G.mate && G.mate.hp > 0) G.mate.cineHold = true;
  // they walk on past the landmark, away from where you came from
  const yc = centroidOf(young) || p;
  let dir = angTo(World.nests[p.species] ? World.nests[p.species].x : p.x - 1, World.nests[p.species] ? World.nests[p.species].y : p.y, W.lm.x, W.lm.y);
  if (!isFinite(dir)) dir = angTo(p.x, p.y, yc.x, yc.y);
  ns.stage = 'cine';
  G.cine = {
    t: 0, dur: 19, skip: false, sent: false, called: false,
    young, survivors: young.length, clutch: W.clutch, lm: W.lm, dir,
    sp: p.species, cx: p.x, cy: p.y - 20, z0: G.zoom,
  };
  G.banner = null;
  G.prompt = '';
  document.body.classList.add('cine');
}

function cineLockInput() {
  const i = G.input;
  i.up = i.down = i.left = i.right = i.sprint = i.sprinting = false;
  i.attack = i.atkHold = i.pounceHold = i.interact = i.action = i.rest = false;
  i.claw = i.dig = i.call1 = i.call2 = i.call3 = false;
  G.keys = {};
}

function updateCine(dt) {
  const C = G.cine;
  if (!C) return;
  const p = G.player;
  if (!p || !p.alive) { G.cine = null; document.body.classList.remove('cine'); return; }
  C.t += dt;
  p.move = lerp(p.move || 0, 0, 0.2);
  const alive = C.young.filter(b => G.npcs.includes(b));
  const yc = centroidOf(alive);
  if (yc && Math.abs(yc.x - p.x) > 4) p.facing = yc.x > p.x ? 1 : -1;
  // the young turn and walk off into the land
  if (C.t > 4.5 && !C.sent) {
    C.sent = true;
    alive.forEach((b, i) => {
      const a = C.dir + (i - (alive.length - 1) / 2) * 0.4;
      let tx = b.x + Math.cos(a) * 700, ty = b.y + Math.sin(a) * 700;
      tx = clamp(tx, 60, WORLD_W - 60); ty = clamp(ty, 60, WORLD_H - 60);
      b.cineHold = false;
      b.cineTo = { x: tx, y: ty };
    });
    SFX.settle();
  }
  // you stand and watch, and call after them once
  if (C.t > 7.5 && !C.called) { C.called = true; p.call = { k: 2, t: 0, dur: 0.9, fired: true }; }
  if (C.skip || C.t >= C.dur) finishSettle();
}

// the cutscene's camera target (loop() eases toward it)
function cineCamera(dt) {
  const C = G.cine, p = G.player;
  const yc = centroidOf(C.young.filter(b => G.npcs.includes(b))) || p;
  const mx = (p.x + yc.x) / 2, my = (p.y + yc.y) / 2 - 20;
  let tx, ty, tz;
  if (C.t < 1.5) { tx = p.x; ty = p.y - 20; tz = C.z0; }
  else if (C.t < 4.5) { tx = yc.x; ty = yc.y - 20; tz = C.z0 * 0.85; }
  else if (C.t < 10) { tx = mx; ty = my; tz = C.z0 * 1.05; }
  else { tx = mx; ty = my; tz = Math.max(2.2, C.z0 * 1.7); }
  const k = Math.min(1, (dt || 1 / 60) * 1.1);
  C.cx = lerp(C.cx, tx, k); C.cy = lerp(C.cy, ty, k);
  return { x: C.cx, y: C.cy, z: tz };
}

function finishSettle() {
  const C = G.cine, ns = G.nesting, p = G.player, sp = C.sp;
  const alive = C.young.filter(b => G.npcs.includes(b) && b.hp > 0);
  Save.settled = Save.settled || {};
  const rec = Save.settled[sp] || { gen: 0, walks: 0, total: 0, best: 0 };
  rec.gen++; rec.walks++;
  rec.total += alive.length;
  rec.best = Math.max(rec.best, alive.length);
  rec.last = alive.length; rec.clutch = C.clutch;
  rec.skin = p.skin; rec.eco = World.eco;
  Save.settled[sp] = rec;
  // the young become the land's own: a bloodline in your colours
  for (const b of alive) {
    b.cineTo = null; b.cineHold = false;
    b.isBaby = false;
    if (b.packAlpha) { b.packAlpha = false; const i = G.pack.indexOf(b); if (i >= 0) G.pack.splice(i, 1); }
    makeBloodline(sp, b.x, b.y, rec, b);
  }
  if (G.mate) G.mate.cineHold = false;
  ns.stage = 'accepted'; ns.reNestT = 45;
  ns.babies = []; ns.walk = null; ns.guardian = null;
  if (!Save.raisedClutch) Save.raisedClutch = true;
  awardGrowths(150 + 150 * alive.length, p.x, p.y - 60);
  syncTitles();
  saveSave();
  G.cine = null;
  document.body.classList.remove('cine');
  G.banner = { str: '⚜ SETTLED — your ' + DINO[sp].name + ' line lives on in ' + ECOS[World.eco].name + '. The Legacy coat is yours.', t: 9, color: '#ffd23e' };
}

// ---------- the bloodline: your young, at home in the land for good ----------
// (b: an existing entity to convert; otherwise a fresh one is made)
function makeBloodline(sp, x, y, rec, b) {
  const def = PLAYER_DEF[sp];
  const e = b || makeNPC_raw(sp, x, y);
  e.bloodline = true;
  e.kinYoung = true;          // your own blood: never a mate
  e.isBaby = false;
  if (!e.gender) e.gender = rnd() < 0.5 ? 'f' : 'm';
  e.skin = rec.skin || 'default';
  e.gen = rec.gen;
  if (!b) e.growth = rrange(0.75, 1);
  e.growth = Math.max(e.growth, 0.6);
  e.hp = e.maxhp = Math.round(def.hp * GENDER_MOD[e.gender].hp * hpFrac(e.growth) * 0.8);
  e.mateDef = {
    hp: e.maxhp, dmg: def.dmg * dmgFrac(e.growth) * 0.8, atkCd: def.atkCd * 1.1,
    speed: def.speed * 0.9, fleeSpeed: def.speed, detect: 260, homeR: 460, reach: def.reach,
    biome: 'any', turn: 2.4, melee: { kb: 160 }, caution: 1.1,
  };
  e.home = { x: e.x, y: e.y };
  e.state = 'idle'; e.stateT = 1;
  return e;
}
function spawnBloodlines() {
  const S = (typeof Save !== 'undefined' && Save.settled) || {};
  for (const sp in S) {
    const def = PLAYER_DEF[sp];
    if (!def || (def.eco || 'valley') !== World.eco) continue;
    const rec = S[sp];
    const n = clamp(rec.total || 1, 1, 5);
    const at = World.landmark || World.nests[sp] || { x: WORLD_W / 2, y: WORLD_H / 2 };
    for (let i = 0; i < n; i++) {
      let pos = null;
      for (let k = 0; k < 20 && !pos; k++) {
        const a = rnd() * TAU, r = rrange(70, 240);
        const x = at.x + Math.cos(a) * r, y = at.y + Math.sin(a) * r;
        if (walkGround(x, y)) pos = { x, y };
      }
      if (!pos) pos = { x: at.x + rrange(-30, 30), y: at.y + rrange(20, 50) };
      G.npcs.push(makeBloodline(sp, pos.x, pos.y, rec));
    }
  }
}

// ---------- brains ----------
// the young on the road: stand with the family, run from what's alone with you
function thinkYoungWalk(e, d) {
  const p = G.player;
  e.home.x = p.x; e.home.y = p.y;
  const la = e.lastAttacker;
  if (e.aggroT > 0 && la && (la.isPlayer ? la.alive : la.hp > 0) && dist(e.x, e.y, la.x, la.y) < 220 && !la.isPlayer) {
    e.state = 'fight'; e.target = la; e.stateT = 1.5; return;
  }
  let threat = null, td = 170;
  for (const o of G.npcs) {
    if (o === e || isFamily(o) || o.bloodline || o.hp <= 0) continue;
    if (!(o.walkRival || isPredatorNPC(o.species))) continue;
    const dd = dist(e.x, e.y, o.x, o.y);
    if (dd < td) { td = dd; threat = o; }
  }
  if (threat) {
    const adultNear = dist(p.x, p.y, threat.x, threat.y) < 170 ||
      (G.mate && G.mate.hp > 0 && dist(G.mate.x, G.mate.y, threat.x, threat.y) < 170);
    if (adultNear) { e.state = 'fight'; e.target = threat; e.stateT = 1.5; }
    else { e.state = 'flee'; e.target = threat; e.stateT = 1.8; }
    return;
  }
  if (dist(e.x, e.y, p.x, p.y) > 70) { e.state = 'follow'; e.target = p; e.stateT = 2; return; }
  defaultWander(e, false);
}

// the rival: stalks the route, and when it closes, it goes for the young
function thinkWalkRival(e, d) {
  const p = G.player, W = G.nesting && G.nesting.walk;
  if (!walkActive()) { e.walkRival = false; e.state = 'return'; e.stateT = 6; return; }
  if (e.hp < e.maxhp * 0.35) {
    // beaten: it breaks off for good
    e.walkRival = false; e.state = 'flee'; e.target = p; e.stateT = 8; e.tiredT = 30;
    floatText(e.x, e.y - 40, 'the rival breaks off!', '#ffd23e');
    if (W) { W.rival = null; W.rivalGone = true; }
    G.banner = { str: 'The rival breaks off. The road is yours.', t: 5, color: '#ffd23e' };
    return;
  }
  let t = null;
  const la = e.lastAttacker;
  if (e.aggroT > 0 && la && (la.isPlayer ? la.alive : la.hp > 0) && dist(e.x, e.y, la.x, la.y) < 300) t = la;
  if (!t) {
    let bd = 1e9;
    for (const b of aliveYoung()) { const dd = dist(e.x, e.y, b.x, b.y); if (dd < bd) { bd = dd; t = b; } }
  }
  if (!t) t = p;
  const dd = dist(e.x, e.y, t.x, t.y);
  if (dd < 320) {
    e.state = DINO[e.species].diet === 'carn' && !DINO[e.species].tailWeapon ? 'chase' : 'fight';
    e.target = t; e.stateT = 3;
  } else { e.state = 'follow'; e.target = t; e.stateT = 1.2; }
}

// a settled bloodline: lives off the land, meets what hunts it, knows its own
function thinkBloodline(e, d) {
  const p = G.player;
  const kin = p && p.alive && p.species === e.species;
  const carn = DINO[e.species].diet === 'carn';
  const la = e.lastAttacker;
  if (e.aggroT > 0 && la && (la.isPlayer ? la.alive : la.hp > 0)) {
    // your own kind's teeth: they don't fight you, they scatter
    if (la.isPlayer && kin) { e.state = 'flee'; e.target = la; e.stateT = 2; return; }
    e.state = 'fight'; e.target = la; e.stateT = 3; return;
  }
  let threat = null, td = 200;
  for (const o of G.npcs) {
    if (o === e || o.bloodline || o.hp <= 0 || isFamily(o) || !isPredatorNPC(o.species)) continue;
    const dd = dist(e.x, e.y, o.x, o.y);
    if (dd < td) { td = dd; threat = o; }
  }
  if (threat) {
    if (confident(e, threat)) { e.state = 'fight'; e.target = threat; e.stateT = 2; }
    else { e.state = 'flee'; e.target = threat; e.stateT = 2.2; }
    return;
  }
  // the hunters of the line hunt — smaller things, now and then
  if (carn && rnd() < 0.1) {
    let best = null, bd = 320;
    for (const o of G.npcs) {
      if (o.bloodline || isFamily(o) || o.hp <= 0 || DINO[o.species].fish || !NPC_DEF[o.species]) continue;
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd < bd && powerOf(o) < powerOf(e) * 0.8) { bd = dd; best = o; }
    }
    if (best) { e.state = 'fight'; e.target = best; e.stateT = 5; return; }
  }
  if (carn) {
    const c = nearestCarcass(e.x, e.y, 220, true);
    if (c && c.meat > 20 && !c.claim) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
  }
  // they know you: a little greeting when you come close
  if (kin && dist(e.x, e.y, p.x, p.y) < 130 && (e.greetT || 0) <= G.time) {
    e.greetT = G.time + 25;
    floatText(e.x, e.y - 40, '♦', '#ffd23e');
    faceToward(e, p.x > e.x ? 1 : -1);
    e.state = 'idle'; e.stateT = 1.5; return;
  }
  if (dist(e.x, e.y, e.home.x, e.home.y) > d.homeR * 1.3) { e.state = 'return'; e.stateT = 6; return; }
  defaultWander(e, true);
}

// the cutscene's actors
function thinkCineWalk(e) { e.state = 'wander'; e.tx = e.cineTo.x; e.ty = e.cineTo.y; e.stateT = 3; }
function thinkCineHold(e) {
  e.state = 'idle'; e.stateT = 0.6;
  const C = G.cine;
  const yc = C ? centroidOf(C.young.filter(b => b !== e && G.npcs.includes(b))) : null;
  const t = yc || G.player;
  if (t) faceToward(e, t.x > e.x ? 1 : -1);
}

// a tap anywhere skips the ending too (phones have no keys)
document.addEventListener('pointerdown', () => { if (G.cine && G.cine.t > 0.8) G.cine.skip = true; }, true);

// ---------- drawing ----------
// the arrival ring, on the ground under everything that walks
function drawWalkGround(g) {
  if (!walkActive()) return;
  const lm = G.nesting.walk.lm;
  const pulse = 0.5 + 0.5 * Math.sin(G.time * 2.4);
  g.save();
  const rg = g.createRadialGradient(lm.x, lm.y, lm.r * 0.2, lm.x, lm.y, lm.r);
  rg.addColorStop(0, 'rgba(255,214,90,0.10)');
  rg.addColorStop(1, 'rgba(255,214,90,0)');
  g.fillStyle = rg;
  g.beginPath(); g.ellipse(lm.x, lm.y, lm.r, lm.r * 0.7, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,214,90,' + (0.35 + 0.35 * pulse).toFixed(2) + ')';
  g.lineWidth = 2;
  g.setLineDash([10, 8]);
  g.lineDashOffset = -G.time * 14;
  g.beginPath(); g.ellipse(lm.x, lm.y, lm.r, lm.r * 0.7, 0, 0, TAU); g.stroke();
  g.restore();
}
// a column of light over the landmark, seen from far off
function drawWalkBeacon(g) {
  if (!walkActive()) return;
  const lm = G.nesting.walk.lm;
  const h = 560, w = 30 + 6 * Math.sin(G.time * 1.7);
  g.save();
  g.globalCompositeOperation = 'lighter';
  const lg = g.createLinearGradient(0, lm.y - h, 0, lm.y);
  lg.addColorStop(0, 'rgba(255,220,120,0)');
  lg.addColorStop(0.7, 'rgba(255,220,120,0.16)');
  lg.addColorStop(1, 'rgba(255,230,150,0.32)');
  g.fillStyle = lg;
  g.fillRect(lm.x - w / 2, lm.y - h, w, h);
  g.fillRect(lm.x - w / 6, lm.y - h, w / 3, h);
  g.restore();
}
// a name over your bloodline (when you're near) and over the rival
function drawLineTag(g, e, p) {
  const near = dist(e.x, e.y, p.x, p.y);
  if (e.bloodline && near > 260) return;
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1);
  const y = e.y - (d.L.leg[0] + d.L.body[1] * 1.7) * s - 16;
  const str = e.walkRival ? '⚔ RIVAL' : (kinLine(e) ? '◆ your kin' : '◆ your bloodline') + ' · GEN ' + roman(e.gen || 1);
  g.font = 'bold 7px monospace';
  g.textAlign = 'center';
  g.fillStyle = 'rgba(10,8,4,0.85)';
  g.fillText(str, e.x + 0.7, y + 0.7);
  g.fillStyle = e.walkRival ? '#ff8a5e' : '#ffd23e';
  g.fillText(str, e.x, y);
  g.textAlign = 'left';
}
// the minimap: the landmark (walk only), your mate, the rival, your bloodline
function drawWalkMinimap(c2, sx, sy) {
  if (G.mate && G.mate.hp > 0) { c2.fillStyle = '#ff9ccc'; c2.fillRect(G.mate.x * sx - 1.5, G.mate.y * sy - 1.5, 3, 3); }
  for (const e of G.npcs) {
    if (e.bloodline) { c2.fillStyle = '#e8c860'; c2.fillRect(e.x * sx - 1, e.y * sy - 1, 2, 2); }
    else if (e.walkRival) { c2.fillStyle = '#ff5a3e'; c2.fillRect(e.x * sx - 1.5, e.y * sy - 1.5, 3, 3); }
  }
  if (!walkActive()) return;
  const lm = G.nesting.walk.lm;
  const r = 4 + 2 * Math.sin(G.time * 4);
  c2.strokeStyle = '#ffd23e'; c2.lineWidth = 1.5;
  c2.beginPath(); c2.arc(lm.x * sx, lm.y * sy, r, 0, TAU); c2.stroke();
  c2.fillStyle = '#ffd23e';
  c2.fillRect(lm.x * sx - 1.5, lm.y * sy - 1.5, 3, 3);
}
// screen space: the long night's dark, the status line and the waypoint arrow
function drawWalkHUD() {
  if (!walkActive() || G.cine) return;
  const W = G.nesting.walk, lm = W.lm, Z = G.zoom || 1;
  if (W.season.kind === 'night') {
    ctx.fillStyle = 'rgba(8,10,20,0.3)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  // the status line: where, how many, how many needed — no clock, ever
  const young = aliveYoung().length;
  const str = '⚜ THE GREAT WALK → ' + lm.name.toUpperCase() + '   ·   YOUNG ' + young + '   ·   NEED ' + W.need +
    (W.gather ? '   ·   GATHER THEM HERE!' : '');
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(str).width;
  const y = 44;
  ctx.fillStyle = 'rgba(20,14,7,0.72)';
  ctx.fillRect(VIEW_W / 2 - tw / 2 - 8, y - 9, tw + 16, 13);
  ctx.fillStyle = W.gather ? '#ffffff' : young <= W.need ? '#ffb08a' : '#ffd23e';
  ctx.fillText(str, VIEW_W / 2, y);
  // the waypoint: a bobbing marker over the landmark when it's on screen,
  // an arrow on the frame's edge pointing at it when it isn't
  const sx = (lm.x - G.camX) / Z, sy = (lm.y - G.camY) / Z;
  const m = 26;
  ctx.fillStyle = '#ffd23e';
  ctx.strokeStyle = 'rgba(20,14,7,0.9)';
  ctx.lineWidth = 1.5;
  if (sx > m && sx < VIEW_W - m && sy > 60 && sy < VIEW_H - m) {
    const by = sy - 90 / Z - 6 + Math.sin(G.time * 3) * 3;
    ctx.beginPath(); ctx.moveTo(sx - 7, by - 8); ctx.lineTo(sx + 7, by - 8); ctx.lineTo(sx, by + 2); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else {
    const cx = VIEW_W / 2, cy = VIEW_H / 2;
    const a = Math.atan2(sy - cy, sx - cx);
    const kx = Math.abs(Math.cos(a)) > 1e-4 ? (VIEW_W / 2 - m) / Math.abs(Math.cos(a)) : 1e9;
    const ky = Math.abs(Math.sin(a)) > 1e-4 ? (VIEW_H / 2 - m - 20) / Math.abs(Math.sin(a)) : 1e9;
    const k = Math.min(kx, ky);
    const ax = cx + Math.cos(a) * k, ay = Math.max(y + 20, cy + 10 + Math.sin(a) * k);   // never over the status line
    ctx.save();
    ctx.translate(ax, ay); ctx.rotate(a);
    const pulse = 1 + 0.12 * Math.sin(G.time * 5);
    ctx.scale(pulse, pulse);
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.textAlign = 'left';
}
// the ending, on screen: letterbox bars, captions, then the title card
function drawCine() {
  const C = G.cine;
  if (!C) return;
  const t = C.t;
  const win = (a, b) => clamp((t - a) / 0.6, 0, 1) * clamp((b - t) / 0.6, 0, 1);
  const bars = clamp(t / 1.2, 0, 1) * clamp((C.dur - t) / 0.8, 0, 1);
  const bh = VIEW_H * 0.12 * bars;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, bh);
  ctx.fillRect(0, VIEW_H - bh, VIEW_W, bh);
  ctx.textAlign = 'center';
  const caption = (str, a) => {
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.font = 'italic 10px monospace';
    ctx.fillStyle = '#f5e9c8';
    ctx.fillText(str, VIEW_W / 2, VIEW_H - bh - 14);
    ctx.globalAlpha = 1;
  };
  caption('The season breaks.', win(1.4, 4.4));
  caption('They don\'t look back.', win(5.2, 9.6));
  if (t > 10 && t < 14) {
    ctx.globalAlpha = win(10.2, 13.8);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffe9a0';
    ctx.fillText(ECOS[World.eco].name.toUpperCase(), VIEW_W / 2, bh + 24);
    ctx.globalAlpha = 1;
  }
  // the title card
  const tc = clamp((t - 14) / 1.2, 0, 1) * clamp((C.dur - t) / 0.8, 0, 1);
  if (tc > 0) {
    ctx.fillStyle = 'rgba(10,7,4,' + (0.72 * tc).toFixed(3) + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = tc;
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ffe9a0';
    ctx.fillText(DINO[C.sp].name.toUpperCase(), VIEW_W / 2, VIEW_H / 2 - 10);
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ffd23e';
    ctx.fillText('⚜  S E T T L E D  ⚜', VIEW_W / 2, VIEW_H / 2 + 16);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#cdbb92';
    const gen = (((Save.settled || {})[C.sp] || {}).gen || 0) + 1;
    ctx.fillText('GEN ' + roman(gen) + '   ·   ' + C.survivors + ' of ' + C.clutch + ' young came home', VIEW_W / 2, VIEW_H / 2 + 34);
    ctx.globalAlpha = 1;
  }
  if (t > 1) {
    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(205,187,146,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText((window.TOUCH && TOUCH.enabled) ? 'tap to skip' : 'any key to skip', VIEW_W - 10, VIEW_H - 6);
  }
  ctx.textAlign = 'left';
}

// test hooks for the headless checks
window.WALK = { startWalk, beginSettle, pickRival, walkNeeded, spawnRival, finishSettle };
