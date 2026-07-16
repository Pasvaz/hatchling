'use strict';
// ---------- main: boot, input, loop, render, HUD, screens ----------
// the view HEIGHT is the world-scale anchor (360 units tall, always); the
// view WIDTH follows the screen's aspect so the biome fills the whole
// display — no letterbox bands, a wider screen simply sees more delta
const VIEW_H = 360;
let VIEW_W = 640;   // recomputed in resize(), clamped 560..960

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

G.RS = 1; // render scale (canvas pixels per world unit), set by resize()

G.npcs = [];
G.carcasses = [];
G.particles = [];
G.floats = [];
G.player = null;
G.camX = 0; G.camY = 0;
G.shake = 0;
G.prompt = '';
G.banner = null;
G.paused = false;
G.started = false;
G.input = { up: false, down: false, left: false, right: false, sprint: false, attack: false, interact: false, sprinting: false, fish: false, nest: false, wrestle: false, pack: false, burrow: false, rest: false, grab: false };
G.mate = null;
G.nesting = { stage: 'none', babies: [] };
G.wrestle = null;
G.pack = [];
G.burrow = null;
G.keys = {};
window.G = G; // for debugging

// ---------- persistent saves: player profiles, each with its own progress ----------
// you create a player, then you grow dinos — every profile has its own growths,
// unlocks, purchases and per-species dino snapshots
const PROFILES_KEY = 'hatchling_profiles_v1';
const LEGACY_SAVE_KEY = 'hatchling_save_v1';
// earned = lifetime growths score (never spent down — it's the leaderboard)
// ecoPaid = one flag per unlocked ecosystem, ready for however many we add
function defaultSave() { return { growths: 0, earned: 0, ecoPaid: {}, mastery: {}, owned: {}, dino: {}, skinChoice: {}, genderChoice: {}, skinOwned: {} }; }
// paid skins are bought once per species (Classic and other free skins pass)
function skinOwned(species, skinId) {
  return !SKINS[skinId].cost || !!(Save.skinOwned || {})[species + ':' + skinId];
}
// the loadout currently chosen on a species' lobby card — remembered per
// species, defaulting to male + Classic the first time (a bad/unowned skin
// falls back to Classic so you never launch in a coat you don't own)
function cardGender(species) { return (Save.genderChoice || {})[species] === 'f' ? 'f' : 'm'; }
function cardSkin(species) {
  const s = (Save.skinChoice || {})[species];
  return SKINS[s] && (!SKINS[s].only || SKINS[s].only === species) && skinOwned(species, s) ? s : 'default';
}
const Profiles = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(PROFILES_KEY));
    if (s && typeof s === 'object' && s.players) return s;
  } catch (e) { }
  return { current: null, players: {} };
})();
// progress from before profiles existed is adopted by the first player created
const legacySave = (() => {
  if (Object.keys(Profiles.players).length) return null;
  try { return JSON.parse(localStorage.getItem(LEGACY_SAVE_KEY)); } catch (e) { return null; }
})();
let Save = defaultSave();   // points at the current profile's data once one is picked
function saveSave() {
  try {
    if (Profiles.current) Profiles.players[Profiles.current] = Save;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(Profiles));
  } catch (e) { }
}
// growing ANY dinosaur to Full Adult opens the door to new ecosystems
function anyMastery() { return Object.keys(Save.mastery).some(k => Save.mastery[k]); }
function ecoPaid(key) { return !ECOS[key].cost || !!Save.ecoPaid[key]; }

// growths payout: called from entities (minute ticks, kills) and bonuses
function awardGrowths(n, x, y) {
  Save.growths += n;
  Save.earned += n;
  saveSave();
  if (x != null) floatText(x, y, '+' + n + ' growth' + (n > 1 ? 's' : ''), '#ffd23e');
  SFX.coin && SFX.coin();
}
// first time a species reaches Full Adult: mastery bonus + prairie unlock
function onFullyGrown(species) {
  if (Save.mastery[species]) return;
  Save.mastery[species] = true;
  Save.growths += 100;
  Save.earned += 100;
  saveSave();
  const lockedWorlds = Object.keys(ECOS).some(k => !ecoPaid(k));
  setTimeout(() => {
    G.banner = {
      str: '+100 growths mastery bonus!' + (lockedWorlds ? '  New lands await in the lobby…' : ''),
      t: 7, color: '#ffd23e',
    };
  }, 6200);
}
// each gender is its own loadout with its own saved dino — the bare species
// key is the female slot, so every save from before genders resumes as one
function dinoKey(species, gender) { return gender === 'm' ? species + ':m' : species; }
function saveDinoSnapshot() {
  const p = G.player;
  if (!p || !p.alive || !G.started) return;
  Save.dino[dinoKey(p.species, p.gender)] = {
    growth: p.growth, hp: p.hp, food: p.food, water: p.water,
    stamina: p.stamina, hygiene: p.hygiene, x: p.x, y: p.y,
  };
  saveSave();
}

// ---------- input ----------
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
};
window.addEventListener('keydown', (e) => {
  // typing a profile name must never fight the game keys
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  G.keys[e.code] = true;
  if (KEYMAP[e.code]) G.input[KEYMAP[e.code]] = true;
  if (e.code === 'Space') G.input.attack = true;
  if (e.code === 'KeyE') G.input.interact = true;
  if (e.code === 'KeyF') G.input.fish = true;
  if (e.code === 'KeyN') G.input.nest = true;
  if (e.code === 'KeyM') G.input.wrestle = true;
  if (G.wrestle && WRESTLE_KEYS.includes(e.code)) G.wrestle.pressed = e.code;
  if (e.code === 'KeyP') G.input.pack = true;
  if (e.code === 'KeyI') G.input.burrow = true;
  if (e.code === 'KeyR') G.input.rest = true;
  if (e.code === 'KeyG') G.input.grab = true;
  if (e.code === 'Escape') {
    if (G.started) { G.paused = !G.paused; document.getElementById('pause').classList.toggle('hidden', !G.paused); }
  }
  if (e.code === 'KeyU') {
    const m = SFX.toggleMute();
    G.banner = { str: m ? 'Sound muted' : 'Sound on', t: 1.5, color: '#cbb' };
  }
  if (e.code === 'KeyH') G.debugHit = !G.debugHit; // hitbox X-ray
  if (e.code === 'F1') { e.preventDefault(); document.getElementById('help').classList.toggle('hidden'); }
  if (e.code === 'Tab') document.getElementById('statspanel').classList.toggle('hidden');
  if (e.code === 'KeyY' && G.player && G.player.alive) { // growth cheat for testing
    const old = G.player.growth;
    G.player.growth = Math.min(1, G.player.growth + 0.05);
    checkStage(G.player, old);
  }
});
window.addEventListener('keyup', (e) => {
  G.keys[e.code] = false;
  if (KEYMAP[e.code]) G.input[KEYMAP[e.code]] = false;
});

// ---------- boot ----------
genWorld('valley');
buildMinimap();

// species select previews — generation-counted so lobby round-trips replace
// the old animation loops instead of stacking new ones on top of them
let previewGen = 0;
function animatePreview(canvasId, species, gender, growth, skinId) {
  const cv = document.getElementById(canvasId);
  const c2 = cv.getContext('2d');
  const W = 200, H = 120;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  let t = 0;
  const gen = previewGen;
  function frame() {
    if (G.started || gen !== previewGen) return;
    t += 1 / 60;
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.clearRect(0, 0, W, H);
    // little ground
    c2.fillStyle = '#8d9052';
    c2.fillRect(0, H - 22, W, 22);
    c2.fillStyle = '#7a7d44';
    for (let i = 0; i < 8; i++) c2.fillRect(10 + i * 22, H - 22 + (i % 3) * 5, 2, 2);
    const g = growth != null ? growth : 0.04;
    // grown previews (the gender picker) render smaller so they still fit
    let zoom = 2.8 / (0.35 + 0.65 * sizeScale(g) / sizeScale(0.04));
    // …and the giants (sauropods!) get capped by their actual footprint so a
    // morosaurus preview shows a dinosaur, not a close-up of two legs
    const d = DINO[species], ss = d.scale * sizeScale(g);
    const wEst = (d.L.body[0] + d.L.tail[0] * 0.7 + d.L.neckLen + d.L.head[0] * 0.6) * ss;
    const hEst = (d.L.leg[0] + d.L.body[1] * 1.25 + Math.sin(d.L.neckAng) * d.L.neckLen + d.L.head[1]) * ss;
    zoom = Math.min(zoom, 178 / wEst, 90 / hEst);
    const hop = Math.abs(Math.sin(t * 3)) * 2;
    c2.save();
    c2.translate(W / 2 - 6, H - 18);
    c2.scale(zoom, zoom);
    drawShadow(c2, 0, 0, 14);
    drawDino(c2, species, {
      x: 0, y: -hop, facing: 1, gender, skin: skinId,
      growth: g, move: 0.6, phase: t * 6, attackT: 0, headDown: 0, hurtT: 0,
    });
    c2.restore();
    requestAnimationFrame(frame);
  }
  frame();
}
// every key in PLAYER_DEF is a playable — add an entry there (+ DINO art +
// CARD_INFO copy below) and its card, previews and purchase flow just appear
const ALL_PLAYABLES = Object.keys(PLAYER_DEF);
function animateAllPreviews() {
  previewGen++;
  // only the visible ecosystem's previews animate — 30 dinos won't burn CPU.
  // Each hatchling wears the loadout currently selected on its card.
  for (const sp of ALL_PLAYABLES) {
    if ((PLAYER_DEF[sp].eco || 'valley') === titleEco) animatePreview('prev-' + sp, sp, cardGender(sp), undefined, cardSkin(sp));
  }
}

const needMsg = (cost) => ' — you need ' + (cost - Save.growths) + ' more.';
// one fading status line per screen, same behavior
function makeFlash(id) {
  let timer = null;
  return (str) => {
    const el = document.getElementById(id);
    el.textContent = str;
    el.style.opacity = 1;
    clearTimeout(timer);
    timer = setTimeout(() => { el.style.opacity = 0; }, 2600);
  };
}
const flashTitleMsg = makeFlash('title-msg');
const flashProfileMsg = makeFlash('profile-msg');

// ---------- lobby / species select (generated from the registries) ----------
let titleEco = 'valley';

