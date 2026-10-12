# Milestones

## Development approach

Friki Nights uses an **iterative, milestone-based development approach** instead of time-boxed sprints.

- **Milestones, not sprints.** A milestone ends when its **"Done when"** exit criteria are met, not after a fixed number of weeks. There is no sprint planning, velocity, or burndown.
- **Incremental.** Each milestone builds on the previous one, and the game stays runnable after every milestone.
- **Vertical slice first.** Night 1 is finished end to end (M1–M6) before Nights 2–5 are built (M7), so every system is proven on one small, complete level.
- **Continuous flow.** Work is picked up when there is time, similar to Kanban, which suits a one-developer project with irregular hours across two time zones.
- **One branch per milestone.** E.g. `m2-interactions`, merged into `main` when the milestone is done.

| | Sprints (Scrum) | Milestones (this project) |
| --- | --- | --- |
| What ends a stage | Time (usually 1–2 weeks) | A goal (the "Done when" criteria) |
| Planning question | "What fits in the next 2 weeks?" | "What must work before we move on?" |
| Progress measured by | Velocity, burndown | Has the exit criteria been met? |

## Roadmap

- [x] **M1 — Dark house prototype.** First-person movement, collision, flashlight + battery, fog, flicker, generated textures and sounds, ASCII map. *Done when:* runs with `npm run dev` and builds. **(Done — start screen still says "TETHER"; rename to "FRIKI NIGHTS".)**
- [ ] **M2 — Interactions + first scares.** Shared map format, doors, keys, notes, batteries, E to interact, inventory, note reader, trigger tiles, JS-01 and JS-02, creak/slam/whisper sounds. *Done when:* Night 1 is solvable and scary alone.
- [ ] **M3 — Multiplayer.** Socket.IO server, room codes, partner model, 15 Hz movement + interpolation, server-authoritative doors/items, rejoin. *Done when:* two browsers finish Night 1 together at 250 ms simulated delay.
- [ ] **M4 — Voice.** WebRTC signalling, proximity volume, mute, push-to-talk, TURN fallback. *Done when:* you talk in-game Cebu ↔ Europe.
- [ ] **M5 — The Waiting One + Scare Director.** Entity state machine, view-cone checks, catch/down/revive, hiding closets, directed scares, heartbeat. *Done when:* entity never moves while watched (tested) and scares respect pacing.
- [ ] **M6 — Progression.** XP, rank, perks, localStorage save, night select, summary screen.
- [ ] **M7 — Content.** Nights 2–5, puzzles, letters, fake-voice code word, remaining scares, final chase, ending.
- [ ] **M8 — Polish and release.** Settings, subtitles, lobby UI, CI, production deploy, playtest fixes. *Done when:* public link works on both laptops with no critical bugs.
