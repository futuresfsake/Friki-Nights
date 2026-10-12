# M3 — Multiplayer ⬜

**Goal:** two players in the same house over the internet.
**Done when:** two browsers finish Night 1 together at 250 ms simulated delay.
**Depends on:** M2
**Branch:** `m3-multiplayer`

> Tasks for each story are written when M3 starts (see [foundation rule 2](../milestone-foundation.md)).

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |
| M3-S01 | Repo layout: client, server, shared | Must | S | ⬜ |
| M3-S02 | Game server bootstrap | Must | M | ⬜ |
| M3-S03 | Access phrase | Must | S | ⬜ |
| M3-S04 | Display name | Must | S | ⬜ |
| M3-S05 | Create room with code | Must | M | ⬜ |
| M3-S06 | Join room | Must | M | ⬜ |
| M3-S07 | Ready screen and code word | Must | M | ⬜ |
| M3-S08 | Night start for both players | Must | S | ⬜ |
| M3-S09 | Send movement and server speed check | Must | M | ⬜ |
| M3-S10 | Partner model and interpolation | Must | L | ⬜ |
| M3-S11 | Server-authoritative interactions | Must | L | ⬜ |
| M3-S12 | Shared and per-player scare triggers | Must | M | ⬜ |
| M3-S13 | Exit together | Must | S | ⬜ |
| M3-S14 | Disconnect pause and rejoin | Must | M | ⬜ |
| M3-S15 | Room expiry and cleanup | Must | S | ⬜ |
| M3-S16 | Validation and rate limits | Must | M | ⬜ |
| M3-S17 | "Waking the house…" screen | Should | S | ⬜ |
| M3-S18 | Developer solo test mode | Should | S | ⬜ |
| M3-S19 | Network delay testing | Must | M | ⬜ |
| M3-S20 | Real-distance test Cebu ↔ Europe | Must | S | ⬜ |

**20 stories · 0 done** (18 Must · 2 Should · 0 Could)

## Out of scope

Voice (M4), The Waiting One (M5), night select and saving (M6).

## Stories

### M3-S01 · Repo layout: client, server, shared

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** LLD §1, Conventions

> As a developer, I want client, server, and shared code in one repo, so that both sides use the same maps, constants, and event schemas.

**Acceptance criteria**
- `client/`, `server/`, `shared/` folders; npm workspaces at the root
- `constants.js` moved to `shared/`; nothing duplicated
- `npm test` at the root runs all tests

### M3-S02 · Game server bootstrap

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Tech stack, Security

> As a developer, I want a Node + Express + Socket.IO server, so that players can connect.

**Acceptance criteria**
- Starts with `npm run dev` / `npm start`; listens on `PORT`
- `GET /health` returns OK (used to wake Render)
- CORS and Socket.IO `origin` allow only `CLIENT_ORIGIN`
- `maxHttpBufferSize` 16 KB

### M3-S03 · Access phrase

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-16, Security

> As the owner, I want only people who know our phrase to connect, so that strangers can't use the game.

**Acceptance criteria**
- Access screen asks for the phrase once; stored in localStorage
- Sent in the Socket.IO handshake `auth`; compared with `ACCESS_PHRASE`
- Wrong phrase → refused with a clear message; failed attempts rate-limited per IP
- **Test:** wrong phrase refused, right phrase accepted

### M3-S04 · Display name

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-01, US-02

> As a player, I want to just type a name, so that we can start without an account.

**Acceptance criteria**
- 1–20 characters, control characters stripped, shown with `textContent`
- Remembered in localStorage for next time

### M3-S05 · Create room with code

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-02, US-01

> As a player, I want to create a room and get a short code, so that my partner can join me.

**Acceptance criteria**
- Server returns a 6-character code from a 32-character alphabet (no 0/O, 1/I)
- Code shown large with a copy button
- Creator becomes host and gets a secret `playerToken` (sessionStorage)

### M3-S06 · Join room

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-02, US-01

> As a player, I want to type my partner's code and join, so that we're in the same house.

**Acceptance criteria**
- Join succeeds in < 10 s; both see each other's name
- Third player gets `room:full`; wrong code gets `room:notfound`
- Join attempts limited to 5/min per IP
- **Tests:** room full, not found, rate limit

### M3-S07 · Ready screen and code word

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Game flow step 4, Security

> As a player, I want to set a secret code word and press Ready, so that we start together and can verify each other in Night 4.

