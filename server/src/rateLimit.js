// Sliding-window rate limit: at most `limit` hits per key within `windowMs`.
// Keys are IPs, socket ids, "socketId:event", ... `now` is injectable for tests.
export function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const hits = new Map();

  function recent(key) {
    const cutoff = now() - windowMs;
    const list = (hits.get(key) ?? []).filter((t) => t > cutoff);
    if (list.length) hits.set(key, list);
    else hits.delete(key);
    return list;
  }

  return {
    // True if this key may act again (does not count a hit).
    allowed: (key) => recent(key).length < limit,
    // Counts a hit; returns true if it was within the limit.
    hit(key) {
      const list = recent(key);
      list.push(now());
      hits.set(key, list);
      return list.length <= limit;
    },
  };
}

// Render (and most hosts) put the real client IP first in X-Forwarded-For.
export function clientIp(handshake) {
  const forwarded = handshake.headers['x-forwarded-for'];
  return (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) || handshake.address;
}
