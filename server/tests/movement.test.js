import { afterEach, describe, expect, it } from 'vitest';
import { RUN_SPEED, WALK_SPEED } from '../../shared/constants.js';
import { parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { acceptMove, BURST_SECONDS, MAX_SPEED } from '../src/movement.js';
import { request, startServer, waitFor } from './helpers.js';

const map = parseMap(night1);
const spawn = { x: 23, z: 13 }; // floor, the foyer

describe('acceptMove', () => {
  it('accepts walking and running at 15 Hz', () => {
    const at = { ...spawn };
    let t = 0;
    for (let i = 1; i <= 30; i++) {
      t += 1000 / 15;
      const speed = i < 15 ? WALK_SPEED : RUN_SPEED;
      expect(acceptMove(map, at, { x: at.x + speed / 15, z: at.z, yaw: 0, pitch: 0 }, t)).toBe(true);
    }
  });

  it('accepts moves that arrive bunched together after a lag spike', () => {
    const at = { ...spawn };
    acceptMove(map, at, { ...spawn, yaw: 0, pitch: 0 }, 0);
    // 300 ms of running arrives in one burst at t = 300.
    for (let i = 1; i <= 4; i++) {
      expect(acceptMove(map, at, { x: spawn.x + (RUN_SPEED * 0.075 * i), z: spawn.z, yaw: 0, pitch: 0 }, 300)).toBe(true);
    }
  });

  it('rejects a speed hack (more than run speed + 10%) and keeps the old position', () => {
    const at = { ...spawn };
    acceptMove(map, at, { ...spawn, yaw: 0, pitch: 0 }, 0);
    let t = 0;
    let rejected = 0;
    for (let i = 0; i < 30; i++) {
      t += 1000 / 15;
      if (!acceptMove(map, at, { x: at.x + (MAX_SPEED * 1.3) / 15, z: at.z, yaw: 0, pitch: 0 }, t)) rejected++;
    }
    expect(rejected).toBeGreaterThan(0);
    expect(at.x - spawn.x).toBeLessThanOrEqual(MAX_SPEED * (t / 1000 + BURST_SECONDS) + 1e-9);
  });

  it('rejects teleports and moves into walls', () => {
    const at = { ...spawn };
    expect(acceptMove(map, at, { x: spawn.x + 20, z: spawn.z, yaw: 0, pitch: 0 }, 1000)).toBe(false);
    expect(acceptMove(map, at, { x: 1, z: 1, yaw: 0, pitch: 0 }, 2000)).toBe(false); // outer wall
    expect(at).toMatchObject(spawn);
  });
});

describe('player:move', () => {
  let server;
  afterEach(() => server?.stop());

  async function playing() {
    let t = 0;
    server = await startServer({ now: () => t });
    const a = server.client();
    const b = server.client();
    const { code } = await request(a, 'room:create', { name: 'A' });
    await request(b, 'room:join', { code, name: 'B' });
    for (const s of [a, b]) await request(s, 'player:ready', { ready: true, codeWordHash: 'c'.repeat(64) });
    const start = waitFor(a, 'night:start');
    await request(a, 'night:begin', {});
    const me = (await start).players[0];
    return { a, b, me, tick: (ms) => (t += ms) };
  }

  it('forwards valid moves to the other players', async () => {
    const { a, b, me, tick } = await playing();
    tick(100);
    const seen = waitFor(b, 'player:state');
    a.emit('player:move', { x: me.x + 0.2, z: me.z, yaw: 1, pitch: 0, t: 5 });
    expect(await seen).toMatchObject({ x: me.x + 0.2, z: me.z, yaw: 1, t: 5 });
  });

  it('rejects a speed hack and corrects the sender', async () => {
    const { a, b, me, tick } = await playing();
    let forwarded = false;
    b.on('player:state', () => (forwarded = true));
    tick(66);
    const correction = waitFor(a, 'player:correct');
    a.emit('player:move', { x: me.x + 6, z: me.z, yaw: 0, pitch: 0, t: 66 });
    expect(await correction).toEqual({ x: me.x, z: me.z });
    expect(forwarded).toBe(false);
  });
});
