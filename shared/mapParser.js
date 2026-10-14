import { CELL, MAX_PLAYERS } from './constants.js';
import { PROPS, placeProp } from './props.js';

// One ASCII grid per night, parsed the same way by client and server.
//   # wall   . floor   (space) wall   P player spawn (1–4)   S ceiling light
//   G hall light (off until the fuse box power is restored)   W wall with a window
//   D door   L locked door   X exit door   K key   N note   B battery
//   F fuse box   U fuse   H hiding closet   C bed (hide under it)
//   E entity spawn   T scare trigger
// Details that don't fit in one character come from lists in the map file,
// handed out in reading order: the 1st K gets keys[0], the 1st L gets lockedDoors[0], ...

const OBJECT_TYPES = {
  D: 'door',
  L: 'door',
  X: 'exit',
  K: 'key',
  N: 'note',
  B: 'battery',
  F: 'fuseBox',
  U: 'fuse',
  H: 'closet',
  C: 'bed',
  E: 'entitySpawn',
  T: 'trigger',
};

const DOOR_TYPES = new Set(['door', 'exit']);

export const NOTE_MAX_LENGTH = 280;

export function parseMap(def) {
  const rows = Array.isArray(def) ? def : def.grid;
  const meta = Array.isArray(def) ? {} : def;
  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));

  const solid = [];
  const lights = [];
  const spawns = [];
  const objects = [];
  const counters = { K: 0, L: 0, N: 0, T: 0 };

  for (let z = 0; z < height; z++) {
    const line = [];
    for (let x = 0; x < width; x++) {
      const ch = rows[z][x] ?? ' ';
      if (ch === '#' || ch === ' ' || ch === 'W') {
        line.push(true);
        if (ch === 'W') objects.push({ id: `window-${x}-${z}`, type: 'window', x, z });
        continue;
      }
      line.push(false);
      if (ch === '.') continue;
      if (ch === 'P') spawns.push({ x, z });
      else if (ch === 'S') lights.push({ x, z });
      else if (ch === 'G') lights.push({ x, z, powered: true });
      else if (OBJECT_TYPES[ch]) objects.push(makeObject(ch, x, z, meta, counters));
      else throw new Error(`Unknown map character "${ch}" at ${x},${z}`);
    }
    solid.push(line);
  }

  const eventTriggers = (meta.eventTriggers ?? []).map((t, i) => ({ ...t, id: `event-trigger-${i}` }));
  const map = { id: meta.id ?? 'unnamed', name: meta.name ?? '', intro: meta.intro ?? '', width, height, solid, lights, spawns, objects, eventTriggers };
  validate(map, meta, counters);
  map.props = parseProps(map, meta.props ?? []);
  for (const obj of objects) if (DOOR_TYPES.has(obj.type)) obj.axis = doorAxis(map, obj);
  for (const obj of objects) if (obj.type === 'window') obj.facing = windowFacing(map, obj);
  return map;
}

// Furniture from the map's `props` list (see props.js). Solid props may not sit on an
// object, a spawn, or a door; nothing may sit in a doorway.
function parseProps(map, list) {
  const taken = new Set([...map.objects, ...map.spawns].map((o) => `${o.x},${o.z}`));
  const doors = new Set(map.objects.filter((o) => DOOR_TYPES.has(o.type)).map((o) => `${o.x},${o.z}`));
  return list.map((entry) => {
    const at = `${entry.x},${entry.z}`;
    const name = `prop "${entry.type}" at ${at}`;
    if (!PROPS[entry.type]) throw new Error(`Unknown ${name}`);
    if (isSolid(map, entry.x, entry.z)) throw new Error(`${name} is inside a wall`);
    if (doors.has(at)) throw new Error(`${name} blocks a doorway`);
    if (PROPS[entry.type].solid && taken.has(at)) throw new Error(`${name} sits on an object or spawn`);
    const prop = placeProp(entry, (cx, cz) => isSolid(map, cx, cz));
    if (!prop) throw new Error(`${name} needs a wall to stand against`);
    return prop;
  });
}

function makeObject(ch, x, z, meta, counters) {
  const type = OBJECT_TYPES[ch];
  const obj = { id: `${type}-${x}-${z}`, type, x, z };
  if (ch === 'L') {
    obj.locked = true;
    obj.keyId = listItem(meta.lockedDoors, counters, 'L', 'lockedDoors');
  }
  if (ch === 'K') obj.keyId = listItem(meta.keys, counters, 'K', 'keys');
  if (ch === 'N') obj.text = listItem(meta.notes, counters, 'N', 'notes');
  if (ch === 'T') Object.assign(obj, listItem(meta.triggers, counters, 'T', 'triggers'));
  if (ch === 'F') obj.keyId = meta.fuseBoxKey ?? null;
  return obj;
}

