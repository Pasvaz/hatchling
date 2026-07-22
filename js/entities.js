'use strict';
// ---------- entities: player, NPC AI, combat, carcasses, particles ----------

const PLAYER_DEF = {
  raja: { hp: 1000, dmg: 130, speed: 112, sprint: 1.75, reach: 30, atkCd: 0.6, diet: 'carn', bleedBite: true, stamMax: 100, eco: 'valley', cost: 0 },
  // camptosaurus gets double stamina — endurance is its escape plan
  // (and it earns extra growths, because hard mode should pay)
  campto: { hp: 1100, dmg: 70, speed: 118, sprint: 1.8, reach: 26, atkCd: 0.7, diet: 'herb', bleedBite: false, stamMax: 200, eco: 'valley', cost: 0, earnMul: 1.4 },
  // --- Skull Prairie playables (bought with growths) ---
  // the swamp swimmer: crosses deep water no one else can, lives on gar
  ichthyo: { hp: 950, dmg: 105, speed: 110, sprint: 1.7, reach: 30, atkCd: 0.6, diet: 'carn', bleedBite: false, stamMax: 130, eco: 'prairie', cost: 10, swim: true },
  // grows slowly, but a full adult is the fastest, toughest thing on the prairie
  qianzho: { hp: 1250, dmg: 125, speed: 130, sprint: 1.85, reach: 32, atkCd: 0.55, diet: 'carn', bleedBite: true, stamMax: 110, eco: 'prairie', cost: 150, growthRate: 0.7, slowStart: true },
  // grows fast, earns fast, and its armour shrugs off bleeding
  scutello: { hp: 850, dmg: 60, speed: 108, sprint: 1.75, reach: 24, atkCd: 0.7, diet: 'herb', bleedBite: false, stamMax: 150, eco: 'prairie', cost: 200, growthRate: 1.35, earnMul: 1.7, bleedResist: 0.45 },
  // --- Coastal Scrubs playables (req: that species must reach Full Adult first) ---
  // the herd-hunter: fast and strong, built to run down ugrunaaluk
  metria: { hp: 1150, dmg: 135, speed: 126, sprint: 1.8, reach: 32, atkCd: 0.55, diet: 'carn', bleedBite: true, stamMax: 120, eco: 'coast', cost: 150, req: 'qianzho' },
  // a walking fortress that fights backwards: no bite at all, only the tail.
  // Slow, huge, and hits like a falling tree
  giganto: { hp: 1750, dmg: 160, speed: 80, sprint: 1.45, reach: 46, atkCd: 1.5, diet: 'herb', bleedBite: false, stamMax: 140, eco: 'coast', cost: 225, req: 'scutello' },
  // the shoreline tank: slow, deep-swimming heavyweight — and far too strong
  // for the crocodile to hold (thrashMul doubles every SPACE in its jaws)
  crista: { hp: 1500, dmg: 145, speed: 95, sprint: 1.5, reach: 34, atkCd: 0.9, diet: 'carn', bleedBite: false, stamMax: 140, eco: 'coast', cost: 275, req: 'ichthyo', swim: true, thrashMul: 2, fisher: true },
  // --- Ashfall Ridge playables ---
  // glass cannon: nothing on the ridge outruns you, and nothing forgives you
  linhe: { hp: 800, dmg: 95, speed: 142, sprint: 1.95, reach: 26, atkCd: 0.45, diet: 'carn', bleedBite: false, stamMax: 150, eco: 'ash', cost: 250, req: 'metria' },
  // the herbivore that hunts back: scythe-claw swipes that leave bleeding wounds
  nothro: { hp: 1600, dmg: 140, speed: 88, sprint: 1.5, reach: 40, atkCd: 1.1, diet: 'herb', bleedBite: true, stamMax: 130, eco: 'ash', cost: 300, req: 'giganto' },
  // --- Lertentous Delta playables ---
  // the cheap tank: grows slowly, but a grown centrosaurus argues with anything
  // small, weak, and it LOOKS like a dumb pick — until you press P and the
  // jungle starts moving with you (packs, burrow raids, the works)
  aardi: { hp: 380, dmg: 45, speed: 152, sprint: 1.9, reach: 22, atkCd: 0.45, diet: 'carn', bleedBite: false, stamMax: 160, eco: 'delta', cost: 25, growthRate: 1.3 },
  centro: { hp: 1400, dmg: 100, speed: 95, sprint: 1.6, reach: 32, atkCd: 1.0, diet: 'herb', bleedBite: false, stamMax: 140, eco: 'delta', cost: 50, growthRate: 0.7 },
  // fast, strong, cheap: the delta's working raptor
  omni: { hp: 1050, dmg: 120, speed: 138, sprint: 1.9, reach: 28, atkCd: 0.5, diet: 'carn', bleedBite: true, stamMax: 140, eco: 'delta', cost: 75 },
  // tough and hardy: shrugs off wounds, swings a real hadrosaur tail
  eotrach: { hp: 1500, dmg: 90, speed: 105, sprint: 1.7, reach: 36, atkCd: 1.2, diet: 'herb', bleedBite: false, stamMax: 170, eco: 'delta', cost: 150, bleedResist: 0.5, earnMul: 1.2 },
  // centrosaurus with the horns of a trickster god — bigger, meaner, cooler
  loki: { hp: 1600, dmg: 125, speed: 100, sprint: 1.65, reach: 34, atkCd: 0.95, diet: 'herb', bleedBite: false, stamMax: 150, eco: 'delta', cost: 350, req: 'centro', growthRate: 0.8 },
  // the sauropod: agonizingly slow to grow — and then almost nothing dares.
  // Almost. Lourinhanosaurus dares.
  moro: { hp: 2600, dmg: 180, speed: 78, sprint: 1.4, reach: 50, atkCd: 1.6, diet: 'herb', bleedBite: false, stamMax: 160, eco: 'delta', cost: 400, req: 'eotrach', growthRate: 0.55 },
  // the undisputed apex — at adult. Getting there is the whole game.
  // Sluggish brute on land, agile beast in the water: swims fastest of all,
  // and Wet Wrath makes it hit 1.2× harder while standing in it
  spino: { hp: 2200, dmg: 210, speed: 96, sprint: 1.6, reach: 38, atkCd: 0.9, diet: 'carn', bleedBite: true, stamMax: 150, eco: 'delta', cost: 500, req: 'crista', growthRate: 0.6, swim: true, swimMul: 1.35, thrashMul: 2.5, wetWrath: true, fisher: true, wrestler: true },
  // spino's opposite number: the LAND apex. Every bite is a wound that keeps
  // working (bleedMul) — hit, fall back, let the blood do the rest
  tyranno: { hp: 2000, dmg: 185, speed: 118, sprint: 1.7, reach: 36, atkCd: 0.8, diet: 'carn', bleedBite: true, bleedMul: 1.8, stamMax: 150, eco: 'delta', cost: 500, req: 'omni', growthRate: 0.7, wrestler: true },
  // ---- THE NIVALOTITAN WALL ----
  // the mountain's first citizen: an ancient shaggy therizinosaur whose
  // scythe claws double as ice-picks — it CLIMBS the maze walls, and its
  // claw swipes open bleeding wounds. Thick coat: the cold bites it slower.
  eshano: { hp: 1300, dmg: 130, speed: 112, sprint: 1.7, reach: 34, atkCd: 0.9, diet: 'herb', bleedBite: true, stamMax: 160, eco: 'wall', cost: 500, req: 'omni', growthRate: 1.0, climb: true, coldResist: 0.55, earnMul: 1.2 },
  // the cheap way onto the mountain: small, quick, thin-coated — but its
  // HATCHLINGS can climb the maze walls. Grow up and the gift is gone.
  jianchang: { hp: 800, dmg: 95, speed: 128, sprint: 1.8, reach: 28, atkCd: 0.7, diet: 'herb', bleedBite: true, stamMax: 150, eco: 'wall', cost: 250, growthRate: 1.2, babyClimb: true, coldResist: 0.35, earnMul: 1.3 },
  // THE FROZEN GIANT: not for sale at any price — it joins you only if you
  // find its cave. The biggest animal in the game; the mountain bears its name
  nivalo: { hp: 3400, dmg: 200, speed: 70, sprint: 1.35, reach: 52, atkCd: 1.8, diet: 'herb', bleedBite: false, stamMax: 190, eco: 'wall', cost: 0, secret: true, growthRate: 0.5, coldResist: 0.85, earnMul: 1.4, trample: true },
  // play the KING: the polar tyrant itself — thick-coated, bleed-biting,
  // and strong enough to wrestle anything on the mountain
  nanuq: { hp: 2100, dmg: 180, speed: 118, sprint: 1.65, reach: 36, atkCd: 0.9, diet: 'carn', bleedBite: true, stamMax: 160, eco: 'wall', cost: 550, req: 'eshano', growthRate: 0.75, coldResist: 0.7, wrestler: true },
};

const NPC_DEF = {
  // turn = steering rate (rad/s): fast runners corner wide, so jukes can shake them
  // fears = [[species, radius]…] checked every think; fearless = immune to pack rout
  guanlong: { hp: 130, dmg: 26, atkCd: 0.9, speed: 148, detect: 230, homeR: 280, reach: 22, biome: 'forest', turn: 4.2, patience: 6.5, fears: [['moros', 170], ['huayango', 135]] },
  moros: { hp: 360, dmg: 70, atkCd: 1.1, speed: 200, detect: 300, homeR: 560, reach: 26, biome: 'plains', turn: 2.3, fears: [['huayango', 125]], hunts: ['guanlong'] },
  ornitho: { hp: 150, dmg: 0, atkCd: 0, speed: 232, detect: 260, homeR: 420, reach: 0, biome: 'plains', turn: 3.6 },
  scelido: { hp: 520, dmg: 85, atkCd: 1.7, speed: 82, fleeSpeed: 118, detect: 170, homeR: 240, reach: 30, biome: 'any', turn: 2.4, bleedable: true },
  huayango: { hp: 1500, dmg: 110, atkCd: 2.1, speed: 55, detect: 95, homeR: 160, reach: 42, biome: 'forest', turn: 1.6, fearless: true, tank: true, bleedable: true, melee: { bleed: { dps: 7, dur: 8 }, kb: 160 } },
  // --- Skull Prairie ---
  troodon: { hp: 150, dmg: 30, atkCd: 0.85, speed: 156, detect: 240, homeR: 300, reach: 22, biome: 'forest', turn: 4.5, patience: 6.5, fears: [['eotyrannus', 170], ['grunos', 150], ['kosmo', 120]] },
  eotyrannus: { hp: 430, dmg: 82, atkCd: 1.1, speed: 208, detect: 310, homeR: 600, reach: 28, biome: 'plains', turn: 2.2, fears: [['kosmo', 130]], hunts: ['troodon'] },
  grunos: { hp: 780, dmg: 100, atkCd: 1.3, speed: 118, detect: 260, homeR: 520, reach: 30, biome: 'plains', turn: 2.6, fearless: true, hunts: ['archeo', 'leaellyna', 'troodon'] },
  archeo: { hp: 120, dmg: 0, atkCd: 0, speed: 215, detect: 250, homeR: 400, reach: 0, biome: 'plains', turn: 3.8 },
  leaellyna: { hp: 110, dmg: 0, atkCd: 0, speed: 195, detect: 240, homeR: 350, reach: 0, biome: 'plains', turn: 3.9 },
  kosmo: { hp: 950, dmg: 125, atkCd: 1.9, speed: 72, detect: 160, homeR: 260, reach: 36, biome: 'plains', turn: 1.8, fearless: true, tank: true, bleedable: true, melee: { kb: 210 } },
  lepisosteus: { hp: 60, dmg: 0, atkCd: 0, speed: 95, detect: 110, homeR: 220, reach: 0, biome: 'water', turn: 5, aquatic: true },
  // --- Coastal Scrubs ---
  // the shadow off the beach: ambushes anything at the waterline, grabs the
  // player (smash SPACE!), and drags failures under. amphibious = may beach
  // itself briefly mid-strike without the fish position-revert snapping it back
  megoro: { hp: 900, dmg: 95, atkCd: 2.5, speed: 62, detect: 240, homeR: 420, reach: 30, biome: 'sea', turn: 2.2, fearless: true, aquatic: true, amphibious: true },
  // herd hadrosaur: metria's staple prey, but the herd swings back — hard
  ugru: { hp: 620, dmg: 95, atkCd: 1.6, speed: 105, fleeSpeed: 142, detect: 210, homeR: 340, reach: 34, biome: 'plains', turn: 2.2, bleedable: true, melee: { kb: 200 } },
  // the coast's true king: too big for crocodiles, flattens almost anything
  charono: { hp: 2400, dmg: 160, atkCd: 2.0, speed: 62, detect: 150, homeR: 300, reach: 46, biome: 'beach', turn: 1.5, fearless: true, tank: true, bleedable: true, melee: { kb: 260 } },
  // ornithomimid that kicks back when cornered, and takes a real beating
  archaomim: { hp: 260, dmg: 45, atkCd: 1.2, speed: 218, detect: 260, homeR: 420, reach: 24, biome: 'plains', turn: 3.4, melee: { kb: 260 } },
  // the azure raider: hesperaptor fills guanlong's niche around the mud grove
  hesper: { hp: 150, dmg: 28, atkCd: 0.9, speed: 150, detect: 235, homeR: 290, reach: 22, biome: 'forest', turn: 4.3, patience: 6.5, fears: [['concav', 160], ['charono', 130]] },
  // pack-brave claw hunter: swims deep water, and a pack never routs
  concav: { hp: 560, dmg: 88, atkCd: 1.0, speed: 165, detect: 280, homeR: 480, reach: 30, biome: 'plains', turn: 2.5, swims: true, packCourage: true, hunts: ['archaomim', 'ugru'] },
  // the lake's bass: harmless, quick, and tanky for its size
  bassb: { hp: 220, dmg: 0, atkCd: 0, speed: 150, detect: 130, homeR: 260, reach: 0, biome: 'lake', turn: 5.5, aquatic: true },
  // the coelacanth that rules the surf: slow, huge, and its tail slap hurts.
  // Too big to fear anything — the croc leaves it be
  herrie: { hp: 750, dmg: 70, atkCd: 1.6, speed: 55, detect: 120, homeR: 200, reach: 30, biome: 'sea', turn: 2.5, aquatic: true, fearless: true, tank: true, bleedable: true, melee: { kb: 220 } },
  // little armored basker: head hits glance off its skull-shield — aim for the tail
  scutelich: { hp: 130, dmg: 0, atkCd: 0, speed: 165, detect: 150, homeR: 300, reach: 0, biome: 'sea', turn: 5, aquatic: true, headArmor: 0.4 },
  // --- Ashfall Ridge ---
  // the apex of the ash: hunts nearly everything, up to and including near-adults
  tarbo: { hp: 2000, dmg: 170, atkCd: 1.4, speed: 122, detect: 330, homeR: 700, reach: 36, biome: 'plains', turn: 1.9, fearless: true, bleedable: true, hunts: ['ovi', 'shuv', 'linhe'] },
  // wild raptor packs den in the spring groves — rivals even to a played raptor
  linhe: { hp: 200, dmg: 42, atkCd: 0.8, speed: 192, detect: 260, homeR: 320, reach: 22, biome: 'forest', turn: 4.4, patience: 8, fears: [['tarbo', 210], ['nothro', 150]] },
  // slow, colossal, and armed: claw swipes leave bleeding wounds
  nothro: { hp: 1900, dmg: 150, atkCd: 1.8, speed: 70, detect: 140, homeR: 240, reach: 46, biome: 'forest', turn: 1.7, fearless: true, tank: true, bleedable: true, melee: { bleed: { dps: 8, dur: 6 }, kb: 230 } },
  // the egg thief: fast, nosy, dines on every carcass first
  ovi: { hp: 160, dmg: 0, atkCd: 0, speed: 208, detect: 250, homeR: 420, reach: 0, biome: 'plains', turn: 3.7 },
  shuv: { hp: 90, dmg: 0, atkCd: 0, speed: 228, detect: 260, homeR: 380, reach: 0, biome: 'plains', turn: 4 },
  // a walking boulder — its armor shrugs off bleeding entirely
  pinaco: { hp: 1300, dmg: 135, atkCd: 2.0, speed: 58, detect: 110, homeR: 200, reach: 40, biome: 'any', turn: 1.6, fearless: true, tank: true, melee: { kb: 280 } },
  // --- Lertentous Delta ---
  // the giant lambeosaurine: placid until anything threatens the herd — then
  // the whole river bank swings back, vigorously
  magnapaulia: { hp: 1800, dmg: 150, atkCd: 1.8, speed: 92, fleeSpeed: 120, detect: 240, homeR: 380, reach: 42, biome: 'plains', turn: 1.9, bleedable: true, melee: { kb: 260 } },
  // the nodosaur: a medium tank in a bone coat — no club, no need
  panoplo: { hp: 1100, dmg: 110, atkCd: 1.9, speed: 60, detect: 130, homeR: 220, reach: 34, biome: 'any', turn: 1.7, fearless: true, tank: true, melee: { kb: 240 } },
  // the crested menace: knee-high and furious — it starts fights it has
  // no business starting, and wins more than it should
  proto: { hp: 380, dmg: 55, atkCd: 1.1, speed: 96, detect: 180, homeR: 260, reach: 24, biome: 'forest', turn: 3.0, melee: { kb: 140 } },
  // the walking mountain: kills almost any predator with relative ease
  atlas: { hp: 4200, dmg: 360, atkCd: 2.4, speed: 66, detect: 210, homeR: 320, reach: 52, biome: 'plains', turn: 1.3, fearless: true, tank: true, bleedable: true, melee: { kb: 340 } },
  // pack raptor that fears not one playable: no fears list, and while a
  // packmate stands, nobody routs
  dakota: { hp: 280, dmg: 55, atkCd: 0.85, speed: 175, detect: 260, homeR: 340, reach: 24, biome: 'forest', turn: 4.2, patience: 7, packCourage: true },
  // the son's invention: small, weak, scruffy — but never alone for long
  aardi: { hp: 240, dmg: 38, atkCd: 0.8, speed: 168, detect: 250, homeR: 320, reach: 20, biome: 'forest', turn: 4.4, patience: 7, packCourage: true, fears: [['lourinha', 160], ['yuty', 140]] },
  // fast, robust-headed, and its bite has a reputation
  yuty: { hp: 1200, dmg: 140, atkCd: 1.2, speed: 150, detect: 300, homeR: 600, reach: 32, biome: 'plains', turn: 2.2, fearless: true, bleedable: true, hunts: ['proto', 'dakota'] },
  // the big fan-crested lambeosaurine — charonosaurus' niche, delta edition
  oloro: { hp: 1500, dmg: 130, atkCd: 1.9, speed: 80, fleeSpeed: 110, detect: 220, homeR: 340, reach: 44, biome: 'plains', turn: 1.7, bleedable: true, melee: { kb: 240 } },
  // massive flat-plated tank: smacks with the tail, occasionally bites
  // whatever stands at its face (the nip)
  wuerho: { hp: 2800, dmg: 175, atkCd: 2.2, speed: 52, detect: 120, homeR: 220, reach: 48, biome: 'any', turn: 1.4, fearless: true, tank: true, bleedable: true, melee: { kb: 300 }, nip: { dmg: 70, cd: 3 } },
  // the river barge: a placid mountain of belly with a hippo's temper —
  // and a thumb spike that ends most arguments in one jab
  fluvio: { hp: 1900, dmg: 150, atkCd: 1.6, speed: 70, detect: 150, homeR: 260, reach: 40, biome: 'any', turn: 1.5, fearless: true, tank: true, bleedable: true, melee: { kb: 260 } },
  // the charger: telegraphs, then arrives at a dead run — a long committed
  // dash (lungeT/lungeMul) launched from way out (chargeR)
  sino: { hp: 1600, dmg: 145, atkCd: 2.0, speed: 88, detect: 200, homeR: 300, reach: 38, biome: 'plains', turn: 1.8, fearless: true, tank: true, bleedable: true, melee: { kb: 300 }, chargeR: 170, lungeT: 0.7, lungeMul: 3.4 },
  // the delta's terror: hunts the player at EVERY size — even a full-grown
  // morosaurus checks the tree line for this one. Its bite doesn't close
  lourinha: { hp: 1700, dmg: 160, atkCd: 1.3, speed: 128, detect: 320, homeR: 650, reach: 34, biome: 'plains', turn: 2.0, fearless: true, bleedable: true, biteBleed: { dps: 13, dur: 8 }, hunts: ['proto', 'dakota', 'oloro'] },
  // the sawfish: lethal and angry — anything that touches its water is prey
  onchop: { hp: 500, dmg: 95, atkCd: 1.2, speed: 175, detect: 230, homeR: 400, reach: 26, biome: 'lake', turn: 3.5, fearless: true, aquatic: true, hunts: ['lepisosteus', 'bassb', 'scutelich'] },
  // the great coelacanth: immensely tanky, strong, and goes exactly nowhere
  mawsonia: { hp: 1600, dmg: 110, atkCd: 1.7, speed: 50, detect: 130, homeR: 220, reach: 32, biome: 'sea', turn: 2.2, fearless: true, tank: true, aquatic: true, bleedable: true, melee: { kb: 240 } },
  // ---- THE NIVALOTITAN WALL ----
  // the herd on the snowfields: a huge flat-headed polar edmontosaur-alike.
  // Warm to huddle beside — until the tail comes around
  kerbero: { hp: 2200, dmg: 155, atkCd: 2.0, speed: 88, fleeSpeed: 128, detect: 170, homeR: 320, reach: 44, biome: 'plains', turn: 1.7, tank: true, bleedable: true, melee: { kb: 260 } },
  // the shaggy guardian of the pine belt: plants itself and rakes with
  // feathered scythe arms — the wounds stay open in the cold
  beipiao: { hp: 900, dmg: 120, atkCd: 1.6, speed: 75, detect: 130, homeR: 220, reach: 34, biome: 'forest', turn: 1.9, fearless: true, tank: true, bleedable: true, melee: { bleed: { dps: 6, dur: 6 }, kb: 200 } },
  // the scavenger gang: snow-white troodontids that trail every blizzard,
  // picking at whatever froze — bold in a pack, gone in a blink alone
  pectino: { hp: 260, dmg: 55, atkCd: 0.9, speed: 132, fleeSpeed: 148, detect: 220, homeR: 420, reach: 24, biome: 'any', turn: 2.6, patience: 6, packCourage: true },
  // the king of the Wall: the polar tyrant. Fears nothing, hunts everything,
  // and the mist is on ITS side
  nanuq: { hp: 2300, dmg: 190, atkCd: 1.5, speed: 118, detect: 330, homeR: 700, reach: 38, biome: 'any', turn: 1.9, fearless: true, bleedable: true, hunts: ['kerbero', 'pectino', 'beipiao', 'korean'] },
  // the TITAN-KILLER: one single Titanovenator walks the whole mountain, and
  // it is the one hunter with no upper size limit — a full-grown nivalotitan
  // is not safe. Its bite opens wounds that refuse the cold's mercy.
  titanov: { hp: 2600, dmg: 210, atkCd: 1.7, speed: 108, detect: 380, homeR: 900, reach: 42, biome: 'any', turn: 1.7, fearless: true, bleedable: true, biteBleed: { dps: 14, dur: 9 }, hunts: ['kerbero', 'beipiao'] },
  // the snowball underfoot: a tiny burrowing ornithopod, everyone's lunch
  korean: { hp: 200, dmg: 25, atkCd: 1.2, speed: 120, fleeSpeed: 155, detect: 200, homeR: 240, reach: 18, biome: 'forest', turn: 3.5 },
};

