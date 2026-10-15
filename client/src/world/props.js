import * as THREE from 'three';
import { WALL_HEIGHT } from '../../../shared/constants.js';
import {
  bloodTexture,
  clockFaceTexture,
  cobwebTexture,
  dollFaceTexture,
  mirrorTexture,
  paperTexture,
  portraitTexture,
  rugTexture,
  woodTexture,
} from './textures.js';

// Furniture and clutter from the map's props list (placed by shared/props.js). Every
// piece is built from boxes and cylinders, centred on its footprint with its back to
// local -z (the wall) and its front to +z. Built once, never changes, except the clock
// pendulum, the rocking chair, the chandelier and the dolls, which move in update().

let materials = null;
function mats() {
  materials ??= {
    wood: new THREE.MeshLambertMaterial({ map: woodTexture() }),
    darkWood: new THREE.MeshLambertMaterial({ color: 0x24170e }),
    iron: new THREE.MeshLambertMaterial({ color: 0x2f2a26 }),
    cloth: new THREE.MeshLambertMaterial({ color: 0x4a2622 }),
    coat: new THREE.MeshLambertMaterial({ color: 0x1b1a1c }),
    void: new THREE.MeshBasicMaterial({ color: 0x020202 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x5a564e }),
    ash: new THREE.MeshLambertMaterial({ color: 0x2b2826 }),
    brass: new THREE.MeshLambertMaterial({ color: 0x8a6d32 }),
    paper: new THREE.MeshLambertMaterial({ map: paperTexture(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
    rug: new THREE.MeshLambertMaterial({ map: rugTexture() }),
    blood: new THREE.MeshLambertMaterial({ map: bloodTexture(), transparent: true, depthWrite: false }),
    face: new THREE.MeshLambertMaterial({ map: clockFaceTexture() }),
    // Dust sheets catch whatever light there is, so they're the first thing you see.
    sheet: new THREE.MeshLambertMaterial({ color: 0xb9b5a9, emissive: 0x16161a }),
    porcelain: new THREE.MeshLambertMaterial({ color: 0xd8d2c4 }),
    dollFace: new THREE.MeshLambertMaterial({ map: dollFaceTexture() }),
    dress: new THREE.MeshLambertMaterial({ color: 0x5a3a44 }),
    hair: new THREE.MeshLambertMaterial({ color: 0x3a2a1a }),
    ivory: new THREE.MeshLambertMaterial({ color: 0xbdb39a }),
    mirror: new THREE.MeshLambertMaterial({ map: mirrorTexture(), emissive: 0x0c0d0d }),
    web: new THREE.MeshBasicMaterial({ map: cobwebTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.8 }),
    wax: new THREE.MeshLambertMaterial({ color: 0xcfc6a8 }),
  };
  return materials;
}

function box(group, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

function cylinder(group, rTop, rBottom, h, material, x, y, z, segments = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

// A flat thing lying on the floor (rug, papers, blood).
function decal(group, w, d, material, y = 0.005) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  group.add(mesh);
  return mesh;
}

function legs(group, w, d, h, material, inset = 0.05, thick = 0.05) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(group, thick, h, thick, material, sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset));
}

function buildChair(g, m) {
  legs(g, 0.44, 0.44, 0.45, m.darkWood);
  box(g, 0.46, 0.05, 0.46, m.wood, 0, 0.47, 0);
  box(g, 0.46, 0.5, 0.04, m.wood, 0, 0.74, -0.21);
}

const BUILDERS = {
  wardrobe(g, m, def) {
    box(g, def.w, def.h, def.d, m.wood, 0, def.h / 2, 0);
    // The left door hangs open a crack onto pure black.
    box(g, def.w / 2 - 0.04, def.h - 0.2, 0.02, m.void, -def.w / 4, def.h / 2, def.d / 2 + 0.005);
    const door = new THREE.Group();
    door.position.set(-def.w / 2 + 0.02, 0, def.d / 2 + 0.01);
    door.rotation.y = -0.35;
    box(door, def.w / 2 - 0.03, def.h - 0.15, 0.03, m.wood, def.w / 4, def.h / 2, 0);
    g.add(door);
    box(g, def.w / 2 - 0.03, def.h - 0.15, 0.03, m.wood, def.w / 4, def.h / 2, def.d / 2 + 0.01);
    box(g, 0.03, 0.08, 0.03, m.brass, 0.06, def.h / 2, def.d / 2 + 0.04);
  },
  bookshelf(g, m, def, rand) {
    box(g, 0.04, def.h, def.d, m.wood, -def.w / 2 + 0.02, def.h / 2, 0);
    box(g, 0.04, def.h, def.d, m.wood, def.w / 2 - 0.02, def.h / 2, 0);
    box(g, def.w, def.h, 0.02, m.wood, 0, def.h / 2, -def.d / 2 + 0.01);
    const colors = [0x4a2018, 0x23302a, 0x3a3020, 0x1e2230, 0x5a4a30];
    for (let shelf = 0; shelf < 5; shelf++) {
      const y = 0.05 + shelf * 0.45;
      box(g, def.w - 0.08, 0.03, def.d, m.wood, 0, y, 0);
      let x = -def.w / 2 + 0.08;
      while (x < def.w / 2 - 0.12 && shelf < 4) {
        const bw = 0.04 + rand() * 0.04;
        const bh = 0.24 + rand() * 0.14;
        if (rand() < 0.15) {
          x += bw + 0.06; // a gap where books were taken
          continue;
        }
        const book = box(g, bw, bh, def.d * 0.8, new THREE.MeshLambertMaterial({ color: colors[Math.floor(rand() * colors.length)] }), x + bw / 2, y + 0.015 + bh / 2, 0.01);
        if (rand() < 0.1) book.rotation.z = 0.35; // leaning over
        x += bw + 0.005;
      }
    }
  },
  clock(g, m, def) {
    box(g, def.w, def.h - 0.4, def.d, m.wood, 0, (def.h - 0.4) / 2, 0);
    box(g, def.w + 0.08, 0.4, def.d + 0.04, m.darkWood, 0, def.h - 0.2, 0);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), m.face);
    face.position.set(0, def.h - 0.22, def.d / 2 + 0.03);
    g.add(face);
    // Glass window onto the pendulum.
    box(g, def.w - 0.16, 0.9, 0.01, m.void, 0, 1.0, def.d / 2 + 0.005);
    const pendulum = new THREE.Group();
    pendulum.position.set(0, 1.4, def.d / 2 + 0.015);
    box(pendulum, 0.015, 0.6, 0.01, m.brass, 0, -0.3, 0);
    cylinder(pendulum, 0.07, 0.07, 0.01, m.brass, 0, -0.62, 0, 10).rotation.x = Math.PI / 2;
    g.add(pendulum);
    return (time) => (pendulum.rotation.z = Math.sin(time * Math.PI) * 0.18);
  },
  bench(g, m, def) {
    box(g, def.w, 0.05, def.d, m.wood, 0, def.h, 0);
    legs(g, def.w, def.d, def.h, m.darkWood, 0.08);
  },
  fireplace(g, m, def) {
    box(g, def.w, def.h, def.d, m.stone, 0, def.h / 2, 0);
    box(g, def.w * 0.6, def.h * 0.6, 0.05, m.void, 0, def.h * 0.3, def.d / 2 - 0.02);
    box(g, def.w + 0.2, 0.08, def.d + 0.12, m.darkWood, 0, def.h + 0.04, 0.04);
    box(g, def.w * 0.4, 0.06, 0.25, m.ash, 0, 0.03, def.d / 2 + 0.05);
  },
  crates(g, m, def) {
    box(g, def.w, 0.65, def.d, m.wood, 0, 0.325, 0);
    const top = box(g, def.w * 0.8, 0.6, def.d * 0.8, m.wood, 0.03, 0.95, 0.02);
    top.rotation.y = 0.3;
  },
  table(g, m, def) {
    box(g, def.w, 0.05, def.d, m.wood, 0, def.h, 0);
    legs(g, def.w, def.d, def.h, m.darkWood, 0.08);
  },
  roundTable(g, m, def) {
    cylinder(g, def.w / 2, def.w / 2, 0.04, m.wood, 0, def.h, 0, 12);
    cylinder(g, 0.05, 0.05, def.h, m.darkWood, 0, def.h / 2, 0);
    cylinder(g, 0.25, 0.25, 0.04, m.darkWood, 0, 0.02, 0, 8);
    // A candle stub burned down to nothing.
    cylinder(g, 0.03, 0.03, 0.06, new THREE.MeshLambertMaterial({ color: 0xcfc6a8 }), 0.12, def.h + 0.05, -0.1, 6);
  },
  chair: (g, m) => buildChair(g, m),
  armchair(g, m, def) {
    box(g, def.w, 0.42, def.d, m.cloth, 0, 0.21, 0);
    box(g, def.w, 0.6, 0.18, m.cloth, 0, 0.7, -def.d / 2 + 0.09);
    for (const sx of [-1, 1]) box(g, 0.14, 0.25, def.d, m.cloth, sx * (def.w / 2 - 0.07), 0.55, 0);
  },
  rockingChair(g, m, def) {
    const seat = new THREE.Group();
    g.add(seat);
    buildChair(seat, m);
    seat.position.y = 0.06;
    for (const sx of [-1, 1]) {
      const rocker = box(seat, 0.04, 0.04, def.d, m.darkWood, sx * 0.19, -0.04, 0);
      rocker.rotation.x = 0.05;
    }
    // Most of the time it's still. Then it rocks, slowly, as if someone just got up.
    let rockUntil = -1;
    let nextRockAt = 20 + Math.random() * 40;
    return (time, events) => {
      if (time >= nextRockAt) {
        rockUntil = time + 6 + Math.random() * 6;
        nextRockAt = rockUntil + 40 + Math.random() * 80;
        events.creak?.();
      }
      const left = rockUntil - time;
      seat.rotation.x = left > 0 ? Math.sin(time * 2.2) * 0.14 * Math.min(1, left / 4) : 0;
    };
  },
  wheelchair(g, m, def) {
    box(g, 0.45, 0.05, 0.45, m.cloth, 0, 0.48, 0);
    box(g, 0.45, 0.45, 0.04, m.cloth, 0, 0.75, -0.22);
    for (const sx of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 4, 14), m.iron);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(sx * 0.27, 0.31, -0.05);
      g.add(wheel);
      cylinder(g, 0.05, 0.05, 0.03, m.iron, sx * 0.18, 0.05, def.d / 2 - 0.1, 6).rotation.z = Math.PI / 2;
    }
  },
  coatRack(g, m) {
    cylinder(g, 0.025, 0.03, 1.8, m.darkWood, 0, 0.9, 0, 6);
    cylinder(g, 0.2, 0.22, 0.04, m.darkWood, 0, 0.02, 0, 6);
    // A long black coat with a hat on top. In the dark, it's a man standing still.
    cylinder(g, 0.16, 0.26, 1.15, m.coat, 0, 1.12, 0.05, 7);
    cylinder(g, 0.13, 0.13, 0.14, m.coat, 0, 1.86, 0.05, 8);
    cylinder(g, 0.22, 0.22, 0.02, m.coat, 0, 1.79, 0.05, 10);
  },
  stool(g, m, def) {
    cylinder(g, 0.18, 0.18, 0.04, m.wood, 0, def.h, 0, 8);
    legs(g, 0.3, 0.3, def.h, m.darkWood, 0.04, 0.03);
  },
  fallenChair(g, m) {
    const chair = new THREE.Group();
    buildChair(chair, m);
    chair.rotation.z = Math.PI / 2;
    chair.position.set(0.24, 0.23, 0);
    g.add(chair);
  },
  bucket(g, m) {
    cylinder(g, 0.16, 0.13, 0.32, m.iron, 0, 0.16, 0, 10);
    cylinder(g, 0.14, 0.14, 0.005, m.void, 0, 0.32, 0, 10);
  },
  rug: (g, m, def) => decal(g, def.w, def.d, m.rug, 0.004),
  bloodstain: (g, m, def) => decal(g, def.w, def.d, m.blood, 0.006),
  papers(g, m, def, rand) {
    for (let i = 0; i < 6; i++) {
      const sheet = decal(g, 0.22, 0.29, m.paper, 0.008 + i * 0.001);
      sheet.position.x = (rand() - 0.5) * def.w;
      sheet.position.z = (rand() - 0.5) * def.d;
      sheet.rotation.z = rand() * Math.PI;
    }
  },
  portrait(g, m, def, rand) {
    box(g, def.w, def.h, 0.04, m.darkWood, 0, 1.75, 0);
    const picture = new THREE.Mesh(
      new THREE.PlaneGeometry(def.w - 0.1, def.h - 0.1),
      new THREE.MeshLambertMaterial({ map: portraitTexture(Math.floor(rand() * 100)) }),
    );
    picture.position.set(0, 1.75, 0.025);
    g.add(picture);
    g.rotation.z = (rand() - 0.5) * 0.12; // hanging crooked
  },
  chains(g, m, def, rand) {
    // Short chains hanging from the ceiling, one ending in an open shackle.
    for (let c = 0; c < 2; c++) {
      const x = (c - 0.5) * 0.25;
      const links = 7 + Math.floor(rand() * 5);
      for (let i = 0; i < links; i++) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 8), m.iron);
        link.position.set(x, WALL_HEIGHT - 0.04 - i * 0.06, 0);
        link.rotation.y = i % 2 ? Math.PI / 2 : 0;
        g.add(link);
      }
      if (c === 0) {
        const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 4, 10, Math.PI * 1.6), m.iron);
        shackle.position.set(x, WALL_HEIGHT - 0.1 - links * 0.06, 0);
        g.add(shackle);
      }
    }
  },
  piano(g, m, def) {
    box(g, def.w, def.h, def.d * 0.6, m.darkWood, 0, def.h / 2, -def.d * 0.2);
    box(g, def.w, 0.08, def.d, m.darkWood, 0, 0.72, 0); // key bed
    box(g, def.w - 0.12, 0.02, 0.16, m.ivory, 0, 0.77, def.d / 2 - 0.1);
    // Black keys in twos and threes; a few missing.
    for (let i = 0; i < 36; i++) {
      if (i % 7 === 2 || i % 7 === 6 || i === 17) continue;
      box(g, 0.012, 0.025, 0.09, m.void, -def.w / 2 + 0.12 + i * 0.036, 0.79, def.d / 2 - 0.13);
    }
    for (const sx of [-1, 1]) box(g, 0.06, 0.72, 0.06, m.darkWood, sx * (def.w / 2 - 0.05), 0.36, def.d / 2 - 0.05);
    box(g, 0.5, 0.3, 0.02, m.paper, 0, 0.98, def.d * 0.1 + 0.01); // sheet music
    box(g, def.w + 0.04, 0.04, def.d * 0.65, m.wood, 0, def.h, -def.d * 0.18);
  },
  stove(g, m, def) {
    box(g, def.w, def.h, def.d, m.iron, 0, def.h / 2, 0);
    box(g, def.w * 0.42, def.h * 0.45, 0.02, m.void, -def.w * 0.2, def.h * 0.35, def.d / 2 + 0.005); // oven
    box(g, def.w * 0.3, def.h * 0.3, 0.02, m.ash, def.w * 0.25, def.h * 0.4, def.d / 2 + 0.005); // firebox
    for (const x of [-0.25, 0.2]) cylinder(g, 0.13, 0.13, 0.02, m.void, x, def.h + 0.01, 0.05, 10);
    cylinder(g, 0.07, 0.07, WALL_HEIGHT - def.h, m.iron, def.w / 2 - 0.15, def.h + (WALL_HEIGHT - def.h) / 2, -def.d / 2 + 0.12, 8);
    // A pot left on the stove, something black dried inside it.
    cylinder(g, 0.13, 0.11, 0.18, m.iron, -0.25, def.h + 0.1, 0.05, 10);
    cylinder(g, 0.12, 0.12, 0.005, m.void, -0.25, def.h + 0.19, 0.05, 10);
  },
  counter(g, m, def) {
    box(g, def.w, def.h - 0.05, def.d, m.wood, 0, (def.h - 0.05) / 2, 0);
    box(g, def.w + 0.04, 0.05, def.d + 0.04, m.stone, 0, def.h - 0.025, 0);
    for (let i = 0; i < 3; i++) box(g, def.w / 3 - 0.06, def.h - 0.2, 0.02, m.darkWood, -def.w / 3 + i * (def.w / 3), (def.h - 0.05) / 2, def.d / 2 + 0.005);
    box(g, 0.55, 0.02, 0.38, m.void, -0.3, def.h + 0.001, 0); // the sink
    cylinder(g, 0.015, 0.015, 0.3, m.brass, -0.3, def.h + 0.15, -def.d / 2 + 0.08, 6);
    box(g, 0.02, 0.02, 0.14, m.brass, -0.3, def.h + 0.3, -def.d / 2 + 0.14);
    // Plates stacked, a knife.
    for (let i = 0; i < 4; i++) cylinder(g, 0.11, 0.1, 0.012, m.porcelain, 0.45, def.h + 0.01 + i * 0.014, 0, 10);
    box(g, 0.02, 0.005, 0.24, m.iron, 0.15, def.h + 0.005, 0.1).rotation.y = 0.6;
  },
  mirror(g, m, def) {
    box(g, def.w, def.h, 0.04, m.darkWood, 0, 1.6, 0);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(def.w - 0.1, def.h - 0.1), m.mirror);
    glass.position.set(0, 1.6, 0.025);
    g.add(glass);
  },
  desk(g, m, def) {
    box(g, def.w, 0.05, def.d, m.wood, 0, def.h, 0);
    box(g, 0.4, def.h - 0.05, def.d, m.wood, def.w / 2 - 0.2, (def.h - 0.05) / 2, 0); // drawers
    for (let i = 0; i < 3; i++) box(g, 0.34, 0.18, 0.02, m.darkWood, def.w / 2 - 0.2, 0.15 + i * 0.22, def.d / 2 + 0.01);
    legs(g, def.w, def.d, def.h, m.darkWood, 0.05);
    const sheet = decal(g, 0.22, 0.29, m.paper, def.h + 0.03);
    sheet.position.x = -0.2;
    sheet.rotation.z = 0.2;
    cylinder(g, 0.04, 0.04, 0.05, m.void, 0.1, def.h + 0.05, -0.15, 8); // inkwell
    cylinder(g, 0.025, 0.025, 0.12, m.wax, -0.45, def.h + 0.085, -0.18, 6); // candle
  },
  sheetChair(g, m, def) {
    // An armchair under a dust sheet. The rounded top reads as a head and shoulders.
    cylinder(g, def.w * 0.42, def.w * 0.56, 0.55, m.sheet, 0, 0.275, 0, 10);
    const back = cylinder(g, def.w * 0.32, def.w * 0.42, 0.5, m.sheet, 0, 0.78, -0.18, 10);
    back.scale.z = 0.6;
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), m.sheet);
    top.position.set(0, 1.03, -0.15);
    top.scale.set(1, 1.1, 0.9);
    g.add(top);
  },
  chandelier(g, m, def, rand) {
    // Hangs from the ceiling and sways, very slowly, with a creak now and then.
    const pivot = new THREE.Group();
    pivot.position.y = WALL_HEIGHT;
    g.add(pivot);
    cylinder(pivot, 0.012, 0.012, 0.6, m.iron, 0, -0.3, 0, 4);
    cylinder(pivot, 0.08, 0.05, 0.25, m.brass, 0, -0.72, 0, 8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(def.w / 2 - 0.1, 0.015, 4, 16), m.brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.82;
    pivot.add(ring);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = def.w / 2 - 0.1;
      if (rand() < 0.8) cylinder(pivot, 0.02, 0.02, 0.07 + rand() * 0.08, m.wax, Math.cos(a) * r, -0.76, Math.sin(a) * r, 5);
      const drop = box(pivot, 0.02, 0.07, 0.02, m.ivory, Math.cos(a + 0.4) * r, -0.9, Math.sin(a + 0.4) * r);
      drop.rotation.y = a;
    }
    let creakAt = 15 + rand() * 40;
    return (time, events) => {
      pivot.rotation.z = Math.sin(time * 0.4) * 0.025;
      pivot.rotation.x = Math.sin(time * 0.31 + 1) * 0.02;
      if (time > creakAt) {
        creakAt = time + 40 + Math.random() * 80;
        events.creak?.();
      }
    };
  },
  doll(g, m) {
    // Sitting on the floor, legs straight out, facing the room. Every so often its
    // head is turned somewhere else.
    const dress = cylinder(g, 0.06, 0.13, 0.18, m.dress, 0, 0.09, 0, 8);
    dress.scale.z = 0.8;
    for (const sx of [-1, 1]) {
      box(g, 0.035, 0.035, 0.16, m.porcelain, sx * 0.04, 0.02, 0.1);
      box(g, 0.03, 0.12, 0.03, m.porcelain, sx * 0.08, 0.12, 0.02).rotation.z = sx * 0.3;
    }
    const head = new THREE.Group();
    head.position.y = 0.2;
    g.add(head);
    // Faces: +x, -x, +y, -y, +z (front, the face), -z.
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.1), [m.porcelain, m.porcelain, m.hair, m.porcelain, m.dollFace, m.hair]);
    skull.position.y = 0.055;
    head.add(skull);
    box(head, 0.11, 0.08, 0.04, m.hair, 0, 0.06, -0.05);
    let turnAt = 10 + Math.random() * 30;
    return (time) => {
      if (time < turnAt) return;
      turnAt = time + 20 + Math.random() * 40;
      head.rotation.y = Math.random() < 0.4 ? 0 : (Math.random() - 0.5) * 3;
      head.rotation.z = (Math.random() - 0.5) * 0.6;
    };
  },
  cobweb(g, m, def, rand) {
    // Strung across the ceiling of the cell (move it into a corner with dx / dz).
    for (let i = 0; i < 2; i++) {
      const web = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.h), m.web);
      web.position.set(0, WALL_HEIGHT - def.h / 2 - i * 0.1, 0);
      web.rotation.y = Math.PI / 4 + (rand() - 0.5) * 0.3;
      web.rotation.x = 0.2;
      g.add(web);
    }
  },
  houseMap(g, m, def) {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.h), m.paper);
    sheet.position.set(0, 1.45, 0.01);
    sheet.userData.targetId = HOUSE_MAP_ID;
    g.add(sheet);
    box(g, 0.02, 0.02, 0.03, m.brass, 0, 1.45 + def.h / 2 - 0.03, 0.02);
  },
};

