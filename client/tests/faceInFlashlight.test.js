import { describe, expect, it } from 'vitest';
import { FACE, FACE_SECONDS, faceAt } from '../src/scares/faceInFlashlight.js';
import { createEffects } from '../src/scares/effects.js';

describe('JS-01 face in the flashlight', () => {
  const sample = (fn) => Array.from({ length: Math.ceil(FACE_SECONDS * 100) }, (_, i) => fn(faceAt(i / 100), i / 100));

  it('stays hidden while the light stutters, then stares from a distance', () => {
    expect(faceAt(0).visible).toBe(false);
    expect(faceAt(FACE.flicker - 0.01).visible).toBe(false);
    const stare = faceAt(FACE.flicker + 0.1);
    expect(stare).toMatchObject({ visible: true, distance: FACE.far, open: false });
  });

  it('lunges into your face with its mouth open, then is gone', () => {
    const distances = sample((s) => s.distance).filter((d) => d !== undefined);
    for (let i = 1; i < distances.length; i++) expect(distances[i]).toBeLessThanOrEqual(distances[i - 1]);
    expect(Math.min(...distances)).toBe(FACE.near);
    expect(sample((s) => s.open).some(Boolean)).toBe(true);
    expect(faceAt(FACE_SECONDS).visible).toBe(false);
  });
});

describe('screen effects', () => {
  it('flickers the flashlight, then lets it be', () => {
    const fx = createEffects();
    expect(fx.lightFactor(0)).toBe(1);
    fx.flicker(10, 0.7);
    const during = Array.from({ length: 10 }, (_, i) => fx.lightFactor(10 + i * 0.07));
    expect(during).toContain(1);
    expect(during.some((f) => f < 0.1)).toBe(true);
    expect(fx.lightFactor(10.71)).toBe(1);
  });
});
