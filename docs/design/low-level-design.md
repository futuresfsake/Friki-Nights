# Low-Level Design (LLD)

## 1. Folder structure

```
friki-nights/
  client/
    index.html
    package.json
    src/
      main.js                boot, game loop
      world/mapParser.js     ASCII map -> walls, doors, items, lights, triggers
      world/builder.js       Three.js meshes from parsed map
      world/textures.js      canvas-generated textures
      player/controller.js   movement, collision, head-bob
      player/flashlight.js   spotlight + battery
      net/socket.js          Socket.IO client
      net/interpolate.js     100 ms buffer for partner + entity
      voice/voice.js         WebRTC peer, proximity volume
      audio/engine.js        AudioContext, master/sting buses, PannerNode helpers
      audio/sfx.js           drone, footsteps, knocks, creaks, whispers, heartbeat, stings
      scares/scares.js       client-side scare effects (JS-01 … JS-10)
      ui/lobby.js            name, create/join room, ready, code word
      ui/hud.js              battery, prompts, subtitles
      ui/notes.js            note reader
      save/local.js          localStorage: unlocked nights, xp, settings
  server/
    package.json
    src/
      index.js               Express + Socket.IO bootstrap, CORS
      rooms.js               create/join/leave/expire, max 2 players
      state.js               authoritative night state
      entity.js              The Waiting One state machine
      director.js            Scare Director (pacing + triggers)
      validate.js            speed and distance checks, rate limits
  shared/
    maps/night1.js … night5.js
    events.js                event names + Zod schemas
    constants.js             CELL, speeds, tick rates, limits
  tests/
```

## 2. Map format (ASCII, in `shared/maps`)

| Char | Meaning |
| --- | --- |
| `#` | Wall |
| `.` | Floor |
| `P` / `Q` | Player 1 / Player 2 spawn |
| `D` | Door |
| `L` | Locked door (needs key) |
| `K` | Key |
| `N` | Note |
| `B` | Battery |
| `S` | Ceiling light (flickers) |
| `H` | Hiding closet |
| `E` | Entity spawn |
| `T` | Scare trigger tile (which scare is set in the map's `triggers` list) |
| `X` | Exit |

Client and server parse the **same file**, so layouts never disagree.

Milestone 1 currently uses a simpler map (`#`, `.`, `P`, `L` = light) in `src/main.js`. When moving to the shared format, the light character becomes `S`.

## 3. Socket events

| Event | Direction | Payload | Server rule |
| --- | --- | --- | --- |
| `room:create` | C → S | `{ name }` | Returns `{ code }` (6 chars) |
| `room:join` | C → S | `{ code, name }` | Max 2 players; else `room:full` / `room:notfound` |
| `room:rejoin` | C → S | `{ code, playerToken }` | Restores a dropped player within 60 s |
| `player:ready` | C → S | `{ codeWordHash }` | Night starts when both ready |
| `night:start` | S → both | `{ night, seed, checkpoint }` | Host's chosen unlocked night |
| `player:move` | C → S | `{ x, z, yaw, pitch, t }` | ≤15 Hz; reject speed > run speed + 10% |
| `player:state` | S → partner | `{ id, x, z, yaw, pitch, t }` | Forwarded after validation |
| `interact` | C → S | `{ targetId }` | Within 2 m and state allows it |
| `world:update` | S → both | `{ targetId, state }` | Door open, item taken, lever held |
| `entity:state` | S → both | `{ x, z, mode }` | 10 Hz |
| `scare:play` | S → one/both | `{ scareId, params }` | From Scare Director or trigger tile |
| `player:down` / `player:revive` | both ways | `{ id }` | Revive: partner within 1.5 m for 3 s |
| `voice:signal` | C → S → partner | WebRTC SDP / ICE | Only between the two room members |
| `night:complete` | S → both | `{ xp, stats }` | Clients save to localStorage |

## 4. Server memory model (no database)

```js
rooms = Map<code, {
  code, createdAt, lastActiveAt,
  players: Map<socketId, { id, name, playerToken, codeWordHash, x, z, yaw, pitch, down, ready }>,
  night: { id, phase, checkpoint, doors, items, levers, notesFound },
  entity: { x, z, mode, unseenSince },
  director: { tension, lastBigScareAt, firedTriggers: Set }
}>
```

## 5. Local save (localStorage key `frikiNights.save`)

```json
{ "unlockedNights": [1, 2], "xp": 420, "rank": "Companions",
  "settings": { "sensitivity": 1, "volume": 0.8, "stingVolume": 1, "reduceFlashing": false, "subtitles": true } }
```

## 6. State machines

**Game:** `LOBBY → READY → INTRO → PLAYING → SUMMARY`
From `PLAYING`: caught player → `DOWNED` → back to `PLAYING` on revive; both down → `RESTART_CHECKPOINT`; disconnect → `PAUSED` (≤60 s).

**The Waiting One:**
- `DORMANT` — not yet active this night
- `STALK` — moves toward nearest player at 1.2 m/s, only while **no** player's view cone (60°, line of sight) contains it
- `FROZEN` — seen by any player; stops instantly; low tone plays
- `HUNT` — Nights 4–5, after 20 s unseen, speed 2.5 m/s
- `CATCH` — within 1 m of a player → player down → `COOLDOWN` 15 s away from both

**Scare Director:** tension rises with time since last scare and darkness; falls after a scare. Big scare allowed when tension > threshold and ≥4 min since last big scare and no UI open.

## 7. Progression

- XP per night: `100 + 50 if no one was caught + up to 50 for speed + 10 per note found`
- Couple rank: Strangers 0 · Companions 300 · Partners 800 · Inseparable 1500 · Soulbound 2500
- Perks unlocked by rank: longer flashlight battery, radio burst (freezes The Waiting One 5 s), partner ping (see partner's location 10 s)