let npcSeq = 1;
function makeNPC(species, x, y, packId) {
  const d = NPC_DEF[species];
  return {
    id: npcSeq++, species, x, y, vx: 0, vy: 0,
    hp: d.hp, maxhp: d.hp, growth: 1, submerged: !!d.amphibious,
    facing: rnd() < 0.5 ? 1 : -1, phase: rnd() * TAU, move: 0,
    pitch: 0, pitchT: 0,
    heading: rnd() * TAU, turnRate: d.turn || 3,
    orbitDir: rnd() < 0.5 ? 1 : -1,
    state: 'idle', stateT: rrange(0.5, 2), tx: x, ty: y,
    home: { x, y }, packId: packId || 0,
    atkCd: rrange(0, 0.8), attackT: 0, headDown: 0, hurtT: 0,
    bleed: null, thinkT: rnd() * 0.3, target: null,
    lastAttacker: null, aggroT: 0,
  };
}

function makePlayer(species, gender, skin) {
  // spawn at the species' own nest, or the world's generic spawn, or dead centre
  const nest = World.nests[species] || World.nests.spawn || { x: WORLD_W / 2, y: WORLD_H / 2 };
  const def = PLAYER_DEF[species];
  gender = GENDER_MOD[gender] ? gender : 'f';
  skin = SKINS[skin] ? skin : 'default';
  return {
    isPlayer: true, species, gender, skin, x: nest.x, y: nest.y + 6, vx: 0, vy: 0,
    growth: 0.0, hp: def.hp * GENDER_MOD[gender].hp * hpFrac(0), food: 80, water: 80, stamina: def.stamMax, hygiene: 100,
    cold: 0, frozenT: 0,
    facing: 1, phase: 0, move: 0, pitch: 0,
    atkCd: 0, attackT: 0, headDown: 0, hurtT: 0, actionT: 0, action: null,
    bleed: null, exhausted: false, stage: 'Hatchling',
    alive: true, causeOfDeath: null, bornAt: 0, wins: false,
  };
}
function hpFrac(g) { return 0.12 + 0.88 * g; }
function playerMaxHp() { return Math.round(PLAYER_DEF[G.player.species].hp * genderMod(G.player).hp * hpFrac(G.player.growth)); }
function playerDmg() {
  const p = G.player, def = PLAYER_DEF[p.species];
  let dmg = def.dmg * genderMod(p).dmg * (0.15 + 0.85 * p.growth);
  // Wet Wrath (spinosaurus): a semi-aquatic hunter hits 1.2× harder standing
  // in water — and 15% softer on dry land
  if (def.wetWrath) dmg *= isWaterPx(p.x, p.y) ? 1.2 : 0.85;
  return dmg;
}

// ---------- damage ----------
function floatText(x, y, str, color) {
  G.floats.push({ x, y, str, color: color || '#fff', t: 1.1 });
}
function bloodBurst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, sp = 20 + Math.random() * 50;
    G.particles.push({
      x, y: y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 30,
      t: 0, life: 0.5 + Math.random() * 0.3, r: 1 + Math.random() * 1.5,
      color: '#8c1f14', grav: 220,
    });
  }
}

function dealDamage(target, amount, attacker, opts) {
  opts = opts || {};
  if (target.isPlayer && !target.alive) return;
  if (!target.isPlayer && target.hp <= 0) return;
  let dmg = amount;
  let crit = false;
  let glance = false;
  // huayangosaurus weak spot: hits that land near its head do double damage
  // (compared on the ground plane, so flanking the head works from any side)
  if (!target.isPlayer && target.species === 'huayango' && attacker && opts.hitX != null) {
    const hp = headWorldPos(target);
    if (dist(opts.hitX, opts.hitY, hp.x, target.y) < 30) { dmg *= 2; crit = true; }
  }
  // the opposite peculiarity: an armored skull (scutelocephalichthyus) —
  // hits landing on the head glance off. Aim for the tail.
  if (!target.isPlayer && attacker && opts.hitX != null && NPC_DEF[target.species] && NPC_DEF[target.species].headArmor) {
    const hp = headWorldPos(target);
    if (dist(opts.hitX, opts.hitY, hp.x, target.y) < 24) { dmg *= NPC_DEF[target.species].headArmor; glance = true; }
  }
  dmg = Math.round(dmg);
  target.hp -= dmg;
  target.hurtT = 0.35;
  target.lastAttacker = attacker;
  target.aggroT = 6;
  // the pack hunts WITH the alpha: whatever the alpha bites — and whatever
  // bites the alpha — becomes the whole pack's quarry
  if (G.pack && G.pack.length && G.player) {
    if (attacker === G.player && !target.isPlayer && !target.isMate && !target.isBaby &&
      target.species !== G.player.species && DINO[target.species] && !DINO[target.species].fish) {
      G.packTarget = target; G.packTargetT = 8;
    } else if (target.isPlayer && attacker && !attacker.isPlayer && attacker.species !== target.species) {
      G.packTarget = attacker; G.packTargetT = 8;
    }
  }
  floatText(target.x, target.y - 40 * (target.isPlayer ? sizeScale(target.growth) : 1) - 8,
    '-' + dmg + (crit ? '!' : glance ? ' ⛨' : ''), crit ? '#ffd23e' : glance ? '#b8c4c9' : '#ff6a5e');
  bloodBurst(target.x, target.y, crit ? 10 : 5);
  if (opts.bleed) {
    // armored playables (scutellosaurus) shrug off most of a bleed wound
    const br = target.isPlayer ? (PLAYER_DEF[target.species].bleedResist || 1) : 1;
    target.bleed = { dps: opts.bleed.dps * br, t: opts.bleed.dur * br };
    floatText(target.x, target.y - 52, br < 1 ? 'bleeding (resisted)' : 'BLEEDING', '#d43a2a');
  }
  if (attacker) {
    const kb = opts.kb || 60;
    const a = angTo(attacker.x, attacker.y, target.x, target.y);
    target.vx += Math.cos(a) * kb;
    target.vy += Math.sin(a) * kb;
  }
  if (target.isPlayer) {
    SFX.hurt();
    target.fishing = false;   // nothing stays calm with teeth in it
    target.resting = false;   // …and nothing sleeps through them either
    G.shake = Math.min(6, G.shake + 3);
    if (target.hp <= 0) killPlayer(attacker ? DINO[attacker.species].name : (opts.cause || 'the wilderness'));
  } else if (target.hp <= 0) {
    killNPC(target, attacker);
  }
}

function killNPC(e, attacker) {
  e.hp = 0;
  const meat = Math.round(e.maxhp * 0.55);
  G.carcasses.push({ x: e.x, y: e.y, species: e.species, growth: e.growth, meat, maxMeat: meat, t: 0 });
  const i = G.npcs.indexOf(e);
  if (i >= 0) G.npcs.splice(i, 1);
  // FEAR: watching one of your own die breaks the pack's nerve — survivors rout
  if (!(NPC_DEF[e.species] || { fearless: true }).fearless) {
    let fled = 0;
    const threat = attacker || { x: e.x, y: e.y };
    for (const o of G.npcs) {
      if (o.species !== e.species || !NPC_DEF[o.species]) continue;   // mates & babies never rout
      if (dist(o.x, o.y, e.x, e.y) > 360) continue;
      // pack courage (concavenator): while a packmate still stands, nobody runs
      if (NPC_DEF[o.species].packCourage && packmates(o, 360).length >= 1) continue;
      o.state = 'flee';
      o.target = threat;
      o.stateT = rrange(3.5, 6);
      o.tiredT = Math.max(o.tiredT || 0, 9);   // too shaken to re-attack for a while
      o.pursuitT = 0;
      fled++;
    }
    if (attacker && attacker.isPlayer && fled >= 2) {
      floatText(e.x, e.y - 44, 'The pack scatters!', '#ffe9a0');
    }
  }
  if (attacker && attacker.isPlayer) {
    SFX.kill();
    floatText(e.x, e.y - 30, DINO[e.species].name + ' slain', '#ffd23e');
    // a kill pays out growths, scaled to how big the prey was
    if (typeof awardGrowths === 'function') {
      const mul = (PLAYER_DEF[attacker.species].earnMul || 1) * genderMod(attacker).earn;
      awardGrowths(Math.max(1, Math.round(e.maxhp / 60 * mul)), e.x, e.y - 58);
    }
  }
}

function killPlayer(cause) {
  const p = G.player;
  if (!p.alive) return;
  p.alive = false;
  if (p.carry) { p.carry.c.carried = false; p.carry = null; }   // dinner drops with you
  G.wrestle = null;
  if (G.burrow) {   // dragged back to daylight, the pack scattering after you
    p.x = G.burrow.wx; p.y = G.burrow.wy;
    for (const e of G.burrow.allies) {
      if (e._wx != null) { e.x = e._wx; e.y = e._wy; e._wx = e._wy = null; }
    }
    G.burrow = null;
  }
  p.causeOfDeath = cause;
  SFX.die();
  G.onPlayerDeath && G.onPlayerDeath(cause);
}

// ---------- movement helpers ----------
function terrainSpeedAt(x, y) {
  if (isWaterPx(x, y)) return 0.55;
  if (isMudPx(x, y)) return 0.72;
  if (isLavaPx(x, y)) return 0.8;   // crossable — at a price
  if (isCliffPx(x, y)) return 0.5;  // climbing a wall is slow, careful going
  return 1;
}
function collideStatics(e, r) {
  // trees come from the spatial grid: only the 3×3 cells around the animal
  // are checked, so a rainforest of thousands of trunks stays cheap
  const gx = (e.x / TGRID) | 0, gy = (e.y / TGRID) | 0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cell = World.treeGrid.get((gx + ox) + ',' + (gy + oy));
      if (!cell) continue;
      for (const t of cell) {
        const d = dist(e.x, e.y, t.x, t.y), min = r + 4 * t.s;
        if (d < min && d > 0.001) {
          const a = angTo(t.x, t.y, e.x, e.y);
          e.x = t.x + Math.cos(a) * min;
          e.y = t.y + Math.sin(a) * min;
        }
      }
    }
  }
  for (const t of World.rocks) {
    const d = dist(e.x, e.y, t.x, t.y), min = r + 6 * t.s;
    if (d < min && d > 0.001) {
      const a = angTo(t.x, t.y, e.x, e.y);
      e.x = t.x + Math.cos(a) * min;
      e.y = t.y + Math.sin(a) * min;
    }
  }
  for (const b of World.blockers) {
    const d = dist(e.x, e.y, b.x, b.y), min = r + b.r;
    if (d < min && d > 0.001) {
      const a = angTo(b.x, b.y, e.x, e.y);
      e.x = b.x + Math.cos(a) * min;
      e.y = b.y + Math.sin(a) * min;
    }
  }
  // deep water is impassable — unless you were built for it
  if (isDeepPx(e.x, e.y) && !canSwimDeep(e)) {
    const a = shallowDir(e.x, e.y);
    e.x += Math.cos(a) * 3;
    e.y += Math.sin(a) * 3;
  }
  // a rock wall is impassable — unless you can climb it (some only as babies)
  if (isCliffPx(e.x, e.y) && !isClimber(e)) {
    const a = offCliffDir(e.x, e.y);
    e.x += Math.cos(a) * 3;
    e.y += Math.sin(a) * 3;
  }
  // no animal walks into lava — only the player may dare it (and burn)
  if (!e.isPlayer && isLavaPx(e.x, e.y)) {
    const a = coolDir(e.x, e.y);
    e.x += Math.cos(a) * 4;
    e.y += Math.sin(a) * 4;
  }
  e.x = clamp(e.x, 10, WORLD_W - 10);
  e.y = clamp(e.y, 10, WORLD_H - 10);
}
function canSwimDeep(e) {
  if (e.isPlayer) return !!PLAYER_DEF[e.species].swim;
  const nd = NPC_DEF[e.species];
  if (!nd) return !!PLAYER_DEF[e.species].swim;   // mates & babies swim like their kind
  return !!nd.aquatic || !!nd.swims;
}
// who can cross the Wall's rock walls. `climb` = always; `babyClimb` = only
// while small (a hatchling scrambles up a face its grown parent can't) — the
// escape-upward trick the son wanted.
function isClimber(e) {
  const def = e.isPlayer ? PLAYER_DEF[e.species] : (NPC_DEF[e.species] || PLAYER_DEF[e.species]);
  if (!def) return false;
  if (def.climb) return true;
  if (def.babyClimb) return e.isBaby || (e.growth != null && e.growth < 0.35);
  return false;
}
// direction of the nearest non-deep ground (works for the river and for ponds)
function shallowDir(x, y) {
  for (let r = TILE; r <= TILE * 8; r += TILE) {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      if (!isDeepPx(x + Math.cos(a) * r, y + Math.sin(a) * r)) return a;
    }
  }
  return 0;
}

// NPCs can't pivot on a dime: once one commits to a facing it must hold it
// for a beat before flipping again. Without this a tail-swinger spins to
// present its thagomizer and smacks in the SAME frame — the turn is invisible
// and the tail seems to come out of nowhere. The short hold makes the pivot
// readable (and, paired with the tryMelee gate, forces a real telegraph).
const TURN_DELAY = 0.3;
function faceToward(e, dir) {
  if (!dir || dir === e.facing) return;
  if (e.isPlayer) { e.facing = dir; return; }   // you turn on a dime — the delay is for NPCs only
  if ((e.turnCd || 0) > 0) return;      // still committed to the current facing
  e.facing = dir;
  e.turnCd = TURN_DELAY;
}
function stepToward(e, tx, ty, speed, dt) {
  const d = dist(e.x, e.y, tx, ty);
  if (d < 2) { e.move = lerp(e.move, 0, 0.2); return true; }
  // steering with inertia: turn toward the target at a limited rate, so a
  // sharp juke makes a fast pursuer overshoot
  const desired = angTo(e.x, e.y, tx, ty);
  if (e.heading == null) e.heading = desired;
  const diff = ((desired - e.heading + Math.PI * 3) % TAU) - Math.PI;
  const maxT = (e.turnRate || 3) * dt * (d < 40 ? 3 : 1);  // converge when close
  e.heading += clamp(diff, -maxT, maxT);
  const sp = speed * terrainSpeedAt(e.x, e.y);
  e.x += Math.cos(e.heading) * sp * dt;
  e.y += Math.sin(e.heading) * sp * dt;
  if (Math.abs(Math.cos(e.heading)) > 0.25) faceToward(e, Math.cos(e.heading) > 0 ? 1 : -1);
  e.pitchT = Math.sin(e.heading) * 0.3;   // nose leads into vertical movement
  e.move = lerp(e.move, 1, 0.15);
  e.phase += dt * sp * 0.055;
  return d < 6;
}
function idleDrift(e, dt) {
  e.move = lerp(e.move, 0, 0.1);
}

// ---------- NPC thinking ----------
function playerVisibleTo(e, detectR) {
  const p = G.player;
  if (!p || !p.alive) return false;
  let r = detectR;
  // sprinting is noisy, resting/small is stealthy
  if (G.keys && G.input && G.input.sprinting) r *= 1.3;
  if (p.move < 0.15) r *= 0.72;
  return dist(e.x, e.y, p.x, p.y) < r;
}
function packmates(e, radius) {
  const out = [];
  for (const o of G.npcs) {
    if (o !== e && o.species === e.species && dist(e.x, e.y, o.x, o.y) < radius) out.push(o);
  }
  return out;
}
// where this dino's weapon actually is (ground plane): jaws at the snout,
// or the tail arc for tail-fighters — an attack only lands if this zone
// overlaps the victim's body, so nobody bites with their back anymore
// body-centre → snout-tip distance on the ground plane (shared silhouette math)
function snoutLen(d, s) {
  return (d.L.body[0] * 0.38 + Math.cos(d.L.neckAng) * d.L.neckLen + d.L.head[0] * 0.5) * s;
}
function weaponPos(e) {
  const d = DINO[e.species];
  const g = e.growth != null ? e.growth : 1;
  const s = d.scale * sizeScale(g) * genderMod(e).size;
  const facing = e.facing || 1;
  if (d.tailWeapon) {
    const back = (d.L.body[0] * 0.42 + d.L.tail[0] * 0.55) * s;
    return { x: e.x - facing * back, y: e.y, r: Math.max(8, d.L.tail[0] * 0.45 * s) };
  }
  if (d.clawWeapon) {
    // claw swipe: a wide arc sweeping the ground just ahead of the chest
    const fwd = (d.L.body[0] * 0.3 + d.L.leg[0] * 0.3) * s;
    return { x: e.x + facing * fwd, y: e.y, r: Math.max(8, d.L.leg[0] * 0.55 * s) };
  }
  // the mouth: a circle hugging the front half of the head — its edge barely
  // clears the snout tip, so a bite needs real face-to-body contact (still
  // sized up for the oversized baby head)
  const headMul = 1 + 0.95 * Math.pow(1 - g, 1.4);
  const hl = d.L.head[0] * s * headMul;
  const fwd = snoutLen(d, s) - hl * 0.25;
  const r = Math.max(5, hl * 0.5);
  // mid-lunge the whole body drives along the dash line — the jaws lead it
  if (e.state === 'lunge' && e.lungeA != null) {
    return { x: e.x + Math.cos(e.lungeA) * fwd, y: e.y + Math.sin(e.lungeA) * fwd, r };
  }
  return { x: e.x + facing * fwd, y: e.y, r };
}
// ---- victim hit zones ----
// Every dino's body is an ARRAY of hit circles laid along its skeleton
// (head → chest → torso → hip → tail → tail tip), so any part of the body can
// be hit and species with body peculiarities can hand-tune their own array:
// set `hitZones: [{dx, dy, r}, …]` on the DINO entry (body-local units,
// facing right, unscaled — growth scaling is applied at test time).
// `dz` is each zone's height above the ground anchor (body-local, unscaled).
// Combat happens in SCREEN space: every test folds dz into y, the exact same
// coordinates the H overlay draws — the circles you see ARE the hitboxes.
// (A tall hunter must stand a step south of short prey so its jaws reach
// down to them; aimYAt below bakes that into NPC aim.)
// Derived from drawDino's skeleton anchors (cy, neckBase, tailY).
function zoneHeights(d) {
  const L = d.L;
  const spine = d.fish ? L.body[1] * 0.1 : L.leg[0] + L.body[1] * 0.42;
  const head = d.fish ? L.body[1] * 0.1
    : spine + L.body[1] * 0.14 + Math.sin(L.neckAng) * L.neckLen + (d.foreLift || 0) * L.body[1] * 0.6;
  return { spine, head };
}
function hitZonesOf(d) {
  if (!d._zones) {
    const L = d.L;
    const { spine, head } = zoneHeights(d);
    const fl = (d.foreLift || 0) * L.body[1];
    const tUp = (t) => spine + (d.tailUp || 0) * L.tail[0] * 0.34 * t - t * t * 1.5;
    d._zones = d.hitZones || [
      { dx: (L.body[0] * 0.38 + Math.cos(L.neckAng) * L.neckLen + L.head[0] * 0.5) * 0.9, dy: 0, dz: head, r: Math.max(3, L.head[1] * 0.75) },  // head
      { dx: L.body[0] * 0.3, dy: 0, dz: spine + fl * 0.62, r: L.body[1] * 0.55 },                                  // chest
      { dx: 0, dy: 0, dz: spine + fl * 0.3, r: L.body[1] * 0.6 },                                                   // torso
      { dx: -L.body[0] * 0.34, dy: 0, dz: spine - L.body[1] * 0.1, r: L.body[1] * 0.55 },                           // hip
      { dx: -(L.body[0] * 0.42 + L.tail[0] * 0.35), dy: 0, dz: tUp(0.35), r: Math.max(2.5, L.tail[1] * 0.9) },      // tail
      // a club tail's business end IS the very tip — cover the knob too
      d.tailClub
        ? { dx: -(L.body[0] * 0.42 + L.tail[0] * 1.0), dy: 0, dz: tUp(1.0), r: Math.max(3.5, L.tail[1] * 1.3) }
        : { dx: -(L.body[0] * 0.42 + L.tail[0] * 0.7), dy: 0, dz: tUp(0.7), r: Math.max(2, L.tail[1] * 0.6) },      // tail tip
    ];
    if (!d.hitZones && L.neckLen >= 16) {
      // long necks (sauropods) get a mid-neck circle — the chest→head gap is
      // hittable body too
      d._zones.splice(1, 0, {
        dx: L.body[0] * 0.36 + Math.cos(L.neckAng) * L.neckLen * 0.55,
        dy: 0,
        dz: spine + L.body[1] * 0.14 + Math.sin(L.neckAng) * L.neckLen * 0.55 + (d.foreLift || 0) * L.body[1] * 0.6,
        r: Math.max(3.5, L.body[1] * 0.3 * (d.neckW || 1)),
      });
    }
    for (const z of d._zones) if (z.dz == null) z.dz = spine;   // hand-tuned arrays may omit dz
  }
  return d._zones;
}
// how high this dino's weapon rides above its ground anchor (scaled px) —
// jaws at head height, tail swings and claw swipes nearer the spine. The H
// overlay lifts the red circle by exactly this, so combat must too.
function weaponHeight(e) {
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  const zh = zoneHeights(d);
  return (d.tailWeapon ? zh.spine : d.clawWeapon ? zh.spine * 0.7 : zh.head) * s;
}
// where an NPC should aim so its lifted weapon circle lands ON the victim's
// body circles: the victim's ground spot, shifted south by however much
// higher the hunter's jaws ride than the victim's spine
function aimYAt(e, t) {
  const td = DINO[t.species];
  const ts = td.scale * sizeScale(t.growth != null ? t.growth : 1) * genderMod(t).size;
  return t.y + weaponHeight(e) - zoneHeights(td).spine * ts;
}
// ---- pounce: coil, leap, bite at the landing ----
// One rule for every dino, player and NPC alike: the PREP time scales with
// SIZE (a big body takes longer to load the spring), the LEAP length with
// SPEED (fast dinos cover real ground). Tail-fighters trade the leap for the
// spin — planted in place, scything on a metronome for as long as it's held.
function pouncePrep(sp, growth) {
  const g = growth == null ? 1 : 0.55 + 0.45 * growth;
  return clamp(0.18 + (DINO[sp].scale || 1) * g * 0.3, 0.22, 0.85);
}
function pounceDist(spd) { return clamp(spd * 1.05, 60, 240); }
// the landing pin: the pouncing body itself, near ground level — combat AND
// the H overlay consume this same object (the single-source hitbox rule)
function pounceLandZone(p) { return { x: p.x + p.facing * 6, y: p.y - 12, r: 14 + 12 * p.growth }; }
// a bite is a strike ARC, not a floating ring: the jaws start at head height
// and come DOWN — three stacked circles from jaw-line to shin-line, so tiny
// prey under a tall predator's chin is genuinely bitable. (Found when an
// adult Nanuqsaurus could not touch a Koreanosaurus at ANY distance: jaw at
// height 59, prey spine at 8.) Combat AND the H overlay consume these.
function biteZones(e) {
  const wz = weaponPos(e);
  const h = weaponHeight(e);
  const r = wz.r + 4;
  return [
    { x: wz.x, y: wz.y - h, r },
    { x: wz.x, y: wz.y - h * 0.55, r: r * 0.9 },
    { x: wz.x, y: wz.y - h * 0.15, r: r * 0.8 },
  ];
}
// the giant's footprint: everything under a walking Nivalotitan is being
// stepped on — same single-source rule, the overlay draws exactly this
function trampleZone(p) {
  const s = DINO[p.species].scale * sizeScale(p.growth);
  return { x: p.x, y: p.y - 6, r: DINO[p.species].L.body[0] * 0.42 * s };
}

