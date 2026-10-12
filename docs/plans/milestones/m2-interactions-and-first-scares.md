# M2 — Interactions + First Scares ⏭️

**Goal:** Night 1 works as a complete single-player level with a puzzle and real scares.
**Done when:** Night 1 is solvable and scary alone.
**Depends on:** M1
**Branch:** `m2-interactions`

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |
| M2-S01 | Shared map format | Must | M | ⬜ |
| M2-S02 | Night state and objectives | Must | M | ⬜ |
| M2-S03 | Interaction system (E) | Must | M | ⬜ |
| M2-S04 | Doors | Must | M | ⬜ |
| M2-S05 | Locked doors and keys | Must | S | ⬜ |
| M2-S06 | Inventory | Must | S | ⬜ |
| M2-S07 | Notes and note reader | Must | M | ⬜ |
| M2-S08 | Battery pickups | Must | S | ⬜ |
| M2-S09 | Fuse box puzzle and power restore | Must | M | ⬜ |
| M2-S10 | Exit and night complete | Must | S | ⬜ |
| M2-S11 | Trigger tiles | Must | S | ⬜ |
| M2-S12 | Scare effects framework | Must | M | ⬜ |
| M2-S13 | JS-01 Face in the flashlight | Must | M | ⬜ |
| M2-S14 | JS-02 Door slam | Must | S | ⬜ |
| M2-S15 | Whispers | Should | S | ⬜ |
| M2-S16 | Night 1 layout: Foyer and Parlor | Must | M | ⬜ |
| M2-S17 | Night 1 notes (story text) | Should | S | ⬜ |
| M2-S18 | JS-06 Window hand | Could | M | ⬜ |

**18 stories · 0 done** (15 Must · 2 Should · 1 Could)

## Night 1 puzzle chain (single player)

```
Start in Foyer → find PARLOR KEY → open locked Parlor door
→ find HOUSE KEY + 3 FUSES (Foyer, Parlor, side room)
→ open FUSE BOX with house key → place fuses → hall power ON
→ front door (EXIT) unlocks → walk out → Night complete
```

Scares along the way: knocks (M1), whispers, JS-01 when the parlor key is picked up, JS-02 on leaving the parlor, JS-06 (Could) at the foyer window.

## Out of scope

Multiplayer and server authority (M3), The Waiting One and Scare Director (M5), XP and saving (M6), settings menu and subtitles (M8).

## Stories

### M2-S01 · Shared map format

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** LLD §2

> As a developer, I want one map format with every object type, so that the client (and later the server) build Night 1 from the same file.

**Acceptance criteria**
- Parser understands `# . P Q D L K N B S H E T X F U` (`F` fuse box, `U` fuse are new)
- Map files live in `shared/maps/` and export `{ id, name, grid, keys, lockedDoors, notes, triggers }`
- IDs are assigned in reading order: the 1st `K` gets `keys[0]`, the 1st `L` gets `lockedDoors[0]`, etc.
- Mismatched counts (e.g. 2 `K` but 1 key id) throw a clear error
- Every object gets a stable id like `door-12-5` (type + cell), so the server can refer to it in M3

**Tasks**
- [ ] Create `shared/maps/night1.js` and allow Vite to import from `shared/`
- [ ] Extend `client/src/world/map.js` → `shared/mapParser.js` with all characters and metadata
- [ ] Add `F` and `U` to the map table in the LLD
- [ ] Unit tests: every character, id order, count mismatch errors, object ids

**Tests:** unit

### M2-S02 · Night state and objectives

**Priority:** Must · **Size:** M · **Status:** ⬜

> As a developer, I want all puzzle state in one pure module, so that it is easy to test and can move to the server in M3 unchanged.

**Acceptance criteria**
- `nightState.js` holds doors (open/locked), items taken, inventory, fuses placed, power on, exit unlocked
- Changes happen only through actions like `apply(state, { type: 'interact', targetId, playerId })` that return the result
- No Three.js or DOM imports in the module

**Tasks**
- [ ] Create `shared/nightState.js` with `createNightState(map)` and `apply(state, action)`
- [ ] Return events (e.g. `door-opened`, `item-taken`, `power-on`) for the client to animate
- [ ] Unit tests for every action and invalid action (taking an item twice, opening a locked door without key)

**Tests:** unit

### M2-S03 · Interaction system (E)

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-05

> As a player, I want to press E on things I'm looking at, so that I can use the world.

