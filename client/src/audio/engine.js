// AudioContext and shared helpers. Created on the first click, because browsers
// block audio until the player interacts with the page.

export function createAudioEngine() {
  const ctx = new AudioContext();

  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);

  // Separate bus so jump-scare stings get their own volume setting (M8).
  const sting = ctx.createGain();
  sting.connect(master);

  // Two seconds of white noise, reused by every noise-based sound.
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  function noiseSource() {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    return src;
  }

  // HRTF panning lets headphone users hear where a world sound comes from.
  function panner(x, y, z) {
    const p = ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 1.5;
    p.rolloffFactor = 1;
    setParam3(p, 'position', x, y, z);
    p.connect(master);
    return p;
  }

  const listener = ctx.listener;
  function updateListener(camera) {
    const pos = camera.position;
    const m = camera.matrixWorld.elements;
    // Camera looks down its local -Z; column 2 of the world matrix is local +Z.
    const fx = -m[8];
    const fy = -m[9];
    const fz = -m[10];
    if (listener.positionX) {
      const t = ctx.currentTime;
      listener.positionX.setValueAtTime(pos.x, t);
      listener.positionY.setValueAtTime(pos.y, t);
      listener.positionZ.setValueAtTime(pos.z, t);
      listener.forwardX.setValueAtTime(fx, t);
      listener.forwardY.setValueAtTime(fy, t);
      listener.forwardZ.setValueAtTime(fz, t);
      listener.upX.setValueAtTime(0, t);
      listener.upY.setValueAtTime(1, t);
      listener.upZ.setValueAtTime(0, t);
    } else {
      // Firefox only has the older API.
      listener.setPosition(pos.x, pos.y, pos.z);
      listener.setOrientation(fx, fy, fz, 0, 1, 0);
    }
  }

  function setParam3(node, name, x, y, z) {
    if (node[`${name}X`]) {
      node[`${name}X`].value = x;
      node[`${name}Y`].value = y;
      node[`${name}Z`].value = z;
    } else {
      node.setPosition(x, y, z);
    }
  }

  return { ctx, master, sting, noiseSource, panner, updateListener };
}
