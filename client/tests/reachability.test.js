import { describe, expect, it } from 'vitest';
import { parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { reachable } from './reachable.js';

describe('Night 1 is solvable', () => {
  const map = parseMap(night1);
  const { cells } = reachable(map);

  it('every object except beds can be reached', () => {
    for (const o of map.objects) {
      if (o.type === 'bed' || o.type === 'trigger') continue;
      // Doors and the exit sit between rooms; reaching their cell is enough.
      expect(cells.has(`${o.x},${o.z}`), `${o.id} is unreachable`).toBe(true);
    }
  });

  it('every bed has a free cell next to it to stand on', () => {
    for (const o of map.objects.filter((b) => b.type === 'bed')) {
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => cells.has(`${o.x + dx},${o.z + dz}`));
      expect(near, `${o.id} cannot be reached`).toBe(true);
    }
  });
});
