import * as THREE from 'three';
import { cellCenter, isSolid } from '../../../shared/mapParser.js';
import { mattressTexture } from './textures.js';

const LENGTH = 1.9;
const WIDTH = 0.95;
const MATTRESS_TOP = 0.55;
const MATTRESS_THICKNESS = 0.14;
const FRAME_Y = MATTRESS_TOP - MATTRESS_THICKNESS; // underside of the mattress
const WALL_GAP = 0.08;
const UNDER_EYE_HEIGHT = 0.2; // camera height while hiding underneath

// [dx, dz, rotation] for a wall on each side. Each bed is built with its long side
// along local x and its back to local -z, then turned so that back meets the wall.
const WALL_SIDES = [
  [0, -1, 0],
  [0, 1, Math.PI],
  [-1, 0, Math.PI / 2],
  [1, 0, -Math.PI / 2],
];

// Rusty iron cell cots. Every mesh carries the bed's id so the crosshair can find it.
export function createBeds(map, scene) {
  const iron = new THREE.MeshLambertMaterial({ color: 0x3a2e26 });
  const mattress = new THREE.MeshLambertMaterial({ map: mattressTexture() });
  const pillow = new THREE.MeshLambertMaterial({ color: 0x6e6858 });

  const legGeometry = new THREE.BoxGeometry(0.05, FRAME_Y, 0.05);
  const railGeometry = new THREE.BoxGeometry(LENGTH, 0.05, 0.05);
  const strapGeometry = new THREE.BoxGeometry(0.04, 0.02, WIDTH);
  const postGeometry = new THREE.BoxGeometry(0.05, 0.9, 0.05);
  const mattressGeometry = new THREE.BoxGeometry(LENGTH - 0.06, MATTRESS_THICKNESS, WIDTH - 0.06);
  const pillowGeometry = new THREE.BoxGeometry(0.35, 0.08, WIDTH * 0.6);

  const beds = new Map();
  const meshes = [];

  for (const obj of map.objects) {
    if (obj.type !== 'bed') continue;
    const wall = WALL_SIDES.find(([dx, dz]) => isSolid(map, obj.x + dx, obj.z + dz));
    const rotation = wall ? wall[2] : 0;
    const shift = wall ? 1 - WIDTH / 2 - WALL_GAP : 0;
    const cell = cellCenter(obj.x, obj.z);
    // Local -z (towards the wall) in world space is (-sin, -cos).
    const x = cell.x - Math.sin(rotation) * shift;
    const z = cell.z - Math.cos(rotation) * shift;

    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    const add = (geometry, material, px, py, pz) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(px, py, pz);
      mesh.userData.targetId = obj.id;
      group.add(mesh);
      meshes.push(mesh);
    };

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) add(legGeometry, iron, (sx * (LENGTH - 0.05)) / 2, FRAME_Y / 2, (sz * (WIDTH - 0.05)) / 2);
      add(postGeometry, iron, (-LENGTH + 0.05) / 2, 0.45, (sx * (WIDTH - 0.05)) / 2);
    }
    add(strapGeometry, iron, (-LENGTH + 0.05) / 2, 0.88, 0); // headboard bar
    for (const sz of [-1, 1]) add(railGeometry, iron, 0, FRAME_Y - 0.025, (sz * (WIDTH - 0.05)) / 2);
    // Sagging straps under the mattress: what you stare at while hiding.
    for (let i = 0; i < 6; i++) add(strapGeometry, iron, -LENGTH / 2 + 0.2 + i * 0.3, FRAME_Y - 0.01, 0);
    add(mattressGeometry, mattress, 0, FRAME_Y + MATTRESS_THICKNESS / 2, 0);
    add(pillowGeometry, pillow, -LENGTH / 2 + 0.3, MATTRESS_TOP + 0.04, 0);
    scene.add(group);

    beds.set(obj.id, {
      obj,
      under: { x, y: UNDER_EYE_HEIGHT, z },
      // Facing away from the wall, so the player peeks out into the room.
      lookYaw: wall ? Math.atan2(wall[0], wall[1]) : null,
    });
  }

  return {
    meshes,
    has: (id) => beds.has(id),
    get: (id) => beds.get(id),
  };
}
