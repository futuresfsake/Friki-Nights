import * as THREE from 'three';

// JS-09: every light snaps off at once. In the dark, something giggles
// right behind you, close enough that you feel it could touch your neck.
export function blackoutGiggleScare(ctx) {
  const now = ctx.now();
  ctx.effects.blackout(now, 3);
  ctx.effects.shake(now, 0.15, 0.02);
  setTimeout(() => {
    const back = new THREE.Vector3(0, 0, 1.5).applyQuaternion(ctx.camera.quaternion);
    ctx.giggle?.(ctx.camera.position.x + back.x, ctx.camera.position.z + back.z);
  }, 800);
}
