'use strict';
// ---------- main: boot, input, loop, render, HUD, screens ----------
// the view HEIGHT is the world-scale anchor (360 units tall, always); the
// view WIDTH follows the screen's aspect so the biome fills the whole
// display — no letterbox bands, a wider screen simply sees more delta
// touch screens run a bit zoomed-in (310 world-units tall vs 360): at arm's
// length the dino read too small to play. Both set for real in resize().
let VIEW_H = 360;
let VIEW_W = 640;

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
G.input = { up: false, down: false, left: false, right: false, sprint: false, attack: false, interact: false, sprinting: false, fish: false, nest: false, wrestle: false, pack: false, burrow: false, rest: false, grab: false, pounceHold: false, atkHold: false, spaceHeldT: 0 };
G.zoom = 1;   // grow-zoom: eases toward 1 + growth·(size term) — see loop()
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
function defaultSave() { return { growths: 0, earned: 0, ecoPaid: {}, mastery: {}, owned: {}, dino: {}, skinChoice: {}, genderChoice: {}, skinOwned: {}, discovered: {}, arrived: {}, hatched: {}, titles: {}, titleWorn: null, ecoSeen: {} }; }
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
  return SKINS[s] && skinFits(species, s) && skinOwned(species, s) ? s : 'default';
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

// ---------- the mastery ladder ----------
// One long chain: grow each species to FULL ADULT to unlock the next rung.
// A rung with two species is a fork — both unlock together, mastering EITHER
// advances the chain. Crossing into a new eco's first rung opens that land.
// (❖ still exists, but it only buys skins now — dinos are earned, not bought.)
const CHAIN = [
  ['raja'], ['campto'],                                        // 🌿 Fern Valley
  // campto's mastery opens a fork: the prairie's swimmer AND the valley's own
  // late-bloomer sauropodomorph — master either one to reach qianzhousaurus
  ['ichthyo', 'rioja'], ['qianzho'], ['scutello'],             // 🦴 Skull Prairie (+ rioja back home)
  ['metria'], ['giganto'], ['crista'],                         // 🌊 Coastal Scrubs
  ['linhe'], ['preno'],                                        // 🌋 Ashfall Ridge
  ['nothro', 'vulcano'],   // the ridge's fork: scythe claws or the young mountain
  ['aardi'], ['centro'], ['omni'], ['eotrach'], ['loki'], ['moro'],
  ['tyranno', 'spino'],                                        // 🐟 Delta finale: choose your apex
  ['jianchang'], ['eshano'], ['nanuq'], ['nivarex'],           // 🏔️ The Wall
  ['simo'], ['korea'], ['sarco'], ['drypto'], ['gastonia'],    // 🌫️ The Great Moors of Martulisth
  ['buitre'], ['hypsi'], ['adratik'], ['orkor'],               // 🌴 The Sodden Reach
  ['neove', 'coahuila'],   // the fork: quiet hands or great horns — either one
  ['poekilo'],             // …opens the road to the Reach's true apex
];
function chainRung(sp) { return CHAIN.findIndex(r => r.includes(sp)); }
// a species is playable if: it's the chain's first rung, the rung before it
// has a mastered member, it was bought/earned under the old economy (owned),
// or — for the secret giant — the mountain itself gave it to you
function spUnlocked(sp) {
  const def = PLAYER_DEF[sp];
  if (def.secret) return !!Save.owned[sp];
  if (Save.owned[sp]) return true;
  const i = chainRung(sp);
  if (i < 0) return false;
  return i === 0 || CHAIN[i - 1].some(m => Save.mastery[m])
    // the Moors' gate has a second key: an ADULT frozen giant will do
    || (CHAIN[i - 1].includes('nivarex') && !!Save.nivaloAdult);
}
// "grow X to FULL ADULT" — the species (or fork pair) guarding this rung
function rungGuardNames(i) {
  return CHAIN[i - 1].map(m => DINO[m].name.toUpperCase()).join(' or ');
}
function rungHint(i) {
  if (CHAIN[i - 1] && CHAIN[i - 1].includes('nivarex'))
    return 'grow NIVAREX to FULL ADULT — or NIVALOTITAN to ADULT';
  return 'grow ' + rungGuardNames(i) + ' to FULL ADULT';
}
function spUnlockHint(sp) {
  const i = chainRung(sp);
  if (i <= 0) return '';
  return rungHint(i);
}
// an eco opens with its first chain species; the hint names that rung's guard
function ecoFirstRung(key) {
  return CHAIN.findIndex(r => (PLAYER_DEF[r[0]].eco || 'valley') === key);
}
function ecoUnlockHint(key) {
  const i = ecoFirstRung(key);
  return i > 0 ? rungHint(i) : '';
}
// ladder unlocks are free: when an eco's first species becomes playable the
// land opens with it. Returns the names of any lands that just opened.
function syncEcoUnlocks() {
  const fresh = [];
  for (const key of Object.keys(ECOS)) {
    if (ecoPaid(key)) continue;
    const i = ecoFirstRung(key);
    if (i >= 0 && spUnlocked(CHAIN[i][0])) {
      Save.ecoPaid[key] = true;
      // stamp the ledger: which land this was, and whose mastery opened it
      Save.discovered = Save.discovered || {};
      if (!Save.discovered[key]) {
        const gate = CHAIN[i - 1] ? CHAIN[i - 1].find(m => Save.mastery[m]) : null;
        Save.discovered[key] = { n: Object.keys(Save.discovered).length + 1, by: gate || null };
      }
      fresh.push(ECOS[key].name);
    }
  }
  return fresh;
}

