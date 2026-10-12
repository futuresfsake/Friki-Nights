import { afterEach, describe, expect, it } from 'vitest';
import { ACCESS_FAILURES_PER_MINUTE } from '../src/access.js';
import { createRateLimiter } from '../src/rateLimit.js';
import { once, PHRASE, startServer } from './helpers.js';

let server;
afterEach(() => server?.stop());

const attempt = async (phrase) => {
  const socket = server.client({ auth: { accessPhrase: phrase } });
  const result = await Promise.race([
    once(socket, 'connect').then(() => 'connected'),
    once(socket, 'connect_error').then((err) => err.message),
  ]);
  socket.disconnect();
  return result;
};

describe('access phrase', () => {
  it('accepts the right phrase and refuses a wrong or missing one', async () => {
    server = await startServer();
    expect(await attempt(PHRASE)).toBe('connected');
    expect(await attempt('wrong')).toBe('access-denied');
    expect(await attempt(undefined)).toBe('access-denied');
  });

  it('limits wrong guesses per IP, even blocking the right phrase for a while', async () => {
    let t = 0;
    server = await startServer({ now: () => t });
    for (let i = 0; i < ACCESS_FAILURES_PER_MINUTE; i++) expect(await attempt(`guess-${i}`)).toBe('access-denied');
    expect(await attempt(PHRASE)).toBe('too-many-attempts');
    t += 61_000;
    expect(await attempt(PHRASE)).toBe('connected');
  });
});

describe('rate limiter', () => {
  it('allows `limit` hits per window, then refuses until they age out', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(rl.hit('a')).toBe(true);
    expect(rl.hit('a')).toBe(true);
    expect(rl.hit('a')).toBe(false);
    expect(rl.allowed('b')).toBe(true);
    t = 1500;
    expect(rl.allowed('a')).toBe(true);
  });
});
