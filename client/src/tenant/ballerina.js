import * as THREE from 'three';
import { ghostFaceTexture } from '../world/textures.js';

// Clara, the ballerina: a thin, grey dancer in a torn tutu, up on the points of her
// shoes, arms rounded over her head. While she dances her body turns and turns but her
// head keeps snapping back round to stare at you. Built facing local -z like the
// Tenant's ghost, with the same interface (root, setPose, pose, face, lookAt, update),
// so the Tenant can play her.
const HIP = 0.9;
const WAIST = 1.28;
const HEAD = 0.24;

// Poses: dance (spinning en pointe), stop (dead still, staring), curtsy, scream (in
// your face).
export function createBallerinaModel() {
  const skin = new THREE.MeshLambertMaterial({ color: 0xc9cdc9, emissive: 0x1c2024 });
  const tulle = new THREE.MeshLambertMaterial({ color: 0xa8989a, emissive: 0x1e1a1c, side: THREE.DoubleSide });
  const bodiceMat = new THREE.MeshLambertMaterial({ color: 0x8a7f80, emissive: 0x141214 });
  const shoes = new THREE.MeshLambertMaterial({ color: 0x9a6f72 });
  const hairMat = new THREE.MeshLambertMaterial({ color: 0x0a090b, side: THREE.DoubleSide });
  const calm = ghostFaceTexture(false);
  const screaming = ghostFaceTexture(true);
  const face = new THREE.MeshLambertMaterial({ map: calm, emissive: 0xffffff, emissiveMap: calm, emissiveIntensity: 0.2 });

  const root = new THREE.Group();
  const body = new THREE.Group(); // spins while she dances; root only moves and turns
  root.add(body);
  const box = (parent, w, h, d, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    parent.add(mesh);
    return mesh;
  };
  const pivot = (parent, x, y, z = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  // Legs: thigh and shin on a knee, ending in a pointe shoe standing on its tip.
  const legs = [-1, 1].map((side) => {
    const hip = pivot(body, side * 0.06, HIP);
    box(hip, 0.06, HIP * 0.5, 0.06, skin).position.y = -HIP * 0.25;
    const knee = pivot(hip, 0, -HIP * 0.5);
    box(knee, 0.045, HIP * 0.42, 0.045, skin).position.y = -HIP * 0.21;
    box(knee, 0.05, HIP * 0.09, 0.06, shoes).position.y = -HIP * 0.455;
    return { hip, knee };
  });

  // The tutu: two ragged layers of tulle around the hips.
  const tutu = new THREE.Group();
  tutu.position.y = HIP + 0.02;
  body.add(tutu);
  for (const [r, drop, y] of [
    [0.46, 0.06, 0],
    [0.38, 0.1, -0.04],
  ]) {
    const geo = new THREE.CylinderGeometry(0.11, r, 0.06 + drop, 20, 1, true);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < 0) {
        const tear = 0.75 + Math.random() * 0.3;
        pos.setX(i, pos.getX(i) * tear);
        pos.setZ(i, pos.getZ(i) * tear);
        pos.setY(i, pos.getY(i) - Math.random() * 0.06);
      }
    }
    const layer = new THREE.Mesh(geo, tulle);
    layer.position.y = y;
    tutu.add(layer);
  }

  const chest = pivot(body, 0, HIP);
  const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, WAIST - HIP, 10), bodiceMat);
  bodice.position.y = (WAIST - HIP) / 2;
  bodice.scale.z = 0.7;
  chest.add(bodice);
  const top = WAIST - HIP;

  const arms = [-1, 1].map((side) => {
    const shoulder = pivot(chest, side * 0.15, top - 0.02);
    box(shoulder, 0.04, 0.3, 0.04, skin).position.y = -0.15;
    const elbow = pivot(shoulder, 0, -0.3);
    box(elbow, 0.035, 0.28, 0.035, skin).position.y = -0.14;
    box(elbow, 0.03, 0.12, 0.05, skin).position.y = -0.33;
    return { shoulder, elbow };
  });

  const neck = pivot(chest, 0, top);
  box(neck, 0.05, 0.1, 0.05, skin).position.y = 0.05;
  const head = pivot(neck, 0, 0.09);
  // Faces: +x, -x, +y, -y, +z, -z (front, the face).
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.17, HEAD, 0.19), [hairMat, hairMat, hairMat, skin, hairMat, face]);
  skull.position.y = HEAD / 2;
  head.add(skull);
  // A bun coming loose, and a few strands hanging down.
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), hairMat);
  bun.position.set(0, HEAD + 0.02, 0.07);
  head.add(bun);
  for (const [x, len] of [
    [-0.07, 0.35],
    [0.06, 0.28],
    [0.08, 0.42],
  ]) {
    const strand = new THREE.Mesh(new THREE.PlaneGeometry(0.03, len), hairMat);
    strand.position.set(x, HEAD - len / 2, -0.1);
    head.add(strand);
  }

  let pose = 'dance';
  let spin = 0;
  let headYaw = 0;

  function reset() {
    body.rotation.set(0, 0, 0);
    body.position.set(0, 0, 0);
    chest.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    for (const leg of legs) {
      leg.hip.rotation.set(0, 0, 0);
      leg.knee.rotation.set(0, 0, 0);
    }
    for (const arm of arms) {
      arm.shoulder.rotation.set(0, 0, 0);
      arm.elbow.rotation.set(0, 0, 0);
    }
    face.map = face.emissiveMap = pose === 'scream' ? screaming : calm;
    face.emissiveIntensity = pose === 'scream' ? 0.55 : 0.2;
    face.needsUpdate = true;
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
    lookAt(x, z) {
      let rel = Math.atan2(-(x - root.position.x), -(z - root.position.z)) - root.rotation.y;
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      headYaw = Math.max(-1.3, Math.min(1.3, rel));
    },
    face(x, z) {
      root.rotation.y = Math.atan2(-(x - root.position.x), -(z - root.position.z));
      headYaw = 0;
    },
    update(dt, time) {
      if (pose === 'dance') {
        // Turning on one point, the other foot drawn up to the knee, arms over her head.
        spin += dt * 2.2;
        body.rotation.y = spin;
        body.position.y = 0.02 + Math.abs(Math.sin(spin)) * 0.02;
        legs[1].hip.rotation.z = -1.0;
        legs[1].hip.rotation.x = -0.4;
        legs[1].knee.rotation.z = 2.1;
        for (const [i, arm] of arms.entries()) {
          const side = i ? 1 : -1;
          arm.shoulder.rotation.z = side * 2.7;
          arm.elbow.rotation.z = side * 0.9;
        }
        // Her body turns; her head doesn't. It stays on you, even with her back to you.
        head.rotation.y = -Math.atan2(Math.sin(spin), Math.cos(spin));
        head.rotation.z = Math.sin(time * 0.7) * 0.15;
      }
      if (pose === 'stop') {
        // Stopped dead, staring, head cocked.
        body.position.y = 0.02;
        head.rotation.set(0, headYaw, 0.45, 'YXZ');
        for (const [i, arm] of arms.entries()) arm.shoulder.rotation.z = (i ? 1 : -1) * 0.15;
      }
      if (pose === 'curtsy') {
        legs[1].hip.rotation.x = 0.5;
        legs[0].knee.rotation.x = -0.4;
        body.position.y = -0.08;
        chest.rotation.x = 0.35;
        head.rotation.x = 0.4;
        for (const [i, arm] of arms.entries()) {
          arm.shoulder.rotation.z = (i ? 1 : -1) * 0.7;
          arm.shoulder.rotation.x = 0.3;
        }
      }
      if (pose === 'scream') {
        // Her face at your eyes, arms reaching for you, shaking.
        const jitter = () => (Math.random() * 2 - 1) * 0.015;
        body.position.set(jitter(), 1.6 - (WAIST + 0.09 + HEAD / 2) + jitter(), jitter());
        head.rotation.set(-0.1 + jitter() * 4, jitter() * 6, jitter() * 8, 'YXZ');
        skull.scale.y = 1.25;
        for (const [i, arm] of arms.entries()) {
          arm.shoulder.rotation.x = -1.6;
          arm.shoulder.rotation.z = (i ? -1 : 1) * 0.5;
          arm.elbow.rotation.x = -0.3;
        }
      } else skull.scale.y = 1;
    },
  };
}
