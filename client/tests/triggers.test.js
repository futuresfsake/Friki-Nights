import { describe, expect, it } from 'vitest';
import { parseMap } from '../../shared/mapParser.js';
import { createTriggers, enterCell, onEvent } from '../../shared/triggers.js';

const map = parseMap({
  grid: ['######', '#PT.T#', '######'],
  keys: [],
  lockedDoors: [],
  notes: [],
  triggers: [{ scare: 'JS-02', once: true }, { scare: 'whisper' }],
  eventTriggers: [{ when: { type: 'item-taken', keyId: 'parlor' }, scare: 'JS-01', once: true }],
});
const scares = (list) => list.map((t) => t.scare);

describe('tile triggers', () => {
  it('fires when stepping onto the tile, not while standing on it', () => {
    const t = createTriggers(map);
    expect(scares(enterCell(t, 'p1', 1, 1))).toEqual([]);
    expect(scares(enterCell(t, 'p1', 4, 1))).toEqual(['whisper']);
    expect(scares(enterCell(t, 'p1', 4, 1))).toEqual([]);
  });

  it('fires a one-time trigger only once, for anyone', () => {
    const t = createTriggers(map);
    expect(scares(enterCell(t, 'p1', 2, 1))).toEqual(['JS-02']);
    enterCell(t, 'p1', 3, 1);
    expect(enterCell(t, 'p1', 2, 1)).toEqual([]);
    expect(enterCell(t, 'p2', 2, 1)).toEqual([]);
  });

  it('fires a repeatable trigger again after leaving and coming back', () => {
    const t = createTriggers(map);
    enterCell(t, 'p1', 4, 1);
    enterCell(t, 'p1', 3, 1);
    expect(scares(enterCell(t, 'p1', 4, 1))).toEqual(['whisper']);
  });
});

describe('event triggers', () => {
  it('fires on a matching event, once', () => {
    const t = createTriggers(map);
    expect(onEvent(t, { type: 'item-taken', keyId: 'house' })).toEqual([]);
    expect(scares(onEvent(t, { type: 'item-taken', keyId: 'parlor', targetId: 'key-1-1' }))).toEqual(['JS-01']);
    expect(onEvent(t, { type: 'item-taken', keyId: 'parlor' })).toEqual([]);
  });

  it('rejects triggers without a scare or an event type', () => {
    const base = { grid: ['#PT#'], keys: [], lockedDoors: [], notes: [] };
    expect(() => parseMap({ ...base, triggers: [{ once: true }] })).toThrow(/has no scare/);
    expect(() => parseMap({ ...base, triggers: [{ scare: 'x' }], eventTriggers: [{ scare: 'x' }] })).toThrow(/needs a "when"/);
  });
});

describe('Night 1 scares', () => {
  it('JS-01 fires once, on the parlor key pickup', async () => {
    const night1 = (await import('../../shared/maps/night1.js')).default;
    const t = createTriggers(parseMap(night1));
    expect(scares(onEvent(t, { type: 'item-taken', keyId: 'parlor' }))).toEqual(['JS-01']);
    expect(onEvent(t, { type: 'item-taken', keyId: 'parlor' })).toEqual([]);
  });
});

describe('conditional triggers', () => {
  const condMap = parseMap({
    grid: ['#####', '#PT.#', '#####'],
    keys: [],
    lockedDoors: [],
    notes: [],
    triggers: [{ scare: 'JS-02', once: true, onlyIf: { hasKey: 'house' } }],
  });

  it('stays armed until its condition holds', () => {
    const state = { keys: [] };
    const t = createTriggers(condMap, { check: (c) => state.keys.includes(c.hasKey) });
    expect(enterCell(t, 'p1', 2, 1)).toEqual([]);
    enterCell(t, 'p1', 3, 1);
    state.keys.push('house');
    expect(scares(enterCell(t, 'p1', 2, 1))).toEqual(['JS-02']);
  });

  it('rejects a slam trigger that names a missing door', () => {
    const def = { grid: ['#PT#'], keys: [], lockedDoors: [], notes: [], triggers: [{ scare: 'JS-02', door: 'door-9-9' }] };
    expect(() => parseMap(def)).toThrow(/not a door/);
  });
});

describe('Night 1 door slam', () => {
  it('JS-02 is armed only once the house key is held and the parlor door is open', async () => {
    const night1 = (await import('../../shared/maps/night1.js')).default;
    const map = parseMap(night1);
    const slam = map.objects.find((o) => o.type === 'trigger' && o.scare === 'JS-02');
    const world = { open: false, keys: [] };
    const t = createTriggers(map, { check: (c) => world.open && world.keys.includes(c.hasKey) });
    world.open = true;
    expect(enterCell(t, 'p1', slam.x, slam.z)).toEqual([]);
    enterCell(t, 'p1', slam.x + 1, slam.z);
    world.keys.push('house');
    expect(scares(enterCell(t, 'p1', slam.x, slam.z))).toEqual(['JS-02']);
  });
});
