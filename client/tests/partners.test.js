import { describe, expect, it } from 'vitest';
import { STEP_LENGTH, WALK_SPEED } from '../../shared/constants.js';
import { advanceSteps, createPartners } from '../src/net/partners.js';
import { tagOpacity } from '../src/world/partnerModel.js';

function fakeScene() {
  const children = new Set();
  return { children, add: (o) => children.add(o), remove: (o) => children.delete(o) };
}

function fakeModel() {
  const model = { root: {}, poses: [], disposed: false };
  model.pose = (spot) => model.poses.push(spot);
  model.dispose = () => (model.disposed = true);
  return model;
}

describe('partners', () => {
  it('stands a teammate on their spawn until their first update', () => {
    const scene = fakeScene();
    const models = [];
    const partners = createPartners(scene, { makeModel: () => models[models.push(fakeModel()) - 1], onStep: () => {} });
    partners.add({ id: 'b', name: 'B', x: 5, z: 7, yaw: 1 });
    partners.update(0, 1 / 60);
    expect(models[0].poses[0]).toMatchObject({ x: 5, z: 7, yaw: 1 });
    expect(scene.children.size).toBe(1);
  });

  it('plays their footsteps where they walk, one per stride', () => {
    const steps = [];
    const partners = createPartners(fakeScene(), { makeModel: fakeModel, onStep: (x, z, running) => steps.push({ x, running }) });
    partners.add({ id: 'b', name: 'B', x: 0, z: 0 });
    // Walking 10 s along x, updates 15×/s, drawn at 60 fps.
    let sent = 0;
    for (let now = 0; now < 10_000; now += 1000 / 60) {
      while (sent <= now) {
        partners.push({ id: 'b', t: sent, x: (WALK_SPEED * sent) / 1000, z: 0, yaw: 0, pitch: 0, light: true }, sent);
        sent += 1000 / 15;
      }
      partners.update(now, 1 / 60);
    }
    const walked = WALK_SPEED * 9.8;
    expect(steps.length).toBeGreaterThanOrEqual(Math.floor(walked / STEP_LENGTH) - 2);
    expect(steps.length).toBeLessThanOrEqual(Math.ceil(walked / STEP_LENGTH) + 1);
    expect(steps.every((s) => !s.running)).toBe(true);
  });

  it('removes a teammate who left the room', () => {
    const scene = fakeScene();
    const made = [];
    const partners = createPartners(scene, { makeModel: () => made[made.push(fakeModel()) - 1], onStep: () => {} });
    partners.add({ id: 'b', name: 'B', x: 0, z: 0 });
    partners.add({ id: 'c', name: 'C', x: 0, z: 0 });
    partners.keep(['me', 'c']);
    expect(partners.size).toBe(1);
    expect(made[0].disposed).toBe(true);
    expect(scene.children.size).toBe(1);
  });

  it('makes no footstep for a correction jump', () => {
    expect(advanceSteps(0.5, STEP_LENGTH * 3)).toEqual({ phase: 0, stepped: false });
    expect(advanceSteps(STEP_LENGTH - 0.1, 0.2).stepped).toBe(true);
  });

  it('builds each teammate in their own seat and fades their name with distance', () => {
    const seats = [];
    const distances = [];
    const model = () => ({ root: {}, pose: (spot, speed, dt, d) => distances.push(d), dispose() {} });
    const partners = createPartners(fakeScene(), { makeModel: (name, slot) => (seats.push(slot), model()), onStep: () => {} });
    partners.add({ id: 'b', name: 'B', slot: 2, x: 3, z: 4 });
    partners.update(0, 1 / 60, { x: 0, z: 0 });
    expect(seats).toEqual([2]);
    expect(distances[0]).toBeCloseTo(5);
    expect(tagOpacity(2)).toBe(1);
    expect(tagOpacity(11)).toBeCloseTo(0.5);
    expect(tagOpacity(30)).toBe(0);
  });
});
