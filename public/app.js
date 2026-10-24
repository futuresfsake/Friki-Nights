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
  if (windowFocused || !soundEnabled) return;
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
const themeToggle = document.getElementById('theme-toggle');
const soundToggle = document.getElementById('sound-toggle');

let soundEnabled = true;
try {
  const saved = localStorage.getItem('friki-sound');
  if (saved === 'false') {
    soundEnabled = false;
    soundToggle.innerHTML = '&#128263;';
    soundToggle.classList.add('muted');
  }
} catch (e) {}

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.innerHTML = soundEnabled ? '&#128264;' : '&#128263;';
  soundToggle.classList.toggle('muted', !soundEnabled);
  try { localStorage.setItem('friki-sound', soundEnabled); } catch (e) {}
});

(function initTheme() {
  try {
    const saved = localStorage.getItem('friki-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  } catch (e) {}
})();

const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('open');
});

sidebarOverlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
});

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  themeToggle.innerHTML = next === 'light' ? '&#9728;' : '&#9789;';
  try { localStorage.setItem('friki-theme', next); } catch (e) {}
});

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

const SLASH_COMMANDS = {
  '/shrug': String.raw`¯\_(ツ)_/¯`,
  '/tableflip': '(╯°□°)╯︵ ┻━┻',
  '/unflip': '┬─┬ ノ( ゜-゜ノ)',
  '/lenny': '( ͡° ͜ʖ ͡°)',
  '/disapproval': 'ಠ_ಠ',
  '/sparkles': '✨✨✨',
  '/fight': '(ง •_•)ง',
  '/bear': 'ʕ•ᴥ•ʔ',
};

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let message = messageInput.value.trim();
  if (!message) return;

  for (const [cmd, replacement] of Object.entries(SLASH_COMMANDS)) {
    if (message.startsWith(cmd)) {
      const rest = message.slice(cmd.length).trim();
      message = rest ? `${rest} ${replacement}` : replacement;
      break;
    }
  }

  socket.emit('chat-message', { message });
  socket.emit('stop-typing');
  messageInput.value = '';
  charCount.textContent = '0/1000';
  charCount.classList.remove('warning', 'danger');
  messageInput.focus();
});

const charCount = document.getElementById('char-count');

messageInput.addEventListener('input', () => {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing');
  }, 1500);

  const len = messageInput.value.length;
  charCount.textContent = `${len}/1000`;
  charCount.classList.toggle('warning', len > 800 && len <= 950);
  charCount.classList.toggle('danger', len > 950);
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    messageInput.value = '';
    charCount.textContent = '0/1000';
    charCount.classList.remove('warning', 'danger');
    socket.emit('stop-typing');
  }
});

function getInitials(name) {
  return name.charAt(0).toUpperCase();
}

let lastMessageDate = '';

function addDateSeparator(timestamp) {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  if (dateStr === lastMessageDate) return;
  lastMessageDate = dateStr;
  const sep = document.createElement('div');
  sep.className = 'date-separator';
  sep.innerHTML = `<span>${dateStr}</span>`;
  messagesDiv.appendChild(sep);
}

socket.on('chat-message', (data) => {
  const isOwn = data.username === currentUser;
  const msgEl = document.createElement('div');
  msgEl.className = `message ${isOwn ? 'own' : 'other'}`;

  const time = new Date(data.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  addDateSeparator(data.timestamp);
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

const connectionStatus = document.getElementById('connection-status');

socket.on('connect', () => {
  connectionStatus.className = 'status-connected';
  connectionStatus.title = 'Connected';
});

socket.on('disconnect', () => {
  connectionStatus.className = 'status-disconnected';
  connectionStatus.title = 'Disconnected';
});

socket.io.on('reconnect_attempt', () => {
  connectionStatus.className = 'status-reconnecting';
  connectionStatus.title = 'Reconnecting...';
});
