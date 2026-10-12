// Flashlight blinking: every so often the torch stutters off and on a few times,
// so even a full battery never feels fully reliable. Pure logic, no Three.js.

export const BLINK_STEP = 0.07; // seconds per off/on half-cycle

// Seconds until the next blink burst; a weak battery blinks far more often.
export function nextBlinkDelay(lowBattery, rand = Math.random) {
  return lowBattery ? 1.5 + rand() * 3 : 7 + rand() * 11;
}

export function startBlink(time, rand = Math.random) {
  return { start: time, count: 2 + Math.floor(rand() * 4) };
}

// 1 = full light, small value = blinked off. Off and on alternate every BLINK_STEP.
export function blinkFactor(blink, time) {
  if (!blink) return 1;
  const elapsed = time - blink.start;
  if (elapsed < 0 || elapsed >= blink.count * 2 * BLINK_STEP) return 1;
  return Math.floor(elapsed / BLINK_STEP) % 2 === 0 ? 0.08 : 1;
}

export function blinkFinished(blink, time) {
  return time - blink.start >= blink.count * 2 * BLINK_STEP;
}
