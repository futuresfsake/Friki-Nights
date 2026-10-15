import { describe, expect, it } from 'vitest';
import { screamSamples } from '../src/audio/sfx.js';

describe('the ghost scream', () => {
  it('is a loud, clean, couple-of-seconds scream for every seed', () => {
    for (const seed of [1, 2, 3]) {
      const samples = screamSamples(48000, seed);
      expect(samples.length / 48000).toBeGreaterThan(1.6);
      expect(samples.length / 48000).toBeLessThan(2.2);
      let peak = 0;
      let energy = 0;
      for (const v of samples) {
        expect(Number.isFinite(v)).toBe(true);
        peak = Math.max(peak, Math.abs(v));
        energy += v * v;
      }
      expect(peak).toBeLessThanOrEqual(0.95 + 1e-6);
      expect(Math.sqrt(energy / samples.length)).toBeGreaterThan(0.2); // loud, not a whimper
    }
  });

  it('starts at once and fades to silence', () => {
    const samples = screamSamples(48000, 1);
    const rms = (from, to) => Math.sqrt(samples.slice(from, to).reduce((a, v) => a + v * v, 0) / (to - from));
    expect(rms(480, 4800)).toBeGreaterThan(0.2);
    expect(Math.abs(samples[samples.length - 1])).toBeLessThan(0.01);
  });
});
