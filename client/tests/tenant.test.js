import { describe, expect, it } from 'vitest';
import { WALK_SPEED } from '../../shared/constants.js';
import { cellAt, cellCenter, isSolid, parseMap } from '../../shared/mapParser.js';
import night1 from '../../shared/maps/night1.js';
import { hitsProp } from '../../shared/props.js';
import { hasLineOfSight } from '../../shared/sight.js';
import { ACTS } from '../src/tenant/brain.js';
import { createTenant } from '../src/tenant/tenant.js';
import { createEffects } from '../src/scares/effects.js';

const map = parseMap(night1);

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function fakeModel() {
  const position = { x: 0, y: 0, z: 0, set(x, y, z) { Object.assign(this, { x, y, z }); } };
  const model = { root: { position, rotation: { y: 0 }, visible: false }, pose: null, poses: [] };
  model.setPose = (p) => model.poses.push((model.pose = p));
  model.face = () => {};
  model.lookAt = () => {};
  model.update = () => {};
  return model;
}

function setup(seed = 1) {
  const heard = [];
  const said = [];
  const toasts = [];
  const sound = (kind) => (...args) => heard.push({ kind, args });
  const sounds = {
    step: sound('step'),
    giggle: sound('giggle'),
    whisper: sound('whisper'),
    breathing: (...args) => {
      heard.push({ kind: 'breathing', args });
      return { moveTo() {}, stop() {} };
    },
    knocks: sound('knocks'),
    rattle: sound('rattle'),
    sting: sound('sting'),
  };
  let clock = 0;
  const model = fakeModel();
  const effects = createEffects(rng(seed + 1));
  const tenant = createTenant({
    scene: { add() {} },
    map,
    model,
    sounds,
    effects,
    hud: { subtitle: (t) => said.push(t), toast: (t) => toasts.push(t) },
    now: () => clock,
    name: 'Chelsea',
    partnerNames: () => ['Ana'],
    random: rng(seed),
  });
  return { tenant, model, heard, said, toasts, effects, tick: (t) => (clock = t) };
}

// A restless player: walks around the night, turns round often, sometimes hides
// under a bed for a while, sometimes switches the flashlight off.
function wanderer(seed) {
  const random = rng(seed);
  const spawn = cellCenter(map.spawns[0].x, map.spawns[0].z);
  const beds = map.objects.filter((o) => o.type === 'bed').map((o) => ({ under: cellCenter(o.x, o.z), lookYaw: 0 }));
  const p = { x: spawn.x, z: spawn.z, yaw: 0, hiding: null, light: true, walking: true };
  let heading = 0;
  let hideUntil = 0;
  let stood = null;
  return {
    p,
    step(t, dt) {
      if (p.hiding) {
        // Crawl back out to where we stood.
        if (t > hideUntil) Object.assign(p, { hiding: null, ...stood });
        return false;
      }
      if (random() < 0.002) {
        // Like the real game, the camera moves under the bed.
        p.hiding = beds[Math.floor(random() * beds.length)];
        stood = { x: p.x, z: p.z };
        Object.assign(p, { x: p.hiding.under.x, z: p.hiding.under.z });
        hideUntil = t + 10 + random() * 20;
        return false;
      }
      if (random() < 0.01) p.walking = !p.walking;
      if (random() < 0.003) p.light = !p.light;
      if (random() < 0.02) heading += (random() - 0.5) * 2;
      // Look around: sometimes a quick glance behind.
      p.yaw = heading + (random() < 0.05 ? Math.PI : (random() - 0.5) * 0.6);
      if (!p.walking) return false;
      const nx = p.x - Math.sin(heading) * WALK_SPEED * dt;
      const nz = p.z - Math.cos(heading) * WALK_SPEED * dt;
      const { cx, cz } = cellAt(nx, nz);
      if (isSolid(map, cx, cz)) {
        heading += Math.PI / 2 + random();
        return false;
      }
      const stepped = Math.floor((p.x + p.z) / 0.95) !== Math.floor((nx + nz) / 0.95);
      p.x = nx;
      p.z = nz;
      return stepped;
    },
  };
}

function play(seed, minutes, onFrame = () => {}) {
  const s = setup(seed);
  const w = wanderer(seed + 7);
  const tricks = [];
  const dt = 1 / 30;
  for (let t = 0; t < minutes * 60; t += dt) {
    s.tick(t);
    if (w.step(t, dt)) s.tenant.onStep(false);
    const before = s.tenant.trick;
    s.tenant.update(dt, { time: t, x: w.p.x, z: w.p.z, yaw: w.p.yaw, hiding: w.p.hiding, flashlightOn: w.p.light });
    if (s.tenant.trick && s.tenant.trick !== before) tricks.push({ id: s.tenant.trick, t });
    onFrame(s, w, t);
  }
  return { ...s, tricks };
}

