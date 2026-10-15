# Visual Style

> Everything is generated in code: no image or model files. Items marked **Proposed** are not decided yet.

## 1. Look

- A **real abandoned house** (changed 2026-10-15, MH-S03: the owner found the PS1 look too much like Minecraft). Simple shapes, but large, smoothly filtered textures and full-resolution rendering (pixel ratio up to 1.5) with antialiasing.
- **Film grain** overlay, like old footage.
- **Fog** hides distance and keeps rooms claustrophobic.
- **Vignette** overlay darkens the screen edges.
- Light comes almost only from the **flashlight** (camera-attached spotlight) and a few **flickering ceiling lights**.

## 2. Textures (HTML Canvas at runtime)

| Surface | Texture |
| --- | --- |
| Walls | Faded damask wallpaper, brown water stains and drips from the ceiling, torn patches down to plaster and lath, a peeling strip, the unfaded shape of a missing picture, mould, dark panelled wainscoting under a chair rail, skirting board. 4 m × 3 m per repeat, mapped by world position |
| Floor | Long worn floorboards with staggered joints, grain, knots, nails, dirt in the gaps, scratches, an old dark stain. 4 m per repeat |
| Ceiling | Cracked plaster, damp rings, mould |
| Cellar (Night 3) | Wet stone, dark water — **Proposed** |
| Nursery (Night 4) | Children's wallpaper, peeling — **Proposed** |

## 3. Characters and objects

| Thing | Build in code |
| --- | --- |
| Partner | Simple low-poly figure (box/capsule body + head), with a small flashlight cone so they are visible in the dark |
| The Waiting One | Tall, thin, faceless figure; dark material; slightly taller than a door |
| Beds | Rusty iron cot with a stained, striped mattress; the player can crawl underneath |
| Doors, keys, notes, batteries, levers | Simple primitives with canvas textures |
| Jump scare face (JS-01) | A whole head with long black hair and shoulders that lunges into the lens (MH-S06) |
| The Tenant | A floating ghost in a torn burial gown (MH-S01); Clara the ballerina (MH-S05) |

## 4. Palette — Proposed

- Walls: faded olive wallpaper gone brown with damp; dark brown wood panelling; wood: desaturated browns
- Flashlight: warm yellow-white
- Ceiling lights: dim orange, flickering
- The Waiting One: near-black, never fully lit

## 5. Performance rules

- Few lights per room; merge wall meshes.
- Keep shadows off or minimal on the weaker laptop.
- Respect the **Reduce flashing** setting: no rapid flicker when it is on.