**Acceptance criteria**
- Looking at an interactable within 2 m shows a prompt, e.g. "E — Open door"
- E acts on the object under the crosshair, only one at a time
- Nothing happens through walls
- Prompt text uses `textContent`

**Tasks**
- [ ] Raycast from the camera against interactable meshes (max 2 m)
- [ ] Add prompt element to the HUD
- [ ] E key → `nightState.apply` → play result events
- [ ] Unit test: distance check helper

**Tests:** unit, playtest

### M2-S04 · Doors

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-05, US-07

> As a player, I want to open and close doors, so that I can explore room by room.

**Acceptance criteria**
- `D` cells become a door mesh (code-built panel + frame)
- E toggles open/closed with a ~0.6 s swing
- Closed doors block movement; open doors don't
- Door creak sound (sawtooth sweep + resonant bandpass + noise), placed in 3D

**Tasks**
- [ ] Door mesh + canvas wood texture
- [ ] Collision: closed door cell counts as solid
- [ ] Swing tween
- [ ] `doorCreak()` in `sfx.js`
- [ ] Unit test: collision with open vs. closed door

**Tests:** unit, playtest

### M2-S05 · Locked doors and keys

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-05, US-07

> As a player, I want some doors locked until I find the right key, so that exploring has a goal.

**Acceptance criteria**
- `L` doors say "Locked" when E is pressed without the key (with a rattle sound)
- With the matching key in inventory, the door unlocks and opens
- Keys are small code-built meshes that slowly glint in the flashlight

**Tasks**
- [ ] Key mesh + pickup
- [ ] Locked-door check in `nightState`
- [ ] Rattle sound
- [ ] Unit tests: wrong key, right key, no key

**Tests:** unit, playtest

### M2-S06 · Inventory

**Priority:** Must · **Size:** S · **Status:** ⬜

> As a player, I want to see what I'm carrying, so that I know which key or fuse I have.

**Acceptance criteria**
- Tab shows a small list of carried items (keys, fuses)
- Picking up an item shows a short "Picked up: Parlor key" message

**Tasks**
- [ ] `ui/inventory.js`
- [ ] Pickup toast in HUD

**Tests:** playtest

### M2-S07 · Notes and note reader

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-05, Security (XSS)

> As a player, I want to read notes left in the house, so that I learn the story and find clues.

**Acceptance criteria**
- `N` cells hold a paper mesh; E opens a full-screen reader with the note text
- Text is shown with `textContent`, max 280 characters
- E or Esc closes it; the game pauses while reading
- Scares never fire while the reader is open
- Notes found are counted (for the M6 summary)

**Tasks**
- [ ] `ui/notes.js` reader
- [ ] Paper mesh with canvas texture
- [ ] `uiOpen` flag used by the scare framework
- [ ] Unit test: note text length limit

**Tests:** unit, playtest

### M2-S08 · Battery pickups

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-04, US-04

> As a player, I want to find batteries, so that I can keep my flashlight alive.

**Acceptance criteria**
- `B` cells hold a battery mesh; E adds 40% (capped at 100%)
- HUD bar updates immediately

**Tasks**
- [ ] Battery mesh + pickup using `addBattery`

**Tests:** unit (exists), playtest

### M2-S09 · Fuse box puzzle and power restore

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Night 1)

> As a player, I want to open the fuse box and put the fuses back, so that I restore power to the hall.

**Acceptance criteria**
- `F` fuse box is locked; the house key opens it
- `U` fuses (3 in Night 1) are picked up and placed one by one with E
- The box shows how many fuses are in place (e.g. lit slots)
- When all are placed: hall ceiling lights switch on with a clunk + rising hum, and the exit unlocks

**Tasks**
- [ ] Fuse box mesh with slots; fuse mesh
- [ ] Fuse logic in `nightState`
- [ ] Power-on: enable hall lights, clunk sound
- [ ] Unit tests: locked box, placing fuses, power on after the last fuse

**Tests:** unit, playtest

### M2-S10 · Exit and night complete

**Priority:** Must · **Size:** S · **Status:** ⬜

> As a player, I want to leave through the front door once the power is back, so that the night has an ending.

**Acceptance criteria**
- `X` exit door is sealed until power is on ("It won't budge.")
- Walking through it shows a simple "Night 1 complete" screen with time and notes found
- Option to play again

**Tasks**
- [ ] Exit trigger
- [ ] Simple end screen (full summary comes in M6)

