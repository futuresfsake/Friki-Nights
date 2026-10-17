// JS-10: a portrait crashes off the gallery wall — wood snapping, glass
// breaking, a heavy thud on the floor. The camera jolts.
export function portraitCrashScare(ctx) {
  const now = ctx.now();
  const audio = ctx.audio();
  if (audio) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 2 + Math.random() * 2;
    const { x, z } = ctx.camera.position;
    ctx.frameCrash(audio, x + Math.cos(angle) * distance, 1.0, z + Math.sin(angle) * distance);
  }
  ctx.effects.shake(now, 0.25, 0.03);
}
