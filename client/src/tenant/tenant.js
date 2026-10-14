import { cellAt, cellCenter, isSolid } from '../../../shared/mapParser.js';
import { angleOff, hasLineOfSight } from '../../../shared/sight.js';
import { TRICKS } from './acts.js';
import { createBrain } from './brain.js';
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
// sounds: { step, giggle, whisper, breathing, knocks, rattle, sting } bound to audio
// (each may do nothing before audio exists).
export function createTenant({ scene, map, model, sounds, effects, hud, now, blocked = () => false, name, partnerNames = () => [], random = Math.random }) {
  const brain = createBrain({ random });
  scene.add(model.root);
  model.root.visible = false;

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

  const later = (seconds, fn, keep = false) => timers.push({ at: time + seconds, fn, keep });
  const at = () => ({ x: model.root.position.x, z: model.root.position.z });
  const isOpen = (p) => {
    const { cx, cz } = cellAt(p.x, p.z);
    return !isSolid(map, cx, cz) && !blocked(cx, cz);
  };
  const canSee = (p) => hasLineOfSight(map, player.x, player.z, p.x, p.z, blocked);
  const lookingAt = (p, maxAngle) => angleOff(player.x, player.z, player.yaw, p.x, p.z) < maxAngle;
  const distance = () => Math.hypot(model.root.position.x - player.x, model.root.position.z - player.z);

  const k = {
    random,
    model,
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
    return set;
  }

  function finish() {
    model.root.visible = false;
    timers = timers.filter((t) => t.keep);
    brain.finished(time, actId);
    act = actId = null;
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
    // Also what the doorTrap trick does; a map trigger could set one too.
    armDoorTrap: (seconds) => k.armDoorTrap(seconds),
    get trick() {
      return actId;
    },
  };
}
