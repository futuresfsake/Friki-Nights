import { RUN_SPEED } from '../../shared/constants.js';
import { cellAt, isSolid } from '../../shared/mapParser.js';

export const MAX_SPEED = RUN_SPEED * 1.1; // run speed + 10%
// Moves arrive in bunches over a real network, so instead of checking each gap we keep
// a distance budget that refills at MAX_SPEED and can bank at most this much time.
export const BURST_SECONDS = 0.5;

// Checks one player:move against the player's last accepted position. Returns true and
// stores the new position if it's possible; false means "send a correction".
export function acceptMove(map, at, move, now) {
  const elapsed = at.movedAt === undefined ? BURST_SECONDS : (now - at.movedAt) / 1000;
  at.movedAt = now;
  at.budget = Math.min(MAX_SPEED * BURST_SECONDS, (at.budget ?? 0) + MAX_SPEED * Math.max(0, elapsed));
  const distance = Math.hypot(move.x - at.x, move.z - at.z);
  const { cx, cz } = cellAt(move.x, move.z);
  if (distance > at.budget || isSolid(map, cx, cz)) return false;
  at.budget -= distance;
  Object.assign(at, { x: move.x, z: move.z, yaw: move.yaw, pitch: move.pitch });
  return true;
}
