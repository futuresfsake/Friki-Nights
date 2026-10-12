import { describe, expect, it } from 'vitest';
import { formatTime } from '../src/ui/endScreen.js';

describe('end screen time', () => {
  it('shows minutes and zero-padded seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(75.9)).toBe('1:15');
    expect(formatTime(725)).toBe('12:05');
  });
});
