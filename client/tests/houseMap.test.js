import { describe, expect, it } from 'vitest';
import { parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { createReveal, roomAt } from '../src/ui/mapReveal.js';

const map = parseMap(night1);

describe('house map', () => {
  it('names every floor cell of Night 1 except doorways', () => {
    for (let z = 0; z < map.height; z++) {
      for (let x = 0; x < map.width; x++) {
        if (map.solid[z][x]) continue;
        const door = map.objects.some((o) => (o.type === 'door' || o.type === 'exit') && o.x === x && o.z === z);
        if (!door) expect(roomAt(map, x, z), `cell ${x},${z} is in no room`).not.toBeNull();
      }
    }
  });

  it('marks a room the first time you walk into it', () => {
    const reveal = createReveal(map);
    expect(reveal.visit(12, 6)).toBe('Foyer');
    expect(reveal.visit(13, 5)).toBeNull(); // still the foyer
    expect(reveal.visit(13, 8)).toBeNull(); // a doorway belongs to no room
    expect(reveal.visit(13, 9)).toBe('Hall');
    expect(reveal.has('Foyer')).toBe(true);
    expect(reveal.has('Parlor')).toBe(false);
    expect(reveal.count).toBe(2);
  });

  it('refuses overlapping rooms, rooms off the map, and scribbles in walls or too long', () => {
    const grid = ['#####', '#P..#', '#...#', '#####'];
    expect(() => parseMap({ grid, rooms: [{ name: 'A', x0: 1, z0: 1, x1: 2, z1: 2 }, { name: 'B', x0: 2, z0: 2, x1: 3, z1: 2 }] })).toThrow(/overlap/);
    expect(() => parseMap({ grid, rooms: [{ name: 'A', x0: 1, z0: 1, x1: 9, z1: 2 }] })).toThrow(/bad rectangle/);
    expect(() => parseMap({ grid, mapNotes: [{ x: 0, z: 0, text: 'hi' }] })).toThrow(/wall/);
    expect(() => parseMap({ grid, mapNotes: [{ x: 1, z: 1, text: 'x'.repeat(41) }] })).toThrow(/too long/);
  });

  it('has the map pinned in the foyer, where you start', () => {
    const pinned = map.props.find((p) => p.type === 'houseMap');
    expect(roomAt(map, pinned.cell.x, pinned.cell.z).name).toBe('Foyer');
  });
});
