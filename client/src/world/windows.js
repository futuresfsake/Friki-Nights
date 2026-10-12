import * as THREE from 'three';
import { CELL } from '../../../shared/constants.js';
import { cellCenter } from '../../../shared/mapParser.js';
import { handTexture } from './textures.js';

const WIDTH = 1.0;
const HEIGHT = 1.2;
const SILL_Y = 0.9;
const BAR = 0.07;
const HOLD = 0.7; // seconds the hand stays pressed on the glass
const PULL = 0.6; // seconds to slide down and away

// Night-dark windows set into W wall cells, with a hand that can slam against the
// glass from outside (JS-06). Each window is built facing local +z, then turned to
// face its floor cell.
export function createWindows(map, scene) {
  const frame = new THREE.MeshLambertMaterial({ color: 0x2c2118 });
  const glass = new THREE.MeshPhongMaterial({ color: 0x0b1018, emissive: 0x08101c, specular: 0x8899aa, shininess: 80 });
  const handMaterial = new THREE.MeshLambertMaterial({ map: handTexture(), transparent: true, alphaTest: 0.5 });
  const windows = new Map();

  for (const obj of map.objects) {
    if (obj.type !== 'window') continue;
    const cell = cellCenter(obj.x, obj.z);
    const group = new THREE.Group();
    group.position.set(cell.x + (obj.facing.dx * CELL) / 2, SILL_Y + HEIGHT / 2, cell.z + (obj.facing.dz * CELL) / 2);
    group.rotation.y = Math.atan2(obj.facing.dx, obj.facing.dz);

    const pane = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, HEIGHT), glass);
    pane.position.z = 0.01;
    group.add(pane);
    const bar = (w, h, x, y) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frame);
      mesh.position.set(x, y, 0.04);
      group.add(mesh);
    };
    bar(WIDTH + BAR, BAR, 0, HEIGHT / 2);
    bar(WIDTH + BAR, BAR, 0, -HEIGHT / 2);
    bar(BAR, HEIGHT, -WIDTH / 2, 0);
    bar(BAR, HEIGHT, WIDTH / 2, 0);
    bar(BAR * 0.6, HEIGHT, 0, 0);
    bar(WIDTH, BAR * 0.6, 0, 0);

    const hand = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), handMaterial.clone());
    hand.position.set(0.18, 0.1, 0.015);
    hand.visible = false;
    group.add(hand);
    scene.add(group);

    const world = new THREE.Vector3();
    group.getWorldPosition(world);
    windows.set(obj.id, { obj, group, hand, position: world, slamAt: -Infinity });
  }

  return {
    get: (id) => windows.get(id),
    slamHand(id, time) {
      windows.get(id).slamAt = time;
    },
    update(time) {
      for (const w of windows.values()) {
        const t = time - w.slamAt;
        if (t < 0 || t > HOLD + PULL) {
          w.hand.visible = false;
          continue;
        }
        w.hand.visible = true;
        // Hits slightly too big, then flattens against the glass.
        const impact = Math.max(0, 1 - t / 0.08);
        w.hand.scale.setScalar(1 + 0.15 * impact);
        const pull = Math.max(0, (t - HOLD) / PULL);
        w.hand.position.y = 0.1 - pull * 0.5;
        w.hand.material.opacity = 1 - pull;
      }
    },
  };
}
