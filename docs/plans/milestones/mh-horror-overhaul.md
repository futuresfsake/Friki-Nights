# MH — Horror overhaul (owner requests) 🔨

**Goal:** make Friki Nights look like a real abandoned house and scare harder: a real ghost with in-your-face jump scares, a bigger house, the ballerina, and a scarier face in the flashlight.
**Done when:** every story below is built, playtested by the owner, and merged into `main`.
**Depends on:** nothing new; builds on M2 (map, scares) and M5-S17 (the Tenant)
**Branch:** one per story, e.g. `mh-s03-real-house`, merged when its tests and build pass

> Requested by the owner on 2026-10-15. Order of work: S01 decision → S06 → S03 → S04 → S05.

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |
| MH-S01 | Full-body ghost with jump scares (replaces the tall man) | Must | L | 🧪 built, owner unsure: see open question |
| MH-S02 | A real (girl's) scream for the ghost's jump scares | Must | S | 🧪 built |
| MH-S03 | A real abandoned house, not Minecraft blocks | Must | L | ⬜ |
| MH-S04 | Bigger house: the south wing and the Ballroom | Must | L | 🧪 built |
| MH-S05 | The ballerina: don't move | Must | M | 🧪 built |
| MH-S06 | JS-01 face in the flashlight, scarier | Must | M | ⬜ |
| MH-S07 | More things in the house | Must | M | 🧪 built |

**7 stories · 0 done** (7 Must · 0 Should · 0 Could)

## Open question

- **Which ghost does the owner not like?** On 2026-10-15 the owner said "I don't like the ghost" after MH-S01 was built. If that means the new floating ghost, MH-S01 needs a new design (or goes back to the tall man) before it's merged. The face that appears when you pick up the parlor key (JS-01) is liked and is kept; MH-S06 makes it scarier.

## Stories

### MH-S01 · Full-body ghost with jump scares

**Priority:** Must · **Size:** L · **Status:** 🧪 built, waiting on the owner · **Traces:** M5-S17

> As a player, I want a real horror ghost (a full body) that jump-scares me, not a tall man who just walks, so that the Tenant is actually frightening.

What's built (`client/src/tenant/model.js`, `tenant.js`, `acts.js`, `world/textures.js`):
- A floating ghost in a torn, bloodied burial gown, about 16 cm off the floor, grey feet dangling under a hem that drifts as if underwater
- Long wet black hair over its face, too-long arms with clawed black nails, a corpse-pale face with empty eye sockets and black tears; it glows faintly in the dark, its head twitches, and now and then it blinks out for a frame
- It glides instead of walking, and lunges with both arms out when it charges
- **New `scream` pose = the jump scare:** 0.6 m in front of your eyes with its face at eye level, jaw stretched open past the chin, claws out, shuddering; scream, hard camera shake, then black and gone (0.7 s)
- Tricks that now end in the jump scare: **breathe** (turn round in time), **lightsOut** (usually, when the light comes back; otherwise it shushes you and may lunge), **rush** (screams in your face instead of vanishing), **peek** (approach; or after you look away too often, it's where you're looking), **follow** (turning round), **bedVisit** (the head on the floor screams)
- Pacing: big scares ≥100 s apart (was 150), rush allowed after 150 s (was 240), jump-scare tricks weighted up

**Acceptance criteria**
- Owner approves the ghost's look in a playtest (see open question)
- The jump scare never puts the ghost inside a wall or furniture; with a wall in your face you only get the scream and the dark
- **Tests:** the model builds in every pose including `scream`; the Tenant night simulation still passes

### MH-S02 · A real scream for the ghost's jump scares

**Priority:** Must · **Size:** S · **Status:** 🧪 built

> As a player, I want the ghost to actually scream when it's in my face, so that the jump scare hits harder than a synth sting.

- `ghostScream()` in `client/src/audio/sfx.js` plays a **girl's scream** built sample by sample (`screamSamples()`): a glottal pulse train at ≈1.1–1.5 kHz with jitter, alternating weak pulses (the raw crack of a strained voice), a ~70 Hz roughness flutter, breath noise, and the formants of a wide-open "aaah" sliding to "eee"; it leaps up, wails, cracks and dies away. Three variants, slightly re-pitched each time, with a little room reverb; on the sting bus
- Used for every ghost jump scare; the old `screamSting` stays for map scares

**Acceptance criteria**
- Owner says it sounds like a scream, not a beep (tune pitch, formants and length after the playtest). If it still sounds synthetic, swap in a recorded, licence-free scream sample

### MH-S03 · A real abandoned house, not Minecraft blocks

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** Visual style (replaces the "abandoned cells / PS1" look)

> As a player, I want the walls and floors to look like a real abandoned house, so that it feels real and not like Minecraft.

Why it looks like Minecraft now: 64 px textures with nearest-pixel filtering and no mipmaps, cinder-block walls repeated on a 1-cell grid, and rendering at half resolution.

**Acceptance criteria**
- Walls: old peeling **wallpaper** (faded pattern, water stains, torn strips showing plaster and lath beneath), dark wood **wainscoting** along the bottom, skirting boards; the cells can keep stained plaster instead of cinder blocks
- Floors: worn **wooden floorboards** (long planks, gaps, scuffs, dust in the corners), rotten patches; rugs stay
- Ceilings: cracked plaster, damp stains, cobwebs in corners
- Textures drawn at 512 px or more with smooth filtering and mipmaps; no visible repeating tile every cell (vary per wall, larger texture scale)
- Full-resolution rendering (drop the 0.5 pixel ratio), with a light film grain / vignette so it stays dark and grimy
- Doors and windows match: panelled wooden doors, dirty glass, boarded-up windows
- Update [visual style](../../design/visual-style.md) to the new look
- Still 60 fps on the target machine (NFR-01)

### MH-S04 · Bigger house: the south wing and the Ballroom

**Priority:** Must · **Size:** L · **Status:** 🧪 built · **Traces:** M2-S01 map format

> As players, we want a bigger house to explore, so that the night lasts longer and there are more places for things to hide.

Proposed layout (Night 1 grid grows from 30×17 to 30×32):
- **Cell 4's back wall is broken through**: a door in the south wall leads down into a new wing
- **Gallery** (2 rows wide, the full width), lit with ceiling lights, portraits along the walls
- **Ballroom** (west, about 17×11, the biggest room in the house): dusty chandelier, a cracked mirror wall, a piano, sheet-covered chairs; the ballerina's room (MH-S05)
- **Kitchen** (east): long table, stove, hanging pots
- **Library** (south of the kitchen): shelves, reading desk
- New notes, a battery or two, beds or a closet to hide in; new rooms on the house map (`rooms`)

**Acceptance criteria**
- The existing puzzle chain (parlor key → house key + fuses → power → front door) is unchanged; the new wing is extra exploration (an optional fuse could move there later)
- New `N` and `T` cells only below the old grid, so the reading order of existing notes and triggers doesn't change
- Every room reachable; every prop walkable around (reachability test)
- **Tests:** map parses; reachability; house map draws the new rooms

### MH-S05 · The ballerina: don't move

**Priority:** Must · **Size:** M · **Status:** 🧪 built

> As a player, I want to see a ballerina dancing who then disappears, and to know I must not move while she's there, so that I'm frozen in fear.

**How it plays**
- A ghostly ballerina appears ahead of you (always in the Ballroom the first time you enter; later, rarely, anywhere in the house as a Tenant trick)
- She dances in place, slowly spinning en pointe, arms above her head, to a slightly out-of-tune **music box** waltz from where she stands
- A whisper: *"don't move…"* (subtitle). The player has a short moment (~0.6 s) to stop
- **If you stay still** (looking around is allowed) until the music winds down (~7–10 s), she slows, curtsies, and disappears in a flicker of the light
- **If you move** (more than ~0.3 m), the music stops dead, her head snaps to you, and she screams in your face (the MH-S01 jump scare, with her look)

**Built:** `client/src/tenant/ballerina.js` (Clara's model: her body spins en pointe while her head stays turned to stare at you), the `ballerina` trick in `acts.js` (big, weight 2), `musicBox()` in `sfx.js`, and a `T` at the Ballroom door that summons her the first time each player walks in. Grace 0.8 s, 0.3 m of drift allowed, dance 7–10 s.

**Look:** a pale, thin dancer in a grey, torn tutu and bodice, ribbons of her pointe shoes trailing, hair in a bun coming loose, the same empty eyes as the ghost; she glows faintly.

**Acceptance criteria**
- Moving while she dances always gets the jump scare; standing still never does
- Turning the camera never counts as moving
- Per-player like the Tenant (only you see your ballerina); the Ballroom one is a map trigger
- **Tests:** still → she disappears; moving → jump scare; grace period; she only appears on open floor in sight

### MH-S06 · JS-01 face in the flashlight, scarier

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** M2 JS-01

> As a player, I want the face that appears when I take the parlor key to be even scarier, so that it's the scare everyone remembers.

The owner likes this scare and wants more of it.

**Acceptance criteria**
- Before: the flashlight flickers for a moment and you hear a breath right in front of you
- The face is bigger and higher-detail (not a flat circle): a real head with hair hanging around it, empty eyes, skin cracked
- It **lunges**: appears a little way off, rushes into the lens and its jaw drops open while it screams (MH-S02)
- It stays a beat longer (≈0.8 s), with a red/static flash and the hardest camera shake in the game, then the light dies for a second
- After the light comes back: a wet giggle somewhere behind you
- **Tests:** the scare builds and cleans up after itself

### MH-S07 · More things in the house

**Priority:** Must · **Size:** M · **Status:** 🧪 built

> As a player, I want the house full of things, so that it feels lived in, abandoned, and like something could be hiding anywhere.

New props (`shared/props.js`, `client/src/world/props.js`), placed in every room:
- **piano** (upright, missing keys, sheet music), **stove** (iron range, stovepipe, a pot with something dried in it), **counter** (cupboards, stone sink, plates, a knife), **desk** (drawers, inkwell, candle)
- **mirror**: tarnished and cracked; **chandelier**: hangs from the ceiling, sways slowly and creaks
- **sheetChair**: an armchair under a dust sheet that looks like someone sitting very still
- **doll**: a cracked porcelain doll on the floor whose head is turned a different way every so often
- **cobweb**: dusty webs strung across ceiling corners

**Tests:** every prop builds and animates; every room stays reachable.
