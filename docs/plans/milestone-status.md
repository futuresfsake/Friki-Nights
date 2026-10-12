# Milestone Status

Live progress tracker. Update this file whenever a task or milestone changes state.

**Last updated:** 2026-10-12
**Current milestone:** M1 — Dark house prototype (rebuild; original code was lost)
**Deadline:** personal date, flexible — target is the full game (M1–M8)

## Overview

| ID | Milestone | State | Branch | Notes |
| --- | --- | --- | --- | --- |
| M1 | Dark house prototype | ⏭️ Next (rebuild) | `m1-prototype` | Built once as `tether/`, but that code was lost; rebuild in `client/` |
| M2 | Interactions + first scares | ⬜ Not started | `m2-interactions` | |
| M3 | Multiplayer | ⬜ Not started | | |
| M4 | Voice | ⬜ Not started | | |
| M5 | The Waiting One + Scare Director | ⬜ Not started | | |
| M6 | Progression | ⬜ Not started | | |
| M7 | Content | ⬜ Not started | | |
| M8 | Polish and release | ⬜ Not started | | |

States: ⬜ Not started · ⏭️ Next · 🔨 In progress · 🧪 Testing · ✅ Done

## M1 — Dark house prototype ⏭️ (rebuild)

- [ ] Set up `client/` with Vite 5 + three ^0.169.0 (`dev`, `build`, `preview`)
- [ ] Start screen titled "FRIKI NIGHTS" with content warning
- [ ] First-person movement (WASD, mouse look, Shift to run)
- [ ] Grid collision with wall sliding, head-bob
- [ ] Flashlight (F) + battery HUD
- [ ] Fog, vignette, flickering ceiling lights, low pixel ratio
- [ ] Canvas-generated textures (wallpaper, floorboards, ceiling)
- [ ] Web Audio drone, footsteps, knocks
- [ ] ASCII map
- [ ] **Done when:** runs with `npm run dev` and builds

## M2 — Interactions + first scares ⬜

- [ ] Shared map format in `shared/maps/` (light char `L` → `S`)
- [ ] Map parser (`world/mapParser.js`) + unit tests
- [ ] Split `main.js` into modules (builder, textures, controller, flashlight, audio)
- [ ] Doors and locked doors
- [ ] Keys, notes, batteries as pickups
- [ ] E to interact + interaction prompt
- [ ] Inventory
- [ ] Note reader UI
- [ ] Trigger tiles (`T`)
- [ ] Night 1 fuse box puzzle (house key opens it, fuses restore power)
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
| 2026-10-12 | Original M1 code found to be lost → M1 back to Next (rebuild). Open questions resolved (access phrase, no checkpoints, closets, fuse box, fake voices, English, keys) |
