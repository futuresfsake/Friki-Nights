import { afterEach, describe, expect, it } from 'vitest';
import { MAX_MESSAGE_BYTES } from '../src/app.js';
import { once, ORIGIN, startServer } from './helpers.js';

let server;
afterEach(() => server?.stop());

describe('game server', () => {
  it('answers /health', async () => {
    server = await startServer();
    const res = await fetch(`${server.url}/health`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });

  it('allows CORS only for the client origin', async () => {
    server = await startServer();
    const ok = await fetch(`${server.url}/health`, { headers: { Origin: ORIGIN } });
    expect(ok.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const other = await fetch(`${server.url}/health`, { headers: { Origin: 'http://evil.test' } });
    expect(other.headers.get('access-control-allow-origin')).toBe(null);
  });

  it('accepts sockets from the client origin and refuses others', async () => {
    server = await startServer();
    const good = server.client({ extraHeaders: { Origin: ORIGIN } });
    await once(good, 'connect');
    const bad = server.client({ extraHeaders: { Origin: 'http://evil.test' } });
    await once(bad, 'connect_error');
    expect(bad.connected).toBe(false);
  });

  it('drops a client that sends a message over 16 KB', async () => {
    server = await startServer();
    const socket = server.client();
    await once(socket, 'connect');
    socket.emit('anything', 'x'.repeat(MAX_MESSAGE_BYTES + 1024));
    await once(socket, 'disconnect');
    expect(socket.connected).toBe(false);
  });
});
