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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join', (username) => {
    users.set(socket.id, username);
    io.emit('user-joined', { username, userCount: users.size });
    io.emit('user-list', Array.from(users.values()));
    console.log(`${username} joined the chat`);
  });

  socket.on('chat-message', (data) => {
    const username = users.get(socket.id);
    if (!username) return;
    io.emit('chat-message', {
      username,
      message: data.message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing', () => {
    const username = users.get(socket.id);
    if (username) {
      socket.broadcast.emit('typing', { username });
    }
  });

  socket.on('stop-typing', () => {
    const username = users.get(socket.id);
    if (username) {
      socket.broadcast.emit('stop-typing', { username });
    }
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      io.emit('user-left', { username, userCount: users.size });
      io.emit('user-list', Array.from(users.values()));
      console.log(`${username} left the chat`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Friki Nights chat running on http://localhost:${PORT}`);
});
