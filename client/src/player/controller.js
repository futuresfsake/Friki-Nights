import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EYE_HEIGHT, PLAYER_RADIUS, RUN_SPEED, STEP_LENGTH, WALK_SPEED } from '../../../shared/constants.js';
import { cellCenter } from '../../../shared/mapParser.js';
import { moveWithCollision } from './collision.js';

const BOB_HEIGHT = 0.045;
const CRAWL_RATE = 8; // how quickly the camera slides under a bed and back out

export function createController(camera, domElement, map, { onStep, extraSolid }) {
  const controls = new PointerLockControls(camera, domElement);
  const keys = new Set();
  const spawn = cellCenter(map.spawns[0].x, map.spawns[0].z);
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
  // While set, WASD is ignored and the camera slides to this spot (hiding under a bed).
  // release: let go once the camera has arrived (crawling back out).
  let pin = null;

  function update(dt) {
    if (!controls.isLocked) return;
    if (pin) {
      const k = 1 - Math.exp(-CRAWL_RATE * dt);
      camera.position.x += (pin.x - camera.position.x) * k;
      camera.position.y += (pin.y - camera.position.y) * k;
      camera.position.z += (pin.z - camera.position.z) * k;
      if (pin.release && camera.position.distanceTo(pin) < 0.02) {
        camera.position.copy(pin);
        pin = null;
      }
      return;
    }

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
    const after = moveWithCollision(map, before, dx, dz, PLAYER_RADIUS, extraSolid);
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

  return {
    controls,
    update,
    keys,
    // Puts the player on their spawn point (from the server's night:start).
    placeAt(x, z) {
      pin = null;
      camera.position.set(x, EYE_HEIGHT, z);
    },
    // Crawl under a bed; returns where the player stood, to crawl back out to.
    hideAt(spot) {
      const stood = new THREE.Vector3(camera.position.x, EYE_HEIGHT, camera.position.z);
      pin = new THREE.Vector3(spot.x, spot.y, spot.z);
      bob = 0;
      return stood;
    },
    // True while sliding under a bed or back out; WASD does nothing meanwhile.
    crawling: () => pin !== null,
    standAt(spot) {
      pin = new THREE.Vector3(spot.x, EYE_HEIGHT, spot.z);
      pin.release = true;
    },
  };
}
