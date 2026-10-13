import * as THREE from 'three';
import { PIXEL_RATIO, PLAYER_RADIUS } from '../../shared/constants.js';
import { cellAt, cellCenter, parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { apply, blocksMovement, createNightState } from '../../shared/nightState.js';
import { createTriggers, enterCell, onEvent } from '../../shared/triggers.js';
import { doorSlamScare } from './scares/doorSlam.js';
import { createEffects } from './scares/effects.js';
import { faceInFlashlight } from './scares/faceInFlashlight.js';
import { whisperScare } from './scares/whisper.js';
import { windowHandScare } from './scares/windowHand.js';
import { createScares } from './scares/scares.js';
import { createAudioEngine } from './audio/engine.js';
import {
  doorCreak,
  doorRattle,
  doorShut,
  doorSlam,
  flashlightClick,
  footstep,
  glassBang,
  fuseClunk,
  knocks,
  pickupClink,
  powerOn,
  screamSting,
  startDrone,
  whispers,
} from './audio/sfx.js';
import { overlapsCell } from './player/collision.js';
import { addBattery } from './player/battery.js';
import { createController } from './player/controller.js';
import { createFlashlight } from './player/flashlight.js';
import { createInteraction } from './player/interact.js';
import { createEndScreen } from './ui/endScreen.js';
import { createHud } from './ui/hud.js';
import { createInventory } from './ui/inventory.js';
import { createMoveSender } from './net/moves.js';
import { askName, connectWithAccess, hideLobby } from './ui/lobby.js';
import { createRoomLobby } from './ui/room.js';
import { createNoteReader } from './ui/notes.js';
import { createBeds } from './world/beds.js';
import { buildHouse } from './world/builder.js';
import { createDoors } from './world/doors.js';
import { createFuseBox } from './world/fuseBox.js';
import { createItems, itemName } from './world/items.js';
import { blackOutCeilingLights, createCeilingLights, switchOnHallLights, updateCeilingLights } from './world/lights.js';
import { createWindows } from './world/windows.js';

const FOG_COLOR = 0x050507;
let PLAYER_ID = 'local'; // replaced by our server id when the night starts

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
// Conditions a trigger's `onlyIf` may ask about.
const triggers = createTriggers(map, {
  check: (c, playerId) =>
    (!c.doorOpen || night.doors[c.doorOpen]?.open) && (!c.hasKey || night.players[playerId]?.keys.includes(c.hasKey)),
});
const house = buildHouse(map);
scene.add(house);
const ceilingLights = createCeilingLights(map, scene);
const doors = createDoors(map, scene);
const beds = createBeds(map, scene);
const items = createItems(map, scene);
const fuseBox = createFuseBox(map, scene, night.fusesNeeded);
const windows = createWindows(map, scene);

// Door and bed cells, so collision can ask "is a closed door or a bed here?" in constant time.
const objectCells = new Map();
for (const o of map.objects) if (doors.has(o.id) || beds.has(o.id)) objectCells.set(`${o.x},${o.z}`, o.id);
const objectBlocks = (cx, cz) => {
  const id = objectCells.get(`${cx},${cz}`);
  return !!id && blocksMovement(night, id);
};

const hud = createHud();
const inventory = createInventory();
const reader = createNoteReader();
const endScreen = createEndScreen({ onPlayAgain: () => location.reload() });
const exitDoor = map.objects.find((o) => o.type === 'exit');
const effects = createEffects();
// Everything a scare may use. Scares are registered by id in later stories.
const scares = createScares({
  isUiOpen: () => !player.controls.isLocked || reader.isOpen() || ended,
  ctx: {
    camera,
    scene,
    doors,
    effects,
    now: () => clock.elapsedTime,
    audio: () => audio,
    sting: () => audio && screamSting(audio),
    slamDoor,
    whispers,
    windows,
    glassBang,
  },
});
scares.register('JS-01', faceInFlashlight);
scares.register('JS-02', doorSlamScare);
scares.register('whisper', whisperScare);
scares.register('JS-06', windowHandScare);
let playTime = 0; // seconds actually playing, not paused
let ended = false;
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
  targets: () => [...doors.panels, ...beds.meshes, ...items.targets(), ...(fuseBox?.targets ?? [])],
});

