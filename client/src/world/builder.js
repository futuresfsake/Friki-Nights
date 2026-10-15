import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CELL, WALL_HEIGHT } from '../../../shared/constants.js';
import { isSolid } from '../../../shared/mapParser.js';
import { FLOOR_REPEAT, WALL_REPEAT, ceilingTexture, floorTexture, wallTexture } from './textures.js';

// Textures follow world position, so wallpaper and floorboards run on continuously
// from cell to cell instead of restarting every 2 m.
function setUV(geometry, u0, u1, v0, v1) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0);
}

// Wall faces are only built where floor meets wall, then merged into one mesh per
// material: three draw calls for the whole house instead of hundreds.
export function buildHouse(map) {
  const floors = [];
  const ceilings = [];
  const walls = [];

  for (let cz = 0; cz < map.height; cz++) {
    for (let cx = 0; cx < map.width; cx++) {
      if (isSolid(map, cx, cz)) continue;
      const x0 = cx * CELL;
      const z0 = cz * CELL;
      const midX = x0 + CELL / 2;
      const midZ = z0 + CELL / 2;

      const floor = new THREE.PlaneGeometry(CELL, CELL);
      setUV(floor, x0 / FLOOR_REPEAT, (x0 + CELL) / FLOOR_REPEAT, -(z0 + CELL) / FLOOR_REPEAT, -z0 / FLOOR_REPEAT);
      floor.rotateX(-Math.PI / 2);
      floor.translate(midX, 0, midZ);
      floors.push(floor);

      const ceiling = new THREE.PlaneGeometry(CELL, CELL);
      setUV(ceiling, x0 / FLOOR_REPEAT, (x0 + CELL) / FLOOR_REPEAT, z0 / FLOOR_REPEAT, (z0 + CELL) / FLOOR_REPEAT);
      ceiling.rotateX(Math.PI / 2);
      ceiling.translate(midX, WALL_HEIGHT, midZ);
      ceilings.push(ceiling);

      // [neighbour dx, dz, rotation so the face points into this cell, face position]
      const sides = [
        [0, -1, 0, midX, z0],
        [0, 1, Math.PI, midX, z0 + CELL],
        [-1, 0, Math.PI / 2, x0, midZ],
        [1, 0, -Math.PI / 2, x0 + CELL, midZ],
      ];
      for (const [dx, dz, rotation, px, pz] of sides) {
        if (!isSolid(map, cx + dx, cz + dz)) continue;
        const wall = new THREE.PlaneGeometry(CELL, WALL_HEIGHT);
        // Along the wall, in the direction you read it from inside the room.
        const along = dz ? (dz < 0 ? x0 : -(x0 + CELL)) : dx < 0 ? -(z0 + CELL) : z0;
        setUV(wall, along / WALL_REPEAT, (along + CELL) / WALL_REPEAT, 0, 1);
        wall.rotateY(rotation);
        wall.translate(px, WALL_HEIGHT / 2, pz);
        walls.push(wall);
      }
    }
  }

  const group = new THREE.Group();
  const add = (geometries, texture) => {
    const material = new THREE.MeshLambertMaterial({ map: texture });
    group.add(new THREE.Mesh(mergeGeometries(geometries), material));
  };
  add(floors, floorTexture());
  add(ceilings, ceilingTexture());
  add(walls, wallTexture());
  return group;
}
