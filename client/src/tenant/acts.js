import { STEP_LENGTH } from '../../../shared/constants.js';

// The Tenant's tricks. Each takes the toolkit `k` (tenant.js) and returns
// { update(dt) → true when finished, onStep?(running) }. Every trick rolls its own
// variant when it starts, so the same trick rarely plays out the same way twice.
// Rule of thumb: he loves being seen, but he's never there when you go to check.

const pickOne = (k, list) => list[Math.floor(k.random() * list.length)];
const between = (k, a, b) => a + k.random() * (b - a);

// Shared ending: the light stutters, and in the dark he's gone.
function ending(k) {
  let done = false;
  let ending = false;
  return {
    get done() {
      return done;
    },
    get ending() {
      return ending;
    },
    vanish() {
      if (ending) return;
      ending = true;
      k.vanish(() => (done = true));
    },
    after(seconds) {
      if (ending) return;
      ending = true;
      k.later(seconds, () => (done = true));
    },
    now() {
      ending = done = true;
    },
  };
}

// Stands far off, somewhere you're not looking yet. When you finally turn and see him:
// he vanishes, or waves, or walks towards you anyway, or waits until you look away and
// is closer every time you look back.
export function peek(k) {
  const spot = k.find({ minDist: 6, maxDist: 13, minAngle: 1.2 });
  const end = ending(k);
  if (!spot) {
    end.now();
    return { update: () => true };
  }
  k.show(spot.x, spot.z, k.random() < 0.6 ? 'lean' : 'stand');
  const plan = pickOne(k, ['vanish', 'vanish', 'wave', 'approach', 'closer', 'closer']);
  let waited = 0;
  let seenFor = 0;
  let unseenFor = 0;
  let reacting = false;
  let timer = 0;
  let jumps = 0;
  const stayFor = between(k, 1.4, 2.4);

  return {
    update(dt) {
      if (end.done) return true;
      if (end.ending) return false;
      k.model.lookAt(k.player.x, k.player.z);
      waited += dt;
      const seen = k.seen();
      if (k.distance() < 3.5) {
        if (plan === 'closer' && jumps) k.giggle(k.toward(Math.PI, 1));
        if (plan === 'approach' && reacting && k.bigAllowed()) {
          k.claimBig();
          k.sting();
          k.shake(0.35, 0.06);
        }
        end.vanish();
        return false;
      }
      if (!reacting) {
        seenFor = seen ? seenFor + dt : 0;
        if (seenFor > 0.35) {
          reacting = true;
          if (plan === 'wave') k.model.setPose('wave');
          if (plan === 'approach') k.model.setPose('walk');
        } else if (waited > 12) {
          k.hide();
          end.now();
        }
        return false;
      }
      timer += dt;
      if (plan === 'vanish') {
        if (k.random() < 0.3) k.giggle(k.at(), 0.5);
        end.vanish();
      }
      if (plan === 'wave' && timer > stayFor) end.vanish();
      if (plan === 'approach') {
        // Watching him was supposed to keep you safe.
        k.model.face(k.player.x, k.player.z);
        k.stepToward(k.player, 1.1 * dt);
        if (timer > stayFor + 0.6) end.vanish();
      }
      if (plan === 'closer') {
        unseenFor = seen ? 0 : unseenFor + dt;
        if (unseenFor > 0.6) {
          // You looked away. Look back.
          const next = k.closerSpot(2.5);
          if (!next || jumps >= 3) {
            k.hide();
            k.giggle(k.toward(Math.PI, 1.2));
            end.after(1.2);
            return false;
          }
          k.show(next.x, next.z, 'stand');
          jumps++;
          unseenFor = 0;
        }
        if (timer > 25) end.vanish();
      }
      return false;
    },
  };
}

// Walks slowly across a doorway or hall ahead of you, head turned to watch you.
// Sometimes he stops halfway to stare.
export function cross(k) {
  const path = k.crossing();
  const end = ending(k);
  if (!path) {
    end.now();
    return { update: () => true };
  }
  k.show(path.from.x, path.from.z, 'walk');
  k.model.face(path.to.x, path.to.z);
  const stops = k.random() < 0.35;
  let stopped = 0;
  let walked = 0;
  const length = Math.hypot(path.to.x - path.from.x, path.to.z - path.from.z);

  return {
    update(dt) {
      if (end.done) return true;
      if (end.ending) return false;
      if (k.distance() < 3.5) {
        end.vanish();
        return false;
      }
      if (stops && stopped >= 0 && stopped < 1.4 && k.seen() && walked > length * 0.3) {
        // Stops, turns, stares.
        if (stopped === 0) k.model.setPose('stand');
        stopped += dt;
        k.model.face(k.player.x, k.player.z);
        if (stopped >= 1.4) {
          stopped = -1;
          k.model.setPose('walk');
          k.model.face(path.to.x, path.to.z);
        }
        return false;
      }
      const step = 1.0 * dt;
      const before = Math.floor(walked / STEP_LENGTH);
      walked += step;
      k.stepToward(path.to, step);
      k.model.lookAt(k.player.x, k.player.z);
      if (Math.floor(walked / STEP_LENGTH) !== before) k.step(k.at(), false, 0.5);
      if (walked >= length) {
        k.hide();
        if (k.random() < 0.25) k.giggle(path.to, 0.6);
        end.after(0.5);
      }
      return false;
    },
  };
}

