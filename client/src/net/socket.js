import { io } from 'socket.io-client';

export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3000';

// Opens the game connection with the access phrase in the handshake. Resolves with the
// socket once the server lets us in; rejects with the server's reason
// ('access-denied', 'too-many-attempts') or 'unreachable'.
export function connectToServer(accessPhrase) {
  const socket = io(SERVER_URL, {
    auth: { accessPhrase },
    transports: ['websocket'],
    timeout: 15000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => {
      socket.disconnect();
      const known = ['access-denied', 'too-many-attempts'];
      reject(new Error(known.includes(err.message) ? err.message : 'unreachable'));
    });
  });
}
