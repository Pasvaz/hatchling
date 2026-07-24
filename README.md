# HATCHLING — A Dinosaur Survival Game

An illustrated dinosaur survival game based on the design brief in
[transcript_cleaned.md](transcript_cleaned.md). You hatch as a tiny dinosaur
(big head, big eyes) and must eat, drink, and stay clean while you grow into a
full adult — without being eaten yourself.

The game opens on a **player profile** screen — create a player (or pick one)
and everything you do is saved under that name: growths, unlocks, purchases and
every dinosaur's progress. Click your name next to the ❖ balance in the lobby
to switch players.

The game is one long **mastery ladder**: you start as Rajasaurus, and every
time you grow a dinosaur to Full Adult the **next dinosaur on the ladder
unlocks** — and when you master the last dinosaur of an ecosystem, the **next
land opens** with its first dinosaur. The chain runs through six ecosystems:
**Fern Valley** (Rajasaurus → Camptosaurus), **Skull Prairie** — a wide
bone-strewn grassland with ponds and a southern swamp (Ichthyovenator →
Qianzhousaurus → Scutellosaurus), **Coastal Scrubs** — a sea of waving grass
rolling down to a real sea (Metriacanthosaurus → Gigantspinosaurus →
Cristatusaurus), **Ashfall Ridge** — a scorched volcanic badland where the
land itself is trying to kill you (Linheraptor → Nothronychus), the
**Lertentous Delta** — a map FOUR TIMES the size of any other, where one great
river braids into four channels on its way to a drowned southern sea
(Aardiraptor → Centrosaurus → Omniraptor → Eotrachodon → Lokiceratops →
Morosaurus, then a **choice of apex**: master Tyrannotitan OR Spinosaurus —
both unlock together, either one opens the endgame), and finally
**The Nivalotitan Wall** — a misty mountain built as a CLIMBING MAZE of rock
walls, where a **COLD bar** ticks toward freezing solid, **blizzards** force
you to curl up or shelter (rarely one shakes loose an **avalanche** you must
outrun), climbing species scale the walls (Eshanosaurus always;
Jianchangosaurus only as a hatchling), pouncing off a wall flies farther and
lands harder, Kerberosaurus herds are warm to huddle beside, and Nanuqsaurus
rules the whiteout (Jianchangosaurus → Eshanosaurus → Nanuqsaurus). Somewhere
in the high maze one hidden cave holds the **frozen giant** the mountain is
named for — find it, and the biggest animal in the game joins your lobby
forever, outside the ladder. Every locked card and tab tells you exactly which
mastery opens it. **❖ growths** — earned every minute you survive (bigger
dinos earn more, and kills pay a bonus) — now buy **skins only**. To replay
any dinosaur you've already unlocked (or switch gender or skin), use the
**⌂ LOBBY** button — top of the screen in-game, or on the PAUSED screen —
and your dino keeps its progress. Death erases it.

## How to run

Open `index.html` in a browser (double-click works), or serve the folder:

```
npx http-server -p 8642
```

No build step, no dependencies — plain HTML5 canvas + JavaScript.

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| SHIFT | Sprint (drains stamina) |
| SPACE | Bite / attack |
| P (hold) + direction | **Pounce** — the dino coils (bigger = longer), leaps (faster = farther) and bites where it lands. Tail-fighters instead hold P to **tail-swing**: continuous hits on a metronome, but the feet are planted until you let go. (P still creates an aardiraptor pack on a quick tap — hold + direction is the pounce.) |
| E | Eat ferns · drink · feed on carcass · swallow what you carry |
| R | Rest — sit down eyes closed, heal faster, needs drain slower (moving, eating or drinking gets you up) |
| G | Grab a carcass to carry (hold: tear off a chunk) · press again to drop |
| M | Wrestle a dino your own size (apex carnivores) |
| P / I | Aardiraptor: create a pack / invade a protoceratops burrow |
| F / N | Go fishing (spinosaurids) / nest |
| TAB | Health menu |
| ESC / U / F1 | Pause / mute / help |
| H | Hitbox X-ray — red = attack zone, cyan = hittable body, orange = nip jaws |
| Y | (cheat) +5% growth, for testing |

