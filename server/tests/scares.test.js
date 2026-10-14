import { afterEach, describe, expect, it } from 'vitest';
import { cellCenter } from '../../shared/mapParser.js';
import { request, startServer, waitFor } from './helpers.js';

let server;
afterEach(() => server?.stop());

// Two players in a started Night 1. step(id, cx, cz) puts a player in the cell next
// door on the server, then sends a real move onto (cx, cz).
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
  const socketOf = { [aId]: a, [bId]: b };
  // A teleport: the triggers forget which cell the player was in, as if they walked here.
  const place = (id, cx, cz) => {
    Object.assign(night.players.get(id), cellCenter(cx, cz), { movedAt: undefined });
    night.triggers.lastCell.delete(id);
  };
  const step = (id, cx, cz) => {
    place(id, cx + 1, cz);
    const to = cellCenter(cx, cz);
    socketOf[id].emit('player:move', { x: to.x, z: to.z, yaw: 0, pitch: 0, light: true, t: 0 });
  };
  const trigger = (scare) => night.map.objects.find((o) => o.type === 'trigger' && o.scare === scare);
  return { a, b, aId, bId, night, place, step, trigger };
}

// Every scare:play a socket receives for `ms`.
function collect(socket, ms = 200) {
  const got = [];
  const on = (scare) => got.push(scare);
  socket.on('scare:play', on);
  return new Promise((resolve) => setTimeout(() => (socket.off('scare:play', on), resolve(got)), ms));
}

describe('scare triggers on the server', () => {
  it("plays a 'self' scare only for the player who stepped on it", async () => {
    const { a, b, aId, step, trigger } = await playing();
    const whisper = trigger('whisper');
    const [gotA, gotB] = [collect(a), collect(b)];
    step(aId, whisper.x, whisper.z);
    expect(await gotA).toEqual([{ triggerId: whisper.id, playerId: aId }]);
    expect(await gotB).toEqual([]);
  });

  it("plays an 'all' scare for everyone, once for the whole room", async () => {
    const { a, b, aId, bId, step, trigger } = await playing();
    const hand = trigger('JS-06');
    const [gotA, gotB] = [collect(a), collect(b)];
    step(aId, hand.x, hand.z);
    const first = [{ triggerId: hand.id, playerId: aId }];
    expect(await gotA).toEqual(first);
    expect(await gotB).toEqual(first);
    const again = [collect(a), collect(b)];
    step(bId, hand.x, hand.z);
    expect(await Promise.all(again)).toEqual([[], []]);
  });

  it('checks onlyIf against the server night: no slam until the house key is held', async () => {
    const { a, aId, night, step, trigger } = await playing();
    const slam = trigger('JS-02');
    night.state.doors[slam.door].open = true;
    let got = collect(a);
    step(aId, slam.x, slam.z);
    expect(await got).toEqual([]);
    night.state.players[aId].keys.push('house');
    got = collect(a);
    step(aId, slam.x, slam.z);
    expect(await got).toEqual([{ triggerId: slam.id, playerId: aId }]);
  });

  it('plays an event scare only for the player who caused it (JS-01 on the parlor key)', async () => {
    const { a, b, aId, night, place } = await playing();
    const key = night.map.objects.find((o) => o.type === 'key' && o.keyId === 'parlor');
    place(aId, key.x, key.z);
    const [gotA, gotB] = [collect(a), collect(b)];
    a.emit('interact', { targetId: key.id });
    expect(await gotA).toEqual([{ triggerId: night.map.eventTriggers[0].id, playerId: aId }]);
    expect(await gotB).toEqual([]);
  });

  it('ignores a move the server refused', async () => {
    const { a, aId, place, trigger } = await playing();
    const whisper = trigger('whisper');
    place(aId, whisper.x + 6, whisper.z); // far too far for one move
    const got = collect(a);
    const to = cellCenter(whisper.x, whisper.z);
    a.emit('player:move', { x: to.x, z: to.z, yaw: 0, pitch: 0, light: true, t: 0 });
    expect(await got).toEqual([]);
  });
});
