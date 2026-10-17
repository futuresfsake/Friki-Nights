import * as THREE from 'three';
import { MAX_PIXEL_RATIO, PIXEL_RATIO, PLAYER_RADIUS } from '../../shared/constants.js';
import { cellAt, cellCenter, parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { applyEvent, blocksMovement, createNightState } from '../../shared/nightState.js';
import { doorSlamScare } from './scares/doorSlam.js';
import { createEffects } from './scares/effects.js';
import { paintBloodSplatter } from './world/textures.js';
import { faceInFlashlight } from './scares/faceInFlashlight.js';
import { blackoutGiggleScare } from './scares/blackoutGiggle.js';
import { breathBehindScare } from './scares/breathBehind.js';
import { lightsOutScare } from './scares/lightsOut.js';
import { pianoScare } from './scares/pianoScare.js';
import { portraitCrashScare } from './scares/portraitCrash.js';
import { scratchingScare } from './scares/scratching.js';
import { fuseStingScare } from './scares/fuseSting.js';
import { whisperScare } from './scares/whisper.js';
import { windowHandScare } from './scares/windowHand.js';
import { createScares } from './scares/scares.js';
import { createAudioEngine } from './audio/engine.js';
import {
  bloodDrip,
  breathing,
  clockTick,
  doorCreak,
  doorRattle,
  doorShut,
  doorSlam,
  flashlightClick,
  footstep,
  footstepAt,
  discordPiano,
  frameCrash,
  glassBang,
  scratching,
  fuseClunk,
  giggle,
  knocks,
  musicBox,
  pickupClink,
  powerOn,
  screamSting,
  startDrone,
  whispers,
  woodCreak,
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
import { createPartners } from './net/partners.js';
import { askName, connectWithAccess, hideLobby } from './ui/lobby.js';
import { createRoomLobby } from './ui/room.js';
import { createBallerinaModel } from './tenant/ballerina.js';
import { createTenantModel } from './tenant/model.js';
import { createTenant } from './tenant/tenant.js';
import { createNoteReader } from './ui/notes.js';
import { createBeds } from './world/beds.js';
import { buildHouse } from './world/builder.js';
import { createDoors } from './world/doors.js';
import { createFuseBox } from './world/fuseBox.js';
import { createItems, itemName } from './world/items.js';
import { createPartnerModel } from './world/partnerModel.js';
import { createProps, HOUSE_MAP_ID } from './world/props.js';
import { createHouseMapView } from './ui/houseMap.js';
import { createReveal } from './ui/mapReveal.js';
import { blackOutCeilingLights, createCeilingLights, switchOnHallLights, updateCeilingLights } from './world/lights.js';
import { createWindows } from './world/windows.js';

const FOG_COLOR = 0x050507;
let PLAYER_ID = 'local'; // replaced by our server id when the night starts

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(MAX_PIXEL_RATIO, Math.max(PIXEL_RATIO, devicePixelRatio)));
renderer.setSize(innerWidth, innerHeight);
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(FOG_COLOR);
scene.fog = new THREE.FogExp2(FOG_COLOR, 0.11);
scene.add(new THREE.AmbientLight(0x3a3a55, 0.4));

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 60);
scene.add(camera); // the flashlight is a child of the camera, so the camera must be in the scene

