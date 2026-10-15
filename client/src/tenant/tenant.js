import { cellAt, cellCenter, isSolid } from '../../../shared/mapParser.js';
import { hitsProp } from '../../../shared/props.js';
import { angleOff, hasLineOfSight } from '../../../shared/sight.js';
import { TRICKS } from './acts.js';
import { ACTS, createBrain } from './brain.js';
import { crossingPath, findSpot, spotToward } from './spots.js';

const SEEN_ANGLE = 0.8; // radians off the view: inside the screen, not just the crosshair
const SEEN_DISTANCE = 18;
const FLICKER_STEP = 0.06;

// The Tenant: a man who lives in the walls of Hollowmere and plays with whoever is in
// his house. He never hurts anyone (that's The Waiting One's job, M5); he wants you
// scared, turning round, and unsure of what you saw.
//
// Each player has their own Tenant that only they can see or hear, so the house can
// play a different trick on each of you: "Did you see that?!" Nothing he does changes
// the shared night state, so he can't make players' screens disagree.
//
// sounds: { step, giggle, whisper, breathing, knocks, rattle, sting, scream, musicBox } bound to audio
// (each may do nothing before audio exists).
const GHOST_CHANCE = 0.35; // each time the house map is opened, once he's been around a while
const GHOST_SPEED = 1.6; // m/s
const JUMPSCARE_DISTANCE = 0.6; // metres from your eyes: its face fills the screen
const JUMPSCARE_SECONDS = 0.7;

