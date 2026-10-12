import * as THREE from 'three';
import { createAudioEngine } from './audio/engine.js';
import { flashlightClick, footstep, knocks, startDrone } from './audio/sfx.js';
import { PIXEL_RATIO } from './constants.js';
import { createController } from './player/controller.js';
import { createFlashlight } from './player/flashlight.js';
import { createHud } from './ui/hud.js';
import { buildHouse } from './world/builder.js';
import { PROTOTYPE_MAP } from './world/levels.js';
import { createCeilingLights, updateCeilingLights } from './world/lights.js';
import { parseMap } from './world/map.js';

const FOG_COLOR = 0x050507;

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

const map = parseMap(PROTOTYPE_MAP);
scene.add(buildHouse(map));
const ceilingLights = createCeilingLights(map, scene);

const hud = createHud();
let audio = null;

const player = createController(camera, document.body, map, {
  onStep: (running) => audio && footstep(audio, running),
});
const flashlight = createFlashlight(camera, {
  onToggle: () => audio && flashlightClick(audio),
});

let nextKnockAt = 20;

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
    maybeKnock(time);
  }
  updateCeilingLights(ceilingLights, time);
  camera.updateMatrixWorld();
  if (audio) audio.updateListener(camera);

  renderer.render(scene, camera);
});