// Footsteps behind yours, a beat late. Stop walking and there's one more step.
// Turn round: usually nothing. Usually.
export function follow(k) {
  const end = ending(k);
  let left = between(k, 8, 14);
  let lastStepAt = k.time;
  let lastPoint = k.toward(Math.PI, 2.4);
  let extraStep = false;
  const reaction = pickOne(k, ['nothing', 'nothing', 'show', 'giggle']);
  let reacted = false;

  function turned() {
    reacted = true;
    if (reaction === 'show' && lastPoint && k.canSee(lastPoint)) {
      k.show(lastPoint.x, lastPoint.z, 'stand');
      k.model.face(k.player.x, k.player.z);
      k.later(0.4, () => end.vanish());
      return;
    }
    if (reaction === 'giggle' && lastPoint) k.giggle(lastPoint, 0.7);
    end.after(1);
  }

  return {
    onStep(running) {
      if (end.ending) return;
      lastStepAt = k.time;
      const point = k.toward(Math.PI, 2.4);
      if (!point) return;
      k.later(between(k, 0.26, 0.38), () => {
        if (end.ending) return;
        lastPoint = point;
        k.step(point, running);
      });
    },
    update(dt) {
      if (end.done) return true;
      if (end.ending) return false;
      left -= dt;
      if (reacted) return false;
      if (lastPoint && k.lookingAt(lastPoint, 0.7)) {
        turned();
        return false;
      }
      if (!extraStep && k.time - lastStepAt > 0.9) {
        // You stopped. It didn't, quite.
        extraStep = true;
        const point = k.toward(Math.PI, 2);
        k.later(between(k, 0.1, 0.5), () => point && k.step(point, false));
        end.after(1.5);
        return false;
      }
      if (left <= 0) end.now();
      return false;
    },
  };
}

// Your name, whispered from somewhere behind you, with a subtitle.
export function name(k) {
  const end = ending(k);
  const spot = k.find({ minDist: 3, maxDist: 7, minAngle: 1.4, sight: false }) ?? k.toward(Math.PI, 3) ?? k.player;
  k.whisper(spot, 1.8);
  k.say(pickOne(k, k.lines()));
  end.after(2);
  return { update: () => end.done };
}

// A wet chuckle close by in the dark.
export function giggle(k) {
  const end = ending(k);
  const spot = k.find({ minDist: 2.5, maxDist: 6, minAngle: 1.3, sight: false }) ?? k.toward(Math.PI, 2);
  k.giggle(spot, between(k, 0.6, 1));
  end.after(1.5);
  return { update: () => end.done };
}

// Arms a trap on the next door you touch (tenant.js plays it out), then leaves.
export function doorTrap(k) {
  k.armDoorTrap(45);
  return { update: () => true };
}

// Breathing just behind you, staying behind as you walk. Turn round in time and he's
// right there. Don't, and he says something instead.
export function breathe(k) {
  const end = ending(k);
  const start = k.toward(Math.PI, 0.9);
  if (!start) {
    end.now();
    return { update: () => true };
  }
  // Fixed in the world relative to you, not your view: turning round finds him.
  const offset = { x: start.x - k.player.x, z: start.z - k.player.z };
  const seconds = between(k, 5, 7);
  const sound = k.breathing(start, seconds + 1);
  let left = seconds;
  const point = () => {
    const p = { x: k.player.x + offset.x, z: k.player.z + offset.z };
    return k.isOpen(p) ? p : start;
  };

  return {
    update(dt) {
      if (end.done) return true;
      if (end.ending) return false;
      const p = point();
      sound?.moveTo(p.x, 1.5, p.z);
      left -= dt;
      if (k.lookingAt(p, 0.6) && k.canSee(p)) {
        sound?.stop();
        k.show(p.x, p.z, 'stand');
        k.model.face(k.player.x, k.player.z);
        k.sting();
        k.shake(0.45, 0.07);
        k.later(0.35, () => end.vanish());
        end.after(1.2);
        return false;
      }
      if (left <= 0) {
        sound?.stop();
        if (k.random() < 0.5) {
          k.whisper(p, 1.2);
          k.say(pickOne(k, [`good. don't turn around, ${k.name}`, 'you can breathe now', `so close, ${k.name}`]));
        } else k.giggle(p, 0.5);
        end.after(1.5);
      }
      return false;
    },
  };
}

