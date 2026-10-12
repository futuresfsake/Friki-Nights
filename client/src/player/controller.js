import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EYE_HEIGHT, PLAYER_RADIUS, RUN_SPEED, STEP_LENGTH, WALK_SPEED } from '../constants.js';
import { cellCenter } from '../world/map.js';
import { moveWithCollision } from './collision.js';

const BOB_HEIGHT = 0.045;

export function createController(camera, domElement, map, { onStep }) {
  const controls = new PointerLockControls(camera, domElement);
  const keys = new Set();
  const spawn = cellCenter(map.spawn.x, map.spawn.z);
  camera.position.set(spawn.x, EYE_HEIGHT, spawn.z);

  // Matches the physical key, so WASD works on any keyboard layout.
  addEventListener('keydown', (e) => keys.add(e.code));
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let stepPhase = 0;
  let bob = 0;

  function update(dt) {
    if (!controls.isLocked) return;

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, up);

    let ix = 0;
    let iz = 0;
    if (keys.has('KeyW')) iz += 1;
    if (keys.has('KeyS')) iz -= 1;
    if (keys.has('KeyD')) ix += 1;
    if (keys.has('KeyA')) ix -= 1;
    const running = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = running ? RUN_SPEED : WALK_SPEED;

    let dx = 0;
    let dz = 0;
    if (ix || iz) {
      const len = Math.hypot(ix, iz);
      dx = ((forward.x * iz + right.x * ix) / len) * speed * dt;
      dz = ((forward.z * iz + right.z * ix) / len) * speed * dt;
    }

    const before = { x: camera.position.x, z: camera.position.z };
    const after = moveWithCollision(map, before, dx, dz, PLAYER_RADIUS);
    camera.position.x = after.x;
    camera.position.z = after.z;
    const moved = Math.hypot(after.x - before.x, after.z - before.z);

    // One bob cycle per two steps; a footstep plays at each low point.
    if (moved > 0) {
      const prev = stepPhase;
      stepPhase += (moved / STEP_LENGTH) * Math.PI;
      if (Math.floor(stepPhase / Math.PI) !== Math.floor(prev / Math.PI)) onStep(running);
      bob = Math.min(1, bob + dt * 6);
    } else {
      bob = Math.max(0, bob - dt * 4);
    }
    camera.position.y = EYE_HEIGHT - Math.abs(Math.sin(stepPhase)) * BOB_HEIGHT * bob;
  }

  return { controls, update, keys };
}
