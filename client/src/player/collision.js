import { CELL } from '../constants.js';
import { isSolid } from '../world/map.js';

// Treats the player as a square of half-size r: cheap and good enough on a grid.
export function blocked(map, x, z, r) {
  const minX = Math.floor((x - r) / CELL);
  const maxX = Math.floor((x + r) / CELL);
  const minZ = Math.floor((z - r) / CELL);
  const maxZ = Math.floor((z + r) / CELL);
  for (let cz = minZ; cz <= maxZ; cz++) {
    for (let cx = minX; cx <= maxX; cx++) {
      if (isSolid(map, cx, cz)) return true;
    }
  }
  return false;
}

// Each axis is tried separately, so walking diagonally into a wall slides along it.
export function moveWithCollision(map, pos, dx, dz, r) {
  let { x, z } = pos;
  if (!blocked(map, x + dx, z, r)) x += dx;
  if (!blocked(map, x, z + dz, r)) z += dz;
  return { x, z };
}