**On a phone** the game grows transparent touch controls (js/touch.js +
vendored [nipple.js](js/lib/nipplejs.min.js) — they appear automatically on
touch screens, or add `?touch=1` to the URL to force them): a **virtual
joystick** on the left — it appears wherever your thumb lands, with a dashed
**run ring** around it: inside the ring you walk, cross it and you run (the
stick and ring flare gold while the run is latched, and it lets go when you
ease well back toward the center). On the right, an **icon button cluster**:
🦷 attack, 🐾 pounce (🌀 tail-swing on tail-fighters — hold it like the P key),
💤 rest, and two buttons that only exist when the world offers them — ✊ grab
appears beside a carcass (tap to carry, hold to tear a chunk) and a fourth
slot appears as 💧/🌿/🍖 to drink or eat whatever you're standing at. Rarer
prompts — nest, wrestle, fish, burrows — stay as labelled pills above the
cluster. During a wrestle the right half of the
screen becomes a **swipe pad** (the QTE shows which way). Landscape is the
intended orientation: portrait shows a "turn your phone" screen, and the first
tap in-game requests fullscreen + landscape lock where the browser allows it
(Android; iPhones can't lock, but **Share → Add to Home Screen** installs the
game as a fullscreen app — no URL bar — via the web app manifest). The view
itself is **responsive**: the view is 360 world-units tall on desktop and a
zoomed-in 285 on touch (the dinos read bigger at arm's length), and the view
width follows the screen's aspect, so the biome fills the whole display — an iPhone's 19.5:9 screen simply sees more delta to the sides,
no black bands. Panels respect the notch (safe-area insets), text selection is
disabled game-wide (double-tap-drag never highlights the UI), and the compact
touch lobby scrolls, drops hover effects, and flashes the ♀/♂ trait line when
you toggle instead of a hover tooltip. Touch taps are deliberate: a scroll
flick that ends on a card never launches it (only a still tap counts), the
gender/skin/delete controls are finger-sized, and buying a skin takes two taps
(the first flips its price to **BUY?**, the second confirms). The phone build
keeps the game's retro look — same font, same panels — just resized and
repositioned for thumbs. To play on your phone, run the dev server and open
`http://<your-pc-ip>:8642` on the same wifi.

## The dinosaurs

**Genders.** Every playable dinosaur is really two loadouts, chosen right on
its lobby card: a **♀ Female / ♂ Male segmented toggle** sits just under the
preview (male selected by default) — hover a segment to read what it changes.
The selected loadout's growth shows just under the difficulty tag (e.g. "♂ 100%
Full Adult"), and whether you own the dino rides as a corner badge on the
preview (✓ owned, 🔒 still locked, with the ❖ price shown below only while it's
locked). The **female** wears a plain, sensible coat but is quicker on her feet
and earns more ❖ growths; the **male** wears a bright showy coat and is larger,
tougher and hits harder — but he's slower and earns less. Each loadout keeps
its own saved dino, so you can grow a female and a male of the same species
side by side (and losing one never costs you the other). Saves from before
genders carry on as females. Pick your gender and skin on the card, then click
the dino to play — happy with the defaults (male, Classic), and it's a single
click. No popup.

**Skins.** At the bottom of each card is a row of **skin swatches**. Each one
always carries a label so the row never jumps: **BASE** for the free default,
**OWNED** for a paid coat you've bought, or its **❖ 100** price while it's
still locked — and a green ✓ badge marks the one you'll wear (Classic
included; the badge simply follows your choice). Every dinosaur has its
**Classic** skin (the species colors, in both gender coats) and a **Ripcel**
skin: the body sunk toward black, navy flank stripes, and shining lime dots
from shoulder to tail — muted on her, turned all the way up on him. Clicking a
locked swatch buys it on the spot (once, worn forever — something to spend a
fortune on, one dinosaur at a time): the ❖ price is deducted, the label flips
to OWNED, and the check moves onto it. Skins are pure style (no stats), and
each card
remembers the last gender + skin you wore as that species — the card's little
preview even repaints to whatever you've picked. Some skins are
species-exclusive (`only` on the SKINS entry): **Jungell** (❖ 100) belongs to
Tyrannotitan alone — mossy green
over brown flanks with shining lime leaf-flecks dappled down its back.