const map = parseMap(night1);
// Our copy of the night. The server owns the real one (M3-S11); this copy only
// changes through the events it sends (applyEvent), so it always matches.
const night = createNightState(map);
const names = new Map(); // player id → display name, for "Ana picked up …"
const pendingSlams = new Map(); // door id → what our scare does once the server slams it
// Scripted scares by trigger id; the server decides when one plays and for whom (M3-S12).
const triggerById = new Map([...map.objects.filter((o) => o.type === 'trigger'), ...map.eventTriggers].map((t) => [t.id, t]));
const house = buildHouse(map);
scene.add(house);
const ceilingLights = createCeilingLights(map, scene);
const doors = createDoors(map, scene);
const beds = createBeds(map, scene);
const items = createItems(map, scene);
const fuseBox = createFuseBox(map, scene, night.fusesNeeded);
const windows = createWindows(map, scene);
const props = createProps(map, scene, {
  creak: (x, y, z) => audio && woodCreak(audio, x, y, z),
  tick: (x, y, z, tock) => audio && clockTick(audio, x, y, z, tock),
  drip: (x, y, z) => audio && bloodDrip(audio, x, y, z),
});
const partners = createPartners(scene, {
  makeModel: createPartnerModel,
  onStep: (x, z, running) => audio && footstepAt(audio, x, z, running),
});

// Door and bed cells, so collision can ask "is a closed door or a bed here?" in constant time.
const objectCells = new Map();
for (const o of map.objects) if (doors.has(o.id) || beds.has(o.id)) objectCells.set(`${o.x},${o.z}`, o.id);
const objectBlocks = (cx, cz) => {
  const id = objectCells.get(`${cx},${cz}`);
  return !!id && blocksMovement(night, id);
};
// Closed doors block sight; beds are low enough to see over.
const doorBlocks = (cx, cz) => {
  const id = objectCells.get(`${cx},${cz}`);
  return !!id && doors.has(id) && blocksMovement(night, id);
};

const hud = createHud();
const houseMap = createHouseMapView(map);
const reveal = createReveal(map);
let hasMap = false;
const inventory = createInventory();
const reader = createNoteReader();
const endScreen = createEndScreen({ onPlayAgain: () => location.reload() });
const exitDoor = map.objects.find((o) => o.type === 'exit');
const effects = createEffects();
// Blood on the screen after a jump scare, repainted for every new splash.
const bloodCanvas = document.getElementById('blood');
let bloodCount = 0;
function showBlood(time) {
  const { amount, count } = effects.bloodOnScreen(time);
  if (count !== bloodCount) {
    bloodCount = count;
    bloodCanvas.width = Math.round(innerWidth / 2);
    bloodCanvas.height = Math.round(innerHeight / 2);
    paintBloodSplatter(bloodCanvas);
  }
  bloodCanvas.style.opacity = amount;
  // It runs: the whole splash slides slowly down the screen.
  bloodCanvas.style.transform = `translateY(${(1 - amount) * 6}vh)`;
}
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
    scream: () => audio && ghostScream(audio),
    breathe: (x, z, seconds) => audio && breathing(audio, x, 1.6, z, seconds),
    giggle: (x, z) => audio && giggle(audio, x, 1.65, z, 1),
    slamDoor,
    whispers,
    windows,
    glassBang,
    scratching,
    frameCrash,
    discordPiano,
  },
});
scares.register('JS-01', faceInFlashlight);
scares.register('JS-02', doorSlamScare);
scares.register('whisper', whisperScare);
scares.register('JS-03', lightsOutScare);
scares.register('scratching', scratchingScare);
scares.register('JS-06', windowHandScare);
scares.register('JS-04', pianoScare);
scares.register('JS-08', breathBehindScare);
scares.register('JS-09', blackoutGiggleScare);
scares.register('JS-05', fuseStingScare);
scares.register('JS-10', portraitCrashScare);
// Clara dances in the Ballroom (MH-S05): the Tenant plays her, for this player only,
// the first time they walk in.
let metClara = false;
scares.register('ballerina', () => {
  if (!metClara) metClara = !!tenant?.summon('ballerina');
});
let playTime = 0; // seconds actually playing, not paused
let ended = false;
let audio = null;

const player = createController(camera, document.body, map, {
  onStep: (running) => {
    if (audio) footstep(audio, running);
    tenant?.onStep(running);
  },
  extraSolid: objectBlocks,
});
const flashlight = createFlashlight(camera, {
  onToggle: () => audio && flashlightClick(audio),
});
const interaction = createInteraction(camera, {
  blockers: [...house.children, ...props.meshes],
  targets: () => [...doors.panels, ...beds.meshes, ...items.targets(), ...(fuseBox?.targets ?? []), ...props.targets()],
});

