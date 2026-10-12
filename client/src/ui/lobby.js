import { connectToServer } from '../net/socket.js';
import { local } from '../save/storage.js';

const ACCESS_KEY = 'frikiNights.access';

const MESSAGES = {
  'access-denied': 'The house does not know those words.',
  'too-many-attempts': 'Too many wrong guesses. Wait a minute and try again.',
  unreachable: "Can't reach the house. Check your connection and try again.",
};

function show(id) {
  for (const s of document.querySelectorAll('#lobby section')) s.hidden = s.id !== id;
  document.getElementById('lobby').classList.remove('hidden');
}

export function hideLobby() {
  document.getElementById('lobby').classList.add('hidden');
}

// Asks for the access phrase (once; it's remembered) and connects. Keeps asking
// until the server lets us in. Resolves with the connected socket.
export async function connectWithAccess() {
  let phrase = local.get(ACCESS_KEY);
  let error = '';
  for (;;) {
    if (!phrase) phrase = await askPhrase(error);
    try {
      const socket = await connectToServer(phrase);
      local.set(ACCESS_KEY, phrase);
      return socket;
    } catch (err) {
      error = MESSAGES[err.message] ?? MESSAGES.unreachable;
      if (err.message === 'access-denied') local.remove(ACCESS_KEY);
      phrase = err.message === 'access-denied' ? null : phrase;
      if (phrase) await askRetry(error);
    }
  }
}

function askPhrase(error) {
  show('screen-access');
  const form = document.getElementById('access-form');
  const input = document.getElementById('access-input');
  document.getElementById('access-error').textContent = error;
  input.value = '';
  input.focus();
  return new Promise((resolve) => {
    form.onsubmit = (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (value) resolve(value);
    };
  });
}

// Right phrase but the server was unreachable or rate-limited: just offer a retry.
function askRetry(error) {
  show('screen-retry');
  document.getElementById('retry-error').textContent = error;
  return new Promise((resolve) => {
    document.getElementById('retry-button').onclick = resolve;
  });
}
