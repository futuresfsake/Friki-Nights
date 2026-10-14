import { describe, expect, it } from 'vitest';
import { cellCenter, parseMap } from '../../shared/mapParser.js';
import { angleOff, hasLineOfSight } from '../../shared/sight.js';

const map = parseMap([
  '#######',
  '#.....#',
  '#.###.#',
  '#.....#',
  '#P....#',
  '#######',
]);
const c = (x, z) => cellCenter(x, z);

describe('line of sight', () => {
  it('sees along an open row', () => {
    expect(hasLineOfSight(map, c(1, 1).x, c(1, 1).z, c(5, 1).x, c(5, 1).z)).toBe(true);
  });

  it('is blocked by a wall in between', () => {
    expect(hasLineOfSight(map, c(3, 1).x, c(3, 1).z, c(3, 3).x, c(3, 3).z)).toBe(false);
  });

  it('cannot slip through a corner diagonally', () => {
    // From (1,1) to (2,3) passes through the wall at (2,2) or the corner of it.
    expect(hasLineOfSight(map, c(1, 1).x, c(1, 1).z, c(2, 3).x + 0.5, c(2, 3).z)).toBe(false);
  });

  it('is blocked by extra solids such as closed doors', () => {
    const door = (cx, cz) => cx === 3 && cz === 1;
    expect(hasLineOfSight(map, c(1, 1).x, c(1, 1).z, c(5, 1).x, c(5, 1).z, door)).toBe(false);
  });

  it('works within one cell and to its own point', () => {
    expect(hasLineOfSight(map, 2.2, 2.2, 3.8, 3.8)).toBe(true);
  });
});

describe('angleOff', () => {
  it('is 0 straight ahead (yaw 0 looks towards -z) and π straight behind', () => {
    expect(angleOff(0, 0, 0, 0, -5)).toBeCloseTo(0);
    expect(angleOff(0, 0, 0, 0, 5)).toBeCloseTo(Math.PI);
    expect(angleOff(0, 0, Math.PI / 2, -5, 0)).toBeCloseTo(0);
  });
});
