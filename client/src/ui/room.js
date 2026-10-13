import { hashCodeWord } from '../net/codeWord.js';
import { request, saveSeat } from '../net/room.js';
import { showScreen } from './lobby.js';

const ERRORS = {
  'bad-name': 'That name is empty. Go back and pick another.',
  'already-in-room': 'You are already in a room.',
  'room:notfound': 'No room with that code. Check it and try again.',
  'room:full': 'That room is full (4 players).',
  'room:started': 'They have already gone in without you.',
  'not-host': 'Only the host can open the door.',
  'not-ready': 'Not everyone is ready yet.',
  'not-in-room': 'You are not in a room any more.',
  'too-many-attempts': 'Too many tries. Wait a minute and try again.',
  timeout: "The house didn't answer. Try again.",
  unknown: 'Something went wrong. Try again.',
};

const $ = (id) => document.getElementById(id);

// The room part of the lobby: create a room, then wait in it with everyone's names.
// Player names are server-cleaned but still only ever rendered with textContent.
export function createRoomLobby(socket) {
  let view = null; // latest room:update
  let me = null; // our player id

  socket.on('room:update', (v) => {
    view = v;
    render();
  });

  $('copy-code').onclick = () => copyCode();
  $('ready-form').onsubmit = (e) => {
    e.preventDefault();
    toggleReady();
  };

  function render() {
    if (!view || !me) return;
    $('room-code').textContent = view.code;
    const list = $('room-players');
    list.replaceChildren(
      ...view.players.map((p) => {
        const li = document.createElement('li');
        li.textContent = p.name;
        if (p.id === view.hostId) li.append(badge('HOST'));
        if (p.id === me) li.append(badge('YOU'));
        li.append(badge(p.ready ? 'READY' : 'NOT READY', p.ready ? 'ready' : ''));
        return li;
      }),
    );
    const ready = self()?.ready ?? false;
    $('ready-button').textContent = ready ? 'NOT READY' : 'READY';
    $('code-word').disabled = ready;
    const host = view.hostId === me;
    const all = view.players.every((p) => p.ready);
    $('start-button').hidden = !host;
    $('start-button').disabled = !all;
    $('start-hint').textContent = !all
      ? 'Waiting until everyone is ready…'
      : host
        ? view.players.length === 1
          ? 'You are going in alone.'
          : 'Everyone is ready.'
        : 'Waiting for the host to go in…';
  }

  const self = () => view?.players.find((p) => p.id === me);

  async function toggleReady() {
    const error = $('room-error');
    error.textContent = '';
    const word = $('code-word').value;
    const ready = !self()?.ready;
    if (ready && !word.trim()) {
      error.textContent = 'Choose a code word first.';
      return;
    }
    $('ready-button').disabled = true;
    const payload = ready ? { ready, codeWordHash: await hashCodeWord(word) } : { ready };
    const res = await request(socket, 'player:ready', payload);
    $('ready-button').disabled = false;
    if (res.error) error.textContent = ERRORS[res.error] ?? ERRORS.unknown;
  }

  async function copyCode() {
    const button = $('copy-code');
    try {
      await navigator.clipboard.writeText(view.code);
      button.textContent = 'COPIED';
    } catch {
      // No clipboard permission: select the code so Ctrl+C works.
      getSelection()?.selectAllChildren($('room-code'));
      button.textContent = 'PRESS CTRL+C';
    }
    setTimeout(() => (button.textContent = 'COPY'), 1500);
  }

  async function enter(res) {
    if (res.error) {
      $('choice-error').textContent = ERRORS[res.error] ?? ERRORS.unknown;
      return false;
    }
    me = res.playerId;
    saveSeat({ code: res.code, playerId: res.playerId, playerToken: res.playerToken });
    showScreen('screen-room');
    render();
    return true;
  }

  return {
    // Resolves once we are in a room, created by us or joined by code.
    choose(name) {
      showScreen('screen-choice');
      $('choice-error').textContent = '';
      const create = $('create-button');
      const joinForm = $('join-form');
      const codeInput = $('join-code');
      const busy = (on) => {
        for (const b of [create, ...joinForm.querySelectorAll('button')]) b.disabled = on;
      };
      return new Promise((resolve) => {
        const attempt = async (event, payload) => {
          busy(true);
          const ok = await enter(await request(socket, event, payload));
          busy(false);
          if (ok) resolve();
        };
        create.onclick = () => attempt('room:create', { name });
        joinForm.onsubmit = (e) => {
          e.preventDefault();
          const code = codeInput.value.replace(/\s/g, '').toUpperCase();
          if (code) attempt('room:join', { code, name });
        };
      });
    },
    // The host asks the server to start; everyone (host included) goes in on night:start.
    waitForStart() {
      const start = $('start-button');
      start.onclick = async () => {
        start.disabled = true;
        const res = await request(socket, 'night:begin', {});
        if (res.error) {
          $('room-error').textContent = ERRORS[res.error] ?? ERRORS.unknown;
          render();
        }
      };
      return new Promise((resolve) => socket.once('night:start', resolve));
    },
    get view() {
      return view;
    },
    get playerId() {
      return me;
    },
  };
}

function badge(text, extra = '') {
  const span = document.createElement('span');
  span.className = `badge ${extra}`;
  span.textContent = text;
  return span;
}
