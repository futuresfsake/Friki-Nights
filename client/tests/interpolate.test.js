import { describe, expect, it } from 'vitest';
import { WALK_SPEED } from '../../shared/constants.js';
import { createInterpolator, lerpAngle } from '../src/net/interpolate.js';

// Seeded random, so the "network" is the same on every run.
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

// A partner walking along x at walking speed, sending 15×/s from a clock 5 s ahead of
// ours, over a network with 250 ms delay, ±40 ms jitter and 2% loss.
function simulate({ delay = 250, jitter = 40, loss = 0.02, seconds = 10 } = {}) {
  const random = rng(7);
  const arrivals = [];
  for (let t = 0; t < seconds * 1000; t += 1000 / 15) {
    if (random() < loss) continue;
    arrivals.push({ at: t + delay + (random() * 2 - 1) * jitter, snap: { t: t + 5000, x: (WALK_SPEED * t) / 1000, z: 0, yaw: 0, pitch: 0 } });
  }
  return arrivals.sort((a, b) => a.at - b.at);
}

describe('interpolation', () => {
  it('never teleports at 250 ms delay with jitter and 2% loss', () => {
    const interp = createInterpolator();
    const arrivals = simulate();
    let prev = null;
    let maxStep = 0;
    for (let now = 0; now < 10_000; now += 1000 / 60) {
      while (arrivals.length && arrivals[0].at <= now) interp.push(arrivals.shift().snap, now);
      const s = interp.sample(now);
      if (!s) continue;
      if (prev) maxStep = Math.max(maxStep, Math.abs(s.x - prev.x));
      prev = s;
    }
    // A walker covers ~0.037 m per 60 fps frame; allow some speed-up, never a jump.
    expect(maxStep).toBeLessThan((WALK_SPEED / 60) * 2.5);
    expect(prev.x).toBeGreaterThan(WALK_SPEED * 9.4);
  });

  it('keeps a partner going briefly through a gap, then waits', () => {
    const make = () => {
      const interp = createInterpolator();
      interp.push({ t: 0, x: 0, z: 0, yaw: 0, pitch: 0 }, 0);
      interp.push({ t: 100, x: 1, z: 0, yaw: 0, pitch: 0 }, 100);
      return interp;
    };
    expect(make().sample(150).x).toBeCloseTo(0.5, 5); // 100 ms behind
    expect(make().sample(250).x).toBeCloseTo(1.5, 5); // 50 ms past the last update
    expect(make().sample(5000).x).toBeCloseTo(2.5, 5); // at most 150 ms ahead, then waits
  });

  it('ignores late, out-of-order updates', () => {
    const interp = createInterpolator();
    interp.push({ t: 100, x: 1, z: 0, yaw: 0, pitch: 0 }, 100);
    interp.push({ t: 50, x: 9, z: 0, yaw: 0, pitch: 0 }, 120);
    expect(interp.sample(1000).x).toBe(1);
  });

  it('turns the short way round', () => {
    expect(lerpAngle(3, -3, 0.5)).toBeCloseTo(Math.PI, 1);
  });
});
