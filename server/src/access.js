import { createHash, timingSafeEqual } from 'node:crypto';
import { clientIp, createRateLimiter } from './rateLimit.js';

export const ACCESS_FAILURES_PER_MINUTE = 5;

// Compares fixed-length digests so the time taken leaks nothing about the phrase.
function samePhrase(a, b) {
  const digest = (s) => createHash('sha256').update(String(s)).digest();
  return timingSafeEqual(digest(a), digest(b));
}

// Socket.IO middleware: only people who know the shared phrase may connect.
// Wrong guesses are limited per IP; once over the limit even the right phrase waits.
export function accessGuard(accessPhrase, { now } = {}) {
  const failures = createRateLimiter({ limit: ACCESS_FAILURES_PER_MINUTE, windowMs: 60_000, now });
  return (socket, next) => {
    const ip = clientIp(socket.handshake);
    if (!failures.allowed(ip)) return next(new Error('too-many-attempts'));
    if (samePhrase(socket.handshake.auth?.accessPhrase ?? '', accessPhrase)) return next();
    failures.hit(ip);
    next(new Error('access-denied'));
  };
}
