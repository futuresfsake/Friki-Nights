import { describe, expect, it } from 'vitest';
import { itemName } from '../src/world/items.js';

describe('item names', () => {
  it('names keys after the door they open', () => {
    expect(itemName({ type: 'key', keyId: 'parlor' })).toBe('Parlor key');
  });

  it('names batteries and notes', () => {
    expect(itemName({ type: 'battery' })).toBe('Battery');
    expect(itemName({ type: 'note' })).toBe('note');
  });
});
