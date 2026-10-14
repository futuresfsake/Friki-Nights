import { cellAt } from '../../shared/mapParser.js';
import { createTriggers, enterCell, onEvent, stateCheck, targetOf } from '../../shared/triggers.js';

// Scripted scares run on the server (M3-S12), so a `once` scare really happens once
// per room, and a 'self' scare reaches only the player who set it off: the others
// don't see it, and end up asking "did you see that?!".
//
// Each function returns what to send as `scare:play`:
//   [{ to: playerId | 'all', triggerId, playerId }]
// The client looks the trigger's params up by id in its own copy of the map.

export function createNightTriggers(map, state) {
  return createTriggers(map, { check: stateCheck(state) });
}

// After an accepted move: did the player step onto a trigger tile?
export function scaresOnMove(night, playerId) {
  const at = night.players.get(playerId);
  const { cx, cz } = cellAt(at.x, at.z);
  return enterCell(night.triggers, playerId, cx, cz).map((t) => play(t, playerId));
}

// After world events (a key taken, a door opened, ...): any event triggers?
export function scaresOnEvents(night, events) {
  return events.flatMap((event) => onEvent(night.triggers, event).map((t) => play(t, event.playerId)));
}

function play(trigger, playerId) {
  return { to: targetOf(trigger) === 'all' ? 'all' : playerId, triggerId: trigger.id, playerId };
}
