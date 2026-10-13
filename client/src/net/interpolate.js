// Smooths another player's (later: the entity's) movement. Their position updates
// arrive ~15 times a second with uneven gaps; we draw them DELAY_MS in the past, always
// between two real updates, so they glide instead of jumping.
export const DELAY_MS = 100;
const KEEP = 40; // snapshots kept (~2.5 s at 15 Hz)
const OFFSET_WINDOW = 45; // samples used to estimate the clock offset (~3 s)
// When the offset estimate changes, playback runs at most this much faster or slower
// until it catches up, instead of skipping.
const MAX_WARP = 0.1;
// A late or lost update leaves a gap: keep them going the way they were heading for up
// to this long, then wait where they are.
const MAX_EXTRAPOLATE_MS = 150;
// What's drawn eases towards the computed spot over ~this long, so the small correction
// after a gap is a quick glide, never a jump.
const SMOOTH_MS = 40;

// Snapshots carry the sender's clock (t, ms). The offset between their clock and ours is
// taken from the least-delayed recent packet, so a slow packet can't drag them backwards.
export function createInterpolator({ delayMs = DELAY_MS } = {}) {
  const snaps = [];
  const offsets = [];
  let offset = null;
  let sampledAt = null;
  let shown = null;

  return {
    push(snap, localNow) {
      if (snaps.length && snap.t <= snaps[snaps.length - 1].t) return; // late or duplicate
      snaps.push(snap);
      if (snaps.length > KEEP) snaps.shift();
      offsets.push(localNow - snap.t);
      if (offsets.length > OFFSET_WINDOW) offsets.shift();
    },
    // Where to draw them at our time localNow, or null before the first update.
    sample(localNow) {
      if (!snaps.length) return null;
      const dt = sampledAt === null ? 0 : Math.max(0, localNow - sampledAt);
      sampledAt = localNow;
      const target = Math.min(...offsets);
      if (offset === null) offset = target;
      else offset += Math.max(-MAX_WARP * dt, Math.min(MAX_WARP * dt, target - offset));
      const spot = at(localNow - offset - delayMs);
      if (!shown) shown = spot;
      else {
        const k = 1 - Math.exp(-dt / SMOOTH_MS);
        shown = {
          ...spot,
          x: shown.x + (spot.x - shown.x) * k,
          z: shown.z + (spot.z - shown.z) * k,
          yaw: lerpAngle(shown.yaw, spot.yaw, k),
          pitch: shown.pitch + (spot.pitch - shown.pitch) * k,
        };
      }
      return shown;
    },
    // Jump straight to a position (spawn, rejoin), forgetting the old path.
    reset() {
      snaps.length = 0;
      offsets.length = 0;
      offset = null;
      sampledAt = null;
      shown = null;
    },
  };

  // Their position at time t on their clock.
  function at(t) {
    if (t <= snaps[0].t) return { ...snaps[0] };
    const last = snaps[snaps.length - 1];
    if (t >= last.t) {
      const prev = snaps[snaps.length - 2];
      if (!prev) return { ...last };
      const ahead = Math.min(t - last.t, MAX_EXTRAPOLATE_MS) / (last.t - prev.t);
      return { ...last, x: last.x + (last.x - prev.x) * ahead, z: last.z + (last.z - prev.z) * ahead };
    }
    let i = snaps.length - 2;
    while (snaps[i].t > t) i--;
    const a = snaps[i];
    const b = snaps[i + 1];
    const k = (t - a.t) / (b.t - a.t);
    return {
      ...b,
      x: a.x + (b.x - a.x) * k,
      z: a.z + (b.z - a.z) * k,
      yaw: lerpAngle(a.yaw, b.yaw, k),
      pitch: a.pitch + (b.pitch - a.pitch) * k,
      t,
    };
  }
}

// Turns the short way round, so -179° → 179° doesn't spin the whole circle.
export function lerpAngle(a, b, k) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
