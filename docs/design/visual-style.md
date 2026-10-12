# Visual Style

> Everything is generated in code: no image or model files. Items marked **Proposed** are not decided yet.

## 1. Look

- **Low-poly / PS1-style** 3D with Three.js.
- Rendered at a **low pixel ratio (0.5)** and scaled up for a chunky, retro look (also helps NFR-01: 60 fps).
- **Fog** hides distance and keeps rooms claustrophobic.
- **Vignette** overlay darkens the screen edges.
- Light comes almost only from the **flashlight** (camera-attached spotlight) and a few **flickering ceiling lights**.

## 2. Textures (HTML Canvas at runtime)

| Surface | Texture |
| --- | --- |
| Walls | Faded, stained wallpaper pattern |
| Floor | Worn floorboards |
| Ceiling | Plain, water-stained plaster |
| Cellar (Night 3) | Wet stone, dark water — **Proposed** |
| Nursery (Night 4) | Children's wallpaper, peeling — **Proposed** |

## 3. Characters and objects

| Thing | Build in code |
| --- | --- |
| Partner | Simple low-poly figure (box/capsule body + head), with a small flashlight cone so they are visible in the dark |
| The Waiting One | Tall, thin, faceless figure; dark material; slightly taller than a door |
| Doors, keys, notes, batteries, levers | Simple primitives with canvas textures |
| Jump scare face (JS-01) | Pale flat mesh with simple dark features |

## 4. Palette — Proposed

- Walls and wood: desaturated browns and greens
- Flashlight: warm yellow-white
- Ceiling lights: dim orange, flickering
- The Waiting One: near-black, never fully lit

## 5. Performance rules

- Few lights per room; merge wall meshes.
- Keep shadows off or minimal on the weaker laptop.
- Respect the **Reduce flashing** setting: no rapid flicker when it is on.