let nextKnockAt = 20;
let tenant = null; // the man in the walls; created once we know the player's name
// His sounds, each silent until audio exists.
const tenantSounds = {
  step: (x, z, running, loudness) => audio && footstepAt(audio, x, z, running, { barefoot: true, loudness: 4 * loudness }),
  giggle: (x, z, loudness) => audio && giggle(audio, x, 1.65, z, loudness),
  whisper: (x, z, seconds) => audio && whispers(audio, x, 1.6, z, seconds),
  breathing: (x, z, seconds) => (audio ? breathing(audio, x, 1.5, z, seconds) : null),
  knocks: (x, z) => audio && knocks(audio, x, 1.2, z),
  rattle: (x, z) => audio && doorRattle(audio, x, 1.2, z),
  sting: () => audio && screamSting(audio),
  scream: () => audio && ghostScream(audio),
  musicBox: (x, z, seconds) => (audio ? musicBox(audio, x, 1.0, z, seconds) : null),
};
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
  for (const p of start.players) {
    names.set(p.id, p.name);
    if (p.id !== PLAYER_ID) partners.add(p);
  }
  tenant = createTenant({
    scene,
    map,
    model: createTenantModel(),
    ballerina: createBallerinaModel(),
    sounds: tenantSounds,
    effects,
    hud,
    now: () => clock.elapsedTime,
    blocked: doorBlocks,
    name: me.name,
    partnerNames: () => start.players.filter((p) => p.id !== PLAYER_ID).map((p) => p.name),
    onGhostArrived: () => closeMap(),
  });
  socket = s;
  moves = createMoveSender((move) => socket.volatile.emit('player:move', move));
  socket.on('player:state', (state) => partners.push(state, performance.now()));
  socket.on('room:update', (view) => partners.keep(view.players.map((p) => p.id)));
  // At the exit: who are we still waiting for?
  socket.on('exit:waiting', ({ waiting, missing }) => {
    if (!waiting.includes(PLAYER_ID) || !missing.length) return;
    hud.subtitle(`Waiting for ${missing.join(', ')}…`, 60);
  });
  // What happened in the house, decided by the server: copy it, then show it.
  socket.on('world:update', ({ events }) => {
    for (const event of events) {
      applyEvent(night, event);
      handleEvent(event);
    }
  });
  // A scripted scare, for us alone or for everyone in the room.
  socket.on('scare:play', ({ triggerId }) => {
    const trigger = triggerById.get(triggerId);
    if (trigger) fireScare(trigger);
  });
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
  closeMap();
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

// M unfolds the house map (once you've taken it) and folds it away. The house doesn't
// wait while you read it.
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyM' || e.repeat || !player.controls.isLocked || reader.isOpen()) return;
  if (houseMap.isOpen()) return closeMap();
  if (!hasMap) return hud.toast("You don't have a map. There was one pinned up in the foyer.");
  houseMap.open();
  tenant?.onMapOpen();
});

function closeMap() {
  if (!houseMap.isOpen()) return;
  houseMap.close();
  tenant?.onMapClose();
}

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
  if (id === HOUSE_MAP_ID) {
    props.take(id);
    hasMap = true;
    hud.toast('You take the map down. Press M to read it.');
    if (audio) pickupClink(audio);
    return;
  }
  const obj = doors.get(id)?.obj;
  // Never close a door on the player standing in its doorway.
  if (obj && night.doors[id]?.open && overlapsCell(camera.position.x, camera.position.z, PLAYER_RADIUS, obj.x, obj.z)) {
    hud.toast('Step out of the doorway first.');
    return;
  }
  if (obj && tenant?.interceptDoor(obj, night.doors[id])) return;
  // The server decides; the result comes back as world:update for everyone.
  socket?.emit('interact', { targetId: id });
}

