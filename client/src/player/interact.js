import * as THREE from 'three';
import { INTERACT_DISTANCE } from '../../../shared/constants.js';

const CENTER = new THREE.Vector2(0, 0);

// Finds what the crosshair is pointing at. Walls are included in the ray test so
// nothing can be used through a wall: only a target hit before any wall counts.
export function createInteraction(camera, { blockers, targets }) {
  const ray = new THREE.Raycaster();
  ray.far = INTERACT_DISTANCE;

  return {
    lookTarget() {
      ray.setFromCamera(CENTER, camera);
      const hit = ray.intersectObjects([...blockers, ...targets()], false)[0];
      return hit?.object.userData.targetId ?? null;
    },
  };
}
