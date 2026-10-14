import { describe, expect, it } from 'vitest';
import { ACTS, BIG_SPACING, FIRST_VISIT, createBrain } from '../src/tenant/brain.js';

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
const ALL = new Set(Object.keys(ACTS).filter((id) => !ACTS[id].hiding));

// Runs the brain for `minutes`, finishing each trick `length` seconds after it starts.
function run({ minutes = 60, seed = 1, available = () => ALL, hiding = () => false, length = 4 } = {}) {
  const brain = createBrain({ random: rng(seed) });
  const log = [];
  let running = null;
  for (let t = 0; t < minutes * 60; t += 0.1) {
    if (running && t >= running.until) {
      brain.finished(t, running.id);
      running = null;
    }
    const id = brain.decide(t, { busy: !!running, hiding: hiding(t), available: available(t) });
    if (id) {
      log.push({ id, t });
      running = { id, until: t + length };
    }
  }
  return log;
}

describe('the Tenant brain', () => {
  it('leaves the player alone at the start of the night', () => {
    for (let seed = 1; seed < 20; seed++) expect(run({ seed })[0].t).toBeGreaterThanOrEqual(FIRST_VISIT[0]);
  });

  it('never plays the same trick twice in a row', () => {
    const log = run({ minutes: 240 });
    for (let i = 1; i < log.length; i++) expect(log[i].id).not.toBe(log[i - 1].id);
  });

  it('keeps big tricks at least BIG_SPACING apart', () => {
    for (let seed = 1; seed < 10; seed++) {
      const big = run({ minutes: 120, seed }).filter((e) => ACTS[e.id].big);
      for (let i = 1; i < big.length; i++) expect(big[i].t - big[i - 1].t).toBeGreaterThanOrEqual(BIG_SPACING);
    }
  });

  it('is unpredictable: uses every trick, and the gaps vary a lot', () => {
    const log = run({ minutes: 600 });
    expect(new Set(log.map((e) => e.id))).toEqual(ALL);
    const gaps = log.slice(1).map((e, i) => e.t - log[i].t);
    expect(Math.min(...gaps)).toBeLessThan(15); // double taps happen
    expect(Math.max(...gaps)).toBeGreaterThan(80); // and long silences
  });

  it('only picks tricks that fit right now', () => {
    const log = run({ available: () => new Set(['giggle', 'name']) });
    expect(log.length).toBeGreaterThan(10);
    expect(log.every((e) => e.id === 'giggle' || e.id === 'name')).toBe(true);
  });

  it('does nothing while a note or the pause screen is open', () => {
    const brain = createBrain({ random: rng(3) });
    for (let t = 0; t < 600; t += 0.1) expect(brain.decide(t, { uiOpen: true, available: ALL })).toBeNull();
  });

  it('comes to look under the bed you hide under', () => {
    const log = run({ minutes: 30, hiding: (t) => t > 100 && t < 1000, available: () => new Set([...ALL, 'bedVisit']) });
    const whileHiding = log.filter((e) => e.t > 100 && e.t < 1000);
    expect(whileHiding.some((e) => e.id === 'bedVisit')).toBe(true);
    expect(whileHiding.every((e) => ['bedVisit', 'name', 'giggle'].includes(e.id))).toBe(true);
    expect(log.filter((e) => e.t > 1001).every((e) => e.id !== 'bedVisit')).toBe(true);
  });

  it('keeps big tricks away from a map jump scare', () => {
    const brain = createBrain({ random: rng(5) });
    brain.noteScare(100, true);
    expect(brain.bigAllowed(100 + BIG_SPACING - 1)).toBe(false);
    expect(brain.bigAllowed(100 + BIG_SPACING)).toBe(true);
  });
});
