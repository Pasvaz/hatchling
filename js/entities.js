'use strict';
// ---------- entities: player, NPC AI, combat, carcasses, particles ----------

const PLAYER_DEF = {
  raja: { hp: 1000, dmg: 130, speed: 112, sprint: 1.75, reach: 30, atkCd: 0.6, diet: 'carn', bleedBite: true, stamMax: 100, eco: 'valley', cost: 0 },
  // camptosaurus gets double stamina — endurance is its escape plan
  // (and it earns extra growths, because hard mode should pay)
  campto: { hp: 1100, dmg: 70, speed: 118, sprint: 1.8, reach: 26, atkCd: 0.7, diet: 'herb', bleedBite: false, stamMax: 200, eco: 'valley', cost: 0, earnMul: 1.4 },
  // the valley's late bloomer: a sauropodomorph built like a brawler — fast,
  // strong, tail-swinging, with a thumb-claw slash (M) that opens wounds.
  // Grows agonizingly slowly and eats like a landslide: keep the ferns coming
  rioja: { hp: 1500, dmg: 120, speed: 122, sprint: 1.7, reach: 34, atkCd: 0.9, diet: 'herb', bleedBite: false, stamMax: 150, eco: 'valley', cost: 0, growthRate: 0.5, foodDrain: 1.7, clawSecond: true },
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
  // the battering ram: the ridge's only rammer — speed into solid bone
  preno: { hp: 1100, dmg: 130, speed: 132, sprint: 1.8, reach: 26, atkCd: 0.7, diet: 'herb', bleedBite: false, stamMax: 160, eco: 'ash', cost: 350, req: 'linhe', growthRate: 0.95 },
  // VOLCANO TOOTH: the young mountain — slow, patient, tail like a falling tree
  vulcano: { hp: 2400, dmg: 165, speed: 76, sprint: 1.4, reach: 48, atkCd: 1.5, diet: 'herb', bleedBite: false, stamMax: 160, eco: 'ash', cost: 450, req: 'preno', growthRate: 0.55 },
  // the herbivore that hunts back: scythe-claw swipes that leave bleeding wounds
  nothro: { hp: 1600, dmg: 140, speed: 88, sprint: 1.5, reach: 40, atkCd: 1.1, diet: 'herb', bleedBite: true, stamMax: 130, eco: 'ash', cost: 300, req: 'giganto' },
  // --- Lertentous Delta playables ---
  // the cheap tank: grows slowly, but a grown centrosaurus argues with anything
  // small, weak, and it LOOKS like a dumb pick — until you sound the call and the
  // jungle starts moving with you (packs, burrow raids, the works)
  aardi: { hp: 380, dmg: 45, speed: 152, sprint: 1.9, reach: 22, atkCd: 0.45, diet: 'carn', bleedBite: false, stamMax: 160, eco: 'delta', cost: 25, growthRate: 1.3, packSpecies: true },
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
  nanuq: { hp: 2100, dmg: 180, speed: 118, sprint: 1.65, reach: 36, atkCd: 0.9, diet: 'carn', bleedBite: true, stamMax: 160, eco: 'wall', cost: 550, req: 'eshano', growthRate: 0.75, coldResist: 0.7, wrestler: true, boneBreak: true },
  // the END of the ladder: a carcharodontosaurid in a winter coat — bigger
  // and tankier than its delta cousin, with Tyrannotitan's bleed kit and a
  // feather blanket so deep even the summit's cold barely reaches it. Slow,
  // heavy, and built to bring down a Kerberosaurus by itself
  nivarex: { hp: 2800, dmg: 195, speed: 108, sprint: 1.6, reach: 40, atkCd: 0.9, diet: 'carn', bleedBite: true, bleedMul: 1.8, stamMax: 160, eco: 'wall', cost: 650, req: 'nanuq', growthRate: 0.6, coldResist: 0.9, wrestler: true },
  // ---- THE GREAT MOORS OF MARTULISTH ----
  // the pug-faced digger: tiny, square-headed, and the only dinosaur that
  // builds its OWN burrow (B) — dive in and leave attackers your armored butt
  simo: { hp: 420, dmg: 40, speed: 118, sprint: 1.75, reach: 18, atkCd: 0.6, diet: 'herb', bleedBite: false, stamMax: 150, eco: 'moor', cost: 100, growthRate: 1.25, earnMul: 1.3, digger: true },
  // the paddle-tailed ceratopsian: a horned swimmer for the black meres
  korea: { hp: 900, dmg: 85, speed: 112, sprint: 1.7, reach: 26, atkCd: 0.8, diet: 'herb', bleedBite: false, stamMax: 150, eco: 'moor', cost: 200, req: 'simo', swim: true },
  // the bone-breaker: fast, hits like a hammer, mediocre health — its bites
  // never bleed, they CRACK: thigh, tail, skull, or (rarely) the body itself
  sarco: { hp: 950, dmg: 150, speed: 136, sprint: 1.85, reach: 28, atkCd: 0.6, diet: 'carn', bleedBite: false, boneBreak: true, stamMax: 140, eco: 'moor', cost: 300, req: 'korea' },
  // the long tyrant: big, fast, agile — a stretched skull on a stretched
  // frame, with the same bone-cracking jaws turned up to full
  drypto: { hp: 2300, dmg: 190, speed: 128, sprint: 1.75, reach: 38, atkCd: 0.75, diet: 'carn', bleedBite: false, boneBreak: true, stamMax: 155, eco: 'moor', cost: 550, req: 'sarco', growthRate: 0.7, wrestler: true },
  // the moor's fortress: a flat oval of armor, shoulder spikes that grow
  // with it, and a long spiked tail that answers everything
  gastonia: { hp: 2000, dmg: 165, speed: 76, sprint: 1.45, reach: 46, atkCd: 1.4, diet: 'herb', bleedBite: false, bleedResist: 0.35, stamMax: 150, eco: 'moor', cost: 650, req: 'drypto', growthRate: 0.75 },
  // ---- THE SODDEN REACH ----
  // the river ghost: absurdly long and light on black pin legs, with a
  // slender fish-catching snout. Wades where others swim — deep water slows
  // it to a crawl but never stops it — and a fish is worth double to it
  buitre: { hp: 380, dmg: 46, speed: 168, sprint: 1.95, reach: 22, atkCd: 0.5, diet: 'carn', bleedBite: true, bleedMul: 1.7, stamMax: 170, eco: 'jungle', cost: 300, growthRate: 1.2, earnMul: 1.25, fisher: true, swim: true, swimMul: 0.4, fishFeast: 2 },
  // the thicket mouse: tiny, feathered, and permanently nervous — but it can
  // throw itself into the earth, and for ten seconds nothing will touch it
  hypsi: { hp: 340, dmg: 26, speed: 152, sprint: 1.9, reach: 16, atkCd: 0.6, diet: 'herb', bleedBite: false, stamMax: 160, eco: 'jungle', cost: 400, req: 'buitre', growthRate: 1.3, earnMul: 1.35, digger: true, panicBurrow: 10 },
  // the oldest stegosaur: a low spiked wall that opens wounds — every plate
  // edge and tail spike leaves the attacker leaking
  adratik: { hp: 1900, dmg: 150, speed: 82, sprint: 1.45, reach: 44, atkCd: 1.3, diet: 'herb', bleedBite: true, bleedMul: 1.6, bleedResist: 0.4, stamMax: 150, eco: 'jungle', cost: 550, req: 'hypsi', growthRate: 0.85, tailWeapon: true },
  // the last megaraptorid: long-armed, blade-toothed, and FAST — it opens
  // its prey with hooked hands as much as with its jaws
  orkor: { hp: 1500, dmg: 165, speed: 150, sprint: 1.85, reach: 32, atkCd: 0.6, diet: 'carn', bleedBite: true, bleedMul: 1.9, stamMax: 165, eco: 'jungle', cost: 700, req: 'adratik', growthRate: 0.85, clawSecond: true, wrestler: true },
  // the quiet apex: it does not chase the way the tyrants chase — it arrives.
  // Hands and jaws together, and everything it touches bleeds
  neove: { hp: 2500, dmg: 205, speed: 132, sprint: 1.7, reach: 38, atkCd: 0.8, diet: 'carn', bleedBite: true, bleedMul: 2.0, stamMax: 160, eco: 'jungle', cost: 900, req: 'orkor', growthRate: 0.7, clawSecond: true, wrestler: true },
  // the great horns: possibly the longest brow horns anything ever grew, and
  // every wound they open keeps working — the Reach's bleed on four legs
  coahuila: { hp: 2600, dmg: 175, speed: 96, sprint: 1.5, reach: 40, atkCd: 1.1, diet: 'herb', bleedBite: true, bleedMul: 2.6, stamMax: 145, eco: 'jungle', cost: 1000, req: 'orkor', growthRate: 0.65 },
  // the NEW apex: a megalosaurid of keel-skulled muscle. No ambush, no
  // tricks — raw damage, thick short arms, and the M double bite
  // --- The Death Desert: one playable for now. Its gate is its own (see
  // main.js spUnlocked): a Poekilopleuron grown to ADULT at least once, or
  // Full Adult Neovenator AND Coahuilaceratops together
  // the desert's first rung: a pack animal like the aardiraptor (packSpecies),
  // feathered from birth (heatResist), decent speed and a bottomless tank
  procomp: { hp: 320, dmg: 40, speed: 146, sprint: 1.85, reach: 20, atkCd: 0.45, diet: 'carn', bleedBite: false, stamMax: 320, eco: 'desert', cost: 400, gate: 'desert', heatResist: 0.4, earnMul: 1.2, growthRate: 1.3, packSpecies: true },
  // the desert's second rung: a herbivore that fights — pack animal, horn ram,
  // and a pounce that lands skull-first hard enough to break bones (pounceBone)
  homalo: { hp: 900, dmg: 95, speed: 138, sprint: 1.8, reach: 26, atkCd: 0.7, diet: 'herb', bleedBite: false, stamMax: 170, eco: 'desert', cost: 600, req: 'procomp', heatResist: 0.3, growthRate: 1.0, packSpecies: true, pounceBone: true },
  coelo: { hp: 700, dmg: 85, speed: 152, sprint: 1.95, reach: 26, atkCd: 0.45, diet: 'carn', bleedBite: true, stamMax: 150, eco: 'desert', cost: 800, gate: 'desert', heatResist: 0.3, earnMul: 1.15 },
  // the desert's crowned wall, the last rung before the apex fork: huge hp
  // and a horn that breaks bones, a hide the claws barely open (bleedResist
  // takes the wound's dps AND its duration) — but the shortest tank on the
  // sand: it wins the fight where it stands, and can never run anyone down
  regali: { hp: 2700, dmg: 185, speed: 90, sprint: 1.5, reach: 40, atkCd: 1.05, diet: 'herb', bleedBite: false, bleedResist: 0.5, boneBreak: true, stamMax: 80, eco: 'desert', cost: 1000, req: 'coelo', heatResist: 0.25, growthRate: 0.65 },
  // the desert's apex: Poekilopleuron's niche and build at Tyrannotitan's
  // size — raw damage, thick short arms, the M double bite, and the big
  // hadrosaurs of the belt as its larder. Thin-skinned in the sun.
  tamery: { hp: 2600, dmg: 225, speed: 120, sprint: 1.65, reach: 38, atkCd: 0.85, diet: 'carn', bleedBite: true, bleedMul: 1.2, stamMax: 155, eco: 'desert', cost: 1200, req: 'regali', heatResist: 0.15, growthRate: 0.6, doubleBite: true, wrestler: true },
  // the desert's OTHER apex (a fork with Tameryraptor): a big megaraptorid —
  // smaller and lighter, but it runs almost forever (stamMax), its wounds
  // bleed for half a minute (bleedDur), and it can pack — two kin at most
  // (packMax: three hunters counting you)
  aero: { hp: 1900, dmg: 170, speed: 148, sprint: 1.85, reach: 34, atkCd: 0.6, diet: 'carn', bleedBite: true, bleedMul: 1.5, bleedDur: 2.2, stamMax: 420, eco: 'desert', cost: 1200, req: 'regali', heatResist: 0.3, growthRate: 0.7, clawSecond: true, packSpecies: true, packMax: 2 },
  // THE LESSER ARCHIPELAGO — its first playable: a grey island abelisaur,
  // stocky and slow on land (a grown one is only a hair faster than the
  // homalocephale it chases), but a decent swimmer — the only way off
  // Utoriana is across Garamirala's pathway
  ekrix: { hp: 2400, dmg: 200, speed: 118, sprint: 1.4, reach: 34, atkCd: 0.7, diet: 'carn', bleedBite: true, stamMax: 130, eco: 'archi', cost: 1500, req: 'tamery', growthRate: 0.65, swim: true, swimMul: 0.8, babyFast: true },
  // CHENANISAURUS: the second island abelisaur — bigger and harder-hitting
  // than Ekrixinatosaurus, but slower. Like it, a speedster as a baby
  // that slows down as it grows (babyFast)
  iani: { hp: 1100, dmg: 70, speed: 140, sprint: 1.6, reach: 22, atkCd: 0.8, diet: 'herb', bleedBite: false, stamMax: 180, eco: 'archi', cost: 1750, req: 'ekrix', growthRate: 1.0, swim: true, swimMul: 0.6 },
  chenani: { hp: 3300, dmg: 265, speed: 100, sprint: 1.35, reach: 38, atkCd: 0.85, diet: 'carn', bleedBite: true, stamMax: 135, eco: 'archi', cost: 2000, req: 'iani', growthRate: 0.55, swim: true, swimMul: 0.7, babyFast: true },
  // KAIWHEKEA: the plesiosaur. Lives fully under the water (marine): fast
  // and agile there with a huge stamina pool, a fish-catcher (fishFeast),
  // but hauled out on land it can barely drag itself along (landMul).
  // Its bite bleeds — for whatever tries to cross its water
  kaiwhe: { hp: 1100, dmg: 80, speed: 150, sprint: 1.55, reach: 30, atkCd: 0.45, diet: 'carn', bleedBite: true, stamMax: 320, eco: 'archi', cost: 2500, req: 'chenani', growthRate: 0.8, swim: true, swimMul: 1, marine: true, landMul: 0.15, fishFeast: 2.5 },
  // PTERODACTYLUS: a small pest on the wing. SPACE climbs, letting go glides it
  // down until it lands (on water it floats and paddles); M bites. Up high,
  // only other flyers at its height can touch it — a scavenger, not a fighter
  ptero: { hp: 150, dmg: 16, speed: 60, sprint: 1.5, reach: 16, atkCd: 0.45, diet: 'carn', stamMax: 200, eco: 'archi', cost: 3000, req: 'kaiwhe', growthRate: 1.1, swim: true, swimMul: 0.6, flyer: true, flyMul: 2.7 },
  // HATZEGOPTERYX: the biggest pterosaur of all, an azhdarchid titan. Flies
  // well, runs fast, hits like nothing else on the islands, and SNATCHES:
  // press F by an animal to pick it up (jaws if it has half your health
  // or less, feet up to two-thirds), to carry off, bite, or drop from the sky
  // the islands' prey: a dwarf hadrosauroid and a dwarf titanosaur. A FULL
  // ADULT of either is just too heavy for Hatzegopteryx to lift (over two-
  // thirds of its 2100); every younger one can be carried off
  tethys: { hp: 1440, dmg: 75, speed: 116, sprint: 1.5, reach: 28, atkCd: 1.3, diet: 'herb', stamMax: 170, eco: 'archi', cost: 3200, req: 'ptero', growthRate: 0.9, swim: true, swimMul: 0.6, herdBorn: true },
  magyaro: { hp: 1480, dmg: 130, speed: 84, sprint: 1.35, reach: 40, atkCd: 1.6, diet: 'herb', stamMax: 150, eco: 'archi', cost: 3200, req: 'ptero', growthRate: 0.6, swim: true, swimMul: 0.55, herdBorn: true },
  hatzego: { hp: 2100, dmg: 240, speed: 132, sprint: 1.45, reach: 44, atkCd: 0.95, diet: 'carn', stamMax: 300, eco: 'archi', cost: 3500, req: 'magyaro', growthRate: 0.55, swim: true, swimMul: 0.55, flyer: true, flyMul: 1.65, snatch: true },
  poekilo: { hp: 3000, dmg: 260, speed: 124, sprint: 1.65, reach: 40, atkCd: 0.85, diet: 'carn', bleedBite: true, bleedMul: 1.2, stamMax: 155, eco: 'jungle', cost: 1200, req: 'neove', growthRate: 0.6, doubleBite: true, wrestler: true },
};

