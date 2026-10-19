const socket = io();

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const joinForm = document.getElementById('join-form');
const usernameInput = document.getElementById('username-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');
const userList = document.getElementById('user-list');
const userCount = document.getElementById('user-count');
const typingIndicator = document.getElementById('typing-indicator');

let currentUser = '';
let typingTimeout = null;

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  currentUser = username;
  socket.emit('join', username);

  joinScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  messageInput.focus();
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;

  socket.emit('chat-message', { message });
  socket.emit('stop-typing');
  messageInput.value = '';
  messageInput.focus();
});

messageInput.addEventListener('input', () => {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing');
  }, 1500);
});

socket.on('chat-message', (data) => {
  const isOwn = data.username === currentUser;
  const msgEl = document.createElement('div');
  msgEl.className = `message ${isOwn ? 'own' : 'other'}`;

  const time = new Date(data.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  msgEl.innerHTML = `
    <div class="msg-author">${escapeHtml(data.username)}</div>
    <div class="msg-text">${escapeHtml(data.message)}</div>
    <div class="msg-time">${time}</div>
  `;

  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('user-joined', (data) => {
  addSystemMessage(`${data.username} joined the chat`);
  userCount.textContent = `${data.userCount} online`;
});

socket.on('user-left', (data) => {
  addSystemMessage(`${data.username} left the chat`);
  userCount.textContent = `${data.userCount} online`;
});

socket.on('user-list', (users) => {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.textContent = user;
    userList.appendChild(li);
  });
});

const typingUsers = new Set();

socket.on('typing', (data) => {
  typingUsers.add(data.username);
  updateTypingIndicator();
});

socket.on('stop-typing', (data) => {
  typingUsers.delete(data.username);
  updateTypingIndicator();
});

function updateTypingIndicator() {
  if (typingUsers.size === 0) {
    typingIndicator.classList.add('hidden');
    return;
  }
  typingIndicator.classList.remove('hidden');
  const names = Array.from(typingUsers);
  if (names.length === 1) {
    typingIndicator.textContent = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    typingIndicator.textContent = `${names[0]} and ${names[1]} are typing...`;
  } else {
    typingIndicator.textContent = 'Several people are typing...';
  }
}

function addSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'system-msg';
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
