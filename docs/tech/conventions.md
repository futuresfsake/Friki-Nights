# Conventions for Anyone Writing Code

- Plain JavaScript ES modules; no frameworks on the client besides Three.js
- No external asset files — generate geometry, textures, and audio in code
- Shared constants and event schemas live in `shared/`; never duplicate them
- Server validates every client event with Zod before using it
- Never use `innerHTML` with player-provided text
- Keep each module small and focused; comment the "why", not the "what"
- Every new mechanic gets at least one unit test
