import { afterEach, describe, expect, it } from 'vitest';
import { cellCenter } from '../../shared/mapParser.js';
import { request, startServer, waitFor } from './helpers.js';

let server;
afterEach(() => server?.stop());

// Two players in a started night; place(player, cx, cz) moves them on the server.
async function playing() {
  server = await startServer();
  const a = server.client();
  const b = server.client();
  const { code, playerId: aId } = await request(a, 'room:create', { name: 'A' });
  const { playerId: bId } = await request(b, 'room:join', { code, name: 'B' });
  for (const s of [a, b]) await request(s, 'player:ready', { ready: true, codeWordHash: 'c'.repeat(64) });
  const started = waitFor(b, 'night:start');
  await request(a, 'night:begin', {});
  await started;
  const night = server.game.rooms.get(code).night;
  const place = (id, cx, cz, dx = 0, dz = 0) => {
    const c = cellCenter(cx, cz);
    Object.assign(night.players.get(id), { x: c.x + dx, z: c.z + dz });
  };
  return { a, b, aId, bId, night, place };
}

// Collects every world:update a socket receives for `ms`.
function collect(socket, ms = 150) {
  const got = [];
  const on = ({ events }) => got.push(...events);
  socket.on('world:update', on);
  return new Promise((resolve) => setTimeout(() => (socket.off('world:update', on), resolve(got)), ms));
}

describe('server-authoritative interactions', () => {
  it('opens a door for everyone, saying who did it', async () => {
    const { a, b, aId, place } = await playing();
    place(aId, 13, 7); // just north of the foyer → hall door (door-13-8)
    const seen = waitFor(b, 'world:update');
    a.emit('interact', { targetId: 'door-13-8' });
    expect((await seen).events).toEqual([{ playerId: aId, type: 'door-opened', targetId: 'door-13-8' }]);
  });

  it('refuses things out of reach, and only tells the player who tried', async () => {
    const { a, b, aId, place } = await playing();
    place(aId, 13, 4);
    const toA = collect(a);
    const toB = collect(b);
    a.emit('interact', { targetId: 'door-13-8' });
    expect(await toA).toEqual([{ playerId: aId, type: 'denied', reason: 'too-far', targetId: 'door-13-8' }]);
    expect(await toB).toEqual([]);
  });

  it('gives a key to exactly one of two players who grab it within 50 ms', async () => {
    const { a, b, aId, bId, night, place } = await playing();
    place(aId, 2, 5);
    place(bId, 3, 6);
    const toA = collect(a, 250);
    a.emit('interact', { targetId: 'key-2-6' });
    await new Promise((r) => setTimeout(r, 20));
    b.emit('interact', { targetId: 'key-2-6' });
    const events = await toA;
    expect(events.filter((e) => e.type === 'item-taken')).toHaveLength(1);
    const owners = [aId, bId].filter((id) => night.state.players[id].keys.includes('parlor'));
    expect(owners).toHaveLength(1);
  });

  it('will not close a door on someone standing in the doorway', async () => {
    const { a, aId, bId, place } = await playing();
    place(aId, 13, 7);
    a.emit('interact', { targetId: 'door-13-8' });
    await waitFor(a, 'world:update');
    place(bId, 13, 8); // B steps into the doorway
    const reply = waitFor(a, 'world:update');
    a.emit('interact', { targetId: 'door-13-8' });
    expect((await reply).events[0]).toMatchObject({ type: 'denied', reason: 'doorway-blocked' });
  });

  it('slams a door for everyone when a scare asks, but not on someone in the doorway', async () => {
    const { a, b, aId, bId, place } = await playing();
    place(aId, 13, 7);
    a.emit('interact', { targetId: 'door-13-8' });
    await waitFor(b, 'world:update');
    place(bId, 13, 8);
    const blocked = collect(b);
    a.emit('door:slam', { targetId: 'door-13-8' });
    expect(await blocked).toEqual([]);
    place(bId, 13, 9);
    const slam = waitFor(b, 'world:update');
    a.emit('door:slam', { targetId: 'door-13-8' });
    expect((await slam).events).toEqual([{ playerId: aId, type: 'door-slammed', targetId: 'door-13-8' }]);
  });

  it('ignores nonsense targets and malformed payloads', async () => {
    const { a, aId, place } = await playing();
    place(aId, 13, 7);
    const toA = collect(a);
    a.emit('interact', { targetId: '<script>' });
    a.emit('interact', { targetId: 'door-13-8', extra: 1 });
    a.emit('interact', { targetId: 'door-99-99' });
    expect(await toA).toEqual([{ playerId: aId, type: 'denied', reason: 'unknown-target', targetId: 'door-99-99' }]);
  });
});