// ---- one shared bleed tick, for every wounded thing ----
// The wound drains hp a sliver per frame (dps · dt ≈ 0.1 hp at 60fps), which
// is far too small to print — 60 overlapping "-0.1"s a second would be mush.
// So the slivers pile up in b.acc, and once a second the total floats up as
// one readable blood-red number. Same trick as a shop rounding up pennies.
function bleedTick(e, dt) {
  const b = e.bleed;
  e.hp -= b.dps * dt;
  b.t -= dt;
  b.acc = (b.acc || 0) + b.dps * dt;
  b.tick = (b.tick == null ? 1 : b.tick) - dt;
  if (b.tick <= 0 && b.acc >= 1) {
    floatText(e.x + (Math.random() - 0.5) * 8, e.y - 58, '-' + Math.round(b.acc) + ' 🩸', '#d43a2a');
    b.acc = 0; b.tick = 1;
  }
  // the drip that was already there — now it has a number to go with it
  if (Math.random() < dt * 6) G.particles.push({ x: e.x + (Math.random() - 0.5) * 10, y: e.y - 10, vx: 0, vy: 20, t: 0, life: 0.5, r: 1.2, color: '#8c1f14', grav: 120 });
  if (b.t <= 0) e.bleed = null;
}
// ---- THE combat circles ----
// The single source of truth: every hit test below AND the H overlay consume
// these exact objects. The overlay does no geometry of its own, so what it
// draws cannot drift from what combat tests — same function, same numbers.
function bodyCircles(victim) {
  const d = DINO[victim.species];
  const s = d.scale * sizeScale(victim.growth != null ? victim.growth : 1) * genderMod(victim).size;
  const f = victim.facing || 1;
  const out = [];
  for (const z of hitZonesOf(d)) {
    out.push({ x: victim.x + f * z.dx * s, y: victim.y + (z.dy || 0) * s - (z.dz || 0) * s, r: z.r * s });
  }
  return out;
}
// the attack circle for circle weapons (jaws, claw sweep, the player's tail
// smack) — contact pad included, so drawn radius = tested radius
function weaponCircle(e) {
  const wz = weaponPos(e);
  return { x: wz.x, y: wz.y - weaponHeight(e), r: wz.r + 4 };
}
// an NPC tail swing: this circle, restricted to ±45° of dead-rear
function tailWedgeCircle(e) {
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  return { x: e.x, y: e.y - weaponHeight(e), r: (d.L.body[0] * 0.42 + d.L.tail[0] * 0.9) * s };
}
// the nip jaws of tail-fighters that can ALSO bite (wuerhosaurus)
function nipCircle(e) {
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  const hl = d.L.head[0] * s;
  return {
    x: e.x + (e.facing || 1) * (snoutLen(d, s) - hl * 0.25),
    y: e.y - zoneHeights(d).head * s,
    r: Math.max(5, hl * 0.5) + 4,
  };
}
// spinosaurus' second strike: the claw sweep arcing over the chest
function clawArcCircle(e) {
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  return {
    x: e.x + (e.facing || 1) * d.L.body[0] * 0.28 * s,
    y: e.y - zoneHeights(d).spine * s,
    r: Math.max(8, d.L.body[1] * 0.5 * s) + 4,
  };
}
// the nearest point where the circle (x,y,r) touches any of the victim's
// body circles — null if it touches none. Any part of the body counts.
// (x,y) is the weapon's SCREEN position (already lifted by its height) and
// the body circles come from bodyCircles() — the very objects the H overlay
// draws, so what you see is what hits.
function bodyHitPoint(victim, x, y, r) {
  let best = null, bd = 1e9;
  for (const z of bodyCircles(victim)) {
    const dd = dist(x, y, z.x, z.y);
    if (dd - z.r > r || dd - z.r > bd) continue;
    bd = dd - z.r;
    // contact sits on the zone's surface, toward the attacker — but a weapon
    // buried INSIDE the zone contacts right where it is (projecting to the
    // far surface used to throw the point behind the attacker, where the
    // back-side guard wrongly rejected point-blank hits on big victims)
    best = dd < z.r
      ? { x, y }
      : { x: z.x + (x - z.x) / dd * z.r, y: z.y + (y - z.y) / dd * z.r };
  }
  return best;
}
// where this dino's weapon touches the target right now (null = no contact)
function weaponContact(e, target) {
  const d = DINO[e.species];
  if (d.tailWeapon) {
    // a tail swing sweeps a 90° wedge dead behind the swinger — anything off
    // to the sides (or at its face) is out of the arc (the dino keeps its
    // back turned to what it wants to hit)
    const wc = tailWedgeCircle(e);
    const pt = bodyHitPoint(target, wc.x, wc.y, wc.r);
    if (!pt) return null;
    const dx = pt.x - wc.x, dy = pt.y - wc.y;
    const len = Math.hypot(dx, dy);
    if (len > 1 && -dx * (e.facing || 1) / len < 0.7071) return null; // outside ±45° of dead-rear
    return pt;
  }
  // jaws: the strike ARC must touch the victim's body, and the contact must
  // be on the jaw side of the attacker — nothing behind the head ever counts
  for (const wc of (d.clawWeapon ? [weaponCircle(e)] : biteZones(e))) {
    const pt = bodyHitPoint(target, wc.x, wc.y, wc.r);
    if (!pt) continue;
    const dirX = e.state === 'lunge' && e.lungeA != null ? Math.cos(e.lungeA) : (e.facing || 1);
    const dirY = e.state === 'lunge' && e.lungeA != null ? Math.sin(e.lungeA) : 0;
    if ((pt.x - e.x) * dirX + (pt.y - wc.y) * dirY < -2) continue;
    return pt;
  }
  return null;
}
function tryMelee(e, target, def, opts) {
  if (e.atkCd > 0) return;
  if (e.turnCd > 0) return;    // let the pivot land first — no turn-and-smack in one frame
  const pt = weaponContact(e, target);
  if (!pt) return;
  e.atkCd = def.atkCd;
  e.attackT = 1;
  opts = Object.assign({ hitX: pt.x, hitY: pt.y }, opts);
  dealDamage(target, def.dmg * rrange(0.85, 1.15), e, opts);
}
// the jaw zone alone, for tail-fighters that can ALSO bite (wuerhosaurus'
// nip): same face-side rules as regular jaws, ignoring the tail weapon
function jawContact(e, target) {
  const nc = nipCircle(e);
  const pt = bodyHitPoint(target, nc.x, nc.y, nc.r);
  if (!pt) return null;
  if ((pt.x - e.x) * (e.facing || 1) < -2) return null;
  return pt;
}

// a fish: drifts around its home water, bolts when something big wades in —
// unless that something is FISHING: a still shape at the waterside doesn't
// read as danger, and curiosity slowly pulls the fish in
function thinkFish(e, d) {
  const p = G.player;
  if (p && p.alive && p.fishing && !d.fearless && dist(e.x, e.y, p.x, p.y) < 280) {
    // passively lured — but a fish takes its sweet time deciding to commit
    // (the hostile fish are never curious; they simply leave you alone)
    if (e.state !== 'lured' && rnd() < 0.05) { e.state = 'lured'; e.stateT = 25; }
    if (e.state === 'lured') return;
  } else if (e.state === 'lured') {
    e.state = 'wander'; e.stateT = 1;
  }
  if (p && p.alive && !p.fishing && isWaterPx(p.x, p.y) && dist(e.x, e.y, p.x, p.y) < d.detect) {
    e.state = 'flee'; e.target = p; e.stateT = 1.6; return;
  }
  if (e.stateT > 0) return;
  for (let k = 0; k < 10; k++) {
    const a = rnd() * TAU, rr = rrange(20, d.homeR);
    const tx = e.home.x + Math.cos(a) * rr, ty = e.home.y + Math.sin(a) * rr;
    if (isWaterPx(tx, ty)) { e.tx = tx; e.ty = ty; break; }
  }
  e.state = rnd() < 0.35 ? 'idle' : 'wander';
  e.stateT = rrange(1.5, 4);
}

// shared fear check: def.fears = [[species, radius]…]
function fearCheck(e, d) {
  if (!d.fears) return false;
  for (const [sp, r] of d.fears) {
    for (const o of G.npcs) {
      if (o.species === sp && dist(e.x, e.y, o.x, o.y) < r) {
        // tanks barely pursue, so a short hop away is enough
        e.state = 'flee'; e.target = o; e.stateT = NPC_DEF[sp].tank ? 2 : 2.5;
        return true;
      }
    }
  }
  return false;
}
function isPredatorNPC(sp) { const nd = NPC_DEF[sp]; return !!nd && DINO[sp].diet === 'carn' && nd.dmg > 0; }
// family is never a threat: your pack, your mate, your babies — no matter
// how sharp their teeth are (an aardiraptor mate IS a predator species, and
// without this rule it would flag ITSELF as the danger nearest the nest)
function isFamily(o) { return !!(o.packAlpha || o.isMate || o.isBaby); }

// pack hunter (guanlong, troodon): lone vs babies, gangs up on grown prey
function thinkPackHunter(e, d) {
  const p = G.player;
  const pd = p && p.alive ? dist(e.x, e.y, p.x, p.y) : 1e9;
  if (fearCheck(e, d)) return;
  // kin truce (aardiraptor): your own kind never starts it — but blood
  // drawn is blood answered, handled by the aggro block below
  const kin = p && p.species === e.species;
  if (!kin && p && p.alive && pd < d.detect && playerVisibleTo(e, d.detect) && (e.tiredT || 0) <= 0) {
    const small = p.growth < 0.22;
    if (small) {
      // babies face lone hunters only — the pack never gangs up on a hatchling
      const othersHunting = G.npcs.some(o => o !== e && o.species === e.species && o.target === p &&
        (o.state === 'chase' || o.state === 'windup' || o.state === 'lunge' || o.state === 'recover'));
      if (!othersHunting) { e.state = 'chase'; e.target = p; e.stateT = 4; }
      else if (e.state === 'chase' || e.state === 'avoid') { e.state = 'avoid'; e.target = p; e.stateT = 2; }
      return;
    }
    // once engaged, the pack stays committed even while fanned out circling
    const mates = packmates(e, e.state === 'chase' ? 300 : 130);
    if (mates.length >= 2) {
      e.state = 'chase'; e.target = p; e.stateT = 4; return;
    }
    // run to packmates and band together
    const far = packmates(e, 620);
    if (far.length > 0) {
      e.state = 'rally'; e.target = far[0]; e.stateT = 3; return;
    }
    e.state = 'avoid'; e.target = p; e.stateT = 2; return;
  }
  if (e.aggroT > 0 && e.lastAttacker && e.lastAttacker.isPlayer && p.alive) {
    if (p.growth < 0.22 || packmates(e, 130).length >= 2) { e.state = 'chase'; e.target = p; e.stateT = 3; return; }
    e.state = 'flee'; e.target = p; e.stateT = 2.5; return;
  }
  // scavenge nearby carcass
  const c = nearestCarcass(e.x, e.y, 200, true);
  if (c && c.meat > 20) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
  defaultWander(e);
}

// a pack aardiraptor: shadow the alpha, drift where they drift, and share
// their meals (the mimic window opens whenever the alpha eats or drinks)
function thinkPackFollower(e, d) {
  const p = G.player;
  if (!p || !p.alive || p.species !== e.species) { e.packAlpha = false; defaultWander(e); return; }
  e.home.x = p.x; e.home.y = p.y;          // home is wherever the alpha is
  // THE HUNT: the whole pack piles onto the alpha's quarry (set the moment
  // the alpha bites something, or something bites the alpha)
  const T = G.packTarget;
  if (T && T.hp > 0 && dist(e.x, e.y, T.x, T.y) < 420) {
    e.state = 'chase'; e.target = T; e.stateT = 3;
    return;
  }
  if (G.packMealT > 0 && e.state !== 'mimic' && dist(e.x, e.y, p.x, p.y) < 180) {
    e.state = 'mimic'; e.stateT = rrange(1.6, 2.6); return;
  }
  if (e.state === 'mimic') return;
  const dd = dist(e.x, e.y, p.x, p.y);
  if (dd > 70) { e.state = 'follow'; e.target = p; e.stateT = 2; return; }
  const a = rnd() * TAU, rr = rrange(20, 60);
  e.tx = p.x + Math.cos(a) * rr; e.ty = p.y + Math.sin(a) * rr;
  e.state = rnd() < 0.4 ? 'idle' : 'wander';
  e.stateT = rrange(1, 2.5);
}

// fast open-ground hunter (moros, eotyrannus): runs down the young, hates shade
function thinkRunner(e, d) {
  const p = G.player;
  if (fearCheck(e, d)) return;
  // hates shade: gives up under trees
  if (e.target && e.target.isPlayer && forestShadePx(e.target.x, e.target.y) > 0.5) {
    e.state = 'return'; e.target = null; e.stateT = 4;
  }
  if (p && p.alive && p.growth < 0.32 && playerVisibleTo(e, d.detect) && forestShadePx(p.x, p.y) <= 0.5) {
    e.state = 'chase'; e.target = p; e.stateT = 5; return;
  }
  if (e.aggroT > 0 && e.lastAttacker && e.lastAttacker.isPlayer && p.alive && p.growth < 0.5) {
    e.state = 'chase'; e.target = p; e.stateT = 4; return;
  }
  // hunt smaller predators occasionally
  if (d.hunts && e.state !== 'chase' && rnd() < 0.25) {
    for (const o of G.npcs) {
      if (d.hunts.includes(o.species) && dist(e.x, e.y, o.x, o.y) < d.detect && forestShadePx(o.x, o.y) < 0.45) {
        e.state = 'chase'; e.target = o; e.stateT = 5; return;
      }
    }
  }
  if (e.state === 'chase' && e.target) return;
  defaultWander(e);
}

// skittish grazer/scavenger (ornitho, archeornithos, leaellynasaura)
function thinkSkittish(e, d) {
  const p = G.player;
  let threat = null, td = 1e9;
  if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && p.growth > 0.08) {
    const dd = dist(e.x, e.y, p.x, p.y);
    if (dd < d.detect) { threat = p; td = dd; }
  }
  for (const o of G.npcs) {
    if (isPredatorNPC(o.species)) {
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd < d.detect * 0.8 && dd < td) { threat = o; td = dd; }
    }
  }
  if (e.aggroT > 0 && e.lastAttacker) { threat = e.lastAttacker; }
  if (threat) { e.state = 'flee'; e.target = threat; e.stateT = 2.2; return; }
  if (DINO[e.species].diet !== 'herb') {
    const c = nearestCarcass(e.x, e.y, 220, true);
    if (c && c.meat > 20 && rnd() < 0.5) { e.state = 'scavenge'; e.carc = c; e.stateT = 5; return; }
  }
  defaultWander(e, true);
}

// short-fused living fortress (huayangosaurus, kosmoceratops)
// the tank threat scan, shared by every short-fused heavyweight: the nearest
// carnivore worth a swing, with a grudge for whoever drew blood last
// (a hatchling isn't a predator worth the energy — unless it bites first)
function tankThreat(e, d) {
  let threat = null, td = 1e9;
  const p = G.player;
  if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && p.growth > 0.2) {
    const dd = dist(e.x, e.y, p.x, p.y);
    if (dd < d.detect) { threat = p; td = dd; }
  }
  for (const o of G.npcs) {
    if (isPredatorNPC(o.species) && !NPC_DEF[o.species].tank) {
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd < d.detect && dd < td) { threat = o; td = dd; }
    }
  }
  if (e.aggroT > 0 && e.lastAttacker && dist(e.x, e.y, e.lastAttacker.x, e.lastAttacker.y) < d.detect * 1.6) {
    threat = e.lastAttacker;
  }
  return threat;
}
function thinkTank(e, d) {
  // very short detection; kills predators that come too close
  const threat = tankThreat(e, d);
  if (threat) { e.state = 'fight'; e.target = threat; e.stateT = 1.2; return; }
  defaultWander(e, true);
}

// herd hadrosaur (ugrunaaluk, magnapaulia, olorotitan): placid until provoked —
// then the whole herd swings back, hard
function thinkHerdFighter(e, d) {
  const p = G.player;
  if (e.aggroT > 0 && e.lastAttacker) {
    const t = e.lastAttacker;
    const big = t.isPlayer ? p.growth > 0.55 : (NPC_DEF[t.species] || {}).tank;
    if (packmates(e, 300).length >= 1 || !big) { e.state = 'fight'; e.target = t; e.stateT = 3; return; }
    e.state = 'flee'; e.target = t; e.stateT = 3; return;
  }
  // a herd-mate under attack pulls the herd in
  for (const o of G.npcs) {
    if (o !== e && o.species === e.species && o.state === 'fight' && o.target && dist(e.x, e.y, o.x, o.y) < 260) {
      e.state = 'fight'; e.target = o.target; e.stateT = 2.5; return;
    }
  }
  // a stalking carnivore gets the tail before it can strike
  if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && p.growth > 0.25 && dist(e.x, e.y, p.x, p.y) < d.detect * 0.55) {
    e.state = packmates(e, 260).length >= 1 ? 'fight' : 'guard';
    e.target = p; e.stateT = 1.6; return;
  }
  defaultWander(e, true);
}

// the water's king (herrietopus, mawsonia): never flees — it patrols its
// stretch, and answers teeth with tail
function thinkSurfKing(e, d) {
  if (e.aggroT > 0 && e.lastAttacker &&
    dist(e.x, e.y, e.lastAttacker.x, e.lastAttacker.y) < d.reach * 2 + 40) {
    e.state = 'fight'; e.target = e.lastAttacker; e.stateT = 2.5; return;
  }
  if (e.stateT > 0) return;
  for (let k = 0; k < 10; k++) {
    const a = rnd() * TAU, rr = rrange(20, d.homeR);
    const tx = e.home.x + Math.cos(a) * rr, ty = e.home.y + Math.sin(a) * rr;
    if (isWaterPx(tx, ty)) { e.tx = tx; e.ty = ty; break; }
  }
  e.state = rnd() < 0.4 ? 'idle' : 'wander';
  e.stateT = rrange(2, 5);
}

