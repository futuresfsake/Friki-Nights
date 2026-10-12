import { describe, expect, it } from 'vitest';
import { BATTERY_DRAIN_PER_SECOND, BATTERY_MAX } from '../src/constants.js';
import { addBattery, drainBattery } from '../src/player/battery.js';

describe('battery', () => {
  it('drains only while the flashlight is on', () => {
    expect(drainBattery(50, true, 1)).toBeCloseTo(50 - BATTERY_DRAIN_PER_SECOND);
    expect(drainBattery(50, false, 1)).toBe(50);
  });

  it('never goes below zero', () => {
    expect(drainBattery(0.1, true, 10)).toBe(0);
  });

  it('refills up to the maximum', () => {
    expect(addBattery(90, 30)).toBe(BATTERY_MAX);
    expect(addBattery(10, 30)).toBe(40);
  });
});