// lobby copy per playable — the only thing a new dino needs besides its defs
const CARD_INFO = {
  raja: { desc: 'A predator hatched in the fern forest. Scavenge carcasses, hunt to eat, and one day even the mighty Huayangosaurus may fear your bite.', tag: '◆ CARNIVORE — MODERATE', tagClass: 'mod' },
  campto: { desc: 'Born on the open plains where Moros intrepidus hunts. Run for the fern forest fast — the shade is your only refuge until you grow. Earns extra growths.', tag: '◆ HERBIVORE — HARD', tagClass: 'hard' },
  ichthyo: { desc: 'A sail-backed fish hunter from the southern swamp. The only dinosaur that can swim across deep water — snap up gar and ambush drinkers at the shore.', tag: '◆ CARNIVORE — SWIMMER', tagClass: 'swim' },
  qianzho: { desc: 'The long-snouted “Pinocchio rex”. It grows slowly — but a full-grown Qianzhousaurus is the fastest, toughest hunter on the whole prairie.', tag: '◆ CARNIVORE — SLOW GROWER', tagClass: 'mod' },
  scutello: { desc: 'A little armored runner. Grows fast, earns lots of growths, and its bony scutes resist bleeding wounds. Watch out for Troodon packs.', tag: '◆ HERBIVORE — EARNER', tagClass: 'hard' },
  metria: { desc: 'A storm-grey hunter built to run down Ugrunaaluk herds — fast, strong, and mean. Stay clear of the surf: the beach belongs to something meaner.', tag: '◆ CARNIVORE — HUNTER', tagClass: 'mod' },
  giganto: { desc: 'A living fortress with giant shoulder spines. It cannot bite at all — turn your back and swing the thagomizer. Slow, but almost unkillable.', tag: '◆ HERBIVORE — TAIL FIGHTER', tagClass: 'hard' },
  crista: { desc: 'The shoreline king: a croc-snouted heavyweight that swims deep water and hits like a slammed door. Slow — but far too strong for Megorontosuchus to hold.', tag: '◆ CARNIVORE — TANK', tagClass: 'mod' },
  linhe: { desc: 'Nothing on the ridge outruns you — and nothing forgives a mistake. Dodge the falling fire, dodge Tarbosaurus, and remember: the wild packs hunt here too.', tag: '◆ CARNIVORE — SPEED', tagClass: 'hard' },
  nothro: { desc: 'A pot-bellied giant that stands tall and swings great scythe claws. Eats only plants; slashes anything that forgets that. Claw wounds bleed.', tag: '◆ HERBIVORE — CLAWS', tagClass: 'mod' },
  aardi: { desc: 'Small, weak, and it looks like a dumb pick — until you meet your kin. Press P and lead the pack: raid Protoceratops burrows, claim them, and rule the undergrowth.', tag: '◆ CARNIVORE — PACK ALPHA', tagClass: 'hard' },
  centro: { desc: 'One great nose horn and no sense of retreat. Grows slowly, but a grown Centrosaurus is a wall — cheap to hatch, hard to move.', tag: '◆ HERBIVORE — TANK', tagClass: 'mod' },
  omni: { desc: 'Fast, strong, and cheap: the working raptor of the delta islands. Bleed your prey, cross at the sandbars, and never swim where the saw hunts.', tag: '◆ CARNIVORE — RAIDER', tagClass: 'mod' },
  eotrach: { desc: 'The oldest duckbill — tough, hardy, and built to outlast the delta. Its scarred hide resists bleeding and its tail swings like a river gate.', tag: '◆ HERBIVORE — HARDY', tagClass: 'hard' },
  loki: { desc: 'Centrosaurus, but cooler: midnight coat and the blade horns of a trickster god. Bigger, meaner, and worth every growth.', tag: '◆ HERBIVORE — BRUISER', tagClass: 'mod' },
  moro: { desc: 'The sauropod. Grows agonizingly slowly — but a full-grown Morosaurus fears exactly one thing in all the delta, and its name is Lourinhanosaurus.', tag: '◆ HERBIVORE — COLOSSUS', tagClass: 'hard' },
  spino: { desc: 'The undisputed apex — at adult. M-sailed, dewlapped, striking with jaws AND claws, and hitting 1.2× harder from the water it rules. Getting there is the whole game.', tag: '◆ CARNIVORE — APEX', tagClass: 'swim' },
  tyranno: { desc: 'The LAND apex: a shark-toothed giant whose every bite opens a wound that keeps working. Hit, fall back, and let the bleeding do the rest.', tag: '◆ CARNIVORE — BLEED', tagClass: 'mod' },
};

// build tabs and cards once from ECOS / PLAYER_DEF / DINO / CARD_INFO
function buildTitleUI() {
  const tabs = document.getElementById('ecotabs');
  tabs.innerHTML = '';
  const area = document.getElementById('cards-area');
  area.innerHTML = '';
  for (const key of Object.keys(ECOS)) {
    const eco = ECOS[key];
    const tab = document.createElement('div');
    tab.className = 'ecotab';
    tab.id = 'tab-' + key;
    tab.innerHTML = '<h3></h3><div class="tabsub"></div>';
    tab.querySelector('h3').textContent = eco.emoji + ' ' + eco.name.toUpperCase();
    tab.addEventListener('click', () => tryEcoTab(key));
    tabs.appendChild(tab);

    const wrap = document.createElement('div');
    wrap.className = 'cards hidden';
    wrap.id = 'cards-' + key;
    for (const sp of ALL_PLAYABLES) {
      if ((PLAYER_DEF[sp].eco || 'valley') !== key) continue;
      const info = CARD_INFO[sp] || { desc: '', tag: '', tagClass: 'mod' };
      const card = document.createElement('div');
      card.className = 'card';
      card.id = 'card-' + sp;
      // gender is a segmented toggle sat right under the preview (it changes the
      // dino you see); ownership is a corner badge on the preview (✓ / 🔒); the
      // chosen loadout's growth sits under the difficulty tag; skins are their
      // own swatch row lower down. Clicking the dino/body launches — the gender
      // bar and skin row swallow their own clicks.
      card.innerHTML = '<div class="prevwrap"><canvas width="200" height="120"></canvas><span class="ownbadge"></span></div>' +
        '<div class="gsel">' +
        '<span class="gseg" data-g="f">♀ Female<span class="tip"></span></span>' +
        '<span class="gseg" data-g="m">♂ Male<span class="tip"></span></span>' +
        '</div>' +
        '<h2></h2><div class="latin"></div><p></p>' +
        '<div class="diff"></div><div class="prog"></div>' +
        '<div class="price"></div>' +
        '<div class="skinsel"></div>';
      card.querySelector('canvas').id = 'prev-' + sp;
      card.querySelector('h2').textContent = DINO[sp].name.toUpperCase();
      card.querySelector('.latin').textContent = DINO[sp].full;
      card.querySelector('p').textContent = info.desc;
      const diff = card.querySelector('.diff');
      diff.textContent = info.tag;
      diff.classList.add(info.tagClass);
      // gender segments: hover one for the trait tooltip; clicking only changes
      // the selection (the bar swallows its clicks so it never launches the game)
      const verb = DINO[sp].tailWeapon ? 'swings' : DINO[sp].clawWeapon ? 'slashes' : DINO[sp].headButt ? 'rams' : 'bites';
      card.querySelector('.gseg[data-g="m"] .tip').textContent = 'bigger · tougher · ' + verb + ' harder · slower · earns fewer ❖';
      card.querySelector('.gseg[data-g="f"] .tip').textContent = 'quicker on her feet · earns more ❖';
      for (const seg of card.querySelectorAll('.gseg')) {
        seg.classList.toggle('sel', seg.dataset.g === cardGender(sp));
        seg.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (!Save.genderChoice) Save.genderChoice = {};
          Save.genderChoice[sp] = seg.dataset.g;
          saveSave();
          refreshCardOpts(sp);
          // no hover on touch: toggling is the moment to say what it means
          if (document.body.classList.contains('touch')) {
            flashTitleMsg(seg.dataset.g === 'm'
              ? '♂ bigger · tougher · ' + verb + ' harder · slower · earns fewer ❖'
              : '♀ quicker on her feet · earns more ❖');
          }
        });
      }
      // the gender bar and skin row swallow gap-clicks so only the dino launches
      card.querySelector('.gsel').addEventListener('click', (ev) => ev.stopPropagation());
      card.querySelector('.skinsel').addEventListener('click', (ev) => ev.stopPropagation());
      buildCardSkins(sp, card.querySelector('.skinsel'));
      card.addEventListener('click', () => tryPlay(sp));
      wrap.appendChild(card);
    }
    area.appendChild(wrap);
  }
}

function refreshTitle() {
  const bal = document.getElementById('gr-balance');
  bal.textContent = '';
  const nm = document.createElement('span');
  nm.className = 'pname';
  nm.textContent = '🦖 ' + (Profiles.current || '—');
  bal.appendChild(nm);
  bal.appendChild(document.createTextNode('  ·  ❖ ' + Save.growths));
  // ecosystem tabs + their card sets
  for (const key of Object.keys(ECOS)) {
    const eco = ECOS[key];
    const tab = document.getElementById('tab-' + key);
    const paid = ecoPaid(key);
    tab.classList.toggle('locked', !paid);
    tab.querySelector('.tabsub').textContent =
      paid ? eco.sub
        : anyMastery() ? 'UNLOCK — ❖ ' + eco.cost : '🔒 grow a dinosaur to FULL ADULT';
    tab.classList.toggle('sel', titleEco === key);
    document.getElementById('cards-' + key).classList.toggle('hidden', titleEco !== key);
  }
  // per-card ownership badge / price / progress state
  for (const sp of ALL_PLAYABLES) {
    const card = document.getElementById('card-' + sp);
    if (!card) continue;
    const def = PLAYER_DEF[sp];
    const owned = Save.owned[sp] || !def.cost;
    const reqLocked = def.req && !Save.mastery[def.req];
    // ownership is a corner badge on the preview now — ✓ owned, 🔒 not yet
    const badge = card.querySelector('.ownbadge');
    badge.textContent = owned ? '✓' : '🔒';
    badge.className = 'ownbadge ' + (owned ? 'owned' : 'locked');
    // the price row shows only while the dino is still locked (owned needs no row)
    const priceEl = card.querySelector('.price');
    if (owned) {
      priceEl.style.display = 'none';
      priceEl.textContent = '';
    } else {
      priceEl.style.display = '';
      priceEl.textContent = reqLocked
        ? 'grow ' + DINO[def.req].name.toUpperCase() + ' to Full Adult'
        : '❖ ' + def.cost + (Save.growths >= def.cost ? ' — TAP TO BUY' : ' — need ' + (def.cost - Save.growths) + ' more');
      priceEl.classList.toggle('poor', reqLocked || (def.cost > 0 && Save.growths < def.cost));
    }
    // the chosen loadout's growth sits right under the difficulty tag
    card.querySelector('.prog').textContent = cardProgText(sp);
    // rebuild the swatches so OWNED / affordability labels track the live
    // balance (they're first built at boot, before a profile is even chosen)
    buildCardSkins(sp, card.querySelector('.skinsel'));
  }
}
// the selected gender's saved growth, e.g. "♂ 100% Full Adult" (blank if new)
function cardProgText(sp) {
  const g = cardGender(sp);
  const s = Save.dino[dinoKey(sp, g)];
  return s && s.growth > 0.005 ? (g === 'm' ? '♂' : '♀') + ' ' + Math.floor(s.growth * 100) + '% ' + stageOf(s.growth) : '';
}

// the skin swatches on a species card — the inline heir to the old picker's
// skin row: same registry loop and buy flow, painted small onto the card
function buildCardSkins(sp, container) {
  container.innerHTML = '';
  const cur = cardSkin(sp);
  for (const id of Object.keys(SKINS)) {
    const def = SKINS[id];
    if (def.only && def.only !== sp) continue;      // species-exclusive coat
    const owned = skinOwned(sp, id);
    const selected = id === cur;
    const sq = document.createElement('div');
    sq.className = 'cskin' + (selected ? ' sel' : '') + (owned ? '' : ' forsale');
    sq.title = def.name + (def.cost && !owned ? ' — ❖ ' + def.cost : '');
    const cv = document.createElement('canvas');
    cv.width = 40; cv.height = 40;
    sq.appendChild(cv);
    drawSkinSwatch(cv, sp, id);
    // EVERY swatch carries a label so the row never changes height: BASE for
    // the free default, OWNED once a paid coat is bought, its ❖ price while
    // it's still locked. The green ✓ check (absolute, no layout effect) marks
    // whichever swatch is currently selected — Classic included.
    const label = document.createElement('div');
    if (!def.cost) { label.className = 'csklabel base'; label.textContent = 'BASE'; }
    else if (owned) { label.className = 'csklabel owned'; label.textContent = 'OWNED'; }
    else { label.className = 'csklabel' + (Save.growths < def.cost ? ' poor' : ''); label.textContent = '❖' + def.cost; }
    sq.appendChild(label);
    if (selected) {
      const chk = document.createElement('span');
      chk.className = 'cskchk';
      chk.textContent = '✓';
      sq.appendChild(chk);
    }
    sq.addEventListener('click', (ev) => {
      ev.stopPropagation();
      let bought = false;
      if (!skinOwned(sp, id)) {
        if (Save.growths < def.cost) { flashTitleMsg(def.name + ' costs ❖ ' + def.cost + needMsg(def.cost)); return; }
        Save.growths -= def.cost;
        if (!Save.skinOwned) Save.skinOwned = {};
        Save.skinOwned[sp + ':' + id] = true;
        bought = true;
      } else if (cardSkin(sp) === id) return;
      if (!Save.skinChoice) Save.skinChoice = {};
      Save.skinChoice[sp] = id;
      saveSave();            // persist FIRST — before anything that could throw
      refreshTitle();        // the ❖ balance + card prices
      refreshCardOpts(sp);   // .sel/check states + the card's preview
      if (bought) {
        try { SFX.buy(); } catch (e) { }
        flashTitleMsg(def.name.toUpperCase() + ' unlocked for ' + DINO[sp].name + '!');
      }
    });
    container.appendChild(sq);
  }
}
// after a chip/swatch change: move the checkmarks and re-render the preview to
// the chosen loadout (retiring the old preview loops via animateAllPreviews)
function refreshCardOpts(sp) {
  const card = document.getElementById('card-' + sp);
  if (!card) return;
  const g = cardGender(sp);
  for (const seg of card.querySelectorAll('.gseg')) seg.classList.toggle('sel', seg.dataset.g === g);
  card.querySelector('.prog').textContent = cardProgText(sp);   // growth follows the chosen loadout
  const skinsel = card.querySelector('.skinsel');
  if (skinsel) buildCardSkins(sp, skinsel);
  animateAllPreviews();
}

