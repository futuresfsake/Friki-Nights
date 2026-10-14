const SHAKE_RANGE = 8; // metres; it plays for the whole room, but only shakes those close by

// JS-06: a hand slams against the window from outside, then slides away.
// Trigger params: { window: 'window-11-0' }.
export function windowHandScare(ctx, { window }) {
  const w = ctx.windows.get(window);
  ctx.windows.slamHand(window, ctx.now());
  const audio = ctx.audio();
  if (audio) ctx.glassBang(audio, w.position.x, w.position.y, w.position.z);
  const { x, z } = ctx.camera.position;
  if (Math.hypot(w.position.x - x, w.position.z - z) < SHAKE_RANGE) ctx.effects.shake(ctx.now(), 0.25, 0.03);
}
