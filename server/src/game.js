import { isRoomCode, schemas } from '../../shared/events.js';
import { cleanName } from '../../shared/names.js';
import { clientIp, createRateLimiter } from './rateLimit.js';
import { startNight, nightStartView } from './night.js';
import { createRooms, everyoneReady, removePlayer, roomView } from './rooms.js';

// Room and game events for every connected socket. socket.data holds which room and
// player this socket is ({ code, playerId }) once it has created or joined one.
export const JOINS_PER_MINUTE = 5;

export function attachGame(io, { rooms = createRooms(), now = Date.now } = {}) {
  // Every join attempt counts, right or wrong: this is what makes guessing codes slow.
  const joins = createRateLimiter({ limit: JOINS_PER_MINUTE, windowMs: 60_000, now });
  const broadcastRoom = (room) => io.to(room.code).emit('room:update', roomView(room));

  // The room and player this socket sits in, or {} if none.
  function seat(socket) {
    const room = rooms.get(socket.data.code);
    const player = room?.players.find((p) => p.id === socket.data.playerId);
    return player ? { room, player } : {};
  }

  function enter(socket, room, player) {
    socket.data.code = room.code;
    socket.data.playerId = player.id;
    socket.join(room.code);
  }

  function leave(socket) {
    const { code, playerId } = socket.data;
    socket.data.code = socket.data.playerId = undefined;
    const room = rooms.get(code);
    if (!room) return;
    socket.leave(code);
    removePlayer(room, playerId);
    if (room.players.length === 0) rooms.remove(room.code);
    else broadcastRoom(room);
  }

  io.on('connection', (socket) => {
    // Every event is validated first; a bad payload is ignored, never trusted.
    const handle = (event, fn) =>
      socket.on(event, (payload, ack) => {
        const reply = typeof ack === 'function' ? ack : () => {};
        const parsed = schemas[event].safeParse(payload);
        if (!parsed.success) return reply({ error: 'bad-request' });
        try {
          fn(parsed.data, reply);
        } catch (err) {
          console.error(`Error handling ${event}:`, err);
        }
      });

    handle('room:create', ({ name }, reply) => {
      if (socket.data.code) return reply({ error: 'already-in-room' });
      const clean = cleanName(name);
      if (!clean) return reply({ error: 'bad-name' });
      const { room, player } = rooms.create(clean);
      enter(socket, room, player);
      reply({ code: room.code, playerId: player.id, playerToken: player.token });
      broadcastRoom(room);
    });

    handle('room:join', ({ code, name }, reply) => {
      if (socket.data.code) return reply({ error: 'already-in-room' });
      if (!joins.hit(clientIp(socket.handshake))) return reply({ error: 'too-many-attempts' });
      const clean = cleanName(name);
      if (!clean) return reply({ error: 'bad-name' });
      if (!isRoomCode(code)) return reply({ error: 'room:notfound' });
      const result = rooms.join(code, clean);
      if (result.error) return reply({ error: result.error });
      enter(socket, result.room, result.player);
      reply({ code, playerId: result.player.id, playerToken: result.player.token });
      broadcastRoom(result.room);
    });

    handle('player:ready', (payload, reply) => {
      const { room, player } = seat(socket);
      if (!player) return reply({ error: 'not-in-room' });
      if (room.phase !== 'lobby') return reply({ error: 'room:started' });
      player.ready = payload.ready;
      player.codeWordHash = payload.ready ? payload.codeWordHash : null;
      reply({ ok: true });
      broadcastRoom(room);
    });

    // Host only, once everyone (solo: just the host) is ready.
    handle('night:begin', (_payload, reply) => {
      const { room, player } = seat(socket);
      if (!player) return reply({ error: 'not-in-room' });
      if (room.hostId !== player.id) return reply({ error: 'not-host' });
      if (room.phase !== 'lobby') return reply({ error: 'room:started' });
      if (!everyoneReady(room)) return reply({ error: 'not-ready' });
      room.phase = 'playing';
      room.night = startNight(room);
      reply({ ok: true });
      io.to(room.code).emit('night:start', nightStartView(room));
      broadcastRoom(room);
    });

    socket.on('disconnect', () => leave(socket));
  });

  return { rooms };
}
