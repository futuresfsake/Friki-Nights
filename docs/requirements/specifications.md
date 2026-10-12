# Specifications

## Functional

| ID | Requirement |
| --- | --- |
| FR-01 | Player enters a display name; no account or email |
| FR-02 | Create a room with a 6-character code; partner joins with it; max 2 players |
| FR-03 | First-person movement: WASD, mouse look, Shift to run, wall collision |
| FR-04 | Flashlight on F; battery drains while on, refills with pickups |
| FR-05 | Doors, keys, notes, batteries, levers, hiding closets interact with E |
| FR-06 | Each player sees the partner move in real time |
| FR-07 | Door, item, and puzzle state identical on both screens |
| FR-08 | Proximity voice chat with mute and push-to-talk |
| FR-09 | The Waiting One moves only when unseen; downs a player on contact |
| FR-10 | Downed player can be revived within 60 s; if not, or if both are down, the night fails and restarts |
| FR-11 | Jump scares and scripted scary sounds per the catalog in [Horror design](../design/horror-design.md) |
| FR-12 | Five nights, unlocked in order |
| FR-13 | XP, couple rank, perks saved in localStorage |
| FR-14 | Rejoin a room within 60 s after a disconnect |
| FR-15 | Settings: sensitivity, volume, sting volume, reduce flashing, subtitles |
| FR-16 | Only people who know the shared access phrase can connect to the server |
| FR-17 | Hiding closets protect a player only if The Waiting One did not see them enter |
| FR-18 | All game text is in English |

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
