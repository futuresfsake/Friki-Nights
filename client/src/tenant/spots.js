import { CELL } from '../../../shared/constants.js';
import { cellAt, cellCenter, isSolid } from '../../../shared/mapParser.js';
import { hitsProp } from '../../../shared/props.js';
import { angleOff, hasLineOfSight } from '../../../shared/sight.js';

const BODY = 0.3; // he needs this much room to stand (no standing inside a wardrobe)
const inProp = (map, x, z) => hitsProp(map.props ?? [], x, z, BODY);

// Where the Tenant can stand. Pure functions of the map, so they're testable.
// from: the player's { x, z }; yaw: where they look; blocked(cx, cz): closed doors.

// A random floor cell between minDist and maxDist metres away, between minAngle and
// maxAngle radians off the player's view, that the player could see from where they are.
// null if there's no such cell.
export function findSpot(map, from, yaw, { minDist, maxDist, minAngle = 0, maxAngle = Math.PI, sight = true }, { random = Math.random, blocked = () => false } = {}) {
  const here = cellAt(from.x, from.z);
  const reach = Math.ceil(maxDist / CELL);
  const found = [];
  for (let cz = here.cz - reach; cz <= here.cz + reach; cz++) {
    for (let cx = here.cx - reach; cx <= here.cx + reach; cx++) {
      if (isSolid(map, cx, cz) || blocked(cx, cz)) continue;
      const c = cellCenter(cx, cz);
      if (inProp(map, c.x, c.z)) continue;
      const d = Math.hypot(c.x - from.x, c.z - from.z);
      if (d < minDist || d > maxDist) continue;
      const a = angleOff(from.x, from.z, yaw, c.x, c.z);
      if (a < minAngle || a > maxAngle) continue;
      if (sight && !hasLineOfSight(map, from.x, from.z, c.x, c.z, blocked)) continue;
      found.push(c);
    }
  }
  return found.length ? found[Math.floor(random() * found.length)] : null;
}

// The point `distance` metres from the player in direction `yaw + turn` (turn = π is
// straight behind), pulled closer until nothing solid is in the way: { x, z, distance }.
// null if even 0.5 m is a wall.
export function spotToward(map, from, yaw, turn, distance, blocked = () => false) {
  const dirX = -Math.sin(yaw + turn);
  const dirZ = -Math.cos(yaw + turn);
  for (let d = distance; d >= 0.5; d -= 0.25) {
    const x = from.x + dirX * d;
    const z = from.z + dirZ * d;
    const { cx, cz } = cellAt(x, z);
    if (isSolid(map, cx, cz) || blocked(cx, cz) || inProp(map, x, z)) continue;
    if (hasLineOfSight(map, from.x, from.z, x, z, blocked)) return { x, z, distance: d };
  }
  return null;
}

// For walking across a doorway: a start and end point either side of `spot`, square
// to the player's line of sight, both on open floor. null if there's no room.
export function crossingPath(map, from, spot, halfWidth = 1.8, blocked = () => false) {
  const dx = spot.x - from.x;
  const dz = spot.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  const px = -dz / len;
  const pz = dx / len;
  for (const w of [halfWidth, halfWidth * 0.6]) {
    const a = { x: spot.x - px * w, z: spot.z - pz * w };
    const b = { x: spot.x + px * w, z: spot.z + pz * w };
    const open = (p) => {
      const { cx, cz } = cellAt(p.x, p.z);
      return !isSolid(map, cx, cz) && !blocked(cx, cz) && !inProp(map, p.x, p.z);
    };
    if (open(a) && open(b) && hasLineOfSight(map, a.x, a.z, b.x, b.z, blocked)) return { from: a, to: b };
  }
  return null;
}
