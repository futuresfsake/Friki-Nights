# M7 — Content ⬜

**Goal:** the full story: Nights 2–5 and the ending.
**Done when:** Nights 2–5 and the ending are playable together.
**Depends on:** M6 (Night 1 complete end to end)
**Branch:** one per night, e.g. `m7-night2`, merged when that night is done

> Tasks for each story are written when M7 starts. Each night is built and playtested before the next one.

## Summary

| ID | Story (feature) | Night | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- |
| M7-S01 | Night 2 layout: Library and Study | 2 | Must | M | ⬜ |
| M7-S02 | Torn letter split clue | 2 | Must | L | ⬜ |
| M7-S03 | 10-second blackouts | 2 | Must | S | ⬜ |
| M7-S04 | JS-04 Falling books | 2 | Must | S | ⬜ |
| M7-S05 | JS-09 Mirror | 2 | Should | M | ⬜ |
| M7-S06 | Night 3 layout: flooded Cellar | 3 | Must | M | ⬜ |
| M7-S07 | Wading through water | 3 | Should | S | ⬜ |
| M7-S08 | Co-op lever hold | 3 | Must | M | ⬜ |
| M7-S09 | Scarce batteries | 3 | Must | S | ⬜ |
| M7-S10 | The Waiting One's first appearance | 3 | Must | S | ⬜ |
| M7-S11 | JS-05 Fake partner | 3 | Must | M | ⬜ |
| M7-S12 | Night 4 layout: Upper Floor and Nursery | 4 | Must | M | ⬜ |
| M7-S13 | Radio and fake partner voices | 4 | Must | L | ⬜ |
| M7-S14 | Code word verification | 4 | Must | S | ⬜ |
| M7-S15 | Hunt mode on | 4 | Must | S | ⬜ |
| M7-S16 | Nursery music box | 4 | Must | S | ⬜ |
| M7-S17 | JS-07 Behind you · JS-08 Radio scream | 4 | Must | M | ⬜ |
| M7-S18 | Night 5 layout: Attic | 5 | Must | M | ⬜ |
| M7-S19 | Reunite the owners' letters | 5 | Must | M | ⬜ |
| M7-S20 | JS-10 Final chase | 5 | Must | L | ⬜ |
| M7-S21 | Ending and run stats | 5 | Must | M | ⬜ |
| M7-S22 | Story text for Nights 2–5 | all | Must | M | ⬜ |
| M7-S23 | Night intros | all | Should | S | ⬜ |
| M7-S24 | Puzzle scaling and solo versions | all | Must | M | ⬜ |
| M7-S25 | Playtest every night at 1, 2, and 4 players | all | Must | M | ⬜ |

**25 stories · 0 done** (22 Must · 3 Should · 0 Could)

## Player-count rules

Every night must work at **1, 2, 3, and 4 players**. See the [player-count table](../../overview/story-and-world.md#player-count-solo-and-34-players). Design order: solo + 2-player version first, then scale up.

## Out of scope

New mechanics not listed in the [story table](../../overview/story-and-world.md); extra nights.

## Stories

### M7-S01 · Night 2 layout: Library and Study

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Night 2)

> As players, we want a library and study to explore, so that Night 2 feels new.

**Acceptance criteria**
- Shelves, desks, reading lamps built in code; library is bigger and darker than Night 1
- Letter halves in different rooms that can't both be seen at once

### M7-S02 · Torn letter split clue

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** US-08

> As a player, I want my piece of a letter to only make sense with my teammates' pieces, so that we must talk to solve it.

**Acceptance criteria**
- The letter is torn into one piece per player (2–4); each player can read only their own piece
- Combined, the pieces reveal a code (e.g. a safe combination or book order); longer code with more pieces
- **Solo:** 2 halves, both readable, placed in rooms far apart (must remember or walk back)
- **Acceptance (US-08):** with 2+ players, can't be solved from one view

### M7-S03 · 10-second blackouts

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Story (Night 2)

> As players, we want sudden blackouts, so that we're forced to rely on flashlights and each other.

**Acceptance criteria**
- All ceiling lights off for 10 s at director-chosen moments; flashlights still work

### M7-S04 · JS-04 Falling books

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Jump scare catalog

> As a player, I want books to crash down right next to me, so that the library feels hostile.

**Acceptance criteria**
- Tweened fall (no physics) + crash sound beside the player

### M7-S05 · JS-09 Mirror

**Priority:** Should · **Size:** M · **Status:** ⬜ · **Traces:** Jump scare catalog

> As a player, I want to see a figure behind me in a mirror that isn't there, so that I doubt my eyes.

**Acceptance criteria**
- Mirror via a second camera render target (low-res)
- Figure only in the reflection; turning around shows nothing

### M7-S06 · Night 3 layout: flooded Cellar

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Night 3)

> As players, we want a flooded, claustrophobic cellar, so that Night 3 feels heavier.

**Acceptance criteria**
- Stone texture, dark water plane, low ceilings, narrow passages

### M7-S07 · Wading through water

**Priority:** Should · **Size:** S · **Status:** ⬜

> As a player, I want water to slow me down and splash, so that the cellar feels dangerous.

**Acceptance criteria**
- Water cells: −30% speed, splash footsteps (different filter)

### M7-S08 · Co-op lever hold

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Night 3)

> As a player, I want to hold a lever so my teammates can cross, so that we depend on each other.

