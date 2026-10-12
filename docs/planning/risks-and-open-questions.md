# Risks and Open Questions

## Risks

| Risk | Mitigation |
| --- | --- |
| Scope too big for one developer | Finish Night 1 end to end (M1–M6) before Nights 2–5 |
| Voice blocked by strict networks | TURN fallback; else call on Messenger/Discord while playing |
| Render free tier sleeps | "Waking the house…" screen; ping server when lobby opens |
| Server restart wipes rooms | Acceptable for session-based play; progress is in localStorage |
| 200+ ms delay causes desync | Server-authoritative state + network tests in M3 |
| Low fps on weaker laptop | Low pixel ratio, few lights per room, merged wall meshes |
| Too many scares become predictable | Scare Director pacing + randomized directed scares |

## Open questions

- [ ] Server region: Singapore or Frankfurt? Decide after the M3 real-distance test.
- [ ] Is this also for a class or portfolio deadline? When?
