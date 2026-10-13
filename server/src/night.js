import { randomInt } from 'node:crypto';
import { EYE_HEIGHT } from '../../shared/constants.js';
import { cellCenter, parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { addPlayer, createNightState } from '../../shared/nightState.js';

// Nights the server can run, parsed once from the same files the client uses.
const MAPS = new Map([night1].map((def) => [def.id, parseMap(def)]));

export const FIRST_NIGHT = 'night1';

export function hasNight(id) {
  return MAPS.has(id);
}

// The authoritative night for one room. Players take the map's P spawns in join order.
export function startNight(room, { nightId = FIRST_NIGHT, seed = randomInt(2 ** 31) } = {}) {
  const map = MAPS.get(nightId);
  const state = createNightState(map, { playerCount: room.players.length });
  const players = new Map();
  room.players.forEach((p, slot) => {
    addPlayer(state, p.id);
    const spawn = cellCenter(map.spawns[slot].x, map.spawns[slot].z);
    players.set(p.id, { slot, x: spawn.x, z: spawn.z, y: EYE_HEIGHT, yaw: 0, pitch: 0 });
  });
  return { id: nightId, map, state, seed, players };
}

// Sent to everyone when the night starts (and to a player who rejoins it).
export function nightStartView(room) {
  const { night } = room;
  return {
    night: night.id,
    seed: night.seed,
    playerCount: room.players.length,
    players: room.players.map((p) => {
      const at = night.players.get(p.id);
      return { id: p.id, name: p.name, slot: at.slot, x: at.x, z: at.z, yaw: at.yaw };
    }),
  };
}
