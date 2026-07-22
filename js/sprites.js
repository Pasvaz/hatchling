'use strict';
// ============================================================================
// Procedural dinosaur illustration engine.
// Each dinosaur is built as one continuous silhouette (tail tip -> spine ->
// skull -> snout, skinned with a width profile), then layered: cel-shaded
// counter-shading bands, species pattern, scale speckle, rim light, outline.
// Legs are two-bone IK limbs with thighs, ankles and toed feet.
// ============================================================================

const DINO = {
  raja: {
    // abelisaurid: bulldog face, forehead horn boss, thick neck, vestigial arms
    name: 'Rajasaurus', full: 'Rajasaurus narmadensis', diet: 'carn', biped: true, scale: 1.0,
    L: { body: [46, 25], tail: [48, 9], neckLen: 9, neckAng: 0.18, head: [19, 15], leg: [25, 7.5] },
    col: {
      top: '#7c3f22', mid: '#af6a3c', belly: '#ecd9ac', line: '#2e1a0c',
      acc: '#c43b26', eye: '#e8c25a', pat: '#5a2d16', shade: '#8f5330',
    },
    tailUp: 0.34, armScale: 0.5, hornBoss: true, pattern: 'stripes',
  },
  campto: {
    // ornithopod: heavy arched body, small long low head, real forearms,
    // drops onto all fours to graze
    name: 'Camptosaurus', full: 'Camptosaurus', diet: 'herb', biped: true, scale: 1.0,
    L: { body: [48, 28], tail: [44, 10], neckLen: 13, neckAng: 0.5, head: [17, 9.5], leg: [24, 6.5] },
    col: {
      top: '#577032', mid: '#87a355', belly: '#e5e6b6', line: '#222e14',
      acc: '#8a6f3a', eye: '#4a3a24', pat: '#465c28', shade: '#6f8a45',
    },
    tailUp: 0.18, armScale: 1.25, arch: 1, forageQuad: true, pattern: 'dapple',
  },
  guanlong: {
    name: 'Guanlong', full: 'Guanlong wucaii', diet: 'carn', biped: true, scale: 0.62,
    L: { body: [26, 13], tail: [30, 5], neckLen: 9, neckAng: 0.5, head: [13, 8.5], leg: [18, 4] },
    col: {
      top: '#33353f', mid: '#575b68', belly: '#c9c3ae', line: '#14161e',
      acc: '#e07b28', eye: '#e8d878', pat: '#22242c', shade: '#454955',
    },
    tailUp: 0.3, fuzz: true, pattern: 'mask',
  },
  moros: {
    name: 'Moros', full: 'Moros intrepidus', diet: 'carn', biped: true, scale: 0.85,
    L: { body: [34, 16], tail: [38, 6], neckLen: 11, neckAng: 0.45, head: [15, 9], leg: [26, 4.5] },
    col: {
      top: '#6b532c', mid: '#a98f58', belly: '#eadcb0', line: '#33270f',
      acc: '#8a6a38', eye: '#e8c25a', pat: '#55401e', shade: '#8d7546',
    },
    tailUp: 0.32, fuzz: true, pattern: 'stripes',
  },
  ornitho: {
    name: 'Ornithomimus', full: 'Ornithomimus', diet: 'omni', biped: true, scale: 0.8,
    L: { body: [28, 15], tail: [26, 4], neckLen: 18, neckAng: 1.0, head: [9.5, 6], leg: [28, 3.8] },
    col: {
      top: '#5f6370', mid: '#8e929e', belly: '#efede1', line: '#26282f',
      acc: '#c9b78a', eye: '#3a3020', pat: '#4a4d59', shade: '#787c88',
    },
    tailUp: 0.26, plume: true, pattern: 'streak',
  },
  scelido: {
    name: 'Scelidosaurus', full: 'Scelidosaurus', diet: 'herb', biped: false, scale: 0.85,
    L: { body: [46, 22], tail: [40, 9], neckLen: 9, neckAng: 0.28, head: [14.5, 10], leg: [15, 5.5] },
    col: {
      top: '#42482a', mid: '#6d7442', belly: '#c9c491', line: '#1c2010',
      acc: '#2f351c', eye: '#4a3c22', pat: '#565d33', shade: '#5a6136',
    },
    tailUp: 0.12, scutes: true, tailWeapon: true, pattern: 'band',
  },
  huayango: {
    name: 'Huayangosaurus', full: 'Huayangosaurus', diet: 'herb', biped: false, scale: 1.05,
    L: { body: [52, 26], tail: [46, 10], neckLen: 10, neckAng: 0.22, head: [12, 9], leg: [17, 6.5] },
    col: {
      top: '#6e3a22', mid: '#a25e38', belly: '#e2c494', line: '#2a1408',
      acc: '#dc9c3c', eye: '#4a3218', pat: '#7e4426', shade: '#8a4e2e',
    },
    tailUp: 0.16, plates: true, tailWeapon: true, pattern: 'dapple',
  },

  // ---------------- SKULL PRAIRIE ----------------
  ichthyo: {
    // spinosaurid: crocodile snout, two-lobed sail, strong arms, a swimmer —
    // low-slung on short legs, long paddle-tipped tail
    name: 'Ichthyovenator', full: 'Ichthyovenator laosensis', diet: 'carn', biped: true, scale: 1.05,
    L: { body: [48, 21], tail: [58, 8], neckLen: 10, neckAng: 0.22, head: [22, 10], leg: [18, 6.5] },
    col: {
      top: '#39625f', mid: '#65948c', belly: '#e8e4c0', line: '#182c2a',
      acc: '#d96a3a', eye: '#e8c25a', pat: '#2c4d4e', shade: '#547f78',
    },
    tailUp: 0.2, armScale: 1.35, sail: true, paddleTail: true, pattern: 'stripes',
  },
  qianzho: {
    // alioramin tyrannosaurid: the long-snouted "Pinocchio rex"
    name: 'Qianzhousaurus', full: 'Qianzhousaurus sinensis', diet: 'carn', biped: true, scale: 1.0,
    L: { body: [44, 22], tail: [48, 8], neckLen: 11, neckAng: 0.3, head: [22, 9.5], leg: [27, 7] },
    col: {
      top: '#6e3a2e', mid: '#a56a4a', belly: '#ead9b0', line: '#2c140c',
      acc: '#c8543a', eye: '#e8d878', pat: '#54291e', shade: '#8a5638',
    },
    tailUp: 0.3, fuzz: true, snoutBumps: true, armScale: 0.7, pattern: 'stripes',
  },
  scutello: {
    // little early thyreophoran: armored back, whip of a tail
    name: 'Scutellosaurus', full: 'Scutellosaurus lawleri', diet: 'herb', biped: true, scale: 0.7,
    L: { body: [34, 16], tail: [50, 5], neckLen: 8, neckAng: 0.35, head: [11, 7.5], leg: [16, 4.5] },
    col: {
      top: '#4c5530', mid: '#7a8248', belly: '#d9d8a8', line: '#20260f',
      acc: '#b0a678', eye: '#4a3a24', pat: '#5c6436', shade: '#666e3c',
    },
    tailUp: 0.22, scutes: true, armScale: 1.1, pattern: 'band',
  },
  troodon: {
    name: 'Troodon', full: 'Troodon formosus', diet: 'carn', biped: true, scale: 0.64,
    L: { body: [26, 12], tail: [32, 5], neckLen: 10, neckAng: 0.55, head: [12.5, 8], leg: [19, 4] },
    col: {
      top: '#4a5638', mid: '#77855c', belly: '#d8d2b0', line: '#1c2414',
      acc: '#c8783a', eye: '#e8d878', pat: '#33402a', shade: '#5f6c48',
    },
    tailUp: 0.32, fuzz: true, pattern: 'stripes',
  },
  eotyrannus: {
    name: 'Eotyrannus', full: 'Eotyrannus lengi', diet: 'carn', biped: true, scale: 0.92,
    L: { body: [40, 15], tail: [42, 6], neckLen: 11, neckAng: 0.4, head: [16, 9], leg: [27, 4.8] },
    col: {
      top: '#5c5644', mid: '#948a68', belly: '#ece0bc', line: '#2a2414',
      acc: '#8a6a38', eye: '#e8c25a', pat: '#453f2c', shade: '#7a7154',
    },
    tailUp: 0.3, fuzz: true, pattern: 'stripes',
  },
  grunos: {
    // fictional abelisaurid bruiser — slow, heavy, hunts everything
    name: 'Grunos', full: 'Grunos ferox (†imagined)', diet: 'carn', biped: true, scale: 1.02,
    L: { body: [46, 26], tail: [44, 9], neckLen: 8, neckAng: 0.16, head: [18, 15], leg: [23, 7.5] },
    col: {
      top: '#34363f', mid: '#5e626e', belly: '#c9c3ae', line: '#12141c',
      acc: '#b8352a', eye: '#e86a3a', pat: '#22242c', shade: '#4a4e58',
    },
    tailUp: 0.3, armScale: 0.45, hornBoss: true, pattern: 'mask',
  },
  archeo: {
    // fictional heterodontosaurid: tiny, tusked, quick
    name: 'Archeornithos', full: 'Archeornithos parvus (†imagined)', diet: 'herb', biped: true, scale: 0.5,
    L: { body: [22, 11], tail: [26, 4], neckLen: 8, neckAng: 0.5, head: [10, 7], leg: [15, 3.4] },
    col: {
      top: '#7a5a34', mid: '#b08a56', belly: '#eee2c2', line: '#33230f',
      acc: '#d8b46a', eye: '#3a2c18', pat: '#5c421f', shade: '#96754a',
    },
    tailUp: 0.28, fuzz: true, armScale: 1.1, tusks: true, pattern: 'dapple',
  },
  leaellyna: {
    // big-eyed, fuzzy, with a spectacular streaming tail
    name: 'Leaellynasaura', full: 'Leaellynasaura amicagraphica', diet: 'herb', biped: true, scale: 0.52,
    L: { body: [22, 12], tail: [58, 3.6], neckLen: 8, neckAng: 0.5, head: [10, 7], leg: [16, 3.5] },
    col: {
      top: '#6a4a30', mid: '#a3805c', belly: '#e8dcc0', line: '#2c1c0e',
      acc: '#8a5c3a', eye: '#3c2e1c', pat: '#4c3018', shade: '#8a6a4a',
    },
    tailUp: 0.42, fuzz: true, armScale: 1.05, bigEye: 1.35, pattern: 'dapple',
  },
  kosmo: {
    name: 'Kosmoceratops', full: 'Kosmoceratops richardsoni', diet: 'herb', biped: false, scale: 1.05,
    L: { body: [52, 26], tail: [30, 9], neckLen: 8, neckAng: 0.15, head: [20, 13], leg: [17, 6.5] },
    col: {
      top: '#5c4a2e', mid: '#8f7648', belly: '#dcc898', line: '#241a0c',
      acc: '#c87a4a', eye: '#4a3218', pat: '#6e5a36', shade: '#7a6540',
    },
    tailUp: 0.1, frill: true, headButt: true, pattern: 'dapple',
  },
  lepisosteus: {
    // gar — drawn by its own little fish renderer, not the dino engine
    name: 'Lepisosteus', full: 'Lepisosteus (gar)', diet: 'carn', biped: false, scale: 0.5, fish: true,
    L: { body: [26, 7], tail: [8, 3], neckLen: 1, neckAng: 0, head: [10, 4], leg: [4, 1] },
    // body peculiarity: one slim spindle, no neck or legs — hand-tuned hit zones
    hitZones: [{ dx: 9, dy: 0, r: 3 }, { dx: 0, dy: 0, r: 3.8 }, { dx: -9, dy: 0, r: 2.8 }],
    col: {
      top: '#465840', mid: '#77876a', belly: '#d8d8b8', line: '#222c1e',
      acc: '#b0b890', eye: '#2c2416', pat: '#3a4a36', shade: '#66765a',
    },
    tailUp: 0,
  },

  // ---------------- COASTAL SCRUBS ----------------
  megoro: {
    // imagined giant crocodilian: flat skull, armored back, a shadow offshore
    name: 'Megorontosuchus', full: 'Megorontosuchus (imagined)', diet: 'carn', biped: false, scale: 1.35,
    L: { body: [54, 17], tail: [52, 9], neckLen: 5, neckAng: 0.08, head: [26, 8], leg: [6.5, 4] },
    col: {
      top: '#3a4a30', mid: '#5c7046', belly: '#cfcfa0', line: '#141f10',
      acc: '#8aa050', eye: '#d8c860', pat: '#2c3a24', shade: '#4e6039',
    },
    tailUp: 0.04, scutes: true, pattern: 'band',
  },
  ugru: {
    // medium hadrosaur: herd animal with a heavyweight tail swing
    name: 'Ugrunaaluk', full: 'Ugrunaaluk kuukpikensis', diet: 'herb', biped: true, scale: 1.0,
    L: { body: [46, 26], tail: [46, 10], neckLen: 13, neckAng: 0.45, head: [19.5, 10], leg: [23, 6.5] },
    col: {
      top: '#4e5a2e', mid: '#7e8a48', belly: '#e2ddb0', line: '#1e2610',
      acc: '#c08a3c', eye: '#4a3c22', pat: '#3c4822', shade: '#68743c',
    },
    tailUp: 0.26, armScale: 1.2, arch: 1, forageQuad: true, tailWeapon: true, duckbill: true, pattern: 'band',
  },
  charono: {
    // huge tube-crested hadrosaur: lord of the beach, too big for crocodiles
    name: 'Charonosaurus', full: 'Charonosaurus jiayinensis', diet: 'herb', biped: true, scale: 1.4,
    L: { body: [56, 30], tail: [52, 11], neckLen: 13, neckAng: 0.5, head: [19, 10], leg: [26, 8] },
    col: {
      top: '#4c525e', mid: '#7c828e', belly: '#e5e2d0', line: '#1e222b',
      acc: '#b8683a', eye: '#4a3c26', pat: '#3a3f4a', shade: '#666c78',
    },
    tailUp: 0.22, armScale: 1.25, arch: 1, forageQuad: true, tailWeapon: true, tubeCrest: true, duckbill: true, pattern: 'stripes',
  },
  archaomim: {
    // imagined ornithomimid: ornitho's frame with real muscle and a mean kick
    name: 'Archaomimus', full: 'Archaomimus (imagined)', diet: 'omni', biped: true, scale: 0.88,
    L: { body: [30, 17], tail: [26, 4.5], neckLen: 17, neckAng: 0.95, head: [10, 6.5], leg: [26, 5.4] },
    col: {
      top: '#6e5a34', mid: '#a08a52', belly: '#efe8cc', line: '#2c2412',
      acc: '#c9a86a', eye: '#3a3020', pat: '#584828', shade: '#88744a',
    },
    tailUp: 0.26, plume: true, pattern: 'streak',
  },
  hesper: {
    // imagined azure raider: guanlong's build, blunter snout, no crest at all
    name: 'Hesperaptor', full: 'Hesperaptor (imagined)', diet: 'carn', biped: true, scale: 0.64,
    L: { body: [26, 13], tail: [30, 5], neckLen: 9, neckAng: 0.5, head: [11.5, 8.8], leg: [18, 4] },
    col: {
      top: '#28556e', mid: '#4788a2', belly: '#dcece6', line: '#102630',
      acc: '#84d8e8', eye: '#e8d878', pat: '#1c3f52', shade: '#3a7188',
    },
    tailUp: 0.3, fuzz: true, pattern: 'streak',
  },
  concav: {
    // hump-backed carcharodontosaur: swims, sprints, short-legged and low
    name: 'Concavenator', full: 'Concavenator corcovatus', diet: 'carn', biped: true, scale: 1.05,
    L: { body: [44, 23], tail: [42, 8], neckLen: 10, neckAng: 0.35, head: [17, 10], leg: [17, 6] },
    col: {
      top: '#7a4a28', mid: '#a87848', belly: '#e8d8ac', line: '#2c180a',
      acc: '#d8a038', eye: '#e8c25a', pat: '#5c3618', shade: '#8d6338',
    },
    tailUp: 0.3, armScale: 0.9, hump: true, pattern: 'dapple',
  },
  crista: {
    // baryonychine heavyweight: thick BLUNT muzzle (snoutW override — no
    // point on it anywhere), long paddle tail, low keeled ridge (no tall
    // sail — that's ichthyo's), stocky build. The shoreline tank.
    name: 'Cristatusaurus', full: 'Cristatusaurus lapparenti', diet: 'carn', biped: true, scale: 1.25,
    L: { body: [50, 26], tail: [58, 8], neckLen: 10, neckAng: 0.25, head: [23, 10.5], leg: [22, 7.5] },
    col: {
      top: '#4e4a2a', mid: '#7d7444', belly: '#e6e0b8', line: '#1e1c0e',
      acc: '#c9b06a', eye: '#e8a83a', pat: '#35331c', shade: '#68613a',
    },
    tailUp: 0.2, armScale: 1.3, ridge: true, paddleTail: true, snoutW: 0.42, snoutMidW: 0.5, pattern: 'stripes',
  },
  metria: {
    // the coast's playable hunter: storm-grey allosauroid with a low spine ridge
    name: 'Metriacanthosaurus', full: 'Metriacanthosaurus parkeri', diet: 'carn', biped: true, scale: 1.1,
    L: { body: [46, 24], tail: [46, 9], neckLen: 11, neckAng: 0.32, head: [19, 12], leg: [26, 7] },
    col: {
      top: '#474c58', mid: '#747a88', belly: '#dfdcca', line: '#191c24',
      acc: '#c86438', eye: '#e8c25a', pat: '#343846', shade: '#5e6472',
    },
    tailUp: 0.34, armScale: 0.8, ridge: true, pattern: 'stripes',
  },
  giganto: {
    // gigantspinosaurus: tiny head, huge swept shoulder spines, all thagomizer
    name: 'Gigantspinosaurus', full: 'Gigantspinosaurus sichuanensis', diet: 'herb', biped: false, scale: 1.2,
    L: { body: [56, 28], tail: [50, 11], neckLen: 10, neckAng: 0.2, head: [13, 9.5], leg: [18, 7] },
    col: {
      top: '#3e4a4e', mid: '#5f7276', belly: '#cfd4bc', line: '#161f22',
      acc: '#d8b04c', eye: '#4a3c22', pat: '#2c383c', shade: '#52646a',
    },
    tailUp: 0.14, plates: true, tailWeapon: true, shoulderSpine: true, pattern: 'dapple',
  },

  // ---------------- ASHFALL RIDGE ----------------
  tarbo: {
    // the tyrant of the ash: a mountain of charcoal and ember
    name: 'Tarbosaurus', full: 'Tarbosaurus bataar', diet: 'carn', biped: true, scale: 1.5,
    L: { body: [56, 30], tail: [52, 11], neckLen: 11, neckAng: 0.3, head: [24, 16], leg: [27, 8.5] },
    col: {
      top: '#33241e', mid: '#5c4034', belly: '#d8c4a4', line: '#160d09',
      acc: '#d84a26', eye: '#ffd23e', pat: '#241812', shade: '#4a332a',
    },
    tailUp: 0.32, armScale: 0.45, snoutBumps: true, pattern: 'stripes',
  },
  linhe: {
    // deep-cut dromaeosaur from Inner Mongolia — rusty, masked, always hunting
    name: 'Linheraptor', full: 'Linheraptor exquisitus', diet: 'carn', biped: true, scale: 0.62,
    L: { body: [26, 12], tail: [34, 4.5], neckLen: 9, neckAng: 0.45, head: [13, 7.5], leg: [19, 4.2] },
    col: {
      top: '#8a4226', mid: '#bd7444', belly: '#efdfba', line: '#331a0c',
      acc: '#e8cf9e', eye: '#e8d878', pat: '#4c2210', shade: '#a2603a',
    },
    tailUp: 0.34, fuzz: true, pattern: 'mask',
  },
  nothro: {
    // pot-bellied therizinosaurid held nearly upright — a short tail, a long
    // craning neck, and scythe claws that hang lower than its knees
    name: 'Nothronychus', full: 'Nothronychus mckinleyi', diet: 'herb', biped: true, scale: 1.3,
    L: { body: [40, 31], tail: [28, 8.5], neckLen: 20, neckAng: 1.0, head: [11, 7], leg: [24, 7] },
    col: {
      top: '#7a5a30', mid: '#a8875a', belly: '#f0e6c4', line: '#33240e',
      acc: '#ece2ce', eye: '#4a3c24', pat: '#5c3f20', shade: '#8f7248',
    },
    tailUp: 0.3, fuzz: true, armScale: 1.4, bigClaws: true, clawWeapon: true, pattern: 'dapple',
  },
  eshano: {
    // the Wall's shaggy climber: a VERY unique therizinosaur — held nearly
    // UPRIGHT on short stumpy legs, chest high, tail low, with short arms
    // ending in outsized scythe claws. A fat feathered pear on ice-picks.
    name: 'Eshanosaurus', full: 'Eshanosaurus deleensis', diet: 'herb', biped: true, scale: 0.9,
    L: { body: [29, 26], tail: [19, 7.5], neckLen: 15, neckAng: 1.3, head: [9.5, 6.2], leg: [14, 6] },
    col: {
      top: '#5c6672', mid: '#98a2ac', belly: '#eef2f5', line: '#232830',
      acc: '#d8e4ec', eye: '#e8c25a', pat: '#3f4854', shade: '#7a848e',
    },
    tailUp: 0.1, foreLift: 0.55, fuzz: true, armScale: 0.85, armUp: 0.2, bigClaws: true, clawLen: 12, clawWeapon: true, pattern: 'streak',
  },
  jianchang: {
    // eshano's little cousin: slender, rusty, half-upright — the babies climb
    name: 'Jianchangosaurus', full: 'Jianchangosaurus yixianensis', diet: 'herb', biped: true, scale: 0.72,
    L: { body: [26, 16], tail: [24, 5.5], neckLen: 13, neckAng: 0.9, head: [9, 6], leg: [19, 4.5] },
    col: {
      top: '#7a4a2e', mid: '#b08054', belly: '#f0e2c8', line: '#31200f',
      acc: '#e8d8c0', eye: '#e8c25a', pat: '#4a2c18', shade: '#8f6a44',
    },
    tailUp: 0.24, foreLift: 0.2, fuzz: true, armScale: 1.05, armUp: 0.1, bigClaws: true, clawLen: 8, clawWeapon: true, pattern: 'mask',
  },
  kerbero: {
    // the polar edmontosaur-alike: huge, flat-headed, crestless — a wall of
    // warm meat the whole mountain huddles beside (carefully)
    name: 'Kerberosaurus', full: 'Kerberosaurus manakini', diet: 'herb', biped: true, scale: 1.35,
    L: { body: [46, 24], tail: [40, 8], neckLen: 15, neckAng: 0.7, head: [15, 8.5], leg: [26, 7] },
    col: {
      top: '#4e4a44', mid: '#8a8078', belly: '#e8e2d4', line: '#221e1a',
      acc: '#b8a890', eye: '#3c3222', pat: '#3a3630', shade: '#6e665e',
    },
    tailUp: 0.24, armScale: 1.25, arch: 1, forageQuad: true, tailWeapon: true, duckbill: true, pattern: 'band',
  },
  beipiao: {
    // the shaggiest thing on the mountain: a charcoal therizinosaur wearing
    // half a snowdrift, scythes tucked high like folded shears
    name: 'Beipiaosaurus', full: 'Beipiaosaurus inexpectus', diet: 'herb', biped: true, scale: 0.8,
    L: { body: [27, 20], tail: [18, 6.5], neckLen: 14, neckAng: 1.1, head: [9, 6], leg: [16, 5.5] },
    col: {
      top: '#38363c', mid: '#6a6870', belly: '#d8d4d8', line: '#1b191e',
      acc: '#cfc8bc', eye: '#e8c25a', pat: '#26242a', shade: '#54525a',
    },
    tailUp: 0.14, foreLift: 0.35, fuzz: true, armScale: 0.95, armUp: 0.15, bigClaws: true, clawLen: 10, clawWeapon: true, pattern: 'streak',
  },
  pectino: {
    // the scavenger gang: snow-white troodontids with sooty masks — you see
    // the dark eyes before you see the bird
    name: 'Pectinodon', full: 'Pectinodon bakkeri', diet: 'carn', biped: true, scale: 0.58,
    L: { body: [20, 10], tail: [22, 3.6], neckLen: 10, neckAng: 0.75, head: [9, 6], leg: [16, 3.2] },
    col: {
      top: '#c8ccd4', mid: '#e8eaee', belly: '#ffffff', line: '#26262c',
      acc: '#3a3a42', eye: '#e8d878', pat: '#8e929c', shade: '#b8bcc4',
    },
    tailUp: 0.32, fuzz: true, plume: true, pattern: 'mask',
  },
  nanuq: {
    // the polar tyrant: a compact white-and-slate TYRANNOSAURID — deep boxy
    // skull, blunt bone-crushing muzzle, rugose snout, stub arms — a fist in
    // a fur glove, built on the tarbosaurus pattern
    name: 'Nanuqsaurus', full: 'Nanuqsaurus hoglundi', diet: 'carn', biped: true, scale: 1.3,
    L: { body: [50, 24], tail: [50, 9], neckLen: 10, neckAng: 0.35, head: [24, 14], leg: [25, 7.5] },
    col: {
      top: '#5a6470', mid: '#c2ccd4', belly: '#f2f4f6', line: '#1e222a',
      acc: '#8a1f1a', eye: '#e8d878', pat: '#42484f', shade: '#98a2ac',
    },
    tailUp: 0.2, fuzz: true, armScale: 0.45, snoutBumps: true,
    snoutW: 0.42, snoutMidW: 0.55, pattern: 'mask',
  },
  titanov: {
    // the titan-killer: a colossal bone-white theropod with a blood-red blade
    // crest — the only warm color on the whole mountain, and the last one
    // most things see. Built long and deep like the carcharodontosaurids
    name: 'Titanovenator', full: 'Titanovenator gelidus (imagined)', diet: 'carn', biped: true, scale: 1.6,
    L: { body: [58, 26], tail: [56, 10], neckLen: 12, neckAng: 0.35, head: [25, 13], leg: [27, 8] },
    col: {
      top: '#7a8494', mid: '#dfe6ec', belly: '#f8fafc', line: '#1a1e26',
      acc: '#b8231c', eye: '#e8d878', pat: '#525a66', shade: '#aab4be',
    },
    tailUp: 0.2, fuzz: true, fanCrest: 0.85, skullArch: true, pattern: 'streak',
  },
  korean: {
    // the snowball underfoot: a tiny round burrowing ornithopod, all fluff
    // and nerves — the bottom of every food chain on the mountain
    name: 'Koreanosaurus', full: 'Koreanosaurus boseongensis', diet: 'herb', biped: false, scale: 0.48,
    L: { body: [20, 12], tail: [14, 4], neckLen: 8, neckAng: 0.6, head: [8, 5.5], leg: [10, 3] },
    col: {
      top: '#8a7a66', mid: '#c4b6a2', belly: '#f4eee2', line: '#2e261c',
      acc: '#e8dcc8', eye: '#3a2e1e', pat: '#6e6052', shade: '#a89a86',
    },
    tailUp: 0.2, fuzz: true, bigEye: 1.35, forageQuad: true, pattern: 'band',
  },
  nivalo: {
    // THE FROZEN GIANT: the mountain's namesake, built to the PE Brachiosaurus
    // silhouette — towering shoulders on long forelimbs, the back plunging to
    // low hips, a NEAR-VERTICAL neck, a short high-held tail. A glacier on legs
    name: 'Nivalotitan', full: 'Nivalotitan vallis (imagined)', diet: 'herb', biped: false, scale: 2.1,
    // the neck IS the animal: 100 units at neckAng 1.35 rises ~97 — twice
    // the torso's whole keeled depth, and longer than the body itself.
    // neckGrow keeps hatchlings stubby; the tower is earned at Full Adult
    L: { body: [76, 34], tail: [44, 10], neckLen: 100, neckAng: 1.35, head: [13, 8], leg: [34, 11] },
    col: {
      top: '#4a5c74', mid: '#9fb4c8', belly: '#eef4fa', line: '#1c2430',
      acc: '#d8e8f4', eye: '#e8c25a', pat: '#3a4a5e', shade: '#7a90a6',
    },
    tailUp: 0.3, neckW: 0.78, neckArc: 0.12, sauroHead: true, beak: false, foreLift: 0.8, chest: 1.2, shFwd: 0.08,
    neckGrow: true, zoomOut: 0.28, snoutW: 0.42, snoutMidW: 0.56, highBrowse: true, tailWeapon: true, pattern: 'dapple',
  },
  ovi: {
    // crested egg thief: fast, nosy, first to every carcass
    name: 'Oviraptor', full: 'Oviraptor philoceratops', diet: 'omni', biped: true, scale: 0.72,
    L: { body: [24, 13], tail: [22, 4], neckLen: 12, neckAng: 0.8, head: [10, 7.5], leg: [18, 4] },
    col: {
      top: '#5c5450', mid: '#a89e90', belly: '#f0ead8', line: '#241f1c',
      acc: '#3e8ac2', eye: '#2c2416', pat: '#3c3630', shade: '#8a8074',
    },
    tailUp: 0.3, fuzz: true, armScale: 1.2, casque: true, plume: true, pattern: 'band',
  },
  shuv: {
    // a sparrow of a dinosaur — all legs and nerves
    name: 'Shuvuuia', full: 'Shuvuuia deserti', diet: 'omni', biped: true, scale: 0.5,
    L: { body: [18, 9], tail: [22, 3.2], neckLen: 9, neckAng: 0.6, head: [8, 5.5], leg: [14, 2.8] },
    col: {
      top: '#8a7a54', mid: '#b3a276', belly: '#efe6c8', line: '#3a301c',
      acc: '#c9b88a', eye: '#2c2416', pat: '#6a5c3e', shade: '#9c8c64',
    },
    tailUp: 0.3, fuzz: true, bigEye: 1.25, pattern: 'streak',
  },
  // ---------------- fish (all drawn by drawFish, keyed on fishKind) ----------------
  bassb: {
    // the lake's darting shadow: deep-bodied, dark-backed, harmless — and
    // surprisingly hard to actually kill
    name: 'Black-back Bass', full: 'black-back bass (imagined)', diet: 'carn', biped: false, scale: 0.42, fish: true, fishKind: 'bass',
    L: { body: [16, 9], tail: [6, 3], neckLen: 1, neckAng: 0, head: [5, 4], leg: [3, 1] },
    hitZones: [{ dx: 4, dy: 0, r: 3.2 }, { dx: -3, dy: 0, r: 3 }],
    col: {
      top: '#20293a', mid: '#5a6d7c', belly: '#d8dcd2', line: '#101722',
      acc: '#8fa3ae', eye: '#2c2416', pat: '#182130', shade: '#48586a',
    },
    tailUp: 0,
  },
  herrie: {
    // the coelacanth that rules the surf: slow, colossal for a fish, and its
    // tail slap is a real weapon. No easy catch.
    name: 'Herrietopus', full: 'Herrietopus (imagined)', diet: 'carn', biped: false, scale: 1.15, fish: true, fishKind: 'coel', tailWeapon: true,
    L: { body: [42, 12], tail: [16, 7], neckLen: 1, neckAng: 0, head: [12, 7], leg: [4, 1] },
    hitZones: [{ dx: 14, dy: 0, r: 5.5 }, { dx: 0, dy: 0, r: 6.5 }, { dx: -14, dy: 0, r: 5.5 }, { dx: -24, dy: 0, r: 4.5 }],
    col: {
      top: '#2c3c52', mid: '#4c5f7a', belly: '#b8c2cc', line: '#121c28',
      acc: '#e8ecf0', eye: '#d8c860', pat: '#1e2c40', shade: '#3e5068',
    },
    tailUp: 0,
  },
  scutelich: {
    // a little basking cruiser with a bony skull-shield: head hits glance
    // off — it just swims away
    name: 'Scutelocephalichthyus', full: 'Scutelocephalichthyus (imagined)', diet: 'carn', biped: false, scale: 0.6, fish: true, fishKind: 'shark',
    L: { body: [26, 8], tail: [9, 4], neckLen: 1, neckAng: 0, head: [8, 5], leg: [3, 1] },
    hitZones: [{ dx: 8, dy: 0, r: 3.4 }, { dx: 0, dy: 0, r: 3.6 }, { dx: -8, dy: 0, r: 2.8 }],
    col: {
      top: '#4a5560', mid: '#77828c', belly: '#dee2e0', line: '#1c232a',
      acc: '#cfd2c0', eye: '#20262c', pat: '#39434e', shade: '#636e78',
    },
    tailUp: 0,
  },
  pinaco: {
    // ankylosaur: a walking boulder with a hammer on the end
    name: 'Pinacosaurus', full: 'Pinacosaurus grangeri', diet: 'herb', biped: false, scale: 1.1,
    L: { body: [50, 24], tail: [42, 9], neckLen: 8, neckAng: 0.18, head: [14, 9], leg: [14, 6] },
    col: {
      top: '#4c4438', mid: '#7a6e58', belly: '#d0c4a4', line: '#201b14',
      acc: '#c9a86a', eye: '#3c3018', pat: '#3a342a', shade: '#665c48',
    },
    tailUp: 0.12, scutes: true, tailWeapon: true, tailClub: true, pattern: 'band',
  },

  // ---------------- LERTENTOUS DELTA ----------------
  magnapaulia: {
    // giant Mexican lambeosaurine: a wall of muscle that answers teeth with tail
    name: 'Magnapaulia', full: 'Magnapaulia laticaudus', diet: 'herb', biped: true, scale: 1.45,
    L: { body: [54, 30], tail: [52, 11], neckLen: 14, neckAng: 0.5, head: [19, 10], leg: [26, 8] },
    col: {
      top: '#6e4a30', mid: '#a2764a', belly: '#ecdcb4', line: '#2c1a0c',
      acc: '#c25438', eye: '#4a3c22', pat: '#54341c', shade: '#8a6440',
    },
    tailUp: 0.24, armScale: 1.25, arch: 1, forageQuad: true, tailWeapon: true, duckbill: true, fanCrest: 0.75, pattern: 'band',
  },
  panoplo: {
    // nodosaur: no club, no hurry — shoulder spikes and patience
    name: 'Panoplosaurus', full: 'Panoplosaurus mirus', diet: 'herb', biped: false, scale: 1.0,
    L: { body: [48, 22], tail: [34, 8], neckLen: 8, neckAng: 0.18, head: [14, 9.5], leg: [13, 5.5] },
    col: {
      top: '#4e4a34', mid: '#7d7654', belly: '#d6cca4', line: '#1e1c10',
      acc: '#cbb684', eye: '#3c3018', pat: '#3a3626', shade: '#686248',
    },
    tailUp: 0.1, scutes: true, shoulderSpine: true, pattern: 'band',
  },
  proto: {
    // the crested menace: knee-high, beaked, and absolutely furious
    name: 'Protoceratops', full: 'Protoceratops andrewsi', diet: 'herb', biped: false, scale: 0.62,
    L: { body: [28, 14], tail: [20, 6], neckLen: 6, neckAng: 0.2, head: [13, 9], leg: [11, 4] },
    col: {
      top: '#8a6438', mid: '#b8945c', belly: '#eee2c0', line: '#33230f',
      acc: '#c9703a', eye: '#4a3218', pat: '#6a4a26', shade: '#9c7c4a',
    },
    tailUp: 0.15, frill: 'plain', pattern: 'dapple',
  },
  atlas: {
    // the first sauropod in the game: leggy, dune-colored, and far too big
    // to argue with — the delta's walking mountain
    name: 'Atlasaurus', full: 'Atlasaurus imelakei', diet: 'herb', biped: false, scale: 1.9,
    L: { body: [66, 32], tail: [56, 11], neckLen: 36, neckAng: 0.7, head: [11, 7.5], leg: [30, 9] },
    col: {
      top: '#8a744a', mid: '#b59c68', belly: '#f0e6c6', line: '#332a12',
      acc: '#c9a86a', eye: '#3c3018', pat: '#6e5a36', shade: '#9c8656',
    },
    tailUp: 0.22, neckW: 0.58, neckArc: 0.05, sauroHead: true, beak: false, foreLift: 0.55,
    snoutW: 0.42, snoutMidW: 0.56, highBrowse: true, pattern: 'dapple',
  },
  dakota: {
    // big slate raptor: hunts in packs, and the pack fears nothing at all
    name: 'Dakotaraptor', full: 'Dakotaraptor steini', diet: 'carn', biped: true, scale: 0.78,
    L: { body: [30, 14], tail: [36, 5.5], neckLen: 10, neckAng: 0.5, head: [14, 8.5], leg: [21, 4.6] },
    col: {
      top: '#33383f', mid: '#5a6068', belly: '#dcd8ca', line: '#14181e',
      acc: '#e8e2d0', eye: '#e8d878', pat: '#22262c', shade: '#484e56',
    },
    tailUp: 0.34, fuzz: true, plume: true, pattern: 'streak',
  },
  yuty: {
    // the feathered tyrant: snow-buff coat, robust skull, a bite with a name
    name: 'Yutyrannus', full: 'Yutyrannus huali', diet: 'carn', biped: true, scale: 1.3,
    L: { body: [50, 26], tail: [48, 10], neckLen: 11, neckAng: 0.35, head: [21, 13], leg: [26, 7.5] },
    col: {
      top: '#8a7c62', mid: '#b3a486', belly: '#f0e8d2', line: '#33291a',
      acc: '#d88a3a', eye: '#e8c25a', pat: '#5c5240', shade: '#9c8e70',
    },
    tailUp: 0.3, fuzz: true, snoutBumps: true, armScale: 0.7, pattern: 'stripes',
  },
  oloro: {
    // 'titanic swan': the long-necked lambeosaurine with the fan crest —
    // the delta's answer to Charonosaurus
    name: 'Olorotitan', full: 'Olorotitan arharensis', diet: 'herb', biped: true, scale: 1.35,
    L: { body: [52, 28], tail: [50, 10.5], neckLen: 15, neckAng: 0.55, head: [18, 9.5], leg: [25, 7.5] },
    col: {
      top: '#46525c', mid: '#74828c', belly: '#e2e2d2', line: '#1a2228',
      acc: '#c24a44', eye: '#4a3c26', pat: '#343f48', shade: '#5f6c76',
    },
    tailUp: 0.24, armScale: 1.25, arch: 1, forageQuad: true, tailWeapon: true, duckbill: true, fanCrest: 1.25, pattern: 'stripes',
  },
  wuerho: {
    // massive flat-plated stegosaur: smacks with the tail, and — unusually
    // for its kind — will take a bite out of anything that stands at its face
    name: 'Wuerhosaurus', full: 'Wuerhosaurus homheni', diet: 'herb', biped: false, scale: 1.3,
    L: { body: [56, 26], tail: [48, 10], neckLen: 10, neckAng: 0.2, head: [12.5, 9], leg: [16, 6.5] },
    col: {
      top: '#4a4632', mid: '#767048', belly: '#d8d0a4', line: '#1c1a0e',
      acc: '#c9903c', eye: '#4a3c22', pat: '#35321f', shade: '#635e3c',
    },
    tailUp: 0.14, plates: true, plateMul: 0.55, tailWeapon: true, pattern: 'band',
  },
  sino: {
    // brick-red ceratopsian that answers threats at a dead run
    name: 'Sinoceratops', full: 'Sinoceratops zhuchengensis', diet: 'herb', biped: false, scale: 1.15,
    L: { body: [52, 26], tail: [26, 9], neckLen: 8, neckAng: 0.15, head: [20, 13], leg: [17, 6.5] },
    col: {
      top: '#6e3a28', mid: '#a2603c', belly: '#e6cc9c', line: '#2c140a',
      acc: '#7e4028', eye: '#4a3218', pat: '#54291a', shade: '#8a5232',
    },
    tailUp: 0.1, frill: 'plain', noseHorn: 1.3, headButt: true, pattern: 'dapple',
  },
  lourinha: {
    // Portuguese allosauroid: strong jaws, stronger grudge — its bite opens
    // wounds that do not close
    name: 'Lourinhanosaurus', full: 'Lourinhanosaurus antunesi', diet: 'carn', biped: true, scale: 1.15,
    L: { body: [46, 23], tail: [46, 9], neckLen: 11, neckAng: 0.32, head: [19, 11.5], leg: [26, 7] },
    col: {
      top: '#565232', mid: '#8a8452', belly: '#e8e0b8', line: '#242010',
      acc: '#c8443a', eye: '#e8c25a', pat: '#3e3a20', shade: '#746e44',
    },
    tailUp: 0.32, armScale: 0.85, pattern: 'stripes',
  },
  onchop: {
    // the sawfish: a flattened cruiser with a toothed blade for a face.
    // Lethal, and permanently furious about something
    name: 'Onchopristis', full: 'Onchopristis numida', diet: 'carn', biped: false, scale: 1.05, fish: true, fishKind: 'saw',
    L: { body: [40, 9], tail: [12, 4], neckLen: 1, neckAng: 0, head: [14, 4], leg: [3, 1] },
    hitZones: [{ dx: 16, dy: 0, r: 3.5 }, { dx: 2, dy: 0, r: 4.2 }, { dx: -12, dy: 0, r: 3.2 }],
    col: {
      top: '#5c5a48', mid: '#8c8870', belly: '#e2ded0', line: '#26241a',
      acc: '#d8d2b8', eye: '#2c2416', pat: '#44422f', shade: '#767258',
    },
    tailUp: 0,
  },
  mawsonia: {
    // the greatest coelacanth that ever lived: a slab of the river given fins.
    // Slow, colossal, and very hard to convince of anything
    name: 'Mawsonia', full: 'Mawsonia gigas', diet: 'carn', biped: false, scale: 1.9, fish: true, fishKind: 'coel', tailWeapon: true,
    L: { body: [44, 13], tail: [17, 8], neckLen: 1, neckAng: 0, head: [13, 8], leg: [4, 1] },
    hitZones: [{ dx: 15, dy: 0, r: 6 }, { dx: 0, dy: 0, r: 7 }, { dx: -15, dy: 0, r: 6 }, { dx: -26, dy: 0, r: 5 }],
    col: {
      top: '#2c443c', mid: '#4c6a5c', belly: '#c2ccc0', line: '#12201a',
      acc: '#e8ece2', eye: '#d8c860', pat: '#1e332a', shade: '#3e584c',
    },
    tailUp: 0,
  },
  centro: {
    // the delta's starter tank: one great nose horn and no sense of retreat
    name: 'Centrosaurus', full: 'Centrosaurus apertus', diet: 'herb', biped: false, scale: 1.05,
    L: { body: [50, 25], tail: [28, 9], neckLen: 8, neckAng: 0.15, head: [19, 12.5], leg: [17, 6.5] },
    col: {
      top: '#6a4a2c', mid: '#9c7444', belly: '#e8d8ac', line: '#2a180a',
      acc: '#c9963c', eye: '#4a3218', pat: '#523618', shade: '#87643a',
    },
    tailUp: 0.1, frill: 'plain', noseHorn: 1.6, headButt: true, pattern: 'band',
  },
  loki: {
    // Centrosaurus, but cooler: midnight coat and the blade horns of Loki
    name: 'Lokiceratops', full: 'Lokiceratops rangiformis', diet: 'herb', biped: false, scale: 1.12,
    L: { body: [52, 26], tail: [30, 9], neckLen: 8, neckAng: 0.15, head: [20, 13], leg: [17.5, 6.8] },
    col: {
      top: '#333a4a', mid: '#586178', belly: '#dcdcd0', line: '#131722',
      acc: '#d8b45c', eye: '#e8c25a', pat: '#232936', shade: '#485064',
    },
    tailUp: 0.1, frill: 'plain', lokiHorns: true, headButt: true, pattern: 'stripes',
  },
  moro: {
    // the playable sauropod: sage-green, whip-tailed, and — eventually —
    // beyond nearly everything's appetite
    name: 'Morosaurus', full: 'Morosaurus impar', diet: 'herb', biped: false, scale: 1.75,
    L: { body: [62, 30], tail: [58, 11], neckLen: 26, neckAng: 0.6, head: [11.5, 8], leg: [26, 8.5] },
    col: {
      top: '#4c5c38', mid: '#7a8c58', belly: '#e6e6c0', line: '#1e2812',
      acc: '#a8b070', eye: '#3c3018', pat: '#3a4a28', shade: '#68794a',
    },
    tailUp: 0.24, tailWeapon: true, neckW: 0.62, neckArc: 0.05, sauroHead: true, beak: false,
    snoutW: 0.44, snoutMidW: 0.58, highBrowse: true, pattern: 'dapple',
  },
  spino: {
    // the undisputed apex, built to the Prior Extinction maroccanus: scaly
    // and crocodilian, M-shaped sail, upward-arcing neck with a throat
    // dewlap, its own skull (nasal crest, rosette snout, interlocking teeth,
    // far-back slit nostrils), thick tail base — and it fights with the
    // jaws AND the clawed arms together
    name: 'Spinosaurus', full: 'Spinosaurus maroccanus', diet: 'carn', biped: true, scale: 1.5,
    L: { body: [56, 25], tail: [64, 10], neckLen: 12, neckAng: 0.4, head: [26, 10.5], leg: [20, 7.5] },
    col: {
      top: '#3a4450', mid: '#647084', belly: '#ece4c4', line: '#161c26',
      acc: '#d84a30', eye: '#e8c25a', pat: '#28303e', shade: '#525e70',
    },
    tailUp: 0.2, armScale: 1.15, mSail: true, paddleTail: true, snoutW: 0.3, snoutMidW: 0.42,
    neckArc: 0.13, dewlap: true, crocTeeth: true, nostrilBack: true,
    bigClaws: true, clawLen: 6.5, armSwipe: true, armAndJaw: true, pattern: 'stripes',
  },
  omni: {
    // fast, strong, cheap: the working raptor of the delta islands
    name: 'Omniraptor', full: 'Omniraptor lertentous (imagined)', diet: 'carn', biped: true, scale: 0.95,
    L: { body: [36, 16], tail: [42, 6], neckLen: 11, neckAng: 0.45, head: [16, 9.5], leg: [24, 5.5] },
    col: {
      top: '#3c4c34', mid: '#647a52', belly: '#e4e0be', line: '#18220f',
      acc: '#d8b44a', eye: '#e8d878', pat: '#2a3822', shade: '#556848',
    },
    tailUp: 0.32, fuzz: true, plume: true, pattern: 'mask',
  },
  tyranno: {
    // carcharodontosaurid land apex, built to the Prior Extinction
    // Carcharodontosaurus likeness: a DEEP narrow shark-toothed skull under
    // heavy rugose brow bosses, low spine ridge, maroon and bone
    name: 'Tyrannotitan', full: 'Tyrannotitan chubutensis', diet: 'carn', biped: true, scale: 1.42,
    L: { body: [60, 27], tail: [60, 10], neckLen: 11, neckAng: 0.3, head: [27, 13], leg: [26, 8] },
    col: {
      top: '#5c2c24', mid: '#8a4a3a', belly: '#e8d4ae', line: '#26100c',
      acc: '#d8b48a', eye: '#e8c25a', pat: '#40201a', shade: '#763d30',
    },
    tailUp: 0.3, armScale: 0.6, browRidge: true, skullArch: true, snoutW: 0.19, snoutMidW: 0.52, pattern: 'stripes',
  },
  aardi: {
    // the son's own invention: a scruffy little burrow-raider — feather coat
    // over the whole upper body that stops dead at the bare belly, and a
    // great fox-brush of a tail
    name: 'Aardiraptor', full: 'Aardiraptor fossor (imagined)', diet: 'carn', biped: true, scale: 0.62,
    L: { body: [26, 13], tail: [26, 5], neckLen: 8, neckAng: 0.5, head: [11, 8], leg: [16, 4] },
    col: {
      top: '#6b4e2e', mid: '#9a7648', belly: '#e8dcbc', line: '#2a1c0e',
      acc: '#d8b878', eye: '#e8c25a', pat: '#4a3520', shade: '#7e6038',
    },
    tailUp: 0.34, fuzz: true, featherCoat: true, bushyTail: true, armScale: 0.9, pattern: 'mask',
  },
  eotrach: {
    // the oldest duckbill: tough, hardy, and built to outlast the delta
    name: 'Eotrachodon', full: 'Eotrachodon orientalis', diet: 'herb', biped: true, scale: 1.15,
    L: { body: [48, 27], tail: [46, 10], neckLen: 13, neckAng: 0.45, head: [18, 10], leg: [23, 7] },
    col: {
      top: '#5c5c30', mid: '#8f8c50', belly: '#e8e2b4', line: '#24240f',
      acc: '#c9a03c', eye: '#4a3c22', pat: '#454522', shade: '#787646',
    },
    tailUp: 0.24, armScale: 1.2, arch: 1, forageQuad: true, tailWeapon: true, duckbill: true, pattern: 'dapple',
  },
  fluvio: {
    // the river barge: an invented hippo-heavy iguanodont — all belly and
    // bad temper, with a thumb spike for anyone who tests it. Grazes on all
    // fours, and rears right up on its hind legs to strip the canopy.
    name: 'Fluviodon', full: 'Fluviodon ponderosus (imagined)', diet: 'herb', biped: true, scale: 1.35,
    L: { body: [52, 28], tail: [36, 10], neckLen: 11, neckAng: 0.45, head: [14, 9], leg: [17, 8] },
    col: {
      top: '#6e5f56', mid: '#9a8579', belly: '#ecc9b8', line: '#241c16',
      acc: '#d09280', eye: '#3a2d24', pat: '#57493f', shade: '#82706a',
    },
    tailUp: 0.18, armScale: 1.35, bigClaws: true, clawLen: 5.5, clawWeapon: true,
    forageQuad: true, arch: 0.4, snoutW: 0.5, snoutMidW: 0.62, pattern: 'band',
  },
};

