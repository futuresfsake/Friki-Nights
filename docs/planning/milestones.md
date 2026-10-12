# Milestones

- [x] **M1 — Dark house prototype.** First-person movement, collision, flashlight + battery, fog, flicker, generated textures and sounds, ASCII map. *Done when:* runs with `npm run dev` and builds. **(Done — start screen still says "TETHER"; rename to "FRIKI NIGHTS".)**
- [ ] **M2 — Interactions + first scares.** Shared map format, doors, keys, notes, batteries, E to interact, inventory, note reader, trigger tiles, JS-01 and JS-02, creak/slam/whisper sounds. *Done when:* Night 1 is solvable and scary alone.
- [ ] **M3 — Multiplayer.** Socket.IO server, room codes, partner model, 15 Hz movement + interpolation, server-authoritative doors/items, rejoin. *Done when:* two browsers finish Night 1 together at 250 ms simulated delay.
- [ ] **M4 — Voice.** WebRTC signalling, proximity volume, mute, push-to-talk, TURN fallback. *Done when:* you talk in-game Cebu ↔ Europe.
- [ ] **M5 — The Waiting One + Scare Director.** Entity state machine, view-cone checks, catch/down/revive, hiding closets, directed scares, heartbeat. *Done when:* entity never moves while watched (tested) and scares respect pacing.
- [ ] **M6 — Progression.** XP, rank, perks, localStorage save, night select, summary screen.
- [ ] **M7 — Content.** Nights 2–5, puzzles, letters, fake-voice code word, remaining scares, final chase, ending.
- [ ] **M8 — Polish and release.** Settings, subtitles, lobby UI, CI, production deploy, playtest fixes. *Done when:* public link works on both laptops with no critical bugs.
