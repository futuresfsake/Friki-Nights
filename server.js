const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();
const rateLimits = new Map();

const RATE_LIMIT_WINDOW = 5000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(socketId) {
  const now = Date.now();
  if (!rateLimits.has(socketId)) {
    rateLimits.set(socketId, []);
  }
  const timestamps = rateLimits.get(socketId).filter(t => now - t < RATE_LIMIT_WINDOW);
  timestamps.push(now);
  rateLimits.set(socketId, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

const AVATAR_COLORS = [
  '#7c3aed', '#e11d48', '#0891b2', '#059669', '#d97706',
  '#7c2d12', '#4338ca', '#be185d', '#0d9488', '#ca8a04',
  '#6d28d9', '#dc2626', '#0284c7', '#16a34a', '#ea580c'
];

function assignColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join', (username) => {
    if (!username || typeof username !== 'string') return;
    username = username.trim().slice(0, 20);
    if (!username) return;
    const color = assignColor(username);
    users.set(socket.id, { username, color });
    io.emit('user-joined', { username, color, userCount: users.size });
    io.emit('user-list', Array.from(users.values()));
    console.log(`${username} joined the chat`);
  });

  socket.on('chat-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    if (!data.message || typeof data.message !== 'string') return;
    if (isRateLimited(socket.id)) {
      socket.emit('rate-limited', { message: 'Slow down! Too many messages.' });
      return;
    }
    const message = data.message.trim().slice(0, 1000);
    if (!message) return;
    io.emit('chat-message', {
      username: user.username,
      color: user.color,
      message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('typing', { username: user.username });
    }
  });

  socket.on('stop-typing', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('stop-typing', { username: user.username });
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      rateLimits.delete(socket.id);
      io.emit('user-left', { username: user.username, userCount: users.size });
      io.emit('user-list', Array.from(users.values()));
      console.log(`${user.username} left the chat`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Friki Nights chat running on http://localhost:${PORT}`);
});
