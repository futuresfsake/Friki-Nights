# Current Code Status

**The original Milestone 1 code (`tether/` folder) is lost** and is not in this repo. M1 will be rebuilt inside this repo as `client/`, using the new name "FRIKI NIGHTS" from the start.

What the lost M1 prototype had (use as the rebuild checklist):

- `package.json` — Vite 5 + three ^0.169.0; scripts `dev`, `build`, `preview`
- `index.html` — canvas, vignette, crosshair, battery HUD, start overlay
- `src/main.js` — ASCII map, PS1-style low-res renderer, fog, canvas textures (wallpaper, floorboards, ceiling), flickering ceiling lights, camera-attached spotlight flashlight with battery, Web Audio drone/footsteps/knocks, PointerLockControls, grid collision with wall sliding, head-bob

Once rebuilt, run: `npm install` → `npm run dev` → open `http://localhost:5173`.
