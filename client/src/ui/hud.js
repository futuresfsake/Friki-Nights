import { BATTERY_LOW, BATTERY_MAX } from '../../../shared/constants.js';

const TOAST_SECONDS = 2.2;

// All text goes through textContent, never innerHTML (player-provided text later).
export function createHud() {
  const battery = document.getElementById('battery');
  const fill = document.getElementById('battery-fill');
  const overlay = document.getElementById('overlay');
  const overlayPrompt = document.getElementById('overlay-prompt');
  const prompt = document.getElementById('prompt');
  const promptText = document.getElementById('prompt-text');
  const toast = document.getElementById('toast');
  const subtitle = document.getElementById('subtitle');
  let toastTimer = null;
  let subtitleTimer = null;

  return {
    setBattery(level) {
      fill.style.width = `${(level / BATTERY_MAX) * 100}%`;
      battery.classList.toggle('low', level < BATTERY_LOW);
    },
    // null hides the prompt.
    setPrompt(text) {
      if (text && promptText.textContent !== text) promptText.textContent = text;
      prompt.classList.toggle('show', !!text);
    },
    toast(text) {
      toast.textContent = text;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), TOAST_SECONDS * 1000);
    },
    // A line of heard speech ("[whispering] …"), separate from toasts so both can show.
    subtitle(text, seconds = 3.5) {
      subtitle.textContent = text;
      subtitle.classList.add('show');
      clearTimeout(subtitleTimer);
      subtitleTimer = setTimeout(() => subtitle.classList.remove('show'), seconds * 1000);
    },
    showOverlay(paused) {
      overlayPrompt.textContent = paused ? 'PAUSED — CLICK TO RESUME' : 'CLICK TO ENTER';
      overlay.classList.remove('hidden');
      prompt.classList.remove('show');
    },
    // The night's title and short intro, shown on the overlay before entering.
    setIntro(title, text) {
      document.getElementById('overlay-night').textContent = title;
      document.getElementById('overlay-intro').textContent = text;
    },
    hideOverlay() {
      overlay.classList.add('hidden');
    },
    overlay,
  };
}
