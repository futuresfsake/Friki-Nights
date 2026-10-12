import * as THREE from 'three';
import { CELL, WALL_HEIGHT } from '../../../shared/constants.js';
import { cellCenter } from '../../../shared/mapParser.js';
import { doorTexture, wallpaperTexture } from './textures.js';

const DOOR_WIDTH = 1.3;
const DOOR_HEIGHT = 2.3;
const JAMB_WIDTH = (CELL - DOOR_WIDTH) / 2;
const THICKNESS = 0.1;
const OPEN_ANGLE = Math.PI * 0.48;
const SWING_SPEED = OPEN_ANGLE / 0.6; // radians per second: a full swing takes 0.6 s

// Builds a frame + hinged panel for every door and exit in the map. Each door is
// built along local x; doors whose walls run north–south are turned 90°.
export function createDoors(map, scene) {
  const materials = {
    door: new THREE.MeshLambertMaterial({ map: doorTexture('door') }),
    locked: new THREE.MeshLambertMaterial({ map: doorTexture('locked') }),
    exit: new THREE.MeshLambertMaterial({ map: doorTexture('exit') }),
    frame: new THREE.MeshLambertMaterial({ map: wallpaperTexture() }),
  };
  const panelGeometry = new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, THICKNESS);
  const jambGeometry = new THREE.BoxGeometry(JAMB_WIDTH, DOOR_HEIGHT, THICKNESS * 2.5);
  const lintelGeometry = new THREE.BoxGeometry(CELL, WALL_HEIGHT - DOOR_HEIGHT, THICKNESS * 2.5);

  const doors = new Map();
  const panels = [];

  for (const obj of map.objects) {
    if (obj.type !== 'door' && obj.type !== 'exit') continue;
    const pos = cellCenter(obj.x, obj.z);
    const group = new THREE.Group();
    group.position.set(pos.x, 0, pos.z);
    if (obj.axis === 'z') group.rotation.y = Math.PI / 2;

    const lintel = new THREE.Mesh(lintelGeometry, materials.frame);
    lintel.position.y = (WALL_HEIGHT + DOOR_HEIGHT) / 2;
    group.add(lintel);
    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(jambGeometry, materials.frame);
      jamb.position.set(side * (DOOR_WIDTH + JAMB_WIDTH) / 2, DOOR_HEIGHT / 2, 0);
      group.add(jamb);
    }

    const hinge = new THREE.Object3D();
    hinge.position.x = -DOOR_WIDTH / 2;
    const kind = obj.type === 'exit' ? 'exit' : obj.locked ? 'locked' : 'door';
    const panel = new THREE.Mesh(panelGeometry, materials[kind]);
    panel.position.set(DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0);
    panel.userData.targetId = obj.id;
    hinge.add(panel);
    group.add(hinge);
    scene.add(group);

    doors.set(obj.id, { obj, group, hinge, angle: 0, target: 0 });
    panels.push(panel);
  }

  const local = new THREE.Vector3();

  return {
    panels,
    has: (id) => doors.has(id),
    get: (id) => doors.get(id),
    // Swings away from whoever opened it, so the door never hits them.
    open(id, from) {
      const d = doors.get(id);
      local.copy(from);
      d.group.worldToLocal(local);
      d.target = local.z > 0 ? OPEN_ANGLE : -OPEN_ANGLE;
    },
    close(id) {
      doors.get(id).target = 0;
    },
    // Instant close for scares like JS-02, where the slam must be sudden.
    slam(id) {
      const d = doors.get(id);
      d.target = 0;
      d.angle = 0;
      d.hinge.rotation.y = 0;
    },
    update(dt) {
      for (const d of doors.values()) {
        if (d.angle === d.target) continue;
        const step = SWING_SPEED * dt;
        const diff = d.target - d.angle;
        d.angle = Math.abs(diff) <= step ? d.target : d.angle + Math.sign(diff) * step;
        d.hinge.rotation.y = d.angle;
      }
    },
  };
}
