# Milestone Reference

Short scope of every milestone: what it includes, what files it touches, which requirements it covers, and how it is tested. The detailed plan, with every **story (feature)**, acceptance criteria, and tasks, is in one file per milestone under [`milestones/`](milestones/). Progress is tracked in [Milestone status](milestone-status.md); the process is in [Milestone foundation](milestone-foundation.md).

| Milestone | Stories | Must · Should · Could |
| --- | --- | --- |
| M1 Dark house prototype | 12 | 9 · 3 · 0 |
| M2 Interactions + first scares | 18 | 15 · 2 · 1 |
| M3 Multiplayer | 20 | 18 · 2 · 0 |
| M4 Voice | 11 | 7 · 3 · 1 |
| M5 The Waiting One + Scare Director | 16 | 13 · 3 · 0 |
| M6 Progression | 10 | 6 · 3 · 1 |
| M7 Content | 23 | 20 · 3 · 0 |
| M8 Polish and release | 15 | 11 · 4 · 0 |
| **Total** | **125** | **99 · 23 · 3** |

---

## M1 — Dark house prototype

**Goal:** a single-player dark house you can walk around in.
**Done when:** runs with `npm run dev` and builds.
**Depends on:** —
**Stories:** 12 features → [full story list](milestones/m1-dark-house-prototype.md)

**Scope**
- First-person movement, collision, head-bob
- Flashlight + battery
- Fog, flicker, generated textures and sounds
- ASCII map (simple: `#`, `.`, `P`, `L` = light)

**Files:** `client/index.html`, `client/src/main.js` (original `tether/` code was lost; rebuilt in this repo)
**Requirements:** FR-03, FR-04 · US-03, US-04
**Tests:** manual run + build

---

## M2 — Interactions + first scares

**Goal:** Night 1 works as a single-player level with puzzles and scares.
**Done when:** Night 1 is solvable and scary alone.
**Depends on:** M1
**Stories:** 18 features → [full story list](milestones/m2-interactions-and-first-scares.md)

**Scope**
- Shared map format (see [LLD § Map format](../design/low-level-design.md))
- Doors, locked doors, keys, notes, batteries
- E to interact, inventory, note reader
- Trigger tiles
- Night 1 fuse box puzzle (house key opens it, fuses restore power)
- JS-01 Face in the flashlight, JS-02 Door slam
- Door creak, door slam, whisper sounds

**Out of scope:** multiplayer, The Waiting One, Scare Director

**Files:** `client/src/world/*`, `player/*`, `audio/*`, `scares/scares.js`, `ui/hud.js`, `ui/notes.js`, `shared/maps/night1.js`, `shared/constants.js`
**Requirements:** FR-05, FR-11 (partial) · US-07 (single player)
**Tests:** unit tests for map parser, collision, battery; playtest Night 1 alone

---

## M3 — Multiplayer

**Goal:** two players in the same house over the internet.
**Done when:** two browsers finish Night 1 together at 250 ms simulated delay.
**Depends on:** M2
**Stories:** 20 features → [full story list](milestones/m3-multiplayer.md)

**Scope**
- Node + Express + Socket.IO server
- Shared access phrase checked in the Socket.IO handshake (`ACCESS_PHRASE` env var) + access screen
- Room create/join with 6-char codes, max 2 players, room expiry
- Partner model, 15 Hz movement + 100 ms interpolation
- Server-authoritative doors and items (first valid request wins)
- Rejoin within 60 s with `playerToken`
- Zod validation, rate limits, speed/distance checks, CORS

**Files:** `server/src/*`, `shared/events.js`, `client/src/net/*`, `client/src/ui/lobby.js`
**Requirements:** FR-01, FR-02, FR-06, FR-07, FR-14, FR-16 · US-01, US-02, US-05, US-07 · NFR-02, NFR-03
**Tests:** server integration (wrong access phrase refused, create/join, room full, first interaction wins, speed hack rejected, rejoin, expiry); network test at 250 ms / 2% loss; first security pass; real-distance test Cebu ↔ Europe

---

## M4 — Voice

