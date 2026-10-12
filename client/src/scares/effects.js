// Screen effects scares share. Pure state + math so they can be tested; main.js applies
// the results to the camera and lights each frame.

export function createEffects(random = Math.random) {
  let shakeUntil = 0;
  let shakeStrength = 0;
  let shakeLength = 1;
  let blackoutUntil = 0;

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
    // Camera offset for this frame; fades out over the shake's length.
    shakeOffset(time) {
      if (time >= shakeUntil) return { x: 0, y: 0, z: 0 };
      const amount = shakeStrength * ((shakeUntil - time) / shakeLength);
      return { x: (random() * 2 - 1) * amount, y: (random() * 2 - 1) * amount, z: (random() * 2 - 1) * amount };
    },
  };
}