**Playable — Fern Valley**
- **Rajasaurus narmadensis** — carnivore, hatches in the fern forest. Scavenge and hunt. Bites make big prey bleed: bite, run, wait. (Bleeding is visible on anyone it's happening to — a blood-red **-N 🩸** number floats up every second alongside the drips, yours included.)
- **Camptosaurus** (master Rajasaurus) — herbivore, hatches on the open plains where Moros hunts. Sprint to the fern forest shade to survive. Hard mode. Earns extra growths.
- **Riojasaurus incertus** (master Camptosaurus — unlocks alongside Ichthyovenator; mastering either carries the ladder on) — a Triassic sauropodomorph and the valley's best brawler, in the spirit of Prior Extinction's Yunnanosaurus: fast, tough, and armed twice over. SPACE swings a real tail; **M slashes with the great thumb-claws** and the wound **bleeds**. The price of all that muscle: it grows agonizingly slowly and eats enormously — its food bar drains 1.7× faster, so it lives next to its pantry in the southern fern shade.

**Playable — Skull Prairie** (opens when Camptosaurus is mastered)
- **Ichthyovenator** (unlocked with the land) — sail-backed swimmer from the southern swamp. The only dinosaur that can cross deep water. Hunts gar and thirsty drinkers.
- **Qianzhousaurus** (master Ichthyovenator) — the long-snouted "Pinocchio rex". Grows slowly, but a full adult is the fastest, toughest hunter on the prairie.
- **Scutellosaurus** (master Qianzhousaurus) — small armored herbivore. Grows fast, earns extra growths, resists bleeding.

**Combat:** predators circle you at striking distance, freeze with open jaws
(the tell!), then lunge in a straight line — sidestep during the tell and they
whiff, leaving them exposed while they back off. Fast hunters like Moros turn
wide: a sharp last-second juke can shake them off entirely.

Every attack comes from the weapon, not the body: bites only land if the
attacker's **jaws** reach you — you can't snap backwards while running away,
and neither can they. Tail-fighters (Scelidosaurus, Huayangosaurus,
Ugrunaaluk, Charonosaurus, Gigantspinosaurus, Pinacosaurus) turn their back
and **whip the whole tail** through the arc behind them — thagomizer, plates,
bone club and all: if you see a tail wind up in your direction, you're standing
in the wrong place. Claw-fighters (Nothronychus) swing their great scythe arms
through the ground just ahead of their chest — face-first, like a biter, but
with a far wider sweep.

**Ashfall Ridge is a different kind of danger.** The only water steams out of
a handful of **hot springs**; the whole north-east is a glowing **lava field**
you *can* dash across, but it burns you the whole time — a shortcut you pay for
in health. And every so often the mountain roars: a warning shudder, then a
volley of **volcanic bombs** rains down around you, each marked by a glowing
target ring with a short fuse. Keep moving, read the rings, and don't get
cornered against the lava. (Nests are always safe ground.)

**NPCs — Fern Valley**
- **Guanlong** — packs near the mud baths. Lethal to babies alone; once you grow they run to packmates and gang up on you.
- **Moros intrepidus** — fast plains hunter. Kills anything up to adolescent, and Guanlong too. Won't follow you under the trees.
- **Ornithomimus** — cowardly runner, eats carcasses, never fights.
- **Scelidosaurus** — armored. Tail-smacks baby Rajasaurus, flees from grown ones. Sneak up while it drinks.
- **Huayangosaurus** — 1,500 HP tank with a very short detection range. Its tail causes bleeding. Its head takes double damage.
- **Lophostropheus** *(a close cousin of Liliensternus)* — frail, blazing fast, and its bite barely stings — but the wound it opens **bleeds ferociously (15/s for 10s)** and won't close. It fears nothing and sometimes runs in small packs; its tactic is hit-and-run — strike, sprint clear, wait for the bleed to lapse, then dart back in. It looks like it can only bully Ornithomimus (Moros would crush it in a fair fight) — but nothing that underestimates it gets away clean. A pack staggers its bites so you never stop bleeding.

**Playable — Coastal Scrubs** (opens when Scutellosaurus is mastered)
- **Metriacanthosaurus** (unlocked with the land) — a storm-grey hunter built to run down Ugrunaaluk herds. Fast, strong, mean.
- **Gigantspinosaurus** (master Metriacanthosaurus) — a giant-shoulder-spined living fortress. It cannot bite at all: turn your back and swing the thagomizer. Slow, but almost unkillable.
- **Cristatusaurus** (master Gigantspinosaurus) — Ichthyovenator's heavyweight cousin: a croc-snouted shoreline tank that swims deep water and hits like a slammed door. Megorontosuchus can grab it — but can't hold it: every thrash counts double.

**Playable — Ashfall Ridge** (opens when Cristatusaurus is mastered)
- **Linheraptor** (unlocked with the land) — a deep-cut dromaeosaur, the fastest thing on the ridge and the most fragile. Outrun the eruptions, dodge Tarbosaurus, and mind the wild packs — they hunt here too.
- **Nothronychus** (master Linheraptor) — a pot-bellied giant that stands tall and **swipes with great scythe claws**. Eats only plants; slashes anything that forgets that, and its claw wounds bleed.

**NPCs — Skull Prairie**
- **Troodon** — pack hunter of the mud groves; Guanlong's niche, a little meaner.
- **Eotyrannus** — long-bodied speedster; the prairie's Moros. Hide in the trees around the mud baths.
- **Grunos** *(imagined)* — slow, tanky abelisaurid that fears nothing and hunts even other dinosaurs. Ignores hatchlings.
- **Archeornithos** *(imagined)* — tiny tusked heterodontosaurid; skittish grazer-scavenger.
- **Leaellynasaura** — fluffy, huge-eyed, and mostly tail. Runs from everything.
- **Kosmoceratops** — horn-frilled fortress. Leaves hatchlings alone, flattens grown carnivores that push their luck.
- **Lepisosteus** — gar cruising every pond and the swamp. An Ichthyovenator's dinner.

**NPCs — Coastal Scrubs**
- **Megorontosuchus** *(imagined)* — the shadow off the beach. A giant crocodile that ambushes anything at the waterline and **grabs** you: SMASH SPACE fast enough and it lets go, fail and you're dragged under. It kills NPCs too — free carcasses on the sand, if you dare.
- **Ugrunaaluk** — herd hadrosaur, in groups of 3–4 (sometimes a loner or a pair). Placid until provoked — then the whole herd swings tails.
- **Charonosaurus** — huge tube-crested hadrosaur of the coast itself. Too big for crocodiles; flattens almost anything.
- **Archaomimus** *(imagined)* — Ornithomimus with muscle: skittish, but corner it and it kicks like a piston.
- **Hesperaptor** *(imagined)* — the azure raider of the mud grove; Guanlong's niche, blunter snout, no crest.
- **Concavenator** — hump-backed pack hunter that swims deep water. Alone it's cautious; a pack fears nothing and never routs.
- **Lepisosteus** — the gar cruises the coastal waters too, lake and sea alike.
- **Black-back Bass** *(imagined)* — the lake's darting shadow: quick, harmless, and surprisingly tanky for its size.
- **Herrietopus** *(imagined)* — a huge coelacanth that rules the surf beside the crocodile. Slow and colossal, it answers teeth with a real **tail slap** — Cristatusaurus' favorite prey, but no easy catch.
- **Scutelocephalichthyus** *(imagined)* — a little basking cruiser with a bony skull-shield: head hits **glance off** (watch for the ⛨). Aim for the tail — if you can catch it.

**NPCs — Ashfall Ridge**
- **Tarbosaurus** — the tyrant of the ash: a two-tonne apex that hunts nearly everything, you included, right up until you're almost full-grown. Fears nothing.
- **Linheraptor** — wild packs den in the spring groves. Fast, coordinated, and a real threat even to a played raptor.
- **Nothronychus** — a colossal claw-armed herbivore. Leaves you alone unless you crowd it; then the scythes come out (and they bleed).
- **Oviraptor** *(crested egg thief)* — fast, nosy scavenger, first to every carcass. Never fights.
- **Shuvuuia** — a sparrow of a dinosaur, all legs and nerves. Bolts from everything.
- **Pinacosaurus** — a walking boulder with a bone hammer on its tail. Ignores hatchlings; club-swings anything that pushes it. Its armor shrugs off bleeding.

**The Lertentous Delta is the biggest thing in the game.** 256×256 tiles —
the engine's maximum — and it is an **archipelago**: twenty-six rainforest
islands and barely any mainland, cut apart by the trunk river, six
distributary arms, and four cross-braids, all of it surrounded by water and
emptying into a drowned sea along the whole southern edge. **Sandbar fords**
cross every channel (shallow water you can wade — every island connects to
every other); the deep water between them belongs to the fish — *all* of
them: every fish in the game lives here, plus two of its own — and to
**Megorontosuchus**, who cruises the inland channels here hunting the fish
(though a wader still looks tasty). The jungle is deep wet green, broken by
sun-glades where orchid drifts bloom; reeds line every bank and ferns carpet
the understory.

**Fishing (F).** Spinosaurids (Spinosaurus, Cristatusaurus) at the water's
edge get a second prompt: *F — go fishing*. You crouch dead-still at the
waterside and the fish, seeing no danger, drift slowly closer — they take
their time deciding. When one is close, SPACE one-shots it: an easy meal.
Hostile fish leave a fishing dinosaur entirely alone; moving, striking, or
getting hurt ends the stillness.

**Canopy browsing.** Sauropods past half-grown can eat FROM THE TREES:
*E — Browse the canopy* near any leafy tree cranes the neck high (its own
animation — nothing like the head-down graze) for the richest mouthful in
the game. Each tree's canopy regrows in about a minute.

**Nesting.** Reach Full Adult and a full-grown mate of the opposite sex
arrives at your nest. **Males display** — a strutting, bowing courtship
dance: an NPC male performs on his own (press N to accept him); as a male
YOU press N near her to display, and she judges your **condition** (health,
food, hygiene — impress her or go take a mud bath and try again). Accepted
pairs press **N at the nest** to lay three eggs, guard them from egg thieves
until hatch day, and then the babies follow the female until they're grown —
every young one raised pays **❖ 150**. Your mate fights for the nest with
its life; lose it, and the clutch is yours alone.

**Resting (R).** Any dinosaur can settle down onto folded legs: you can't
move, but you heal over twice as fast and food, water and hygiene all drain
about a third slower. Any step (or bite, or tooth in your hide) gets you up.

**Grab & carry (G).** A carnivore near a carcass can pick the whole thing up
and trot off with it swinging from its jaws — if it's light enough; too heavy
and you come away with a torn **meat chunk** instead (hold G to take a chunk
on purpose). G again drops it (still edible, and its rot pauses while
carried); **E swallows** what you hold — head thrown back, jaws snapping as
it goes down.

**Wrestling (M).** Apex carnivores (Spinosaurus maroccanus, Tyrannotitan) can
wrestle any land dinosaur near their own bulk: the prey is clamped neck-and-
body in your jaws while five keys flash up — press each in time and the fifth
is the **SLAM** (heavy damage, long stun). The bigger the opponent, the less
time per key: a Sinoceratops is a warm-up, an Olorotitan a real fight, an
Atlasaurus nearly impossible. Fumble one key and you're thrown off and
stunned for two long seconds.

**The Aardiraptor's world.** The delta's cheapest playable comes with its own
way of life. Wild aardiraptors never start a fight with one of their own —
walk up and press **P** to become their **alpha**: they follow you, eat when
you eat, drink when you drink — and **hunt when you hunt**: the moment your
teeth touch something (or something's teeth touch you), the whole pack piles
onto it. Your **mate joins the pack** the moment it arrives — it runs and
hunts with you, but never abandons a nest with eggs or little ones in it.
Or skip the stranger entirely: once full-grown, stand beside **any
opposite-gender packmate** and press **N** to take them as your mate (their
gender coat shows from the moment they're recruited). The courtship still
has to be danced — and your own grown young are packmates forever, never
mates.
Your own young are **pack from their first breath** — hatchlings
join the moment they hatch, and instead of setting off when grown they take
their place as full hunters (the ❖ 150 still pays out). Nest again and again
and the pack grows generation by generation. And there is **no friendly
fire**: your jaws cannot harm your packmates, your babies, or your mate. Protoceratops dig **burrows** (dirt mounds all
over the islands) — press **I** at a mound to invade: the screen fades and
you're underground in a little warren of chambers and tunnels. Some hold one
chamber and one resident, some more of either — or both. Your pack squeezes
in with you (up to four) and fights at your side; kill every resident and
**the burrow is your pack's**: a den where you heal fast, and where an
accepted pair can **nest (N)** — den eggs are beyond every raider's reach,
and the hatchlings stay safely below until they emerge as sub-adults.

**Playable — Lertentous Delta** (opens when Nothronychus is mastered)
- **Aardiraptor** *(invented)* (unlocked with the land) — small, weak, and it looks like a dumb pick — until you meet your kin. Feathered on top (bare-bellied), bushy-tailed, and the only dinosaur that leads a pack and raids burrows.
- **Centrosaurus** (master Aardiraptor) — the cheap tank: one great nose horn, slow to grow, but a grown one is a wall that hits back. Like every horned dinosaur, it **headbutts**: horn strikes launch victims twice as far as any bite.
- **Omniraptor** *(imagined)* (master Centrosaurus) — fast and strong: the working raptor of the islands. Its bite bleeds.
- **Eotrachodon** (master Omniraptor) — the oldest duckbill: tough and hardy, resists bleeding, swings a real hadrosaur tail. Earns extra.
- **Lokiceratops** (master Eotrachodon) — Centrosaurus but cooler: midnight coat, golden blade horns, more of everything.
- **Morosaurus** (master Lokiceratops) — **the sauropod.** Grows agonizingly slowly; a full adult swings a whip tail, shrugs off nearly everything, and fears exactly one animal in the delta (see below).
- **Spinosaurus maroccanus** (master Morosaurus — then Tyrannotitan and Spinosaurus unlock TOGETHER: choose your apex, and mastering either opens the Wall) — the end of the spinosaurid road (Ichthyovenator → Cristatusaurus → this), built to its Prior Extinction likeness: an **M-shaped sail**, a throat **dewlap**, an upward-arcing neck, and a skull all its own (nasal crest, rosette snout, interlocking croc teeth, slit nostrils set far back). It attacks with **jaws AND clawed arms together** — point-blank prey inside the long snout still catches the swipe — and its **Wet Wrath** makes it hit 1.2× harder standing in water (and 15% softer on dry land). The fastest swimmer in the game; at adult, the undisputed apex of the water. Getting there is the whole game.
- **Tyrannotitan** (the other half of the apex choice) — Spinosaurus' opposite number: the LAND apex. A lesser-sung carcharodontosaurid with the deep shark-toothed skull and heavy brow bosses of its famous cousin, and a **bleed-based** kit — its wounds bleed nearly twice as hard and longer. Hit, fall back, and let the blood do the rest.

**NPCs — Lertentous Delta**
- **Magnapaulia** — a giant hadrosaur that defends its herd *vigorously*: strike one and the whole river bank swings back.
- **Panoplosaurus** — a medium tank in a bone coat. No club, no bleed, no hurry.
- **Protoceratops** — the crested menace: knee-high, furious, attacks dinos twice its size. Travels in mobs, and digs the delta's **burrows** — its warrens defend themselves.
- **Aardiraptor** *(invented)* — wild packs of the scruffy little burrow-raider roam the jungle. Kin to an aardiraptor player: they never start the fight.
- **Atlasaurus** — the walking mountain. 4,200 HP, and one swat (360) kills almost any predator with relative ease. Ignores hatchlings; do not provoke.
- **Dakotaraptor** — pack raptor that **fears not one playable**: no matter how big you grow, the pack still comes, and killing one doesn't scare the rest while a packmate stands.
- **Yutyrannus** — fast, robust-headed, feared bite. Hunts most mid-sized things, you included until you're nearly grown.
- **Olorotitan** — the fan-crested 'titanic swan': Charonosaurus' niche, herds on the open islands, tail like a river gate.
- **Wuerhosaurus** — a massive flat-plated stegosaur tank. Smacks with its tail — and, unusually, **occasionally bites** whatever stands at its face.
- **Fluviodon** *(invented)* — the river barge: a hippo-heavy iguanodont, all belly and bad temper. It grazes on all fours, then **rears right up on its hind legs** to strip a tree's whole canopy (the leaves regrow in a minute or two). Placid until a carnivore wanders close — then the **thumb spike** comes out: 150 a jab, and it does not scare.
- **Sinoceratops** — the charger: a long warning stance, then it arrives at three times its own speed. Sidestep the telegraph or eat 300 knockback.
- **Lourinhanosaurus** — the delta's terror: strong, relentless, and its bite opens wounds that don't close (13/s bleed). The ONE predator with no upper size limit — even a full-grown Morosaurus checks the tree line for it.
- **Onchopristis** *(fish)* — the sawfish: lethal and angry. Anything that touches its water is prey.
- **Mawsonia** *(fish)* — the greatest coelacanth that ever lived: immensely tanky, strong, and it never, ever flees.
- …plus **Lepisosteus**, **Black-back Bass**, **Herrietopus** and **Scutelocephalichthyus** — every fish in the game swims the delta.

**Playable — The Nivalotitan Wall** (opens when Tyrannotitan OR Spinosaurus is mastered)
- **Jianchangosaurus** (unlocked with the land) — the cheap way onto the mountain: a small rusty therizinosaur, quick and thin-coated. Its **hatchlings can climb** the maze walls to escape anything with teeth — a grown one is too heavy for the rock. Use the gift while you have it.
- **Eshanosaurus** (master Jianchangosaurus) — the oldest therizinosaur, held nearly upright on stumpy legs, short high arms ending in great scythes. Thick-coated (55% cold resistance), claw wounds bleed, and it is the ONLY grown dino that climbs the Wall — the whole maze is its road, and every wall-top a pounce perch.
- **Nivalotitan** *(imagined — THE SECRET)* — the frozen giant the mountain is named for. It cannot be bought at any price: somewhere in the high north maze, one hidden cave holds it, **visibly asleep inside a slab of old blue ice**, and standing before it once unlocks it forever. The largest animal in the game — a brachiosaur silhouette with towering shoulders and a near-vertical neck, a sweeping tail, near-total cold immunity, the slowest growth there is — and it **TRAMPLES**: anything clearly smaller caught under a walking giant's footprint is simply crushed.

- **Nanuqsaurus** (master Eshanosaurus) — play the KING: the polar tyrant itself. Thick coat (70% cold resistance), bleed bites, wrestling strength — every herd on the mountain knows your silhouette.

**NPCs — The Nivalotitan Wall**
- **Kerberosaurus** — the herd: a huge flat-headed polar hadrosaur, Prior-Extinction-Edmontosaurus by silhouette. Warm to huddle beside on the open snowfields — until the tail comes around.
- **Beipiaosaurus** — the guardian of the pine belt: the shaggiest thing on the mountain, a charcoal therizinosaur that plants itself and rakes with feathered scythes. The wounds stay open in the cold.
- **Pectinodon** — the scavenger gang: snow-white troodontids with sooty masks that trail every blizzard, picking at whatever froze. Bold in a pack; gone in a blink alone.
- **Koreanosaurus** — the snowball underfoot: a tiny fluffy burrowing ornithopod, the bottom of every food chain on the mountain.
- **Nanuqsaurus** — the king of the Wall. A compact polar tyrant that fears nothing, hunts everything on the mountain, and uses the mist better than you do.
- **Titanovenator** *(imagined)* — the TITAN-KILLER. Exactly ONE walks the whole mountain: a colossal bone-white theropod with a blood-red crest — the only warm color in the snow. It is the one hunter with **no upper size limit**: a full-grown Nivalotitan reads as dinner, not danger, and its bite opens wounds the cold won't close.

**Fear:** when a dinosaur dies, packmates nearby panic and rout (Huayangosaurus,
Kosmoceratops, Grunos, Charonosaurus, Megorontosuchus, Tarbosaurus,
Nothronychus, Pinacosaurus, Panoplosaurus, Atlasaurus, Wuerhosaurus,
Fluviodon, Sinoceratops, Yutyrannus, Lourinhanosaurus, Onchopristis and Mawsonia are
fearless; Concavenator and Dakotaraptor packs hold as long as one packmate
still stands).

## Growth stages

Hatchling (0–10%) → Juvenile (10–20%) → Adolescent (20–30%) →
Sub-adult (30–90%) → Adult (90–100%) → **Full Adult**.

Keep food and water above 25% — and **hygiene above 60%** — and you grow over
time (~9 minutes to full). Let yourself get too dirty and growth stops dead:
the growth bar turns muddy brown and the stage line reads TOO DIRTY TO GROW
until you bathe. Mud baths restore hygiene; the horsetails around them are
edible — a haven, but Guanlong knows that too.

## Adding content (the arcade loop)

The game is registry-driven — dinos and worlds load from data tables, so
content can keep growing to 30+ dinos without touching the engine:

- **New ecosystem** → register it in `ECOS` (js/world.js: name, seed, unlock
  cost, generator fn — the generator must set a `World.nests[species]` for each
  of its playables) and give it a spawn table in `ECO_SPAWNS` (js/entities.js).
- **New playable** → one entry each in `PLAYER_DEF` (stats; add
  `req: '<species>'` to demand a Full Adult of that species first), `DINO`
  (procedural art parameters — patterns, crests, sails, humps, paddle tails
  etc. are data flags; `tailWeapon` makes a dino fight backwards,
  `clawWeapon` + `bigClaws` make it a front-sweeping claw fighter, and
  `headButt` makes ceratopsians RAM — jaws shut, head tossing through the
  strike, double knockback), and `CARD_INFO` (lobby copy, js/main.js).
- **New NPC** → `DINO` art entry + `NPC_DEF` stats (pick a think archetype:
  pack hunter, runner, skittish, tank…) + one line in an `ECO_SPAWNS` table
  (packs take `sizes: [3,4,…]` for varied herds and `den: 'plains'` to den on
  open grass instead of the mud pools).

Lobby tabs, dino cards, previews, purchases and unlocks are all generated from
these registries; the card grid wraps and scrolls. Hit detection is circles
all the way down: every dino's hittable body is a chain of circles laid along
its skeleton — head, chest, torso, hip, tail, tail tip — from the species'
`hitZones` array (auto-derived, overridable for body peculiarities), and every
attack is a **weapon circle** that must touch that chain: jaws are a circle
hugging the front half of the head whose edge barely clears the snout tip
(+4px contact pad, identical for player and NPCs), tail swingers sweep a 90°
wedge dead behind themselves (sidestep out of it!), claw/arm strikes arc over
the chest. Long necks (sauropods) get an
extra mid-neck circle and club tails cover the knob. Each zone carries a
`dz` height that lifts it onto the body part it represents, and combat runs
in exactly that lifted space — the circles the H overlay draws ARE the hit
test, coordinate for coordinate. A bite lands if and only if the red weapon
circle touches a cyan body circle, so a tall hunter has to step toward the
camera to bring its jaws down onto short prey (NPC hunters aim their lunges
with the same height offset, and the fishing plunge is the one exception —
the strike dives to the water's surface). Press **H** in game to see all of
it live (red = attack, cyan = body, orange = nip).
Gender loadouts are automatic for every playable: the stat spread lives in
`GENDER_MOD` (js/util.js) and both coats are derived from the species palette
(`genderSkin`, js/sprites.js), so a new dino gets its inline ♀/♂ toggle for
free. The selection lives on the card itself — `cardGender(sp)`/`cardSkin(sp)`
(js/main.js) read the remembered choice (`Save.genderChoice`/`Save.skinChoice`,
default male + Classic), `tryPlay` launches straight into `startGame` with it,
and the chips/swatches `stopPropagation` so only a click on the rest of the
card starts the game. Skins are a registry too — add an entry to `SKINS` (give
it a `cost` to make it a per-species ❖ purchase) plus a palette branch in
`skinColors` (and a `drawPattern` branch if it repaints the markings), and
every playable's card grows a new swatch (`buildCardSkins`).

**Terrain & hazards.** Tiles have types (grass, forest, sand, water, deep,
mud, lava); a generator carves them and can flag `World.ashy` for a grey
volcanic palette. Lava (`addLavaBlob`) is crossable by the player at a health
cost but shoved away from every NPC. Per-ecosystem timed events live in the
game loop — Ashfall Ridge's eruption system (`updateEruption` / `drawEruption`
in js/main.js) is self-contained and only runs while `World.eco === 'ash'`, so
another world could add its own hazard the same way. **World size is
per-ecosystem too**: set `size` on the `ECOS` entry (default 120 tiles square;
the delta runs 240) and the tile arrays, paint density, chunk grid and minimap
all follow. Rivers can be carved as chains of water blobs walked along a curve
(`carveChannel` in `genDelta`) with shallow *ford windows* land animals can
cross.

**NPC combat knobs** (all data on `NPC_DEF`): `chargeR`/`lungeT`/`lungeMul`
turn the standard windup→lunge into a long telegraphed charge (Sinoceratops);
`biteBleed` makes lunge bites wound (Lourinhanosaurus); `nip: {dmg, cd}` gives
a tail-fighter an occasional face-side bite (Wuerhosaurus); `packCourage`
keeps a pack from routing while a packmate stands (Dakotaraptor).

## Code layout

- [js/util.js](js/util.js) — helpers, colors, noise, retro synth SFX
- [js/sprites.js](js/sprites.js) — procedural dinosaur drawing (all species, all growth stages)
- [js/world.js](js/world.js) — map generation (forest, plains, river + fords, mud pools), terrain rendering, plants
- [js/entities.js](js/entities.js) — player survival stats, combat, all NPC AI
- [js/main.js](js/main.js) — game loop, camera, rendering, HUD, screens, minimap

*Game design by the resident dinosaur expert. Code by Claude.*
