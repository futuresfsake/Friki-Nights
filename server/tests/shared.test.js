import { describe, expect, it } from 'vitest';
import { CELL } from '../../shared/constants.js';
import { parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';

// The server reads the very same shared files as the client.
describe('server sees shared code', () => {
  it('parses Night 1 with the shared constants', () => {
    expect(CELL).toBe(2);
    expect(parseMap(night1).id).toBe('night1');
  });
});
