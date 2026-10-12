import * as THREE from 'three';
import { CELL } from '../../../shared/constants.js';
import { cellCenter, wallSide } from '../../../shared/mapParser.js';

const WIDTH = 0.5;
const HEIGHT = 0.6;
const DEPTH = 0.14;
const MOUNT_Y = 1.35;
const OPEN_ANGLE = -1.9;

// Grey metal cabinet on the wall next to its F cell. Opening it with the key swings
// the door; each placed fuse lights one slot inside.
export function createFuseBox(map, scene, fusesNeeded) {
  const obj = map.objects.find((o) => o.type === 'fuseBox');
  if (!obj) return null;

  const wall = wallSide(map, obj.x, obj.z);
  const cell = cellCenter(obj.x, obj.z);
  const group = new THREE.Group();
  group.position.set(cell.x + wall.dx * (CELL / 2), MOUNT_Y, cell.z + wall.dz * (CELL / 2));
  group.rotation.y = wall.rotation;

  const metal = new THREE.MeshPhongMaterial({ color: 0x4a4d48, specular: 0x333333, shininess: 20 });
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, HEIGHT, DEPTH), metal);
  cabinet.position.z = DEPTH / 2;
  const inside = new THREE.Mesh(
    new THREE.PlaneGeometry(WIDTH - 0.04, HEIGHT - 0.04),
    new THREE.MeshLambertMaterial({ color: 0x15161a }),
  );
  inside.position.z = DEPTH + 0.001;
  group.add(cabinet, inside);

  const slots = [];
  const slotGeometry = new THREE.BoxGeometry(0.06, 0.12, 0.03);
  for (let i = 0; i < fusesNeeded; i++) {
    const material = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, emissive: 0x000000 });
    const slot = new THREE.Mesh(slotGeometry, material);
    slot.position.set((i - (fusesNeeded - 1) / 2) * 0.11, 0.05, DEPTH + 0.015);
    group.add(slot);
    slots.push(material);
  }

  // The door hinges on its left edge and swings out from the wall.
  const hinge = new THREE.Object3D();
  hinge.position.set(-WIDTH / 2, 0, DEPTH + 0.012);
  const door = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, HEIGHT, 0.02), metal);
  door.position.x = WIDTH / 2;
  const lock = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.07, 0.02),
    new THREE.MeshPhongMaterial({ color: 0xb08d3c, shininess: 60 }),
  );
  lock.position.set(WIDTH - 0.05, 0, 0.015);
  const warning = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshLambertMaterial({ color: 0xa88a1c }));
  warning.position.set(WIDTH / 2, 0.16, 0.011);
  hinge.add(door, lock, warning);
  group.add(hinge);

  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 0.2, HEIGHT + 0.2, 0.5),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitbox.position.z = 0.25;
  hitbox.userData.targetId = obj.id;
  group.add(hitbox);
  scene.add(group);

  let target = 0;
  const world = new THREE.Vector3();
  group.getWorldPosition(world);

  return {
    obj,
    position: world,
    targets: [hitbox],
    open() {
      target = OPEN_ANGLE;
    },
    setPlaced(count) {
      slots.forEach((m, i) => {
        m.color.setHex(i < count ? 0x7fd06a : 0x2a2a2a);
        m.emissive.setHex(i < count ? 0x2f7a22 : 0x000000);
      });
    },
    update(dt) {
      const diff = target - hinge.rotation.y;
      if (diff) hinge.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), dt * 4);
    },
  };
}
