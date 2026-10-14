import { CELL } from './constants.js';
import { cellAt, isSolid } from './mapParser.js';

// Can a straight line from (ax, az) to (bx, bz) cross the map without touching a wall?
// Walks every grid cell the line passes through (Amanatides–Woo), so it never skips a
// corner. extraSolid(cx, cz) adds things like closed doors.
export function hasLineOfSight(map, ax, az, bx, bz, extraSolid = () => false) {
  let { cx, cz } = cellAt(ax, az);
  const end = cellAt(bx, bz);
  const dx = bx - ax;
  const dz = bz - az;
  const stepX = Math.sign(dx);
  const stepZ = Math.sign(dz);
  // Distance along the line (as a fraction of it) to the next vertical / horizontal grid line.
  const nextX = stepX > 0 ? (cx + 1) * CELL : cx * CELL;
  const nextZ = stepZ > 0 ? (cz + 1) * CELL : cz * CELL;
  let tMaxX = dx ? (nextX - ax) / dx : Infinity;
  let tMaxZ = dz ? (nextZ - az) / dz : Infinity;
  const tDeltaX = dx ? CELL / Math.abs(dx) : Infinity;
  const tDeltaZ = dz ? CELL / Math.abs(dz) : Infinity;

  while (cx !== end.cx || cz !== end.cz) {
    if (Math.min(tMaxX, tMaxZ) > 1) break; // rounding: the line already ended
    if (tMaxX < tMaxZ) {
      cx += stepX;
      tMaxX += tDeltaX;
    } else {
      cz += stepZ;
      tMaxZ += tDeltaZ;
    }
    if (isSolid(map, cx, cz) || extraSolid(cx, cz)) return false;
  }
  return true;
}

// Angle (radians, 0…π) between where someone looks (yaw, camera convention: forward is
// (-sin yaw, -cos yaw)) and the direction to a point.
export function angleOff(fromX, fromZ, yaw, toX, toZ) {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const len = Math.hypot(dx, dz);
  if (len === 0) return 0;
  const dot = (-Math.sin(yaw) * dx - Math.cos(yaw) * dz) / len;
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}
