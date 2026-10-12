// localStorage / sessionStorage can be missing or throw (private windows, blocked
// site data), so every access is wrapped; the game still works without them.
function safe(store) {
  return {
    get(key) {
      try {
        return globalThis[store]?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        globalThis[store]?.setItem(key, value);
      } catch {
        // Not saved; the player will be asked again next time.
      }
    },
    remove(key) {
      try {
        globalThis[store]?.removeItem(key);
      } catch {
        // Nothing to remove.
      }
    },
  };
}

export const local = safe('localStorage');
export const session = safe('sessionStorage');
