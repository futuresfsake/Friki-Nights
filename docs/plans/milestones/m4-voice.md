# M4 — Voice ⬜

**Goal:** talk to each other inside the game.
**Done when:** you talk in-game Cebu ↔ Europe.
**Depends on:** M3
**Branch:** `m4-voice`

> Tasks for each story are written when M4 starts.

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |
| M4-S01 | Microphone permission on the Ready screen | Must | S | ⬜ |
| M4-S02 | Peer-to-peer voice connection | Must | L | ⬜ |
| M4-S03 | Proximity volume | Must | M | ⬜ |
| M4-S04 | 3D voice direction | Should | S | ⬜ |
| M4-S05 | Mute (M) | Must | S | ⬜ |
| M4-S06 | Push-to-talk (V) | Must | S | ⬜ |
| M4-S07 | Talking indicators | Should | S | ⬜ |
| M4-S08 | Muffled voice through walls | Could | M | ⬜ |
| M4-S09 | TURN fallback | Must | M | ⬜ |
| M4-S10 | Voice failure fallback message | Should | S | ⬜ |
| M4-S11 | Real-distance voice test | Must | S | ⬜ |

**11 stories · 0 done** (7 Must · 3 Should · 1 Could)

## Out of scope

Recording, text chat, voice changers.

## Stories

### M4-S01 · Microphone permission on the Ready screen

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Security (mic privacy)

> As a player, I want the game to ask for my microphone only when I'm getting ready, so that I know when it's listening.

**Acceptance criteria**
- Mic requested only on the Ready screen, with an explanation
- Denying it still lets you play (no voice; fallback message shown)
- Mic level meter so you can check it works

### M4-S02 · Peer-to-peer voice connection

**Priority:** Must · **Size:** L · **Status:** ⬜ · **Traces:** FR-08, US-06, NFR-07

> As a player, I want my voice to go straight to my partner, so that it's fast and private.

**Acceptance criteria**
- WebRTC via `simple-peer`; the server only relays `voice:signal` between the two room members
- Public STUN servers configured
- Audio encrypted (DTLS-SRTP); never recorded
- Reconnects after a rejoin (M3-S14)

### M4-S03 · Proximity volume

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-08, US-06

> As a player, I want my partner to sound louder when close and quieter when far, so that it feels like we're in the same house.

**Acceptance criteria**
- Full volume within 2 m, fading to a faint minimum (never silent) at 25 m+
- Volume updates smoothly as either player moves

### M4-S04 · 3D voice direction

**Priority:** Should · **Size:** S · **Status:** ⬜

> As a player, I want to hear which direction my partner is talking from, so that I can find them by voice.

**Acceptance criteria**
- Partner voice routed through an HRTF `PannerNode` at their position

### M4-S05 · Mute (M)

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-08, US-06

> As a player, I want to mute my mic with M, so that I control when I'm heard.

**Acceptance criteria**
- M toggles mute; a visible mic icon shows muted state at all times

### M4-S06 · Push-to-talk (V)

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-08

> As a player, I want push-to-talk on V, so that background noise isn't sent.

**Acceptance criteria**
- Setting: open mic or push-to-talk (default open mic)
- In push-to-talk mode, mic sends only while V is held

### M4-S07 · Talking indicators

**Priority:** Should · **Size:** S · **Status:** ⬜

> As a player, I want to see when I or my partner is talking, so that I know voice is working.

**Acceptance criteria**
- HUD icon lights up when your mic picks up voice and when your partner speaks

### M4-S08 · Muffled voice through walls

**Priority:** Could · **Size:** M · **Status:** ⬜

> As a player, I want my partner to sound muffled behind walls, so that the house feels real.

**Acceptance criteria**
- If no line of sight, a low-pass filter is applied to the partner's voice

### M4-S09 · TURN fallback

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Risks (voice blocked)

> As players, we want voice to work even on strict networks, so that we can always talk.

**Acceptance criteria**
- Free-tier TURN credentials read from Render env vars, never in the repo
- Used only if direct connection fails

### M4-S10 · Voice failure fallback message

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** Decisions (Discord/Messenger fallback)

> As a player, I want to be told when voice can't connect, so that we switch to a Messenger or Discord call.

**Acceptance criteria**
- After ~15 s without a connection: "Voice couldn't connect — try a Messenger or Discord call"
- Game continues without voice

### M4-S11 · Real-distance voice test

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** Testing

> As players, we want to test voice across the distance, so that we know it works for us.

**Acceptance criteria**
- Clear voice for a full night Cebu ↔ Europe
- Note whether TURN was needed
