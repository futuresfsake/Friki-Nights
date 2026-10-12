# Summary, Decisions, and Non-goals

## 1. One-line summary

Friki Nights is a **first-person, two-player online co-op horror game** that runs in the browser, is written **entirely in code** (no art or audio files), uses **room codes only (no accounts)**, and deploys for **free**.

## 2. Decisions locked in

| Decision | Choice |
| --- | --- |
| Players | Exactly 2, online co-op, real time |
| Login | **None.** Session-based. One player creates a room, the other joins with a room code |
| Database | **None in v1.** Rooms live in server memory; progress is kept in the browser (localStorage) |
| Graphics | Low-poly / PS1-style 3D with Three.js, all geometry and textures generated in code |
| Audio | All sounds generated in code with the Web Audio API |
| Horror style | **Jump scares + scary sounds + slow dread** (not dread only) |
| Voice | In-game proximity voice chat (WebRTC); fallback is a Messenger/Discord call |
| Editor | VS Code, plain JavaScript (ES modules) |
| Hosting | Netlify (client) + Render (game server), free tiers |

## 3. Non-goals for v1

- Accounts, sign-in, email, or any database
- Async "Solo Visit" mode with notes saved between sessions (needs storage; possible later)
- More than two players, matchmaking with strangers
- Mobile / touch controls
- Realistic graphics, imported 3D models, cutscenes
- Monetization
