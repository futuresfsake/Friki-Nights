import * as THREE from 'three';
import { PIXEL_RATIO, PLAYER_RADIUS } from '../../shared/constants.js';
import { cellCenter, parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { apply, blocksMovement, createNightState } from '../../shared/nightState.js';
import { createAudioEngine } from './audio/engine.js';
import { doorCreak, doorRattle, doorShut, flashlightClick, footstep, knocks, pickupClink, startDrone } from './audio/sfx.js';
import { overlapsCell } from './player/collision.js';
import { createController } from './player/controller.js';
import { createFlashlight } from './player/flashlight.js';
import { createInteraction } from './player/interact.js';
import { createHud } from './ui/hud.js';
import { createBeds } from './world/beds.js';
import { buildHouse } from './world/builder.js';
import { createDoors } from './world/doors.js';
import { createItems, itemName } from './world/items.js';
import { createCeilingLights, updateCeilingLights } from './world/lights.js';

const FOG_COLOR = 0x050507;
const PLAYER_ID = 'local'; // single player until M3 gives each player a server id

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(PIXEL_RATIO);
renderer.setSize(innerWidth, innerHeight);
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(FOG_COLOR);
scene.fog = new THREE.FogExp2(FOG_COLOR, 0.11);
scene.add(new THREE.AmbientLight(0x3a3a55, 0.4));

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 60);
scene.add(camera); // the flashlight is a child of the camera, so the camera must be in the scene

const map = parseMap(night1);
const night = createNightState(map);
const house = buildHouse(map);
scene.add(house);
const ceilingLights = createCeilingLights(map, scene);
const doors = createDoors(map, scene);
const beds = createBeds(map, scene);
const items = createItems(map, scene);

// Door and bed cells, so collision can ask "is a closed door or a bed here?" in constant time.
const objectCells = new Map();
for (const o of map.objects) if (doors.has(o.id) || beds.has(o.id)) objectCells.set(`${o.x},${o.z}`, o.id);
const objectBlocks = (cx, cz) => {
  const id = objectCells.get(`${cx},${cz}`);
  return !!id && blocksMovement(night, id);
};

const hud = createHud();
let audio = null;

const player = createController(camera, document.body, map, {
  onStep: (running) => audio && footstep(audio, running),
  extraSolid: objectBlocks,
});
const flashlight = createFlashlight(camera, {
  onToggle: () => audio && flashlightClick(audio),
});
const interaction = createInteraction(camera, {
  blockers: house.children,
  targets: () => [...doors.panels, ...beds.meshes, ...items.targets()],
});

let nextKnockAt = 20;
let hiding = null; // { bedId, stood } while under a bed

hud.overlay.addEventListener('click', () => {
  if (!audio) {
    audio = createAudioEngine();
    startDrone(audio);
  }
  audio.ctx.resume();
  player.controls.lock();
});
player.controls.addEventListener('lock', () => hud.hideOverlay());
player.controls.addEventListener('unlock', () => hud.showOverlay(true));

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

addEventListener('keydown', (e) => {
  if (e.code !== 'KeyE' || e.repeat || !player.controls.isLocked) return;
  // Ignore E while still crawling out, so a new hide never starts inside the bed.
  if (!hiding && player.crawling()) return;
  // Under a bed, E always crawls back out, wherever the player is looking.
  const id = hiding ? hiding.bedId : interaction.lookTarget();
  if (id) interact(id);
});

function interact(id) {
  const obj = doors.get(id)?.obj;
  // Never close a door on the player standing in its doorway.
  if (obj && night.doors[id]?.open && overlapsCell(camera.position.x, camera.position.z, PLAYER_RADIUS, obj.x, obj.z)) {
    hud.toast('Step out of the doorway first.');
    return;
  }
  for (const event of apply(night, { type: 'interact', playerId: PLAYER_ID, targetId: id })) {
    handleEvent(event);
  }
}

function handleEvent(event) {
  const door = doors.get(event.targetId);
  const at = door ? cellCenter(door.obj.x, door.obj.z) : null;
  switch (event.type) {
    case 'door-opened':
      doors.open(event.targetId, camera.position);
      if (audio) doorCreak(audio, at.x, 1.2, at.z);
      break;
    case 'door-closed':
      doors.close(event.targetId);
      if (audio) doorShut(audio, at.x, 1.2, at.z);
      break;
    case 'hid': {
      const bed = beds.get(event.targetId);
      hiding = { bedId: event.targetId, stood: player.hideAt(bed.under) };
      if (bed.lookYaw !== null) camera.rotation.set(0, bed.lookYaw, 0, 'YXZ');
      if (audio) footstep(audio, false);
      break;
    }
    case 'left-hiding':
      player.standAt(hiding.stood);
      hiding = null;
      if (audio) footstep(audio, false);
      break;
    case 'item-taken': {
      const item = items.get(event.targetId);
      items.remove(event.targetId);
      hud.toast(`Picked up: ${itemName(item.obj)}`);
      if (audio) pickupClink(audio);
      break;
    }
    case 'door-unlocked':
      hud.toast('Unlocked.');
      break;
    case 'denied':
      if (event.reason === 'locked') {
        hud.toast("It's locked.");
        if (audio && at) doorRattle(audio, at.x, 1.2, at.z);
      }
      if (event.reason === 'bed-taken') hud.toast("Someone's already under there.");
      if (event.reason === 'exit-sealed') {
        hud.toast("It won't budge.");
        if (audio && at) doorRattle(audio, at.x, 1.2, at.z);
      }
      break;
  }
}

function describe(id) {
  if (hiding) return 'Crawl out';
  if (!id) return null;
  if (beds.has(id)) return 'Hide under bed';
  if (items.has(id)) return `Pick up ${itemName(items.get(id).obj).toLowerCase()}`;
  const door = night.doors[id];
  if (door?.exit) return door.open ? 'Close front door' : 'Open front door';
  if (door) return door.open ? 'Close door' : 'Open door';
  return null;
}

// Knocks come from a random direction a few metres away, so the player turns to look.
function maybeKnock(time) {
  if (!audio || time < nextKnockAt) return;
  nextKnockAt = time + 30 + Math.random() * 40;
  const angle = Math.random() * Math.PI * 2;
  const distance = 4 + Math.random() * 4;
  knocks(
    audio,
    camera.position.x + Math.cos(angle) * distance,
    1.5,
    camera.position.z + Math.sin(angle) * distance,
  );
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  // Clamped so a frozen tab can't make the player jump through a wall on return.
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = clock.elapsedTime;

  if (player.controls.isLocked) {
    player.update(dt);
    flashlight.update(dt, time);
    hud.setBattery(flashlight.state.battery);
    hud.setPrompt(describe(interaction.lookTarget()));
    maybeKnock(time);
  }
  doors.update(dt);
  items.update(time);
  updateCeilingLights(ceilingLights, time);
  camera.updateMatrixWorld();
  if (audio) audio.updateListener(camera);

  renderer.render(scene, camera);
});
