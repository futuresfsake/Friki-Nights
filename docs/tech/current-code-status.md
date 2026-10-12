# Current Code Status

**Milestone 1 rebuilt** in `client/` (branch `m1-prototype`). The original `tether/` prototype was lost; this rebuild replaces it and already uses the module layout from the [LLD](../design/low-level-design.md).

| File | What it does |
| --- | --- |
| `client/package.json` | Vite 5, three ^0.169.0, Vitest; scripts `dev`, `build`, `preview`, `test` |
| `client/index.html` | Canvas, vignette, crosshair, battery HUD, "FRIKI NIGHTS" start/pause overlay with content warning |
| `src/main.js` | Boot: renderer at 0.5 pixel ratio, fog, ambient light, game loop, random knocks |
| `src/constants.js` | Cell size, speeds, battery values (moves to `shared/` in M3) |
| `src/world/map.js` | ASCII map parser (`#` `.` `P` `S`, space = wall) |
| `src/world/levels.js` | Prototype house map |
| `src/world/builder.js` | Floor/ceiling/wall geometry, merged into 3 meshes |
| `src/world/textures.js` | Seeded canvas textures: wallpaper with wainscot, floorboards, stained ceiling |
| `src/world/lights.js` | Flickering ceiling lights (respects a `reduceFlashing` flag) |
| `src/player/controller.js` | PointerLockControls, WASD + Shift run, head-bob, footstep timing |
| `src/player/collision.js` | Grid collision with wall sliding |
| `src/player/flashlight.js` | Camera-attached spotlight, F toggle, low-battery stutter |
| `src/player/battery.js` | Battery drain / refill logic |
| `src/audio/engine.js` | AudioContext, master + sting buses, HRTF panner, listener tracking |
| `src/audio/sfx.js` | Drone, footsteps, 3D knocks, flashlight click |
| `src/ui/hud.js` | Battery bar, overlay show/hide |
| `tests/*.test.js` | 14 unit tests: map parser, collision, battery |

The map already uses `S` for ceiling lights (the shared-format character), so no change is needed in M2.

**Verified:** `npm test` (14 passing), `npm run build` (≈124 KB gzipped JS), page loads in Chrome with no errors and renders the house.
**Not yet verified:** movement, mouse look, and sound need a hands-on playtest (headless Chrome can't lock the mouse or play audio).

Run: `cd client` → `npm install` → `npm run dev` → open `http://localhost:5173`.