function tryEcoTab(key) {
  const eco = ECOS[key];
  if (eco.cost) {
    if (!anyMastery()) { flashTitleMsg('Grow any dinosaur to FULL ADULT to discover ' + eco.name + '!'); return; }
    if (!Save.ecoPaid[key]) {
      if (Save.growths < eco.cost) { flashTitleMsg('Unlocking ' + eco.name + ' costs ❖ ' + eco.cost + needMsg(eco.cost)); return; }
      Save.growths -= eco.cost;
      Save.ecoPaid[key] = true;
      saveSave();
      SFX.buy();
      flashTitleMsg(eco.name.toUpperCase() + ' UNLOCKED!');
    }
  }
  titleEco = key;
  refreshTitle();
  animateAllPreviews();
}
// UI transition guard: SPACE-mashing must never re-click a focused button, and
// the second click of a double-click must never land on the screen that just
// appeared (death "CHANGE SPECIES" sits exactly where the lobby cards open)
let lastUiSwitch = -1e9;
function uiSwitchBlocked() { return performance.now() - lastUiSwitch < 450; }
function markUiSwitch() { lastUiSwitch = performance.now(); }
function tryPlay(species) {
  if (G.started || uiSwitchBlocked()) return;
  const def = PLAYER_DEF[species];
  // some dinos demand proof first: master a specific species to unlock them
  if (def.req && !Save.mastery[def.req] && !Save.owned[species]) {
    flashTitleMsg('Grow ' + DINO[def.req].name + ' to FULL ADULT to unlock ' + DINO[species].name + '!');
    return;
  }
  if (def.cost && !Save.owned[species]) {
    if (Save.growths < def.cost) {
      flashTitleMsg(DINO[species].name + ' costs ❖ ' + def.cost + needMsg(def.cost));
      return;
    }
    Save.growths -= def.cost;
    Save.owned[species] = true;
    saveSave();
    SFX.buy();
    refreshTitle();
  }
  // no popup any more: the card already carries the gender + skin choice.
  // Launch straight into the game with whatever is selected on the card.
  const g = cardGender(species);
  const sk = cardSkin(species);   // already validated + owned
  if (!Save.skinChoice) Save.skinChoice = {};
  if (!Save.genderChoice) Save.genderChoice = {};
  Save.skinChoice[species] = sk;
  Save.genderChoice[species] = g;
  saveSave();
  startGame(species, g, sk);
}

// ---------- skin swatches (painted onto each species card) ----------
// one square per skin — a little painted swatch of that skin's markings
function drawSkinSwatch(cv, species, skinId) {
  const x = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const C = skinColors(species, null, skinId);
  x.fillStyle = C.mid; x.fillRect(0, 0, W, H);
  x.fillStyle = C.top; x.fillRect(0, 0, W, H * 0.34);
  x.fillStyle = C.belly; x.fillRect(0, H * 0.82, W, H * 0.18);
  x.fillStyle = C.pat;
  x.globalAlpha = 0.85;
  for (const fx of [0.3, 0.62]) {
    x.beginPath();
    x.moveTo(W * fx - W * 0.05, 0); x.lineTo(W * fx + W * 0.08, 0);
    x.quadraticCurveTo(W * fx + W * 0.02, H * 0.5, W * fx - W * 0.02, H * 0.86);
    x.lineTo(W * fx - W * 0.12, H * 0.86);
    x.quadraticCurveTo(W * fx - W * 0.08, H * 0.5, W * fx - W * 0.05, 0);
    x.closePath(); x.fill();
  }
  x.globalAlpha = 1;
  if (skinId === 'ripcel') {
    for (const [dx, dy, r] of [[0.18, 0.42, 0.1], [0.48, 0.62, 0.085], [0.82, 0.35, 0.11], [0.72, 0.74, 0.07]]) {
      x.fillStyle = C.acc;
      x.beginPath(); x.arc(W * dx, H * dy, W * r, 0, Math.PI * 2); x.fill();
      x.fillStyle = mixHex(C.acc, '#ffffff', 0.55);
      x.beginPath(); x.arc(W * dx - W * r * 0.25, H * dy - W * r * 0.3, W * r * 0.42, 0, Math.PI * 2); x.fill();
    }
  }
  x.strokeStyle = C.line; x.lineWidth = 3; x.strokeRect(0, 0, W, H);
}
document.getElementById('btn-respawn').addEventListener('click', () => {
  document.getElementById('death').classList.add('hidden');
  respawn(G.player.species, G.player.gender, G.player.skin);
});
function exitToLobby() {
  if (uiSwitchBlocked()) return;
  markUiSwitch();
  saveDinoSnapshot();
  document.getElementById('death').classList.add('hidden');
  document.getElementById('title').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  G.started = false;
  titleEco = World.eco;
  refreshTitle();
  animateAllPreviews();
}
document.getElementById('btn-title').addEventListener('click', exitToLobby);
document.getElementById('btn-lobby').addEventListener('click', (ev) => {
  if (ev.detail === 0) return;   // keyboard-activated "click" (SPACE/Enter) — never leave the game for that
  if (G.started) exitToLobby();
});
// buttons must never hold keyboard focus, or SPACE (bite!) re-clicks them mid-game
for (const id of ['btn-lobby', 'btn-respawn', 'btn-title']) {
  const b = document.getElementById(id);
  b.setAttribute('tabindex', '-1');
  b.addEventListener('mousedown', (ev) => ev.preventDefault());   // click still fires; focus never sticks
}

const START_BANNERS = {
  raja: 'You hatch in the fern forest. Grow. Hunt. Survive.',
  campto: 'You hatch on the open plains. Reach the ferns before Moros finds you!',
  ichthyo: 'You hatch in the southern swamp. The deep water belongs to you alone.',
  qianzho: 'You hatch on Skull Prairie. Grow slowly — become its fastest hunter.',
  scutello: 'You hatch in armor. Eat, earn, and stay clear of the Troodon packs.',
  metria: 'You hatch in the waving grass. The herds are food — earn your place.',
  giganto: 'You hatch spined. Turn your back to fight, and let the tail talk.',
  crista: 'You hatch by the shore. One day the surf itself will fear you.',
  linhe: 'You hatch on the ash. Nothing here forgives — be faster than all of it.',
  nothro: 'You hatch beneath the ash clouds. Grow tall; the claws will answer.',
  aardi: 'You hatch scruffy and small. Find your kin — alone you are nothing.',
  centro: 'You hatch on the floodplain. Grow the horn — then stop retreating.',
  omni: 'You hatch among the islands. Run the sandbars; the channels have teeth.',
  eotrach: 'You hatch by the braided water. Outlast everything — that is the trick.',
  loki: 'You hatch crowned. Grow into the horns and the delta will make way.',
  moro: 'You hatch impossibly small. One day the ground will shake instead.',
  spino: 'You hatch where the river splits. All of it will be yours. Eventually.',
  tyranno: 'You hatch with shark teeth. Every wound you open works for you.',
};
function startGame(species, gender, skin) {
  const def = PLAYER_DEF[species];
  if (def.cost && !Save.owned[species]) return;      // never start an unowned dino
  if (def.req && !Save.mastery[def.req] && !Save.owned[species]) return;   // …or one whose mastery gate is shut
  const eco = def.eco || 'valley';
  if (!ecoPaid(eco)) return;                         // …or a locked ecosystem
  markUiSwitch();
  if (World.eco !== eco) {
    genWorld(eco);
    buildMinimap();
  }
  G.eruption = { nextT: 35 + Math.random() * 15, warn: 0, bombs: [] };
  document.getElementById('title').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('ic-food').className = 'sicon ' + (def.diet === 'carn' ? 'ic-meat' : 'ic-leaf');
  G.started = true;
  respawn(species, gender, skin);
  const gWord = G.player.gender === 'm' ? 'male' : 'female';
  if (G.player.growth > 0.005) {
    G.banner = { str: 'Welcome back! Your ' + gWord + ' ' + DINO[species].name + ' is ' + Math.floor(G.player.growth * 100) + '% grown.', t: 5, color: '#ffe9a0' };
  } else {
    G.banner = { str: START_BANNERS[species] || 'You hatch. Grow. Survive.', t: 6, color: '#ffe9a0' };
  }
}

function respawn(species, gender, skin) {
  spawnInitialNPCs();
  G.mate = null;
  G.nesting = { stage: 'none', babies: [] };
  G.wrestle = null;
  G.pack = [];
  G.burrow = null;
  G.carcasses.length = 0;
  G.particles.length = 0;
  G.floats.length = 0;
  G.player = makePlayer(species, gender, skin);
  // the lobby remembers your dino — restore this loadout's saved progress
  const snap = Save.dino[dinoKey(species, G.player.gender)];
  if (snap && snap.growth > 0.005) {
    const p = G.player;
    p.growth = clamp(snap.growth, 0, 1);
    p.stage = stageOf(p.growth);
    p.hp = clamp(snap.hp, 1, playerMaxHp());
    p.food = clamp(snap.food, 0, 100);
    p.water = clamp(snap.water, 0, 100);
    p.stamina = clamp(snap.stamina, 0, PLAYER_DEF[species].stamMax);
    p.hygiene = clamp(snap.hygiene, 0, 100);
    const okPos = snap.x > 20 && snap.x < WORLD_W - 20 && snap.y > 20 && snap.y < WORLD_H - 20 &&
      (!isDeepPx(snap.x, snap.y) || PLAYER_DEF[species].swim);
    if (okPos) { p.x = snap.x; p.y = snap.y; }
  }
  G.player.bornAt = G.time;
  G.paused = false;
  document.getElementById('pause').classList.add('hidden');
  // clear predators camping the nest and push their homes away
  // (this eco's hunting carnivores — derived, so new species are covered)
  const preds = ECO_SPAWNS[World.eco].map(s => s.sp).filter(isPredatorNPC);
  for (let i = G.npcs.length - 1; i >= 0; i--) {
    const e = G.npcs[i];
    if (!preds.includes(e.species)) continue;
    if (dist(e.x, e.y, G.player.x, G.player.y) < 450) G.npcs.splice(i, 1);
    else if (dist(e.home.x, e.home.y, G.player.x, G.player.y) < 800) {
      const a = angTo(G.player.x, G.player.y, e.home.x, e.home.y);
      e.home.x = clamp(G.player.x + Math.cos(a) * 900, 40, WORLD_W - 40);
      e.home.y = clamp(G.player.y + Math.sin(a) * 900, 40, WORLD_H - 40);
    }
  }
}

