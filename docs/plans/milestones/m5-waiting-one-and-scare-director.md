# M5 — The Waiting One + Scare Director ⬜

**Goal:** the house fights back.
**Done when:** The Waiting One never moves while watched (tested) and scares respect pacing.
**Depends on:** M3
**Branch:** `m5-waiting-one`

> Tasks for each story are written when M5 starts.

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |
| M5-S01 | Server game tick (10 Hz) | Must | S | ⬜ |
| M5-S02 | The Waiting One model | Must | M | ⬜ |
| M5-S03 | View cone and line of sight | Must | M | ⬜ |
| M5-S04 | Entity state machine | Must | L | ⬜ |
| M5-S05 | Stalking movement and pathfinding | Must | M | ⬜ |
| M5-S06 | Frozen when seen + "it saw you" tone | Must | S | ⬜ |
| M5-S07 | Catch and downed state | Must | M | ⬜ |
| M5-S08 | Revive (hold E) | Must | M | ⬜ |
| M5-S09 | Night failed | Must | S | ⬜ |
| M5-S10 | Hiding closets | Must | M | ⬜ |
| M5-S11 | Heartbeat | Should | S | ⬜ |
| M5-S12 | Scare Director: tension and pacing | Must | M | ⬜ |
| M5-S13 | Directed and per-player scares | Must | M | ⬜ |
| M5-S14 | JS-03 Lights out, figure appears | Must | S | ⬜ |
| M5-S15 | Partner-themed small scares | Should | M | ⬜ |
| M5-S16 | Breathing sound | Should | S | ⬜ |
| M5-S17 | The Tenant: the man who trolls you | Should | L | ✅ |

**17 stories · 1 done** (13 Must · 4 Should · 0 Could)

## Out of scope

HUNT mode is built here but only switched on in Nights 4–5 (M7). Final chase JS-10 is M7.

## Stories

### M5-S01 · Server game tick (10 Hz)

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** HLD rules

> As a developer, I want the server to update the world 10 times a second, so that the entity and scares run in one place for every player.

**Acceptance criteria**
- Fixed 100 ms tick per active room; stops when the room is paused or empty
- `entity:state { x, z, mode }` broadcast each tick

### M5-S02 · The Waiting One model

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Visual style §3

> As a player, I want a tall, faceless figure that is horrible to look at, so that I fear it.

**Acceptance criteria**
- Code-built: thin, slightly taller than a door, near-black, no face
- Never fully lit; slight shimmer at the edges
- Client interpolates its position (100 ms buffer)

### M5-S03 · View cone and line of sight

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-09, US-09

> As a player, I want the creature to know when we're looking at it, so that watching it actually keeps us safe.

**Acceptance criteria**
- A player "sees" the entity if it's within a 60° cone of their look direction AND no wall is between them (grid ray cast)
- A downed player or one hiding in a closet does not count as seeing
- **Tests:** in cone + clear line → seen; behind wall → not seen; outside cone → not seen

### M5-S04 · Entity state machine

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** LLD §6

> As a developer, I want clear entity states, so that its behavior is predictable and testable.

**Acceptance criteria**
- States: `DORMANT`, `STALK`, `FROZEN`, `HUNT`, `CATCH`, `COOLDOWN`
- Transitions exactly as in the LLD; HUNT only when the night enables it
- **Key test:** the entity never moves on a tick where any player sees it

### M5-S05 · Stalking movement and pathfinding

**Priority:** Must · **Size:** M · **Status:** ⬜

> As a player, I want the creature to find its way to me through rooms, so that hiding behind a door isn't enough.

**Acceptance criteria**
- Path on the map grid (BFS/A*), recalculated a few times per second
- 1.2 m/s in STALK, 2.5 m/s in HUNT; moves toward the nearest player
- Closed doors: opens them slowly (creak) — never passes through walls

### M5-S06 · Frozen when seen + "it saw you" tone

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Sound catalog

> As a player, I want a deep tone when I catch sight of it, so that I know it's there even in the dark.

**Acceptance criteria**
- Stops instantly when seen
- 40 Hz sine swell plays on the player who first sees it (once per sighting)

### M5-S07 · Catch and downed state

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-09

> As a player, I want getting caught to be terrifying but not the end, so that I keep playing.

**Acceptance criteria**
- Within 1 m → player down; scream sting; screen goes dark red
- Downed player can't move; sees revive timer (60 s) and nearest teammate distance
- Entity goes to COOLDOWN for 15 s away from all players

### M5-S08 · Revive (hold E)

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-10, US-11

> As a player, I want to revive a downed teammate by holding E, so that one mistake doesn't end the night.

**Acceptance criteria**
- Any teammate within 1.5 m holds E for 3 s; progress ring shown
- Moving away or releasing E cancels
- **Test:** revive timing on the server

### M5-S09 · Night failed

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-10, Decisions (no checkpoints)

> As players, we want a clear "night failed" when we lose, so that we know to try again.

