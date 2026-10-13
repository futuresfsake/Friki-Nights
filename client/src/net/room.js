import { session } from '../save/storage.js';

const SEAT_KEY = 'frikiNights.seat';

// Emits and resolves with the server's reply; a lost connection or a silent server
// becomes { error: 'timeout' } instead of hanging the lobby.
export function request(socket, event, payload, timeoutMs = 10000) {
  return socket
    .timeout(timeoutMs)
    .emitWithAck(event, payload)
    .catch(() => ({ error: 'timeout' }));
}

// Our seat in a room: the code plus the secret playerToken that lets us back in.
// sessionStorage, so it survives a reload of this tab but is never shared with other tabs.
export function saveSeat(seat) {
  session.set(SEAT_KEY, JSON.stringify(seat));
}

export function loadSeat() {
  try {
    const seat = JSON.parse(session.get(SEAT_KEY));
    return seat?.code && seat?.playerToken ? seat : null;
  } catch {
    return null;
  }
}

export function clearSeat() {
  session.remove(SEAT_KEY);
}
