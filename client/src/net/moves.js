import { MOVE_RATE } from '../../../shared/events.js';

const HEARTBEAT_MS = 1000; // even standing still, say where we are now and then

// Decides when to send our position: at most MOVE_RATE times a second, and only when
// something changed (or the heartbeat is due). Movement itself is never delayed.
export function createMoveSender(send, { now = () => performance.now() } = {}) {
  let lastAt = -Infinity;
  let last = null;

  return {
    update({ x, z, yaw, pitch, light }) {
      const t = now();
      if (t - lastAt < 1000 / MOVE_RATE) return false;
      const changed =
        !last ||
        light !== last.light ||
        Math.abs(x - last.x) > 0.01 ||
        Math.abs(z - last.z) > 0.01 ||
        Math.abs(yaw - last.yaw) > 0.01 ||
        Math.abs(pitch - last.pitch) > 0.01;
      if (!changed && t - lastAt < HEARTBEAT_MS) return false;
      last = { x, z, yaw, pitch, light };
      lastAt = t;
      send({ x, z, yaw, pitch, light, t: Math.round(t) });
      return true;
    },
  };
}