const NPC_THINK = {
  guanlong: thinkPackHunter,
  troodon: thinkPackHunter,
  moros: thinkRunner,
  eotyrannus: thinkRunner,
  ornitho: thinkSkittish,
  archeo: thinkSkittish,
  leaellyna: thinkSkittish,
  huayango: thinkTank,
  kosmo: thinkTank,
  scelido(e, d) {
    const p = G.player;
    if (!p || !p.alive) { defaultWander(e); return; }
    const drinking = e.state === 'drink';
    const detect = drinking ? 42 : d.detect;
    const pd = dist(e.x, e.y, p.x, p.y);
    const carnPlayer = PLAYER_DEF[p.species].diet === 'carn';
    if (e.aggroT > 0 && e.lastAttacker && e.lastAttacker.isPlayer) {
      if (p.growth >= 0.25) { e.state = 'flee'; e.target = p; e.stateT = 3; return; }
      e.state = 'fight'; e.target = p; e.stateT = 3; return;
    }
    if (pd < detect && carnPlayer) {
      if (p.growth < 0.2) { // smacks babies with its tail
        e.state = 'fight'; e.target = p; e.stateT = 2.5; return;
      }
      if (p.growth >= 0.3) { e.state = 'flee'; e.target = p; e.stateT = 3; return; }
      // adolescent: stands its ground
      e.state = 'guard'; e.target = p; e.stateT = 1.5; return;
    }
    defaultWander(e, true);
  },
  grunos(e, d) {
    // the prairie's apex bruiser: fears nothing and hunts even other dinosaurs
    // (hatchlings are beneath its notice — it wants a real meal)
    const p = G.player;
    if (p && p.alive && p.growth > 0.12 && p.growth < 0.75 && playerVisibleTo(e, d.detect)) {
      e.state = 'chase'; e.target = p; e.stateT = 5; return;
    }
    if (e.aggroT > 0 && e.lastAttacker && e.lastAttacker.isPlayer && p.alive) {
      e.state = 'chase'; e.target = p; e.stateT = 4; return;
    }
    if (e.state !== 'chase' && rnd() < 0.3) {
      let best = null, bd = d.detect;
      for (const o of G.npcs) {
        if (!d.hunts.includes(o.species)) continue;
        const dd = dist(e.x, e.y, o.x, o.y);
        if (dd < bd) { bd = dd; best = o; }
      }
      if (best) { e.state = 'chase'; e.target = best; e.stateT = 6; return; }
    }
    if (e.state === 'chase' && e.target) return;
    const c = nearestCarcass(e.x, e.y, 260, false);   // dines wherever it pleases
    if (c && c.meat > 20) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
    defaultWander(e, true);
  },
  lepisosteus: thinkFish,
  bassb: thinkFish,
  scutelich: thinkFish,
  herrie: thinkSurfKing,
  // --- Coastal Scrubs ---
  megoro(e, d) {
    // the ambush crocodile: a drifting shadow offshore. Anything that comes to
    // the waterline is prey — except the tanks, who are simply too big to drag.
    // In the delta it hunts the FISH too (everywhere else it leaves them be),
    // and a quietly fishing dinosaur doesn't read as prey
    if (e.state === 'stalk' || e.state === 'strike' || e.state === 'gripping' || e.state === 'cooldown') return;
    const p = G.player;
    let best = null, bd = d.detect;
    if (p && p.alive && !p.grabbed && !p.fishing && (isWaterPx(p.x, p.y) || nearWaterPx(p.x, p.y, 34))) {
      const dd = dist(e.x, e.y, p.x, p.y);
      if (dd < bd) { bd = dd; best = p; }
    }
    for (const o of G.npcs) {
      if (o === e || o.species === 'megoro') continue;
      const od = NPC_DEF[o.species] || { tank: true };   // mates & babies: too well-guarded
      if (od.tank || (od.aquatic && World.eco !== 'delta')) continue;
      if (!isWaterPx(o.x, o.y) && !nearWaterPx(o.x, o.y, 30)) continue;
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd < bd) { bd = dd; best = o; }
    }
    if (best && (e.tiredT || 0) <= 0) { e.state = 'stalk'; e.target = best; e.stateT = 14; return; }
    // drift the shallows like a log
    if (e.stateT > 0) return;
    for (let k = 0; k < 10; k++) {
      const a = rnd() * TAU, rr = rrange(30, d.homeR);
      const tx = e.home.x + Math.cos(a) * rr, ty = e.home.y + Math.sin(a) * rr;
      if (isWaterPx(tx, ty)) { e.tx = tx; e.ty = ty; break; }
    }
    e.state = 'lurk'; e.stateT = rrange(2.5, 6);
  },
  ugru: thinkHerdFighter,
  charono: thinkTank,
  archaomim(e, d) {
    // ornithomimid with a piston kick: skittish until cornered
    if (e.aggroT > 0 && e.lastAttacker && dist(e.x, e.y, e.lastAttacker.x, e.lastAttacker.y) < 95) {
      e.state = 'fight'; e.target = e.lastAttacker; e.stateT = 1.2; return;
    }
    thinkSkittish(e, d);
  },
  hesper: thinkPackHunter,
  concav(e, d) {
    // pack-brave claw hunter: alone it picks on the small; outmatched, it
    // falls back to the pack — and a pack fears nothing at all
    const p = G.player;
    const mates = packmates(e, 360);
    if (e.aggroT > 0 && e.lastAttacker) {
      const t = e.lastAttacker;
      const big = t.isPlayer ? p.growth > 0.6 : (NPC_DEF[t.species] || {}).tank;
      if (big && !mates.length) {
        const far = packmates(e, 700);
        if (far.length) { e.state = 'rally'; e.target = far[0]; e.stateT = 3; return; }
        e.state = 'flee'; e.target = t; e.stateT = 2.5; return;
      }
      e.state = 'chase'; e.target = t; e.stateT = 5; return;
    }
    if (p && p.alive && p.growth > 0.1 && p.growth < 0.7 && playerVisibleTo(e, d.detect) && (e.tiredT || 0) <= 0) {
      e.state = 'chase'; e.target = p; e.stateT = 5; return;
    }
    if (e.state !== 'chase' && rnd() < 0.25) {
      for (const o of G.npcs) {
        if (d.hunts.includes(o.species) && dist(e.x, e.y, o.x, o.y) < d.detect) {
          e.state = 'chase'; e.target = o; e.stateT = 5; return;
        }
      }
    }
    if (e.state === 'chase' && e.target) return;
    const c = nearestCarcass(e.x, e.y, 240, true);
    if (c && c.meat > 20) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
    defaultWander(e, true);
  },
  // --- Ashfall Ridge ---
  tarbo(e, d) {
    // the tyrant: hunts the player almost to adulthood, and everything smaller
    const p = G.player;
    if (p && p.alive && p.growth > 0.1 && p.growth < 0.9 && playerVisibleTo(e, d.detect) && (e.tiredT || 0) <= 0) {
      e.state = 'chase'; e.target = p; e.stateT = 5; return;
    }
    if (e.aggroT > 0 && e.lastAttacker && e.lastAttacker.isPlayer && p.alive) {
      e.state = 'chase'; e.target = p; e.stateT = 4; return;
    }
    if (e.state !== 'chase' && rnd() < 0.3) {
      let best = null, bd = d.detect;
      for (const o of G.npcs) {
        if (!d.hunts.includes(o.species)) continue;
        const dd = dist(e.x, e.y, o.x, o.y);
        if (dd < bd) { bd = dd; best = o; }
      }
      if (best) { e.state = 'chase'; e.target = best; e.stateT = 6; return; }
    }
    if (e.state === 'chase' && e.target) return;
    const c = nearestCarcass(e.x, e.y, 300, false);   // the tyrant dines where it pleases
    if (c && c.meat > 20) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
    defaultWander(e, true);
  },
  linhe: thinkPackHunter,
  nothro: thinkTank,
  ovi: thinkSkittish,
  shuv: thinkSkittish,
  pinaco: thinkTank,
  // --- Lertentous Delta ---
  magnapaulia: thinkHerdFighter,
  oloro: thinkHerdFighter,
  panoplo: thinkTank,
  atlas: thinkTank,
  wuerho: thinkTank,
  dakota: thinkPackHunter,
  aardi(e, d) {
    // a pack member follows its alpha; the wild ones hunt like any raptor
    // (with the kin truce built into thinkPackHunter)
    if (e.packAlpha) { thinkPackFollower(e, d); return; }
    thinkPackHunter(e, d);
  },
  fluvio(e, d) {
    // the river barge: tank rules for anything with teeth — and between
    // meals it seeks out a leafy tree and rears up to strip the canopy
    const threat = tankThreat(e, d);
    if (threat) { e.state = 'fight'; e.target = threat; e.stateT = 1.2; return; }
    if (e.stateT > 0) return;
    if (rnd() < 0.3) {
      let tree = null, bd = 240;
      for (const t of World.trees) {
        if (t.kind === 2 || t.leaf === 0) continue;   // dead snags have no leaves
        const dd = dist(e.x, e.y, t.x, t.y);
        if (dd < bd) { bd = dd; tree = t; }
      }
      if (tree) {
        e.facing = tree.x > e.x ? 1 : -1;
        if (bd < 40) { e.state = 'browse'; e.stateT = rrange(4.5, 7); e.browseTree = tree; return; }
        e.state = 'wander'; e.tx = tree.x + (e.x > tree.x ? 26 : -26); e.ty = tree.y + 6; e.stateT = 8;
        return;
      }
    }
    defaultWander(e, true);
  },
  mawsonia: thinkSurfKing,
  proto(e, d) {
    // the crested menace: picks fights with anything its own size or a
    // little bigger, and never forgives a slight
    const p = G.player;
    if (e.aggroT > 0 && e.lastAttacker) {
      e.state = 'fight'; e.target = e.lastAttacker; e.stateT = 2.5; return;
    }
    if (p && p.alive && p.growth < 0.55 && dist(e.x, e.y, p.x, p.y) < d.detect) {
      e.state = 'fight'; e.target = p; e.stateT = 2; return;
    }
    defaultWander(e, true);
  },
  yuty(e, d) {
    // the feathered tyrant: fast, bold, hunts most of the delta's mid-sizes
    const p = G.player;
    if (p && p.alive && p.growth > 0.12 && p.growth < 0.85 && playerVisibleTo(e, d.detect) && (e.tiredT || 0) <= 0) {
      e.state = 'chase'; e.target = p; e.stateT = 5; return;
    }
    if (e.aggroT > 0 && e.lastAttacker && e.lastAttacker.isPlayer && p.alive && p.growth < 0.9) {
      e.state = 'chase'; e.target = p; e.stateT = 4; return;
    }
    if (e.state !== 'chase' && rnd() < 0.3) {
      let best = null, bd = d.detect;
      for (const o of G.npcs) {
        if (!d.hunts.includes(o.species)) continue;
        const dd = dist(e.x, e.y, o.x, o.y);
        if (dd < bd) { bd = dd; best = o; }
      }
      if (best) { e.state = 'chase'; e.target = best; e.stateT = 6; return; }
    }
    if (e.state === 'chase' && e.target) return;
    const c = nearestCarcass(e.x, e.y, 280, true);
    if (c && c.meat > 20) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
    defaultWander(e, true);
  },
  lourinha(e, d) {
    // the delta's terror: the ONE predator with no upper size limit — a
    // full-grown morosaurus is still on its menu. Its bite doesn't close
    const p = G.player;
    if (p && p.alive && p.growth > 0.1 && playerVisibleTo(e, d.detect) && (e.tiredT || 0) <= 0) {
      e.state = 'chase'; e.target = p; e.stateT = 5; return;
    }
    if (e.aggroT > 0 && e.lastAttacker && e.lastAttacker.isPlayer && p.alive) {
      e.state = 'chase'; e.target = p; e.stateT = 4; return;
    }
    if (e.state !== 'chase' && rnd() < 0.3) {
      let best = null, bd = d.detect;
      for (const o of G.npcs) {
        if (!d.hunts.includes(o.species)) continue;
        const dd = dist(e.x, e.y, o.x, o.y);
        if (dd < bd) { bd = dd; best = o; }
      }
      if (best) { e.state = 'chase'; e.target = best; e.stateT = 6; return; }
    }
    if (e.state === 'chase' && e.target) return;
    const c = nearestCarcass(e.x, e.y, 300, false);   // dines wherever it pleases
    if (c && c.meat > 20) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
    defaultWander(e, true);
  },
  sino(e, d) {
    // the charger: guards like a tank, but answers threats at a dead run —
    // 'chase' hands it to the windup→lunge machinery, and its lungeT/lungeMul
    // turn that lunge into a full ceratopsian charge
    let threat = null, td = 1e9;
    const p = G.player;
    if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && p.growth > 0.2) {
      const dd = dist(e.x, e.y, p.x, p.y);
      if (dd < d.detect) { threat = p; td = dd; }
    }
    for (const o of G.npcs) {
      if (isPredatorNPC(o.species) && !NPC_DEF[o.species].tank) {
        const dd = dist(e.x, e.y, o.x, o.y);
        if (dd < d.detect && dd < td) { threat = o; td = dd; }
      }
    }
    if (e.aggroT > 0 && e.lastAttacker && dist(e.x, e.y, e.lastAttacker.x, e.lastAttacker.y) < d.detect * 1.6) {
      threat = e.lastAttacker; td = dist(e.x, e.y, e.lastAttacker.x, e.lastAttacker.y);
    }
    if (threat) {
      if (td > 90) { e.state = 'chase'; e.target = threat; e.stateT = 4; }
      else { e.state = 'fight'; e.target = threat; e.stateT = 1.2; }
      return;
    }
    defaultWander(e, true);
  },
  onchop(e, d) {
    // the sawfish: lethal and angry. Anything touching its water is prey —
    // the player, waders, other fish. It does not do 'live and let live'
    const p = G.player;
    if (e.aggroT > 0 && e.lastAttacker && isWaterPx(e.lastAttacker.x, e.lastAttacker.y)) {
      e.state = 'chase'; e.target = e.lastAttacker; e.stateT = 5; return;
    }
    // …but even the saw leaves a quietly fishing dinosaur alone
    if (p && p.alive && !p.fishing && isWaterPx(p.x, p.y) && dist(e.x, e.y, p.x, p.y) < d.detect) {
      e.state = 'chase'; e.target = p; e.stateT = 5; return;
    }
    if (e.state !== 'chase' && rnd() < 0.3) {
      for (const o of G.npcs) {
        if (d.hunts.includes(o.species) && dist(e.x, e.y, o.x, o.y) < d.detect) {
          e.state = 'chase'; e.target = o; e.stateT = 4; return;
        }
      }
    }
    if (e.state === 'chase' && e.target) {
      // prey left the water: the saw stays in the river, seething
      const t = e.target;
      if (!isWaterPx(t.x, t.y)) { e.state = 'wander'; e.target = null; e.stateT = 1; }
      else return;
    }
    thinkFish(e, d);
  },
};
// --- the Wall's minds, mapped to the shared archetypes ---
NPC_THINK.kerbero = thinkTank;          // herd guardian: stands, swings the tail
NPC_THINK.beipiao = thinkTank;          // planted scythe-armed sentry
NPC_THINK.pectino = thinkPackHunter;    // blizzard-chasing scavenger gang
NPC_THINK.nanuq = NPC_THINK.grunos;     // the polar tyrant hunts like the prairie bruiser — everything
NPC_THINK.korean = thinkSkittish;       // tiny, nervous, delicious
NPC_THINK.titanov = function (e, d) {
  // the titan-killer: the ONE hunter with no upper size limit. Where every
  // other predator learns to leave a grown apex alone, this thing commits —
  // a full-grown nivalotitan reads as DINNER, not danger. (True hatchlings
  // below 8% growth are beneath its notice; everyone else is on the menu.)
  const p = G.player;
  if (p && p.alive && p.growth > 0.08 && playerVisibleTo(e, d.detect)) {
    e.state = 'chase'; e.target = p; e.stateT = 6; return;
  }
  if (e.aggroT > 0 && e.lastAttacker && e.lastAttacker.isPlayer && p.alive) {
    e.state = 'chase'; e.target = p; e.stateT = 5; return;
  }
  if (e.state !== 'chase' && rnd() < 0.3) {
    for (const o of G.npcs) {
      if (d.hunts.includes(o.species) && dist(e.x, e.y, o.x, o.y) < d.detect) {
        e.state = 'chase'; e.target = o; e.stateT = 6; return;
      }
    }
  }
  if (e.state === 'chase' && e.target) return;
  const c = nearestCarcass(e.x, e.y, 300, false);
  if (c && c.meat > 30) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
  defaultWander(e, true);
};

function defaultWander(e, mayDrink) {
  // let any in-progress state (rally, chase, flee, drink…) run its timer out
  if (e.stateT > 0) return;
  const r = rnd();
  if (mayDrink && r < 0.14) {
    // find a water edge to drink at (vulnerable while drinking)
    const wp = nearestWaterEdge(e.x, e.y, 420);
    if (wp) { e.state = 'goDrink'; e.tx = wp.x; e.ty = wp.y; e.stateT = 12; return; }
  }
  if (r < 0.42) {
    e.state = 'idle'; e.stateT = rrange(1, 3.2);
  } else if (r < 0.6 && DINO[e.species].diet === 'herb') {
    e.state = 'graze'; e.stateT = rrange(2, 4);
  } else {
    const d = NPC_DEF[e.species] || e.mateDef;   // mates & babies carry their own def
    for (let k = 0; k < 8; k++) {
      const a = rnd() * TAU, rr = rrange(40, d.homeR);
      const tx = e.home.x + Math.cos(a) * rr, ty = e.home.y + Math.sin(a) * rr;
      if (tx < 20 || ty < 20 || tx > WORLD_W - 20 || ty > WORLD_H - 20) continue;
      if (isDeepPx(tx, ty) || isLavaPx(tx, ty) || isCliffPx(tx, ty)) continue;
      if (d.biome === 'plains' && forestShadePx(tx, ty) > 0.4) continue;
      e.tx = tx; e.ty = ty;
      break;
    }
    e.state = 'wander'; e.stateT = rrange(3, 7);
  }
}

function nearestWaterEdge(x, y, maxR) {
  let best = null, bd = maxR;
  for (let k = 0; k < World.waterTiles.length; k += 7) {
    const p = waterTilePos(World.waterTiles[k]);
    const d = dist(x, y, p.x, p.y);
    if (d < bd) { bd = d; best = p; }
  }
  if (!best) return null;
  // stop just short of the water
  const a = angTo(best.x, best.y, x, y);
  return { x: best.x + Math.cos(a) * TILE * 1.4, y: best.y + Math.sin(a) * TILE * 1.4 };
}
function nearestDeepWater(x, y) {
  let best = null, bd = 1e9;
  for (let k = 0; k < World.waterTiles.length; k += 5) {
    const p = waterTilePos(World.waterTiles[k]);
    if (!isDeepPx(p.x, p.y)) continue;
    const dd = dist(x, y, p.x, p.y);
    if (dd < bd) { bd = dd; best = p; }
  }
  return best;
}
function nearestCarcass(x, y, maxR, avoidDanger) {
  let best = null, bd = maxR;
  for (const c of G.carcasses) {
    const d = dist(x, y, c.x, c.y);
    if (d >= bd) continue;
    // scavengers refuse to dine next to a living fortress (huayango, kosmo…)
    if (avoidDanger && G.npcs.some(o => (NPC_DEF[o.species] || {}).tank && dist(c.x, c.y, o.x, o.y) < 150)) continue;
    bd = d; best = c;
  }
  return best;
}

// ---------- mates & babies (the nesting system, driven from main.js) ----------
// A mate is a full-adult NPC of the PLAYER'S species (which has no NPC_DEF),
// so it carries its own def. Babies are the same, tiny.
function makeMate(species, gender) {
  const def = PLAYER_DEF[species];
  const nest = World.nests[species];
  const e = makeNPC_raw(species, nest.x + rrange(-50, 50), nest.y + rrange(40, 80));
  e.isMate = true;
  e.gender = gender;
  e.growth = 1;
  e.hp = e.maxhp = Math.round(def.hp * GENDER_MOD[gender].hp);
  e.mateDef = {
    hp: e.maxhp, dmg: def.dmg, atkCd: def.atkCd, speed: def.speed * 0.9,
    fleeSpeed: def.speed, detect: 280, homeR: 320, reach: def.reach,
    biome: 'any', turn: 2.4, fearless: true, melee: { kb: 160 },
  };
  return e;
}
function makeBaby(species, x, y) {
  const def = PLAYER_DEF[species];
  const e = makeNPC_raw(species, x, y);
  e.isBaby = true;
  e.gender = rnd() < 0.5 ? 'f' : 'm';
  e.growth = 0.06;
  e.hp = e.maxhp = Math.round(def.hp * hpFrac(0.06));
  e.mateDef = {
    hp: e.maxhp, dmg: 0, atkCd: 1, speed: def.speed * 0.85, fleeSpeed: def.speed,
    detect: 200, homeR: 120, reach: 10, biome: 'any', turn: 4, melee: { kb: 40 },
  };
  return e;
}
// the bare entity shell (makeNPC requires an NPC_DEF entry; this doesn't)
function makeNPC_raw(species, x, y) {
  return {
    id: npcSeq++, species, x, y, vx: 0, vy: 0,
    hp: 1, maxhp: 1, growth: 1, submerged: false,
    facing: rnd() < 0.5 ? 1 : -1, phase: rnd() * TAU, move: 0,
    pitch: 0, pitchT: 0, heading: rnd() * TAU, turnRate: 2.5,
    orbitDir: rnd() < 0.5 ? 1 : -1,
    state: 'idle', stateT: rrange(0.5, 2), tx: x, ty: y,
    home: { x, y }, packId: 0,
    atkCd: rrange(0, 0.8), attackT: 0, headDown: 0, hurtT: 0,
    bleed: null, thinkT: rnd() * 0.3, target: null,
    lastAttacker: null, aggroT: 0,
  };
}
// the devoted parent: guards the nest, the eggs and the young with its life
function thinkMate(e, d) {
  const ns = G.nesting;
  const nest = World.nests[e.species];
  // during eggs/babies: anything hungry near the family gets fought
  if (ns && (ns.stage === 'eggs' || ns.stage === 'babies')) {
    let threat = null, td = 300;
    for (const o of G.npcs) {
      if (o === e || isFamily(o) || !isPredatorNPC(o.species)) continue;
      const dd = Math.min(dist(o.x, o.y, nest.x, nest.y),
        ns.babies && ns.babies.length ? Math.min(...ns.babies.map(b => dist(o.x, o.y, b.x, b.y))) : 1e9);
      if (dd < td) { td = dd; threat = o; }
    }
    if (threat) { e.state = 'fight'; e.target = threat; e.stateT = 2; return; }
  }
  if (e.aggroT > 0 && e.lastAttacker) { e.state = 'fight'; e.target = e.lastAttacker; e.stateT = 2.5; return; }
  // courting male: walk to the player and DISPLAY
  const p = G.player;
  if (e.gender === 'm' && ns && ns.stage === 'courting' && p && p.alive) {
    const dd = dist(e.x, e.y, p.x, p.y);
    if (dd > 110) { e.state = 'approach'; e.stateT = 2; return; }
    e.state = 'display'; e.stateT = 2; return;
  }
  // a pack mate (aardiraptor) runs with the pack: follows the alpha, joins
  // the hunt, shares the meals — but never abandons a world nest with eggs
  // or little ones in it (a den brood is safe; then it runs with you)
  const onNestDuty = ns && (ns.stage === 'eggs' || ns.stage === 'babies') && !ns.den;
  if (e.packAlpha && !onNestDuty) { thinkPackFollower(e, d); return; }
  // otherwise: keep to the nest grounds
  if (dist(e.x, e.y, nest.x, nest.y) > 180) { e.state = 'return'; e.home = { x: nest.x, y: nest.y }; e.stateT = 6; return; }
  defaultWander(e, true);
}
// the little ones: stay glued to mother, run from everything with teeth
function thinkBaby(e, d) {
  const ns = G.nesting;
  const p = G.player;
  const guardian = (ns && ns.guardian === 'player') || !G.mate ? p : G.mate;   // orphans follow the player
  for (const o of G.npcs) {
    if (o === e || isFamily(o)) continue;   // never flee your own family
    if (isPredatorNPC(o.species) && dist(e.x, e.y, o.x, o.y) < 150) {
      e.state = 'flee'; e.target = o; e.stateT = 2; return;
    }
  }
  if (guardian && (guardian.isPlayer ? guardian.alive : guardian.hp > 0)) {
    const dd = dist(e.x, e.y, guardian.x, guardian.y);
    if (dd > 60) { e.state = 'follow'; e.target = guardian; e.stateT = 2; return; }
  }
  defaultWander(e, false);
}

