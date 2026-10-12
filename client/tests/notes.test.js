import { describe, expect, it } from 'vitest';
import { NOTE_MAX_LENGTH } from '../../shared/mapParser.js';
import { noteText } from '../src/ui/notes.js';

describe('note text', () => {
  it('cuts text to the maximum length', () => {
    expect(noteText('x'.repeat(NOTE_MAX_LENGTH + 50))).toHaveLength(NOTE_MAX_LENGTH);
    expect(noteText('Short.')).toBe('Short.');
  });

  it('turns missing text into an empty note', () => {
    expect(noteText(undefined)).toBe('');
  });
});
