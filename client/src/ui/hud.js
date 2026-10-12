import { BATTERY_LOW, BATTERY_MAX } from '../constants.js';

export function createHud() {
  const battery = document.getElementById('battery');
  const fill = document.getElementById('battery-fill');
  const overlay = document.getElementById('overlay');
  const prompt = document.getElementById('overlay-prompt');

  return {
    setBattery(level) {
      fill.style.width = `${(level / BATTERY_MAX) * 100}%`;
      battery.classList.toggle('low', level < BATTERY_LOW);
    },
    showOverlay(paused) {
      prompt.textContent = paused ? 'PAUSED — CLICK TO RESUME' : 'CLICK TO ENTER';
      overlay.classList.remove('hidden');
    },
    hideOverlay() {
      overlay.classList.add('hidden');
    },
    overlay,
  };
}
