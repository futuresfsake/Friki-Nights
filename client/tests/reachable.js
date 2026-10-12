import { isSolid } from '../../shared/mapParser.js';

// Flood fill from the spawn: every cell the player can reach without passing a locked
// door they don't yet hold the key for. Keys found along the way open their doors.
export function reachable(map) {
  const objectAt = new Map(map.objects.map((o) => [`${o.x},${o.z}`, o]));
  const keys = new Set();
  const seen = new Set();
  let grew = true;
  while (grew) {
    grew = false;
    const start = map.spawns[0];
    const queue = [[start.x, start.z]];
    const visited = new Set([`${start.x},${start.z}`]);
    while (queue.length) {
      const [x, z] = queue.shift();
      const here = objectAt.get(`${x},${z}`);
      if (here?.type === 'key' && !keys.has(here.keyId)) {
        keys.add(here.keyId);
        grew = true;
      }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const nz = z + dz;
        const k = `${nx},${nz}`;
        if (visited.has(k) || isSolid(map, nx, nz)) continue;
        const o = objectAt.get(k);
        if (o?.locked && !keys.has(o.keyId)) continue;
        if (o?.type === 'bed') continue;
        visited.add(k);
        queue.push([nx, nz]);
      }
    }
    for (const k of visited) seen.add(k);
  }
  return { cells: seen, keys };
}