function listItem(list, counters, ch, name) {
  const i = counters[ch]++;
  if (!list || i >= list.length) {
    throw new Error(`Map has more "${ch}" than entries in "${name}" (${i + 1} > ${list?.length ?? 0})`);
  }
  return list[i];
}

function validate(map, meta, counters) {
  if (map.spawns.length === 0) throw new Error('Map has no player spawn (P)');
  if (map.spawns.length > MAX_PLAYERS) throw new Error(`Map has more than ${MAX_PLAYERS} spawns (P)`);

  for (const [ch, name] of [['K', 'keys'], ['L', 'lockedDoors'], ['N', 'notes'], ['T', 'triggers']]) {
    const listed = meta[name]?.length ?? 0;
    if (listed !== counters[ch]) {
      throw new Error(`"${name}" has ${listed} entries but the grid has ${counters[ch]} "${ch}"`);
    }
  }

  const keyIds = new Set(map.objects.filter((o) => o.type === 'key').map((o) => o.keyId));
  for (const o of map.objects) {
    if ((o.locked || o.type === 'fuseBox') && o.keyId && !keyIds.has(o.keyId)) {
      throw new Error(`${o.id} needs key "${o.keyId}", which is not in the map`);
    }
    if (o.type === 'note' && o.text.length > NOTE_MAX_LENGTH) {
      throw new Error(`${o.id} is longer than ${NOTE_MAX_LENGTH} characters`);
    }
  }
  const boxes = map.objects.filter((o) => o.type === 'fuseBox');
  for (const t of [...map.objects.filter((o) => o.type === 'trigger'), ...map.eventTriggers]) {
    if (typeof t.scare !== 'string') throw new Error(`${t.id} has no scare`);
  }
  for (const t of map.objects.filter((o) => o.type === 'trigger' && o.window)) {
    if (!map.objects.some((o) => o.id === t.window && o.type === 'window')) throw new Error(`${t.id} uses "${t.window}", which is not a window`);
  }
  for (const t of map.objects.filter((o) => o.type === 'trigger' && o.door)) {
    if (!map.objects.some((o) => o.id === t.door && o.type === 'door')) throw new Error(`${t.id} slams "${t.door}", which is not a door`);
  }
  for (const t of map.eventTriggers) {
    if (!t.when || typeof t.when.type !== 'string') throw new Error(`${t.id} needs a "when" with an event type`);
  }
  if (boxes.length > 1) throw new Error('Map has more than one fuse box (F)');
  if (boxes.length && !wallSide(map, boxes[0].x, boxes[0].z)) {
    throw new Error(`${boxes[0].id} must be next to a wall to hang on`);
  }
}

// A door sits in a gap between two walls. 'x' means the panel runs along the x axis
// (walls to its west and east), 'z' means walls to its north and south.
function doorAxis(map, { x, z, id }) {
  if (isSolid(map, x - 1, z) && isSolid(map, x + 1, z)) return 'x';
  if (isSolid(map, x, z - 1) && isSolid(map, x, z + 1)) return 'z';
  throw new Error(`${id} must have walls on two opposite sides`);
}

// The first wall found around a cell (north, south, west, east), for things that stand
// or hang against a wall. rotation turns an object built facing +z so its back is on
// that wall; dx/dz point from the cell towards the wall.
const WALL_SIDES = [
  { dx: 0, dz: -1, rotation: 0 },
  { dx: 0, dz: 1, rotation: Math.PI },
  { dx: -1, dz: 0, rotation: Math.PI / 2 },
  { dx: 1, dz: 0, rotation: -Math.PI / 2 },
];
export function wallSide(map, cx, cz) {
  return WALL_SIDES.find(({ dx, dz }) => isSolid(map, cx + dx, cz + dz)) ?? null;
}

// A window is a wall cell seen from exactly one floor cell; facing points from the
// window towards that floor cell.
function windowFacing(map, { x, z, id }) {
  const open = WALL_SIDES.filter(({ dx, dz }) => !isSolid(map, x + dx, z + dz));
  if (open.length !== 1) throw new Error(`${id} must face exactly one floor cell`);
  return { dx: open[0].dx, dz: open[0].dz };
}

// Out-of-bounds counts as wall so nothing can leave the map.
export function isSolid(map, cx, cz) {
  if (cz < 0 || cz >= map.height || cx < 0 || cx >= map.width) return true;
  return map.solid[cz][cx];
}

export function cellCenter(cx, cz) {
  return { x: (cx + 0.5) * CELL, z: (cz + 0.5) * CELL };
}

export function cellAt(x, z) {
  return { cx: Math.floor(x / CELL), cz: Math.floor(z / CELL) };
}
