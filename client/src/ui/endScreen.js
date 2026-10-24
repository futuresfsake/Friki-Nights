// 75 → "1:15", 3661 → "1:01:01"
export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function ratingText(notesFound, notesTotal) {
  const ratio = notesTotal > 0 ? notesFound / notesTotal : 0;
  if (ratio >= 1) return 'Every note found. The house has nothing left to hide.';
  if (ratio >= 0.7) return 'Most notes found. The house still holds secrets.';
  if (ratio >= 0.4) return 'Some notes found. There is more to read.';
  return 'Few notes found. The house is full of stories.';
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
      const ratingEl = document.getElementById('end-rating');
      if (ratingEl) ratingEl.textContent = ratingText(notesFound, notesTotal);
      screen.classList.add('show');
    },
  };
}
