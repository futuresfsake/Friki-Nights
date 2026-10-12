import { CELL } from '../constants.js';

// M1 subset of the shared map format: # wall, . floor, P spawn, S ceiling light.
// Spaces are treated as solid so maps can have irregular outlines.
export function parseMap(rows) {
  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));
  const solid = [];
  const lights = [];
  let spawn = null;

  for (let z = 0; z < height; z++) {
    const line = [];
    for (let x = 0; x < width; x++) {
      const ch = rows[z][x] ?? ' ';
      switch (ch) {
        case '#':
        case ' ':
          line.push(true);
          break;
        case '.':
          line.push(false);
          break;
        case 'P':
          line.push(false);
          spawn = { x, z };
          break;
        case 'S':
          line.push(false);
          lights.push({ x, z });
          break;
        default:
          throw new Error(`Unknown map character "${ch}" at ${x},${z}`);
      }
    }
    solid.push(line);
  }

  if (!spawn) throw new Error('Map has no player spawn (P)');
  return { width, height, solid, spawn, lights };
}

// Out-of-bounds counts as wall so nothing can leave the map.
export function isSolid(map, cx, cz) {
  if (cz < 0 || cz >= map.height || cx < 0 || cx >= map.width) return true;
  return map.solid[cz][cx];
}

export function cellCenter(cx, cz) {
  return { x: (cx + 0.5) * CELL, z: (cz + 0.5) * CELL };
}
