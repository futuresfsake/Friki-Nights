import { NOTE_MAX_LENGTH } from '../../../shared/mapParser.js';

// The map parser already rejects long notes; this is a second guard, because from
// M3 the text arrives over the network.
export function noteText(text) {
  return String(text ?? '').slice(0, NOTE_MAX_LENGTH);
}

// Full-screen reader. Text only ever goes in through textContent (no HTML).
export function createNoteReader() {
  const reader = document.getElementById('note');
  const body = document.getElementById('note-text');
  let open = false;
  return {
    open(text) {
      body.textContent = noteText(text);
      reader.classList.add('show');
      open = true;
    },
    close() {
      reader.classList.remove('show');
      open = false;
    },
    isOpen: () => open,
  };
}
