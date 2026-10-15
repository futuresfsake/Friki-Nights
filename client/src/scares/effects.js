// Screen effects scares share. Pure state + math so they can be tested; main.js applies
// the results to the camera and lights each frame.

export function createEffects(random = Math.random) {
  let shakeUntil = 0;
  let shakeStrength = 0;
  let shakeLength = 1;
  let blackoutUntil = 0;
  let flickerUntil = 0;
  let splatterAt = -Infinity;
  let splatterLength = 1;
  let splatters = 0;

  return {
    shake(time, seconds, strength = 0.06) {
      shakeUntil = time + seconds;
      shakeLength = seconds;
      shakeStrength = strength;
    },
    blackout(time, seconds) {
      blackoutUntil = Math.max(blackoutUntil, time + seconds);
    },
    isBlackout: (time) => time < blackoutUntil,
    // Blood splashed over the screen; it hangs there, then fades.
    splatter(time, seconds = 3) {
      splatterAt = time;
      splatterLength = seconds;
      splatters++;
    },
    // 0..1 how much blood is on the screen now; `count` changes with every new splash.
    bloodOnScreen(time) {
      const t = time - splatterAt;
      if (t < 0 || t >= splatterLength) return { amount: 0, count: splatters };
      return { amount: t < splatterLength * 0.5 ? 1 : 1 - (t - splatterLength * 0.5) / (splatterLength * 0.5), count: splatters };
    },
    // The flashlight stutters on and off for a moment.
    flicker(time, seconds) {
      flickerUntil = Math.max(flickerUntil, time + seconds);
    },
    // Multiplies the flashlight: 1 normally, stuttering between dim and full while flickering.
    lightFactor(time) {
      if (time >= flickerUntil) return 1;
      return Math.floor((flickerUntil - time) / 0.07) % 2 === 0 ? 0.05 : 1;
    },
    // Camera offset for this frame; fades out over the shake's length.
    shakeOffset(time) {
      if (time >= shakeUntil) return { x: 0, y: 0, z: 0 };
      const amount = shakeStrength * ((shakeUntil - time) / shakeLength);
      return { x: (random() * 2 - 1) * amount, y: (random() * 2 - 1) * amount, z: (random() * 2 - 1) * amount };
    },
  };
}