**Acceptance criteria**
- Lever only stays down while a player holds E; gate/water level changes while held
- Releasing early closes it again
- **3–4 players:** one lever per extra player (2 or 3 levers), all held while the last player crosses; the crossed player then opens a gate to let the others through
- **Solo:** find a wedge that holds the lever down for 20 s
- Map format gains lever and wedge markers

### M7-S09 · Scarce batteries

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Story (Night 3)

> As players, we want very few batteries, so that we must share light and stay close.

**Acceptance criteria**
- Night 3 has about half the batteries of Night 2

### M7-S10 · The Waiting One's first appearance

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Story (Night 3)

> As players, we want the creature introduced with a scripted moment, so that we learn its rule before it hunts us.

**Acceptance criteria**
- Scripted: it is seen standing still at the end of a corridor, then appears closer each time the players look away
- A note hints "it only moves when no one is watching"

### M7-S11 · JS-05 Fake partner

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Jump scare catalog

> As a player, I want to see "a teammate" walk into a wall and vanish while they're somewhere else, so that I can't trust my eyes.

**Acceptance criteria**
- Uses a random teammate's model and color; only shown when that teammate is far away
- **Solo:** replaced by a shadow figure crossing the end of the hall

### M7-S12 · Night 4 layout: Upper Floor and Nursery

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Night 4)

> As players, we want an upper floor with a nursery, so that Night 4 has a new, creepy space.

**Acceptance criteria**
- Long corridors, several hiding closets, children's wallpaper in the nursery

### M7-S13 · Radio and fake partner voices

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** Story (Night 4), Decisions (garbled + subtitles)

> As a player, I want a radio that sometimes speaks with a teammate's "voice", so that I have to question every message.

**Acceptance criteria**
- Each player carries a radio; static with crackle
- Fake messages: speech-shaped garbled radio sound + subtitle text, may use any teammate's name
- **Solo:** fake messages claim to be "someone else who found the key"
- Fake messages lure players toward danger (e.g. "come to the nursery")

### M7-S14 · Code word verification

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Story (Night 4), Security

> As a player, I want to check a teammate's identity with their code word, so that we can tell real from fake.

**Acceptance criteria**
- The real teammate says their code word over voice chat; fake radio voices never know it
- Code word hashes are never sent to other players
- **Solo:** no verification; notes in the level hint which messages lie

### M7-S15 · Hunt mode on

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** LLD §6

> As players, we want the creature to hunt faster in Night 4, so that the difficulty rises.

**Acceptance criteria**
- HUNT after 20 s unseen; 2.5 m/s; hiding closets become essential

### M7-S16 · Nursery music box

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Story (Night 4), Sound catalog

> As players, we want to find the music box, so that we complete Night 4.

**Acceptance criteria**
- Out-of-tune sine melody, slowed; plays when found; is the night's objective

### M7-S17 · JS-07 Behind you · JS-08 Radio scream

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Jump scare catalog

> As a player, I want breathing behind me and a scream through my radio, so that Night 4 is the scariest yet.

**Acceptance criteria**
- JS-07: breathing pans behind; turning shows the creature for one frame
- JS-08: static rises, then a distorted scream through the radio

### M7-S18 · Night 5 layout: Attic

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Night 5)

> As players, we want a cramped attic and a long staircase down, so that the finale has a place to end.

**Acceptance criteria**
- Attic with sloped ceilings; staircase route back to the front door for the chase

### M7-S19 · Reunite the owners' letters

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Night 5)

> As players, we want to put the owners' letters back together, so that we free them.

**Acceptance criteria**
- Uses everything learned: split clues, co-op hold, code words — each in its solo / 2-player / 3–4 player version
- Both of the owners' letters made whole → the chase begins

### M7-S20 · JS-10 Final chase

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** Jump scare catalog

> As players, we want a final chase where the creature no longer freezes, so that the ending is intense.

**Acceptance criteria**
- Entity ignores view cones; fast music + heartbeat
- Every living player must reach the exit; downed players can still be revived on the way; fair speed so a good run escapes

### M7-S21 · Ending and run stats

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Ending)

> As a couple, we want an ending that shows our whole run, so that finishing feels special.

**Acceptance criteria**
- Short text ending: the house releases the owners; the players wake up
- Whole-run stats: total time, times caught, notes found, final rank

### M7-S22 · Story text for Nights 2–5

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story

> As players, we want notes and letters that continue the story, so that each night means something.

**Acceptance criteria**
- 3–5 notes per night, ≤ 280 characters, English
- Each night has at least one clue note

### M7-S23 · Night intros

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Game flow step 6

> As players, we want a short text intro before each night, so that we know where we are.

**Acceptance criteria**
- 2–3 lines per night, shown on a dark screen before the night starts

### M7-S24 · Puzzle scaling and solo versions

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-19, FR-20, US-13

> As a developer, I want one system that sets up each puzzle for the number of players, so that every night works solo and with up to 4.

**Acceptance criteria**
- Map files describe puzzles per player count (e.g. `letterPieces: { 1: 2, 2: 2, 3: 3, 4: 4 }`, `levers: { 1: 1, 2: 1, 3: 2, 4: 3 }`)
- Server sets up the night from `playerCount` at `night:start`
- Item counts (batteries, fuses) can also vary by player count
- **Tests:** correct pieces / levers / items for 1, 2, 3, and 4 players

### M7-S25 · Playtest every night at 1, 2, and 4 players

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-19, FR-20

> As a developer, I want every night played at different player counts, so that none of them is impossible or too easy.

**Acceptance criteria**
- Each of Nights 1–5 finished once solo, once with 2, and once with 4 players
- Notes on difficulty per player count; tune and retest
