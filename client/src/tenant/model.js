import * as THREE from 'three';
import { grinTexture } from '../world/textures.js';

// The Tenant: a man, almost. Too tall (2.05 m), too thin, arms that hang past his
// knees, head always tilted a little too far. Built facing local -z like the camera,
// so rotation.y works like a yaw.
const HIP = 1.0;
const SHOULDER = 1.62;
const ARM = 0.95; // shoulder to fingertips; a person's would be ~0.75

// Poses: stand, lean (peeking round a corner), walk, run, wave, shush, head (only his
// head, lying sideways on the floor: the look under the bed).
export function createTenantModel() {
  const skin = new THREE.MeshLambertMaterial({ color: 0xb3ab9c });
  const shirt = new THREE.MeshLambertMaterial({ color: 0x7d776a });
  const trousers = new THREE.MeshLambertMaterial({ color: 0x23201d });
  const face = new THREE.MeshLambertMaterial({
    map: grinTexture(),
    // His face glows just enough to be found in the dark, never enough to light anything.
    emissive: 0xffffff,
    emissiveMap: grinTexture(),
    emissiveIntensity: 0.12,
  });

  const root = new THREE.Group();
  const body = new THREE.Group(); // leans and bends; root only moves and turns
  root.add(body);
  const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

  const limb = (parent, x, y, w, h, material) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = box(w, h, w, material);
    mesh.position.y = -h / 2;
    pivot.add(mesh);
    parent.add(pivot);
    return pivot;
  };
  const legs = [limb(body, -0.09, HIP, 0.11, HIP, trousers), limb(body, 0.09, HIP, 0.11, HIP, trousers)];
  for (const leg of legs) {
    const foot = box(0.1, 0.05, 0.24, skin);
    foot.position.set(0, -HIP + 0.025, -0.06);
    leg.add(foot);
  }

  const chest = new THREE.Group();
  chest.position.y = HIP;
  body.add(chest);
  const torso = box(0.34, SHOULDER - HIP, 0.17, shirt);
  torso.position.y = (SHOULDER - HIP) / 2;
  chest.add(torso);

  // Arms: upper arm and a forearm on an elbow, long grey hands.
  const arms = [-1, 1].map((side) => {
    const upper = limb(chest, side * 0.22, SHOULDER - HIP - 0.03, 0.08, ARM * 0.45, shirt);
    const elbow = new THREE.Group();
    elbow.position.y = -ARM * 0.45;
    upper.add(elbow);
    const fore = box(0.065, ARM * 0.38, 0.065, skin);
    fore.position.y = -ARM * 0.19;
    elbow.add(fore);
    const hand = box(0.05, ARM * 0.17, 0.09, skin);
    hand.position.y = -ARM * 0.38 - ARM * 0.085;
    elbow.add(hand);
    return { upper, elbow };
  });

  const neck = new THREE.Group();
  neck.position.y = SHOULDER - HIP;
  chest.add(neck);
  const neckMesh = box(0.07, 0.16, 0.07, skin);
  neckMesh.position.y = 0.08;
  neck.add(neckMesh);
  const head = new THREE.Group();
  head.position.y = 0.16;
  neck.add(head);
  // Six faces of the box: +x, -x, +y, -y, +z, -z. The face is on -z (the front).
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.27, 0.21), [skin, skin, skin, skin, skin, face]);
  skull.position.y = 0.13;
  head.add(skull);
  const hair = box(0.21, 0.05, 0.2, trousers);
  hair.position.set(0, 0.27, 0.02);
  head.add(hair);

  let pose = 'stand';
  let phase = 0;
  let tilt = 0.35; // head roll; snaps to a new angle now and then
  let nextTwitchAt = 0;
  let headYaw = 0;

  function reset() {
    body.rotation.set(0, 0, 0);
    body.position.set(0, 0, 0);
    chest.rotation.set(0, 0, 0);
    for (const leg of legs) leg.rotation.set(0, 0, 0);
    for (const arm of arms) {
      arm.upper.rotation.set(0, 0, 0);
      arm.elbow.rotation.set(0, 0, 0);
    }
    for (const part of [legs[0], legs[1], chest]) part.visible = true;
  }

  return {
    root,
    setPose(next) {
      pose = next;
      reset();
    },
    get pose() {
      return pose;
    },
    // Turns his head (not his body) toward a point, as far as a neck can go.
    lookAt(x, z) {
      const dx = x - root.position.x;
      const dz = z - root.position.z;
      let rel = Math.atan2(-dx, -dz) - root.rotation.y;
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      headYaw = Math.max(-1.3, Math.min(1.3, rel));
    },
    // Turns his whole body to face a point.
    face(x, z) {
      root.rotation.y = Math.atan2(-(x - root.position.x), -(z - root.position.z));
      headYaw = 0;
    },
    update(dt, time, speed = 0) {
      // Head twitches: long stillness, then a sudden jerk to a new angle.
      if (time >= nextTwitchAt) {
        nextTwitchAt = time + 0.8 + Math.random() * 3;
        tilt = (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.45);
      }
      head.rotation.set(0, headYaw, tilt, 'YXZ');
      const sway = Math.sin(time * 1.3) * 0.03;
      phase += dt * (pose === 'run' ? 14 : speed * 3);

      if (pose === 'stand' || pose === 'wave' || pose === 'shush') {
        chest.rotation.x = 0.12 + sway; // a slight hunch
        arms[0].upper.rotation.z = -0.06 + sway;
        arms[1].upper.rotation.z = 0.06 - sway;
      }
      if (pose === 'lean') {
        // Bent sideways from the hips, as if looking round a door frame.
        body.rotation.z = 0.32;
        body.position.x = -0.35;
        chest.rotation.z = 0.25;
        arms[0].upper.rotation.z = -0.4;
      }
      if (pose === 'walk' || pose === 'run') {
        const swing = Math.sin(phase) * (pose === 'run' ? 0.9 : 0.35);
        legs[0].rotation.x = swing;
        legs[1].rotation.x = -swing;
        arms[0].upper.rotation.x = -swing * 0.9;
        arms[1].upper.rotation.x = swing * 0.9;
        chest.rotation.x = pose === 'run' ? 0.45 : 0.15;
      }
      if (pose === 'wave') {
        // Slow, friendly, completely wrong.
        arms[1].upper.rotation.z = 2.5;
        arms[1].elbow.rotation.z = 0.4 + Math.sin(time * 3) * 0.45;
      }
      if (pose === 'shush') {
        arms[1].upper.rotation.x = -2.2;
        arms[1].upper.rotation.z = -0.35;
        arms[1].elbow.rotation.x = -1.9;
      }
      if (pose === 'head') {
        // Everything but the head is gone; it lies on its side at floor level.
        for (const part of [legs[0], legs[1]]) part.visible = false;
        chest.visible = true;
        torso.visible = false;
        neckMesh.visible = false;
        for (const arm of arms) arm.upper.visible = false;
        body.position.y = -(SHOULDER + 0.16) + 0.12;
        head.rotation.set(0, headYaw, Math.PI / 2, 'YXZ');
      } else {
        torso.visible = neckMesh.visible = true;
        for (const arm of arms) arm.upper.visible = true;
      }
    },
  };
}
