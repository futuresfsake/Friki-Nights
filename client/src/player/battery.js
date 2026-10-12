import { BATTERY_DRAIN_PER_SECOND, BATTERY_MAX } from '../../../shared/constants.js';

export function drainBattery(level, on, dt) {
  if (!on) return level;
  return Math.max(0, level - BATTERY_DRAIN_PER_SECOND * dt);
}

// Used by battery pickups in M2.
export function addBattery(level, amount) {
  return Math.min(BATTERY_MAX, level + amount);
}
