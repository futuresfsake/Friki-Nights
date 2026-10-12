const COOLDOWN = 25; // seconds; walking back and forth over a tile shouldn't spam whispers

let quietUntil = 0;

// Whispers from a spot 2–4 m away in a random direction, so the player turns to look.
// Not a jump scare: no sting, no shake.
export function whisperScare(ctx, { duration = 2.5 } = {}) {
  const now = ctx.now();
  const audio = ctx.audio();
  if (!audio || now < quietUntil) return;
  quietUntil = now + COOLDOWN;
  const angle = Math.random() * Math.PI * 2;
  const distance = 2 + Math.random() * 2;
  const { x, z } = ctx.camera.position;
  ctx.whispers(audio, x + Math.cos(angle) * distance, 1.4, z + Math.sin(angle) * distance, duration);
}
