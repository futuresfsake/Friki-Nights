export const NAME_MAX_LENGTH = 20;

// Display names: control characters (including newlines and bidi tricks) removed,
// spaces collapsed, 1–20 characters. Returns null if nothing usable is left.
export function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  // Whitespace controls (newline, tab) become spaces first; other controls vanish.
  const name = raw
    .replace(/\s+/g, ' ')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .trim();
  const chars = [...name].slice(0, NAME_MAX_LENGTH).join('').trim();
  return chars.length ? chars : null;
}
