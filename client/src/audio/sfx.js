// Every sound in the game is synthesized here; there are no audio files.

// Low, slowly breathing hum that never stops: the house is always "on".
export function startDrone(audio) {
  const { ctx, master } = audio;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 180;
  filter.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.value = 0.05;
  filter.connect(gain).connect(master);

  for (const [freq, detune] of [
    [55, 0],
    [55, 9],
    [82.4, -7],
  ]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start();
  }

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.025;
  lfo.connect(lfoDepth).connect(gain.gain);
  lfo.start();
}

// Short filtered noise burst; random pitch so no two steps sound identical.
export function footstep(audio, running) {
  const { ctx, master, noiseSource } = audio;
  const t = ctx.currentTime;
  const src = noiseSource();
  src.playbackRate.value = 0.85 + Math.random() * 0.3;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 180 + Math.random() * 120; // soft thud on wooden floorboards
  filter.Q.value = 1.4;

  const gain = ctx.createGain();
  // Kept quiet so the player's own steps don't drown out the house.
  const peak = running ? 0.14 : 0.07;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

  src.connect(filter).connect(gain).connect(master);
  src.start(t, Math.random() * 1.5);
  src.stop(t + 0.16);
}

// Three dull knocks from somewhere in the house, placed in 3D.
export function knocks(audio, x, y, z) {
  const { ctx, noiseSource, panner } = audio;
  const out = panner(x, y, z);
  const start = ctx.currentTime + 0.05;

  for (let i = 0; i < 3; i++) {
    const t = start + i * 0.32 + Math.random() * 0.05;

    const src = noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 90;
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(2.2, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(filter).connect(gain).connect(out);
    src.start(t, Math.random());
    src.stop(t + 0.2);

    // Body of the knock: a quick low sine thump.
    const thump = ctx.createOscillator();
    thump.frequency.setValueAtTime(110, t);
    thump.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.9, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    thump.connect(thumpGain).connect(out);
    thump.start(t);
    thump.stop(t + 0.16);
  }
}

// Slow groan of old hinges: a sawtooth sweeping up through a narrow, resonant filter.
export function doorCreak(audio, x, y, z) {
  const { ctx, noiseSource, panner } = audio;
  const out = panner(x, y, z);
  const t = ctx.currentTime;
  const length = 0.55 + Math.random() * 0.25;

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const base = 70 + Math.random() * 30;
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.linearRampToValueAtTime(base * 1.6, t + length * 0.6);
  osc.frequency.linearRampToValueAtTime(base * 1.3, t + length);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 9;
  filter.frequency.setValueAtTime(700, t);
  filter.frequency.linearRampToValueAtTime(1300, t + length);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
  gain.gain.setValueAtTime(0.5, t + length * 0.8);
  gain.gain.linearRampToValueAtTime(0, t + length);
  osc.connect(filter).connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + length);

  // A little scrape of wood under the creak.
  const scrape = noiseSource();
  const scrapeFilter = ctx.createBiquadFilter();
  scrapeFilter.type = 'bandpass';
  scrapeFilter.frequency.value = 400;
  const scrapeGain = ctx.createGain();
  scrapeGain.gain.setValueAtTime(0.06, t);
  scrapeGain.gain.linearRampToValueAtTime(0, t + length);
  scrape.connect(scrapeFilter).connect(scrapeGain).connect(out);
  scrape.start(t, Math.random());
  scrape.stop(t + length);
}

// Soft wooden thud when a door closes normally (the loud slam is JS-02's own sound).
export function doorShut(audio, x, y, z) {
  const { ctx, panner } = audio;
  const out = panner(x, y, z);
  const t = ctx.currentTime + 0.5; // lands as the swing finishes
  const thump = ctx.createOscillator();
  thump.frequency.setValueAtTime(120, t);
  thump.frequency.exponentialRampToValueAtTime(50, t + 0.15);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.setValueAtTime(0.9, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  thump.connect(gain).connect(out);
  thump.start(t);
  thump.stop(t + 0.22);
}

// Handle rattling against a lock: a few quick metallic clicks.
export function doorRattle(audio, x, y, z) {
  const { ctx, noiseSource, panner } = audio;
  const out = panner(x, y, z);
  for (let i = 0; i < 4; i++) {
    const t = ctx.currentTime + i * 0.07 + Math.random() * 0.02;
    const src = noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800 + Math.random() * 600;
    filter.Q.value = 6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(filter).connect(gain).connect(out);
    src.start(t, Math.random());
    src.stop(t + 0.05);
  }
}

export function flashlightClick(audio) {
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 2200;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.04);
}