// growths payout: called from entities (minute ticks, kills) and bonuses
function awardGrowths(n, x, y) {
  Save.growths += n;
  Save.earned += n;
  saveSave();
  if (x != null) floatText(x, y, '+' + n + ' growth' + (n > 1 ? 's' : ''), '#ffd23e');
  SFX.coin && SFX.coin();
}
// first time a species reaches Full Adult: mastery bonus + the next rung of
// the ladder unlocks (and, at a biome finale, the next land opens with it)
function onFullyGrown(species) {
  if (Save.mastery[species]) return;
  const before = ALL_PLAYABLES.filter(spUnlocked);
  Save.mastery[species] = true;
  Save.growths += 100;
  Save.earned += 100;
  const fresh = ALL_PLAYABLES.filter(sp => spUnlocked(sp) && !before.includes(sp));
  const lands = syncEcoUnlocks();
  syncTitles();
  saveSave();
  setTimeout(() => {
    let str = '+100 growths mastery bonus!';
    if (lands.length) str += '  🗺️ THE TRAIL OPENS: ' + lands.join(' & ').toUpperCase() + '!';
    if (fresh.length) str += '  🔓 ' + fresh.map(sp => DINO[sp].name.toUpperCase()).join(' & ') + ' unlocked — visit the lobby!';
    G.banner = { str, t: 9, color: '#ffd23e' };
  }, 6200);
}
// each gender is its own loadout with its own saved dino — the bare species
// key is the female slot, so every save from before genders resumes as one
function dinoKey(species, gender) { return gender === 'm' ? species + ':m' : species; }
// the grow-zoom target: bigger species pull the camera back further, and a
// species can add its own zoomOut on top (nivalotitan's tower needs headroom)
function growZoom(sp, growth) {
  return 1 + growth * (0.12 + 0.18 * DINO[sp].scale + (DINO[sp].zoomOut || 0));
}
// where the top of the head sits in the world — anatomy-aware (fore-lifted
// chest, growth-scaled neck) so the camera can promise to never crop it
function headTopY(p) {
  const d = DINO[p.species], L = d.L;
  const s = d.scale * sizeScale(p.growth) * genderMod(p).size;
  const ng = d.neckGrow ? 0.55 + 0.45 * p.growth : 1;
  const rise = L.leg[0] + L.body[1] * (0.55 + 0.6 * (d.foreLift || 0)) +
    Math.sin(L.neckAng) * L.neckLen * ng + L.head[1] * 1.5;
  return p.y - rise * s;
}
function saveDinoSnapshot() {
  const p = G.player;
  if (!p || !p.alive || !G.started) return;
  Save.dino[dinoKey(p.species, p.gender)] = {
    growth: p.growth, hp: p.hp, food: p.food, water: p.water,
    stamina: p.stamina, hygiene: p.hygiene, x: p.x, y: p.y,
    cold: p.cold || 0,
    // the body's condition travels too — the lobby is not a hospital:
    // an open wound keeps bleeding right where you left off
    bleed: p.bleed ? { dps: p.bleed.dps, t: p.bleed.t } : null,
    bones: p.bones || null,
    exhausted: !!p.exhausted,
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
  if (e.code === 'Space') { G.input.attack = true; G.input.atkHold = true; }
  if (e.code === 'KeyE') G.input.interact = true;
  // F is the SECOND context key: fish · grab · wrestle · claw · bathe · dig ·
  // court · leave a den — whichever one the situation offers (resolveAction)
  if (e.code === 'KeyF') G.input.action = true;
  // ALWAYS-AVAILABLE moves keep their own keys — they have no situational cue
  // to hang a prompt on, so they must never share the context keys
  if (e.code === 'KeyM') G.input.claw = true;   // claw slash — the clawSecond species' second weapon
  if (e.code === 'KeyB') G.input.dig = true;    // the digger's burrow, anywhere
  if (G.wrestle && WRESTLE_KEYS.includes(e.code)) G.wrestle.pressed = e.code;
  // the CALLS: 1 broadcast (claim), 2 friendly (invite), 3 aggressive (threat)
  if (e.code === 'Digit1') G.input.call1 = true;
  if (e.code === 'Digit2') G.input.call2 = true;
  if (e.code === 'Digit3') G.input.call3 = true;
  if (e.code === 'KeyR') G.input.rest = true;
  // pounce lives on SPACE now: the press bites, a continuous hold coils
  // (P was retired; CTRL was tried before that and abandoned — Ctrl+letter
  // combos are browser shortcuts and can't be prevented.)
  if (e.code === 'Escape') {
    if (!document.getElementById('titlewall').classList.contains('hidden')) { toggleTitles(false); return; }
    if (Spec.open) { toggleSpecimenHall(); return; }
    if (G.started) { G.paused = !G.paused; document.getElementById('pause').classList.toggle('hidden', !G.paused); }
  }
  if (e.code === 'KeyU') {
    const m = SFX.toggleMute();
    G.banner = { str: m ? 'Sound muted' : 'Sound on', t: 1.5, color: '#cbb' };
  }
  if (e.code === 'KeyH') G.debugHit = !G.debugHit; // hitbox X-ray
  // the secret door: type the word "bones" and the Specimen Hall opens
  G._secret = ((G._secret || '') + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-5);
  if (G._secret === 'bones') { G._secret = ''; toggleSpecimenHall(); }
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
  if (e.code === 'Space') G.input.atkHold = false;
});
// losing focus (a browser shortcut fired, a tab switch) eats the keyups —
// clear every held flag so nothing stays latched behind our back
window.addEventListener('blur', () => {
  const i = G.input;
  i.up = i.down = i.left = i.right = i.sprint = i.pounceHold = i.atkHold = false;
  G.keys = {};
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
// the whole world scrolls as one journey now, so "which previews animate" is
// decided by the viewport: an observer keeps this set to the on-screen cards
// (plus a little margin) — 30 dinos still won't burn CPU
const previewVisible = new Set();
const previewObserver = new IntersectionObserver((entries) => {
  for (const en of entries) {
    const sp = en.target.id.slice(5);      // 'prev-<sp>'
    if (en.isIntersecting) previewVisible.add(sp); else previewVisible.delete(sp);
  }
  animateAllPreviews();
}, { rootMargin: '160px 0px' });
function animateAllPreviews() {
  previewGen++;
  // each hatchling wears the loadout currently selected on its card
  for (const sp of previewVisible) animatePreview('prev-' + sp, sp, cardGender(sp), undefined, cardSkin(sp));
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
  buitre: { desc: 'A long-legged river ghost on black pin legs. Its slender snout is built for fish — and fish feed it DOUBLE. It wades deep water where others must swim, slowly, and its bite will not stop bleeding.', tag: '◆ CARNIVORE — FISHER', tagClass: 'swim' },
  hypsi: { desc: 'A tiny feathered thicket-mouse. Fast, fragile, and hunted by everything — but it can throw itself into the earth, and for ten seconds nothing on the Reach will touch it.', tag: '◆ HERBIVORE — HARD', tagClass: 'hard' },
  adratik: { desc: 'The oldest stegosaur of them all: a low spiked wall that opens wounds. Every plate edge and tail spike leaves the attacker leaking. Slow, patient, and very hard to finish.', tag: '◆ HERBIVORE — BLEED TANK', tagClass: 'mod' },
  orkor: { desc: 'The last of the megaraptorids — long hooked arms, blade teeth, and real speed. It opens prey with its hands as much as its jaws, and the bleeding does the rest.', tag: '◆ CARNIVORE — BLEEDER', tagClass: 'mod' },
  neove: { desc: 'The quiet hunter of the Reach. It does not chase the way the tyrants chase — it arrives. Hands and jaws together, and everything it touches bleeds.', tag: '◆ CARNIVORE — HUNTER', tagClass: 'hard' },
  coahuila: { desc: 'Possibly the longest brow horns anything ever grew, and a committed charge on the far end of them. Every wound those horns open keeps working — crazy bleed on four legs.', tag: '◆ HERBIVORE — BLEEDER', tagClass: 'mod' },
  poekilo: { desc: 'The new apex of the Reach: a megalosaurid of keel-skulled muscle. No tricks, no ambush — raw damage, arms like beams, and a double bite (M) that ends arguments.', tag: '◆ CARNIVORE — APEX', tagClass: 'hard' },
  raja: { desc: 'A predator hatched in the fern forest. Scavenge carcasses, hunt to eat, and one day even the mighty Huayangosaurus may fear your bite.', tag: '◆ CARNIVORE — MODERATE', tagClass: 'mod' },
  campto: { desc: 'Born on the open plains where Moros intrepidus hunts. Run for the fern forest fast — the shade is your only refuge until you grow. Earns extra growths.', tag: '◆ HERBIVORE — HARD', tagClass: 'hard' },
  rioja: { desc: 'An ancient sauropodomorph and the valley\'s best brawler: swing the tail, then slash with the thumb-claws (M) to open bleeding wounds. Grows very slowly and eats enormously.', tag: '◆ HERBIVORE — BRAWLER', tagClass: 'mod' },
  ichthyo: { desc: 'A sail-backed fish hunter from the southern swamp. The only dinosaur that can swim across deep water — snap up gar and ambush drinkers at the shore.', tag: '◆ CARNIVORE — SWIMMER', tagClass: 'swim' },
  qianzho: { desc: 'The long-snouted “Pinocchio rex”. It grows slowly — but a full-grown Qianzhousaurus is the fastest, toughest hunter on the whole prairie.', tag: '◆ CARNIVORE — SLOW GROWER', tagClass: 'mod' },
  scutello: { desc: 'A little armored runner. Grows fast, earns lots of growths, and its bony scutes resist bleeding wounds. Watch out for Troodon packs.', tag: '◆ HERBIVORE — EARNER', tagClass: 'hard' },
  metria: { desc: 'A storm-grey hunter built to run down Ugrunaaluk herds — fast, strong, and mean. Stay clear of the surf: the beach belongs to something meaner.', tag: '◆ CARNIVORE — HUNTER', tagClass: 'mod' },
  giganto: { desc: 'A living fortress with giant shoulder spines. It cannot bite at all — turn your back and swing the thagomizer. Slow, but almost unkillable.', tag: '◆ HERBIVORE — TAIL FIGHTER', tagClass: 'hard' },
  crista: { desc: 'The shoreline king: a croc-snouted heavyweight that swims deep water and hits like a slammed door. Slow — but far too strong for Megorontosuchus to hold.', tag: '◆ CARNIVORE — TANK', tagClass: 'mod' },
  linhe: { desc: 'Nothing on the ridge outruns you — and nothing forgives a mistake. Dodge the falling fire, dodge Tarbosaurus, and remember: the wild packs hunt here too.', tag: '◆ CARNIVORE — SPEED', tagClass: 'hard' },
  preno: { desc: 'A dome of solid bone on a sprinter\'s frame. Nothing else on the ridge RAMS: build speed, hit like a falling rock, and knock things clean off their feet.', tag: '◆ HERBIVORE — RAMMER', tagClass: 'mod' },
  vulcano: { desc: 'A real dinosaur named after a volcano — Vulcanodon, VOLCANO TOOTH, dug from between two lava flows. A young mountain in cracked basalt hide, with a tail like a falling tree. Grows slowly; fears little.', tag: '◆ HERBIVORE — SAUROPOD', tagClass: 'mod' },
  nothro: { desc: 'A pot-bellied giant that stands tall and swings great scythe claws. Eats only plants; slashes anything that forgets that. Claw wounds bleed.', tag: '◆ HERBIVORE — CLAWS', tagClass: 'mod' },
  aardi: { desc: 'Small, weak, and it looks like a dumb pick — until you meet your kin. Press 2 to call the pack together: raid Protoceratops burrows, claim them, and rule the undergrowth.', tag: '◆ CARNIVORE — PACK ALPHA', tagClass: 'hard' },
  centro: { desc: 'One great nose horn and no sense of retreat. Grows slowly, but a grown Centrosaurus is a wall — cheap to hatch, hard to move.', tag: '◆ HERBIVORE — TANK', tagClass: 'mod' },
  omni: { desc: 'Fast, strong, and cheap: the working raptor of the delta islands. Bleed your prey, cross at the sandbars, and never swim where the saw hunts.', tag: '◆ CARNIVORE — RAIDER', tagClass: 'mod' },
  eotrach: { desc: 'The oldest duckbill — tough, hardy, and built to outlast the delta. Its scarred hide resists bleeding and its tail swings like a river gate.', tag: '◆ HERBIVORE — HARDY', tagClass: 'hard' },
  loki: { desc: 'Centrosaurus, but cooler: midnight coat and the blade horns of a trickster god. Bigger, meaner, and worth every growth.', tag: '◆ HERBIVORE — BRUISER', tagClass: 'mod' },
  moro: { desc: 'The sauropod. Grows agonizingly slowly — but a full-grown Morosaurus fears exactly one thing in all the delta, and its name is Lourinhanosaurus.', tag: '◆ HERBIVORE — COLOSSUS', tagClass: 'hard' },
  spino: { desc: 'The undisputed apex — at adult. M-sailed, dewlapped, striking with jaws AND claws, and hitting 1.2× harder from the water it rules. Getting there is the whole game.', tag: '◆ CARNIVORE — APEX', tagClass: 'swim' },
  tyranno: { desc: 'The LAND apex: a shark-toothed giant whose every bite opens a wound that keeps working. Hit, fall back, and let the bleeding do the rest.', tag: '◆ CARNIVORE — BLEED', tagClass: 'mod' },
  eshano: { desc: 'The oldest therizinosaur, shaggy against the cold. The ONLY grown dino that climbs the Wall\'s rock maze — scythe claws for ice-picks, and they make attackers bleed.', tag: '◆ HERBIVORE — CLIMBER', tagClass: 'hard' },
  jianchang: { desc: 'Small, quick, thin-coated — but its HATCHLINGS can scale the maze walls to escape anything with teeth. A grown Jianchangosaurus is too heavy for the rock. Use the gift while you have it.', tag: '◆ HERBIVORE — BABY CLIMBER', tagClass: 'hard' },
  nivalo: { desc: 'THE FROZEN GIANT. The mountain bears its name, and it cannot be bought — somewhere in the high maze, a hidden cave remembers it. The largest animal that has ever walked this game.', tag: '◆ HERBIVORE — THE LEGEND', tagClass: 'swim' },
  nanuq: { desc: 'Play the KING. The polar tyrant hunts the whiteout in a fur coat — bleed bites, wrestling strength, and every herd on the mountain knows your silhouette. Only the Titanovenator outranks you.', tag: '◆ CARNIVORE — THE KING', tagClass: 'mod' },
  nivarex: { desc: 'The Wall\'s final apex. A shark-toothed giant in a deep feather blanket — the largest carnivore on the mountain, near-immune to the cold, and heavy enough to bring down a Kerberosaurus alone. Every wound it opens keeps working.', tag: '◆ CARNIVORE — THE SUMMIT', tagClass: 'mod' },
  simo: { desc: 'Weird and wonderful: a pug-faced, square-headed little digger. Press B and it digs its OWN burrow — dive in and attackers gnaw an armored backside until they give up. One burrow at a time: choose the spot wisely.', tag: '◆ HERBIVORE — THE DIGGER', tagClass: 'hard' },
  korea: { desc: 'The horned swimmer: a small ceratopsian with a deep paddle tail. The black meres hide it, feed it, and drown whatever follows it in — the only moor-dweller at home in the deep water.', tag: '◆ HERBIVORE — SWIMMER', tagClass: 'swim' },
  sarco: { desc: 'Fast, deadly, and never bleeding — BREAKING. Its bites can crack the very bone they land on: a thigh ends the chase, a tail sends prey veering wrong, a skull takes the force out of everything.', tag: '◆ CARNIVORE — BONE BREAKER', tagClass: 'mod' },
  drypto: { desc: 'The long tyrant: stretched skull, stretched frame, and the same bone-cracking jaws turned up to full. Big, fast, agile — the mist\'s worst silhouette to guess wrong about.', tag: '◆ CARNIVORE — BONE BREAKER', tagClass: 'mod' },
  gastonia: { desc: 'A flat oval of living armor: ankylosaur head, shoulder spikes that grow as it does, and a long spiked tail swinging behind. Nothing on the moor opens it — most stop trying.', tag: '◆ HERBIVORE — THE FORTRESS', tagClass: 'hard' },
};

// ---------- chapter backdrops: each land's wallpaper ----------
// every biome gets a repeating pattern tile — a few quiet motifs in its own
// tint, scattered like a botanical print — that papers that land's entire
// stretch of the journey. Motifs draw around their origin ("ground" at y=0,
// growing upward) and bdAt() places them in the tile at any scale/rotation.
function bdAt(x, tx, ty, sc, rot, fn) {
  x.save(); x.translate(tx, ty); x.rotate(rot); x.scale(sc, sc); fn(x); x.restore();
}
function bdFern(x) {
  const p1 = [95, -270], p2 = [215, -410];
  const q = (t, i) => 2 * (1 - t) * t * p1[i] + t * t * p2[i];
  const dq = (t, i) => 2 * (1 - t) * p1[i] + 2 * t * (p2[i] - p1[i]);
  x.lineWidth = 7;
  x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); x.stroke();
  x.lineWidth = 9;
  for (let t = 0.12; t < 0.95; t += 0.09) {
    const px = q(t, 0), py = q(t, 1), a = Math.atan2(dq(t, 1), dq(t, 0)), len = 74 * (1 - t) + 14;
    for (const side of [-1, 1]) {
      x.beginPath(); x.moveTo(px, py);
      x.lineTo(px + Math.cos(a + side * 1.15) * len, py + Math.sin(a + side * 1.15) * len);
      x.stroke();
    }
  }
}
function bdBone(x) {
  x.fillRect(-105, -13, 210, 26);
  for (const [dx, dy] of [[-105, -15], [-105, 15], [105, -15], [105, 15]])
    { x.beginPath(); x.arc(dx, dy, 23, 0, Math.PI * 2); x.fill(); }
}
function bdSkull(x) {
  x.beginPath(); x.arc(0, 0, 66, 0, Math.PI * 2); x.fill();
  x.fillRect(-36, 44, 74, 36);
  x.save(); x.globalCompositeOperation = 'destination-out';
  for (const ex of [-28, 24]) { x.beginPath(); x.arc(ex, -7, 13, 0, Math.PI * 2); x.fill(); }
  x.restore();
}
function bdRibs(x) {
  x.lineWidth = 9;
  for (let i = 0; i < 4; i++)
    { x.beginPath(); x.arc(i * 34, 0, 46, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
}
function bdVolcano(x) {
  x.beginPath(); x.moveTo(-290, 0); x.lineTo(-46, -360); x.lineTo(46, -360); x.lineTo(290, 0);
  x.closePath(); x.fill();
  x.save(); x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.moveTo(-46, -360); x.lineTo(46, -360); x.lineTo(0, -302); x.closePath(); x.fill();
  x.restore();
}
function bdFish(x) {
  x.beginPath(); x.ellipse(0, 0, 70, 27, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(-62, 0); x.lineTo(-105, -26); x.lineTo(-105, 26); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(-8, -22); x.lineTo(18, -46); x.lineTo(30, -20); x.closePath(); x.fill();
  x.save(); x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.arc(42, -7, 5, 0, Math.PI * 2); x.fill();
  x.restore();
}
function bdReeds(x) {
  x.lineWidth = 7;
  for (let i = 0; i < 4; i++) {
    const bx = i * 26;
    x.beginPath(); x.moveTo(bx, 0); x.quadraticCurveTo(bx + 12, -90, bx + 4, -138 + i * 12); x.stroke();
    x.beginPath(); x.ellipse(bx + 4, -148 + i * 12, 7, 17, 0.1, 0, Math.PI * 2); x.fill();
  }
}
function bdPeaks(x) {
  x.beginPath(); x.moveTo(-330, 0); x.lineTo(-110, -345); x.lineTo(30, -145);
  x.lineTo(205, -405); x.lineTo(370, -125); x.lineTo(490, 0);
  x.closePath(); x.fill();
}
function bdPine(x) {
  for (const [w, y0, y1] of [[30, 95, 40], [40, 60, 0]]) {
    x.beginPath(); x.moveTo(0, -y0);
    x.lineTo(-w, -y1); x.lineTo(w, -y1);
    x.closePath(); x.fill();
  }
}
function bdMist(x, w) {
  x.beginPath();
  if (x.roundRect) x.roundRect(0, 0, w, 24, 12); else x.rect(0, 0, w, 24);
  x.fill();
}
function bdTree(x) {
  x.lineWidth = 10;
  x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(2, -120, 12, -230); x.stroke();
  x.lineWidth = 7;
  x.beginPath(); x.moveTo(8, -168); x.lineTo(-44, -242); x.stroke();
  x.beginPath(); x.moveTo(10, -198); x.lineTo(62, -272); x.stroke();
  x.beginPath(); x.moveTo(5, -108); x.lineTo(-52, -158); x.stroke();
}
function bdPalm(x) {
  x.lineWidth = 16;
  x.beginPath(); x.moveTo(53, 0); x.quadraticCurveTo(20, -130, 0, -248); x.stroke();
  x.lineWidth = 9;
  for (const [ex, ey, cx2, cy2] of [[-120, -308, -70, -318], [-94, -216, -60, -258], [90, -318, 40, -328],
    [124, -226, 60, -268], [-50, -336, -28, -326], [54, -346, 24, -328]])
    { x.beginPath(); x.moveTo(0, -252); x.quadraticCurveTo(cx2, cy2, ex, ey); x.stroke(); }
  for (const [nx, ny] of [[-14, -236], [11, -230]])
    { x.beginPath(); x.arc(nx, ny, 11, 0, Math.PI * 2); x.fill(); }
}
function bdLeaf(x) {
  x.lineWidth = 6;
  x.beginPath(); x.ellipse(0, 0, 105, 34, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(-105, 0); x.lineTo(-160, 26); x.stroke();
}
function bdGull(x) {
  x.lineWidth = 5;
  x.beginPath(); x.moveTo(-26, 0);
  x.quadraticCurveTo(-13, -16, 0, 0); x.quadraticCurveTo(13, -16, 26, 0);
  x.stroke();
}
// one tile per land (640×560, repeated): motifs alternate corner to corner
// and flip up/down like a wallpaper print so the repeat reads as texture
const ECO_ART = {
  valley(x) {
    bdAt(x, 100, 520, 0.72, -0.08, bdFern);
    bdAt(x, 520, 60, 0.5, Math.PI - 0.15, bdFern);   // hanging frond
    bdAt(x, 420, 545, 0.36, 0.25, bdFern);
  },
  prairie(x) {
    bdAt(x, 165, 130, 0.8, -0.45, bdBone);
    bdAt(x, 470, 420, 0.55, 0.35, bdBone);
    bdAt(x, 460, 130, 0.62, 0.1, bdSkull);
    bdAt(x, 130, 430, 0.8, 0, bdRibs);
  },
  coast(x) {
    x.lineWidth = 7; x.lineCap = 'butt';
    for (const y of [110, 290, 470]) {
      x.beginPath(); x.moveTo(0, y);
      for (let wx = 0; wx < 640; wx += 80) x.quadraticCurveTo(wx + 40, y - 34, wx + 80, y);
      x.stroke();
    }
    x.lineCap = 'round';
    bdAt(x, 180, 205, 1, 0.1, bdGull);
    bdAt(x, 450, 385, 0.8, -0.1, bdGull);
  },
  ash(x) {
    bdAt(x, 170, 320, 0.55, 0, bdVolcano);
    bdAt(x, 480, 552, 0.38, 0, bdVolcano);
    for (const [fx, fy, r] of [[300, 90, 8], [420, 50, 11], [520, 130, 6], [80, 60, 7], [600, 340, 6], [60, 480, 8]])
      { x.beginPath(); x.arc(fx, fy, r, 0, Math.PI * 2); x.fill(); }
  },
  delta(x) {
    bdAt(x, 190, 120, 0.7, 0.06, bdFish);
    bdAt(x, 460, 330, 0.5, -0.06, (c) => { c.scale(-1, 1); bdFish(c); });
    bdAt(x, 110, 545, 0.9, 0, bdReeds);
    bdAt(x, 500, 545, 0.6, 0, bdReeds);
    for (const [bx, by, r] of [[320, 230, 7], [340, 200, 5], [330, 260, 4]])
      { x.beginPath(); x.arc(bx, by, r, 0, Math.PI * 2); x.fill(); }
  },
  wall(x) {
    bdAt(x, 200, 240, 0.5, 0, bdPeaks);
    bdAt(x, 480, 330, 0.85, 0, bdPine);
    bdAt(x, 545, 345, 0.6, 0, bdPine);
    bdAt(x, 130, 545, 0.75, 0, bdPine);
    bdAt(x, 520, 545, 0.45, 0, bdPine);
  },
  moor(x) {
    for (const [mx, my, w] of [[40, 70, 300], [300, 180, 280], [70, 300, 260], [360, 420, 240], [130, 500, 300]])
      bdAt(x, mx, my, 1, 0, (c) => bdMist(c, w));
    bdAt(x, 520, 300, 0.6, 0.05, bdTree);
  },
  jungle(x) {
    bdAt(x, 150, 400, 0.62, 0.04, bdPalm);
    bdAt(x, 480, 120, 0.55, -0.35, bdLeaf);
    bdAt(x, 430, 500, 0.45, 0.5, bdLeaf);
    bdAt(x, 560, 555, 0.34, -0.06, (c) => { c.scale(-1, 1); bdPalm(c); });
  },
};
function ecoBackdrop(key, tint) {
  const painter = ECO_ART[key];
  if (!painter) return '';
  const cv = document.createElement('canvas');
  cv.width = 640; cv.height = 560;
  const x = cv.getContext('2d');
  x.strokeStyle = x.fillStyle = tint;
  x.lineCap = x.lineJoin = 'round';
  painter(x);
  return cv.toDataURL();
}

// ---------- the EXPEDITION LEDGER: stamps, pips and collectible titles ----------
// every name here is a PLACEHOLDER — the kid renames them; a title is one
// registry entry (id stays stable, name/icon/desc are his to change)
function ecoRoster(key) {
  return ALL_PLAYABLES.filter(sp => (PLAYER_DEF[sp].eco || 'valley') === key && !PLAYER_DEF[sp].secret);
}
const TITLE_ECO_NAMES = { valley: 'Valleyborn', prairie: 'Bonepicker', coast: 'Tidewalker', ash: 'Ashborn', delta: 'Delta Rat', wall: 'Wall Climber', moor: 'Mistwalker', jungle: 'Rainblood' };
const TITLES = [];
for (const key of Object.keys(ECOS)) {
  TITLES.push({ id: 'disc-' + key, name: TITLE_ECO_NAMES[key] || ECOS[key].name, icon: ECOS[key].emoji,
    desc: 'Discover ' + ECOS[key].name, test: () => !!Save.discovered[key] });
}
TITLES.push(
  { id: 'first-mastery', name: 'First Blood', icon: '🥇', desc: 'Raise your first Full Adult', test: () => Object.keys(Save.mastery).length >= 1 },
  { id: 'keeper-five', name: 'Keeper of Five', icon: '🏅', desc: 'Master five dinosaurs', test: () => Object.keys(Save.mastery).length >= 5 },
  { id: 'lord-land', name: 'Lord of a Land', icon: '👑', desc: 'Master every dinosaur of one land', test: () => Object.keys(ECOS).some(k => ecoRoster(k).every(sp => Save.mastery[sp])) },
  { id: 'eight-lands', name: 'Master of the Eight Lands', icon: '🌍', desc: 'Master every dinosaur in the world', test: () => ALL_PLAYABLES.filter(sp => !PLAYER_DEF[sp].secret).every(sp => Save.mastery[sp]) },
  { id: 'giantfinder', name: 'Giantfinder', icon: '🧊', desc: 'Find what sleeps in the high maze', test: () => !!Save.owned.nivalo },
  { id: 'parent', name: 'Parent', icon: '🥚', desc: 'Raise a clutch of young', test: () => !!Save.raisedClutch },
  { id: 'stormrider', name: 'Stormrider', icon: '⛈️', desc: 'Live through a whole monsoon', test: () => !!Save.stormRider },
  { id: 'packbreaker', name: 'Packbreaker', icon: '💥', desc: 'Wipe a pack out to the last', test: () => !!Save.packBreaker },
);
// award anything newly earned; silent for backfilling old saves
function syncTitles(silent) {
  const fresh = [];
  for (const t of TITLES) {
    if (!Save.titles[t.id] && t.test()) { Save.titles[t.id] = true; fresh.push(t); }
  }
  if (fresh.length) {
    saveSave();
    if (!silent) {
      const names = fresh.map(t => t.icon + ' ' + t.name.toUpperCase()).join(' · ');
      if (G.started) setTimeout(() => { G.banner = { str: '🏅 TITLE EARNED: ' + names, t: 6, color: '#ffd23e' }; }, 11000);
      else flashTitleMsg('🏅 Title earned: ' + names + ' — tap the shield to wear it!');
    }
  }
}
// saves from before the ledger: backfill stamps/hatchlings, no ceremonies
function migrateLedger() {
  for (const key of Object.keys(ECOS)) {
    if (ecoPaid(key) && !Save.discovered[key]) {
      Save.discovered[key] = { n: Object.keys(Save.discovered).length + 1, by: null };
      Save.ecoSeen[key] = true;   // history, not news — no reveal ceremony
    }
  }
  for (const sp of ALL_PLAYABLES) {
    if (Save.mastery[sp] || Save.dino[dinoKey(sp, 'f')] || Save.dino[dinoKey(sp, 'm')]) Save.hatched[sp] = true;
  }
  syncTitles(true);
}
const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
function stampPips(key) {
  const roster = ecoRoster(key);
  const pips = [
    ['Arrived — set foot in this land', !!Save.arrived[key]],
    ['Survived — raised a Full Adult here', roster.some(sp => Save.mastery[sp])],
    ['All hatched — played every dinosaur here', roster.every(sp => Save.hatched[sp])],
    ['All mastered — every dinosaur Full Adult', roster.every(sp => Save.mastery[sp])],
  ];
  if (key === 'wall') pips.push(['Secret found — the frozen giant', !!Save.owned.nivalo]);
  return pips;
}
// the jump-dot IS the land's stamp now: tint ring once discovered, and on
// the rim — three feat pips (Arrived · All hatched · All mastered) plus one
// GOLD pip for every dinosaur currently walking the land as an Adult; gold
// rim when every feat is complete. The hover flyout tells the whole story.
const TABPIP_STEP = 38;      // max degrees between rim pips, fanned on the right arc
const TAB_ADULT_G = 0.9;     // growth from which a saved dino counts as Adult
function decorateEcoTab(key) {
  const tab = document.getElementById('tab-' + key);
  const d = Save.discovered[key];
  tab.style.setProperty('--tint', d ? (ECOS[key].tint || '#7a6034') : '#57452a');
  for (const old of tab.querySelectorAll('.tabpip')) old.remove();
  const feats = tab.querySelector('.tffeats');
  feats.innerHTML = '';
  const roster = d ? ecoRoster(key) : [];
  const isAdult = (sp) => ['f', 'm'].some(gd => {
    const sd = Save.dino[dinoKey(sp, gd)];
    return sd && sd.growth >= TAB_ADULT_G;
  });
  const adults = roster.filter(isAdult);
  // the rim: the three feats, then one gold pip per currently-adult dino
  const rim = d ? [
    ['', !!Save.arrived[key]],
    ['', roster.every(sp => Save.hatched[sp])],
    ['', roster.every(sp => Save.mastery[sp])],
    ...adults.map(() => ['adult', true]),
  ] : [];
  const step = Math.min(TABPIP_STEP, rim.length > 1 ? 160 / (rim.length - 1) : TABPIP_STEP);
  rim.forEach(([kind, lit], i) => {
    const pip = document.createElement('span');
    pip.className = 'tabpip' + (kind === 'adult' ? ' adult' : lit ? ' lit' : '');
    pip.style.setProperty('--a', ((i - (rim.length - 1) / 2) * step) + 'deg');
    tab.appendChild(pip);
  });
  // the flyout: the land's feats, each a lit or dark line, then the adults
  const pips = d ? stampPips(key) : [];
  let all = !!d && pips.length > 0;
  for (const [tip, lit] of pips) {
    const line = document.createElement('div');
    line.className = 'tffeat' + (lit ? ' lit' : '');
    line.textContent = (lit ? '●' : '○') + ' ' + tip;
    feats.appendChild(line);
    if (!lit) all = false;
  }
  if (d) {
    const ad = document.createElement('div');
    ad.className = 'tffeat' + (adults.length ? ' adult' : '');
    ad.textContent = (adults.length ? '●' : '○') + ' ' + adults.length + ' walking this land full-grown';
    feats.appendChild(ad);
  }
  tab.classList.toggle('gold', all);
  const done = roster.filter(sp => Save.mastery[sp]).length;
  tab.querySelector('.tfstat').textContent = d
    ? (ORDINALS[d.n] || d.n + 'th') + ' land' + (d.by ? ' · by ' + DINO[d.by].name.toUpperCase() : '')
      + ' · ' + done + '/' + roster.length + ' mastered'
    : 'undiscovered';
}
function renderTitleWall() {
  const row = document.getElementById('twall');
  row.innerHTML = '';
  let ownedN = 0;
  for (const t of TITLES) {
    const owned = !!Save.titles[t.id];
    if (owned) ownedN++;
    const el = document.createElement('div');
    el.className = 'ltitle' + (owned ? ' owned' : '') + (owned && Save.titleWorn === t.id ? ' worn' : '');
    el.innerHTML = '<div class="lbadge"></div><div class="ltname"></div>';
    el.querySelector('.lbadge').textContent = owned ? t.icon : '?';
    el.querySelector('.ltname').textContent = owned ? t.name : '???';
    el.title = t.desc + (owned ? (Save.titleWorn === t.id ? ' — worn (tap to take off)' : ' — tap to wear') : '');
    if (owned) el.addEventListener('click', () => {
      Save.titleWorn = Save.titleWorn === t.id ? null : t.id;
      saveSave(); renderTitleWall(); refreshTitle();
    });
    row.appendChild(el);
  }
  document.getElementById('tcount').textContent = ownedN + ' / ' + TITLES.length + ' collected · tap a badge to wear it';
}
function toggleTitles(show) {
  const wall = document.getElementById('titlewall');
  const want = show != null ? show : wall.classList.contains('hidden');
  if (want) renderTitleWall();
  wall.classList.toggle('hidden', !want);
}
// the reveal ceremony: the first lobby visit after a land opens develops its
// chapter live — color blooms, the seam draws itself, the stamp thuds down
function playDiscovery() {
  const key = Object.keys(ECOS).find(k => ecoPaid(k) && Save.discovered[k] && !Save.ecoSeen[k]);
  if (!key) return false;
  Save.ecoSeen[key] = true;
  saveSave();
  const sect = document.getElementById('sect-' + key);
  sect.classList.remove('develop');
  void sect.offsetWidth;   // restart the css animation
  sect.scrollIntoView({ block: 'start', behavior: 'instant' });
  sect.classList.add('develop');
  setTimeout(() => sect.classList.remove('develop'), 3000);
  try { SFX.buy(); } catch (err) { }
  flashTitleMsg('🗺️ ' + ECOS[key].name.toUpperCase() + ' joins your trail!');
  return true;
}

// build tabs and cards once from ECOS / PLAYER_DEF / DINO / CARD_INFO
function buildTitleUI() {
  const tabs = document.getElementById('ecotabs');
  tabs.innerHTML = '';
  const area = document.getElementById('cards-area');
  area.innerHTML = '';
  // the branch side alternates all the way down the trail, across biome
  // borders, so the journey sways left-right like real switchbacks
  let flip = 0;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  for (const key of Object.keys(ECOS)) {
    const eco = ECOS[key];
    // the jump-to dot on the screen's left edge — its name floats on hover
    const tab = document.createElement('div');
    tab.className = 'ecotab';
    tab.id = 'tab-' + key;
    tab.textContent = eco.emoji;
    const fly = document.createElement('span');
    fly.className = 'tabfly';
    fly.innerHTML = '<div class="tfname"></div><div class="tfstat"></div><div class="tffeats"></div>';
    fly.querySelector('.tfname').textContent = eco.name.toUpperCase();
    tab.appendChild(fly);
    tab.addEventListener('click', () => tryEcoTab(key));
    tabs.appendChild(tab);

    // the waypoint camp on the trail, then its dinos as rungs beneath it:
    // one rung per chain step, forks flanking the trail on a shared rung,
    // secrets on a ★ rung of their own (hidden until the world gives them)
    const sect = document.createElement('div');
    sect.className = 'ecosect';
    sect.id = 'sect-' + key;
    sect.innerHTML = '<div class="ecohead"><div class="medal"></div>' +
      '<div class="ecotxt"><h2></h2><div class="ecosub"></div><div class="ecomast"></div></div></div>';
    sect.querySelector('.medal').textContent = eco.emoji;
    sect.querySelector('h2').textContent = eco.name.toUpperCase();
    // the land's signature color washes its whole chapter of the trail
    const tint = eco.tint || '#7a6034';
    sect.style.setProperty('--ecoline', tint);
    const tr = parseInt(tint.slice(1, 3), 16), tg = parseInt(tint.slice(3, 5), 16), tb = parseInt(tint.slice(5, 7), 16);
    sect.style.setProperty('--ecoglow', 'rgba(' + tr + ',' + tg + ',' + tb + ',0.15)');
    const art = ecoBackdrop(key, tint);
    if (art) sect.style.setProperty('--ecoart', 'url(' + art + ')');
    const roster = ALL_PLAYABLES.filter(sp => (PLAYER_DEF[sp].eco || 'valley') === key)
      .sort((a, b) => (chainRung(a) + 1 || 99) - (chainRung(b) + 1 || 99));
    const rungs = [];
    for (const sp of roster) {
      const rk = PLAYER_DEF[sp].secret ? 'secret-' + sp : chainRung(sp);
      const last = rungs[rungs.length - 1];
      if (last && last.rk === rk) last.sps.push(sp);
      else rungs.push({ rk, sps: [sp] });
    }
    let step = 0;
    for (const rung of rungs) {
      const secret = String(rung.rk).startsWith('secret');
      if (!secret) step++;
      const duo = rung.sps.length > 1;
      const row = document.createElement('div');
      row.className = 'rung ' + (duo ? 'duo' : (flip++ % 2 ? 'right' : 'left'));
      row.dataset.sps = rung.sps.join(',');
      const node = document.createElement('div');
      node.className = 'rungnode';
      node.textContent = secret ? '★' : (ROMAN[step - 1] || step);
      row.appendChild(node);
      const holder = document.createElement('div');
      holder.className = 'rungcards';
      row.appendChild(holder);
      for (const sp of rung.sps) buildCard(sp, holder);
      sect.appendChild(row);
    }
    area.appendChild(sect);
  }
  // the trail doesn't end — it just hasn't been walked yet
  const te = document.createElement('div');
  te.id = 'trailend';
  te.innerHTML = '<div class="tenode">· · ·</div><div class="tetext">the trail goes on…</div>';
  area.appendChild(te);
  // hand every preview canvas to the viewport observer
  previewObserver.disconnect();
  previewVisible.clear();
  for (const cv of area.querySelectorAll('.card canvas')) previewObserver.observe(cv);
  // the trail-spy: whichever camp owns the middle of the screen lights its dot
  document.getElementById('journey').addEventListener('scroll', updateTrailSpot, { passive: true });

  function buildCard(sp, holder) {
      const info = CARD_INFO[sp] || { desc: '', tag: '', tagClass: 'mod' };
      const card = document.createElement('div');
      card.className = 'card';
      card.id = 'card-' + sp;
      // gender is a segmented toggle sat right under the preview (it changes the
      // dino you see); ownership is a corner badge on the preview (✓ / 🔒); the
      // chosen loadout's growth sits under the difficulty tag; skins are their
      // own swatch row lower down. Clicking the dino/body launches — the gender
      // bar and skin row swallow their own clicks.
      card.innerHTML = '<div class="side"><div class="prevwrap"><canvas width="200" height="120"></canvas><span class="ownbadge"></span></div>' +
        '<div class="gsel">' +
        '<span class="gseg" data-g="f">♀ Female<span class="tip"></span></span>' +
        '<span class="gseg" data-g="m">♂ Male<span class="tip"></span></span>' +
        '</div></div>' +
        '<div class="info"><h2></h2><div class="latin"></div><p></p>' +
        '<div class="meta"><div class="diff"></div><div class="prog"></div></div>' +
        '<div class="price"></div>' +
        '<div class="skinsel"></div></div>';
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
      holder.appendChild(card);
  }
}

function refreshTitle() {
  const bal = document.getElementById('gr-balance');
  bal.textContent = '';
  // the crest shield beside the pill wears your worn title's mark (★ when
  // bare); the pill itself swaps players when clicked
  const wt = TITLES.find(t => t.id === Save.titleWorn && Save.titles[t.id]);
  document.querySelector('#btn-titles span').textContent = wt ? wt.icon : '★';
  const nm = document.createElement('span');
  nm.className = 'pname';
  nm.title = 'Switch player';
  nm.textContent = '🦖 ' + (Profiles.current || '—');
  bal.appendChild(nm);
  if (wt) {
    const ts = document.createElement('span');
    ts.className = 'worntitle';
    ts.textContent = ' · ' + wt.name;
    bal.appendChild(ts);
  }
  bal.appendChild(document.createTextNode('  ·  ❖ ' + Save.growths));
  // waypoint camps: lock state, subtitle, and how far each ladder is climbed
  for (const key of Object.keys(ECOS)) {
    const eco = ECOS[key];
    const paid = ecoPaid(key);
    document.getElementById('tab-' + key).classList.toggle('locked', !paid);
    decorateEcoTab(key);
    const sect = document.getElementById('sect-' + key);
    sect.classList.toggle('locked', !paid);
    sect.querySelector('.ecosub').textContent = paid ? eco.sub : '🔒 ' + ecoUnlockHint(key);
    const roster = ALL_PLAYABLES.filter(sp => (PLAYER_DEF[sp].eco || 'valley') === key
      && (!PLAYER_DEF[sp].secret || Save.owned[sp]));
    const done = roster.filter(sp => Save.mastery[sp]).length;
    sect.querySelector('.ecomast').textContent = done + ' / ' + roster.length + ' mastered';
  }
  // rung nodes: green once a member is mastered, gold while playable, dim before
  for (const row of document.querySelectorAll('#cards-area .rung')) {
    const sps = row.dataset.sps.split(',');
    const done = sps.some(sp => Save.mastery[sp]);
    row.classList.toggle('done', done);
    row.classList.toggle('open', !done && sps.some(spUnlocked));
    // a secret's whole rung stays off the ladder until the world gives it
    if (sps.every(sp => PLAYER_DEF[sp].secret))
      row.style.display = sps.some(sp => Save.owned[sp]) ? '' : 'none';
  }
  // per-card ownership badge / price / progress state
  for (const sp of ALL_PLAYABLES) {
    const card = document.getElementById('card-' + sp);
    if (!card) continue;
    const def = PLAYER_DEF[sp];
    // a SECRET dino's card doesn't exist until the world gives it to you
    if (def.secret) {
      card.style.display = Save.owned[sp] ? '' : 'none';
      if (!Save.owned[sp]) continue;
    }
    const owned = spUnlocked(sp);
    card.classList.toggle('locked', !owned);
    // ownership is a corner badge on the preview now — ✓ unlocked, 🔒 not yet
    const badge = card.querySelector('.ownbadge');
    badge.textContent = owned ? '✓' : '🔒';
    badge.className = 'ownbadge ' + (owned ? 'owned' : 'locked');
    // the price row is now the ladder row: which mastery opens this rung
    const priceEl = card.querySelector('.price');
    priceEl.className = 'price' + (owned ? '' : ' poor');
    priceEl.textContent = owned ? '' : spUnlockHint(sp);
    priceEl.style.display = owned ? 'none' : '';
    // the chosen loadout's growth sits right under the difficulty tag
    card.querySelector('.prog').textContent = cardProgText(sp);
    // rebuild the swatches so OWNED / affordability labels track the live
    // balance (they're first built at boot, before a profile is even chosen)
    buildCardSkins(sp, card.querySelector('.skinsel'));
  }
  updateTrailSpot();
}
// the selected gender's saved growth, e.g. "♂ 100% Full Adult" (blank if new)
function cardProgText(sp) {
  const g = cardGender(sp);
  const s = Save.dino[dinoKey(sp, g)];
  return s && s.growth > 0.005 ? (g === 'm' ? '♂' : '♀') + ' ' + Math.floor(s.growth * 100) + '% ' + stageOf(s.growth) : '';
}

// the skin swatches on a species card — the inline heir to the old picker's
// skin row: same registry loop and buy flow, painted small onto the card.
// On touch a purchase takes TWO taps: the first arms the swatch (its label
// flips to BUY?), the second within 2.5s spends the growths — a stray tap
// on the way through the lobby must never buy a coat.
let armSkin = null, armSkinT = 0;
function buildCardSkins(sp, container) {
  container.innerHTML = '';
  const cur = cardSkin(sp);
  for (const id of Object.keys(SKINS)) {
    const def = SKINS[id];
    if (!skinFits(sp, id)) continue;                // species-exclusive coat
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
        if (document.body.classList.contains('touch')) {
          const key = sp + ':' + id;
          if (armSkin !== key || performance.now() - armSkinT > 2500) {
            armSkin = key; armSkinT = performance.now();
            label.textContent = 'BUY?';
            flashTitleMsg('Tap ' + def.name + ' again to buy it for ❖ ' + def.cost);
            setTimeout(() => { if (armSkin === key) { armSkin = null; refreshCardOpts(sp); } }, 2600);
            return;
          }
          armSkin = null;
        }
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

// which camp owns the middle of the screen right now — its dot gets the glow
function updateTrailSpot() {
  const jr = document.getElementById('journey');
  const probe = jr.getBoundingClientRect().top + jr.clientHeight * 0.38;
  let cur = Object.keys(ECOS)[0];
  for (const key of Object.keys(ECOS)) {
    const sect = document.getElementById('sect-' + key);
    if (sect && sect.getBoundingClientRect().top <= probe) cur = key;
  }
  titleEco = cur;
  for (const key of Object.keys(ECOS))
    document.getElementById('tab-' + key).classList.toggle('sel', key === cur);
}

function tryEcoTab(key) {
  const eco = ECOS[key];
  // locked camps still scroll into view — seeing the padlocked waypoint IS
  // the answer — but the dot also says out loud what opens the land
  if (!ecoPaid(key)) flashTitleMsg('To discover ' + eco.name + ': ' + ecoUnlockHint(key) + '!');
  titleEco = key;
  document.getElementById('sect-' + key).scrollIntoView({ block: 'start' });
}
// UI transition guard: SPACE-mashing must never re-click a focused button, and
// the second click of a double-click must never land on the screen that just
// appeared (death "CHANGE SPECIES" sits exactly where the lobby cards open)
let lastUiSwitch = -1e9;
function uiSwitchBlocked() { return performance.now() - lastUiSwitch < 450; }
function markUiSwitch() { lastUiSwitch = performance.now(); }
function tryPlay(species) {
  if (G.started || uiSwitchBlocked()) return;
  // the ladder is the only gate now: master the rung before this one
  if (!spUnlocked(species)) {
    flashTitleMsg('To unlock ' + DINO[species].name + ': ' + spUnlockHint(species) + '!');
    return;
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
  } else if (skinId === 'wylord') {
    x.strokeStyle = C.pat; x.lineWidth = 2.5; x.lineCap = 'round';
    for (const [fy, ph] of [[0.45, 0], [0.66, 1.8]]) {
      x.beginPath();
      for (let i = 0; i <= 8; i++) x[i ? 'lineTo' : 'moveTo'](W * i / 8, H * fy + Math.sin(i * 1.6 + ph) * H * 0.06);
      x.stroke();
    }
  } else if (skinId === 'klanderx') {
    x.strokeStyle = '#f4f2ff'; x.lineWidth = 1.6; x.lineCap = 'round';
    for (const [dx, dy, r] of [[0.26, 0.4, 0.09], [0.6, 0.62, 0.06], [0.8, 0.32, 0.075]]) {
      x.beginPath();
      x.moveTo(W * (dx - r), H * dy); x.lineTo(W * (dx + r), H * dy);
      x.moveTo(W * dx, H * dy - W * r); x.lineTo(W * dx, H * dy + W * r);
      x.stroke();
    }
  } else if (skinId === 'litherim') {
    x.strokeStyle = C.pat; x.lineWidth = 2.2; x.lineCap = 'round';
    for (const [fx, fy, ln] of [[0.7, 0.42, 0.3], [0.55, 0.62, 0.24], [0.9, 0.68, 0.28]]) {
      x.beginPath(); x.moveTo(W * fx, H * fy); x.lineTo(W * (fx - ln), H * (fy + 0.04)); x.stroke();
    }
  } else if (skinId === 'granulon') {
    for (const [dx, dy, r, ci] of [[0.2, 0.46, 0.05, 0], [0.44, 0.6, 0.04, 1], [0.66, 0.4, 0.055, 2], [0.85, 0.64, 0.045, 0], [0.32, 0.7, 0.035, 2]]) {
      x.fillStyle = ci === 0 ? C.acc : ci === 1 ? C.pat : mixHex(C.belly, '#ffffff', 0.2);
      x.beginPath();
      x.moveTo(W * (dx - r), H * dy + W * r * 0.4);
      x.lineTo(W * dx, H * dy - W * r);
      x.lineTo(W * (dx + r), H * dy);
      x.lineTo(W * dx, H * dy + W * r);
      x.closePath(); x.fill();
    }
  }
  x.strokeStyle = C.line; x.lineWidth = 3; x.strokeRect(0, 0, W, H);
}
document.getElementById('btn-respawn').addEventListener('click', () => {
  document.getElementById('death').classList.add('hidden');
  respawn(G.player.species, G.player.gender, G.player.skin);
});
function exitToLobby(force) {
  // force: the lobby countdown already debounced this exit — the wall-clock
  // double-click guard must not eat a scheduled departure
  if (!force && uiSwitchBlocked()) return;
  markUiSwitch();
  G.lobbyCountdown = null;
  saveDinoSnapshot();
  G.paused = false;
  document.getElementById('pause').classList.add('hidden');
  document.getElementById('death').classList.add('hidden');
  document.getElementById('title').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  G.started = false;
  // reopen the journey at the land you were just walking (refreshTitle's
  // trail-spy reads the scroll position, so scroll first, then refresh)
  const sect = document.getElementById('sect-' + World.eco);
  if (sect) sect.scrollIntoView({ block: 'start', behavior: 'instant' });
  refreshTitle();
  playDiscovery();   // a land opened this life? develop its chapter now
  animateAllPreviews();
}
document.getElementById('btn-titles').addEventListener('click', () => toggleTitles());
// no close button on the wall — tap anywhere off the badges (or Esc) to leave
document.getElementById('titlewall').addEventListener('click', (e) => {
  if (!e.target.closest('#twall')) toggleTitles(false);
});
document.getElementById('btn-title').addEventListener('click', exitToLobby);
// leaving a LIVE game is not instant: the lobby button starts a 5-second
// countdown DURING which the world keeps running — no teleporting out of a
// bad situation. (The death screen's buttons stay instant — you're dead.)
const LOBBY_LEAVE_T = 5;
function requestLobby() {
  if (!G.started || G.lobbyCountdown != null) return;
  // the countdown must be survivable, not skippable: unpause and stand there
  G.paused = false;
  document.getElementById('pause').classList.add('hidden');
  G.lobbyCountdown = LOBBY_LEAVE_T;
}
document.getElementById('btn-lobby').addEventListener('click', (ev) => {
  if (ev.detail === 0) return;   // keyboard-activated "click" (SPACE/Enter) — never leave the game for that
  requestLobby();
});
document.getElementById('pause-lobby').addEventListener('click', (ev) => {
  if (ev.detail === 0) return;
  requestLobby();
});
// buttons must never hold keyboard focus, or SPACE (bite!) re-clicks them mid-game
for (const id of ['btn-lobby', 'btn-respawn', 'btn-title', 'pause-lobby']) {
  const b = document.getElementById(id);
  b.setAttribute('tabindex', '-1');
  b.addEventListener('mousedown', (ev) => ev.preventDefault());   // click still fires; focus never sticks
}

const START_BANNERS = {
  buitre: 'You hatch on the riverbank. The fish are yours — the flood is not.',
  hypsi: 'You hatch in the thicket. When the world comes for you, go underground.',
  adratik: 'You hatch spiked and slow. Let them come — everything you touch bleeds.',
  orkor: 'You hatch with hooks for hands. Nothing here outruns you.',
  neove: 'You hatch in the green dark. Learn to arrive without being seen.',
  coahuila: 'You hatch horn-budded. One day nothing will dare stand in front of you.',
  poekilo: 'You hatch heavy-boned. Grow — the Reach will learn your name.',
  raja: 'You hatch in the fern forest. Grow. Hunt. Survive.',
  campto: 'You hatch on the open plains. Reach the ferns before Moros finds you!',
  rioja: 'You hatch heavy-boned and hungry. Eat everything — greatness takes time.',
  ichthyo: 'You hatch in the southern swamp. The deep water belongs to you alone.',
  qianzho: 'You hatch on Skull Prairie. Grow slowly — become its fastest hunter.',
  scutello: 'You hatch in armor. Eat, earn, and stay clear of the Troodon packs.',
  metria: 'You hatch in the waving grass. The herds are food — earn your place.',
  giganto: 'You hatch spined. Turn your back to fight, and let the tail talk.',
  crista: 'You hatch by the shore. One day the surf itself will fear you.',
  linhe: 'You hatch on the ash. Nothing here forgives — be faster than all of it.',
  preno: 'You hatch hard-headed. The ridge will test that. Meet it head-on.',
  vulcano: 'You hatch between old lava flows. The mountain made you — now grow into one.',
  nothro: 'You hatch beneath the ash clouds. Grow tall; the claws will answer.',
  aardi: 'You hatch scruffy and small. Find your kin — alone you are nothing.',
  centro: 'You hatch on the floodplain. Grow the horn — then stop retreating.',
  omni: 'You hatch among the islands. Run the sandbars; the channels have teeth.',
  eotrach: 'You hatch by the braided water. Outlast everything — that is the trick.',
  loki: 'You hatch crowned. Grow into the horns and the delta will make way.',
  moro: 'You hatch impossibly small. One day the ground will shake instead.',
  spino: 'You hatch where the river splits. All of it will be yours. Eventually.',
  tyranno: 'You hatch with shark teeth. Every wound you open works for you.',
  jianchang: 'You hatch on the cold rock. Climb while you are small — the wall remembers.',
  eshano: 'You hatch beneath the pines. Strange claws, old blood — the mountain is yours to climb.',
  nanuq: 'You hatch in the snow. Grow quietly; the mountain already has a king.',
  nivarex: 'You hatch wrapped in feathers. The cold gave up on your kind long ago.',
  simo: 'You hatch small and square-faced. Dig deep — the mist hides worse things.',
  korea: 'You hatch by a black mere. The deep water is the one place they can\'t follow.',
  sarco: 'You hatch hungry on the grey heath. What you bite, you break.',
  drypto: 'You hatch long-shadowed. One day the mist will make YOU the bad silhouette.',
  gastonia: 'You hatch armored. Let the moor gnaw — it will tire before you do.',
  nivalo: 'You wake from the ice. The wall was named for you. Remind it why.',
};
function startGame(species, gender, skin) {
  const def = PLAYER_DEF[species];
  if (!spUnlocked(species)) return;   // never start a locked rung (or an unfound secret)
  const eco = def.eco || 'valley';
  if (!ecoPaid(eco)) return;                         // …or a locked ecosystem
  markUiSwitch();
  if (World.eco !== eco) {
    genWorld(eco);
    buildMinimap();
  }
  G.eruption = { nextT: 35 + Math.random() * 15, warn: 0, bombs: [] };
  G.blizzard = null;   // updateBlizzard builds it on snowy worlds
  G.mist = 0;
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
  G.myBurrow = null;   // the digger starts homeless
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
    p.cold = clamp(snap.cold || 0, 0, 95);   // never resume mid-freeze
    // wounds survive the lobby round-trip
    if (snap.bleed && snap.bleed.t > 0 && snap.bleed.dps > 0) p.bleed = { dps: snap.bleed.dps, t: snap.bleed.t };
    if (snap.bones) p.bones = Object.assign({}, snap.bones);
    p.exhausted = !!snap.exhausted;
    const okPos = snap.x > 20 && snap.x < WORLD_W - 20 && snap.y > 20 && snap.y < WORLD_H - 20 &&
      (!isDeepPx(snap.x, snap.y) || PLAYER_DEF[species].swim);
    if (okPos) { p.x = snap.x; p.y = snap.y; }
  }
  G.player.bornAt = G.time;
  // ledger ink: this dino has hatched, and this land has been walked
  Save.hatched[species] = true;
  Save.arrived[World.eco] = true;
  saveSave();
  // snap the grow-zoom to this dino's size — no swooshing on spawn
  G.zoom = growZoom(species, G.player.growth);
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
  // ladder migration: anything bought under the old ❖ economy stays owned, and
  // any dino with real progress counts as owned too (it was playable back then)
  for (const sp of ALL_PLAYABLES) {
    if (Save.owned[sp]) continue;
    for (const g of ['f', 'm']) {
      const s = Save.dino[dinoKey(sp, g)];
      if (s && s.growth > 0.005) { Save.owned[sp] = true; break; }
    }
  }
  syncEcoUnlocks();   // lands reachable on the ladder open silently
  migrateLedger();    // stamps/titles backfilled for pre-ledger saves
  saveSave();
  document.getElementById('profiles').classList.add('hidden');
  document.getElementById('title').classList.remove('hidden');
  titleEco = 'valley';
  refreshTitle();
  document.getElementById('journey').scrollTop = 0;
  playDiscovery();
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
  VIEW_H = document.body.classList.contains('touch') ? 285 : 360;
  // width clamps scale with the height so the aspect range stays the same
  VIEW_W = clamp(Math.round(iw / ih * VIEW_H), Math.round(VIEW_H * 56 / 36), Math.round(VIEW_H * 96 / 36));
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
      else if (World.misty) col = ff > 0.42 ? [78, 84, 74] : [112, 116, 106];
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
  // the scent pool: the true detectable range, live on the map — yellow as
  // it builds, red once anything with teeth is standing inside it
  const sr = scentRange(p);
  if (sr > 0) {
    const hot = G.npcs.some(o => o.hp > 0 && !isFamily(o) &&
      (NPC_DEF[o.species].dmg || 0) > 0 && dist(o.x, o.y, p.x, p.y) < sr);
    c2.strokeStyle = hot ? 'rgba(255,90,70,0.85)' : 'rgba(255,210,62,0.7)';
    c2.fillStyle = hot ? 'rgba(255,90,70,0.10)' : 'rgba(255,210,62,0.07)';
    c2.lineWidth = 1;
    c2.beginPath();
    c2.arc(p.x * sx, p.y * sy, sr * (sx + sy) / 2, 0, Math.PI * 2);
    c2.fill(); c2.stroke();
  }
  const blink = Math.floor(G.time * 3) % 2 === 0;
  c2.fillStyle = blink ? '#ffffff' : '#ffdd88';
  c2.fillRect(p.x * sx - 2, p.y * sy - 2, 4, 4);
  c2.strokeStyle = 'rgba(0,0,0,0.5)';
  c2.strokeRect(p.x * sx - 2.5, p.y * sy - 2.5, 5, 5);
}

// cartoon stink: wavering lines that rise off a lingering player, thicker
// as the pool builds — the close-up half of the minimap ring's warning
function drawScentWisps(ctx, p) {
  const sc = p.scent || 0;
  if (sc < 0.25 || p.hidden) return;
  const a = (sc - 0.25) / 0.75;
  const h = 18 + 30 * p.growth;
  ctx.save();
  ctx.strokeStyle = 'rgba(214, 226, 150, ' + (0.6 * a).toFixed(2) + ')';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const t = G.time * 1.1 + i * 2.3;
    const rise = (G.time * 16 + i * 14) % 40;
    const bx = p.x + (i - 1) * (7 + 8 * p.growth) + Math.sin(t) * 4;
    const by = p.y - h - rise;
    ctx.globalAlpha = 1 - rise / 40;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 6, by - 8, bx, by - 15);
    ctx.quadraticCurveTo(bx - 6, by - 22, bx, by - 29);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- nesting: courtship, eggs, and raising the young ----------
// A full adult gets a full-adult mate of the opposite sex. The male displays
// (an NPC male struts on his own; a player male displays with N and the
// female judges his CONDITION — health, food, hygiene). Accepted pairs nest
// with N: three eggs, guarded until hatch day, then the babies follow the
// female until they're grown — and every one raised pays out ❖ 150.
function updateNesting(dt) {
  const p = G.player, ns = G.nesting;
  if (!G.started || !p || !p.alive || !ns) return;
  const nest = World.nests[p.species];
  // courtship is an F verb like any other (the loop clears the flag)
  const nPressed = G.input.action;

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
      G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'F — Take ' + (cand.gender === 'm' ? 'him' : 'her') + ' as your mate';
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
        if (!G.prompt) G.prompt = 'F — accept his display';
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
      if (!G.prompt) G.prompt = 'F — nest here';
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
        if (!Save.raisedClutch) { Save.raisedClutch = true; syncTitles(); }
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
  // spread over the ZOOMED view — a grown dino's wider world still snows
  const x = G.camX + Math.random() * VIEW_W * (G.zoom || 1);
  const y = G.camY + Math.random() * VIEW_H * (G.zoom || 1);
  const ff = forestShadePx(x, y);
  const nightF = (G.day && G.day.nightF) || 0;
  let type;
  if (World.snowy) type = 'snow';   // on the Wall the air is always falling
  else if (nightF > 0.35 && ff > 0.3) type = Math.random() < 0.75 ? 'firefly' : 'mote';
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
// ---------- blizzards: the Wall's eruption ----------
// A rhythm of storms: the wind rises first (the warning — go find shelter),
// then a whiteout in which resting or a cave is the only way to keep your
// cold bar from running away. And rarely, the storm shakes an AVALANCHE
// loose from the summit: a wall of snow that sweeps DOWN the mountain and
// buries everything that isn't behind stone, on a rock wall, or fast.
// ---------------------------------------------------------------------------
// THE MONSOON — the Sodden Reach's whole personality. Long green calm, then
// the sky closes, the rain arrives, and the channels climb their banks until
// the low ground IS the river. Anything caught in the flood gets dragged and
// battered; the high mud wallows stay put, and so does anything resting in
// one. Survival here is knowing where the nearest wallow is.
// ---------------------------------------------------------------------------
function floodReach(x, y) {
  // how deep the flood is at a point: 0 clear, 1 the middle of the torrent.
  // The water grows outward from the permanent channels as `rise` climbs.
  const M = G.monsoon;
  if (!M || M.rise <= 0) return 0;
  const grow = 160 * M.rise;                    // px the banks push outward
  let best = 0;
  for (const c of (World.channels || [])) {
    const d = dist(x, y, c.x, c.y) - c.r;
    if (d < grow) best = Math.max(best, clamp(1 - d / Math.max(1, grow), 0, 1));
  }
  return best * M.rise;
}
function inWallow(x, y) {
  for (const m of World.mudPools) if (dist(x, y, m.x, m.y) < m.r * 1.05) return true;
  return false;
}
function updateMonsoon(dt) {
  if (!World.monsoonWorld) { G.monsoon = null; return; }
  if (!G.monsoon) G.monsoon = { phase: 'calm', t: 50 + Math.random() * 40, rise: 0, rain: 0, shove: 0 };
  const M = G.monsoon;
  M.t -= dt;
  // the cycle: calm -> the sky darkens -> the storm -> the water drains away
  if (M.phase === 'calm' && M.t <= 0) {
    M.phase = 'building'; M.t = 9;
    G.banner = { str: 'The light goes green. The rain is coming — find a wallow.', t: 5, color: '#9fd6b0' };
  } else if (M.phase === 'building' && M.t <= 0) {
    M.phase = 'storm'; M.t = 26 + Math.random() * 14;
    G.banner = { str: 'MONSOON! The rivers are climbing — get to the mud!', t: 5, color: '#bfe6ff' };
  } else if (M.phase === 'storm' && M.t <= 0) {
    M.phase = 'easing'; M.t = 14;
    G.banner = { str: 'The rain thins. The water starts to fall back.', t: 4, color: '#cfe6d8' };
  } else if (M.phase === 'easing' && M.t <= 0) {
    M.phase = 'calm'; M.t = 70 + Math.random() * 50;
    // the storm has passed and you are still breathing — that earns a name
    if (G.started && G.player && G.player.alive && !Save.stormRider) { Save.stormRider = true; syncTitles(); }
  }
  const wantRain = M.phase === 'storm' ? 1 : M.phase === 'building' ? 0.35 : M.phase === 'easing' ? 0.4 : 0;
  const wantRise = M.phase === 'storm' ? 1 : M.phase === 'easing' ? 0.45 : 0;
  M.rain = lerp(M.rain, wantRain, Math.min(1, dt * 0.5));
  M.rise = lerp(M.rise, wantRise, Math.min(1, dt * 0.25));   // water is slow to come AND to go
  if (M.rise < 0.02) return;

  // --- the flood itself: it drags, it batters, and the wallows are spared ---
  const hit = (e, isPlayer) => {
    if (inWallow(e.x, e.y)) return;                 // the mud holds you
    const f = floodReach(e.x, e.y);
    if (f < 0.25) return;
    const heavy = f > 0.6;
    // shoved downstream — the current always runs with the channel's slope
    const push = (isPlayer ? 26 : 40) * f * dt * 60;
    e.x = clamp(e.x + push * 0.9, 20, WORLD_W - 20);
    e.y = clamp(e.y + Math.sin(e.x * 0.004 + G.time * 0.3) * push * 0.4, 20, WORLD_H - 20);
    if (heavy && Math.random() < dt * (isPlayer ? 0.5 : 0.35)) {
      // rare, and violent: caught by the current proper
      if (isPlayer) {
        dealDamage(e, playerMaxHp() * 0.06, null, { kb: 0 });
        G.shake = Math.min(7, G.shake + 3);
        floatText(e.x, e.y - 40, 'SWEPT!', '#bfe6ff');
      } else {
        dealDamage(e, e.maxhp * 0.14, null, { kb: 0 });
        e.pinT = Math.max(e.pinT || 0, 0.5);        // tumbled, briefly helpless
        e.thrash = 1;
        if (Math.random() < 0.5) floatText(e.x, e.y - 34, 'SWEPT!', '#bfe6ff');
      }
    }
  };
  const p = G.player;
  if (p && p.alive && !G.burrow) hit(p, true);
  for (const e of G.npcs) { if (e.hp > 0 && !DINO[e.species].fish) hit(e, false); }
}

function updateBlizzard(dt) {
  // the Moors have no storms — just a mist that never, ever lifts
  if (World.misty) { G.blizzard = null; G.mist = lerp(G.mist || 0, 0.85, Math.min(1, dt * 0.5)); return; }
  if (!World.snowy) { G.blizzard = null; return; }
  if (!G.blizzard) G.blizzard = { nextT: 45 + Math.random() * 30, warnT: 0, on: false, t: 0, av: null };
  const B = G.blizzard;
  // mist has MOODS: a slow wander on calm days, shoved up hard by weather
  const wander = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(G.time * 0.013 + 2.4)) * (0.5 + 0.5 * Math.sin(G.time * 0.007));
  const target = B.on ? 0.95 : B.warnT > 0 ? 0.6 : wander;
  G.mist = lerp(G.mist || 0, target, Math.min(1, dt * 0.5));
  if (B.on) {
    B.t -= dt;
    if (B.t <= 0) {
      B.on = false;
      B.nextT = 55 + Math.random() * 45;
      G.banner = { str: 'The storm passes. The mountain goes quiet.', t: 4, color: '#cfeefc' };
    }
  } else if (B.warnT > 0) {
    B.warnT -= dt;
    if (B.warnT <= 0) {
      B.on = true;
      B.t = 16 + Math.random() * 10;
      G.banner = { str: 'WHITEOUT! Rest, or get behind stone — the cold has teeth now!', t: 4, color: '#eaf6ff' };
      // one storm in six shakes the summit loose
      if (Math.random() < 0.17 && G.player) {
        B.av = { y: Math.max(60, G.player.y - VIEW_H * 1.6), speed: 250, t: 0 };
        G.banner = { str: 'AVALANCHE! RUN — down the mountain, or behind stone!', t: 5, color: '#ffffff' };
        G.shake = 8;
      }
    }
  } else {
    B.nextT -= dt;
    if (B.nextT <= 0) {
      B.warnT = 10;
      G.banner = { str: 'The wind is rising… find shelter.', t: 4, color: '#a8dcf0' };
    }
  }
  // the avalanche front: a churning band sweeping south, downhill
  if (B.av) {
    const A = B.av;
    A.t += dt; A.y += A.speed * dt;
    G.shake = Math.min(6, G.shake + dt * 6);
    const band = 90;
    const p = G.player;
    // caves and the rock walls themselves are safe — snow pours PAST stone
    if (p && p.alive && Math.abs(p.y - A.y) < band && !caveAt(p.x, p.y) && !isCliffPx(p.x, p.y)) {
      p.hp -= 65 * dt;
      p.vy += 500 * dt;                      // carried down the mountain
      p.vx += (Math.random() - 0.5) * 240 * dt;
      p.cold = Math.min(100, (p.cold || 0) + 10 * dt);
      if (Math.random() < dt * 8) floatText(p.x + rrange(-14, 14), p.y - 40, '❄', '#ffffff');
      if (p.hp <= 0) killPlayer('the avalanche');
    }
    for (const e of G.npcs) {
      if (DINO[e.species].fish) continue;
      if (Math.abs(e.y - A.y) < band && !caveAt(e.x, e.y) && !isCliffPx(e.x, e.y)) {
        e.hp -= 65 * dt;
        e.vy += 420 * dt;
        if (e.hp <= 0) { floatText(e.x, e.y - 26, DINO[e.species].name + ' is buried', '#eaf6ff'); killNPC(e, null); }
      }
    }
    if (A.y > WORLD_H + 200 || A.t > 40) B.av = null;
  }
}
// the frozen giant, asleep in the secret cave: the sleeping Nivalotitan
// (eyes shut, settled) behind a sheet of old blue ice. Before you find it,
// this is the treasure; after, it's the legend still dozing at home.
function drawFrozenGiant(g, cave) {
  // drawn young (still huge) so the ice slab and the cave mouth can frame it
  const o = { x: cave.x, y: cave.y + 34, facing: -1, growth: 0.5, gender: 'm', move: 0, phase: 0, restT: 1 };
  drawShadow(g, o.x, o.y, 34);
  drawDino(g, 'nivalo', o);
  // the ice sheet: a wide translucent slab with cracks and a cold shine,
  // sized to swallow the whole animal — nose, neck, tail and all
  const iw = 240, ih = 205, ix = o.x + 8;
  g.fillStyle = 'rgba(168,204,232,0.42)';
  g.strokeStyle = 'rgba(60,100,140,0.65)';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(ix - iw / 2, o.y - ih + 12, iw, ih, 16);
  g.fill(); g.stroke();
  g.strokeStyle = 'rgba(230,244,255,0.5)';
  g.lineWidth = 1;
  for (let k = 0; k < 6; k++) {
    const hx = ix - iw / 2 + 20 + k * 32, hy = o.y - ih + 34 + (k % 2) * 44;
    g.beginPath();
    g.moveTo(hx, hy);
    g.lineTo(hx + 10, hy + 30);
    g.lineTo(hx + 4, hy + 58);
    g.stroke();
  }
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.ellipse(ix - iw * 0.28, o.y - ih * 0.72, 11, 32, -0.25, 0, TAU);
  g.fill();
}

// the avalanche front, drawn in world space: boiling white lobes + thrown powder
function drawAvalanche(camX, camY) {
  const A = G.blizzard && G.blizzard.av;
  if (!A || A.y < camY - 200 || A.y > camY + VIEW_H + 280) return;
  const zw2 = VIEW_W * (G.zoom || 1);
  const g = ctx.createLinearGradient(0, A.y - 110, 0, A.y + 60);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(244,250,255,0.88)');
  g.addColorStop(1, 'rgba(222,236,248,0.96)');
  ctx.fillStyle = g;
  ctx.fillRect(camX - 20, A.y - 110, zw2 + 40, 170);
  for (let x = camX - 40; x < camX + zw2 + 40; x += 30) {
    const h = hash2(Math.round(x * 0.6), 7);
    const r = 18 + h * 24 + Math.sin(G.time * 7 + x * 0.13) * 5;
    ctx.fillStyle = h > 0.5 ? '#ffffff' : '#e8f2fa';
    ctx.beginPath(); ctx.arc(x, A.y + 42 - r * 0.4, r, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let k = 0; k < 30; k++) {
    const h1 = hash2(k * 13, Math.round(G.time * 5) % 97);
    const h2 = hash2(k * 7 + 1, Math.round(G.time * 4) % 89);
    ctx.fillRect(camX + h1 * zw2, A.y + 26 - h2 * 150, 2.4, 2.4);
  }
}
// the mist, drawn in screen space: drifting banks under a flat veil.
// Some days you see the whole ridge; some days shapes loom out of nothing.
// the storm on screen: a green-dark gloom, slanting rain, and the swollen
// water drawn as a translucent skin creeping out from every channel
function drawMonsoon() {
  const M = G.monsoon;
  if (!M || (M.rain < 0.01 && M.rise < 0.01)) return;
  const vw = VIEW_W * G.zoom, vh = VIEW_H * G.zoom;
  // the risen water, in world space (drawn under the rain, over the ground).
  // All the channel blobs go into ONE path filled ONCE — filling each blob
  // separately stacks translucency wherever they overlap (which is
  // everywhere) and the river turns into blotchy fog instead of water.
  if (M.rise > 0.02) {
    const flood = (shrink) => {
      ctx.beginPath();
      for (const c of (World.channels || [])) {
        const r = c.r + 160 * M.rise - shrink;
        if (r <= 0) continue;
        if (c.x < G.camX - r - 40 || c.x > G.camX + vw + r + 40 ||
            c.y < G.camY - r - 40 || c.y > G.camY + vh + r + 40) continue;
        ctx.moveTo(c.x - G.camX + r, c.y - G.camY);
        ctx.arc(c.x - G.camX, c.y - G.camY, r, 0, TAU);
      }
      ctx.fill();
    };
    ctx.save();
    ctx.globalAlpha = 0.42 * M.rise;
    ctx.fillStyle = '#3f6570';
    flood(0);                       // the water sheet, one even body
    ctx.globalAlpha = 0.3 * M.rise;
    ctx.fillStyle = '#35545e';
    flood(70);                      // the deeper heart of the torrent
    ctx.restore();
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const W = canvas.width, H = canvas.height;
  // the light goes out — a heavy green-grey lid over everything
  if (M.rain > 0.01) {
    ctx.fillStyle = 'rgba(28,44,38,' + (0.34 * M.rain).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  // rain: fast slanted streaks, seeded off world time so it never repeats
  if (M.rain > 0.05) {
    const n = Math.floor(340 * M.rain);
    ctx.strokeStyle = 'rgba(200,226,236,' + (0.4 * M.rain).toFixed(3) + ')';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const sx = (hash2(i, 3) * W + G.time * 240 * (0.6 + hash2(i, 9) * 0.7)) % (W + 60) - 30;
      const sy = (hash2(i, 5) * H + G.time * 900 * (0.7 + hash2(i, 11) * 0.6)) % (H + 80) - 40;
      const len = 14 + hash2(i, 13) * 16;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - len * 0.28, sy + len);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawMist() {
  if (!(World.snowy || World.misty) || !G.mist) return;
  const m = G.mist;
  // moor mist is grey-green and heavier; Wall mist is blue-white snowlight
  const MC = World.misty ? '196,200,190' : '232,240,248';
  for (let i = 0; i < 3; i++) {
    const t = G.time * (5 + i * 2.4);
    const fx = ((t + i * 340) % (VIEW_W + 360)) - 180;
    const fy = VIEW_H * (0.2 + 0.28 * i) + Math.sin(G.time * 0.11 + i * 2) * 26;
    const g = ctx.createRadialGradient(fx, fy, 20, fx, fy, 230);
    g.addColorStop(0, 'rgba(' + MC + ',' + (0.16 * m).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + MC + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(fx - 240, fy - 240, 480, 480);
  }
  ctx.fillStyle = 'rgba(' + MC + ',' + ((World.misty ? 0.16 : 0.3) * m).toFixed(3) + ')';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // the Moors' signature: mist LINGERS AT THE EDGE of the screen — a heavy
  // ring closing in, so the world you can trust is only the middle of it
  if (World.misty) {
    const g2 = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, Math.min(VIEW_W, VIEW_H) * 0.3,
      VIEW_W / 2, VIEW_H / 2, Math.max(VIEW_W, VIEW_H) * 0.62);
    g2.addColorStop(0, 'rgba(' + MC + ',0)');
    g2.addColorStop(0.7, 'rgba(' + MC + ',' + (0.42 * m).toFixed(3) + ')');
    g2.addColorStop(1, 'rgba(' + MC + ',' + (0.85 * m).toFixed(3) + ')');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function updateAmbient(dt) {
  // snow needs a denser sky — and a blizzard needs a FULL one
  const want = World.snowy ? (G.blizzard && G.blizzard.on ? 90 : 40) : 22;
  while (G.ambient.length < want) spawnAmbient();
  const storm = G.blizzard && G.blizzard.on;
  for (let i = G.ambient.length - 1; i >= 0; i--) {
    const a = G.ambient[i];
    a.t += dt;
    if (a.type === 'snow') {
      // calm: a lazy drift down. Storm: everything flies SIDEWAYS.
      a.x += (Math.sin(a.t * 1.4 + a.ph) * 9 + (storm ? 240 : 8)) * dt;
      a.y += (26 + a.hue * 14 + (storm ? 30 : 0)) * dt;
    } else if (a.type === 'leaf') {
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
    const zA = G.zoom || 1;
    const off = a.x < G.camX - 40 || a.x > G.camX + VIEW_W * zA + 40 || a.y < G.camY - 40 || a.y > G.camY + VIEW_H * zA + 40;
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
    } else if (a.type === 'snow') {
      ctx.globalAlpha = (0.55 + a.hue * 0.4) * fade;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(a.x, a.y, 0.9 + a.hue * 1.1, 0, TAU); ctx.fill();
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
    if (wx < camX - 330 || wx > camX + VIEW_W * (G.zoom || 1) + 330 || wy < camY - 200 || wy > camY + VIEW_H * (G.zoom || 1) + 200) continue;
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

  if (simTick(dt)) {
    // the burrow owned this step — render the den (or the world, if the
    // burrow was exited mid-step) and skip the surface-only frame work
    if (G.burrow) renderBurrow(); else render();
    updateHUD();
    return;
  }
  updateAmbient(dt);
  autosaveT += dt;
  if (autosaveT > 10) { autosaveT = 0; saveDinoSnapshot(); }

  // camera — with the GROW-ZOOM: the view very slowly pulls back as your
  // dino grows (bigger species pull back further), so a hatchling lives in
  // a close little world and an adult surveys a wide one
  const p = G.player;
  const zTarget = growZoom(p.species, p.growth);
  G.zoom += (zTarget - G.zoom) * Math.min(1, dt * 0.4);
  const zvw = VIEW_W * G.zoom, zvh = VIEW_H * G.zoom;
  G.camX = clamp(p.x - zvw / 2, 0, WORLD_W - zvw);
  // the head is sacred: if a tall dino's skull would leave the top of the
  // frame, the whole view slides up until it fits (feet have far more
  // spare room below than the head needs above)
  G.camY = clamp(Math.min(p.y - zvh / 2 - 14, headTopY(p) - 16), 0, WORLD_H - zvh);

  render();
  updateHUD();
}
requestAnimationFrame(loop);

// one fixed step of the simulation — shared by loop() and the dev stepper so
// the two can never drift apart. Returns true when the burrow owned the step
// (the caller then skips the surface-only frame work and renders the den).
function simTick(dt) {
  G.time += dt;
  // underground, the burrow owns the whole frame — the world above waits
  if (G.burrow) { updateBurrow(dt); updateWorldStuff(dt); decayFx(dt); return true; }
  updatePlayer(dt);
  // just slipped underground THIS frame: the world halts right here — no NPC
  // update may touch the pack at its burrow-local coordinates
  if (G.burrow) { updateWorldStuff(dt); decayFx(dt); return true; }
  for (const e of G.npcs) updateNPC(e, dt);
  updateWorldStuff(dt);
  updateEruption(dt);
  updateBlizzard(dt);
  updateMonsoon(dt);
  updateNesting(dt);
  // the lobby-leave countdown runs on WORLD time: dying cancels it, and the
  // banner keeps the player honest about how long they must survive
  if (G.lobbyCountdown != null) {
    if (!G.player || !G.player.alive) { G.lobbyCountdown = null; }
    else {
      G.lobbyCountdown -= dt;
      if (G.lobbyCountdown <= 0) exitToLobby(true);   // clears the countdown itself
      else G.banner = { str: '⌂ Leaving for the lobby in ' + Math.ceil(G.lobbyCountdown) + '…', t: 0.4, color: '#ffe9a0' };
    }
  }
  // population upkeep is simulation, not rendering — it must tick under
  // window.step too, or headless runs never regenerate or scale the packs
  popT += dt;
  if (popT > 10) { popT = 0; maintainPopulation(); updatePackScale(); }
  G.input.action = false;   // F is read by the player, the den AND the courtship
  G.input.claw = false; G.input.dig = false;
  decayFx(dt);
  return false;
}
function decayFx(dt) {
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  G.shake = Math.max(0, G.shake - dt * 14);
}

// ---------- deterministic dev stepper (console: step(120)) ----------
// rAF suspends whenever the pane loses the thread, so scripted tests can't
// rely on wall-clock frames — step(n) advances the simulation n fixed 1/60s
// frames synchronously instead. hold=true skips the final render for speed.
window.step = function (n, hold) {
  for (let i = 0; i < (n || 1); i++) {
    if (!G.started || !G.player) break;
    simTick(1 / 60);
  }
  if (!hold) { if (G.burrow) renderBurrow(); else render(); updateHUD(); }
};

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
  draws.push({ y: p.y, fn: () => { drawShadow(ctx, p.x, p.y, (8 + 14 * p.growth) * genderMod(p).size); drawDino(ctx, p.species, p); drawScentWisps(ctx, p); } });
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
// ---------- THE SPECIMEN HALL (secret: type "bones") ----------
// Every species in the registry on one scrollable field, drawn by the real
// drawDino and overlaid by the REAL hit geometry (drawEntityHitboxes — the
// same objects combat tests). The pose controls exist to torture the
// geometry: pitch sway proves the circles lean with the art.
const Spec = { open: false, t: 0, raf: 0 };
function toggleSpecimenHall() {
  Spec.open = !Spec.open;
  document.getElementById('specimen').classList.toggle('hidden', !Spec.open);
  if (Spec.open && !Spec.wired) {
    Spec.wired = true;
    document.getElementById('spec-close').addEventListener('click', toggleSpecimenHall);
  }
  if (Spec.open) specimenFrame(); else cancelAnimationFrame(Spec.raf);
}
function specimenFrame() {
  Spec.raf = requestAnimationFrame(specimenFrame);
  Spec.t += 1 / 60;
  if (!G.started) G.time += 1 / 60;   // the lobby clock is frozen; breathe anyway
  const cv = document.getElementById('spec-canvas');
  const wrap = document.getElementById('spec-scroll');
  const keys = Object.keys(DINO);
  const COLS = Math.max(3, Math.floor((wrap.clientWidth || 1200) / 190));
  const CW = Math.floor((wrap.clientWidth || 1200) / COLS), CH = 170;
  const rows = Math.ceil(keys.length / COLS);
  if (cv.width !== CW * COLS || cv.height !== rows * CH) { cv.width = CW * COLS; cv.height = rows * CH; }
  const g = cv.getContext('2d');
  g.fillStyle = '#141a16';
  g.fillRect(0, 0, cv.width, cv.height);
  const growth = parseFloat(document.getElementById('spec-growth').value);
  const pose = document.getElementById('spec-pose').value;
  const flip = document.getElementById('spec-flip').checked;
  keys.forEach((sp, i) => {
    const d = DINO[sp];
    const col = i % COLS, row = (i / COLS) | 0;
    const cx = col * CW + CW / 2, cy = row * CH + CH - 42;
    // one fake specimen, posed by the controls — same fields the game uses
    const ent = {
      species: sp, x: 0, y: 0, growth,
      facing: flip && Math.sin(Spec.t * 0.35 + i * 1.7) < 0 ? -1 : 1,
      move: pose === 'walk' ? 1 : pose === 'run' ? 1 : 0,
      run: pose === 'run' ? 1 : 0,
      phase: (pose === 'walk' || pose === 'run') ? Spec.t * (pose === 'run' ? 11 : 6) : 0,
      pitch: pose === 'pitch' ? Math.sin(Spec.t * 0.9 + i) * 0.45 : 0,
      hurtT: 0, attackT: 0, headDown: 0,
    };
    // fit the cell: shrink giants, never inflate the tiny
    const span = (d.L.body[0] + d.L.tail[0] + d.L.neckLen + d.L.head[0]) * d.scale * sizeScale(growth);
    const k = Math.min(1, (CW - 26) / (span * 1.35), (CH - 50) / ((d.L.leg[0] + d.L.body[1] + d.L.neckLen * Math.abs(Math.sin(d.L.neckAng)) + 24) * d.scale * sizeScale(growth) * 1.5));
    g.save();
    g.translate(cx, cy);
    g.scale(k, k);
    // the ground line the anchor stands on
    g.strokeStyle = 'rgba(160,170,150,0.25)';
    g.beginPath(); g.moveTo(-CW / 2 / k, 0); g.lineTo(CW / 2 / k, 0); g.stroke();
    drawDino(g, sp, ent);
    drawEntityHitboxes(g, ent);
    g.restore();
    g.fillStyle = '#cdbb92';
    g.font = '10px monospace';
    g.textAlign = 'center';
    g.fillText(d.name + (d.fish ? ' (fish)' : ''), cx, row * CH + CH - 19);
    // the power readout: the food chain at a glance, at this slider growth —
    // same powerFromStats the AI runs on, so the number here can never lie
    // (decorative species carry no def and get no number)
    const pdef = NPC_DEF[sp] || PLAYER_DEF[sp];
    if (pdef && pdef.hp) {
      const pw = powerFromStats(pdef.hp * hpFrac(growth), (pdef.dmg || 0) * dmgFrac(growth));
      g.fillStyle = '#8fae8a';
      g.font = '9px monospace';
      g.fillText('pwr ' + Math.round(pw), cx, row * CH + CH - 8);
    }
    g.textAlign = 'left';
  });
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
  } else if (d.clawWeapon) {
    const wc = weaponCircle(e);
    dbgCircle(g, wc.x, wc.y, wc.r, '#ff5040');
  } else {
    // biters: the full strike arc, jaw-line down to shin-line — exactly the
    // circles every bite tests
    for (const wc of biteZones(e)) dbgCircle(g, wc.x, wc.y, wc.r, '#ff5040');
    if (e.isPlayer && (d.armAndJaw || d.clawSecond)) {
      const cc = clawArcCircle(e);
      dbgCircle(g, cc.x, cc.y, cc.r, '#ff5040');
    }
  }
  if (def.nip) {
    const nc = nipCircle(e);
    dbgCircle(g, nc.x, nc.y, nc.r, '#ffb03e');
  }
  // mid-pounce (and through the landing grace) the flying-body pin rides
  // along under the dino — the same object pounceStrike tests every step
  if (e.isPlayer && ((e.pounce && e.pounce.phase === 'jump') || e.pounceGrace)) {
    const pz = pounceLandZone(e);
    dbgCircle(g, pz.x, pz.y, pz.r, '#ff5040');
  }
  // the giant's footprint — exactly the circle trample tests
  if (e.isPlayer && def.trample) {
    const tz = trampleZone(e);
    dbgCircle(g, tz.x, tz.y, tz.r, '#ff5040');
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
  // grow-zoom: the world pass renders at RS/zoom, so a grown dino's camera
  // sees MORE world in the same canvas (screen-space overlays keep plain RS)
  const Z = G.zoom || 1;
  const zw = VIEW_W * Z, zh = VIEW_H * Z;
  ctx.setTransform(G.RS / Z, 0, 0, G.RS / Z, 0, 0);
  ctx.imageSmoothingEnabled = true; // soft painted ground under crisp vectors
  ctx.save();
  // fractional camera: subpixel scrolling keeps diagonal movement judder-free
  ctx.translate(-camX, -camY);

  // ground
  drawGroundChunks(ctx, camX, camY, zw, zh);
  drawWaterShimmer(ctx, camX, camY, zw, zh);
  drawShoreFoam(ctx, camX, camY, zw, zh);

  // collect depth-sorted drawables in view
  const pad = 90;
  const x0 = camX - pad, x1 = camX + zw + pad;
  const y0 = camY - pad, y1 = camY + zh + pad * 1.6;
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
  // THE FROZEN GIANT: Nivalotitan sleeps in the secret cave, sealed in ice —
  // visible to whoever finds the way in (and still dozing there afterwards)
  for (const cv2 of World.caves || []) {
    if (cv2.secret && cv2.x > x0 && cv2.x < x1 && cv2.y > y0 && cv2.y < y1) {
      draws.push({ y: cv2.y + 30, fn: () => drawFrozenGiant(ctx, cv2) });
    }
  }
  for (const c of G.carcasses) if (c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1) draws.push({ y: c.y, fn: () => drawCarcass(ctx, c) });
  for (const e of G.npcs) {
    if (e.x > x0 && e.x < x1 && e.y > y0 && e.y < y1) {
      draws.push({
        y: e.y, fn: () => {
          // a submerged croc is only a shadow under the surface — no hp bar,
          // no outline, just a dark shape and two eyes
          if (e.submerged && isWaterPx(e.x, e.y)) { drawCrocShadow(ctx, e); return; }
          // THE MOORS: anything past arm's length is a SILHOUETTE —
          // darkened to a shape in the grey, drawn at its true size
          const far = World.misty ? clamp((dist(e.x, e.y, p.x, p.y) - 150) / 130, 0, 1) : 0;
          if (far > 0.01) {
            ctx.save();
            ctx.filter = 'brightness(' + (1 - 0.72 * far).toFixed(2) + ') saturate(' + (1 - 0.85 * far).toFixed(2) + ')';
            drawDino(ctx, e.species, e);
            ctx.filter = 'none';
            ctx.restore();
            return;   // no shadow, no hp bar — just the shape in the grey
          }
          drawShadow(ctx, e.x, e.y, bodyRadius(e) * 1.4);
          drawDino(ctx, e.species, e);
          if (e.hurtT > 0 || e.hp < e.maxhp * 0.999 && dist(e.x, e.y, p.x, p.y) < 130) drawHpBar(e);
        }
      });
    }
  }
  // simosuchus' own burrow: mound behind, and drawn OVER the hidden digger
  // (y + 2) so only the backside shows sticking out of the earth
  if (G.myBurrow && G.myBurrow.x > x0 && G.myBurrow.x < x1 && G.myBurrow.y > y0 && G.myBurrow.y < y1) {
    draws.push({ y: G.myBurrow.y + 2, fn: () => drawMyBurrow(ctx, G.myBurrow, p) });
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
  // the avalanche front rolls over everything it buries
  drawAvalanche(camX, camY);
  // airborne ambient life (leaves, motes, butterflies, fireflies, snow)
  drawAmbient();

  ctx.restore();
  // back to SCREEN scale: overlays below cover the canvas's VIEW_W×VIEW_H
  // logical size regardless of how far the world pass was zoomed out
  ctx.setTransform(G.RS, 0, 0, G.RS, 0, 0);

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
  drawMist();
  drawMonsoon();
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
const elCold = document.getElementById('fill-cold');
const elColdRow = document.getElementById('row-cold');
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
  // the cold bar exists only where the cold does — FULL is the danger side
  elColdRow.style.display = World.snowy ? 'flex' : 'none';
  if (World.snowy) {
    elCold.style.width = clamp(p.cold || 0, 0, 100) + '%';
    elCold.classList.toggle('low', (p.cold || 0) > 75);   // 'low' = the flash class: here it means NEARLY FROZEN
  }
  const dirty = p.growth < 1 && p.hygiene <= 60;
  elStage.textContent = (p.gender === 'm' ? '♂ ' : '♀ ') + stageOf(p.growth)
    + (p.bleed ? '  ✚ BLEEDING' : '') + (p.frozenT > 0 ? '  ❄ FROZEN' : World.snowy && p.cold > 75 ? '  ❄ FREEZING' : '')
    + (dirty ? '  ~ TOO DIRTY TO GROW' : '');
  elStage.style.color = p.frozenT > 0 || (World.snowy && p.cold > 75) ? '#a8dcf0' : p.bleed ? '#ff6a5e' : dirty ? '#c9a45a' : '#f5e9c8';
  elGrow.classList.toggle('stalled', dirty);
  elGrow.style.width = (p.growth * 100) + '%';
  elPct.textContent = Math.floor(p.growth * 100) + '%';
  const elGr = document.getElementById('growthscount');
  const grLabel = '❖ ' + Save.growths + (Profiles.current ? ' · ' + Profiles.current : '');
  if (elGr && elGr._v !== grLabel) { elGr._v = grLabel; elGr.textContent = grLabel; }
  // the prompt bar is the ONLY place a player learns what E and F do here, so
  // each offer becomes its own chip with the key drawn as a keycap. (Plain
  // text collapsed the wide-space separator and ran the offers together:
  // "E — Drink F — Go fishing" read as one unparseable line.)
  if (elPrompt._v !== G.prompt) {
    elPrompt._v = G.prompt;
    elPrompt.innerHTML = '';
    for (const seg of (G.prompt || '').split(/\s{3,}/)) {
      if (!seg) continue;
      const mk = seg.match(/^([A-Z0-9])\s*—\s*(.+)$/);
      const chip = document.createElement('span');
      chip.className = 'pchip';
      if (mk) {
        const cap = document.createElement('b');
        cap.className = 'pkey';
        cap.textContent = mk[1];
        chip.appendChild(cap);
        chip.appendChild(document.createTextNode(mk[2]));
      } else {
        chip.className = 'pchip note';
        chip.textContent = seg;
      }
      elPrompt.appendChild(chip);
    }
  }
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
