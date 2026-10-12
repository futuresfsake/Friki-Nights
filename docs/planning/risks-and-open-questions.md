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
| Too many scares become predictable | Scare Director pacing + randomized directed scares |
| No checkpoints makes failure frustrating | Keep each night short (target ~15–25 min); tune revive timer and entity speed in playtests |

## Open questions

- [ ] Server region: Singapore or Frankfurt? Decide after the M3 real-distance test.
- [ ] Exact deadline date (personal, flexible).

## Resolved (2026-10-12)

- [x] Who can play → only the two players, via a shared access phrase
- [x] Deadline → personal date, flexible, target is the full game
- [x] Language → English only
- [x] Solo play → no; 2 players only (dev test mode only)
- [x] Revive timeout or both down → night failed, restart the night; no checkpoints
- [x] Hiding closets → not safe if The Waiting One saw you enter
- [x] Keys → push-to-talk V, mute M, inventory Tab, pause Esc
- [x] Night 1 power puzzle → fuse box opened with the house key
- [x] Night 4 fake voices → garbled radio speech + subtitles
- [x] M1 code → lost; rebuild inside this repo
