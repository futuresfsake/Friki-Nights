import { describe, expect, it } from 'vitest';
import { cleanName, NAME_MAX_LENGTH } from '../../shared/names.js';

describe('display names', () => {
  it('keeps normal names', () => {
    expect(cleanName('Chelsea')).toBe('Chelsea');
    expect(cleanName('  Ana  María ')).toBe('Ana María');
  });

  it('strips control and formatting characters', () => {
    expect(cleanName('Ev\u0000il\n\u202Eman')).toBe('Evil man');
  });

  it('cuts to 20 characters without splitting emoji', () => {
    expect(cleanName('x'.repeat(30))).toHaveLength(NAME_MAX_LENGTH);
    expect([...cleanName('🙂'.repeat(25))]).toHaveLength(NAME_MAX_LENGTH);
  });

  it('rejects empty or non-text names', () => {
    expect(cleanName('   ')).toBe(null);
    expect(cleanName('\u0007')).toBe(null);
    expect(cleanName(42)).toBe(null);
  });
});