export function createTenant({
  scene,
  map,
  model,
  ballerina = null, // Clara's model (ballerina.js); without it she never dances
  sounds,
  effects,
  hud,
  now,
  blocked = () => false,
  name,
  partnerNames = () => [],
  random = Math.random,
  onGhostArrived = () => {},
}) {
  const brain = createBrain({ random });
  const ghostModel = model;
  for (const m of [model, ballerina]) {
    if (!m) continue;
    scene.add(m.root);
    m.root.visible = false;
  }

  const player = { x: 0, z: 0, yaw: 0 };
  let time = 0;
  let hiding = null;
  let flashlightOn = true;
  let lastStepAt = -Infinity;
  let act = null;
  let actId = null;
  let timers = [];
  let flickerUntil = -Infinity;
  let trap = null; // { until, holding } armed by the doorTrap trick
  let lastPos = null;
  let ghost = null; // { x, z, wait } a second dot on the house map, coming for yours

  const later = (seconds, fn, keep = false) => timers.push({ at: time + seconds, fn, keep });
  const at = () => ({ x: model.root.position.x, z: model.root.position.z });
  const isOpen = (p) => {
    const { cx, cz } = cellAt(p.x, p.z);
    return !isSolid(map, cx, cz) && !blocked(cx, cz) && !hitsProp(map.props ?? [], p.x, p.z, 0.3);
  };
  const canSee = (p) => hasLineOfSight(map, player.x, player.z, p.x, p.z, blocked);
  const lookingAt = (p, maxAngle) => angleOff(player.x, player.z, player.yaw, p.x, p.z) < maxAngle;
  const distance = () => Math.hypot(model.root.position.x - player.x, model.root.position.z - player.z);

  const k = {
    random,
    // Whoever is playing the trick: the ghost, or Clara.
    get model() {
      return model;
    },
    player,
    get time() {
      return time;
    },
    get hiding() {
      return hiding;
    },
    get name() {
      return name;
    },
    later,
    at,
    isOpen,
    canSee,
    lookingAt,
    distance,
    find: (options) => findSpot(map, player, player.yaw, options, { random, blocked }),
    toward: (turn, d) => spotToward(map, player, player.yaw, turn, d, blocked),
    crossing() {
      const spot = findSpot(map, player, player.yaw, { minDist: 7, maxDist: 14, minAngle: 0.1, maxAngle: 0.6 }, { random, blocked });
      return spot && crossingPath(map, player, spot, 1.8, blocked);
    },
    // A spot d metres nearer to you along the line between you, still in plain view.
    closerSpot(d) {
      const p = at();
      const len = distance();
      if (len - d < 3.5) return null;
      const next = { x: p.x + ((player.x - p.x) / len) * d, z: p.z + ((player.z - p.z) / len) * d };
      return isOpen(next) && canSee(next) ? next : null;
    },
    show(x, z, pose) {
      model.root.position.set(x, 0, z);
      model.setPose(pose);
      model.face(player.x, player.z);
      model.root.visible = true;
      lastPos = { x, z };
    },
    hide() {
      model.root.visible = false;
    },
    // In view, close enough, and nothing in between.
    seen: () => model.root.visible && distance() < SEEN_DISTANCE && lookingAt(at(), SEEN_ANGLE) && canSee(at()),
    stepToward(target, d) {
      const p = at();
      const len = Math.hypot(target.x - p.x, target.z - p.z);
      if (len < 1e-6) return;
      const f = Math.min(1, d / len);
      model.root.position.x += (target.x - p.x) * f;
      model.root.position.z += (target.z - p.z) * f;
    },
    step: (p, running, loudness = 1) => p && sounds.step(p.x, p.z, running, loudness),
    giggle: (p, loudness = 1) => p && sounds.giggle(p.x, p.z, loudness),
    whisper: (p, seconds) => p && sounds.whisper(p.x, p.z, seconds),
    breathing: (p, seconds) => sounds.breathing(p.x, p.z, seconds),
    sting: () => sounds.sting(),
    shake: (seconds, strength) => effects.shake(now(), seconds, strength),
    blackout: (seconds) => effects.blackout(now(), seconds),
    flicker(seconds) {
      flickerUntil = time + seconds;
    },
    // The light stutters, and in the dark he's gone. then() runs once he is.
    vanish(then) {
      k.flicker(0.25);
      later(0.25, () => {
        k.blackout(0.2);
        k.hide();
        later(0.25, then);
      });
    },
    // The jump scare: it's suddenly right in front of your eyes, screaming, claws out,
    // then the dark takes it. then() runs once it's gone.
    jumpscare(then) {
      const p = k.toward(0, JUMPSCARE_DISTANCE);
      sounds.scream();
      k.shake(0.7, 0.12);
      if (!p) {
        // A wall in your face: only the scream and the dark.
        k.blackout(0.4);
        later(0.6, then);
        return;
      }
      k.show(p.x, p.z, 'scream');
      later(JUMPSCARE_SECONDS, () => {
        k.blackout(0.35);
        k.hide();
        later(0.4, then);
      });
    },
    // Switch who plays the trick ('ghost' or 'ballerina'); finish() switches back.
    use(which) {
      const next = which === 'ballerina' && ballerina ? ballerina : ghostModel;
      if (next === model) return;
      model.root.visible = false;
      model = next;
      lastPos = null;
    },
    musicBox: (p, seconds) => sounds.musicBox?.(p.x, p.z, seconds) ?? null,
    say: (text) => hud.subtitle(`[whispering] ${text}`),
    lines() {
      const n = name;
      const list = [
        `…${n}…`,
        `${n}… turn around`,
        `i can see you, ${n}`,
        `you look tired, ${n}`,
        `${n}… stay with me`,
        'behind you',
        `you dropped something, ${n}`,
        'this is my room',
        `${n}… ${n}… ${n}…`,
        'you walk so loud',
      ];
      for (const p of partnerNames()) list.push(`${p} can't hear you`, `${p} isn't coming back for you`, `i have ${p} now`);
      return list;
    },
    bigAllowed: () => brain.bigAllowed(time),
    claimBig: () => brain.noteScare(time, true),
    armDoorTrap(seconds) {
      trap = { until: time + seconds, holding: false };
    },
  };

  // What makes sense right now; only worked out when he's ready to act.
  function available() {
    const set = new Set(['name', 'giggle']);
    if (hiding) {
      set.add('bedVisit');
      return set;
    }
    if (k.find({ minDist: 6, maxDist: 13, minAngle: 1.2 })) set.add('peek');
    if (k.crossing()) set.add('cross');
    if (time - lastStepAt < 1.5) set.add('follow');
    if (!trap) set.add('doorTrap');
    if (k.toward(Math.PI, 0.9)) set.add('breathe');
    if (flashlightOn) set.add('lightsOut');
    if (k.find({ minDist: 9, maxDist: 16, maxAngle: 0.25 })) set.add('rush');
    if (ballerina && k.find({ minDist: 4, maxDist: 9, maxAngle: 0.5 })) set.add('ballerina');
    return set;
  }

  function finish() {
    model.root.visible = false;
    model = ghostModel;
    timers = timers.filter((t) => t.keep);
    brain.finished(time, actId);
    act = actId = null;
  }

  // The ghost dot walks your way on the map. If it reaches you, the map is snatched
  // shut and something laughs right behind you.
  function moveGhost(dt) {
    if (ghost.wait > 0) {
      ghost.wait -= dt;
      return;
    }
    const dx = player.x - ghost.x;
    const dz = player.z - ghost.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.8) {
      ghost = null;
      onGhostArrived();
      const behind = k.toward(Math.PI, 0.8) ?? player;
      sounds.giggle(behind.x, behind.z, 1);
      k.shake(0.3, 0.04);
      return;
    }
    const step = Math.min(len, GHOST_SPEED * dt);
    ghost.x += (dx / len) * step;
    ghost.z += (dz / len) * step;
  }

  // The other side of a door from where the player stands.
  function otherSide(obj, distance = 1.3) {
    const c = cellCenter(obj.x, obj.z);
    if (obj.axis === 'x') return { x: c.x, z: c.z + (player.z < c.z ? distance : -distance) };
    return { x: c.x + (player.x < c.x ? distance : -distance), z: c.z };
  }

  return {
    // Call every frame while playing. s: { time (play time, s), x, z, yaw,
    // hiding (bed from beds.js or null), flashlightOn }.
    update(dt, s) {
      time = s.time;
      Object.assign(player, { x: s.x, z: s.z, yaw: s.yaw });
      hiding = s.hiding;
      flashlightOn = s.flashlightOn;

      const due = timers.filter((t) => t.at <= time);
      timers = timers.filter((t) => t.at > time);
      for (const t of due) t.fn();

      if (trap && !trap.holding && time > trap.until) trap = null;
      if (ghost) moveGhost(dt);
      if (act && act.update(dt)) finish();
      if (!act) {
        const id = brain.decide(time, { hiding: !!hiding, available });
        if (id) {
          actId = id;
          act = TRICKS[id](k);
        }
      }
      if (model.root.visible) {
        const p = at();
        const speed = lastPos && dt > 0 ? Math.hypot(p.x - lastPos.x, p.z - lastPos.z) / dt : 0;
        lastPos = p;
        model.update(dt, time, speed);
      }
    },
    // The player's own footstep (follow copies them).
    onStep(running) {
      lastStepAt = time;
      act?.onStep?.(running);
    },
    // A map scare played; keep his big tricks away from it.
    noteScare(big) {
      brain.noteScare(time, big);
    },
    // 1 normally; stutters while he's making the light fail.
    lightFactor() {
      if (time >= flickerUntil) return 1;
      return Math.floor((flickerUntil - time) / FLICKER_STEP) % 2 === 0 ? 0.08 : 1;
    },
    // The player used a door. Returns true if he swallowed it (held it shut).
    // obj: the door from the map; state: its night state ({ open, locked, exit }).
    interceptDoor(obj, state) {
      if (!trap || state.exit || state.locked) return false;
      const far = otherSide(obj);
      const door = cellCenter(obj.x, obj.z);
      if (trap.holding) {
        // Still holding: knocks right back at you.
        sounds.knocks(door.x, door.z);
        return true;
      }
      if (state.open) {
        // Closing it: something on the other side knocks back.
        trap = null;
        later(1 + random() * 0.6, () => sounds.knocks(far.x, far.z), true);
        if (random() < 0.35) later(2.4, () => sounds.giggle(far.x, far.z, 0.7), true);
        return false;
      }
      // Opening it: it's held shut, someone giggles behind it, then runs off.
      trap.holding = true;
      sounds.rattle(door.x, door.z);
      hud.toast('Something is holding it shut.');
      later(0.7, () => sounds.giggle(far.x, far.z, 0.8), true);
      const leaveAt = 1.8 + random() * 1.2;
      for (let i = 0; i < 4; i++) {
        const away = otherSide(obj, 1.5 + i * 1.2);
        later(leaveAt + i * 0.22, () => sounds.step(away.x, away.z, true, 1.2), true);
      }
      later(leaveAt + 1, () => (trap = null), true);
      return true;
    },
    // The house map was unfolded: sometimes there's another dot on it.
    onMapOpen() {
      if (ghost || time < 60 || random() > GHOST_CHANCE) return;
      const spot = k.find({ minDist: 7, maxDist: 13, minAngle: 1.5, sight: false });
      if (spot) ghost = { x: spot.x, z: spot.z, wait: 1 + random() * 2 };
    },
    onMapClose() {
      ghost = null;
    },
    // Where the extra dot is, or null (it only appears after a moment).
    get ghost() {
      return ghost && ghost.wait <= 0 ? { x: ghost.x, z: ghost.z } : null;
    },
    // A map trigger asks for a trick now (the Ballroom summons Clara). Whatever he was
    // doing stops.
    summon(id) {
      if (!TRICKS[id] || (id === 'ballerina' && !ballerina)) return false;
      if (act) {
        model.root.visible = false;
        model = ghostModel;
        timers = timers.filter((t) => t.keep);
        act = null;
      }
      if (ACTS[id]?.big) brain.noteScare(time, true);
      actId = id;
      act = TRICKS[id](k);
      return true;
    },
    // Also what the doorTrap trick does; a map trigger could set one too.
    armDoorTrap: (seconds) => k.armDoorTrap(seconds),
    get trick() {
      return actId;
    },
  };
}