G.onPlayerDeath = function (cause) {
  const p = G.player;
  const mins = Math.floor((G.time - p.bornAt) / 60);
  const secs = Math.floor((G.time - p.bornAt) % 60);
  // death is real: this loadout's saved progress is gone
  delete Save.dino[dinoKey(p.species, p.gender)];
  saveSave();
  document.getElementById('death-cause').textContent =
    'Killed by ' + cause + ' as a ' + stageOf(p.growth).toLowerCase() +
    ' — survived ' + mins + 'm ' + String(secs).padStart(2, '0') + 's';
  setTimeout(() => document.getElementById('death').classList.remove('hidden'), 900);
};
window.addEventListener('beforeunload', saveDinoSnapshot);

// ---------- player profiles: pick who's playing, then grow dinos ----------
function renderProfiles() {
  const list = document.getElementById('profile-list');
  list.innerHTML = '';
  // leaderboard order: lifetime growths earned (spending never costs you rank)
  const names = Object.keys(Profiles.players)
    .sort((a, b) => (Profiles.players[b].earned || 0) - (Profiles.players[a].earned || 0));
  const MEDALS = ['🥇', '🥈', '🥉'];
  names.forEach((name, rank) => {
    const s = Profiles.players[name];
    const card = document.createElement('div');
    card.className = 'profcard';
    const nm = document.createElement('span');
    nm.className = 'pname';
    nm.textContent = (MEDALS[rank] || '🦖') + ' ' + name;   // textContent: names render as typed, never as markup
    const st = document.createElement('span');
    st.className = 'pstats';
    const dinos = Object.keys(s.dino || {}).length;
    const worlds = 1 + Object.keys(s.ecoPaid || {}).filter(k => s.ecoPaid[k]).length + (s.prairiePaid ? 1 : 0);
    st.innerHTML = '<b>✦ ' + (s.earned | 0) + '</b> score · ❖ ' + (s.growths | 0) + '<br>' +
      dinos + ' dino' + (dinos === 1 ? '' : 's') + ' growing' + (worlds > 1 ? ' · 🌍 ' + worlds + ' worlds' : '');
    // hover reveals a delete button; first click arms it, second confirms
    const del = document.createElement('span');
    del.className = 'pdel';
    del.title = 'delete this player';
    del.textContent = '✕';
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();                           // never select the profile you're deleting
      if (del._armed) { deleteProfile(name); return; }
      del._armed = true;
      del.textContent = 'SURE?';
      del.classList.add('armed');
      setTimeout(() => { del._armed = false; del.textContent = '✕'; del.classList.remove('armed'); }, 2500);
    });
    card.appendChild(nm);
    card.appendChild(st);
    card.appendChild(del);
    card.addEventListener('click', () => selectProfile(name));
    list.appendChild(card);
  });
  document.getElementById('new-name').value = '';
}
function deleteProfile(name) {
  delete Profiles.players[name];
  if (Profiles.current === name) { Profiles.current = null; Save = defaultSave(); }
  saveSave();
  flashProfileMsg(name + ' and all their dinos are gone.');
  renderProfiles();
}
function selectProfile(name) {
  if (uiSwitchBlocked()) return;
  markUiSwitch();
  Profiles.current = name;
  Save = Object.assign(defaultSave(), Profiles.players[name]);
  if (!Save.earned && Save.growths) Save.earned = Save.growths;   // seed pre-leaderboard profiles
  if (Save.prairiePaid) { Save.ecoPaid.prairie = true; delete Save.prairiePaid; }   // pre-registry saves
  saveSave();
  document.getElementById('profiles').classList.add('hidden');
  document.getElementById('title').classList.remove('hidden');
  titleEco = 'valley';
  refreshTitle();
  animateAllPreviews();
}
function createProfile() {
  const input = document.getElementById('new-name');
  const name = input.value.trim();
  if (!name) { flashProfileMsg('Type a name first!'); input.focus(); return; }
  if (Profiles.players[name]) { flashProfileMsg('That player already exists — click it to play!'); return; }
  if (Object.keys(Profiles.players).length >= 8) { flashProfileMsg('The nest is full — 8 players max!'); return; }
  // the very first player adopts any progress from before profiles existed
  const inherited = legacySave && !Object.keys(Profiles.players).length;
  Profiles.players[name] = inherited ? Object.assign(defaultSave(), legacySave) : defaultSave();
  try { localStorage.removeItem(LEGACY_SAVE_KEY); } catch (e) { }
  selectProfile(name);
}
function showProfiles() {
  if (G.started || uiSwitchBlocked()) return;   // only from the lobby, never mid-game
  markUiSwitch();
  saveSave();
  document.getElementById('title').classList.add('hidden');
  document.getElementById('profiles').classList.remove('hidden');
  renderProfiles();
}
document.getElementById('btn-create').addEventListener('click', createProfile);
document.getElementById('new-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') createProfile(); });
document.getElementById('gr-balance').addEventListener('click', showProfiles);
buildTitleUI();
renderProfiles();
refreshTitle();

// ---------- resize ----------
function resize() {
  // measure the VISIBLE viewport: on iOS Safari the URL bar overlays part of
  // window.innerHeight, and visualViewport is the only honest answer
  const vv = window.visualViewport;
  const iw = Math.round((vv && vv.width) || window.innerWidth);
  const ih = Math.round((vv && vv.height) || window.innerHeight);
  if (!iw || !ih) return;
  // the view width follows the screen's aspect — the biome fills the estate.
  // No scale floor: a window shorter than 360px simply shows the world a
  // little smaller instead of cropping it (RS keeps the backing store sharp)
  VIEW_W = clamp(Math.round(iw / ih * VIEW_H), 560, 960);
  const scale = Math.min(iw / VIEW_W, ih / VIEW_H);
  const w = Math.floor(VIEW_W * scale), h = Math.floor(VIEW_H * scale);
  // back the canvas with real pixels so the vector art renders sharp
  // (phones get a lower cap: their 3×+ displays would quadruple the fill
  // cost for sharpness nobody can see at arm's length)
  const dpr = window.devicePixelRatio || 1;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  G.RS = clamp(scale * dpr, 1, coarse ? 2 : 3);
  const bw = Math.round(VIEW_W * G.RS), bh = Math.round(VIEW_H * G.RS);
  if (canvas.width !== bw || canvas.height !== bh) {
    // only when it really changed: assigning width clears the canvas,
    // and the terrain chunk cache is baked per render scale
    canvas.width = bw;
    canvas.height = bh;
    clearGroundCache();
  }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const wrap = document.getElementById('wrap');
  wrap.style.width = w + 'px';
  wrap.style.height = h + 'px';
}
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', resize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
resize();
// safety net: some environments report 0×0 until the tab is shown
let lastInner = window.innerWidth + 'x' + window.innerHeight;
setInterval(() => {
  const now = window.innerWidth + 'x' + window.innerHeight;
  if (now !== lastInner) { lastInner = now; resize(); }
}, 500);

// ---------- minimap ----------
function buildMinimap() {
  const mm = document.getElementById('minimap');
  const c2 = mm.getContext('2d');
  const img = c2.createImageData(WT, HT);
  for (let ty = 0; ty < HT; ty++) {
    for (let tx = 0; tx < WT; tx++) {
      const t = World.ter[tIdx(tx, ty)];
      const ff = World.forest[tIdx(tx, ty)];
      let col;
      if (t === T_DEEP) col = [44, 74, 88];
      else if (t === T_WATER) col = [64, 104, 118];
      else if (t === T_SAND) col = [186, 170, 128];
      else if (t === T_MUD) col = [100, 74, 52];
      else if (t === T_LAVA) col = [216, 74, 30];
      else if (ff > 0.42) col = World.lush ? [46, 88, 44] : [92, 104, 58];
      else if (World.ashy) col = [128, 122, 108];
      else if (World.lush) col = [96, 128, 62];
      else col = [158, 152, 88];
      const i = (ty * WT + tx) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
    }
  }
  // stash base image on an offscreen canvas
  const base = document.createElement('canvas');
  base.width = WT; base.height = HT;
  base.getContext('2d').putImageData(img, 0, 0);
  G.minimapBase = base;
}
function drawMinimap() {
  const mm = document.getElementById('minimap');
  const c2 = mm.getContext('2d');
  c2.imageSmoothingEnabled = false;
  c2.drawImage(G.minimapBase, 0, 0, mm.width, mm.height);
  const sx = mm.width / WORLD_W, sy = mm.height / WORLD_H;
  // nests
  for (const k in World.nests) {
    const n = World.nests[k];
    c2.fillStyle = k === G.player.species ? '#ffd23e' : '#c9a96a';
    c2.fillRect(n.x * sx - 1.5, n.y * sy - 1.5, 3, 3);
  }
  // player
  const p = G.player;
  const blink = Math.floor(G.time * 3) % 2 === 0;
  c2.fillStyle = blink ? '#ffffff' : '#ffdd88';
  c2.fillRect(p.x * sx - 2, p.y * sy - 2, 4, 4);
  c2.strokeStyle = 'rgba(0,0,0,0.5)';
  c2.strokeRect(p.x * sx - 2.5, p.y * sy - 2.5, 5, 5);
}

