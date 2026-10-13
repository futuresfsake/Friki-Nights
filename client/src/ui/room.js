import { request, saveSeat } from '../net/room.js';
import { showScreen } from './lobby.js';

const ERRORS = {
  'bad-name': 'That name is empty. Go back and pick another.',
  'already-in-room': 'You are already in a room.',
  'room:notfound': 'No room with that code. Check it and try again.',
  'room:full': 'That room is full (4 players).',
  'room:started': 'They have already gone in without you.',
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
        return li;
      }),
    );
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
    // Until the server starts nights (M3-S08), the room screen just lets us in.
    waitForStart() {
      return new Promise((resolve) => ($('start-button').onclick = resolve));
    },
    get view() {
      return view;
    },
    get playerId() {
      return me;
    },
  };
}

function badge(text) {
  const span = document.createElement('span');
  span.className = 'badge';
  span.textContent = text;
  return span;
}
