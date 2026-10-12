import { describe, expect, it } from 'vitest';
import { WHISPER_PEAK } from '../src/audio/sfx.js';
import { whisperScare } from '../src/scares/whisper.js';

describe('whispers', () => {
  it('never peak above the drone + 6 dB', () => {
    const dronePeak = 0.05 + 0.025;
    expect(WHISPER_PEAK).toBeLessThanOrEqual(dronePeak * 2);
  });

  it('play near the player, then rest for a while', () => {
    const calls = [];
    let now = 100;
    const ctx = {
      now: () => now,
      audio: () => ({}),
      camera: { position: { x: 10, z: 10 } },
      whispers: (_a, x, _y, z) => calls.push(Math.hypot(x - 10, z - 10)),
    };
    whisperScare(ctx);
    whisperScare(ctx);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBeGreaterThanOrEqual(2);
    expect(calls[0]).toBeLessThanOrEqual(4);
    now += 30;
    whisperScare(ctx);
    expect(calls).toHaveLength(2);
  });
});
