// 75 → "1:15"
export function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Simple end-of-night screen; the full summary with XP comes in M6.
export function createEndScreen({ onPlayAgain }) {
  const screen = document.getElementById('end');
  document.getElementById('end-again').addEventListener('click', onPlayAgain);
  return {
    show({ title, seconds, notesFound, notesTotal }) {
      document.getElementById('end-title').textContent = title;
      document.getElementById('end-time').textContent = formatTime(seconds);
      document.getElementById('end-notes').textContent = `${notesFound} / ${notesTotal}`;
      screen.classList.add('show');
    },
  };
}
