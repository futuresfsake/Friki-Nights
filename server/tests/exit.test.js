import { afterEach, describe, expect, it } from 'vitest';
import { cellCenter } from '../../shared/mapParser.js';
import { request, startServer, waitFor } from './helpers.js';

let server;
afterEach(() => server?.stop());

// A started night with `count` players; the exit's power is already on.
async function playing(count) {
  server = await startServer();
  const sockets = [];
  const ids = [];
  let code;
  for (let i = 0; i < count; i++) {
    const s = server.client();
    const res = i === 0 ? await request(s, 'room:create', { name: 'A' }) : await request(s, 'room:join', { code, name: 'ABCD'[i] });
    code = res.code;
    sockets.push(s);
    ids.push(res.playerId);
  }
  for (const s of sockets) await request(s, 'player:ready', { ready: true, codeWordHash: 'c'.repeat(64) });
  const started = waitFor(sockets[0], 'night:start');
  await request(sockets[0], 'night:begin', {});
  await started;
  const night = server.game.rooms.get(code).night;
  Object.assign(night.state, { power: true, exitOpen: true });
  const place = (i, cx, cz) => Object.assign(night.players.get(ids[i]), cellCenter(cx, cz));
  return { sockets, ids, night, place };
}

const EXIT = [14, 0];
const complete = (socket) => waitFor(socket, 'world:update', ({ events }) => events.some((e) => e.type === 'night-complete'));

describe('exit together', () => {
  it('ends a solo night as soon as the player is in the exit', async () => {
    const { sockets, place } = await playing(1);
    place(0, ...EXIT);
    const done = complete(sockets[0]);
    sockets[0].emit('exit:at', { at: true });
    await done;
  });

  it('makes the first one wait for the other, then ends it for both', async () => {
    const { sockets, night, place } = await playing(2);
    place(0, ...EXIT);
    const waiting = waitFor(sockets[0], 'exit:waiting');
    sockets[0].emit('exit:at', { at: true });
    expect((await waiting).missing).toEqual(['B']);
    expect(night.state.completed).toBe(false);
    place(1, ...EXIT);
    const both = [complete(sockets[0]), complete(sockets[1])];
    sockets[1].emit('exit:at', { at: true });
    await Promise.all(both);
    expect(night.state.completed).toBe(true);
  });

  it('forgets a player who steps back into the house', async () => {
    const { sockets, ids, night, place } = await playing(2);
    place(0, ...EXIT);
    sockets[0].emit('exit:at', { at: true });
    await waitFor(sockets[0], 'exit:waiting');
    sockets[0].emit('exit:at', { at: false });
    await waitFor(sockets[0], 'exit:waiting', ({ waiting }) => waiting.length === 0);
    expect(night.atExit.has(ids[0])).toBe(false);
  });

  it('does not believe a player who claims to be at the exit but is not, or a sealed exit', async () => {
    const { sockets, ids, night, place } = await playing(1);
    place(0, 13, 4);
    sockets[0].emit('exit:at', { at: true });
    await waitFor(sockets[0], 'exit:waiting');
    expect(night.state.completed).toBe(false);
    night.state.exitOpen = false;
    place(0, ...EXIT);
    sockets[0].emit('exit:at', { at: true });
    await waitFor(sockets[0], 'exit:waiting');
    expect(night.atExit.has(ids[0])).toBe(false);
  });

  it('does not keep everyone waiting for a player whose connection dropped', async () => {
    const { sockets, night, place } = await playing(2);
    place(0, ...EXIT);
    sockets[0].emit('exit:at', { at: true });
    await waitFor(sockets[0], 'exit:waiting');
    const done = complete(sockets[0]);
    sockets[1].disconnect();
    await done;
    expect(night.state.completed).toBe(true);
  });
});