// ---------- NPC update ----------
function updateNPC(e, dt) {
  const d = NPC_DEF[e.species] || e.mateDef;
  const wx0 = e.x, wy0 = e.y;              // fish anchor: last known wet position
  e.atkCd = Math.max(0, e.atkCd - dt);
  e.attackT = Math.max(0, e.attackT - dt * 3);
  e.turnCd = Math.max(0, (e.turnCd || 0) - dt);
  e.hurtT = Math.max(0, e.hurtT - dt);
  e.aggroT = Math.max(0, e.aggroT - dt);
  e.tiredT = Math.max(0, (e.tiredT || 0) - dt);
  // pursuit fatigue: a chase that drags on wears the hunter down
  if ((e.state === 'chase' || e.state === 'windup' || e.state === 'lunge' || e.state === 'recover') && e.target === G.player) {
    e.pursuitT = (e.pursuitT || 0) + dt;
  } else {
    e.pursuitT = Math.max(0, (e.pursuitT || 0) - dt * 2);
  }
  e.stateT -= dt;
  // pinned in a wrestler's jaws (or just slammed): no thinking, no moving
  if (e.pinT > 0) {
    e.pinT -= dt;
    e.move = 0;
    return;
  }
  if (e.bleed) {
    bleedTick(e, dt);
    if (e.hp <= 0) {
      floatText(e.x, e.y - 26, DINO[e.species].name + ' bled out', '#d43a2a');
      killNPC(e, e.lastAttacker);
      return;
    }
  }
  // knockback decay
  e.x += e.vx * dt; e.y += e.vy * dt;
  e.vx *= Math.pow(0.02, dt); e.vy *= Math.pow(0.02, dt);

  // a reared-up browser eases back onto all fours the moment it's disturbed
  if (e.state !== 'browse' && e.rear) {
    e.rear = lerp(e.rear, 0, 0.08);
    e.headUp = lerp(e.headUp || 0, 0, 0.1);
    if (e.rear < 0.01) { e.rear = 0; e.headUp = 0; }
  }

  e.thinkT -= dt;
  if (e.thinkT <= 0) {
    e.thinkT = 0.22 + rnd() * 0.08;
    // an attack in motion is committed, and panic can't be reasoned with —
    // don't let thinking interrupt either (a fleeing guanlong must not stop
    // to snack on its fallen friend's carcass)
    const committed = (e.state === 'windup' || e.state === 'lunge' || e.state === 'recover' || e.state === 'flee') && e.stateT > 0;
    const think = e.isMate ? thinkMate : e.isBaby ? thinkBaby : NPC_THINK[e.species];
    if (!committed) think(e, d);
  }

  const sp = d.speed;
  switch (e.state) {
    case 'idle': idleDrift(e, dt); e.headDown = lerp(e.headDown, 0, 0.1); break;
    case 'graze': idleDrift(e, dt); e.headDown = lerp(e.headDown, 1, 0.08); break;
    case 'browse': {
      // planted against the trunk, reared up on the hind legs, neck craning
      // into the canopy (the rear/headUp pose eases back down elsewhere)
      e.headDown = lerp(e.headDown, 0, 0.15);
      e.rear = lerp(e.rear || 0, 1, 0.06);
      e.headUp = lerp(e.headUp || 0, 1, 0.08);
      if (e.stateT <= 0) {
        const t = e.browseTree;
        if (t && t.leaf !== 0) { t.leaf = 0; t.leafRegrow = 60 + rnd() * 45; }   // stripped bare where it fed
        e.browseTree = null;
        e.state = 'idle'; e.stateT = rrange(1.5, 3);
      }
      break;
    }
    case 'wander': {
      e.headDown = lerp(e.headDown, 0, 0.1);
      if (stepToward(e, e.tx, e.ty, sp * 0.45, dt)) { e.state = 'idle'; e.stateT = rrange(1, 3); }
      break;
    }
    case 'goDrink': {
      e.headDown = lerp(e.headDown, 0, 0.1);
      if (stepToward(e, e.tx, e.ty, sp * 0.5, dt) || e.stateT <= 0) { e.state = 'drink'; e.stateT = rrange(5, 9); }
      break;
    }
    case 'drink': {
      idleDrift(e, dt);
      e.headDown = lerp(e.headDown, 1, 0.12);
      if (e.stateT <= 0) { e.state = 'idle'; e.stateT = 1; }
      break;
    }
    case 'rally': {
      e.headDown = 0;
      if (!e.target || e.target.hp <= 0) { e.state = 'idle'; e.stateT = 0.5; break; }
      stepToward(e, e.target.x, e.target.y, sp, dt);
      const mates = packmates(e, 130);
      if (mates.length >= 2) {
        e.state = 'chase'; e.target = G.player; e.stateT = 5;
        // rouse the pack
        for (const m of mates) { m.state = 'chase'; m.target = G.player; m.stateT = 5; }
      }
      if (e.stateT <= 0) { e.state = 'avoid'; e.target = G.player; e.stateT = 2; }
      break;
    }
    case 'avoid': { // skulk at a distance
      e.headDown = 0;
      const t = e.target;
      if (!t) { e.state = 'idle'; e.stateT = 1; break; }
      const dd = dist(e.x, e.y, t.x, t.y);
      if (dd < 150) {
        const a = angTo(t.x, t.y, e.x, e.y);
        stepToward(e, e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60, sp * 0.8, dt);
      } else {
        idleDrift(e, dt);
        faceToward(e, t.x > e.x ? 1 : -1);
      }
      if (e.stateT <= 0) { e.state = 'idle'; e.stateT = 1; }
      break;
    }
    case 'chase': {
      e.headDown = 0;
      const t = e.target;
      const gone = !t || (t.isPlayer ? !t.alive : t.hp <= 0);
      if (gone || e.stateT <= 0) { e.state = 'return'; e.target = null; e.stateT = 6; break; }
      const dd = dist(e.x, e.y, t.x, t.y);
      if (dd > d.detect * 2.2) { e.state = 'return'; e.target = null; e.stateT = 6; break; }
      // a prey that keeps its legs going outlasts the hunter's patience
      if (d.patience && e.pursuitT > d.patience) {
        e.state = 'return'; e.target = null; e.stateT = 6; e.tiredT = 7; e.pursuitT = 0;
        break;
      }
      // chargers (chargeR) launch from way out; everyone else works up close
      const strikeR = d.chargeR || (d.reach + (t.isPlayer ? 8 + 10 * t.growth : bodyRadius(t)) + 14);
      if (dd > strikeR) {
        stepToward(e, t.x, t.y, sp, dt);
      } else {
        // in striking distance: circle the prey, wait for an opening, telegraph
        const packBusy = G.npcs.some(o => o !== e && o.species === e.species &&
          (o.state === 'windup' || o.state === 'lunge') && dist(o.x, o.y, e.x, e.y) < 220);
        if (e.atkCd <= 0 && !packBusy) {
          e.state = 'windup';
          // the tell is the pounce prep: proportional to the dino's size
          // (chargers never telegraph shorter than their old 0.45)
          e.stateT = Math.max(d.chargeR ? 0.45 : 0, pouncePrep(e.species, e.growth));
          e.lungeA = angTo(e.x, e.y, t.x, aimYAt(e, t));   // aim locks here — dodge the lunge!
        } else {
          const selfA = angTo(t.x, t.y, e.x, e.y);
          const oa = selfA + e.orbitDir * 0.85;
          stepToward(e, t.x + Math.cos(oa) * strikeR, t.y + Math.sin(oa) * strikeR, sp * 0.55, dt);
          faceToward(e, t.x > e.x ? 1 : -1);
        }
      }
      e.stateT = Math.max(e.stateT, 0.5);
      if (e.thinkT > 0.2) e.thinkT = 0.2;
      break;
    }
    case 'windup': {
      // the telegraph: plant the feet, open the jaws
      const t = e.target;
      if (!t || (t.isPlayer ? !t.alive : t.hp <= 0)) { e.state = 'idle'; e.stateT = 1; break; }
      e.move = lerp(e.move, 0, 0.3);
      e.facing = t.x > e.x ? 1 : -1;
      e.pitchT = 0;
      e.attackT = Math.max(e.attackT, 0.38);
      if (e.stateT <= 0) {
        // NPC prey can't read a telegraph, so the aim re-locks at the dash
        // itself — only the PLAYER keeps the honest windup-locked dodge window
        if (t && !t.isPlayer) e.lungeA = angTo(e.x, e.y, t.x, aimYAt(e, t));
        e.state = 'lunge';
        e.stateT = d.lungeT || 0.22;   // chargers dash much longer
        e.attackT = 1;
        e.lungeHit = false;
      }
      break;
    }
    case 'lunge': {
      // committed dash along the locked aim — no homing on a PLAYER (dodge
      // it!), but jaws chasing NPC prey are allowed to track a little
      if (e.target && !e.target.isPlayer && e.target.hp > 0) {
        const want = angTo(e.x, e.y, e.target.x, aimYAt(e, e.target));
        let dA = want - e.lungeA;
        while (dA > Math.PI) dA -= TAU;
        while (dA < -Math.PI) dA += TAU;
        e.lungeA += clamp(dA, -2.4 * dt, 2.4 * dt);
      }
      const sp2 = d.speed * (d.lungeMul || 2.4);
      e.x += Math.cos(e.lungeA) * sp2 * dt;
      e.y += Math.sin(e.lungeA) * sp2 * dt;
      e.heading = e.lungeA;
      if (Math.abs(Math.cos(e.lungeA)) > 0.2) e.facing = Math.cos(e.lungeA) > 0 ? 1 : -1;
      e.pitchT = Math.sin(e.lungeA) * 0.3;
      e.move = 1;
      e.phase += dt * sp2 * 0.055;
      const t = e.target;
      if (!e.lungeHit && t && (t.isPlayer ? t.alive : t.hp > 0)) {
        // the bite lands where the jaws are, not wherever the body brushes
        const pt = weaponContact(e, t);
        if (pt) {
          const opts = { kb: (d.melee && d.melee.kb) || 130, hitX: pt.x, hitY: pt.y };
          if (d.biteBleed) opts.bleed = d.biteBleed;   // lourinhanosaurus: the wound stays open
          dealDamage(t, d.dmg * rrange(0.85, 1.15), e, opts);
          e.lungeHit = true;
        }
      }
      if (e.stateT <= 0) {
        e.atkCd = d.atkCd + rrange(0.4, 1.1);
        e.state = 'recover';
        e.stateT = rrange(0.7, 1.2);
        e.recA = t ? angTo(t.x, t.y, e.x, e.y) + rrange(-0.7, 0.7) : e.heading + Math.PI;
      }
      break;
    }
    case 'recover': {
      // backpedal out of range, eyes still on the prey — the counterattack window
      e.x += Math.cos(e.recA) * d.speed * 0.5 * dt;
      e.y += Math.sin(e.recA) * d.speed * 0.5 * dt;
      e.move = lerp(e.move, 0.55, 0.2);
      e.phase += dt * d.speed * 0.03;
      const t = e.target;
      if (t) faceToward(e, t.x > e.x ? 1 : -1);
      e.pitchT = 0;
      if (e.stateT <= 0) { e.state = 'chase'; e.stateT = 4; }
      break;
    }
    case 'fight': { // stand and strike (scelido tail, huayango tail, kosmo horns)
      const t = e.target;
      const gone = !t || (t.isPlayer ? !t.alive : t.hp <= 0);
      if (gone || e.stateT <= 0) { e.state = 'idle'; e.stateT = 1; break; }
      const dd = dist(e.x, e.y, t.x, t.y);
      const effReach = d.reach + (t.isPlayer ? 8 + 10 * t.growth : bodyRadius(t));
      const inRange = dd <= effReach * 0.85;
      // tail-fighters swing what's behind them: in range they turn their back
      // (thagomizer toward you!), everyone else squares up face-first.
      // Mid-whip the stance is committed — no spinning around while the tail
      // is still in the air, even if the knockback threw the target out of range
      const toward = t.x > e.x ? 1 : -1;
      const swinging = DINO[e.species].tailWeapon && e.attackT > 0.15;
      if (!swinging) faceToward(e, DINO[e.species].tailWeapon && inRange ? -toward : toward);
      if (!inRange) stepToward(e, t.x, t.y, sp * 0.9, dt);
      else idleDrift(e, dt);
      // don't stray too far from home (the tanks barely pursue)
      if (d.tank && dist(e.x, e.y, e.home.x, e.home.y) > d.homeR + 80) { e.state = 'return'; e.stateT = 6; break; }
      tryMelee(e, t, d, d.melee || { kb: 150 });
      // the occasional bite (wuerhosaurus): a target standing at its FACE —
      // out of the tail's rear arc — takes a slower, weaker nip instead
      if (d.nip) {
        e.nipCd = Math.max(0, (e.nipCd || 0) - dt);
        if (e.nipCd <= 0) {
          const np = jawContact(e, t);
          if (np) {
            e.nipCd = d.nip.cd;
            dealDamage(t, d.nip.dmg * rrange(0.85, 1.15), e, { kb: 120, hitX: np.x, hitY: np.y });
          }
        }
      }
      break;
    }
    case 'flee': {
      e.headDown = 0;
      const t = e.target;
      if (!t || e.stateT <= 0) { e.state = 'idle'; e.stateT = 1; break; }
      const a = angTo(t.x, t.y, e.x, e.y);
      stepToward(e, e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90, d.fleeSpeed || sp, dt);
      break;
    }
    case 'guard': {
      idleDrift(e, dt);
      if (e.target) faceToward(e, e.target.x > e.x ? 1 : -1);
      if (e.stateT <= 0) { e.state = 'idle'; e.stateT = 0.5; }
      break;
    }
    case 'scavenge': {
      const c = e.carc;
      if (!c || c.meat <= 0 || G.carcasses.indexOf(c) < 0) { e.state = 'idle'; e.stateT = 1; e.carc = null; break; }
      const dd = dist(e.x, e.y, c.x, c.y);
      if (dd > 26) { e.headDown = lerp(e.headDown, 0, 0.1); stepToward(e, c.x, c.y, sp * 0.6, dt); }
      else {
        idleDrift(e, dt);
        e.headDown = lerp(e.headDown, 1, 0.15);
        c.meat -= dt * 6;
        // spooked off the carcass by the player
        const p = G.player;
        if (p && p.alive && dist(e.x, e.y, p.x, p.y) < 60 && p.growth > 0.25) { e.state = 'flee'; e.target = p; e.stateT = 2; }
      }
      if (e.stateT <= 0) { e.state = 'idle'; e.stateT = 1; e.carc = null; }
      break;
    }
    case 'return': {
      e.headDown = 0;
      if (stepToward(e, e.home.x, e.home.y, sp * 0.55, dt) || e.stateT <= 0) { e.state = 'idle'; e.stateT = 2; }
      break;
    }
    case 'approach': {   // the courting male closing in on the female
      const p2 = G.player;
      if (!p2 || !p2.alive) { e.state = 'idle'; e.stateT = 1; break; }
      stepToward(e, p2.x, p2.y, sp * 0.6, dt);
      break;
    }
    case 'display': {
      // THE COURTSHIP DISPLAY: planted feet, deep rhythmic bowing, all
      // presence — telling the female everything about him
      const p2 = G.player;
      idleDrift(e, dt);
      if (p2) faceToward(e, p2.x > e.x ? 1 : -1);
      e.headDown = 0.35 + 0.35 * Math.sin(G.time * 3.2);
      e.phase += dt * 4;
      if (Math.random() < dt * 1.2) {
        floatText(e.x + rrange(-14, 14), e.y - 46 - rrange(0, 10), '♪', '#e8a0c0');
      }
      break;
    }
    case 'follow': {   // a baby trotting after its guardian
      const t = e.target;
      if (!t) { e.state = 'idle'; e.stateT = 1; break; }
      stepToward(e, t.x + rrange(-24, 24), t.y + rrange(-14, 14), sp, dt);
      if (dist(e.x, e.y, t.x, t.y) < 44) { e.state = 'idle'; e.stateT = rrange(0.5, 1.5); }
      break;
    }
    case 'mimic': {   // a pack member sharing the alpha's meal or waterhole
      e.move = lerp(e.move, 0, 0.2);
      e.headDown = lerp(e.headDown || 0, 0.85, 0.1);
      e.hp = Math.min(e.maxhp, e.hp + 6 * dt);
      if (e.stateT <= 0) { e.headDown = 0; e.state = 'idle'; e.stateT = 1; }
      break;
    }
    case 'lured': {
      // drifting toward the quiet shape at the waterside, in cautious pulses
      const p2 = G.player;
      if (!p2 || !p2.alive || !p2.fishing) { e.state = 'wander'; e.stateT = 1; break; }
      const dd = dist(e.x, e.y, p2.x, p2.y);
      if (dd > 26 && Math.sin(G.time * 0.7 + e.id) > -0.25) {
        stepToward(e, p2.x, p2.y, sp * 0.22, dt);
      } else {
        idleDrift(e, dt);
      }
      break;
    }
    // ---- megorontosuchus: the ambush crocodile ----
    case 'lurk': {
      e.submerged = true;
      if (dist(e.x, e.y, e.tx, e.ty) > 8) stepToward(e, e.tx, e.ty, sp * 0.5, dt);
      else idleDrift(e, dt);
      if (e.stateT <= 0) { e.state = 'idle'; e.stateT = 0.4; }
      break;
    }
    case 'stalk': {
      e.submerged = true;
      const t = e.target;
      const gone = !t || (t.isPlayer ? !t.alive : t.hp <= 0);
      if (gone || e.stateT <= 0) { e.state = 'cooldown'; e.stateT = 6; break; }
      // prey wandered away from the waterline: sink back without a ripple
      if (!isWaterPx(t.x, t.y) && !nearWaterPx(t.x, t.y, 44)) { e.state = 'cooldown'; e.stateT = 4; break; }
      stepToward(e, t.x, t.y, sp * 1.9, dt);   // the silent glide
      if (dist(e.x, e.y, t.x, t.y) < 58) {
        e.state = 'strike'; e.stateT = 0.28; e.attackT = 1;
        e.lungeA = angTo(e.x, e.y, t.x, aimYAt(e, t));
        e.strikeHit = false;
        SFX.bite();
      }
      break;
    }
    case 'strike': {
      // the explosion out of the water
      e.submerged = false;
      const sp2 = d.speed * 5;
      e.x += Math.cos(e.lungeA) * sp2 * dt;
      e.y += Math.sin(e.lungeA) * sp2 * dt;
      e.heading = e.lungeA; e.move = 1;
      if (Math.abs(Math.cos(e.lungeA)) > 0.2) e.facing = Math.cos(e.lungeA) > 0 ? 1 : -1;
      const t = e.target;
      if (!e.strikeHit && t) {
        if (t.isPlayer && t.alive && !t.grabbed) {
          const pt = weaponContact(e, t);
          if (pt) {
            e.strikeHit = true;
            // THE GRAB — smash SPACE or be dragged under
            t.grabbed = { croc: e, meter: 0.4, t: 0 };
            dealDamage(t, 25 + 30 * t.growth, e, { kb: 0, hitX: pt.x, hitY: pt.y });
            G.banner = { str: 'SMASH SPACE — BREAK FREE!', t: 2.5, color: '#ff6a5e' };
            e.state = 'gripping'; e.stateT = 30;
            break;
          }
        } else if (!t.isPlayer && t.hp > 0) {
          const pt = weaponContact(e, t);
          if (pt) {
            e.strikeHit = true;
            dealDamage(t, d.dmg * 3, e, { kb: 60, hitX: pt.x, hitY: pt.y });
          }
        }
      }
      if (e.stateT <= 0) { e.state = 'cooldown'; e.stateT = rrange(10, 16); e.tiredT = 8; e.target = null; }
      break;
    }
    case 'gripping': {
      e.submerged = false;
      const p2 = G.player;
      if (!p2 || !p2.alive || !p2.grabbed || p2.grabbed.croc !== e) {
        // the catch broke free (or is past struggling): sink away
        e.state = 'cooldown'; e.stateT = p2 && p2.alive ? 24 : 12;
        e.tiredT = 18; e.target = null;
        break;
      }
      // haul the catch out toward deep water, slow and inevitable
      const dw = nearestDeepWater(e.x, e.y);
      if (dw) stepToward(e, dw.x, dw.y, 36, dt);
      e.attackT = Math.max(e.attackT, 0.5);
      break;
    }
    case 'cooldown': {
      e.submerged = true;
      // slink offshore and wait for the beach to forget
      if (e.stateT > 3) {
        const dw = nearestDeepWater(e.x, e.y);
        if (dw && dist(e.x, e.y, dw.x, dw.y) > 12) stepToward(e, dw.x, dw.y, sp * 0.8, dt);
        else idleDrift(e, dt);
      } else idleDrift(e, dt);
      if (e.stateT <= 0) { e.state = 'lurk'; e.stateT = 1; }
      break;
    }
    default: e.state = 'idle'; e.stateT = 1;
  }

  // ease heading pitch in while moving, out while standing
  e.pitch = lerp(e.pitch || 0, e.move > 0.25 ? (e.pitchT || 0) : 0, Math.min(1, dt * 6));

  const eRad = bodyRadius(e);
  collideStatics(e, eRad);
  // gentle separation between npcs
  for (const o of G.npcs) {
    if (o === e) continue;
    const dd = dist(e.x, e.y, o.x, o.y);
    const min = eRad + bodyRadius(o);
    if (dd < min && dd > 0.001) {
      const a = angTo(o.x, o.y, e.x, e.y);
      e.x += Math.cos(a) * (min - dd) * 0.4;
      e.y += Math.sin(a) * (min - dd) * 0.4;
    }
  }
  // bodies are solid: npcs and the player push each other apart
  // (suspended mid-lunge so a committed bite can actually connect,
  // and while a croc holds the player in its jaws)
  const pl = G.player;
  if (pl && pl.alive && e.state !== 'lunge' && e.state !== 'strike' && e.state !== 'gripping') {
    const min = eRad + 6 + 10 * pl.growth;
    const ddp = dist(e.x, e.y, pl.x, pl.y);
    if (ddp < min && ddp > 0.001) {
      const a = angTo(pl.x, pl.y, e.x, e.y);
      const push = min - ddp;
      e.x += Math.cos(a) * push * 0.5;
      e.y += Math.sin(a) * push * 0.5;
      pl.x -= Math.cos(a) * push * 0.3;
      pl.y -= Math.sin(a) * push * 0.3;
    }
  }
  // a fish stays in the water, no matter what pushed it around this frame
  // (the croc is amphibious — a strike may briefly carry it up the sand)
  if (d.aquatic && !d.amphibious && !isWaterPx(e.x, e.y)) {
    e.x = wx0; e.y = wy0;
    e.vx = 0; e.vy = 0;
    e.stateT = 0;   // pick a new (wet) plan next think
  }
}

