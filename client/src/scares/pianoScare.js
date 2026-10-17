// JS-04: the piano plays a few discordant notes by itself, as if someone sat
// down who forgot how to play years ago. The light stutters on the first note.
export function pianoScare(ctx) {
  const audio = ctx.audio();
  if (!audio) return;
  ctx.discordPiano(audio);
  ctx.effects.flicker(ctx.now(), 0.4);
}
