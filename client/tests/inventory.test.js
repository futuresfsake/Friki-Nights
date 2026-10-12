import { describe, expect, it } from 'vitest';
import { inventoryLines } from '../src/ui/inventory.js';

describe('inventory', () => {
  it('lists keys and counts fuses', () => {
    expect(inventoryLines({ keys: ['parlor', 'house'], fuses: 2 })).toEqual(['Parlor key', 'House key', 'Fuse ×2']);
    expect(inventoryLines({ keys: [], fuses: 1 })).toEqual(['Fuse']);
  });

  it('is empty for a player who has picked nothing up', () => {
    expect(inventoryLines(undefined)).toEqual([]);
    expect(inventoryLines({ keys: [], fuses: 0 })).toEqual([]);
  });
});