const NPC_DEF = {
  // turn = steering rate (rad/s): fast runners corner wide, so jukes can shake them
  // fears = [[species, radius]…] checked every think; fearless = immune to pack rout
  guanlong: { hp: 130, dmg: 26, atkCd: 0.9, speed: 148, detect: 230, homeR: 280, reach: 22, biome: 'forest', turn: 4.2, patience: 6.5, fears: [['moros', 170], ['huayango', 135]] },
  moros: { hp: 360, dmg: 70, atkCd: 1.1, speed: 200, detect: 300, homeR: 560, reach: 26, biome: 'plains', turn: 2.3, fears: [['huayango', 125]], hunts: ['guanlong'] },
  ornitho: { hp: 150, dmg: 0, atkCd: 0, speed: 232, detect: 260, homeR: 420, reach: 0, biome: 'plains', turn: 3.6 },
  scelido: { hp: 520, dmg: 85, atkCd: 1.7, speed: 82, fleeSpeed: 118, detect: 170, homeR: 240, reach: 30, biome: 'any', turn: 2.4, bleedable: true, caution: 1.5 },
  huayango: { hp: 1500, dmg: 110, atkCd: 2.1, speed: 55, detect: 95, homeR: 160, reach: 42, biome: 'forest', turn: 1.6, fearless: true, tank: true, bleedable: true, melee: { bleed: { dps: 7, dur: 8 }, kb: 160 } },
  // the valley's frail assassin: pathetic raw bite, blazing speed, and a wound
  // that will NOT close. Fears nothing, sometimes runs in small packs, and its
  // whole game is the bleed — hit, sprint away, wait it out, hit again. Frail
  // enough that Moros would crush it in a straight fight, but nothing that
  // underestimates it walks away clean. lungeMul 2.8 = an explosive dart-in
  lophos: { hp: 260, dmg: 22, atkCd: 1.0, speed: 214, detect: 300, homeR: 620, reach: 26, biome: 'plains', turn: 3.0, fearless: true, bleedable: true, lungeMul: 2.8, biteBleed: { dps: 15, dur: 10 }, hunts: ['ornitho'] },
  // --- Skull Prairie ---
  troodon: { hp: 150, dmg: 30, atkCd: 0.85, speed: 156, detect: 240, homeR: 300, reach: 22, biome: 'forest', turn: 4.5, patience: 6.5, fears: [['eotyrannus', 170], ['grunos', 150], ['kosmo', 120]] },
  eotyrannus: { hp: 430, dmg: 82, atkCd: 1.1, speed: 208, detect: 310, homeR: 600, reach: 28, biome: 'plains', turn: 2.2, fears: [['kosmo', 130]], hunts: ['troodon'] },
  grunos: { hp: 780, dmg: 100, atkCd: 1.3, speed: 118, detect: 260, homeR: 520, reach: 30, biome: 'plains', turn: 2.6, fearless: true, hunts: ['archeo', 'leaellyna', 'troodon'], caution: 0.9 },
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
  ugru: { hp: 620, dmg: 95, atkCd: 1.6, speed: 105, fleeSpeed: 142, detect: 210, homeR: 340, reach: 34, biome: 'plains', turn: 2.2, bleedable: true, melee: { kb: 200 }, caution: 1.2 },
  // the coast's true king: too big for crocodiles, flattens almost anything
  charono: { hp: 2400, dmg: 160, atkCd: 2.0, speed: 62, detect: 150, homeR: 300, reach: 46, biome: 'beach', turn: 1.5, fearless: true, tank: true, bleedable: true, melee: { kb: 260 } },
  // ornithomimid that kicks back when cornered, and takes a real beating
  archaomim: { hp: 260, dmg: 45, atkCd: 1.2, speed: 218, detect: 260, homeR: 420, reach: 24, biome: 'plains', turn: 3.4, melee: { kb: 260 } },
  // the azure raider: hesperaptor fills guanlong's niche around the mud grove
  hesper: { hp: 150, dmg: 28, atkCd: 0.9, speed: 150, detect: 235, homeR: 290, reach: 22, biome: 'forest', turn: 4.3, patience: 6.5, fears: [['concav', 160], ['charono', 130]] },
  // pack-brave claw hunter: swims deep water, and a pack never routs
  concav: { hp: 560, dmg: 88, atkCd: 1.0, speed: 165, detect: 280, homeR: 480, reach: 30, biome: 'plains', turn: 2.5, swims: true, packCourage: true, hunts: ['archaomim', 'ugru'], caution: 1.1, scavR: 240, scavPicky: true },
  // the lake's bass: harmless, quick, and tanky for its size
  bassb: { hp: 220, dmg: 0, atkCd: 0, speed: 150, detect: 130, homeR: 260, reach: 0, biome: 'lake', turn: 5.5, aquatic: true },
  // the coelacanth that rules the surf: slow, huge, and its tail slap hurts.
  // Too big to fear anything — the croc leaves it be
  herrie: { hp: 750, dmg: 70, atkCd: 1.6, speed: 55, detect: 120, homeR: 200, reach: 30, biome: 'sea', turn: 2.5, aquatic: true, fearless: true, tank: true, bleedable: true, melee: { kb: 220 } },
  // little armored basker: head hits glance off its skull-shield — aim for the tail
  scutelich: { hp: 130, dmg: 0, atkCd: 0, speed: 165, detect: 150, homeR: 300, reach: 0, biome: 'sea', turn: 5, aquatic: true, headArmor: 0.4 },
  // --- Ashfall Ridge ---
  // the apex of the ash: hunts nearly everything, up to and including near-adults
  tarbo: { hp: 2000, dmg: 170, atkCd: 1.4, speed: 122, detect: 330, homeR: 700, reach: 36, biome: 'plains', turn: 1.9, fearless: true, bleedable: true, hunts: ['ovi', 'shuv', 'linhe'], scavR: 300 },
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
  magnapaulia: { hp: 1800, dmg: 150, atkCd: 1.8, speed: 92, fleeSpeed: 120, detect: 240, homeR: 380, reach: 42, biome: 'plains', turn: 1.9, fearless: true, bleedable: true, melee: { kb: 260 }, caution: 1.2 },
  // the nodosaur: a medium tank in a bone coat — no club, no need
  panoplo: { hp: 1100, dmg: 110, atkCd: 1.9, speed: 60, detect: 130, homeR: 220, reach: 34, biome: 'any', turn: 1.7, fearless: true, tank: true, melee: { kb: 240 } },
  // the crested menace: knee-high and furious — it starts fights it has
  // no business starting, and wins more than it should
  proto: { hp: 380, dmg: 55, atkCd: 1.1, speed: 96, detect: 180, homeR: 260, reach: 24, biome: 'forest', turn: 3.0, melee: { kb: 140 }, caution: 0.75 },
  // the walking mountain: kills almost any predator with relative ease
  atlas: { hp: 4200, dmg: 360, atkCd: 2.4, speed: 66, detect: 210, homeR: 320, reach: 52, biome: 'plains', turn: 1.3, fearless: true, tank: true, bleedable: true, melee: { kb: 340 } },
  // pack raptor that fears not one playable: no fears list, and while a
  // packmate stands, nobody routs
  dakota: { hp: 280, dmg: 55, atkCd: 0.85, speed: 175, detect: 260, homeR: 340, reach: 24, biome: 'forest', turn: 4.2, patience: 7, packCourage: true },
  // the son's invention: small, weak, scruffy — but never alone for long
  aardi: { hp: 240, dmg: 38, atkCd: 0.8, speed: 168, detect: 250, homeR: 320, reach: 20, biome: 'forest', turn: 4.4, patience: 7, packCourage: true, fears: [['lourinha', 160], ['yuty', 140]] },
  // fast, robust-headed, and its bite has a reputation
  yuty: { hp: 1200, dmg: 140, atkCd: 1.2, speed: 150, detect: 300, homeR: 600, reach: 32, biome: 'plains', turn: 2.2, fearless: true, bleedable: true, hunts: ['proto', 'dakota'], caution: 0.8, scavR: 280, scavPicky: true },
  // the big fan-crested lambeosaurine — charonosaurus' niche, delta edition
  oloro: { hp: 1500, dmg: 130, atkCd: 1.9, speed: 80, fleeSpeed: 110, detect: 220, homeR: 340, reach: 44, biome: 'plains', turn: 1.7, fearless: true, bleedable: true, melee: { kb: 240 }, caution: 1.2 },
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
  lourinha: { hp: 1700, dmg: 160, atkCd: 1.3, speed: 128, detect: 320, homeR: 650, reach: 34, biome: 'plains', turn: 2.0, fearless: true, bleedable: true, biteBleed: { dps: 13, dur: 8 }, hunts: ['proto', 'dakota', 'oloro'], caution: 0.75, scavR: 300 },
  // the sawfish: lethal and angry — anything that touches its water is prey
  onchop: { hp: 500, dmg: 95, atkCd: 1.2, speed: 175, detect: 230, homeR: 400, reach: 26, biome: 'lake', turn: 3.5, fearless: true, aquatic: true, hunts: ['lepisosteus', 'bassb', 'scutelich'] },
  // ICHTHYODECTES: the archipelago's sea barracuda — quick, toothy, a minor
  // threat to a plesiosaur and a big one to small fish
  ichthyod: { hp: 240, dmg: 22, atkCd: 0.9, speed: 210, detect: 240, homeR: 700, reach: 22, biome: 'ocean', turn: 4.6, fearless: true, aquatic: true, bleedable: true, hunts: ['lepisosteus', 'bassb', 'scutelich'] },
  // the great coelacanth: immensely tanky, strong, and goes exactly nowhere
  mawsonia: { hp: 1600, dmg: 110, atkCd: 1.7, speed: 50, detect: 130, homeR: 220, reach: 32, biome: 'sea', turn: 2.2, fearless: true, tank: true, aquatic: true, bleedable: true, melee: { kb: 240 } },
  // ---- THE NIVALOTITAN WALL ----
  // the herd on the snowfields: a huge flat-headed polar edmontosaur-alike.
  // Warm to huddle beside — until the tail comes around
  // the Reach's tank: tankier than the poekilopleuron that hunts it. Three
  // weapons: the tail (dmg), a head-butt (ram) and the bone-breaking kick
  kunduro: { hp: 3600, dmg: 175, atkCd: 2.0, speed: 84, fleeSpeed: 118, detect: 190, homeR: 340, reach: 46, biome: 'forest', turn: 1.6, fearless: true, tank: true, bleedable: true, melee: { kb: 280 }, ram: { dmg: 200, cd: 4.5, kb: 380 }, kick: { dmg: 260, cd: 6.5, kb: 460, bone: true }, caution: 1.2 },
  // --- The Death Desert ---
  // the raptor packs of the dunes: fast, cheap, and everywhere
  // each raptor keeps to its own quarter of the map (the spawn table's zones)
  // and RIVALS the packs whose ground borders its own: a pack that meets a
  // rival pack will, now and then, pick the fight
  shri:      { hp: 260, dmg: 48, atkCd: 0.8, speed: 190, detect: 260, homeR: 380, reach: 22, biome: 'plains', turn: 4.2, patience: 8, bleedable: true, fears: [['beishan', 120], ['deltadro', 180]], rivals: ['kuru', 'tsaagan'] },
  kuru:      { hp: 320, dmg: 56, atkCd: 0.85, speed: 182, detect: 260, homeR: 380, reach: 24, biome: 'any', turn: 4.0, patience: 9, bleedable: true, packCourage: true, rivals: ['shri', 'adasaurus'] },
  tsaagan:   { hp: 300, dmg: 52, atkCd: 0.8, speed: 186, detect: 280, homeR: 400, reach: 23, biome: 'plains', turn: 4.2, patience: 8, bleedable: true, fears: [['deltadro', 180]], rivals: ['shri', 'adasaurus'] },
  mahakala:  { hp: 90, dmg: 18, atkCd: 0.6, speed: 200, detect: 220, homeR: 300, reach: 14, biome: 'forest', turn: 5.0, patience: 6, bleedable: true, hunts: ['epidex'], fears: [['coelo', 150], ['shri', 120], ['kuru', 120], ['luanchuan', 120]] },
  luanchuan: { hp: 220, dmg: 44, atkCd: 0.75, speed: 195, detect: 260, homeR: 360, reach: 21, biome: 'forest', turn: 4.4, patience: 8, bleedable: true, rivals: ['procomp', 'adasaurus'] },
  adasaurus: { hp: 240, dmg: 46, atkCd: 0.8, speed: 188, detect: 260, homeR: 380, reach: 22, biome: 'any', turn: 4.2, patience: 8, bleedable: true, rivals: ['kuru', 'tsaagan', 'luanchuan'] },
  // the ostrich herds: runners, and one that is far too big to run from
  garudi:    { hp: 520, dmg: 0, atkCd: 0, speed: 176, fleeSpeed: 214, detect: 300, homeR: 420, reach: 0, biome: 'plains', turn: 3.2, bleedable: true },
  harpy:     { hp: 480, dmg: 0, atkCd: 0, speed: 170, fleeSpeed: 206, detect: 300, homeR: 420, reach: 0, biome: 'plains', turn: 3.2, bleedable: true },
  sinorni:   { hp: 420, dmg: 0, atkCd: 0, speed: 180, fleeSpeed: 220, detect: 320, homeR: 440, reach: 0, biome: 'plains', turn: 3.4, bleedable: true },
  kinnaree:  { hp: 400, dmg: 0, atkCd: 0, speed: 178, fleeSpeed: 216, detect: 300, homeR: 420, reach: 0, biome: 'any', turn: 3.4, bleedable: true },
  beishan:   { hp: 1500, dmg: 110, atkCd: 1.4, speed: 140, fleeSpeed: 176, detect: 260, homeR: 420, reach: 34, biome: 'plains', turn: 2.4, bleedable: true, melee: { kb: 260 } },
  aepyorni:  { hp: 450, dmg: 0, atkCd: 0, speed: 184, fleeSpeed: 224, detect: 320, homeR: 440, reach: 0, biome: 'plains', turn: 3.4, bleedable: true },
  // wild homalocephale: small herds that ram what crowds them
  homalo:    { hp: 700, dmg: 85, atkCd: 1.2, speed: 136, fleeSpeed: 156, detect: 230, homeR: 340, reach: 26, biome: 'forest', turn: 2.6, bleedable: true, melee: { kb: 280 }, caution: 1.2, meatMul: 0.6 },   // a small animal: little meat on it
  // wild procompsognathus: kin for the alpha, a nuisance for everyone else
  procomp:   { hp: 200, dmg: 32, atkCd: 0.7, speed: 160, detect: 240, homeR: 340, reach: 18, biome: 'forest', turn: 4.6, patience: 7, packCourage: true, bleedable: true, fears: [['eocarch', 200], ['deltadro', 160]] },
  // the hadrosaurs: the little ones run, the middle ones fight only when the
  // odds are good, the big one stands. All keep to the water
  willina:   { hp: 2600, dmg: 165, atkCd: 2.0, speed: 84, fleeSpeed: 120, detect: 180, homeR: 360, reach: 46, biome: 'forest', turn: 1.6, fearless: true, tank: true, bleedable: true, melee: { kb: 280 } },
  bonaparte: { hp: 1900, dmg: 150, atkCd: 1.9, speed: 90, fleeSpeed: 126, detect: 190, homeR: 340, reach: 42, biome: 'forest', turn: 1.7, tank: true, bleedable: true, melee: { kb: 260 }, caution: 1.2 },
  huallas:   { hp: 1100, dmg: 110, atkCd: 1.7, speed: 104, fleeSpeed: 146, detect: 220, homeR: 380, reach: 36, biome: 'forest', turn: 2.1, bleedable: true, melee: { kb: 220 }, caution: 1.4 },
  kelumapu:  { hp: 1000, dmg: 105, atkCd: 1.7, speed: 100, fleeSpeed: 140, detect: 210, homeR: 340, reach: 36, biome: 'forest', turn: 2.0, bleedable: true, melee: { kb: 220 }, caution: 1.4 },
  gilmoreo:  { hp: 900, dmg: 95, atkCd: 1.6, speed: 108, fleeSpeed: 148, detect: 220, homeR: 380, reach: 34, biome: 'forest', turn: 2.2, bleedable: true, melee: { kb: 200 }, caution: 1.5 },
  bactro:    { hp: 640, dmg: 80, atkCd: 1.6, speed: 96, fleeSpeed: 136, detect: 210, homeR: 320, reach: 30, biome: 'forest', turn: 2.3, bleedable: true, melee: { kb: 180 }, caution: 1.6 },
  plesio:    { hp: 560, dmg: 0, atkCd: 0, speed: 130, fleeSpeed: 178, detect: 280, homeR: 460, reach: 0, biome: 'plains', turn: 3.0, bleedable: true },
  // wild aerosteon: pairs and trios that never give up a chase (no patience),
  // never rout while a packmate stands, and leave wounds that bleed and bleed
  aero:      { hp: 1500, dmg: 140, atkCd: 0.8, speed: 172, detect: 320, homeR: 620, reach: 32, biome: 'plains', turn: 3.2, packCourage: true, bleedable: true, biteBleed: { dps: 9, dur: 24 }, hunts: ['huallas', 'gilmoreo', 'bactro', 'kelumapu', 'plesio', 'garudi', 'harpy', 'kinnaree', 'aepyorni'], fears: [['eocarch', 200]] },
  // the two land theropods
  deltadro: { hp: 900, dmg: 115, atkCd: 0.9, speed: 208, detect: 340, homeR: 700, reach: 30, biome: 'plains', turn: 2.4, bleedable: true, hunts: ['garudi', 'harpy', 'sinorni', 'kinnaree', 'aepyorni', 'plesio', 'shri', 'tsaagan'], caution: 0.95, fears: [['eocarch', 220]] },
  eocarch:   { hp: 2400, dmg: 215, atkCd: 1.1, speed: 116, detect: 320, homeR: 520, reach: 40, biome: 'forest', turn: 1.9, fearless: true, bleedable: true, biteBleed: { dps: 10, dur: 8 }, hunts: ['huallas', 'gilmoreo', 'bactro', 'kelumapu', 'plesio', 'beishan', 'coelo', 'procomp'], scavR: 320, caution: 0.9 },
  // the river's theropod and its crocodile
  suchos:    { hp: 1100, dmg: 125, atkCd: 1.0, speed: 92, detect: 260, homeR: 300, reach: 34, biome: 'forest', turn: 2.0, fearless: true, bleedable: true, hunts: ['lepisosteus', 'kelumapu', 'epidex', 'procomp'], caution: 1.0 },   // 'beach' means sand — on this map that is the whole desert; the river belt is forest
  // the ribbon-tail: a mouthful that lives in the river belt
  epidex:    { hp: 40, dmg: 0, atkCd: 0, speed: 150, fleeSpeed: 190, detect: 200, homeR: 200, reach: 0, biome: 'forest', turn: 6, bleedable: false },
  // THE GIANT OF THE RED SAND: one Yunmenglong plods the whole desert from
  // crown to crown. Ten thousand hp, wounds that barely bleed, a tail that
  // can crack bone — and the STOMP: up on the hind legs (slowly: that's the
  // warning), then the whole front comes down. Near it hurts; UNDER it kills
  yunmeng:   { hp: 11500, dmg: 260, atkCd: 2.1, speed: 46, detect: 120, homeR: 3200, reach: 64, biome: 'forest', turn: 0.9, fearless: true, tank: true, giant: true, bleedable: true, bleedResist: 0.3, hide: 0.55, melee: { kb: 560 },
               tailBone: { mul: 0.6, max: 0.14 }, trample: { dmg: 180, cd: 1.2 },
               stomp: { cd: 5, wind: 1.7, r: 260, under: 80, dmg: 440, underDmg: 3000 },
               // the PUNCH: a fast forefoot jab at whatever crowds the front feet
               // (wind = the brief lift that warns of it; reach/r in adult-scale px)
               punch: { dmg: 750, cd: 2.2, wind: 0.28, reach: 62, r: 46, kb: 460 } },
  // THE GUARDIAN OF THE GIANTS' CRADLE: a shieldcroc as long as a hadrosaur,
  // all but invisible under its pond. Takes whatever comes down to the
  // water — and every so often it hauls out to walk the nursery
  aegisu:    { hp: 3400, dmg: 300, atkCd: 1.5, speed: 78, detect: 330, homeR: 130, reach: 46, biome: 'water', turn: 1.8, fearless: true, aquatic: true, amphibious: true, bleedable: true, bleedResist: 0.5, gripDrain: 0.3, melee: { kb: 240, bleed: { dps: 12, dur: 8 } } },
  kerbero: { hp: 2200, dmg: 155, atkCd: 2.0, speed: 88, fleeSpeed: 128, detect: 170, homeR: 320, reach: 44, biome: 'plains', turn: 1.7, fearless: true, tank: true, bleedable: true, melee: { kb: 260 } },
  // the shaggy guardian of the pine belt: plants itself and rakes with
  // feathered scythe arms — the wounds stay open in the cold
  beipiao: { hp: 900, dmg: 120, atkCd: 1.6, speed: 75, detect: 130, homeR: 220, reach: 34, biome: 'forest', turn: 1.9, fearless: true, tank: true, bleedable: true, melee: { bleed: { dps: 6, dur: 6 }, kb: 200 } },
  // the scavenger gang: snow-white troodontids that trail every blizzard,
  // picking at whatever froze — bold in a pack, gone in a blink alone
  pectino: { hp: 260, dmg: 55, atkCd: 0.9, speed: 132, fleeSpeed: 148, detect: 220, homeR: 420, reach: 24, biome: 'any', turn: 2.6, patience: 6, packCourage: true, caution: 1.1 },
  // the king of the Wall: the polar tyrant. Fears nothing, hunts everything,
  // and the mist is on ITS side
  nanuq: { hp: 2300, dmg: 190, atkCd: 1.5, speed: 118, detect: 330, homeR: 700, reach: 38, biome: 'any', turn: 1.9, fearless: true, bleedable: true, hunts: ['kerbero', 'pectino', 'beipiao', 'korean'], caution: 0.8 },
  // the TITAN-KILLER: one single Titanovenator walks the whole mountain, and
  // it is the one hunter with no upper size limit — a full-grown nivalotitan
  // is not safe. Its bite opens wounds that refuse the cold's mercy.
  titanov: { hp: 2600, dmg: 210, atkCd: 1.7, speed: 108, detect: 380, homeR: 900, reach: 42, biome: 'any', turn: 1.7, fearless: true, bleedable: true, biteBleed: { dps: 14, dur: 9 }, hunts: ['kerbero', 'beipiao'], caution: 0.7, scavR: 300, scavMin: 30 },
  // the snowball underfoot: a tiny burrowing ornithopod, everyone's lunch
  korean: { hp: 200, dmg: 25, atkCd: 1.2, speed: 120, fleeSpeed: 155, detect: 200, homeR: 240, reach: 18, biome: 'forest', turn: 3.5 },
  // ---- THE GREAT MOORS OF MARTULISTH ----
  // spindly microraptorine ghosts — glass-fragile, all legs, bold in packs
  gracili: { hp: 120, dmg: 24, atkCd: 0.85, speed: 172, detect: 240, homeR: 300, reach: 20, biome: 'forest', turn: 4.4, patience: 7, fears: [['duria', 180], ['drypto', 160]], caution: 1.1 },
  // the marsh-dwarf hadrosaur: small herd prey that still swings back
  telmato: { hp: 480, dmg: 70, atkCd: 1.7, speed: 98, fleeSpeed: 132, detect: 200, homeR: 320, reach: 30, biome: 'plains', turn: 2.3, bleedable: true, melee: { kb: 180 }, caution: 1.2 },
  // the flat-headed heavyweight of the herds
  tanius: { hp: 900, dmg: 105, atkCd: 1.7, speed: 88, fleeSpeed: 118, detect: 210, homeR: 330, reach: 36, biome: 'plains', turn: 2.0, fearless: true, bleedable: true, melee: { kb: 220 }, caution: 1.2 },
  // the wanderer separated from its kin — a mid herd duckbill
  secerno: { hp: 700, dmg: 90, atkCd: 1.6, speed: 95, fleeSpeed: 126, detect: 205, homeR: 340, reach: 33, biome: 'plains', turn: 2.1, bleedable: true, melee: { kb: 200 }, caution: 1.2 },
  // the spiked shield: gnarled frill blades, a tank that holds its ground
  spiclypeus: { hp: 1300, dmg: 130, atkCd: 1.9, speed: 74, detect: 170, homeR: 260, reach: 36, biome: 'plains', turn: 1.8, fearless: true, tank: true, bleedable: true, melee: { kb: 240 } },
  // the winged helm: elegant, wary, and heavier than it looks in the mist
  mercuri: { hp: 1100, dmg: 115, atkCd: 1.8, speed: 80, detect: 175, homeR: 280, reach: 34, biome: 'plains', turn: 1.9, tank: true, bleedable: true, melee: { kb: 220 } },
  // the longest brow horns on the moor — and a TELEGRAPHED charge behind them
  coahuila: { hp: 1700, dmg: 165, atkCd: 2.0, speed: 70, detect: 180, homeR: 260, reach: 40, biome: 'plains', turn: 1.7, fearless: true, tank: true, bleedable: true, melee: { kb: 300 }, chargeR: 160, lungeT: 0.65, lungeMul: 3.2 },
  // --- Ashfall Ridge's new cast ---
  // the young mountain: too big to argue with, ember seams down its flanks
  vulcano: { hp: 2400, dmg: 200, atkCd: 1.9, speed: 70, detect: 170, homeR: 320, reach: 50, biome: 'plains', turn: 1.4, fearless: true, tank: true, bleedable: true, melee: { kb: 320 } },
  // the ash sparrows: crow-sized, everywhere, gone the moment you look
  shanag: { hp: 70, dmg: 10, atkCd: 0.8, speed: 190, detect: 250, homeR: 380, reach: 14, biome: 'plains', turn: 4.5 },
  // the cinder bear: a raptor built like a brawler — the pack fills the gap
  // between linheraptor's needling and tarbosaurus' verdict
  achillo: { hp: 520, dmg: 95, atkCd: 1.0, speed: 165, detect: 280, homeR: 380, reach: 28, biome: 'forest', turn: 3.6, patience: 7, packCourage: true, fears: [['tarbo', 180]] },
  // the rammer: mild until it isn't — then it arrives dome-first
  preno: { hp: 1000, dmg: 120, atkCd: 1.2, speed: 130, fleeSpeed: 150, detect: 240, homeR: 340, reach: 26, biome: 'plains', turn: 2.6, bleedable: true, melee: { kb: 300 }, caution: 1.1 },
  // the vast frill looming out of the grey: big body, bigger temper
  bravo: { hp: 2000, dmg: 175, atkCd: 2.1, speed: 66, detect: 170, homeR: 250, reach: 42, biome: 'plains', turn: 1.6, fearless: true, tank: true, bleedable: true, melee: { kb: 280 } },
  // the Dorset hunter: the moor's fearless terror — it hunts through the
  // mist and never, ever routs
  duria: { hp: 2400, dmg: 200, atkCd: 1.4, speed: 118, detect: 340, homeR: 720, reach: 36, biome: 'any', turn: 1.9, fearless: true, bleedable: true, hunts: ['telmato', 'secerno', 'gracili'], caution: 0.8 },
  // wild dryptosaurus prowl the north — long, fast, and fearless
  drypto: { hp: 1800, dmg: 160, atkCd: 1.2, speed: 135, detect: 320, homeR: 650, reach: 36, biome: 'plains', turn: 2.3, fearless: true, bleedable: true, hunts: ['tanius', 'telmato'], caution: 1.2 },
  // ---- THE SODDEN REACH ----
  // plate-ribbed browser: thin bony plates run along its flanks, and it
  // moves in loose family parties through the undergrowth
  talenk: { hp: 620, dmg: 78, atkCd: 1.6, speed: 118, fleeSpeed: 152, detect: 215, homeR: 340, reach: 30, biome: 'forest', turn: 2.4, bleedable: true, melee: { kb: 180 }, caution: 1.2 },
  // the big enigma: the same rib plates on a far heavier frame — the herd's
  // anchor, and slow to decide that anything is worth fearing
  macrog: { hp: 1250, dmg: 120, atkCd: 1.7, speed: 96, fleeSpeed: 124, detect: 220, homeR: 360, reach: 38, biome: 'forest', turn: 2.0, fearless: true, bleedable: true, melee: { kb: 230 }, caution: 1.2 },
  // the guillotine-beaked titanosaur: crops the canopy with a squared jaw
  // and simply does not notice most of what happens beneath it
  bonita: { hp: 3200, dmg: 250, atkCd: 2.3, speed: 66, detect: 200, homeR: 320, reach: 50, biome: 'plains', turn: 1.4, fearless: true, tank: true, bleedable: true, melee: { kb: 320 } },
  // the dwarf titanosaur: sauropod bulk squeezed small enough for the
  // thickets — still far too much animal for most of the Reach
  overo: { hp: 2200, dmg: 180, atkCd: 2.1, speed: 74, detect: 190, homeR: 300, reach: 44, biome: 'forest', turn: 1.6, fearless: true, tank: true, bleedable: true, melee: { kb: 270 } },
  // the bulldog abelisaur: a deep rugose skull, useless arms, and a temper.
  // It fights entirely with its face
  skorpio: { hp: 1600, dmg: 170, atkCd: 1.5, speed: 124, detect: 300, homeR: 620, reach: 32, biome: 'any', turn: 2.0, fearless: true, bleedable: true, hunts: ['talenk', 'hypsi'], caution: 0.95 },
  // the hook-toothed oddity: forward-jutting front teeth for snatching small
  // prey out of the leaf litter. Quick, low, and strange
  masiak: { hp: 300, dmg: 52, atkCd: 0.8, speed: 158, detect: 250, homeR: 400, reach: 20, biome: 'forest', turn: 4.0, patience: 7, packCourage: true, caution: 1.1 },
  // the dog-croc: long-legged, land-going, and utterly at home when the
  // rivers climb their banks
  arari: { hp: 420, dmg: 62, atkCd: 1.0, speed: 128, detect: 230, homeR: 380, reach: 22, biome: 'any', turn: 3.0, amphibious: true, swims: true, bleedable: true, hunts: ['hypsi'], caution: 1.1 },
  // ---- the Lesser Archipelago ----
  // the island ornithopods: squat little zalmoxes on every island but
  // Utoriana, and Narapa's herds of plain small duckbills
  zalmox: { hp: 420, dmg: 55, atkCd: 1.4, speed: 112, fleeSpeed: 140, detect: 210, homeR: 320, reach: 24, biome: 'any', turn: 2.6, bleedable: true, melee: { kb: 160 }, caution: 1.2 },
  iani: { hp: 1100, dmg: 70, atkCd: 1.2, speed: 120, fleeSpeed: 150, detect: 230, homeR: 360, reach: 22, biome: 'any', turn: 2.8, bleedable: true, melee: { kb: 140 }, caution: 1.2 },
  hypsi: { hp: 300, dmg: 18, atkCd: 0.8, speed: 140, fleeSpeed: 190, detect: 240, homeR: 220, reach: 14, biome: 'any', turn: 4.0, bleedable: true, caution: 2.0, landBound: true },
  fylax: { hp: 520, dmg: 68, atkCd: 1.6, speed: 104, fleeSpeed: 138, detect: 220, homeR: 340, reach: 28, biome: 'plains', turn: 2.4, bleedable: true, melee: { kb: 180 }, caution: 1.2 },
  // CHENANISAURUS: Narapa's own abelisaur. Big, slow and fearless; it
  // hunts the island's herds and anything else that comes ashore
  chenani: { hp: 2900, dmg: 230, atkCd: 1.4, speed: 100, detect: 300, homeR: 700, reach: 36, biome: 'any', turn: 1.8, fearless: true, bleedable: true, hunts: ['zalmox', 'telmato', 'fylax'], caution: 1.0 },
  // PTERODACTYLUS: the gulls of the archipelago — they fly (npcFlight), so
  // the sea is no barrier, and their whole life is the next carcass
  ptero: { hp: 110, dmg: 12, atkCd: 0.8, speed: 55, fleeSpeed: 60, detect: 160, homeR: 700, reach: 14, biome: 'any', turn: 4.2, swims: true, flyer: true, flyMul: 2.8, scavR: 1100, bleedable: true, caution: 1.4 },
  // the islands' prey (herds of every age: see `ages` in the spawns)
  tethys: { hp: 1440, dmg: 75, atkCd: 1.6, speed: 104, fleeSpeed: 136, detect: 220, homeR: 340, reach: 28, biome: 'any', turn: 2.4, bleedable: true, melee: { kb: 180 }, caution: 1.2, noPile: true },
  magyaro: { hp: 1480, dmg: 130, atkCd: 2.0, speed: 70, fleeSpeed: 94, detect: 200, homeR: 320, reach: 40, biome: 'any', turn: 1.6, bleedable: true, melee: { kb: 240, noPile: true }, caution: 1.0 },
  // the sky's king: three wild ones roam the archipelago, flying LOW, and
  // now and then carry something off (thinkHatzego). noCover: never goes in
  // under the trees
  hatzego: { hp: 2100, dmg: 200, atkCd: 1.2, speed: 110, fleeSpeed: 120, detect: 380, homeR: 5000, reach: 44, biome: 'any', turn: 2.2, swims: true, flyer: true, flyMul: 1.6, bleedable: true, fearless: true, snatcher: true, noCover: true, caution: 0.6 },
  // GARAMIRALA: keeper of the straits. Fearless and merciless, it never
  // leaves deep water (deepOnly — the shallows are safe ground) or strays far
  // from its strait. Tuned against a growing Ekrixinatosaurus: a hatchling
  // to a fresh sub-adult is a meal, a half-grown sub-adult an even fight it
  // slightly wins, and a grown adult sees it off
  garami: { hp: 2600, dmg: 245, atkCd: 0.7, lungeMul: 1.35, speed: 280, detect: 440, homeR: 560, reach: 34, biome: 'ocean', turn: 3.2, aquatic: true, deepOnly: true, fearless: true, bleedable: true, melee: { kb: 260 } },
  kaiwhe: { hp: 1100, dmg: 80, atkCd: 0.9, speed: 100, detect: 300, homeR: 450, reach: 30, biome: 'ocean', turn: 3.0, aquatic: true, bleedable: true, melee: { kb: 120 }, caution: 1.0 },
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
    alive: true, causeOfDeath: null, bornAt: 0, wins: false, gen: 1,
  };
}
function hpFrac(g) { return 0.12 + 0.88 * g; }
function dmgFrac(g) { return 0.15 + 0.85 * g; }
// APPETITE: bigger animals need more food. A bite of meat fills every
// animal the same amount, but a big one has to tear off (and use up) that
// much more of the carcass to get it; a fern or a mouthful of canopy fills a
// small animal more and a big one less. 1 = a grown Rajasaurus.
function appetite(p) {
  const d = DINO[p.species];
  return clamp(d.scale * sizeScale(p.growth) * genderMod(p).size, 0.35, 3.5);
}
function plantFill(p) { return clamp(1 / Math.sqrt(appetite(p)), 0.6, 1.4); }
function playerMaxHp() { return Math.round(PLAYER_DEF[G.player.species].hp * genderMod(G.player).hp * hpFrac(G.player.growth)); }
function playerDmg() {
  const p = G.player, def = PLAYER_DEF[p.species];
  let dmg = def.dmg * genderMod(p).dmg * dmgFrac(p.growth);
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

// ---------- FLIGHT: altitude decides who can touch whom ----------
// A flyer's SHADOW is where it really is on the map; its altitude lifts the
// body off it. Two animals can only fight when their shadows meet AND their
// heights do: two flyers within AIR_BAND of each other, or a flyer low enough
// to come within a grounded animal's head height (the tall reach higher).
const FLY_CEIL = 480;     // the highest a flyer climbs (px above its shadow) — pterosaurs go HIGH
const FLY_CLIMB = 150;    // px/s climbing while SPACE is held
const FLY_SINK = 75;      // px/s descent the moment it's let go — all the way down
const AIR_BAND = 28;      // two flyers this close in height can fight
const AIR_PAD = 12;       // shadow-contact slack (the reach of a jaw / a wing)
function isAirborne(e) { return (e.alt || 0) > 0.5; }
// a grounded animal can't get at `t` up there (with a little slack, so a
// flyer skimming just above its head still draws a snap)
function outOfReachAbove(e, t) {
  return !!t && isAirborne(t) && !isAirborne(e) && t.alt > reachHeight(e) + 20;
}
// how high above the ground a grounded animal's jaws can reach
function reachHeight(e) {
  const d = DINO[e.species];
  if (!d) return 20;
  if (d.fish || d.marine) return 6;   // sea creatures don't leap for birds
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  return zoneHeights(d).head * s + 10;
}
function airReach(a, t) {
  const aa = a.alt || 0, ta = t.alt || 0;
  if (aa <= 0.5 && ta <= 0.5) return true;
  // shadows apart? Measured body-to-body AND from the attacker's weapon on the
  // ground — a giant's bill strikes far out in front of its own shadow
  const wp = DINO[a.species] && !DINO[a.species].fish ? weaponPos(a) : null;
  const near = dist(a.x, a.y, t.x, t.y) <= bodyRadius(a) + bodyRadius(t) + AIR_PAD ||
    (wp && dist(wp.x, wp.y, t.x, t.y) <= wp.r + bodyRadius(t) + AIR_PAD);
  if (!near) return false;
  if (aa > 0.5 && ta > 0.5) return Math.abs(aa - ta) < AIR_BAND;
  if (ta > 0.5) return ta <= reachHeight(a);   // grounded jaws vs a low flyer
  return aa <= reachHeight(t);                 // a flyer swooping on something tall enough
}
function dealDamage(target, amount, attacker, opts) {
  opts = opts || {};
  if (target.isPlayer && !target.alive) return;
  if (!target.isPlayer && target.hp <= 0) return;
  if (attacker && attacker.x != null && attacker.species && !opts.force && !airReach(attacker, target)) return;
  // the AGILE (Utoriana's dwarf homalocephale) jink out from under jaws
  // that are much bigger than they are — a young abelisaur lands its bites,
  // a grown one closes on empty air more often than not
  if (target.agile && attacker && !target.isPlayer) {
    const ratio = bodyRadius(attacker) / Math.max(1, bodyRadius(target));
    if (Math.random() < clamp((ratio - 2.2) * 1.5, 0, 0.93)) {
      floatText(target.x, target.y - 30, 'dodged!', '#ffe9a0');
      target.orbitDir = -(target.orbitDir || 1);
      target.vx += rrange(-120, 120); target.vy += rrange(-120, 120);
      target.spookT = 1.4;   // and it bolts clear while the big jaws reset
      if (attacker.isPlayer) { target.state = 'flee'; target.target = attacker; target.stateT = 2.5; }
      return;
    }
  }
  if (G.cine && (target.isPlayer || isFamily(target) || target.cineTo)) return;
  let dmg = amount;
  let crit = false;
  let glance = false;
  // a broken skull (or body) takes the force out of every attack it makes
  if (attacker && !attacker.isPlayer) dmg *= crippleBiteMul(attacker);
  if (attacker && attacker.dmgMul) dmg *= attacker.dmgMul;   // island dwarfs bite softer
  if (attacker && attacker.elder) dmg *= ELDER_DMG;   // the old giants hit harder
  // a sauropod's hide: every blow lands at a fraction (the bleed has its own resist)
  if (!target.isPlayer && (NPC_DEF[target.species] || {}).hide) dmg *= NPC_DEF[target.species].hide;
  // simosuchus down its burrow: only the armored backside shows — bites
  // barely scratch it, and the frustrated attacker gives the whole thing up
  if (target.isPlayer && target.hidden) {
    // a panic-burrower vanishes completely — the hole is too tight and too
    // sudden to be worth digging out (it just cannot stay down for long)
    const hidDef = PLAYER_DEF[target.species] || {};
    dmg = hidDef.panicBurrow ? 0 : Math.max(1, dmg * 0.06);
    if (attacker && !attacker.isPlayer) {
      attacker.state = 'return'; attacker.stateT = 6; attacker.target = null;
      attacker.tiredT = Math.max(attacker.tiredT || 0, 9);
      floatText(target.x, target.y - 46, 'a butt of stone — it gives up!', '#cbb98a');
    }
  }
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
  // an aerosteon at war with a giant calls its kin — once per giant
  if (G.player && G.player.species === 'aero' && attacker) {
    if (attacker === G.player && target.species === 'yunmeng') kinJoinsBloodshed(target);
    else if (target === G.player && attacker.species === 'yunmeng') kinJoinsBloodshed(attacker);
  }
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
    // (and so does the giant's hide: NPC_DEF bleedResist)
    const br = (target.isPlayer ? PLAYER_DEF[target.species].bleedResist : (NPC_DEF[target.species] || {}).bleedResist) || 1;
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
  const meat = Math.round(e.maxhp * 0.55 * ((NPC_DEF[e.species] || {}).meatMul || 1));
  G.carcasses.push({ x: e.x, y: e.y, species: e.species, growth: e.growth, meat, maxMeat: meat, t: 0 });
  const i = G.npcs.indexOf(e);
  if (i >= 0) G.npcs.splice(i, 1);
  // PACKBREAKER: the player felled the last member of a wild pack
  if (attacker && attacker.isPlayer && e.packId &&
      !G.npcs.some(o => o.species === e.species && o.packId === e.packId && o.hp > 0) &&
      typeof Save !== 'undefined' && !Save.packBreaker) {
    Save.packBreaker = true;
    if (typeof syncTitles === 'function') syncTitles();
  }
  // FEAR: watching one of your own die breaks the pack's nerve — survivors rout
  if (!(NPC_DEF[e.species] || { fearless: true }).fearless) {
    let fled = 0;
    const threat = attacker || { x: e.x, y: e.y };
    for (const o of G.npcs) {
      if (o.species !== e.species || !NPC_DEF[o.species]) continue;   // mates & babies never rout
      if (o.feud) continue;                                           // a feud outweighs fear
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
  if (e.species === 'yunmeng' && !e.cradle && G.player && dist(e.x, e.y, G.player.x, G.player.y) < 900) {
    G.banner = { str: (e.elder ? 'THE ELDER FALLS' : 'THE GIANT FALLS') + ' — a mountain of meat for whoever holds it.', t: 6, color: '#ffd23e' };
  }
  if (attacker && attacker.isPlayer) {
    SFX.kill();
    floatText(e.x, e.y - 30, DINO[e.species].name + ' slain', '#ffd23e');
    // DEEDS: some coats are earned. A grown Poekilopleuron that fells a
    // Kundurosaurus has slain a giant
    if (e.species === 'kunduro' && attacker.species === 'poekilo' && attacker.growth >= 0.9 && typeof Save !== 'undefined' && !Save.kunduroKill) {
      Save.kunduroKill = true;
      G.banner = { str: 'GIANT SLAIN — the Slayer of Giants coat is yours to buy.', t: 6, color: '#ffd23e' };
      if (typeof saveSave === 'function') saveSave();
    }
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
  for (const e of G.npcs) e.feud = false;        // the feud dies with you
  for (const c of G.carcasses) c.claim = null;   // and so do your claims
  SFX.die();
  G.onPlayerDeath && G.onPlayerDeath(cause);
}

// ---------- movement helpers ----------
// how fast the ground lets an animal move. Water slows everyone; DEEP water
// (anywhere — the rivers' channels, the ponds' hearts, the island shelves)
// is crossable by all now, but only at a swim: slow for most, slower still
// for the heavyweights. Fish and the water's own keep their usual pace
const MARINE_FAMILY_SWIM = 1.6;   // a plesiosaur mate's or baby's pace in water (their base is a walking speed)
function terrainSpeedAt(x, y, e) {
  // a flyer on the wing: the ground below doesn't matter at all
  if (e && (e.alt || 0) > 0) {
    const fd = e.isPlayer ? PLAYER_DEF[e.species] : (NPC_DEF[e.species] || PLAYER_DEF[e.species] || {});
    return fd.flyMul || 2;
  }
  // a plesiosaur mate or baby lives by the same rule as the player: at home
  // in the water (quick enough to keep up with you), barely able to drag
  // itself along on land
  if (e && !e.isPlayer && DINO[e.species] && DINO[e.species].marine)
    return isWaterPx(x, y) ? MARINE_FAMILY_SWIM : e.landHunt ? 0.55 : ((PLAYER_DEF[e.species] || {}).landMul || 0.2);
  const t = terAtPx(x, y);
  if (t === T_WATER) return 0.55;
  if (t === T_DEEP || t === T_SWIM) {
    if (!e) return 0.55;
    const nd = e.isPlayer ? null : NPC_DEF[e.species];
    if (nd && (nd.aquatic || nd.swims || nd.amphibious)) return 0.55;
    return isHeavySwimmer(e) ? 0.28 : 0.4;
  }
  if (isMudPx(x, y)) return 0.72;
  if (isLavaPx(x, y)) return 0.8;   // crossable — at a price
  if (isCliffPx(x, y)) return 0.5;  // climbing a wall is slow, careful going
  return 1;
}
// the big and the armoured wallow across rather than swim
function isHeavySwimmer(e) {
  const d = DINO[e.species];
  if (!d) return false;
  if (e.isPlayer) return d.scale >= 1.5 || (PLAYER_DEF[e.species].speed || 100) < 90;
  const nd = NPC_DEF[e.species] || {};
  return d.scale >= 1.5 || !!nd.tank || !!nd.giant;
}
function collideStatics(e, r) {
  // up in the air nothing on the ground is in the way — only the map's edge
  if ((e.alt || 0) > 2) {
    e.x = clamp(e.x, 10, WORLD_W - 10);
    e.y = clamp(e.y, 10, WORLD_H - 10);
    return;
  }
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
  // the land-bound (Okiri's Hypsilophodon) are always nudged back onto dry
  // ground, unless they're actually drinking
  if (!e.isPlayer && NPC_DEF[e.species] && NPC_DEF[e.species].landBound && e.state !== 'drink' && isWaterPx(e.x, e.y)) {
    const la = landDir(e.x, e.y);
    if (la != null) { e.x += Math.cos(la) * 3; e.y += Math.sin(la) * 3; }
  }
  // deep water is a slow swim for anyone (terrainSpeedAt) — but SWIMMER'S
  // DEPTH, the open ocean past the island shelves, is for swimmers only
  if (isSwimPx(e.x, e.y) && !canSwimDeep(e)) {
    // out at sea with nothing driving it any more: far from home, it swims
    // for home; close in, it just turns back onto the shelf
    if (!e.isPlayer && e.home && dist(e.x, e.y, e.home.x, e.home.y) > 500) { e.state = 'swimHome'; e.stateT = 40; e.target = null; }
    else {
      const a = shelfDir(e.x, e.y);
    e.x += Math.cos(a) * 3;
    e.y += Math.sin(a) * 3;
  }
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
// SWIMMER'S DEPTH: every animal CAN swim it, but none goes in by choice —
// only after its leader (or parent), after its prey, away from a hunter, or
// swimming back home to its own island
const SWIM_DRIVEN = new Set(['follow', 'flee', 'cover', 'chase', 'stoop', 'fight', 'windup', 'lunge', 'recover', 'swimHome']);
function canSwimDeep(e) {
  if (e.isPlayer) return true;   // the player can always swim it (a non-swimmer only very slowly)
  const nd = NPC_DEF[e.species];
  if ((nd && (nd.aquatic || nd.swims)) || (!nd && PLAYER_DEF[e.species] && PLAYER_DEF[e.species].swim)) return true;
  return SWIM_DRIVEN.has(e.state);
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
// direction out of swimmer's depth, back onto the shelf
function shelfDir(x, y) {
  for (let r = TILE; r <= TILE * 12; r += TILE) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU;
      if (!isSwimPx(x + Math.cos(a) * r, y + Math.sin(a) * r)) return a;
    }
  }
  return 0;
}
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
  // a broken tail steers for it: every so often the animal veers the WRONG
  // way entirely (the target mirrors through its own body)
  if (e.wrongT > 0) { tx = e.x - (tx - e.x); ty = e.y - (ty - e.y); }
  const d = dist(e.x, e.y, tx, ty);
  if (d < 2) { e.move = lerp(e.move, 0, 0.2); return true; }
  // steering with inertia: turn toward the target at a limited rate, so a
  // sharp juke makes a fast pursuer overshoot
  const desired = angTo(e.x, e.y, tx, ty);
  if (e.heading == null) e.heading = desired;
  const diff = ((desired - e.heading + Math.PI * 3) % TAU) - Math.PI;
  const maxT = (e.turnRate || 3) * dt * (d < 40 ? 3 : 1);  // converge when close
  e.heading += clamp(diff, -maxT, maxT);
  const sp = speed * terrainSpeedAt(e.x, e.y, e);
  e.x += Math.cos(e.heading) * sp * dt;
  e.y += Math.sin(e.heading) * sp * dt;
  if (Math.abs(Math.cos(e.heading)) > 0.25) faceToward(e, Math.cos(e.heading) > 0 ? 1 : -1);
  e.pitchT = Math.sin(e.heading) * (isAirborne(e) ? 0.6 : 0.3);   // nose leads into vertical movement
  e.move = lerp(e.move, 1, 0.15);
  e.phase += dt * sp * 0.055;
  return d < 6;
}
function idleDrift(e, dt) {
  e.move = lerp(e.move, 0, 0.1);
}
// ---------- edge-aware escape ----------
// steering dead-away from a threat pins an animal on the world border: the
// heading points off the map, the clamp holds the body, and it runs in
// place while the chaser closes. Instead, take the straightest escape whose
// next stretch stays on the map — at a wall that becomes a slide along it,
// and in a corner a break past the chaser's flank.
const EDGE_MARGIN = 60;      // how close to the border still counts as escapable
const ESCAPE_PROBE = 110;    // how far ahead an escape heading is tested
function awayDir(e, t) {
  const base = angTo(t.x, t.y, e.x, e.y);
  // already inside the margin (a corner, say): any heading that gains real
  // ground toward open map counts — otherwise demand the full margin
  const bd0 = Math.min(e.x, e.y, WORLD_W - e.x, WORLD_H - e.y);
  const need = Math.min(bd0 + 30, EDGE_MARGIN);
  let best = null, bestScore = -1e9;
  for (const off of [0, 0.55, -0.55, 1.1, -1.1, 1.7, -1.7, 2.3, -2.3, 2.9, -2.9]) {
    const a = base + off;
    const nx = e.x + Math.cos(a) * ESCAPE_PROBE, ny = e.y + Math.sin(a) * ESCAPE_PROBE;
    if (Math.min(nx, ny, WORLD_W - nx, WORLD_H - ny) < need) continue;
    const score = dist(nx, ny, t.x, t.y) - Math.abs(off) * 30;   // prefer straight away
    if (score > bestScore) { bestScore = score; best = a; }
  }
  // boxed in completely: break for the open middle of the map
  return best != null ? best : angTo(e.x, e.y, WORLD_W / 2, WORLD_H / 2);
}

// ---------- NPC thinking ----------
function playerVisibleTo(e, detectR) {
  const p = G.player;
  if (!p || !p.alive) return false;
  // a flyer high overhead is no business of a grounded animal's
  if (outOfReachAbove(e, p)) return false;
  let r = detectR;
  // sprinting is noisy, resting/small is stealthy
  if (G.keys && G.input && G.input.sprinting) r *= 1.3;
  if (p.move < 0.15) r *= 0.72;
  // …but LINGERING is the opposite of stealth: pooled scent carries on the
  // wind well past sight (scentRange grows the longer the player stands)
  r = Math.max(r, scentRange(p));
  return dist(e.x, e.y, p.x, p.y) < r;
}

// ---------- stamina: running is borrowed breath ----------
// Wild animals burn their tank in the run states (chasing, fleeing, rallying,
// lunging) and pay it back everywhere else. Empty the tank and the animal
// is WINDED: it labours along at NPC_WINDED_MUL until half the tank is back.
// A winded hunter gives the chase up; winded prey is finally catchable.
const NPC_STAM = 120;          // a wild animal's default tank (def.stam overrides)
const NPC_STAM_TANK = 70;      // the heavyweights barely run at all
const NPC_STAM_BURN = { chase: 9, flee: 8, rally: 5, lunge: 24 };   // per second
const NPC_STAM_REGEN = 8;      // per second off the run states (×1.5 standing about)
const NPC_WINDED_MUL = 0.62;   // a winded animal's top speed
const NPC_WIND_BACK = 0.5;     // …until the tank refills this far
const PLAYER_SPRINT_BURN = 20; // the player's sprint, per second
function npcStamMax(d) { return d.stam || (d.tank ? NPC_STAM_TANK : NPC_STAM); }
// spend breath in a run state. The player's family keeps pace on the
// player's own legs, the Walk's actors follow their script, a feud never
// tires, and fish don't run out of water
function npcBurn(e, d, dt) {
  if (isFamily(e) || e.bloodline || e.cineTo || e.cineHold || e.walkRival || e.feud || d.aquatic) return;
  e.burnt = true;
  e.stam = Math.max(0, e.stam - (NPC_STAM_BURN[e.state] || 0) * dt);
  if (e.stam <= 0 && !e.winded) {
    e.winded = true;
    const p = G.player;
    if (p && dist(e.x, e.y, p.x, p.y) < 420) floatText(e.x, e.y - 30, 'winded', '#cbb98a');
  }
}

// ---------- the crouch: belly to the ground ----------
// Everything but the long-necked giants can drop low: creeping steps, no
// sprint — and a crouched CARNIVORE is noticed late by prey. How late is
// the matchup: the more the hunter outruns (and, less so, outlasts) the
// animal it's creeping on, the closer it gets before heads come up.
// Ten seconds down and standing up SPRINGS you; calling from the crouch
// gives you away and sends the herd off faster than ever.
const CROUCH_SPEED = 0.45;     // creeping pace
const CROUCH_HOLD_T = 0.4;     // C held longer than this = hold-to-crouch (release stands)
const CROUCH_CHARGE_T = 10;    // seconds down before getting up springs you…
const CROUCH_BOOST = 1.15;     // …this much faster…
const CROUCH_BOOST_T = 7;      // …for this long
const CROUCH_DETECT = 0.65;    // prey's detect range vs an evenly-matched crouched hunter
const CROUCH_DETECT_MIN = 0.3, CROUCH_DETECT_MAX = 0.9;
const SPOOK_R = 520;           // a call from the crouch carries this far…
const SPOOK_T = 7;             // …and the prey that heard it bolts for this long…
const SPOOK_MUL = 1.15;        // …this much faster
function canCrouch(p) { return CLADE[p.species] !== 'sauropod'; }
function isPrey(e) { return DINO[e.species].diet !== 'carn' && !DINO[e.species].fish && !isFamily(e); }
// the multiplier on THIS prey's detect range for the player right now
function preyDetectMul(e) {
  const p = G.player;
  if (!p || !p.alive || !p.crouching || !isPrey(e)) return 1;
  const pd = PLAYER_DEF[p.species];
  if (pd.diet !== 'carn') return 1;
  const d = defOf(e);
  // speed: the hunter's flat-out sprint against the prey's flight
  const curve = pd.slowStart ? 0.5 + 0.5 * p.growth : 0.62 + 0.38 * p.growth;
  const mySp = pd.speed * pd.sprint * genderMod(p).speed * curve;
  const itsSp = d.fleeSpeed || d.speed || 1;
  // stamina: seconds of running each tank buys
  const myEnd = pd.stamMax / PLAYER_SPRINT_BURN;
  const itsEnd = (e.stamMax || npcStamMax(d)) / NPC_STAM_BURN.flee;
  const spAdv = clamp((mySp - itsSp) / itsSp, -1, 1.5);
  const endAdv = clamp((myEnd - itsEnd) / itsEnd, -1, 1.5);
  return clamp(CROUCH_DETECT - 0.3 * spAdv - 0.12 * endAdv, CROUCH_DETECT_MIN, CROUCH_DETECT_MAX);
}
// a prey brain's detect range for the player
function preyDetect(e, r) { return r * preyDetectMul(e); }
// standing up out of the crouch. `release` = the player's own doing (C, a
// sprint, a bite, a pounce) — only that springs you; being knocked out of
// it (rest, a call, eating…) doesn't
function crouchUp(p, release) {
  if (!p.crouching) return;
  if (release && p.crouchSec >= CROUCH_CHARGE_T) {
    p.crouchBoostT = CROUCH_BOOST_T;
    floatText(p.x, p.y - 50, 'SPRING! +15% speed', '#9fe434');
  }
  p.crouching = false; p.crouchSec = 0;
}
// a call from the crouch: every prey animal in earshot knows exactly where
// the hunter is now — the runners bolt, and anything that runs runs faster
function crouchSpook(p) {
  for (const e of G.npcs) {
    if (e.hp <= 0 || !isPrey(e) || dist(e.x, e.y, p.x, p.y) > SPOOK_R) continue;
    const d = defOf(e);
    e.spookT = SPOOK_T;
    if (!d.tank && !d.fearless && !d.aquatic) { e.state = 'flee'; e.target = p; e.stateT = rrange(3.5, 5); }
  }
  floatText(p.x, p.y - 50, 'they heard you!', '#ff6a5e');
}
// how many more kin the player's pack can take (packMax caps it, e.g. the
// aerosteon's trio; uncapped species have endless room)
function packRoom(p) {
  const m = PLAYER_DEF[p.species].packMax;
  return m == null ? Infinity : m - (G.pack || []).filter(e => e.hp > 0).length;
}
// AEROSTEON vs YUNMENGLONG: the first blow traded with a giant brings one
// more of your kin sprinting in from beyond the edge of the screen — on top
// of the pack cap, and once per giant. It comes from the side away from the
// giant, so you see it run the whole way in.
function kinJoinsBloodshed(giant) {
  const p = G.player;
  if (!p || !p.alive || p.species !== 'aero' || !giant || giant.kinCalled || giant.hp <= 0) return null;
  giant.kinCalled = true;
  const z = G.zoom || 1, hw = VIEW_W * z / 2, hh = VIEW_H * z / 2;
  // the camera centres on the player, so the view is the box around them
  const cx = p.x, cy = p.y;
  const base = Math.atan2(p.y - giant.y, p.x - giant.x);
  const offView = (x, y) => Math.abs(x - cx) > hw + 60 || Math.abs(y - cy) > hh + 60;
  let pos = null;
  for (let k = 0; k < 36 && !pos; k++) {
    // the first tries hug the far side; later ones sweep the whole ring
    const a = base + (k < 12 ? rrange(-0.8, 0.8) : rrange(-Math.PI, Math.PI));
    const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    const r = Math.min(c > 1e-3 ? hw / c : 1e9, s > 1e-3 ? hh / s : 1e9) + 110 + (k % 4) * 30;
    const x = clamp(cx + Math.cos(a) * r, 80, WORLD_W - 80), y = clamp(cy + Math.sin(a) * r, 80, WORLD_H - 80);
    if (offView(x, y) && !isWaterPx(x, y) && !isLavaPx(x, y) && !isCliffPx(x, y)) pos = { x, y };
  }
  if (!pos) return null;
  const e = makeNPC('aero', pos.x, pos.y);
  e.packAlpha = true; e.kinJoined = true;
  e.gender = rnd() < 0.5 ? 'f' : 'm';
  // runs straight to the alpha; once in range, the pack hunt takes it onto the giant
  e.state = 'follow'; e.target = p; e.stateT = 2;
  G.npcs.push(e);
  (G.pack || (G.pack = [])).push(e);
  G.packTarget = giant; G.packTargetT = 8;
  G.banner = { str: 'Another of your kin joins the bloodshed!', t: 4, color: '#ff6a5e' };
  SFX.stage();
  return e;
}
function packmates(e, radius) {
  const out = [];
  for (const o of G.npcs) {
    if (o !== e && o.species === e.species && dist(e.x, e.y, o.x, o.y) < radius) out.push(o);
  }
  return out;
}

// ---------- the power model ----------
// One linear scale behind every attack decision: a dino attacks when it
// believes its side's power beats the target's. Power falls as hp falls,
// so wounds (and broken skulls) make anything look takeable.
const TRIVIAL_PREY = 0.22;   // prey below this fraction of my power isn't worth the chase
const MERCY_MUL = 2;         // pack hunters treat prey below half their power as "small"
const DISENGAGE_MUL = 0.7;   // already committed: only break off if odds get THIS bad
const RETALIATE_MUL = 0.8;   // wounded pride: retaliation accepts worse odds than ambition
const SKITTISH_FLEE_MUL = 2; // harmless prey only bothers fleeing a hunter at 2× its power
const FEARLESS_ROUT_MUL = 2; // even the fearless walk away from a titan at 2× their power
const ALLY_R = 300;          // how near an ally must be to count toward group power
const RALLY_R = 700;         // how far a routed pack-courage fighter runs to find its kin
const ENGAGED_STATES = new Set(['chase', 'windup', 'lunge', 'recover', 'fight', 'stalk', 'strike', 'gripping']);

// stat block for any entity, whatever it is: NPC, mate/baby (mateDef), player
function defOf(e) { return NPC_DEF[e.species] || e.mateDef || PLAYER_DEF[e.species] || {}; }
// a broken skull bites at 0.6× — shared with dealDamage, so predators value
// a cripple exactly as weak as its bite has become
function crippleBiteMul(e) { return e.bones && (e.bones.head || e.bones.body) ? 0.6 : 1; }
// the one formula, so the Specimen Hall readout can never drift from the AI:
// toothless bulk still counts (an ornithomimus is hard to kill, not dangerous)
function powerFromStats(hp, dmg) { return Math.sqrt(Math.max(1, hp) * Math.max(dmg, hp * 0.06)); }
function powerOf(e) {
  if (e.isPlayer) return powerFromStats(e.hp, playerDmg());
  const d = defOf(e);
  return powerFromStats(e.hp, (d.dmg || 0) * crippleBiteMul(e));
}
function alliesOf(e, r) {
  if (e.isPlayer) return G.npcs.filter(o => isFamily(o) && o.hp > 0 && dist(e.x, e.y, o.x, o.y) < r);
  return packmates(e, r).filter(o => !isFamily(o) && o.hp > 0);
}
function groupPower(e, r) {
  let sum = powerOf(e);
  for (const o of alliesOf(e, r || ALLY_R)) sum += powerOf(o);
  return sum;
}
// the one question: "can my side take theirs?" — caution is the species'
// personality knob (bold apex < 1 < wary browser), and the bar drops once
// engaged (hysteresis: no dithering at the threshold) or when retaliating
function confident(att, tgt, opts) {
  let bar = defOf(att).caution || 1;
  if (att.target === tgt && ENGAGED_STATES.has(att.state)) bar *= DISENGAGE_MUL;
  else if (opts && opts.retaliate) bar *= RETALIATE_MUL;
  // easy prey emboldens — and the longer it stands, the surer the gamble:
  // a fresh pool shaves SCENT_BOLD off the bar, a long camp up to SCENT_BOLD_MAX
  const sp = scentPull(att, tgt);
  if (sp > 0) bar *= 1 - sp * Math.min(SCENT_BOLD_MAX, SCENT_BOLD + Math.max(0, tgt.scentSec - SCENT_FILL) / SCENT_BOLD_RAMP);
  return groupPower(att) > groupPower(tgt) * bar;
}
// ---------- scent: stillness is not stealth for long ----------
// A player who lingers pools their scent (p.scent 0..1, filled by
// updatePlayer). Past SCENT_MIN the pool becomes a detection radius that
// beats line of sight, and hunters standing inside it stop doing the
// "not worth it" math — a chase costs energy, a free meal doesn't.
// Hiding (bush/burrow) still works: the pool waits for you to come out.
// tuning knobs — every number of the scent system in one place
const SCENT_DELAY = 6.5;       // seconds of stillness before the pool opens
const SCENT_BASE_R = 260;      // the pool's opening radius (a typical hunter's detect)
const SCENT_GROW = 55;         // px of radius per further second of stillness
const SCENT_RIPEN = 12;        // seconds from pool-open to full pull strength
const SCENT_FILL = 18;         // seconds of stillness to max wisps/warning
const SCENT_DRAIN_WALK = 10;   // drain speed while moving (x the fill rate)
const SCENT_DRAIN_RUN = 16;    //   …and while running
const SCENT_WARN_AT = 11;      // seconds of stillness before the banner
const SCENT_BOLD = 0.3;        // caution shaved off a hunter in a fresh pool
const SCENT_BOLD_MAX = 0.55;   //   …deepening to this for a long camp
const SCENT_BOLD_RAMP = 100;   // seconds of camping to go from BOLD to BOLD_MAX
function scentRange(p) {
  if (!p.isPlayer || p.hidden || (p.scentSec || 0) < SCENT_DELAY) return 0;
  // the pool opens at a typical hunter's own detect range, then widens every
  // second you keep standing — camp long enough and the whole map has your scent
  return Math.min(WORLD_W + WORLD_H, SCENT_BASE_R + SCENT_GROW * (p.scentSec - SCENT_DELAY));
}
// 0..1: how strongly this attacker smells the pooled target
function scentPull(att, tgt) {
  const r = scentRange(tgt);
  if (!r || dist(att.x, att.y, tgt.x, tgt.y) > r) return 0;
  return Math.min(1, (tgt.scentSec - SCENT_DELAY) / SCENT_RIPEN);
}
// hatchlings aren't worth a titan's energy — until hunger says otherwise.
// Only shields the player and their family; curated hunts lists stay fair game
function trivialPrey(att, tgt) {
  if (!(tgt.isPlayer || tgt.isMate || tgt.isBaby)) return false;
  if (scentPull(att, tgt) > 0.15) return false;   // a sitting meal is always worth it
  return powerOf(tgt) < TRIVIAL_PREY * powerOf(att);
}
// the one retaliation rule, replacing every per-brain variant. Returns true
// if it decided the state. atkState: how this species answers (tanks stand
// and fight; hunters run the quarry down)
function retaliationCheck(e, d, atkState) {
  if (e.aggroT <= 0 || !e.lastAttacker) return false;
  const t = e.lastAttacker;
  if (t.isPlayer ? !t.alive : t.hp <= 0) return false;
  const atk = atkState || (d.tank ? 'fight' : 'chase');
  const bold = d.fearless || d.tank;
  // even the fearless know a lost cause: badly outmatched by another
  // titan, walk away from the nip (the player is always answered)
  if (bold && !t.isPlayer && groupPower(t) > groupPower(e) * FEARLESS_ROUT_MUL) {
    e.state = 'return'; e.target = null; e.stateT = 4; return true;
  }
  if (bold || confident(e, t, { retaliate: true })) {
    e.state = atk; e.target = t; e.stateT = atk === 'fight' ? (bold ? 1.5 : 3) : 4;
    return true;
  }
  if (d.packCourage) {
    const far = packmates(e, RALLY_R);
    if (far.length) { e.state = 'rally'; e.target = far[0]; e.stateT = 3; return true; }
  }
  e.state = 'flee'; e.target = t; e.stateT = 2.5;
  return true;
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
  const spine = d.fish || d.marine ? L.body[1] * 0.1 : L.leg[0] + L.body[1] * 0.42;
  const head = d.fish || d.marine ? L.body[1] * 0.1
    : spine + L.body[1] * 0.14 + Math.sin(L.neckAng) * L.neckLen + (d.foreLift || 0) * L.body[1] * 0.6;
  return { spine, head };
}
function hitZonesOf(d) {
  if (!d._zones) {
    const L = d.L;
    const { spine, head } = zoneHeights(d);
    const fl = (d.foreLift || 0) * L.body[1];
    const tUp = (t) => spine + (d.tailUp || 0) * L.tail[0] * 0.34 * t - t * t * 1.5;
    // `part` names the bone under each circle — the bone-break mechanic
    // (sarcosaurus & friends) rolls against whichever part the bite landed on
    d._zones = d.hitZones || [
      { dx: (L.body[0] * 0.38 + Math.cos(L.neckAng) * L.neckLen + L.head[0] * 0.5) * 0.9, dy: 0, dz: head, r: Math.max(3, L.head[1] * 0.75), part: 'head' },  // head
      { dx: L.body[0] * 0.3, dy: 0, dz: spine + fl * 0.62, r: L.body[1] * 0.55, part: 'body' },                                  // chest
      { dx: 0, dy: 0, dz: spine + fl * 0.3, r: L.body[1] * 0.6, part: 'body' },                                                   // torso
      { dx: -L.body[0] * 0.34, dy: 0, dz: spine - L.body[1] * 0.1, r: L.body[1] * 0.55, part: 'leg' },                           // hip / thigh
      { dx: -(L.body[0] * 0.42 + L.tail[0] * 0.35), dy: 0, dz: tUp(0.35), r: Math.max(2.5, L.tail[1] * 0.9), part: 'tail' },      // tail
      // a club tail's business end IS the very tip — cover the knob too
      d.tailClub
        ? { dx: -(L.body[0] * 0.42 + L.tail[0] * 1.0), dy: 0, dz: tUp(1.0), r: Math.max(3.5, L.tail[1] * 1.3), part: 'tail' }
        : { dx: -(L.body[0] * 0.42 + L.tail[0] * 0.7), dy: 0, dz: tUp(0.7), r: Math.max(2, L.tail[1] * 0.6), part: 'tail' },      // tail tip
    ];
    if (!d.hitZones && L.neckLen >= 16) {
      // long necks (sauropods) get mid-neck circles — the chest→head gap is
      // hittable body too; a tower neck (the frozen giant) gets three
      const fr = L.neckLen >= 40 ? [0.8, 0.55, 0.3] : [0.55];
      for (const t of fr) d._zones.splice(1, 0, {
        dx: L.body[0] * 0.36 + Math.cos(L.neckAng) * L.neckLen * t,
        dy: 0,
        dz: spine + L.body[1] * 0.14 + Math.sin(L.neckAng) * L.neckLen * t + (d.foreLift || 0) * L.body[1] * 0.6,
        r: Math.max(3.5, L.body[1] * 0.3 * (d.neckW || 1)),
        part: 'body', neck: true,
      });
    }
    // headOutOfReach (yunmenglong): the head and neck ride far above anything
    // that could bite them — only the body, hips and tail are hittable
    if (d.headOutOfReach) d._zones = d._zones.filter(z => z.part !== 'head' && !z.neck);
    for (const z of d._zones) {
      if (z.dz == null) z.dz = spine;   // hand-tuned arrays may omit dz
      if (!z.part) z.part = 'body';     // …and their parts default to body
    }
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
// tuning knobs — the leap's whole economy in one place
// tuning knobs — the double bite (poekilopleuron's M): two snaps, one commitment
const DBL_BITE_CD = 2;       // seconds between double bites
const DBL_BITE_GAP = 0.28;   // seconds between the two snaps
const DBL_BITE_MUL = 1.35;   // each snap hits this much harder than a normal bite
const POUNCE_HOLD_T = 0.32;     // seconds SPACE must stay down to turn bite into coil
const POUNCE_CD = 1;            // seconds the spring needs to reload
const POUNCE_ARM_STAM = 0.5;    // fraction of the bar needed to even coil
const POUNCE_COST_MISS = 0.5;   // a whiffed leap burns this much of the bar
const POUNCE_COST_HIT = 0.25;   //   …a connecting one only this
const POUNCE_COST_SPIN = 0.25;  // the tail-fighter's spin, paid up front
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
// ---- the pounce is a weapon for its WHOLE flight: jaws + the flying body
// are tested every step of the leap, and for a beat after it lands. Each
// victim is struck at most once per pounce (bag.hit remembers).
function pounceStrike(p, bag) {
  const def = PLAYER_DEF[p.species];
  const zones = [...biteZones(p), pounceLandZone(p)];
  for (const e of G.npcs) {
    if (e.packAlpha || e.isBaby || e === G.mate || kinLine(e)) continue;
    if (bag.hit.has(e.id)) continue;
    let pt = null;
    for (const z of zones) { pt = bodyHitPoint(e, z.x, z.y, z.r); if (pt) break; }
    if (!pt) continue;
    bag.hit.add(e.id);
    const opts = { hitX: pt.x, hitY: pt.y, kb: 130 };
    if (def.bleedBite && (NPC_DEF[e.species] || {}).bleedable && p.growth > 0.25) {
      const bm = def.bleedMul || 1;
      opts.bleed = { dps: (6 + 8 * p.growth) * bm, dur: 10 * Math.min(1.4, bm) * (def.bleedDur || 1) };
    }
    dealDamage(e, playerDmg() * rrange(0.9, 1.1) * (bag.mul || 1), p, opts);
    if ((def.boneBreak || def.pounceBone) && p.growth > 0.2) tryBoneBreak(p, e, pt.part, playerDmg() * (def.pounceBone ? 1.6 : 1));
    SFX.bite();
    p.attackT = Math.max(p.attackT, 0.8);   // the jaws visibly snap on contact
  }
}
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
    [wz.y - h, r],
    [wz.y - h * 0.55, r * 0.9],
    [wz.y - h * 0.15, r * 0.8],
  ].map(([y, rr]) => {
    const pt = pitchPoint(e, wz.x - e.x, y - e.y);
    return { x: pt.x, y: pt.y, r: rr };
  });
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
// ---- the pitch transform: drawDino tips the whole body around its centre
// of mass (translate cy · rotate pitch · translate -cy, inside the facing
// mirror). Every piece of hit geometry runs its offsets through this SAME
// transform, so the circles lean exactly as far as the art does.
function pitchPoint(e, offX, offY) {
  const p = e.pitch || 0;
  // a swimmer rides low in the water: everything about it sits lower by the
  // same amount the drawing sinks it (see waterSink) — and a FLYER's whole
  // body is lifted off its grounded shadow by its altitude
  const sk = waterSink(e) - (e.alt || 0);
  if (!p) return { x: e.x + offX, y: e.y + offY + sk };
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  const f = e.facing || 1;
  const cy = (d.marine ? -d.L.body[1] * PLESIO_CY : -(d.L.leg[0] + d.L.body[1] * 0.42)) * s;   // the draw's rotation pivot
  const lx = offX * f, dy = offY - cy;                 // into body-local space
  const cos = Math.cos(p), sin = Math.sin(p);
  return {
    x: e.x + (lx * cos - dy * sin) * f,
    y: e.y + cy + (lx * sin + dy * cos) + sk,
  };
}
function bodyCircles(victim) {
  const d = DINO[victim.species];
  const s = d.scale * sizeScale(victim.growth != null ? victim.growth : 1) * genderMod(victim).size;
  const f = victim.facing || 1;
  const out = [];
  for (const z of hitZonesOf(d)) {
    const pt = pitchPoint(victim, f * z.dx * s, ((z.dy || 0) - (z.dz || 0)) * s);
    out.push({ x: pt.x, y: pt.y, r: z.r * s, part: z.part });
  }
  return out;
}
// the attack circle for circle weapons (jaws, claw sweep, the player's tail
// smack) — contact pad included, so drawn radius = tested radius
function weaponCircle(e) {
  const wz = weaponPos(e);
  const pt = pitchPoint(e, wz.x - e.x, wz.y - weaponHeight(e) - e.y);
  return { x: pt.x, y: pt.y, r: wz.r + 4 };
}
// an NPC tail swing: this circle, restricted to ±45° of dead-rear
function tailWedgeCircle(e) {
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  const pt = pitchPoint(e, 0, -weaponHeight(e));
  return { x: pt.x, y: pt.y, r: (d.L.body[0] * 0.42 + d.L.tail[0] * 0.9) * s };
}
// the kick: both hind feet thrown forward — a circle low and ahead of the
// hips, a leg's reach across. Combat AND the H overlay consume this
function kickCircle(e) {
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  const pt = pitchPoint(e, (e.facing || 1) * d.L.body[0] * 0.5 * s, -zoneHeights(d).spine * 0.4 * s);
  return { x: pt.x, y: pt.y, r: d.L.leg[0] * 0.6 * s + 6 };
}
// the nip jaws of tail-fighters that can ALSO bite (wuerhosaurus)
function nipCircle(e) {
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  const hl = d.L.head[0] * s;
  const pt = pitchPoint(e, (e.facing || 1) * (snoutLen(d, s) - hl * 0.25), -zoneHeights(d).head * s);
  return { x: pt.x, y: pt.y, r: Math.max(5, hl * 0.5) + 4 };
}
// spinosaurus' second strike: the claw sweep arcing over the chest
function clawArcCircle(e) {
  const d = DINO[e.species];
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  const pt = pitchPoint(e, (e.facing || 1) * d.L.body[0] * 0.28 * s, -zoneHeights(d).spine * s);
  return { x: pt.x, y: pt.y, r: Math.max(8, d.L.body[1] * 0.5 * s) + 4 };
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
      ? { x, y, part: z.part }
      : { x: z.x + (x - z.x) / dd * z.r, y: z.y + (y - z.y) / dd * z.r, part: z.part };
  }
  return best;
}
// ---- BONE BREAK (sarcosaurus, dryptosaurus, nanuqsaurus) ----
// A hit can CRACK the bone it landed on: the chance scales with the blow's
// damage against the prey's whole bulk (little bites never break big bones),
// and the body core is by far the hardest. Broken thigh = no more running;
// broken tail = it veers the wrong way; broken skull = its attacks weaken;
// broken body = all of the above at once.
// a kick that lands on YOU: roll against your bulk, and a lost roll breaks
// your thigh — half speed until it knits (~40s). The kick does this, and the
// giant's tail (rarely) and its stomp (easily): `how` names the blow, `mul`
// and `max` bend the odds
function playerBoneBreak(p, dmg, how, mul, max) {
  p.bones = p.bones || {};
  if (p.bones.leg) return;
  const ch = clamp((dmg / p.maxhp) * 0.9 * (mul || 1), 0.06, max || 0.4);
  if (rnd() >= ch) return;
  p.bones.leg = true; p.boneT = 40;
  floatText(p.x, p.y - 58, '💥 YOUR THIGH BONE BREAKS!', '#ff6a5e');
  G.banner = { str: 'CRACK! ' + (how || 'The kick') + ' breaks your leg — you can only limp until it knits.', t: 5, color: '#ff6a5e' };
  SFX.kill();
  G.shake = Math.min(7, G.shake + 4);
}
function tryBoneBreak(attacker, t, part, dmg) {
  if (!part || t.hp <= 0 || DINO[t.species].fish) return;
  t.bones = t.bones || {};
  if (t.bones[part] || t.bones.body) return;   // that bone is already gone
  let ch = clamp((dmg / t.maxhp) * 0.9, 0.02, 0.35);
  if (part === 'body') ch *= 0.35;             // the hardest break there is
  if (rnd() >= ch) return;
  t.bones[part] = true;
  const names = { leg: 'THIGH', tail: 'TAIL', head: 'SKULL', body: 'BODY' };
  floatText(t.x, t.y - 58, '💥 ' + names[part] + ' BONE BREAKS!', '#ffd23e');
  if (attacker && attacker.isPlayer) G.banner = { str: 'CRACK! You broke the ' + DINO[t.species].name + "'s " + names[part].toLowerCase() + ' bone!', t: 3, color: '#ffd23e' };
  SFX.kill();
  G.shake = Math.min(7, G.shake + 3);
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
  pt.dmg = def.dmg * rrange(0.85, 1.15);
  dealDamage(target, pt.dmg, e, opts);
  return pt;   // where (and how hard) it landed, for the bone-breakers
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
// your own settled bloodline, met again while you play the same species:
// kin — your jaws pass over them like they pass over your pack
function kinLine(o) { return !!(o.bloodline && G.player && o.species === G.player.species); }

// pack hunter (guanlong, troodon): lone vs babies, gangs up on grown prey
function thinkPackHunter(e, d) {
  const p = G.player;
  const pd = p && p.alive ? dist(e.x, e.y, p.x, p.y) : 1e9;
  if (fearCheck(e, d)) return;
  // kin truce (aardiraptor): your own kind never starts it — but blood
  // drawn is blood answered, handled by the aggro block below
  const kin = p && p.species === e.species;
  if (!kin && p && p.alive && playerVisibleTo(e, d.detect) && (e.tiredT || 0) <= 0) {
    const small = powerOf(p) < powerOf(e) * MERCY_MUL;
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
      if (confident(e, p)) { e.state = 'chase'; e.target = p; e.stateT = 4; return; }
      // gathered, still outmatched: shadow the prey and wait for weakness
      e.state = 'avoid'; e.target = p; e.stateT = 2; return;
    }
    // run to packmates and band together
    const far = packmates(e, 620);
    if (far.length > 0) {
      e.state = 'rally'; e.target = far[0]; e.stateT = 3; return;
    }
    e.state = 'avoid'; e.target = p; e.stateT = 2; return;
  }
  if (retaliationCheck(e, d)) return;
  // RIVALRY: a rival pack on our ground — with a packmate at our side, and
  // now and then, we go for them (blood answers blood from there on)
  if (d.rivals && rnd() < 0.06 && packmates(e, 160).length >= 1) {
    let best = null, bd = d.detect * 0.8;
    for (const o of G.npcs) {
      if (!d.rivals.includes(o.species) || o.hp <= 0 || isFamily(o)) continue;
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd < bd) { bd = dd; best = o; }
    }
    if (best) {
      e.state = 'chase'; e.target = best; e.stateT = 4;
      if (Math.random() < 0.5) floatText(e.x, e.y - 30, '!', '#ffb03e');
      return;
    }
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

// a giant rearing up for a stomp: the pack reads it and scatters — mostly.
// Checked even mid-bite (a packmate drops its lunge to get out from under)
function stompDodge(e) {
  if (e.state === 'flee') return false;
  for (const g of G.npcs) {
    if (g.state !== 'stomp' || g.stompPhase !== 'up' || g.stompT < 0.25) continue;
    const R = NPC_DEF[g.species].stomp.r * (g.elder ? ELDER_MOD.size : 1);
    if (dist(e.x, e.y, g.stompX, g.stompY) < R + 30 && rnd() < 0.8) {
      e.state = 'flee'; e.target = { x: g.stompX, y: g.stompY };
      e.stateT = Math.max(0.4, g.stompWind - g.stompT + 0.25);
      return true;
    }
  }
  return false;
}

// fast open-ground hunter (moros, eotyrannus): runs down the young, hates shade
function thinkRunner(e, d) {
  const p = G.player;
  if (fearCheck(e, d)) return;
  // hates shade: gives up under trees
  if (e.target && e.target.isPlayer && forestShadePx(e.target.x, e.target.y) > 0.5) {
    e.state = 'return'; e.target = null; e.stateT = 4;
  }
  if (p && p.alive && playerVisibleTo(e, d.detect) && forestShadePx(p.x, p.y) <= 0.5 && !trivialPrey(e, p) && confident(e, p)) {
    e.state = 'chase'; e.target = p; e.stateT = 5; return;
  }
  if (retaliationCheck(e, d)) return;
  // hunt smaller predators occasionally
  if (d.hunts && e.state !== 'chase' && rnd() < 0.25) {
    for (const o of G.npcs) {
      if (d.hunts.includes(o.species) && dist(e.x, e.y, o.x, o.y) < d.detect && forestShadePx(o.x, o.y) < 0.45 && confident(e, o)) {
        e.state = 'chase'; e.target = o; e.stateT = 5; return;
      }
    }
  }
  if (e.state === 'chase' && e.target) return;
  defaultWander(e);
}

// skittish grazer/scavenger (ornitho, archeornithos, leaellynasaura)
// the nearest way out of the water onto dry land (an angle), or null
function landDir(x, y) {
  let best = null, br = 1e9;
  for (let k = 0; k < 16; k++) {
    const b = k / 16 * TAU;
    for (let r = 20; r <= 240; r += 20) {
      if (!isWaterPx(x + Math.cos(b) * r, y + Math.sin(b) * r)) { if (r < br) { br = r; best = b; } break; }
    }
  }
  return best;
}
function thinkSkittish(e, d) {
  // the land-bound (Okiri's Hypsilophodon) get out of any water they're in
  if (d.landBound && isWaterPx(e.x, e.y) && e.state !== 'flee') {
    const a = landDir(e.x, e.y);
    if (a != null) { e.state = 'wander'; e.tx = e.x + Math.cos(a) * 140; e.ty = e.y + Math.sin(a) * 140; e.stateT = 2.5; return; }
  }
  const p = G.player;
  let threat = null, td = 1e9;
  if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && powerOf(p) > powerOf(e) * SKITTISH_FLEE_MUL) {
    const dd = dist(e.x, e.y, p.x, p.y);
    if (dd < preyDetect(e, d.detect)) { threat = p; td = dd; }   // a crouched hunter is noticed late
  }
  for (const o of G.npcs) {
    if (isPredatorNPC(o.species)) {
      if (o.species === 'kaiwhe' && isWaterPx(o.x, o.y)) continue;   // under the surface: unseen until it strikes
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
  if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && !trivialPrey(e, p)) {
    const dd = dist(e.x, e.y, p.x, p.y);
    if (dd < preyDetect(e, d.detect)) { threat = p; td = dd; }
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
// is this hunter too big for an agile little herbivore to face? (body
// radius ratio — a grown abelisaur is over three times a dwarf homalo's)
function agileOutsized(e, hunter) {
  return bodyRadius(hunter) / Math.max(1, bodyRadius(e)) > 2.6;
}
function thinkHerdFighter(e, d) {
  const p = G.player;
  // the AGILE (Utoriana's dwarfs) square up to a hunter they can handle —
  // and run rings round one they can't (see the 'flee' state)
  // (it's SIZE that decides: anything up to a well-grown sub-adult gets the
  // herd's heads; something near full grown gets the runaround — from far
  // off, and kept at a distance until it gives up)
  if (e.agile && p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && agileOutsized(e, p)) {
    const dd = dist(e.x, e.y, p.x, p.y);
    if (dd < (e.state === 'flee' ? 340 : preyDetect(e, d.detect * 1.2))) { e.state = 'flee'; e.target = p; e.stateT = 2.5; return; }
  }
  if (retaliationCheck(e, d, 'fight')) return;
  // a herd-mate under attack pulls the herd in
  for (const o of G.npcs) {
    if (!d.noPile && o !== e && o.species === e.species && o.state === 'fight' && o.target && !(e.herdKin && o.target.isPlayer) && dist(e.x, e.y, o.x, o.y) < 260) {
      e.state = 'fight'; e.target = o.target; e.stateT = 2.5; return;
    }
  }
  // a stalking carnivore gets the tail before it can strike
  if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && !trivialPrey(e, p) && dist(e.x, e.y, p.x, p.y) < preyDetect(e, d.detect * 0.55)) {
    e.state = confident(e, p) ? 'fight' : 'guard';
    e.target = p; e.stateT = 1.6; return;
  }
  defaultWander(e, true);
}

// the generic apex/mid hunter (grunos, tarbo, yuty, lourinha, titanov, concav,
// nanuq, duria): one brain, personality in the def — caution sets how far up
// the food chain its ambition reaches, scavR/scavMin/scavPicky its table manners
function thinkHunter(e, d) {
  const p = G.player;
  if (fearCheck(e, d)) return;
  if (retaliationCheck(e, d)) return;
  const kin = p && p.species === e.species;
  if (!kin && p && p.alive && playerVisibleTo(e, d.detect) && (e.tiredT || 0) <= 0 &&
    !trivialPrey(e, p) && confident(e, p)) {
    e.state = 'chase'; e.target = p; e.stateT = 5; return;
  }
  // hunt its natural prey (cheap distance cut first — confident scans the map)
  if (d.hunts && e.state !== 'chase' && rnd() < 0.3) {
    let best = null, bd = d.detect;
    for (const o of G.npcs) {
      if (!d.hunts.includes(o.species) || isFamily(o) || o.hp <= 0) continue;
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd < bd && confident(e, o)) { bd = dd; best = o; }
    }
    if (best) { e.state = 'chase'; e.target = best; e.stateT = 6; return; }
  }
  if (e.state === 'chase' && e.target) {
    // the hysteresis exit: odds collapsed mid-hunt (their friends arrived,
    // or the wound is mine) — break off rather than dither at the line
    const t = e.target;
    if ((t.isPlayer ? t.alive : t.hp > 0) && !confident(e, t)) {
      e.state = 'return'; e.target = null; e.stateT = 4;
      e.tiredT = Math.max(e.tiredT || 0, 4);
    }
    return;
  }
  const c = nearestCarcass(e.x, e.y, d.scavR || 260, !!d.scavPicky);
  if (c && c.meat > (d.scavMin || 20)) { e.state = 'scavenge'; e.carc = c; e.stateT = 6; return; }
  defaultWander(e, true);
}

// ---------- PTERODACTYLUS: the islands' gulls ----------
// Pests, not hunters. They soar between the islands looking for the dead,
// drop onto a carcass to squabble over it, and flap off the moment anything
// big comes close. Peck one and it pecks back — at its own height.
function thinkPtero(e, d) {
  const p = G.player;
  if (retaliationCheck(e, d)) return;
  // spooked off the ground (or a low swoop) by anything big coming close
  if ((e.alt || 0) < 40) {
    let thr = null;
    if (p && p.alive && p.species !== e.species && !isAirborne(p) && dist(e.x, e.y, p.x, p.y) < 110 && powerOf(p) > powerOf(e)) thr = p;
    if (!thr) for (const o of G.npcs) {
      if (o === e || o.hp <= 0 || DINO[o.species].flyer || DINO[o.species].fish || isAirborne(o) || o.species === 'hypsi') continue;   // (its own quarry doesn't scare it)
      if (dist(e.x, e.y, o.x, o.y) < 90 && powerOf(o) > powerOf(e) * 1.5) { thr = o; break; }
    }
    if (thr) { e.state = 'flee'; e.target = thr; e.stateT = 2.5; return; }
  }
  // the dead, anywhere in sight from up there
  const keep = e.state === 'scavenge' && e.carc && e.carc.meat > 0 && G.carcasses.indexOf(e.carc) >= 0;
  const c = keep ? e.carc : nearestCarcass(e.x, e.y, d.scavR || 1100, false);
  if (c && c.meat > 2) {
    if (!keep) { e.state = 'scavenge'; e.carc = c; e.stateT = rrange(8, 14); }
    return;
  }
  // the living: Okiri's Hypsilophodon (the smaller the better), and the
  // flock piles in on whatever one of them goes for
  if (e.state === 'chase' && e.target && e.target.hp > 0 && G.npcs.indexOf(e.target) >= 0 && e.stateT > 0) return;
  if (G.time >= (e.huntAt || 0)) {
    e.huntAt = G.time + rrange(4, 9);
    let best = null, bs = 1e9;
    for (const o of G.npcs) {
      if (o.species !== 'hypsi' || o.hp <= 0 || o.heldBy) continue;
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd > 700) continue;
      const s = dd + (o.growth != null ? o.growth : 1) * 300;
      if (s < bs) { bs = s; best = o; }
    }
    if (best) {
      e.state = 'chase'; e.target = best; e.stateT = 8;
      for (const o of G.npcs) if (o !== e && o.species === 'ptero' && o.hp > 0 && o.state !== 'chase' && dist(o.x, o.y, e.x, e.y) < 300) { o.state = 'chase'; o.target = best; o.stateT = 8; }
      return;
    }
  }
  defaultWander(e, false);
}
// ---------- THE SKY'S KING: wild Hatzegopteryx ----------
// Three of them roam the whole archipelago, flying LOW over the islands and
// landing now and then. Every so often one stoops on something small enough
// to carry off: anything up to two-thirds of its own health (the young of the
// herds, a zalmox, a small player). Under a stand of trees (treeCover) an
// animal is safe: a wild one never goes in after it.
const HATZ_SOAR = [38, 70];
// what a snatcher can lift is set by its own size: the species' health at
// its growth (a male's extra toughness doesn't make it any bigger)
function liftBase(h) { return h.isPlayer ? PLAYER_DEF[h.species].hp * hpFrac(h.growth) : h.maxhp; }
function liftSize(t) { return t.isPlayer ? playerMaxHp() : (t.maxhp || t.hp); }
function liftMode(h, t) {
  const mx = liftBase(h), sz = liftSize(t);
  return sz <= mx * 0.5 ? 'jaws' : sz <= mx * 2 / 3 ? 'feet' : null;
}
// could this wild giant take that animal right now?
function hatzQuarryOk(h, t) {
  if (!t || t === h) return false;
  if (t.isPlayer) {
    if (!t.alive || t.species === 'hatzego' || t.grabbed || t.skyHeld || t.skyFall || t.hidden || G.burrow || G.cine || isAirborne(t)) return false;
  } else {
    if (t.hp <= 0 || t.heldBy || t.falling || t.cineTo || t.cineHold || t.isMate || isAirborne(t)) return false;
    const nd = NPC_DEF[t.species];
    if (!nd || nd.aquatic || nd.giant || nd.snatcher || DINO[t.species].fish || DINO[t.species].flyer) return false;
  }
  if (isDeepPx(t.x, t.y) || treeCover(t.x, t.y)) return false;
  return !!liftMode(h, t);
}
function hatzFindQuarry(h, R) {
  let best = null, bs = 1e9;
  const consider = (t) => {
    const dd = dist(h.x, h.y, t.x, t.y);
    if (dd > R || !hatzQuarryOk(h, t)) return;
    const s = dd + liftSize(t) * 0.15;   // the near and the small first
    if (s < bs) { bs = s; best = t; }
  };
  if (G.player) consider(G.player);
  for (const o of G.npcs) consider(o);
  return best;
}
function hatzSnatch(e, t) {
  const mode = liftMode(e, t);
  if (!mode) return;
  e.snatch = { e: t, mode };
  e.state = 'carry'; e.stateT = mode === 'jaws' ? rrange(1.8, 2.8) : 1e9; e.target = null; e.biteT = 1.2; e.landed = false; e.carryT = 0;
  if (e.visit) e.visit.done = true;
  // carry it off over open ground (a jaw-load to somewhere dry to swallow it)
  let tx = e.x, ty = e.y;
  for (let k = 0; k < 20; k++) {
    const a = (e.heading || 0) + rrange(-1.3, 1.3), r = rrange(150, 260);
    const x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r;
    if (x < 40 || y < 40 || x > WORLD_W - 40 || y > WORLD_H - 40) continue;
    if (mode === 'jaws' && (isWaterPx(x, y) || treeCover(x, y))) continue;
    tx = x; ty = y; break;
  }
  e.tx = tx; e.ty = ty;
  if (mode === 'feet') { const hq = hatzHomePos(e); e.tx = hq.x; e.ty = hq.y; }
  if (t.isPlayer) {
    if (t.carry) { t.carry.c.carried = false; t.carry = null; }
    t.resting = false; t.action = null; t.actionT = 0;
    t.skyHeld = { h: e, meter: 0, t: 0 };
    G.banner = { str: 'A HATZEGOPTERYX HAS YOU! Mash SPACE to struggle free!', t: 3.5, color: '#ff6a4a' };
    G.shake = Math.min(8, (G.shake || 0) + 5);
  } else {
    t.heldBy = e; t.state = 'flee'; t.target = e; t.stateT = 3;
    const p = G.player;
    if (p && dist(p.x, p.y, e.x, e.y) < 520) floatText(e.x, e.y - (e.alt || 0) - 60, 'snatched!', '#ffd23e');
  }
  holdPrey(e, e.snatch);
  SFX.bite();
}
// the wild giant lets go (a feet-load from high up: the fall does the killing)
function hatzLetGo(e, msg) {
  const s = e.snatch;
  e.snatch = null;
  e.state = 'idle'; e.stateT = 0.5; e.target = null; e.landed = false;
  e.hungry = true; e.dropAt = G.time;       // it comes down to feed on what it dropped
  e.nextHunt = G.time + rrange(3, 6);       // (and stoops again if that got up)
  const q = s && s.e;
  if (!q) return;
  if (q.isPlayer) playerSkyRelease(q);
  else {
    q.heldBy = null; q.droppedBy = e;
    if ((q.alt || 0) > 1) { q.falling = true; q.fallV = 0; q.dropAlt = q.alt; }
    q.state = 'flee'; q.target = e; q.stateT = 3;
  }
  const p = G.player;
  if (msg && p && dist(p.x, p.y, e.x, e.y) < 520) floatText(e.x, e.y - (e.alt || 0) - 60, msg, '#e0b866');
}
// the player, let go (or wriggled free): if that was up in the air, down they go
function playerSkyRelease(p) {
  const sh = p.skyHeld;
  p.skyHeld = null;
  if (sh && sh.h && sh.h.snatch && sh.h.snatch.e === p) sh.h.snatch = null;
  if ((p.alt || 0) > 1) p.skyFall = { v: 0, from: p.alt };
  else p.alt = 0;
}
// ---- THE VISITS: the wild ones live out on the far islands, and only once
// every twenty minutes does one come over the herds' islands to hunt. It
// takes one animal (or one body), and goes home with it
const PREY_ISLES = ['takurei', 'kalimbra', 'halune', 'ekkalia', 'varossa', 'ilmeth'];
const HATZ_VISIT_EVERY = 20 * 60;
function isleKeyAtPx(x, y) { const i = isleAtPx(x, y); return i ? i.key : null; }
function hatzHomePos(e) {
  const k = e.isle && !PREY_ISLES.includes(e.isle) && isleByKey(e.isle) ? e.isle : 'saruun';
  return randIslePos(k, 'plains');
}
function hatzLeave(e) {
  e.visit = null; e.target = null; e.landed = false;
  const q = hatzHomePos(e);
  e.tx = q.x; e.ty = q.y; e.state = 'wander'; e.stateT = 60;
}
function hatzVisitTick() {
  if (G.hatzNextVisit == null) G.hatzNextVisit = G.time + rrange(8, 11) * 60;   // the first comes sooner
  if (G.time < G.hatzNextVisit) return;
  if (G.npcs.some(o => o.species === 'hatzego' && o.visit)) return;
  G.hatzNextVisit = G.time + HATZ_VISIT_EVERY;
  // where: over the player, if the player is island prey; else any herd island
  const p = G.player;
  let key = null;
  if (p && p.alive && PLAYER_DEF[p.species] && PLAYER_DEF[p.species].herdBorn) { const k = isleKeyAtPx(p.x, p.y); if (PREY_ISLES.includes(k)) key = k; }
  if (!key) key = PREY_ISLES[(rnd() * PREY_ISLES.length) | 0];
  const is = isleByKey(key);
  if (!is) return;
  let h = null, bd = 1e12;
  for (const o of G.npcs) {
    if (o.species !== 'hatzego' || o.hp <= 0 || isFamily(o) || o.snatch || o.haul) continue;
    const dd = dist(o.x, o.y, is.x, is.y);
    if (dd < bd) { bd = dd; h = o; }
  }
  if (!h) return;
  h.visit = { isle: key, x: is.x, y: is.y, on: false, until: 0, done: false };
  h.state = 'wander'; h.tx = is.x; h.ty = is.y; h.stateT = 5; h.landed = false; h.target = null;
}
// a body small enough to carry off (judged like a living one, by its size)
function carcLiftable(h, c) {
  const nd = NPC_DEF[c.species];
  if (!nd || nd.giant || nd.aquatic || (DINO[c.species] || {}).fish || (DINO[c.species] || {}).flyer) return false;
  return !!liftMode(h, { maxhp: nd.hp * hpFrac(c.growth != null ? c.growth : 1) });
}
function hatzHaul(e, c) {
  e.haul = c; c.carried = true; c.claim = null;
  e.state = 'haul'; e.stateT = 1e9; e.carc = null; e.landed = false; e.carryT = 0;
  const q = hatzHomePos(e);
  e.tx = q.x; e.ty = q.y;
  if (e.visit) e.visit.done = true;
  const p = G.player;
  if (p && dist(p.x, p.y, e.x, e.y) < 520) floatText(e.x, e.y - 60, 'carried off!', '#e0b866');
}
// the catch is gone for good: down the throat, or away over the sea
function hatzTakeAway(e, q, cause, swallowed) {
  e.snatch = null; e.swallowK = 0; e.gulp = false; e.gulpT = 0;
  if (q.isPlayer) { q.skyHeld = null; q.alt = 0; killPlayer(cause); }
  else { const i = G.npcs.indexOf(q); if (i >= 0) G.npcs.splice(i, 1); q.heldBy = null; q.hp = 0; }
  if (e.visit) e.visit.done = true;
  const p = G.player;
  if (swallowed) {
    if (p && dist(p.x, p.y, e.x, e.y) < 520) floatText(e.x, e.y - 60, 'gulp!', '#e0b866');
    SFX.eat();
    e.state = 'idle'; e.stateT = rrange(4, 7); e.landed = true;
  } else hatzLeave(e);
}
function thinkHatzego(e, d) {
  if (e.soar == null) e.soar = rrange(HATZ_SOAR[0], HATZ_SOAR[1]);
  hatzVisitTick();
  if (e.snatch || e.haul || e.state === 'carry' || e.state === 'landEat' || e.state === 'haul') return;   // the carry runs itself
  if (retaliationCheck(e, d)) return;
  const v = e.visit;
  // feeding on the ground — or, on a visit, picking the body up to take home
  if (e.state === 'scavenge' && e.carc && e.carc.meat > 0 && G.carcasses.indexOf(e.carc) >= 0) {
    if (v && carcLiftable(e, e.carc) && dist(e.x, e.y, e.carc.x, e.carc.y) < 50 && (e.alt || 0) < 8) hatzHaul(e, e.carc);
    return;
  }
  if (e.hungry) {
    const c = nearestCarcass(e.x, e.y, 320, false);
    if (c && c.meat > 4 && !c.carried && !treeCover(c.x, c.y)) {
      e.state = 'scavenge'; e.carc = c; e.stateT = rrange(10, 16);
      e.hungry = false;
      return;
    }
    if (G.time - (e.dropAt || 0) < 5) { e.state = 'idle'; e.stateT = 0.4; e.landed = false; return; }   // circling, watching it fall
    e.hungry = false;
  }
  if (v) {
    if (v.done) { if (!(e.state === 'idle' && e.stateT > 0)) hatzLeave(e); return; }
    if (!v.on) {
      if (dist(e.x, e.y, v.x, v.y) < 520) { v.on = true; v.until = G.time + 100; e.nextHunt = G.time + rrange(2, 5); }
      else { e.tx = v.x; e.ty = v.y; e.state = 'wander'; e.stateT = 5; e.landed = false; return; }
    }
    if (G.time > v.until) { hatzLeave(e); return; }
    if (G.time >= (e.nextHunt || 0)) {
      const t = e.state === 'stoop' && hatzQuarryOk(e, e.target) ? e.target : hatzFindQuarry(e, d.detect);
      if (t) {
        if (e.state !== 'stoop' || e.target !== t) { e.state = 'stoop'; e.target = t; e.stateT = 14; e.landed = false; }
        return;
      }
      if (e.state === 'stoop') { e.state = 'idle'; e.stateT = 0.5; e.target = null; }
      // nothing alive out in the open: anything dead it can carry will do
      const c = nearestCarcass(e.x, e.y, d.detect, false);
      if (c && c.meat > 0 && !c.carried && carcLiftable(e, c) && !treeCover(c.x, c.y)) { e.state = 'scavenge'; e.carc = c; e.stateT = 20; return; }
    }
    if (e.stateT > 0 && (e.state === 'wander' || e.state === 'idle')) return;
    const q = randIslePos(v.isle, 'plains');
    e.tx = q.x; e.ty = q.y; e.state = 'wander'; e.stateT = rrange(6, 10); e.landed = false;
    return;
  }
  if (e.stateT > 0 && (e.state === 'wander' || e.state === 'idle')) return;
  // arrived somewhere: now and then it comes down and stands a while (never
  // in the water, never in under the trees, never on the herds' islands)
  if (e.state === 'idle' && !e.landed && rnd() < 0.5 && !isWaterPx(e.x, e.y) && !treeCover(e.x, e.y) && !PREY_ISLES.includes(isleKeyAtPx(e.x, e.y))) {
    e.landed = true; e.stateT = rrange(5, 12); return;
  }
  // roam the far islands, keeping off the herds' ones between visits
  const isles = (World.isles || []).filter(i => !PREY_ISLES.includes(i.key));
  let q = null;
  for (let k = 0; k < 8 && !q && isles.length; k++) {
    const c = randIslePos(isles[(rnd() * isles.length) | 0].key, 'plains');
    if (dist(e.x, e.y, c.x, c.y) < 1400) q = c;
  }
  if (!q) q = hatzHomePos(e);
  e.tx = q.x; e.ty = q.y; e.state = 'wander'; e.stateT = 30; e.landed = false;
}
// how high a wild Hatzegopteryx wants to be for what it's doing (low!)
function hatzWant(e) {
  const st = e.state, t = e.target;
  if (e.haul) return 150;
  if (e.snatch) return st === 'landEat' ? 0 : e.snatch.mode === 'feet' ? 150 : 60;
  if (st === 'stoop' && t) return dist(e.x, e.y, t.x, t.y) < 150 ? 6 : e.soar;
  if (st === 'scavenge') return e.carc && dist(e.x, e.y, e.carc.x, e.carc.y) < 60 ? 0 : e.soar;
  if (st === 'idle') return e.landed && !isWaterPx(e.x, e.y) ? 0 : e.soar;
  return e.soar || 50;
}
// ---------- the herds under the sky (Tethyshadros, Magyarosaurus) ----------
// the nearest Hatzegopteryx (wild, or you) that could carry this one off
// (ANY Hatzegopteryx about sends the island herds for the trees, grown ones
// too: a player one only once it's big enough to be a menace)
function skyThreat(e) {
  let best = null, bd = 460;
  const p = G.player;
  if (p && p.alive && p.species === 'hatzego' && !p.hidden && ((p.growth || 1) >= 0.35 || liftMode(p, e))) { const dd = dist(e.x, e.y, p.x, p.y); if (dd < bd) { bd = dd; best = p; } }
  for (const o of G.npcs) {
    if (o.species !== 'hatzego' || o.hp <= 0 || o.snatch || o.haul || isFamily(o)) continue;
    const dd = dist(e.x, e.y, o.x, o.y);
    if (dd < bd) { bd = dd; best = o; }
  }
  return best;
}
// when a Hatzegopteryx comes, the whole herd runs for the nearest stand of
// trees and keeps still in there until the sky is clear (no cover in reach:
// they just run). They only turn on it when it follows them in and bites
function thinkIslandPrey(e, d) {
  const p = G.player;
  // BITTEN: it fights back, one on one, whoever bit it (a Hatzegopteryx
  // too). The rest of the herd doesn't pile in (noPile)
  if (e.aggroT > 0 && e.lastAttacker && !e.heldBy) {
    const t = e.lastAttacker;
    if ((t.isPlayer ? t.alive : t.hp > 0 && G.npcs.indexOf(t) >= 0) && dist(e.x, e.y, t.x, t.y) < d.detect * 1.5) {
      e.state = 'fight'; e.target = t; e.stateT = 1.5; return;
    }
  }
  // (a scare lasts: once seen, the giant is remembered for 10 s, so the
  // herd makes it all the way to the trees and stays put a while)
  let thr = skyThreat(e);
  if (thr) { e.skyThr = thr; e.skyAt = G.time; }
  else if (e.skyThr && G.time - e.skyAt < 10 && (e.skyThr.isPlayer ? e.skyThr.alive : e.skyThr.hp > 0) && dist(e.x, e.y, e.skyThr.x, e.skyThr.y) < 1100) thr = e.skyThr;
  else e.skyThr = null;
  if (thr) {
    if (treeCover(e.x, e.y)) { e.state = 'hide'; e.target = thr; e.stateT = 2.5; return; }
    if (!e.coverSpot || G.time - (e.coverAt || 0) > 3) { e.coverSpot = nearestCover(e.x, e.y, 650); e.coverAt = G.time; }
    if (e.coverSpot) { e.state = 'cover'; e.tx = e.coverSpot.x; e.ty = e.coverSpot.y; e.target = thr; e.stateT = 3; return; }
    if (e.state !== 'flee') { e.state = 'flee'; e.target = thr; e.stateT = 2.5; }
    return;
  }
  if ((e.state === 'cover' || e.state === 'hide') && e.stateT > 0) return;
  // YOUR HERD: it keeps round its leader (and the leader waits for a straggler)
  const H = G.herd;
  if (H && e.herdKin && H.kin.indexOf(e) >= 0 && e.state !== 'fight') {
    const L = H.leader;
    if (L === e) {
      if (p && p.alive && !p.skyHeld) { const pd = dist(e.x, e.y, p.x, p.y); if (pd > 340 && pd < 1000) { e.state = 'idle'; e.stateT = 1.2; return; } }
    } else if (L && (L.isPlayer ? L.alive : L.hp > 0)) {
      if (e.home) { e.home.x = L.x; e.home.y = L.y; }
      if (dist(e.x, e.y, L.x, L.y) > 150) { e.state = 'follow'; e.target = L; e.stateT = 2; return; }
    }
  }
  thinkHerdFighter(e, d);
}
// a herd of every age: the young are smaller, softer and bite lighter
function ageNPC(e, g) {
  g = clamp(g + (g < 1 ? rrange(-0.05, 0.05) : 0), 0.08, 1);
  if (g >= 1) return;
  e.growth = g;
  e.hp = e.maxhp = Math.round(NPC_DEF[e.species].hp * hpFrac(g));
  e.dmgMul = dmgFrac(g);
}
// every flyer NPC (wild, or your own mate and chicks) picks a height for
// what it's doing and climbs or glides to it — the same rates as the player
const NPC_SOAR = [120, 330];   // each wild flyer has its own favourite height
function npcFlight(e, dt) {
  const st = e.state, t = e.target;
  let want = 0;
  if (e.isMate || e.isBaby || e.packAlpha) {
    // family keeps to YOUR sky: up with you, down when you land
    const p = G.player;
    if (p && p.alive) want = isAirborne(p) ? p.alt : (dist(e.x, e.y, p.x, p.y) > 170 ? 70 : 0);
  } else if (NPC_DEF[e.species] && NPC_DEF[e.species].snatcher && !['chase', 'windup', 'lunge', 'recover', 'fight'].includes(st)) want = hatzWant(e);
  else if (st === 'scavenge') want = e.carc && dist(e.x, e.y, e.carc.x, e.carc.y) < 45 ? 0 : 85;
  else if (st === 'flee') want = Math.min(FLY_CEIL, (e.soar || 200) + 80);
  else if (st === 'wander' || st === 'return' || st === 'migrate') want = e.soar || (e.soar = rrange(NPC_SOAR[0], NPC_SOAR[1]));
  else if (t && (st === 'chase' || st === 'windup' || st === 'lunge' || st === 'recover' || st === 'fight')) {
    // match a flyer's height; swoop down to a grounded one's head height
    want = isAirborne(t) ? t.alt : dist(e.x, e.y, t.x, t.y) < 90 ? Math.min(20, reachHeight(t) * 0.7) : 60;
  }
  // a wild giant never comes down in under the trees
  if (NPC_DEF[e.species] && NPC_DEF[e.species].noCover && want < 40 && treeCover(e.x, e.y)) want = 40;
  const a = e.alt || 0;
  e.alt = want > a ? Math.min(want, a + FLY_CLIMB * dt) : Math.max(want, a - FLY_SINK * 1.4 * dt);
  e.wing = lerp(e.wing || 0, want > a + 1 ? 1 : 0, Math.min(1, dt * 6));
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

// ---- THE GIANT OF THE RED SAND (yunmenglong) ----
// One adult plods the whole desert from crown to crown, stripping the big
// trees. It is a tank: anything with teeth that crowds it — or bites it —
// gets the tail if it stands behind, the STOMP if it stands in front.
// Its young live in the Giants' Cradle (e.cradle) and only ever run.
function giantSize(e) {
  return DINO.yunmeng.scale * sizeScale(e.growth != null ? e.growth : 1) * (e.elder ? ELDER_MOD.size : 1);
}
function thinkGiant(e, d) {
  if (e.cradle) { thinkGiantBaby(e, d); return; }
  // a grudge carries further than the tank's short fuse
  let t = null;
  const la = e.lastAttacker;
  if (e.aggroT > 0 && la && (la.isPlayer ? la.alive : la.hp > 0) && dist(e.x, e.y, la.x, la.y) < 460) t = la;
  if (!t) t = tankThreat(e, d);
  if (t) {
    if (e.state !== 'fight' || e.target !== t) { e.state = 'fight'; e.target = t; }
    e.stateT = 2.5;
    return;
  }
  // it has no home: wherever it stands is home (the tank leash never trips)
  e.home.x = e.x; e.home.y = e.y;
  if (e.stateT > 0) return;
  // the next crown: the one it's already plodding to (re-picking the nearest
  // on every think, it hopped trunk to trunk through the river belt and never
  // ate), else the nearest big leafy tree outside the Cradle
  let tree = e.goalTree;
  if (tree && (tree.leaf === 0 || e.goalTries >= 3)) { e.lastTree = tree; tree = null; }   // stripped, or no way through
  if (!tree && rnd() < 0.75) {
    let bd = 560;
    for (const tr of World.trees) {
      if (tr.kind === 2 || tr.kind >= 4 || tr.leaf === 0 || tr === e.lastTree) continue;
      const dd = dist(e.x, e.y, tr.x, tr.y);
      if (dd < bd && !inCradle(tr.x, tr.y, 160)) { bd = dd; tree = tr; }
    }
  }
  if (tree) {
    // stand off to the side, at a neck's length — the head goes INTO the crown
    const side = e.x < tree.x ? 1 : -1, reach = 130 * giantSize(e) / DINO.yunmeng.scale;
    const sx = tree.x - side * reach, sy = tree.y + 8;
    if (dist(e.x, e.y, sx, sy) < 34) {
      e.facing = side;
      e.state = 'browse'; e.stateT = rrange(7, 12); e.browseTree = tree; e.lastTree = tree; e.goalTree = null;
    } else {
      e.goalTries = tree === e.goalTree ? e.goalTries + 1 : 0;
      e.goalTree = tree;
      e.state = 'wander'; e.tx = sx; e.ty = sy; e.stateT = 14;
    }
    return;
  }
  e.goalTree = null;
  // no crowns in reach: plod on across the sand
  for (let k = 0; k < 12; k++) {
    const a = rnd() * TAU, rr = rrange(300, 900);
    const tx = e.x + Math.cos(a) * rr, ty = e.y + Math.sin(a) * rr;
    if (tx < 120 || ty < 120 || tx > WORLD_W - 120 || ty > WORLD_H - 120) continue;
    if (isWaterPx(tx, ty) || isCliffPx(tx, ty) || inCradle(tx, ty, 200)) continue;
    e.tx = tx; e.ty = ty;
    e.state = 'wander'; e.stateT = rrange(10, 18);
    return;
  }
  e.state = 'idle'; e.stateT = rrange(2, 4);
}
// the Cradle's young: quick for their size, nervous, never far from the
// cycads — they don't fight, they run (and the guardian minds the pond)
function thinkGiantBaby(e, d) {
  const c = World.cradle;
  let threat = null, td = 1e9;
  const p = G.player;
  if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn') {
    const dd = dist(e.x, e.y, p.x, p.y);
    if (dd < preyDetect(e, 260)) { threat = p; td = dd; }
  }
  for (const o of G.npcs) {
    if (!isPredatorNPC(o.species) || o.species === 'aegisu') continue;
    const dd = dist(e.x, e.y, o.x, o.y);
    if (dd < 260 && dd < td) { threat = o; td = dd; }
  }
  if (threat) { e.state = 'flee'; e.target = threat; e.stateT = 2.5; return; }
  if (e.stateT > 0) return;
  if (c && dist(e.x, e.y, c.x, c.y) > c.r * 0.8) {
    const p2 = cradlePos(0.2, 0.55);
    e.state = 'wander'; e.tx = p2.x; e.ty = p2.y; e.stateT = 8; return;
  }
  const r = rnd();
  if (r < 0.35) { e.state = 'graze'; e.stateT = rrange(2.5, 5); }
  else if (r < 0.55) { e.state = 'idle'; e.stateT = rrange(1, 3); }
  else { const p2 = cradlePos(0.2, 0.7); e.state = 'wander'; e.tx = p2.x; e.ty = p2.y; e.stateT = rrange(4, 8); }
}
// a dry spot inside the Cradle, between rMin and rMax of its radius
function cradlePos(rMin, rMax) {
  const c = World.cradle;
  for (let k = 0; k < 30; k++) {
    const a = rnd() * TAU, rr = rrange(rMin, rMax) * c.r;
    const x = c.x + Math.cos(a) * rr, y = c.y + Math.sin(a) * rr;
    if (!isWaterPx(x, y) && !nearWaterPx(x, y, 20) && !isCliffPx(x, y)) return { x, y };
  }
  return { x: c.x + c.pond.r * 1.6, y: c.y };
}
// the giant's own fight: what stands BEHIND the hips gets the tail, what
// stands in FRONT gets the stomp (and walking into it gets you trampled)
function giantFight(e, d, t, dt, sp) {
  const dd = dist(e.x, e.y, t.x, t.y);
  const toward = t.x > e.x ? 1 : -1;
  const eRad = bodyRadius(e), tRad = bodyRadius(t);
  const front = (t.x - e.x) * (e.facing || 1) > -eRad * 0.3;
  const s = giantSize(e);
  const fx = e.x + (e.facing || 1) * DINO.yunmeng.L.body[0] * 0.3 * s;
  const em = e.elder ? ELDER_MOD.size : 1;
  // THE PUNCH: a brief lift of the near forefoot (the tell), then it jabs —
  // the giant stands planted for the instant of the windup
  e.punchCd = Math.max(0, (e.punchCd || 0) - dt);
  if (e.punchT != null) {
    e.punchT -= dt;
    if (e.punchT <= 0) giantPunch(e, d);
    else { idleDrift(e, dt); return; }
  }
  if (front && e.growth >= 0.6 && e.punchCd <= 0 && e.attackT <= 0.15) {
    const z = punchZone(e, d);
    if (dist(z.x, z.y, t.x, t.y) < z.r + bodyRadius(t) * 0.6) {
      faceToward(e, toward);
      e.punchT = d.punch.wind * (e.elder ? 0.85 : 1);
      return;
    }
  }
  if (front && e.growth >= 0.6 && (e.stompCd || 0) <= 0 && e.attackT <= 0.15 &&
      dist(fx, e.y, t.x, t.y) < d.stomp.r * em * 0.7) {
    startStomp(e, d, t);
    return;
  }
  const committed = e.attackT > 0.15;
  if (!front) {
    // keep the back turned and swing — a hard enough blow can crack bone
    e.atkKind = 'tail';
    const pt = tryMelee(e, t, d, d.melee);
    if (pt && d.tailBone) {
      if (t.isPlayer) playerBoneBreak(t, pt.dmg, 'The tail', d.tailBone.mul, d.tailBone.max);
      else tryBoneBreak(e, t, pt.part === 'head' ? 'leg' : pt.part, pt.dmg * d.tailBone.mul);
    }
    // out past the club's reach — or tucked in under the hips, where the
    // swing passes overhead: swing round to face it instead (no safe spot)
    if (!committed && (dd > tailWedgeCircle(e).r + tRad || (e.atkCd <= 0 && !weaponContact(e, t)))) faceToward(e, toward);
  } else if (!committed) faceToward(e, toward);
  // plod in on whatever stands off — and shoulder on into it once there:
  // anything that stays at the front feet gets walked over (giantTrample)
  if (front) stepToward(e, t.x, t.y, sp * (dd > eRad + tRad - 4 ? 0.9 : 0.6), dt);
  else if (!front && dd > tailWedgeCircle(e).r + tRad) stepToward(e, t.x, t.y, sp * 0.9, dt);
  else idleDrift(e, dt);
}
// the guardian on land: a croc's weapon is the tip of a long snout, so it
// comes in LEVEL with the quarry, from one side, instead of parking against
// it (bodies are solid: from above or below the jaws would never reach)
function guardianFight(e, d, t, dt, sp) {
  // keep the side it's on — dead under the quarry it would flip-flop
  if (!e.fightSide || Math.abs(t.x - e.x) > 30) e.fightSide = t.x > e.x ? -1 : 1;
  if (e.attackT <= 0.15) faceToward(e, -e.fightSide);
  const off = bodyRadius(e) + (t.isPlayer ? 8 + 10 * t.growth : bodyRadius(t));   // just clear of its body
  // wedged dead against a cycad trunk (the push-out cancels the stride
  // exactly): slip off sideways for a moment, then come on again
  const moved = e.fx0 == null ? 1 : dist(e.x, e.y, e.fx0, e.fy0);
  e.fx0 = e.x; e.fy0 = e.y;
  if (e.slipT > 0) {
    e.slipT -= dt;
    stepToward(e, e.x + Math.cos(e.slipA) * 40, e.y + Math.sin(e.slipA) * 40, sp * 0.9, dt);
  } else if (!weaponContact(e, t)) {
    stepToward(e, t.x + e.fightSide * off, t.y, sp * 0.9, dt);
    e.stuckT = moved < 0.05 ? (e.stuckT || 0) + dt : 0;
    if (e.stuckT > 0.3) { e.slipT = 0.5; e.slipA = e.heading + (rnd() < 0.5 ? 1.3 : -1.3); e.stuckT = 0; }
  } else idleDrift(e, dt);
  e.atkKind = null;
  tryMelee(e, t, d, d.melee);
}
// up on the hind legs: the stomp lands where the front feet were AIMED —
// at the target, a little past the feet — so the rear-up is the warning
function startStomp(e, d, t) {
  const s = giantSize(e);
  const fx = e.x + (e.facing || 1) * DINO.yunmeng.L.body[0] * 0.3 * s;
  const a = angTo(fx, e.y, t.x, t.y), reach = Math.min(dist(fx, e.y, t.x, t.y), 70 * s / DINO.yunmeng.scale);
  e.stompX = fx + Math.cos(a) * reach; e.stompY = e.y + Math.sin(a) * reach;
  e.state = 'stomp'; e.stompPhase = 'up'; e.stompT = 0; e.stateT = 6;
  e.stompWind = d.stomp.wind * (e.elder ? 0.8 : 1);
  e.move = 0;
  if (G.player && dist(e.x, e.y, G.player.x, G.player.y) < 900) SFX.call(3, 'yunmeng', 1);
}
// …and down. Under the feet: crushed (a grown Aerosteon dies outright, and
// the bone almost always goes). Around them: the ground itself hits you
function giantSlam(e, d) {
  const st = d.stomp, em = e.elder ? ELDER_MOD.size : 1;
  const R = st.r * em, U = st.under * em;
  e.stompPhase = 'down'; e.stateT = 0.9; e.attackT = 1;
  e.stompCd = st.cd * rrange(0.85, 1.2) * (e.elder ? 0.85 : 1);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * TAU, sp = rrange(60, 160);
    G.particles.push({
      x: e.stompX + Math.cos(a) * U * 0.6, y: e.stompY + Math.sin(a) * U * 0.3,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.4 - 30,
      t: 0, life: rrange(0.6, 1.1), r: rrange(2, 4.5), color: rnd() < 0.5 ? '#c8a070' : '#a8804e', grav: 60,
    });
  }
  const p = G.player;
  if (p) {
    const pd = dist(e.stompX, e.stompY, p.x, p.y);
    if (pd < 900) { G.shake = Math.min(12, (G.shake || 0) + 10 * (1 - pd / 900)); SFX.stomp && SFX.stomp(); }
  }
  for (const v of [G.player, ...G.npcs]) {
    if (!v || v === e) continue;
    if (v.isPlayer ? (!v.alive || v.hidden) : (v.hp <= 0 || v.species === 'yunmeng')) continue;
    const dd = dist(e.stompX, e.stompY, v.x, v.y) - bodyRadius(v) * 0.6;   // the bulky get out from under last
    if (dd > R) continue;
    let dmg;
    if (dd <= U) {
      dmg = st.underDmg * rrange(0.92, 1.08);
      dealDamage(v, dmg, e, { kb: 380 });
      if (v.isPlayer) { floatText(v.x, v.y - 70, 'CRUSHED!', '#ff6a5e'); if (v.alive) playerBoneBreak(v, dmg, 'The stomp', 4, 0.85); }
      else if (v.hp > 0) tryBoneBreak(e, v, rnd() < 0.7 ? 'leg' : 'body', dmg * 3);
    } else {
      const f = 1 - (dd - U) / Math.max(1, R - U);
      dmg = st.dmg * (0.35 + 0.65 * f);
      // (the ring only bruises and throws — bones go under the feet)
      dealDamage(v, dmg, e, { kb: 200 + 300 * f });
    }
  }
}
// where the punch lands: just ahead of the front feet, scaled with the giant
function punchZone(e, d) {
  const k = giantSize(e) / DINO.yunmeng.scale, f = e.facing || 1;
  const fx = e.x + f * DINO.yunmeng.L.body[0] * 0.3 * giantSize(e);
  return { x: fx + f * d.punch.reach * k, y: e.y, r: d.punch.r * k };
}
// …and the jab itself: everything in the zone takes the full blow (the
// elder's extra weight rides in dealDamage's ELDER_DMG)
function giantPunch(e, d) {
  e.punchT = null;
  e.punchCd = d.punch.cd * rrange(0.9, 1.15) * (e.elder ? 0.85 : 1);
  e.atkKind = 'punch'; e.attackT = 1;
  const z = punchZone(e, d);
  for (const v of [G.player, ...G.npcs]) {
    if (!v || v === e) continue;
    if (v.isPlayer ? (!v.alive || v.hidden) : (v.hp <= 0 || v.species === 'yunmeng')) continue;
    if (dist(z.x, z.y, v.x, v.y) > z.r + bodyRadius(v) * 0.6) continue;
    dealDamage(v, d.punch.dmg * rrange(0.95, 1.05), e, { kb: d.punch.kb, hitX: z.x, hitY: v.y - 20 });
    floatText(v.x, v.y - 64, 'PUNCHED!', '#ff9a5e');
  }
  const p = G.player;
  if (p && dist(z.x, z.y, p.x, p.y) < 600) { G.shake = Math.min(12, (G.shake || 0) + 4); SFX.bite(); }
}
// walking INTO the giant's path: anything at the leading feet gets run over
function giantTrample(e, d, dt) {
  e.trampleCd = Math.max(0, (e.trampleCd || 0) - dt);
  if (e.trampleCd > 0 || e.move < 0.35 || e.growth < 0.6) return;
  const eRad = bodyRadius(e), hx = Math.cos(e.heading || 0), hy = Math.sin(e.heading || 0);
  // the feet that come down are the FRONT feet: the zone sits under the chest
  const fx = e.x + (e.facing || 1) * DINO.yunmeng.L.body[0] * 0.3 * giantSize(e);
  let hit = false;
  for (const v of [G.player, ...G.npcs]) {
    if (!v || v === e) continue;
    if (v.isPlayer ? (!v.alive || v.hidden) : (v.hp <= 0 || v.species === 'yunmeng')) continue;
    // only its quarry gets run down — a calm giant steps round the little things
    if (!v.isPlayer && e.state !== 'fight') continue;
    if (dist(fx, e.y, v.x, v.y) > eRad * 0.8 + bodyRadius(v) + 6) continue;
    if ((v.x - e.x) * hx + (v.y - e.y) * hy < 0) continue;   // behind the stride
    dealDamage(v, d.trample.dmg * rrange(0.85, 1.15), e, { kb: 320 });
    floatText(v.x, v.y - 60, 'TRAMPLED!', '#ff9a5e');
    hit = true;
  }
  if (hit) e.trampleCd = d.trample.cd;
}

// ---- THE GUARDIAN OF THE GIANTS' CRADLE (aegisuchus) ----
// Lies in the Cradle's pond, a ghost under the water: anything with teeth
// that comes down to drink is taken like a megorontosuchus takes its prey.
// Every minute or two it hauls out and walks the nursery — and whatever
// meat-eater it finds there, it fights. The nursery's own are never prey.
function guardianMayHunt(o) {
  if (!o) return false;
  if (o.isPlayer) return o.alive && !o.grabbed && !o.hidden && inCradle(o.x, o.y, 120);
  return o.hp > 0 && o.species !== 'aegisu' && isPredatorNPC(o.species) && inCradle(o.x, o.y, 120);
}
function thinkGuardian(e, d) {
  const c = World.cradle;
  if (!c) { thinkSurfKing(e, d); return; }
  const p = G.player;
  if (e.patrolAt == null) e.patrolAt = G.time + rrange(45, 90);
  if (G.time >= e.patrolAt && e.state !== 'gripping' && e.state !== 'strike') {
    e.patrolEnd = G.time + rrange(25, 40);
    e.patrolAt = e.patrolEnd + rrange(60, 120);
  }
  if (p && p.alive && !G.guardianSeen && dist(e.x, e.y, p.x, p.y) < 320 && (!e.submerged || e.target === p)) {
    G.guardianSeen = true;
    G.banner = { str: "AEGISUCHUS — the Guardian of the Giants' Cradle", t: 5, color: '#ff9a5e' };
  }
  if (e.state === 'stalk' || e.state === 'strike' || e.state === 'gripping' || e.state === 'cooldown') return;
  // a fight ends the moment its quarry leaves the Cradle
  if (e.state === 'fight' && !guardianMayHunt(e.target)) { e.state = 'return'; e.target = null; e.stateT = 10; return; }
  if (e.aggroT > 0 && guardianMayHunt(e.lastAttacker)) {
    e.submerged = false; e.state = 'fight'; e.target = e.lastAttacker; e.stateT = 2; return;
  }
  if (G.time < (e.patrolEnd || 0)) {
    // ON PATROL: out of the water and walking the nursery
    e.submerged = false;
    let best = null, bd = d.detect;
    for (const o of [p, ...G.npcs]) {
      if (o === e || !guardianMayHunt(o)) continue;
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd < bd) { bd = dd; best = o; }
    }
    if (best) { e.state = 'fight'; e.target = best; e.stateT = 2; return; }
    if (e.state === 'fight' || e.stateT > 0) return;
    const wp = cradlePos(0.3, 0.75);
    e.tx = wp.x; e.ty = wp.y; e.state = rnd() < 0.3 ? 'idle' : 'wander'; e.stateT = rrange(5, 9);
    return;
  }
  // patrol's over: back down into the pond
  const pond = c.pond;
  if (dist(e.x, e.y, pond.x, pond.y) > pond.r * 0.7) {
    if (e.state !== 'return') { e.state = 'return'; e.target = null; e.stateT = 12; }
    e.home.x = pond.x; e.home.y = pond.y;
    return;
  }
  // in the pond: the ghost waits for anything with teeth that wades in
  let best = null, bd = d.detect;
  if (p && p.alive && !p.grabbed && !p.fishing && !p.hidden && (isWaterPx(p.x, p.y) || nearWaterPx(p.x, p.y, 34)) && inCradle(p.x, p.y)) {
    const dd = dist(e.x, e.y, p.x, p.y);
    if (dd < bd) { bd = dd; best = p; }
  }
  for (const o of G.npcs) {
    if (o === e || !guardianMayHunt(o)) continue;
    if (!isWaterPx(o.x, o.y) && !nearWaterPx(o.x, o.y, 30)) continue;
    const dd = dist(e.x, e.y, o.x, o.y);
    if (dd < bd) { bd = dd; best = o; }
  }
  if (best && (e.tiredT || 0) <= 0) { e.state = 'stalk'; e.target = best; e.stateT = 14; return; }
  if (e.stateT > 0) return;
  for (let k = 0; k < 10; k++) {
    const a = rnd() * TAU, rr = rrange(10, pond.r * 0.6);
    const tx = pond.x + Math.cos(a) * rr, ty = pond.y + Math.sin(a) * rr;
    if (isWaterPx(tx, ty)) { e.tx = tx; e.ty = ty; break; }
  }
  e.state = 'lurk'; e.stateT = rrange(3, 7);
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
  kunduro: thinkHerdFighter,
  shri: thinkPackHunter, kuru: thinkPackHunter, tsaagan: thinkPackHunter, mahakala: thinkPackHunter,
  luanchuan: thinkPackHunter, adasaurus: thinkPackHunter,
  garudi: thinkSkittish, harpy: thinkSkittish, sinorni: thinkSkittish, kinnaree: thinkSkittish, aepyorni: thinkSkittish,
  beishan: thinkHerdFighter, epidex: thinkSkittish,
  procomp: thinkPackHunter,   // (pack recruits: see the packAlpha route in thinkNPC)
  aero: thinkPackHunter,
  homalo: thinkHerdFighter,
  willina: thinkHerdFighter, bonaparte: thinkHerdFighter, huallas: thinkHerdFighter, kelumapu: thinkHerdFighter,
  gilmoreo: thinkHerdFighter, bactro: thinkHerdFighter, plesio: thinkSkittish,
  deltadro: thinkRunner, eocarch: thinkHunter, suchos: thinkHunter,
  scelido(e, d) {
    const p = G.player;
    if (!p || !p.alive) { defaultWander(e); return; }
    const drinking = e.state === 'drink';
    const detect = preyDetect(e, drinking ? 42 : d.detect);
    const pd = dist(e.x, e.y, p.x, p.y);
    const carnPlayer = PLAYER_DEF[p.species].diet === 'carn';
    if (retaliationCheck(e, d, 'fight')) return;
    if (pd < detect && carnPlayer) {
      // smacks the clearly weaker with its tail; the wary thing runs from
      // anything approaching its own strength, standing ground in between
      // (the flee bar is deliberately individual-scale — herds don't embolden it)
      if (confident(e, p)) { e.state = 'fight'; e.target = p; e.stateT = 2.5; return; }
      if (powerOf(p) > powerOf(e) * 0.75) { e.state = 'flee'; e.target = p; e.stateT = 3; return; }
      e.state = 'guard'; e.target = p; e.stateT = 1.5; return;
    }
    defaultWander(e, true);
  },
  grunos: thinkHunter,   // the prairie's apex bruiser: bold, but adults outgrow its ambition
  lophos(e, d) {
    // THE HIT-AND-RUN BLEEDER: its bite barely stings, but the wound it opens
    // won't close — so the tactic is to strike, sprint clear, and wait for the
    // bleed to lapse before darting back in. It fears nothing (a pack whittles
    // down animals far too big for it, one cut at a time), but a target that's
    // already bleeding is left alone until the wound heals.
    const p = G.player;
    const bleeding = (t) => t && t.bleed && t.bleed.t > 0.5;
    // still on a target that's bleeding? break off — sprint clear, then hold at
    // the edge of sight and WATCH, so the moment the wound closes it can blitz
    // back in. (Fleeing the whole bleed would carry it off the map and it'd
    // never return — skulk just out of reach instead.)
    if (bleeding(e.target) && (e.target.isPlayer ? e.target.alive : e.target.hp > 0)) {
      const dd = dist(e.x, e.y, e.target.x, e.target.y);
      // short flee bursts out to ~190px, then circle — staying inside detection
      // range (300) so it can pounce back the instant the wound closes
      if (dd < 190) { e.state = 'flee'; e.stateT = 0.5; }
      else { e.state = 'avoid'; e.stateT = 0.8; }
      return;
    }
    // retaliate against a fresh (non-bleeding) attacker — fearless, no size cap
    if (e.aggroT > 0 && e.lastAttacker && !bleeding(e.lastAttacker) &&
      (e.lastAttacker.isPlayer ? p.alive : e.lastAttacker.hp > 0)) {
      e.state = 'chase'; e.target = e.lastAttacker; e.stateT = 5; return;
    }
    // hunt the player at any size it isn't already bleeding — the bleed is what
    // lets this frail thing punch so far above its weight
    if (p && p.alive && p.growth > 0.08 && !bleeding(p) && playerVisibleTo(e, d.detect) && (e.tiredT || 0) <= 0) {
      e.state = 'chase'; e.target = p; e.stateT = 5; return;
    }
    // hunt its natural prey (ornithomimus) — but never a target mid-bleed
    if (e.state !== 'chase' && rnd() < 0.35) {
      let best = null, bd = d.detect;
      for (const o of G.npcs) {
        if (!d.hunts.includes(o.species) || bleeding(o)) continue;
        const dd = dist(e.x, e.y, o.x, o.y);
        if (dd < bd) { bd = dd; best = o; }
      }
      if (best) { e.state = 'chase'; e.target = best; e.stateT = 6; return; }
    }
    if (e.state === 'chase' && e.target) return;
    if (e.state === 'flee') return;   // let a skulk-retreat run its course
    const c = nearestCarcass(e.x, e.y, 220, true);
    if (c && c.meat > 20 && rnd() < 0.4) { e.state = 'scavenge'; e.carc = c; e.stateT = 5; return; }
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
  concav: thinkHunter,   // pack-brave claw hunter: its courage is counted in packmates
  // --- Ashfall Ridge ---
  tarbo: thinkHunter,    // the tyrant: hunts anything weaker than itself — which is most things
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
  aardi: thinkPackHunter,   // recruits are routed to thinkPackFollower below, for every pack species
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
    if (retaliationCheck(e, d, 'fight')) return;
    if (p && p.alive && !trivialPrey(e, p) && confident(e, p) && dist(e.x, e.y, p.x, p.y) < preyDetect(e, d.detect)) {
      e.state = 'fight'; e.target = p; e.stateT = 2; return;
    }
    defaultWander(e, true);
  },
  yuty: thinkHunter,     // the feathered tyrant: fast, bold, hunts the delta's mid-sizes
  lourinha: thinkHunter, // the delta's terror: caution so low even adults stay on the menu
  sino(e, d) {
    // the charger: guards like a tank, but answers threats at a dead run —
    // 'chase' hands it to the windup→lunge machinery, and its lungeT/lungeMul
    // turn that lunge into a full ceratopsian charge
    let threat = null, td = 1e9;
    const p = G.player;
    if (p && p.alive && PLAYER_DEF[p.species].diet === 'carn' && !trivialPrey(e, p)) {
      const dd = dist(e.x, e.y, p.x, p.y);
      if (dd < preyDetect(e, d.detect)) { threat = p; td = dd; }
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
  ichthyod(e, d) {
    // ICHTHYODECTES: Xiphactinus's smaller cousin, a sea barracuda. It runs
    // down small fish, and harries a swimming plesiosaur (a nuisance, not a
    // killer: a darting bite, then it breaks off). The abelisaurs it ignores
    const p = G.player;
    if (e.aggroT > 0 && e.lastAttacker && isWaterPx(e.lastAttacker.x, e.lastAttacker.y)) {
      e.state = 'chase'; e.target = e.lastAttacker; e.stateT = 3; return;
    }
    if (e.state === 'chase' && e.target) {
      const t = e.target;
      if ((t.isPlayer ? t.alive : t.hp > 0) && isWaterPx(t.x, t.y) && e.stateT > 0) return;
      e.state = 'wander'; e.target = null; e.stateT = 0;
    }
    e.restT = Math.max(0, (e.restT || 0) - 0.25);
    if (e.restT <= 0 && p && p.alive && PLAYER_DEF[p.species].marine && isWaterPx(p.x, p.y) && dist(e.x, e.y, p.x, p.y) < d.detect) {
      e.state = 'chase'; e.target = p; e.stateT = rrange(2.5, 4);
      e.restT = rrange(6, 12);   // after a run at you, it sheers off a while
      return;
    }
    if (rnd() < 0.3) {
      for (const o of G.npcs) {
        if (o !== e && o.hp > 0 && d.hunts.includes(o.species) && dist(e.x, e.y, o.x, o.y) < d.detect) {
          e.state = 'chase'; e.target = o; e.stateT = 4; return;
        }
      }
    }
    thinkFish(e, d);
  },
};
// --- the Wall's minds, mapped to the shared archetypes ---
NPC_THINK.kerbero = thinkTank;          // herd guardian: stands, swings the tail
NPC_THINK.beipiao = thinkTank;          // planted scythe-armed sentry
NPC_THINK.pectino = thinkPackHunter;    // blizzard-chasing scavenger gang
NPC_THINK.nanuq = thinkHunter;          // the polar tyrant hunts like the prairie bruiser — everything
NPC_THINK.korean = thinkSkittish;       // tiny, nervous, delicious
// --- the Moors' minds, mapped to the shared archetypes ---
NPC_THINK.gracili = thinkPackHunter;    // mist-pack of glass knives
NPC_THINK.telmato = thinkHerdFighter;   // the dwarf herds swing back together
NPC_THINK.tanius = thinkHerdFighter;
NPC_THINK.secerno = thinkHerdFighter;
NPC_THINK.spiclypeus = thinkTank;       // the horned silhouettes hold their ground
NPC_THINK.mercuri = thinkTank;
NPC_THINK.coahuila = thinkTank;
NPC_THINK.vulcano = thinkTank;
NPC_THINK.shanag = thinkSkittish;
NPC_THINK.achillo = thinkPackHunter;
NPC_THINK.preno = thinkHerdFighter;
NPC_THINK.bravo = thinkTank;
NPC_THINK.duria = thinkHunter;          // the Dorset hunter wants a real meal
NPC_THINK.drypto = thinkRunner;         // the long tyrant runs its prey down
// --- the Reach's minds ---
NPC_THINK.talenk = thinkHerdFighter;    // plate-ribbed browsers close ranks
NPC_THINK.macrog = thinkHerdFighter;
NPC_THINK.bonita = thinkTank;           // the canopy-croppers simply stand
NPC_THINK.overo = thinkTank;
NPC_THINK.skorpio = thinkHunter;        // the bulldog abelisaur hunts by face
NPC_THINK.masiak = thinkPackHunter;     // hook-toothed gangs of the leaf litter
NPC_THINK.arari = thinkHunter;          // the dog-croc runs its prey down on land
NPC_THINK.titanov = thinkHunter;        // the titan-killer: caution so low a grown nivalotitan reads as DINNER
// --- the Death Desert's giant and the Cradle's guardian ---
NPC_THINK.yunmeng = thinkGiant;
NPC_THINK.aegisu = thinkGuardian;
// --- the Lesser Archipelago ---
NPC_THINK.zalmox = thinkHerdFighter;    // squat island ornithopods close ranks
NPC_THINK.iani = thinkHerdFighter;      // Drevan's and Kesh's own ornithopods
NPC_THINK.hypsi = thinkSkittish;       // Okiri's thicket-mice: quick, and quick to bolt
NPC_THINK.fylax = thinkHerdFighter;
NPC_THINK.chenani = thinkHunter;      // the big island abelisaur hunts by face, slowly
NPC_THINK.ptero = thinkPtero;          // the gull: soar, find the dead, squabble, scatter
NPC_THINK.hatzego = thinkHatzego;      // the sky's king: roam low, stoop, carry off
NPC_THINK.tethys = thinkIslandPrey;     // the herds: when a lifter flies over, the young run for the trees
NPC_THINK.magyaro = thinkIslandPrey;
NPC_THINK.garami = thinkGarami;
NPC_THINK.kaiwhe = thinkKaiwhe;     // the wild plesiosaurs: easy-going fish-eaters
// GARAMIRALA: the keeper of a strait. It patrols its own stretch of deep
// water and nothing else; whatever swims into that water is attacked, no
// warning, no mercy, no giving up while the prey stays in the deep. The
// PATHWAY's keeper (e.guard) takes the player too. The channel keepers take
// other animals — and players of any species but the abelisaur, which
// hatches beyond their waters and never troubles them.
function thinkGarami(e, d) {
  const p = G.player;
  const inZone = (o) => isDeepPx(o.x, o.y) && dist(o.x, o.y, e.home.x, e.home.y) < d.homeR;
  const huntsPlayer = (q) => q && q.alive && !q.hidden && (e.guard || q.species !== 'ekrix');
  // a hunt in progress runs until the prey dies or reaches the shallows
  if (e.state === 'chase' && e.target) {
    const t = e.target;
    if ((t.isPlayer ? t.alive : t.hp > 0) && inZone(t)) { e.stateT = Math.max(e.stateT, 3); return; }
    e.target = null; e.state = 'wander'; e.stateT = 0;
  }
  if (e.aggroT > 0 && e.lastAttacker && inZone(e.lastAttacker) && (!e.lastAttacker.isPlayer || e.lastAttacker.alive)) {
    e.state = 'chase'; e.target = e.lastAttacker; e.stateT = 4; return;
  }
  if (huntsPlayer(p) && inZone(p) && dist(e.x, e.y, p.x, p.y) < d.detect) {
    e.state = 'chase'; e.target = p; e.stateT = 4; return;
  }
  for (const o of G.npcs) {
    if (o === e || o.hp <= 0 || DINO[o.species].fish || o.species === 'garami') continue;
    if (inZone(o) && dist(e.x, e.y, o.x, o.y) < d.detect) { e.state = 'chase'; e.target = o; e.stateT = 4; return; }
  }
  // patrol the strait: slow passes through its own deep water
  if (e.stateT > 0) return;
  // an open-sea roamer's patrol drifts: every so often it moves its whole
  // beat a few hundred paces on, always staying in swimmer's depth
  if (e.roam && rnd() < 0.35) {
    for (let k = 0; k < 10; k++) {
      const a = rnd() * TAU, rr = rrange(250, 520);
      const hx = e.home.x + Math.cos(a) * rr, hy = e.home.y + Math.sin(a) * rr;
      if (hx < 200 || hy < 200 || hx > WORLD_W - 200 || hy > WORLD_H - 200) continue;
      if (terAtPx(hx, hy) === T_SWIM) { e.home = { x: hx, y: hy }; break; }
    }
  }
  for (let k = 0; k < 12; k++) {
    const a = rnd() * TAU, rr = rrange(40, d.homeR * 0.75);
    const tx = e.home.x + Math.cos(a) * rr, ty = e.home.y + Math.sin(a) * rr;
    if (isDeepPx(tx, ty)) { e.tx = tx; e.ty = ty; break; }
  }
  e.target = null;
  e.state = rnd() < 0.25 ? 'idle' : 'wander';
  e.stateT = rrange(2, 4.5);
}

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
      if (d.landBound && isWaterPx(tx, ty)) continue;
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
  if (ns && (ns.stage === 'eggs' || ns.stage === 'babies' || ns.stage === 'walk')) {
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
  // THE GREAT WALK: the mate walks beside you, wherever you lead
  if (ns && ns.stage === 'walk' && G.player && G.player.alive) {
    if (dist(e.x, e.y, G.player.x, G.player.y) > 90) { e.state = 'follow'; e.target = G.player; e.stateT = 2; return; }
    defaultWander(e, false); return;
  }
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
  if (ns && ns.stage === 'walk') { thinkYoungWalk(e, d); return; }
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
    e.thrash = lerp(e.thrash || 0, 0, 0.05);   // dazed kicking, slowly calming
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
  // in a snatcher's grip, or dropped from it: no thinking until it lands
  if (npcHeldOrFalling(e, dt)) return;
  // knockback decay
  e.x += e.vx * dt; e.y += e.vy * dt;
  e.vx *= Math.pow(0.02, dt); e.vy *= Math.pow(0.02, dt);

  // a reared-up browser eases back onto all fours the moment it's disturbed
  if (e.state !== 'browse' && e.state !== 'stomp' && e.rear) {
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
    const committed = (e.state === 'windup' || e.state === 'lunge' || e.state === 'recover' || e.state === 'flee' || e.state === 'stomp' || e.state === 'migrate') && e.stateT > 0;
    // a recruited packmate of ANY pack species runs with its alpha; mates and
    // babies keep their own brains (they handle packAlpha themselves)
    // the Great Walk's cast keep their own brains: the cutscene's walkers and
    // watchers, the rival on the family's trail, and a settled bloodline
    const think = e.cineTo ? thinkCineWalk : e.cineHold ? thinkCineHold : e.walkRival ? thinkWalkRival
      : e.bloodline ? thinkBloodline : e.isMate ? thinkMate : e.isBaby ? thinkBaby : e.packAlpha ? thinkPackFollower : NPC_THINK[e.species];
    if (e.packAlpha && stompDodge(e)) { /* out from under the giant first */ }
    else if (!committed) think(e, d);
    // the quarry took to the air: a grounded hunter can only watch it go
    if (e.target && outOfReachAbove(e, e.target) && !e.feud &&
        ['chase', 'windup', 'lunge', 'recover', 'stalk', 'strike', 'fight', 'avoid'].includes(e.state)) {
      e.state = 'idle'; e.stateT = 1.5; e.target = null;
    }
  }
  // a FEUD has one ending: whoever defied the claim hunts the claimant to
  // the death — no fatigue, no fear, no giving up, no going home
  if (e.feud) {
    const pcf = G.player;
    if (!pcf || !pcf.alive) e.feud = false;
    else {
      if (!['chase', 'windup', 'lunge', 'recover', 'stalk', 'strike', 'gripping', 'fight'].includes(e.state)) {
        e.state = 'chase'; e.target = pcf; e.stateT = 2;
      }
      e.pursuitT = 0; e.tiredT = 0;
    }
  }

  // broken bones cripple: a cracked thigh (or body) means no more running,
  // and a cracked tail (or body) sends it veering the wrong way at random
  let sp = d.speed * (e.spMul || 1);   // (the Cradle's young are quick for their size)
  if (d.stomp) e.stompCd = Math.max(0, (e.stompCd || 0) - dt);
  if (e.bones) {
    if (e.bones.leg || e.bones.body) sp *= 0.45;
    if ((e.bones.tail || e.bones.body) && Math.random() < dt * 0.6) e.wrongT = rrange(0.4, 0.9);
  }
  if (e.wrongT > 0) e.wrongT -= dt;
  // stamina (see npcBurn): the run states below spend it, and a winded
  // animal can only labour along
  if (e.stamMax == null) e.stamMax = e.stam = npcStamMax(d);
  e.burnt = false;
  if (e.winded) sp *= NPC_WINDED_MUL;
  e.spookT = Math.max(0, (e.spookT || 0) - dt);
  // ---- animation blends (consumed by drawDino): the run gait for the fast
  // states, the drink/graze/feed performances for the calm ones. actT is
  // each animal's own performance clock — spawn times desync the herd.
  e.actT = (e.actT || 0) + dt;
  const fastState = e.state === 'chase' || e.state === 'flee' || e.state === 'cover' || e.state === 'stoop' || e.state === 'rally' || e.state === 'lunge' || e.state === 'strike';
  e.run = lerp(e.run || 0, fastState ? 1 : 0, 0.1);
  e.drink = lerp(e.drink || 0, e.state === 'drink' ? 1 : 0, 0.12);
  e.chew = lerp(e.chew || 0, e.state === 'graze' ? 1 : 0, 0.1);
  if (e.state !== 'scavenge') e.tear = lerp(e.tear || 0, 0, 0.15);
  e.thrash = lerp(e.thrash || 0, 0, 0.1);
  switch (e.state) {
    case 'idle': idleDrift(e, dt); e.headDown = lerp(e.headDown, 0, 0.1); break;
    // the chew performance owns the neck now — headDown would double-dip it
    case 'graze': idleDrift(e, dt); e.headDown = lerp(e.headDown, 0, 0.1); break;
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
    case 'migrate': {
      // across a small waterway to its own kind (see isleMigration). Hurt on
      // the way, it gives up the crossing and fends for itself
      e.headDown = lerp(e.headDown, 0, 0.1);
      const m = e.migr;
      if (!m || e.hurtT > 0 || e.stateT <= 0) { e.migr = null; e.state = 'idle'; e.stateT = 0.3; break; }
      const w = m.pts[m.i];
      if (stepToward(e, w.x, w.y, sp * 0.55, dt) || dist(e.x, e.y, w.x, w.y) < 14) {
        if (++m.i >= m.pts.length) {
          // arrived: this is its island now
          e.isle = m.to; e.home = { x: e.x, y: e.y };
          e.migr = null; e.state = 'idle'; e.stateT = rrange(1, 3);
        }
      }
      break;
    }
    case 'goDrink': {
      e.headDown = lerp(e.headDown, 0, 0.1);
      if (stepToward(e, e.tx, e.ty, sp * 0.5, dt) || e.stateT <= 0) { e.state = 'drink'; e.stateT = rrange(5, 9); }
      break;
    }
    case 'drink': {
      idleDrift(e, dt);
      e.headDown = lerp(e.headDown, 0, 0.1);   // the lap performance dips it
      if (e.stateT <= 0) { e.state = 'idle'; e.stateT = 1; }
      break;
    }
    case 'rally': {
      e.headDown = 0;
      if (!e.target || e.target.hp <= 0) { e.state = 'idle'; e.stateT = 0.5; break; }
      stepToward(e, e.target.x, e.target.y, sp, dt);
      npcBurn(e, d, dt);
      // gathered — but the pack only commits if its summed power says so
      // (checked at think cadence, not every frame: confident scans the map)
      e.rallyEvalT = (e.rallyEvalT || 0) - dt;
      if (e.rallyEvalT <= 0) {
        e.rallyEvalT = 0.25;
        const mates = packmates(e, 130);
        if (mates.length >= 2 && G.player && G.player.alive && confident(e, G.player)) {
          e.state = 'chase'; e.target = G.player; e.stateT = 5;
          // rouse the pack
          for (const m of mates) { m.state = 'chase'; m.target = G.player; m.stateT = 5; }
        }
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
        const a = awayDir(e, t);
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
      // the pursuit leash — stretched to the whole scent pool when the prey
      // is a lingering player (move, and the pool collapses back to normal)
      const leash = Math.max(d.detect * 2.2, t.isPlayer ? scentRange(t) : 0);
      if (dd > leash) { e.state = 'return'; e.target = null; e.stateT = 6; break; }
      // a prey that keeps its legs going outlasts the hunter's patience
      // …and so does an empty tank: a winded hunter breaks off and walks home
      if ((d.patience && e.pursuitT > d.patience) || (e.winded && !e.feud)) {
        e.state = 'return'; e.target = null; e.stateT = 6; e.tiredT = 7; e.pursuitT = 0;
        break;
      }
      // chargers (chargeR) launch from way out; everyone else works up close
      const strikeR = d.chargeR || (d.reach + (t.isPlayer ? 8 + 10 * t.growth : bodyRadius(t)) + 14);
      if (dd > strikeR) {
        stepToward(e, t.x, t.y, sp, dt);
        npcBurn(e, d, dt);   // the run costs breath; circling at the jaws doesn't
      } else {
        // in striking distance: circle the prey, wait for an opening, telegraph
        // (a giant is big enough for every jaw at once)
        const vsGiant = (NPC_DEF[t.species] || {}).giant;
        const packBusy = !vsGiant && G.npcs.some(o => o !== e && o.species === e.species &&
          (o.state === 'windup' || o.state === 'lunge') && dist(o.x, o.y, e.x, e.y) < 220);
        if (e.atkCd <= 0 && !packBusy) {
          e.state = 'windup';
          // the tell is the pounce prep: proportional to the dino's size
          // (chargers never telegraph shorter than their old 0.45; your own
          // pack, working a giant that never sidesteps, barely crouches)
          e.stateT = Math.max(d.chargeR ? 0.45 : 0, pouncePrep(e.species, e.growth)) * (vsGiant && e.packAlpha ? 0.5 : 1);
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
      npcBurn(e, d, dt);
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
        // your pack works a giant in relays: no backing far off between bites
        const relay = e.packAlpha && t && (NPC_DEF[t.species] || {}).giant;
        e.atkCd = d.atkCd + (relay ? 0 : rrange(0.4, 1.1));
        e.state = 'recover';
        e.stateT = relay ? rrange(0.3, 0.45) : rrange(0.7, 1.2);
        e.recA = t ? awayDir(e, t) + rrange(-0.7, 0.7) : e.heading + Math.PI;
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
      if (d.giant) { giantFight(e, d, t, dt, sp); break; }
      if (e.species === 'aegisu') { guardianFight(e, d, t, dt, sp); break; }
      const dd = dist(e.x, e.y, t.x, t.y);
      const effReach = d.reach + (t.isPlayer ? 8 + 10 * t.growth : bodyRadius(t));
      const inRange = dd <= effReach * 0.85;
      // tail-fighters swing what's behind them: in range they turn their back
      // (thagomizer toward you!), everyone else squares up face-first.
      // Mid-whip the stance is committed — no spinning around while the tail
      // is still in the air, even if the knockback threw the target out of range
      const toward = t.x > e.x ? 1 : -1;
      // a three-weapon animal (kundurosaurus) changes its STANCE every few
      // seconds: back turned for the tail, or squared up to butt and kick
      if (d.kick || d.ram) {
        e.stanceT = (e.stanceT || 0) - dt;
        if (e.stanceT <= 0) { e.stance = rnd() < 0.5 ? 'face' : 'tail'; e.stanceT = rrange(2.5, 4.5); }
      }
      const committed = e.attackT > 0.15 && (DINO[e.species].tailWeapon || d.kick || d.ram);
      const backOn = DINO[e.species].tailWeapon && inRange && e.stance !== 'face';
      if (!committed) faceToward(e, backOn ? -toward : toward);
      if (!inRange) stepToward(e, t.x, t.y, sp * 0.9, dt);
      else idleDrift(e, dt);
      // don't stray too far from home (the tanks barely pursue)
      if (d.tank && dist(e.x, e.y, e.home.x, e.home.y) > d.homeR + 80) { e.state = 'return'; e.stateT = 6; break; }
      if (e.stance !== 'face' || !DINO[e.species].tailWeapon) { e.atkKind = DINO[e.species].tailWeapon ? 'tail' : null; tryMelee(e, t, d, d.melee || { kb: 150 }); }
      // the head-butt: face-side contact with the skull, on its own clock
      if (d.ram && e.stance === 'face') {
        e.ramCd = Math.max(0, (e.ramCd || 0) - dt);
        if (e.ramCd <= 0 && e.attackT <= 0.15) {
          const rp = jawContact(e, t);
          if (rp) {
            e.ramCd = d.ram.cd; e.attackT = 1; e.atkKind = 'ram';
            dealDamage(t, d.ram.dmg * rrange(0.85, 1.15), e, { kb: d.ram.kb || 300, hitX: rp.x, hitY: rp.y });
            SFX.hit && SFX.hit();
          }
        }
      }
      // the KICK: rears and throws both hind feet — the hardest hit it has,
      // and a hoof that lands on a limb can break it
      if (d.kick && e.stance === 'face') {
        e.kickCd = Math.max(0, (e.kickCd || 0) - dt);
        if (e.kickCd <= 0 && e.attackT <= 0.15) {
          const kc = kickCircle(e);
          const kp = bodyHitPoint(t, kc.x, kc.y, kc.r);
          if (kp && (kp.x - e.x) * (e.facing || 1) > -2) {
            e.kickCd = d.kick.cd; e.attackT = 1; e.atkKind = 'kick';
            const kd = d.kick.dmg * rrange(0.85, 1.15);
            dealDamage(t, kd, e, { kb: d.kick.kb || 400, hitX: kp.x, hitY: kp.y });
            G.shake = Math.min(7, (G.shake || 0) + 2);
            if (d.kick.bone) {
              if (t.isPlayer) playerBoneBreak(t, kd);
              else tryBoneBreak(e, t, kp.part === 'head' ? 'leg' : kp.part, kd);
            }
          }
        }
      }
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
    case 'stomp': {
      // THE STOMP (yunmenglong): up onto the hind legs — slowly, that's the
      // warning — then the whole front end comes down where it was aimed
      idleDrift(e, dt);
      e.headDown = lerp(e.headDown, 0, 0.15);
      if (e.stompPhase === 'up') {
        e.stompT += dt;
        e.rear = clamp(e.stompT / e.stompWind, 0, 1);
        e.headUp = lerp(e.headUp || 0, 1, 0.08);
        if (e.stompT >= e.stompWind) giantSlam(e, d);
      } else {
        // planted, settling: the window to get back in
        e.rear = lerp(e.rear || 0, 0, 0.3);
        e.headUp = lerp(e.headUp || 0, 0, 0.2);
        if (e.stateT <= 0) { e.state = 'fight'; e.stateT = 1.5; }
      }
      break;
    }
    case 'cover': {
      // a dash for the nearest stand of trees, away from the sky
      e.headDown = 0;
      if (treeCover(e.x, e.y)) { e.state = 'hide'; e.stateT = 2.5; break; }
      stepToward(e, e.tx, e.ty, sp * (d.fleeSpeed ? d.fleeSpeed / d.speed : 1.3), dt);
      if (e.stateT <= 0) { e.state = 'idle'; e.stateT = 0.3; }
      break;
    }
    case 'seaFeed': {
      // a Kaiwhekea eating from the water's edge (it never leaves the water)
      const c = e.carc;
      if (!c || c.meat <= 0 || G.carcasses.indexOf(c) < 0 || e.stateT <= 0) { e.state = 'idle'; e.stateT = 1; e.carc = null; break; }
      const dd = dist(e.x, e.y, c.x, c.y);
      if (dd > 30) stepToward(e, c.x, c.y, sp * 0.6, dt);
      if (dd < 64) {
        e.tear = lerp(e.tear || 0, 1, 0.2);
        c.meat -= dt * 6;
        e.fedUntil = G.time + rrange(60, 120);
      }
      break;
    }
    case 'swimHome': {
      // back to its own island (a straggler, a chase gone out to sea)
      const h = e.home;
      if (!h) { e.state = 'idle'; e.stateT = 1; break; }
      stepToward(e, h.x, h.y, sp, dt);
      const ok = !isWaterPx(e.x, e.y) && (!e.isle || isleKeyAtPx(e.x, e.y) === e.isle);
      if (ok || dist(e.x, e.y, h.x, h.y) < 60) { e.state = 'idle'; e.stateT = 1; }
      else if (e.stateT <= 1) e.stateT = 20;
      break;
    }
    case 'hide': {
      // in among the trunks, keeping very still
      e.move = lerp(e.move, 0, 0.2);
      e.headDown = lerp(e.headDown, 0, 0.1);
      if (e.stateT <= 0) { e.state = 'idle'; e.stateT = 0.3; }
      break;
    }
    case 'stoop': {
      // the wild Hatzegopteryx comes in low over its quarry
      const t = e.target;
      if (!hatzQuarryOk(e, t) || e.stateT <= 0) { e.state = 'idle'; e.stateT = 0.5; e.target = null; e.nextHunt = G.time + rrange(6, 14); break; }
      e.headDown = 0;
      stepToward(e, t.x, t.y, sp * 1.0, dt);
      if ((e.alt || 0) < 45 && dist(e.x, e.y, t.x, t.y) < bodyRadius(e) + bodyRadius(t) + 26) hatzSnatch(e, t);
      break;
    }
    case 'haul': {
      // a body taken home in the feet
      const c = e.haul;
      if (!c || G.carcasses.indexOf(c) < 0) { e.haul = null; e.state = 'idle'; e.stateT = 0.5; break; }
      stepToward(e, e.tx, e.ty, sp * 0.7, dt);
      const pt = e.feetPt;
      if (pt && G.time - pt.t < 0.5 && pt.air === isAirborne(e)) { c.x = pt.x; c.y = e.y - 1; c.liftY = Math.max(0, pt.h - 4); }
      else { c.x = e.x; c.y = e.y - 1; c.liftY = e.alt || 0; }
      const p = G.player;
      if (dist(e.x, e.y, e.tx, e.ty) < 80 || !p || dist(e.x, e.y, p.x, p.y) > 1100) {
        const i = G.carcasses.indexOf(c); if (i >= 0) G.carcasses.splice(i, 1);
        e.haul = null; hatzLeave(e);
      }
      break;
    }
    case 'carry':
    case 'landEat': {
      const s = e.snatch, q = s && s.e;
      if (!q || (q.isPlayer ? !q.alive || !q.skyHeld : q.hp <= 0 || G.npcs.indexOf(q) < 0)) {
        if (q && !q.isPlayer) q.swallowK = 0;
        e.snatch = null; e.swallowK = 0; e.gulp = false;
        e.state = 'idle'; e.stateT = 0.5; e.hungry = true; e.dropAt = G.time; e.landed = false;
        break;
      }
      // it bites what it holds as it goes — never quite to death: it takes
      // its catch away whole, dead or alive
      e.biteT = (e.biteT || 1.2) - dt;
      if (e.biteT <= 0) {
        e.biteT = 1.5; e.attackT = 1;
        const amt = Math.min(d.dmg * 0.4, q.hp - 1);
        if (amt > 0) dealDamage(q, amt, e, { force: true, kb: 0, hitX: q.x, hitY: q.y - (q.alt || 0) - 10 });
      }
      e.carryT = (e.carryT || 0) + dt;
      if (e.state === 'carry') {
        stepToward(e, e.tx, e.ty, sp * 0.7, dt);
        holdPrey(e, s);
        if (s.mode === 'jaws') {
          // small enough to swallow: down onto open dry ground close by
          if (e.stateT <= 0 && !isWaterPx(e.x, e.y) && !treeCover(e.x, e.y)) { e.state = 'landEat'; e.stateT = 8; e.gulpT = 0; }
          else if (e.stateT < -5) { e.stateT = 0.5; e.tx = e.x + rrange(-160, 160); e.ty = e.y + rrange(-160, 160); }
        } else {
          // a feet-load is TAKEN AWAY, out over the sea to its own island
          const p = G.player;
          const gone = q.isPlayer ? e.carryT > 12 : dist(e.x, e.y, e.tx, e.ty) < 80 || !p || dist(e.x, e.y, p.x, p.y) > 1100;
          if (gone) hatzTakeAway(e, q, 'carried off by a Hatzegopteryx');
        }
      } else {
        e.move = lerp(e.move, 0, 0.2);
        holdPrey(e, s);
        if ((e.alt || 0) < 1) {
          // THE SWALLOW: the head thrown back, the catch worked down the bill
          e.gulpT = (e.gulpT || 0) + dt;
          const k = clamp((e.gulpT - 0.4) / 2.2, 0, 1);
          e.swallowK = k; e.gulp = k > 0;
          q.swallowK = k;
          const j = e.jawPt;
          q.swallowAt = j && G.time - j.t < 0.5 ? { x: j.x, y: e.y - j.h } : { x: q.x, y: q.y - (q.alt || 0) };
          if (k >= 1) { hatzTakeAway(e, q, 'swallowed whole by a Hatzegopteryx', true); break; }
        }
        if (e.stateT <= 0) { q.swallowK = 0; e.swallowK = 0; e.gulp = false; hatzLetGo(e); }
      }
      break;
    }
    case 'flee': {
      e.headDown = 0;
      const t = e.target;
      if (!t || e.stateT <= 0) { e.state = 'idle'; e.stateT = 1; break; }
      let a = awayDir(e, t);
      // the AGILE (Utoriana's homalocephale): never a straight bolt — it
      // runs rings round a big hunter, cutting sideways across its nose and
      // flipping direction at the last moment, so the big jaws keep closing
      // on the place it just was
      if (e.agile) {
        const dd = dist(e.x, e.y, t.x, t.y);
        e.jinkT = (e.jinkT || 0) - dt;
        if (e.jinkT <= 0) { e.orbitDir = -e.orbitDir; e.jinkT = dd < 90 ? rrange(0.35, 0.7) : rrange(0.9, 1.8); }
        // a wide arc while the hunter is still coming; a hard cut across
        // its nose once the jaws are close
        a = angTo(t.x, t.y, e.x, e.y) + e.orbitDir * (dd < 90 ? 1.3 : 0.5);
        // …and it knows its island: it never lets itself be pinned against
        // the sea — it swings along the shore instead of into the shallows
        for (const off of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8, 2.4, -2.4]) {
          const b = a + off * e.orbitDir;
          if (!isWaterPx(e.x + Math.cos(b) * 70, e.y + Math.sin(b) * 70)) { a = b; break; }
        }
        // already splashing? straight back onto dry ground, whichever way
        // is closest that isn't into the jaws
        if (isWaterPx(e.x, e.y)) {
          const away = awayDir(e, t);
          let best = null, bs = -1e9;
          for (let k = 0; k < 16; k++) {
            const b = k / 16 * Math.PI * 2;
            for (let r = 30; r <= 150; r += 30) {
              if (!isWaterPx(e.x + Math.cos(b) * r, e.y + Math.sin(b) * r)) {
                const s = -r + 40 * Math.cos(b - away);
                if (s > bs) { bs = s; best = b; }
                break;
              }
            }
          }
          if (best != null) a = best;
        }
      }
      // the land-bound never bolt into the sea: they swing along the shore
      // instead, and scramble straight out if they're already wet
      // (cornered on a speck of an island, it holds at the waterline rather than wade in)
      let cornered = false;
      if (d.landBound) {
        if (isWaterPx(e.x, e.y)) { const la = landDir(e.x, e.y); if (la != null) a = la; }
        else {
          cornered = true;
          for (const off of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2.1, -2.1, 2.8, -2.8]) {
            const b = a + off;
            if (!isWaterPx(e.x + Math.cos(b) * 40, e.y + Math.sin(b) * 40)) { a = b; cornered = false; break; }
          }
        }
      }
      if (cornered) { idleDrift(e, dt); npcBurn(e, d, dt); break; }
      // a broken thigh can't even flee at speed — the cripple cap holds (and
      // so does an empty tank); prey that heard a crouched hunter call bolts
      const fsp = (d.fleeSpeed || d.speed) * (sp / d.speed) * (e.spookT > 0 ? SPOOK_MUL : 1) * (e.agile ? (dist(e.x, e.y, t.x, t.y) < 120 && e.stam > 10 ? 1.2 : 1.06) : 1);   // agile: a last-metres burst
      stepToward(e, e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90, fsp, dt);
      npcBurn(e, d, dt);
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
      // a CLAIMED carcass is spoken for — but an animal that never heard the
      // bellow doesn't know that yet. It walks in like any scavenger, and
      // only close enough to SMELL the mark does it make the claim decision
      const pcl = G.player;
      if (c.claim && pcl && pcl.alive && !isFamily(e) && dd < CLAIM_SMELL_R) {
        answerClaim(e, c);
        break;
      }
      if (dd > 26) { e.headDown = lerp(e.headDown, 0, 0.1); stepToward(e, c.x, c.y, sp * 0.6, dt); }
      else {
        idleDrift(e, dt);
        e.tear = lerp(e.tear || 0, 1, 0.2);      // the bury-saw-wrench feed
        e.headDown = lerp(e.headDown, 0, 0.15);
        c.meat -= dt * 6;
        // spooked off the carcass by a player that outpowers it
        const p = G.player;
        if (p && p.alive && dist(e.x, e.y, p.x, p.y) < 60 && powerOf(p) > powerOf(e)) { e.state = 'flee'; e.target = p; e.stateT = 2; }
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
        if (t.isPlayer && t.alive && !t.grabbed && !isAirborne(t)) {
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
  // no run this frame: get the wind back (faster standing about)
  if (!e.burnt) {
    const calm = e.state === 'idle' || e.state === 'graze' || e.state === 'drink' || e.state === 'browse';
    e.stam = Math.min(e.stamMax, e.stam + NPC_STAM_REGEN * (calm ? 1.5 : 1) * dt);
    if (e.winded && e.stam >= e.stamMax * NPC_WIND_BACK) e.winded = false;
  }

  if (DINO[e.species].flyer) npcFlight(e, dt);   // the flyers pick their height
  // ease heading pitch in while moving, out while standing
  e.pitch = lerp(e.pitch || 0, e.move > 0.25 ? (e.pitchT || 0) : 0, Math.min(1, dt * 6));

  if (d.trample) giantTrample(e, d, dt);
  const eRad = bodyRadius(e);
  // the giant straddles the scrub: only its feet need clear ground (and the
  // guardian, low and heavy, ploughs through the Cradle's cycad fronds)
  collideStatics(e, d.giant ? eRad * 0.45 : e.species === 'aegisu' ? eRad * 0.5 : eRad);
  // a wild Hatzegopteryx can't walk in under the trees (you can)
  if (d.noCover && !isAirborne(e) && treeCover(e.x, e.y) && !treeCover(wx0, wy0)) { e.x = wx0; e.y = wy0; }
  // gentle separation between npcs
  for (const o of G.npcs) {
    if (o === e || isAirborne(o) !== isAirborne(e)) continue;   // (a flyer passes over the herd)
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
  if (pl && pl.alive && isAirborne(pl) === isAirborne(e) && e.state !== 'lunge' && e.state !== 'strike' && e.state !== 'gripping') {
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
  // (deepOnly: the ichthyosaur cannot even enter the shallows)
  if (d.aquatic && !d.amphibious && !e.landHunt && (d.deepOnly ? !isDeepPx(e.x, e.y) : !isWaterPx(e.x, e.y))) {
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
    { sp: 'guanlong', pack: 3, sizes: [2, 3, 2], min: 5 },
    { sp: 'moros', n: 3, min: 3 },
    { sp: 'ornitho', n: 6, min: 5 },
    { sp: 'scelido', n: 4, min: 4, away: true },
    { sp: 'huayango', n: 2, min: 2, away: true },
    { sp: 'lophos', pack: 2, sizes: [2, 3, 1], min: 4 },   // small loose packs — sometimes a duo, a trio, or a lone hunter
  ],
  prairie: [
    { sp: 'troodon', pack: 3, sizes: [2, 3, 2], min: 5 },
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
    { sp: 'hesper', pack: 2, sizes: [2, 3], min: 3 },
    { sp: 'concav', n: 3, min: 3, away: true },
    { sp: 'charono', n: 2, min: 2, away: true },
    { sp: 'lepisosteus', n: 8, min: 7 },
    { sp: 'bassb', n: 5, min: 4 },
    { sp: 'herrie', n: 2, min: 2 },
    { sp: 'scutelich', n: 4, min: 3 },
  ],
  ash: [
    { sp: 'tarbo', n: 2, min: 2, away: true },
    { sp: 'linhe', pack: 2, sizes: [2, 3], min: 3 },
    { sp: 'achillo', pack: 1, sizes: [2], min: 2 },
    { sp: 'nothro', n: 2, min: 2, away: true },
    { sp: 'vulcano', n: 2, min: 2, away: true },
    { sp: 'preno', n: 2, min: 2 },
    { sp: 'shanag', n: 6, min: 4 },
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
    { sp: 'dakota', pack: 4, sizes: [2, 3, 2], min: 7 },
    // wild aardiraptor packs: kin to an aardiraptor player, recruits-in-waiting
    { sp: 'aardi', pack: 3, sizes: [2, 3, 2], min: 5 },
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
    { sp: 'pectino', pack: 3, sizes: [2, 3, 2], min: 5 },
    { sp: 'korean', n: 8, min: 5 },
    { sp: 'nanuq', n: 2, min: 2, away: true },
    { sp: 'titanov', n: 1, min: 1, away: true },
  ],
  // the Reach is CROWDED — land everywhere means room for everything
  jungle: [
    { sp: 'talenk', pack: 3, sizes: [3, 4, 2, 3], den: 'plains', min: 8 },
    { sp: 'macrog', pack: 2, sizes: [2, 3], den: 'plains', min: 4 },
    { sp: 'kunduro', pack: 5, sizes: [4, 3, 5, 3, 4], den: 'plains', min: 14 },   // the Reach's commonest big animal — herds everywhere
    { sp: 'bonita', n: 2, min: 2, away: true },
    { sp: 'overo', n: 3, min: 3, away: true },
    { sp: 'skorpio', n: 3, min: 3, away: true },
    { sp: 'masiak', pack: 3, sizes: [2, 3, 2], min: 5 },
    { sp: 'arari', n: 5, min: 4 },
    // the channels run thick with fish — a buitreraptor's whole living
    { sp: 'lepisosteus', n: 12, min: 10 },
    { sp: 'bassb', n: 7, min: 6 },
  ],
  desert: [
    // a big map, and a busy one: the packs range the sand, the herds cross
    // it between waterholes, the belt holds the little things
    // the raptors hold quarters: shri the north-west sand, kuru the north-east,
    // tsaagan the south-west, adasaurus the south-east, luanchuan the northern
    // belt, mahakala the southern belt — rivals meet where the quarters touch
    // (the desert is vast and EMPTY — the dad's call: far fewer animals than
    // the Reach, so finding anything out on the sand is an event)
    { sp: 'shri', pack: 2, sizes: [3, 4], min: 5, zone: [0.02, 0.02, 0.42, 0.48] },
    { sp: 'kuru', pack: 2, sizes: [3, 3], min: 4, zone: [0.58, 0.02, 0.98, 0.48] },
    { sp: 'tsaagan', pack: 2, sizes: [3, 3], min: 4, zone: [0.02, 0.52, 0.42, 0.98] },
    { sp: 'adasaurus', pack: 2, sizes: [3, 3], min: 4, zone: [0.58, 0.52, 0.98, 0.98] },
    { sp: 'luanchuan', pack: 2, sizes: [3, 3], min: 4, zone: [0.3, 0.02, 0.7, 0.45] },
    { sp: 'mahakala', pack: 2, sizes: [4, 3], min: 5, zone: [0.3, 0.55, 0.7, 0.98] },
    { sp: 'procomp', pack: 2, sizes: [3, 4], min: 5, zone: [0.3, 0.3, 0.7, 0.8] },
    { sp: 'homalo', pack: 2, sizes: [3, 2], min: 4, zone: [0.3, 0.2, 0.7, 0.7] },
    // the hadrosaurs: the belt and the waterholes
    { sp: 'willina', pack: 1, sizes: [3], min: 2, zone: [0.3, 0.1, 0.7, 0.9] },
    { sp: 'bonaparte', pack: 1, sizes: [2, 3], min: 2, zone: [0.3, 0.1, 0.7, 0.9] },
    { sp: 'huallas', pack: 1, sizes: [3], min: 2, zone: [0.3, 0.1, 0.7, 0.9] },
    { sp: 'kelumapu', pack: 1, sizes: [3], min: 2, zone: [0.3, 0.1, 0.7, 0.9] },
    { sp: 'gilmoreo', pack: 1, sizes: [3], min: 2, zone: [0.3, 0.1, 0.7, 0.9] },
    { sp: 'bactro', pack: 1, sizes: [3, 4], min: 2, zone: [0.3, 0.1, 0.7, 0.9] },
    { sp: 'plesio', pack: 2, sizes: [3, 4], den: 'plains', min: 5 },
    // the two land theropods, and the river's own
    { sp: 'deltadro', n: 2, min: 2, away: true },
    { sp: 'eocarch', n: 1, min: 1, away: true },
    { sp: 'aero', pack: 2, sizes: [2, 3], den: 'plains', min: 3 },   // pairs and trios, never more
    { sp: 'suchos', n: 2, min: 2 },
    { sp: 'megoro', n: 2, min: 2, biome: 'water' },
    { sp: 'garudi', pack: 2, sizes: [3, 4], den: 'plains', min: 4 },
    { sp: 'harpy', pack: 1, sizes: [4], den: 'plains', min: 3 },
    { sp: 'sinorni', pack: 2, sizes: [5, 6], den: 'plains', min: 7 },
    { sp: 'kinnaree', pack: 1, sizes: [4], den: 'plains', min: 3 },
    { sp: 'beishan', pack: 1, sizes: [2, 3], den: 'plains', min: 2 },
    { sp: 'aepyorni', pack: 2, sizes: [4, 5], den: 'plains', min: 6 },
    { sp: 'epidex', n: 10, min: 8 },
    { sp: 'lepisosteus', n: 8, min: 6 },
  ],
  moor: [
    { sp: 'gracili', pack: 3, sizes: [2, 3, 2], min: 5 },
    { sp: 'telmato', pack: 3, sizes: [3, 4, 2], den: 'plains', min: 7 },
    { sp: 'tanius', pack: 2, sizes: [2, 3], den: 'plains', min: 4 },
    { sp: 'secerno', pack: 2, sizes: [2, 3, 1], den: 'plains', min: 4 },
    { sp: 'spiclypeus', n: 3, min: 3, away: true },
    { sp: 'mercuri', n: 3, min: 2, away: true },
    { sp: 'coahuila', n: 2, min: 2, away: true },
    { sp: 'bravo', n: 2, min: 2, away: true },
    { sp: 'duria', n: 2, min: 2 },
    { sp: 'drypto', n: 2, min: 2, away: true },
  ],
  // THE LESSER ARCHIPELAGO: every island keeps its own animals (`isle`
  // pins a spec to one island — its floor is counted per island too).
  // Zalmoxes live on all of them but Utoriana; every fish in the game
  // swims the open sea between
  archi: [
    { sp: 'homalo', isle: 'utoriana', n: 4, min: 3, agile: true, dwarf: 0.38 },   // a few island dwarfs, and too quick for a grown abelisaur
    { sp: 'telmato', isle: 'narapa', pack: 2, sizes: [3, 4], min: 5 },
    { sp: 'fylax', isle: 'narapa', pack: 2, sizes: [3, 4], min: 5 },
    { sp: 'zalmox', isle: 'narapa', n: 4, min: 3 },
    { sp: 'chenani', isle: 'narapa', n: 2, min: 1 },   // Narapa's own abelisaurs, hunting the herds
    // every other island: Zalmoxes for now (more of the islands' own animals
    // to come)
    { sp: 'zalmox', isle: 'velinra', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'ossamere', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'kalimbra', n: 6, min: 4 },
    { sp: 'zalmox', isle: 'takurei', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'merovia', n: 4, min: 3 },
    { sp: 'zalmox', isle: 'ishandra', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'pell', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'zuranoa', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'orrotha', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'halune', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'sivanna', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'brekka', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'nimoru', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'ekkalia', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'varossa', n: 3, min: 2 },
    // the outer reaches
    { sp: 'zalmox', isle: 'tavessa', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'quorran', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'ilmeth', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'saruun', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'pelagra', n: 4, min: 3 },
    { sp: 'zalmox', isle: 'ombrel', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'drevan', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'kesh', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'muradel', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'anzu', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'tollan', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'veyra', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'hesk', n: 4, min: 3 },
    { sp: 'zalmox', isle: 'brimmora', n: 3, min: 2 },
    { sp: 'zalmox', isle: 'orsk', n: 3, min: 2 },
    // the gulls: Pterodactylus flocks roost on a handful of islands and fly
    // the whole archipelago for carrion
    { sp: 'ptero', isle: 'brekka', n: 4, min: 3 },
    { sp: 'ptero', isle: 'orrotha', n: 3, min: 2 },
    { sp: 'ptero', isle: 'takurei', n: 3, min: 2 },
    { sp: 'ptero', isle: 'anzu', n: 3, min: 2 },
    { sp: 'ptero', isle: 'quorran', n: 3, min: 2 },
    { sp: 'ptero', isle: 'narapa', n: 3, min: 2 },
    // MAGYAROSAURUS: Taku Rei's dwarf titanosaurs, herds of every age (a few
    // herds hold out on Kalimbra and Halune)
    { sp: 'magyaro', isle: 'takurei', pack: 2, sizes: [5, 6], min: 7, ages: [1, 1, 0.85, 0.6, 0.35, 0.15] },
    { sp: 'magyaro', isle: 'kalimbra', pack: 1, sizes: [3, 4], min: 2, ages: [1, 0.7, 0.3, 0.15] },
    { sp: 'magyaro', isle: 'halune', pack: 1, sizes: [3], min: 2, ages: [1, 0.6, 0.2] },
    // TETHYSHADROS: the islands round Taku Rei
    { sp: 'tethys', isle: 'ekkalia', pack: 2, sizes: [4, 5], min: 6, ages: [1, 1, 0.8, 0.45, 0.2] },
    { sp: 'tethys', isle: 'varossa', pack: 1, sizes: [4, 5], min: 3, ages: [1, 1, 0.8, 0.45, 0.2] },
    { sp: 'tethys', isle: 'ilmeth', pack: 1, sizes: [4, 5], min: 3, ages: [1, 1, 0.8, 0.45, 0.2] },
    // IANI: Drevan's herds, and its neighbour Kesh's
    { sp: 'iani', isle: 'drevan', pack: 2, sizes: [4, 5], min: 6, ages: [1, 1, 0.75, 0.45, 0.2] },
    { sp: 'iani', isle: 'kesh', pack: 1, sizes: [3, 4], min: 3, ages: [1, 0.7, 0.35, 0.2] },
    // HYPSILOPHODON on Okiri: quick little prey at the water's edge for the
    // young Kaiwhekea
    { sp: 'hypsi', isle: 'okiri', n: 6, min: 4, ages: [1, 1, 0.6, 0.35, 0.2] },
    { sp: 'ptero', isle: 'okiri', n: 3, min: 2 },   // gulls that hunt them
    // HATZEGOPTERYX: three wild ones, roaming the whole archipelago
    { sp: 'hatzego', isle: 'saruun', n: 1, min: 1, away: true },
    { sp: 'hatzego', isle: 'brekka', n: 1, min: 1, away: true },
    { sp: 'hatzego', isle: 'quorran', n: 1, min: 1, away: true },
    // the sea (scaled to the bigger map)
    { sp: 'lepisosteus', n: 60, min: 45, biome: 'ocean' },
    { sp: 'bassb', n: 42, min: 32, biome: 'ocean' },
    { sp: 'scutelich', n: 42, min: 32, biome: 'ocean' },
    { sp: 'herrie', n: 12, min: 9, biome: 'ocean' },
    { sp: 'onchop', n: 9, min: 7, biome: 'ocean' },
    { sp: 'mawsonia', n: 8, min: 6, biome: 'ocean' },
    { sp: 'ichthyod', n: 20, min: 15, biome: 'ocean' },   // the sea's little barracudas
  ],
};
function spawnPosFor(sp, i, biomeOverride, isle) {
  const biome = biomeOverride || NPC_DEF[sp].biome;
  if (isle) return randIslePos(isle, biome === 'any' ? (i % 2 ? 'plains' : 'forest') : biome);
  if (biome === 'ocean') return randOceanPos();
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
// a spot 150-240 px from the species' own nest, if that nest is on this island
function homeHerdPos(species, isle) {
  const n = World.nests && World.nests[species], is = isleByKey(isle);
  if (!n || !is || World.isleMap[tIdx(Math.floor(n.x / TILE), Math.floor(n.y / TILE))] !== is.idx) return null;
  for (let k = 0; k < 60; k++) {
    const a = rnd() * Math.PI * 2, r = rrange(150, 240), x = n.x + Math.cos(a) * r, y = n.y + Math.sin(a) * r;
    if (World.isleMap[tIdx(Math.floor(x / TILE), Math.floor(y / TILE))] !== is.idx) continue;
    if (isWaterPx(x, y) || isMudPx(x, y) || isCliffPx(x, y)) continue;
    return { x, y };
  }
  return null;
}
function spawnPack(species, count, sizes, den, zone, isle, ages) {
  // hunter packs den near the mud pools; herds (den: 'plains') out on the grass;
  // a ZONE ([x0, y0, x1, y1] as map fractions) pins the pack to its own
  // quarter of the map — the desert raptors each hold their own ground
  for (let pk = 0; pk < count; pk++) {
    let cx, cy;
    if (isle) {
      // an island pack: dens anywhere on its own island — except the FIRST
      // herd of a species whose own nest is on this island, which dens in
      // sight of the nest (a hatchling should see its kind straight away)
      const pp = (pk === 0 && homeHerdPos(species, isle)) || randIslePos(isle, NPC_DEF[species].biome === 'forest' ? 'forest' : 'plains');
      cx = pp.x; cy = pp.y;
    } else if (zone) {
      let best = null;
      for (let k = 0; k < 60 && !best; k++) {
        const x = (zone[0] + rnd() * (zone[2] - zone[0])) * WORLD_W, y = (zone[1] + rnd() * (zone[3] - zone[1])) * WORLD_H;
        if (isWaterPx(x, y) || isMudPx(x, y) || isCliffPx(x, y) || nearAnyNest(x, y, 420) || inCradle(x, y, 200)) continue;
        const wantForest = (NPC_DEF[species].biome === 'forest');
        if (wantForest ? forestShadePx(x, y) > 0.35 : forestShadePx(x, y) < 0.3 || NPC_DEF[species].biome === 'any') best = { x, y };
      }
      if (!best) best = awayFromNests(randPlainsPos);
      cx = best.x; cy = best.y;
    } else if (den === 'plains' || !World.mudPools.length) {
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
      // (island packs get ids of their own: the same species packs on several isles)
      const pid = isle ? isleByKey(isle).idx * 10 + pk + 1 : pk + 1;
      const ne = makeNPC(species, clamp(gx, 30, WORLD_W - 30), clamp(gy, 30, WORLD_H - 30), pid);
      if (isle) ne.isle = isle;
      if (ages) ageNPC(ne, ages[i % ages.length]);   // a herd of every age
      G.npcs.push(ne);
    }
  }
}
function spawnInitialNPCs() {
  G.npcs.length = 0;
  for (const spec of ECO_SPAWNS[World.eco]) {
    if (spec.pack) { spawnPack(spec.sp, spec.pack, spec.sizes, spec.den, spec.zone, spec.isle, spec.ages); continue; }
    for (let i = 0; i < spec.n; i++) {
      const pos = spec.away ? awayFromNests(() => spawnPosFor(spec.sp, i, spec.biome, spec.isle)) : spawnPosFor(spec.sp, i, spec.biome, spec.isle);
      G.npcs.push(specNPC(spec, pos));
    }
  }
  G.guardianSeen = G.cradleFound = false;
  G.giantRespawnAt = G.guardianRespawnAt = G.elderAlertT = null;
  G.garaAt = []; G.roamAt = null;
  if (World.eco === 'desert') spawnDesertSpecials();
  if (World.eco === 'archi') spawnArchiSpecials();
  recordPackBases();   // the packs' ORIGINAL rosters anchor all pack scaling
  if (typeof spawnBloodlines === 'function') spawnBloodlines();   // families settled here by the Great Walk
}
// one loose animal from a spawn spec: island-born ones remember their
// island (population floors are kept per island), and the AGILE (Utoriana's
// homalocephale) carry a deeper tank to run their rings on
function specNPC(spec, pos) {
  const e = makeNPC(spec.sp, pos.x, pos.y);
  if (spec.isle) e.isle = spec.isle;
  if (spec.agile) { e.agile = true; e.stamMax = e.stam = AGILE_STAM; }
  if (spec.dwarf) { e.hp = e.maxhp = Math.round(e.maxhp * spec.dwarf); e.dmgMul = 0.22; e.growth = 0.8; }   // island dwarfs: smaller, softer, less meat
  if (spec.ages) ageNPC(e, spec.ages[Math.floor(rnd() * spec.ages.length)]);
  return e;
}
const AGILE_STAM = 320;   // vs the default 120: they simply outlast you
// ---------- the Lesser Archipelago's keepers (hand-placed, one per strait) ----------
// Garamirala holds every strait in World.straits. Kill one and the water
// stays empty for GARA_RESPAWN seconds — then another moves in (never
// while you're right there to watch it arrive)
const GARA_RESPAWN = 180;
function spawnGarami(k) {
  const s = World.straits[k];
  let pos = null;
  for (let r = 0; r < 600 && !pos; r += 40) {
    for (let j = 0; j < 10 && !pos; j++) {
      const a = (j / 10) * TAU, x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r;
      if (isDeepPx(x, y)) pos = { x, y };
    }
  }
  if (!pos) return null;
  const e = makeNPC('garami', pos.x, pos.y);
  e.home = { x: s.x, y: s.y };
  e.guard = !!s.guard;
  e.strait = k;
  G.npcs.push(e);
  return e;
}
// the open sea's own: a couple of Garamirala belong to no strait at all.
// They roam swimmer's depth far from any island, their patrol drifting
// slowly across the ocean (see thinkGarami) — anything crossing open water
// may meet one
const GARA_ROAMERS = 2;
function spawnGaramiRoamer() {
  const p = G.player;
  for (let k = 0; k < 200; k++) {
    const x = rrange(0.06, 0.94) * WORLD_W, y = rrange(0.06, 0.94) * WORLD_H;
    const i = tIdx(Math.floor(x / TILE), Math.floor(y / TILE));
    if (World.ter[i] !== T_SWIM || World.isleS[i] > -40) continue;   // well out, far from any coast
    if (p && dist(x, y, p.x, p.y) < 900) continue;
    const e = makeNPC('garami', x, y);
    e.home = { x, y };
    e.guard = false;
    e.roam = true;
    G.npcs.push(e);
    return e;
  }
  return null;
}
// ---------- KAIWHEKEA in the wild ----------
// Rare, but less rare than Garamirala: a few out in the open sea, more round
// Okiri, and a pair in Taku Rei's lagoon, with the lagoon's own fish (six
// gar, three bass) to live on. Easy-going: they eat fish, and only now and
// then come up out of the water at a youngster at the edge (on Okiri, the
// Hypsilophodon). Bite one, though, and it bites back
const KAI_ROAMERS = 3, KAI_OKIRI = 3, KAI_LAGOON = 2, LAGOON_FISH = { lepisosteus: 6, bassb: 3 };
const KAI_RESPAWN = 120;
function lagoonCentre() { const t = isleByKey('takurei'); return t ? { x: t.x, y: t.y } : null; }
function waterSpot(cx, cy, r0, r1, deep) {
  for (let k = 0; k < 120; k++) {
    const a = rnd() * TAU, r = rrange(r0, r1), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (x < 40 || y < 40 || x > WORLD_W - 40 || y > WORLD_H - 40) continue;
    if (deep ? isDeepPx(x, y) : isWaterPx(x, y)) return { x, y };
  }
  return null;
}
function spawnKaiwhe(kind) {
  const p = G.player;
  let pos = null, home = null, homeR = 450;
  for (let k = 0; k < 30 && !pos; k++) {
    let q = null;
    if (kind === 'lagoon') { const c = lagoonCentre(); if (!c) return null; q = waterSpot(c.x, c.y, 0, 380, true); home = c; homeR = 400; }
    else if (kind === 'okiri') { const o = isleByKey('okiri'); if (!o) return null; q = waterSpot(o.x, o.y, 300, 620, false); home = { x: o.x, y: o.y }; homeR = 650; }
    else {
      const x = rrange(0.06, 0.94) * WORLD_W, y = rrange(0.06, 0.94) * WORLD_H;
      const i = tIdx(Math.floor(x / TILE), Math.floor(y / TILE));
      if (World.ter[i] === T_SWIM && World.isleS[i] < -20) q = { x, y };
      homeR = 1200;
    }
    if (q && (!p || dist(q.x, q.y, p.x, p.y) > 600)) pos = q;
  }
  if (!pos) return null;
  const e = makeNPC('kaiwhe', pos.x, pos.y);
  e.home = home ? { x: home.x, y: home.y } : { x: pos.x, y: pos.y };
  e.kai = kind; e.kaiR = homeR;
  e.ambushAt = G.time + rrange(90, 240);
  G.npcs.push(e);
  return e;
}
function spawnLagoonFish(sp) {
  const c = lagoonCentre();
  if (!c) return null;
  const p = G.player;
  for (let k = 0; k < 20; k++) {
    const q = waterSpot(c.x, c.y, 0, 400, false);
    if (!q || (p && dist(q.x, q.y, p.x, p.y) < 350)) continue;
    const e = makeNPC(sp, q.x, q.y);
    e.home = { x: c.x, y: c.y };   // they wander round the lagoon's middle
    e.lagoon = true;
    G.npcs.push(e);
    return e;
  }
  return null;
}
const KAI_KINDS = { roam: KAI_ROAMERS, okiri: KAI_OKIRI, lagoon: KAI_LAGOON };
function spawnKaiwhes() {
  for (const k in KAI_KINDS) for (let i = 0; i < KAI_KINDS[k]; i++) spawnKaiwhe(k);
  for (const sp in LAGOON_FISH) for (let i = 0; i < LAGOON_FISH[sp]; i++) spawnLagoonFish(sp);
}
function maintainKaiwhes() {
  G.kaiAt = G.kaiAt || {};
  const due = (key, have, want, fn) => {
    if (have >= want) { G.kaiAt[key] = null; return; }
    if (G.kaiAt[key] == null) { G.kaiAt[key] = G.time + (key.startsWith('fish') ? 40 : KAI_RESPAWN); return; }
    if (G.time >= G.kaiAt[key] && fn()) G.kaiAt[key] = null;
  };
  for (const k in KAI_KINDS) due('kai-' + k, G.npcs.filter(e => e.species === 'kaiwhe' && e.kai === k && e.hp > 0).length, KAI_KINDS[k], () => spawnKaiwhe(k));
  for (const sp in LAGOON_FISH) due('fish-' + sp, G.npcs.filter(e => e.species === sp && e.lagoon && e.hp > 0).length, LAGOON_FISH[sp], () => spawnLagoonFish(sp));
}
const KAI_FISH = ['lepisosteus', 'bassb', 'scutelich'];
// a youngster at the water's edge (or in it) that a Kaiwhekea might take
function kaiAmbushOk(e, o) {
  if (!o || o === e) return false;
  if (o.isPlayer) {
    if (!o.alive || o.species === 'kaiwhe' || o.hidden || o.grabbed || o.skyHeld || isAirborne(o) || (o.growth || 1) >= 0.5) return false;
  } else {
    const nd = NPC_DEF[o.species];
    if (o.hp <= 0 || !nd || nd.aquatic || nd.giant || isFamily(o) || o.heldBy || isAirborne(o) || DINO[o.species].fish) return false;
    if (o.species !== 'hypsi' && (o.growth == null || o.growth >= 0.55)) return false;
  }
  return isWaterPx(o.x, o.y) || nearWaterPx(o.x, o.y, 30);
}
function thinkKaiwhe(e, d) {
  if (retaliationCheck(e, d)) return;   // easy-going — until it is bitten
  const p = G.player;
  // ASHORE (only ever after a Hypsilophodon or a youngster): the moment the
  // hunt is over, or the quarry gets more than a few lengths from the water,
  // it lurches straight back in
  if (e.landHunt) {
    if (!isWaterPx(e.x, e.y)) e.landT = (e.landT || 0) + (G.time - (e.landSeen || G.time)); else e.landT = 0;
    e.landSeen = G.time;
    const t = e.target;
    const on = e.landT < 3 && (e.state === 'chase' || e.state === 'windup' || e.state === 'lunge' || e.state === 'recover') && t &&
      (t.isPlayer ? t.alive : t.hp > 0 && G.npcs.indexOf(t) >= 0) && (isWaterPx(t.x, t.y) || nearWaterPx(t.x, t.y, 70));
    if (on) return;
    if (isWaterPx(e.x, e.y)) { e.landHunt = false; e.landT = 0; e.landSeen = 0; }
    else {
      // (straight for the nearest deep-enough water, and a little past it)
      let wa = null, wr = 1e9;
      for (let k = 0; k < 16; k++) {
        const b = k / 16 * TAU;
        for (let r = 20; r <= 400; r += 20) if (isWaterPx(e.x + Math.cos(b) * r, e.y + Math.sin(b) * r)) { if (r < wr) { wr = r; wa = b; } break; }
      }
      e.state = 'wander'; e.target = null; e.stateT = 4;
      if (wa != null) { e.tx = e.x + Math.cos(wa) * (wr + 50); e.ty = e.y + Math.sin(wa) * (wr + 50); }
      else { e.tx = e.home.x; e.ty = e.home.y; }
      return;
    }
  }
  // eating: stay on it
  if (e.state === 'seaFeed' && e.carc && e.carc.meat > 0 && G.carcasses.indexOf(e.carc) >= 0 && e.stateT > 0) return;
  // a chase only goes as far as the water does
  if (e.state === 'chase' || e.state === 'windup' || e.state === 'lunge' || e.state === 'recover') {
    const t = e.target;
    const alive = t && (t.isPlayer ? t.alive : t.hp > 0 && G.npcs.indexOf(t) >= 0);
    if (alive && (isWaterPx(t.x, t.y) || nearWaterPx(t.x, t.y, 40))) return;
    e.state = 'idle'; e.stateT = 1; e.target = null;
  }
  // something dead within reach of the water: eat it
  const c = nearestCarcass(e.x, e.y, 180, false);
  if (c && c.meat > 0 && !c.carried && (isWaterPx(c.x, c.y) || nearWaterPx(c.x, c.y, 40))) {
    e.state = 'seaFeed'; e.carc = c; e.stateT = 14; return;
  }
  const hungry = G.time >= (e.fedUntil || 0);
  // THE AMBUSH: rarely, a youngster at the edge
  if (G.time >= (e.ambushAt || 0)) {
    let best = null, bd = d.detect;
    const consider = (o) => { const dd = dist(e.x, e.y, o.x, o.y); if (dd < bd && kaiAmbushOk(e, o)) { bd = dd; best = o; } };
    if (p) consider(p);
    for (const o of G.npcs) consider(o);
    if (best) { e.state = 'chase'; e.target = best; e.stateT = 6; e.landHunt = true; e.ambushAt = G.time + rrange(150, 300); return; }
    e.ambushAt = G.time + rrange(6, 12);   // nobody there: look again in a while
  }
  // fish, when it is hungry
  if (hungry && rnd() < 0.35) {
    let best = null, bd = d.detect;
    for (const o of G.npcs) {
      if (!KAI_FISH.includes(o.species) || o.hp <= 0) continue;
      const dd = dist(e.x, e.y, o.x, o.y);
      if (dd < bd) { bd = dd; best = o; }
    }
    if (best) { e.state = 'chase'; e.target = best; e.stateT = 6; return; }
  }
  if (e.stateT > 0) return;
  // cruise its own water, unhurried
  const R = e.kaiR || d.homeR;
  for (let k = 0; k < 12; k++) {
    const a = rnd() * TAU, rr = e.kai === 'okiri' ? rrange(280, 620) : rrange(30, R);
    const tx = e.home.x + Math.cos(a) * rr, ty = e.home.y + Math.sin(a) * rr;
    if (isDeepPx(tx, ty) || ((e.kai === 'lagoon' || e.kai === 'okiri') && isWaterPx(tx, ty))) { e.tx = tx; e.ty = ty; break; }
  }
  e.state = rnd() < 0.3 ? 'idle' : 'wander';
  e.stateT = rrange(3, 7);
}
function spawnArchiSpecials() {
  for (let k = 0; k < World.straits.length; k++) spawnGarami(k);
  for (let k = 0; k < GARA_ROAMERS; k++) spawnGaramiRoamer();
  spawnKaiwhes();
}
function maintainArchiSpecials() {
  maintainKaiwhes();
  G.garaAt = G.garaAt || [];
  const p = G.player;
  for (let k = 0; k < World.straits.length; k++) {
    if (G.npcs.some(e => e.species === 'garami' && e.strait === k && e.hp > 0)) { G.garaAt[k] = null; continue; }
    if (G.garaAt[k] == null) { G.garaAt[k] = G.time + GARA_RESPAWN; continue; }
    const s = World.straits[k];
    if (G.time >= G.garaAt[k] && (!p || dist(p.x, p.y, s.x, s.y) > 900)) { spawnGarami(k); G.garaAt[k] = null; }
  }
  // the open-sea roamers: a dead one is replaced the same way
  const roamers = G.npcs.filter(e => e.species === 'garami' && e.roam && e.hp > 0).length;
  if (roamers >= GARA_ROAMERS) G.roamAt = null;
  else if (G.roamAt == null) G.roamAt = G.time + GARA_RESPAWN;
  else if (G.time >= G.roamAt && spawnGaramiRoamer()) G.roamAt = null;
}
// ---------- FLOTSAM: the sea washes its dead up on the beaches ----------
// The gulls' bread: every so often a dead fish turns up on the sand of some
// island (never in front of you), and rots away like any carcass. Enough of
// them that a scavenger on the wing can always find a meal if it searches.
const FLOTSAM_MAX = 16;
const FLOTSAM_FISH = ['lepisosteus', 'bassb', 'scutelich'];
function maintainFlotsam() {
  if (G.carcasses.filter(c => c.flotsam).length >= FLOTSAM_MAX) return;
  const p = G.player;
  for (let tries = 0; tries < 3; tries++) {
    const isle = World.isles[Math.floor(Math.random() * World.isles.length)];
    const bb = isle.bb;
    for (let k = 0; k < 40; k++) {
      const x = (bb.x0 + Math.random() * (bb.x1 - bb.x0 + 1)) * TILE, y = (bb.y0 + Math.random() * (bb.y1 - bb.y0 + 1)) * TILE;
      if (terAtPx(x, y) !== T_SAND) continue;
      if (p && dist(p.x, p.y, x, y) < 420) continue;
      const meat = Math.round(rrange(30, 50));
      G.carcasses.push({ x, y, species: FLOTSAM_FISH[Math.floor(Math.random() * FLOTSAM_FISH.length)], growth: rrange(0.6, 1), meat, maxMeat: meat, t: 0, flotsam: true });
      return;
    }
  }
}
// ---------- crossing the small waterways ----------
// Island animals don't stay put forever: now and then one wades out across a
// small waterway (World.isleLinks: wadeable, no swimmer's depth on the way)
// to join ITS OWN KIND on the far island. Only ever toward an island that
// already has its species, never emptying the island it leaves, never
// crowding the one it goes to. In the water it is slow and exposed — the
// channel keepers, and a Kaiwhekea's bleeding bite, are waiting.
const MIGRATE_CHANCE = 0.5;   // per population tick (every 10 s)
function isleMigration() {
  const links = World.isleLinks || [];
  if (!links.length || Math.random() > MIGRATE_CHANCE) return;
  const counts = {};
  for (const e of G.npcs) if (e.isle && e.hp > 0) counts[e.species + '@' + e.isle] = (counts[e.species + '@' + e.isle] || 0) + 1;
  const specN = (sp, isle) => { const s = ECO_SPAWNS.archi.find(q => q.sp === sp && q.isle === isle); return s ? (s.n || 0) + (s.pack || 0) * 4 : 0; };
  const pool = G.npcs.filter(e => e.isle && e.hp > 0 && !e.migr && !e.packAlpha && !e.herdKin && !e.agile && !e.isMate && !e.isBaby
    && NPC_DEF[e.species] && !NPC_DEF[e.species].aquatic && (e.state === 'idle' || e.state === 'wander' || e.state === 'graze'));
  for (let tries = 0; tries < 12 && pool.length; tries++) {
    const e = pool[Math.floor(Math.random() * pool.length)];
    const opts = links.filter(l => (l.a === e.isle || l.b === e.isle)).map(l => {
      const fwd = l.a === e.isle;
      return { to: fwd ? l.b : l.a, from: fwd ? l.pa : l.pb, land: fwd ? l.pb : l.pa };
    }).filter(o => (counts[e.species + '@' + o.to] || 0) > 0
      && (counts[e.species + '@' + o.to] || 0) < specN(e.species, o.to) + 2
      && (counts[e.species + '@' + e.isle] || 0) > 1);
    if (!opts.length) continue;
    const o = opts[Math.floor(Math.random() * opts.length)];
    const dest = isleByKey(o.to);
    const a = angTo(o.land.x, o.land.y, dest.x, dest.y);
    const inland = { x: o.land.x + Math.cos(a) * 90, y: o.land.y + Math.sin(a) * 90 };
    e.migr = { to: o.to, pts: [o.from, o.land, inland], i: 0 };
    e.state = 'migrate'; e.stateT = 120;
    return e;
  }
  return null;
}
// ---------- the Death Desert's specials (not in ECO_SPAWNS: hand-placed) ----------
// ONE giant walks the desert (an elder, very rarely), and the Giants' Cradle
// keeps its own little world: baby yunmenglong, a homalocephale herd and the
// guardian in the pond. None of them count toward the ECO_SPAWNS floors.
const ELDER_CHANCE = 0.03;        // per giant spawned: incredibly rare
const GIANT_RESPAWN = 180;        // seconds after the giant falls before another walks in
const GUARDIAN_RESPAWN = 300;
function spawnGiant(initial) {
  const p = G.player;
  let pos = null;
  for (let k = 0; k < 40 && !pos; k++) {
    const q = randForestPos();
    if (nearAnyNest(q.x, q.y, 500) || inCradle(q.x, q.y, 300)) continue;
    if (p && dist(q.x, q.y, p.x, p.y) < (initial ? 1500 : 1800)) continue;
    pos = q;
  }
  if (!pos) return null;
  // (a true dice roll: rnd() is still on the world-gen seed here, so it would
  // give the same answer on the first desert game of every page load)
  const e = makeGiant(pos.x, pos.y, Math.random() < ELDER_CHANCE || G.forceElder);
  if (e.elder) G.elderAlertT = initial ? 6 : 0.5;   // (the alert itself is for Aerosteon players only)
  return e;
}
function makeGiant(x, y, elder) {
  const e = makeNPC('yunmeng', x, y);
  e.stompCd = rrange(1.5, 3);
  if (elder) {
    // an ELDER: bigger, harder-hitting, slower to die — and the old claw-rake
    // across the eye that marks it
    e.elder = e.scar = true;
    e.hp = e.maxhp = 14000;
  }
  G.npcs.push(e);
  return e;
}
// TEST MODE (the EVAX code): spawns on dry ground about `r` px off, on
// whichever side of the player isn't water. Desert only, like its animals.
function testSpawnPos(r0) {
  const p = G.player;
  if (!p || !p.alive || World.eco !== 'desert') return null;
  for (let k = 0; k < 24; k++) {
    const a = (k % 2 ? Math.PI : 0) + (p.facing < 0 ? Math.PI : 0) + rrange(-0.9, 0.9);
    const r = r0 + k * 15;
    const x = clamp(p.x + Math.cos(a) * r, 80, WORLD_W - 80), y = clamp(p.y + Math.sin(a) * r * 0.6, 80, WORLD_H - 80);
    if (!isWaterPx(x, y) && !isLavaPx(x, y) && !isCliffPx(x, y)) return { x, y };
  }
  return null;
}
const TEST_AERO_MAX = 2;          // test-spawned aerosteon alive at once
const TEST_AERO_PACK = 4242;      // they hunt together as one little pack
function testAeroCount() { return G.npcs.filter(e => e.testSpawn && e.species === 'aero' && e.hp > 0).length; }
// returns the new aerosteon, or a reason string when it can't spawn one
function spawnTestAero() {
  if (testAeroCount() >= TEST_AERO_MAX) return 'Two test Aerosteon are already out — at most ' + TEST_AERO_MAX + ' at a time.';
  const pos = testSpawnPos(260);
  if (!pos) return 'No dry ground nearby to put an Aerosteon on.';
  const e = makeNPC('aero', pos.x, pos.y, TEST_AERO_PACK);
  e.testSpawn = true;
  G.npcs.push(e);
  G.banner = { str: 'An Aerosteon runs in (test mode) — ' + testAeroCount() + ' / ' + TEST_AERO_MAX + '.', t: 4, color: '#ffd23e' };
  return e;
}
function spawnTestGiant(elder) {
  const pos = testSpawnPos(380);
  if (!pos) return null;
  const e = makeGiant(pos.x, pos.y, elder);
  G.banner = { str: (elder ? '⚠ An ELDER Yunmenglong' : 'A Yunmenglong') + ' walks in (test mode).', t: 4, color: '#ffd23e' };
  return e;
}
function spawnCradleBaby() {
  const q = cradlePos(0.2, 0.7);
  const e = makeNPC('yunmeng', q.x, q.y);
  e.cradle = true;
  e.growth = rrange(0.12, 0.3);
  e.hp = e.maxhp = Math.round(900 * (e.growth / 0.2));   // (the young stay soft: not scaled off the adult)
  e.spMul = 2.4;
  e.home = { x: q.x, y: q.y };
  G.npcs.push(e);
  return e;
}
function spawnCradleHomalo(n) {
  const q = cradlePos(0.3, 0.45);
  for (let i = 0; i < n; i++) {
    const e = makeNPC('homalo', q.x + rrange(-50, 50), q.y + rrange(-50, 50), 900);
    e.cradle = true;
    e.home = { x: q.x, y: q.y };   // (homeR keeps the herd among the cycads)
    G.npcs.push(e);
  }
}
function spawnGuardian() {
  const pond = World.cradle.pond;
  const e = makeNPC('aegisu', pond.x + rrange(-20, 20), pond.y + rrange(-20, 20));
  e.home = { x: pond.x, y: pond.y };
  G.npcs.push(e);
  return e;
}
function spawnDesertSpecials() {
  spawnGiant(true);
  if (!World.cradle) return;
  const nb = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < nb; i++) spawnCradleBaby();
  spawnCradleHomalo(4 + Math.floor(rnd() * 2));
  spawnGuardian();
}
// per frame: the elder alert, the Cradle's discovery
function updateDesertSpecials(dt) {
  const p = G.player;
  if (!p || !p.alive || World.eco !== 'desert') return;
  if (G.elderAlertT != null) {
    G.elderAlertT -= dt;
    if (G.elderAlertT <= 0) {
      G.elderAlertT = null;
      if (p.species === 'aero' && G.npcs.some(e => e.elder)) {
        G.banner = { str: '⚠ An ELDER Yunmenglong walks the desert — scarred, huge, and very old.', t: 7, color: '#ffd23e' };
        SFX.call(1, 'yunmeng', 1);
      }
    }
  }
  if (!G.cradleFound && inCradle(p.x, p.y)) {
    G.cradleFound = true;
    G.banner = { str: "THE GIANTS' CRADLE — a hidden nursery. Something watches from the pond.", t: 6, color: '#a3bf58' };
  }
}
// the 10-second population pass for the specials: respawn timers for the
// giant and the guardian, a trickle of new young for the nursery
function maintainDesertSpecials() {
  const p = G.player;
  let giant = 0, babies = 0, guard = 0, herd = 0;
  for (const e of G.npcs) {
    if (e.species === 'yunmeng') { if (e.cradle) babies++; else giant++; }
    else if (e.species === 'aegisu') guard++;
    else if (e.species === 'homalo' && e.cradle) herd++;
  }
  if (giant) G.giantRespawnAt = null;
  else if (G.giantRespawnAt == null) G.giantRespawnAt = G.time + GIANT_RESPAWN;
  else if (G.time >= G.giantRespawnAt && spawnGiant(false)) G.giantRespawnAt = null;
  if (!World.cradle) return;
  const far = !p || !inCradle(p.x, p.y, 400);   // the nursery restocks unseen
  if (guard) G.guardianRespawnAt = null;
  else if (G.guardianRespawnAt == null) G.guardianRespawnAt = G.time + GUARDIAN_RESPAWN;
  else if (G.time >= G.guardianRespawnAt && far) { spawnGuardian(); G.guardianRespawnAt = null; }
  if (babies < 2 && far && rnd() < 0.35) spawnCradleBaby();
  if (herd < 2 && far && rnd() < 0.2) spawnCradleHomalo(3);
}
// ---------- pack scaling: the packs grow with the player ----------
// The power model lets a growing player drop off every pack's menu for good.
// So each wild pack quietly recruits as the player's power rises — sized
// against the pack's ORIGINAL roster, never its losses: a death freezes
// recruitment for that pack (the cripple payoff), the existing regeneration
// rule is the only road back, and recruits are shed again when the player's
// power collapses (death, species swap). Recruits are flagged packBonus so
// maintainPopulation never counts them.
const PACK_SCALE_SPECIES = new Set(['guanlong', 'troodon', 'hesper', 'linhe', 'dakota', 'aardi', 'pectino', 'gracili', 'masiak', 'achillo', 'shri', 'kuru', 'tsaagan', 'luanchuan', 'adasaurus', 'procomp']);
const PACK_BONUS_MAX = 5;      // at most this many recruits beyond the original roster
const PACK_TARGET_MUL = 1.1;   // recruit until the hunt is just worth it
const PACK_RECRUIT_MIN_D = 620;   // a recruit never appears closer to the player than this
const PACK_SHED_D = 800;          // surplus recruits slip away once this far from the player
function recordPackBases() {
  G.packScale = { base: {}, granted: {}, t: 0 };
  for (const e of G.npcs) {
    if (!PACK_SCALE_SPECIES.has(e.species) || !e.packId) continue;
    const key = e.species + ':' + e.packId;
    const b = G.packScale.base[key] || (G.packScale.base[key] = { n: 0, x: e.home.x, y: e.home.y });
    b.n++;
  }
}
// the player's power at full hp — packs size to what you ARE, not to a wound
function playerFullPower() {
  const p = G.player, def = PLAYER_DEF[p.species];
  return powerFromStats(def.hp * genderMod(p).hp * hpFrac(p.growth), playerDmg());
}
// how many members this pack wants against that power (base..base+5).
// Out of reach even at the cap: field everything and shadow the giant.
function packTargetSize(sp, baseN, pp) {
  const d = NPC_DEF[sp];
  const P = powerFromStats(d.hp, d.dmg);
  const need = Math.ceil(pp * PACK_TARGET_MUL / P);
  return clamp(need, baseN, baseN + PACK_BONUS_MAX);
}
function updatePackScale() {
  const ps = G.packScale, p = G.player;
  if (!ps || !p || !p.alive) return;
  const pp = playerFullPower();
  for (const key in ps.base) {
    const b = ps.base[key], sp = key.split(':')[0], packId = +key.split(':')[1];
    const bonusTarget = packTargetSize(sp, b.n, pp) - b.n;
    const granted = ps.granted[key] || 0;
    const members = G.npcs.filter(e => e.species === sp && e.packId === packId && e.hp > 0);
    if (granted < bonusTarget) {
      // recruit ONE per tick — and only while the pack is intact: any loss
      // (base or recruit) freezes growth until the player's power drops
      if (members.length >= b.n + granted) {
        // arrive from off in the direction away from the player, but LIVE at
        // the den — home is the den, so the recruit walks in and the pack
        // actually congregates (groupPower only sums allies within reach)
        const away = Math.atan2(b.y - p.y, b.x - p.x);
        for (let k = 0; k < 20; k++) {
          const a = away + rrange(-0.9, 0.9), r = rrange(650, 950);
          const gx = clamp(b.x + Math.cos(a) * r, 30, WORLD_W - 30);
          const gy = clamp(b.y + Math.sin(a) * r, 30, WORLD_H - 30);
          if (isWaterPx(gx, gy) || isLavaPx(gx, gy) || isCliffPx(gx, gy)) continue;
          if (dist(gx, gy, p.x, p.y) < PACK_RECRUIT_MIN_D) continue;
          const rec = makeNPC(sp, gx, gy, packId);
          rec.packBonus = true;
          rec.home = { x: b.x + rrange(-60, 60), y: b.y + rrange(-60, 60) };
          G.npcs.push(rec);
          ps.granted[key] = granted + 1;
          break;
        }
      }
    } else if (granted > bonusTarget) {
      // the player shrank: surplus recruits slip away once out of sight
      for (const e of members) {
        if ((ps.granted[key] || 0) <= bonusTarget) break;
        if (e.packBonus && dist(e.x, e.y, p.x, p.y) > PACK_SHED_D) {
          G.npcs.splice(G.npcs.indexOf(e), 1);
          ps.granted[key]--;
        }
      }
    }
  }
}
function maintainPopulation() {
  // (island animals count per island: a zalmoxes dying on Narapa is
  // replaced on Narapa, not on whichever island the dice pick)
  const counts = {};
  const keyOf = (sp, isle) => isle ? sp + '@' + isle : sp;
  for (const e of G.npcs) { if (!e.packBonus && !e.bloodline && !e.cradle) { const kk = keyOf(e.species, e.isle); counts[kk] = (counts[kk] || 0) + 1; } }
  if (World.eco === 'desert') maintainDesertSpecials();
  if (World.eco === 'archi') { maintainArchiSpecials(); isleMigration(); maintainFlotsam(); }
  for (const spec of ECO_SPAWNS[World.eco]) {
    if ((counts[keyOf(spec.sp, spec.isle)] || 0) < spec.min) {
      for (let k = 0; k < 30; k++) {
        const pos = spawnPosFor(spec.sp, k, spec.biome, spec.isle);
        if (G.player && dist(pos.x, pos.y, G.player.x, G.player.y) < 500) continue;
        G.npcs.push(specNPC(spec, pos));
        break;
      }
    }
  }
}
// ---------- player update ----------
// ---------- THE SNATCH (hatzegopteryx) ----------
// Press F beside an animal and you pick it up: in the JAWS if it has half your
// health or less ("a little snack"), in the FEET if it has up to two-thirds.
// Aloft it only works low down and keeping still (you hover over it). Carrying costs
// SNATCH_BURN stamina a second (and no breath comes back while you carry);
// run dry and it slips free. M bites what you hold; F lets it go, and from
// high up the fall does the rest.
const SNATCH_BURN = 3;       // stamina per second while carrying
const SWALLOW_FILL = 0.75;   // swallowing whole gives this share of the food tearing it up would
const SNATCH_ALT = 45;       // the highest you can hover and still pick something up
// where a carried carcass rides: in the jaws, at the drawn bill-tip for a
// long-billed giant, else at the head — and UP with the carrier when it
// flies (liftY is the draw height above the carcass's ground spot)
function carryRide(p, c) {
  const j = p.jawPt, alt = p.alt || 0;
  if (j && G.time - j.t < 0.5 && j.air === isAirborne(p)) {
    c.x = j.x; c.y = p.y + 1; c.liftY = j.h - 2;
    return;
  }
  const hw = headWorldPos(p);
  c.x = hw.x + p.facing * 4; c.y = p.y + 1;
  c.liftY = p.y - hw.y - 2 + alt;
}
function snatchMode(p, e) {
  // judged by the animal's SIZE (its full health), not how hurt it is — a
  // half-dead giant is still a giant and cannot be lifted
  // (and by the snatcher's own size: see liftBase)
  return liftMode(p, e);
}
function snatchCandidate(p) {
  const I = G.input;
  if (isAirborne(p) && (p.alt > SNATCH_ALT || I.left || I.right || I.up || I.down)) return null;
  let best = null, bd = 1e9;
  for (const e of G.npcs) {
    if (e.hp <= 0 || e.heldBy || e.falling || isFamily(e) || kinLine(e)) continue;
    const nd = NPC_DEF[e.species];
    if (!nd || nd.aquatic || nd.giant) continue;
    if (isAirborne(e) && Math.abs(e.alt - (p.alt || 0)) > AIR_BAND) continue;
    const dd = dist(p.x, p.y, e.x, e.y) - bodyRadius(e);
    if (dd > bodyRadius(p) + 45 || dd >= bd) continue;
    if (!snatchMode(p, e)) continue;
    bd = dd; best = e;
  }
  return best;
}
// where the held animal hangs: from the beak, or under the body in the feet
function holdPrey(p, s) {
  const e = s.e, d = DINO[p.species];
  const sc = d.scale * sizeScale(p.growth) * genderMod(p).size;
  const ed = DINO[e.species];
  const es = ed.scale * sizeScale(e.growth != null ? e.growth : 1) * genderMod(e).size;
  const preyH = (ed.L.leg[0] + ed.L.body[1] * 0.5) * es;   // its own centre height
  const f = p.facing || 1, air = isAirborne(p);
  // the drawing records where the bill-tip and the feet really are each
  // frame (drawAzhdarchid → p.jawPt / p.feetPt): the prey hangs from THOSE,
  // so it swings with every stride, strike and wingbeat
  const pt = s.mode === 'jaws' ? p.jawPt : p.feetPt;
  if (pt && G.time - pt.t < 0.5 && pt.air === isAirborne(p)) {   // (not on the frame the pose flips)
    const topH = (ed.L.leg[0] + ed.L.body[1] * (s.mode === 'jaws' ? 0.8 : 0.95)) * es;
    e.x = pt.x;
    e.y = p.y + (s.mode === 'jaws' ? 2 : -1);
    e.alt = Math.max(0, pt.h - topH);
    e.facing = f; e.vx = e.vy = 0; e.pitch = 0; e.move = 0;
    return;
  }
  if (s.mode === 'jaws') {
    e.x = p.x + f * snoutLen(d, sc) * (air ? 1.05 : 0.95);
    e.y = p.y + 2;
    e.alt = Math.max(0, (p.alt || 0) + (air ? (d.L.leg[0] + d.L.body[1] * 0.3) * sc : 24 * sc) - preyH * 0.9);
  } else {
    e.x = p.x - f * d.L.body[0] * sc * 0.12;
    e.y = p.y - 1;
    e.alt = Math.max(0, (p.alt || 0) + (air ? d.L.leg[0] * sc * 0.4 : 0) - preyH * 0.7);
  }
  e.facing = f; e.vx = e.vy = 0; e.pitch = 0; e.move = 0;
}
function dropPrey(p, why) {
  const s = p.snatch;
  p.snatch = null;
  if (!s || !s.e) return;
  const e = s.e;
  e.heldBy = null;
  if ((e.alt || 0) > 1) { e.falling = true; e.fallV = 0; e.dropAlt = e.alt; }
  e.state = 'flee'; e.target = p; e.stateT = 3;
  floatText(p.x, p.y - (p.alt || 0) - 60, why || 'dropped', '#e0b866');
}
function updateSnatch(p, def, input, dt) {
  p.snatchCand = null;
  const s = p.snatch;
  if (s) {
    const e = s.e;
    if (!e || e.hp <= 0 || G.npcs.indexOf(e) < 0) { p.snatch = null; return; }
    p.stamina = Math.max(0, p.stamina - SNATCH_BURN * dt);
    holdPrey(p, s);
    // M bites what you're holding — it can't get away from this one
    if (input.attack && p.atkCd <= 0 && p.actionT <= 0) {
      input.attack = false;
      p.atkCd = def.atkCd; p.attackT = 1;
      SFX.bite();
      dealDamage(e, playerDmg() * rrange(0.9, 1.1), p, { force: true, kb: 0, hitX: e.x, hitY: e.y - (e.alt || 0) - 10 });
      if (e.hp <= 0) { p.snatch = null; return; }
    }
    // E swallows a jaw-held animal WHOLE: no carcass, no fuss — a little less
    // food than tearing the same animal apart would give (SWALLOW_FILL)
    if (s.mode === 'jaws' && input.interact && p.actionT <= 0) {
      input.interact = false;
      const meat = e.maxhp * 0.55 * ((NPC_DEF[e.species] || {}).meatMul || 1);
      const i = G.npcs.indexOf(e);
      if (i >= 0) G.npcs.splice(i, 1);
      e.heldBy = null; e.hp = 0;
      p.snatch = null;
      p.action = { kind: 'swallowPrey', meat };
      p.actT = 0; p.actionT = 1.3;
      SFX.eat();
      floatText(p.x, p.y - (p.alt || 0) - 60, 'down in one!', '#e0b866');
      return;
    }
    if (input.action || p.stamina <= 0) {
      input.action = false;
      dropPrey(p, p.stamina <= 0 ? 'too tired — it slips free!' : (p.alt || 0) > 40 ? 'let go!' : 'dropped');
    }
    return;
  }
  if (p.actionT <= 0 && !p.carry && !p.fishing && !G.wrestle) p.snatchCand = snatchCandidate(p);
  if (p.snatchCand && input.action) {
    input.action = false;
    const e = p.snatchCand;
    p.snatch = { e, mode: snatchMode(p, e) };
    p.snatchCand = null;
    e.heldBy = p;
    e.state = 'flee'; e.target = p; e.stateT = 3;
    p.resting = false;
    holdPrey(p, p.snatch);
    SFX.bite();
    G.shake = Math.min(6, (G.shake || 0) + 2);
    floatText(p.x, p.y - (p.alt || 0) - 60, p.snatch.mode === 'jaws' ? 'snatched!' : 'in your feet!', '#ffd23e');
  }
}
// small enough to be carried off and a wild Hatzegopteryx is about: a warning
// (or the comfort of the trees)
// ---------- BORN INTO A HERD (Tethyshadros, Magyarosaurus) ----------
// You hatch among a herd led by its biggest. Grown, and with that leader
// dead (or killed by you), the herd is yours
function herdTick(p) {
  if (!G.herd) {
    if (G.herdTried || G.cine) return;
    G.herdTried = true;
    const kin = G.npcs.filter(e => e.species === p.species && e.hp > 0 && !isFamily(e) && !e.bloodline && !e.heldBy && dist(e.x, e.y, p.x, p.y) < 650);
    if (!kin.length) return;
    const lead = kin.reduce((a, b) => (b.maxhp > a.maxhp ? b : a));
    for (const e of kin) e.herdKin = true;
    G.herd = { leader: lead, kin };
    G.banner = { str: 'You were born into a herd of ' + kin.length + '. Keep with it: the big one marked ♛ leads.', t: 5, color: '#ffe9a0' };
    return;
  }
  const H = G.herd;
  H.kin = H.kin.filter(e => e.hp > 0 && G.npcs.indexOf(e) >= 0);
  const L = H.leader;
  if (!L.isPlayer && (L.hp <= 0 || G.npcs.indexOf(L) < 0)) {
    if (p.growth >= 1) {
      H.leader = p;
      G.banner = { str: 'The old leader is gone. The herd follows YOU now.', t: 5, color: '#ffd23e' };
      SFX.stage();
    } else if (H.kin.length) {
      H.leader = H.kin.reduce((a, b) => (b.maxhp > a.maxhp ? b : a));
      G.banner = { str: 'The leader is gone, and another takes the herd. Grow up, and next time it is yours.', t: 5, color: '#ffe9a0' };
    } else { G.herd = null; return; }
  }
  // NEW LAND: led across the sea by you, some of the herd settle here, and
  // some swim back to keep the old island's herd going
  if (H.leader === p && p.alive && !isWaterPx(p.x, p.y)) {
    const here = isleKeyAtPx(p.x, p.y);
    let stay = 0, back = 0;
    if (here) for (const e of H.kin.slice()) {
      if (!e.isle || e.isle === here || isWaterPx(e.x, e.y) || isleKeyAtPx(e.x, e.y) !== here) continue;
      if (rnd() < 0.35) {
        e.herdKin = false; H.kin.splice(H.kin.indexOf(e), 1);
        e.state = 'swimHome'; e.stateT = 40; e.target = null; back++;
      } else { e.isle = here; e.home = { x: e.x, y: e.y }; stay++; }
    }
    if (stay || back) {
      const nm = (isleByKey(here) || {}).name || 'new land';
      G.banner = { str: (stay ? stay + ' of your herd settle' + (stay === 1 ? 's' : '') + ' ' + nm + ' with you' : 'none of your herd stay') + (back ? '; ' + back + ' swim' + (back === 1 ? 's' : '') + ' back home' : '') + '.', t: 4.5, color: '#ffe9a0' };
    }
  }
  if (!H.leader.isPlayer && p.alive && !p.skyHeld) {
    const dd = dist(p.x, p.y, H.leader.x, H.leader.y);
    if (dd > 420 && dd < 1600) G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'your herd is over there: keep with the leader ♛';
  }
}
function skyPrompt(p) {
  if (p.skyHeld || p.skyFall) return;
  let near = false;
  for (const o of G.npcs) {
    if (o.species === 'hatzego' && o.hp > 0 && !isFamily(o) && !o.snatch && dist(o.x, o.y, p.x, p.y) < 520 && liftMode(o, p)) { near = true; break; }
  }
  if (!near) return;
  const str = treeCover(p.x, p.y) ? 'under the trees — the sky can\'t reach you' : '⚠ HATZEGOPTERYX ABOUT — get under the trees!';
  G.prompt = (G.prompt ? G.prompt + '    ' : '') + str;
}
function snatchPrompt(p) {
  const add = (str) => { G.prompt = (G.prompt ? G.prompt + '    ' : '') + str; };
  if (p.snatch) {
    add((p.snatch.mode === 'jaws' ? 'E — Swallow it whole    ' : '') + 'M — Bite it    F — ' + ((p.alt || 0) > 40 ? 'Let go (from up here…)' : 'Drop it'));
    add('carrying: −' + SNATCH_BURN + ' stamina/s');
  } else if (p.snatchCand) {
    add(snatchMode(p, p.snatchCand) === 'jaws' ? 'press F to pick up this little snack' : 'press F to grab it in your feet');
  }
}
// an animal in the snatcher's grip, or falling from it (called from updateNPC;
// returns true while it owns the frame)
function npcHeldOrFalling(e, dt) {
  if (e.heldBy) {
    const h = e.heldBy;
    const hOk = h.isPlayer ? h.alive : h.hp > 0 && G.npcs.indexOf(h) >= 0;
    if (!hOk || !h.snatch || h.snatch.e !== e) {   // the grip is gone
      e.heldBy = null;
      if ((e.alt || 0) > 1) { e.falling = true; e.fallV = 0; e.dropAlt = e.alt; }
    } else {
      e.thrash = lerp(e.thrash || 0, 1, 0.2);   // kicking in the air
      e.move = 0;
      return true;
    }
  }
  if (e.falling) {
    e.fallV = (e.fallV || 0) + 700 * dt;
    e.alt = Math.max(0, (e.alt || 0) - e.fallV * dt);
    e.thrash = 1; e.move = 0;
    if (e.alt <= 0) {
      e.falling = false; e.alt = 0;
      const wet = isWaterPx(e.x, e.y);
      // from up high the ground does the killing; the sea only breaks the fall
      const dmg = e.maxhp * clamp((e.dropAlt - 25) / 320, 0, 1.3) * (wet ? 0.35 : 1);
      if (wet) for (let k = 0; k < 10; k++) G.particles.push({ x: e.x + rrange(-10, 10), y: e.y, vx: rrange(-50, 50), vy: -rrange(30, 90), t: 0, life: 0.6, r: 1.6, color: '#bcd8dc', grav: 300 });
      else for (let k = 0; k < 8; k++) G.particles.push({ x: e.x + rrange(-10, 10), y: e.y, vx: rrange(-40, 40), vy: -rrange(10, 40), t: 0, life: 0.6, r: 2, color: '#8a7a5e', grav: 80 });
      if (dmg > 1) {
        floatText(e.x, e.y - 40, wet ? 'SPLASH!' : 'THUD!', '#ff9a5e');
        const p = G.player;
        if (p && dist(p.x, p.y, e.x, e.y) < 600) G.shake = Math.min(8, (G.shake || 0) + 3);
        dealDamage(e, dmg, p && p.alive && !(e.droppedBy && !e.droppedBy.isPlayer) ? p : null, { force: true, kb: 0, cause: 'the fall' });   // (a wild one's drop isn't your kill)
        e.droppedBy = null;
      }
    }
    return true;
  }
  return false;
}

// ---------- FLIGHT (pterodactylus) ----------
// SPACE held: the wings beat and it climbs, up to FLY_CEIL. Let go and it
// glides down at FLY_SINK, all the way until it touches down — on land it
// walks (clumsily, on all fours), on water it floats and paddles. Flying over
// the sea changes nothing. The shadow never leaves the ground: the shadow is
// where you ARE; the altitude only lifts the body (pitchPoint, drawPtero).
function updateFlight(p, def, input, dt) {
  const was = p.alt || 0;
  const want = (input.flap || input.pounceHold) && !p.grabbed && !G.wrestle && !p.fishing && p.actionT <= 0;
  if (want) {
    if (was <= 0) {
      // TAKE-OFF: up out of whatever it was doing, in a spray if afloat
      p.resting = false; p.bathing = false; p.hidden = false; p.restT = 0;
      crouchUp(p, false);
      if (isWaterPx(p.x, p.y)) {
        for (let k = 0; k < 8; k++) G.particles.push({ x: p.x + rrange(-8, 8), y: p.y, vx: rrange(-40, 40), vy: -rrange(20, 70), t: 0, life: 0.5, r: 1.4, color: '#bcd8dc', grav: 300 });
      } else {
        for (let k = 0; k < 5; k++) G.particles.push({ x: p.x + rrange(-8, 8), y: p.y, vx: rrange(-30, 30), vy: -rrange(5, 25), t: 0, life: 0.5, r: 1.5, color: '#8a7a5e', grav: 60 });
      }
    }
    p.alt = Math.min(FLY_CEIL, was + FLY_CLIMB * dt);
    p.wingT = 1;                                   // hard flapping
  } else if (was > 0 && def.snatch && p.snatchCand && !p.snatch &&
             !(input.left || input.right || input.up || input.down)) {
    // the snatcher HOVERS: low down and keeping still over something it
    // could pick up, it hangs in the air (F takes it) instead of sinking past
    p.wingT = 0.6;
  } else if (was > 0) {
    p.alt = Math.max(0, was - FLY_SINK * dt);
    p.wingT = 0;                                   // wings out, gliding down
    if (p.alt <= 0) {
      p.alt = 0;
      // TOUCH-DOWN: a splash onto the sea (and it floats), or a dusty landing
      if (isWaterPx(p.x, p.y)) {
        for (let k = 0; k < 10; k++) G.particles.push({ x: p.x + rrange(-8, 8), y: p.y, vx: rrange(-40, 40), vy: -rrange(20, 60), t: 0, life: 0.5, r: 1.4, color: '#bcd8dc', grav: 300 });
        floatText(p.x, p.y - 30, 'splash-down', '#bcd8dc');
      } else {
        for (let k = 0; k < 5; k++) G.particles.push({ x: p.x + rrange(-8, 8), y: p.y, vx: rrange(-30, 30), vy: -rrange(5, 20), t: 0, life: 0.5, r: 1.5, color: '#8a7a5e', grav: 60 });
      }
    }
  }
  if (p.alt > 0) { p.resting = false; p.bathing = false; p.fishing = false; }
  // the draw's wing blend: 1 grounded/folded is handled by alt, this is beat vs glide
  p.wing = lerp(p.wing || 0, p.wingT || 0, Math.min(1, dt * 6));
}

// ---------- player update ----------
function updatePlayer(dt) {
  const p = G.player;
  if (!p.alive) return;
  const def = PLAYER_DEF[p.species];
  const input = G.input;

  p.atkCd = Math.max(0, p.atkCd - dt);
  p.attackT = Math.max(0, p.attackT - dt * 3.2);
  p.pounceCd = Math.max(0, (p.pounceCd || 0) - dt);
  p.clawCd = Math.max(0, (p.clawCd || 0) - dt);
  p.dblCd = Math.max(0, (p.dblCd || 0) - dt);
  p.clawT = Math.max(0, (p.clawT || 0) - dt * 3.2);
  p.hurtT = Math.max(0, p.hurtT - dt);

  // scent pools while you linger, disperses as you move (a long camp takes
  // proportionally longer to walk off). No exemptions: still is still.
  if (p.move < 0.15) p.scentSec = (p.scentSec || 0) + dt;
  else p.scentSec = Math.max(0, (p.scentSec || 0) - dt * (p.move > 0.6 ? SCENT_DRAIN_RUN : SCENT_DRAIN_WALK));
  p.scent = Math.min(1, p.scentSec / SCENT_FILL);   // the 0..1 face of it (wisps etc.)
  if (p.scentSec > SCENT_WARN_AT && !p.scentWarned) {
    p.scentWarned = true;
    G.banner = { str: 'Your scent is pooling — the still get found. Move!', t: 5, color: '#ffd23e' };
  }

  // bleed on player
  if (p.bleed) {
    bleedTick(p, dt);
    if (p.hp <= 0) { killPlayer('blood loss'); return; }
  }

  // knockback
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);

  // ------ in a wild Hatzegopteryx's grip: mash SPACE to struggle free ------
  // (the giant carries you off; let go from high up, the fall can kill you;
  // a jaw-load gets taken down to the ground and swallowed)
  if (p.skyHeld) {
    const sh = p.skyHeld, h = sh.h;
    if (!h || h.hp <= 0 || G.npcs.indexOf(h) < 0 || !h.snatch || h.snatch.e !== p) playerSkyRelease(p);
    else {
      sh.t += dt;
      p.move = 0; p.headDown = 0; p.resting = false;
      p.phase += dt * 14;   // kicking
      if (input.attack) {
        input.attack = false;
        sh.meter += (0.075 + 0.04 * p.growth) * (def.thrashMul || 1);
        G.shake = Math.min(6, (G.shake || 0) + 1.5);
        SFX.bite();
        bloodBurst(p.x, p.y - (p.alt || 0), 1);
      }
      sh.meter = Math.max(0, sh.meter - dt * 0.05);
      const n = Math.round(clamp(sh.meter, 0, 1) * 10);
      G.prompt = 'SPACE — STRUGGLE FREE!  [' + '#'.repeat(n) + '-'.repeat(10 - n) + ']';
      if (sh.meter >= 1) {
        h.snatch = null; h.state = 'idle'; h.stateT = 1; h.landed = false;
        h.nextHunt = G.time + rrange(40, 70);
        playerSkyRelease(p);
        floatText(p.x, p.y - (p.alt || 0) - 48, 'TWISTED FREE!', '#8ad04e');
        G.banner = { str: (p.alt || 0) > 40 ? 'You twisted free… now brace for the ground!' : 'You twisted free — get under the trees!', t: 3, color: '#8ad04e' };
        SFX.stage();
      }
      return;
    }
  }
  // ------ falling from a wild one's grip ------
  if (p.skyFall) {
    const f = p.skyFall;
    f.v += 700 * dt;
    p.alt = Math.max(0, (p.alt || 0) - f.v * dt);
    p.move = 0; p.phase += dt * 10;
    G.prompt = '';
    if (p.alt <= 0) {
      p.alt = 0; p.skyFall = null;
      const wet = isWaterPx(p.x, p.y);
      const dmg = playerMaxHp() * clamp((f.from - 25) / 320, 0, 1.3) * (wet ? 0.35 : 1);
      for (let k = 0; k < (wet ? 10 : 8); k++) G.particles.push({ x: p.x + rrange(-10, 10), y: p.y, vx: rrange(-45, 45), vy: -rrange(10, 70), t: 0, life: 0.6, r: 1.8, color: wet ? '#bcd8dc' : '#8a7a5e', grav: 250 });
      if (dmg > 1) {
        floatText(p.x, p.y - 44, wet ? 'SPLASH!' : 'THUD!', '#ff9a5e');
        G.shake = Math.min(10, (G.shake || 0) + 5);
        dealDamage(p, dmg, null, { force: true, kb: 0, cause: 'a fall from a Hatzegopteryx' });
      }
    }
    return;
  }

  // ------ in the crocodile's jaws: the escape QTE owns this frame ------
  if (p.grabbed) {
    const gr = p.grabbed;
    const croc = gr.croc;
    crouchUp(p, false); p.crouch = 0;
    if (!croc || croc.hp <= 0) { p.grabbed = null; return; }   // saved by someone else's fight
    gr.t += dt;
    gr.meter -= dt * ((NPC_DEF[croc.species] || {}).gripDrain || 0.22);   // the grip tightens on its own (the guardian's faster)
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
      killPlayer('dragged under by ' + DINO[croc.species].name);
    }
    return;
  }

  // ------ the wrestle QTE owns the frame while a hold is on ------
  if (G.wrestle) {
    const w = G.wrestle, t = w.t;
    if (!t || t.hp <= 0) {
      G.wrestle = null;
    } else {
      // the hold: neck and body clamped in the jaws — and a real STRUGGLE:
      // both animals ride the same tug clock (drawDino rocks them apart and
      // together on it), the victim thrashes and kicks, dust boils up
      t.pinT = 0.3;
      t.thrash = lerp(t.thrash || 0, 1, 0.2);
      p.strain = lerp(p.strain || 0, 1, 0.25);
      const wz = weaponPos(p);
      const tug = Math.sin(G.time * 8);
      t.x = lerp(t.x, wz.x + p.facing * (6 + tug * 4), 0.35);
      t.y = lerp(t.y, p.y + 2 + Math.cos(G.time * 5.3) * 2.5, 0.35);
      t.facing = -p.facing;
      t.move = 0;
      p.move = lerp(p.move, 0, 0.3);
      p.headDown = lerp(p.headDown, 0.25 + 0.1 * tug, 0.2);
      if (Math.random() < dt * 14) {
        const mx = (p.x + t.x) / 2, my = Math.max(p.y, t.y);
        G.particles.push({ x: mx + rrange(-14, 14), y: my, vx: rrange(-26, 26), vy: -rrange(6, 30), t: 0, life: rrange(0.4, 0.8), r: rrange(1.2, 2.4), color: World.snowy ? '#e8f0f4' : '#8a7a5e', grav: 60 });
      }
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
  // a broken leg knits on its own clock
  if (p.bones && p.bones.leg) {
    p.boneT = (p.boneT != null ? p.boneT : 40) - dt;
    if (p.boneT <= 0) { p.bones = null; G.banner = { str: 'Your leg has knit — you can run again.', t: 4, color: '#a3bf58' }; }
  }
  if (p.stunT > 0) {
    p.stunT -= dt;
    p.move = lerp(p.move, 0, 0.2);
    p.headDown = lerp(p.headDown, 0.4, 0.1);
    if (Math.random() < dt * 6) floatText(p.x + rrange(-10, 10), p.y - 46 - rrange(0, 12), '✶', '#ffd23e');
    collideStatics(p, 6 + 10 * p.growth);
    G.prompt = 'stunned!';
    return;
  }

  // ------ THE HEAT (the Death Desert only) ------
  // The mirror of the cold: the sun cooks you every second you stand on the
  // open sand — the heat bar climbs, and the hotter you are the SLOWER you
  // move. At 100 you go down with heatstroke: locked in place, hp draining.
  // Water and mud cool you; the shade of a tree cools you; RESTING in shade
  // is the fastest way back down. Night is kind. A sandstorm is not.
  p.heatSlow = 1;
  if (World.desert) {
    if (p.strokeT > 0) {
      p.strokeT -= dt;
      p.move = lerp(p.move, 0, 0.3);
      p.hp -= 6 * dt;
      if (p.hp <= 0) { killPlayer('the heat'); return; }
      if (Math.random() < dt * 5) floatText(p.x + rrange(-10, 10), p.y - 46 - rrange(0, 12), '☀', '#ffd27a');
      if (p.strokeT <= 0) { p.heat = 70; floatText(p.x, p.y - 50, 'back on your feet… barely', '#ffd27a'); }
      collideStatics(p, 6 + 10 * p.growth);
      G.prompt = 'HEATSTROKE — find shade…';
      return;
    }
    const resist = (def.heatResist || 0) + ((SKINS[p.skin] && SKINS[p.skin].heatResist) || 0);   // a feather coat (Dunerider) keeps the sun off
    const wet = isWaterPx(p.x, p.y) || isMudPx(p.x, p.y);
    const shade = wet || inTreeShade(p.x, p.y);
    const night = (G.day && G.day.nightF) || 0;
    if (shade || night > 0.6) {
      // relief: mud and water fastest, shade good, resting in shade best
      p.heat = Math.max(0, (p.heat || 0) - ((wet ? 3.2 : shade ? 1.4 : 0.8) + (p.resting ? 2.4 : 0)) * dt);
    } else {
      // exposure: the sun (noon worst, night nothing), doubled and more by a sandstorm
      const sun = Math.max(0, 1 - night * 1.4);
      const storm = G.sandstorm && G.sandstorm.on ? 2.6 : 1;
      p.heat = Math.min(100, (p.heat || 0) + 1.5 * sun * storm * (1 - resist) * dt);
    }
    p.heatSlow = 1 - 0.35 * Math.pow((p.heat || 0) / 100, 1.3);
    if (p.heat >= 100) {
      p.strokeT = 5 + rnd() * 3;
      p.resting = false; p.pounce = null;
      floatText(p.x, p.y - 52, '☀ HEATSTROKE ☀', '#fff0c0');
      G.banner = { str: 'The sun takes you. Find shade…', t: 3, color: '#ffd27a' };
    }
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
  // Settling takes a real 3 seconds (restT ramps at 1/3 per second), and a
  // seated dino is COMMITTED: it must sit a full second before it may begin
  // the equally unhurried 3-second rise. No popping up.
  if (input.rest) {
    input.rest = false;
    if (!p.fishing && p.actionT <= 0 && !p.bathing && !isAirborne(p)) {
      if (!p.resting) {
        p.resting = true; p.sitT = 0;
        floatText(p.x, p.y - 48, 'resting…', '#cbb98a');
      } else if (p.restT >= 1 && (p.sitT || 0) >= 1) {
        p.resting = false;
      }
    }
  }

  // ------ pounce / tail-swing (hold CTRL, or the touch button) ------
  // press-and-hold WITH a direction: the dino coils (prep ∝ size), then leaps
  // (length ∝ speed) and the bite fires at the landing. Release during the
  // coil and nothing happens. A tail-fighter plants instead of leaping: the
  // tail scythes continuously until release, but the feet never move.
  const tailPow = !!DINO[p.species].tailWeapon;
  // SPACE is both weapons: the press bites (instant, as ever), and a hold
  // past POUNCE_HOLD_T becomes the coil. The touch POUNCE button feeds
  // pounceHold directly; both roads meet in pounceHeld.
  input.spaceHeldT = input.atkHold ? (input.spaceHeldT || 0) + dt : 0;
  input.pounceHeld = input.pounceHold || input.spaceHeldT > POUNCE_HOLD_T;
  // a flyer has no pounce: its SPACE (and the touch hold button) is the wingbeat
  if (def.flyer) { input.pounceHeld = false; updateFlight(p, def, input, dt); }
  const aloft = isAirborne(p);
  // the leap is an athletic burst: it costs real stamina, tired legs can't
  // coil at all (half a bar minimum), and the spring reloads between leaps.
  // The hold path is exempt from atkCd — the press's own bite set it.
  if (input.pounceHeld && !p.pounce && !p.pounceLatch && !p.exhausted && p.pounceCd <= 0 &&
      p.stamina >= def.stamMax * POUNCE_ARM_STAM &&
      (p.atkCd <= 0 || input.spaceHeldT > POUNCE_HOLD_T) && p.actionT <= 0 && !p.fishing && !G.wrestle) {
    let pdx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let pdy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (tailPow || pdx || pdy) {
      const l = Math.hypot(pdx, pdy) || 1;
      p.pounce = { phase: 'prep', t: pouncePrep(p.species, p.growth), dirX: pdx / l, dirY: pdy / l };
      p.pounceLatch = true;   // one pounce per press — release to re-arm
      p.resting = false;
    }
  }
  if (!input.pounceHeld) p.pounceLatch = false;

  // performance clocks & blends (consumed by drawDino): each act pushes its
  // own blend back up every frame it runs; everything else eases out here
  p.actT = (p.actT || 0) + dt;
  p.drink = lerp(p.drink || 0, 0, 0.15);
  p.chew = lerp(p.chew || 0, 0, 0.15);
  p.tear = lerp(p.tear || 0, 0, 0.15);
  p.strain = lerp(p.strain || 0, 0, 0.2);
  p.callB = lerp(p.callB || 0, 0, 0.2);

  // pounce afterglow: the leap's hit zones stay live a few ms after landing.
  // When the weapon goes cold the leap settles its bill — a missed pounce
  // burns HALF the stamina bar, a connecting one only a quarter
  if (p.pounceGrace) {
    pounceStrike(p, p.pounceGrace);
    p.pounceGrace.t -= dt;
    if (p.pounceGrace.t <= 0) {
      const landed = p.pounceGrace.hit && p.pounceGrace.hit.size > 0;
      p.stamina = Math.max(0, p.stamina - def.stamMax * (landed ? POUNCE_COST_HIT : POUNCE_COST_MISS));
      if (p.stamina <= 0) p.exhausted = true;
      p.pounceCd = POUNCE_CD;
      p.pounceGrace = null;
    }
  }

  if (def.snatch) updateSnatch(p, def, input, dt);   // (before F is resolved: the snatch owns it)
  // which verb F means this frame (see resolveAction)
  p.fAct = resolveAction(p, def);

  // ------ SIMOSUCHUS' OWN BURROW (B — its own key: it works ANYWHERE, so it
  // never rides the context keys): dig it on the spot, one at a time —
  // B beside the old one collapses it so a new one can go
  // somewhere wiser. Hiding leaves only the armored backside showing. ------
  const bVerb = burrowVerb(p, def);
  if (bVerb) G.bPrompt = bVerb === 'undig' ? 'B — Collapse this burrow'
    : bVerb === 'digfar' ? 'B — Your burrow is elsewhere' : 'B — Dig a burrow';
  else G.bPrompt = null;
  if (input.dig && bVerb) {
    input.dig = false;
    if (bVerb === 'undig') {
      G.myBurrow = null;
      floatText(p.x, p.y - 44, 'burrow collapsed', '#cbb98a');
    } else if (bVerb === 'digfar') {
      floatText(p.x, p.y - 44, 'one burrow only — return to it to move house', '#cbb98a');
    } else if (isWaterPx(p.x, p.y) || isMudPx(p.x, p.y) || isCliffPx(p.x, p.y)) {
      floatText(p.x, p.y - 44, 'the ground here won’t take a burrow', '#cbb98a');
    } else {
      p.action = { kind: 'dig' }; p.actT = 0; p.actionT = 1.6;
      SFX.eat();
    }
  }

  // ------ CALLS (1/2/3): every dinosaur has a voice ------
  // broadcast drones a claim over its kills; friendly invites the pack;
  // aggressive is a threat display that scatters, provokes — or casts out
  if ((input.call1 || input.call2 || input.call3) && !p.call && p.actionT <= 0 && !p.fishing && !p.pounce) {
    const k = input.call1 ? 1 : input.call2 ? 2 : 3;
    p.call = { k, t: 0, dur: k === 1 ? 2.2 : k === 2 ? 0.7 : 1.7, fired: false };
    p.resting = false;
    if (p.crouching && def.diet === 'carn') crouchSpook(p);   // …and from the crouch, it gives the hunter away
    SFX.call(k, p.species, p.growth);   // in this species' own voice (VOICE, util.js)
  }
  input.call1 = input.call2 = input.call3 = false;

  // ------ CROUCH (C, or the touch button): belly to the ground ------
  // a tap toggles; a hold crouches only for as long as it's held. Creeping
  // pace, no sprint, prey notices late (preyDetectMul) — and ten seconds
  // down, getting up yourself springs you forward (crouchUp)
  if (input.crouchPress) {
    input.crouchPress = false;
    if (p.crouching) crouchUp(p, true);
    else if (canCrouch(p) && !p.resting && !p.hidden && !p.fishing && !p.pounce && !p.call && p.actionT <= 0 && !G.wrestle) {
      p.crouching = true; p.crouchSec = 0; p.crouchReady = false;
    }
  }
  if (input.crouchRelease) {
    input.crouchRelease = false;
    if (p.crouching && (input.crouchHeldT || 0) > CROUCH_HOLD_T) crouchUp(p, true);
  }
  input.crouchHeldT = input.crouchKey ? (input.crouchHeldT || 0) + dt : 0;
  if (p.crouching) {
    if (p.pounce) crouchUp(p, true);   // the ambush leap IS the release
    else if (p.call || p.resting || p.hidden || p.fishing || p.bathing || p.actionT > 0 || G.wrestle || !canCrouch(p)) crouchUp(p, false);
    else {
      p.crouchSec += dt;
      if (p.crouchSec >= CROUCH_CHARGE_T && !p.crouchReady) {
        p.crouchReady = true;
        floatText(p.x, p.y - 46, 'coiled — stand to spring', '#9fe434');
      }
    }
  }
  p.crouchBoostT = Math.max(0, (p.crouchBoostT || 0) - dt);
  p.crouch = lerp(p.crouch || 0, p.crouching ? 1 : 0, Math.min(1, dt * 8));   // drawDino's pose blend

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
    const k = p.action && p.action.kind;
    if (k === 'browse' || k === 'swallow' || k === 'swallowPrey') {
      // canopy browsing and swallowing: the head goes UP, not down —
      // a swallow adds the rapid jaw-snap (p.gulp) as the food sinks in
      p.headUp = lerp(p.headUp || 0, 1, 0.15);
      p.headDown = lerp(p.headDown, 0, 0.25);
      p.gulp = p.action.kind === 'swallow' || p.action.kind === 'swallowPrey';
    } else if (k === 'drink') {
      // the lap-and-swallow performance (drawDino runs it off p.actT):
      // ripples while the snout works the water, droplets on the throw-back
      p.drink = lerp(p.drink || 0, 1, 0.3);
      p.headDown = lerp(p.headDown, 0, 0.2);
      const wz = weaponPos(p), c = p.actT % 2.0;
      if (c < 1.5 && Math.random() < dt * 7)
        G.particles.push({ x: wz.x + rrange(-4, 4), y: wz.y + rrange(-2, 2), vx: rrange(-10, 10), vy: -rrange(4, 16), t: 0, life: 0.5, r: 1.2, color: '#bcd8dc', grav: 160 });
      if (c >= 1.5 && Math.random() < dt * 12)
        G.particles.push({ x: wz.x, y: wz.y - 14, vx: rrange(-14, 14), vy: rrange(10, 30), t: 0, life: 0.45, r: 1.1, color: '#9cd0e0', grav: 220 });
    } else if (k === 'carcass') {
      // bury, saw, WRENCH — the meat comes away on the heave
      p.tear = lerp(p.tear || 0, 1, 0.3);
      p.headDown = lerp(p.headDown, 0, 0.2);
      const prev = (p.actT - dt) % 1.5, now = p.actT % 1.5;
      if (prev < 0.62 && now >= 0.62) {
        const wz = weaponPos(p);
        bloodBurst(wz.x, wz.y - 4, 4);
        SFX.eat();
      }
    } else if (k === 'dig') {
      // digging: the pluck-down scratch reads as burrowing — earth flies
      p.chew = lerp(p.chew || 0, 1, 0.3);
      p.headDown = lerp(p.headDown, 0, 0.2);
      if (Math.random() < dt * 16)
        G.particles.push({ x: p.x + p.facing * rrange(2, 12), y: p.y - 2, vx: -p.facing * rrange(15, 45), vy: -rrange(20, 55), t: 0, life: 0.5, r: rrange(1.3, 2.2), color: '#5a4c3a', grav: 300 });
    } else {
      // cropping ferns: pluck low, then lift and visibly chew — green
      // flecks scatter while the stems tear loose
      p.chew = lerp(p.chew || 0, 1, 0.3);
      p.headDown = lerp(p.headDown, 0, 0.2);
      if ((p.actT % 1.9) < 0.85 && Math.random() < dt * 9) {
        const wz = weaponPos(p);
        G.particles.push({ x: wz.x + rrange(-5, 5), y: wz.y - 4, vx: rrange(-20, 20), vy: -rrange(15, 45), t: 0, life: 0.5, r: 1.3, color: '#7da34a', grav: 260 });
      }
    }
    p.move = lerp(p.move, 0, 0.25);
    if (p.actionT <= 0) finishAction(p);
  } else if (p.call) {
    // the performance: drawDino plays it off callK/callT/callB; the glyphs
    // drift up while the voice carries, and the effect fires mid-call
    const c = p.call;
    c.t += dt;
    p.callK = c.k; p.callT = c.t;
    p.callB = lerp(p.callB, 1, 0.3);
    p.move = lerp(p.move, 0, 0.25);
    if (Math.random() < dt * (c.k === 3 ? 9 : 5)) {
      floatText(p.x + rrange(-10, 10), p.y - 58 - rrange(0, 14),
        c.k === 1 ? '♫' : c.k === 2 ? '♪' : '!',
        c.k === 1 ? '#ffd23e' : c.k === 2 ? '#e8a0c0' : '#ff6a5e');
    }
    if (!c.fired && c.t >= c.dur * 0.55) { c.fired = true; fireCall(p, c.k); }
    if (c.t >= c.dur) p.call = null;
  } else if (p.pounce) {
    const P = p.pounce;
    if (P.phase === 'prep') {
      // coiled and planted: jaws open, spring loading — the tell
      p.move = lerp(p.move, 0, 0.3);
      p.attackT = Math.max(p.attackT, 0.38);
      p.headDown = lerp(p.headDown, tailPow ? 0 : 0.3, 0.15);
      P.t -= dt;
      if (!input.pounceHeld) {
        p.pounce = null;   // let go mid-coil: cancelled, no leap
      } else if (P.t <= 0) {
        if (tailPow) {
          // the spin plants and pays up front (a cancelled coil costs nothing)
          p.stamina = Math.max(0, p.stamina - def.stamMax * POUNCE_COST_SPIN);
          if (p.stamina <= 0) p.exhausted = true;
          P.phase = 'swing'; P.t = 0.01;
        } else {
          P.phase = 'jump'; P.t = 0.26;
          P.hitBag = new Set();   // one strike per victim per pounce
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
      // airborne — and ARMED the whole way: the hit zones fly with the body,
      // striking anything crossed from the first inch of the leap to the
      // last. Two substeps per frame so a fast pounce can't tunnel through
      // a small body between frames.
      P.t -= dt;
      const bag = { hit: P.hitBag, mul: P.high ? 1.6 : 1 };
      for (let sub = 0; sub < 2; sub++) {
        p.x += P.vx * dt / 2; p.y += P.vy * dt / 2;
        pounceStrike(p, bag);
      }
      p.move = 1;
      p.phase += dt * Math.hypot(P.vx, P.vy) * 0.055;
      pitchTarget = P.dirY * 0.35;
      if (P.t <= 0) {
        p.pounce = null;
        // the zones stay live a few ms after the body stops — a landing ON
        // prey still pins it, then the weapon goes cold
        p.pounceGrace = { t: 0.12, hit: P.hitBag, mul: P.high ? 1.6 : 1 };
        p.atkCd = 0.3;
      }
    } else {
      // swing: locked in place, the tail scythes on a metronome while held —
      // double the usual cadence is the power, the planted feet the price
      p.move = lerp(p.move, 0, 0.3);
      P.t -= dt;
      if (P.t <= 0) { input.attack = true; p.atkCd = 0; P.t = 0.55; }
      if (!input.pounceHeld) { p.pounce = null; p.pounceCd = POUNCE_CD; }
    }
  } else if (p.bathing) {
    // ------ BATHING (F, while resting in mud): rolling, wriggling, kicking —
    // the fast way to get clean. drawDino plays the roll off p.bathe ------
    p.bathing.t -= dt;
    p.bathe = lerp(p.bathe || 0, 1, 0.2);
    p.move = lerp(p.move, 0, 0.3);
    p.headDown = lerp(p.headDown, 0.3, 0.1);
    if (Math.random() < dt * 14)
      G.particles.push({ x: p.x + rrange(-16, 16), y: p.y - rrange(2, 14), vx: rrange(-30, 30), vy: -rrange(15, 55), t: 0, life: rrange(0.4, 0.7), r: rrange(1.4, 2.6), color: '#5d4430', grav: 260 });
    if (!isMudPx(p.x, p.y) || p.bathing.t <= 0 || p.hygiene >= 100) p.bathing = null;   // back to plain resting
  } else if (p.resting) {
    // settled on the ground — and committed: the sit must complete, then
    // hold one full second, before a step (or R) may start the slow rise
    p.sitT = p.restT >= 1 ? (p.sitT || 0) + dt : 0;
    const wantUp = input.left || input.right || input.up || input.down;
    if (wantUp && p.restT >= 1 && p.sitT >= 1) p.resting = false;
    // the mud bath proper: B starts a real scrub (prompt shows below)
    if (input.action && p.fAct === 'bathe') {
      input.action = false;
      p.bathing = { t: 3.0 };
      SFX.splash();
      floatText(p.x, p.y - 48, 'bathing…', '#c8a2e0');
    }
    p.move = lerp(p.move, 0, 0.25);
    p.headDown = lerp(p.headDown, 0.12, 0.08);   // a soft doze, not a graze
    if (Math.random() < dt * 0.25) floatText(p.x + rrange(-6, 6), p.y - 52, 'z', '#cbb98a');
  } else if (p.hidden) {
    // head-down the burrow, backside to the world: pinned in place until a
    // step (or a bite of your own) backs you out
    p.move = lerp(p.move, 0, 0.3);
    p.headDown = lerp(p.headDown, 0.9, 0.2);
    if (G.myBurrow) { p.x = lerp(p.x, G.myBurrow.x, 0.3); p.y = lerp(p.y, G.myBurrow.y, 0.3); }
    // the panic burrow is a held breath, not a home — it runs out
    if (def.panicBurrow) {
      p.hideT = (p.hideT || 0) - dt;
      if (p.hideT <= 0) {
        p.hidden = false;
        floatText(p.x, p.y - 46, 'you have to come up!', '#ffd23e');
      }
    }
    if (input.left || input.right || input.up || input.down || !G.myBurrow) p.hidden = false;
  } else if (p.restT > 0.04) {
    // mid-rise: three unhurried seconds of leg-work — no walking off early
    p.move = lerp(p.move, 0, 0.25);
    p.headDown = lerp(p.headDown, 0.12, 0.1);
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
      // the island abelisaurs are the opposite: speedster babies that slow as they grow
      const curve = def.slowStart ? 0.5 + 0.5 * p.growth : def.babyFast ? 1.4 - 0.4 * p.growth : 0.62 + 0.38 * p.growth;
      let terr = terrainSpeedAt(p.x, p.y, p);
      if (aloft) terr = def.flyMul || 2;   // on the wing: nothing below slows it
      else if (def.swim && isWaterPx(p.x, p.y)) terr = def.swimMul || 1.15;   // a swimmer glides through water
      else if (!def.marine && isSwimPx(p.x, p.y)) terr = 0.15;   // a non-swimmer CAN cross the open sea, barely
      else if (def.marine) terr = def.landMul || 0.2;   // a plesiosaur hauled out on land barely moves
      let sp = def.speed * genderMod(p).speed * curve * terr * (p.coldSlow || 1) * (p.heatSlow || 1) * (p.bones && p.bones.leg ? 0.5 : 1);
      if (p.snatch) sp *= p.snatch.mode === 'feet' ? 0.75 : 0.9;   // the weight of the catch
      if (p.crouching && input.sprint) crouchUp(p, true);   // bursting up into the run
      if (p.crouchBoostT > 0) sp *= CROUCH_BOOST;
      if (p.crouching) sp *= CROUCH_SPEED;
      else if (input.sprint && !p.exhausted && p.stamina > 0) {
        sp *= def.sprint;
        p.stamina -= PLAYER_SPRINT_BURN * dt;
        input.sprinting = true;
        if (p.stamina <= 0) { p.stamina = 0; p.exhausted = true; }
      }
      p.x += dx * sp * dt;
      p.y += dy * sp * dt;
      if (dx !== 0) p.facing = dx > 0 ? 1 : -1;
      // nose leads into the heading; a touch of forward lean when sprinting
      // (a swimming plesiosaur turns its whole body into a diagonal, not just the nose)
      pitchTarget = dy * (aloft ? 0.6 : def.marine && isWaterPx(p.x, p.y) ? 0.7 : 0.32) + (input.sprinting ? 0.05 : 0);
      p.move = lerp(p.move, 1, 0.2);
      p.phase += dt * sp * 0.055;
      // splash / mud footsteps
      if (!aloft && Math.random() < dt * 4) {
        if (isWaterPx(p.x, p.y)) G.particles.push({ x: p.x, y: p.y, vx: rrange(-18, 18), vy: -rrange(10, 40), t: 0, life: 0.4, r: 1.3, color: '#bcd8dc', grav: 300 });
        else if (isMudPx(p.x, p.y)) G.particles.push({ x: p.x, y: p.y, vx: rrange(-14, 14), vy: -rrange(8, 30), t: 0, life: 0.45, r: 1.5, color: '#4e3826', grav: 300 });
        // a sprint kicks up the ground itself — dust, or powder on the snow
        else if (input.sprinting) G.particles.push({ x: p.x - p.facing * 8, y: p.y, vx: -p.facing * rrange(6, 22), vy: -rrange(4, 18), t: 0, life: 0.5, r: rrange(1.2, 2), color: World.snowy ? '#e8f0f4' : '#8a7a5e', grav: 40 });
      }
    } else {
      p.move = lerp(p.move, 0, 0.15);
    }
  }
  p.pitch = lerp(p.pitch, pitchTarget, Math.min(1, dt * 8));
  // the run-gait blend: drawDino stretches the stride, springs the bob,
  // reaches the neck out and streams the tail off this one number
  p.run = lerp(p.run || 0, input.sprinting && p.move > 0.4 ? 1 : 0, Math.min(1, dt * 6));
  // the sit-down/get-up transition drawDino animates from — a deliberate
  // 3 seconds each way (bathing keeps the body settled)
  p.restT = clamp((p.restT || 0) + (p.resting || p.bathing ? 1 / 3 : -1 / 3) * dt, 0, 1);
  p.bathe = p.bathing ? (p.bathe || 0) : lerp(p.bathe || 0, 0, 0.15);
  if (!G.input.sprinting && !p.snatch) {   // (carrying prey: no breath comes back)
    p.stamina = Math.min(def.stamMax, p.stamina + 13 * dt);
    if (p.exhausted && p.stamina > 20) p.exhausted = false;
  }

  collideStatics(p, 6 + 10 * p.growth);   // (aloft: only the map edge)
  updateIsleLandfall(p);   // the Archipelago names each island as you walk up its beach

  // ------ needs decay (resting slows the clock) ------
  const drain = 1 - 0.35 * (p.restT || 0);
  // big eaters (riojasaurus) burn through food faster — keep the ferns coming
  p.food = Math.max(0, p.food - dt * (100 / 300) * drain * (def.foodDrain || 1));
  p.water = Math.max(0, p.water - dt * (100 / 240) * drain);
  p.hygiene = Math.max(0, p.hygiene - dt * (100 / 420) * drain);
  // a plesiosaur in the sea never goes thirsty or dirty: the water is home
  if (def.marine && isWaterPx(p.x, p.y)) {
    p.water = Math.min(100, p.water + 3 * dt);
    p.hygiene = Math.min(100, p.hygiene + 3 * dt);
  }
  // mud bath restores hygiene
  if (!aloft && isMudPx(p.x, p.y)) {
    if (p.hygiene < 100 && Math.random() < dt * 3) G.particles.push({ x: p.x + rrange(-8, 8), y: p.y - 10, vx: rrange(-8, 8), vy: -20, t: 0, life: 0.6, r: 1.6, color: '#5d4430', grav: 100 });
    // just STANDING in mud barely helps — a real scrub (B while resting)
    // is how a dinosaur actually gets clean
    p.hygiene = Math.min(100, p.hygiene + (p.bathing ? 30 : 2) * dt);
  }
  // lava: crossable, but it BURNS — a shortcut you pay for in hide
  if (!aloft && isLavaPx(p.x, p.y)) {
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
  // (space auto-repeat must not bite through a coil or mid-leap; the
  // tail-fighter's swing metronome still fires through this gate)
  if (input.attack && p.atkCd <= 0 && p.actionT <= 0 && (!p.pounce || p.pounce.phase === 'swing')) {
    input.attack = false;
    p.resting = false;                    // up and biting
    p.hidden = false;                     // …and out of the burrow to do it
    crouchUp(p, true);                    // …and up out of the crouch
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
      if (e.packAlpha || e.isBaby || e === G.mate || kinLine(e)) continue;
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
        opts.bleed = { dps: (6 + 8 * p.growth) * bm, dur: 10 * Math.min(1.4, bm) * (def.bleedDur || 1) };
      }
      dealDamage(best, playerDmg() * rrange(0.9, 1.1) * (p.landBiteMul || 1), p, opts);
      // the bone-breakers: sarcosaurus' whole kit, dryptosaurus' bigger jaws,
      // nanuqsaurus' polar crush — the bite CRACKS the very part it landed on
      // (pounceBone: only the LANDING strike cracks anything — the skull comes
      // down with the whole animal behind it; a standing ram does not)
      if ((def.boneBreak || (def.pounceBone && p.landBite)) && p.growth > 0.2) tryBoneBreak(p, best, bestPt.part, playerDmg() * (def.pounceBone ? 1.6 : 1));
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
      if (DINO[e.species].fish || e.packAlpha || e.isBaby || e === G.mate || kinLine(e)) continue;
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
      c.carried = true;
      carryRide(p, c);
    }
  }
  if (input.action && (p.fAct === 'grab' || p.fAct === 'drop')) {
    input.action = false;
    if (p.carry) {
      // drop it at your feet — still perfectly edible
      const c = p.carry.c;
      c.carried = false;
      if ((p.alt || 0) > 4) { c.fallH = Math.max(0, c.liftY || p.alt); c.fallV = 0; c.y = p.y + 2; }   // let go aloft: it FALLS from the beak
      else { c.x = p.x + p.facing * 24; c.y = p.y + 2; }
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
    } else if (G.keys.KeyF) {
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
    G.prompt = 'E — Swallow    F — Drop';
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
  // whatever F means right now, named once (resolveAction picked it)
  const fLabel = p.carry ? null : actionPrompt(p);
  if (fLabel) G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'F — ' + fLabel;
  if (G.bPrompt) G.prompt = (G.prompt ? G.prompt + '    ' : '') + G.bPrompt;
  input.interact = false;

  // ------ fishing (F) — spinosaurids at the water's edge ------
  if (input.action && p.fAct === 'fish') {
    input.action = false;
    p.fishing = true;
    G.banner = { str: 'You settle at the waterside. Hold still — let the fish come.', t: 4, color: '#9cc4d0' };
  }
  // a carnivore can CLAIM nearby meat with the broadcast call (1)
  if (def.diet === 'carn' && !p.call && p.actionT <= 0) {
    const cc = nearestCarcass(p.x, p.y, 70);
    if (cc && cc.meat > 0 && !cc.claim) G.prompt = (G.prompt ? G.prompt + '    ' : '') + '1 — Broadcast call: claim it';
  }
  if (p.bathing) G.prompt = 'scrubbing into the mud…';
  if (p.fishing) G.prompt = 'fishing… hold still — SPACE to strike';
  if (def.snatch) snatchPrompt(p);
  else skyPrompt(p);
  if (def.herdBorn) herdTick(p);

  // ------ claw slash (M) — the clawSecond species' second weapon ------
  // The tail is the main argument; the thumb-claws are the closing one: a
  // forward slash that opens a bleeding wound. Same F key the wrestlers use —
  // a species has one F-move or the other, never both.
  if (def.clawSecond && !p.carry && !p.fishing && p.actionT <= 0 && !p.pounce) {
    for (const e of G.npcs) {
      if (DINO[e.species].fish || e.packAlpha || e.isBaby || e === G.mate || kinLine(e)) continue;
      if (dist(p.x, p.y, e.x, e.y) < 150) { G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'M — Claw slash'; break; }
    }
    if (input.claw && p.clawCd <= 0) {
      p.clawCd = 1.15;
      p.clawT = 1;
      p.resting = false;
      p.vx += p.facing * 55;
      SFX.bite();
      // the slash is EXACTLY the claw arc the H overlay draws (hitbox-truth)
      const z = clawArcCircle(p);
      let best = null, bestPt = null, bd = 1e9;
      for (const e of G.npcs) {
        if (e.packAlpha || e.isBaby || e === G.mate || kinLine(e)) continue;
        const pt = bodyHitPoint(e, z.x, z.y, z.r);
        if (!pt) continue;
        if ((pt.x - p.x) * p.facing < -2) continue;   // front side only
        const dd = dist(z.x, z.y, pt.x, pt.y);
        if (dd < bd) { bd = dd; best = e; bestPt = pt; }
      }
      if (best) {
        const opts = { hitX: bestPt.x, hitY: bestPt.y, kb: 70 };
        if ((NPC_DEF[best.species] || {}).bleedable && p.growth > 0.25)
          opts.bleed = { dps: 6 + 8 * p.growth, dur: 9 * (def.bleedDur || 1) };
        dealDamage(best, playerDmg() * 0.85 * rrange(0.9, 1.1), p, opts);
      }
    }
  }

  // ------ double bite (M) — the megalosaurid's second weapon ------
  // Two snaps in one committed motion: press M and the second bite follows
  // the first on its own, each hitting harder than a normal bite. Raw
  // damage is poekilopleuron's whole kit — this is the exclamation mark.
  if (def.doubleBite && !p.carry && !p.fishing && p.actionT <= 0 && !p.pounce) {
    for (const e of G.npcs) {
      if (DINO[e.species].fish || e.packAlpha || e.isBaby || e === G.mate || kinLine(e)) continue;
      if (dist(p.x, p.y, e.x, e.y) < 150) { G.prompt = (G.prompt ? G.prompt + '    ' : '') + 'M — Double bite'; break; }
    }
    if (input.claw && p.dblCd <= 0) {
      p.dblCd = DBL_BITE_CD;
      p.dblSnaps = 2;           // snaps left to fire
      p.dblT = 0;               // the first fires this very frame
      p.resting = false;
    }
  }
  if ((p.dblSnaps || 0) > 0) {
    p.dblT -= dt;
    if (p.dblT <= 0) {
      p.dblSnaps--;
      p.dblT = DBL_BITE_GAP;
      p.attackT = 1;            // the head snaps out (and the arms swipe with it)
      p.hidden = false;
      p.vx += p.facing * 85;    // each snap drives forward
      SFX.bite();
      // same hitbox truth as the main bite: the full strike arc, front side only
      const zones = biteZones(p);
      if (DINO[p.species].armAndJaw) zones.push(clawArcCircle(p));
      let best = null, bestPt = null, bd = 1e9;
      for (const e of G.npcs) {
        if (e.packAlpha || e.isBaby || e === G.mate || kinLine(e)) continue;
        for (const z of zones) {
          const pt = bodyHitPoint(e, z.x, z.y, z.r);
          if (!pt) continue;
          if ((pt.x - p.x) * p.facing < -2) continue;
          const dd = dist(z.x, z.y, pt.x, pt.y);
          if (dd < bd) { bd = dd; best = e; bestPt = pt; }
        }
      }
      if (best) {
        const opts = { hitX: bestPt.x, hitY: bestPt.y, kb: 110 };
        if (def.bleedBite && (NPC_DEF[best.species] || {}).bleedable && p.growth > 0.25) {
          const bm = def.bleedMul || 1;
          opts.bleed = { dps: (6 + 8 * p.growth) * bm, dur: 10 * Math.min(1.4, bm) * (def.bleedDur || 1) };
        }
        dealDamage(best, playerDmg() * DBL_BITE_MUL * rrange(0.9, 1.1), p, opts);
      }
    }
  }

  // ------ wrestle prompt (M) — an apex carnivore sizing someone up ------
  if (input.action && p.fAct === 'wrestle' && p.fActObj) {
    input.action = false;
    startWrestle(p, p.fActObj);
  }

  // ------ pack (P): wild kin fall in behind a bold aardiraptor ------
  G.packMealT = Math.max(0, (G.packMealT || 0) - dt);
  G.packTargetT = Math.max(0, (G.packTargetT || 0) - dt);
  if (G.packTarget && (G.packTarget.hp <= 0 || G.packTargetT <= 0 || G.npcs.indexOf(G.packTarget) < 0)) G.packTarget = null;
  G.pack = (G.pack || []).filter(e => e.hp > 0 && e.packAlpha && G.npcs.indexOf(e) >= 0);
  if (def.packSpecies) {
    const near = G.npcs.filter(e => e.species === p.species && !e.packAlpha && !e.isMate && !e.isBaby &&
      e.hp > 0 && dist(e.x, e.y, p.x, p.y) < 170);
    if (near.length) {
      // the invitation is a VOICE now: the friendly call (2) does the asking
      G.prompt = (G.prompt ? G.prompt + '    ' : '') + '2 — Friendly call: invite the pack';
    }
  }

  // an F press none of the player's own verbs used goes on to the nest and
  // the courtship (updateNesting runs after this — it used to find the key
  // already cleared here, so courting and laying eggs could never happen)
  G.fFree = !!input.action;
  input.action = false;
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
        if (PLAYER_DEF[p.species].packSpecies && packRoom(p) > 0) { bb.packAlpha = true; G.pack.push(bb); }
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
  p.food = Math.max(0, p.food - dt * (100 / 300) * (def.foodDrain || 1));
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
      c.carried = true;
      carryRide(p, c);
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
  // a fallen resident is dinner (resolved first: E prefers food over nesting)
  let nearC = null;
  for (const c of B.carcs) {
    if (c.meat > 0 && dist(p.x, p.y, c.x, c.y) < 30) { nearC = c; break; }
  }
  // nesting in your own den: the deepest chamber, accepted pairs only
  const ns = G.nesting;
  const deep = B.rooms[B.rooms.length - 1];
  let denNest = false;
  if (B.b.owned && ns && ns.stage === 'accepted' && (ns.reNestT || 0) <= 0 && dist(p.x, p.y, deep.x, deep.y) < deep.r) {
    denNest = true;
    if (input.interact && !nearC) {
      ns.stage = 'eggs'; ns.eggs = 3; ns.hatchT = 120; ns.den = B.b; ns.eatT = 0;
      SFX.stage();
      G.banner = { str: 'THREE EGGS, safe underground. They will hatch in their own time.', t: 6, color: '#ffd23e' };
      denNest = false;
    }
  }
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
  if (nearC && input.interact) {
    const bite = Math.min(30, nearC.meat);
    nearC.meat -= bite;
    p.food = Math.min(100, p.food + bite);
    floatText(p.x, p.y - 40, '+food', '#e08a66');
    SFX.eat();
  }
  input.interact = false;
  G.prompt = (B.b.owned ? 'F — leave the den' : 'F — flee the burrow') +
    (B.b.left > 0 ? '    ' + B.b.left + ' resident' + (B.b.left > 1 ? 's' : '') + ' below' : '') +
    (nearC ? '    E — eat' : '') +
    (denNest && !nearC ? '    E — nest here' : '');
  if (input.action) {
    input.action = false;
    exitBurrow();
    return;
  }
  input.action = false; input.rest = false;
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

// ---------- calls: what each call DOES (the voice lives in VOICE, util.js) ----------
// claim knobs: how far the bellow carries, how close a latecomer must get
// to smell the mark, and how often an animal decides the meat is worth dying for
const CLAIM_CALL_R = 300;
const CLAIM_SMELL_R = 90;
const CLAIM_FEUD_CHANCE = 0.1;
// the once-per-claim decision, made the moment an animal LEARNS of the claim
// (hearing the bellow, or smelling the mark at the meat): back off — or defy
// the claimant, and that feud ends only one way
function answerClaim(e, c) {
  if (e.claimRoll !== c.claim) {
    e.claimRoll = c.claim;   // one decision per claim, not per frame
    if ((NPC_DEF[e.species].dmg || 0) > 0 && rnd() < CLAIM_FEUD_CHANCE) {
      e.feud = true;
      G.banner = { str: 'The ' + DINO[e.species].name + ' defies your claim — TO THE DEATH!', t: 3.5, color: '#d43a2a' };
    } else {
      floatText(e.x, e.y - 30, '…', '#cbb98a');
    }
  }
  if (e.feud) { e.state = 'chase'; e.target = G.player; e.stateT = 2; }
  else { e.state = 'return'; e.stateT = 6; e.carc = null; }
}
function fireCall(p, k) {
  const def = PLAYER_DEF[p.species];
  if (k === 1) {
    // BROADCAST: a carnivore's claim rings over every carcass in earshot.
    // Marked meat is spoken for — eat it and answer to the claimant.
    if (def.diet !== 'carn') return;
    let n = 0;
    for (const c of G.carcasses) {
      if (c.meat > 0 && dist(p.x, p.y, c.x, c.y) < CLAIM_CALL_R) {
        c.claim = { t: 150 };
        floatText(c.x, c.y - 26, '⚑ CLAIMED', '#ffd23e');
        n++;
      }
    }
    if (n) {
      G.banner = { str: 'Your call claims ' + (n > 1 ? n + ' carcasses' : 'the carcass') + '.', t: 3, color: '#ffd23e' };
      // everyone in earshot of the bellow decides RIGHT NOW; animals beyond
      // it never heard a thing — they learn at the meat (see 'scavenge')
      for (const e of G.npcs) {
        if (e.state === 'scavenge' && e.carc && e.carc.claim && !isFamily(e) &&
            dist(p.x, p.y, e.x, e.y) < CLAIM_CALL_R) answerClaim(e, e.carc);
      }
    }
  } else if (k === 2) {
    // FRIENDLY: the invitation — kin who hear it fall in behind the alpha
    if (!PLAYER_DEF[p.species].packSpecies) return;
    const room = packRoom(p);
    if (room <= 0) { G.banner = { str: 'Your pack is full — ' + DINO[p.species].name + ' hunts in threes at most.', t: 3, color: '#ffe9a0' }; return; }
    const near = G.npcs.filter(e => e.species === p.species && !e.packAlpha && !e.isMate && !e.isBaby &&
      e.hp > 0 && dist(e.x, e.y, p.x, p.y) < 170).slice(0, room);
    for (const e of near) {
      e.packAlpha = true;
      // up close you can finally tell: every recruit shows its gender coat
      if (!e.gender) e.gender = rnd() < 0.5 ? 'f' : 'm';
      e.state = 'follow'; e.target = p; e.stateT = 2;
      floatText(e.x, e.y - 34, '♦', '#ffd23e');
      G.pack.push(e);
    }
    if (near.length) {
      G.banner = { str: 'You are the alpha! ' + G.pack.length + ' of your kind run with you now.', t: 4, color: '#ffd23e' };
      SFX.stage();
    }
  } else {
    // AGGRESSIVE: the threat display — cast out a close packmate, or
    // scatter the small and provoke the bold
    let kicked = null, bd = 90;
    for (const e of (G.pack || [])) { const dd = dist(p.x, p.y, e.x, e.y); if (dd < bd) { bd = dd; kicked = e; } }
    if (kicked) {
      kicked.packAlpha = false;
      G.pack.splice(G.pack.indexOf(kicked), 1);
      kicked.state = 'flee'; kicked.target = p; kicked.stateT = 5;
      floatText(kicked.x, kicked.y - 36, 'CAST OUT', '#ff6a5e');
      G.banner = { str: 'You drove a packmate out of the pack.', t: 3, color: '#ff6a5e' };
      return;
    }
    const pw = powerOf(p);
    for (const e of G.npcs) {
      if (isFamily(e) || DINO[e.species].fish || e.hp <= 0) continue;
      const nd = NPC_DEF[e.species];
      if (!nd || dist(p.x, p.y, e.x, e.y) > 300) continue;
      // intimidation runs on the same power scale as every attack decision
      const ratio = powerOf(e) / pw;
      if (ratio < 0.75 && !nd.fearless) {
        e.state = 'flee'; e.target = p; e.stateT = rrange(3.5, 6);
        e.tiredT = Math.max(e.tiredT || 0, 8);
        floatText(e.x, e.y - 30, '!', '#ffe9a0');
      } else if ((nd.dmg || 0) > 0 && rnd() < 0.4) {
        e.lastAttacker = p; e.aggroT = 8;   // provoked — its own instincts answer
        floatText(e.x, e.y - 30, '!!', '#ff6a5e');
      }
    }
    G.shake = Math.min(4, G.shake + 2);
  }
}

// ---------- F, the one secondary-action key ----------
// Every "special" verb the game used to spread over G/M/N/I/B lives here.
// They are mutually exclusive in practice, so this resolves the single verb
// that is live right now, in priority order, and the HUD names it. Stashes
// the object it applies to (a wrestle target, a carcass) on p.fActObj.
function resolveAction(p, def) {
  p.fActObj = null;
  if (p.snatch || p.snatchCand) return null;   // F picks up / drops the snatched animal
  if (isAirborne(p)) return p.carry ? 'drop' : null;   // nothing to grab or do up there (but you can let go)
  if (G.courtOffer) return null;   // the nest / the mate owns F right now (updateNesting)
  if (p.bathing || p.fishing || p.hidden || p.actionT > 0) return null;
  // settled in mud: the scrub is the only thing you can do lying down
  if (p.resting) return (p.restT >= 1 && isMudPx(p.x, p.y) && p.hygiene < 100) ? 'bathe' : null;
  if (p.carry) return 'drop';
  // a live opponent outranks a dead one: the carcass will keep
  if (def.wrestler && !G.wrestle) {
    const wt = wrestleTarget(p);
    if (wt) { p.fActObj = wt; return 'wrestle'; }
  }
  if (def.diet === 'carn') {
    const c = nearestCarcass(p.x, p.y, 40);
    if (c && c.meat > 0 && !c.carried) { p.fActObj = c; return 'grab'; }
  }
  if (def.fisher && ((isWaterPx(p.x, p.y) && !isDeepPx(p.x, p.y)) || nearWaterPx(p.x, p.y, 22))) return 'fish';
  return null;
}
// B — the digger's burrow. Available anywhere it can stand, so it gets a key
// of its own rather than riding the context key; the prompt is only a hint.
function burrowVerb(p, def) {
  if (!def.digger || p.resting || p.bathing || p.hidden || p.actionT > 0) return null;
  if (G.myBurrow) return dist(p.x, p.y, G.myBurrow.x, G.myBurrow.y) < 60 ? 'undig' : 'digfar';
  return 'dig';
}
function actionPrompt(p) {
  switch (p.fAct) {
    case 'bathe': return 'Bathe and clean yourself';
    case 'grab': return 'Grab (hold: tear a chunk)';
    case 'wrestle': return 'Wrestle ' + DINO[p.fActObj.species].name;
    case 'fish': return 'Go fishing';
    default: return null;
  }
}

// where an animal's mouth meets the ground: its own spot for most, but the
// bill-tip of a long-billed giant (azhdarchid) sits far out in front
function mouthPoint(p) {
  const d = DINO[p.species];
  if (!d.azhdarchid) return { x: p.x, y: p.y, far: false };
  const s = d.scale * sizeScale(p.growth) * genderMod(p).size;
  return { x: p.x + (p.facing || 1) * snoutLen(d, s) * 0.85, y: p.y, far: true };
}
function interactContext(p) {
  if (isAirborne(p)) return null;   // land first to eat, drink or rest
  const def = PLAYER_DEF[p.species];
  // a long-billed giant feeds and drinks at the TIP of its bill, well out in
  // front of its feet — so that's where it looks for food and water
  const m = mouthPoint(p);
  // a burrow mouth under your feet is the loudest thing the ground offers
  if (p.species === 'aardi' && World.burrows) {
    for (const b of World.burrows) {
      if (dist(p.x, p.y, b.x, b.y) < 44)
        return { kind: 'burrow', obj: b, prompt: b.owned ? 'E — Enter your den' : 'E — Invade burrow' };
    }
  }
  // the digger's own burrow: dive in and leave them your armored backside
  if (def.digger && !p.hidden && G.myBurrow && dist(p.x, p.y, G.myBurrow.x, G.myBurrow.y) < 42)
    return { kind: 'hide', prompt: 'E — Hide (backside out)' };
  if (def.diet === 'carn') {
    const c = nearestCarcass(p.x, p.y, 34) || (m.far ? nearestCarcass(m.x, m.y, 40) : null);
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
  if (!isWaterPx(p.x, p.y) && (nearWaterPx(p.x, p.y, 22) || (m.far && isWaterPx(m.x, m.y))) || (isWaterPx(p.x, p.y) && !isDeepPx(p.x, p.y))) {
    if (p.water < 99) return { kind: 'drink', prompt: 'E — Drink' };
  }
  if (isMudPx(p.x, p.y) && p.hygiene < 99) return { kind: 'mudinfo', prompt: 'Standing in mud… barely helps — rest here, then bathe' };
  return null;
}

function startAction(p, ctx) {
  if (ctx.kind === 'mudinfo') return;
  if (ctx.kind === 'burrow') { enterBurrow(ctx.obj); return; }
  if (ctx.kind === 'hide') {
    // head-first down the hole: instant, no clock — a step backs you out
    p.hidden = true;
    // a panic-burrower gets a short absolute safety instead of a lasting hide
    const hdef = PLAYER_DEF[p.species] || {};
    if (hdef.panicBurrow) p.hideT = hdef.panicBurrow;
    p.x = G.myBurrow.x; p.y = G.myBurrow.y;
    p.resting = false; p.fishing = false;
    floatText(p.x, p.y - 40, hdef.panicBurrow ? 'gone to ground — nothing can reach you!' : 'hidden — only the butt shows', '#cbb98a');
    return;
  }
  p.resting = false;   // you don't eat or drink lying down — up you get
  if (ctx.kind === 'carcass' && ctx.obj && Math.abs(ctx.obj.x - p.x) > 4) p.facing = ctx.obj.x > p.x ? 1 : -1;
  p.action = ctx;
  p.actT = 0;          // the performance clock: every act starts on cue
  // each act runs exactly one full performance loop (drawDino's cycles)
  p.actionT = ctx.kind === 'drink' ? 2.0 : ctx.kind === 'browse' ? 1.5 : ctx.kind === 'carcass' ? 1.5 : 1.9;
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
  if (a.kind === 'dig') {
    // the digger's home: one burrow, wherever it chose to put it
    G.myBurrow = { x: p.x, y: p.y };
    floatText(p.x, p.y - 48, 'a burrow of your own! (E — hide)', '#ffd23e');
    SFX.stage();
    return;
  }
  if (a.kind === 'drink') {
    p.water = Math.min(100, p.water + 38);
    floatText(p.x, p.y - 44, '+water', '#7ec8e0');
  } else if (a.kind === 'fern' || a.kind === 'horsetail') {
    if (a.obj.food <= 0) return;
    a.obj.food = 0;
    a.obj.regrow = 55 + rnd() * 40;
    p.food = Math.min(100, p.food + (a.kind === 'fern' ? 30 : 26) * plantFill(p));
    grow(0.008);
    floatText(p.x, p.y - 44, '+food', '#a2d066');
  } else if (a.kind === 'browse') {
    // a mouthful of canopy: the richest graze in the game, sauropods only
    if (a.obj.leaf === 0) return;
    a.obj.leaf = 0;
    a.obj.leafRegrow = 60 + rnd() * 45;
    p.food = Math.min(100, p.food + 36 * plantFill(p));
    grow(0.01);
    floatText(p.x, p.y - 60, '+food (canopy)', '#7ec86a');
  } else if (a.kind === 'carcass') {
    if (a.obj.meat <= 0) return;
    // big jaws take big bites — and need them: a mouthful fills an animal
    // in proportion to its size (see appetite)
    const app = appetite(p);
    const bite = Math.min(30 * app, a.obj.meat);
    a.obj.meat -= bite;
    // a fish specialist lives on the river: fish feed it far better than
    // meat does, which is the whole reason to fish instead of hunt
    const fdef = PLAYER_DEF[p.species] || {};
    const feast = fdef.fishFeast && DINO[a.obj.species] && DINO[a.obj.species].fish ? fdef.fishFeast : 1;
    p.food = Math.min(100, p.food + (bite / app) * feast);
    grow(0.008 * (feast > 1 ? 1.5 : 1));
    floatText(p.x, p.y - 44, feast > 1 ? '+FOOD (fish!)' : '+food', feast > 1 ? '#8fd8e6' : '#e08a66');
    bloodBurst(a.obj.x, a.obj.y, 3);
  } else if (a.kind === 'swallowPrey') {
    p.gulp = false;
    const gain = a.meat / appetite(p) * SWALLOW_FILL;
    p.food = Math.min(100, p.food + gain);
    grow(0.008 * Math.min(4, a.meat / 60));
    floatText(p.x, p.y - 56, 'gulp! +' + Math.round(gain) + ' food', '#e08a66');
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
    // reaching ADULT (not just Full Adult) is a deed some gates read
    if (p.growth >= 0.9 && typeof Save !== 'undefined') {
      Save.adultOnce = Save.adultOnce || {};
      if (!Save.adultOnce[p.species]) {
        Save.adultOnce[p.species] = true;
        if (typeof saveSave === 'function') saveSave();
        const fresh = typeof syncEcoUnlocks === 'function' ? syncEcoUnlocks() : [];
        if (fresh.length) setTimeout(() => { G.banner = { str: fresh.join(', ') + ' has opened!', t: 6, color: '#ffd23e' }; }, 4500);
      }
    }
    if (newStage === 'Full Adult') {
      p.wins = true;
      G.banner = { str: 'FULLY GROWN — you survived to adulthood!', t: 6, color: '#ffd23e' };
      if (typeof onFullyGrown === 'function') onFullyGrown(p.species);
    } else {
      G.banner = { str: 'You are now ' + (newStage === 'Adult' ? 'an' : 'a') + ' ' + newStage + '!', t: 4, color: '#ffe9a0' };
    }
    // the frozen giant needn't finish the climb: an ADULT nivalotitan is
    // already enough to open the Moors (the nivarex rung's alternative)
    if (p.species === 'nivalo' && p.growth >= 0.9 && typeof Save !== 'undefined' && !Save.nivaloAdult) {
      Save.nivaloAdult = true;
      if (typeof saveSave === 'function') saveSave();
      const fresh = typeof syncEcoUnlocks === 'function' ? syncEcoUnlocks() : [];
      if (fresh.length) G.banner = { str: 'The giant stirs — ' + fresh.join(', ') + ' has opened!', t: 6, color: '#a8dcf0' };
    }
  }
}

// ---------- carcasses & plants upkeep ----------
function updateWorldStuff(dt) {
  for (let i = G.carcasses.length - 1; i >= 0; i--) {
    const c = G.carcasses[i];
    if (!c.carried) c.t += dt;   // the rot clock pauses in a carrier's jaws
    if (c.fallH > 0) {   // dropped from the sky: down it comes
      c.fallV = (c.fallV || 0) + 700 * dt; c.fallH -= c.fallV * dt;
      if (c.fallH <= 0) { c.fallH = 0; c.fallV = 0; const wet = isWaterPx(c.x, c.y); for (let k = 0; k < (wet ? 8 : 4); k++) G.particles.push({ x: c.x + rrange(-6, 6), y: c.y, vx: rrange(-35, 35), vy: -rrange(10, 50), t: 0, life: 0.5, r: 1.4, color: wet ? "#bcd8dc" : "#8a7a5e", grav: 250 }); }
    }
    if (c.claim && (c.claim.t -= dt) <= 0) c.claim = null;   // claims fade
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
