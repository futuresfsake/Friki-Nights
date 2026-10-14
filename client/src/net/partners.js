import { STEP_LENGTH, WALK_SPEED } from '../../../shared/constants.js';
import { createInterpolator } from './interpolate.js';

// Every other player in the room: a figure in the world that glides along their
// smoothed path, with their footsteps placed where they walk.
// makeModel(name) builds the figure (partnerModel.js); onStep(x, z, running) plays a step.
export function createPartners(scene, { makeModel, onStep }) {
  const partners = new Map();

  function remove(id) {
    const p = partners.get(id);
    if (!p) return;
    scene.remove(p.model.root);
    p.model.dispose();
    partners.delete(id);
  }

  return {
    // From night:start: who they are and where they spawn.
    add({ id, name, slot = 0, x, z, yaw = 0 }) {
      if (partners.has(id)) return;
      const model = makeModel(name, slot);
      scene.add(model.root);
      partners.set(id, { model, interp: createInterpolator(), spot: { x, z, yaw, pitch: 0, light: true }, steps: 0 });
    },
    push(state, localNow) {
      partners.get(state.id)?.interp.push(state, localNow);
    },
    // Drops anyone who is no longer in the room.
    keep(ids) {
      for (const id of [...partners.keys()]) if (!ids.includes(id)) remove(id);
    },
    remove,
    // viewer: our own { x, z }, so name tags fade with distance.
    update(localNow, dt, viewer = null) {
      for (const p of partners.values()) {
        const next = p.interp.sample(localNow) ?? p.spot;
        const moved = Math.hypot(next.x - p.spot.x, next.z - p.spot.z);
        const speed = dt > 0 ? moved / dt : 0;
        const step = advanceSteps(p.steps, moved);
        p.steps = step.phase;
        if (step.stepped) onStep(next.x, next.z, speed > WALK_SPEED * 1.3);
        p.spot = next;
        p.model.pose(next, speed, dt, viewer ? Math.hypot(next.x - viewer.x, next.z - viewer.z) : 0);
      }
    },
    get size() {
      return partners.size;
    },
  };
}

// Distance walked since the last footstep; a step sounds every STEP_LENGTH metres,
// the same rhythm as our own. Teleport-sized jumps (a correction) make no sound.
export function advanceSteps(phase, moved) {
  if (moved > STEP_LENGTH * 2) return { phase: 0, stepped: false };
  const next = phase + moved;
  if (next < STEP_LENGTH) return { phase: next, stepped: false };
  return { phase: next - STEP_LENGTH, stepped: true };
}