// ---------------------------------------------------------------------------
// shared helpers (public API used by other files is unchanged)
// ---------------------------------------------------------------------------
function headWorldPos(e) {
  const d = DINO[e.species], L = d.L;
  const s = d.scale * sizeScale(e.growth != null ? e.growth : 1);
  const fwd = (L.body[0] * 0.38 + Math.cos(L.neckAng) * L.neckLen + L.head[0] * 0.35) * s;
  const up = (L.leg[0] + L.body[1] * 0.55 + Math.sin(L.neckAng) * L.neckLen) * s;
  return { x: e.x + (e.facing || 1) * fwd, y: e.y - up };
}
function bodyRadius(e) {
  const d = DINO[e.species];
  return d.L.body[0] * 0.32 * d.scale * sizeScale(e.growth != null ? e.growth : 1);
}
function drawShadow(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(24,20,8,0.26)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1.5, w, Math.max(2, w * 0.3), 0, 0, TAU);
  ctx.fill();
}

// small deterministic rng for texture speckles
function speckleRng(seed) {
  let n = seed >>> 0;
  return () => {
    n ^= n << 13; n >>>= 0; n ^= n >> 17; n ^= n << 5; n >>>= 0;
    return n / 4294967296;
  };
}

// two-bone IK: returns knee position between hip and foot
function legIK(hx, hy, fx, fy, l1, l2, bend) {
  let dx = fx - hx, dy = fy - hy;
  let d = Math.hypot(dx, dy);
  const maxD = (l1 + l2) * 0.999;
  if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; fx = hx + dx; fy = hy + dy; }
  if (d < 0.001) d = 0.001;
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const base = Math.atan2(dy, dx);
  const ang = base + a * bend;
  return { kx: hx + Math.cos(ang) * l1, ky: hy + Math.sin(ang) * l1, fx, fy };
}

