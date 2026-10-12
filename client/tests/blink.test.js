import { describe, expect, it } from 'vitest';
import { BLINK_STEP, blinkFactor, blinkFinished, nextBlinkDelay, startBlink } from '../src/player/blink.js';

describe('flashlight blink', () => {
  it('is fully on when not blinking', () => {
    expect(blinkFactor(null, 5)).toBe(1);
  });

  it('alternates off and on during a burst', () => {
    const blink = { start: 10, count: 2 };
    expect(blinkFactor(blink, 10)).toBeLessThan(0.2);
    expect(blinkFactor(blink, 10 + BLINK_STEP * 1.5)).toBe(1);
    expect(blinkFactor(blink, 10 + BLINK_STEP * 2.5)).toBeLessThan(0.2);
  });

  it('ends after its number of blinks', () => {
    const blink = { start: 10, count: 2 };
    const end = 10 + 4 * BLINK_STEP;
    expect(blinkFinished(blink, end - 0.01)).toBe(false);
    expect(blinkFinished(blink, end + 0.001)).toBe(true);
    expect(blinkFactor(blink, end + 0.001)).toBe(1);
  });

  it('blinks more often on a low battery', () => {
    expect(nextBlinkDelay(true, () => 1)).toBeLessThan(nextBlinkDelay(false, () => 0));
  });

  it('starts bursts of 2 to 5 blinks', () => {
    expect(startBlink(0, () => 0).count).toBe(2);
    expect(startBlink(0, () => 0.999).count).toBe(5);
  });
});
