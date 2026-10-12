# Specifications

## Functional

| ID | Requirement |
| --- | --- |
| FR-01 | Player enters a display name; no account or email |
| FR-02 | Create a room with a 6-character code; others join with it; 1 to 4 players |
| FR-03 | First-person movement: WASD, mouse look, Shift to run, wall collision |
| FR-04 | Flashlight on F; battery drains while on, refills with pickups |
| FR-05 | Doors, keys, notes, batteries, levers, hiding closets interact with E |
| FR-06 | Each player sees every other player move in real time |
| FR-07 | Door, item, and puzzle state identical on every screen |
| FR-08 | Proximity voice chat with mute and push-to-talk |
| FR-09 | The Waiting One moves only when unseen; downs a player on contact |
| FR-10 | Downed player can be revived by any teammate within 60 s; if not, if all are down, or if a solo player is caught, the night fails and restarts |
| FR-11 | Jump scares and scripted scary sounds per the catalog in [Horror design](../design/horror-design.md) |
| FR-12 | Five nights, unlocked in order |
| FR-13 | XP, couple rank, perks saved in localStorage |
| FR-14 | Rejoin a room within 60 s after a disconnect |
| FR-15 | Settings: sensitivity, volume, sting volume, reduce flashing, subtitles |
| FR-16 | Only people who know the shared access phrase can connect to the server |
| FR-17 | Hiding closets protect a player only if The Waiting One did not see them enter |
| FR-18 | All game text is in English |
| FR-19 | Every night can be played solo; each co-op puzzle has a solo version |
| FR-20 | Co-op puzzles scale up for 3–4 players (more pieces, more levers) |

## Non-functional

| ID | Requirement | Target |
| --- | --- | --- |
| NFR-01 | Frame rate on an integrated-GPU laptop | 60 fps at 0.5 pixel ratio |
| NFR-02 | Playable delay | ≤300 ms round trip, 2% packet loss |
| NFR-03 | Partner movement | Smooth at 15 Hz updates, no teleporting |
| NFR-04 | Load | JS bundle < 600 KB gzipped; playable within 5 s on 20 Mbps |
| NFR-05 | Browsers | Latest desktop Chrome, Edge, Firefox |
| NFR-06 | Cost | $0/month |
| NFR-07 | Privacy | No personal data stored on the server; voice never recorded |