**Acceptance criteria**
- Revive timer runs out OR all players down OR solo player caught → `night:failed`
- Failure screen; everyone returns to the night intro; night restarts from the start
- **Test:** timeout → failed; all down → failed; 3 players with 2 down → continues; solo caught → failed

### M5-S10 · Hiding closets

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-17

> As a player, I want to hide in a closet, so that I can escape when it's coming — if it didn't see me go in.

**Acceptance criteria**
- `H` closets: E to enter/leave; view through door slats
- If the entity saw the player enter → it opens the closet and catches them
- If not → it loses track and returns to STALK
- **Tests:** entered while seen → caught; unseen → safe

### M5-S11 · Heartbeat

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Sound catalog

> As a player, I want to hear my heartbeat speed up when it's near, so that I feel danger I can't see.

**Acceptance criteria**
- Two low sine thumps; rate goes from ~60 to ~140 bpm as distance drops below 10 m

### M5-S12 · Scare Director: tension and pacing

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Horror design §1, LLD §6

> As a player, I want scares well spaced, so that they stay scary instead of predictable.

**Acceptance criteria**
- Tension rises with time since last scare and darkness; drops after a scare
- Big scare only if tension > threshold, ≥ 4 min since the last big one, and no UI open
- **Test:** never two big scares within 4 minutes

### M5-S13 · Directed and per-player scares

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Horror design §1

> As a player, I want the house to pick scares for me when things are quiet, so that I'm never fully at ease.

**Acceptance criteria**
- Director picks from scares unlocked for the night, avoiding repeats
- Can target one player (the one alone or in the dark), some, or all

### M5-S14 · JS-03 Lights out, figure appears

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Jump scare catalog

> As a player, I want the lights to die and the creature to be closer when they return, so that darkness becomes terrifying.

**Acceptance criteria**
- 2 s blackout; entity placed 3 m in front of the player when the lights return (frozen)
- Available from Night 2 (director only)

### M5-S15 · Partner-themed small scares

**Priority:** Should · **Size:** M · **Status:** ⬜ · **Traces:** Horror design §1 ("use the partner")

> As a player, I want the house to fake my teammates, so that I can't trust what I hear.

**Acceptance criteria**
- Fake teammate footsteps behind the player when the real teammates are far away (a random teammate is chosen)
- Distant voice-like whisper using a teammate's name in the subtitle
- Off in solo (replaced by other small scares)

### M5-S16 · Breathing sound

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Sound catalog

> As a player, I want to hear breathing right behind me, so that I'm afraid to turn around.

**Acceptance criteria**
- Filtered noise with slow in/out envelope, PannerNode placed behind the listener
- Used by the director and later JS-07

### M5-S17 · The Tenant: the man who trolls you

**Priority:** Should · **Size:** L · **Status:** ✅ · **Traces:** Horror design §1 (per-player scares, "use the partner") · **Pulled forward** by the owner on 2026-10-14, built before the rest of M5

> As a player, I want a real, scary person in the house who toys with me unpredictably, so that I never know what's coming next.

The Tenant is a gaunt, too-tall man with a grin stretched ear to ear, pinprick eyes, and a head that twitches to new angles. He **never hurts anyone** (catching is The Waiting One's job). He wants you turning round. **Each player has their own Tenant that only they see and hear**, and he never changes shared night state, so screens can't disagree.

**Tricks** (`client/src/tenant/acts.js`), each with random variants:
- **peek**: stands far off where you're not looking yet. When you see him he vanishes, waves, walks at you anyway, or is closer every time you look back
- **cross**: walks slowly across a room ahead, head turned to watch you; sometimes stops and stares
- **follow**: footsteps behind yours, a beat late; stop and there's one more step. Turn round: usually nothing
- **name**: whispers your name (or your teammate's) with a subtitle
- **giggle**: a chuckle close by in the dark
- **doorTrap**: holds the next door you open shut, giggles behind it and runs off; or knocks back on a door you close
- **breathe** (big): breathing behind you that stays behind you; turn in time and he's there
- **lightsOut** (big): the light dies, running steps, and when it's back he's in front of you, finger to his lips. Or nothing's there and the laugh is behind you
- **rush** (big, after 4 min): sprints at you from the end of a hall
- **bedVisit**: while you hide under a bed, bare feet stop in front of you. He leaves, whispers that he knows, or his head comes down to the floor to look

**Pacing** (`client/src/tenant/brain.js`): 35–70 s of peace first; random gaps with 15% "double taps" (3–8 s) and 10% long silences (90–150 s); never the same trick twice in a row; big tricks ≥150 s apart, also from the map's jump scares; nothing while a note or pause is open.

**Tests:** brain pacing and variety; sight and spot finding; an hour-long simulated night per seed with a restless player (every trick fires, he's only ever on open floor and in sight when he appears, gone when a trick ends, uses both names); door trap (held, knocks back, ignores exit and locked doors, expires).

