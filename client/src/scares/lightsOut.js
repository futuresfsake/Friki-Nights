// JS-03: every light stutters violently, then everything dies at once. The hall
// goes pitch black for a long beat. Something moved while you couldn't see.
export function lightsOutScare(ctx) {
  const now = ctx.now();
  ctx.effects.flicker(now, 1.2);
  ctx.effects.shake(now + 0.8, 0.5, 0.04);
  ctx.effects.blackout(now + 1.2, 2.5);
  ctx.sting();
}
