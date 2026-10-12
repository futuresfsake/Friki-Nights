import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { accessGuard } from './access.js';

export const MAX_MESSAGE_BYTES = 16 * 1024;

// Builds the HTTP + Socket.IO server without listening, so tests can start it on a
// random port. Only the game's own site (clientOrigin) may talk to it.
export function createGameServer({ clientOrigin, accessPhrase, now }) {
  if (!accessPhrase) throw new Error('An access phrase is required');
  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    if (req.headers.origin === clientOrigin) res.set('Access-Control-Allow-Origin', clientOrigin);
    next();
  });

  // Pinged by the lobby to wake Render's free tier ("Waking the house…").
  app.get('/health', (_req, res) => res.type('text').send('ok'));

  const http = createServer(app);
  const io = new Server(http, {
    cors: { origin: clientOrigin },
    maxHttpBufferSize: MAX_MESSAGE_BYTES,
    // CORS alone doesn't stop WebSocket connections, so check the origin here too.
    // Non-browser clients (tests, tools) send no Origin and still need the access phrase.
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      callback(null, !origin || origin === clientOrigin);
    },
  });

  io.use(accessGuard(accessPhrase, { now }));

  return { app, http, io };
}
