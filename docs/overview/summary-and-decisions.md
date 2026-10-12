# Summary, Decisions, and Non-goals

## 1. One-line summary

Friki Nights is a **first-person, 1–4 player online co-op horror game** (built around playing as a couple, but also playable solo or with up to 4 players) that runs in the browser, is written **entirely in code** (no art or audio files), uses **room codes only (no accounts)**, and deploys for **free**.

## 2. Decisions locked in

| Decision | Choice |
| --- | --- |
| Players | **1 to 4**, online co-op, real time. Every room, even solo, goes through the server |
| Login | **None.** Session-based. One player creates a room, the other joins with a room code |
| Database | **None in v1.** Rooms live in server memory; progress is kept in the browser (localStorage) |
| Graphics | Low-poly / PS1-style 3D with Three.js, all geometry and textures generated in code |
| Audio | All sounds generated in code with the Web Audio API |
| Horror style | **Jump scares + scary sounds + slow dread** (not dread only) |
| Voice | In-game proximity voice chat (WebRTC); fallback is a Messenger/Discord call |
| Editor | VS Code, plain JavaScript (ES modules) |
| Hosting | Netlify (client) + Render (game server), free tiers |
| Who can play | **Only people who know the access phrase** (us and friends we share it with). The server requires it before showing the lobby |
| Solo play | **Yes.** Every night is fully playable alone; each co-op puzzle has a solo version |
| 3–4 players | Co-op puzzles **scale up** with the number of players (more letter pieces, more levers) |
| Story and ranks | Unchanged: story about the separated couple; "couple rank" keeps its name |
| Language | **English only** |
| Failure rule | A downed player not revived in 60 s, or **all** players down → **night failed**, restart the night (no checkpoints). **Solo:** being caught = night failed; solo nights have 2 extra batteries to balance |
| Deadline | Personal date, **flexible**; target is the **full game** (M1–M8) |

## 3. Non-goals for v1

- Accounts, sign-in, email, or any database
- Async "Solo Visit" mode with notes saved between sessions (needs storage; possible later). Normal solo play is supported
- More than four players, matchmaking with strangers
- Mobile / touch controls
- Realistic graphics, imported 3D models, cutscenes
- Monetization
