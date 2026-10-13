import { afterEach, describe, expect, it } from 'vitest';
import { request, startServer, waitFor } from './helpers.js';

let server;
afterEach(() => server?.stop());

const HASH = 'a'.repeat(64);

describe('player:ready', () => {
  it('shows every player ready status but never the code word hash', async () => {
    server = await startServer();
    const host = server.client();
    const { code } = await request(host, 'room:create', { name: 'Host' });
    const guest = server.client();
    await request(guest, 'room:join', { code, name: 'Guest' });

    const update = waitFor(host, 'room:update', (v) => v.players[1]?.ready);
    expect(await request(guest, 'player:ready', { ready: true, codeWordHash: HASH })).toEqual({ ok: true });
    const view = await update;
    expect(view.players.map((p) => p.ready)).toEqual([false, true]);
    expect(JSON.stringify(view)).not.toContain(HASH);
    expect(server.game.rooms.get(code).players[1].codeWordHash).toBe(HASH);

    await request(guest, 'player:ready', { ready: false });
    expect(server.game.rooms.get(code).players[1]).toMatchObject({ ready: false, codeWordHash: null });
  });

  it('refuses a plain-text code word and players outside a room', async () => {
    server = await startServer();
    const socket = server.client();
    expect(await request(socket, 'player:ready', { ready: true, codeWordHash: HASH })).toEqual({ error: 'not-in-room' });
    await request(socket, 'room:create', { name: 'Host' });
    expect(await request(socket, 'player:ready', { ready: true, codeWordHash: 'moonlight' })).toEqual({ error: 'bad-request' });
    expect(await request(socket, 'player:ready', { ready: true })).toEqual({ error: 'bad-request' });
  });
});
