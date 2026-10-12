# Risks and Open Questions

## Risks

| Risk | Mitigation |
| --- | --- |
| Scope too big for one developer | Finish Night 1 end to end (M1–M6) before Nights 2–5 |
| Personal deadline for the full game | Date is flexible; track progress in [Milestone status](../plans/milestone-status.md) and cut polish before cutting nights |
| M1 code was lost | Rebuild M1 inside this repo first; commit and push often so it can't happen again |
| Voice blocked by strict networks | TURN fallback; else call on Messenger/Discord while playing |
| Render free tier sleeps | "Waking the house…" screen; ping server when lobby opens |
| Server restart wipes rooms | Acceptable for session-based play; progress is in localStorage |
| 200+ ms delay causes desync | Server-authoritative state + network tests in M3 |
| Low fps on weaker laptop | Low pixel ratio, few lights per room, merged wall meshes |
| 4 players = 4 flashlights + more network and voice traffic | Only the nearest 1–2 teammate flashlights are real lights (others are fake light cones); voice mesh is max 6 connections; test with 4 in M3 and M8 |
| Scaled and solo puzzle versions multiply design work | Design solo + 2-player first, then scale; test each night at 1, 2, and 4 players |
| Too many scares become predictable | Scare Director pacing + randomized directed scares |
| No checkpoints makes failure frustrating | Keep each night short (target ~15–25 min); tune revive timer and entity speed in playtests |

## Open questions

- [ ] Server region: Singapore or Frankfurt? Decide after the M3 real-distance test.
- [ ] Exact deadline date (personal, flexible).

## Resolved (2026-10-12)

- [x] Who can play → only people who know the shared access phrase
- [x] Deadline → personal date, flexible, target is the full game
- [x] Language → English only
- [x] Players → 1 to 4; solo is a real mode with solo puzzle versions; puzzles scale up for 3–4 (changed 2026-10-12, was "exactly 2")
- [x] Revive timeout or all players down (solo: caught once) → night failed, restart the night; no checkpoints
- [x] Story and "couple rank" → unchanged with more players
- [x] Hiding closets → not safe if The Waiting One saw you enter
- [x] Keys → push-to-talk V, mute M, inventory Tab, pause Esc
- [x] Night 1 power puzzle → fuse box opened with the house key
- [x] Night 4 fake voices → garbled radio speech + subtitles
- [x] M1 code → lost; rebuild inside this repo
