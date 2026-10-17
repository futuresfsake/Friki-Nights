// JS-05: you pull the fuse out and something screams — a sharp sting, blood
// on the screen, the camera shakes. You shouldn't have touched that.
export function fuseStingScare(ctx) {
  const now = ctx.now();
  ctx.sting();
  ctx.effects.splatter(now, 3.5);
  ctx.effects.shake(now, 0.6, 0.08);
  ctx.effects.flicker(now, 0.8);
}
