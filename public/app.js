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
let windowFocused = true;

let unreadCount = 0;
const originalTitle = document.title;

window.addEventListener('focus', () => {
  windowFocused = true;
  unreadCount = 0;
  document.title = originalTitle;
});
window.addEventListener('blur', () => { windowFocused = false; });

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playNotificationSound() {
  if (windowFocused) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.3);
}

const scrollBottomBtn = document.getElementById('scroll-bottom-btn');

messagesDiv.addEventListener('scroll', () => {
  const distFromBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight;
  scrollBottomBtn.classList.toggle('hidden', distFromBottom < 100);
});

scrollBottomBtn.addEventListener('click', () => {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  scrollBottomBtn.classList.add('hidden');
});

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

function getInitials(name) {
  return name.charAt(0).toUpperCase();
}

socket.on('chat-message', (data) => {
  const isOwn = data.username === currentUser;
  const msgEl = document.createElement('div');
  msgEl.className = `message ${isOwn ? 'own' : 'other'}`;

  const time = new Date(data.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const avatarColor = data.color || '#7c3aed';
  const initial = getInitials(data.username);

  msgEl.innerHTML = `
    <div class="msg-row ${isOwn ? 'msg-row-own' : ''}">
      ${!isOwn ? `<div class="avatar" style="background:${avatarColor}">${initial}</div>` : ''}
      <div class="msg-bubble">
        <div class="msg-author">${escapeHtml(data.username)}</div>
        <div class="msg-text">${linkifyUrls(convertEmojis(escapeHtml(data.message)))}</div>
        <div class="msg-time">${time}</div>
      </div>
      ${isOwn ? `<div class="avatar" style="background:${avatarColor}">${initial}</div>` : ''}
    </div>
  `;

  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (!isOwn) {
    playNotificationSound();
    if (!windowFocused) {
      unreadCount++;
      document.title = `(${unreadCount}) ${originalTitle}`;
    }
  }
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
    const name = typeof user === 'object' ? user.username : user;
    const color = typeof user === 'object' ? user.color : '#7c3aed';
    li.innerHTML = `<span class="avatar-sm" style="background:${color}">${getInitials(name)}</span> ${escapeHtml(name)}`;
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

const EMOJI_MAP = {
  ':)': '\u{1F642}', ':-)': '\u{1F642}', ':D': '\u{1F604}', ':-D': '\u{1F604}',
  ':(': '\u{1F641}', ':-(': '\u{1F641}', ';)': '\u{1F609}', ';-)': '\u{1F609}',
  ':P': '\u{1F61B}', ':-P': '\u{1F61B}', ':O': '\u{1F62E}', ':-O': '\u{1F62E}',
  '<3': '\u{2764}\u{FE0F}', 'XD': '\u{1F606}', 'xD': '\u{1F606}',
  ':fire:': '\u{1F525}', ':heart:': '\u{2764}\u{FE0F}', ':star:': '\u{2B50}',
  ':thumbsup:': '\u{1F44D}', ':thumbsdown:': '\u{1F44E}', ':clap:': '\u{1F44F}',
  ':laugh:': '\u{1F602}', ':cry:': '\u{1F622}', ':angry:': '\u{1F620}',
  ':cool:': '\u{1F60E}', ':thinking:': '\u{1F914}', ':rocket:': '\u{1F680}',
  ':wave:': '\u{1F44B}', ':100:': '\u{1F4AF}', ':eyes:': '\u{1F440}',
  ':skull:': '\u{1F480}', ':ghost:': '\u{1F47B}', ':alien:': '\u{1F47D}',
  ':robot:': '\u{1F916}', ':game:': '\u{1F3AE}', ':trophy:': '\u{1F3C6}',
  ':pizza:': '\u{1F355}', ':beer:': '\u{1F37A}', ':party:': '\u{1F389}',
  ':moon:': '\u{1F319}', ':sun:': '\u{2600}\u{FE0F}', ':gg:': '\u{1F3AE}\u{1F44D}',
  ':lol:': '\u{1F602}', ':brb:': '\u{1F3C3}', ':nerd:': '\u{1F913}',
  ':check:': '\u{2705}', ':x:': '\u{274C}', ':poop:': '\u{1F4A9}'
};

function convertEmojis(text) {
  let result = text;
  for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
    result = result.split(code).join(emoji);
  }
  return result;
}

function linkifyUrls(text) {
  return text.replace(
    /(https?:\/\/[^\s<>"']+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
  );
}