// smooth closed path through offset points of a spine
function skinPath(pts) {
  // pts: array of {x, y, w} ordered tail -> snout
  const top = [], bot = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)];
    let dx = p1.x - p0.x, dy = p1.y - p0.y;
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;   // normal (up when heading right)
    const p = pts[i];
    top.push({ x: p.x - nx * p.w, y: p.y - ny * p.w });
    bot.push({ x: p.x + nx * p.w, y: p.y + ny * p.w });
  }
  const path = new Path2D();
  const smooth = (arr, start) => {
    for (let i = start; i < arr.length - 1; i++) {
      const mx = (arr[i].x + arr[i + 1].x) / 2, my = (arr[i].y + arr[i + 1].y) / 2;
      path.quadraticCurveTo(arr[i].x, arr[i].y, mx, my);
    }
    path.lineTo(arr[arr.length - 1].x, arr[arr.length - 1].y);
  };
  path.moveTo(top[0].x, top[0].y);
  smooth(top, 1);
  smooth(bot.slice().reverse(), 0);
  path.closePath();
  return { path, top, bot };
}

// wavy horizontal band fill (for cel-shading with an organic edge)
function bandFill(ctx, color, yEdge, wave, seedPhase, x0, x1, yBottom) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0, yEdge);
  const n = 9;
  for (let i = 1; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    ctx.lineTo(x, yEdge + Math.sin(i * 1.9 + seedPhase) * wave);
  }
  ctx.lineTo(x1, yBottom);
  ctx.lineTo(x0, yBottom);
  ctx.closePath();
  ctx.fill();
}

// gender coats: males advertise — every color saturated and brightened, the
// accent (crest, sail, wattle) loudest of all; females blend in — the same
// palette pulled toward a dusty grey-brown. Outline and eye stay untouched so
// both still read as the species. Computed once per species+gender.
const GENDER_SKINS = {};
function satLum(hex, sat, lum) {
  const [r, g, b] = hexRGB(hex);
  const l = r * 0.3 + g * 0.59 + b * 0.11;
  return rgbHex(Math.round((l + (r - l) * sat) * lum),
    Math.round((l + (g - l) * sat) * lum),
    Math.round((l + (b - l) * sat) * lum));
}
function genderSkin(key, gender) {
  const d = DINO[key];
  if (!gender || !GENDER_MOD[gender]) return d.col;
  const id = key + ':' + gender;
  if (!GENDER_SKINS[id]) {
    const c = d.col, out = {};
    for (const k in c) {
      out[k] = k === 'line' || k === 'eye' ? c[k]
        : gender === 'm' ? satLum(c[k], 1.45, 1.06)
          : satLum(c[k], 0.55, 0.96);
    }
    if (gender === 'm') out.acc = satLum(c.acc, 1.85, 1.16);
    GENDER_SKINS[id] = out;
  }
  return GENDER_SKINS[id];
}

// ---------------------------------------------------------------------------
// skins: cosmetic coats picked in the lobby, one square per skin. Every dino
// has 'default' (the species palette + gender coat) and 'ripcel' (the body
// sunk toward black, navy flank stripes, shining lime dots). Add a skin here
// + a palette branch in skinColors (+ a drawPattern branch if it repaints the
// markings) and every playable's picker grows a new square.
// ---------------------------------------------------------------------------
const SKINS = {
  default: { name: 'Classic' },
  ripcel: { name: 'Ripcel', cost: 100 },   // cost is per species, paid in ❖
  // jungell: tyrannotitan's jungle coat — brown, green, and shining lime
  // (`only` restricts a skin to a single species' picker)
  jungell: { name: 'Jungell', cost: 100, only: 'tyranno' },
};
function skinColors(key, gender, skinId) {
  if (!skinId || skinId === 'default' || !SKINS[skinId]) return genderSkin(key, gender);
  const id = key + ':' + (gender || 'n') + ':' + skinId;
  if (!GENDER_SKINS[id]) {
    const c = DINO[key].col, out = {};
    if (skinId === 'jungell') {
      // jungell: mossy green over brown flanks, lime highlights — the coat is
      // blended toward the jungle so a whisper of the species' color survives
      const J = {
        top: '#465c24', mid: '#7c6b38', belly: '#dde4a6', shade: '#575328',
        pat: '#2f461c', acc: '#9fe434', eye: '#d6ff6a', line: '#1c1a0a',
      };
      for (const k in c) out[k] = J[k] ? mixHex(c[k], J[k], 0.82) : c[k];
    } else {
      // ripcel: the species' own colors sunk toward black — silhouette and
      // extras keep a ghost of their identity instead of going flat
      for (const k in c) out[k] = mixHex(c[k], '#0d0f13', k === 'belly' ? 0.7 : 0.84);
      out.line = '#04050a';
      out.acc = '#a8e83c';    // shining lime
      out.pat = '#2a3f8f';    // navy stripes
      out.eye = '#d6ff6a';
    }
    // same rule as the coats: she mutes it, he turns it all the way up
    if (gender === 'm') for (const k in out) { if (k !== 'line') out[k] = satLum(out[k], 1.35, 1.06); }
    else if (gender === 'f') for (const k in out) { if (k !== 'line') out[k] = satLum(out[k], 0.55, 0.96); }
    GENDER_SKINS[id] = out;
  }
  return GENDER_SKINS[id];
}

