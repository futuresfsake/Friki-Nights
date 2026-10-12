import * as THREE from 'three';
import { WALL_HEIGHT } from '../../../shared/constants.js';
import { cellCenter } from '../../../shared/mapParser.js';

const BASE_INTENSITY = 6;

export function createCeilingLights(map, scene) {
  const bulbGeometry = new THREE.SphereGeometry(0.08, 6, 4);
  return map.lights.map(({ x, z }) => {
    const pos = cellCenter(x, z);
    const light = new THREE.PointLight(0xffa860, BASE_INTENSITY, 9, 2);
    light.position.set(pos.x, WALL_HEIGHT - 0.35, pos.z);
    const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.copy(light.position);
    scene.add(light, bulb);
    return { light, bulbMaterial, offUntil: 0, nextFlicker: Math.random() * 6 };
  });
}

// Mostly steady with a faint hum, plus random short drop-outs so the house never feels safe.
// reduceFlashing (M8 setting) keeps only the gentle hum.
export function updateCeilingLights(lights, time, reduceFlashing = false) {
  for (const l of lights) {
    if (!reduceFlashing && time >= l.nextFlicker) {
      l.offUntil = time + 0.05 + Math.random() * 0.25;
      l.nextFlicker = time + 2 + Math.random() * 10;
    }
    const off = time < l.offUntil;
    const hum = 0.9 + 0.1 * Math.sin(time * 13 + l.light.position.x);
    l.light.intensity = off ? 0 : BASE_INTENSITY * hum;
    l.bulbMaterial.color.setHex(off ? 0x221a10 : 0xffd9a0);
  }
}
