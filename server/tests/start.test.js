import { afterEach, describe, expect, it } from 'vitest';
import { cellCenter, parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { once, request, startServer } from './helpers.js';

let server;
afterEach(() => server?.stop());

const HASH = 'b'.repeat(64);
const ready = (socket) => request(socket, 'player:ready', { ready: true, codeWordHash: HASH });

async function room(names) {
  const sockets = names.map(() => server.client());
  const { code } = await request(sockets[0], 'room:create', { name: names[0] });
  for (let i = 1; i < names.length; i++) await request(sockets[i], 'room:join', { code, name: names[i] });
  return { code, sockets };
}

describe('night:begin', () => {
  it('starts the night for everyone with the same seed, players in join-order spawns', async () => {
    server = await startServer();
    const { sockets } = await room(['Host', 'Guest']);
    for (const s of sockets) await ready(s);
    const starts = sockets.map((s) => once(s, 'night:start'));
    expect(await request(sockets[0], 'night:begin', {})).toEqual({ ok: true });
    const [a, b] = await Promise.all(starts);
    expect(a).toEqual(b);
    expect(a.night).toBe('night1');
    expect(a.playerCount).toBe(2);
    const spawns = parseMap(night1).spawns;
    a.players.forEach((p, i) => {
      expect(p.slot).toBe(i);
      expect({ x: p.x, z: p.z }).toEqual(cellCenter(spawns[i].x, spawns[i].z));
    });
    expect(a.players.map((p) => p.name)).toEqual(['Host', 'Guest']);
  });

  it('only lets the host start, and only once everyone is ready', async () => {
    server = await startServer();
    const { sockets } = await room(['Host', 'Guest']);
    await ready(sockets[0]);
    expect(await request(sockets[0], 'night:begin', {})).toEqual({ error: 'not-ready' });
    await ready(sockets[1]);
    expect(await request(sockets[1], 'night:begin', {})).toEqual({ error: 'not-host' });
    expect(await request(sockets[0], 'night:begin', {})).toEqual({ ok: true });
    expect(await request(sockets[0], 'night:begin', {})).toEqual({ error: 'room:started' });
  });

  it('lets a solo host start alone; nobody can join a started night', async () => {
    server = await startServer();
    const { code, sockets } = await room(['Solo']);
    await ready(sockets[0]);
    expect(await request(sockets[0], 'night:begin', {})).toEqual({ ok: true });
    expect(await request(server.client(), 'room:join', { code, name: 'Late' })).toEqual({ error: 'room:started' });
  });
});