// ---------------------------------------------------------------------------
// the illustration engine
// ---------------------------------------------------------------------------
function drawDino(ctx, key, o) {
  if (DINO[key].fish) { drawFish(ctx, key, o); return; }
  const d = DINO[key], L = d.L, C = skinColors(key, o.gender, o.skin);
  const g = o.growth != null ? o.growth : 1;
  const s = d.scale * sizeScale(g) * ((GENDER_MOD[o.gender] || GENDER_NEUTRAL).size);
  const headMul = 1 + 0.95 * Math.pow(1 - g, 1.4);
  const eyeMul = 1 + 1.9 * Math.pow(1 - g, 1.6);
  const move = o.move || 0, ph = o.phase || 0;
  const breathe = Math.sin(G.time * 2.1 + (o.x || 0) * 0.05) * 0.5 * (1 - move);
  const bob = Math.sin(ph * 2) * 1.1 * move * Math.min(1, s) + breathe * Math.min(1, s);
  const atk = o.attackT || 0;
  const hd = o.headDown || 0;
  // tail-fighters whip the tail, claw-fighters swipe the arms, headbutters
  // (ceratopsians) toss the whole head — jaws shut for all three; only true
  // biters lunge with open mouths
  let lunge = d.tailWeapon || d.clawWeapon || d.headButt ? 0 : Math.sin(atk * Math.PI);
  // a browsing sauropod nibbles at the canopy — a soft jaw flutter, head high
  if (o.headUp > 0.3) lunge = Math.max(lunge, (0.5 + 0.5 * Math.sin(G.time * 6)) * 0.18 * o.headUp);
  // swallowing: head thrown back, jaws snapping fast as the food goes down
  if (o.gulp) lunge = Math.max(lunge, (0.5 + 0.5 * Math.sin(G.time * 13)) * 0.5);
  const tailAtk = d.tailWeapon ? atk : 0;
  // the horn toss: driven fully forward-up at the hit frame (damage is
  // instant), recoiling through and settling — same profile as the tail whip
  const ramPh = d.headButt && atk > 0 ? 1 - atk : -1;
  const ram = ramPh >= 0 ? (1 - ramPh) * Math.sin((0.25 + ramPh * 1.1) * TAU) : 0;

  const bodyL = L.body[0] * s, bodyH = L.body[1] * s;
  const legLen = L.leg[0] * s, legW = Math.max(1.3, L.leg[1] * s);
  // resting: the whole body settles toward the ground; the legs, whose
  // segment lengths derive from hip height, fold under it on their own
  const rest = o.restT || 0;
  const cy = -(legLen + bodyH * 0.42) + bob + rest * legLen * 0.62;
  const lineW = Math.max(0.75, Math.min(1.5, 1.05 * s));

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(o.facing || 1, 1);
  // heading pitch: the nose leads into diagonal/vertical movement,
  // rotating around the body's centre of mass with a hint of foreshortening
  // (foraging quadrupeds also rock forward when their head goes down)
  const pitch = (o.pitch || 0) + (d.forageQuad ? hd * 0.12 : 0);
  if (pitch) {
    ctx.scale(1 - 0.1 * Math.min(1, Math.abs(pitch) / 0.45), 1);
    ctx.translate(0, cy);
    ctx.rotate(pitch);
    ctx.translate(0, -cy);
  }
  if (o.hurtT > 0 && Math.floor(o.hurtT * 24) % 2 === 0) ctx.globalAlpha = 0.55;

  // ---------------- skeleton anchors ----------------
  // foreLift (atlasaurus): the giraffe posture — shoulders carried high on
  // long front legs, the whole back sloping down toward the hips.
  // o.rear is the DYNAMIC version of the same lift: a browser rearing up
  // on its hind legs to reach the canopy, easing back down afterwards
  const fl = ((d.foreLift || 0) + (o.rear || 0) * 0.7) * bodyH;
  const hipX = -bodyL * 0.22, hipY = cy + bodyH * 0.16;
  // quad front shoulder — shFwd lets a species carry its forelimbs further
  // forward on the body (the brachiosaur front-heavy stance)
  const shX = bodyL * (0.27 + (d.shFwd || 0)), shY = cy + bodyH * 0.18 - fl * 0.62;
  const neckBase = { x: bodyL * 0.36, y: cy - bodyH * 0.14 - fl * 0.6 };
  // foraging quadrupeds keep a gentler neck bend — the lowered body does the rest
  const hdN = hd * (d.forageQuad ? 0.62 : 1);
  let nAng = lerp(L.neckAng, -0.6, hdN);
  // canopy browsing (sauropods): the neck cranes UP into the trees instead —
  // its own animation, nothing like the head-down graze
  const hu = o.headUp || 0;
  if (hu > 0.01) nAng = lerp(nAng, 1.3, hu);
  // idle head scanning: standing animals slowly look around
  nAng += Math.sin(G.time * 0.55 + (o.x || 0) * 0.045) * 0.055 * (1 - move) * (1 - hd);
  // neckGrow (nivalotitan): hatchlings carry a proportionally SHORT neck and
  // grow into the full tower — the 2×-body neck is earned, not hatched with
  const nl = L.neckLen * s * (d.neckGrow ? 0.55 + 0.45 * g : 1);
  const headC = {
    x: neckBase.x + Math.cos(nAng) * nl + (lunge * 5 + ram * 6) * s,
    y: Math.min(neckBase.y - Math.sin(nAng) * nl + hdN * legLen * 0.85 - ram * 3 * s, -3.5 * s),
  };
  const headAng = -nAng * 0.35 + hdN * 0.8 - ram * 0.55;  // head pitch (the ram tips the horn up)
  const hl = L.head[0] * s * headMul, hh = L.head[1] * s * headMul;
  const cosH = Math.cos(headAng), sinH = Math.sin(headAng);
  const hPt = (fx, fy) => ({                              // head-local -> local
    x: headC.x + fx * hl * cosH - fy * hh * sinH,
    y: headC.y + fx * hl * sinH + fy * hh * cosH,
  });
  const snout = hPt(0.72, 0.02);

  // ---------------- legs ----------------
  function footPose(off, stride, baseX) {
    const sw = Math.sin(ph + off);
    // planted foot (sw < 0) travels backward under the body; lifted foot swings forward
    const fx = baseX - Math.cos(ph + off) * stride * move + (1 - move) * (off > 2 ? -1.5 : 3.5) * s;
    const lift = Math.max(0, sw) * 3.2 * move * Math.min(1.2, s);
    return { x: fx, y: -lift };
  }
  function drawLeg(hx, hy, off, stride, far, front) {
    // segment lengths sized from the actual hip height so the IK always bends
    const reach = -hy;
    const ll1 = reach * 0.6, ll2 = reach * 0.68;
    const f = footPose(off, stride, hx + (front ? 1 : 2.5) * s);
    const ik = legIK(hx, hy, f.x, f.y, ll1, ll2, front ? 0.55 : -0.6); // hind knee forward, front elbow back
    // near leg: body color so it reads as the same animal; far leg: shaded
    const body = far ? shade(C.mid, 0.6) : C.mid;
    const dark = far ? shade(C.line, 1.35) : C.line;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const tw = legW * (front ? 0.65 : 1.3);       // half-width at hip
    const kw = legW * (front ? 0.45 : 0.6);       // half-width at knee
    const aw = legW * 0.34;                       // half-width at ankle
    {
      const hyIn = hy - legW * 0.6;               // anchor pulled up into the body mass
      const d1x = ik.kx - hx, d1y = ik.ky - hyIn;
      const l1n = Math.hypot(d1x, d1y) || 1;
      const p1x = -d1y / l1n, p1y = d1x / l1n;
      const d2x = ik.fx - ik.kx, d2y = ik.fy - ik.ky;
      const l2n = Math.hypot(d2x, d2y) || 1;
      const p2x = -d2y / l2n, p2y = d2x / l2n;
      const trace = (path) => {
        path.moveTo(hx - p1x * tw, hyIn - p1y * tw);
        path.quadraticCurveTo(                                     // outer thigh bulge
          hx + d1x * 0.45 - p1x * tw * 1.65, hyIn + d1y * 0.45 - p1y * tw * 1.65,
          ik.kx - p2x * kw, ik.ky - p2y * kw);
        path.quadraticCurveTo(                                     // outer shin
          ik.kx + d2x * 0.5 - p2x * kw * 1.05, ik.ky + d2y * 0.5 - p2y * kw * 1.05,
          ik.fx - p2x * aw, ik.fy - p2y * aw - 0.6);
        path.lineTo(ik.fx + p2x * aw, ik.fy + p2y * aw - 0.6);
        path.quadraticCurveTo(                                     // inner shin (back of calf)
          ik.kx + d2x * 0.5 + p2x * kw, ik.ky + d2y * 0.5 + p2y * kw,
          ik.kx + p2x * kw, ik.ky + p2y * kw);
        path.quadraticCurveTo(                                     // inner thigh
          hx + d1x * 0.4 + p1x * tw * 1.15, hyIn + d1y * 0.4 + p1y * tw * 1.15,
          hx + p1x * tw, hyIn + p1y * tw);
      };
      const fillP = new Path2D();
      trace(fillP);
      fillP.closePath();
      ctx.fillStyle = body;
      ctx.fill(fillP);
      // stroke only the limb contour (open path) so no seam cuts across the body
      const strokeP = new Path2D();
      trace(strokeP);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lineW * 0.85;
      ctx.stroke(strokeP);
      // soft thigh shading crease
      if (!far && !front) {
        ctx.strokeStyle = 'rgba(20,12,4,0.25)';
        ctx.lineWidth = lineW * 0.7;
        ctx.beginPath();
        ctx.moveTo(hx + p1x * tw * 0.5, hyIn + p1y * tw * 0.55 + legW * 0.5);
        ctx.quadraticCurveTo(
          hx + d1x * 0.45, hyIn + d1y * 0.5 + legW * 0.3,
          ik.kx + p2x * kw * 0.4, ik.ky + p2y * kw * 0.4);
        ctx.stroke();
      }
    }
    ctx.fillStyle = body;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lineW * 0.85;
    // foot: low wedge with toes, planted on the ground
    const tl = legW * (front ? 1.2 : 1.7);
    ctx.beginPath();
    ctx.moveTo(ik.fx - legW * 0.35, ik.fy - legW * 0.42);
    ctx.quadraticCurveTo(ik.fx + tl * 0.5, ik.fy - legW * 0.5, ik.fx + tl, ik.fy - 0.6);
    ctx.lineTo(ik.fx + tl + 1.1 * s, ik.fy);
    ctx.lineTo(ik.fx - legW * 0.35, ik.fy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // toe separation + claws
    ctx.strokeStyle = dark;
    ctx.lineWidth = lineW * 0.6;
    ctx.beginPath();
    ctx.moveTo(ik.fx + tl * 0.55, ik.fy - legW * 0.3);
    ctx.lineTo(ik.fx + tl * 0.45, ik.fy);
    ctx.stroke();
    ctx.fillStyle = dark;
    for (let i = 0; i < 2; i++) {
      const cxx = ik.fx + tl * (0.6 + i * 0.42);
      ctx.beginPath();
      ctx.moveTo(cxx, ik.fy - 1.1 * s);
      ctx.lineTo(cxx + 1.4 * s, ik.fy);
      ctx.lineTo(cxx - 0.6 * s, ik.fy);
      ctx.closePath(); ctx.fill();
    }
  }

  // far-side limbs (foraging quadrupeds put their forelimbs down to graze)
  const quadNow = !d.biped || (d.forageQuad && hd > 0.4);
  drawLeg(hipX, hipY, Math.PI, legLen * 0.42, true, false);
  if (quadNow) drawLeg(shX, shY, Math.PI * 1.55, legLen * 0.36, true, true);

  // ---------------- spine & silhouette ----------------
  const tailLen = L.tail[0] * s;
  const tailBaseW = bodyH * 0.34;
  // walking sway plus a slow idle swish so standing dinos stay alive
  const sway = (t) => Math.sin(ph * 0.85 + t * 2.4) * 1.2 * Math.min(1.3, s) * t
    + Math.sin(G.time * 1.5 + t * 2.1 + (o.x || 0) * 0.05) * 1.7 * Math.min(1.3, s) * t * (1 - move);
  // the tail whip: starts already wound up high the instant the attack lands,
  // slams down through neutral, follows through below and settles — amplitude
  // grows toward the tip so the whole tail (thagomizer and all) visibly swings
  const swingPh = tailAtk > 0 ? 1 - tailAtk : 0;   // 0 → 1 across the swing
  const swingY = (t) => tailAtk > 0
    ? -(1 - swingPh) * Math.sin((0.25 + swingPh * 1.1) * TAU) * bodyH * 0.62 * Math.pow(t, 1.3)
    : 0;
  const tailY = (t) => cy - d.tailUp * tailLen * 0.34 * t + sway(t) + t * t * 1.5 * s + swingY(t);
  const pts = [];
  for (let i = 5; i >= 1; i--) {
    const t = i / 5;
    // paddle tails stay slender, then flare into a deep flat fin at the end;
    // the 0.82 keeps the flare from closing to a point, so the tip caps blunt
    const pad = d.paddleTail
      ? bodyH * 0.32 * Math.pow(Math.sin(clamp((t - 0.62) / 0.38, 0, 1) * Math.PI * 0.82), 0.75)
      : 0;
    pts.push({
      x: -bodyL * 0.42 - tailLen * t,
      y: tailY(t),
      w: Math.max(0.7 * s, tailBaseW * Math.pow(1 - t, 0.9) + 0.6 * s + pad),
    });
  }
  // ornithopods carry an arched back, highest over the hips; foreLift slopes
  // the whole torso up toward high shoulders instead (the atlasaurus stance);
  // chest deepens the FRONT of the torso into a brachiosaur keel — the body
  // is at its thickest right under the high shoulders instead of tapering
  const arch = d.arch || 0;
  const chest = d.chest || 0;
  pts.push({ x: -bodyL * 0.40, y: cy - bodyH * 0.02 + fl * 0.08, w: bodyH * 0.40 });
  pts.push({ x: -bodyL * 0.16, y: cy - bodyH * 0.09 * arch - fl * 0.12, w: bodyH * (0.5 + 0.06 * arch + 0.04 * chest) });
  pts.push({ x: bodyL * 0.14, y: cy - bodyH * 0.02 - fl * 0.36, w: bodyH * (0.47 - 0.04 * arch + 0.15 * chest) });
  pts.push({ x: bodyL * 0.34, y: cy - bodyH * 0.10 - fl * 0.58, w: bodyH * (0.38 - 0.05 * arch + 0.24 * chest) });
  // neck
  const nSeg = 3;
  const nW = d.neckW || 1;   // sauropods carry slender necks on huge bodies
  for (let i = 1; i <= nSeg; i++) {
    const t = i / (nSeg + 0.4);
    pts.push({
      x: lerp(neckBase.x, headC.x - hl * 0.18 * cosH, t),
      // neckArc bows the neck upward mid-length — the spinosaur S-curve
      y: lerp(neckBase.y, headC.y - hl * 0.18 * sinH, t) - Math.sin(t * Math.PI) * bodyH * (0.03 + (d.neckArc || 0) * (1 - hdN)),
      w: lerp(bodyH * 0.34 * nW, hh * 0.62, Math.pow(t, 0.8)),
    });
  }
  // skull: cranium bump then taper to snout — species can override the taper
  // (snoutW / snoutMidW) for thick blunt muzzles that never come to a point,
  // and skullArch bows the crown upward mid-snout (the carcharodontosaurid
  // Roman-nosed profile)
  const cr = hPt(-0.05, -0.06);
  const mi = hPt(0.34, d.skullArch ? -0.1 : 0.0);
  pts.push({ x: cr.x, y: cr.y, w: hh * 0.58 });
  pts.push({ x: mi.x, y: mi.y, w: hh * (d.snoutMidW || (d.diet === 'carn' ? 0.44 : 0.4)) });
  pts.push({ x: snout.x, y: snout.y, w: hh * (d.snoutW || (d.diet === 'carn' ? 0.26 : 0.2)) });

  const skin = skinPath(pts);

  // lower jaw (behind mouth wedge, drawn after body so it shows as chin/open jaw)
  const open = lunge * 0.55;
  const hinge = hPt(-0.02, 0.32);

  // silhouette fill + layered shading (clipped)
  ctx.fillStyle = C.mid;
  ctx.fill(skin.path);
  ctx.save();
  ctx.clip(skin.path);
  {
    // counter-shading that follows the animal: thick strokes along the
    // top and bottom outlines, half clipped away -> dorsal & belly bands
    const strokeAlong = (arr, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(arr[0].x, arr[0].y);
      for (let i = 1; i < arr.length - 1; i++) {
        const mx = (arr[i].x + arr[i + 1].x) / 2, my = (arr[i].y + arr[i + 1].y) / 2;
        ctx.quadraticCurveTo(arr[i].x, arr[i].y, mx, my);
      }
      ctx.lineTo(arr[arr.length - 1].x, arr[arr.length - 1].y);
      ctx.stroke();
    };
    strokeAlong(skin.top, C.top, bodyH * 0.5);
    strokeAlong(skin.bot, C.belly, bodyH * 0.5);
    // species pattern
    drawPattern(ctx, key, d, C, { cy, bodyL, bodyH, s, pts, tailLen, g, coat: o.skin });
    // scale speckle texture
    const rng = speckleRng(key.charCodeAt(0) * 7919 + 17);
    ctx.fillStyle = 'rgba(20,12,4,0.10)';
    for (let i = 0; i < 26; i++) {
      const sx = -bodyL * 0.55 + rng() * bodyL * 1.1;
      const sy = cy - bodyH * 0.45 + rng() * bodyH * 0.9;
      ctx.beginPath();
      ctx.ellipse(sx, sy, (0.7 + rng() * 0.9) * s, (0.5 + rng() * 0.5) * s, 0, 0, TAU);
      ctx.fill();
    }
    // soft ambient occlusion where legs meet body
    ctx.fillStyle = 'rgba(20,12,4,0.14)';
    ctx.beginPath();
    ctx.ellipse(hipX + bodyL * 0.03, hipY + bodyH * 0.14, bodyL * 0.16, bodyH * 0.2, 0.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // rim light along the back
  ctx.strokeStyle = 'rgba(255,240,205,0.4)';
  ctx.lineWidth = Math.max(0.7, lineW * 0.8);
  ctx.beginPath();
  const rimA = Math.floor(skin.top.length * 0.18), rimB = Math.floor(skin.top.length * 0.72);
  for (let i = rimA; i <= rimB; i++) {
    const p = skin.top[i];
    if (i === rimA) ctx.moveTo(p.x + 0.6, p.y + 1); else ctx.lineTo(p.x + 0.6, p.y + 1);
  }
  ctx.stroke();

  // outline
  ctx.strokeStyle = C.line;
  ctx.lineWidth = lineW;
  ctx.lineJoin = 'round';
  ctx.stroke(skin.path);

  // dorsal fuzz (feathered species) — jagged fringe along the back
  if (d.fuzz) {
    ctx.strokeStyle = shade(C.top, 0.8);
    ctx.lineWidth = Math.max(0.6, lineW * 0.7);
    for (let i = rimA; i < rimB; i += 2) {
      const p = skin.top[i];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 1 * s, p.y - 1.7 * s);
      ctx.stroke();
    }
  }
  // feather coat (aardiraptor): soft shingle strokes texturing the whole
  // upper body — they thin out and STOP well above the bare underbelly
  if (d.featherCoat) {
    ctx.save();
    ctx.clip(skin.path);
    ctx.lineWidth = Math.max(0.55, lineW * 0.6);
    const frng = speckleRng(key.charCodeAt(0) * 991 + 7);
    for (let i = 0; i < 40; i++) {
      const x = -bodyL * 0.5 + frng() * bodyL;
      const yFrac = frng();                                  // 0 = spine … 1 = midline
      const y = cy - bodyH * 0.48 + yFrac * bodyH * 0.52;    // never reaches the belly
      ctx.globalAlpha = 0.42 + 0.4 * (1 - yFrac);
      ctx.strokeStyle = i % 3 ? shade(C.top, 0.84) : shade(C.mid, 1.12);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - 1.5 * s, y + 1.1 * s, x - 3 * s, y + 0.8 * s);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // species add-ons that sit on the silhouette (plates, scutes, plumes)
  drawBodyExtras(ctx, key, d, C, { cy, bodyL, bodyH, s, lineW, pts, skin, g, ph });

  // the dewlap: a soft throat pouch sagging from under the jaw down the
  // neck to the chest, with a lazy jiggle. Drawn before the head so the
  // jawline overlaps its root
  if (d.dewlap) {
    const j = hPt(-0.02, 0.36);                                // under the jaw hinge
    const chest = { x: bodyL * 0.36, y: cy + bodyH * 0.2 };    // where throat meets chest
    const jig = Math.sin(G.time * 2.2 + (o.x || 0) * 0.05) * 0.05 + move * 0.04;
    const sagX = (j.x + chest.x) / 2 - hl * 0.04;
    const sagY = Math.max(j.y, chest.y) + bodyH * (0.42 + jig);
    ctx.fillStyle = shade(C.belly, 0.94);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.85;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(j.x, j.y);
    ctx.quadraticCurveTo(sagX + hl * 0.12, sagY, sagX - hl * 0.05, sagY - bodyH * 0.02);
    ctx.quadraticCurveTo(chest.x - bodyL * 0.06, sagY - bodyH * 0.04, chest.x, chest.y);
    // seal the top edge back along the throat line (hidden under neck & head)
    ctx.quadraticCurveTo(neckBase.x + hl * 0.1, (j.y + chest.y) / 2 - bodyH * 0.04, j.x, j.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // warm blush wash + two loose skin folds
    ctx.fillStyle = shade(C.acc, 1.05);
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.ellipse(sagX, sagY - bodyH * 0.1, hl * 0.16, bodyH * 0.14, 0.3, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(30,24,14,0.3)';
    ctx.lineWidth = lineW * 0.6;
    for (const fOff of [0.3, 0.55]) {
      ctx.beginPath();
      ctx.moveTo(lerp(j.x, chest.x, fOff), lerp(j.y, chest.y, fOff) + bodyH * 0.02);
      ctx.quadraticCurveTo(sagX, sagY - bodyH * 0.06 - fOff * 2 * s, lerp(j.x, chest.x, fOff + 0.24), lerp(j.y, chest.y, fOff + 0.24) + bodyH * 0.03);
      ctx.stroke();
    }
  }

  // ---------------- head details ----------------
  // a settled-down dino sleeps with its eyes closed (restT rides in on o)
  const blink = (o.restT || 0) > 0.55 || (!hd && ((G.time + (o.x || 0) * 0.137 + ph * 0.05) % 3.8) < 0.13);
  drawHead(ctx, key, d, C, {
    hPt, hl, hh, s, g, lineW, open, hinge, snout, eyeMul, headAng, blink,
  });

  // ---------------- near limbs & arms ----------------
  drawLeg(hipX, hipY, 0, legLen * 0.42, false, false);
  if (quadNow) drawLeg(shX, shY, Math.PI * 0.55, legLen * 0.36, false, true);
  // the shoulder rides the CHEST: a fore-lifted (upright/rearing) body carries
  // its arms up with it, and armUp raises the socket further per species
  else if (d.biped) drawArm(ctx, d, C, { x: bodyL * 0.26, y: cy + bodyH * (0.16 - (d.armUp || 0)) - fl * 0.6, s: s * (d.armScale || 1), lineW, key, ph, move, atk });

  ctx.restore();
}

// ---------------------------------------------------------------------------
// the submerged crocodile: a long dark shape under the surface. You were warned.
// ---------------------------------------------------------------------------
function drawCrocShadow(ctx, e) {
  const d = DINO[e.species];
  const s = d.scale;
  const len = (d.L.body[0] * 0.9 + d.L.tail[0] * 0.6) * s;
  const wid = d.L.body[1] * 0.55 * s;
  const ang = e.move > 0.2 && e.heading != null ? e.heading : (e.facing === 1 ? 0 : Math.PI);
  const sway = Math.sin(G.time * 1.1 + e.id * 2.7) * 0.05;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(ang + sway);
  // body, snout and tail as soft dark lobes — barely more than murk
  ctx.fillStyle = 'rgba(14,32,28,0.32)';
  ctx.beginPath(); ctx.ellipse(0, 0, len * 0.42, wid, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(14,32,28,0.26)';
  ctx.beginPath(); ctx.ellipse(len * 0.5, 0, len * 0.24, wid * 0.5, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-len * 0.52, 0, len * 0.3, wid * 0.45, 0, 0, TAU); ctx.fill();
  // eyes just breaking the surface — the only warning there is
  ctx.fillStyle = 'rgba(214,196,92,0.75)';
  ctx.beginPath(); ctx.arc(len * 0.36, -wid * 0.34, 1.1 * s, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(len * 0.36, wid * 0.34, 1.1 * s, 0, TAU); ctx.fill();
  ctx.restore();
  // faint wake ripple
  const pulse = 0.10 + 0.06 * Math.sin(G.time * 1.6 + e.id);
  ctx.strokeStyle = 'rgba(225,240,238,' + pulse.toFixed(3) + ')';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(e.x, e.y, len * 0.55, wid * 1.7, 0, 0, TAU); ctx.stroke();
}

// ---------------------------------------------------------------------------
// fish, keyed on d.fishKind: 'gar' (slim toothy spindle), 'bass' (deep-bodied
// darter), 'coel' (thick lobe-finned coelacanth with a TAIL SLAP), 'shark'
// (elongate basker with a bony skull-shield)
// ---------------------------------------------------------------------------
function drawFish(ctx, key, o) {
  const d = DINO[key], C = d.col;
  const s = d.scale * sizeScale(o.growth != null ? o.growth : 1);
  const bl = d.L.body[0] * s, bh = d.L.body[1] * s;
  const ph = o.phase || 0, move = o.move || 0;
  const kind = d.fishKind || 'gar';
  // tail slap (coelacanth): the rear end whips on attack — pre-loaded high at
  // the hit frame, same timing profile as the land tail whip
  const atk = o.attackT || 0;
  const slapPh = atk > 0 && d.tailWeapon ? 1 - atk : -1;
  const slap = slapPh >= 0 ? (1 - slapPh) * Math.sin((0.25 + slapPh * 1.1) * TAU) : 0;
  const wig = (t) => Math.sin(G.time * 3.2 + ph * 2 + t * 2.6) * (0.8 + 1.6 * move) * s * t
    + slap * bh * 0.9 * t;
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.hurtT > 0 && Math.floor(o.hurtT * 24) % 2 === 0) ctx.globalAlpha = 0.55;
  // surface ripple rings
  ctx.strokeStyle = 'rgba(225,240,238,0.30)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 0, bl * 0.72, bh * 0.6, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(225,240,238,0.13)';
  ctx.beginPath();
  ctx.ellipse(0, 0, bl * 0.72 + 3 + Math.sin(G.time * 2 + ph) * 1.5, bh * 0.6 + 2.4, 0, 0, TAU);
  ctx.stroke();
  ctx.scale(o.facing || 1, 1);
  // body width profile per kind (t: 0 = tail, 1 = nose)
  const prof = (t) => {
    if (kind === 'bass') return t < 0.12 ? bh * 0.4 * (t / 0.12 * 0.7 + 0.3)
      : bh * (0.3 + 0.72 * Math.sin(Math.pow((t - 0.12) / 0.88, 0.85) * Math.PI));
    if (kind === 'coel') return t < 0.14 ? bh * 0.55 * (t / 0.14 * 0.7 + 0.4)
      : bh * (0.5 + 0.52 * Math.sin(Math.pow((t - 0.14) / 0.86, 0.9) * Math.PI));
    if (kind === 'shark') return t < 0.12 ? bh * 0.42 * (t / 0.12 * 0.7 + 0.3)
      : t < 0.7 ? bh * (0.5 + 0.3 * Math.sin((t - 0.12) / 0.58 * Math.PI * 0.9))
        : bh * lerp(0.78, 0.34, (t - 0.7) / 0.3);   // wide shielded head, blunt nose
    if (kind === 'saw') return t < 0.12 ? bh * 0.4 * (t / 0.12 * 0.7 + 0.3)
      : t < 0.6 ? bh * (0.5 + 0.4 * Math.sin((t - 0.12) / 0.48 * Math.PI * 0.85))
        : bh * lerp(0.85, 0.42, (t - 0.6) / 0.4);   // broad flat forequarters — the blade takes over from here
    return t < 0.15 ? bh * 0.45 * (t / 0.15 * 0.7 + 0.3)   // gar
      : t < 0.72 ? bh * (0.58 + 0.3 * Math.sin((t - 0.15) / 0.57 * Math.PI))
        : bh * lerp(0.58, 0.14, (t - 0.72) / 0.28);
  };
  const pts = [];
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    pts.push({ x: -bl * 0.62 + t * bl * 1.24, y: wig(1 - t) * 0.6 - 1.5 * s, w: prof(t) });
  }
  const skin = skinPath(pts);
  ctx.fillStyle = C.mid;
  ctx.fill(skin.path);
  ctx.save();
  ctx.clip(skin.path);
  ctx.fillStyle = C.top;
  ctx.fillRect(-bl, -bh - 1.5 * s, bl * 2, bh * 0.72);   // dark back
  ctx.fillStyle = C.belly;
  ctx.fillRect(-bl, -1.5 * s + bh * 0.16, bl * 2, bh);   // pale underside
  if (kind === 'gar') {
    // ganoid diamond scales
    ctx.strokeStyle = 'rgba(20,28,16,0.25)';
    ctx.lineWidth = 0.7;
    for (let i = -3; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * bl * 0.12 - bl * 0.1, -bh * 0.5 - 1.5 * s);
      ctx.lineTo(i * bl * 0.12 + bl * 0.1, bh * 0.5 - 1.5 * s);
      ctx.stroke();
    }
  } else if (kind === 'coel') {
    // the coelacanth's white flecks
    ctx.fillStyle = C.acc;
    ctx.globalAlpha = 0.7;
    const rng = speckleRng(key.charCodeAt(0) * 131 + 9);
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(-bl * 0.45 + rng() * bl * 0.9, -bh * 0.6 - 1.5 * s + rng() * bh, Math.max(0.6, bh * 0.06), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = Math.max(0.7, s);
  ctx.stroke(skin.path);

  const tx0 = -bl * 0.62, ty0 = wig(1) * 0.6 - 1.5 * s;
  if (kind === 'bass') {
    // forked tail + spiny dorsal
    ctx.fillStyle = shade(C.mid, 0.85);
    ctx.beginPath();
    ctx.moveTo(tx0, ty0);
    ctx.lineTo(tx0 - bh * 0.75, ty0 - bh * 0.55 + wig(1.3));
    ctx.lineTo(tx0 - bh * 0.35, ty0 + wig(1.35));
    ctx.lineTo(tx0 - bh * 0.75, ty0 + bh * 0.55 + wig(1.3));
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(C.top, 1.2);
    ctx.beginPath();
    ctx.moveTo(-bl * 0.18, -bh * 0.72 - 1.5 * s);
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(-bl * 0.14 + i * bl * 0.09, -bh * (1.12 - i * 0.1) - 1.5 * s);
      ctx.lineTo(-bl * 0.1 + i * bl * 0.09, -bh * 0.72 - 1.5 * s);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'coel') {
    // three-lobed paddle tail (rides the slap) + two round lobed fins below
    ctx.fillStyle = shade(C.mid, 0.85);
    ctx.beginPath();
    ctx.moveTo(tx0, ty0);
    ctx.quadraticCurveTo(tx0 - bh * 0.9, ty0 - bh * 0.7 + wig(1.35), tx0 - bh * 1.15, ty0 + wig(1.45));
    ctx.quadraticCurveTo(tx0 - bh * 0.9, ty0 + bh * 0.7 + wig(1.35), tx0, ty0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(C.mid, 0.95);
    ctx.beginPath();   // the little middle lobe
    ctx.ellipse(tx0 - bh * 1.1 + wig(1.5) * 0.3, ty0 + wig(1.5), bh * 0.3, bh * 0.18, 0.1, 0, TAU);
    ctx.fill(); ctx.stroke();
    // stalked lobe-fins hanging below the body line — the coelacanth signature
    for (const fx of [bl * 0.18, -bl * 0.14]) {
      ctx.fillStyle = shade(C.mid, 0.85);
      ctx.beginPath();
      ctx.ellipse(fx - bh * 0.12, bh * 0.68 - 1.5 * s, bh * 0.3, bh * 0.14, 0.55, 0, TAU);
      ctx.fill(); ctx.stroke();
    }
  } else if (kind === 'shark') {
    // crescent tail (long upper lobe) + tall dorsal + the bony skull-shield
    ctx.fillStyle = shade(C.mid, 0.85);
    ctx.beginPath();
    ctx.moveTo(tx0, ty0);
    ctx.quadraticCurveTo(tx0 - bh * 0.7, ty0 - bh * 1.0 + wig(1.3), tx0 - bh * 1.0, ty0 - bh * 0.9 + wig(1.4));
    ctx.quadraticCurveTo(tx0 - bh * 0.45, ty0 - bh * 0.15 + wig(1.3), tx0 - bh * 0.55, ty0 + bh * 0.45 + wig(1.35));
    ctx.quadraticCurveTo(tx0 - bh * 0.3, ty0 + bh * 0.2, tx0, ty0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(C.mid, 0.9);
    ctx.beginPath();   // tall dorsal
    ctx.moveTo(-bl * 0.1, -bh * 0.6 - 1.5 * s);
    ctx.quadraticCurveTo(-bl * 0.2, -bh * 1.5 - 1.5 * s, -bl * 0.3, -bh * 0.55 - 1.5 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // the skull-shield: a bony helmet plate over the whole head
    ctx.fillStyle = C.acc;
    ctx.strokeStyle = C.line;
    ctx.beginPath();
    ctx.moveTo(bl * 0.24, -bh * 0.66 - 1.5 * s);
    ctx.quadraticCurveTo(bl * 0.52, -bh * 0.85 - 1.5 * s, bl * 0.63, -bh * 0.1 - 1.5 * s);
    ctx.quadraticCurveTo(bl * 0.5, -bh * 0.05 - 1.5 * s, bl * 0.24, -bh * 0.18 - 1.5 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(C.acc, 0.75);
    for (const [rx, ry] of [[0.34, -0.5], [0.46, -0.42], [0.52, -0.25]]) {
      ctx.beginPath(); ctx.arc(bl * rx, bh * ry - 1.5 * s, Math.max(0.5, bh * 0.07), 0, TAU); ctx.fill();
    }
  } else if (kind === 'saw') {
    // onchopristis: shark-ish tail, swept wing pectorals — and the SAW,
    // a long flat rostrum studded with teeth down both edges
    ctx.fillStyle = shade(C.mid, 0.85);
    ctx.beginPath();   // crescent tail, long upper lobe
    ctx.moveTo(tx0, ty0);
    ctx.quadraticCurveTo(tx0 - bh * 0.75, ty0 - bh * 0.95 + wig(1.3), tx0 - bh * 1.0, ty0 - bh * 0.8 + wig(1.4));
    ctx.quadraticCurveTo(tx0 - bh * 0.45, ty0 - bh * 0.1 + wig(1.3), tx0 - bh * 0.5, ty0 + bh * 0.4 + wig(1.35));
    ctx.quadraticCurveTo(tx0 - bh * 0.28, ty0 + bh * 0.15, tx0, ty0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // the wing: a broad swept pectoral hanging below the body line
    ctx.fillStyle = shade(C.mid, 0.8);
    ctx.beginPath();
    ctx.moveTo(bl * 0.22, bh * 0.3 - 1.5 * s);
    ctx.quadraticCurveTo(-bl * 0.02, bh * 1.05 - 1.5 * s, -bl * 0.22, bh * 0.85 - 1.5 * s);
    ctx.quadraticCurveTo(-bl * 0.06, bh * 0.4 - 1.5 * s, bl * 0.05, bh * 0.32 - 1.5 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // low far-back dorsal
    ctx.fillStyle = shade(C.mid, 0.9);
    ctx.beginPath();
    ctx.moveTo(-bl * 0.26, -bh * 0.5 - 1.5 * s);
    ctx.quadraticCurveTo(-bl * 0.38, -bh * 1.0 - 1.5 * s, -bl * 0.48, -bh * 0.45 - 1.5 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // THE SAW: flat pale blade off the nose, teeth alternating down both edges
    const r0 = bl * 0.58, r1 = bl * 1.12, ry = -1.5 * s - bh * 0.04;
    ctx.fillStyle = C.acc;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = Math.max(0.7, s * 0.8);
    ctx.beginPath();
    ctx.moveTo(r0, ry - bh * 0.15);
    ctx.lineTo(r1, ry - bh * 0.06);
    ctx.quadraticCurveTo(r1 + bh * 0.12, ry, r1, ry + bh * 0.06);
    ctx.lineTo(r0, ry + bh * 0.15);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2ead4';
    for (let i = 0; i < 5; i++) {
      const t = 0.12 + i * 0.19;
      const sxx = lerp(r0, r1, t);
      const half = lerp(bh * 0.14, bh * 0.06, t);
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sxx - bh * 0.045, ry + dir * half);
        ctx.lineTo(sxx + bh * 0.045, ry + dir * half);
        ctx.lineTo(sxx + (dir < 0 ? 0.01 : -0.01), ry + dir * (half + bh * 0.14));
        ctx.closePath(); ctx.fill();
      }
    }
    // blade midline
    ctx.strokeStyle = shade(C.acc, 0.7);
    ctx.lineWidth = Math.max(0.5, s * 0.6);
    ctx.beginPath(); ctx.moveTo(r0 + bh * 0.05, ry); ctx.lineTo(r1 - bh * 0.04, ry); ctx.stroke();
  } else {
    // gar: swaying tail fin + far-back dorsal
    ctx.fillStyle = shade(C.mid, 0.85);
    ctx.beginPath();
    ctx.moveTo(tx0, ty0);
    ctx.quadraticCurveTo(tx0 - bh * 0.7, ty0 - bh * 0.5 + wig(1.3), tx0 - bh * 0.9, ty0 + wig(1.4));
    ctx.quadraticCurveTo(tx0 - bh * 0.7, ty0 + bh * 0.5 + wig(1.3), tx0, ty0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(C.mid, 0.9);
    ctx.beginPath();
    ctx.moveTo(-bl * 0.32, -bh * 0.4 - 1.5 * s);
    ctx.quadraticCurveTo(-bl * 0.44, -bh * 0.85 - 1.5 * s, -bl * 0.52, -bh * 0.42 - 1.5 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // eye
  const garish = kind === 'gar';
  const ex = bl * (garish ? 0.34 : kind === 'bass' ? 0.4 : kind === 'saw' ? 0.38 : 0.42);
  const ey = -bh * (kind === 'shark' ? 0.24 : kind === 'saw' ? 0.28 : 0.14) - 1.5 * s;
  ctx.fillStyle = '#e8e0b0';
  ctx.beginPath(); ctx.arc(ex, ey, Math.max(0.9, bh * (kind === 'coel' ? 0.16 : 0.22)), 0, TAU); ctx.fill();
  ctx.fillStyle = C.line;
  ctx.beginPath(); ctx.arc(ex + 0.2, ey, Math.max(0.45, bh * 0.1), 0, TAU); ctx.fill();
  // mouth line (the sawfish's is underslung behind the blade — skip it)
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  if (kind === 'saw') {
    // no visible mouth
  } else if (garish) {
    ctx.moveTo(bl * 0.42, -1.2 * s + bh * 0.06);
    ctx.lineTo(bl * 0.62, -1.4 * s + bh * 0.02);
  } else {
    ctx.moveTo(bl * 0.5, -1.5 * s + bh * (kind === 'bass' ? 0.14 : 0.1));
    ctx.quadraticCurveTo(bl * 0.58, -1.5 * s + bh * 0.18, bl * 0.62, -1.5 * s + bh * 0.06);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// species pattern layers (called inside silhouette clip)
// ---------------------------------------------------------------------------
function drawPattern(ctx, key, d, C, a) {
  const { cy, bodyL, bodyH, s, tailLen } = a;
  // the ripcel skin repaints the markings wholesale: navy flank stripes and
  // shining lime dots (bright rim, hot core) from the shoulders down the tail
  if (a.coat === 'ripcel') {
    ctx.fillStyle = C.pat;
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < 4; i++) {
      const x = -bodyL * 0.34 + i * (bodyL * 0.72 / 3);
      const h = bodyH * (0.55 - 0.08 * Math.abs(i - 2));
      ctx.beginPath();
      ctx.moveTo(x - bodyL * 0.035, cy - bodyH * 0.5);
      ctx.quadraticCurveTo(x + bodyL * 0.02, cy - bodyH * 0.1, x - bodyL * 0.012, cy - bodyH * 0.5 + h);
      ctx.quadraticCurveTo(x + bodyL * 0.05, cy - bodyH * 0.1, x + bodyL * 0.045, cy - bodyH * 0.5);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      const t = 0.2 + i * 0.26;
      ctx.beginPath();
      ctx.ellipse(-bodyL * 0.42 - tailLen * t, cy - t * 2 * s, bodyL * 0.022, bodyH * (0.3 - t * 0.16), 0.1, 0, TAU);
      ctx.fill();
    }
    const rng = speckleRng(key.charCodeAt(0) * 4243 + 11);
    for (let i = 0; i < 12; i++) {
      const x = -bodyL * 0.44 - tailLen * 0.45 + rng() * (bodyL * 0.92 + tailLen * 0.45);
      const y = cy - bodyH * 0.36 + rng() * bodyH * 0.55;
      const r = (0.8 + rng() * 1.0) * s;
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = C.acc;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = mixHex(C.acc, '#ffffff', 0.55);   // the shine
      ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.42, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (a.coat === 'jungell') {
    // jungell: the species' own markings in deep leaf-green, plus a canopy of
    // lime leaf-flecks dappled along the back — sunlight through the jungle
    drawPattern(ctx, key, d, C, Object.assign({}, a, { coat: null }));
    const rng = speckleRng(key.charCodeAt(0) * 7717 + 5);
    for (let i = 0; i < 14; i++) {
      const x = -bodyL * 0.44 - tailLen * 0.4 + rng() * (bodyL * 0.94 + tailLen * 0.4);
      const y = cy - bodyH * 0.46 + rng() * bodyH * 0.42;
      const r = (0.9 + rng() * 1.1) * s;
      const ang = rng() * TAU;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = i % 3 ? C.acc : mixHex(C.acc, '#f4ffd0', 0.5);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.25, r * 0.55, ang, 0, TAU);   // a little leaf
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = C.pat;
  if (d.pattern === 'stripes') {
    // bold tapering flank stripes, continuing down the tail
    ctx.globalAlpha = key === 'ichthyo' ? 0.55 : 0.75;
    const n = key === 'raja' || key === 'ichthyo' ? 5 : 4;
    for (let i = 0; i < n; i++) {
      const x = -bodyL * 0.34 + i * (bodyL * 0.72 / (n - 1));
      const h = bodyH * (0.55 - 0.08 * Math.abs(i - n / 2));
      ctx.beginPath();
      ctx.moveTo(x - bodyL * 0.035, cy - bodyH * 0.5);
      ctx.quadraticCurveTo(x + bodyL * 0.02, cy - bodyH * 0.1, x - bodyL * 0.012, cy - bodyH * 0.5 + h);
      ctx.quadraticCurveTo(x + bodyL * 0.05, cy - bodyH * 0.1, x + bodyL * 0.045, cy - bodyH * 0.5);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      const t = 0.2 + i * 0.26;
      const x = -bodyL * 0.42 - tailLen * t;
      ctx.beginPath();
      ctx.ellipse(x, cy - t * 2 * s, bodyL * 0.022, bodyH * (0.3 - t * 0.16), 0.1, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (d.pattern === 'dapple') {
    // dappled blotches along the upper flank
    ctx.globalAlpha = 0.5;
    const rng = speckleRng(key.charCodeAt(1) * 3571 + 5);
    for (let i = 0; i < 9; i++) {
      const x = -bodyL * 0.45 + rng() * bodyL * 0.9;
      const y = cy - bodyH * 0.34 + rng() * bodyH * 0.4;
      ctx.beginPath();
      ctx.ellipse(x, y, (1.6 + rng() * 2.4) * s, (1.1 + rng() * 1.4) * s, rng() * 2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (d.pattern === 'mask') {
    // dark mask over the back half, pale throat handled by belly band
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(-bodyL * 0.16, cy - bodyH * 0.3, bodyL * 0.42, bodyH * 0.42, 0.1, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (d.pattern === 'streak') {
    // dark streak from shoulder down the flank
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(bodyL * 0.05, cy - bodyH * 0.1, bodyL * 0.34, bodyH * 0.16, 0.12, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (d.pattern === 'band') {
    // lighter keeled flank band between armour rows
    ctx.fillStyle = C.pat;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(-bodyL * 0.02, cy + bodyH * 0.02, bodyL * 0.44, bodyH * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// plates / scutes / plumes drawn on top of the silhouette
// ---------------------------------------------------------------------------
function drawBodyExtras(ctx, key, d, C, a) {
  const { cy, bodyL, bodyH, s, lineW, skin, ph } = a;
  if (d.plates) {
    // kite-shaped plates that follow the arch of the spine
    ctx.lineWidth = lineW * 0.9;
    const nTop = skin.top.length;
    const plateAt = (frac, size, dim) => {
      const i = clamp(Math.floor(nTop * frac), 1, nTop - 2);
      const p = skin.top[i], p0 = skin.top[i - 1], p1 = skin.top[i + 1];
      let tx = p1.x - p0.x, ty = p1.y - p0.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      const nx = ty, ny = -tx;                 // outward (up) normal
      // plateMul: species with low rounded plates (wuerhosaurus) squash the row
      const h = bodyH * size * (d.plateMul || 1), w = bodyH * 0.16 * (0.65 + size);
      const bx1 = p.x - tx * w + nx * -1.5, by1 = p.y - ty * w + ny * -1.5;
      const bx2 = p.x + tx * w + nx * -1.5, by2 = p.y + ty * w + ny * -1.5;
      const tipx = p.x + nx * h + tx * h * 0.12, tipy = p.y + ny * h + ty * h * 0.12;
      ctx.fillStyle = dim ? shade(C.acc, 0.72) : C.acc;
      ctx.strokeStyle = C.line;
      ctx.beginPath();
      ctx.moveTo(bx1, by1);
      ctx.quadraticCurveTo(p.x - tx * w * 0.7 + nx * h * 0.62, p.y - ty * w * 0.7 + ny * h * 0.62, tipx, tipy);
      ctx.quadraticCurveTo(p.x + tx * w * 0.75 + nx * h * 0.55, p.y + ty * w * 0.75 + ny * h * 0.55, bx2, by2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!dim) {
        // lit face on the front half of the plate
        ctx.fillStyle = 'rgba(255,230,170,0.35)';
        ctx.beginPath();
        ctx.moveTo(p.x + tx * w * 0.5, p.y + ty * w * 0.5);
        ctx.quadraticCurveTo(p.x + tx * w * 0.55 + nx * h * 0.5, p.y + ty * w * 0.55 + ny * h * 0.5, tipx, tipy);
        ctx.quadraticCurveTo(p.x + tx * w * 0.1 + nx * h * 0.5, p.y + ty * w * 0.1 + ny * h * 0.5, p.x + tx * w * 0.1, p.y + ty * w * 0.1);
        ctx.closePath(); ctx.fill();
      }
    };
    // back row (offset, darker) then front row — reads as two staggered rows
    for (const [f, sz] of [[0.35, 0.36], [0.45, 0.46], [0.55, 0.5], [0.65, 0.42]]) plateAt(f + 0.045, sz * 0.8, true);
    for (const [f, sz] of [[0.30, 0.4], [0.40, 0.52], [0.50, 0.58], [0.60, 0.52], [0.70, 0.4], [0.16, 0.3], [0.08, 0.2]]) plateAt(f, sz, false);
    // thagomizer: two big paired tail spikes
    const tp = skin.top[Math.max(0, Math.floor(nTop * 0.04))];
    ctx.strokeStyle = C.line;
    ctx.fillStyle = shade(C.acc, 1.12);
    for (const [dx, ang, len] of [[1.5 * s, -0.55, 10], [-4.5 * s, -0.85, 9]]) {
      ctx.beginPath();
      ctx.moveTo(tp.x + dx - 1.8 * s, tp.y + 2);
      ctx.lineTo(tp.x + dx + Math.cos(ang) * len * s, tp.y + Math.sin(ang) * len * s);
      ctx.lineTo(tp.x + dx + 2 * s, tp.y + 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  if (d.scutes) {
    // two rows of bony osteoderms following the back line
    const nTop = skin.top.length;
    ctx.lineWidth = lineW * 0.7;
    for (let k = 0; k < 9; k++) {
      const p = skin.top[Math.floor(nTop * (0.16 + k * 0.065))];
      if (!p) continue;
      const r = Math.max(0.9, (1.9 - Math.abs(k - 4) * 0.16) * s);
      ctx.fillStyle = C.acc;
      ctx.strokeStyle = C.line;
      ctx.beginPath();
      ctx.moveTo(p.x - r, p.y + 1);
      ctx.quadraticCurveTo(p.x, p.y - r * 1.7, p.x + r, p.y + 1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(240,235,200,0.5)';
      ctx.beginPath();
      ctx.ellipse(p.x - r * 0.2, p.y - r * 0.5, r * 0.32, r * 0.24, 0, 0, TAU);
      ctx.fill();
    }
    // flank stud row
    ctx.fillStyle = shade(C.acc, 1.4);
    for (let k = 0; k < 6; k++) {
      const x = -bodyL * 0.34 + k * bodyL * 0.13;
      ctx.beginPath();
      ctx.arc(x, cy + bodyH * 0.1, Math.max(0.7, 1.0 * s), 0, TAU);
      ctx.fill();
    }
  }
  if (d.tailClub) {
    // pinacosaurus: the bony hammer on the tail's end
    const tp = skin.top[0], bp = skin.bot[0];
    const cx2 = (tp.x + bp.x) / 2, cy2 = (tp.y + bp.y) / 2;
    ctx.fillStyle = shade(C.acc, 0.95);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.9;
    ctx.beginPath();
    ctx.ellipse(cx2 - 2.5 * s, cy2, 4.6 * s, 3.4 * s, 0.15, 0, TAU);
    ctx.fill(); ctx.stroke();
    // the two bone lobes
    ctx.strokeStyle = shade(C.line, 2.2);
    ctx.lineWidth = lineW * 0.6;
    ctx.beginPath(); ctx.moveTo(cx2 - 2.5 * s, cy2 - 3 * s); ctx.lineTo(cx2 - 2.5 * s, cy2 + 3 * s); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,210,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx2 - 3.6 * s, cy2 - 1.1 * s, 1.8 * s, 1.1 * s, -0.2, 0, TAU);
    ctx.fill();
  }
  if (d.shoulderSpine) {
    // gigantspinosaurus' signature: a parascapular blade sweeping back and
    // slightly DOWN along the flank, below the plate row (far-side one drawn
    // darker and offset so it reads as a pair)
    const sx = bodyL * 0.26, sy = cy - bodyH * 0.15;
    for (const [off, dim] of [[3 * s, true], [0, false]]) {
      ctx.fillStyle = dim ? shade(C.acc, 0.72) : C.acc;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = lineW * 0.9;
      ctx.beginPath();
      ctx.moveTo(sx + 4 * s - off, sy - bodyH * 0.14);
      ctx.quadraticCurveTo(sx - bodyL * 0.14 - off, sy - bodyH * 0.08, sx - bodyL * 0.36 - off, sy + bodyH * 0.08);
      ctx.quadraticCurveTo(sx - bodyL * 0.12 - off, sy + bodyH * 0.15, sx + s - off, sy + bodyH * 0.18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!dim) {
        // lit keel line along the blade
        ctx.strokeStyle = 'rgba(255,235,190,0.4)';
        ctx.lineWidth = lineW * 0.8;
        ctx.beginPath();
        ctx.moveTo(sx + 2 * s, sy - bodyH * 0.06);
        ctx.quadraticCurveTo(sx - bodyL * 0.14, sy - bodyH * 0.01, sx - bodyL * 0.32, sy + bodyH * 0.07);
        ctx.stroke();
      }
    }
  }
  if (d.sail || d.bigSail || d.mSail || d.hump || d.ridge) {
    // smooth dorsal lobes along the back outline. Ichthyovenator's signature
    // is TWO separate sails split over the hips (as in the real fossil);
    // a `hump` is one sharp lobe (concavenator), a `ridge` one low long one.
    const nTop = skin.top.length;
    const sampleTop = (f) => {
      // interpolate along the (coarse) top outline so every sample is distinct
      const idx = clamp(f * (nTop - 1), 0, nTop - 1.001);
      const i0 = Math.floor(idx), ft = idx - i0;
      const p = skin.top[i0], q = skin.top[i0 + 1];
      let tx = q.x - p.x, ty = q.y - p.y;
      const tl = Math.hypot(tx, ty) || 1;
      return { x: lerp(p.x, q.x, ft), y: lerp(p.y, q.y, ft), nx: ty / tl, ny: -tx / tl };
    };
    const drawLobe = (f0, f1, hMax, pk = 0.75, shape = null) => {
      const N = shape ? 12 : 8;   // sculpted profiles get more samples
      const base = [], edge = [];
      let yRef = 0;
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const sp = sampleTop(f0 + (f1 - f0) * t);
        if (k === 0) yRef = sp.y;
        base.push({ x: sp.x - sp.nx * 1.4, y: sp.y - sp.ny * 1.4 });
        if (shape) {
          // sculpted profile (the spinosaurus M-sail): the TOP EDGE is the
          // shape, level in world space — drawn from a fixed waterline so the
          // outline rising toward the shoulders can't tilt or warp the M
          const hM = hMax * shape(t);
          edge.push({ x: sp.x, y: Math.min(yRef - hM, sp.y - 2), h: hM });
        } else {
          // dome by default (higher pk = sharper), riding the outline normals
          const h = hMax * Math.pow(Math.sin(t * Math.PI), pk);
          edge.push({ x: sp.x + sp.nx * h, y: sp.y + sp.ny * h, h });
        }
      }
      // one smooth outline: front base → over the dome (midpoint quads) → back base
      ctx.fillStyle = shade(C.top, 1.05);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = lineW * 0.85;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(base[0].x, base[0].y);
      ctx.quadraticCurveTo(edge[0].x, edge[0].y, (edge[0].x + edge[1].x) / 2, (edge[0].y + edge[1].y) / 2);
      for (let k = 1; k < N; k++) {
        ctx.quadraticCurveTo(edge[k].x, edge[k].y, (edge[k].x + edge[k + 1].x) / 2, (edge[k].y + edge[k + 1].y) / 2);
      }
      ctx.quadraticCurveTo(edge[N].x, edge[N].y, base[N].x, base[N].y);
      ctx.closePath();                        // straight seam back through the body — hidden under it
      ctx.fill(); ctx.stroke();
      // membrane spines fanning to the edge
      ctx.strokeStyle = 'rgba(20,32,30,0.45)';
      ctx.lineWidth = lineW * 0.6;
      for (let k = 2; k <= N - 2; k += 2) {
        ctx.beginPath();
        ctx.moveTo(base[k].x, base[k].y);
        ctx.lineTo(lerp(base[k].x, edge[k].x, 0.88), lerp(base[k].y, edge[k].y, 0.88));
        ctx.stroke();
      }
      // warm translucent rim along the crest — clipped to where the sail is
      // actually TALL, so it never whips down the steep ends as a stray hair
      let k0 = 1, k1 = N - 1;
      if (shape) {
        while (k0 < N - 1 && edge[k0].h < hMax * 0.3) k0++;
        while (k1 > 1 && edge[k1].h < hMax * 0.3) k1--;
      }
      if (k1 > k0) {
        ctx.strokeStyle = 'rgba(217,106,58,0.55)';
        ctx.lineWidth = lineW * 1.1;
        ctx.beginPath();
        ctx.moveTo((edge[k0].x + edge[k0 + 1].x) / 2, (edge[k0].y + edge[k0 + 1].y) / 2);
        for (let k = k0 + 1; k < k1; k++) {
          ctx.quadraticCurveTo(edge[k].x, edge[k].y, (edge[k].x + edge[k + 1].x) / 2, (edge[k].y + edge[k + 1].y) / 2);
        }
        ctx.stroke();
      }
    };
    // skin.top runs tail → snout: low fracs are the tail side
    if (d.mSail) {
      // the maroccanus signature: a sail shaped like the letter M — two even
      // rounded peaks with a saddle between them (per Prior Extinction).
      // Drawn level in world space (see drawLobe's shape mode), so the two
      // peaks match no matter how the back rises beneath them. The span stays
      // clear of the neck points — a lowered head must not drag the sail
      const mShape = (t) => {
        const peaks = Math.exp(-Math.pow((t - 0.28) / 0.18, 2))
          + 0.97 * Math.exp(-Math.pow((t - 0.72) / 0.17, 2));
        return Math.min(1, peaks) * Math.pow(Math.sin(t * Math.PI), 0.18);
      };
      drawLobe(0.30, 0.60, bodyH * 1.0, 0.75, mShape);
    } else if (d.bigSail) {
      drawLobe(0.26, 0.68, bodyH * 0.95, 0.9);   // ONE towering dome sail, hips to shoulders
    } else if (d.sail) {
      drawLobe(0.37, 0.61, bodyH * 0.66);   // tall dorsal sail over the torso
      drawLobe(0.17, 0.34, bodyH * 0.44);   // lower sacral sail over hips & tail base
    } else if (d.hump) {
      drawLobe(0.28, 0.42, bodyH * 0.55, 2.2);  // concavenator: tall narrow hump right before the hips
    } else {
      drawLobe(0.24, 0.66, bodyH * 0.17);       // metriacanthosaurus: long low even spine ridge
    }
  }
  if (d.bushyTail) {
    // a fox-brush: the whole tail wrapped in fur — fat overlapping tufts down
    // the spine (drawn over the skinny tail), two-toned, with flicked hairs.
    // a.pts is the FULL outline (tail pts are its first five entries)
    const tp = a.pts ? a.pts.slice(0, 4) : null;
    if (tp && tp.length) {
      // underlayer: one lumpy fur silhouette
      ctx.fillStyle = shade(C.mid, 1.02);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = lineW * 0.85;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < tp.length; i++) {
          const q = tp[i];
          const nx = i + 1 < tp.length ? tp[i + 1] : q;
          const ang = Math.atan2(nx.y - q.y, nx.x - q.x);
          const rr = Math.max(1.7 * s, q.w * 1.4 + 0.9 * s);
          if (pass === 0) {
            ctx.beginPath();
            ctx.ellipse(q.x, q.y, rr * 1.3, rr, ang, 0, TAU);
            ctx.fill();
            if (i === 0) { ctx.stroke(); }              // crisp rounded tip
          } else {
            // dark saddle along the top of the brush
            ctx.fillStyle = shade(C.top, 0.95);
            ctx.beginPath();
            ctx.ellipse(q.x, q.y - rr * 0.4, rr * 0.95, rr * 0.45, ang, 0, TAU);
            ctx.fill();
          }
        }
      }
      // flicked guard hairs off the top edge
      ctx.strokeStyle = shade(C.top, 0.8);
      ctx.lineWidth = Math.max(0.6, lineW * 0.65);
      for (let i = 0; i < tp.length; i += 1) {
        const q = tp[i];
        const rr = Math.max(1.7 * s, q.w * 1.4 + 0.9 * s);
        ctx.beginPath();
        ctx.moveTo(q.x, q.y - rr * 0.8);
        ctx.lineTo(q.x - 1.2 * s, q.y - rr * 0.8 - 1.8 * s);
        ctx.stroke();
      }
    }
  }
  if (d.plume) {
    // ornithomimid tail fan
    const tip = skin.top[2];
    if (tip) {
      ctx.fillStyle = shade(C.mid, 1.12);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = lineW * 0.7;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.ellipse(tip.x - 3 * s, tip.y + k * 1.6 * s + Math.sin(ph) * 0.6,
          6.5 * s, 1.7 * s, k * 0.24 - 0.28, 0, TAU);
        ctx.fill(); ctx.stroke();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// heads: mouth, jaw, teeth/beak, eye, brow, nostril, crests
// ---------------------------------------------------------------------------
function drawHead(ctx, key, d, C, a) {
  const { hPt, hl, hh, s, g, lineW, open, hinge, snout, eyeMul, blink, headAng } = a;
  const carn = d.diet === 'carn';
  // one beak decision for the whole head: herbivores/omnivores wear the
  // horny sheath — except duckbills, whose spoonbill IS their beak (both at
  // once looked like a sticker on a bill)
  const beaked = d.beak !== false && !carn && !d.duckbill;
  const beakFill = key === 'ornitho' ? C.acc : shade(C.belly, 0.88);

  // open-mouth interior
  if (open > 0.06) {
    const lipTop = hPt(0.68, 0.1);
    const jawTip = {
      x: hinge.x + (snout.x - hinge.x) * 0.92 * Math.cos(open) + (snout.y - hinge.y) * 0.92 * Math.sin(open) * 0.6,
      y: hinge.y + (snout.y - hinge.y) * 0.92 + Math.hypot(snout.x - hinge.x, snout.y - hinge.y) * Math.sin(open) * 0.8,
    };
    ctx.fillStyle = '#4a1410';
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y);
    ctx.lineTo(lipTop.x, lipTop.y);
    ctx.lineTo(jawTip.x, jawTip.y);
    ctx.closePath(); ctx.fill();
    // lower jaw
    ctx.fillStyle = shade(C.mid, 0.9);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.85;
    ctx.beginPath();
    ctx.moveTo(hinge.x - hl * 0.06, hinge.y - hh * 0.04);
    ctx.lineTo(jawTip.x, jawTip.y);
    ctx.lineTo(jawTip.x - hl * 0.05, jawTip.y + hh * 0.2);
    ctx.quadraticCurveTo(hinge.x, hinge.y + hh * 0.26, hinge.x - hl * 0.1, hinge.y + hh * 0.14);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // a beaked lower jaw keeps its horny tip when the mouth opens — without
    // this the open jaw was a bare fleshy slab hanging under the beak
    if (beaked || d.duckbill) {
      const jm = { x: lerp(hinge.x, jawTip.x, 0.55), y: lerp(hinge.y, jawTip.y, 0.55) };
      ctx.fillStyle = beaked ? beakFill : shade(C.belly, 0.9);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = lineW * 0.7;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(jm.x, jm.y);
      ctx.lineTo(jawTip.x, jawTip.y);
      ctx.lineTo(jawTip.x - hl * 0.05, jawTip.y + hh * 0.2);
      ctx.lineTo(jm.x - hl * 0.03, jm.y + hh * 0.22);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // teeth on the upper lip
    if (carn && s > 0.4) {
      ctx.fillStyle = '#f2ead4';
      for (let i = 0; i < 4; i++) {
        const t = 0.25 + i * 0.2;
        const tx = lerp(hinge.x, lipTop.x, t), ty = lerp(hinge.y, lipTop.y, t) + hh * 0.02;
        ctx.beginPath();
        ctx.moveTo(tx - hl * 0.025, ty);
        ctx.lineTo(tx + hl * 0.025, ty);
        ctx.lineTo(tx, ty + hh * 0.14);
        ctx.closePath(); ctx.fill();
      }
    }
  } else {
    // closed mouth line
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.8;
    ctx.beginPath();
    const m0 = hPt(-0.02, 0.3), m1 = hPt(0.52, 0.2), m2 = hPt(0.68, 0.08);
    ctx.moveTo(m0.x, m0.y);
    ctx.quadraticCurveTo(m1.x, m1.y + hh * 0.06, m2.x, m2.y);
    ctx.stroke();
    // resting teeth hint for big carnivores
    if (d.crocTeeth && s > 0.45) {
      // crocodilian interlocking teeth: a full row showing even with the
      // mouth shut — downward from the upper jaw, upward from the lower,
      // alternating all the way along the lip line
      ctx.fillStyle = '#f2ead4';
      for (let i = 0; i < 6; i++) {
        const t = 0.2 + i * 0.14;
        const tx = lerp(m0.x, m2.x, t), ty = lerp(m0.y, m2.y, t) + hh * 0.05;
        const up = i % 2 === 1;   // odd teeth rise from the lower jaw
        const len = hh * (0.11 - 0.012 * Math.abs(i - 2.5));
        ctx.beginPath();
        ctx.moveTo(tx - hl * 0.016, ty + (up ? hh * 0.05 : -hh * 0.04));
        ctx.lineTo(tx + hl * 0.016, ty + (up ? hh * 0.05 : -hh * 0.04));
        ctx.lineTo(tx, ty + (up ? -len : len));
        ctx.closePath(); ctx.fill();
      }
    } else if (carn && s > 0.6 && g > 0.35) {
      ctx.fillStyle = '#f2ead4';
      for (let i = 0; i < 3; i++) {
        const t = 0.45 + i * 0.2;
        const tx = lerp(m0.x, m2.x, t), ty = lerp(m0.y, m2.y, t) + hh * 0.04;
        ctx.beginPath();
        ctx.moveTo(tx - hl * 0.02, ty - hh * 0.03);
        ctx.lineTo(tx + hl * 0.02, ty - hh * 0.03);
        ctx.lineTo(tx, ty + hh * 0.08);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  // beak for herbivores / ornithomimus — a horny sheath that CAPS the snout:
  // it rides the top ridge, wraps PROUD of the tip (its own outline replaces
  // the snout line there) and tucks back under the chin, so the front of the
  // mouth genuinely sits inside the beak instead of under a floating patch
  if (beaked) {
    const bTop = hPt(0.4, -0.34);                                       // rooted on the ridge
    const bTip = { x: snout.x + hl * 0.075, y: snout.y - hh * 0.05 };   // just beyond the outline
    const bChin = hPt(0.48, 0.3);                                       // tucked under the jaw
    ctx.fillStyle = beakFill;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.75;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(bTop.x, bTop.y);
    ctx.quadraticCurveTo(hPt(0.68, -0.32).x, hPt(0.68, -0.32).y, bTip.x, bTip.y);   // over the ridge, out past the tip
    ctx.quadraticCurveTo(bTip.x + hl * 0.025, snout.y + hh * 0.2, bChin.x, bChin.y); // the rounded crop-hook tip
    ctx.quadraticCurveTo(hPt(0.5, 0.0).x, hPt(0.5, 0.0).y, bTop.x, bTop.y);          // inner rim, a soft S back up
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // nostril at the beak's base, where horn meets skin
    ctx.fillStyle = C.line;
    const bn = hPt(0.52, -0.16);
    ctx.beginPath(); ctx.ellipse(bn.x, bn.y, hl * 0.024, hh * 0.032, 0.3, 0, TAU); ctx.fill();
  } else if (!d.sauroHead && !d.duckbill) {   // duckbills breathe through the bill
    // carnivore nostril — spinosaurs carry theirs as a slit far back up the
    // snout, almost at the eyes (nostrilBack)
    ctx.fillStyle = C.line;
    const nn = hPt(d.nostrilBack ? 0.32 : 0.58, -0.14);
    ctx.beginPath();
    if (d.nostrilBack) ctx.ellipse(nn.x, nn.y, hl * 0.045, hh * 0.022, 0.2, 0, TAU);
    else ctx.ellipse(nn.x, nn.y, hl * 0.025, hh * 0.035, 0.3, 0, TAU);
    ctx.fill();
  }

  if (d.sauroHead) {
    // a real sauropod skull (atlasaurus, morosaurus/camarasaurus): short,
    // deep and ROUND — a domed nasal arch crowning the whole head, the
    // nostril high on the dome, a soft cheek crease behind the mouth
    ctx.fillStyle = C.mid;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.85;
    ctx.lineJoin = 'round';
    const d0 = hPt(-0.08, -0.22), dTop = hPt(0.18, -0.62), d1 = hPt(0.52, -0.16);
    ctx.beginPath();
    ctx.moveTo(d0.x, d0.y);
    ctx.quadraticCurveTo(hPt(-0.04, -0.56).x, hPt(-0.04, -0.56).y, dTop.x, dTop.y);   // rounded crown
    ctx.quadraticCurveTo(hPt(0.42, -0.52).x, hPt(0.42, -0.52).y, d1.x, d1.y);         // arch falls to the snout
    ctx.quadraticCurveTo(hPt(0.2, -0.2).x, hPt(0.2, -0.2).y, d0.x, d0.y);             // seam back into the face
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // lit crown of the arch
    ctx.strokeStyle = 'rgba(255,240,210,0.4)';
    ctx.lineWidth = lineW * 0.7;
    ctx.beginPath();
    ctx.moveTo(hPt(0.02, -0.48).x, hPt(0.02, -0.48).y);
    ctx.quadraticCurveTo(hPt(0.18, -0.6).x, hPt(0.18, -0.6).y, hPt(0.36, -0.5).x, hPt(0.36, -0.5).y);
    ctx.stroke();
    // the big nostril, high on the dome
    ctx.fillStyle = shade(C.mid, 0.55);
    const sn = hPt(0.3, -0.42);
    ctx.beginPath(); ctx.ellipse(sn.x, sn.y, hl * 0.05, hh * 0.06, 0.25, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.5;
    ctx.stroke();
    // soft cheek crease
    ctx.strokeStyle = 'rgba(30,26,14,0.3)';
    ctx.lineWidth = lineW * 0.7;
    ctx.beginPath();
    ctx.moveTo(hPt(0.12, 0.06).x, hPt(0.12, 0.06).y);
    ctx.quadraticCurveTo(hPt(0.22, 0.16).x, hPt(0.22, 0.16).y, hPt(0.34, 0.18).x, hPt(0.34, 0.18).y);
    ctx.stroke();
  }

  // species crests
  if (d.frill) {
    // kosmoceratops: ornate frill with forward-hooking hornlets, brow horns, nose horn
    const fb = hPt(-0.06, -0.3);                       // frill root
    const ft = hPt(-0.52, -1.05);                      // frill top-back
    ctx.fillStyle = C.acc;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.9;
    ctx.beginPath();
    ctx.moveTo(fb.x, fb.y);
    ctx.quadraticCurveTo(hPt(-0.5, -0.45).x, hPt(-0.5, -0.45).y, ft.x, ft.y);
    ctx.quadraticCurveTo(hPt(-0.18, -1.05).x, hPt(-0.18, -1.05).y, hPt(0.02, -0.52).x, hPt(0.02, -0.52).y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // darker heart of the frill
    ctx.fillStyle = shade(C.acc, 0.72);
    ctx.beginPath();
    ctx.ellipse(hPt(-0.26, -0.62).x, hPt(-0.26, -0.62).y, hl * 0.16, hh * 0.22, -0.5, 0, TAU);
    ctx.fill();
    // the kosmoceratops extras — a 'plain' frill (proto, centro & co) skips
    // them and wears its own horns from the flags below instead
    if (d.frill !== 'plain') {
      // hooked hornlets curling forward off the frill's crown
      ctx.fillStyle = shade(C.belly, 0.95);
      for (let k = 0; k < 3; k++) {
        const b = hPt(-0.44 + k * 0.16, -0.92 - k * 0.03);
        ctx.beginPath();
        ctx.moveTo(b.x - hl * 0.03, b.y);
        ctx.quadraticCurveTo(b.x + hl * 0.02, b.y - hh * 0.22, b.x + hl * 0.1, b.y - hh * 0.16);
        ctx.quadraticCurveTo(b.x + hl * 0.04, b.y - hh * 0.06, b.x + hl * 0.03, b.y);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      // long brow horns sweeping forward-down over the eyes
      const bh0 = hPt(0.12, -0.3);
      ctx.fillStyle = shade(C.belly, 0.95);
      ctx.beginPath();
      ctx.moveTo(bh0.x - hl * 0.04, bh0.y);
      ctx.quadraticCurveTo(hPt(0.3, -0.62).x, hPt(0.3, -0.62).y, hPt(0.44, -0.5).x, hPt(0.44, -0.5).y);
      ctx.quadraticCurveTo(hPt(0.28, -0.42).x, hPt(0.28, -0.42).y, bh0.x + hl * 0.06, bh0.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // stubby nose horn
      const nh = hPt(0.44, -0.22);
      ctx.beginPath();
      ctx.moveTo(nh.x - hl * 0.04, nh.y);
      ctx.quadraticCurveTo(nh.x, nh.y - hh * 0.24, nh.x + hl * 0.05, nh.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  if (d.noseHorn) {
    // one big centrosaur nose horn, curved gently back — sized by the flag
    const m = d.noseHorn;
    const nh = hPt(0.42, -0.2);
    ctx.fillStyle = shade(C.belly, 0.92);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.85;
    ctx.beginPath();
    ctx.moveTo(nh.x - hl * 0.08, nh.y);
    ctx.quadraticCurveTo(nh.x - hl * 0.05, nh.y - hh * 0.52 * m, nh.x + hl * 0.07, nh.y - hh * 0.74 * m);
    ctx.quadraticCurveTo(nh.x + hl * 0.1, nh.y - hh * 0.3 * m, nh.x + hl * 0.1, nh.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // lit leading edge
    ctx.strokeStyle = 'rgba(255,240,215,0.45)';
    ctx.lineWidth = lineW * 0.7;
    ctx.beginPath();
    ctx.moveTo(nh.x - hl * 0.05, nh.y - hh * 0.08);
    ctx.quadraticCurveTo(nh.x - hl * 0.02, nh.y - hh * 0.45 * m, nh.x + hl * 0.055, nh.y - hh * 0.64 * m);
    ctx.stroke();
  }
  if (d.lokiHorns) {
    // lokiceratops: two great blade horns sweeping out-and-back off the frill
    // crown (far one dim), plus a pair of brow blades — no nose horn at all
    for (const [dx, dim] of [[-0.1, true], [0, false]]) {
      const b0 = hPt(-0.22 + dx, -0.78);
      ctx.fillStyle = dim ? shade(C.acc, 0.68) : C.acc;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = lineW * 0.85;
      ctx.beginPath();
      ctx.moveTo(b0.x - hl * 0.06, b0.y);
      ctx.quadraticCurveTo(hPt(-0.62 + dx, -1.3).x, hPt(-0.62 + dx, -1.3).y, hPt(-0.86 + dx, -1.22).x, hPt(-0.86 + dx, -1.22).y);
      ctx.quadraticCurveTo(hPt(-0.5 + dx, -0.98).x, hPt(-0.5 + dx, -0.98).y, b0.x + hl * 0.08, b0.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // brow blades over the eyes
    const bb = hPt(0.14, -0.32);
    ctx.fillStyle = shade(C.belly, 0.92);
    ctx.beginPath();
    ctx.moveTo(bb.x - hl * 0.04, bb.y);
    ctx.quadraticCurveTo(hPt(0.26, -0.6).x, hPt(0.26, -0.6).y, hPt(0.38, -0.56).x, hPt(0.38, -0.56).y);
    ctx.quadraticCurveTo(hPt(0.26, -0.42).x, hPt(0.26, -0.42).y, bb.x + hl * 0.06, bb.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if (d.fanCrest) {
    // lambeosaurine fan crest: a rounded axe-blade plate swept up and back
    // over the neck — olorotitan wears it tall, magnapaulia low
    const m = d.fanCrest;
    const f0 = hPt(0.14, -0.3);
    ctx.fillStyle = C.acc;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.85;
    ctx.beginPath();
    ctx.moveTo(f0.x, f0.y);
    ctx.quadraticCurveTo(hPt(-0.1, -0.6 - 0.55 * m).x, hPt(-0.1, -0.6 - 0.55 * m).y,
      hPt(-0.5, -0.62 - 0.6 * m).x, hPt(-0.5, -0.62 - 0.6 * m).y);      // crest crown
    ctx.quadraticCurveTo(hPt(-0.78, -0.62 - 0.4 * m).x, hPt(-0.78, -0.62 - 0.4 * m).y,
      hPt(-0.62, -0.36).x, hPt(-0.62, -0.36).y);                        // trailing point
    ctx.quadraticCurveTo(hPt(-0.3, -0.3).x, hPt(-0.3, -0.3).y, hPt(-0.05, -0.34).x, hPt(-0.05, -0.34).y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // darker heart + lit top rim
    ctx.fillStyle = shade(C.acc, 0.72);
    ctx.beginPath();
    ctx.ellipse(hPt(-0.4, -0.55 - 0.4 * m).x, hPt(-0.4, -0.55 - 0.4 * m).y, hl * 0.14, hh * 0.2 * m, -0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,232,205,0.4)';
    ctx.lineWidth = lineW * 0.7;
    ctx.beginPath();
    ctx.moveTo(hPt(0.05, -0.44 - 0.3 * m).x, hPt(0.05, -0.44 - 0.3 * m).y);
    ctx.quadraticCurveTo(hPt(-0.16, -0.62 - 0.5 * m).x, hPt(-0.16, -0.62 - 0.5 * m).y,
      hPt(-0.44, -0.66 - 0.5 * m).x, hPt(-0.44, -0.66 - 0.5 * m).y);
    ctx.stroke();
  }
  if (key === 'spino') {
    // the maroccanus skull is its own thing: a small keeled nasal crest just
    // ahead of the eyes, and a bulbous notched rosette at the snout tip
    ctx.fillStyle = C.acc;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.75;
    const c0 = hPt(0.14, -0.3), c1 = hPt(0.3, -0.62), c2 = hPt(0.44, -0.26);
    ctx.beginPath();
    ctx.moveTo(c0.x, c0.y);
    ctx.quadraticCurveTo(hPt(0.2, -0.58).x, hPt(0.2, -0.58).y, c1.x, c1.y);
    ctx.quadraticCurveTo(hPt(0.4, -0.52).x, hPt(0.4, -0.52).y, c2.x, c2.y);
    ctx.quadraticCurveTo(hPt(0.3, -0.32).x, hPt(0.3, -0.32).y, c0.x, c0.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,235,205,0.4)';
    ctx.lineWidth = lineW * 0.6;
    ctx.beginPath();
    ctx.moveTo(hPt(0.18, -0.42).x, hPt(0.18, -0.42).y);
    ctx.quadraticCurveTo(hPt(0.28, -0.56).x, hPt(0.28, -0.56).y, hPt(0.38, -0.44).x, hPt(0.38, -0.44).y);
    ctx.stroke();
    // rosette: the swollen tip of the snout, pinched behind by a notch
    ctx.strokeStyle = 'rgba(22,28,38,0.55)';
    ctx.lineWidth = lineW * 0.7;
    ctx.beginPath();
    ctx.moveTo(hPt(0.55, -0.2).x, hPt(0.55, -0.2).y);
    ctx.quadraticCurveTo(hPt(0.53, 0.0).x, hPt(0.53, 0.0).y, hPt(0.56, 0.14).x, hPt(0.56, 0.14).y);
    ctx.stroke();
    // scaly croc texture: a few keeled scute dots along the skull roof
    ctx.fillStyle = 'rgba(20,26,36,0.35)';
    for (const [fx, fy] of [[0.0, -0.32], [-0.1, -0.24], [0.08, -0.2], [0.46, -0.3]]) {
      const sp2 = hPt(fx, fy);
      ctx.beginPath(); ctx.ellipse(sp2.x, sp2.y, hl * 0.018, hh * 0.03, 0.2, 0, TAU); ctx.fill();
    }
  }
  if (d.browRidge) {
    // carcharodontosaurid brow: heavy rugose bone bosses over each eye and a
    // rough low crest running up the snout — the PE-Carchar profile
    ctx.fillStyle = shade(C.acc, 0.85);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.8;
    const b0 = hPt(-0.02, -0.32), b1 = hPt(0.1, -0.52), b2 = hPt(0.26, -0.34);
    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.quadraticCurveTo(b1.x - hl * 0.05, b1.y, b1.x, b1.y);
    ctx.quadraticCurveTo(b1.x + hl * 0.08, b1.y + hh * 0.04, b2.x, b2.y);
    ctx.quadraticCurveTo(hPt(0.12, -0.36).x, hPt(0.12, -0.36).y, b0.x, b0.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // the rough snout crest — a chain of low rugged bumps down the muzzle
    for (let k = 0; k < 3; k++) {
      const b = hPt(0.34 + k * 0.11, -0.26 + k * 0.015);
      ctx.beginPath();
      ctx.moveTo(b.x - hl * 0.035, b.y + hh * 0.03);
      ctx.quadraticCurveTo(b.x, b.y - hh * 0.1, b.x + hl * 0.035, b.y + hh * 0.03);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // lit crown of the brow boss
    ctx.fillStyle = 'rgba(255,230,200,0.3)';
    ctx.beginPath();
    ctx.ellipse(hPt(0.09, -0.44).x, hPt(0.09, -0.44).y, hl * 0.05, hh * 0.05, -0.3, 0, TAU);
    ctx.fill();
  }
  if (d.snoutBumps) {
    // the alioramin row of little rugged bumps along the long snout
    ctx.fillStyle = shade(C.acc, 0.9);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.6;
    for (let k = 0; k < 4; k++) {
      const b = hPt(0.24 + k * 0.12, -0.3 - 0.02 * Math.abs(k - 1.5));
      ctx.beginPath();
      ctx.moveTo(b.x - hl * 0.025, b.y + hh * 0.03);
      ctx.quadraticCurveTo(b.x, b.y - hh * 0.09, b.x + hl * 0.025, b.y + hh * 0.03);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  if (d.tusks) {
    // heterodontosaurid fangs peeking from an otherwise beaked mouth
    ctx.fillStyle = '#f2ead4';
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.4;
    const t0 = hPt(0.34, 0.22);
    ctx.beginPath();
    ctx.moveTo(t0.x - hl * 0.025, t0.y - hh * 0.06);
    ctx.lineTo(t0.x + hl * 0.025, t0.y - hh * 0.06);
    ctx.lineTo(t0.x, t0.y + hh * 0.12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if (d.hornBoss) {
    // the abelisaurid signature: a rounded horn boss on the forehead
    const b0 = hPt(0.0, -0.42), b1 = hPt(0.14, -0.78), b2 = hPt(0.32, -0.44);
    ctx.fillStyle = C.acc;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.85;
    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.quadraticCurveTo(b1.x - hl * 0.1, b1.y, b1.x, b1.y);
    ctx.quadraticCurveTo(b1.x + hl * 0.12, b1.y + hh * 0.02, b2.x, b2.y);
    ctx.quadraticCurveTo(hPt(0.16, -0.4).x, hPt(0.16, -0.4).y, b0.x, b0.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // lit face of the boss
    ctx.fillStyle = 'rgba(255,220,190,0.28)';
    ctx.beginPath();
    ctx.moveTo(hPt(0.05, -0.5).x, hPt(0.05, -0.5).y);
    ctx.quadraticCurveTo(hPt(0.1, -0.7).x, hPt(0.1, -0.7).y, hPt(0.15, -0.72).x, hPt(0.15, -0.72).y);
    ctx.quadraticCurveTo(hPt(0.1, -0.52).x, hPt(0.1, -0.52).y, hPt(0.05, -0.5).x, hPt(0.05, -0.5).y);
    ctx.closePath(); ctx.fill();
  }
  if (key === 'nivalo') {
    // the titanosauriform badge: ONE smooth nasal dome bulging from the
    // crown, nostril riding high on its face — the giraffatitan profile.
    // Fill blends into the head; only the TOP arc gets an outline, so no
    // stray line ever crosses the face.
    const dc = hPt(0.24, -0.42);
    ctx.fillStyle = C.mid;
    ctx.beginPath();
    ctx.ellipse(dc.x, dc.y, hl * 0.32, hh * 0.6, headAng, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.85;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(dc.x, dc.y, hl * 0.32, hh * 0.6, headAng, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    // nostril high on the dome
    ctx.fillStyle = C.line;
    const dn = hPt(0.38, -0.6);
    ctx.beginPath(); ctx.ellipse(dn.x, dn.y, hl * 0.035, hh * 0.05, 0.4 + headAng, 0, TAU); ctx.fill();
    // cold light on the dome's crown
    ctx.strokeStyle = 'rgba(255,250,240,0.4)';
    ctx.lineWidth = lineW * 0.55;
    ctx.beginPath();
    ctx.ellipse(dc.x, dc.y, hl * 0.24, hh * 0.44, headAng, Math.PI * 1.15, Math.PI * 1.6);
    ctx.stroke();
  }
  if (key === 'campto') {
    // subtle cheek ridge on the long ornithopod face
    ctx.strokeStyle = 'rgba(34,46,20,0.5)';
    ctx.lineWidth = lineW * 0.7;
    ctx.beginPath();
    const ch0 = hPt(0.05, 0.08), ch1 = hPt(0.24, 0.14);
    ctx.moveTo(ch0.x, ch0.y);
    ctx.quadraticCurveTo(hPt(0.15, 0.16).x, hPt(0.15, 0.16).y, ch1.x, ch1.y);
    ctx.stroke();
  }
  if (key === 'guanlong') {
    // tall thin midline crest
    const c0 = hPt(-0.15, -0.42), c1 = hPt(0.18, -1.15), c2 = hPt(0.46, -0.3);
    ctx.fillStyle = C.acc;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.8;
    ctx.beginPath();
    ctx.moveTo(c0.x, c0.y);
    ctx.quadraticCurveTo(c1.x, c1.y, c2.x, c2.y);
    ctx.quadraticCurveTo(hPt(0.1, -0.5).x, hPt(0.1, -0.5).y, c0.x, c0.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,50,10,0.5)';
    ctx.beginPath();
    const cm = hPt(0.14, -0.8);
    ctx.moveTo(c0.x + hl * 0.06, c0.y);
    ctx.quadraticCurveTo(cm.x, cm.y, c2.x - hl * 0.05, c2.y - hh * 0.1);
    ctx.stroke();
  }
  if (d.tubeCrest) {
    // charonosaurus: the long hollow parasaur tube, swept back over the neck
    const t0 = hPt(0.05, -0.3), tm = hPt(-0.55, -0.95), t1 = hPt(-1.15, -1.2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.line;
    ctx.lineWidth = hh * 0.34 + lineW * 1.5;
    ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.quadraticCurveTo(tm.x, tm.y, t1.x, t1.y); ctx.stroke();
    ctx.strokeStyle = C.acc;
    ctx.lineWidth = hh * 0.34;
    ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.quadraticCurveTo(tm.x, tm.y, t1.x, t1.y); ctx.stroke();
    // lit top edge
    ctx.strokeStyle = 'rgba(255,232,200,0.35)';
    ctx.lineWidth = hh * 0.1;
    const l0 = hPt(0.0, -0.42), lm = hPt(-0.55, -1.06), l1 = hPt(-1.05, -1.26);
    ctx.beginPath(); ctx.moveTo(l0.x, l0.y); ctx.quadraticCurveTo(lm.x, lm.y, l1.x, l1.y); ctx.stroke();
  }
  if (d.casque) {
    // oviraptor: a round bony casque high on the forehead
    ctx.fillStyle = C.acc;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.8;
    ctx.beginPath();
    const q0 = hPt(-0.08, -0.38), q1 = hPt(0.12, -1.0), q2 = hPt(0.36, -0.36);
    ctx.moveTo(q0.x, q0.y);
    ctx.quadraticCurveTo(hPt(-0.06, -0.9).x, hPt(-0.06, -0.9).y, q1.x, q1.y);
    ctx.quadraticCurveTo(hPt(0.34, -0.85).x, hPt(0.34, -0.85).y, q2.x, q2.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,245,225,0.35)';
    ctx.beginPath();
    ctx.ellipse(hPt(0.08, -0.72).x, hPt(0.08, -0.72).y, hl * 0.09, hh * 0.14, -0.3, 0, TAU);
    ctx.fill();
  }
  if (d.duckbill) {
    // hadrosaur spoonbill: a wide flat keratin beak capping the snout.
    // Anchored to the REAL snout point — fixed head-fractions ended mid-nose
    // and left the dino's own snout poking out past its bill
    const b0 = hPt(0.24, -0.14);
    ctx.fillStyle = shade(C.belly, 0.9);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.85;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.quadraticCurveTo(hPt(0.55, -0.26).x, hPt(0.55, -0.26).y, snout.x + hl * 0.08, snout.y - hh * 0.04);          // top edge, out past the snout
    ctx.quadraticCurveTo(snout.x + hl * 0.13, snout.y + hh * 0.2, snout.x + hl * 0.01, snout.y + hh * 0.34);          // rounded bill tip, proud of the outline
    ctx.quadraticCurveTo(hPt(0.4, 0.4).x, hPt(0.4, 0.4).y, hPt(0.22, 0.3).x, hPt(0.22, 0.3).y);                       // lower lip back
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // bill nostril + a soft shading line where beak meets face
    ctx.fillStyle = shade(C.mid, 0.55);
    const nb = hPt(0.34, -0.03);
    ctx.beginPath(); ctx.ellipse(nb.x, nb.y, hl * 0.035, hh * 0.05, 0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,20,0.25)';
    ctx.lineWidth = lineW * 0.7;
    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.quadraticCurveTo(hPt(0.24, 0.08).x, hPt(0.24, 0.08).y, hPt(0.22, 0.28).x, hPt(0.22, 0.28).y);
    ctx.stroke();
  }

  // brow ridge
  ctx.strokeStyle = C.line;
  ctx.lineWidth = lineW * 0.7;
  const br0 = hPt(-0.06, -0.32), br1 = hPt(0.2, -0.36);
  ctx.beginPath(); ctx.moveTo(br0.x, br0.y); ctx.quadraticCurveTo(hPt(0.08, -0.42).x, hPt(0.08, -0.42).y, br1.x, br1.y); ctx.stroke();

  // eye
  const ep = hPt(0.08, -0.12);
  const er = Math.min(hh * 0.5, hh * 0.22 * eyeMul * (d.bigEye || 1));
  if (blink) {
    // closed eyelid with a soft lash line
    ctx.fillStyle = shade(C.mid, 0.96);
    ctx.beginPath();
    ctx.ellipse(ep.x, ep.y, er * (g < 0.35 ? 1.15 : 0.95), er * (g < 0.35 ? 1.05 : 0.8), 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.75;
    ctx.beginPath();
    ctx.moveTo(ep.x - er * 0.8, ep.y);
    ctx.quadraticCurveTo(ep.x, ep.y + er * 0.42, ep.x + er * 0.8, ep.y);
    ctx.stroke();
  } else if (g < 0.35) {
    // hatchling: huge glossy eye
    ctx.fillStyle = 'rgba(250,245,230,0.9)';
    ctx.beginPath(); ctx.ellipse(ep.x, ep.y, er * 1.15, er * 1.05, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#241a10';
    ctx.beginPath(); ctx.arc(ep.x + er * 0.06, ep.y + er * 0.04, er * 0.88, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ep.x - er * 0.28, ep.y - er * 0.3, er * 0.32, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(ep.x + er * 0.28, ep.y + er * 0.24, er * 0.13, 0, TAU); ctx.fill();
    // eyelid
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.8;
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, er * 1.1, -Math.PI * 0.85, -Math.PI * 0.25);
    ctx.stroke();
  } else {
    // adult: keen eye with ring, iris and slit pupil
    ctx.fillStyle = shade(C.mid, 1.25);
    ctx.beginPath(); ctx.ellipse(ep.x, ep.y, er * 1.25, er * 1.05, -0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = C.eye;
    ctx.beginPath(); ctx.ellipse(ep.x, ep.y, er * 0.85, er * 0.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#140c04';
    ctx.beginPath(); ctx.ellipse(ep.x, ep.y, er * 0.24, er * 0.72, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(ep.x - er * 0.25, ep.y - er * 0.3, er * 0.16, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.6;
    ctx.beginPath(); ctx.ellipse(ep.x, ep.y, er * 1.25, er * 1.05, -0.1, 0, TAU); ctx.stroke();
  }
}

// small folded arms for bipeds (near side only)
function drawArm(ctx, d, C, a) {
  const { x, y, s, lineW, key, ph, move, atk } = a;
  const swing = Math.sin(ph) * 0.1 * move;
  if (d.bigClaws) {
    // therizinosaurid: a long shaggy arm ending in scythe claws that hang
    // lower than the knees — and for claw-fighters (and arm-swipers like
    // spinosaurus), the whole arm SWIPES on attack (pre-loaded high at the
    // hit frame, slashing down-through, same timing profile as the tail whip)
    const swipePh = atk > 0 && (d.clawWeapon || d.armSwipe) ? 1 - atk : -1;
    const swipeA = swipePh >= 0
      ? -(1 - swipePh) * Math.sin((0.25 + swipePh * 1.1) * TAU) * 1.1
      : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(swipeA);       // rotate the whole arm about the shoulder
    ctx.translate(-x, -y);
    const el = x + 4.5 * s, ely = y + 3.5 * s + swing * 5 * s;   // elbow
    const wx = el + 4 * s, wy = ely + 4 * s;                     // wrist, reaching down-forward
    ctx.strokeStyle = shade(C.mid, 0.92);
    ctx.lineWidth = Math.max(1.6, 3.2 * s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(el, ely, wx, wy);
    ctx.stroke();
    if (d.fuzz) {
      // shaggy filo-feather fringe on the upper arm (feathered species only —
      // a scaly spinosaur arm stays bare)
      ctx.strokeStyle = shade(C.mid, 1.05);
      ctx.lineWidth = lineW * 0.7;
      for (let k = 0; k < 4; k++) {
        const t = 0.2 + k * 0.2;
        const px = lerp(x, wx, t), py = lerp(y, wy, t) - 1 * s;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 2 * s, py - 3 * s - k * 0.3 * s); ctx.stroke();
      }
    }
    // three great curved claws, filled and tapered — big, but clearly SHORTER
    // than the legs, tips hanging around mid-shin (never touching the ground).
    // clawLen tunes them per species: the therizinosaur's scythes vs the
    // spinosaur's stout fish-hooks
    const cl = d.clawLen || 11;
    for (let k = 0; k < 3; k++) {
      const spread = (k - 1) * 1.5 * s;
      const bx = wx + spread, by = wy;
      const tipx = wx + spread * 0.4 - 2 * s, tipy = wy + (cl - k * 1.2) * s;
      ctx.fillStyle = k === 1 ? C.acc : shade(C.acc, 0.9);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = lineW * 0.7;
      ctx.beginPath();
      ctx.moveTo(bx - 1.2 * s, by);
      ctx.quadraticCurveTo(bx + 2.8 * s, by + 6 * s, tipx, tipy);           // outer edge
      ctx.quadraticCurveTo(bx + 0.5 * s, by + 6 * s, bx + 1.2 * s, by);     // inner edge back to knuckle
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // lit ridge down the claw
      ctx.strokeStyle = 'rgba(255,250,235,0.4)';
      ctx.lineWidth = lineW * 0.5;
      ctx.beginPath();
      ctx.moveTo(bx, by + 1 * s);
      ctx.quadraticCurveTo(bx + 1.6 * s, by + 6 * s, tipx + 0.6 * s, tipy - 1.2 * s);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.strokeStyle = shade(C.shade, 0.9);
  ctx.fillStyle = shade(C.shade, 0.9);
  ctx.lineWidth = Math.max(1, 2.2 * s * (key === 'ornitho' ? 0.8 : 1));
  ctx.lineCap = 'round';
  const ex = x + 3.5 * s, ey = y + 4 * s + swing * 6 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 1 * s, y + 3 * s, ex, ey);
  ctx.lineTo(ex + 2.6 * s, ey - 1.2 * s);
  ctx.stroke();
  if (d.plume && key === 'ornitho') {
    // feathered forearm
    ctx.fillStyle = shade(C.mid, 1.1);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.6;
    ctx.beginPath();
    ctx.ellipse(ex + 0.5 * s, ey + 0.6 * s, 3.4 * s, 1.3 * s, 0.5, 0, TAU);
    ctx.fill(); ctx.stroke();
  } else {
    // claw
    ctx.strokeStyle = C.line;
    ctx.lineWidth = lineW * 0.6;
    ctx.beginPath();
    ctx.moveTo(ex + 2.6 * s, ey - 1.2 * s);
    ctx.lineTo(ex + 3.6 * s, ey - 0.4 * s);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// carcass
// ---------------------------------------------------------------------------
// a protoceratops burrow mouth: kicked-up dirt mound around a dark hole.
// A claimed one flies the pack's little feather marker
function drawBurrow(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  drawShadow(ctx, 0, 1, 15);
  ctx.fillStyle = '#6a4e30';
  ctx.strokeStyle = '#33220f';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0, -3, 16, 7.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7e5e3a';
  ctx.beginPath(); ctx.ellipse(-4, -6.5, 9, 4, -0.15, 0, TAU); ctx.fill();
  // the hole itself
  ctx.fillStyle = '#17100a';
  ctx.beginPath(); ctx.ellipse(3, -4.5, 6.5, 3.6, 0.1, 0, TAU); ctx.fill(); ctx.stroke();
  // claw scratches in the spoil heap
  ctx.strokeStyle = '#4a3418';
  ctx.lineWidth = 0.8;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(-10 + k * 3, 0.5);
    ctx.lineTo(-13 + k * 3, 3.5);
    ctx.stroke();
  }
  if (b.owned) {
    // the pack's feather, planted in the mound
    ctx.strokeStyle = '#33220f';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-11, -16); ctx.stroke();
    ctx.fillStyle = '#e8c25a';
    ctx.beginPath();
    ctx.ellipse(-11.5, -17.5, 2.2, 4.2, 0.5, 0, TAU);
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawCarcass(ctx, c) {
  // carried things ride at the carrier's mouth — lifted for the draw only
  const lift = c.carried ? (c.liftY || 0) + Math.sin(G.time * 9) * 0.8 : 0;
  if (c.chunk) {
    // a torn chunk of meat, bone peeking out of one end
    ctx.save();
    ctx.translate(c.x, c.y - lift);
    const r = 3 + c.maxMeat * 0.09;
    ctx.fillStyle = '#a03226'; ctx.strokeStyle = '#4a1410'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25, r * 0.85, -0.25, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8503c';
    ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.22, r * 0.6, r * 0.38, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8dcc8';
    ctx.beginPath(); ctx.ellipse(r * 0.9, -r * 0.45, r * 0.42, r * 0.2, 0.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    return;
  }
  const d = DINO[c.species], C = d.col;
  const s = d.scale * 0.95 * sizeScale(c.growth != null ? c.growth : 1);
  const bw = d.L.body[0] * s, bh = d.L.body[1] * s;
  const fresh = c.meat / c.maxMeat;
  if (d.fish) {
    // a gar floating belly-up
    ctx.save();
    ctx.translate(c.x, c.y - lift);
    ctx.strokeStyle = 'rgba(225,240,238,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, bw * 0.7, bh * 0.8, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = mixHex(C.belly, '#9a8d78', 1 - fresh);
    ctx.strokeStyle = C.line;
    ctx.beginPath(); ctx.ellipse(0, -1, bw * 0.55, bh * 0.42, 0.06, 0, TAU); ctx.fill(); ctx.stroke();
    // snout + limp tail fin
    ctx.fillStyle = mixHex(C.mid, '#8a7a64', 1 - fresh);
    ctx.beginPath();
    ctx.moveTo(bw * 0.5, -1); ctx.lineTo(bw * 0.75, 0.5); ctx.lineTo(bw * 0.5, 1.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-bw * 0.52, -1); ctx.lineTo(-bw * 0.72, -bh * 0.4); ctx.lineTo(-bw * 0.68, 1.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // X eye
    ctx.strokeStyle = C.line; ctx.lineWidth = 0.8;
    const exx = bw * 0.32, eyy = -bh * 0.14;
    ctx.beginPath(); ctx.moveTo(exx - 1.2, eyy - 1.2); ctx.lineTo(exx + 1.2, eyy + 1.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(exx + 1.2, eyy - 1.2); ctx.lineTo(exx - 1.2, eyy + 1.2); ctx.stroke();
    ctx.restore();
    return;
  }
  // ---- the real animal, fallen on its side: its own proportions, skinned
  // with the same spine technique as the living dino, signature parts and
  // all — a dead huayango should still look like a huayango.
  const L = d.L;
  const bl = L.body[0] * s, bhh = L.body[1] * s;
  const tl = L.tail[0] * s, hl2 = L.head[0] * s, hh2 = L.head[1] * s, nl = L.neckLen * s;
  const hsh = hash2(Math.round(c.x * 0.7), Math.round(c.y * 0.7));
  const decay = 1 - fresh;
  const deflate = 0.72 + 0.28 * fresh;              // the body sinks as it's eaten
  const tint = (col) => mixHex(col, '#8f7f68', decay * 0.5);

  ctx.save();
  ctx.translate(c.x, c.y - lift);
  if (!c.carried) drawShadow(ctx, 0, 1, bl * 0.6);
  // fading ground stain while the kill is fresh
  if (fresh > 0.4) {
    ctx.fillStyle = 'rgba(96,26,16,' + ((fresh - 0.4) * 0.3).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(bl * 0.1, 1.5, bl * 0.55, bhh * 0.3, 0, 0, TAU); ctx.fill();
  }
  ctx.scale(hsh > 0.5 ? 1 : -1, 1);                 // falls either way
  ctx.rotate((hsh - 0.5) * 0.14);

  // lying spine: tail resting on the ground → slumped torso → neck dropping
  // back down → head flat, snout in the dirt
  const pts = [];
  for (let i = 4; i >= 1; i--) {
    const t = i / 4;
    const pad = d.paddleTail ? bhh * 0.3 * Math.pow(Math.sin(clamp((t - 0.62) / 0.38, 0, 1) * Math.PI * 0.82), 0.75) : 0;
    pts.push({
      x: -bl * 0.42 - tl * t,
      y: -1.5 - Math.sin(t * 2.2) * 1.5 * s,
      w: Math.max(0.8, (bhh * 0.3 * Math.pow(1 - t, 0.9) + 0.6 * s + pad) * deflate),
    });
  }
  pts.push({ x: -bl * 0.38, y: -bhh * 0.3, w: bhh * 0.36 * deflate });
  pts.push({ x: -bl * 0.14, y: -bhh * 0.4, w: bhh * 0.46 * deflate });
  pts.push({ x: bl * 0.12, y: -bhh * 0.38, w: bhh * 0.44 * deflate });
  pts.push({ x: bl * 0.32, y: -bhh * 0.26, w: bhh * 0.34 * deflate });
  const hx = bl * 0.42 + nl * 0.8;
  pts.push({ x: bl * 0.42 + nl * 0.45, y: -bhh * 0.14, w: Math.max(2, bhh * 0.24 * deflate) });
  pts.push({ x: hx, y: -hh2 * 0.42, w: hh2 * 0.52 });
  pts.push({ x: hx + hl2 * 0.42, y: -hh2 * 0.3, w: hh2 * 0.36 });
  pts.push({ x: hx + hl2 * 0.8, y: -hh2 * 0.22, w: hh2 * (d.diet === 'carn' ? 0.2 : 0.16) });

  const skin = skinPath(pts);
  ctx.fillStyle = tint(shade(C.mid, 0.88));
  ctx.fill(skin.path);
  ctx.save();
  ctx.clip(skin.path);
  // pale underside band along the ground line + a little species speckle
  ctx.fillStyle = tint(shade(C.belly, 0.92));
  ctx.beginPath(); ctx.ellipse(0, 2.5, bl * 0.9, bhh * 0.4, 0.03, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(20,12,4,0.10)';
  const rng = speckleRng(Math.round(c.x) * 31 + 7);
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.ellipse(-bl * 0.4 + rng() * bl * 0.9, -bhh * 0.5 + rng() * bhh * 0.5, (0.7 + rng()) * s, (0.5 + rng() * 0.5) * s, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = Math.max(0.9, 1.05 * s);
  ctx.stroke(skin.path);

  // the species' signature parts drape along the fallen back — sails, plates,
  // scutes, humps, shoulder blades, tail plumes all still identify the animal
  drawBodyExtras(ctx, c.species, d, C, {
    cy: -bhh * 0.32, bodyL: bl, bodyH: bhh * deflate, s,
    lineW: Math.max(0.8, s), skin, ph: 0,
  });
  if (d.tubeCrest) {
    // charonosaurus' tube, resting over the neck
    ctx.strokeStyle = C.line; ctx.lineCap = 'round';
    ctx.lineWidth = hh2 * 0.34 + 1.6;
    ctx.beginPath(); ctx.moveTo(hx + hl2 * 0.05, -hh2 * 0.72); ctx.quadraticCurveTo(hx - hl2 * 0.55, -hh2 * 0.95, hx - hl2 * 1.05, -hh2 * 0.7); ctx.stroke();
    ctx.strokeStyle = tint(C.acc);
    ctx.lineWidth = hh2 * 0.34;
    ctx.beginPath(); ctx.moveTo(hx + hl2 * 0.05, -hh2 * 0.72); ctx.quadraticCurveTo(hx - hl2 * 0.55, -hh2 * 0.95, hx - hl2 * 1.05, -hh2 * 0.7); ctx.stroke();
  }
  if (d.frill) {
    // kosmoceratops' frill disc behind the fallen head
    ctx.fillStyle = tint(shade(C.acc, 0.9));
    ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(0.8, s);
    ctx.beginPath(); ctx.ellipse(hx - hl2 * 0.45, -hh2 * 0.75, hl2 * 0.42, hh2 * 0.58, -0.35, 0, TAU);
    ctx.fill(); ctx.stroke();
  }

  // stiff legs in the air, bent at the knee — the universal sign of an ex-dinosaur
  const legL = L.leg[0] * s * 0.85, lw = Math.max(1.4, L.leg[1] * s * 0.85);
  ctx.strokeStyle = tint(shade(C.mid, 0.68));
  ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const legAnchors = d.biped
    ? [[-bl * 0.16, 1], [-bl * 0.02, 0.85]]
    : [[-bl * 0.2, 1], [-bl * 0.06, 0.85], [bl * 0.18, 0.8], [bl * 0.3, 0.65]];
  legAnchors.forEach(([ox, k], i) => {
    const ay = -bhh * 0.62 * deflate;                   // clear of the fallen flank
    const a1 = -1.75 + i * 0.24 + (hsh - 0.5) * 0.2;    // thigh up
    const a2 = a1 + 1.15;                               // shin folded over
    const kx = ox + Math.cos(a1) * legL * 0.6 * k, ky = ay + Math.sin(a1) * legL * 0.6 * k;
    const fx = kx + Math.cos(a2) * legL * 0.5 * k, fy = ky + Math.sin(a2) * legL * 0.5 * k;
    ctx.beginPath(); ctx.moveTo(ox, ay); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    // little foot pad
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 2.6 * s * k, fy - 1 * s); ctx.stroke();
  });
  if (d.biped && (d.armScale || 1) > 0.3) {
    // one limp little arm
    ctx.lineWidth = Math.max(1, lw * 0.45);
    ctx.beginPath(); ctx.moveTo(bl * 0.3, -bhh * 0.3); ctx.quadraticCurveTo(bl * 0.34, -bhh * 0.1, bl * 0.3 + 2 * s, 0); ctx.stroke();
  }

  // head detail: X eye and a slack jaw
  ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(0.8, 0.9 * s);
  const exx = hx + hl2 * 0.05, eyy = -hh2 * 0.5;
  const er = Math.max(1.1, hh2 * 0.14);
  ctx.beginPath(); ctx.moveTo(exx - er, eyy - er); ctx.lineTo(exx + er, eyy + er); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(exx + er, eyy - er); ctx.lineTo(exx - er, eyy + er); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx + hl2 * 0.3, -hh2 * 0.16);
  ctx.quadraticCurveTo(hx + hl2 * 0.55, -hh2 * 0.08, hx + hl2 * 0.78, -hh2 * 0.14);
  ctx.stroke();
  if (fresh > 0.3) {
    // a tiny lolling tongue
    ctx.fillStyle = '#c96a6a';
    ctx.beginPath(); ctx.ellipse(hx + hl2 * 0.62, -hh2 * 0.04, hl2 * 0.09, hh2 * 0.09, 0.4, 0, TAU); ctx.fill();
  }

  // picked open: ribs emerge over the torso as the meat runs out
  if (fresh < 0.55) {
    ctx.fillStyle = 'rgba(110,28,18,0.45)';
    ctx.beginPath(); ctx.ellipse(-bl * 0.02, -bhh * 0.36, bl * 0.26, bhh * 0.26 * deflate, 0.05, 0, TAU); ctx.fill();
    ctx.strokeStyle = mixHex('#e4dac4', '#cfc4a8', decay);
    ctx.lineWidth = Math.max(0.9, 1.3 * s);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-bl * 0.2 + i * bl * 0.13, -bhh * 0.34, bhh * 0.3 * deflate, Math.PI * 1.05, Math.PI * 1.98);
      ctx.stroke();
    }
    // spine ridge showing along the back
    if (fresh < 0.25) {
      ctx.beginPath();
      ctx.moveTo(-bl * 0.3, -bhh * (0.3 + 0.36 * deflate));
      ctx.quadraticCurveTo(0, -bhh * (0.4 + 0.4 * deflate), bl * 0.28, -bhh * (0.28 + 0.32 * deflate));
      ctx.stroke();
    }
  }
  ctx.restore();
  // flies
  ctx.fillStyle = 'rgba(30,25,15,0.8)';
  for (let i = 0; i < 3; i++) {
    const t = G.time * (2 + i * 0.7) + i * 2.1;
    ctx.fillRect(c.x + Math.cos(t) * (6 + i * 3), c.y - bh * 0.6 + Math.sin(t * 1.7) * 4, 1, 1);
  }
}

function drawEgg(ctx, x, y, s, broken) {
  ctx.fillStyle = '#ece4d0';
  ctx.strokeStyle = '#8a7a5e';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  if (broken) {
    ctx.moveTo(x - 3 * s, y);
    ctx.quadraticCurveTo(x - 3.4 * s, y - 3 * s, x - 1.5 * s, y - 3.4 * s);
    ctx.lineTo(x - 0.5 * s, y - 2.2 * s); ctx.lineTo(x + 0.5 * s, y - 3.2 * s); ctx.lineTo(x + 1.5 * s, y - 2.2 * s);
    ctx.quadraticCurveTo(x + 3.2 * s, y - 2.4 * s, x + 3 * s, y);
    ctx.closePath();
  } else {
    ctx.ellipse(x, y - 2.4 * s, 2.8 * s, 3.4 * s, 0, 0, TAU);
  }
  ctx.fill(); ctx.stroke();
  // speckles
  ctx.fillStyle = 'rgba(140,120,90,0.55)';
  ctx.fillRect(x - 1.4 * s, y - 3.4 * s, 0.8 * s, 0.8 * s);
  ctx.fillRect(x + 0.6 * s, y - 2.2 * s, 0.8 * s, 0.8 * s);
  ctx.fillRect(x - 0.4 * s, y - 1.4 * s, 0.8 * s, 0.8 * s);
}
