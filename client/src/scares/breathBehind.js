import * as THREE from 'three';

// JS-08: slow, wet breathing from right behind you — close enough to feel on
// your neck. You turn around. Nothing's there. A beat later the flashlight
// stutters, just for a moment.
export function breathBehindScare(ctx) {
  const back = new THREE.Vector3(0, 0, 1.2).applyQuaternion(ctx.camera.quaternion);
  ctx.breathe?.(
    ctx.camera.position.x + back.x,
    ctx.camera.position.z + back.z,
    4,
  );
  ctx.effects.flicker(ctx.now() + 2, 0.3);
}
