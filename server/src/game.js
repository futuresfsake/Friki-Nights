import { isRoomCode, schemas } from '../../shared/events.js';
import { cleanName } from '../../shared/names.js';
import { clientIp, createRateLimiter, createSocketRateLimiter } from './rateLimit.js';
import { atExit, interact, slamDoor } from './interact.js';
import { acceptMove } from './movement.js';
import { startNight, nightStartView } from './night.js';
import { scaresOnEvents, scaresOnMove } from './scares.js';
import { createRooms, everyoneReady, markIdle, REJOIN_TIMEOUT_MS, removePlayer, roomView } from './rooms.js';

// Room and game events for every connected socket. socket.data holds which room and
// player this socket is ({ code, playerId }) once it has created or joined one.
export const JOINS_PER_MINUTE = 5;
const SWEEP_MS = 30_000;

const SOCKET_RATE_LIMITS = {
  'room:create': { limit: 3, windowMs: 10_000 },
  'room:join': { limit: 5, windowMs: 60_000 },
  'player:ready': { limit: 10, windowMs: 10_000 },
  'night:begin': { limit: 3, windowMs: 10_000 },
  'player:move': { limit: 20, windowMs: 1_000 },
  interact: { limit: 10, windowMs: 2_000 },
  'door:slam': { limit: 5, windowMs: 5_000 },
  'exit:at': { limit: 10, windowMs: 5_000 },
};

export function attachGame(io, { rooms = createRooms(), now = Date.now } = {}) {
  // Every join attempt counts, right or wrong: this is what makes guessing codes slow.
  const joins = createRateLimiter({ limit: JOINS_PER_MINUTE, windowMs: 60_000, now });
  const socketLimiter = createSocketRateLimiter({ limits: SOCKET_RATE_LIMITS, now });
  const broadcastRoom = (room) => io.to(room.code).emit('room:update', roomView(room));
  // Each player's sockets also sit in a channel of their own, for things only they get.
  const playerChannel = (playerId) => `player:${playerId}`;

  function playScares(room, scares) {
    for (const { to, ...scare } of scares) io.to(to === 'all' ? room.code : playerChannel(to)).emit('scare:play', scare);
  }

  // World events go to everyone, and may set off event-triggered scares.
  function broadcastWorld(room, events) {
    io.to(room.code).emit('world:update', { events });
    playScares(room, scaresOnEvents(room.night, events));
  }

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
    socket.join(playerChannel(player.id));
  }

  const rejoinTimers = new Map();

  // In the lobby a player who leaves is gone. Once the night has started they keep
  // their seat (marked disconnected) so they can come back. Either way, a room with
  // nobody connected is swept away after ROOM_EXPIRY_MS.
  function leave(socket) {
    const { code, playerId } = socket.data;
    socket.data.code = socket.data.playerId = undefined;
    const room = rooms.get(code);
    if (!room) return;
    socket.leave(code);
    socket.leave(playerChannel(playerId));
    if (room.phase === 'lobby') removePlayer(room, playerId);
    else {
      const player = room.players.find((p) => p.id === playerId);
      if (player) player.connected = false;
      if (player && room.night?.atExit?.size) checkExit(room, playerId, false);
      // In multiplayer (not solo), pause for the others and start a rejoin countdown.
      const connected = room.players.filter((p) => p.connected);
      if (connected.length > 0 && room.players.length > 1) {
        room.paused = true;
        const name = player?.name ?? 'Someone';
        io.to(room.code).emit('night:paused', { reason: 'disconnect', name, timeoutMs: REJOIN_TIMEOUT_MS });
        const timer = setTimeout(() => {
          rejoinTimers.delete(code);
          room.paused = false;
          if (player) {
            removePlayer(room, playerId);
            io.to(room.code).emit('night:resumed', { reason: 'timeout', name });
            broadcastRoom(room);
          }
        }, REJOIN_TIMEOUT_MS);
        timer.unref?.();
        rejoinTimers.set(code, { timer, playerId });
      }
    }
    markIdle(room, now());
    if (room.idleSince === null) broadcastRoom(room);
  }

  // Everyone waiting at the exit hears who they're waiting for; when nobody is
  // missing, the night is complete for all.
  function checkExit(room, playerId, at) {
    const connected = room.players.filter((p) => p.connected).map((p) => p.id);
    const result = atExit(room.night, connected, playerId, at);
    if (result.complete) {
      broadcastWorld(room, result.complete);
      return;
    }
    const names = room.players.filter((p) => result.waitingFor.includes(p.id)).map((p) => p.name);
    io.to(room.code).emit('exit:waiting', { waiting: [...room.night.atExit], missing: names });
  }

  const sweeper = setInterval(() => rooms.sweep(now()), SWEEP_MS);
  sweeper.unref?.();

  io.on('connection', (socket) => {
    // Every event is validated and rate-limited first; a bad payload is ignored, never trusted.
    const handle = (event, fn) =>
      socket.on(event, (payload, ack) => {
        const reply = typeof ack === 'function' ? ack : () => {};
        if (!socketLimiter.allowed(socket.id, event)) return reply({ error: 'rate-limited' });
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

    handle('room:rejoin', ({ code, playerToken }, reply) => {
      if (socket.data.code) return reply({ error: 'already-in-room' });
      const result = rooms.rejoin(code, playerToken);
      if (result.error) return reply({ error: result.error });
      const { room, player } = result;
      enter(socket, room, player);
      reply({ code: room.code, playerId: player.id });
      // Cancel the rejoin timer and resume the night for everyone.
      const pending = rejoinTimers.get(code);
      if (pending?.playerId === player.id) {
        clearTimeout(pending.timer);
        rejoinTimers.delete(code);
      }
      room.paused = false;
      io.to(room.code).emit('night:resumed', { reason: 'rejoin', name: player.name });
      broadcastRoom(room);
      if (room.night) socket.emit('night:start', nightStartView(room));
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

    // Moves are checked and passed on to the others; an impossible one is answered
    // with where the server last saw the player.
    handle('player:move', (move) => {
      const { room, player } = seat(socket);
      if (room?.phase !== 'playing') return;
      const at = room.night.players.get(player.id);
      if (!acceptMove(room.night.map, at, move, now())) {
        socket.emit('player:correct', { x: at.x, z: at.z });
        return;
      }
      socket.to(room.code).emit('player:state', { id: player.id, ...move });
      playScares(room, scaresOnMove(room.night, player.id));
    });

    // Doors, items, notes, beds, the fuse box: the server decides, everyone sees the
    // result (world:update). A refusal only goes back to the player who asked.
    const worldAction = (fn) => ({ targetId }) => {
      const { room, player } = seat(socket);
      if (room?.phase !== 'playing') return;
      const { events, denied } = fn(room.night, player.id, targetId);
      if (denied) socket.emit('world:update', { events: [denied] });
      else if (events.length) broadcastWorld(room, events);
    };
    handle('interact', worldAction(interact));
    handle('door:slam', worldAction(slamDoor));

    handle('exit:at', ({ at }) => {
      const { room, player } = seat(socket);
      if (room?.phase !== 'playing') return;
      checkExit(room, player.id, at);
    });

    socket.on('disconnect', () => {
      leave(socket);
      socketLimiter.remove(socket.id);
    });
  });

  return { rooms, sweep: () => rooms.sweep(now()), stop: () => clearInterval(sweeper) };
}
