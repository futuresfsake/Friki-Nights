import { describe, expect, it } from 'vitest';
import { CELL, PLAYER_RADIUS } from '../../shared/constants.js';
import { parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { hitsProp, placeProp } from '../../shared/props.js';
import { blocked } from '../src/player/collision.js';

const STEP = 0.2;

// Walks the house on a fine grid with the real collision (player radius, furniture),
// treating every door as open and beds as solid. Returns a test: can (x, z) be stood on?
function walkable(map) {
  const beds = new Set(map.objects.filter((o) => o.type === 'bed').map((o) => `${o.x},${o.z}`));
  const solid = (cx, cz) => beds.has(`${cx},${cz}`);
  const key = (i, j) => `${i},${j}`;
  const start = map.spawns[0];
  const si = Math.round(((start.x + 0.5) * CELL) / STEP);
  const sj = Math.round(((start.z + 0.5) * CELL) / STEP);
  const seen = new Set([key(si, sj)]);
  const queue = [[si, sj]];
  while (queue.length) {
    const [i, j] = queue.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di;
      const nj = j + dj;
      if (seen.has(key(ni, nj)) || blocked(map, ni * STEP, nj * STEP, PLAYER_RADIUS, solid)) continue;
      seen.add(key(ni, nj));
      queue.push([ni, nj]);
    }
  }
  // Any reachable point inside the cell counts.
  return (cx, cz) => {
    for (let i = Math.ceil((cx * CELL) / STEP); i * STEP < (cx + 1) * CELL; i++) {
      for (let j = Math.ceil((cz * CELL) / STEP); j * STEP < (cz + 1) * CELL; j++) if (seen.has(key(i, j))) return true;
    }
    return false;
  };
}

describe('props', () => {
  const map = parseMap(night1);

  it('Night 1 has furniture in every part of the house', () => {
    expect(map.props.length).toBeGreaterThanOrEqual(30);
    expect(map.props.filter((p) => p.solid).length).toBeGreaterThanOrEqual(12);
  });

  it('never cut off a puzzle piece, door, or bed', () => {
    const can = walkable(map);
    for (const o of map.objects) {
      if (o.type === 'trigger' || o.type === 'window') continue;
      if (o.type === 'bed') {
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => can(o.x + dx, o.z + dz));
        expect(near, `${o.id} can't be reached`).toBe(true);
      } else expect(can(o.x, o.z), `${o.id} can't be reached`).toBe(true);
    }
  });

  it('every spawn has room to stand', () => {
    for (const s of map.spawns) expect(hitsProp(map.props, (s.x + 0.5) * CELL, (s.z + 0.5) * CELL, PLAYER_RADIUS)).toBe(false);
  });

  it('wall props stand flush against their wall', () => {
    const solid = (cx, cz) => cz === 0; // a wall along the north
    const p = placeProp({ type: 'wardrobe', x: 3, z: 1 }, solid);
    expect(p.rotation).toBe(0);
    expect(p.box.minZ).toBeGreaterThanOrEqual(CELL); // not inside the wall
    expect(p.box.minZ).toBeLessThan(CELL + 0.1); // but right against it
  });

  it('refuses props in doorways, on objects, inside walls, or with no wall to lean on', () => {
    const grid = ['#####', '#P.K#', '##D##', '#...#', '#####'];
    expect(() => parseMap({ grid, keys: ['a'], props: [{ type: 'chair', x: 2, z: 2 }] })).toThrow(/doorway/);
    expect(() => parseMap({ grid, keys: ['a'], props: [{ type: 'table', x: 3, z: 1 }] })).toThrow(/object/);
    expect(() => parseMap({ grid, keys: ['a'], props: [{ type: 'rug', x: 0, z: 0 }] })).toThrow(/wall/);
    expect(() => parseMap({ grid, keys: ['a'], props: [{ type: 'sofa', x: 2, z: 3 }] })).toThrow(/Unknown/);
    expect(() => parseMap({ grid, keys: ['a'], props: [{ type: 'wardrobe', x: 2, z: 3, side: 'n' }] })).toThrow(/needs a wall/);
    expect(parseMap({ grid, keys: ['a'], props: [{ type: 'rug', x: 3, z: 1 }] }).props).toHaveLength(1);
  });
});
