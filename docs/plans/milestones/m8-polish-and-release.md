# M8 — Polish and Release ⬜

**Goal:** a public link we can both play on.
**Done when:** the public link works on both laptops with no critical bugs.
**Depends on:** M7
**Branch:** `m8-release`

> Tasks for each story are written when M8 starts. "Public link" means deployed online, but still protected by the access phrase.

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |
| M8-S01 | Settings menu | Must | M | ⬜ |
| M8-S02 | Mouse sensitivity | Must | S | ⬜ |
| M8-S03 | Master and sting volume | Must | S | ⬜ |
| M8-S04 | Reduce flashing | Must | S | ⬜ |
| M8-S05 | Subtitles | Must | M | ⬜ |
| M8-S06 | Pause menu | Should | S | ⬜ |
| M8-S07 | Lobby and menu polish | Should | M | ⬜ |
| M8-S08 | Code quality tools | Should | S | ⬜ |
| M8-S09 | Continuous integration | Must | S | ⬜ |
| M8-S10 | Deploy client to Netlify | Must | S | ⬜ |
| M8-S11 | Deploy server to Render | Must | S | ⬜ |
| M8-S12 | End-to-end tests | Should | M | ⬜ |
| M8-S13 | Performance pass | Must | M | ⬜ |
| M8-S14 | Security pass | Must | M | ⬜ |
| M8-S15 | Final playtest and bug fixes | Must | L | ⬜ |

**15 stories · 0 done** (11 Must · 4 Should · 0 Could)

## Out of scope

Mobile, more players, monetization (non-goals).

## Stories

### M8-S01 · Settings menu

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-15

> As a player, I want one settings screen, so that I can make the game comfortable for me.

**Acceptance criteria**
- Reachable from title, lobby, and pause menu
- Changes apply immediately and are saved in localStorage

### M8-S02 · Mouse sensitivity

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-15

> As a player, I want to change mouse sensitivity, so that looking around feels right on my laptop.

**Acceptance criteria**
- Slider 0.2×–3×; default 1×

### M8-S03 · Master and sting volume

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-15, Safety settings

> As a player, I want separate volume for jump-scare stings, so that I can lower the loudest sounds without losing atmosphere.

**Acceptance criteria**
- Master volume slider; separate sting volume (uses the sting bus from M1)

### M8-S04 · Reduce flashing

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-15, Safety settings

> As a player sensitive to flicker, I want to turn off flashing, so that I can play safely.

**Acceptance criteria**
- Turns off ceiling-light drop-outs, flashlight blinking, rapid flicker
- Jump scares themselves stay

### M8-S05 · Subtitles

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-15, Safety settings

> As a player, I want subtitles for important sounds, so that I don't miss cues.

**Acceptance criteria**
- Captions like "[knocking upstairs]", "[whispers behind you]", radio messages
- On by default; can be turned off; uses `textContent`

### M8-S06 · Pause menu

**Priority:** Should · **Size:** S · **Status:** ⬜

> As a player, I want a pause menu, so that I can reach settings or leave the room.

**Acceptance criteria**
- Resume, Settings, Leave room
- Online, pausing doesn't stop the world (teammates keep playing); shows that clearly

### M8-S07 · Lobby and menu polish

**Priority:** Should · **Size:** M · **Status:** ⬜ · **Traces:** Controls and UI

> As players, we want the menus to look like part of the game, so that it feels finished.

**Acceptance criteria**
- Consistent style across title, access, lobby, ready, summary
- Clear error messages for every failure (wrong code, room full, server asleep)

### M8-S08 · Code quality tools

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Tech stack

> As a developer, I want ESLint and Prettier, so that code stays consistent.

**Acceptance criteria**
- `npm run lint` passes on the whole repo

### M8-S09 · Continuous integration

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Tech stack, Security

> As a developer, I want tests run on every push, so that `main` never breaks.

**Acceptance criteria**
- GitHub Actions: install, lint, test, build, `npm audit`
- Dependabot enabled

### M8-S10 · Deploy client to Netlify

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Development and deployment

> As players, we want the game at a real web address, so that we just open a link.

**Acceptance criteria**
- Netlify builds `client/` on push to `main`; HTTPS; `VITE_SERVER_URL` set

### M8-S11 · Deploy server to Render

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Development and deployment

> As players, we want the game server always reachable, so that we can play any time.

**Acceptance criteria**
- Render web service in the region chosen in M3; `ACCESS_PHRASE`, `CLIENT_ORIGIN`, TURN env vars set

### M8-S12 · End-to-end tests

**Priority:** Should · **Size:** M · **Status:** ⬜ · **Traces:** Testing

> As a developer, I want automated multiplayer tests, so that big changes don't break the basics.

**Acceptance criteria**
- Playwright with 1, 2, and 4 browser contexts: join room, open a door, see teammates, finish a night

### M8-S13 · Performance pass

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** NFR-01, NFR-04

> As players, we want smooth framerate on the weaker laptop, so that the game is comfortable.

**Acceptance criteria**
- 60 fps on an integrated-GPU laptop at 0.5 pixel ratio
- JS bundle < 600 KB gzipped; playable within 5 s on 20 Mbps

### M8-S14 · Security pass

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Security

> As the owner, I want a final security check, so that the public link is safe.

**Acceptance criteria**
- Every item in the security table re-checked
- Abuse tests: bad payloads, flooding, joining full/foreign rooms, wrong access phrase
- `npm audit` clean (no high/critical)

### M8-S15 · Final playtest and bug fixes

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** Done when

> As a couple, we want to play the whole game from the public link, so that we know it's finished.

**Acceptance criteria**
- Full run of all five nights, Cebu ↔ Europe, on both laptops
- Each night also played once solo and once with 3–4 players
- No critical bugs; minor ones logged in "Later"