// The light stutters and dies. Something runs at you in the dark. When the light
// comes back he's standing right in front of you, finger to his lips. Or nothing is,
// and the laugh is behind you.
export function lightsOut(k) {
  const end = ending(k);
  const dark = between(k, 1.8, 2.6);
  const shows = k.random() < 0.65;
  let shown = false;
  let stare = 0;
  const stareFor = between(k, 1.3, 2.2);

  k.flicker(0.6);
  k.later(0.6, () => {
    k.blackout(dark);
    for (let i = 0; i < 4; i++) {
      k.later(0.3 + i * 0.32, () => {
        const p = k.toward(0, 5.5 - i * 1.1);
        if (p) k.step(p, true);
      });
    }
  });
  k.later(0.6 + dark, () => {
    const p = shows && k.toward(0, 1.8);
    if (p && p.distance > 1.2) {
      k.show(p.x, p.z, k.random() < 0.5 ? 'shush' : 'stand');
      k.model.face(k.player.x, k.player.z);
      k.sting();
      k.shake(0.4, 0.06);
      shown = true;
    } else {
      k.giggle(k.toward(Math.PI, 1.2) ?? k.player, 0.9);
      end.after(1.5);
    }
  });

  return {
    update(dt) {
      if (end.done) return true;
      if (!shown || end.ending) return false;
      stare += dt;
      if (stare > stareFor || !k.lookingAt(k.at(), 1.0)) end.vanish();
      return false;
    },
  };
}

// Appears at the far end of a hall, waits a moment so you see him, then sprints at
// you. Gone a metre from your face.
export function rush(k) {
  const end = ending(k);
  const spot = k.find({ minDist: 9, maxDist: 16, maxAngle: 0.25 });
  if (!spot) {
    end.now();
    return { update: () => true };
  }
  k.show(spot.x, spot.z, 'stand');
  k.model.face(k.player.x, k.player.z);
  let wait = between(k, 0.6, 1.3);
  let ran = 0;

  return {
    update(dt) {
      if (end.done) return true;
      if (end.ending) return false;
      if (!k.canSee(k.at())) {
        end.vanish(); // you got behind a wall
        return false;
      }
      if (wait > 0) {
        wait -= dt;
        if (wait <= 0) k.model.setPose('run');
        return false;
      }
      k.model.face(k.player.x, k.player.z);
      const step = 8.5 * dt;
      const before = Math.floor(ran / 0.8);
      ran += step;
      k.stepToward(k.player, step);
      if (Math.floor(ran / 0.8) !== before) k.step(k.at(), true, 1.6);
      if (k.distance() < 1.3) {
        k.sting();
        k.shake(0.5, 0.1);
        k.blackout(0.3);
        k.hide();
        end.after(0.6);
      }
      return false;
    },
  };
}

// You're under a bed. Footsteps come in. Bare feet stop right in front of you. Then he
// leaves... or whispers that he knows... or his head comes down to the floor to look.
export function bedVisit(k) {
  const end = ending(k);
  const bed = k.hiding;
  const ahead = { x: -Math.sin(bed.lookYaw ?? 0), z: -Math.cos(bed.lookYaw ?? 0) };
  const at = (d) => ({ x: bed.under.x + ahead.x * d, z: bed.under.z + ahead.z * d });
  const spot = [1.15, 0.85].map(at).find((p) => k.isOpen(p));
  if (!spot) {
    end.now();
    return { update: () => true };
  }
  const plan = pickOne(k, k.bigAllowed() ? ['leave', 'leave', 'whisper', 'peek'] : ['leave', 'leave', 'whisper']);
  const side = { x: ahead.z, z: -ahead.x };
  const away = { x: spot.x + side.x * 5, z: spot.z + side.z * 5 };
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const f = i / (steps - 1);
    k.later(0.5 + i * 0.55, () => k.step({ x: away.x + (spot.x - away.x) * f, z: away.z + (spot.z - away.z) * f }, false, 0.8));
  }
  const arrive = 0.5 + steps * 0.55;
  const linger = between(k, 4, 7);
  k.later(arrive, () => {
    k.show(spot.x, spot.z, 'stand');
    k.model.face(spot.x + side.x, spot.z + side.z);
  });
  k.later(arrive + linger, () => {
    if (plan === 'peek') {
      k.claimBig();
      const head = at(0.6);
      k.show(head.x, head.z, 'head');
      k.model.face(bed.under.x, bed.under.z);
      k.sting();
      k.shake(0.5, 0.08);
      k.later(0.8, () => end.vanish());
      return;
    }
    if (plan === 'whisper') {
      k.whisper(spot, 1.6);
      k.say(pickOne(k, [`i know you're under there, ${k.name}`, 'i can hear you breathing', 'come out come out']));
    }
    k.later(plan === 'whisper' ? 2 : 0.3, () => {
      k.hide();
      for (let i = 0; i < 4; i++) {
        const f = (i + 1) / 4;
        k.later(i * 0.5, () => k.step({ x: spot.x - side.x * 5 * f, z: spot.z - side.z * 5 * f }, false, 0.7));
      }
      k.later(2.4, () => k.giggle({ x: spot.x - side.x * 6, z: spot.z - side.z * 6 }, 0.4));
      end.after(3);
    });
  });

  return {
    update() {
      if (end.done) return true;
      // Crawled out: he's not there. He was never there.
      if (!k.hiding) {
        k.hide();
        return true;
      }
      return false;
    },
  };
}

export const TRICKS = { peek, cross, follow, name, giggle, doorTrap, breathe, lightsOut, rush, bedVisit };
