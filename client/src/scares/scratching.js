const COOLDOWN = 35;

let quietUntil = 0;

// Fingernails scratching on wood inside the walls, from somewhere close by.
// Not a jump scare: no sting, no shake. Just the knowledge that something is
// inside the wall next to you, trying to get out.
export function scratchingScare(ctx, { duration = 4 } = {}) {
  const now = ctx.now();
  const audio = ctx.audio();
  if (!audio || now < quietUntil) return;
  quietUntil = now + COOLDOWN;
  const angle = Math.random() * Math.PI * 2;
  const distance = 1 + Math.random() * 1.5;
  const { x, z } = ctx.camera.position;
  ctx.scratching(audio, x + Math.cos(angle) * distance, 1.2, z + Math.sin(angle) * distance, duration);
}