// ---------- NPC population ----------
// ---- per-ecosystem spawn tables ----
// One entry per species living in that world: `pack: n` spawns n packs of 3
// near the mud pools, `n` spawns loose individuals, `min` is the population
// floor maintainPopulation refills to, `away: true` keeps spawns off the
// nests. Placement comes from NPC_DEF.biome. Adding a species to a world —
// or a whole new world — is one line here.
const ECO_SPAWNS = {
  valley: [
    { sp: 'guanlong', pack: 3, min: 7 },
    { sp: 'moros', n: 3, min: 3 },
    { sp: 'ornitho', n: 6, min: 5 },
    { sp: 'scelido', n: 4, min: 4, away: true },
    { sp: 'huayango', n: 2, min: 2, away: true },
  ],
  prairie: [
    { sp: 'troodon', pack: 3, min: 7 },
    { sp: 'eotyrannus', n: 3, min: 3 },
    { sp: 'grunos', n: 2, min: 2, away: true },
    { sp: 'archeo', n: 5, min: 4 },
    { sp: 'leaellyna', n: 5, min: 4 },
    { sp: 'kosmo', n: 3, min: 3, away: true },
    { sp: 'lepisosteus', n: 10, min: 9 },
  ],
  coast: [
    { sp: 'megoro', n: 2, min: 2 },
    // herds of 3-4, sometimes a loner or a pair — out on the open grass
    { sp: 'ugru', pack: 3, sizes: [3, 4, 3, 4, 2, 1], den: 'plains', min: 8 },
    { sp: 'archaomim', n: 5, min: 4 },
    { sp: 'hesper', pack: 2, min: 5 },
    { sp: 'concav', n: 3, min: 3, away: true },
    { sp: 'charono', n: 2, min: 2, away: true },
    { sp: 'lepisosteus', n: 8, min: 7 },
    { sp: 'bassb', n: 5, min: 4 },
    { sp: 'herrie', n: 2, min: 2 },
    { sp: 'scutelich', n: 4, min: 3 },
  ],
  ash: [
    { sp: 'tarbo', n: 2, min: 2, away: true },
    { sp: 'linhe', pack: 2, sizes: [4, 4, 3], min: 6 },
    { sp: 'nothro', n: 2, min: 2, away: true },
    { sp: 'ovi', n: 4, min: 3 },
    { sp: 'shuv', n: 5, min: 4 },
    { sp: 'pinaco', n: 3, min: 3, away: true },
  ],
  // the delta is FOUR TIMES the land — and it is crowded. Herds on the
  // islands, packs in the gallery woods, monsters in every channel
  delta: [
    // the delta's crocodiles cruise the inland channels — and here, they
    // hunt the FISH (biome overrides the def's 'sea' placement)
    { sp: 'megoro', n: 3, min: 3, biome: 'lake' },
    { sp: 'magnapaulia', pack: 3, sizes: [3, 4, 2, 3], den: 'plains', min: 8 },
    { sp: 'oloro', pack: 2, sizes: [3, 4], den: 'plains', min: 5 },
    { sp: 'panoplo', n: 5, min: 4, away: true },
    { sp: 'proto', pack: 3, sizes: [2, 3, 3], min: 7 },
    { sp: 'atlas', n: 2, min: 2, away: true },
    { sp: 'dakota', pack: 4, sizes: [4, 3, 4, 3], min: 11 },
    // wild aardiraptor packs: kin to an aardiraptor player, recruits-in-waiting
    { sp: 'aardi', pack: 3, sizes: [3, 4, 3], min: 8 },
    { sp: 'yuty', n: 3, min: 3, away: true },
    { sp: 'wuerho', n: 3, min: 3, away: true },
    { sp: 'fluvio', n: 4, min: 3, away: true },
    { sp: 'sino', n: 4, min: 4, away: true },
    { sp: 'lourinha', n: 2, min: 2, away: true },
    // every fish in the game lives here — plus the delta's own two
    { sp: 'lepisosteus', n: 14, min: 12 },
    { sp: 'bassb', n: 8, min: 6 },
    { sp: 'herrie', n: 3, min: 2 },
    { sp: 'scutelich', n: 6, min: 5 },
    { sp: 'onchop', n: 4, min: 3 },
    { sp: 'mawsonia', n: 2, min: 2 },
  ],
  // the Nivalotitan Wall — herds to huddle with, gangs to fear, one king…
  // and ONE titan-killer walking the whole mountain
  wall: [
    { sp: 'kerbero', pack: 3, sizes: [4, 3, 4, 2], den: 'plains', min: 9 },
    { sp: 'beipiao', n: 4, min: 3, away: true },
    { sp: 'pectino', pack: 3, sizes: [3, 4, 3], min: 8 },
    { sp: 'korean', n: 8, min: 5 },
    { sp: 'nanuq', n: 2, min: 2, away: true },
    { sp: 'titanov', n: 1, min: 1, away: true },
  ],
};
function spawnPosFor(sp, i, biomeOverride) {
  const biome = biomeOverride || NPC_DEF[sp].biome;
  if (biome === 'water') return randWaterPos();
  if (biome === 'sea') return randSeaPos();
  if (biome === 'lake') return randLakePos();
  if (biome === 'beach') return randBeachPos();
  if (biome === 'forest') return randForestPos();
  if (biome === 'any') return i % 2 ? randPlainsPos() : randForestPos();
  return randPlainsPos();
}
function awayFromNests(posFn) {
  for (let k = 0; k < 25; k++) {
    const p = posFn();
    if (!nearAnyNest(p.x, p.y, 420)) return p;
  }
  return posFn();
}
function spawnPack(species, count, sizes, den) {
  // hunter packs den near the mud pools; herds (den: 'plains') out on the grass
  for (let pk = 0; pk < count; pk++) {
    let cx, cy;
    if (den === 'plains' || !World.mudPools.length) {
      // herds den on the open grass — and so does everyone on worlds
      // without mud pools (the Wall has snow where the wallows would be)
      const pp = awayFromNests(randPlainsPos);
      cx = pp.x; cy = pp.y;
    } else {
      const pool = World.mudPools[pk % World.mudPools.length];
      cx = pool.x + rrange(-90, 90); cy = pool.y + rrange(-90, 90);
    }
    const size = sizes ? sizes[Math.floor(rnd() * sizes.length)] : 3;
    for (let i = 0; i < size; i++) {
      let gx = cx, gy = cy;
      for (let k = 0; k < 12; k++) {
        gx = cx + rrange(-60, 60); gy = cy + rrange(-60, 60);
        if (!isWaterPx(gx, gy) && !isLavaPx(gx, gy) && !isCliffPx(gx, gy)) break;
      }
      G.npcs.push(makeNPC(species, clamp(gx, 30, WORLD_W - 30), clamp(gy, 30, WORLD_H - 30), pk + 1));
    }
  }
}
function spawnInitialNPCs() {
  G.npcs.length = 0;
  for (const spec of ECO_SPAWNS[World.eco]) {
    if (spec.pack) { spawnPack(spec.sp, spec.pack, spec.sizes, spec.den); continue; }
    for (let i = 0; i < spec.n; i++) {
      const pos = spec.away ? awayFromNests(() => spawnPosFor(spec.sp, i, spec.biome)) : spawnPosFor(spec.sp, i, spec.biome);
      G.npcs.push(makeNPC(spec.sp, pos.x, pos.y));
    }
  }
}
function maintainPopulation() {
  const counts = {};
  for (const e of G.npcs) counts[e.species] = (counts[e.species] || 0) + 1;
  for (const spec of ECO_SPAWNS[World.eco]) {
    if ((counts[spec.sp] || 0) < spec.min) {
      for (let k = 0; k < 30; k++) {
        const pos = spawnPosFor(spec.sp, k, spec.biome);
        if (G.player && dist(pos.x, pos.y, G.player.x, G.player.y) < 500) continue;
        G.npcs.push(makeNPC(spec.sp, pos.x, pos.y));
        break;
      }
    }
  }
}

