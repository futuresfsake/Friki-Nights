import { describe, expect, it } from 'vitest';
import { parseMap } from '../../shared/mapParser.js';
import { apply, BATTERY_PICKUP, blocksMovement, createNightState } from '../../shared/nightState.js';

// key-2-1 (house), note-4-1, battery-6-1, fuse-1-3, fuse-3-3, fuseBox-5-3,
// door-4-2 (locked, house), door-4-4 (normal), exit-7-3
const map = parseMap({
  grid: [
    '#########',
    '#PK.N.B.#',
    '####L####',
    '#U.U.F.X#',
    '####D####',
    '#.......#',
    '#########',
  ],
  keys: ['house'],
  lockedDoors: ['house'],
  notes: ['The fuses are in the cellar.'],
  triggers: [],
  fuseBoxKey: 'house',
});

const act = (state, targetId, playerId = 'p1') => apply(state, { type: 'interact', playerId, targetId });
const types = (events) => events.map((e) => e.type);

describe('night state — doors', () => {
  it('toggles a normal door open and closed', () => {
    const s = createNightState(map);
    expect(types(act(s, 'door-4-4'))).toEqual(['door-opened']);
    expect(blocksMovement(s, 'door-4-4')).toBe(false);
    expect(types(act(s, 'door-4-4'))).toEqual(['door-closed']);
    expect(blocksMovement(s, 'door-4-4')).toBe(true);
  });

  it('keeps a locked door shut without the key', () => {
    const s = createNightState(map);
    expect(act(s, 'door-4-2')).toEqual([{ type: 'denied', reason: 'locked', targetId: 'door-4-2' }]);
    expect(blocksMovement(s, 'door-4-2')).toBe(true);
  });

  it('unlocks and opens a locked door with the right key', () => {
    const s = createNightState(map);
    act(s, 'key-2-1');
    expect(types(act(s, 'door-4-2'))).toEqual(['door-unlocked', 'door-opened']);
    expect(s.doors['door-4-2'].locked).toBe(false);
  });

  it('only the player carrying the key can unlock', () => {
    const s = createNightState(map);
    act(s, 'key-2-1', 'p1');
    expect(act(s, 'door-4-2', 'p2')[0].reason).toBe('locked');
  });
});

describe('night state — items', () => {
  it('gives an item to exactly one player', () => {
    const s = createNightState(map);
    expect(act(s, 'key-2-1', 'p1')[0]).toMatchObject({ type: 'item-taken', item: 'key', keyId: 'house' });
    expect(act(s, 'key-2-1', 'p2')[0]).toMatchObject({ type: 'denied', reason: 'already-taken' });
    expect(s.players.p1.keys).toEqual(['house']);
    expect(s.players.p2.keys).toEqual([]);
  });

  it('battery pickups report how much charge they give', () => {
    const s = createNightState(map);
    expect(act(s, 'battery-6-1')[0]).toMatchObject({ item: 'battery', amount: BATTERY_PICKUP });
  });

  it('records notes as read and returns their text', () => {
    const s = createNightState(map);
    expect(act(s, 'note-4-1')[0]).toMatchObject({ type: 'note-read', text: 'The fuses are in the cellar.' });
    expect(s.notesRead.has('note-4-1')).toBe(true);
  });

  it('rejects unknown targets', () => {
    expect(act(createNightState(map), 'nope')[0]).toMatchObject({ type: 'denied', reason: 'unknown-target' });
  });
});

describe('night state — fuse box and exit', () => {
  it('needs the key to open the fuse box', () => {
    const s = createNightState(map);
    expect(act(s, 'fuseBox-5-3')[0].reason).toBe('locked');
    act(s, 'key-2-1');
    expect(types(act(s, 'fuseBox-5-3'))).toEqual(['fusebox-unlocked']);
  });

  it('needs fuses once open', () => {
    const s = createNightState(map);
    act(s, 'key-2-1');
    act(s, 'fuseBox-5-3');
    expect(act(s, 'fuseBox-5-3')[0].reason).toBe('need-fuses');
  });

  it('turns the power on and unlocks the exit after the last fuse', () => {
    const s = createNightState(map);
    act(s, 'key-2-1');
    act(s, 'fuseBox-5-3');
    act(s, 'fuse-1-3');
    act(s, 'fuse-3-3');
    expect(act(s, 'fuseBox-5-3')[0]).toMatchObject({ type: 'fuse-placed', placed: 1, needed: 2 });
    expect(s.power).toBe(false);
    expect(types(act(s, 'fuseBox-5-3'))).toEqual(['fuse-placed', 'power-on', 'exit-unlocked']);
    expect(s.power).toBe(true);
    expect(s.exitOpen).toBe(true);
  });

  it('keeps the exit sealed until the power is on', () => {
    const s = createNightState(map);
    expect(act(s, 'exit-7-3')[0].reason).toBe('exit-sealed');
    expect(apply(s, { type: 'reach-exit', playerId: 'p1' })[0].reason).toBe('exit-sealed');
    expect(blocksMovement(s, 'exit-7-3')).toBe(true);
  });

  it('completes the night at the open exit and then ignores actions', () => {
    const s = createNightState(map);
    s.exitOpen = true;
    expect(types(apply(s, { type: 'reach-exit', playerId: 'p1' }))).toEqual(['night-complete']);
    expect(act(s, 'door-4-4')[0].reason).toBe('night-over');
  });

  it('starts with the exit open when the map has no fuse box', () => {
    const s = createNightState(parseMap({ grid: ['#####', '#P.X#', '#####'], keys: [], lockedDoors: [], notes: [], triggers: [] }));
    expect(s.exitOpen).toBe(true);
  });
});