let nextKnockAt = 20;
let hiding = null; // { bedId, stood } while under a bed

// Connected game server; the lobby covers the game until the server lets us in.
let socket = null;
let playerName = null;
let moves = null;
const look = new THREE.Euler(0, 0, 0, 'YXZ');
connectWithAccess().then(async (s) => {
  playerName = await askName();
  const room = createRoomLobby(s);
  await room.choose(playerName);
  const start = await room.waitForStart();
  PLAYER_ID = room.playerId;
  const me = start.players.find((p) => p.id === PLAYER_ID);
  player.placeAt(me.x, me.z);
  hud.setIntro(`NIGHT 1 · ${map.name.toUpperCase()}`, map.intro);
  socket = s;
  moves = createMoveSender((move) => socket.volatile.emit('player:move', move));
  // The server refused a move (too fast, or into a wall): go back to where it saw us.
  socket.on('player:correct', ({ x, z }) => player.placeAt(x, z));
  hideLobby();
});

hud.overlay.addEventListener('click', () => {
  if (ended || !socket) return;
  if (!audio) {
    audio = createAudioEngine();
    startDrone(audio);
  }
  audio.ctx.resume();
  player.controls.lock();
});
player.controls.addEventListener('lock', () => hud.hideOverlay());
player.controls.addEventListener('unlock', () => {
  if (ended) return;
  // Esc while reading puts the note down; the browser also leaves pointer lock, so pause.
  reader.close();
  hud.showOverlay(true);
  inventory.hide();
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Tab would move browser focus, so it is always swallowed while playing.
addEventListener('keydown', (e) => {
  if (e.code !== 'Tab') return;
  e.preventDefault();
  if (player.controls.isLocked) inventory.show(night.players[PLAYER_ID]);
});
addEventListener('keyup', (e) => {
  if (e.code === 'Tab') inventory.hide();
});
addEventListener('blur', () => inventory.hide());

addEventListener('keydown', (e) => {
  if (e.code !== 'KeyE' || e.repeat || !player.controls.isLocked) return;
  if (reader.isOpen()) {
    reader.close();
    return;
  }
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
  for (const trigger of onEvent(triggers, event)) fireScare(trigger);
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
      if (event.item === 'battery') flashlight.state.battery = addBattery(flashlight.state.battery, event.amount);
      hud.toast(`Picked up: ${itemName(item.obj)}`);
      if (audio) pickupClink(audio);
      break;
    }
    case 'note-read':
      reader.open(event.text);
      hud.setPrompt(null);
      if (audio) pickupClink(audio);
      break;
    case 'fusebox-unlocked':
      fuseBox.open();
      hud.toast('The fuse box swings open.');
      if (audio) fuseClunk(audio, fuseBox.position.x, fuseBox.position.y, fuseBox.position.z);
      break;
    case 'fuse-placed':
      fuseBox.setPlaced(event.placed);
      hud.toast(`Fuse in place (${event.placed}/${event.needed}).`);
      if (audio) fuseClunk(audio, fuseBox.position.x, fuseBox.position.y, fuseBox.position.z);
      break;
    case 'power-on':
      switchOnHallLights(ceilingLights, clock.elapsedTime);
      hud.toast('The power is back. Somewhere, a lock clicks.');
      if (audio) powerOn(audio);
      break;
    case 'night-complete':
      ended = true;
      player.controls.unlock();
      hud.setPrompt(null);
      endScreen.show({
        title: `${map.name.toUpperCase()} — NIGHT COMPLETE`,
        seconds: playTime,
        notesFound: night.notesRead.size,
        notesTotal: Object.keys(night.notes).length,
      });
      break;
    case 'door-slammed':
      doors.slam(event.targetId);
      if (audio) doorSlam(audio, at.x, 1.2, at.z);
      break;
    case 'door-unlocked':
      hud.toast('Unlocked.');
      break;
    case 'denied':
      if (event.reason === 'locked') {
        hud.toast("It's locked.");
        if (audio && at) doorRattle(audio, at.x, 1.2, at.z);
      }
      if (event.reason === 'need-fuses') {
        const box = night.fuseBox;
        hud.toast(`Empty slots. It needs fuses (${box.placed}/${night.fusesNeeded}).`);
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
  if (id === fuseBox?.obj.id) {
    const box = night.fuseBox;
    if (box.locked) return 'Open fuse box';
    if (night.power) return null;
    const carrying = night.players[PLAYER_ID]?.fuses ?? 0;
    return carrying ? `Place fuse (${box.placed}/${night.fusesNeeded})` : `Fuse box (${box.placed}/${night.fusesNeeded})`;
  }
  if (items.get(id)?.obj.type === 'note') return 'Read note';
  if (items.has(id)) return `Pick up ${itemName(items.get(id).obj).toLowerCase()}`;
  const door = night.doors[id];
  if (door?.exit) return door.open ? 'Close front door' : 'Open front door';
  if (door) return door.open ? 'Close door' : 'Open door';
  return null;
}

// Shuts a door for a scare as soon as nobody stands in its doorway (gives up after 5 s).
function slamDoor(id, then) {
  const obj = doors.get(id).obj;
  const started = clock.elapsedTime;
  const attempt = () => {
    if (overlapsCell(camera.position.x, camera.position.z, PLAYER_RADIUS, obj.x, obj.z)) {
      if (clock.elapsedTime - started < 5) setTimeout(attempt, 50);
      return;
    }
    const events = apply(night, { type: 'slam-door', playerId: PLAYER_ID, targetId: id });
    for (const event of events) handleEvent(event);
    if (events.length) then();
  };
  attempt();
}

function fireScare(trigger) {
  scares.playScare(trigger.scare, trigger);
}

// Stepping into the open exit's doorway leaves the house.
function checkExit() {
  if (!exitDoor || ended || !night.doors[exitDoor.id].open) return;
  const { cx, cz } = cellAt(camera.position.x, camera.position.z);
  if (cx !== exitDoor.x || cz !== exitDoor.z) return;
  for (const event of apply(night, { type: 'reach-exit', playerId: PLAYER_ID })) handleEvent(event);
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

  // Reading a note pauses the game: nothing moves and the battery doesn't drain.
  if (player.controls.isLocked && !reader.isOpen()) {
    player.update(dt);
    flashlight.update(dt, time);
    hud.setBattery(flashlight.state.battery);
    hud.setPrompt(describe(interaction.lookTarget()));
    maybeKnock(time);
    playTime += dt;
    checkExit();
    look.setFromQuaternion(camera.quaternion);
    moves?.update({ x: camera.position.x, z: camera.position.z, yaw: look.y, pitch: look.x });
    const cell = cellAt(camera.position.x, camera.position.z);
    for (const trigger of enterCell(triggers, PLAYER_ID, cell.cx, cell.cz)) fireScare(trigger);
  }
  scares.update();
  doors.update(dt);
  items.update(time);
  fuseBox?.update(dt);
  windows.update(time);
  updateCeilingLights(ceilingLights, time);
  if (effects.isBlackout(time)) {
    blackOutCeilingLights(ceilingLights);
    flashlight.spot.intensity = 0;
  }
  camera.updateMatrixWorld();
  if (audio) audio.updateListener(camera);

  // Shake only moves the camera for the render, so it never affects collision.
  const shake = effects.shakeOffset(time);
  camera.position.x += shake.x;
  camera.position.y += shake.y;
  camera.position.z += shake.z;
  renderer.render(scene, camera);
  camera.position.x -= shake.x;
  camera.position.y -= shake.y;
  camera.position.z -= shake.z;
});
