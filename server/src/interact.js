import { CELL, INTERACT_DISTANCE, PLAYER_RADIUS } from '../../shared/constants.js';
import { apply } from '../../shared/nightState.js';

// How far from an object's cell centre a player may stand and still use it. The
// crosshair reaches INTERACT_DISTANCE to the object's surface, which can be most of a
// cell away from its centre (a fuse box on the wall, a door panel), so allow that.
export const REACH = INTERACT_DISTANCE + CELL * 0.75;
// Scripted slams are fired by the client that stepped on the trigger, near the door.
export const SLAM_REACH = 8;

// One player's "use" on the authoritative night. Returns the events to broadcast to the
// room; a refusal comes back as a single 'denied' event for that player only.
export function interact(night, playerId, targetId) {
  const at = night.players.get(playerId);
  const obj = night.map.objects.find((o) => o.id === targetId);
  if (!at || !obj) return { denied: deny(playerId, 'unknown-target', targetId) };
  // Crawling out from under a bed always works, from wherever the camera ended up.
  const crawlingOut = night.state.players[playerId]?.hidingIn === targetId;
  if (!crawlingOut && distanceTo(at, obj) > REACH) return { denied: deny(playerId, 'too-far', targetId) };
  // Never close a door on someone standing in the doorway.
  const door = night.state.doors[targetId];
  if (door?.open && [...night.players.values()].some((p) => inCell(p, obj))) {
    return { denied: deny(playerId, 'doorway-blocked', targetId) };
  }
  return split(apply(night.state, { type: 'interact', playerId, targetId }));
}

// A scripted scare (JS-02) slams a door: everyone sees it shut.
export function slamDoor(night, playerId, targetId) {
  const at = night.players.get(playerId);
  const obj = night.map.objects.find((o) => o.id === targetId && o.type === 'door');
  if (!at || !obj || distanceTo(at, obj) > SLAM_REACH) return { events: [] };
  if ([...night.players.values()].some((p) => inCell(p, obj))) return { events: [] };
  return split(apply(night.state, { type: 'slam-door', playerId, targetId }));
}

function split(events) {
  const denied = events.find((e) => e.type === 'denied');
  return denied ? { denied } : { events };
}

function deny(playerId, reason, targetId) {
  return { playerId, type: 'denied', reason, targetId };
}

function distanceTo(at, obj) {
  return Math.hypot(at.x - (obj.x + 0.5) * CELL, at.z - (obj.z + 0.5) * CELL);
}

function inCell(p, obj) {
  const r = PLAYER_RADIUS;
  return (
    Math.floor((p.x - r) / CELL) <= obj.x &&
    Math.floor((p.x + r) / CELL) >= obj.x &&
    Math.floor((p.z - r) / CELL) <= obj.z &&
    Math.floor((p.z + r) / CELL) >= obj.z
  );
}
