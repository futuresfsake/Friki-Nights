# M1 — Dark House Prototype ✅

**Goal:** a single-player dark house you can walk around in.
**Done when:** runs with `npm run dev` and builds.
**Depends on:** —
**Branch:** `m1-prototype` (merged into `main`)

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |
| M1-S01 | Client project setup | Must | S | ✅ |
| M1-S02 | Start screen and content warning | Must | S | ✅ |
| M1-S03 | First-person movement | Must | M | ✅ |
| M1-S04 | Wall collision with sliding | Must | S | ✅ |
| M1-S05 | Head-bob and footsteps | Should | S | ✅ |
| M1-S06 | Flashlight with battery | Must | M | ✅ |
| M1-S07 | Flashlight blinking | Should | S | ✅ |
| M1-S08 | ASCII map and house builder | Must | M | ✅ |
| M1-S09 | Generated textures | Must | S | ✅ |
| M1-S10 | Dark atmosphere and flickering lights | Must | S | ✅ |
| M1-S11 | Ambient drone and 3D knocks | Must | M | ✅ |
| M1-S12 | Pause and resume | Should | S | ✅ |

**12 stories · 12 done**

## Out of scope

Interactions, items, scares, multiplayer (M2+).

## Stories

### M1-S01 · Client project setup

**Priority:** Must · **Size:** S · **Status:** ✅ · **Traces:** NFR-04

> As a developer, I want a Vite + Three.js project with tests, so that I can build the game with instant reload.

**Acceptance criteria**
- `npm run dev`, `build`, `preview`, `test` work in `client/`
- Folder layout follows the [LLD](../../design/low-level-design.md)
- JS bundle under 600 KB gzipped (actual ≈124 KB)

### M1-S02 · Start screen and content warning

**Priority:** Must · **Size:** S · **Status:** ✅ · **Traces:** Safety settings

> As a player, I want a title screen with a content warning, so that I know what I'm getting into.

**Acceptance criteria**
- Title reads "FRIKI NIGHTS"
- Warns about jump scares, loud sounds, flicker, darkness; recommends headphones
- Shows the controls; click to enter

### M1-S03 · First-person movement

**Priority:** Must · **Size:** M · **Status:** ✅ · **Traces:** FR-03, US-03

> As a player, I want to walk and look around in first person, so that I feel inside the house.

**Acceptance criteria**
- Mouse look with pointer lock
- WASD moves at 2.2 m/s, Shift runs at 4.0 m/s
- Diagonal movement is not faster

### M1-S04 · Wall collision with sliding

**Priority:** Must · **Size:** S · **Status:** ✅ · **Traces:** FR-03, US-03

> As a player, I want walls to stop me, so that the house feels solid.

**Acceptance criteria**
- Player can never pass through a wall
- Walking diagonally into a wall slides along it
**Tests:** 5 unit tests (`collision.test.js`)

### M1-S05 · Head-bob and footsteps

**Priority:** Should · **Size:** S · **Status:** ✅

> As a player, I want my view to bob and hear soft footsteps, so that walking feels physical.

**Acceptance criteria**
- Gentle bob while moving, fades out when stopping
- One quiet, soft footstep every 0.95 m, louder when running (tuned after playtest)

### M1-S06 · Flashlight with battery

**Priority:** Must · **Size:** M · **Status:** ✅ · **Traces:** FR-04, US-04

> As a player, I want a flashlight with limited battery, so that darkness feels dangerous.

**Acceptance criteria**
- F toggles the flashlight with a click sound
- Full battery lasts 2.5 min of use; drains only while on
- HUD battery bar turns red under 20%; light dims as it runs out
**Tests:** 3 unit tests (`battery.test.js`)

### M1-S07 · Flashlight blinking

**Priority:** Should · **Size:** S · **Status:** ✅ · **Traces:** Horror design (slow dread)

> As a player, I want my flashlight to blink now and then, so that I never fully trust my light.

**Acceptance criteria**
- Bursts of 2–5 quick blinks every 7–18 s
- Every 1.5–4.5 s when battery is low
- Disabled by the "reduce flashing" flag
**Tests:** 5 unit tests (`blink.test.js`)

### M1-S08 · ASCII map and house builder

**Priority:** Must · **Size:** M · **Status:** ✅

> As a developer, I want levels written as ASCII maps, so that I can design rooms without a 3D editor.

**Acceptance criteria**
- Parser reads `#` `.` `P` `S` and spaces; rejects unknown characters and maps without spawn
- Builder creates floors, ceilings, and only the visible wall faces, merged into 3 meshes
**Tests:** 6 unit tests (`map.test.js`)

### M1-S09 · Generated textures

**Priority:** Must · **Size:** S · **Status:** ✅

> As a player, I want old wallpaper, floorboards, and a stained ceiling, so that the house looks decayed.

**Acceptance criteria**
- All textures drawn on canvas at runtime; no image files
- Seeded, so they look the same every load
- Nearest-filtered for the PS1 look

### M1-S10 · Dark atmosphere and flickering lights

**Priority:** Must · **Size:** S · **Status:** ✅ · **Traces:** NFR-01

> As a player, I want fog, darkness, and flickering bulbs, so that the house feels unsafe.

**Acceptance criteria**
- Renders at 0.5 pixel ratio, fog, vignette
- Ceiling lights hum and randomly drop out; respects "reduce flashing"

### M1-S11 · Ambient drone and 3D knocks

**Priority:** Must · **Size:** M · **Status:** ✅ · **Traces:** FR-11 (partial)

> As a player, I want a constant low drone and knocks from around me, so that I'm uneasy even when nothing happens.

**Acceptance criteria**
- Drone from detuned sawtooth oscillators through a low-pass filter with a slow LFO
- Three knocks every 30–70 s from a random direction, HRTF-panned
- Audio starts on the first click (browser rule)

### M1-S12 · Pause and resume

**Priority:** Should · **Size:** S · **Status:** ✅

> As a player, I want Esc to pause, so that I can step away.

**Acceptance criteria**
- Esc releases the mouse and shows "PAUSED — CLICK TO RESUME"
- Clicking resumes; game logic stops while paused
