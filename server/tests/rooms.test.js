import { afterEach, describe, expect, it } from 'vitest';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '../../shared/events.js';
import { createRooms, markIdle, ROOM_EXPIRY_MS } from '../src/rooms.js';
import { once, request, startServer, waitFor } from './helpers.js';

let server;
afterEach(() => server?.stop());

describe('room codes', () => {
  it('are 6 characters from the 32-character alphabet without 0/O or 1/I', () => {
    expect(ROOM_CODE_ALPHABET).toHaveLength(32);
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[01OI]/);
    const rooms = createRooms();
    for (let i = 0; i < 50; i++) {
      const { room } = rooms.create('A');
      expect(room.code).toMatch(new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`));
    }
  });

  it('are never handed out twice', () => {
    // A random source that repeats itself: the second room must still get a new code.
    const sequence = [...Array(6).fill(0), ...Array(6).fill(0), ...Array(6).fill(1)];
    const rooms = createRooms({ random: () => sequence.shift() });
    const a = rooms.create('A').room.code;
    const b = rooms.create('B').room.code;
    expect(a).toBe('AAAAAA');
    expect(b).toBe('BBBBBB');
  });
});

describe('room:create', () => {
  it('returns a code, makes the creator host, and gives them a secret token', async () => {
    server = await startServer();
    const socket = server.client();
    const update = once(socket, 'room:update');
    const res = await request(socket, 'room:create', { name: '  Chelsea\n' });
    expect(res.code).toHaveLength(6);
    expect(res.playerToken).toMatch(/^[0-9a-f]{32}$/);
    const view = await update;
    expect(view.code).toBe(res.code);
    expect(view.hostId).toBe(res.playerId);
    expect(view.players).toEqual([{ id: res.playerId, name: 'Chelsea', connected: true, ready: false }]);
    expect(JSON.stringify(view)).not.toContain(res.playerToken);
  });

  it('refuses a bad payload, an empty name, and a second room for the same socket', async () => {
    server = await startServer();
    const socket = server.client();
    expect(await request(socket, 'room:create', { name: 42 })).toEqual({ error: 'bad-request' });
    expect(await request(socket, 'room:create', { name: '\u0000 ' })).toEqual({ error: 'bad-name' });
    expect((await request(socket, 'room:create', { name: 'A' })).code).toBeTruthy();
    expect(await request(socket, 'room:create', { name: 'A' })).toEqual({ error: 'already-in-room' });
  });

  it('deletes an empty room 5 minutes after its last player leaves, never reusing the code', async () => {
    let t = 0;
    server = await startServer({ now: () => t });
    const socket = server.client();
    const { code } = await request(socket, 'room:create', { name: 'A' });
    socket.disconnect();
    await new Promise((r) => setTimeout(r, 50));
    // Still there, but nobody can join a room everyone left.
    expect(server.game.rooms.size).toBe(1);
    expect(await request(server.client(), 'room:join', { code, name: 'B' })).toEqual({ error: 'room:notfound' });
    t = ROOM_EXPIRY_MS - 1;
    server.game.sweep();
    expect(server.game.rooms.size).toBe(1);
    t = ROOM_EXPIRY_MS;
    server.game.sweep();
    expect(server.game.rooms.size).toBe(0);
  });

  it('keeps a room alive while anyone is still connected', () => {
    const rooms = createRooms();
    const { room } = rooms.create('A');
    rooms.join(room.code, 'B');
    room.players[0].connected = false;
    markIdle(room, 0);
    expect(rooms.sweep(ROOM_EXPIRY_MS * 10)).toEqual([]);
    room.players[1].connected = false;
    markIdle(room, 1000);
    expect(rooms.sweep(1000 + ROOM_EXPIRY_MS)).toEqual([room.code]);
  });

  it('keeps a seat (disconnected) for a player who drops during the night', async () => {
    server = await startServer();
    const a = server.client();
    const b = server.client();
    const { code } = await request(a, 'room:create', { name: 'A' });
    await request(b, 'room:join', { code, name: 'B' });
    for (const s of [a, b]) await request(s, 'player:ready', { ready: true, codeWordHash: 'c'.repeat(64) });
    await request(a, 'night:begin', {});
    const update = waitFor(a, 'room:update', (v) => v.players.some((p) => !p.connected));
    b.disconnect();
    const view = await update;
    expect(view.players).toHaveLength(2);
    expect(view.players[1]).toMatchObject({ name: 'B', connected: false });
  });
});
