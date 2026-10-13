import { afterEach, describe, expect, it } from 'vitest';
import { clearSeat, loadSeat, saveSeat } from '../src/net/room.js';

function fakeStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
}

afterEach(() => delete globalThis.sessionStorage);

describe('room seat (code + playerToken)', () => {
  it('is saved in sessionStorage and read back', () => {
    globalThis.sessionStorage = fakeStorage();
    saveSeat({ code: 'ABCDEF', playerId: 'p1', playerToken: 'secret' });
    expect(loadSeat()).toEqual({ code: 'ABCDEF', playerId: 'p1', playerToken: 'secret' });
    clearSeat();
    expect(loadSeat()).toBe(null);
  });

  it('ignores missing storage and garbage', () => {
    expect(loadSeat()).toBe(null);
    globalThis.sessionStorage = fakeStorage();
    globalThis.sessionStorage.setItem('frikiNights.seat', '{nope');
    expect(loadSeat()).toBe(null);
  });
});
