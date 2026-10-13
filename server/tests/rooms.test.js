import { afterEach, describe, expect, it } from 'vitest';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '../../shared/events.js';
import { createRooms } from '../src/rooms.js';
import { once, request, startServer } from './helpers.js';

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

  it('deletes the room when its only player leaves', async () => {
    server = await startServer();
    const socket = server.client();
    await request(socket, 'room:create', { name: 'A' });
    expect(server.game.rooms.size).toBe(1);
    socket.disconnect();
    await new Promise((r) => setTimeout(r, 50));
    expect(server.game.rooms.size).toBe(0);
  });
});