// ---------- player update ----------
function updatePlayer(dt) {
  const p = G.player;
  if (!p.alive) return;
  const def = PLAYER_DEF[p.species];
  const input = G.input;

  p.atkCd = Math.max(0, p.atkCd - dt);
  p.attackT = Math.max(0, p.attackT - dt * 3.2);
  p.hurtT = Math.max(0, p.hurtT - dt);

  // bleed on player
  if (p.bleed) {
    bleedTick(p, dt);
    if (p.hp <= 0) { killPlayer('blood loss'); return; }
  }

  // knockback
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);

  // ------ in the crocodile's jaws: the escape QTE owns this frame ------
  if (p.grabbed) {
    const gr = p.grabbed;
    const croc = gr.croc;
    if (!croc || croc.hp <= 0) { p.grabbed = null; return; }   // saved by someone else's fight
    gr.t += dt;
    gr.meter -= dt * 0.22;                                     // the grip tightens on its own
    if (input.attack) {
      input.attack = false;
      // every SPACE is a thrash — small dinos thrash smaller, and the
      // heavyweights (cristatusaurus) are too strong to hold at all
      gr.meter += (0.065 + 0.035 * p.growth) * (def.thrashMul || 1);
      G.shake = Math.min(6, G.shake + 1.5);
      SFX.bite();
      bloodBurst(p.x, p.y, 1);
    }
    // pinned in the jaws while it hauls you toward deep water
    const wz = weaponPos(croc);
    p.x = wz.x; p.y = wz.y;
    p.move = 0; p.headDown = 0;
    p.phase += dt * 14;                                        // frantic thrashing
    G.prompt = '';
    if (gr.meter >= 1) {
      // FREE! — the croc wants nothing more to do with you
      p.grabbed = null;
      const a = shallowDir(p.x, p.y);
      p.x += Math.cos(a) * 14; p.y += Math.sin(a) * 14;
      p.vx = Math.cos(a) * 240; p.vy = Math.sin(a) * 240;
      floatText(p.x, p.y - 48, 'BROKE FREE!', '#8ad04e');
      G.banner = { str: 'You broke free — OUT OF THE WATER!', t: 3, color: '#8ad04e' };
      SFX.stage();
    } else if (gr.meter <= 0) {
      killPlayer('dragged under by Megorontosuchus');
    }
    return;
  }

  // ------ the wrestle QTE owns the frame while a hold is on ------
  if (G.wrestle) {
    const w = G.wrestle, t = w.t;
    if (!t || t.hp <= 0) {
      G.wrestle = null;
    } else {
      // the hold: neck and body clamped in the jaws, dragged with each shake
      t.pinT = 0.3;
      const wz = weaponPos(p);
      t.x = lerp(t.x, wz.x + p.facing * 6, 0.35);
      t.y = lerp(t.y, p.y + 2, 0.35);
      t.facing = -p.facing;
      t.move = 0;
      p.move = lerp(p.move, 0, 0.3);
      p.headDown = lerp(p.headDown, 0.25, 0.2);
      w.keyT -= dt;
      const pressed = w.pressed;
      w.pressed = null;
      if (pressed) {
        if (pressed === w.seq[w.idx]) {
          w.idx++;
          w.keyT = w.window;
          p.attackT = 1;                      // a violent shake of the head
          SFX.bite();
          G.shake = Math.min(6, G.shake + 2);
          bloodBurst(t.x, t.y - 8, 1);
          dealDamage(t, playerDmg() * 0.35, p, { kb: 0 });
          if (t.hp > 0 && w.idx >= w.seq.length) {
            // PINNED — the slam
            dealDamage(t, playerDmg() * rrange(1.6, 2.0), p, { kb: 260 });
            if (t.hp > 0) t.pinT = 2.5;
            floatText(t.x, t.y - 52, 'SLAMMED!', '#ffd23e');
            G.banner = { str: 'PINNED! The ' + DINO[t.species].name + ' is down.', t: 3, color: '#ffd23e' };
            G.shake = 10;
            G.wrestle = null;
            p.atkCd = 0.6;
          } else {
            floatText(t.x, t.y - 44, '✓', '#8ad04e');
          }
        } else {
          failWrestle(p, t);
        }
      } else if (w.keyT <= 0) {
        failWrestle(p, t);
      }
      if (G.wrestle) { G.prompt = 'WRESTLE!'; return; }
    }
  }

  // ------ stunned: thrown off a wrestle — the world spins ------
  if (p.stunT > 0) {
    p.stunT -= dt;
    p.move = lerp(p.move, 0, 0.2);
    p.headDown = lerp(p.headDown, 0.4, 0.1);
    if (Math.random() < dt * 6) floatText(p.x + rrange(-10, 10), p.y - 46 - rrange(0, 12), '✶', '#ffd23e');
    collideStatics(p, 6 + 10 * p.growth);
    G.prompt = 'stunned!';
    return;
  }

  // ------ THE COLD (the Nivalotitan Wall only) ------
  // The mountain drains warmth every second you stand in the open: the cold
  // bar climbs, and the colder you are the SLOWER you move. At 100 you
  // freeze solid — locked in place, hp draining — and if you live to thaw,
  // you come out still half-frozen. Shelter is everything: resting lowers
  // cold, caves cut the wind, and huddling near other dinos shares warmth.
  p.coldSlow = 1;
  if (World.snowy) {
    // frozen solid: like the stun, the freeze owns the whole frame
    if (p.frozenT > 0) {
      p.frozenT -= dt;
      p.move = lerp(p.move, 0, 0.3);
      p.hp -= 6 * dt;                          // the cold keeps taking
      if (p.hp <= 0) { killPlayer('the cold'); return; }
      if (Math.random() < dt * 5) floatText(p.x + rrange(-10, 10), p.y - 46 - rrange(0, 12), '❄', '#cfeefc');
      if (p.frozenT <= 0) { p.cold = 68; floatText(p.x, p.y - 50, 'thawed… barely', '#a8dcf0'); }
      collideStatics(p, 6 + 10 * p.growth);
      G.prompt = 'FROZEN SOLID — hold on…';
      return;
    }
    const resist = def.coldResist || 0;
    const cave = caveAt(p.x, p.y);
    // huddling: any warm body close by slows the wind's work
    let huddle = 0;
    for (const e of G.npcs) if (Math.abs(e.x - p.x) < 70 && Math.abs(e.y - p.y) < 70 && !DINO[e.species].fish) huddle++;
    if (G.mate && Math.abs(G.mate.x - p.x) < 70 && Math.abs(G.mate.y - p.y) < 70) huddle++;
    if (cave || p.resting) {
      // shelter: the bar runs backwards (faster curled up inside with company)
      p.cold = Math.max(0, p.cold - (2.6 + (cave ? 2.6 : 0) + huddle * 0.8) * dt);
    } else {
      // exposure: worse up high (north), worse at night, softened by a thick
      // coat (coldResist), by huddling — and multiplied by a blizzard
      const alt = 1 + 0.8 * (1 - p.y / WORLD_H);
      const night = 1 + 0.6 * ((G.day && G.day.nightF) || 0);
      const storm = G.blizzard && G.blizzard.on ? 3.5 : 1;
      const shelter = Math.max(0.3, 1 - huddle * 0.35);
      p.cold = Math.min(100, p.cold + 1.35 * alt * night * storm * shelter * (1 - resist) * dt);
    }
    p.coldSlow = 1 - 0.4 * Math.pow(p.cold / 100, 1.3);   // cold legs are slow legs
    if (p.cold >= 100) {
      p.frozenT = 5 + rnd() * 3;
      p.resting = false; p.pounce = null;
      floatText(p.x, p.y - 52, '❄ FROZEN SOLID ❄', '#eaf6ff');
      G.banner = { str: 'The cold takes you. Hold on…', t: 3, color: '#a8dcf0' };
    }
    // ---- THE SECRET ----
    // One hidden cave holds the frozen giant the mountain is named for.
    // Stand before it once, and Nivalotitan is yours forever.
    if (cave && cave.secret && !Save.owned.nivalo) {
      Save.owned.nivalo = true;
      saveSave();
      G.banner = { str: 'THE FROZEN GIANT… Nivalotitan remembers you. NEW DINOSAUR UNLOCKED!', t: 8, color: '#a8dcf0' };
      floatText(p.x, p.y - 64, '❄ NIVALOTITAN ❄', '#eaf6ff');
      G.shake = 5;
      try { SFX.stage(); } catch (e) { }
    }
  }

  // ------ resting (R): settle down, heal, let the clock run slow ------
  if (input.rest) {
    input.rest = false;
    if (!p.fishing && p.actionT <= 0) {
      p.resting = !p.resting;
      if (p.resting) floatText(p.x, p.y - 48, 'resting…', '#cbb98a');
    }
  }

  // ------ pounce / tail-swing (hold CTRL, or the touch button) ------
  // press-and-hold WITH a direction: the dino coils (prep ∝ size), then leaps
  // (length ∝ speed) and the bite fires at the landing. Release during the
  // coil and nothing happens. A tail-fighter plants instead of leaping: the
  // tail scythes continuously until release, but the feet never move.
  const tailPow = !!DINO[p.species].tailWeapon;
  if (input.pounceHold && !p.pounce && !p.pounceLatch &&
      p.atkCd <= 0 && p.actionT <= 0 && !p.fishing && !G.wrestle) {
    let pdx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let pdy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (tailPow || pdx || pdy) {
      const l = Math.hypot(pdx, pdy) || 1;
      p.pounce = { phase: 'prep', t: pouncePrep(p.species, p.growth), dirX: pdx / l, dirY: pdy / l };
      p.pounceLatch = true;   // one pounce per press — release to re-arm
      p.resting = false;
    }
  }
  if (!input.pounceHold) p.pounceLatch = false;

  // action animation (eat / drink) locks movement briefly
  let pitchTarget = 0;
  if (p.fishing) {
    // ------ FISHING (spinosaurids): crouched dead-still at the waterside.
    // The fish drift in on their own time; SPACE is the strike ------
    const moving = input.left || input.right || input.up || input.down;
    if (moving || !(isWaterPx(p.x, p.y) || nearWaterPx(p.x, p.y, 30))) {
      p.fishing = false;
    } else if (input.attack) {
      // THE STRIKE: any fish that drifted into reach is a one-shot catch
      input.attack = false;
      p.attackT = 1; p.atkCd = def.atkCd;
      SFX.bite();
      const wz = weaponPos(p);
      let bestF = null, bfd = 1e9, bpt = null;
      for (const e of G.npcs) {
        if (!DINO[e.species].fish) continue;
        // the strike is a downward PLUNGE: the jaws come all the way down to
        // the surface, so this test stays at water level (no height lift)
        const c = bodyHitPoint(e, wz.x, wz.y, wz.r + def.reach + 16);
        if (!c) continue;
        const dd = dist(wz.x, wz.y, c.x, c.y);
        if (dd < bfd) { bfd = dd; bestF = e; bpt = c; }
      }
      if (bestF) {
        floatText(bestF.x, bestF.y - 24, 'CAUGHT!', '#ffd23e');
        dealDamage(bestF, bestF.hp + 999, p, { kb: 0, hitX: bpt.x, hitY: bpt.y });
      } else {
        floatText(p.x, p.y - 48, 'the water scatters…', '#9cc4d0');
      }
      p.fishing = false;
    } else {
      p.headDown = lerp(p.headDown, 0.85, 0.1);
      p.move = lerp(p.move, 0, 0.3);
      if (Math.random() < dt * 0.4) floatText(p.x, p.y - 52, '· · ·', '#bcd8dc');
    }
  } else if (p.actionT > 0) {
    p.actionT -= dt;
    if (p.action && (p.action.kind === 'browse' || p.action.kind === 'swallow')) {
      // canopy browsing and swallowing: the head goes UP, not down —
      // a swallow adds the rapid jaw-snap (p.gulp) as the food sinks in
      p.headUp = lerp(p.headUp || 0, 1, 0.15);
      p.headDown = lerp(p.headDown, 0, 0.25);
      p.gulp = p.action.kind === 'swallow';
    } else {
      p.headDown = lerp(p.headDown, 1, 0.2);
    }
    p.move = lerp(p.move, 0, 0.25);
    if (p.actionT <= 0) finishAction(p);
  } else if (p.pounce) {
    const P = p.pounce;
    if (P.phase === 'prep') {
      // coiled and planted: jaws open, spring loading — the tell
      p.move = lerp(p.move, 0, 0.3);
      p.attackT = Math.max(p.attackT, 0.38);
      p.headDown = lerp(p.headDown, tailPow ? 0 : 0.3, 0.15);
      P.t -= dt;
      if (!input.pounceHold) {
        p.pounce = null;   // let go mid-coil: cancelled, no leap
      } else if (P.t <= 0) {
        if (tailPow) {
          P.phase = 'swing'; P.t = 0.01;
        } else {
          P.phase = 'jump'; P.t = 0.26;
          // HIGH POUNCE (the Wall): launched off a rock wall, the leap flies
          // 1.7× farther and the landing bite hits 1.6× harder — death from above
          P.high = isCliffPx(p.x, p.y);
          const spd = pounceDist(def.speed * genderMod(p).speed) * (P.high ? 1.7 : 1) / 0.26;
          P.vx = P.dirX * spd; P.vy = P.dirY * spd;
          if (P.dirX) p.facing = P.dirX > 0 ? 1 : -1;
          p.attackT = 1;
          if (P.high) floatText(p.x, p.y - 54, '⇓ DEATH FROM ABOVE ⇓', '#eaf6ff');
          SFX.bite();
        }
      }
    } else if (P.phase === 'jump') {
      // airborne: committed like an NPC lunge — the bite waits at the landing
      P.t -= dt;
      p.x += P.vx * dt; p.y += P.vy * dt;
      p.move = 1;
      p.phase += dt * Math.hypot(P.vx, P.vy) * 0.055;
      pitchTarget = P.dirY * 0.35;
      if (P.t <= 0) {
        p.pounce = null;
        input.attack = true;   // the landing bite: the normal attack, right here
        p.atkCd = 0;
        // a leap that lands ON the prey buries you in it — the anti-back-bite
        // side guard would reject the overlap, so the landing bite waives it
        p.landBite = true;
        p.landBiteMul = P.high ? 1.6 : 1;   // height turns into hurt
      }
    } else {
      // swing: locked in place, the tail scythes on a metronome while held —
      // double the usual cadence is the power, the planted feet the price
      p.move = lerp(p.move, 0, 0.3);
      P.t -= dt;
      if (P.t <= 0) { input.attack = true; p.atkCd = 0; P.t = 0.55; }
      if (!input.pounceHold) p.pounce = null;
    }
  } else if (p.resting) {
    // settled on the ground: no moving around — any step gets you up
    if (input.left || input.right || input.up || input.down) p.resting = false;
    p.move = lerp(p.move, 0, 0.25);
    p.headDown = lerp(p.headDown, 0.12, 0.08);   // a soft doze, not a graze
    if (Math.random() < dt * 0.25) floatText(p.x + rrange(-6, 6), p.y - 52, 'z', '#cbb98a');
  } else {
    p.headDown = lerp(p.headDown, 0, 0.15);
    p.headUp = lerp(p.headUp || 0, 0, 0.12);
    p.gulp = false;
    // movement
    let dx = 0, dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    const moving = dx !== 0 || dy !== 0;
    input.sprinting = false;
    if (moving) {
      const l = Math.hypot(dx, dy); dx /= l; dy /= l;
      // qianzhousaurus starts slow and only becomes the prairie's fastest when grown
      const curve = def.slowStart ? 0.5 + 0.5 * p.growth : 0.62 + 0.38 * p.growth;
      let terr = terrainSpeedAt(p.x, p.y);
      if (def.swim && isWaterPx(p.x, p.y)) terr = def.swimMul || 1.15;   // a swimmer glides through water
      let sp = def.speed * genderMod(p).speed * curve * terr * (p.coldSlow || 1);
      if (input.sprint && !p.exhausted && p.stamina > 0) {
        sp *= def.sprint;
        p.stamina -= 20 * dt;
        input.sprinting = true;
        if (p.stamina <= 0) { p.stamina = 0; p.exhausted = true; }
      }
      p.x += dx * sp * dt;
      p.y += dy * sp * dt;
      if (dx !== 0) p.facing = dx > 0 ? 1 : -1;
      // nose leads into the heading; a touch of forward lean when sprinting
      pitchTarget = dy * 0.32 + (input.sprinting ? 0.05 : 0);
      p.move = lerp(p.move, 1, 0.2);
      p.phase += dt * sp * 0.055;
      // splash / mud footsteps
      if (Math.random() < dt * 4) {
        if (isWaterPx(p.x, p.y)) G.particles.push({ x: p.x, y: p.y, vx: rrange(-18, 18), vy: -rrange(10, 40), t: 0, life: 0.4, r: 1.3, color: '#bcd8dc', grav: 300 });
        else if (isMudPx(p.x, p.y)) G.particles.push({ x: p.x, y: p.y, vx: rrange(-14, 14), vy: -rrange(8, 30), t: 0, life: 0.45, r: 1.5, color: '#4e3826', grav: 300 });
      }
    } else {
      p.move = lerp(p.move, 0, 0.15);
    }
  }
  p.pitch = lerp(p.pitch, pitchTarget, Math.min(1, dt * 8));
  // the sit-down/get-up transition drawDino animates from
  p.restT = clamp((p.restT || 0) + (p.resting ? 2.2 : -2.8) * dt, 0, 1);
  if (!G.input.sprinting) {
    p.stamina = Math.min(def.stamMax, p.stamina + 13 * dt);
    if (p.exhausted && p.stamina > 20) p.exhausted = false;
  }

  collideStatics(p, 6 + 10 * p.growth);

  // ------ needs decay (resting slows the clock) ------
  const drain = 1 - 0.35 * (p.restT || 0);
  p.food = Math.max(0, p.food - dt * (100 / 300) * drain);
  p.water = Math.max(0, p.water - dt * (100 / 240) * drain);
  p.hygiene = Math.max(0, p.hygiene - dt * (100 / 420) * drain);
  // mud bath restores hygiene
  if (isMudPx(p.x, p.y)) {
    if (p.hygiene < 100 && Math.random() < dt * 3) G.particles.push({ x: p.x + rrange(-8, 8), y: p.y - 10, vx: rrange(-8, 8), vy: -20, t: 0, life: 0.6, r: 1.6, color: '#5d4430', grav: 100 });
    p.hygiene = Math.min(100, p.hygiene + 13 * dt);
  }
  // lava: crossable, but it BURNS — a shortcut you pay for in hide
  if (isLavaPx(p.x, p.y)) {
    p.hp -= 55 * dt;
    p.hurtT = Math.max(p.hurtT, 0.1);
    if (Math.random() < dt * 10) {
      G.particles.push({ x: p.x + rrange(-8, 8), y: p.y - 6, vx: rrange(-10, 10), vy: -rrange(30, 70), t: 0, life: 0.5, r: 1.4, color: Math.random() < 0.5 ? '#ff9a3e' : '#e0611f', grav: -40 });
    }
    if (Math.random() < dt * 1.5) floatText(p.x, p.y - 44, 'BURNING!', '#ff8a4e');
    if (p.hp <= 0) { killPlayer('the lava'); return; }
  }
  // starvation / dehydration / filth
  if (p.food <= 0) p.hp -= 2.2 * dt;
  if (p.water <= 0) p.hp -= 3.2 * dt;
  if (p.hygiene <= 18) p.hp -= 0.6 * dt;
  if (p.hp <= 0) { killPlayer(p.water <= 0 ? 'dehydration' : p.food <= 0 ? 'starvation' : 'sickness'); return; }
  // regen when well fed — and much faster curled up resting
  if (p.food > 45 && p.water > 45 && p.hp < playerMaxHp()) {
    p.hp = Math.min(playerMaxHp(), p.hp + 4.5 * (1 + 1.2 * (p.restT || 0)) * dt);
  }

  // ------ growth ------
  // a dirty dino doesn't grow: hygiene must stay above 60 (mud baths fix it)
  if (p.food > 25 && p.water > 25 && p.hygiene > 60 && p.growth < 1) {
    const old = p.growth;
    p.growth = Math.min(1, p.growth + dt / 540 * (def.growthRate || 1));
    checkStage(p, old);
  }

  // ------ growths currency: living pays out every minute, bigger pays more ------
  p.earnT = (p.earnT || 0) + dt;
  if (p.earnT >= 60) {
    p.earnT -= 60;
    if (typeof awardGrowths === 'function') {
      awardGrowths(Math.max(1, Math.round((2 + 6 * p.growth) * (def.earnMul || 1) * genderMod(p).earn)), p.x, p.y - 46);
    }
  }

  // ------ attack ------
  if (input.attack && p.atkCd <= 0 && p.actionT <= 0) {
    input.attack = false;
    p.resting = false;                    // up and biting
    p.atkCd = def.atkCd;
    p.attackT = 1;
    // tail-fighters (gigantspinosaurus) swing what's BEHIND them: the weapon
    // zone sits over the tail and only rear-side contact counts — turn your
    // back on what you want to hit. Biters hop forward, swingers rock back.
    const tailFighter = !!DINO[p.species].tailWeapon;
    // swingers rock back, biters hop forward — and a headbutt DRIVES forward
    // (no kick mid tail-swing: the power's whole deal is planted feet)
    if (!p.pounce) p.vx += p.facing * (tailFighter ? -45 : DINO[p.species].headButt ? 105 : 70);
    SFX.bite();
    // the attack comes from the weapon: jaws forward, or the tail arc behind —
    // running away and snapping backwards no longer connects
    // the attack is EXACTLY the weapon circle the H overlay draws (contact
    // pad included, identical to NPCs) — you hit what you see, nothing else.
    // Arm-and-jaw fighters (spinosaurus) strike with BOTH: the bite circle
    // at the snout plus the claw sweep over the chest, so point-blank prey
    // that slips inside the long jaws still catches the arms
    // biters swing the full strike arc (jaw-line down to shin-line);
    // tail- and claw-fighters keep their single sweep circle
    const zones = DINO[p.species].tailWeapon || DINO[p.species].clawWeapon
      ? [weaponCircle(p)] : biteZones(p);
    if (DINO[p.species].armAndJaw) zones.push(clawArcCircle(p));
    // a pounce PINS what it lands on: the underbody is a contact zone too,
    // down near the ground where the prey actually is — the raised jaw circle
    // alone can graze clean over a small dino you're standing on
    if (p.landBite) zones.push(pounceLandZone(p));
    let best = null, bestPt = null, bd = 1e9;
    for (const e of G.npcs) {
      // no friendly fire: never your packmates, your babies, or your mate
      if (e.packAlpha || e.isBaby || e === G.mate) continue;
      // any part of the victim's body counts — but only on the weapon's side
      for (const z of zones) {
        const pt = bodyHitPoint(e, z.x, z.y, z.r);
        if (!pt) continue;
        const side = (pt.x - p.x) * p.facing;
        if (tailFighter ? side > 8 : (side < -2 && !p.landBite)) continue;
        const dd = dist(z.x, z.y, pt.x, pt.y);
        if (dd < bd) { bd = dd; best = e; bestPt = pt; }
      }
    }
    if (best) {
      // a horn strike launches its victim — bites just stagger them
      const opts = { hitX: bestPt.x, hitY: bestPt.y, kb: DINO[p.species].headButt ? 180 : 90 };
      // a big bite makes armored herbivores bleed — bite and retreat!
      // (bleedMul: tyrannotitan's whole kit is the wound that keeps working)
      if (def.bleedBite && (NPC_DEF[best.species] || {}).bleedable && p.growth > 0.25) {
        const bm = def.bleedMul || 1;
        opts.bleed = { dps: (6 + 8 * p.growth) * bm, dur: 10 * Math.min(1.4, bm) };
      }
      dealDamage(best, playerDmg() * rrange(0.9, 1.1) * (p.landBiteMul || 1), p, opts);
    }
    p.landBite = false;   // the waiver lasts exactly one bite
    p.landBiteMul = 1;
  } else {
    input.attack = false;
  }

  // ------ TRAMPLE (nivalotitan): the footsteps ARE the weapon ------
  // A walking giant crushes whatever it walks over: anything clearly smaller
  // caught under the footprint takes a stomp (per-victim cooldown so one
  // pass = one crush, not a blender). The bigger you've grown, the wider
  // the footprint — a full adult simply strolls through a raptor pack.
  if (def.trample && p.growth > 0.3 && (input.left || input.right || input.up || input.down)) {
    const tz = trampleZone(p);
    const myS = DINO[p.species].scale * sizeScale(p.growth);
    for (const e of G.npcs) {
      if (DINO[e.species].fish || e.packAlpha || e.isBaby || e === G.mate) continue;
      const es = DINO[e.species].scale * sizeScale(e.growth != null ? e.growth : 1);
      if (es > myS * 0.75) continue;                       // too big to go under
      if ((e._trampleCd || 0) > G.time) continue;
      if (dist(e.x, e.y, tz.x, tz.y) < tz.r + bodyRadius(e) * 0.6) {
        e._trampleCd = G.time + 1.2;
        dealDamage(e, playerDmg() * 0.65 * rrange(0.9, 1.1), p, { kb: 340, hitX: e.x, hitY: e.y - 8 });
        floatText(e.x, e.y - 44, 'TRAMPLED!', '#eaf6ff');
        G.shake = Math.min(5, G.shake + 1.2);
      }
    }
  }

  // ------ grab & carry (G): dinner to go ------
  // a carried thing rides in the jaws: pinned to the mouth, lifted to head
  // height for the draw, its rot clock paused
  if (p.carry) {
    const c = p.carry.c;
    if (c.meat <= 0 || G.carcasses.indexOf(c) < 0) {
      p.carry = null;
    } else {
      const hw = headWorldPos(p);
      c.carried = true;
      c.x = hw.x + p.facing * 4;
      c.y = p.y + 1;
      c.liftY = p.y - hw.y - 2;
    }
  }
  if (input.grab) {
    input.grab = false;
    if (p.carry) {
      // drop it at your feet — still perfectly edible
      const c = p.carry.c;
      c.carried = false;
      c.x = p.x + p.facing * 24; c.y = p.y + 2;
      p.carry = null; p.grabT = -1;
      floatText(p.x, p.y - 44, 'dropped', '#cbb98a');
    } else if (def.diet === 'carn' && p.actionT <= 0 && !p.fishing) {
      const c = nearestCarcass(p.x, p.y, 40);
      if (c && c.meat > 0 && !c.carried) { p.grabT = 0; p.grabC = c; p.resting = false; }
    }
  }
  if (p.grabT >= 0 && !p.carry) {
    const c = p.grabC;
    if (!c || c.meat <= 0 || G.carcasses.indexOf(c) < 0 || dist(p.x, p.y, c.x, c.y) > 64) {
      p.grabT = -1;
    } else if (G.keys.KeyG) {
      // still holding: a long press tears a chunk straight off
      p.grabT += dt;
      if (p.grabT >= 0.45) { tearChunk(p, c); p.grabT = -1; }
    } else {
      // a quick tap: carry the whole carcass if your jaws can lift it —
      // too heavy, and you come away with just a mouthful
      if (c.chunk || carcassMass(c) <= playerMass(p) * 0.95) {
        c.carried = true;
        p.carry = { c };
        floatText(p.x, p.y - 48, 'got it!', '#e0b866');
        SFX.bite();
      } else {
        floatText(p.x, p.y - 48, 'too heavy!', '#d08a5a');
        tearChunk(p, c);
      }
      p.grabT = -1;
    }
  }

  // ------ interact (E) ------
  G.prompt = '';
  if (p.carry) {
    // jaws full: E swallows what you hold
    G.prompt = 'E — Swallow    G — Drop';
    if (input.interact && p.actionT <= 0) {
      p.action = { kind: 'swallow' };
      p.actionT = 1.3;
      SFX.eat();
    }
    input.interact = false;
  }
  const ctx = interactContext(p);
  if (ctx && !p.fishing && !p.carry) {
    G.prompt = ctx.prompt;
    if (input.interact && p.actionT <= 0) {
      startAction(p, ctx);
    }
  }
  // an uncarried carcass nearby can also be grabbed
  if (!p.carry && ctx && ctx.kind === 'carcass' && !ctx.obj.carried) {
    G.prompt += '    G — Grab (hold: tear a chunk)';
  }
  input.interact = false;

  // ------ fishing prompt (F) — spinosaurids at the water's edge ------
  const canFish = def.fisher && !p.fishing && p.actionT <= 0 &&
    ((isWaterPx(p.x, p.y) && !isDeepPx(p.x, p.y)) || nearWaterPx(p.x, p.y, 22));
  if (canFish) {
    G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'F — go fishing';
    if (input.fish) {
      p.fishing = true;
      G.banner = { str: 'You settle at the waterside. Hold still — let the fish come.', t: 4, color: '#9cc4d0' };
    }
  }
  if (p.fishing) G.prompt = 'fishing… hold still — SPACE to strike';
  input.fish = false;

  // ------ wrestle prompt (M) — an apex carnivore sizing someone up ------
  if (def.wrestler && !G.wrestle && !p.carry && !p.fishing && p.actionT <= 0) {
    const wt = wrestleTarget(p);
    if (wt) {
      G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'M — Wrestle ' + DINO[wt.species].name;
      if (input.wrestle) startWrestle(p, wt);
    }
  }
  input.wrestle = false;

  // ------ pack (P): wild kin fall in behind a bold aardiraptor ------
  G.packMealT = Math.max(0, (G.packMealT || 0) - dt);
  G.packTargetT = Math.max(0, (G.packTargetT || 0) - dt);
  if (G.packTarget && (G.packTarget.hp <= 0 || G.packTargetT <= 0 || G.npcs.indexOf(G.packTarget) < 0)) G.packTarget = null;
  G.pack = (G.pack || []).filter(e => e.hp > 0 && e.packAlpha && G.npcs.indexOf(e) >= 0);
  if (p.species === 'aardi') {
    const near = G.npcs.filter(e => e.species === 'aardi' && !e.packAlpha && !e.isMate && !e.isBaby &&
      e.hp > 0 && dist(e.x, e.y, p.x, p.y) < 170);
    if (near.length) {
      G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'P — Create pack';
      if (input.pack) {
        for (const e of near) {
          e.packAlpha = true;
          // up close you can finally tell: every recruit shows its gender coat
          if (!e.gender) e.gender = rnd() < 0.5 ? 'f' : 'm';
          e.state = 'follow'; e.target = p; e.stateT = 2;
          floatText(e.x, e.y - 34, '♦', '#ffd23e');
          G.pack.push(e);
        }
        G.banner = { str: 'You are the alpha! ' + G.pack.length + ' aardiraptors run with you now.', t: 4, color: '#ffd23e' };
        SFX.stage();
      }
    }
  }
  input.pack = false;

  // ------ burrow prompt (I): only an aardiraptor fits down the hole ------
  if (p.species === 'aardi' && World.burrows && World.burrows.length) {
    let nb = null, nd = 44;
    for (const b of World.burrows) {
      const dd = dist(p.x, p.y, b.x, b.y);
      if (dd < nd) { nd = dd; nb = b; }
    }
    if (nb) {
      G.prompt = (G.prompt ? G.prompt + '    ' : '') + (nb.owned ? 'I — Enter your den' : 'I — Invade burrow');
      if (input.burrow) enterBurrow(nb);
    }
  }
  input.burrow = false;
}