const actorSpot = new THREE.Vector3();
function handleEvent(event) {
  // Did we do this, or a teammate?
  const mine = !event.playerId || event.playerId === PLAYER_ID;
  const door = doors.get(event.targetId);
  const at = door ? cellCenter(door.obj.x, door.obj.z) : null;
  // Personal things (a note opening, crawling under a bed, a battery) only happen to
  // the player who did them.
  if (!mine && ['hid', 'left-hiding', 'note-read', 'denied'].includes(event.type)) return;
  switch (event.type) {
    case 'door-opened': {
      // Swings away from whoever opened it.
      const by = mine ? null : partners.positionOf(event.playerId);
      doors.open(event.targetId, by ? actorSpot.set(by.x, camera.position.y, by.z) : camera.position);
      if (audio) doorCreak(audio, at.x, 1.2, at.z);
      break;
    }
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
      if (!mine) {
        hud.toast(`${names.get(event.playerId) ?? 'Someone'} picked up: ${itemName(item.obj)}`);
        break;
      }
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
      closeMap();
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
      // Our scare asked for this slam: now the lights die, the camera shakes.
      pendingSlams.get(event.targetId)?.();
      pendingSlams.delete(event.targetId);
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
      if (event.reason === 'doorway-blocked') hud.toast("Someone's in the doorway.");
      if (event.reason === 'already-taken') hud.toast("It's gone. Someone got to it first.");
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
  if (id === HOUSE_MAP_ID) return 'Take the map';
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
    // The server shuts it for everyone; our part of the scare plays when it does.
    pendingSlams.set(id, then);
    socket?.emit('door:slam', { targetId: id });
  };
  attempt();
}

function fireScare(trigger) {
  scares.playScare(trigger.scare, trigger);
  tenant?.noteScare(trigger.scare.startsWith('JS-'));
}

// Standing in the open exit's doorway: wait there for everyone (M3-S13). The server
// ends the night once all connected players are in it.
let atExit = false;
function checkExit() {
  if (!exitDoor || ended || !socket) return;
  const { cx, cz } = cellAt(camera.position.x, camera.position.z);
  const here = night.doors[exitDoor.id].open && cx === exitDoor.x && cz === exitDoor.z;
  if (here === atExit) return;
  atExit = here;
  socket.emit('exit:at', { at: here });
  if (!here) hud.subtitle('', 0.01);
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
    look.setFromQuaternion(camera.quaternion);
    tenant?.update(dt, {
      time: playTime,
      x: camera.position.x,
      z: camera.position.z,
      yaw: look.y,
      hiding: hiding ? beds.get(hiding.bedId) : null,
      flashlightOn: flashlight.state.on,
    });
    if (tenant) flashlight.spot.intensity *= tenant.lightFactor();
    flashlight.spot.intensity *= effects.lightFactor(time);
    hud.setBattery(flashlight.state.battery);
    hud.setPrompt(describe(interaction.lookTarget()));
    maybeKnock(time);
    playTime += dt;
    checkExit();
    moves?.update({ x: camera.position.x, z: camera.position.z, yaw: look.y, pitch: look.x, light: flashlight.state.on });
    const cell = cellAt(camera.position.x, camera.position.z);
    reveal.visit(cell.cx, cell.cz);
    if (houseMap.isOpen()) {
      houseMap.draw({ player: { x: camera.position.x, z: camera.position.z, yaw: look.y }, reveal, ghost: tenant?.ghost });
    }
  }
  scares.update();
  partners.update(performance.now(), dt, camera.position);
  doors.update(dt);
  items.update(time);
  fuseBox?.update(dt);
  windows.update(time);
  props.update(time);
  updateCeilingLights(ceilingLights, time);
  showBlood(time);
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