**Acceptance criteria**
- Code word hashed on the client (SHA-256) before sending; never sent to the partner
- Shows partner's ready status
- Night starts only when both are ready

### M3-S08 · Night start for both players

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** LLD §3

> As a player, I want both of us to load the same night at the same time, so that we start together.

**Acceptance criteria**
- Server sends `night:start { night, seed }` to both
- P spawns at `P`, partner at `Q`
- Short text intro for the night

### M3-S09 · Send movement and server speed check

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** HLD rules, Security (cheating)

> As a developer, I want each client to send its position 15×/s and the server to check it, so that movement is smooth and can't be cheated.

**Acceptance criteria**
- Client moves instantly (no input lag) and sends `player:move` at ≤ 15 Hz
- Server rejects speed > run speed + 10% and sends a correction
- **Test:** speed hack rejected and corrected

### M3-S10 · Partner model and interpolation

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** FR-06, US-05, NFR-03

> As a player, I want to see my partner walking smoothly, so that I always know where they are.

**Acceptance criteria**
- Low-poly partner figure with their own flashlight cone and name
- Rendered 100 ms behind with interpolation; no teleporting at 250 ms delay and 2% loss
- Partner footsteps placed in 3D

### M3-S11 · Server-authoritative interactions

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** FR-07, US-07

> As a player, I want doors, items, and the fuse box to be the same on both screens, so that we can solve puzzles together.

**Acceptance criteria**
- `nightState` (from M2-S02) runs on the server
- Client sends `interact { targetId }`; server checks distance (≤ 2 m) and state, then broadcasts `world:update`
- Change appears on both screens in < 500 ms
- **Test:** two requests for the same key within 50 ms → exactly one player gets it

### M3-S12 · Shared and per-player scare triggers

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Horror design §1

> As a player, I want some scares to happen only to me, so that we end up asking "Did you see that?!"

**Acceptance criteria**
- Trigger tiles are checked on the server; `scare:play` goes to one or both players
- Each trigger in the map says `target: 'self' | 'both'`

### M3-S13 · Exit together

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Game flow step 9

> As a player, I want the night to end only when we both reach the exit, so that nobody is left behind.

**Acceptance criteria**
- First player at the exit waits ("Waiting for <name>…")
- Night completes when both are in the exit zone

### M3-S14 · Disconnect pause and rejoin

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-14

> As a player, I want to get back into the game after my connection drops, so that a bad network doesn't ruin the night.

**Acceptance criteria**
- Night pauses for up to 60 s with a countdown on the partner's screen
- Rejoin with room code + `playerToken` restores the player and the night state
- After 60 s → back to lobby; night progress lost
- **Test:** rejoin within 60 s, refused without token

### M3-S15 · Room expiry and cleanup

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Game flow, Security

> As the owner, I want empty rooms deleted, so that the server stays clean and codes can't be reused.

**Acceptance criteria**
- Room deleted 5 min after both players leave
- **Test:** expiry with fake timers

### M3-S16 · Validation and rate limits

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Security

> As the owner, I want every event checked, so that bad or flooding messages can't break the server.

**Acceptance criteria**
- Zod schema for every event in `shared/events.js`
- Per-socket, per-event rate limits
- Invalid payloads ignored and logged, never crash the server
- **Tests:** bad payloads, flooding

### M3-S17 · "Waking the house…" screen

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Risks (Render sleeps)

> As a player, I want a themed loading screen while the server wakes up, so that I don't think the game is broken.

**Acceptance criteria**
- Lobby pings `/health` on open; shows "Waking the house…" until it answers (up to ~1 min)

### M3-S18 · Developer solo test mode

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Decisions (solo = dev only)

> As a developer, I want to test a night alone, so that I don't need two browsers for every change.

**Acceptance criteria**
- `?solo=1` works only in dev builds; never in production

### M3-S19 · Network delay testing

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** NFR-02, Testing

> As a developer, I want to test with fake delay and packet loss, so that I find desync before we play for real.

**Acceptance criteria**
- Delay proxy or DevTools setup documented: 250 ms, 2% loss
- Two browsers finish Night 1 together under these conditions

### M3-S20 · Real-distance test Cebu ↔ Europe

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Testing, Open questions

> As players, we want to play one real session across the distance, so that we know the game works for us.

**Acceptance criteria**
- Server deployed to Render (test deploy)
- Delay measured from both sides
- Server region decided: Singapore or Frankfurt
