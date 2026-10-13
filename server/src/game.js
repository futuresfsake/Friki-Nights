import { schemas } from '../../shared/events.js';
import { cleanName } from '../../shared/names.js';
import { createRooms, removePlayer, roomView } from './rooms.js';

// Room and game events for every connected socket. socket.data holds which room and
// player this socket is ({ code, playerId }) once it has created or joined one.
export function attachGame(io, { rooms = createRooms() } = {}) {
  const broadcastRoom = (room) => io.to(room.code).emit('room:update', roomView(room));

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

    socket.on('disconnect', () => leave(socket));
  });

  return { rooms };
}
