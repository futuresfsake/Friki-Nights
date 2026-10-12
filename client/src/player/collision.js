import { CELL } from '../../../shared/constants.js';
import { isSolid } from '../../../shared/mapParser.js';

// Treats the player as a square of half-size r: cheap and good enough on a grid.
// extraSolid(cx, cz) lets moving things like closed doors block cells too.
export function blocked(map, x, z, r, extraSolid = noExtra) {
  const minX = Math.floor((x - r) / CELL);
  const maxX = Math.floor((x + r) / CELL);
  const minZ = Math.floor((z - r) / CELL);
  const maxZ = Math.floor((z + r) / CELL);
  for (let cz = minZ; cz <= maxZ; cz++) {
    for (let cx = minX; cx <= maxX; cx++) {
      if (isSolid(map, cx, cz) || extraSolid(cx, cz)) return true;
    }
  }
  return false;
}

// Each axis is tried separately, so walking diagonally into a wall slides along it.
export function moveWithCollision(map, pos, dx, dz, r, extraSolid = noExtra) {
  let { x, z } = pos;
  if (!blocked(map, x + dx, z, r, extraSolid)) x += dx;
  if (!blocked(map, x, z + dz, r, extraSolid)) z += dz;
  return { x, z };
}

// True if a player standing at (x, z) overlaps cell (cx, cz); stops a door
// from closing on someone.
export function overlapsCell(x, z, r, cx, cz) {
  return (
    Math.floor((x - r) / CELL) <= cx &&
    Math.floor((x + r) / CELL) >= cx &&
    Math.floor((z - r) / CELL) <= cz &&
    Math.floor((z + r) / CELL) >= cz
  );
}

function noExtra() {
  return false;
}
