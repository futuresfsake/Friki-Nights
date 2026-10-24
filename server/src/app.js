import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { accessGuard } from './access.js';
import { attachGame } from './game.js';

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
  const game = attachGame(io, { now });

  // Pinged by the lobby to wake Render's free tier ("Waking the house…").
  app.get('/health', (_req, res) => {
    const mem = process.memoryUsage();
    res.type('json').send(JSON.stringify({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      rooms: game.rooms.size,
      memory: { rss: Math.round(mem.rss / 1024 / 1024), heap: Math.round(mem.heapUsed / 1024 / 1024) },
    }));
  });
  io.on('close', game.stop);
  http.on('close', game.stop);

  return { app, http, io, game };
}