**Goal:** talk to each other inside the game.
**Done when:** you talk in-game Cebu ↔ Europe.
**Depends on:** M3
**Stories:** 11 features → [full story list](milestones/m4-voice.md)

**Scope**
- WebRTC via `simple-peer`, signalled over Socket.IO
- Proximity volume (louder when close)
- Mute and push-to-talk
- STUN, TURN fallback if needed
- Mic requested only on the Ready screen

**Files:** `client/src/voice/voice.js`, `server/src/index.js` (signal relay)
**Requirements:** FR-08 · US-06 · NFR-07
**Tests:** real-distance voice test; check whether TURN is needed

---

## M5 — The Waiting One + Scare Director

**Goal:** the house fights back.
**Done when:** the entity never moves while watched (tested) and scares respect pacing.
**Depends on:** M3
**Stories:** 16 features → [full story list](milestones/m5-waiting-one-and-scare-director.md)

**Scope**
- Entity state machine: DORMANT, STALK, FROZEN, HUNT, CATCH, COOLDOWN
- View-cone checks (60°, line of sight) on the server at 10 ticks/s
- Catch → down → revive (hold E 3 s within 1.5 m, 60 s limit); timer runs out or both down → night failed, restart night
- Hiding closets (not safe if The Waiting One saw the player enter)
- Scare Director: tension, ≥4 min between big scares, never during UI
- Heartbeat, "it saw you" tone

**Files:** `server/src/entity.js`, `server/src/director.js`, `client/src/scares/scares.js`, `client/src/audio/sfx.js`
**Requirements:** FR-09, FR-10, FR-11, FR-17 · US-09, US-10, US-11
**Tests:** entity never moves on a tick where it is in a view cone; closet entered while seen → caught, unseen → safe; revive timeout → night failed; no two big scares within 4 min; revive timing; scare playtest

---

## M6 — Progression

**Goal:** progress carries over between play sessions.
**Done when:** XP, rank, perks, and unlocked nights survive a reload on both browsers.
**Depends on:** M5
**Stories:** 10 features → [full story list](milestones/m6-progression.md)

**Scope**
- XP formula, couple rank, perks
- localStorage save (`frikiNights.save`)
- Night select (host's unlocked nights)
- Summary screen

**Files:** `client/src/save/local.js`, summary + night select UI
**Requirements:** FR-12, FR-13 · US-12
**Tests:** unit tests for XP and rank; reload test on both browsers

---

## M7 — Content

**Goal:** the full story, Nights 2–5 and the ending.
**Done when:** Nights 2–5 and the ending are playable together.
**Depends on:** M6 (Night 1 complete end to end)
**Stories:** 23 features → [full story list](milestones/m7-content.md)

**Scope**
- Night 2 Library and Study — torn letter split clue, blackouts, JS-03, JS-04, JS-09
- Night 3 Cellar — co-op lever hold, JS-05
- Night 4 Upper Floor and Nursery — fake radio voices (garbled speech + subtitles) + code word, hunting, JS-06, JS-07, JS-08
- Night 5 Attic — everything combined, JS-10 final chase
- Letters, notes, ending screen with run stats

**Files:** `shared/maps/night2.js … night5.js`, scares, audio, story text
**Requirements:** FR-11, FR-12 · US-08, US-10
**Tests:** scare playtest per night; full run together

---

## M8 — Polish and release

**Goal:** a public link you can both play on.
**Done when:** public link works on both laptops with no critical bugs.
**Depends on:** M7
**Stories:** 15 features → [full story list](milestones/m8-polish-and-release.md)

**Scope**
- Settings: sensitivity, volume, sting volume, reduce flashing, subtitles
- Lobby UI, "Waking the house…" screen, content warning
- CI (GitHub Actions), `npm audit`, Dependabot
- Production deploy (Netlify + Render)
- Playtest fixes, performance pass

**Requirements:** FR-15 · NFR-01, NFR-04, NFR-05, NFR-06
**Tests:** Playwright end-to-end; performance on the weaker laptop; final security pass; real-distance playtest
