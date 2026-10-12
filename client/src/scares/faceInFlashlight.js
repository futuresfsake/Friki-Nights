import * as THREE from 'three';
import { faceTexture } from '../world/textures.js';

const DISTANCE = 1; // metres in front of the eyes
const SHOW_SECONDS = 0.4;

let face = null;

// JS-01: a face appears right in the flashlight beam for 0.4 s, with the scream sting
// and a hard camera shake. A faint glow keeps it visible even with the light off.
export function faceInFlashlight(ctx) {
  face ??= new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.62),
    new THREE.MeshLambertMaterial({ map: faceTexture(), transparent: true, alphaTest: 0.1, emissive: 0x2a2622 }),
  );
  const { camera, scene, effects } = ctx;
  const ahead = new THREE.Vector3(0, -0.05, -DISTANCE).applyQuaternion(camera.quaternion);
  face.position.copy(camera.position).add(ahead);
  face.quaternion.copy(camera.quaternion);
  scene.add(face);
  ctx.sting();
  effects.shake(ctx.now(), 0.5, 0.08);
  setTimeout(() => scene.remove(face), SHOW_SECONDS * 1000);
}
