import * as THREE from 'three';
import { BATTERY_LOW, BATTERY_MAX } from '../../../shared/constants.js';
import { drainBattery } from './battery.js';
import { blinkFactor, blinkFinished, nextBlinkDelay, startBlink } from './blink.js';

const INTENSITY = 30;

export function createFlashlight(camera, { onToggle }) {
  const spot = new THREE.SpotLight(0xfff1d6, INTENSITY, 20, Math.PI / 7, 0.45, 2);
  // Slightly right of and below the eyes, like a torch held in the hand.
  spot.position.set(0.18, -0.12, 0);
  // Aim from the hand toward a point just below the crosshair, a few metres ahead.
  spot.target.position.set(0.1, -0.25, -4);
  camera.add(spot, spot.target);

  const state = { on: true, battery: BATTERY_MAX };

  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyF' || e.repeat) return;
    if (state.battery <= 0) return;
    state.on = !state.on;
    onToggle(state.on);
  });

  let blink = null;
  let nextBlinkAt = null;

  function update(dt, time, reduceFlashing = false) {
    state.battery = drainBattery(state.battery, state.on, dt);
    if (state.battery <= 0) state.on = false;
    const low = state.battery < BATTERY_LOW;

    if (nextBlinkAt === null) nextBlinkAt = time + nextBlinkDelay(low);
    if (blink && blinkFinished(blink, time)) blink = null;
    if (!blink && time >= nextBlinkAt) {
      nextBlinkAt = time + nextBlinkDelay(low);
      if (state.on && !reduceFlashing) blink = startBlink(time);
    }

    let intensity = state.on ? INTENSITY : 0;
    // A dying battery also dims, warning the player before it goes dark.
    if (low) intensity *= 0.35 + 0.65 * (state.battery / BATTERY_LOW);
    spot.intensity = intensity * blinkFactor(blink, time);
  }

  return { state, update };
}
