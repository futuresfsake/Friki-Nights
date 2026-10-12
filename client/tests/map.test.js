import { describe, expect, it } from 'vitest';
import { cellCenter, isSolid, parseMap } from '../src/world/map.js';
import { PROTOTYPE_MAP } from '../src/world/levels.js';

describe('parseMap', () => {
  it('reads walls, floor, spawn, and lights', () => {
    const map = parseMap(['#####', '#P.S#', '#####']);
    expect(map.width).toBe(5);
    expect(map.height).toBe(3);
    expect(map.spawn).toEqual({ x: 1, z: 1 });
    expect(map.lights).toEqual([{ x: 3, z: 1 }]);
    expect(isSolid(map, 0, 1)).toBe(true);
    expect(isSolid(map, 2, 1)).toBe(false);
  });

  it('treats spaces and short rows as walls', () => {
    const map = parseMap(['  ###', '#P.#', '#####']);
    expect(isSolid(map, 0, 0)).toBe(true);
    expect(isSolid(map, 4, 1)).toBe(true);
  });

  it('treats out of bounds as wall', () => {
    const map = parseMap(['#P#']);
    expect(isSolid(map, -1, 0)).toBe(true);
    expect(isSolid(map, 0, 5)).toBe(true);
  });

  it('rejects unknown characters and missing spawn', () => {
    expect(() => parseMap(['#P?#'])).toThrow(/Unknown map character/);
    expect(() => parseMap(['#..#'])).toThrow(/no player spawn/);
  });

  it('parses the prototype house', () => {
    const map = parseMap(PROTOTYPE_MAP);
    expect(map.lights.length).toBeGreaterThan(0);
    expect(isSolid(map, map.spawn.x, map.spawn.z)).toBe(false);
  });

  it('gives cell centres in metres', () => {
    expect(cellCenter(0, 0)).toEqual({ x: 1, z: 1 });
    expect(cellCenter(2, 3)).toEqual({ x: 5, z: 7 });
  });
});
