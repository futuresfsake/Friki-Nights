import { randomBytes, randomInt } from 'node:crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '../../shared/events.js';

// All rooms live in memory (no database). A player's `id` is public (sent to the
// room); their `token` is secret and only ever sent to that player, to rejoin with.
export function createRooms({ random = randomInt } = {}) {
  const rooms = new Map();
  // Codes are never handed out twice, so an old code can't lead into a new room.
  const used = new Set();

  function newCode() {
    for (;;) {
      let code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += ROOM_CODE_ALPHABET[random(ROOM_CODE_ALPHABET.length)];
      if (!used.has(code)) {
        used.add(code);
        return code;
      }
    }
  }

  return {
    create(name) {
      const room = { code: newCode(), hostId: null, phase: 'lobby', players: [] };
      const player = addPlayer(room, name);
      room.hostId = player.id;
      rooms.set(room.code, room);
      return { room, player };
    },
    get: (code) => rooms.get(code) ?? null,
    remove: (code) => rooms.delete(code),
    get size() {
      return rooms.size;
    },
  };
}

export function addPlayer(room, name) {
  const player = {
    id: randomBytes(4).toString('hex'),
    token: randomBytes(16).toString('hex'),
    name,
    connected: true,
  };
  room.players.push(player);
  return player;
}

// Removes a player; the next one in join order becomes host if the host left.
export function removePlayer(room, playerId) {
  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.hostId === playerId) room.hostId = room.players[0]?.id ?? null;
}

// What every player in the room may see: never tokens.
export function roomView(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players: room.players.map((p) => ({ id: p.id, name: p.name, connected: p.connected })),
  };
}