// ---------- burrows: the protoceratops warrens under the delta ----------
// An aardiraptor can slip down the hole (I). Inside is a little world of its
// own: dirt rooms joined by tunnels, defended by their residents. Clear them
// all and the burrow belongs to your pack — a den to heal and nest in.
function burrowRooms(b) {
  if (!b._rooms) {
    const rng = speckleRng(b.id * 131 + 17);
    const rooms = [{ x: 0, y: 0, r: 62 }];
    let ang = rng() * TAU;
    for (let i = 1; i < b.chambers; i++) {
      ang += (rng() - 0.5) * 1.6;
      const r = 48 + rng() * 30;
      const prev = rooms[i - 1];
      const d = prev.r + r + 60 + rng() * 40;
      rooms.push({ x: prev.x + Math.cos(ang) * d, y: prev.y + Math.sin(ang) * d * 0.7, r });
    }
    b._rooms = rooms;
  }
  return b._rooms;
}
// keep an entity inside the warren: rooms are discs, tunnels are capsules
function burrowClampEntity(e, rad) {
  const B = G.burrow;
  if (!B) return;
  let bestX = null, bestY = null, bestD = 1e9;
  for (const r of B.rooms) {
    const dd = dist(e.x, e.y, r.x, r.y);
    if (dd <= r.r - rad) return;
    const t = (r.r - rad) / (dd || 1);
    const cx = r.x + (e.x - r.x) * t, cy = r.y + (e.y - r.y) * t;
    const cd = dist(e.x, e.y, cx, cy);
    if (cd < bestD) { bestD = cd; bestX = cx; bestY = cy; }
  }
  for (const [i, j] of B.links) {
    const a = B.rooms[i], b2 = B.rooms[j];
    const vx = b2.x - a.x, vy = b2.y - a.y;
    const L2 = vx * vx + vy * vy || 1;
    const t = clamp(((e.x - a.x) * vx + (e.y - a.y) * vy) / L2, 0, 1);
    const px = a.x + vx * t, py = a.y + vy * t;
    const dd = dist(e.x, e.y, px, py);
    const tw = Math.max(8, 26 - rad);
    if (dd <= tw) return;
    const tt = tw / (dd || 1);
    const cx = px + (e.x - px) * tt, cy = py + (e.y - py) * tt;
    const cd = dist(e.x, e.y, cx, cy);
    if (cd < bestD) { bestD = cd; bestX = cx; bestY = cy; }
  }
  if (bestX != null) { e.x = bestX; e.y = bestY; }
}
function enterBurrow(b) {
  const p = G.player;
  const rooms = burrowRooms(b);
  const links = [];
  for (let i = 1; i < rooms.length; i++) links.push([i - 1, i]);
  if (!b._residents) {
    b._residents = [];
    for (let i = 0; i < b.left; i++) {
      const room = rooms[Math.max(0, rooms.length - 1 - (i % rooms.length))];
      const e = makeNPC_raw('proto', room.x + rrange(-20, 20), room.y + rrange(-14, 14));
      e.hp = e.maxhp = NPC_DEF.proto.hp;
      b._residents.push(e);
    }
  }
  if (!b._carcs) b._carcs = [];
  G.burrow = { b, rooms, links, residents: b._residents, carcs: b._carcs, wx: p.x, wy: p.y, fade: 1, allies: [] };
  // the pack raids WITH you: up to four followers squeeze down the hole
  // (their world spots are remembered and restored on the way out)
  for (const e of (G.pack || []).filter(x => !x.isBaby).slice(0, 4)) {
    if (e.hp <= 0) continue;   // (the little ones stay out of raids)
    e._wx = e.x; e._wy = e.y;
    e.x = rooms[0].x + rrange(-24, 24);
    e.y = rooms[0].y + rrange(4, 24);
    e.move = 0; e.attackT = 0; e.atkCd = rrange(0.2, 0.8);
    G.burrow.allies.push(e);
  }
  p.x = rooms[0].x; p.y = rooms[0].y - 8;
  p.vx = p.vy = 0; p.resting = false; p.fishing = false; p.grabT = -1;
  G.banner = b.owned
    ? { str: 'Home below.', t: 3, color: '#cbb98a' }
    : { str: 'You slip into the dark… something lives down here.', t: 4, color: '#cbb98a' };
}
function exitBurrow() {
  const B = G.burrow, p = G.player;
  if (!B) return;
  p.x = B.wx; p.y = B.wy + 6;
  p.vx = p.vy = 0;
  if (p.carry) { const c = p.carry.c; c.x = p.x; c.y = p.y; }
  // the pack files out after you
  for (const e of B.allies) {
    if (e._wx != null) { e.x = e._wx + rrange(-8, 8); e.y = e._wy + rrange(-8, 8); }
    e._wx = e._wy = null;
    if (e.hp > 0) { e.state = 'follow'; e.target = p; e.stateT = 2; }
  }
  G.burrow = null;
}
function hurtResident(e, dmg, px, py) {
  e.hp -= dmg;
  e.hurtT = 0.4;
  bloodBurst(px, py, 2);
  floatText(px, py - 14, String(Math.round(dmg)), '#ff8a6a');
  SFX.hurt();
  if (e.hp <= 0) {
    const B = G.burrow;
    floatText(e.x, e.y - 24, 'the resident falls!', '#ffd23e');
    B.carcs.push({ chunk: true, x: e.x, y: e.y, species: 'proto', growth: 0.4, meat: 40, maxMeat: 40, t: 0 });
    B.b.left--;
    if (B.b.left <= 0 && !B.b.owned) {
      B.b.owned = true;
      G.banner = { str: 'THE BURROW IS YOURS! Your pack can den, heal and nest here.', t: 6, color: '#ffd23e' };
      SFX.stage();
    }
  }
}
// den broods: eggs and babies laid underground tick here — called from
// updateBurrow when you're inside and from updateNesting when you're not
function tickDenBrood(dt) {
  const ns = G.nesting, p = G.player;
  if (!ns || !ns.den) return;
  if (ns.stage === 'eggs') {
    ns.hatchT -= dt;
    if (ns.hatchT <= 0) {
      ns.stage = 'babies';
      ns.guardian = p.gender === 'f' ? 'player' : 'mate';
      ns.babies = [];
      const rooms = burrowRooms(ns.den);
      const deep = rooms[rooms.length - 1];
      for (let i = 0; i < ns.eggs; i++) {
        const bb = makeBaby(p.species, deep.x + rrange(-18, 18), deep.y + rrange(-12, 12));
        bb.den = ns.den;
        ns.babies.push(bb);              // NOT in G.npcs — the world can't touch them
      }
      SFX.stage();
      G.banner = { str: 'THE EGGS HATCH, safe in the den! They stay below until sub-adult.', t: 7, color: '#ffd23e' };
    }
    return;
  }
  if (ns.stage === 'babies') {
    let anyDen = false;
    for (const bb of ns.babies) {
      if (!bb.den) continue;
      bb.growth = Math.min(1, bb.growth + dt / 240);
      bb.maxhp = Math.round(PLAYER_DEF[p.species].hp * hpFrac(bb.growth));
      bb.hp = bb.maxhp;                  // underground, nothing can hurt them
      if (bb.growth >= 0.45) {
        // sub-adult at last: up and out into the light — and straight into
        // the pack (aardiraptor young are pack from their first breath)
        bb.den = null;
        bb.x = ns.den.x + rrange(-10, 10);
        bb.y = ns.den.y + rrange(6, 16);
        G.npcs.push(bb);
        if (p.species === 'aardi') { bb.packAlpha = true; G.pack.push(bb); }
        floatText(bb.x, bb.y - 30, 'a young one emerges!', '#ffd23e');
      } else anyDen = true;
    }
    if (!anyDen) ns.den = null;          // the whole brood is above ground now
  }
}
function updateBurrow(dt) {
  const B = G.burrow, p = G.player, def = PLAYER_DEF[p.species], input = G.input;
  if (!B || !p.alive) return;
  B.fade = Math.max(0, B.fade - dt * 1.5);
  p.atkCd = Math.max(0, p.atkCd - dt);
  p.attackT = Math.max(0, p.attackT - dt * 3.2);
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.restT = Math.max(0, (p.restT || 0) - dt * 2.8);
  if (p.bleed) {
    bleedTick(p, dt);
    if (p.hp <= 0) { killPlayer('blood loss'); return; }
  }
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);
  let dx = 0, dy = 0;
  if (input.left) dx--;
  if (input.right) dx++;
  if (input.up) dy--;
  if (input.down) dy++;
  if (dx || dy) {
    const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    // no sprinting in a tunnel — everything down here is elbows
    const sp = def.speed * genderMod(p).speed * (0.62 + 0.38 * p.growth) * 0.85;
    p.x += dx * sp * dt; p.y += dy * sp * dt;
    if (dx) p.facing = dx > 0 ? 1 : -1;
    p.move = lerp(p.move, 1, 0.2);
    p.phase += dt * sp * 0.055;
  } else {
    p.move = lerp(p.move, 0, 0.15);
  }
  p.headDown = lerp(p.headDown, 0, 0.15);
  p.headUp = lerp(p.headUp || 0, 0, 0.12);
  p.pitch = lerp(p.pitch, 0, Math.min(1, dt * 8));
  burrowClampEntity(p, 5 + 6 * p.growth);
  // the clock still runs underground
  p.food = Math.max(0, p.food - dt * (100 / 300));
  p.water = Math.max(0, p.water - dt * (100 / 240));
  p.hygiene = Math.max(0, p.hygiene - dt * (100 / 420));
  if (p.food <= 0) p.hp -= 2.2 * dt;
  if (p.water <= 0) p.hp -= 3.2 * dt;
  if (p.hp <= 0) { killPlayer(p.water <= 0 ? 'dehydration' : 'starvation'); return; }
  // a claimed den heals its pack fast; otherwise the usual well-fed regen
  if (B.b.owned && p.hp < playerMaxHp()) p.hp = Math.min(playerMaxHp(), p.hp + 9 * dt);
  else if (p.food > 45 && p.water > 45 && p.hp < playerMaxHp()) p.hp = Math.min(playerMaxHp(), p.hp + 4.5 * dt);
  // carried dinner rides along
  if (p.carry) {
    const c = p.carry.c;
    if (c.meat <= 0 || G.carcasses.indexOf(c) < 0) p.carry = null;
    else {
      const hw = headWorldPos(p);
      c.carried = true;
      c.x = hw.x + p.facing * 4; c.y = p.y + 1;
      c.liftY = p.y - hw.y - 2;
    }
  }
  // attack: same tight jaws as above ground, aimed at the residents
  if (input.attack && p.atkCd <= 0) {
    input.attack = false;
    p.atkCd = def.atkCd;
    p.attackT = 1;
    p.vx += p.facing * 70;
    SFX.bite();
    const wc = weaponCircle(p);
    let best = null, bpt = null, bd = 1e9;
    for (const e of B.residents) {
      if (e.hp <= 0) continue;
      const pt = bodyHitPoint(e, wc.x, wc.y, wc.r);
      if (!pt || (pt.x - p.x) * p.facing < -2) continue;
      const dd = dist(wc.x, wc.y, pt.x, pt.y);
      if (dd < bd) { bd = dd; best = e; bpt = pt; }
    }
    if (best) hurtResident(best, playerDmg() * rrange(0.9, 1.1), bpt.x, bpt.y);
  } else if (input.attack) {
    input.attack = false;
  }
  // the residents: cornered protoceratops defending their warren — each one
  // duels the NEAREST intruder (you or a packmate); a pile-on only happens
  // when there are more defenders than raiders
  const raiders = [p].concat(B.allies.filter(x => x.hp > 0));
  const claimed = new Set();
  for (const e of B.residents) {
    if (e.hp <= 0) continue;
    e.atkCd = Math.max(0, (e.atkCd || 0) - dt);
    e.attackT = Math.max(0, (e.attackT || 0) - dt * 3);
    e.hurtT = Math.max(0, (e.hurtT || 0) - dt);
    // pick my raider: nearest unclaimed, else nearest
    let tgt = null, td = 1e9;
    for (const r of raiders) {
      if (claimed.has(r)) continue;
      const dd = dist(e.x, e.y, r.x, r.y);
      if (dd < td) { td = dd; tgt = r; }
    }
    if (!tgt) {
      for (const r of raiders) {
        const dd = dist(e.x, e.y, r.x, r.y);
        if (dd < td) { td = dd; tgt = r; }
      }
    } else {
      claimed.add(tgt);
    }
    if (!tgt || td > 240) { e.move = lerp(e.move || 0, 0, 0.1); continue; }
    e.facing = tgt.x > e.x ? 1 : -1;
    if (td > 32) {
      const a = angTo(e.x, e.y, tgt.x, tgt.y);
      e.x += Math.cos(a) * 92 * dt;
      e.y += Math.sin(a) * 92 * dt;
      e.move = 1;
      e.phase = (e.phase || 0) + dt * 6;
      burrowClampEntity(e, 8);
    } else {
      e.move = lerp(e.move || 0, 0, 0.2);
      if (e.atkCd <= 0) {
        e.atkCd = 1.9;
        e.attackT = 1;
        if (tgt.isPlayer) {
          dealDamage(p, 36 * rrange(0.85, 1.15), e, { kb: 120 });
          if (!p.alive) return;
        } else {
          // an ally takes the hit — bespoke so no world carcass leaks in here
          tgt.hp -= 34 * rrange(0.85, 1.15);
          tgt.hurtT = 0.4;
          bloodBurst(tgt.x, tgt.y - 6, 2);
          if (tgt.hp <= 0) {
            floatText(tgt.x, tgt.y - 26, 'a packmate falls…', '#ff6a5e');
            B.carcs.push({ chunk: true, x: tgt.x, y: tgt.y, species: 'aardi', growth: 0.4, meat: 24, maxMeat: 24, t: 0 });
            const gi = G.npcs.indexOf(tgt);
            if (gi >= 0) G.npcs.splice(gi, 1);
          }
        }
      }
    }
  }
  // the pack fights beside you: each ally worries the nearest resident
  for (const e of B.allies) {
    if (e.hp <= 0) continue;
    e.atkCd = Math.max(0, (e.atkCd || 0) - dt);
    e.attackT = Math.max(0, (e.attackT || 0) - dt * 3);
    e.hurtT = Math.max(0, (e.hurtT || 0) - dt);
    let tgt = null, td = 1e9;
    for (const r of B.residents) {
      if (r.hp <= 0) continue;
      const dd = dist(e.x, e.y, r.x, r.y);
      if (dd < td) { td = dd; tgt = r; }
    }
    if (!tgt) {
      // all clear: fall in near the alpha
      const dd = dist(e.x, e.y, p.x, p.y);
      if (dd > 60) {
        const a = angTo(e.x, e.y, p.x, p.y);
        e.x += Math.cos(a) * 110 * dt; e.y += Math.sin(a) * 110 * dt;
        e.move = 1; e.phase = (e.phase || 0) + dt * 7;
        burrowClampEntity(e, 6);
      } else e.move = lerp(e.move || 0, 0, 0.15);
      continue;
    }
    e.facing = tgt.x > e.x ? 1 : -1;
    if (td > 26) {
      const a = angTo(e.x, e.y, tgt.x, tgt.y);
      e.x += Math.cos(a) * 128 * dt; e.y += Math.sin(a) * 128 * dt;
      e.move = 1; e.phase = (e.phase || 0) + dt * 8;
      burrowClampEntity(e, 6);
    } else {
      e.move = lerp(e.move || 0, 0, 0.2);
      if (e.atkCd <= 0) {
        e.atkCd = 1.0;
        e.attackT = 1;
        hurtResident(tgt, 34 * rrange(0.85, 1.15), tgt.x, tgt.y - 8);
      }
    }
  }
  // nesting in your own den: the deepest chamber, accepted pairs only
  const ns = G.nesting;
  const deep = B.rooms[B.rooms.length - 1];
  let denNest = false;
  if (B.b.owned && ns && ns.stage === 'accepted' && (ns.reNestT || 0) <= 0 && dist(p.x, p.y, deep.x, deep.y) < deep.r) {
    denNest = true;
    if (input.nest) {
      ns.stage = 'eggs'; ns.eggs = 3; ns.hatchT = 120; ns.den = B.b; ns.eatT = 0;
      SFX.stage();
      G.banner = { str: 'THREE EGGS, safe underground. They will hatch in their own time.', t: 6, color: '#ffd23e' };
      denNest = false;
    }
  }
  input.nest = false;
  // den eggs and babies keep ticking while you visit
  tickDenBrood(dt);
  // den babies toddle about their chamber
  if (ns && ns.stage === 'babies') {
    for (const bb of ns.babies) {
      if (bb.den !== B.b) continue;
      bb.phase = (bb.phase || 0) + dt * 3;
      bb.x += Math.cos(G.time * 0.6 + bb.id) * 7 * dt;
      bb.y += Math.sin(G.time * 0.5 + bb.id) * 5 * dt;
      bb.move = 0.4;
      burrowClampEntity(bb, 4);
    }
  }
  // a fallen resident is dinner
  let nearC = null;
  for (const c of B.carcs) {
    if (c.meat > 0 && dist(p.x, p.y, c.x, c.y) < 30) { nearC = c; break; }
  }
  if (nearC && input.interact) {
    const bite = Math.min(30, nearC.meat);
    nearC.meat -= bite;
    p.food = Math.min(100, p.food + bite);
    floatText(p.x, p.y - 40, '+food', '#e08a66');
    SFX.eat();
  }
  input.interact = false;
  G.prompt = (B.b.owned ? 'I — leave the den' : 'I — flee the burrow') +
    (B.b.left > 0 ? '    ' + B.b.left + ' resident' + (B.b.left > 1 ? 's' : '') + ' below' : '') +
    (nearC ? '    E — eat' : '') +
    (denNest ? '    N — nest here' : '');
  if (input.burrow) {
    input.burrow = false;
    exitBurrow();
    return;
  }
  input.grab = false; input.wrestle = false; input.pack = false; input.fish = false; input.rest = false;
}

// silhouette mass — the scale behind "can I lift this?" and wrestling odds
function silhouetteMass(d, growth, gsize) {
  return d.L.body[0] * d.L.body[1] * d.scale * d.scale *
    Math.pow(sizeScale(growth != null ? growth : 1) * (gsize || 1), 2);
}
function carcassMass(c) { return silhouetteMass(DINO[c.species], c.growth, 1); }
function playerMass(p) { return silhouetteMass(DINO[p.species], p.growth, genderMod(p).size); }
function tearChunk(p, c) {
  if (c.chunk) { c.carried = true; p.carry = { c }; return; }   // a chunk of a chunk IS the chunk
  const bite = Math.min(30, c.meat);
  c.meat -= bite;
  const chunk = { chunk: true, x: c.x, y: c.y, species: c.species, growth: 0.2, meat: bite, maxMeat: bite, t: 0, carried: true };
  G.carcasses.push(chunk);
  p.carry = { c: chunk };
  bloodBurst(c.x, c.y, 2);
  SFX.bite();
  floatText(p.x, p.y - 48, 'a mouthful torn free', '#e08a66');
}

// ---------- wrestling (M): apex jaws vs something your own size ----------
// A pin attempt on any land dino whose bulk is in reach of yours. Five quick
// keys; each correct press is a shake that wounds, the fifth is the SLAM.
// Fumble one (or dawdle) and you're thrown off and stunned.
const WRESTLE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
function wrestleTarget(p) {
  let best = null, bd = 95;
  const pm = playerMass(p);
  for (const e of G.npcs) {
    const d = DINO[e.species];
    if (d.fish || e.isMate || e.isBaby || e.packAlpha || e.hp <= 0) continue;
    const nd = NPC_DEF[e.species];
    if (nd && nd.aquatic) continue;                     // no wrestling crocs in their water
    const ratio = silhouetteMass(d, e.growth, 1) / pm;
    if (ratio < 0.45 || ratio > 2.6) continue;          // out of your weight class
    const dd = dist(p.x, p.y, e.x, e.y);
    if (dd < bd) { bd = dd; best = e; }
  }
  return best;
}
function startWrestle(p, t) {
  const seq = [];
  for (let i = 0; i < 5; i++) {
    let k = WRESTLE_KEYS[(rnd() * 4) | 0];
    if (seq[i - 1] === k) k = WRESTLE_KEYS[(WRESTLE_KEYS.indexOf(k) + 1) % 4];   // no doubles
    seq.push(k);
  }
  // the bigger it is, the less time each key gives you:
  // sinoceratops ~0.94s a key, olorotitan ~0.83s, atlasaurus a brutal ~0.24s
  const ratio = silhouetteMass(DINO[t.species], t.growth, 1) / playerMass(p);
  const win = clamp(1.02 - (ratio - 0.3) * 0.5, 0.24, 0.95);
  G.wrestle = { t, seq, idx: 0, window: win, keyT: win + 0.4, pressed: null };
  t.pinT = 0.3;
  p.resting = false; p.fishing = false;
  G.banner = { str: 'WRESTLING ' + DINO[t.species].name + ' — press the keys, FAST!', t: 2.5, color: '#ffd23e' };
  SFX.bite();
}
function failWrestle(p, t) {
  G.wrestle = null;
  p.stunT = 2;
  p.vx = -p.facing * 240;
  t.pinT = 0;
  t.hurtT = 0.3;
  floatText(p.x, p.y - 52, 'THROWN OFF!', '#d43a2a');
  G.banner = { str: 'It broke your hold — you are stunned!', t: 2.5, color: '#d43a2a' };
  G.shake = Math.min(8, G.shake + 5);
}

function interactContext(p) {
  const def = PLAYER_DEF[p.species];
  if (def.diet === 'carn') {
    const c = nearestCarcass(p.x, p.y, 34);
    if (c && c.meat > 0) return { kind: 'carcass', obj: c, prompt: 'E — Feed on carcass' };
  } else {
    let best = null, bd = 30, kind = null;
    for (const f of World.ferns) {
      if (f.food <= 0) continue;
      const d = dist(p.x, p.y, f.x, f.y);
      if (d < bd) { bd = d; best = f; kind = 'fern'; }
    }
    for (const h of World.horsetails) {
      if (h.food <= 0) continue;
      const d = dist(p.x, p.y, h.x, h.y);
      if (d < bd) { bd = d; best = h; kind = 'horsetail'; }
    }
    // grown sauropods browse the CANOPY: any leafy tree within neck's reach
    // (kicks in once the neck is long enough to get up there)
    if (!best && DINO[p.species].highBrowse && p.growth >= 0.5) {
      let bt = null, btd = 52;
      for (const t of World.trees) {
        if (t.kind === 2 || t.leaf === 0) continue;   // dead snags have no leaves
        const d = dist(p.x, p.y, t.x, t.y);
        if (d < btd) { btd = d; bt = t; }
      }
      if (bt) return { kind: 'browse', obj: bt, prompt: 'E — Browse the canopy' };
    }
    if (best) return { kind, obj: best, prompt: kind === 'fern' ? 'E — Eat ferns' : 'E — Eat horsetails' };
  }
  if (!isWaterPx(p.x, p.y) && nearWaterPx(p.x, p.y, 22) || (isWaterPx(p.x, p.y) && !isDeepPx(p.x, p.y))) {
    if (p.water < 99) return { kind: 'drink', prompt: 'E — Drink' };
  }
  if (isMudPx(p.x, p.y) && p.hygiene < 99) return { kind: 'mudinfo', prompt: 'Wallowing in mud… hygiene rising' };
  return null;
}

function startAction(p, ctx) {
  if (ctx.kind === 'mudinfo') return;
  p.resting = false;   // you don't eat or drink lying down — up you get
  p.action = ctx;
  p.actionT = ctx.kind === 'drink' ? 1.0 : ctx.kind === 'browse' ? 1.5 : 1.1;
  if (ctx.kind === 'drink') SFX.drink(); else SFX.eat();
}

function finishAction(p) {
  const a = p.action;
  p.action = null;
  if (!a) return;
  // the pack eats when the alpha eats, drinks when the alpha drinks
  if (G.pack && G.pack.length && a.kind !== 'mudinfo') G.packMealT = 2.4;
  const grow = (amt) => {
    // same rule as the passive tick: too dirty = no growth (the meal still feeds)
    if (p.growth < 1 && p.hygiene > 60) {
      const old = p.growth;
      p.growth = Math.min(1, p.growth + amt * (PLAYER_DEF[p.species].growthRate || 1));
      checkStage(p, old);
    }
  };
  if (a.kind === 'drink') {
    p.water = Math.min(100, p.water + 38);
    floatText(p.x, p.y - 44, '+water', '#7ec8e0');
  } else if (a.kind === 'fern' || a.kind === 'horsetail') {
    if (a.obj.food <= 0) return;
    a.obj.food = 0;
    a.obj.regrow = 55 + rnd() * 40;
    p.food = Math.min(100, p.food + (a.kind === 'fern' ? 30 : 26));
    grow(0.008);
    floatText(p.x, p.y - 44, '+food', '#a2d066');
  } else if (a.kind === 'browse') {
    // a mouthful of canopy: the richest graze in the game, sauropods only
    if (a.obj.leaf === 0) return;
    a.obj.leaf = 0;
    a.obj.leafRegrow = 60 + rnd() * 45;
    p.food = Math.min(100, p.food + 36);
    grow(0.01);
    floatText(p.x, p.y - 60, '+food (canopy)', '#7ec86a');
  } else if (a.kind === 'carcass') {
    if (a.obj.meat <= 0) return;
    const bite = Math.min(30, a.obj.meat);
    a.obj.meat -= bite;
    p.food = Math.min(100, p.food + bite);
    grow(0.008);
    floatText(p.x, p.y - 44, '+food', '#e08a66');
    bloodBurst(a.obj.x, a.obj.y, 3);
  } else if (a.kind === 'swallow') {
    // head back, jaws snapping, and down it goes
    p.gulp = false;
    const c = p.carry && p.carry.c;
    if (!c || c.meat <= 0) return;
    const gulp = Math.min(c.chunk ? c.meat : 35, c.meat);
    c.meat -= gulp;
    p.food = Math.min(100, p.food + gulp);
    grow(0.008);
    floatText(p.x, p.y - 56, 'gulp! +food', '#e08a66');
    if (c.meat <= 0) p.carry = null;   // swallowed whole
  }
}

function checkStage(p, oldGrowth) {
  const oldStage = stageOf(oldGrowth), newStage = stageOf(p.growth);
  if (oldStage !== newStage) {
    p.stage = newStage;
    const oldMax = PLAYER_DEF[p.species].hp * hpFrac(oldGrowth);
    p.hp = clamp(p.hp / oldMax, 0, 1) * playerMaxHp();
    SFX.stage();
    if (newStage === 'Full Adult') {
      p.wins = true;
      G.banner = { str: 'FULLY GROWN — you survived to adulthood!', t: 6, color: '#ffd23e' };
      if (typeof onFullyGrown === 'function') onFullyGrown(p.species);
    } else {
      G.banner = { str: 'You are now ' + (newStage === 'Adult' ? 'an' : 'a') + ' ' + newStage + '!', t: 4, color: '#ffe9a0' };
    }
  }
}

// ---------- carcasses & plants upkeep ----------
function updateWorldStuff(dt) {
  for (let i = G.carcasses.length - 1; i >= 0; i--) {
    const c = G.carcasses[i];
    if (!c.carried) c.t += dt;   // the rot clock pauses in a carrier's jaws
    if (c.meat <= 0 || c.t > 150) G.carcasses.splice(i, 1);
  }
  for (const f of World.ferns) if (f.food <= 0) { f.regrow -= dt; if (f.regrow <= 0) f.food = 1; }
  for (const h of World.horsetails) if (h.food <= 0) { h.regrow -= dt; if (h.regrow <= 0) h.food = 1; }
  for (const t of World.trees) if (t.leaf === 0) { t.leafRegrow -= dt; if (t.leafRegrow <= 0) t.leaf = 1; }
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const pt = G.particles[i];
    pt.t += dt;
    if (pt.t > pt.life) { G.particles.splice(i, 1); continue; }
    pt.vy += (pt.grav || 0) * dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  }
  for (let i = G.floats.length - 1; i >= 0; i--) {
    const f = G.floats[i];
    f.t -= dt; f.y -= 18 * dt;
    if (f.t <= 0) G.floats.splice(i, 1);
  }
}