// ---------- nesting: courtship, eggs, and raising the young ----------
// A full adult gets a full-adult mate of the opposite sex. The male displays
// (an NPC male struts on his own; a player male displays with N and the
// female judges his CONDITION — health, food, hygiene). Accepted pairs nest
// with N: three eggs, guarded until hatch day, then the babies follow the
// female until they're grown — and every one raised pays out ❖ 150.
function updateNesting(dt) {
  const p = G.player, ns = G.nesting;
  if (!G.started || !p || !p.alive || !ns) { if (G.input) G.input.nest = false; return; }
  const nest = World.nests[p.species];
  const nPressed = G.input.nest;
  G.input.nest = false;

  // mate housekeeping: a fallen mate ends the courtship — but eggs already
  // laid and babies already hatched carry on under the survivor's guard
  if (G.mate && (G.mate.hp <= 0 || !G.npcs.includes(G.mate))) {
    G.mate = null;
    if (ns.stage === 'courting' || ns.stage === 'accepted') {
      ns.stage = 'none'; ns.mateT = 30;
      G.banner = { str: 'Your mate is gone…', t: 5, color: '#ff6a5e' };
    } else {
      G.banner = { str: 'Your mate has fallen — the ' + (ns.stage === 'eggs' ? 'clutch' : 'young') + ' are yours alone now.', t: 6, color: '#ff6a5e' };
    }
  }

  // …or choose your own: any grown opposite-gender packmate can be taken as
  // a mate — stand close and press N (the courtship still has to be danced,
  // and your own grown young are packmates forever, never mates)
  if (ns.stage === 'none' && p.growth >= 1 && !G.mate && G.pack && G.pack.length) {
    let cand = null, cd = 70;
    for (const e of G.pack) {
      if (e.isBaby || e.isMate || e.kinYoung || e.hp <= 0) continue;
      if (!e.gender || e.gender === p.gender) continue;
      const dd = dist(e.x, e.y, p.x, p.y);
      if (dd < cd) { cd = dd; cand = e; }
    }
    if (cand) {
      G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'N — Take ' + (cand.gender === 'm' ? 'him' : 'her') + ' as your mate';
      if (nPressed) {
        const def = PLAYER_DEF[p.species];
        G.mate = cand;
        cand.isMate = true;
        cand.growth = Math.max(cand.growth != null ? cand.growth : 1, 0.9);
        cand.maxhp = Math.round(def.hp * GENDER_MOD[cand.gender].hp);
        cand.hp = Math.min(cand.maxhp, Math.max(cand.hp, cand.maxhp * 0.6));
        cand.mateDef = {
          hp: cand.maxhp, dmg: def.dmg, atkCd: def.atkCd, speed: def.speed * 0.9,
          fleeSpeed: def.speed, detect: 280, homeR: 320, reach: def.reach,
          biome: 'any', turn: 2.4, fearless: true, melee: { kb: 160 },
        };
        ns.stage = 'courting'; ns.mateT = null;
        SFX.stage();
        G.banner = p.gender === 'f'
          ? { str: 'You choose him from your own pack — now hear him out.', t: 6, color: '#e8a0c0' }
          : { str: 'You choose her from your own pack. Press N near her to DISPLAY!', t: 6, color: '#e8a0c0' };
        return;
      }
    }
  }

  // a mate appears (a little while) after you reach full adulthood
  if (ns.stage === 'none' && p.growth >= 1) {
    ns.mateT = (ns.mateT != null ? ns.mateT : 6) - dt;
    if (ns.mateT <= 0) {
      G.mate = makeMate(p.species, p.gender === 'f' ? 'm' : 'f');
      G.npcs.push(G.mate);
      // an aardiraptor's mate is pack the moment it arrives
      if (p.species === 'aardi') {
        G.mate.packAlpha = true;
        G.pack.push(G.mate);
        floatText(G.mate.x, G.mate.y - 34, '♦', '#ffd23e');
      }
      ns.stage = 'courting'; ns.mateT = null;
      G.banner = p.gender === 'f'
        ? { str: 'A full-grown male of your kind has come to the nest — hear him out.', t: 6, color: '#e8a0c0' }
        : { str: 'A full-grown female waits by your nest. Press N near her to DISPLAY!', t: 6, color: '#e8a0c0' };
    }
  }
  // eggs and babies carry on without a mate; only courtship needs him/her
  if (ns.stage === 'none' || (ns.stage === 'courting' && !G.mate)) return;
  const mateDist = G.mate ? dist(p.x, p.y, G.mate.x, G.mate.y) : 1e9;

  if (ns.stage === 'courting') {
    if (p.gender === 'f') {
      // he displays — the female judges, and N beside him is a yes
      if (G.mate.state === 'display' && mateDist < 140) {
        if (!G.prompt) G.prompt = 'N — accept his display';
        if (nPressed) {
          ns.stage = 'accepted';
          SFX.stage();
          G.banner = { str: 'You accept! Stand at your nest and press N to lay the eggs.', t: 6, color: '#e8a0c0' };
        }
      }
    } else {
      // the player male displays; she judges his condition
      if (nPressed && mateDist < 140 && !(p.displayT > 0)) {
        p.displayT = 3;
        floatText(p.x, p.y - 54, 'displaying…', '#e8a0c0');
      }
      if (p.displayT > 0) {
        p.displayT -= dt;
        p.headDown = 0.35 + 0.35 * Math.sin(G.time * 3.2);   // the deep courtship bows
        p.move = 0;
        if (Math.random() < dt * 1.6) floatText(p.x + rrange(-14, 14), p.y - 50, '♪', '#e8a0c0');
        if (p.displayT <= 0) {
          const score = p.hp / playerMaxHp() + p.food / 100 + p.hygiene / 100;
          if (score >= 2.0) {
            ns.stage = 'accepted';
            SFX.stage();
            G.banner = { str: 'She is impressed! Stand at the nest and press N to lay the eggs.', t: 6, color: '#e8a0c0' };
          } else {
            G.banner = { str: 'She is not impressed… eat well, drink, and take a mud bath — then try again.', t: 6, color: '#c9a9b4' };
          }
        }
      }
    }
  } else if (ns.stage === 'accepted') {
    ns.reNestT = Math.max(0, (ns.reNestT || 0) - dt);
    if (dist(p.x, p.y, nest.x, nest.y) < 100 && ns.reNestT <= 0) {
      if (!G.prompt) G.prompt = 'N — nest here';
      if (nPressed) {
        ns.stage = 'eggs'; ns.eggs = 3; ns.hatchT = 120;
        ns.raidT = rrange(18, 30); ns.eatT = 0;
        SFX.stage();
        G.banner = { str: 'THREE EGGS! Guard the nest until hatch day.', t: 6, color: '#ffd23e' };
      }
    }
  } else if (ns.stage === 'eggs' && ns.den) {
    // a den clutch: deep underground, out of every raider's reach
    tickDenBrood(dt);
  } else if (ns.stage === 'eggs') {
    ns.hatchT -= dt;
    // every so often something hungry catches the scent
    ns.raidT -= dt;
    if (ns.raidT <= 0) {
      ns.raidT = rrange(20, 34);
      let best = null, bd = 1000;
      for (const o of G.npcs) {
        if (isFamily(o) || !isPredatorNPC(o.species)) continue;
        const dd = dist(o.x, o.y, nest.x, nest.y);
        if (dd < bd && dd > 120) { bd = dd; best = o; }
      }
      if (best) {
        best.state = 'wander';
        best.tx = nest.x + rrange(-16, 16); best.ty = nest.y + rrange(-12, 12);
        best.stateT = 16;
        floatText(nest.x, nest.y - 40, 'something smells the eggs…', '#ffb0a0');
      }
    }
    // a predator standing on the nest eats through the clutch — but never
    // the family crowding around it
    let eater = null;
    for (const o of G.npcs) {
      if (isFamily(o)) continue;
      if (isPredatorNPC(o.species) && dist(o.x, o.y, nest.x, nest.y) < 46) { eater = o; break; }
    }
    if (eater) {
      ns.eatT = (ns.eatT || 0) + dt;
      if (ns.eatT > 2.5) {
        ns.eatT = 0; ns.eggs--;
        bloodBurst(nest.x, nest.y, 4);
        floatText(nest.x, nest.y - 34, 'AN EGG IS LOST!', '#ff6a5e');
        SFX.hurt();
        eater.state = 'idle'; eater.stateT = 1.5;
        if (ns.eggs <= 0) {
          ns.stage = 'accepted'; ns.reNestT = 40;
          G.banner = { str: 'The nest is lost… in time, you can try again.', t: 6, color: '#ff6a5e' };
        }
      }
    } else ns.eatT = 0;
    if (ns.stage === 'eggs' && ns.hatchT <= 0) {
      ns.stage = 'babies';
      ns.guardian = p.gender === 'f' ? 'player' : 'mate';   // the female raises them
      ns.babies = [];
      for (let i = 0; i < ns.eggs; i++) {
        const b = makeBaby(p.species, nest.x + rrange(-24, 24), nest.y + rrange(10, 30));
        ns.babies.push(b); G.npcs.push(b);
        // aardiraptor young are PACK from their first breath
        if (p.species === 'aardi') {
          b.packAlpha = true;
          G.pack.push(b);
          floatText(b.x, b.y - 30, '♦', '#ffd23e');
        }
      }
      SFX.stage();
      G.banner = {
        str: 'THE EGGS HATCH! ' + (ns.guardian === 'player'
          ? 'Your little ones follow you — keep them alive until they grow.'
          : 'She keeps them close — keep the hunters away.'), t: 7, color: '#ffd23e',
      };
    }
  } else if (ns.stage === 'babies') {
    tickDenBrood(dt);   // den babies grow below until sub-adult, then emerge
    const outside = ns.babies.filter(b => !b.den);
    ns.raidT = (ns.raidT || 12) - dt;
    if (ns.raidT <= 0 && outside.length) {
      ns.raidT = rrange(24, 40);
      const target = outside[Math.floor(Math.random() * outside.length)];
      let best = null, bd = 900;
      for (const o of G.npcs) {
        if (isFamily(o) || !isPredatorNPC(o.species)) continue;
        const dd = dist(o.x, o.y, target.x, target.y);
        if (dd < bd && dd > 100) { bd = dd; best = o; }
      }
      if (best) { best.state = 'chase'; best.target = target; best.stateT = 6; }
    }
    for (let i = ns.babies.length - 1; i >= 0; i--) {
      const b = ns.babies[i];
      if (b.den) continue;   // safe below — tickDenBrood raises those
      if (!G.npcs.includes(b)) {
        ns.babies.splice(i, 1);
        G.banner = { str: 'A little one is lost…', t: 4, color: '#ff6a5e' };
        continue;
      }
      b.growth = Math.min(1, b.growth + dt / 240);
      b.maxhp = Math.round(PLAYER_DEF[p.species].hp * hpFrac(b.growth));
      b.hp = Math.min(b.maxhp, b.hp + dt * 2);
      if (b.growth >= 0.9) {
        awardGrowths(150, b.x, b.y - 40);
        if (b.packAlpha && p.species === 'aardi') {
          // an aardiraptor's young doesn't set off — it takes its place in
          // the pack, a full hunter now (kinYoung: your own blood is a
          // packmate forever, never a mate)
          b.isBaby = false;
          b.kinYoung = true;
          floatText(b.x, b.y - 56, 'your young joins the pack — grown!', '#ffd23e');
        } else {
          floatText(b.x, b.y - 56, 'your young sets off — grown!', '#ffd23e');
          const gi = G.npcs.indexOf(b);
          if (gi >= 0) G.npcs.splice(gi, 1);
        }
        ns.babies.splice(i, 1);
      }
    }
    if (!ns.babies.length) {
      ns.stage = 'accepted'; ns.reNestT = 45;
      G.banner = { str: 'Your brood is raised! The nest is ready whenever you both are.', t: 6, color: '#ffd23e' };
    }
  }
}

// the clutch, drawn on the nest with its hatch countdown
function drawEggs(ctx2, n, ns) {
  for (let i = 0; i < ns.eggs; i++) {
    const ex = n.x + (i - (ns.eggs - 1) / 2) * 9, ey = n.y + 4;
    ctx2.fillStyle = '#efe8d2';
    ctx2.strokeStyle = '#6a5c40';
    ctx2.lineWidth = 0.8;
    ctx2.beginPath(); ctx2.ellipse(ex, ey - 3, 3.4, 4.4, 0, 0, TAU); ctx2.fill(); ctx2.stroke();
    ctx2.fillStyle = 'rgba(140,120,80,0.5)';
    ctx2.fillRect(ex - 1, ey - 5, 1, 1);
    ctx2.fillRect(ex + 1, ey - 3, 1, 1);
  }
  ctx2.font = 'bold 8px monospace';
  ctx2.textAlign = 'center';
  ctx2.fillStyle = 'rgba(255,240,200,0.85)';
  ctx2.fillText('hatching in ' + Math.max(0, Math.ceil(ns.hatchT)) + 's', n.x, n.y - 26);
}

// ---------- day / night cycle ----------
// one full day every 8 minutes; the game starts mid-morning
const DAY_LEN = 480;
const DAYKEYS = [
  { t: 0.00, m: [255, 178, 152, 0.15], g: [255, 176, 136, 0.10] },  // dawn
  { t: 0.09, m: [255, 255, 255, 0.00], g: [255, 200, 120, 0.00] },  // morning
  { t: 0.50, m: [255, 255, 255, 0.00], g: [255, 200, 120, 0.00] },  // afternoon
  { t: 0.58, m: [238, 156, 108, 0.20], g: [255, 156, 66, 0.11] },   // golden dusk
  { t: 0.70, m: [108, 132, 196, 0.38], g: [140, 170, 255, 0.03] },  // nightfall
  { t: 0.90, m: [104, 128, 194, 0.40], g: [140, 170, 255, 0.03] },  // deep night
  { t: 1.00, m: [255, 178, 152, 0.15], g: [255, 176, 136, 0.10] },  // dawn again
];
function daylight() {
  const dayT = ((G.time / DAY_LEN) + 0.14) % 1;
  let a = DAYKEYS[0], b = DAYKEYS[DAYKEYS.length - 1];
  for (let i = 0; i < DAYKEYS.length - 1; i++) {
    if (dayT >= DAYKEYS[i].t && dayT <= DAYKEYS[i + 1].t) { a = DAYKEYS[i]; b = DAYKEYS[i + 1]; break; }
  }
  const span = b.t - a.t || 1;
  const f = (1 - Math.cos(Math.PI * clamp((dayT - a.t) / span, 0, 1))) / 2;  // ease
  const mix4 = (u, v) => [0, 1, 2, 3].map(i => lerp(u[i], v[i], f));
  const nightF = clamp((dayT - 0.60) / 0.09, 0, 1) * clamp((0.985 - dayT) / 0.06, 0, 1);
  const duskF = clamp((dayT - 0.52) / 0.05, 0, 1) * clamp((0.68 - dayT) / 0.06, 0, 1);
  return { m: mix4(a.m, b.m), g: mix4(a.g, b.g), nightF, duskF, dayT };
}

