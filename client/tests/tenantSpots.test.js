import { describe, expect, it } from 'vitest';
import { cellAt, cellCenter, isSolid, parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { angleOff, hasLineOfSight } from '../../shared/sight.js';
import { crossingPath, findSpot, spotToward } from '../src/tenant/spots.js';

const map = parseMap(night1);
const hall = cellCenter(14, 9); // middle of the long hall, looking east (yaw -π/2)
const east = -Math.PI / 2;

describe('Tenant spots', () => {
  it('finds a visible floor spot in the requested ring and angle', () => {
    for (let i = 0; i < 50; i++) {
      const s = findSpot(map, hall, east, { minDist: 6, maxDist: 13, maxAngle: 0.3 });
      const d = Math.hypot(s.x - hall.x, s.z - hall.z);
      expect(d).toBeGreaterThanOrEqual(6);
      expect(d).toBeLessThanOrEqual(13);
      expect(angleOff(hall.x, hall.z, east, s.x, s.z)).toBeLessThanOrEqual(0.3);
      expect(hasLineOfSight(map, hall.x, hall.z, s.x, s.z)).toBe(true);
    }
  });

  it('returns null when nowhere fits', () => {
    expect(findSpot(map, hall, east, { minDist: 40, maxDist: 50 })).toBeNull();
  });

  it('pulls a spot behind the player in front of a wall', () => {
    // Hall is 2 cells tall: 4 m straight north runs into the wall.
    const s = spotToward(map, hall, 0, 0, 4);
    const { cx, cz } = cellAt(s.x, s.z);
    expect(isSolid(map, cx, cz)).toBe(false);
    expect(s.distance).toBeLessThan(4);
  });

  it('plans a walk across the line of sight on open floor', () => {
    // In the foyer, looking north across the room.
    const path = crossingPath(map, cellCenter(12, 6), cellCenter(12, 2));
    expect(path).not.toBeNull();
    for (const p of [path.from, path.to]) {
      const { cx, cz } = cellAt(p.x, p.z);
      expect(isSolid(map, cx, cz)).toBe(false);
    }
  });
});
