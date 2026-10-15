// The Tenant's mind: when he shows up and which trick he plays. Pure logic (no
// Three.js, no audio) so the pacing can be tested.
//
// He is meant to be unpredictable, so nothing here runs on a fixed rhythm:
//   - gaps between visits are random, and sometimes he strikes twice in a row
//     ("double tap") or goes quiet for a long time ("long silence")
//   - he never plays the same trick twice in a row, and recent tricks are less likely
//   - big tricks (the ones that end in a scream) stay far apart, also from the map's
//     own jump scares, so they keep their punch
//   - every trick has random variants of its own (acts.js)

export const ACTS = {
  peek: { weight: 5 }, // stands far off where you'll turn and see him
  cross: { weight: 4 }, // walks slowly across a doorway ahead, watching you
  follow: { weight: 4 }, // footsteps behind yours, a beat late
  name: { weight: 3 }, // whispers your name
  giggle: { weight: 3 }, // a chuckle somewhere close in the dark
  doorTrap: { weight: 3 }, // holds the next door shut, or knocks back on it
  breathe: { weight: 3, big: true }, // breathing behind you; turn round and it screams in your face
  lightsOut: { weight: 3, big: true }, // the light dies; when it comes back, so does the ghost, in your face
  rush: { weight: 2, big: true, after: 150 }, // flies at you from the end of a hall and screams in your face
  ballerina: { weight: 2, big: true }, // Clara dances; move and she screams in your face
  bedVisit: { weight: 1, hiding: true }, // stands by the bed you're hiding under
};

export const FIRST_VISIT = [35, 70]; // seconds of peace at the start of a night
export const GAP = [18, 55]; // after a small trick
export const BIG_GAP_AFTER = [40, 90]; // after a big one
export const DOUBLE_TAP = { chance: 0.15, gap: [3, 8] };
export const LONG_SILENCE = { chance: 0.1, gap: [90, 150] };
export const BIG_SPACING = 100; // seconds between any two big scares (his or the map's)
const RECENT = 3;
const RETRY = 3; // seconds until he looks again when no trick fits

export function createBrain({ random = Math.random, start = 0 } = {}) {
  const between = ([a, b]) => a + random() * (b - a);
  let nextAt = start + between(FIRST_VISIT);
  let lastBigAt = -Infinity;
  let wasHiding = false;
  const recent = [];

  function pick(time, available) {
    const options = Object.entries(ACTS).filter(([id, act]) => {
      if (!available.has(id) || id === recent[recent.length - 1]) return false;
      if (act.after && time < act.after) return false;
      return !act.big || time - lastBigAt >= BIG_SPACING;
    });
    const weightOf = ([id, act]) => (recent.includes(id) ? act.weight / 2 : act.weight);
    let roll = random() * options.reduce((sum, o) => sum + weightOf(o), 0);
    for (const option of options) {
      roll -= weightOf(option);
      if (roll < 0) return option[0];
    }
    return null;
  }

  return {
    // Called every frame. Returns the trick to start now, or null.
    // available: the tricks that make sense right now (a spot for him exists, the
    // player is moving, ...), as a Set or a function returning one (only called when
    // he's ready, since finding spots isn't free); hiding: the player is under a bed.
    decide(time, { uiOpen = false, busy = false, hiding = false, available }) {
      // Crawling under a bed is an invitation: he often comes to look, soon.
      if (hiding && !wasHiding && !busy && random() < 0.6) nextAt = Math.min(nextAt, time + between([2, 6]));
      wasHiding = hiding;
      if (uiOpen || busy || time < nextAt) return null;
      const options = typeof available === 'function' ? available() : available;
      const act = pick(time, hiding ? onlyHiding(options) : withoutHiding(options));
      if (!act) {
        nextAt = time + RETRY;
        return null;
      }
      recent.push(act);
      if (recent.length > RECENT) recent.shift();
      if (ACTS[act].big) lastBigAt = time;
      nextAt = Infinity; // until the trick says it's finished
      return act;
    },
    // A trick ended; when he comes back is anyone's guess.
    finished(time, act) {
      let gap = between(ACTS[act]?.big ? BIG_GAP_AFTER : GAP);
      const roll = random();
      if (roll < DOUBLE_TAP.chance) gap = between(DOUBLE_TAP.gap);
      else if (roll < DOUBLE_TAP.chance + LONG_SILENCE.chance) gap = between(LONG_SILENCE.gap);
      nextAt = time + gap;
    },
    // A map scare just played (JS-01, a whisper, ...): give it room.
    noteScare(time, big) {
      if (big) lastBigAt = Math.max(lastBigAt, time);
      if (nextAt !== Infinity) nextAt = Math.max(nextAt, time + 10);
    },
    // Big tricks have scream variants; acts ask before using one.
    bigAllowed: (time) => time - lastBigAt >= BIG_SPACING,
    get nextAt() {
      return nextAt;
    },
  };
}

function onlyHiding(available) {
  return new Set([...available].filter((id) => ACTS[id]?.hiding || id === 'name' || id === 'giggle'));
}

function withoutHiding(available) {
  return new Set([...available].filter((id) => !ACTS[id]?.hiding));
}