// ---------- ambient life: drifting leaves, motes, seeds, butterflies ----------
G.ambient = [];
function spawnAmbient() {
  const x = G.camX + Math.random() * VIEW_W;
  const y = G.camY + Math.random() * VIEW_H;
  const ff = forestShadePx(x, y);
  const nightF = (G.day && G.day.nightF) || 0;
  let type;
  if (nightF > 0.35 && ff > 0.3) type = Math.random() < 0.75 ? 'firefly' : 'mote';
  else if (isWaterPx(x, y)) type = 'mote';
  else if (ff > 0.45) type = Math.random() < 0.55 ? 'leaf' : 'mote';
  else type = Math.random() < (nightF > 0.3 ? 0 : 0.2) ? 'butterfly' : 'seed';
  G.ambient.push({
    type, x, y, t: 0, life: 5 + Math.random() * 7,
    ph: Math.random() * TAU,
    vx: type === 'seed' ? 5 + Math.random() * 4 : 2,
    vy: type === 'leaf' ? 5 + Math.random() * 5 : 0,
    hue: Math.random(),
  });
}
function updateAmbient(dt) {
  while (G.ambient.length < 22) spawnAmbient();
  for (let i = G.ambient.length - 1; i >= 0; i--) {
    const a = G.ambient[i];
    a.t += dt;
    if (a.type === 'leaf') {
      a.x += Math.sin(a.t * 1.8 + a.ph) * 12 * dt + 3 * dt;
      a.y += a.vy * dt;
    } else if (a.type === 'seed') {
      a.x += a.vx * dt;
      a.y += Math.sin(a.t * 1.2 + a.ph) * 6 * dt;
    } else if (a.type === 'butterfly') {
      a.ph += (Math.random() - 0.5) * 3 * dt;
      a.x += Math.cos(a.ph) * 22 * dt;
      a.y += Math.sin(a.ph) * 14 * dt;
    } else if (a.type === 'firefly') {
      a.ph += (Math.random() - 0.5) * 2 * dt;
      a.x += Math.cos(a.ph + Math.sin(a.t * 1.7) * 1.2) * 11 * dt;
      a.y += Math.sin(a.ph) * 8 * dt + Math.sin(a.t * 2.3) * 4 * dt;
    } else { // mote
      a.x += Math.sin(a.t * 0.8 + a.ph) * 4 * dt;
      a.y += Math.cos(a.t * 0.6 + a.ph) * 3 * dt;
    }
    const off = a.x < G.camX - 40 || a.x > G.camX + VIEW_W + 40 || a.y < G.camY - 40 || a.y > G.camY + VIEW_H + 40;
    if (a.t > a.life || off) G.ambient.splice(i, 1);
  }
}
function drawAmbient() {
  for (const a of G.ambient) {
    const fade = clamp(Math.min(a.t, a.life - a.t) * 2, 0, 1);
    if (a.type === 'leaf') {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.t * 2 + a.ph);
      ctx.globalAlpha = 0.7 * fade;
      ctx.fillStyle = a.hue > 0.5 ? '#7d8a44' : '#a8963e';
      ctx.fillRect(-1.6, -1, 3.2, 2);
      ctx.restore();
    } else if (a.type === 'seed') {
      ctx.globalAlpha = 0.65 * fade;
      ctx.fillStyle = '#f0ead2';
      ctx.beginPath(); ctx.arc(a.x, a.y, 1, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.3 * fade;
      ctx.beginPath(); ctx.arc(a.x, a.y - 1.4, 1.7, 0, TAU); ctx.fill();
    } else if (a.type === 'butterfly') {
      const flap = Math.abs(Math.sin(a.t * 14));
      ctx.globalAlpha = 0.9 * fade;
      ctx.fillStyle = a.hue > 0.5 ? '#d8b04a' : '#c87f5a';
      ctx.beginPath();
      ctx.ellipse(a.x - 1.2, a.y, 1.8, 0.6 + 1.3 * flap, -0.5, 0, TAU);
      ctx.ellipse(a.x + 1.2, a.y, 1.8, 0.6 + 1.3 * flap, 0.5, 0, TAU);
      ctx.fill();
    } else if (a.type === 'firefly') {
      // pulsing green-gold glow with a bright core
      const pulse = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(a.t * 1.9 + a.ph)), 2);
      ctx.globalAlpha = pulse * fade * 0.28;
      ctx.fillStyle = '#c8e87a';
      ctx.beginPath(); ctx.arc(a.x, a.y, 6.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = pulse * fade * 0.7;
      ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, TAU); ctx.fill();
      ctx.globalAlpha = pulse * fade;
      ctx.fillStyle = '#f8ffd8';
      ctx.beginPath(); ctx.arc(a.x, a.y, 1.4, 0, TAU); ctx.fill();
    } else { // mote
      ctx.globalAlpha = (0.2 + 0.25 * Math.abs(Math.sin(a.t * 2 + a.ph))) * fade;
      ctx.fillStyle = '#fff6d8';
      ctx.fillRect(a.x, a.y, 1.4, 1.4);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------- drifting cloud shadows ----------
function drawCloudShadows(camX, camY) {
  const dayF = 1 - ((G.day && G.day.nightF) || 0);
  if (dayF < 0.15) return;
  for (let i = 0; i < 3; i++) {
    const span = WORLD_W + 900;
    const wx = ((G.time * (7 + i * 2.4) + i * 1450) % span) - 450;
    const wy = 300 + i * 780 + Math.sin(G.time * 0.05 + i * 2) * 160;
    if (wx < camX - 330 || wx > camX + VIEW_W + 330 || wy < camY - 200 || wy > camY + VIEW_H + 200) continue;
    const g = ctx.createRadialGradient(wx, wy, 40, wx, wy, 300);
    g.addColorStop(0, 'rgba(24,32,16,' + (0.085 * dayF).toFixed(3) + ')');
    g.addColorStop(0.7, 'rgba(24,32,16,' + (0.05 * dayF).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(24,32,16,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(wx, wy, 300, 170, i * 0.7, 0, TAU);
    ctx.fill();
  }
}

// ---------- forest light shafts (screen space, anchored to the world) ----------
function drawLightShafts(camX, camY) {
  const midShade = forestShadePx(camX + VIEW_W / 2, camY + VIEW_H / 2);
  if (midShade < 0.3) return;
  // sunbeams fade out at night, glow golden at dusk
  const day = G.day || { nightF: 0, duskF: 0 };
  const sunF = (1 - 0.88 * day.nightF) * (1 + 0.5 * day.duskF);
  if (sunF < 0.1) return;
  for (let wx = Math.floor((camX - 160) / 150) * 150; wx < camX + VIEW_W + 160; wx += 150) {
    const h = hash2(Math.abs(wx) & 0xffff, 91);
    if (h < 0.3) continue;
    const localShade = forestShadePx(wx, camY + VIEW_H * 0.5);
    if (localShade < 0.35) continue;
    const sx = wx - camX + Math.sin(G.time * 0.25 + h * 8) * 7;
    const wdt = 24 + h * 46;
    const slant = 50 + h * 24;
    const alpha = (0.045 + 0.04 * h) * clamp(localShade * 1.4, 0, 1) * sunF;
    const beam = day.duskF > 0.3 ? '255,214,150' : '255,240,196';
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, 'rgba(' + beam + ',' + alpha.toFixed(3) + ')');
    grad.addColorStop(0.85, 'rgba(' + beam + ',0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(sx, -8);
    ctx.lineTo(sx + wdt, -8);
    ctx.lineTo(sx + wdt - slant, VIEW_H);
    ctx.lineTo(sx - slant, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }
}

// ---------- vignette / grain overlays ----------
const warmGrade = (() => {
  const cv = document.createElement('canvas');
  cv.width = VIEW_W; cv.height = VIEW_H;
  const c2 = cv.getContext('2d');
  const g = c2.createRadialGradient(VIEW_W / 2, VIEW_H * 0.38, 40, VIEW_W / 2, VIEW_H * 0.42, VIEW_H * 1.05);
  g.addColorStop(0, 'rgba(255,226,152,0.10)');
  g.addColorStop(0.55, 'rgba(255,226,152,0.03)');
  g.addColorStop(1, 'rgba(46,64,92,0.07)');
  c2.fillStyle = g;
  c2.fillRect(0, 0, VIEW_W, VIEW_H);
  return cv;
})();
const vignette = (() => {
  const cv = document.createElement('canvas');
  cv.width = VIEW_W; cv.height = VIEW_H;
  const c2 = cv.getContext('2d');
  const g = c2.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.85);
  g.addColorStop(0, 'rgba(20,14,6,0)');
  g.addColorStop(1, 'rgba(20,14,6,0.4)');
  c2.fillStyle = g;
  c2.fillRect(0, 0, VIEW_W, VIEW_H);
  return cv;
})();
const grain = (() => {
  const cv = document.createElement('canvas');
  cv.width = 160; cv.height = 160;
  const c2 = cv.getContext('2d');
  const img = c2.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.random() * 20;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 14;
  }
  c2.putImageData(img, 0, 0);
  return cv;
})();
const grainPattern = ctx.createPattern(grain, 'repeat');

// ---------- eruptions: Ashfall Ridge throws rocks ----------
// The mountain rumbles a warning, then a volley of volcanic bombs falls
// around the player — each with a glowing target ring and a 1.4s fuse.
// Stand on a ring and pay for it. Nests are always safe ground.
const ERUPT_FUSE = 1.4;
function updateEruption(dt) {
  if (!G.eruption) G.eruption = { nextT: 35, warn: 0, bombs: [] };
  const E = G.eruption;
  if (World.eco !== 'ash' || !G.player.alive) { E.bombs.length = 0; return; }
  if (E.warn > 0) {
    E.warn -= dt;
    G.shake = Math.min(5, G.shake + dt * 8);
    if (E.warn <= 0) {
      const p = G.player;
      const n = 10 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, r = 60 + Math.random() * 380;
        const bx = clamp(p.x + Math.cos(a) * r, 30, WORLD_W - 30);
        const by = clamp(p.y + Math.sin(a) * r, 30, WORLD_H - 30);
        if (nearAnyNest(bx, by, 150)) continue;   // the nest is sacred ground
        E.bombs.push({ x: bx, y: by, delay: Math.random() * 2.6, t: ERUPT_FUSE });
      }
    }
  } else {
    E.nextT -= dt;
    if (E.nextT <= 0) {
      E.nextT = 50 + Math.random() * 35;
      E.warn = 1.6;
      G.banner = { str: '🌋 THE MOUNTAIN ROARS — RUN!', t: 3, color: '#ff8a4e' };
      G.shake = 4;
      SFX.hurt();
    }
  }
  for (let i = E.bombs.length - 1; i >= 0; i--) {
    const b = E.bombs[i];
    if (b.delay > 0) { b.delay -= dt; continue; }
    b.t -= dt;
    if (b.t > 0) continue;
    E.bombs.splice(i, 1);
    // impact!
    for (let k = 0; k < 18; k++) {
      const a = Math.random() * TAU, sp = 40 + Math.random() * 120;
      G.particles.push({
        x: b.x, y: b.y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 60,
        t: 0, life: 0.5 + Math.random() * 0.4, r: 1.5 + Math.random() * 1.5,
        color: k % 3 ? '#e0611f' : '#ffb43e', grav: 260,
      });
    }
    G.shake = Math.min(7, G.shake + 2.5);
    const p = G.player;
    if (p.alive && dist(p.x, p.y, b.x, b.y) < 40 + 10 * p.growth) {
      dealDamage(p, 90 + 90 * p.growth, null, { kb: 0, cause: 'a volcanic bomb' });
    }
    for (const e of [...G.npcs]) {
      if (dist(e.x, e.y, b.x, b.y) < 44) dealDamage(e, 150, null, {});
    }
  }
}
function drawEruption() {
  const E = G.eruption;
  if (!E || !E.bombs.length) return;
  for (const b of E.bombs) {
    if (b.delay > 0) continue;
    const f = 1 - b.t / ERUPT_FUSE;              // 0 → 1 as impact nears
    // the target ring, tightening and brightening
    ctx.strokeStyle = 'rgba(255,96,40,' + (0.35 + 0.45 * f).toFixed(3) + ')';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 30 - 12 * f, 13 - 5 * f, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,60,' + (0.10 + 0.22 * f).toFixed(3) + ')';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 30 - 12 * f, 13 - 5 * f, 0, 0, TAU);
    ctx.fill();
    // the falling ember, dropping onto the mark with a spark trail
    const fy = b.y - (1 - f) * 340;
    ctx.fillStyle = 'rgba(255,180,80,0.5)';
    ctx.fillRect(b.x - 0.8, fy - 14, 1.6, 12);
    ctx.fillStyle = '#2c1a10';
    ctx.beginPath(); ctx.arc(b.x, fy, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff8a3e';
    ctx.beginPath(); ctx.arc(b.x + 0.6, fy + 1, 2.1, 0, TAU); ctx.fill();
  }
}

// ---------- game loop ----------
let lastT = performance.now();
let popT = 0;
let autosaveT = 0;

function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (!G.started) return;
  if (G.paused) { render(); return; }

  G.time += dt;
  // underground, the burrow owns the whole frame — the world above waits
  if (G.burrow) {
    updateBurrow(dt);
    updateWorldStuff(dt);
    if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
    G.shake = Math.max(0, G.shake - dt * 14);
    if (G.burrow) renderBurrow(); else render();
    updateHUD();
    return;
  }
  updatePlayer(dt);
  // just slipped underground THIS frame: the world halts right here — no NPC
  // update may touch the pack at its burrow-local coordinates, and no world
  // render may flash the map corner
  if (G.burrow) {
    updateWorldStuff(dt);
    if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
    G.shake = Math.max(0, G.shake - dt * 14);
    renderBurrow();
    updateHUD();
    return;
  }
  for (const e of G.npcs) updateNPC(e, dt);
  updateWorldStuff(dt);
  updateEruption(dt);
  updateNesting(dt);
  updateAmbient(dt);
  popT += dt;
  if (popT > 10) { popT = 0; maintainPopulation(); }
  autosaveT += dt;
  if (autosaveT > 10) { autosaveT = 0; saveDinoSnapshot(); }
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  G.shake = Math.max(0, G.shake - dt * 14);

  // camera
  const p = G.player;
  G.camX = clamp(p.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
  G.camY = clamp(p.y - VIEW_H / 2 - 14, 0, WORLD_H - VIEW_H);

  render();
  updateHUD();
}
requestAnimationFrame(loop);

// ---------- burrow render: the little world under the delta ----------
function renderBurrow() {
  const B = G.burrow, p = G.player;
  const camX = p.x - VIEW_W / 2, camY = p.y - VIEW_H / 2;
  G.camX = camX; G.camY = camY;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(G.RS, 0, 0, G.RS, 0, 0);
  ctx.save();
  ctx.translate(-camX, -camY);
  // the dark of the earth
  ctx.fillStyle = '#0d0906';
  ctx.fillRect(camX, camY, VIEW_W, VIEW_H);
  // tunnels (wall ring then floor), then rooms the same way
  ctx.lineCap = 'round';
  for (const [i, j] of B.links) {
    const a = B.rooms[i], b2 = B.rooms[j];
    ctx.strokeStyle = '#241a10'; ctx.lineWidth = 58;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
    ctx.strokeStyle = '#38281a'; ctx.lineWidth = 46;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
  }
  const rng = speckleRng(B.b.id * 977 + 3);
  for (const r of B.rooms) {
    ctx.fillStyle = '#241a10';
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r + 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#38281a';
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.fill();
    // floor litter: pebbles and old pale bones
    for (let k = 0; k < 9; k++) {
      const a2 = rng() * TAU, rr2 = rng() * r.r * 0.78;
      const px = r.x + Math.cos(a2) * rr2, py = r.y + Math.sin(a2) * rr2;
      ctx.fillStyle = k % 4 === 3 ? '#8a7c60' : '#2c2012';
      ctx.beginPath(); ctx.ellipse(px, py, 2 + rng() * 2, 1.2 + rng(), rng() * TAU, 0, TAU); ctx.fill();
    }
    // roots trailing from the ceiling at the rim
    ctx.strokeStyle = '#1c130a';
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) {
      const a3 = -Math.PI * 0.75 + k * 0.42 + (r.x % 1);
      const rx = r.x + Math.cos(a3) * r.r * 0.96, ry = r.y + Math.sin(a3) * r.r * 0.96;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + 3, ry + 7, rx - 2, ry + 13 + (k % 2) * 5);
      ctx.stroke();
    }
  }
  // the way out: a shaft of daylight over the entrance room
  const ent = B.rooms[0];
  const grad = ctx.createRadialGradient(ent.x, ent.y - 26, 4, ent.x, ent.y - 10, 60);
  grad.addColorStop(0, 'rgba(255,238,180,0.5)');
  grad.addColorStop(1, 'rgba(255,238,180,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(ent.x, ent.y - 10, 60, 0, TAU); ctx.fill();
  ctx.fillStyle = '#17100a';
  ctx.beginPath(); ctx.ellipse(ent.x, ent.y - 26, 9, 4.5, 0, 0, TAU); ctx.fill();

  // depth-sorted dwellers: carcasses, eggs, babies, residents, the player
  const draws = [];
  for (const c of B.carcs) if (c.meat > 0) draws.push({ y: c.y, fn: () => drawCarcass(ctx, c) });
  const ns = G.nesting;
  if (ns && ns.den === B.b && ns.stage === 'eggs') {
    const deep = B.rooms[B.rooms.length - 1];
    draws.push({ y: deep.y - 2, fn: () => drawEggs(ctx, { x: deep.x, y: deep.y }, ns) });
  }
  if (ns && ns.stage === 'babies') {
    for (const bb of ns.babies) {
      if (bb.den === B.b) draws.push({ y: bb.y, fn: () => { drawShadow(ctx, bb.x, bb.y, 6); drawDino(ctx, bb.species, bb); } });
    }
  }
  for (const e of B.residents) {
    if (e.hp <= 0) continue;
    draws.push({ y: e.y, fn: () => { drawShadow(ctx, e.x, e.y, bodyRadius(e) * 1.4); drawDino(ctx, e.species, e); if (e.hurtT > 0 || e.hp < e.maxhp) drawHpBar(e); } });
  }
  for (const e of B.allies) {
    if (e.hp <= 0) continue;
    draws.push({ y: e.y, fn: () => { drawShadow(ctx, e.x, e.y, bodyRadius(e) * 1.4); drawDino(ctx, e.species, e); if (e.hp < e.maxhp) drawHpBar(e); } });
  }
  draws.push({ y: p.y, fn: () => { drawShadow(ctx, p.x, p.y, (8 + 14 * p.growth) * genderMod(p).size); drawDino(ctx, p.species, p); } });
  draws.sort((a, b) => a.y - b.y);
  for (const d of draws) d.fn();

  // particles + floating texts share the same local space
  for (const pt of G.particles) {
    ctx.globalAlpha = clamp(1 - pt.t / pt.life, 0, 1);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.r / 2, pt.y - pt.r / 2, pt.r, pt.r);
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  for (const f of G.floats) {
    ctx.globalAlpha = clamp(f.t, 0, 1);
    ctx.fillStyle = '#1a1008';
    ctx.fillText(f.str, f.x + 1, f.y + 1);
    ctx.fillStyle = f.color;
    ctx.fillText(f.str, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.restore();
  // the fade of slipping underground
  if (B.fade > 0) {
    ctx.globalAlpha = clamp(B.fade, 0, 1);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
  }
}

// ---------- render ----------
// ---- hitbox X-ray (H) ------------------------------------------------------
// draws the ACTUAL circles the combat code tests — not an approximation.
// cyan = hittable body (the silhouette chain bodyHitPoint walks)
// red  = attack zone (weapon circle + the 4px contact pad)
// orange = wuerhosaurus' nip jaws (its second, face-side weapon)
function dbgCircle(g, x, y, r, col) {
  g.strokeStyle = col;
  g.lineWidth = 1;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.stroke();
  g.globalAlpha = 0.09;
  g.fillStyle = col;
  g.fill();
  g.globalAlpha = 1;
}
function drawEntityHitboxes(g, e) {
  const d = DINO[e.species];
  if (!d) return;
  // NO local geometry here, ever: every circle comes straight from the
  // combat functions in entities.js — the overlay draws the exact objects
  // the hit tests consume, so it CANNOT show anything but the truth
  for (const z of bodyCircles(e)) dbgCircle(g, z.x, z.y, z.r, '#3ec8ff');
  const def = e.isPlayer ? PLAYER_DEF[e.species] : (NPC_DEF[e.species] || e.mateDef || PLAYER_DEF[e.species]);
  if (!def || !def.dmg) return; // the meek carry no weapon
  const f = e.facing || 1;
  if (!e.isPlayer && d.tailWeapon) {
    // NPC tail swing: tailWedgeCircle restricted to ±45° of dead-rear,
    // matching weaponContact's angle gate
    const wc = tailWedgeCircle(e);
    g.strokeStyle = '#ff5040';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(wc.x, wc.y);
    g.arc(wc.x, wc.y, wc.r, f > 0 ? Math.PI * 0.75 : -Math.PI * 0.25, f > 0 ? Math.PI * 1.25 : Math.PI * 0.25);
    g.closePath();
    g.stroke();
    g.globalAlpha = 0.09;
    g.fillStyle = '#ff5040';
    g.fill();
    g.globalAlpha = 1;
  } else {
    const wc = weaponCircle(e);
    dbgCircle(g, wc.x, wc.y, wc.r, '#ff5040');
    if (e.isPlayer && d.armAndJaw) {
      const cc = clawArcCircle(e);
      dbgCircle(g, cc.x, cc.y, cc.r, '#ff5040');
    }
  }
  if (def.nip) {
    const nc = nipCircle(e);
    dbgCircle(g, nc.x, nc.y, nc.r, '#ffb03e');
  }
}
function drawHitboxes() {
  const p = G.player;
  const all = p.alive ? G.npcs.concat([p]) : G.npcs;
  for (const e of all) drawEntityHitboxes(ctx, e);
}

function render() {
  const p = G.player;
  const shx = G.shake > 0.1 ? (Math.random() - 0.5) * G.shake : 0;
  const shy = G.shake > 0.1 ? (Math.random() - 0.5) * G.shake : 0;
  const camX = G.camX + shx, camY = G.camY + shy;

  G.day = daylight();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(G.RS, 0, 0, G.RS, 0, 0);
  ctx.imageSmoothingEnabled = true; // soft painted ground under crisp vectors
  ctx.save();
  // fractional camera: subpixel scrolling keeps diagonal movement judder-free
  ctx.translate(-camX, -camY);

  // ground
  drawGroundChunks(ctx, camX, camY, VIEW_W, VIEW_H);
  drawWaterShimmer(ctx, camX, camY, VIEW_W, VIEW_H);
  drawShoreFoam(ctx, camX, camY, VIEW_W, VIEW_H);

  // collect depth-sorted drawables in view
  const pad = 90;
  const x0 = camX - pad, x1 = camX + VIEW_W + pad;
  const y0 = camY - pad, y1 = camY + VIEW_H + pad * 1.6;
  const draws = [];
  for (const f of World.ferns) if (f.x > x0 && f.x < x1 && f.y > y0 && f.y < y1) draws.push({ y: f.y, fn: () => drawFern(ctx, f) });
  for (const h of World.horsetails) if (h.x > x0 && h.x < x1 && h.y > y0 && h.y < y1) draws.push({ y: h.y, fn: () => drawHorsetail(ctx, h) });
  for (const t of World.trees) if (t.x > x0 && t.x < x1 && t.y > y0 && t.y < y1) draws.push({ y: t.y, fn: () => drawTree(ctx, t) });
  for (const r of World.rocks) if (r.x > x0 && r.x < x1 && r.y > y0 && r.y < y1) draws.push({ y: r.y, fn: () => drawRock(ctx, r) });
  for (const pr of World.props) if (pr.x > x0 && pr.x < x1 && pr.y > y0 && pr.y < y1) draws.push({ y: pr.y, fn: () => drawProp(ctx, pr) });
  for (const k in World.nests) {
    const n = World.nests[k];
    if (n.x > x0 && n.x < x1 && n.y > y0 && n.y < y1) draws.push({ y: n.y - 4, fn: () => drawNest(ctx, n, k === p.species) });
  }
  // the clutch: eggs sit on the player's nest while they incubate
  // (a den clutch lives underground — drawn by renderBurrow instead)
  if (G.nesting && G.nesting.stage === 'eggs' && !G.nesting.den) {
    const n = World.nests[p.species];
    if (n.x > x0 && n.x < x1 && n.y > y0 && n.y < y1) draws.push({ y: n.y - 2, fn: () => drawEggs(ctx, n, G.nesting) });
  }
  for (const b of World.burrows || []) if (b.x > x0 && b.x < x1 && b.y > y0 && b.y < y1) draws.push({ y: b.y, fn: () => drawBurrow(ctx, b) });
  for (const c of G.carcasses) if (c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1) draws.push({ y: c.y, fn: () => drawCarcass(ctx, c) });
  for (const e of G.npcs) {
    if (e.x > x0 && e.x < x1 && e.y > y0 && e.y < y1) {
      draws.push({
        y: e.y, fn: () => {
          // a submerged croc is only a shadow under the surface — no hp bar,
          // no outline, just a dark shape and two eyes
          if (e.submerged && isWaterPx(e.x, e.y)) { drawCrocShadow(ctx, e); return; }
          drawShadow(ctx, e.x, e.y, bodyRadius(e) * 1.4);
          drawDino(ctx, e.species, e);
          if (e.hurtT > 0 || e.hp < e.maxhp * 0.999 && dist(e.x, e.y, p.x, p.y) < 130) drawHpBar(e);
        }
      });
    }
  }
  if (p.alive) {
    draws.push({
      y: p.y, fn: () => {
        drawShadow(ctx, p.x, p.y, (8 + 14 * p.growth) * genderMod(p).size);
        drawDino(ctx, p.species, p);
      }
    });
  }
  // eruption target rings sit on the ground, beneath everything that walks
  drawEruption();

  draws.sort((a, b) => a.y - b.y);
  for (const d of draws) d.fn();

  // hitbox X-ray on top of everyone (H toggles)
  if (G.debugHit) {
    drawHitboxes();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(10,8,4,0.8)';
    ctx.fillText('HITBOXES  red = attack · cyan = body · orange = nip', camX + 11, camY + VIEW_H - 9);
    ctx.fillStyle = '#ffe9a0';
    ctx.fillText('HITBOXES  red = attack · cyan = body · orange = nip', camX + 10, camY + VIEW_H - 10);
  }

  // particles
  for (const pt of G.particles) {
    ctx.globalAlpha = clamp(1 - pt.t / pt.life, 0, 1);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.r / 2, pt.y - pt.r / 2, pt.r, pt.r);
  }
  ctx.globalAlpha = 1;

  // floating texts
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  for (const f of G.floats) {
    ctx.globalAlpha = clamp(f.t, 0, 1);
    ctx.fillStyle = '#1a1008';
    ctx.fillText(f.str, f.x + 1, f.y + 1);
    ctx.fillStyle = f.color;
    ctx.fillText(f.str, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  // the wrestle QTE: the key to press, its time ring, and the five pips
  if (G.wrestle && G.wrestle.idx < G.wrestle.seq.length) {
    const w = G.wrestle;
    const cxm = camX + VIEW_W / 2, cym = camY + 78;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a0';
    ctx.fillText('WRESTLE!', cxm, cym - 30);
    for (let i = 0; i < w.seq.length; i++) {
      ctx.fillStyle = i < w.idx ? '#8ad04e' : 'rgba(10,8,4,0.55)';
      ctx.beginPath(); ctx.arc(cxm - 30 + i * 15, cym + 32, 4, 0, TAU); ctx.fill();
    }
    const frac = clamp(w.keyT / w.window, 0, 1);
    ctx.fillStyle = 'rgba(10,8,4,0.6)';
    ctx.beginPath(); ctx.arc(cxm, cym, 16, 0, TAU); ctx.fill();
    ctx.strokeStyle = frac > 0.4 ? '#ffd23e' : '#d43a2a';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(cxm, cym, 19, -Math.PI / 2, -Math.PI / 2 + frac * TAU); ctx.stroke();
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffe9a0';
    ctx.fillText(w.seq[w.idx].slice(3), cxm, cym + 7);
    ctx.textAlign = 'left';
  }

  // the croc-grab escape meter: fill it with SPACE before it drains you under
  if (p.alive && p.grabbed) {
    const m = clamp(p.grabbed.meter, 0, 1);
    const by = p.y - 58 - 20 * p.growth + Math.sin(G.time * 22) * 1.2;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a0806';
    ctx.fillText('SMASH SPACE!', p.x + 1, by - 6 + 1);
    ctx.fillStyle = '#ff6a5e';
    ctx.fillText('SMASH SPACE!', p.x, by - 6);
    ctx.fillStyle = 'rgba(10,8,4,0.75)';
    ctx.fillRect(p.x - 31, by - 1, 62, 8);
    ctx.fillStyle = m > 0.6 ? '#8ad04e' : m > 0.3 ? '#ffd23e' : '#d43a2a';
    ctx.fillRect(p.x - 30, by, 60 * m, 6);
    ctx.textAlign = 'left';
  }

  // drifting cloud shadows fall across the whole scene
  drawCloudShadows(camX, camY);
  // airborne ambient life (leaves, motes, butterflies, fireflies)
  drawAmbient();

  ctx.restore();

  // atmosphere: sun shafts in deep forest, time-of-day grade, vignette, grain
  drawLightShafts(camX, camY);
  const day = G.day;
  if (day.m[3] > 0.003) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(' + (day.m[0] | 0) + ',' + (day.m[1] | 0) + ',' + (day.m[2] | 0) + ',' + day.m[3].toFixed(3) + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (day.g[3] > 0.003) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(' + (day.g[0] | 0) + ',' + (day.g[1] | 0) + ',' + (day.g[2] | 0) + ',' + day.g[3].toFixed(3) + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalCompositeOperation = 'source-over';
  }
  // the warm sunlight grade gives way to cool night
  ctx.globalAlpha = 1 - 0.75 * day.nightF;
  ctx.drawImage(warmGrade, 0, 0, VIEW_W, VIEW_H);
  ctx.globalAlpha = 1;
  ctx.drawImage(vignette, 0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, Math.floor(Math.random() * -30), Math.floor(Math.random() * -30));
  ctx.fillStyle = grainPattern;
  ctx.fillRect(0, 0, canvas.width + 30, canvas.height + 30);
  ctx.restore();
}

function drawHpBar(e) {
  const w = 22;
  const d = DINO[e.species];
  const y = e.y - (d.L.leg[0] + d.L.body[1] * 1.7) * d.scale - 10;
  ctx.fillStyle = 'rgba(10,8,4,0.7)';
  ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 4);
  ctx.fillStyle = e.bleed ? '#d43a2a' : '#b8352a';
  ctx.fillRect(e.x - w / 2, y, w * clamp(e.hp / e.maxhp, 0, 1), 2);
}

// ---------- HUD ----------
const elHp = document.getElementById('fill-hp');
const elSt = document.getElementById('fill-stam');
const elFo = document.getElementById('fill-food');
const elWa = document.getElementById('fill-water');
const elHy = document.getElementById('fill-hyg');
const elStage = document.getElementById('stage');
const elGrow = document.getElementById('growth-fill');
const elPct = document.getElementById('growth-pct');
const elPrompt = document.getElementById('prompt');
const elBanner = document.getElementById('banner');

function updateHUD() {
  const p = G.player;
  if (!p) return;
  elHp.style.width = clamp(p.hp / playerMaxHp() * 100, 0, 100) + '%';
  elSt.style.width = clamp(p.stamina / PLAYER_DEF[p.species].stamMax * 100, 0, 100) + '%';
  elFo.style.width = clamp(p.food, 0, 100) + '%';
  elWa.style.width = clamp(p.water, 0, 100) + '%';
  elHy.style.width = clamp(p.hygiene, 0, 100) + '%';
  elHp.classList.toggle('low', p.hp / playerMaxHp() < 0.3);
  elFo.classList.toggle('low', p.food < 25);
  elWa.classList.toggle('low', p.water < 25);
  elHy.classList.toggle('low', p.hygiene < 25);
  elStage.textContent = (p.gender === 'm' ? '♂ ' : '♀ ') + stageOf(p.growth) + (p.bleed ? '  ✚ BLEEDING' : '');
  elStage.style.color = p.bleed ? '#ff6a5e' : '#f5e9c8';
  elGrow.style.width = (p.growth * 100) + '%';
  elPct.textContent = Math.floor(p.growth * 100) + '%';
  const elGr = document.getElementById('growthscount');
  const grLabel = '❖ ' + Save.growths + (Profiles.current ? ' · ' + Profiles.current : '');
  if (elGr && elGr._v !== grLabel) { elGr._v = grLabel; elGr.textContent = grLabel; }
  elPrompt.textContent = G.prompt;
  elPrompt.style.opacity = G.prompt ? 1 : 0;
  if (G.banner) {
    elBanner.textContent = G.banner.str;
    elBanner.style.color = G.banner.color || '#ffe9a0';
    elBanner.style.opacity = clamp(G.banner.t, 0, 1);
  } else {
    elBanner.style.opacity = 0;
  }
  // detailed stats panel
  const panel = document.getElementById('statspanel');
  if (!panel.classList.contains('hidden')) {
    document.getElementById('sp-body').innerHTML =
      row('Species', DINO[p.species].full) +
      row('Sex', p.gender === 'm' ? '♂ male — big & bright' : '♀ female — quick & plain') +
      row('Skin', SKINS[p.skin] ? SKINS[p.skin].name : 'Classic') +
      row('Stage', stageOf(p.growth) + ' (' + Math.floor(p.growth * 100) + '%)') +
      row('Health', Math.ceil(p.hp) + ' / ' + playerMaxHp()) +
      row('Stamina', Math.floor(p.stamina) + ' / ' + PLAYER_DEF[p.species].stamMax) +
      row('Food', Math.floor(p.food) + '%') +
      row('Water', Math.floor(p.water) + '%') +
      row('Hygiene', Math.floor(p.hygiene) + '%') +
      row('Bite power', Math.round(playerDmg())) +
      row('Bleeding', p.bleed ? 'YES — find safety!' : 'no');
  }
  drawMinimap();
}
function row(k, v) { return '<div class="sprow"><span>' + k + '</span><b>' + v + '</b></div>'; }