describe('the Tenant in a night', () => {
  it('plays every trick over a long night without breaking', () => {
    const seen = new Set();
    for (let seed = 1; seed <= 8; seed++) for (const { id } of play(seed, 60).tricks) seen.add(id);
    expect([...Object.keys(ACTS)].filter((id) => !seen.has(id))).toEqual([]);
  });

  it('only stands where he could be: on open floor, never inside furniture', () => {
    play(2, 30, (s) => {
      if (!s.model.root.visible || s.model.pose === 'run') return;
      const { x, z } = s.model.root.position;
      const { cx, cz } = cellAt(x, z);
      expect(isSolid(map, cx, cz)).toBe(false);
      if (s.model.pose !== 'head') expect(hitsProp(map.props, x, z, 0.2)).toBe(false);
    });
  });

  it('leaves no trace once a trick is over', () => {
    play(3, 30, (s) => {
      if (!s.tenant.trick) expect(s.model.root.visible).toBe(false);
    });
  });

  it('only shows up where the player could see him, when he first appears', () => {
    let appearances = 0;
    let wasVisible = false;
    play(4, 30, (s, w) => {
      const visible = s.model.root.visible;
      if (visible && !wasVisible && s.model.pose !== 'head' && s.tenant.trick !== 'cross') {
        appearances++;
        const { x, z } = s.model.root.position;
        expect(hasLineOfSight(map, w.p.x, w.p.z, x, z)).toBe(true);
      }
      wasVisible = visible;
    });
    expect(appearances).toBeGreaterThan(3);
  });

  it('uses the player\'s name, and the partner\'s, in his whispers', () => {
    const said = [];
    for (let seed = 1; seed <= 4; seed++) said.push(...play(seed, 60).said);
    expect(said.every((line) => line.startsWith('[whispering] '))).toBe(true);
    expect(said.some((line) => line.includes('Chelsea'))).toBe(true);
    expect(said.some((line) => line.includes('Ana'))).toBe(true);
  });
});

describe('the door trap', () => {
  const door = map.objects.find((o) => o.id === 'door-13-8'); // foyer → hall, runs along x
  const c = cellCenter(door.x, door.z);
  // Player stands on the +z side of the door (door-13-8 runs along x).
  function standing() {
    const s = setup(9);
    let t = 0;
    const frame = (seconds) => {
      for (const end = t + seconds; t < end; t += 0.05) {
        s.tick(t);
        s.tenant.update(0.05, { time: t, x: c.x, z: c.z + 2, yaw: 0, hiding: null, flashlightOn: true });
      }
    };
    frame(0.1);
    return { ...s, frame };
  }
  const kinds = (heard) => heard.map((h) => h.kind);

  it('does nothing when no trap is set', () => {
    const s = standing();
    expect(s.tenant.interceptDoor(door, { open: false, locked: false })).toBe(false);
  });

  it('holds a closed door shut, giggles behind it, then runs off and lets go', () => {
    const s = standing();
    s.tenant.armDoorTrap(45);
    expect(s.tenant.interceptDoor(door, { open: false, locked: false })).toBe(true);
    expect(kinds(s.heard)).toContain('rattle');
    expect(s.toasts).toEqual(['Something is holding it shut.']);
    s.frame(1);
    const laugh = s.heard.find((h) => h.kind === 'giggle');
    expect(laugh.args[1]).toBeLessThan(c.z); // from the other side of the door
    // Trying again while he holds it: he knocks right back.
    expect(s.tenant.interceptDoor(door, { open: false, locked: false })).toBe(true);
    expect(kinds(s.heard)).toContain('knocks');
    s.frame(5);
    expect(kinds(s.heard).filter((k) => k === 'step').length).toBeGreaterThanOrEqual(4);
    expect(s.tenant.interceptDoor(door, { open: false, locked: false })).toBe(false);
  });

  it('knocks back from the other side when you close a door on him', () => {
    const s = standing();
    s.tenant.armDoorTrap(45);
    expect(s.tenant.interceptDoor(door, { open: true, locked: false })).toBe(false);
    s.frame(2);
    const knock = s.heard.find((h) => h.kind === 'knocks');
    expect(knock.args[1]).toBeLessThan(c.z);
  });

  it('never touches the exit or a locked door', () => {
    const s = standing();
    s.tenant.armDoorTrap(45);
    expect(s.tenant.interceptDoor(door, { open: false, locked: true })).toBe(false);
    expect(s.tenant.interceptDoor(door, { open: false, locked: false, exit: true })).toBe(false);
  });

  it('gives up on the trap after a while', () => {
    const s = standing();
    s.tenant.armDoorTrap(5);
    s.frame(6);
    expect(s.tenant.interceptDoor(door, { open: false, locked: false })).toBe(false);
  });
});
