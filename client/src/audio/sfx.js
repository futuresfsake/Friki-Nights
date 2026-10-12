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

// Two light metallic taps: something small picked up off the floor.
export function pickupClink(audio) {
  const { ctx, master } = audio;
  for (const [delay, freq] of [
    [0, 2600],
    [0.07, 3400],
  ]) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.13);
  }
}

// Heavy metal clunk: a fuse screwed in, or the fuse box door.
export function fuseClunk(audio, x, y, z) {
  const { ctx, noiseSource, panner } = audio;
  const out = panner(x, y, z);
  const t = ctx.currentTime;
  const thump = ctx.createOscillator();
  thump.type = 'square';
  thump.frequency.setValueAtTime(140, t);
  thump.frequency.exponentialRampToValueAtTime(60, t + 0.08);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0.35, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  thump.connect(thumpGain).connect(out);
  thump.start(t);
  thump.stop(t + 0.13);

  const clank = noiseSource();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2400;
  filter.Q.value = 8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  clank.connect(filter).connect(gain).connect(out);
  clank.start(t, Math.random());
  clank.stop(t + 0.1);
}

// Power coming back: a big breaker clunk, then a mains hum rising up to speed and settling.
export function powerOn(audio) {
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  const breaker = ctx.createOscillator();
  breaker.frequency.setValueAtTime(90, t);
  breaker.frequency.exponentialRampToValueAtTime(35, t + 0.25);
  const breakerGain = ctx.createGain();
  breakerGain.gain.setValueAtTime(0.8, t);
  breakerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  breaker.connect(breakerGain).connect(master);
  breaker.start(t);
  breaker.stop(t + 0.32);

  const hum = ctx.createOscillator();
  hum.type = 'sawtooth';
  hum.frequency.setValueAtTime(20, t + 0.1);
  hum.frequency.exponentialRampToValueAtTime(100, t + 1.8);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0, t);
  humGain.gain.linearRampToValueAtTime(0.12, t + 1.2);
  humGain.gain.linearRampToValueAtTime(0, t + 3.5);
  hum.connect(filter).connect(humGain).connect(master);
  hum.start(t + 0.1);
  hum.stop(t + 3.6);
}

// Jump-scare sting: detuned sawtooths gliding down a fifth, a burst of noise, all
// pushed through distortion. Goes through the sting bus (own volume in M8).
export function screamSting(audio) {
  const { ctx, sting, noiseSource } = audio;
  const t = ctx.currentTime;
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 6);
  }
  shaper.curve = curve;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
  out.gain.setValueAtTime(0.5, t + 0.5);
  out.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  shaper.connect(out).connect(sting);

  for (const detune of [-35, 0, 40]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(587, t + 1.2);
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    osc.connect(gain).connect(shaper);
    osc.start(t);
    osc.stop(t + 1.4);
  }
  const hiss = noiseSource();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1500;
  const hissGain = ctx.createGain();
  hissGain.gain.setValueAtTime(0.5, t);
  hissGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  hiss.connect(filter).connect(hissGain).connect(shaper);
  hiss.start(t, Math.random());
  hiss.stop(t + 0.6);
}

// Reverb tail generated from decaying noise, so the slam rings through the house.
let slamReverb = null;
function reverb(ctx) {
  if (slamReverb) return slamReverb;
  const length = ctx.sampleRate * 2.2;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  slamReverb = ctx.createConvolver();
  slamReverb.buffer = impulse;
  return slamReverb;
}

// JS-02: a door slammed hard. Wood crack + deep thump, dry and through the reverb.
export function doorSlam(audio, x, y, z) {
  const { ctx, sting, noiseSource, panner } = audio;
  const out = panner(x, y, z);
  out.disconnect();
  const loud = ctx.createGain();
  loud.gain.value = 1.4;
  out.connect(loud).connect(sting);
  const wet = reverb(ctx);
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.5;
  loud.connect(wetGain).connect(wet);
  wet.connect(sting);

  const t = ctx.currentTime;
  const crack = noiseSource();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  const crackGain = ctx.createGain();
  crackGain.gain.setValueAtTime(1.6, t);
  crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  crack.connect(filter).connect(crackGain).connect(out);
  crack.start(t, Math.random());
  crack.stop(t + 0.26);

  const thump = ctx.createOscillator();
  thump.frequency.setValueAtTime(95, t);
  thump.frequency.exponentialRampToValueAtTime(32, t + 0.3);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(1.8, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  thump.connect(thumpGain).connect(out);
  thump.start(t);
  thump.stop(t + 0.36);
}

// Vowel formants (F1, F2) for whispered syllables.
const VOWELS = [
  [800, 1200],
  [400, 2300],
  [300, 2800],
  [500, 900],
  [350, 700],
];
export const WHISPER_PEAK = 0.15; // drone peaks at 0.075; whispers stay within +6 dB of it

// Breathy speech you can't quite make out: noise through two narrow band-pass filters
// that jump between vowel formants, one syllable at a time, placed in 3D.
export function whispers(audio, x, y, z, duration = 2.5) {
  const { ctx, noiseSource, panner } = audio;
  const out = panner(x, y, z);
  const t0 = ctx.currentTime + 0.05;
  const src = noiseSource();
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, t0);
  envelope.connect(out);

  const formants = [0, 1].map(() => {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 14;
    src.connect(f).connect(envelope);
    return f;
  });

  let t = t0;
  while (t < t0 + duration) {
    const length = 0.12 + Math.random() * 0.1;
    const [f1, f2] = VOWELS[Math.floor(Math.random() * VOWELS.length)];
    formants[0].frequency.setTargetAtTime(f1, t, 0.02);
    formants[1].frequency.setTargetAtTime(f2, t, 0.02);
    const peak = WHISPER_PEAK * (0.5 + Math.random() * 0.5);
    envelope.gain.setValueAtTime(0, t);
    envelope.gain.linearRampToValueAtTime(peak, t + length * 0.3);
    envelope.gain.linearRampToValueAtTime(0, t + length);
    // Short pauses between "words".
    t += length + (Math.random() < 0.25 ? 0.25 : 0.02);
  }
  src.start(t0, Math.random());
  src.stop(t + 0.05);
}

// JS-06: a flat palm hitting a window. Dull thump plus the pane rattling in its frame.
export function glassBang(audio, x, y, z) {
  const { ctx, sting, noiseSource, panner } = audio;
  const out = panner(x, y, z);
  out.disconnect();
  out.connect(sting);
  const t = ctx.currentTime;
  const thump = ctx.createOscillator();
  thump.frequency.setValueAtTime(130, t);
  thump.frequency.exponentialRampToValueAtTime(55, t + 0.12);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(1.5, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  thump.connect(thumpGain).connect(out);
  thump.start(t);
  thump.stop(t + 0.2);

  const rattle = noiseSource();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3200;
  filter.Q.value = 3;
  const rattleGain = ctx.createGain();
  rattleGain.gain.setValueAtTime(0.0001, t);
  for (let i = 0; i < 6; i++) {
    const at = t + 0.02 + i * 0.045;
    rattleGain.gain.setValueAtTime(0.5 * (1 - i / 6), at);
    rattleGain.gain.exponentialRampToValueAtTime(0.01, at + 0.03);
  }
  rattle.connect(filter).connect(rattleGain).connect(out);
  rattle.start(t, Math.random());
  rattle.stop(t + 0.35);
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
