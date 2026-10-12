import * as THREE from 'three';
import { BATTERY_LOW, BATTERY_MAX } from '../constants.js';
import { drainBattery } from './battery.js';

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

  function update(dt, time, reduceFlashing = false) {
    state.battery = drainBattery(state.battery, state.on, dt);
    if (state.battery <= 0) state.on = false;

    let intensity = state.on ? INTENSITY : 0;
    // A dying battery stutters, warning the player before it goes dark.
    if (state.on && state.battery < BATTERY_LOW) {
      const weak = 0.35 + 0.65 * (state.battery / BATTERY_LOW);
      intensity *= weak;
      if (!reduceFlashing && Math.sin(time * 37) * Math.sin(time * 11) > 0.92) intensity *= 0.15;
    }
    spot.intensity = intensity;
  }

  return { state, update };
}
