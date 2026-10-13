import { io as connect } from 'socket.io-client';
import { createGameServer } from '../src/app.js';

export const ORIGIN = 'http://game.test';
export const PHRASE = 'test-phrase';

// Starts a game server on a random port; returns its URL and a stop() for afterEach.
export async function startServer(options = {}) {
  const server = createGameServer({ clientOrigin: ORIGIN, accessPhrase: PHRASE, ...options });
  await new Promise((resolve) => server.http.listen(0, resolve));
  const url = `http://localhost:${server.http.address().port}`;
  const sockets = [];
  return {
    ...server,
    url,
    client(opts = {}) {
      const socket = connect(url, {
        transports: ['websocket'],
        forceNew: true,
        reconnection: false,
        auth: { accessPhrase: PHRASE },
        ...opts,
      });
      sockets.push(socket);
      return socket;
    },
    async stop() {
      for (const s of sockets) s.disconnect();
      server.io.close();
      await new Promise((resolve) => server.http.close(resolve));
    },
  };
}

export function once(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

// Emits and waits for the server's acknowledgement.
export function request(socket, event, payload) {
  return socket.timeout(2000).emitWithAck(event, payload);
}