**Tests:** playtest

### M2-S11 · Trigger tiles

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Horror design §1

> As a developer, I want floor tiles that fire scares, so that I can place scripted scares in the map.

**Acceptance criteria**
- `T` cells map to entries in the map's `triggers` list, e.g. `{ scare: 'JS-02', once: true }`
- A trigger can also be tied to an event (e.g. "after picking up the parlor key")
- One-time triggers never fire twice

**Tasks**
- [ ] Trigger check each frame (player cell)
- [ ] Event-based triggers
- [ ] Unit tests: fires once, fires on event

**Tests:** unit

### M2-S12 · Scare effects framework

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-11, Horror design §1

> As a developer, I want one place that plays scares, so that every scare follows the same rules.

**Acceptance criteria**
- `scares/scares.js` exposes `playScare(id, params)`
- Helpers: camera shake, light blackout for N seconds, sting through the sting bus
- A scare is skipped (or delayed) while any UI is open
- Scream sting sound: detuned sawtooth glide + noise + distortion

**Tasks**
- [ ] `scares.js` with registry
- [ ] Camera shake, blackout helpers
- [ ] `screamSting()` in `sfx.js`
- [ ] Unit test: no scare while UI open

**Tests:** unit, playtest

### M2-S13 · JS-01 Face in the flashlight

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-11, US-10

> As a player, I want a face to suddenly appear in my flashlight, so that the game actually scares me.

**Acceptance criteria**
- A pale, code-built face appears ~1 m in front of the camera for 0.4 s
- With scream sting and camera shake
- Fires once in Night 1, after the parlor key pickup (event trigger)

**Tasks**
- [ ] Face mesh (canvas texture: pale, hollow eyes)
- [ ] Register `JS-01`
- [ ] Hook to the parlor key event

**Tests:** playtest

### M2-S14 · JS-02 Door slam

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-11, US-10

> As a player, I want a door to slam shut behind me, so that I feel I'm not alone.

**Acceptance criteria**
- When the player steps on the trigger, the open door behind them snaps shut
- Loud slam (noise burst + generated-impulse reverb) + all lights off for 1 s
- The door can be reopened afterwards

**Tasks**
- [ ] `doorSlam()` with ConvolverNode reverb
- [ ] Register `JS-02`; place trigger leaving the parlor

**Tests:** playtest

### M2-S15 · Whispers

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Horror design §3

> As a player, I want to hear whispers somewhere near me, so that the house feels alive.

**Acceptance criteria**
- Noise through moving narrow bandpass filters (vowel-like), HRTF-panned
- Plays from trigger tiles in dark rooms; never louder than the drone + 6 dB

**Tasks**
- [ ] `whispers(x, y, z, duration)` in `sfx.js`

**Tests:** playtest (headphones)

### M2-S16 · Night 1 layout: Foyer and Parlor

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Story (Night 1)

> As a player, I want a real Foyer and Parlor to explore, so that Night 1 feels like a place, not a test map.

**Acceptance criteria**
- Replaces the M1 prototype map
- Contains the full puzzle chain above, 2–3 batteries, 3–4 notes, 3 fuses
- Solvable in about 10–15 minutes alone
- No dead ends where the player can get stuck

**Tasks**
- [ ] Draw the map in `shared/maps/night1.js`
- [ ] Place triggers for whispers, JS-01, JS-02
- [ ] Playtest timing and tune

**Tests:** playtest (full solve)

### M2-S17 · Night 1 notes (story text)

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Story

> As a player, I want notes that tell the story of the house, so that I care why I'm here.

**Acceptance criteria**
- 3–4 notes, each ≤ 280 characters, in English
- At least one hints where a fuse is
- Introduce the separated couple and the torn letters

**Tasks**
- [ ] Write note texts in `night1.js`

**Tests:** read-through

### M2-S18 · JS-06 Window hand

**Priority:** Could · **Size:** M · **Status:** ⬜ · **Traces:** Horror design §2

> As a player, I want a hand to slam against a window as I pass, so that the outside feels dangerous too.

**Acceptance criteria**
- A window in a foyer wall (code-built frame + dark glass)
- Trigger: hand mesh hits the glass with a bang, then pulls away
- Map format gains a window marker (to be decided in this story)

**Tasks**
- [ ] Window mesh, hand mesh, bang sound
- [ ] Register `JS-06`

**Tests:** playtest
