import { CELL } from './constants.js';

// Furniture and clutter. Each map lists its props as { type, x, z } (a floor cell),
// plus optionally side ('n' | 's' | 'w' | 'e': which wall to stand against),
// rot (degrees, free-standing props only) and dx / dz (metres from the cell centre).
//
// w × d is the footprint in metres before turning (w along local x, d along local z;
// the back is local -z). wall: stands with its back against a wall of its cell.
// solid: players can't walk through it. Shared so client and server agree.
export const PROPS = {
  wardrobe: { w: 1.1, d: 0.55, h: 2.05, wall: true, solid: true },
  bookshelf: { w: 1.3, d: 0.35, h: 2.0, wall: true, solid: true },
  clock: { w: 0.5, d: 0.35, h: 2.1, wall: true, solid: true }, // grandfather clock; it ticks
  bench: { w: 1.5, d: 0.42, h: 0.48, wall: true, solid: true },
  fireplace: { w: 1.5, d: 0.5, h: 1.25, wall: true, solid: true },
  crates: { w: 0.85, d: 0.85, h: 1.3, wall: true, solid: true },
  table: { w: 1.2, d: 0.8, h: 0.78, solid: true },
  roundTable: { w: 0.9, d: 0.9, h: 0.75, solid: true },
  chair: { w: 0.48, d: 0.48, h: 0.95, solid: true },
  armchair: { w: 0.85, d: 0.85, h: 1.0, solid: true },
  rockingChair: { w: 0.6, d: 0.95, h: 1.05, solid: true }, // rocks on its own now and then
  wheelchair: { w: 0.65, d: 0.9, h: 0.95, solid: true },
  coatRack: { w: 0.45, d: 0.45, h: 1.85, solid: true }, // a long coat on it, like someone standing
  stool: { w: 0.4, d: 0.4, h: 0.45, solid: false },
  fallenChair: { w: 0.95, d: 0.5, h: 0.5, solid: false },
  bucket: { w: 0.32, d: 0.32, h: 0.34, solid: false },
  rug: { w: 2.6, d: 1.7, h: 0.01, solid: false },
  papers: { w: 1.2, d: 1.0, h: 0.01, solid: false },
  bloodstain: { w: 1.4, d: 1.1, h: 0.01, solid: false },
  portrait: { w: 0.7, d: 0.06, h: 0.9, wall: true, solid: false }, // hangs on the wall
  chains: { w: 0.4, d: 0.4, h: 1.4, solid: false }, // hang from the ceiling
  houseMap: { w: 0.6, d: 0.03, h: 0.45, wall: true, solid: false }, // the map pinned to a wall
  piano: { w: 1.5, d: 0.6, h: 1.3, wall: true, solid: true }, // an upright, out of tune
  stove: { w: 1.0, d: 0.65, h: 0.95, wall: true, solid: true }, // iron range, pipe to the ceiling
  counter: { w: 1.6, d: 0.6, h: 0.9, wall: true, solid: true }, // cupboards and a stone sink
  mirror: { w: 0.8, d: 0.05, h: 1.4, wall: true, solid: false }, // cracked, hangs on the wall
  desk: { w: 1.2, d: 0.6, h: 0.78, solid: true },
  sheetChair: { w: 0.85, d: 0.85, h: 1.15, solid: true }, // a dust sheet over a chair; looks like someone sitting
  chandelier: { w: 1.2, d: 1.2, h: 0.9, solid: false }, // hangs from the ceiling, sways
  doll: { w: 0.3, d: 0.35, h: 0.45, solid: false }, // a porcelain doll; now and then its head turns
  cobweb: { w: 1.0, d: 1.0, h: 0.8, solid: false }, // across a ceiling corner of its cell
};

const SIDES = {
  n: { dx: 0, dz: -1, rotation: 0 },
  s: { dx: 0, dz: 1, rotation: Math.PI },
  w: { dx: -1, dz: 0, rotation: Math.PI / 2 },
  e: { dx: 1, dz: 0, rotation: -Math.PI / 2 },
};
const WALL_GAP = 0.04;

// Where a prop stands: world centre, turn, and (if solid) its box on the floor.
// isSolid(cx, cz) is the map's wall test.
export function placeProp(entry, isSolid) {
  const def = PROPS[entry.type];
  const cx = entry.x;
  const cz = entry.z;
  let x = (cx + 0.5) * CELL + (entry.dx ?? 0);
  let z = (cz + 0.5) * CELL + (entry.dz ?? 0);
  let rotation = ((entry.rot ?? 0) * Math.PI) / 180;
  let side = null;
  if (def.wall) {
    side = entry.side ? SIDES[entry.side] : Object.values(SIDES).find((s) => isSolid(cx + s.dx, cz + s.dz));
    if (!side || !isSolid(cx + side.dx, cz + side.dz)) return null;
    const shift = CELL / 2 - def.d / 2 - WALL_GAP;
    x = (cx + 0.5) * CELL + side.dx * shift + (side.dz ? (entry.dx ?? 0) : 0);
    z = (cz + 0.5) * CELL + side.dz * shift + (side.dx ? (entry.dz ?? 0) : 0);
    rotation = side.rotation;
  }
  // The footprint's bounding box after turning.
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  const halfX = (def.w * c + def.d * s) / 2;
  const halfZ = (def.w * s + def.d * c) / 2;
  const box = { minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ };
  return {
    id: `prop-${entry.type}-${cx}-${cz}`,
    type: entry.type,
    cell: { x: cx, z: cz },
    x,
    z,
    rotation,
    def,
    box,
    solid: def.solid,
  };
}

// True if a square of half-size r at (x, z) overlaps any solid prop.
export function hitsProp(props, x, z, r) {
  for (const p of props) {
    if (!p.solid) continue;
    const b = p.box;
    if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) return true;
  }
  return false;
}
