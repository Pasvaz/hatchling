# The Great Walk — an ending for every dinosaur

*A proposal for HATCHLING's per-species endgame. Nothing here is built yet.
Read it, argue with it, cross things out.*

---

## The idea in one line

The ending is not beating something. It is the day the land is yours and
your kids don't look back.

## Why not a boss fight

Dinosaurs don't have bosses. They have seasons, rivals and bloodlines. A big
animal with a long health bar that the whole pack piles onto is a fight you
win by numbers, and it tells no story about the family you just raised. The
ending should be the moment your young stop needing you.

## How a species is finished today, and what changes

Today the ladder is: hatch → grow → Full Adult → next dinosaur unlocks. As of
this week, breeding needs **both** loadouts: raise the ♀ and the ♂ of a
species to Full Adult and a mate arrives at the nest. You court, lay three
eggs, guard them, and the babies follow the female until they're grown.

The proposal adds one more chapter after the babies are grown:

```
hatch → Full Adult (♀ and ♂) → mate → eggs → young → THE GREAT WALK → SETTLED
```

**Settled** is the new "level complete". The card changes to show it.

## The Walk

A one-time journey per species. When the last of your young reaches
sub-adult, the season turns and you must lead the whole family to the
biome's landmark before the land closes in.

### The trigger

Your last living young reaches sub-adult (30% growth). A banner, and your
species' broadcast call plays over the world. From that moment:

- The landmark shows on the minimap as a waypoint.
- The biome's own hazard turns on **for real** and stays on until you arrive.
- Your young walk with you the way babies follow the female today, but they
  are grown enough to fight, and they can die.

### One landmark per land

| Land | Landmark | The season that turns |
|---|---|---|
| Fern Valley | the river's source, deep in the north forest | Moros packs hunt as one |
| Skull Prairie | the great skull in the bone field | the long dry: every pond but one goes to mud |
| Coastal Scrubs | the headland where the grass meets the sea | a storm surge floods the beach |
| Ashfall Ridge | the crater rim | the mountain erupts without pause |
| Lertentous Delta | the drowned southern sea | the flood comes |
| The Nivalotitan Wall | the secret cave, or the summit if the cave is unfound | the blizzard that doesn't pass |
| The Great Moors | the standing stones | the long night: mist at full |

Every one of these hazards already exists in the game. The Walk just points
it at you, once, with stakes.

### The rival, not the boss

Every land already has an apex that hates you. During the Walk it isn't a
wall waiting at the end. It stalks the route, the way Lourinhanosaurus and
Titanovenator already hunt the player, but now it goes for the young.

You choose, in the moment: stand with the family, or lead it away yourself
and get back before it circles round. That is a pack fight that isn't lame,
because it's about who you're protecting, not how much damage you deal.

### Length

Tuned to a few minutes of play, not a trek. The route is the distance from
the species' nest to its landmark, so each dinosaur's Walk is a little
different.

## Pinning the final moment

A small state machine, so it can never be half-done:

1. **Departure.** The trigger fires. The nesting stage becomes `walk`. The
   waypoint appears. The hazard starts.
2. **Arrival.** The player enters the landmark's radius **with at least one
   young alive within a short distance.** The radius only counts during the
   `walk` stage, so wandering past the landmark on another day does nothing.
3. **The pin.** Arrival locks input. The stage becomes `settled`, the save
   flips `settled[species] = true`, the young become permanent NPCs of that
   land wearing your colours, and the card re-renders as the crest. The flag
   flip is the pin. Everything visual hangs off it.
4. **Failure isn't a state.** Lose every young on the route and the stage
   drops back to raising, the season clears, and you try again after the
   next clutch. Nothing is deleted. Your dinosaur is not erased.

## What settling gives you

- **The world remembers you.** The next time you play that land, with any
  species, your bloodline is out there as a herd or a pack in your skin.
- **The card becomes a crest.** The preview shows the pair with the young
  behind them, a stamp on the land's medallion, and a **Legacy skin** only
  that species can wear, derived from whatever skin you walked in.
- **A score that hurts.** The number of young who survived the Walk shows on
  the card forever. Losing one matters because it stays visible.

## The cutscene

Yes, we can do a proper one, and we need no extra libraries. Everything a
cutscene needs already exists in the engine; it just isn't sequenced yet:

- a camera we can move, the grow-zoom, the day and night grade, the mist,
  snow and ash, the vignette and film grain
- every dinosaur animates from data: walk, run, head up, rest with eyes
  shut, calls with the head craned to the sky; posing one is setting fields
- banners, floating text, the retro synth for stings, each species' voice

What gets added is a small **timeline runner**: a list of steps with times,
each nudging the camera, posing a scripted animal, fading a colour or
showing a caption. Around two hundred lines, plus letterbox bars.

The scene, fifteen to twenty seconds, skippable with any key:

1. Input locks as you arrive. The hazard fades; the sky clears.
2. The camera drifts from your face to the young.
3. The young turn and walk off into the land in your colours. You and your
   mate stand and watch.
4. One wide shot of the whole biome with the family small in it.
5. A title card: the species name, then **SETTLED**.
6. Back in the lobby, the crest stamps onto the card.

A short original ending melody is possible with the existing synth if we
want one.

## Optional second layer: the next generation

Once settled, you may hatch as one of your own young, with a small inherited
edge, and the card starts counting generations (Gen II, Gen III…). This is an
endgame for players who want to keep going, not a wall for everyone else.

## Things to avoid

- a fight where the pack just piles in
- any timer on screen
- anything that deletes your dinosaur on failure
- a landmark you can accidentally complete by wandering past it

## Open questions for the review

1. Should the Walk start automatically, or should the player choose when to
   leave (a "call the family" at the nest)?
2. How many young must survive to count as settled: one, or the majority?
3. Should the rival be the land's existing apex, or a one-off animal that
   only appears for the Walk?
4. Does the Legacy skin come from the skin you wore, or is it one fixed
   design per species?
5. Is the next-generation layer worth building, or is settling enough?
