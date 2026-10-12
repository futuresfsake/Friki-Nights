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