// The crosshair id of the map pinned on the wall (M2-S21).
export const HOUSE_MAP_ID = 'house-map';

// Seeded so every player sees the same books and papers.
function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// events: { creak(x, y, z), tick(x, y, z, tock) } for the sounds props make.
export function createProps(map, scene, events = {}) {
  const m = mats();
  const animated = [];
  const meshes = [];
  const clocks = [];
  const targets = new Map(); // crosshair id → { group, mesh } for props you can use
  map.props.forEach((p, i) => {
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    g.rotation.y = p.rotation;
    const update = BUILDERS[p.type](g, m, p.def, seeded(1000 + i * 31));
    if (typeof update === 'function') {
      const at = { creak: () => events.creak?.(p.x, 0.6, p.z) };
      animated.push((time) => update(time, at));
    }
    if (p.type === 'clock') clocks.push(p);
    if (p.solid) g.traverse((o) => o.isMesh && meshes.push(o));
    g.traverse((o) => o.userData.targetId && targets.set(o.userData.targetId, { group: g, mesh: o }));
    scene.add(g);
  });

  let lastTick = 0;
  return {
    // Solid props' meshes, so the crosshair can't use things through a wardrobe (rugs
    // and papers are left out: a key lying on a rug must still be pickable).
    meshes,
    // Usable props still in the world (the house map until someone takes it).
    targets: () => [...targets.values()].map((t) => t.mesh),
    has: (id) => targets.has(id),
    // Takes a usable prop out of the world (only on this player's screen).
    take(id) {
      const t = targets.get(id);
      if (!t) return;
      scene.remove(t.group);
      targets.delete(id);
    },
    update(time) {
      for (const fn of animated) fn(time);
      // The clock ticks once a second, tick… tock…
      const tick = Math.floor(time);
      if (tick !== lastTick) {
        lastTick = tick;
        for (const c of clocks) events.tick?.(c.x, 1.4, c.z, tick % 2 === 1);
      }
    },
  };
}
