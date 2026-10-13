import * as THREE from 'three';
import { nameTagTexture } from './textures.js';

const HIP = 0.9;
const SHOULDER = 1.42;
const SWING = 0.55; // radians of leg/arm swing at walking pace
const FLASHLIGHT_INTENSITY = 22; // a bit dimmer than our own, so ours stays the main light

// A low-poly teammate: boxes for limbs, their own flashlight, and their name overhead.
// Built facing local -z, like the camera, so rotation.y = their yaw.
export function createPartnerModel(name) {
  const cloth = new THREE.MeshLambertMaterial({ color: 0x2c3442 });
  const trousers = new THREE.MeshLambertMaterial({ color: 0x24221f });
  const skin = new THREE.MeshLambertMaterial({ color: 0x9c8a78 });
  const metal = new THREE.MeshLambertMaterial({ color: 0x55585c });

  const root = new THREE.Group();
  const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

  // Limbs hang from a pivot at the hip or shoulder, so rotating the pivot swings them.
  const limb = (x, y, w, h, material) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = box(w, h, w * 1.1, material);
    mesh.position.y = -h / 2;
    pivot.add(mesh);
    root.add(pivot);
    return pivot;
  };
  const legs = [limb(-0.11, HIP, 0.15, HIP, trousers), limb(0.11, HIP, 0.15, HIP, trousers)];
  const arms = [limb(-0.27, SHOULDER, 0.11, 0.62, cloth), limb(0.27, SHOULDER, 0.11, 0.62, cloth)];

  const torso = box(0.44, SHOULDER - HIP + 0.06, 0.24, cloth);
  torso.position.y = (HIP + SHOULDER) / 2;
  root.add(torso);

  // The head tilts with their pitch; the flashlight follows where they look.
  const head = new THREE.Group();
  head.position.y = SHOULDER + 0.06;
  const skull = box(0.22, 0.26, 0.24, skin);
  skull.position.y = 0.15;
  head.add(skull);
  root.add(head);

  const aim = new THREE.Group();
  aim.position.set(0.22, SHOULDER - 0.1, -0.25);
  const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.18, 6), metal);
  torch.rotation.x = Math.PI / 2;
  aim.add(torch);
  const spot = new THREE.SpotLight(0xfff1d6, FLASHLIGHT_INTENSITY, 18, Math.PI / 7, 0.45, 2);
  spot.position.set(0, 0, -0.1);
  spot.target.position.set(0, -0.15, -4);
  aim.add(spot, spot.target);
  root.add(aim);

  const tag = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: nameTagTexture(name), transparent: true, opacity: 0.8, fog: false, depthWrite: false }),
  );
  tag.scale.set(1, 0.25, 1);
  tag.position.y = 2.05;
  root.add(tag);

  let phase = 0;

  return {
    root,
    // speed in m/s drives the walk cycle; pitch tilts head and flashlight.
    pose({ x, z, yaw, pitch, light }, speed, dt) {
      root.position.set(x, 0, z);
      root.rotation.y = yaw;
      head.rotation.x = pitch * 0.6;
      aim.rotation.x = pitch;
      spot.intensity = light === false ? 0 : FLASHLIGHT_INTENSITY;

      const moving = Math.min(1, speed / 2);
      phase += speed * dt * 2.6;
      const swing = Math.sin(phase) * SWING * moving;
      legs[0].rotation.x = swing;
      legs[1].rotation.x = -swing;
      arms[0].rotation.x = -swing * 0.8;
      // The torch hand stays mostly steady, pointing ahead.
      arms[1].rotation.x = -Math.PI / 2.6 + pitch * 0.8;
    },
    dispose() {
      root.traverse((o) => {
        o.geometry?.dispose();
        o.material?.map?.dispose();
      });
      spot.dispose();
    },
  };
}
