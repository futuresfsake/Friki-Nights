# Milestone Status

Live progress tracker. Update this file whenever a task or milestone changes state.

**Last updated:** 2026-10-12
**Current milestone:** M2 — Interactions + first scares (next up)

## Overview

| ID | Milestone | State | Branch | Notes |
| --- | --- | --- | --- | --- |
| M1 | Dark house prototype | ✅ Done | — | Code is in the local `tether/` folder, not yet in this repo |
| M2 | Interactions + first scares | ⏭️ Next | `m2-interactions` | |
| M3 | Multiplayer | ⬜ Not started | | |
| M4 | Voice | ⬜ Not started | | |
| M5 | The Waiting One + Scare Director | ⬜ Not started | | |
| M6 | Progression | ⬜ Not started | | |
| M7 | Content | ⬜ Not started | | |
| M8 | Polish and release | ⬜ Not started | | |

States: ⬜ Not started · ⏭️ Next · 🔨 In progress · 🧪 Testing · ✅ Done

## M1 — Dark house prototype ✅

- [x] First-person movement (WASD, mouse look, run)
- [x] Grid collision with wall sliding, head-bob
- [x] Flashlight + battery
- [x] Fog, flickering ceiling lights
- [x] Canvas-generated textures (wallpaper, floorboards, ceiling)
- [x] Web Audio drone, footsteps, knocks
- [x] ASCII map
- [x] Runs with `npm run dev` and builds

**Leftovers carried into M2**
- [ ] Rename start screen title "TETHER" → "FRIKI NIGHTS"
- [ ] Move the `tether/` project into this repo as `client/`

## M2 — Interactions + first scares ⏭️

- [ ] Shared map format in `shared/maps/` (light char `L` → `S`)
- [ ] Map parser (`world/mapParser.js`) + unit tests
- [ ] Split `main.js` into modules (builder, textures, controller, flashlight, audio)
- [ ] Doors and locked doors
- [ ] Keys, notes, batteries as pickups
- [ ] E to interact + interaction prompt
- [ ] Inventory
- [ ] Note reader UI
- [ ] Trigger tiles (`T`)
- [ ] JS-01 Face in the flashlight
- [ ] JS-02 Door slam
- [ ] Sounds: door creak, door slam, whispers
- [ ] Night 1 map layout (Foyer and Parlor)
- [ ] **Done when:** Night 1 is solvable and scary alone

## M3 – M8

Tasks will be listed here when each milestone starts. Scope for each is in [Milestone reference](milestone-reference.md).

## Later (ideas not in the current milestone)

- Async "Solo Visit" mode (non-goal for v1)

## Change log

| Date | Change |
| --- | --- |
| 2026-10-12 | Docs created; M1 marked done; M2 next |
