import { describe, expect, it } from 'vitest';
import { hashCodeWord } from '../src/net/codeWord.js';

describe('code word hash', () => {
  it('is the SHA-256 hex of the trimmed, lower-cased word', async () => {
    const moonlight = 'a22925b9c393ad6cfb3dec3997000e06e38a0ede0bad351603daa6922713dfa5';
    expect(await hashCodeWord('moonlight')).toBe(moonlight);
    expect(await hashCodeWord('  MoonLight ')).toBe(moonlight);
    expect(await hashCodeWord('moonlight')).not.toBe(await hashCodeWord('sunlight'));
  });

  it('never contains the word itself', async () => {
    expect(await hashCodeWord('secret')).not.toContain('secret');
  });
});
