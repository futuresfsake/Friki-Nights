import { afterEach, describe, expect, it } from 'vitest';
import { MAX_PLAYERS } from '../../shared/constants.js';
import { JOINS_PER_MINUTE } from '../src/game.js';
import { once, request, startServer } from './helpers.js';

let server;
afterEach(() => server?.stop());

async function createRoom(name = 'Host') {
  const socket = server.client();
  const res = await request(socket, 'room:create', { name });
  return { socket, ...res };
}

describe('room:join', () => {
  it('joins by code (any case, stray spaces) and everyone sees everyone', async () => {
    server = await startServer();
    const host = await createRoom('Chelsea');
    const guest = server.client();
    const hostSees = once(host.socket, 'room:update');
    const res = await request(guest, 'room:join', { code: ` ${host.code.toLowerCase()} `, name: 'Marco' });
    expect(res.code).toBe(host.code);
    expect(res.playerToken).toMatch(/^[0-9a-f]{32}$/);
    const view = await hostSees;
    expect(view.players.map((p) => p.name)).toEqual(['Chelsea', 'Marco']);
    expect(view.hostId).toBe(host.playerId);
  });

  it(`gives the ${MAX_PLAYERS + 1}th player room:full`, async () => {
    server = await startServer();
    const host = await createRoom();
    for (let i = 1; i < MAX_PLAYERS; i++) {
      expect((await request(server.client(), 'room:join', { code: host.code, name: `P${i}` })).code).toBe(host.code);
    }
    expect(await request(server.client(), 'room:join', { code: host.code, name: 'Fifth' })).toEqual({ error: 'room:full' });
  });

  it('gives a wrong or malformed code room:notfound', async () => {
    server = await startServer();
    await createRoom();
    const socket = server.client();
    expect(await request(socket, 'room:join', { code: 'ZZZZZZ', name: 'A' })).toEqual({ error: 'room:notfound' });
    expect(await request(socket, 'room:join', { code: 'O0I1!', name: 'A' })).toEqual({ error: 'room:notfound' });
  });

  it(`limits join attempts to ${JOINS_PER_MINUTE} a minute per IP`, async () => {
    let t = 0;
    server = await startServer({ now: () => t });
    const host = await createRoom();
    const socket = server.client();
    for (let i = 0; i < JOINS_PER_MINUTE; i++) {
      expect(await request(socket, 'room:join', { code: 'ZZZZZZ', name: 'A' })).toEqual({ error: 'room:notfound' });
    }
    // Even the right code waits now.
    expect(await request(socket, 'room:join', { code: host.code, name: 'A' })).toEqual({ error: 'too-many-attempts' });
    t += 61_000;
    expect((await request(socket, 'room:join', { code: host.code, name: 'A' })).code).toBe(host.code);
  });

  it('passes host to the next player when the host leaves', async () => {
    server = await startServer();
    const host = await createRoom();
    const guest = server.client();
    const res = await request(guest, 'room:join', { code: host.code, name: 'Guest' });
    const update = once(guest, 'room:update');
    host.socket.disconnect();
    const view = await update;
    expect(view.hostId).toBe(res.playerId);
    expect(view.players).toHaveLength(1);
  });
});
