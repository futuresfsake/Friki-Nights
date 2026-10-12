# Current Code Status

Milestone 1 project (`tether/` folder, to be renamed `friki-nights/client`):

- `package.json` — Vite 5 + three ^0.169.0; scripts `dev`, `build`, `preview`
- `index.html` — canvas, vignette, crosshair, battery HUD, start overlay (title still "TETHER")
- `src/main.js` — ASCII map, PS1-style low-res renderer, fog, canvas textures (wallpaper, floorboards, ceiling), flickering ceiling lights, camera-attached spotlight flashlight with battery, Web Audio drone/footsteps/knocks, PointerLockControls, grid collision with wall sliding, head-bob

Run: `npm install` → `npm run dev` → open `http://localhost:5173`.
