import { describe, expect, it } from 'vitest';
import { cellAt, cellCenter, isSolid, NOTE_MAX_LENGTH, parseMap, wallSide } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';

const base = { keys: [], lockedDoors: [], notes: [], triggers: [] };

describe('parseMap — grid', () => {
  it('reads walls, floor, spawns, and lights', () => {
    const map = parseMap(['#####', '#P.S#', '#####']);
    expect(map.width).toBe(5);
    expect(map.height).toBe(3);
    expect(map.spawns).toEqual([{ x: 1, z: 1 }]);
    expect(map.lights).toEqual([{ x: 3, z: 1 }]);
    expect(isSolid(map, 0, 1)).toBe(true);
    expect(isSolid(map, 2, 1)).toBe(false);
  });

  it('treats spaces, short rows, and out of bounds as walls', () => {
    const map = parseMap(['  ###', '#P.#', '#####']);
    expect(isSolid(map, 0, 0)).toBe(true);
    expect(isSolid(map, 4, 1)).toBe(true);
    expect(isSolid(map, -1, 0)).toBe(true);
    expect(isSolid(map, 0, 9)).toBe(true);
  });

  it('accepts 1 to 4 spawns only', () => {
    expect(parseMap(['#PPPP#']).spawns).toHaveLength(4);
    expect(() => parseMap(['#PPPPP#'])).toThrow(/more than 4 spawns/);
    expect(() => parseMap(['#..#'])).toThrow(/no player spawn/);
  });

  it('marks hall lights as powered', () => {
    const map = parseMap(['#PSG#']);
    expect(map.lights).toEqual([{ x: 2, z: 0 }, { x: 3, z: 0, powered: true }]);
  });

  it('finds the wall next to a cell', () => {
    const map = parseMap(['#####', '#P..#', '#...#', '#...#', '#####']);
    expect(wallSide(map, 1, 1)).toMatchObject({ dx: 0, dz: -1 });
    expect(wallSide(map, 3, 2)).toMatchObject({ dx: 1, dz: 0 });
    expect(wallSide(map, 2, 2)).toBe(null);
  });

  it('rejects unknown characters', () => {
    expect(() => parseMap(['#P?#'])).toThrow(/Unknown map character "\?"/);
  });

  it('parses the Night 1 map', () => {
    const map = parseMap(night1);
    expect(map.id).toBe('night1');
    expect(map.spawns.length).toBeGreaterThan(0);
    expect(map.lights.length).toBeGreaterThan(0);
  });
});

describe('parseMap — objects', () => {
  const def = {
    ...base,
    grid: [
      '#########',
      '#P.K.N.B#',
      '####L####',
      '#U.F.T.X#',
      '####D####',
      '#.......#',
      '#########',
    ],
    keys: ['house'],
    lockedDoors: ['house'],
    notes: ['Hello'],
    triggers: [{ scare: 'JS-02', once: true }],
    fuseBoxKey: 'house',
  };

  it('creates every object type with a stable id', () => {
    const map = parseMap(def);
    const byType = Object.fromEntries(map.objects.map((o) => [o.type, o]));
    expect(byType.key).toMatchObject({ id: 'key-3-1', keyId: 'house' });
    expect(byType.note).toMatchObject({ id: 'note-5-1', text: 'Hello' });
    expect(byType.battery.id).toBe('battery-7-1');
    expect(byType.fuse.id).toBe('fuse-1-3');
    expect(byType.fuseBox).toMatchObject({ id: 'fuseBox-3-3', keyId: 'house' });
    expect(byType.trigger).toMatchObject({ id: 'trigger-5-3', scare: 'JS-02', once: true });
    expect(byType.exit.id).toBe('exit-7-3');
  });

  it('marks locked doors with their key', () => {
    const doors = parseMap(def).objects.filter((o) => o.type === 'door');
    expect(doors.find((d) => d.id === 'door-4-2')).toMatchObject({ locked: true, keyId: 'house' });
    expect(doors.find((d) => d.id === 'door-4-4').locked).toBeUndefined();
  });

  it('works out which way a door faces', () => {
    const map = parseMap(def);
    expect(map.objects.find((o) => o.id === 'door-4-2').axis).toBe('x');
    const sideways = parseMap({ ...base, grid: ['#####', '#PD.#', '#####'] });
    expect(sideways.objects[0].axis).toBe('z');
  });

  it('reads beds as walkable-grid objects', () => {
    const map = parseMap({ ...base, grid: ['#####', '#PC.#', '#####'] });
    expect(map.objects).toEqual([{ id: 'bed-2-1', type: 'bed', x: 2, z: 1 }]);
    expect(isSolid(map, 2, 1)).toBe(false);
  });

  it('assigns list entries in reading order', () => {
    const map = parseMap({ ...base, grid: ['#PKK#'], keys: ['a', 'b'] });
    expect(map.objects.map((o) => o.keyId)).toEqual(['a', 'b']);
  });

  it('rejects lists that do not match the grid', () => {
    expect(() => parseMap({ ...base, grid: ['#PK#'] })).toThrow(/more "K" than entries in "keys"/);
    expect(() => parseMap({ ...base, grid: ['#P#'], keys: ['a'] })).toThrow(/"keys" has 1 entries/);
  });

  it('rejects doors that need a missing key', () => {
    const grid = ['#####', '#P#.#', '##L##', '#...#', '#####'];
    expect(() => parseMap({ ...base, grid, lockedDoors: ['nope'] })).toThrow(/needs key "nope"/);
  });

  it('rejects doors without walls on two sides', () => {
    expect(() => parseMap({ ...base, grid: ['#P.D.#'] })).not.toThrow();
    expect(() => parseMap({ ...base, grid: ['....', '.PD.', '....'] })).toThrow(/two opposite sides/);
  });

  it('rejects a fuse box that is not against a wall', () => {
    const grid = ['#####', '#P..#', '#.F.#', '#...#', '#####'];
    expect(() => parseMap({ ...base, grid })).toThrow(/next to a wall/);
  });

  it('rejects notes that are too long', () => {
    const notes = ['x'.repeat(NOTE_MAX_LENGTH + 1)];
    expect(() => parseMap({ ...base, grid: ['#PN#'], notes })).toThrow(/longer than 280/);
  });
});

describe('cell helpers', () => {
  it('converts between cells and metres', () => {
    expect(cellCenter(0, 0)).toEqual({ x: 1, z: 1 });
    expect(cellCenter(2, 3)).toEqual({ x: 5, z: 7 });
    expect(cellAt(5, 7)).toEqual({ cx: 2, cz: 3 });
  });
});
