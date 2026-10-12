# Testing

| Level | Tool | Covers | When |
| --- | --- | --- | --- |
| Unit | Vitest | Map parser, collision, battery, XP, entity transitions, view-cone math, Scare Director pacing, Zod schemas | Every push |
| Server integration | Vitest + 2× socket.io-client | Create/join, room full, first interaction wins, speed hack rejected, revive timing, rejoin, room expiry | Every push |
| End-to-end | Playwright, two browser contexts | Join room, open door, see partner, finish a night | Each milestone |
| Network | DevTools throttling; delay proxy (250 ms, 2% loss) | Interpolation, no desync | M3 onward |
| Real distance | Chelsea + boyfriend | Delay, voice quality, TURN need, server region | End of M3, M4, M8 |
| Performance | stats.js, Chrome Performance tab | 60 fps on the weaker laptop | Each milestone |
| Scare playtest | Both players | Scares land, not too frequent, sounds directional | Each night |
| Security | Abuse tests, `npm audit` | Bad payloads, flooding, joining full/foreign rooms | M3 and M8 |

## Key automated cases

- The Waiting One never moves on a tick where any player's view cone contains it
- Two `interact` requests for the same key within 50 ms → exactly one player gets it
- `player:move` faster than run speed + 10% is rejected and corrected
- Third socket joining a full room gets `room:full`
- Scare Director never fires two big scares within 4 minutes
- Notes and display names render as plain text (no HTML)
