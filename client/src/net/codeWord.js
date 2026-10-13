// Code words are compared in Night 4 to tell a teammate from something pretending to
// be one. Only the hash is ever sent; trimmed and lower-cased so "Moonlight " matches.
export function normalizeCodeWord(word) {
  return word.trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function hashCodeWord(word) {
  const bytes = new TextEncoder().encode(normalizeCodeWord(word));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
