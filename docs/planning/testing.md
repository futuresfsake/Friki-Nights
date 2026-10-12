# Testing

| Level | Tool | Covers | When |
| --- | --- | --- | --- |
| Unit | Vitest | Map parser, collision, battery, XP, entity transitions, view-cone math, Scare Director pacing, Zod schemas | Every push |
| Server integration | Vitest + 1–5× socket.io-client | Create/join, room full, first interaction wins, speed hack rejected, revive timing, rejoin, room expiry | Every push |
| End-to-end | Playwright, 1–4 browser contexts | Join room, open door, see partner, finish a night | Each milestone |
| Network | DevTools throttling; delay proxy (250 ms, 2% loss) | Interpolation, no desync | M3 onward |
| Real distance | Chelsea + boyfriend (+ friends for 3–4 player tests) | Delay, voice quality, TURN need, server region | End of M3, M4, M8 |
| Performance | stats.js, Chrome Performance tab | 60 fps on the weaker laptop | Each milestone |
| Scare playtest | Solo and 2+ players | Scares land, not too frequent, sounds directional | Each night |
| Security | Abuse tests, `npm audit` | Bad payloads, flooding, joining full/foreign rooms | M3 and M8 |

## Key automated cases

- The Waiting One never moves on a tick where any player's view cone contains it
- Two `interact` requests for the same key within 50 ms → exactly one player gets it
- `player:move` faster than run speed + 10% is rejected and corrected
- Fifth socket joining a full room gets `room:full`
- Solo player caught → night failed; with 3 players, one down + 60 s → night failed
- Puzzles generate the right number of pieces / levers for 1, 2, 3, and 4 players
- Scare Director never fires two big scares within 4 minutes
- Notes and display names render as plain text (no HTML)
