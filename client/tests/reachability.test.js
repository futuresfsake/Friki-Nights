import { describe, expect, it } from 'vitest';
import { parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { apply, createNightState } from '../../shared/nightState.js';
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

describe('Night 1 can be completed', () => {
  it('collect everything, restore power, walk out', () => {
    const map = parseMap(night1);
    const s = createNightState(map);
    const act = (targetId) => apply(s, { type: 'interact', playerId: 'p1', targetId });
    for (const o of map.objects) if (o.type === 'key' || o.type === 'fuse') act(o.id);
    for (const o of map.objects) if (o.locked) act(o.id);
    const box = map.objects.find((o) => o.type === 'fuseBox');
    while (!s.power) {
      const events = act(box.id);
      expect(events[0].type).not.toBe('denied');
    }
    expect(s.exitOpen).toBe(true);
    expect(apply(s, { type: 'reach-exit', playerId: 'p1' })).toEqual([{ type: 'night-complete' }]);
  });
});

describe('Night 1 notes', () => {
  it('has 3–4 notes, one of which points to a fuse', () => {
    const map = parseMap(night1);
    const notes = map.objects.filter((o) => o.type === 'note');
    expect(notes.length).toBeGreaterThanOrEqual(3);
    expect(notes.length).toBeLessThanOrEqual(4);
    expect(notes.some((n) => /fuse/i.test(n.text))).toBe(true);
  });
});
