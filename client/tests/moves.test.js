import { describe, expect, it } from 'vitest';
import { createMoveSender } from '../src/net/moves.js';

describe('move sender', () => {
  it('sends at most 15 times a second while moving', () => {
    let t = 0;
    const sent = [];
    const sender = createMoveSender((m) => sent.push(m), { now: () => t });
    for (let frame = 0; frame < 120; frame++) {
      sender.update({ x: frame * 0.05, z: 0, yaw: 0, pitch: 0, light: true });
      t += 1000 / 120; // one second at 120 fps
    }
    expect(sent.length).toBeLessThanOrEqual(15);
    expect(sent.length).toBeGreaterThanOrEqual(14);
  });

  it('stays quiet while standing still, apart from a 1 s heartbeat', () => {
    let t = 0;
    const sent = [];
    const sender = createMoveSender((m) => sent.push(m), { now: () => t });
    for (let frame = 0; frame < 300; frame++) {
      sender.update({ x: 1, z: 1, yaw: 0, pitch: 0, light: true });
      t += 10; // 3 seconds
    }
    expect(sent.length).toBe(3);
  });

  it('sends at once when the flashlight is switched, even standing still', () => {
    let t = 0;
    const sent = [];
    const sender = createMoveSender((m) => sent.push(m), { now: () => t });
    sender.update({ x: 1, z: 1, yaw: 0, pitch: 0, light: true });
    t += 100;
    sender.update({ x: 1, z: 1, yaw: 0, pitch: 0, light: false });
    expect(sent.map((m) => m.light)).toEqual([true, false]);
  });
});
