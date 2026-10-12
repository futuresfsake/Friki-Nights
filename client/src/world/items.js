import * as THREE from 'three';
import { cellCenter } from '../../../shared/mapParser.js';
import { paperTexture } from './textures.js';

const HITBOX = 0.5; // small things are hard to aim at, so each gets a bigger invisible target

// Small pick-up-able things lying on the floor. Each item type has a builder below;
// later stories add more. Everything is built from primitives, no model files.
const builders = {
  key: buildKey,
  note: buildNote,
  battery: buildBattery,
  fuse: buildFuse,
};

const brass = new THREE.MeshPhongMaterial({ color: 0xb08d3c, specular: 0xfff1c0, shininess: 60 });

function buildKey() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 4, 10), brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.x = -0.07;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.014), brass);
  shaft.position.x = 0.025;
  const bit = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.04), brass);
  bit.position.set(0.07, 0, 0.02);
  group.add(ring, shaft, bit);
  group.position.y = 0.03;
  return group;
}

function buildBattery() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.11, 8),
    new THREE.MeshPhongMaterial({ color: 0x2b2f2a, specular: 0x555555, shininess: 30 }),
  );
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.04, 8), new THREE.MeshLambertMaterial({ color: 0x8a2a1e }));
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 6), brass);
  label.position.y = 0.01;
  tip.position.y = 0.061;
  group.add(body, label, tip);
  // Lying on its side, as if dropped.
  group.rotation.z = Math.PI / 2;
  group.position.y = 0.03;
  return group;
}

// Old screw-in ceramic fuse with a brass cap.
function buildFuse() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.05, 8), new THREE.MeshLambertMaterial({ color: 0xd8d0c0 }));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8), brass);
  cap.position.y = 0.04;
  group.add(body, cap);
  group.position.y = 0.025;
  return group;
}

let paper = null;

function buildNote() {
  paper ??= new THREE.MeshLambertMaterial({ map: paperTexture(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), paper);
  sheet.rotation.x = -Math.PI / 2;
  sheet.position.y = 0.01;
  return sheet;
}

export function createItems(map, scene) {
  const hitboxGeometry = new THREE.BoxGeometry(HITBOX, HITBOX, HITBOX);
  const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const items = new Map();
  const targets = [];

  for (const obj of map.objects) {
    const build = builders[obj.type];
    if (!build) continue;
    const pos = cellCenter(obj.x, obj.z);
    const root = new THREE.Group();
    root.position.set(pos.x, 0, pos.z);
    root.rotation.y = (obj.x * 7 + obj.z * 13) % 6; // varied, but the same on every load
    const model = build(obj);
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.y = HITBOX / 2;
    hitbox.userData.targetId = obj.id;
    root.add(model, hitbox);
    scene.add(root);
    items.set(obj.id, { obj, root, model, hitbox, spin: obj.type === 'key' });
    targets.push(hitbox);
  }

  return {
    targets: () => targets.filter((t) => t.parent.visible),
    has: (id) => items.has(id),
    get: (id) => items.get(id),
    remove(id) {
      const item = items.get(id);
      if (item) item.root.visible = false;
    },
    // Keys turn slowly so their brass catches the flashlight now and then.
    update(time) {
      for (const item of items.values()) {
        if (item.spin) item.model.rotation.y = time * 0.6;
      }
    },
  };
}

// "parlor" → "Parlor key"
export function itemName(obj) {
  if (obj.type === 'note') return 'note';
  if (obj.type === 'battery') return 'Battery';
  if (obj.type === 'fuse') return 'Fuse';
  if (obj.type === 'key') return `${obj.keyId[0].toUpperCase()}${obj.keyId.slice(1)} key`;
  return obj.type;
}
