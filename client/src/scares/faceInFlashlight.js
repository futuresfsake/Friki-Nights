import * as THREE from 'three';
import { ghostFaceTexture } from '../world/textures.js';

// JS-01, when you take the parlor key. The flashlight stutters and something breathes
// right in front of you. When the light steadies there's a head in the beam, a couple of
// metres off: long wet black hair, empty eyes, staring. Then it lunges into the lens,
// jaw dropping open, screaming, with a red flash and the hardest shake in the game. The
// light dies. When it comes back, something giggles behind you.

// The script, in seconds from the start. Pure, so it can be tested.
export const FACE = {
  flicker: 0.7, // the light stutters; breathing in front of you
  stare: 0.45, // then the head is just there, still, watching
  lunge: 0.14, // into the lens
  hold: 0.7, // screaming in your face
  dark: 1.1, // the light dies
  giggleAfter: 0.5, // after the light comes back
  far: 2.3, // metres in front of the eyes while it stares
  near: 0.33, // metres when it's in your face
};
const STARE_AT = FACE.flicker;
const LUNGE_AT = STARE_AT + FACE.stare;
const SCREAM_AT = LUNGE_AT + FACE.lunge;
const DARK_AT = SCREAM_AT + FACE.hold;
export const FACE_SECONDS = DARK_AT + FACE.dark + FACE.giggleAfter;

// Where the head is and what it's doing t seconds into the scare.
export function faceAt(t) {
  if (t < STARE_AT || t >= DARK_AT) return { visible: false };
  if (t < LUNGE_AT) return { visible: true, distance: FACE.far, open: false, shake: 0 };
  if (t < SCREAM_AT) {
    const f = (t - LUNGE_AT) / FACE.lunge;
    return { visible: true, distance: FACE.far + (FACE.near - FACE.far) * f * f, open: f > 0.4, shake: 0 };
  }
  return { visible: true, distance: FACE.near, open: true, shake: 1 };
}

let head = null;

function buildHead() {
  const calm = ghostFaceTexture(false);
  const screaming = ghostFaceTexture(true);
  const skin = new THREE.MeshLambertMaterial({ color: 0xbfc5c1, emissive: 0x1a1e22 });
  const hair = new THREE.MeshLambertMaterial({ color: 0x060507, side: THREE.DoubleSide });
  // Lit from within, faintly, so it shows even if your light is off.
  const face = new THREE.MeshLambertMaterial({ map: calm, emissive: 0xffffff, emissiveMap: calm, emissiveIntensity: 0.3 });
  const group = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.3, 0.22), [hair, hair, hair, skin, hair, face]);
  group.add(skull);
  // Long hair hanging straight down from the crown, framing the face, down past the
  // bottom of the screen.
  const strands = [];
  for (let i = 0; i < 9; i++) {
    const x = -0.12 + i * 0.03;
    if (Math.abs(x) < 0.05) continue; // a gap for the face
    const len = 0.7 + Math.random() * 0.5;
    const strand = new THREE.Mesh(new THREE.PlaneGeometry(0.05, len), hair);
    strand.position.set(x, 0.15 - len / 2, -0.115);
    group.add(strand);
    strands.push(strand);
  }
  const lock = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.5), hair);
  lock.position.set(-0.04, -0.07, -0.117);
  group.add(lock);
  // Shoulders and the top of a grey gown, so it's a whole someone and not a mask.
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.25, 0.16), new THREE.MeshLambertMaterial({ color: 0x8e8b82 }));
  shoulders.position.y = -0.35;
  group.add(shoulders);
  // A red wash over the eyes when it screams.
  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.MeshBasicMaterial({ color: 0x7a0000, transparent: true, opacity: 0, depthTest: false }),
  );
  flash.renderOrder = 999;
  return { group, skull, face, calm, screaming, flash };
}

export function faceInFlashlight(ctx) {
  head ??= buildHead();
  const { camera, scene, effects } = ctx;
  const start = ctx.now();
  effects.flicker(start, FACE.flicker);
  // Breathing right in front of you, in the dark.
  const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  ctx.breathe?.(camera.position.x + ahead.x, camera.position.z + ahead.z, FACE.flicker + FACE.stare);

  // Where it stands is fixed when it appears: turning away doesn't shake it off.
  let anchor = null;
  let screamed = false;
  let added = false;
  function frame() {
    const t = ctx.now() - start;
    const s = faceAt(t);
    if (s.visible && !anchor) {
      anchor = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
      scene.add(head.group);
      added = true;
    }
    if (s.visible) {
      // It comes at your eyes wherever you look once it lunges.
      const q = s.open ? camera.quaternion : anchor.quaternion;
      const from = s.open ? camera.position : anchor.position;
      const offset = new THREE.Vector3(0, -0.04, -s.distance).applyQuaternion(q);
      head.group.position.copy(from).add(offset);
      head.group.quaternion.copy(q);
      const map = s.open ? head.screaming : head.calm;
      if (head.face.map !== map) {
        head.face.map = head.face.emissiveMap = map;
        head.face.needsUpdate = true;
      }
      head.skull.scale.y = s.open ? 1.25 : 1;
      if (s.shake) {
        // Shuddering in your face.
        head.group.position.x += (Math.random() - 0.5) * 0.02;
        head.group.position.y += (Math.random() - 0.5) * 0.02;
        head.group.rotation.z = (Math.random() - 0.5) * 0.15;
      }
    }
    if (s.open && !screamed) {
      screamed = true;
      ctx.scream();
      effects.shake(ctx.now(), 0.9, 0.16);
      camera.add(head.flash);
      head.flash.position.set(0, 0, -0.2);
      head.flash.material.opacity = 0.45;
    }
    if (screamed) head.flash.material.opacity = Math.max(0, head.flash.material.opacity - 0.02);
    if (!s.visible && added) {
      added = false;
      scene.remove(head.group);
      camera.remove(head.flash);
      effects.blackout(ctx.now(), FACE.dark);
    }
    if (t < DARK_AT + 0.05) requestAnimationFrame(frame);
    else {
      // The light's back. Behind you, someone thinks that was funny.
      setTimeout(() => {
        const back = new THREE.Vector3(0, 0, 1.5).applyQuaternion(camera.quaternion);
        ctx.giggle?.(camera.position.x + back.x, camera.position.z + back.z);
      }, (FACE.dark + FACE.giggleAfter) * 1000);
    }
  }
  requestAnimationFrame(frame);
}
