import * as THREE from 'three';
import { ghostFaceTexture, shroudTexture } from '../world/textures.js';

// The Tenant: a drowned-looking ghost in a torn burial gown. It floats a hand's width
// off the floor with grey feet dangling under the hem, long wet black hair hanging over
// its face, arms too long, fingers ending in black nails. Built facing local -z like the
// camera, so rotation.y works like a yaw.
const HOVER = 0.16; // how far the hem floats off the floor
const SHOULDER = 1.42; // above the hem
const ARM = 0.9; // shoulder to fingertips; a person's would be ~0.75
const NECK = 0.1;
const HEAD = 0.27;
// Its face sits at eye height when it screams in yours.
const SCREAM_DROP = 1.6 - (HOVER + SHOULDER + NECK + HEAD / 2);

// Poses: stand, lean (peeking round a corner), walk (a slow glide), run (a lunge, arms
// out), wave, shush, scream (in your face, jaw open, claws out), head (only its head,
// lying sideways on the floor: the look under the bed).
export function createTenantModel() {
  const skin = new THREE.MeshLambertMaterial({ color: 0xc4cac6, emissive: 0x1a1e22 });
  const nails = new THREE.MeshLambertMaterial({ color: 0x0c0a0c });
  const hairMat = new THREE.MeshLambertMaterial({ color: 0x08070a, side: THREE.DoubleSide });
  const gownMat = new THREE.MeshLambertMaterial({
    map: shroudTexture(),
    side: THREE.DoubleSide,
    // Faintly lit from nowhere: you can always just make it out in the dark.
    emissive: 0x262a30,
  });
  const calm = ghostFaceTexture(false);
  const screaming = ghostFaceTexture(true);
  const face = new THREE.MeshLambertMaterial({ map: calm, emissive: 0xffffff, emissiveMap: calm, emissiveIntensity: 0.18 });

  const root = new THREE.Group();
  const body = new THREE.Group(); // floats, leans and jerks; root only moves and turns
  root.add(body);
  const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

  // The gown: a flattened cone, ragged at the hem. The hem drifts as if underwater.
  const gownGeo = new THREE.CylinderGeometry(0.16, 0.42, SHOULDER, 16, 6, true);
  gownGeo.translate(0, SHOULDER / 2, 0);
  const pos = gownGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < 0.01) pos.setY(i, -Math.random() * 0.22);
  }
  const rest = Float32Array.from(pos.array);
  const gown = new THREE.Mesh(gownGeo, gownMat);
  gown.scale.z = 0.62;
  body.add(gown);

  // Bare feet hanging limp below the hem, toes pointing at the floor.
  const feet = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.08, 0.25, 0);
    const shin = box(0.06, 0.32, 0.06, skin);
    shin.position.y = -0.16;
    pivot.add(shin);
    const foot = box(0.07, 0.15, 0.05, skin);
    foot.position.set(0, -0.36, -0.02);
    foot.rotation.x = 0.25;
    pivot.add(foot);
    body.add(pivot);
    return pivot;
  });

  const chest = new THREE.Group();
  chest.position.y = SHOULDER * 0.55;
  body.add(chest);
  const top = SHOULDER - chest.position.y;

  // Arms: upper arm, forearm on an elbow, a hand with four long clawed fingers.
  const arms = [-1, 1].map((side) => {
    const upper = new THREE.Group();
    upper.position.set(side * 0.19, top - 0.03, 0);
    chest.add(upper);
    const upperMesh = box(0.06, ARM * 0.45, 0.06, skin);
    upperMesh.position.y = -ARM * 0.225;
    upper.add(upperMesh);
    const elbow = new THREE.Group();
    elbow.position.y = -ARM * 0.45;
    upper.add(elbow);
    const fore = box(0.05, ARM * 0.38, 0.05, skin);
    fore.position.y = -ARM * 0.19;
    elbow.add(fore);
    const hand = new THREE.Group();
    hand.position.y = -ARM * 0.38;
    elbow.add(hand);
    const palm = box(0.05, 0.08, 0.07, skin);
    palm.position.y = -0.04;
    hand.add(palm);
    const fingers = [-0.026, -0.009, 0.009, 0.026].map((z) => {
      const knuckle = new THREE.Group();
      knuckle.position.set(0, -0.08, z);
      hand.add(knuckle);
      const finger = box(0.014, 0.13, 0.014, skin);
      finger.position.y = -0.065;
      knuckle.add(finger);
      const nail = box(0.016, 0.035, 0.016, nails);
      nail.position.y = -0.14;
      knuckle.add(nail);
      return knuckle;
    });
    return { upper, elbow, hand, fingers };
  });

  const neck = new THREE.Group();
  neck.position.y = top;
  chest.add(neck);
  const neckMesh = box(0.06, NECK + 0.04, 0.06, skin);
  neckMesh.position.y = NECK / 2;
  neck.add(neckMesh);
  const head = new THREE.Group();
  head.position.y = NECK;
  neck.add(head);
  // Six faces of the box: +x, -x, +y, -y, +z, -z. The face is on -z (the front).
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.19, HEAD, 0.21), [hairMat, hairMat, hairMat, skin, hairMat, face]);
  skull.position.y = HEAD / 2;
  head.add(skull);

  // Hair: long black strands from the crown, down the back and over the shoulders,
  // two hanging in front of the face with a gap down the middle to stare through.
  const strands = [];
  const strand = (x, z, length, width, spread) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, HEAD - 0.01, z);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length), hairMat);
    mesh.position.y = -length / 2;
    pivot.add(mesh);
    pivot.rotation.z = spread;
    head.add(pivot);
    strands.push({ pivot, spread, z, phase: Math.random() * Math.PI * 2 });
  };
  for (let i = 0; i < 7; i++) strand(-0.09 + i * 0.03, 0.108, 0.75 + Math.random() * 0.3, 0.06, 0); // back
  for (const side of [-1, 1]) {
    strand(side * 0.098, 0.04, 0.7, 0.2, side * 0.05); // over the ears and shoulders
    strand(side * 0.085, -0.108, 0.55 + Math.random() * 0.2, 0.06, side * 0.04); // framing the face
  }
  strand(-0.045, -0.112, 0.42, 0.035, 0.02); // one lock across an eye

  let pose = 'stand';
  let phase = 0;
  let tilt = 0.35; // head roll; snaps to a new angle now and then
  let nextTwitchAt = 0;
  let headYaw = 0;
  let glitchUntil = 0; // it blinks out for a frame or two now and then
  let nextGlitchAt = 2;

  function reset() {
    body.rotation.set(0, 0, 0);
    body.position.set(0, 0, 0);
    chest.rotation.set(0, 0, 0);
    skull.scale.set(1, 1, 1);
    skull.position.y = HEAD / 2;
    for (const foot of feet) foot.rotation.set(0, 0, 0);
    for (const arm of arms) {
      arm.upper.rotation.set(0, 0, 0);
      arm.elbow.rotation.set(0, 0, 0);
      arm.hand.rotation.set(0, 0, 0);
      for (const f of arm.fingers) f.rotation.set(0, 0, 0);
    }
    const open = pose === 'scream' || pose === 'head';
    face.map = face.emissiveMap = open ? screaming : calm;
    face.emissiveIntensity = open ? 0.55 : 0.18;
    face.needsUpdate = true;
  }

  // Fingers bend in at the knuckles: 0 straight, 1 a claw.
  const curl = (arm, amount) => {
    for (const f of arm.fingers) f.rotation.x = amount * 0.9;
  };

  return {
    root,
    setPose(next) {
      pose = next;
      reset();
    },
    get pose() {
      return pose;
    },
    // Turns its head (not its body) toward a point, as far as a neck can go.
    lookAt(x, z) {
      const dx = x - root.position.x;
      const dz = z - root.position.z;
      let rel = Math.atan2(-dx, -dz) - root.rotation.y;
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      headYaw = Math.max(-1.3, Math.min(1.3, rel));
    },
    // Turns its whole body to face a point.
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
      phase += dt * (pose === 'run' ? 10 : 2 + speed * 2);

      // Floating: a slow bob, the hem and hair drifting as if underwater.
      body.position.y = HOVER + Math.sin(time * 1.7) * 0.04;
      const drift = pose === 'run' || pose === 'scream' ? 3 : 1;
      for (let i = 0; i < pos.count; i++) {
        const y = rest[i * 3 + 1];
        if (y > 0.6) continue;
        const k = (1 - y / 0.6) * 0.05 * drift;
        const a = Math.atan2(rest[i * 3 + 2], rest[i * 3]);
        pos.setX(i, rest[i * 3] + Math.sin(phase + a * 3 + y * 4) * k);
        pos.setZ(i, rest[i * 3 + 2] + Math.cos(phase * 0.8 + a * 2) * k);
      }
      pos.needsUpdate = true;
      for (const s of strands) {
        s.pivot.rotation.x = (s.z > 0 ? 0.12 : -0.05) + Math.sin(time * 1.1 + s.phase) * 0.05 * drift;
        s.pivot.rotation.z = s.spread + Math.sin(time * 0.9 + s.phase) * 0.03 * drift;
      }
      for (const [i, foot] of feet.entries()) foot.rotation.x = Math.sin(time * 1.2 + i) * 0.08;

      // Now and then it blinks out of existence for a moment.
      if (time >= nextGlitchAt) {
        nextGlitchAt = time + 3 + Math.random() * 6;
        glitchUntil = time + 0.04 + Math.random() * 0.08;
      }
      body.visible = pose === 'scream' || pose === 'head' || time >= glitchUntil;

      if (pose === 'stand' || pose === 'wave' || pose === 'shush') {
        chest.rotation.x = 0.1 + sway; // a slight hunch
        arms[0].upper.rotation.z = -0.05 + sway;
        arms[1].upper.rotation.z = 0.05 - sway;
        curl(arms[0], 0.3);
        curl(arms[1], 0.3);
      }
      if (pose === 'lean') {
        // Bent sideways, as if looking round a door frame.
        body.rotation.z = 0.32;
        body.position.x = -0.35;
        chest.rotation.z = 0.25;
        arms[0].upper.rotation.z = -0.4;
      }
      if (pose === 'walk') {
        // It doesn't walk. It drifts, arms trailing.
        body.rotation.x = 0.08;
        chest.rotation.x = 0.12;
        for (const arm of arms) arm.upper.rotation.x = 0.25 + Math.sin(phase) * 0.06;
      }
      if (pose === 'run') {
        // A lunge: bent forward, both arms reaching for you, claws open.
        body.rotation.x = 0.35;
        chest.rotation.x = 0.2;
        for (const [i, arm] of arms.entries()) {
          arm.upper.rotation.x = -1.7 + Math.sin(phase + i * 2) * 0.15;
          arm.upper.rotation.z = (i ? -1 : 1) * 0.15;
          curl(arm, 0.6 + Math.sin(phase * 1.3 + i) * 0.3);
        }
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
      if (pose === 'scream') {
        // Right in your face: face at your eyes, jaw stretched, arms flung wide then
        // grabbing, the whole thing shuddering.
        const jitter = () => (Math.random() * 2 - 1) * 0.015;
        body.position.set(jitter(), SCREAM_DROP + HOVER + jitter(), jitter());
        chest.rotation.x = -0.05;
        head.rotation.set(-0.15 + jitter() * 4, jitter() * 6, jitter() * 8, 'YXZ');
        skull.scale.y = 1.25;
        skull.position.y = (HEAD / 2) * 0.75;
        for (const [i, arm] of arms.entries()) {
          const side = i ? -1 : 1;
          arm.upper.rotation.x = -1.5;
          arm.upper.rotation.z = side * (0.9 + Math.sin(time * 30 + i) * 0.05);
          arm.elbow.rotation.z = side * -0.6;
          curl(arm, 0.9);
        }
        for (const s of strands) s.pivot.rotation.z = s.spread * 4 + (Math.random() - 0.5) * 0.15;
      }
      if (pose === 'head') {
        // Everything but the head is gone; it lies on its side at floor level, mouth open.
        gown.visible = false;
        for (const foot of feet) foot.visible = false;
        neckMesh.visible = false;
        for (const arm of arms) arm.upper.visible = false;
        body.position.y = -(chest.position.y + top + NECK) + 0.12;
        head.rotation.set(0, headYaw, Math.PI / 2, 'YXZ');
      } else {
        gown.visible = neckMesh.visible = true;
        for (const foot of feet) foot.visible = true;
        for (const arm of arms) arm.upper.visible = true;
      }
    },
  };
}
